import { Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import OwnerPage from "./pages/OwnerPage";

export default function App() {
  const gradientRef = useRef<HTMLDivElement>(null);

  // Cursor-following gradient
  useEffect(() => {
    const el = gradientRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(0,230,118,0.06) 0%, transparent 70%)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      <div ref={gradientRef} style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, transition: "background 0.1s",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Routes>
          <Route path="/"       element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/gx322"  element={<OwnerPage />} />
        </Routes>
      </div>
    </>
  );
}
