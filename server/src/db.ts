import fetch from "node-fetch";
import * as crypto from "crypto";

const GIST_ID       = process.env.GIST_ID      || "";
const GITHUB_TOKEN  = process.env.GITHUB_TOKEN || "";
const GIST_FILENAME = "forsaken_db.json";

const HEADERS: Record<string, string> = {
  Authorization:  `token ${GITHUB_TOKEN}`,
  Accept:         "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent":   "ForsakenSite/1.0",
};

export interface KeyRecord {
  duration:            string;
  generated_by:        number | null;
  generated_at:        string;
  disabled:            boolean;
  claimed_by_discord:  number | null;
  username:            string | null;
  password_hash:       string | null;
  hwid:                string | null;
  registered_at:       string | null;
}

export interface DB {
  keys:         Record<string, KeyRecord>;
  download_url: string;
  owners:       number[];
}

export function hashPassword(p: string): string {
  return crypto.createHash("sha256").update(p, "utf8").digest("hex");
}
export function verifyPassword(p: string, h: string): boolean {
  return hashPassword(p) === h;
}
function now(): string { return new Date().toISOString(); }

export async function loadDB(): Promise<DB> {
  if (!GIST_ID || !GITHUB_TOKEN) return { keys: {}, download_url: "", owners: [] };
  try {
    const res  = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers: HEADERS });
    const gist = await res.json() as any;
    const raw  = gist?.files?.[GIST_FILENAME]?.content ?? "{}";
    const p    = JSON.parse(raw) as Partial<DB>;
    return { keys: p.keys ?? {}, download_url: p.download_url ?? "", owners: p.owners ?? [] };
  } catch { return { keys: {}, download_url: "", owners: [] }; }
}

export async function saveDB(data: DB): Promise<void> {
  if (!GIST_ID || !GITHUB_TOKEN) return;
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH", headers: HEADERS,
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } } }),
  });
}

export async function getKey(key: string)  { return (await loadDB()).keys[key] ?? null; }
export async function getAllKeys()          { return (await loadDB()).keys; }
export async function getDownloadUrl()     { return (await loadDB()).download_url ?? ""; }
export async function setDownloadUrl(url: string) {
  const db = await loadDB(); db.download_url = url; await saveDB(db);
}
export async function getExtraOwners()     { return (await loadDB()).owners ?? []; }
export async function addOwner(id: number) {
  const db = await loadDB();
  if (!db.owners.includes(id)) { db.owners.push(id); await saveDB(db); }
}
export async function removeOwner(id: number) {
  const db = await loadDB(); db.owners = db.owners.filter(o => o !== id); await saveDB(db);
}

export async function updateKey(key: string, updates: Partial<KeyRecord>): Promise<boolean> {
  const db = await loadDB();
  if (!db.keys[key]) return false;
  db.keys[key] = { ...db.keys[key], ...updates };
  await saveDB(db); return true;
}

export async function deleteKey(key: string): Promise<boolean> {
  const db = await loadDB();
  if (!db.keys[key]) return false;
  delete db.keys[key]; await saveDB(db); return true;
}

export async function resetHwid(key: string): Promise<boolean> {
  return updateKey(key, { hwid: null });
}

export async function registerKey(key: string, username: string, password: string, discordId: number | null) {
  const db = await loadDB();
  if (!db.keys[key])                             return { success: false, error: "Key not found." };
  if (db.keys[key].disabled)                     return { success: false, error: "This key has been disabled." };
  if (db.keys[key].claimed_by_discord !== null)  return { success: false, error: "This key has already been claimed." };
  for (const rec of Object.values(db.keys))
    if (rec.username?.toLowerCase() === username.toLowerCase())
      return { success: false, error: "That username is already taken." };
  db.keys[key] = { ...db.keys[key], claimed_by_discord: discordId, username, password_hash: hashPassword(password), registered_at: now() };
  await saveDB(db); return { success: true, error: undefined };
}

export async function authenticate(username: string, password: string, hwid?: string) {
  const db = await loadDB();
  for (const [key, rec] of Object.entries(db.keys)) {
    if (rec.username?.toLowerCase() !== username.toLowerCase()) continue;
    if (rec.disabled)                                    return { success: false, message: "Your key has been disabled." };
    if (!verifyPassword(password, rec.password_hash!))   return { success: false, message: "Invalid password." };
    if (hwid) {
      if (!rec.hwid) { await updateKey(key, { hwid }); return { success: true, message: "OK", key }; }
      if (rec.hwid !== hwid)                             return { success: false, message: "HWID mismatch. Contact support." };
    }
    return { success: true, message: "OK", key };
  }
  return { success: false, message: "Username not found." };
}

export async function createKey(key: string, duration: string, generatedBy: number): Promise<KeyRecord> {
  const db = await loadDB();
  const record: KeyRecord = {
    duration,
    generated_by:       generatedBy,
    generated_at:       now(),
    disabled:           false,
    claimed_by_discord: null,
    username:           null,
    password_hash:      null,
    hwid:               null,
    registered_at:      null,
  };
  db.keys[key] = record;
  await saveDB(db);
  return record;
}
