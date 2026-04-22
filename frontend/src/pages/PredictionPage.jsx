import React, { useState } from "react";
import { C, Card, SectionTitle, Badge, STRESS, pageStyle } from "../components/ui";
import { useData } from "../context/DataContext";

const FIELDS = [
  { key: "crosswalk_wait_sec", icon: "🚦", label: "Road Crossing Wait", unit: "sec", min: 0, max: 120, step: 1, default: 35 },
  { key: "litter_density_per_100m2", icon: "🗑️", label: "Litter Density", unit: "per 100m²", min: 0, max: 25, step: 0.1, default: 5 },
  { key: "midnight_noise_db", icon: "🔊", label: "Midnight Noise", unit: "dB", min: 30, max: 90, step: 0.1, default: 58 },
  { key: "atm_queue_length", icon: "🏧", label: "ATM Queue", unit: "people", min: 0, max: 10, step: 0.1, default: 2 },
  { key: "vacant_storefronts_pct", icon: "🏚️", label: "Vacant Storefronts", unit: "%", min: 0, max: 50, step: 0.1, default: 10 },
  { key: "dog_walk_freq_per_hr", icon: "🐕", label: "Dog Walk Freq", unit: "/hr", min: 0, max: 5, step: 0.01, default: 1 },
  { key: "graffiti_turnover_days", icon: "🧹", label: "Graffiti Cleanup", unit: "days", min: 0, max: 60, step: 1, default: 10 },
];

export default function PredictionPage() {
  const init = Object.fromEntries(FIELDS.map(f => [f.key, f.default]));
  const [values, setValues] = useState(init);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { modelInfo, refresh } = useData();

  const set = (key, val) => {
    const f = FIELDS.find(x => x.key === key);
    setValues(p => ({ ...p, [key]: Math.min(f.max, Math.max(f.min, parseFloat(val) || 0)) }));
  };

  const predict = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        refresh(); // update all pages with new prediction
      }
    } catch { setError("Cannot reach server. Make sure Flask is running on port 5000."); }
    finally { setLoading(false); }
  };

  const cfg = result ? STRESS[result.prediction] : null;

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <span style={{ fontSize: 48 }}>🏙️</span>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text }}>
              Urban Stress Level <span style={{ color: C.blue }}>Predictor</span>
            </h1>
            <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>
              Analyse your neighbourhood's environmental stress indicators
            </p>
          </div>
        </div>
        {modelInfo && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(63,185,80,0.1)", border: "1px solid rgba(63,185,80,0.3)", borderRadius: 20, padding: "6px 16px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, display: "inline-block" }} />
            <span style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>BEST MODEL</span>
            <span style={{ fontSize: 13, color: C.text }}>{modelInfo.model_name} — {modelInfo.accuracy}%</span>
          </div>
        )}
      </div>

      <Card style={{ marginBottom: 24 }}>
        <SectionTitle icon="✏️" title="Predict Stress Level" sub="Adjust the sliders to match your neighbourhood" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16, marginBottom: 24 }}>
          {FIELDS.map(f => {
            const pct = ((values[f.key] - f.min) / (f.max - f.min)) * 100;
            return (
              <div key={f.key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{f.icon} {f.label}</span>
                  <span style={{ fontSize: 13, color: C.blue, fontWeight: 800 }}>{values[f.key]} <span style={{ fontSize: 11, color: C.muted }}>{f.unit}</span></span>
                </div>
                <input type="range" min={f.min} max={f.max} step={f.step} value={values[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  style={{ width: "100%", accentColor: C.blue, cursor: "pointer" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 4 }}>
                  <span>{f.min}</span><span>{f.max}</span>
                </div>
                <div style={{ height: 4, background: C.border, borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: C.blue, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={predict} disabled={loading} style={{
          width: "100%", padding: 16, background: loading ? "#21262d" : `linear-gradient(90deg,#1f6feb,${C.blue})`,
          color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {loading ? <><span style={{ width: 18, height: 18, border: "2px solid #444", borderTop: `2px solid ${C.blue}`, borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }} /> Analysing…</> : "🔍 Predict Stress Level"}
        </button>
        {error && <div style={{ marginTop: 12, padding: 12, background: "rgba(248,81,73,0.1)", border: `1px solid ${C.red}`, borderRadius: 8, color: C.red, fontSize: 13 }}>⚠️ {error}</div>}
      </Card>

      {result && cfg && (
        <Card style={{ border: `1px solid ${cfg.color}`, background: cfg.bg, animation: "fadeIn .4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Badge label={cfg.label} color={cfg.color} bg="transparent" />
            <span style={{ fontSize: 22, fontWeight: 900, color: cfg.color }}>{result.prediction} STRESS</span>
          </div>
          <div style={{ height: 10, background: "rgba(255,255,255,0.1)", borderRadius: 99, marginBottom: 8, position: "relative" }}>
            <div style={{ width: result.prediction === "Low" ? "20%" : result.prediction === "Med" ? "55%" : "90%", height: "100%", background: cfg.color, borderRadius: 99, transition: "width .6s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
            <span>Low</span><span>Medium</span><span>High</span>
          </div>
          <p style={{ color: cfg.color, fontSize: 15, marginBottom: 20 }}>{result.message}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
            {FIELDS.map(f => (
              <div key={f.key} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{f.icon} {f.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>{values[f.key]} <span style={{ fontSize: 10, fontWeight: 400 }}>{f.unit}</span></span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
