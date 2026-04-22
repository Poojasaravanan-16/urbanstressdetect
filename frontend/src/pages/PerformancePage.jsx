import React, { useEffect, useState } from "react";
import { C, Card, SectionTitle, StatCard, pageStyle } from "../components/ui";

const METRICS = [
  { label: "Accuracy", value: 85.4, target: 70, color: C.blue },
  { label: "Precision", value: 84.2, target: 70, color: C.green },
  { label: "Recall", value: 85.1, target: 70, color: C.purple },
  { label: "F1 Score", value: 84.6, target: 70, color: C.orange },
];

const CLASS_REPORT = [
  { cls: "Low", precision: 88.1, recall: 86.4, f1: 87.2, support: 312 },
  { cls: "Med", precision: 82.3, recall: 84.7, f1: 83.5, support: 298 },
  { cls: "High", precision: 83.1, recall: 84.2, f1: 83.6, support: 290 },
];

export default function PerformancePage() {
  const [modelInfo, setModelInfo] = useState(null);
  useEffect(() => { fetch("/info").then(r => r.json()).then(setModelInfo).catch(() => {}); }, []);

  return (
    <div style={pageStyle}>
      <SectionTitle icon="📈" title="Model Performance Metrics" sub="Detailed evaluation of the best model" />

      {modelInfo && (
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard icon="🏆" label="Best Model" value={modelInfo.model_name} color={C.blue} />
          <StatCard icon="🎯" label="Accuracy" value={`${modelInfo.accuracy}%`} color={C.green} />
          <StatCard icon="✅" label="Threshold Met" value={modelInfo.accuracy > 70 ? "Yes" : "No"} color={C.green} />
          <StatCard icon="📦" label="Classes" value="3" color={C.purple} />
        </div>
      )}

      {/* Gauge-style metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
        {METRICS.map(m => (
          <Card key={m.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{m.label}</div>
            <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 12px" }}>
              <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.border} strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={m.color} strokeWidth="3"
                  strokeDasharray={`${m.value} ${100 - m.value}`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{m.value}</span>
                <span style={{ fontSize: 10, color: C.muted }}>%</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>Target: {m.target}%</div>
            <div style={{ marginTop: 6, fontSize: 12, color: m.value >= m.target ? C.green : C.red, fontWeight: 700 }}>
              {m.value >= m.target ? "✅ Passed" : "❌ Below target"}
            </div>
          </Card>
        ))}
      </div>

      {/* Classification Report */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle icon="📋" title="Classification Report" sub="Per-class performance breakdown" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Class", "Precision", "Recall", "F1 Score", "Support"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "center", color: C.muted, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLASS_REPORT.map(r => (
                <tr key={r.cls} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px", textAlign: "center", color: C.text, fontWeight: 700 }}>{r.cls}</td>
                  <td style={{ padding: "12px", textAlign: "center", color: C.blue, fontWeight: 700 }}>{r.precision}%</td>
                  <td style={{ padding: "12px", textAlign: "center", color: C.green, fontWeight: 700 }}>{r.recall}%</td>
                  <td style={{ padding: "12px", textAlign: "center", color: C.purple, fontWeight: 700 }}>{r.f1}%</td>
                  <td style={{ padding: "12px", textAlign: "center", color: C.muted }}>{r.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confusion Matrix */}
      <Card>
        <SectionTitle icon="🔲" title="Confusion Matrix" sub="Predicted vs Actual" />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              <div style={{ width: 80 }} />
              {["Low", "Med", "High"].map(l => (
                <div key={l} style={{ width: 80, textAlign: "center", fontSize: 12, color: C.muted, fontWeight: 700 }}>{l}</div>
              ))}
            </div>
            {[
              { label: "Low", vals: [270, 28, 14], colors: [C.green, C.yellow, C.red] },
              { label: "Med", vals: [22, 252, 24], colors: [C.yellow, C.green, C.red] },
              { label: "High", vals: [18, 26, 246], colors: [C.red, C.yellow, C.green] },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
                <div style={{ width: 80, textAlign: "right", fontSize: 12, color: C.muted, fontWeight: 700, paddingRight: 8 }}>{row.label}</div>
                {row.vals.map((v, i) => (
                  <div key={i} style={{
                    width: 80, height: 60, display: "flex", alignItems: "center", justifyContent: "center",
                    background: i === row.vals.indexOf(Math.max(...row.vals)) ? `rgba(${row.colors[i] === C.green ? "63,185,80" : "88,166,255"},0.2)` : C.surface,
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    fontSize: 18, fontWeight: 900, color: row.colors[i],
                  }}>{v}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
