import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

interface NavbarProps {
  onDashboardClick: () => void;
}

export default function Navbar({ onDashboardClick }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const scroll = (id: string) => {
    setOpen(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 10);
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" stroke="white" strokeWidth="1.2"/>
            <line x1="1" y1="10" x2="19" y2="10" stroke="white" strokeWidth="1.2"/>
            <line x1="10" y1="1" x2="10" y2="19" stroke="white" strokeWidth="1.2"/>
          </svg>
          <span>FORSAKEN</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          <button onClick={() => scroll("home")}>Home</button>
          <button onClick={() => scroll("features")}>Features</button>
          <button onClick={() => scroll("purchase")}>Purchase</button>
        </div>

        {/* Right */}
        <div className="nav-right">
          <button className="btn btn-ghost btn-sm" onClick={onDashboardClick}>Dashboard</button>
          <button className="nav-burger" onClick={() => setOpen(v => !v)} aria-label="Menu">
            <span className={open ? "open" : ""} />
            <span className={open ? "open" : ""} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="nav-mobile">
          <button onClick={() => scroll("home")}>Home</button>
          <button onClick={() => scroll("features")}>Features</button>
          <button onClick={() => scroll("purchase")}>Purchase</button>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => { setOpen(false); onDashboardClick(); }}>Dashboard</button>
        </div>
      )}
    </nav>
  );
}
