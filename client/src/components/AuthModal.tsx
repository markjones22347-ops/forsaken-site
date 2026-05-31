import { useState } from "react";
import "./AuthModal.css";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "login" | "signup";

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode]       = useState<Mode>("login");
  const [key, setKey]         = useState("");
  const [username, setUser]   = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setError(""); };

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
      onSuccess();
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.toUpperCase(), username, password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Registration failed."); return; }
      // Redirect to login after successful signup
      setMode("login"); setKey(""); setError(""); setPass("");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal auth-modal">
        <div className="auth-tabs">
          <button className={mode === "login"  ? "active" : ""} onClick={() => { setMode("login");  reset(); }}>Log In</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); reset(); }}>Sign Up</button>
        </div>

        {mode === "signup" && (
          <div className="form-group">
            <label>Key</label>
            <input placeholder="FORSAKEN-XXXX-XXXX-XXXX" value={key}
              onChange={e => setKey(e.target.value)} maxLength={24} />
          </div>
        )}

        <div className="form-group">
          <label>Username</label>
          <input placeholder="your username" value={username}
            onChange={e => setUser(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={password}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 4 }}
          disabled={loading}
          onClick={mode === "login" ? handleLogin : handleSignup}
        >
          {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
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
