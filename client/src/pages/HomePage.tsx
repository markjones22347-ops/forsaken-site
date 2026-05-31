import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthModal from "../components/AuthModal";
import "./HomePage.css";

const FEATURES = [
  { title: "Aimbot",       desc: "FOV-based targeting with smoothing, prediction, sticky aim, and per-part selection." },
  { title: "Silent Aim",   desc: "Mouse-spoof silent aim with FOV, lerp, snap lines, and target dot indicators." },
  { title: "ESP / Visuals",desc: "Boxes, names, health bars, armor, distance, tool display, chams, and avatar thumbnails." },
  { title: "Rage",         desc: "Hitbox expander, rapidfire, hitsounds, hit tracers, spin360, and noclip." },
  { title: "Movement",     desc: "Speedhack, flyhack, tickrate manipulation, and orbit mode — all with keybind support." },
  { title: "Explorer",     desc: "Full Roblox instance tree browser with property editor and script bytecode viewer." },
];

const PLANS_SALE = [
  { name: "Weekly",   price: "$1.99", period: "/ week",   highlight: false },
  { name: "Monthly",  price: "$4.99", period: "/ month",  highlight: true  },
  { name: "Lifetime", price: "$6.99", period: "one-time", highlight: false },
];

const PLANS_REGULAR = [
  { name: "Weekly",   price: "$4.99",  period: "/ week",   highlight: false },
  { name: "Monthly",  price: "$8.99",  period: "/ month",  highlight: true  },
  { name: "Lifetime", price: "$14.99", period: "one-time", highlight: false },
];

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const [showSale] = useState(true); // flip to false after first month
  const navigate   = useNavigate();
  const plans      = showSale ? PLANS_SALE : PLANS_REGULAR;

  const handleAuthSuccess = () => {
    setShowAuth(false);
    navigate("/dashboard");
  };

  return (
    <>
      <Navbar onDashboardClick={() => setShowAuth(true)} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}

      {/* ── Hero ── */}
      <section id="home" className="hero">
        <div className="hero-glow" />
        <div className="container hero-content">
          <span className="hero-badge">Undetected · External · Roblox</span>
          <h1 className="hero-title">
            The Best<br />
            <span className="hero-accent">Roblox External</span>
          </h1>
          <p className="hero-sub">
            Forsaken is a fully undetected external cheat for Roblox — built from the ground up
            with a custom auth system, sleek overlay UI, and every feature you need.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary hero-cta" onClick={() => setShowAuth(true)}>
              Get Started
            </button>
            <button className="btn btn-ghost" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              View Features
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat"><span>UD</span><small>Undetected</small></div>
            <div className="stat-divider" />
            <div className="stat"><span>External</span><small>No injection</small></div>
            <div className="stat-divider" />
            <div className="stat"><span>Custom Auth</span><small>HWID locked</small></div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section">
        <div className="container">
          <p className="section-label">What's included</p>
          <h2 className="section-title">Features</h2>
          <p className="section-sub">Everything you need, nothing you don't.</p>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="card feature-card">
                <div className="feature-dot" />
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Purchase ── */}
      <section id="purchase" className="section">
        <div className="container">
          <p className="section-label">Pricing</p>
          <h2 className="section-title">Purchase</h2>
          {showSale && (
            <div className="sale-banner">
              Launch Sale — First month only. Prices increase after.
            </div>
          )}
          <div className="plans-grid">
            {plans.map(p => (
              <div key={p.name} className={`card plan-card ${p.highlight ? "plan-highlight" : ""}`}>
                {p.highlight && <span className="plan-badge">Most Popular</span>}
                <h3 className="plan-name">{p.name}</h3>
                <div className="plan-price">
                  <span className="plan-amount">{p.price}</span>
                  <span className="plan-period">{p.period}</span>
                </div>
                <ul className="plan-features">
                  <li>All features included</li>
                  <li>HWID locked security</li>
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
          <p className="plans-note">
            Also accepting <strong>3 server boosts</strong> for lifetime access.
            Open a support ticket to arrange.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer-inner">
          <span className="footer-logo">FORSAKEN</span>
          <span className="footer-copy">© 2026 Forsaken. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}
