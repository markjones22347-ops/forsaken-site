import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./DashboardPage.css";

interface DashData {
  username: string; key: string; download_url: string;
  record: { duration: string; disabled: boolean; registered_at: string | null; hwid: string | null; password_hash: string | null; } | null;
}

function Spoiler({ value }: { value: string }) {
  const [show, setShow]     = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  return (
    <span className="spoiler-wrap">
      <span className={`spoiler ${show ? "revealed" : ""}`} onClick={() => setShow(v => !v)}
        title={show ? "Hide" : "Reveal"}>{value}</span>
      {show && (
        <button className="spoiler-copy" onClick={copy} title={copied ? "Copied" : "Copy"}>
          {copied
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
        </button>
      )}
    </span>
  );
}

function HwidModal({ username, onClose }: { username: string; onClose: () => void }) {
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const send = async () => {
    if (!reason.trim()) { setError("Please provide a reason."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/hwid-reset-request", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (r.ok) setSent(true);
      else setError("Failed to send. Please try again or contact support in Discord.");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {sent ? (
          <div className="hwid-sent">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
              <polyline points="9 12 11 14 15 10" strokeOpacity="0.9"/>
            </svg>
            <p className="modal-title">Request Sent</p>
            <p className="modal-sub">Our team will review your request and reset your HWID shortly.</p>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <p className="modal-title">Request HWID Reset</p>
            <p className="modal-sub">Describe why you need a reset (e.g. new PC, hardware change). This goes directly to our staff.</p>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="form-textarea" placeholder="e.g. I got a new PC and my HWID is still bound to my old one…"
                value={reason} onChange={e => setReason(e.target.value)} rows={4} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={loading} onClick={send}>
                {loading ? "Sending…" : "Send Request"}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData]           = useState<DashData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showHwid, setShowHwid]   = useState(false);
  const navigate                  = useNavigate();

  useEffect(() => {
    fetch("/api/dashboard", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData).catch(() => navigate("/")).finally(() => setLoading(false));
  }, [navigate]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    localStorage.removeItem("forsaken_remember");
    navigate("/");
  };

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
    </div>
  );
  if (!data) return null;

  const rec  = data.record;
  const date = rec?.registered_at
    ? new Date(rec.registered_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";

  return (
    <div className="dash-page">
      {showHwid && <HwidModal username={data.username} onClose={() => setShowHwid(false)} />}

      {/* Header */}
      <header className="dash-header">
        <Link to="/" className="dash-logo">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" stroke="white" strokeWidth="1"/>
            <line x1="1" y1="10" x2="19" y2="10" stroke="white" strokeWidth="1"/>
            <line x1="10" y1="1" x2="10" y2="19" stroke="white" strokeWidth="1"/>
          </svg>
          FORSAKEN
        </Link>
        <nav className="dash-nav">
          <Link to="/" className="dash-nav-link">Home</Link>
          <Link to="/#features" className="dash-nav-link">Features</Link>
          <Link to="/#purchase" className="dash-nav-link">Purchase</Link>
        </nav>
        <div className="dash-header-right">
          <div className="dash-avatar">{data.username[0].toUpperCase()}</div>
          <span className="dash-uname">{data.username}</span>
          <button className="btn btn-outline btn-sm" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="container">

          {/* Page title */}
          <div className="dash-page-title">
            <div>
              <h1>Dashboard</h1>
              <p>Manage your Forsaken account</p>
            </div>
            <span className="dash-title-kanji">管理</span>
          </div>

          {/* Status bar */}
          <div className="dash-status-bar">
            <div className="dash-status-item">
              <span className="dash-status-label">Plan</span>
              <span className="dash-status-value">{rec?.duration || "—"}</span>
            </div>
            <div className="dash-status-sep" />
            <div className="dash-status-item">
              <span className="dash-status-label">Member Since</span>
              <span className="dash-status-value">{date}</span>
            </div>
            <div className="dash-status-sep" />
            <div className="dash-status-item">
              <span className="dash-status-label">HWID</span>
              <span className="dash-status-value">{rec?.hwid ? "Bound" : "Unbound"}</span>
            </div>
            <div className="dash-status-sep" />
            <div className="dash-status-item">
              <span className="dash-status-label">Status</span>
              <span className={`tag ${rec?.disabled ? "tag-red" : "tag-white"}`}>
                {rec?.disabled ? "Disabled" : "Active"}
              </span>
            </div>
          </div>

          {/* Grid */}
          <div className="dash-grid">

            {/* Account */}
            <div className="dash-section">
              <h2 className="dash-section-title">
                <span>Account</span>
                <span className="dash-section-jp">アカウント</span>
              </h2>
              <div className="dash-table">
                <div className="dash-row"><span>Username</span><span className="mono">{data.username}</span></div>
                <div className="dash-row"><span>Password</span><Spoiler value="your-password" /></div>
                <div className="dash-row"><span>Registered</span><span>{date}</span></div>
                <div className="dash-row"><span>Status</span>
                  <span className={`tag ${rec?.disabled ? "tag-red" : "tag-white"}`}>
                    {rec?.disabled ? "Disabled" : "Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* License */}
            <div className="dash-section">
              <h2 className="dash-section-title">
                <span>License</span>
                <span className="dash-section-jp">ライセンス</span>
              </h2>
              <div className="dash-table">
                <div className="dash-row"><span>Key</span><Spoiler value={data.key || "—"} /></div>
                <div className="dash-row"><span>Duration</span><span>{rec?.duration || "—"}</span></div>
                <div className="dash-row">
                  <span>HWID</span>
                  {rec?.hwid ? <Spoiler value={rec.hwid} /> : <span className="tag tag-dim">Unbound</span>}
                </div>
                <div className="dash-row">
                  <span>HWID Reset</span>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowHwid(true)}>Request</button>
                </div>
              </div>
            </div>

            {/* Download */}
            <div className="dash-section dash-section-wide">
              <h2 className="dash-section-title">
                <span>Download</span>
                <span className="dash-section-jp">ダウンロード</span>
              </h2>
              <div className="dash-download">
                <div className="dash-steps">
                  {[
                    ["01", "Download the .rar file"],
                    ["02", "Extract and run Loader.exe as administrator"],
                    ["03", "Log in with your username and password"],
                    ["04", "Launch Roblox — press INSERT to open the menu"],
                  ].map(([n, t]) => (
                    <div key={n} className="dash-step">
                      <span className="dash-step-num">{n}</span>
                      <span className="dash-step-text">{t}</span>
                    </div>
                  ))}
                </div>
                <div className="dash-dl-action">
                  {data.download_url
                    ? <a href={data.download_url} className="btn btn-primary" download>Download Loader.exe</a>
                    : <div className="dash-dl-unavail">Download link not yet available.</div>}
                  <p className="dash-dl-note">Only download from this dashboard or the Discord bot.</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="dash-section">
              <h2 className="dash-section-title">
                <span>Features</span>
                <span className="dash-section-jp">機能</span>
              </h2>
              <div className="dash-features">
                {[["Aimbot","FOV, smoothing, prediction"],["Silent Aim","Mouse spoof, FOV, snap lines"],
                  ["ESP","Boxes, names, health, chams"],["Rage","Hitbox expander, rapidfire"],
                  ["Movement","Speedhack, flyhack, orbit"],["Explorer","Instance tree browser"],
                  ["Lighting","Fog, exposure, skybox"],["Configs","Save & load unlimited configs"],
                ].map(([n, d]) => (
                  <div key={n} className="dash-feature">
                    <span className="dash-feature-name">{n}</span>
                    <span className="dash-feature-desc">{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Help */}
            <div className="dash-section">
              <h2 className="dash-section-title">
                <span>Help</span>
                <span className="dash-section-jp">ヘルプ</span>
              </h2>
              <div className="dash-help">
                {[
                  ["Open Menu",    "Press INSERT while Roblox is focused."],
                  ["Save Configs", "Settings → Configs to save your setup."],
                  ["HWID Reset",   "Use the Request button in License above."],
                  ["Support",      "Open a ticket in our Discord server."],
                ].map(([t, d]) => (
                  <div key={String(t)} className="dash-help-item">
                    <span className="dash-help-title">{t}</span>
                    <span className="dash-help-desc">{d}</span>
                  </div>
                ))}
              </div>
              <div className="dash-links">
                <Link to="/" className="dash-link">← Back to Home</Link>
                <Link to="/#purchase" className="dash-link">Upgrade Plan →</Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
