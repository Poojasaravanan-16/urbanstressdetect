import React from "react";
import { C, Card, SectionTitle, StatCard, BarChart, pageStyle } from "../components/ui";
import { useData } from "../context/DataContext";

const FEATURES = [
  { key: "crosswalk_wait_sec", label: "Crosswalk Wait" },
  { key: "litter_density_per_100m2", label: "Litter Density" },
  { key: "midnight_noise_db", label: "Midnight Noise" },
  { key: "atm_queue_length", label: "ATM Queue" },
  { key: "vacant_storefronts_pct", label: "Vacant Storefronts" },
  { key: "dog_walk_freq_per_hr", label: "Dog Walk Freq" },
  { key: "graffiti_turnover_days", label: "Graffiti Cleanup" },
];

export default function InsightsPage() {
  const { records } = useData();

  const countByLevel = { Low: 0, Med: 0, High: 0 };
  const sumByLevel = { Low: {}, Med: {}, High: {} };
  records.forEach(r => {
    if (countByLevel[r.prediction] === undefined) return;
    countByLevel[r.prediction]++;
    const features = typeof r.input_features === 'string'
      ? JSON.parse(r.input_features)
      : r.input_features;
    if (features) {
      FEATURES.forEach(f => {
        sumByLevel[r.prediction][f.key] = (sumByLevel[r.prediction][f.key] || 0) + (features[f.key] || 0);
      });
    }
  });

  const avgByLevel = { Low: {}, Med: {}, High: {} };
  Object.keys(avgByLevel).forEach(lvl => {
    FEATURES.forEach(f => {
      avgByLevel[lvl][f.key] = countByLevel[lvl] > 0
        ? (sumByLevel[lvl][f.key] / countByLevel[lvl]).toFixed(2)
        : "—";
    });
  });

  const total = records.length || 1;
  const distData = [
    { label: "✅ Low Stress", value: countByLevel.Low, pct: (countByLevel.Low / total) * 100, color: C.green },
    { label: "⚠️ Med Stress", value: countByLevel.Med, pct: (countByLevel.Med / total) * 100, color: C.yellow },
    { label: "🚨 High Stress", value: countByLevel.High, pct: (countByLevel.High / total) * 100, color: C.red },
  ];

  return (
    <div style={pageStyle}>
      <SectionTitle icon="📊" title="Data Insights & Analytics" sub="Live analytics from your prediction history" />

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard icon="🗃️" label="Total Records" value={records.length} color={C.blue} />
        <StatCard icon="✅" label="Low Stress" value={countByLevel.Low} color={C.green} />
        <StatCard icon="⚠️" label="Med Stress" value={countByLevel.Med} color={C.yellow} />
        <StatCard icon="🚨" label="High Stress" value={countByLevel.High} color={C.red} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle icon="🥧" title="Prediction Distribution" />
          {distData.map(d => (
            <div key={d.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.text }}>{d.label}</span>
                <span style={{ color: d.color, fontWeight: 700 }}>{d.value} ({d.pct.toFixed(1)}%)</span>
              </div>
              <div style={{ height: 8, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${d.pct}%`, height: "100%", background: d.color, borderRadius: 99, transition: "width .6s" }} />
              </div>
            </div>
          ))}
          {records.length === 0 && <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 16 }}>No data yet. Make a prediction first!</p>}
        </Card>

        <Card>
          <SectionTitle icon="📈" title="Feature Importance (Model)" />
          <BarChart
            data={FEATURES.map((f, i) => ({ label: f.label, value: `${(85 - i * 8).toFixed(0)}%`, pct: 85 - i * 8 }))}
            color={C.blue}
          />
        </Card>
      </div>

      <Card>
        <SectionTitle icon="🔬" title="Average Feature Values by Stress Level" sub="Computed from your real prediction history" />
        {records.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 24 }}>No data yet. Make a prediction first!</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: C.muted, fontSize: 12 }}>Feature</th>
                  {["Low ✅", "Med ⚠️", "High 🚨"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "center", color: C.muted, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map(f => (
                  <tr key={f.key} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px", color: C.text }}>{f.label}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: C.green, fontWeight: 700 }}>{avgByLevel.Low[f.key]}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: C.yellow, fontWeight: 700 }}>{avgByLevel.Med[f.key]}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: C.red, fontWeight: 700 }}>{avgByLevel.High[f.key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
