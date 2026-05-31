import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./DashboardPage.css";

interface DashData {
  username:     string;
  key:          string;
  download_url: string;
  record: {
    duration:       string;
    disabled:       boolean;
    registered_at:  string | null;
    hwid:           string | null;
    password_hash:  string | null;
  } | null;
}

// ── Spoiler ───────────────────────────────────────────────────────────────────
function Spoiler({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  return (
    <span className="spoiler-wrap">
      <span className={`spoiler ${revealed ? "revealed" : ""}`} onClick={() => setRevealed(v => !v)}
        title={revealed ? "Click to hide" : "Click to reveal"}>{value}</span>
      {revealed && (
        <button className="spoiler-copy" onClick={copy} title={copied ? "Copied!" : "Copy"}>
          {copied
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
        </button>
      )}
    </span>
  );
}

// ── HWID Reset Modal ──────────────────────────────────────────────────────────
function HwidResetModal({ username, onClose }: { username: string; onClose: () => void }) {
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const send = async () => {
    if (!reason.trim()) { setError("Please provide a reason."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/hwid-reset-request", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) setSent(true);
      else setError("Failed to send request. Try again.");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Request HWID Reset</h2>
        {sent ? (
          <div className="hwid-sent">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
            </svg>
            <p>Your request has been sent to our team. We'll review it shortly.</p>
            <button className="btn btn-ghost" style={{ marginTop: 16, width: "100%" }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <p className="hwid-modal-sub">
              Tell us why you need your HWID reset (e.g. new PC, hardware change).
              This will be sent to our staff for review.
            </p>
            <div className="form-group" style={{ marginTop: 20 }}>
              <label>Reason</label>
              <textarea
                className="hwid-textarea"
                placeholder="e.g. I got a new PC and my old HWID is still bound…"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data,          setData]          = useState<DashData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [showHwidModal, setShowHwidModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/dashboard", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    localStorage.removeItem("forsaken_remember");
    navigate("/");
  };

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
      <p className="dash-loading-text">Loading your dashboard…</p>
    </div>
  );
  if (!data) return null;

  const rec = data.record;
  const registeredDate = rec?.registered_at
    ? new Date(rec.registered_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="dash-page">
      {showHwidModal && <HwidResetModal username={data.username} onClose={() => setShowHwidModal(false)} />}

      {/* Header */}
      <header className="dash-header">
        <Link to="/" className="dash-logo">FORSAKEN</Link>
        <nav className="dash-nav">
          <Link to="/" className="dash-nav-link">Home</Link>
          <Link to="/#features" className="dash-nav-link">Features</Link>
          <Link to="/#purchase" className="dash-nav-link">Purchase</Link>
        </nav>
        <div className="dash-header-right">
          <div className="dash-user-pill">
            <div className="dash-user-avatar">{data.username[0].toUpperCase()}</div>
            <span className="dash-username">{data.username}</span>
          </div>
          <button className="btn btn-ghost" onClick={logout}>Log Out</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="container">

          {/* Welcome banner */}
          <div className="dash-welcome">
            <div>
              <h1>Welcome back, <span className="green">{data.username}</span></h1>
              <p>Your Forsaken account is {rec?.disabled ? "disabled — contact support" : "active and ready to use"}.</p>
            </div>
            <span className={`tag ${rec?.disabled ? "tag-red" : "tag-green"}`} style={{ fontSize: 13, padding: "6px 18px" }}>
              {rec?.disabled ? "Disabled" : "Active"}
            </span>
          </div>

          {/* Stats */}
          <div className="dash-stats">
            {[
              { label: "Plan",         value: rec?.duration || "—" },
              { label: "Member Since", value: registeredDate },
              { label: "HWID Status",  value: rec?.hwid ? "Bound" : "Unbound",  sub: rec?.hwid ? "Locked to your PC" : "Binds on first launch" },
              { label: "Status",       value: rec?.disabled ? "Disabled" : "Active" },
            ].map(s => (
              <div key={s.label} className="dash-stat-card card">
                <span className="dash-stat-value">{s.value}</span>
                <span className="dash-stat-label">{s.label}</span>
                {s.sub && <span className="dash-stat-sub">{s.sub}</span>}
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="dash-cols">

            {/* LEFT column */}
            <div className="dash-col">

              {/* Account */}
              <div className="card dash-card">
                <h2 className="dash-card-title">Account</h2>
                <div className="dash-rows">
                  <div className="dash-row">
                    <span className="dash-label">Username</span>
                    <span className="dash-value mono">{data.username}</span>
                  </div>
                  <div className="dash-row">
                    <span className="dash-label">Password</span>
                    <Spoiler value="your-password-here" />
                  </div>
                  <div className="dash-row">
                    <span className="dash-label">Registered</span>
                    <span className="dash-value">{registeredDate}</span>
                  </div>
                  <div className="dash-row">
                    <span className="dash-label">Status</span>
                    <span className={`tag ${rec?.disabled ? "tag-red" : "tag-green"}`}>
                      {rec?.disabled ? "Disabled" : "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* License */}
              <div className="card dash-card">
                <h2 className="dash-card-title">License</h2>
                <div className="dash-rows">
                  <div className="dash-row">
                    <span className="dash-label">Key</span>
                    <Spoiler value={data.key || "—"} />
                  </div>
                  <div className="dash-row">
                    <span className="dash-label">Duration</span>
                    <span className="dash-value">{rec?.duration || "—"}</span>
                  </div>
                  <div className="dash-row">
                    <span className="dash-label">HWID</span>
                    {rec?.hwid
                      ? <Spoiler value={rec.hwid} />
                      : <span className="tag tag-dim">Unbound</span>}
                  </div>
                  <div className="dash-row">
                    <span className="dash-label">HWID Reset</span>
                    <button className="btn btn-ghost dash-hwid-btn" onClick={() => setShowHwidModal(true)}>
                      Request Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="card dash-card">
                <h2 className="dash-card-title">Your Features</h2>
                <div className="dash-features-list">
                  {[
                    ["Aimbot",        "FOV, smoothing, prediction, sticky aim"],
                    ["Silent Aim",    "Mouse spoof, FOV, snap lines"],
                    ["ESP / Visuals", "Boxes, names, health, chams, distance"],
                    ["Rage",          "Hitbox expander, rapidfire, hitsounds"],
                    ["Movement",      "Speedhack, flyhack, tickrate, orbit"],
                    ["Explorer",      "Full instance tree browser"],
                    ["Lighting",      "Fog, exposure, skybox, clock time"],
                    ["Config System", "Save and load unlimited configs"],
                  ].map(([name, desc]) => (
                    <div key={name} className="dash-feature-row">
                      <div className="dash-feature-dot" />
                      <div><strong>{name}</strong><span>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT column */}
            <div className="dash-col">

              {/* Download */}
              <div className="card dash-card">
                <h2 className="dash-card-title">Download</h2>
                <div className="dash-download-steps">
                  {[
                    ["1", "Download the .rar file below"],
                    ["2", <>Extract and run <code>Loader.exe</code> as administrator</>],
                    ["3", "Log in with your username and password"],
                    ["4", <>Launch Roblox, then press <kbd>INSERT</kbd> to open the menu</>],
                  ].map(([n, text]) => (
                    <div key={String(n)} className="dash-step">
                      <span>{n}</span>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>
                <div className="dash-download-action">
                  {data.download_url ? (
                    <a href={data.download_url} className="btn btn-primary dash-dl-btn" download>
                      Download Loader.exe
                    </a>
                  ) : (
                    <div className="dash-no-download">Download link not yet available. Check back soon.</div>
                  )}
                  <p className="dash-dl-note">Only download from this dashboard or the Discord bot.</p>
                </div>
              </div>

              {/* Getting Started */}
              <div className="card dash-card">
                <h2 className="dash-card-title">Getting Started</h2>
                <div className="dash-help-list">
                  {[
                    ["Open the Menu",    <>Press <kbd>INSERT</kbd> while Roblox is in focus to toggle the overlay.</>],
                    ["Enable Features",  "Use the tabs — Aimbot, Silent Aim, Visuals, Rage, Movement, Settings."],
                    ["Save Configs",     "Go to Settings → Configs to save and load your personal configuration."],
                    ["HWID Issues",      "Changed PC? Use the Request Reset button above to notify our team."],
                    ["Support",          "Open a ticket in our Discord server for any other issues."],
                  ].map(([title, desc]) => (
                    <div key={String(title)} className="dash-help-item">
                      <div className="dash-help-dot" />
                      <div><strong>{title}</strong><p>{desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="card dash-card">
                <h2 className="dash-card-title">Quick Links</h2>
                <div className="dash-links">
                  <Link to="/" className="dash-link-item">
                    <span>Home</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                  <Link to="/#features" className="dash-link-item">
                    <span>Features</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                  <Link to="/#purchase" className="dash-link-item">
                    <span>Purchase / Upgrade</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                  <a href="https://discord.gg/" target="_blank" rel="noreferrer" className="dash-link-item">
                    <span>Discord Server</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
