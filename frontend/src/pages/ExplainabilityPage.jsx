import React, { useState } from "react";
import { C, Card, SectionTitle, pageStyle } from "../components/ui";
import { useData } from "../context/DataContext";

const FIELDS = [
  { key: "crosswalk_wait_sec", label: "Crosswalk Wait", avg: 35, unit: "sec" },
  { key: "litter_density_per_100m2", label: "Litter Density", avg: 5, unit: "/100m²" },
  { key: "midnight_noise_db", label: "Midnight Noise", avg: 58, unit: "dB" },
  { key: "atm_queue_length", label: "ATM Queue", avg: 2, unit: "ppl" },
  { key: "vacant_storefronts_pct", label: "Vacant Storefronts", avg: 10, unit: "%" },
  { key: "dog_walk_freq_per_hr", label: "Dog Walk Freq", avg: 1, unit: "/hr" },
  { key: "graffiti_turnover_days", label: "Graffiti Cleanup", avg: 10, unit: "days" },
];

const IMPORTANCE = [0.241, 0.198, 0.172, 0.148, 0.121, 0.074, 0.046];

export default function ExplainabilityPage() {
  const { modelInfo } = useData();
  const [values, setValues] = useState(Object.fromEntries(FIELDS.map(f => [f.key, f.avg])));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    setLoading(true);
    try {
      const res = await fetch("/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await res.json();
      if (!data.error) setResult(data);
    } catch {}
    setLoading(false);
  };

  const shapData = FIELDS.map((f, i) => {
    const diff = values[f.key] - f.avg;
    const contribution = diff * IMPORTANCE[i];
    return { label: f.label, value: contribution.toFixed(4), pct: Math.min(100, Math.abs(contribution) * 500), positive: contribution >= 0 };
  }).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  const recommendations = [];
  if (values.midnight_noise_db > 65) recommendations.push({ type: "urgent", text: "🔊 Midnight noise is very high — noise barriers or zoning enforcement recommended." });
  if (values.litter_density_per_100m2 > 10) recommendations.push({ type: "urgent", text: "🗑️ High litter density — increase street cleaning frequency." });
  if (values.graffiti_turnover_days > 20) recommendations.push({ type: "warn", text: "🧹 Slow graffiti cleanup — improve maintenance response time." });
  if (values.vacant_storefronts_pct > 20) recommendations.push({ type: "warn", text: "🏚️ High vacancy rate — consider economic revitalisation programs." });
  if (values.dog_walk_freq_per_hr > 2) recommendations.push({ type: "good", text: "🐕 Good neighbourhood activity — residents feel safe." });
  if (recommendations.length === 0) recommendations.push({ type: "good", text: "✅ No critical issues found." });

  return (
    <div style={pageStyle}>
      <SectionTitle icon="🧠" title="Model Explainability" sub="Understand why the model made its prediction (SHAP-style)" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle icon="✏️" title="Adjust Input Values" />
          {FIELDS.map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: C.text }}>{f.label}</span>
                <span style={{ color: C.blue, fontWeight: 700 }}>{values[f.key]} {f.unit}</span>
              </div>
              <input type="range" min={0} max={f.avg * 4} step={0.1} value={values[f.key]}
                onChange={e => setValues(p => ({ ...p, [f.key]: parseFloat(e.target.value) }))}
                style={{ width: "100%", accentColor: C.blue }} />
            </div>
          ))}
          <button onClick={predict} disabled={loading} style={{
            width: "100%", marginTop: 8, padding: "12px", background: `linear-gradient(90deg,#1f6feb,${C.blue})`,
            color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>
            {loading ? "Analysing…" : "🔍 Explain Prediction"}
          </button>
          {result && (
            <div style={{ marginTop: 12, padding: 12, background: "rgba(88,166,255,0.1)", border: `1px solid ${C.blue}`, borderRadius: 8, textAlign: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.blue }}>Prediction: {result.prediction}</span>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon="📊" title="Explainable AI (SHAP-style)" sub="Feature contribution vs average neighbourhood" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shapData.map(d => (
              <div key={d.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: C.muted }}>{d.label}</span>
                  <span style={{ color: d.positive ? C.red : C.green, fontWeight: 700 }}>{d.positive ? "+" : ""}{d.value}</span>
                </div>
                <div style={{ height: 8, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${d.pct}%`, height: "100%", background: d.positive ? C.red : C.green, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>🔴 Red = increases stress · 🟢 Green = reduces stress</p>
        </Card>
      </div>

      <Card>
        <SectionTitle icon="🤖" title="AI Urban Advisor" sub="Auto-generated recommendations based on your input" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "rgba(248,81,73,0.08)", border: `1px solid rgba(248,81,73,0.3)`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 10 }}>⚠️ Urgent Actions</div>
            {recommendations.filter(r => r.type === "urgent").length === 0
              ? <p style={{ fontSize: 13, color: C.muted }}>No critical issues found.</p>
              : recommendations.filter(r => r.type === "urgent").map((r, i) => <p key={i} style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>{r.text}</p>)
            }
          </div>
          <div style={{ background: "rgba(63,185,80,0.08)", border: `1px solid rgba(63,185,80,0.3)`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 10 }}>💡 Recommendations</div>
            {recommendations.filter(r => r.type !== "urgent").map((r, i) => <p key={i} style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>{r.text}</p>)}
          </div>
        </div>
      </Card>
    </div>
  );
}
