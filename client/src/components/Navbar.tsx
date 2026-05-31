import { useState } from "react";
import "./Navbar.css";

interface NavbarProps {
  onDashboardClick: () => void;
}

export default function Navbar({ onDashboardClick }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo">FORSAKEN</span>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <button onClick={() => scrollTo("home")}>Home</button>
          <button onClick={() => scrollTo("features")}>Features</button>
          <button onClick={() => scrollTo("purchase")}>Purchase</button>
        </div>

        <div className="navbar-right">
          <button className="btn btn-primary" onClick={onDashboardClick}>
            Dashboard
          </button>
          <button className="navbar-burger" onClick={() => setMenuOpen(v => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
