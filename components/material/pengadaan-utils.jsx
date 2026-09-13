"use client";

import { Check } from "lucide-react";

export const FUNNEL_MAX_WIDTH = 300;
export const H = { pr: 108, po: 108, arrival: 130 };
export const TOTAL_HEIGHT = H.pr + H.po + H.arrival;
export const TOP_RIM_GUARD = 22;
export const MAX_FILL_RATIO = 0.82;

export const STAGE_META = [
  { key: "pr", label: "PR", colorFrom: "#f6867e", colorTo: "#c9302b", rim: "#fbb2ac", hole: "#8f221e", cardBg: "#e0433c" },
  { key: "po", label: "PO", colorFrom: "#f8b45f", colorTo: "#d6720d", rim: "#fbd19a", hole: "#a3540a", cardBg: "#e8790f" },
  { key: "arrival", label: "GR", colorFrom: "#5be08a", colorTo: "#128a44", rim: "#a6f0c2", hole: "#0c6633", cardBg: "#15803d" },
];

export const RENDER_ORDER = ["arrival", "po", "pr"];

export function formatRupiah(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)} M`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} Jt`;
  }
  return num.toLocaleString("id-ID");
}

export function formatQtyK(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)} Jt`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)} K`;
  }
  return `${Math.floor(num)}`;
}

export function formatDateOnly(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("id-ID");
}

export function frustumPath(cx, y, h, topWidth, bottomWidth) {
  const leftTop = cx - topWidth / 2;
  const rightTop = cx + topWidth / 2;
  const leftBottom = cx - bottomWidth / 2;
  const rightBottom = cx + bottomWidth / 2;
  return `M ${leftTop} ${y} L ${rightTop} ${y} L ${rightBottom} ${y + h} L ${leftBottom} ${y + h} Z`;
}

export function renderStatusBadge(status) {
  const s = String(status || "").trim();
  const normalized = s.toLowerCase();
  let colorClass = "bg-gray-600 text-white";
  let label = "-";

  // robust matching for common status variants
  if (normalized.includes("batal") || normalized.includes("dibatalkan")) {
    colorClass = "bg-gray-400 text-white";
    label = "X";
  } else if (normalized.includes("reservasi")) {
    colorClass = "bg-gray-500 text-white";
    label = "RES";
  } else if (/\b(proses\s*po|po)\b/.test(normalized)) {
    colorClass = "bg-amber-400 text-black";
    label = "PO";
  } else if (/\b(proses\s*pr|pr)\b/.test(normalized)) {
    colorClass = "bg-red-500 text-white";
    label = "PR";
  } else if (normalized.includes("diterima") || /\bgr\b/.test(normalized)) {
    colorClass = "bg-emerald-500 text-white";
    label = <Check className="h-4 w-4" strokeWidth={3} />;

  }

  return (
    <div className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-[11px] font-semibold ${colorClass} pulse-badge`} title={s}>
      {label}
    </div>
  );
}

export function getAvgLeadTimePrBadgeClass(value) {
  const parsed = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : Number(value);
  if (!Number.isFinite(parsed)) return "border-0 text-xs font-semibold bg-gray-600 text-white";
  if (parsed >= 90) return "border-0 text-xs font-semibold bg-gray-600 text-white";
  if (parsed >= 30) return "border-0 text-xs font-semibold bg-red-600 text-white";
  if (parsed >= 15) return "border-0 text-xs font-semibold bg-amber-400 text-black";
  if (parsed < 15) return "border-0 text-xs font-semibold bg-blue-600 text-white";
  return "border-0 text-xs font-semibold bg-slate-500 text-white";
}

export function formatAvgLeadTimePr(value) {
  const parsed = typeof value === 'string' ? Number(String(value).replace(/[^\d.-]/g, '')) : Number(value);
  return Number.isFinite(parsed) ? parsed : '-';
}

export function parseLeadTime(value) {
  const parsed = typeof value === "string" ? Number(String(value).replace(/[^\d.-]/g, "")) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getEffectiveStatus(status, qtyRequested, qtyOrdered, qtyArrived) {
  const s = String(status || "").toLowerCase();
  const qtyReq = Number(qtyRequested) || 0;
  const qtyOrd = Number(qtyOrdered) || 0;
  const qtyArr = Number(qtyArrived) || 0;

  // Preserve explicit cancel/reservasi statuses
  if (s.includes("batal") || s.includes("dibatalkan")) return status;
  if (s.includes("reservasi")) return status;
  // If arrived quantity exists, treat as received (GR)
  if (qtyArr > 0) return "diterima";

  // If some quantity has been ordered, treat as PO
  if (qtyOrd > 0) return "po";

  //  // If ordered < requested then still PR
  if (qtyReq > 0 && qtyOrd <= qtyReq) return "pr";

  return status;
}

export function renderMaterialQuantities(item, showAllQuantities = false) {
  const s = String(item.status || "").toLowerCase();
  const qtyResCount = Number(item.qty) || 0;
  const qtyRequestedCount = Number(item.qty_requested) || 0;
  const qtyOrderedCount = Number(item.qty_ordered) || 0;
  const qtyArrivedCount = Number(item.qty_arrived) || 0;
  const qtyRes = qtyResCount.toString();
  const qtyRequested = qtyRequestedCount.toString();
  const qtyOrdered = qtyOrderedCount.toString();
  const qtyArrived = qtyArrivedCount.toString();
  const unit = item.satuan ? ` ${item.satuan}` : "";

  const tags = [];
  if (showAllQuantities) {
    if (qtyResCount > 0) tags.push(`Qty Res ${qtyRes}${unit}`);
    if (qtyRequestedCount > 0) tags.push(`Qty PR ${qtyRequested}${unit}`);
    if (qtyOrderedCount > 0) tags.push(`Qty PO ${qtyOrdered}${unit}`);
    if (qtyArrivedCount > 0) tags.push(`Qty GR ${qtyArrived}${unit}`);

    return tags.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-300">
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    ) : null;
  }

  if (/\b(proses\s*pr|pr)\b/.test(s)) {
    return qtyRequestedCount > 0 ? <div className="text-[11px] text-gray-300 mt-1">Qty PR {qtyRequested}{unit}</div> : null;
  }

  if (/\b(proses\s*po|po)\b/.test(s)) {
    const items = [];
    if (qtyRequestedCount > 0) items.push(`Qty PR ${qtyRequested}${unit}`);
    if (qtyOrderedCount > 0) items.push(`Qty PO ${qtyOrdered}${unit}`);
    return items.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-300">
        {items.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    ) : null;
  }

  if (s.includes("diterima") || /\bgr\b/.test(s)) {
    const items = [];
    if (qtyRequestedCount > 0) items.push(`Qty PR ${qtyRequested}${unit}`);
    if (qtyOrderedCount > 0) items.push(`Qty PO ${qtyOrdered}${unit}`);
    if (qtyArrivedCount > 0) items.push(`Qty GR ${qtyArrived}${unit}`);
    return items.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-300">
        {items.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    ) : null;
  }

  return qtyRequestedCount > 0 ? <div className="text-[11px] text-gray-300 mt-1">Qty Req {qtyRequested}{unit}</div> : null;
}
