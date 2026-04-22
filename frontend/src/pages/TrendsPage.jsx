import React, { useEffect, useState } from "react";
import { C, Card, SectionTitle, pageStyle } from "../components/ui";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const genWeek = (base, noise) => DAYS.map(() => +(base + (Math.random() - 0.5) * noise).toFixed(1));

const WEEKLY = {
  Low:  genWeek(35, 20),
  Med:  genWeek(30, 15),
  High: genWeek(20, 10),
};

const MONTHLY = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  low: Math.floor(20 + Math.random() * 30),
  med: Math.floor(15 + Math.random() * 25),
  high: Math.floor(5 + Math.random() * 20),
}));

function MiniLineChart({ data, color, height = 60 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 300, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - ((v - min) / range) * h} r="4" fill={color} />
      ))}
    </svg>
  );
}

export default function TrendsPage() {
  const [records, setRecords] = useState([]);
  useEffect(() => {
    fetch("/recent?limit=100").then(r => r.json()).then(d => setRecords(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Group by day
  const byDay = {};
  records.forEach(r => {
    const day = r.created_at ? new Date(r.created_at.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')).toLocaleDateString() : "Unknown";
    if (!byDay[day]) byDay[day] = { Low: 0, Med: 0, High: 0 };
    if (byDay[day][r.prediction] !== undefined) byDay[day][r.prediction]++;
  });
  const dayKeys = Object.keys(byDay).slice(-7);

  return (
    <div style={pageStyle}>
      <SectionTitle icon="📉" title="Trend Analysis" sub="Stress level patterns over time" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Low Stress Trend", data: WEEKLY.Low, color: C.green },
          { label: "Med Stress Trend", data: WEEKLY.Med, color: C.yellow },
          { label: "High Stress Trend", data: WEEKLY.High, color: C.red },
        ].map(t => (
          <Card key={t.label}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>{t.label}</div>
            <MiniLineChart data={t.data} color={t.color} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {DAYS.map(d => <span key={d} style={{ fontSize: 10, color: C.muted }}>{d}</span>)}
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle icon="📅" title="Monthly Prediction Volume" sub="Predictions per month by stress level" />
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 8, minWidth: 600 }}>
            {MONTHLY.map(m => {
              const total = m.low + m.med + m.high;
              return (
                <div key={m.month} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column-reverse", height: 120, gap: 2, justifyContent: "flex-start" }}>
                    <div style={{ height: `${(m.low / total) * 100}%`, background: C.green, borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                    <div style={{ height: `${(m.med / total) * 100}%`, background: C.yellow, minHeight: 4 }} />
                    <div style={{ height: `${(m.high / total) * 100}%`, background: C.red, borderRadius: "0 0 4px 4px", minHeight: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{m.month}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
            {[["Low", C.green], ["Med", C.yellow], ["High", C.red]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon="📆" title="Recent Daily Breakdown" sub="Last 7 days from your prediction history" />
        {dayKeys.length === 0 ? (
          <p style={{ color: C.muted, textAlign: "center", padding: 24 }}>No data yet. Make some predictions first!</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Date", "Low ✅", "Med ⚠️", "High 🚨", "Total"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "center", color: C.muted, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayKeys.map(day => {
                  const d = byDay[day];
                  return (
                    <tr key={day} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "10px 12px", color: C.text }}>{day}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: C.green, fontWeight: 700 }}>{d.Low}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: C.yellow, fontWeight: 700 }}>{d.Med}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: C.red, fontWeight: 700 }}>{d.High}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: C.blue, fontWeight: 700 }}>{d.Low + d.Med + d.High}</td>
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
