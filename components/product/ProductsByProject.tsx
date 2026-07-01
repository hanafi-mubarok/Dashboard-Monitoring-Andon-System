"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductsByProjectProps {
  project: string;
  trainset: number | string;
}

interface ProductRow {
  id: number;
  project_name: string | null;
  id_product: number | null;
  product_name: string | null;
  trainset: number | null;
  sub_output: string | null;
  jumlah_tiapts: number | null;
  line: string | null;
  jumlah_selesai: number | null;
  progress_actual: number | null;
}

export default function ProductsByProject({ project, trainset }: ProductsByProjectProps) {
  const [data, setData] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = `/api/project/products?project=${encodeURIComponent(project)}&trainset=${trainset}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to fetch products by project");
        const json = await res.json();
        const rows = Array.isArray(json.data) ? json.data : (json.data ?? []);
        setData(rows as ProductRow[]);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data produk");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (project && String(trainset) !== '') fetchData();
  }, [project, trainset]);

  if (loading) return <div className="text-sm text-gray-400">Memuat data produk...</div>;
  if (error) return <div className="text-sm text-red-400">{error}</div>;
  if (data.length === 0) return <div className="text-sm text-gray-400">Tidak ada produk untuk project ini.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400">
            <th className="p-2">No.</th>
            <th className="p-2">ID Product</th>
            <th className="p-2">Nama Produk</th>
            <th className="p-2">Sub Output</th>
            <th className="p-2">Line</th>
            <th className="p-2 text-right">Jumlah (Selesai/TS)</th>
            <th className="p-2">Presentase</th>
            <th className="p-2">Detail</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const pct = row.progress_actual != null ? Math.max(0, Math.min(100, Number(row.progress_actual))) : 0;
            return (
              <>
                <tr key={`${row.id_product ?? row.id}-${idx}`} className="border-t border-gray-800">
                  <td className="p-2 text-gray-200">{idx + 1}</td>
                  <td className="p-2 text-gray-200">{row.id_product ?? '-'}</td>
                  <td className="p-2 text-gray-200">{row.product_name ?? '-'}</td>
                  <td className="p-2 text-gray-200">{row.sub_output ?? '-'}</td>
                  <td className="p-2 text-gray-200">{row.line ?? '-'}</td>
                  <td className="p-2 text-center text-gray-200">
                    <div>
                      <span className="font-semibold">{row.jumlah_selesai != null ? Number(row.jumlah_selesai).toLocaleString('id-ID') : '-'}</span>
                      <span className="text-gray-400">/{row.jumlah_tiapts != null ? Number(row.jumlah_tiapts).toLocaleString('id-ID') : '-'}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="relative h-2 w-24 overflow-hidden rounded-full bg-gray-700">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="min-w-fit rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400">
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </td>

                  {/* Detail expand button column */}
                  <td className="p-2">
                    <button
                      onClick={() => {
                        const k = `${row.id_product ?? row.id}-${row.trainset ?? ''}`;
                        setExpandedKey((prev) => (prev === k ? null : k));
                      }}
                      className="flex items-center justify-center rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-gray-300 hover:border-cyan-500 hover:bg-gray-800 hover:text-cyan-400"
                      type="button"
                      aria-label="Toggle detail"
                    >
                      {expandedKey === `${row.id_product ?? row.id}-${row.trainset ?? ''}` ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>

                {/* Expanded panel: render summary card based on line */}
                {expandedKey === `${row.id_product ?? row.id}-${row.trainset ?? ''}` && (
                  <tr>
                    <td colSpan={8} className="p-2 bg-gray-900/30 border-t-4 border-cyan-600/40">
                      <div className="p-2">
                        <InlineProductDetails
                          id_product={row.id_product}
                          trainset={row.trainset}
                          line={row.line}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InlineProductDetails({ id_product, trainset, line }: { id_product: number | null; trainset: number | null; line: string | null }) {
  const [history, setHistory] = useState<any[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [missing, setMissing] = useState<any[] | null>(null);
  const [missingLoading, setMissingLoading] = useState(false);
  const [missingError, setMissingError] = useState<string | null>(null);

  // For Lantai 3: use production_progress detail API (same as ProductSummaryCard)
  const [detailL3, setDetailL3] = useState<any[] | null>(null);
  const [detailL3Loading, setDetailL3Loading] = useState(false);
  const [detailL3Error, setDetailL3Error] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const id = id_product;
    const ts = trainset;
    if (id == null || ts == null) return;

    // If Lantai 3, fetch detail from production_progress via detail-by-product endpoint
    if (String(line)?.trim() === 'Lantai 3') {
      const fetchL3 = async () => {
        setDetailL3Loading(true);
        try {
          const res = await fetch(`/api/product/detail-by-product?trainset=${encodeURIComponent(String(ts))}&id_product=${encodeURIComponent(String(id))}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('fetch detail L3 failed');
          const json = await res.json();
          if (!mounted) return;
          setDetailL3(Array.isArray(json.data) ? json.data : (json.data || []));
          setDetailL3Error(null);
        } catch (e) {
          if (!mounted) return;
          setDetailL3([]);
          setDetailL3Error('Gagal memuat detail Lantai 3');
        } finally {
          if (mounted) setDetailL3Loading(false);
        }
      };

      // still fetch missing subprocess for visibility
      const fetchMissing = async () => {
        setMissingLoading(true);
        try {
          const res = await fetch(`/api/product/missing-subprocess?id_product=${encodeURIComponent(String(id))}&trainset=${encodeURIComponent(String(ts))}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('fetch missing failed');
          const json = await res.json();
          if (!mounted) return;
          setMissing(Array.isArray(json.data) ? json.data : (json.data || []));
          setMissingError(null);
        } catch (e) {
          if (!mounted) return;
          setMissing([]);
          setMissingError('Gagal memuat sub proses');
        } finally {
          if (mounted) setMissingLoading(false);
        }
      };

      fetchL3();
      fetchMissing();
    } else {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          const res = await fetch(`/api/product/protrack-history?id_product=${encodeURIComponent(String(id))}&trainset=${encodeURIComponent(String(ts))}&line=${encodeURIComponent(String(line ?? ''))}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('fetch history failed');
          const json = await res.json();
          if (!mounted) return;
          setHistory(Array.isArray(json.data) ? json.data : (json.data || []));
          setHistoryError(null);
        } catch (e) {
          if (!mounted) return;
          setHistory([]);
          setHistoryError('Gagal memuat riwayat');
        } finally {
          if (mounted) setHistoryLoading(false);
        }
      };

      const fetchMissing = async () => {
        setMissingLoading(true);
        try {
          const res = await fetch(`/api/product/missing-subprocess?id_product=${encodeURIComponent(String(id))}&trainset=${encodeURIComponent(String(ts))}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('fetch missing failed');
          const json = await res.json();
          if (!mounted) return;
          setMissing(Array.isArray(json.data) ? json.data : (json.data || []));
          setMissingError(null);
        } catch (e) {
          if (!mounted) return;
          setMissing([]);
          setMissingError('Gagal memuat sub proses');
        } finally {
          if (mounted) setMissingLoading(false);
        }
      };

      fetchHistory();
      fetchMissing();
    }
    return () => { mounted = false; };
  }, [id_product, trainset, line]);

  return (
    <div>
      {/* History table */}
      <div className="mb-3 border-t-2 border-gray-600/80 pt-3 rounded-lg border border-gray-700/50 bg-gray-900/30 p-2">
        <div className="text-sm font-semibold text-gray-300 mb-2">Riwayat Pengerjaan</div>
          {(() => {
            // Render Lantai 3 detail (production_progress style) or history
            if (String(line)?.trim() === 'Lantai 3') {
              if (detailL3Loading) return (<div className="rounded-lg border border-gray-700/50 bg-gray-900/40 px-4 py-6 text-center text-sm text-gray-400">Memuat detail produk...</div>);
              if (detailL3Error) return (<div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-6 text-center text-sm text-red-300">{detailL3Error}</div>);
              if (detailL3 && detailL3.length === 0) return (<div className="rounded-lg border border-gray-700/50 bg-gray-900/40 px-4 py-6 text-center text-sm text-gray-400">Tidak ada data detail untuk produk ini.</div>);

              return (
                <div className="overflow-x-auto rounded-lg border border-gray-700/50 bg-gray-900/30">
                  <div className="min-w-[920px]">
                    <div className="grid grid-cols-[0.45fr_1.1fr_1.3fr_1.2fr_1.2fr_0.9fr_0.9fr] gap-3 border-b border-gray-700/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      <div>No.</div>
                      <div>Serial Number</div>
                      <div>Nama Operator</div>
                      <div>Tanggal Mulai</div>
                      <div>Tanggal Selesai</div>
                      <div>Durasi</div>
                      <div>Status</div>
                    </div>

                    <div className="divide-y divide-gray-700/40">
                      {(detailL3 || []).map((item: any, index: number) => (
                        <div key={String(item.id_perproduct ?? index)} className="grid grid-cols-[0.45fr_1.1fr_1.3fr_1.2fr_1.2fr_0.9fr_0.9fr] gap-3 px-4 py-3 text-sm text-white">
                          <div className="font-medium text-gray-100">{index + 1}</div>
                          <div className="font-medium text-gray-100">{String(item.id_perproduct ?? '-')}</div>
                          <div className="text-gray-200">{String(item.operator_actual_name ?? '-')}</div>
                          <div className="text-gray-300">{item.start_actual ? new Date(item.start_actual).toLocaleString('id-ID', { weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                          <div className="text-gray-300">{item.finish_actual ? new Date(item.finish_actual).toLocaleString('id-ID', { weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                          <div className="text-gray-200">{item.durasi_jam != null ? `${Math.trunc(Number(item.durasi_jam))} jam` : '-'}</div>
                          <div><a href={`https://sinergi.ptrekaindo.co.id/product-tracking?q=${encodeURIComponent(String(item.id_perproduct ?? ''))}`} target="_blank" rel="noreferrer" className={`inline-flex min-w-28 justify-center rounded-full px-3 py-1 text-xs font-semibold transition hover:scale-[1.02] hover:opacity-90 ${item.status ? 'bg-gray-700 text-white' : 'bg-gray-600 text-gray-100'}`}>{String(item.status ?? '-')}</a></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            // Non-Lantai 3: history
            if (historyLoading) return (<div className="text-sm text-gray-400">Memuat riwayat...</div>);
            if (historyError) return (<div className="text-sm text-red-400">{historyError}</div>);
            if (history && history.length > 0) {
              return (
                <div className="overflow-x-auto rounded-md">
                  <div className="bg-gray-900/40 p-2 inline-block min-w-full">
                    <div className="grid gap-2 text-xs text-gray-400 px-2 py-1 font-semibold" style={{ gridTemplateColumns: '1.5fr 1.2fr 1.2fr 1fr 1.3fr 1.1fr 0.8fr 1fr 2fr' }}>
                      <div>Operator</div>
                      <div>Proses</div>
                      <div>Sub Output</div>
                      <div>Sub Proses</div>
                      <div>Mulai</div>
                      <div>Status</div>
                      <div>Presentase</div>
                      <div>Qty/Total</div>
                      <div>Catatan</div>
                    </div>
                    {history.map((h, idx) => (
                      <div key={idx} className="grid gap-2 items-start text-sm text-gray-200 px-2 py-2 border-t border-gray-800" style={{ gridTemplateColumns: '1.5fr 1.2fr 1.2fr 1fr 1.3fr 1.1fr 0.8fr 1fr 2fr' }}>
                        <div className="whitespace-normal break-words leading-snug">{h.operator_actual_name || '-'}</div>
                        <div className="whitespace-normal break-words leading-snug">{h.process_name || '-'}</div>
                        <div className="whitespace-normal break-words text-xs leading-snug">{h.sub_output || '-'}</div>
                        <div className="whitespace-normal break-words text-xs leading-snug">{h.sub_process || '-'}</div>
                        <div className="text-xs">{h.start_actual ? new Date(h.start_actual).toLocaleString('id-ID', { weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                        <div><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.status ? 'bg-gray-700 text-white' : 'bg-gray-600 text-gray-100'}`}>{h.status || '-'}</span></div>
                        <div className="text-center">{h.percentage != null ? `${Math.round(h.percentage)}%` : '-'}</div>
                        <div className="text-center">{h.qty_progress != null && h.total != null ? `${h.qty_progress}/${h.total}` : '-'}</div>
                        <div className="text-gray-400 text-xs whitespace-normal break-words leading-snug" title={h.note_qc || '-'}>{h.note_qc || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return (<div className="text-sm text-gray-400">Belum ada riwayat.</div>);
          })()}
      </div>

      {/* Missing subprocess table - hide when Lantai 3 */}
      {String(line)?.trim() !== 'Lantai 3' && (
        <div className="mt-4 border-t-2 border-gray-500/40 border-dashed pt-3 rounded-lg border border-gray-700/50 bg-gray-900/30 p-2">
          <div className="text-sm font-semibold text-gray-300 mb-2">Sub Proses yang Belum Diinput</div>
          {missingLoading ? (
            <div className="text-sm text-gray-400">Memuat sub proses...</div>
          ) : missingError ? (
            <div className="text-sm text-red-400">{missingError}</div>
          ) : missing && missing.length > 0 ? (
            <div className="overflow-x-auto rounded-md">
              <div className="bg-gray-900/40 p-2 inline-block min-w-full">
                <div className="grid gap-2 text-xs text-gray-400 px-2 py-1 font-semibold" style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 2fr 1fr' }}>
                  <div>Proses</div>
                  <div>Sub Proses</div>
                  <div>Sub Output</div>
                  <div>Qty Total</div>
                  <div>Status</div>
                </div>
                {missing.map((m, idx) => (
                  <div key={idx} className="grid gap-2 items-start text-sm text-gray-200 px-2 py-2 border-t border-gray-800" style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 2fr 1fr' }}>
                    <div className="whitespace-normal break-words leading-snug">{m.proses || '-'}</div>
                    <div className="whitespace-normal break-words text-xs leading-snug">{m.sub_proses || '-'}</div>
                    <div className="whitespace-normal break-words text-xs leading-snug">{m.sub_output || '-'}</div>
                    <div className="text-xs">{m.qty_total || '-'}</div>
                    <div><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-red-500/30 text-red-300 border border-red-500/50">Belum Diinput</span></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Tidak ada sub proses yang belum diinput.</div>
          )}
        </div>
      )}
    </div>
  );
}


