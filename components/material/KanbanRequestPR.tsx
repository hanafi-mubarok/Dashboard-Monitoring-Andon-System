import React from "react";

export interface kanban_req_pr {
  no_surat: string;
  pic: string;
  tanggal: string;
  project_name: string;
  jumlah_item: number;
  jumlah_item_diproses: number;
  persentase_diproses: number;
  link: string;
}

function formatDateOnly(d?: string) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function KanbanRequestPR({ data }: { data?: kanban_req_pr[] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-gray-500 text-sm mt-4 text-center">Belum ada data</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <div
          key={r.no_surat}
          className="bg-slate-900 border border-slate-700 hover:border-gray-500 transition-colors rounded-lg p-3"
        >
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
            <div className="space-y-0.5 min-w-0 leading-tight">
              <div className="text-sm font-semibold text-white truncate">{r.project_name ?? r.no_surat}</div>
              <div className="text-xs text-gray-300 truncate">{r.no_surat}</div>
              <div className="text-xs text-gray-400">PIC</div>
              <div className="text-xs text-gray-300 mt-0.5 truncate">{r.pic}</div>
              <div className="text-xs text-gray-400">Tanggal</div>
              <div className="text-xs text-gray-300 mt-0.5 truncate">{formatDateOnly(r.tanggal)}</div>
            </div>

            <div className="flex flex-col gap-1 text-right shrink-0 leading-tight">
              <div className="text-xs font-semibold text-white">{r.jumlah_item_diproses ?? 0} / {r.jumlah_item ?? '-'}</div>
              <div className="text-xs text-gray-300 mt-0.5">{r.persentase_diproses ?? 0}%</div>
              {r.link ? (
                <a href={r.link} className="text-xs text-cyan-300 mt-1 underline" target="_blank" rel="noreferrer">Lihat</a>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
