"use client";

import React from "react";

export default function PengadaanMetrics({ data }) {
  const cards = [
    { label: "Average Total Lead Time", value: data.avg_leadtime },
    { label: "Average Lead Time PR-PO", value: data.avg_pr_po },
    { label: "Average Lead Time PO-GR", value: data.avg_po_arrival },
    { label: "Ketepatan Waktu", value: `${data.on_time_percentage}%` },
    { label: "Deviasi Qty PR-PO", value: `${data.dev_qty_pr_po}%` },
    { label: "Deviasi Qty PO-GR", value: `${data.dev_qty_po_gr}%` },
  ];

  return (
    <div className="pd-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginTop: "28px", marginBottom: "28px", padding: "0 4px" }}>
      {cards.map((card) => (
        <div key={card.label} className="pd-metric-card" style={{ background: "linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 30, 89, 0.6) 100%)", border: "1px solid rgba(79, 172, 254, 0.25)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)", backdropFilter: "blur(10px)" }}>
          <div className="pd-metric-label" style={{ fontSize: "10px", opacity: "0.9", color: "#ffffff", fontWeight: "500", lineHeight: "1.3", wordBreak: "break-word" }}>{card.label}</div>
          <div className="pd-metric-value" style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.5px" }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
