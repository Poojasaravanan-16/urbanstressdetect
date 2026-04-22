import React from "react";
import { C, Card, SectionTitle, BarChart, pageStyle } from "../components/ui";

const FEATURES = [
  { label: "Midnight Noise (dB)", importance: 0.241, pct: 100, color: C.blue },
  { label: "Litter Density", importance: 0.198, pct: 82, color: C.blue },
  { label: "Graffiti Cleanup Days", importance: 0.172, pct: 71, color: C.green },
  { label: "Vacant Storefronts %", importance: 0.148, pct: 61, color: C.green },
  { label: "Crosswalk Wait (sec)", importance: 0.121, pct: 50, color: C.yellow },
  { label: "ATM Queue Length", importance: 0.074, pct: 31, color: C.orange },
  { label: "Dog Walk Freq/hr", importance: 0.046, pct: 19, color: C.red },
];

const CORRELATIONS = [
  { feature: "Midnight Noise", low: "30–45 dB", med: "46–65 dB", high: "66–90 dB" },
  { feature: "Litter Density", low: "0–3", med: "4–10", high: "11–25" },
  { feature: "Graffiti Cleanup", low: "0–5 days", med: "6–20 days", high: "21–60 days" },
  { feature: "Vacant Storefronts", low: "0–5%", med: "6–20%", high: "21–50%" },
  { feature: "Crosswalk Wait", low: "0–20 sec", med: "21–50 sec", high: "51–120 sec" },
];

export default function FeatureImportancePage() {
  return (
    <div style={pageStyle}>
      <SectionTitle icon="🧩" title="Feature Importance" sub="Which indicators drive urban stress predictions the most" />

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle icon="📊" title="Importance Scores" sub="Higher = more influence on prediction" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={f.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: C.text, fontWeight: i === 0 ? 800 : 400 }}>
                  {i === 0 && "🥇 "}{i === 1 && "🥈 "}{i === 2 && "🥉 "}{f.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: f.color }}>{(f.importance * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 12, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${f.pct}%`, height: "100%", background: `linear-gradient(90deg,${f.color}88,${f.color})`, borderRadius: 99, transition: "width .8s" }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle icon="🔝" title="Top 3 Drivers" />
          {FEATURES.slice(0, 3).map((f, i) => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `rgba(88,166,255,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: C.blue }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{f.label}</div>
                <div style={{ fontSize: 12, color: C.muted }}>Importance: {(f.importance * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle icon="📉" title="Least Influential" />
          {FEATURES.slice(-3).reverse().map((f, i) => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(248,81,73,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: C.red }}>
                {FEATURES.length - i}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{f.label}</div>
                <div style={{ fontSize: 12, color: C.muted }}>Importance: {(f.importance * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SectionTitle icon="🔗" title="Feature-Stress Correlation Ranges" sub="Typical value ranges per stress level" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Feature", "Low ✅", "Med ⚠️", "High 🚨"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: C.muted, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CORRELATIONS.map(r => (
                <tr key={r.feature} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 12px", color: C.text, fontWeight: 600 }}>{r.feature}</td>
                  <td style={{ padding: "10px 12px", color: C.green }}>{r.low}</td>
                  <td style={{ padding: "10px 12px", color: C.yellow }}>{r.med}</td>
                  <td style={{ padding: "10px 12px", color: C.red }}>{r.high}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
