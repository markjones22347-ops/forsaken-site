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

function Spoiler({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      className={`spoiler ${revealed ? "revealed" : ""}`}
      onClick={() => setRevealed(v => !v)}
      title={revealed ? "Click to hide" : "Click to reveal"}
    >
      {value}
    </span>
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
    navigate("/");
  };

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
    </div>
  );

  if (!data) return null;

  const rec = data.record;

  return (
    <div className="dash-page">
      <header className="dash-header">
        <span className="dash-logo">FORSAKEN</span>
        <div className="dash-header-right">
          <span className="dash-username">{data.username}</span>
          <button className="btn btn-ghost" onClick={logout}>Log Out</button>
        </div>
      </header>

      <main className="dash-main container">
        <div className="dash-welcome">
          <h1>Welcome back, <span className="green">{data.username}</span></h1>
          <p>Here's everything about your account.</p>
        </div>

        <div className="dash-grid">
          {/* Account Info */}
          <div className="card dash-card">
            <h2 className="dash-card-title">Account</h2>
            <div className="dash-rows">
              <div className="dash-row">
                <span className="dash-label">Username</span>
                <span className="dash-value">{data.username}</span>
              </div>
              <div className="dash-row">
                <span className="dash-label">Password</span>
                <Spoiler value={rec?.password_hash ? "••••••••••••" : "—"} />
              </div>
              <div className="dash-row">
                <span className="dash-label">Status</span>
                <span className={`tag ${rec?.disabled ? "tag-red" : "tag-green"}`}>
                  {rec?.disabled ? "Disabled" : "Active"}
                </span>
              </div>
              <div className="dash-row">
                <span className="dash-label">Registered</span>
                <span className="dash-value">
                  {rec?.registered_at ? new Date(rec.registered_at).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Key Info */}
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
                <span className="dash-value hwid-val">
                  {rec?.hwid ? <Spoiler value={rec.hwid.slice(0, 16) + "…"} /> : <span className="tag tag-dim">Unbound</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Download */}
          <div className="card dash-card dash-download">
            <h2 className="dash-card-title">Download</h2>
            <p className="dash-download-sub">
              Extract the <code>.rar</code> and run <code>Loader.exe</code>.<br />
              Log in with your username and password. HWID binds on first launch.
            </p>
            {data.download_url ? (
              <a
                href={data.download_url}
                className="btn btn-primary"
                style={{ marginTop: 16, width: "100%", justifyContent: "center" }}
                download
              >
                Download Loader.exe
              </a>
            ) : (
              <div className="dash-no-download">Download link not yet available. Check back soon.</div>
            )}
          </div>

          {/* Help */}
          <div className="card dash-card">
            <h2 className="dash-card-title">Need Help?</h2>
            <div className="dash-help-list">
              <div className="dash-help-item">
                <span className="dash-help-icon">⌨</span>
                <div>
                  <strong>Open Menu</strong>
                  <p>Press <kbd>INSERT</kbd> in-game to toggle the Forsaken overlay.</p>
                </div>
              </div>
              <div className="dash-help-item">
                <span className="dash-help-icon">🔒</span>
                <div>
                  <strong>HWID Reset</strong>
                  <p>Changed PC? Open a support ticket in our Discord and an admin will reset it.</p>
                </div>
              </div>
              <div className="dash-help-item">
                <span className="dash-help-icon">💬</span>
                <div>
                  <strong>Support</strong>
                  <p>Use <code>/ticket</code> in our Discord server for any issues.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
