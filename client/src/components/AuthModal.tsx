import { useState, useEffect } from "react";
import "./AuthModal.css";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "login" | "signup";

const STORAGE_KEY = "forsaken_remember";

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode]         = useState<Mode>("login");
  const [key, setKey]           = useState("");
  const [username, setUser]     = useState("");
  const [password, setPass]     = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  // Load remembered credentials on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { username: u, password: p } = JSON.parse(saved);
        setUser(u || ""); setPass(p || ""); setRemember(true);
      }
    } catch {}
  }, []);

  const reset = () => { setError(""); setSuccess(""); };

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Login failed."); return; }
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      onSuccess();
    } catch { setError("Network error. Check your connection."); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (!key || !username || !password) { setError("All fields are required."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.toUpperCase(), username, password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Registration failed."); return; }
      setSuccess("Account created! Logging you in…");
      // Auto-login after signup
      setTimeout(async () => {
        const r2   = await fetch("/api/auth/login", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const d2 = await r2.json();
        if (d2.success) onSuccess();
        else { setMode("login"); setKey(""); setSuccess(""); }
      }, 800);
    } catch { setError("Network error. Check your connection."); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal auth-modal">

        {/* Close button */}
        <button className="auth-close" onClick={onClose}>✕</button>

        {/* Logo */}
        <div className="auth-logo">FORSAKEN</div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={mode === "login"  ? "active" : ""} onClick={() => { setMode("login");  reset(); }}>Log In</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); reset(); }}>Sign Up</button>
        </div>

        {/* Fields */}
        {mode === "signup" && (
          <div className="form-group">
            <label>License Key</label>
            <input
              placeholder="FORSAKEN-XXXX-XXXX-XXXX"
              value={key}
              onChange={e => setKey(e.target.value)}
              maxLength={24}
              autoComplete="off"
            />
          </div>
        )}

        <div className="form-group">
          <label>Username</label>
          <input
            placeholder="your username"
            value={username}
            onChange={e => setUser(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPass(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
          />
        </div>

        {/* Remember me (login only) */}
        {mode === "login" && (
          <label className="auth-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            Remember me
          </label>
        )}

        {error   && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button
          className="btn btn-primary auth-submit"
          disabled={loading}
          onClick={mode === "login" ? handleLogin : handleSignup}
        >
          {loading ? <span className="auth-spinner" /> : mode === "login" ? "Log In" : "Create Account"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); reset(); }}>
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}
