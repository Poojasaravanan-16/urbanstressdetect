import React, { useState, useEffect } from "react";
import { C, Card, SectionTitle, Badge, pageStyle } from "../components/ui";

const MODELS = [
  { name: "SVM Classifier", accuracy: 85.4, precision: 84.2, recall: 85.1, f1: 84.6, color: C.blue, rank: 1 },
  { name: "Decision Tree", accuracy: 79.3, precision: 78.8, recall: 79.0, f1: 78.9, color: C.green, rank: 2 },
  { name: "Weighted Regression", accuracy: 74.1, precision: 73.5, recall: 74.0, f1: 73.7, color: C.yellow, rank: 3 },
  { name: "Clustering Classifier", accuracy: 68.7, precision: 67.9, recall: 68.5, f1: 68.2, color: C.orange, rank: 4 },
  { name: "Rule-Based Classifier", accuracy: 63.2, precision: 62.1, recall: 63.0, f1: 62.5, color: C.red, rank: 5 },
];

export default function ModelComparisonPage() {
  const [selected, setSelected] = useState(0);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    fetch("/info").then(r => r.json()).then(setModelInfo).catch(() => {});
  }, []);

  const metrics = ["accuracy", "precision", "recall", "f1"];

  return (
    <div style={pageStyle}>
      <SectionTitle icon="🤖" title="Model Comparison" sub="Compare all trained models side by side" />

      {modelInfo && (
        <div style={{ marginBottom: 24, padding: "12px 20px", background: "rgba(63,185,80,0.1)", border: `1px solid ${C.green}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🏆</span>
          <div>
            <span style={{ color: C.green, fontWeight: 700, fontSize: 13 }}>BEST MODEL IN USE</span>
            <p style={{ color: C.text, fontSize: 15, fontWeight: 800 }}>{modelInfo.model_name} — {modelInfo.accuracy}% accuracy</p>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <SectionTitle icon="🏅" title="Model Leaderboard" sub="Click a card to inspect details" />
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {MODELS.map((m, i) => (
          <div key={m.name} onClick={() => setSelected(i)} style={{
            flex: "1 1 160px", background: selected === i ? `rgba(${m.color === C.blue ? "88,166,255" : "63,185,80"},0.15)` : C.surface,
            border: `2px solid ${selected === i ? m.color : C.border}`,
            borderRadius: 12, padding: 20, cursor: "pointer", transition: "all .2s", textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>#{m.rank}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 8 }}>{m.name}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: m.color }}>{m.accuracy}<span style={{ fontSize: 16 }}>%</span></div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Accuracy</div>
            <div style={{ height: 3, background: C.border, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${m.accuracy}%`, height: "100%", background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed comparison table */}
      <Card>
        <SectionTitle icon="📊" title="Metrics Comparison Table" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: C.muted, fontSize: 12 }}>Model</th>
                {metrics.map(m => (
                  <th key={m} style={{ padding: "10px 12px", textAlign: "center", color: C.muted, fontSize: 12, textTransform: "capitalize" }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m, i) => (
                <tr key={m.name} style={{ borderBottom: `1px solid ${C.border}`, background: i === 0 ? "rgba(88,166,255,0.05)" : "transparent" }}>
                  <td style={{ padding: "12px", color: C.text, fontWeight: i === 0 ? 800 : 400 }}>
                    {i === 0 && "🏆 "}{m.name}
                  </td>
                  {metrics.map(met => (
                    <td key={met} style={{ padding: "12px", textAlign: "center", color: m.color, fontWeight: 700 }}>{m[met]}%</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bar comparison */}
      <Card style={{ marginTop: 20 }}>
        <SectionTitle icon="📉" title="Accuracy Visual Comparison" />
        {MODELS.map(m => (
          <div key={m.name} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: C.text }}>{m.name}</span>
              <span style={{ color: m.color, fontWeight: 700 }}>{m.accuracy}%</span>
            </div>
            <div style={{ height: 10, background: C.border, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${m.accuracy}%`, height: "100%", background: m.color, borderRadius: 99, transition: "width .6s" }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
