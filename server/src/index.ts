import express from "express";
import cors from "cors";
import session from "express-session";
import rateLimit from "express-rate-limit";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import {
  loadDB, getAllKeys, getKey, updateKey, deleteKey, resetHwid,
  registerKey, authenticate, getDownloadUrl, setDownloadUrl,
  addOwner, removeOwner, getExtraOwners,
} from "./db";
import {
  getOAuthUrl, exchangeCode, getDiscordUser,
  isOwner, requireSession, requireOwner, DANGER_KEYS, HARDCODED_OWNERS,
} from "./auth";

const app  = express();
const PORT = process.env.PORT || 3001;
const SITE_URL = process.env.SITE_URL || "http://localhost:5173";

app.set("trust proxy", 1);
app.use(express.json());
app.use(cors({ origin: SITE_URL, credentials: true }));
app.use(session({
  secret:            process.env.SESSION_SECRET || "forsaken-secret-change-me",
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: process.env.NODE_ENV === "production", httpOnly: true, maxAge: 86400000 },
}));

const limiter = rateLimit({ windowMs: 60_000, max: 60 });
app.use("/api", limiter);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Auth — loader /auth endpoint ──────────────────────────────────────────────
app.post("/api/auth/login-loader", async (req, res) => {
  const { username, password, hwid } = req.body ?? {};
  if (!username || !password || !hwid)
    return void res.status(400).json({ success: false, message: "username, password, hwid required." });
  const result = await authenticate(username, password, hwid);
  res.status(result.success ? 200 : 401).json(result);
});

// ── Auth — site login (no HWID) ───────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password)
    return void res.status(400).json({ success: false, message: "username and password required." });
  const result = await authenticate(username, password);
  if (!result.success) return void res.status(401).json(result);
  const db  = await loadDB();
  const rec = result.key ? db.keys[result.key] : null;
  (req.session as any).user = { type: "customer", username, key: result.key, record: rec };
  res.json({ success: true, username, key: result.key, record: rec });
});

// ── Auth — site register ──────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  const { key, username, password } = req.body ?? {};
  if (!key || !username || !password)
    return void res.status(400).json({ success: false, error: "key, username, password required." });
  const result = await registerKey(key.toUpperCase(), username, password, null);
  res.status(result.success ? 200 : 400).json(result);
});

// ── Auth — logout ─────────────────────────────────────────────────────────────
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ── Auth — session info ───────────────────────────────────────────────────────
app.get("/api/auth/me", (req, res) => {
  const sess = (req.session as any);
  if (!sess?.user) return void res.status(401).json({ error: "Not authenticated" });
  res.json(sess.user);
});

// ── Discord OAuth — owner panel ───────────────────────────────────────────────
app.get("/api/auth/discord", (req, res) => {
  const state = Math.random().toString(36).slice(2);
  (req.session as any).oauthState = state;
  res.redirect(getOAuthUrl(state, "/api/auth/callback"));
});

app.get("/api/auth/callback", async (req, res) => {
  const { code, state } = req.query as Record<string, string>;
  if (state !== (req.session as any).oauthState)
    return void res.redirect(`${SITE_URL}/?error=state_mismatch`);
  const token = await exchangeCode(code, "/api/auth/callback");
  if (!token) return void res.redirect(`${SITE_URL}/?error=oauth_failed`);
  const user  = await getDiscordUser(token);
  if (!user)  return void res.redirect(`${SITE_URL}/?error=user_failed`);
  const owner = await isOwner(user.id);
  if (!owner) return void res.redirect(`${SITE_URL}/?error=not_owner`);
  (req.session as any).user = { type: "owner", ...user };
  res.redirect(`${SITE_URL}/gx322`);
});

// ── Customer dashboard ────────────────────────────────────────────────────────
app.get("/api/dashboard", requireSession, async (req, res) => {
  const sess = (req.session as any);
  if (sess.user.type !== "customer") return void res.status(403).json({ error: "Forbidden" });
  const db  = await loadDB();
  const rec = sess.user.key ? db.keys[sess.user.key] : null;
  const url = await getDownloadUrl();
  res.json({ username: sess.user.username, key: sess.user.key, record: rec, download_url: url });
});

// ── HWID reset request (customer → bot logs channel via Discord webhook) ──────
app.post("/api/hwid-reset-request", requireSession, async (req, res) => {
  const sess = (req.session as any);
  if (sess.user.type !== "customer") return void res.status(403).json({ error: "Forbidden" });
  const { reason } = req.body as { reason: string };
  if (!reason?.trim()) return void res.status(400).json({ error: "Reason required." });

  const LOGS_CHANNEL_ID = "1510458844524974233";
  const BOT_TOKEN       = process.env.DISCORD_BOT_TOKEN || "";

  if (!BOT_TOKEN) {
    // Fallback: log to console so admins can see it even without token configured
    console.log(`[HWID Request] User: ${sess.user.username} | Key: ${sess.user.key} | Reason: ${reason.trim()}`);
    return void res.json({ ok: true });
  }

  const message = {
    content: `<@&1510455747711074514> <@&1510455933371940867>`,
    embeds: [{
      title: "HWID Reset Request",
      color: 0xffffff,
      fields: [
        { name: "Username", value: `\`${sess.user.username}\``, inline: true },
        { name: "Key",      value: `\`${sess.user.key || "—"}\``, inline: true },
        { name: "Reason",   value: reason.trim(), inline: false },
      ],
      footer: { text: "Forsaken — HWID Reset Request via Dashboard" },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    const r = await fetch(`https://discord.com/api/v10/channels/${LOGS_CHANNEL_ID}/messages`, {
      method:  "POST",
      headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
      body:    JSON.stringify(message),
    });
    if (!r.ok) {
      const err = await r.text();
      console.error("[HWID Request] Discord API error:", r.status, err);
      // Still return ok — request was received, just couldn't notify Discord
      return void res.json({ ok: true });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("[HWID Request] fetch error:", e);
    // Still return ok so user isn't blocked
    res.json({ ok: true });
  }
});

// ── Owner — key management ────────────────────────────────────────────────────
app.get("/api/owner/keys",           requireOwner, async (_req, res) => res.json(await getAllKeys()));
app.delete("/api/owner/keys/:key",   requireOwner, async (req, res) => res.json({ ok: await deleteKey(req.params.key) }));
app.post("/api/owner/keys/:key/hwid-reset", requireOwner, async (req, res) => res.json({ ok: await resetHwid(req.params.key) }));
app.patch("/api/owner/keys/:key",    requireOwner, async (req, res) => res.json({ ok: await updateKey(req.params.key, req.body) }));

// ── Owner — download URL ──────────────────────────────────────────────────────
app.get("/api/owner/download",  requireOwner, async (_req, res) => res.json({ url: await getDownloadUrl() }));
app.post("/api/owner/download", requireOwner, async (req, res) => {
  const { url } = req.body ?? {};
  if (!url) return void res.status(400).json({ error: "url required" });
  await setDownloadUrl(url); res.json({ ok: true });
});

// ── Owner — danger zone ───────────────────────────────────────────────────────
app.post("/api/owner/danger/verify", requireOwner, (req, res) => {
  const { keys } = req.body as { keys: string[] };
  if (!Array.isArray(keys) || keys.length !== 3)
    return void res.status(400).json({ ok: false });
  const ok = keys.every((k, i) => k === DANGER_KEYS[i]);
  if (ok) (req.session as any).dangerVerified = true;
  res.json({ ok });
});

app.get("/api/owner/danger/owners", requireOwner, async (req, res) => {
  if (!(req.session as any).dangerVerified) return void res.status(403).json({ error: "Danger zone not unlocked" });
  const extra = await getExtraOwners();
  res.json({ hardcoded: HARDCODED_OWNERS, extra });
});

app.post("/api/owner/danger/owners", requireOwner, async (req, res) => {
  if (!(req.session as any).dangerVerified) return void res.status(403).json({ error: "Danger zone not unlocked" });
  const { id } = req.body as { id: string };
  if (!id) return void res.status(400).json({ error: "id required" });
  await addOwner(Number(id)); res.json({ ok: true });
});

app.delete("/api/owner/danger/owners/:id", requireOwner, async (req, res) => {
  if (!(req.session as any).dangerVerified) return void res.status(403).json({ error: "Danger zone not unlocked" });
  await removeOwner(Number(req.params.id)); res.json({ ok: true });
});

// ── Serve React in production ─────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.listen(PORT, () => console.log(`[Forsaken] Server running on port ${PORT}`));
