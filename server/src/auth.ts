import fetch from "node-fetch";
import { Request, Response, NextFunction } from "express";
import { getExtraOwners } from "./db";

export const HARDCODED_OWNERS = ["1510049922253197502", "935238992104935446"];
export const DANGER_KEYS = [
  "iCq2roieAcZUpqGG7meot2s4OrNM97l2",
  "hpNbWmngup6Ec83uZiGvZYNAc6gwn4lW",
  "MAU4TOaZpuvitKmSB8lEIQLNXDnNPnAZ",
];

export async function isOwner(discordId: string): Promise<boolean> {
  if (HARDCODED_OWNERS.includes(discordId)) return true;
  const extra = await getExtraOwners();
  return extra.map(String).includes(discordId);
}

const CLIENT_ID     = process.env.DISCORD_CLIENT_ID     || "";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const SITE_URL      = process.env.SITE_URL || "http://localhost:3001";

export function getOAuthUrl(state: string, path = "/api/auth/callback"): string {
  return `https://discord.com/api/oauth2/authorize?` + new URLSearchParams({
    client_id: CLIENT_ID, redirect_uri: `${SITE_URL}${path}`,
    response_type: "code", scope: "identify", state,
  });
}

export async function exchangeCode(code: string, path = "/api/auth/callback"): Promise<string | null> {
  const res  = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      grant_type: "authorization_code", code, redirect_uri: `${SITE_URL}${path}` }),
  });
  const d = await res.json() as any;
  return d.access_token ?? null;
}

export async function getDiscordUser(token: string) {
  const res = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const d = await res.json() as any;
  return { id: d.id as string, username: d.username as string, avatar: d.avatar as string | null };
}

export function requireSession(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any)?.user) return void res.status(401).json({ error: "Not authenticated" });
  next();
}

export async function requireOwner(req: Request, res: Response, next: NextFunction) {
  const sess = (req.session as any);
  if (!sess?.user) return void res.status(401).json({ error: "Not authenticated" });
  if (!(await isOwner(sess.user.id))) return void res.status(403).json({ error: "Forbidden" });
  next();
}
