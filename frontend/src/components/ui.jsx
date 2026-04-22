// Shared dark-theme design tokens & reusable mini-components
import React from "react";

export const C = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "#21262d",
  text: "#e6edf3",
  muted: "#8b949e",
  blue: "#58a6ff",
  green: "#3fb950",
  yellow: "#d29922",
  red: "#f85149",
  purple: "#bc8cff",
  orange: "#ffa657",
};

export const STRESS = {
  Low:  { color: C.green,  bg: "rgba(63,185,80,0.12)",  label: "✅ LOW" },
  Med:  { color: C.yellow, bg: "rgba(210,153,34,0.12)", label: "⚠️ MED" },
  High: { color: C.red,    bg: "rgba(248,81,73,0.12)",  label: "🚨 HIGH" },
};

export function Card({ children, style }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
        {icon} {title}
      </h2>
      {sub && <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export function Badge({ label, color, bg }) {
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
      {label}
    </span>
  );
}

export function StatCard({ icon, label, value, color }) {
  return (
    <Card style={{ textAlign: "center", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || C.blue, margin: "8px 0 4px" }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
    </Card>
  );
}

export function BarChart({ data, maxVal, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(({ label, value, pct }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 180, fontSize: 13, color: C.muted, textAlign: "right", flexShrink: 0 }}>{label}</span>
          <div style={{ flex: 1, background: C.border, borderRadius: 99, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: color || C.blue, borderRadius: 99, transition: "width .6s" }} />
          </div>
          <span style={{ width: 50, fontSize: 13, color: C.text, fontWeight: 700 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export const pageStyle = {
  minHeight: "100vh", background: C.bg, padding: "32px 24px",
  maxWidth: 1100, margin: "0 auto", animation: "fadeIn .3s ease",
};
