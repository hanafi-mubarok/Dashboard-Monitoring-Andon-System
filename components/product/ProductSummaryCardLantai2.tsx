'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { ProductSummaryLantai2 } from '@/lib/queries/production-progress-protrack';

interface ProductSummaryCardLantai2Props {
  data: ProductSummaryLantai2;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return '-';
  const d = new Date(date);
  const weekday = d.toLocaleDateString('id-ID', { weekday: 'short' });
  const datePart = d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return `${weekday},\u00A0${datePart}`;
}

function formatDayDeviation(plannedDate: Date | string | null, actualDate: Date | string | null) {
  if (!plannedDate || !actualDate) return null;

  const planned = new Date(plannedDate);
  const actual = new Date(actualDate);

  if (Number.isNaN(planned.getTime()) || Number.isNaN(actual.getTime())) return null;

  const plannedOnlyDate = new Date(planned.getFullYear(), planned.getMonth(), planned.getDate());
  const actualOnlyDate = new Date(actual.getFullYear(), actual.getMonth(), actual.getDate());

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((actualOnlyDate.getTime() - plannedOnlyDate.getTime()) / msPerDay);

  if (diffDays > 0) return `+${diffDays} hari`;
  if (diffDays < 0) return `${diffDays} hari`;
  return '0 hari';
}

function getStatusBadgeColor(status: string | null | undefined): string {
  if (!status) return 'bg-gray-600 text-gray-100';
  const s = String(status).toLowerCase().trim();
  
  if (s.includes('on progress') || s.includes('masuk')) return 'bg-amber-500/30 text-amber-300 border border-amber-500/50';
  if (s.includes('tunggu qc')) return 'bg-blue-500/30 text-blue-300 border border-blue-500/50';
  if (s.includes('finish good')) return 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50';
  if (s.includes('not ok')) return 'bg-red-500/30 text-red-300 border border-red-500/50';
  if (s.includes('gangguan') || s.includes('kurang')) return 'bg-red-500/30 text-red-300 border border-red-500/50';
  if (s.includes('qc')) return 'bg-purple-500/30 text-purple-300 border border-purple-500/50';
  
  return 'bg-gray-600 text-gray-100';
}

export default function ProductSummaryCardLantai2({ data }: ProductSummaryCardLantai2Props) {
  const percentage = Number(data.percentage ?? 0);
  const percentageCutting = Number(data.percentage_cutting ?? 0);
  const percentageMarking = Number(data.percentage_marking ?? 0);
  const dayDeviation = formatDayDeviation(data.tanggal_selesai, data.finish_actual);
  const qtyProgress = Number(data.qty_progress ?? 0);
  const qtyTotal = Number(data.total ?? 0);

  const [isExpanded, setIsExpanded] = useState(false);

  const [history, setHistory] = useState<any[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [missingSubProcess, setMissingSubProcess] = useState<any[] | null>(null);
  const [missingLoading, setMissingLoading] = useState(false);
  const [missingError, setMissingError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      if (!isExpanded) return;
      if (history !== null) return; // already fetched
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/product/protrack-history?id_product=${encodeURIComponent(String(data.id_product))}&trainset=${encodeURIComponent(String(data.trainset))}&line=${encodeURIComponent('Lantai 2')}`);
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json();
        if (!mounted) return;
        setHistory(json.data || []);
        setHistoryError(null);
      } catch (e) {
        if (!mounted) return;
        setHistoryError('Gagal memuat riwayat');
        setHistory([]);
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    };

    const fetchMissingSubProcess = async () => {
      if (!isExpanded) return;
      if (missingSubProcess !== null) return; // already fetched
      setMissingLoading(true);
      try {
        const res = await fetch(`/api/product/missing-subprocess?id_product=${encodeURIComponent(String(data.id_product))}&trainset=${encodeURIComponent(String(data.trainset))}&line=${encodeURIComponent('Lantai 2')}`);
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json();
        if (!mounted) return;
        setMissingSubProcess(json.data || []);
        setMissingError(null);
      } catch (e) {
        if (!mounted) return;
        setMissingError('Gagal memuat sub proses yang belum diinput');
        setMissingSubProcess([]);
      } finally {
        if (mounted) setMissingLoading(false);
      }
    };
    fetchHistory();
    fetchMissingSubProcess();
    return () => { mounted = false; };
  }, [isExpanded, data.id_product, data.trainset, history, missingSubProcess]);

  // Derived aggregates: prefer history values when available
  const averageFromHistory = (() => {
    if (history && Array.isArray(history) && history.length > 0) {
      const vals = (history as any[]).map((h: any) => (h.percentage != null ? Number(h.percentage) : NaN)).filter((v: number) => !Number.isNaN(v));
      if (vals.length > 0) return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
    }
    return null;
  })();

  const averagePercentageDisplay = Math.round(averageFromHistory ?? percentage);

  const sumActual = (() => {
    if (history && Array.isArray(history) && history.length > 0) {
      return (history as any[]).reduce((s: number, h: any) => s + Number(h.qty_progress ?? 0), 0);
    }
    return qtyProgress;
  })();

  const sumTotal = (() => {
    if (history && Array.isArray(history) && history.length > 0) {
      return (history as any[]).reduce((s: number, h: any) => s + Number(h.total ?? 0), 0);
    }
    return qtyTotal;
  })();

  return (
    <Card className="border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
      <CardContent className="px-4 py-3 sm:px-5 sm:py-2.5">
        <div className="grid gap-2">
          {/* Single-line header with summary on the right */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-[1.6fr_0.7fr_1fr_1fr_1fr_1fr_0.8fr_1fr_0.9fr_auto] lg:items-end lg:gap-2">
            {/* Product Name */}
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide">
                Nama Produk
              </p>
              <p className="mt-0.5 text-sm font-medium text-white sm:text-base">
                {String(data.product_name ?? '-')}
              </p>
            </div>

            {/* Trainset */}
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide">
                Trainset
              </p>
              <p className="mt-0.5 text-sm font-medium text-white sm:text-base">
                {String(data.trainset ?? '-')}
              </p>
            </div>

            {/* Jadwal Mulai */}
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide">
                Jadwal Mulai
              </p>
              <p className="mt-0.5 text-xs font-medium text-white sm:text-sm">
                {formatDate(data.tanggal_mulai)}
              </p>
            </div>

            {/* Jadwal Selesai */}
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide">
                Jadwal Selesai
              </p>
              <p className="mt-0.5 text-xs font-medium text-white sm:text-sm">
                {formatDate(data.tanggal_selesai)}
              </p>
            </div>

            {/* Mulai Actual */}
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide">
                Mulai Actual
              </p>
              <p className="mt-0.5 text-xs font-medium text-white sm:text-sm">
                {formatDate(data.start_actual)}
              </p>
            </div>

            {/* Selesai Actual */}
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide">
                Selesai Actual
              </p>
              <p className="mt-0.5 text-xs font-medium text-white sm:text-sm">
                {formatDate(data.finish_actual)}
              </p>
            </div>

            {/* Deviasi */}
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide">Deviasi</p>
              <p className={`mt-0.5 text-sm font-medium ${dayDeviation?.startsWith('+') ? 'text-amber-400' : dayDeviation?.startsWith('-') ? 'text-emerald-400' : 'text-gray-300'}`}>
                {dayDeviation ?? '-'}
              </p>
            </div>

            {/* Presentase (compact) - moved before Jumlah so all align in single row */}
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide">Presentase</p>
              <div className="mt-1.5 flex items-center gap-2 justify-end">
                <div className="relative h-2 w-36 overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                  />
                </div>
                <span className="min-w-fit rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400">
                  {Math.round(percentage)}%
                </span>
              </div>
            </div>

            {/* Jumlah */}
            <div className="flex flex-col items-end">
              <p className="text-xs font-semibold text-gray-400 tracking-wide">Jumlah</p>
              <p className="mt-1.5 text-base font-bold text-white">
                {qtyProgress.toLocaleString('id-ID')}/
                <span className="text-gray-400">{qtyTotal.toLocaleString('id-ID')}</span>
              </p>
            </div>

            {/* Expand button (placed after Jumlah) */}
            <div className="lg:justify-self-end">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail'}
                className="flex items-center justify-center rounded-md border border-gray-700 bg-gray-900 p-1.5 text-gray-300 transition hover:border-cyan-500 hover:bg-gray-800 hover:text-cyan-400"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {/* removed % Jumlah per request */}

            {/* removed duplicate expand button (now in header) */}
          </div>

          {/* If expanded, show history list */}
          {isExpanded && (
            <div className="border-t border-gray-700/50 pt-2">
              {historyLoading ? (
                <div className="py-4 text-center text-gray-400">Memuat riwayat...</div>
              ) : historyError ? (
                <div className="py-4 text-center text-red-400">{historyError}</div>
              ) : history && history.length > 0 ? (
                <div className="grid gap-2">
                  <div className="text-sm text-gray-300 mb-2">Riwayat Pengerjaan</div>
                  <div className="overflow-x-auto rounded-md scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
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
                          <div>
                            <a
                              href={"https://sinergi.ptrekaindo.co.id/product-tracking?q=" + encodeURIComponent(h.id_perproduct ?? `${data.id_product}/${data.trainset}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={h.id_perproduct ? `Buka tracking ${h.id_perproduct}` : `Buka tracking ${data.id_product}/${data.trainset}`}
                              className="inline-block"
                            >
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeColor(h.status)}`}>{h.status || '-'}</span>
                            </a>
                          </div>
                          <div className="text-center">{h.percentage != null ? `${Math.round(h.percentage)}%` : '-'}</div>
                          <div className="text-center">{h.qty_progress != null && h.total != null ? `${h.qty_progress}/${h.total}` : '-'}</div>
                          <div className="text-gray-400 text-xs whitespace-normal break-words leading-snug" title={h.note_qc || '-'}>{h.note_qc || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-sm text-gray-400">Belum ada riwayat.</div>
              )}
              
              {/* Section: Sub Proses yang Belum Diinput - Hanya tampilkan jika percentage < 100 */}
              {percentage < 100 && (
                <div className="border-t border-gray-700/50 mt-4 pt-4">
                  {missingLoading ? (
                    <div className="py-4 text-center text-gray-400">Memuat sub proses yang belum diinput...</div>
                  ) : missingError ? (
                    <div className="py-4 text-center text-red-400">{missingError}</div>
                  ) : missingSubProcess && missingSubProcess.length > 0 ? (
                    <div className="grid gap-2">
                      <div className="text-sm text-gray-300 mb-2">Sub Proses yang Belum Diinput</div>
                      <div className="overflow-x-auto rounded-md scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                        <div className="bg-gray-900/40 p-2 inline-block min-w-full">
                          <div className="grid gap-2 text-xs text-gray-400 px-2 py-1 font-semibold" style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 2fr 1fr' }}>
                            <div>Proses</div>
                            <div>Sub Proses</div>
                            <div>Sub Output</div>
                            <div>Qty Total</div>
                            <div>Status</div>
                          </div>
                          {missingSubProcess.map((m, idx) => (
                            <div key={idx} className="grid gap-2 items-start text-sm text-gray-200 px-2 py-2 border-t border-gray-800" style={{ gridTemplateColumns: '1.5fr 1.2fr 1fr 2fr 1fr' }}>
                              <div className="whitespace-normal break-words leading-snug">{m.proses || '-'}</div>
                              <div className="whitespace-normal break-words text-xs leading-snug">{m.sub_proses || '-'}</div>
                              <div className="whitespace-normal break-words text-xs leading-snug">{m.sub_output || '-'}</div>
                              <div className="text-xs">{m.qty_total || '-'}</div>
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-red-500/30 text-red-300 border border-red-500/50">
                                  <X className="h-3 w-3" />
                                  Belum Diinput
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-sm text-gray-400">Tidak ada sub proses yang belum diinput.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* per-card aggregate footer removed (moved to list-level) */}
        </div>
      </CardContent>
    </Card>
  );
}
