import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "🔍 Predict" },
  { to: "/history", label: "📋 History" },
  { to: "/insights", label: "📊 Insights" },
  { to: "/model-comparison", label: "🤖 Models" },
  { to: "/feature-importance", label: "🧩 Features" },
  { to: "/explainability", label: "🧠 Explain" },
  { to: "/anomaly", label: "⚠️ Anomaly" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav style={s.nav}>
      <div style={s.brand}>
        <span style={s.logo}>🏙️</span>
        <span style={s.title}>Urban<span style={s.accent}>Stress</span>ML</span>
      </div>
      <button style={s.burger} onClick={() => setOpen(o => !o)}>☰</button>
      <div style={{ ...s.links, ...(open ? s.linksOpen : {}) }}>
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            onClick={() => setOpen(false)}
            style={({ isActive }) => ({ ...s.link, ...(isActive ? s.active : {}) })}
          >
            {n.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

const s = {
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(13,17,23,0.95)", backdropFilter: "blur(12px)",
    borderBottom: "1px solid #21262d",
    display: "flex", alignItems: "center", flexWrap: "wrap",
    padding: "0 24px", gap: 8, minHeight: 56,
  },
  brand: { display: "flex", alignItems: "center", gap: 8, marginRight: 16 },
  logo: { fontSize: 24 },
  title: { fontSize: 18, fontWeight: 800, color: "#e6edf3", letterSpacing: -0.5 },
  accent: { color: "#58a6ff" },
  burger: {
    display: "none", background: "none", border: "none",
    color: "#e6edf3", fontSize: 22, cursor: "pointer", marginLeft: "auto",
    "@media(max-width:768px)": { display: "block" },
  },
  links: { display: "flex", flexWrap: "wrap", gap: 2, flex: 1 },
  linksOpen: {},
  link: {
    padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500,
    color: "#8b949e", textDecoration: "none", transition: "all .15s",
    whiteSpace: "nowrap",
  },
  active: {
    color: "#58a6ff", background: "rgba(88,166,255,0.1)",
  },
};
