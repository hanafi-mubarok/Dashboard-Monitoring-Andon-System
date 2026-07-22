"use client";

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
  const s = String(status || "");
  const normalized = s.toLowerCase();
  let colorClass = "bg-gray-600 text-white";
  let label = "-";

  if (normalized.includes("dibatalkan") || normalized.includes("batal")) {
    colorClass = "bg-gray-400 text-white";
    label = "X";
  } else if (/\bproses\s*pr\b/.test(normalized) || /\bpr\b/.test(normalized)) {
    colorClass = "bg-red-500 text-white";
    label = "PR";
  } else if (/\bproses\s*po\b/.test(normalized) || /\bpo\b/.test(normalized)) {
    colorClass = "bg-amber-400 text-black";
    label = "PO";
  } else if (normalized.includes("diterima") || /\bgr\b/.test(normalized)) {
    colorClass = "bg-emerald-500 text-white";
    label = "GR";
  } else if (normalized.includes("reservasi") || /\breservasi\b/.test(normalized)) {
    colorClass = "bg-gray-500 text-white";
    label = "RES";
  }

  return (
    <div className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[10px] font-semibold ${colorClass} pulse-badge`}>
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
  const parsed = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : Number(value);
  return Number.isFinite(parsed) ? parsed : "-";
}

export function parseLeadTime(value) {
  const parsed = typeof value === "string" ? Number(String(value).replace(/[^\d.-]/g, "")) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getEffectiveStatus(status, qtyRequested, qtyOrdered) {
  const qtyReq = Number(qtyRequested) || 0;
  const qtyOrd = Number(qtyOrdered) || 0;
  if (qtyOrd < qtyReq && qtyReq > 0) {
    return "proses pr";
  }
  return status;
}

export function renderMaterialQuantities(item) {
  const s = String(item.status || "").toLowerCase();
  const qtyRequested = item.qty_requested ?? "-";
  const qtyOrdered = item.qty_ordered ?? "-";
  const qtyArrived = item.qty_arrived ?? "-";
  const unit = item.satuan ?? "";

  if (/\b(proses\s*pr|pr)\b/.test(s)) {
    return <div className="text-[11px] text-gray-300 mt-1">Qty PR {qtyRequested}{unit}</div>;
  }

  if (/\b(proses\s*po|po)\b/.test(s)) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-300">
        <span>Qty PR {qtyRequested}{unit}</span>
        <span>Qty PO {qtyOrdered}{unit}</span>
      </div>
    );
  }

  if (s.includes("diterima") || /\bgr\b/.test(s)) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-300">
        <span>Qty PR {qtyRequested}{unit}</span>
        <span>Qty PO {qtyOrdered}{unit}</span>
        <span>Qty GR {qtyArrived}{unit}</span>
      </div>
    );
  }

  return <div className="text-[11px] text-gray-300 mt-1">Qty Req {qtyRequested}{unit}</div>;
}
