import React, { useState } from "react";
import { C, Card, SectionTitle, Badge, STRESS, StatCard, pageStyle } from "../components/ui";
import { useData } from "../context/DataContext";

export default function HistoryPage() {
  const { records } = useData();
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? records : records.filter(r => r.prediction === filter);
  const counts = { Low: 0, Med: 0, High: 0 };
  records.forEach(r => { if (counts[r.prediction] !== undefined) counts[r.prediction]++; });

  return (
    <div style={pageStyle}>
      <SectionTitle icon="📋" title="Prediction History" sub="All past predictions logged to Supabase" />

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard icon="📊" label="Total Predictions" value={records.length} color={C.blue} />
        <StatCard icon="✅" label="Low Stress" value={counts.Low} color={C.green} />
        <StatCard icon="⚠️" label="Med Stress" value={counts.Med} color={C.yellow} />
        <StatCard icon="🚨" label="High Stress" value={counts.High} color={C.red} />
      </div>

      <Card>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["All", "Low", "Med", "High"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 16px", borderRadius: 20, border: "1px solid",
              borderColor: filter === f ? C.blue : C.border,
              background: filter === f ? "rgba(88,166,255,0.1)" : "transparent",
              color: filter === f ? C.blue : C.muted, cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>{f}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: C.muted, textAlign: "center", padding: 40 }}>No predictions yet. Make a prediction first!</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["#", "Prediction", "Model", "Accuracy", "Timestamp"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const cfg = STRESS[r.prediction] || {};
                  return (
                    <tr key={r.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "12px", color: C.muted }}>{i + 1}</td>
                      <td style={{ padding: "12px" }}><Badge label={r.prediction} color={cfg.color} bg={cfg.bg} /></td>
                      <td style={{ padding: "12px", color: C.text }}>{r.model_name || "—"}</td>
                      <td style={{ padding: "12px", color: C.blue, fontWeight: 700 }}>
                        {r.model_accuracy ? `${(r.model_accuracy * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td style={{ padding: "12px", color: C.muted }}>
                        {r.created_at ? new Date(r.created_at.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')).toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
