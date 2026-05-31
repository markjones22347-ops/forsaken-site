import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

// Shows actual value blurred — reveals on click, copy button appears after reveal
function Spoiler({ value }: { value: string; label?: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied]     = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <span className="spoiler-wrap">
      <span
        className={`spoiler ${revealed ? "revealed" : ""}`}
        onClick={() => setRevealed(v => !v)}
        title={revealed ? "Click to hide" : "Click to reveal"}
      >
        {value}
      </span>
      {revealed && (
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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="dash-stat-card card">
      <span className="dash-stat-value">{value}</span>
      <span className="dash-stat-label">{label}</span>
      {sub && <span className="dash-stat-sub">{sub}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData]       = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

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
      <header className="dash-header">
        <span className="dash-logo">FORSAKEN</span>
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

          {/* Welcome */}
          <div className="dash-welcome">
            <div className="dash-welcome-text">
              <h1>Welcome back, <span className="green">{data.username}</span></h1>
              <p>Your Forsaken account is {rec?.disabled ? "disabled — contact support" : "active and ready"}.</p>
            </div>
            <span className={`tag ${rec?.disabled ? "tag-red" : "tag-green"}`} style={{ fontSize: 13, padding: "6px 16px" }}>
              {rec?.disabled ? "Disabled" : "Active"}
            </span>
          </div>

          {/* Stats row */}
          <div className="dash-stats">
            <StatCard label="Plan" value={rec?.duration || "—"} />
            <StatCard label="Member Since" value={registeredDate} />
            <StatCard label="HWID" value={rec?.hwid ? "Bound" : "Unbound"} sub={rec?.hwid ? "Locked to your PC" : "Binds on first launch"} />
            <StatCard label="Status" value={rec?.disabled ? "Disabled" : "Active"} />
          </div>

          <div className="dash-grid">

            {/* Account */}
            <div className="card dash-card">
              <h2 className="dash-card-title">Account Details</h2>
              <div className="dash-rows">
                <div className="dash-row">
                  <span className="dash-label">Username</span>
                  <span className="dash-value mono">{data.username}</span>
                </div>
                <div className="dash-row">
                  <span className="dash-label">Password</span>
                  <Spoiler value={rec?.password_hash ? "your-password" : "—"} />
                </div>
                <div className="dash-row">
                  <span className="dash-label">Registered</span>
                  <span className="dash-value">{registeredDate}</span>
                </div>
                <div className="dash-row">
                  <span className="dash-label">Account Status</span>
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
                    : <span className="tag tag-dim">Unbound — binds on first launch</span>}
                </div>
                <div className="dash-row">
                  <span className="dash-label">HWID Reset</span>
                  <span className="dash-value" style={{ color: "var(--text-dim)", fontSize: 12 }}>Open a support ticket in Discord</span>
                </div>
              </div>
            </div>

            {/* Download */}
            <div className="card dash-card dash-download">
              <h2 className="dash-card-title">Download</h2>
              <div className="dash-download-inner">
                <div className="dash-download-info">
                  <p className="dash-download-sub">
                    Download the latest version of Forsaken below.
                    Extract the <code>.rar</code> archive and run <code>Loader.exe</code>.
                    Log in with your username and password — your HWID will bind automatically on first launch.
                  </p>
                  <div className="dash-download-steps">
                    <div className="dash-step"><span>1</span> Download and extract the <code>.rar</code></div>
                    <div className="dash-step"><span>2</span> Run <code>Loader.exe</code> as administrator</div>
                    <div className="dash-step"><span>3</span> Log in with your username and password</div>
                    <div className="dash-step"><span>4</span> Launch Roblox — press <kbd>INSERT</kbd> to open the menu</div>
                  </div>
                </div>
                <div className="dash-download-action">
                  {data.download_url ? (
                    <a href={data.download_url} className="btn btn-primary dash-dl-btn" download>
                      Download Loader.exe
                    </a>
                  ) : (
                    <div className="dash-no-download">Download link not yet available. Check back soon or contact support.</div>
                  )}
                  <p className="dash-dl-note">Always download from this dashboard only.</p>
                </div>
              </div>
            </div>

            {/* Getting Started */}
            <div className="card dash-card">
              <h2 className="dash-card-title">Getting Started</h2>
              <div className="dash-help-list">
                <div className="dash-help-item">
                  <div className="dash-help-num">1</div>
                  <div>
                    <strong>Open the Menu</strong>
                    <p>Press <kbd>INSERT</kbd> while Roblox is in focus to toggle the overlay.</p>
                  </div>
                </div>
                <div className="dash-help-item">
                  <div className="dash-help-num">2</div>
                  <div>
                    <strong>Enable Features</strong>
                    <p>Use the tabs — Aimbot, Silent Aim, Visuals, Rage, Movement, Settings.</p>
                  </div>
                </div>
                <div className="dash-help-item">
                  <div className="dash-help-num">3</div>
                  <div>
                    <strong>Save Configs</strong>
                    <p>Go to Settings → Configs to save and load your personal configuration.</p>
                  </div>
                </div>
                <div className="dash-help-item">
                  <div className="dash-help-num">4</div>
                  <div>
                    <strong>HWID Issues</strong>
                    <p>Changed PC? Open a support ticket in Discord for a free HWID reset.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features overview */}
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
                    <div>
                      <strong>{name}</strong>
                      <span>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
