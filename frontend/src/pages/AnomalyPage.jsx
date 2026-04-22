import React from "react";
import { C, Card, SectionTitle, pageStyle } from "../components/ui";
import { useData } from "../context/DataContext";

const THRESHOLDS = {
  crosswalk_wait_sec:        { label: "Crosswalk Wait",     high: 80,  unit: "sec"    },
  litter_density_per_100m2:  { label: "Litter Density",     high: 15,  unit: "/100m²" },
  midnight_noise_db:         { label: "Midnight Noise",     high: 70,  unit: "dB"     },
  atm_queue_length:          { label: "ATM Queue",          high: 7,   unit: "ppl"    },
  vacant_storefronts_pct:    { label: "Vacant Storefronts", high: 30,  unit: "%"      },
  dog_walk_freq_per_hr:      { label: "Dog Walk Freq",      high: 0.3, unit: "/hr"    },
  graffiti_turnover_days:    { label: "Graffiti Cleanup",   high: 30,  unit: "days"   },
};

export default function AnomalyPage() {
  const { records } = useData();

  const anomalies = [];
  records.forEach((r, i) => {
    if (r.prediction === "High") {
      anomalies.push({ id: `${i}-hs`, severity: "High", message: `High stress prediction detected`, time: r.created_at });
    }
    if (r.input_features) {
      Object.entries(THRESHOLDS).forEach(([key, t]) => {
        const val = r.input_features[key];
        if (val !== undefined && val > t.high) {
          anomalies.push({ id: `${i}-${key}`, severity: "Medium", message: `${t.label} spike: ${val} ${t.unit} (threshold: ${t.high})`, time: r.created_at });
        }
      });
    }
  });
  const displayed = anomalies.slice(0, 20);
  const highCount = anomalies.filter(a => a.severity === "High").length;
  const medCount  = anomalies.filter(a => a.severity === "Medium").length;

  const scoreData = records.slice(-20).map((r, i) => ({
    i, score: r.prediction === "High" ? 80 : r.prediction === "Med" ? 40 : 15,
  }));
  const maxScore = Math.max(...scoreData.map(d => d.score), 1);

  return (
    <div style={pageStyle}>
      <SectionTitle icon="⚠️" title="Anomaly Detection" sub="Unusual patterns and outliers in prediction data" />

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { icon: "🔍", label: "Total Anomalies",  value: anomalies.length, color: C.blue  },
          { icon: "🚨", label: "High Severity",    value: highCount,        color: C.red   },
          { icon: "⚠️", label: "Medium Severity",  value: medCount,         color: C.yellow},
          { icon: "📊", label: "Records Scanned",  value: records.length,   color: C.muted },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 140, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, margin: "8px 0 4px" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle icon="📈" title="Anomaly Score Over Time" sub="Based on your real prediction history" />
        {scoreData.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 16 }}>No data yet.</p>
        ) : (
          <>
            <div style={{ height: 100, display: "flex", alignItems: "flex-end", gap: 4 }}>
              {scoreData.map(d => (
                <div key={d.i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "100%", height: `${(d.score / maxScore) * 80}px`,
                    background: d.score > 60 ? C.red : d.score > 30 ? C.yellow : C.green,
                    borderRadius: "3px 3px 0 0", minHeight: 4,
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 6 }}>
              <span>Oldest</span><span>Most Recent</span>
            </div>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle icon="🔎" title="Detected Anomalies" sub="Flagged records from prediction history" />
        {displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ color: C.green, fontWeight: 700 }}>No anomalies detected!</p>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              {records.length === 0 ? "Make some predictions first." : "All predictions are within normal ranges."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayed.map(a => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                background: a.severity === "High" ? "rgba(248,81,73,0.08)" : "rgba(210,153,34,0.08)",
                border: `1px solid ${a.severity === "High" ? "rgba(248,81,73,0.3)" : "rgba(210,153,34,0.3)"}`,
                borderRadius: 8,
              }}>
                <span style={{ fontSize: 18 }}>{a.severity === "High" ? "🚨" : "⚠️"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: a.severity === "High" ? C.red : C.yellow }}>{a.severity}</div>
                  <div style={{ fontSize: 13, color: C.text }}>{a.message}</div>
                </div>
                <span style={{ fontSize: 11, color: C.muted }}>{a.time ? new Date(a.time.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')).toLocaleString() : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
