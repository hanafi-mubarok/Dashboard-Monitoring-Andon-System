"use client";

import React from "react";
import { formatQtyK, formatRupiah } from "@/components/material/pengadaan-utils";

export default function PengadaanTopProjects({ topProjects }) {
  return (
    <div className="pd-right">
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#cfe0ff" }}>Project dengan Pengadaan Terbanyak</h3>
      <div className="pd-top-list">
        {(topProjects || []).map((p, i) => {
          const code = p.project_code ?? p.project ?? "-";
          const perc = Number(p.percentage ?? p.precentage ?? 0);
          const qty = p.total_qty ?? 0;
          const rp = p.total_rp ?? 0;
          const filled = Math.max(0, Math.min(100, perc));
          const leftColor = "#0b2b73";
          const rightColor = "#06204a";
          const bg = `linear-gradient(90deg, ${leftColor} 0%, ${leftColor} ${filled}%, ${rightColor} ${filled}%, ${rightColor} 100%)`;
          return (
            <div key={`${code}-${i}`} className="pd-top-card" style={{ background: bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{code}</div>
                <div style={{ fontSize: 12, fontWeight: 800, background: "rgba(255,255,255,0.08)", padding: "6px 8px", borderRadius: 8 }}>{perc}%</div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.95 }}>
                Qty Item : {formatQtyK(qty)} - Rp. {formatRupiah(rp)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
