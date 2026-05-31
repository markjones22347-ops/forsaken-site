import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthModal from "../components/AuthModal";
import "./HomePage.css";

const FEATURES = [
  { jp: "照準", en: "Aimbot",        desc: "FOV targeting, smoothing, prediction, sticky aim, per-part selection." },
  { jp: "静寂", en: "Silent Aim",    desc: "Mouse-spoof targeting with FOV, lerp, snap lines, and target indicators." },
  { jp: "視覚", en: "ESP / Visuals", desc: "Boxes, names, health bars, armor, distance, chams, avatar thumbnails." },
  { jp: "激怒", en: "Rage",          desc: "Hitbox expander, rapidfire, hitsounds, hit tracers, spin360, noclip." },
  { jp: "移動", en: "Movement",      desc: "Speedhack, flyhack, tickrate manipulation, orbit — all with keybinds." },
  { jp: "探索", en: "Explorer",      desc: "Full Roblox instance tree browser with property editor and bytecode viewer." },
];

const PLANS = [
  { jp: "週",  name: "Weekly",   sale: "$1.99",  regular: "$4.99",  period: "/ week",   note: "Try it out" },
  { jp: "月",  name: "Monthly",  sale: "$4.99",  regular: "$8.99",  period: "/ month",  note: "Most popular", highlight: true },
  { jp: "永",  name: "Lifetime", sale: "$6.99",  regular: "$14.99", period: "one-time", note: "Best value" },
];

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const [sale]                  = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef                 = useRef<HTMLDivElement>(null);
  const navigate                = useNavigate();

  useEffect(() => {
    const move = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      <Navbar onDashboardClick={() => setShowAuth(true)} />
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => { setShowAuth(false); navigate("/dashboard"); }}
        />
      )}

      {/* Cursor light */}
      <div className="cursor-light" style={{ left: mousePos.x, top: mousePos.y }} />

      {/* ── Hero ── */}
      <section id="home" className="hero" ref={heroRef}>
        <div className="hero-kanji-bg">
          <span style={{ fontSize: 320, top: "-60px", right: "-40px" }}>禁</span>
          <span style={{ fontSize: 180, bottom: "40px", left: "-20px", opacity: 0.03 }}>侵</span>
        </div>

        <div className="container hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Undetected · External · Roblox
          </div>

          <h1 className="hero-title">
            <span className="hero-title-jp">侵略</span>
            <span>FORSAKEN</span>
          </h1>

          <p className="hero-desc">
            A fully undetected external cheat for Roblox. Built with a custom auth system,
            DirectX overlay, and every feature you need to dominate.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => setShowAuth(true)}>
              Get Started
            </button>
            <button className="btn btn-ghost btn-lg"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              View Features
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat"><span>UD</span><small>Undetected</small></div>
            <div className="hero-stat-sep" />
            <div className="hero-stat"><span>External</span><small>No injection</small></div>
            <div className="hero-stat-sep" />
            <div className="hero-stat"><span>HWID Lock</span><small>Secure auth</small></div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll">
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="1" y="1" width="14" height="22" rx="7" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>
            <rect x="7" y="5" width="2" height="5" rx="1" fill="white" fillOpacity="0.5" className="scroll-dot"/>
          </svg>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-kanji">機能</span>
            <div>
              <p className="section-eyebrow">What's included</p>
              <h2 className="section-title">Features</h2>
            </div>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={f.en} className="feature-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="feature-card-top">
                  <span className="feature-jp">{f.jp}</span>
                  <span className="feature-num">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="feature-name">{f.en}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Purchase ── */}
      <section id="purchase" className="section purchase-section">
        <div className="container">
          <div className="section-header">
            <span className="section-kanji">購入</span>
            <div>
              <p className="section-eyebrow">Pricing</p>
              <h2 className="section-title">Purchase</h2>
            </div>
          </div>

          {sale && (
            <div className="sale-notice">
              <span className="sale-notice-dot" />
              Launch sale active — prices increase after the first month
            </div>
          )}

          <div className="plans-grid">
            {PLANS.map(p => (
              <div key={p.name} className={`plan-card ${p.highlight ? "plan-highlight" : ""}`}>
                <div className="plan-top">
                  <span className="plan-jp">{p.jp}</span>
                  <span className="plan-note">{p.note}</span>
                </div>
                <h3 className="plan-name">{p.name}</h3>
                <div className="plan-price">
                  <span className="plan-amount">{sale ? p.sale : p.regular}</span>
                  <span className="plan-period">{p.period}</span>
                </div>
                {sale && (
                  <p className="plan-after">After sale: {p.regular} {p.period}</p>
                )}
                <div className="plan-divider" />
                <ul className="plan-features">
                  <li>All features included</li>
                  <li>HWID-locked security</li>
                  <li>Discord support</li>
                  {p.name === "Lifetime" && <li>Lifetime updates</li>}
                </ul>
                <button
                  className={`btn ${p.highlight ? "btn-primary" : "btn-ghost"}`}
                  style={{ width: "100%", marginTop: "auto" }}
                  onClick={() => setShowAuth(true)}
                >
                  Get {p.name}
                </button>
              </div>
            ))}
          </div>

          <p className="plans-boost">
            3 server boosts = lifetime access — open a support ticket to arrange.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-logo">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="18" height="18" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
              <line x1="1" y1="10" x2="19" y2="10" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
              <line x1="10" y1="1" x2="10" y2="19" stroke="white" strokeOpacity="0.4" strokeWidth="1"/>
            </svg>
            <span>FORSAKEN</span>
          </div>
          <span className="footer-copy">© 2026 Forsaken. All rights reserved.</span>
          <span className="footer-jp">禁断</span>
        </div>
      </footer>
    </>
  );
}
