import { useEffect, useState } from "react";
import "./OwnerPage.css";

// ── Types ─────────────────────────────────────────────────────────────────────
interface KeyRecord {
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

type Tab = "keys" | "download" | "analytics" | "danger";

// ── Spoiler ───────────────────────────────────────────────────────────────────
function Spoiler({ value }: { value: string }) {
  const [show, setShow]   = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <span className="spoiler-wrap">
      <span className={`spoiler ${show ? "revealed" : ""}`} onClick={() => setShow(v => !v)}>
        {value}
      </span>
      {show && (
        <button className="spoiler-copy" onClick={copy} title="Copy">
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      )}
    </span>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function Confirm({ msg, onYes, onNo }: { msg: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="modal-overlay" onClick={onNo}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <p style={{ marginBottom: 20, lineHeight: 1.6 }}>{msg}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onYes}>Confirm</button>
          <button className="btn btn-ghost"  style={{ flex: 1 }} onClick={onNo}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Key Modal ────────────────────────────────────────────────────────────
function EditKeyModal({ keyId, rec, onClose, onSave }: {
  keyId: string; rec: KeyRecord;
  onClose: () => void; onSave: (keyId: string, updates: Partial<KeyRecord>) => void;
}) {
  const [duration, setDuration] = useState(rec.duration);
  const [disabled, setDisabled] = useState(rec.disabled);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Edit Key</h2>
        <p className="owner-key-id">{keyId}</p>
        <div className="form-group">
          <label>Duration</label>
          <input value={duration} onChange={e => setDuration(e.target.value)} />
        </div>
        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <label style={{ margin: 0 }}>Disabled</label>
          <input type="checkbox" checked={disabled} onChange={e => setDisabled(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "var(--green)" }} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }}
            onClick={() => { onSave(keyId, { duration, disabled }); onClose(); }}>
            Save
          </button>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Keys Tab ──────────────────────────────────────────────────────────────────
function KeysTab() {
  const [keys, setKeys]         = useState<Record<string, KeyRecord>>({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [editKey, setEditKey]   = useState<string | null>(null);
  const [confirm, setConfirm]   = useState<{ msg: string; action: () => void } | null>(null);
  const [toast, setToast]       = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = () => {
    setLoading(true);
    fetch("/api/owner/keys", { credentials: "include" })
      .then(r => r.json()).then(setKeys).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const deleteKey = (k: string) => setConfirm({
    msg: `Delete key ${k}? This cannot be undone.`,
    action: async () => {
      await fetch(`/api/owner/keys/${k}`, { method: "DELETE", credentials: "include" });
      showToast("Key deleted."); load();
    },
  });

  const resetHwid = async (k: string) => {
    await fetch(`/api/owner/keys/${k}/hwid-reset`, { method: "POST", credentials: "include" });
    showToast("HWID reset."); load();
  };

  const saveKey = async (k: string, updates: Partial<KeyRecord>) => {
    await fetch(`/api/owner/keys/${k}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    showToast("Key updated."); load();
  };

  const toggleDisable = async (k: string, current: boolean) => {
    await saveKey(k, { disabled: !current });
  };

  const filtered = Object.entries(keys).filter(([k, r]) => {
    const rec = r as KeyRecord;
    return k.toLowerCase().includes(search.toLowerCase()) ||
      (rec.username ?? "").toLowerCase().includes(search.toLowerCase());
  }) as [string, KeyRecord][];

  return (
    <div className="owner-tab">
      {toast && <div className="owner-toast">{toast}</div>}
      {confirm && <Confirm msg={confirm.msg} onYes={() => { confirm.action(); setConfirm(null); }} onNo={() => setConfirm(null)} />}
      {editKey && keys[editKey] && (
        <EditKeyModal keyId={editKey} rec={keys[editKey]}
          onClose={() => setEditKey(null)} onSave={saveKey} />
      )}

      <div className="owner-tab-header">
        <h2>Key Management</h2>
        <span className="tag tag-dim">{Object.keys(keys).length} keys</span>
      </div>

      <input className="owner-search" placeholder="Search by key or username…"
        value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? (
        <div className="owner-loading"><div className="dash-spinner" /></div>
      ) : (
        <div className="keys-table-wrap">
          <table className="keys-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Username</th>
                <th>Duration</th>
                <th>Status</th>
                <th>HWID</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="keys-empty">No keys found.</td></tr>
              )}
              {filtered.map(([k, r]) => (
                <tr key={k}>
                  <td><code className="key-code">{k}</code></td>
                  <td>{r.username ?? <span className="text-dim">—</span>}</td>
                  <td>{r.duration}</td>
                  <td>
                    <span className={`tag ${r.disabled ? "tag-red" : "tag-green"}`}>
                      {r.disabled ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td>
                    {r.hwid
                      ? <Spoiler value={r.hwid.slice(0, 12) + "…"} />
                      : <span className="tag tag-dim">Unbound</span>}
                  </td>
                  <td className="text-dim">
                    {r.registered_at ? new Date(r.registered_at).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <div className="key-actions">
                      <button className="btn-action" title="Edit" onClick={() => setEditKey(k)}>Edit</button>
                      <button className="btn-action" title={r.disabled ? "Enable" : "Disable"}
                        onClick={() => toggleDisable(k, r.disabled)}>
                        {r.disabled ? "Enable" : "Disable"}
                      </button>
                      <button className="btn-action" title="Reset HWID" onClick={() => resetHwid(k)}>Reset HWID</button>
                      <button className="btn-action btn-action-danger" title="Delete" onClick={() => deleteKey(k)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Download Tab ──────────────────────────────────────────────────────────────
function DownloadTab() {
  const [url, setUrl]       = useState("");
  const [input, setInput]   = useState("");
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    fetch("/api/owner/download", { credentials: "include" })
      .then(r => r.json()).then(d => { setUrl(d.url); setInput(d.url); });
  }, []);

  const save = async () => {
    await fetch("/api/owner/download", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input }),
    });
    setUrl(input); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="owner-tab">
      <div className="owner-tab-header"><h2>Download Link</h2></div>
      <p className="owner-tab-sub">
        Set the download URL for the Forsaken <code>.rar</code>. Customers see this via <code>/download</code> and the dashboard.
      </p>
      <div className="form-group" style={{ marginTop: 24 }}>
        <label>Current URL</label>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="https://example.com/forsaken.rar" />
      </div>
      {url && <p className="form-success">Active: {url}</p>}
      <button className="btn btn-primary" onClick={save} style={{ marginTop: 8 }}>
        {saved ? "Saved!" : "Update Link"}
      </button>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [keys, setKeys] = useState<Record<string, KeyRecord>>({});
  useEffect(() => {
    fetch("/api/owner/keys", { credentials: "include" }).then(r => r.json()).then(setKeys);
  }, []);

  const total    = Object.keys(keys).length;
  const vals     = Object.values(keys) as KeyRecord[];
  const claimed  = vals.filter(r => r.claimed_by_discord !== null).length;
  const disabled = vals.filter(r => r.disabled).length;
  const hwid     = vals.filter(r => r.hwid !== null).length;

  const stats = [
    { label: "Total Keys",    value: total },
    { label: "Claimed",       value: claimed },
    { label: "Active Users",  value: hwid },
    { label: "Disabled",      value: disabled },
    { label: "Unclaimed",     value: total - claimed },
  ];

  return (
    <div className="owner-tab">
      <div className="owner-tab-header"><h2>Analytics</h2></div>
      <div className="analytics-grid">
        {stats.map(s => (
          <div key={s.label} className="card analytics-card">
            <span className="analytics-value">{s.value}</span>
            <span className="analytics-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Danger Zone Tab ───────────────────────────────────────────────────────────
function DangerTab() {
  const [step, setStep]         = useState(0); // 0=locked, 1=key1, 2=key2, 3=key3, 4=unlocked
  const [inputs, setInputs]     = useState(["", "", ""]);
  const [error, setError]       = useState("");
  const [owners, setOwners]     = useState<{ hardcoded: string[]; extra: number[] }>({ hardcoded: [], extra: [] });
  const [newId, setNewId]       = useState("");
  const [toast, setToast]       = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const verify = async () => {
    setError("");
    const res  = await fetch("/api/owner/danger/verify", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: inputs }),
    });
    const data = await res.json();
    if (data.ok) {
      setStep(4);
      fetch("/api/owner/danger/owners", { credentials: "include" })
        .then(r => r.json()).then(setOwners);
    } else {
      setError("One or more keys are incorrect.");
    }
  };

  const addOwner = async () => {
    if (!newId.trim()) return;
    await fetch("/api/owner/danger/owners", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: newId.trim() }),
    });
    showToast("Owner added."); setNewId("");
    fetch("/api/owner/danger/owners", { credentials: "include" }).then(r => r.json()).then(setOwners);
  };

  const removeOwner = async (id: number) => {
    await fetch(`/api/owner/danger/owners/${id}`, { method: "DELETE", credentials: "include" });
    showToast("Owner removed.");
    fetch("/api/owner/danger/owners", { credentials: "include" }).then(r => r.json()).then(setOwners);
  };

  if (step < 4) return (
    <div className="owner-tab">
      <div className="owner-tab-header">
        <h2>Danger Zone</h2>
        <span className="tag tag-red">Restricted</span>
      </div>
      <p className="owner-tab-sub">
        Enter all 3 authorization keys in order to unlock this section.
      </p>
      <div className="danger-keys-form">
        {[0, 1, 2].map(i => (
          <div key={i} className="form-group">
            <label>Authorization Key {i + 1}</label>
            <input
              type="password"
              value={inputs[i]}
              onChange={e => { const a = [...inputs]; a[i] = e.target.value; setInputs(a); }}
              placeholder={`Key ${i + 1}`}
            />
          </div>
        ))}
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-danger" onClick={verify}>Unlock Danger Zone</button>
      </div>
    </div>
  );

  return (
    <div className="owner-tab">
      {toast && <div className="owner-toast">{toast}</div>}
      <div className="owner-tab-header">
        <h2>Danger Zone</h2>
        <span className="tag tag-red">Unlocked</span>
      </div>

      <div className="danger-section">
        <h3>Owner Management</h3>
        <p className="owner-tab-sub">Hardcoded owners cannot be removed.</p>

        <div className="danger-owners">
          {owners.hardcoded.map(id => (
            <div key={id} className="danger-owner-row">
              <code>{id}</code>
              <span className="tag tag-dim">Hardcoded</span>
            </div>
          ))}
          {owners.extra.map(id => (
            <div key={id} className="danger-owner-row">
              <code>{id}</code>
              <button className="btn btn-danger" style={{ padding: "4px 12px", fontSize: 12 }}
                onClick={() => removeOwner(id)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="danger-add-owner">
          <input value={newId} onChange={e => setNewId(e.target.value)}
            placeholder="Discord User ID" />
          <button className="btn btn-primary" onClick={addOwner}>Add Owner</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Owner Page ───────────────────────────────────────────────────────────
export default function OwnerPage() {
  const [authed, setAuthed]   = useState<boolean | null>(null);
  const [tab, setTab]         = useState<Tab>("keys");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAuthed(d?.type === "owner"))
      .catch(() => setAuthed(false));
  }, []);

  const loginWithDiscord = () => {
    window.location.href = "/api/auth/discord";
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuthed(false);
  };

  // Loading
  if (authed === null) return (
    <div className="dash-loading"><div className="dash-spinner" /></div>
  );

  // Not authed — show Discord login
  if (!authed) return (
    <div className="owner-login-page">
      <div className="owner-login-card card">
        <div className="owner-login-logo">FORSAKEN</div>
        <h2>Owner Panel</h2>
        <p>Sign in with Discord to continue. Only authorized accounts may access this panel.</p>
        <button className="btn btn-primary owner-discord-btn" onClick={loginWithDiscord}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          Continue with Discord
        </button>
      </div>
    </div>
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: "keys",      label: "Key Management" },
    { id: "download",  label: "Download"       },
    { id: "analytics", label: "Analytics"      },
    { id: "danger",    label: "Danger Zone"    },
  ];

  return (
    <div className="owner-page">
      <aside className="owner-sidebar">
        <div className="owner-sidebar-logo">FORSAKEN</div>
        <nav className="owner-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`owner-nav-btn ${tab === t.id ? "active" : ""} ${t.id === "danger" ? "danger" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button className="btn btn-ghost owner-logout" onClick={logout}>Log Out</button>
      </aside>

      <main className="owner-main">
        {tab === "keys"      && <KeysTab />}
        {tab === "download"  && <DownloadTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "danger"    && <DangerTab />}
      </main>
    </div>
  );
}
