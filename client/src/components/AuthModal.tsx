import { useState, useEffect } from "react";
import "./AuthModal.css";

interface Props { onClose: () => void; onSuccess: () => void; }
type Mode = "login" | "signup";
const STORAGE_KEY = "forsaken_remember";

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [mode,     setMode]     = useState<Mode>("login");
  const [key,      setKey]      = useState("");
  const [username, setUser]     = useState("");
  const [password, setPass]     = useState("");
  const [remember, setRemember] = useState(false);
  const [error,    setError]    = useState("");
  const [info,     setInfo]     = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) { const d = JSON.parse(s); setUser(d.username||""); setPass(d.password||""); setRemember(true); }
    } catch {}
  }, []);

  const reset = () => { setError(""); setInfo(""); };

  const doLogin = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || "Login failed."); return; }
      if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify({ username, password }));
      else localStorage.removeItem(STORAGE_KEY);
      onSuccess();
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  const doSignup = async () => {
    if (!key || !username || !password) { setError("All fields are required."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.toUpperCase(), username, password }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.error || "Registration failed."); return; }
      setInfo("Account created. Signing in…");
      setTimeout(async () => {
        const r2 = await fetch("/api/auth/login", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const d2 = await r2.json();
        if (d2.success) onSuccess(); else { setMode("login"); setInfo(""); }
      }, 600);
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal auth-modal">
        {/* Close */}
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
          </svg>
        </button>

        {/* Header */}
        <div className="auth-header">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none" className="auth-icon">
            <rect x="1" y="1" width="18" height="18" stroke="white" strokeWidth="1"/>
            <line x1="1" y1="10" x2="19" y2="10" stroke="white" strokeWidth="1"/>
            <line x1="10" y1="1" x2="10" y2="19" stroke="white" strokeWidth="1"/>
          </svg>
          <span className="auth-wordmark">FORSAKEN</span>
          <span className="auth-kanji">侵略</span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={mode === "login"  ? "active" : ""} onClick={() => { setMode("login");  reset(); }}>Sign In</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); reset(); }}>Register</button>
        </div>

        {/* Fields */}
        {mode === "signup" && (
          <div className="form-group">
            <label className="form-label">License Key</label>
            <input className="form-input" placeholder="FORSAKEN-XXXX-XXXX-XXXX"
              value={key} onChange={e => setKey(e.target.value)} maxLength={24} autoComplete="off" />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Username</label>
          <input className="form-input" placeholder="username"
            value={username} onChange={e => setUser(e.target.value)} autoComplete="username" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••"
            value={password} onChange={e => setPass(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            onKeyDown={e => e.key === "Enter" && (mode === "login" ? doLogin() : doSignup())} />
        </div>

        {mode === "login" && (
          <label className="auth-remember">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <span>Remember me</span>
          </label>
        )}

        {error && <p className="form-error">{error}</p>}
        {info  && <p className="form-success">{info}</p>}

        <button className="btn btn-primary auth-submit" disabled={loading}
          onClick={mode === "login" ? doLogin : doSignup}>
          {loading ? <span className="auth-spinner" /> : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? "No account? " : "Have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); reset(); }}>
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
