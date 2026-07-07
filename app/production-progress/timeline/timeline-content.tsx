'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MapPin, Users, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, PauseCircle, ChevronDown } from "lucide-react";
import Elapsed from "@/components/ui/elapsed";
import ProductionProgressTable from "@/components/production/ProductionProgressTable";
import type { ProductionStats, WorkstationStats, ProductionProgress, CurrentWorkstationProgress, WorkstationDuration, ProductionEstimate, ProductStatusCard, ProductStatusSummary, OperatorStats, AbnormalProgress } from "@/lib/queries/production-progress";

interface TimelineContentProps {
  initialStats: ProductionStats;
  initialWorkstations: WorkstationStats[];
  initialRecent: ProductionProgress[];
  initialCurrent: CurrentWorkstationProgress[];
  initialDurations: WorkstationDuration[];
  initialEstimate: ProductionEstimate | null;
  initialCards: ProductStatusCard[];
  initialStatusSummary?: ProductStatusSummary | null;
  initialOperators: OperatorStats[];
  initialAbnormal?: AbnormalProgress[];
  forcedStep?: number;
  lineLabel: string;
  apiLine: string;
  workshop?: string;
  showWorkstationTimeline?: boolean;
}

function formatEst(duration?: string | null) {
  if (!duration) return "—";
  const parts = duration.split(":");
  if (parts.length < 3) return duration;
  const [hh, mm, ss] = parts;
  return `${hh}j ${mm}m ${ss}d`;
}
{/*const arrowAnimationStyle = `
  @keyframes slideArrow {
    0% { transform: translateX(0); opacity: 0.3; }
    50% { opacity: 1; }
    100% { transform: translateX(20px); opacity: 0.3; }
  }
  .animate-slide-arrow {
    animation: slideArrow 1.5s ease-in-out infinite;
  }
`;
\/ End of arrow animation style */}

function formatDurationSec(sec: number | null | undefined) {
  if (sec === null || sec === undefined) return "—";
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}j ${m}m ${s}d`;
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return `${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatDateOnly(value?: Date | string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPercentage(value?: number | string | null) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${num}%`;
}

function formatProgressCount(card: ProductStatusCard) {
  const qtyProgress = Number(card.qty_progress);
  const total = Number(card.total);
  if (!Number.isFinite(qtyProgress) || !Number.isFinite(total)) return "Proses";
  return `${qtyProgress} / ${total}`;
}

function parseWsFromStatus(status?: string | null): number | undefined {
  if (!status) return undefined;
  const match = status.match(/WS\s*(\d+)/i);
  if (match) return Number(match[1]);
  return undefined;
}

function pickCurrentStep(
  recent: ProductionProgress[],
  workstations: WorkstationStats[],
  fallback?: number
) {
  if (fallback) return fallback;

  const active = recent.find((r) => !r.finish_actual);
  if (active?.workstation) return Number(active.workstation);

  const partially = workstations.find((w) => (w.completed ?? 0) < (w.total_processes ?? 0));
  if (partially?.workstation) return partially.workstation;

  return workstations[0]?.workstation ?? 1;
}

function statusVariant(status?: string) {
  if (!status) return { bg: "bg-gray-700", border: "border-gray-500", text: "text-white", blink: false };
  const lower = status.toLowerCase();
  if (lower.includes("gangguan")) {
    return { bg: "bg-rose-600", border: "border-rose-400", text: "text-white", blink: true };
  }
  if (lower.includes("istirahat")) {
    return { bg: "bg-amber-400", border: "border-amber-300", text: "text-gray-900", blink: true };
  }
  if (lower.includes("selesai kit")) {
    return { bg: "bg-blue-500", border: "border-blue-300", text: "text-white", blink: false };
  }
  if (lower.includes("masuk") || lower.includes("on progress")) {
    return { bg: "bg-emerald-500", border: "border-emerald-300", text: "text-white", blink: true };
  }
  if (lower.includes("tunggu qc")) {
    return { bg: "bg-blue-500", border: "border-blue-300", text: "text-white", blink: false };
  }
  return { bg: "bg-gray-700", border: "border-gray-500", text: "text-white", blink: false };
}

function getStatusColor(status?: string | null) {
  if (!status) return { bg: 'bg-gray-700/20', border: 'border-gray-600', text: 'text-gray-300' };
  
  const lower = status.toLowerCase();
  if (lower.includes('gangguan')) {
    return { bg: 'bg-rose-900/30', border: 'border-rose-600', text: 'text-rose-300' };
  }
  if (lower.includes('istirahat')) {
    return { bg: 'bg-amber-900/30', border: 'border-amber-600', text: 'text-amber-300' };
  }
  if (lower.includes('masuk') || lower.includes('on progress')) {
    return { bg: 'bg-emerald-900/30', border: 'border-emerald-600', text: 'text-emerald-300' };
  }
  if (lower.includes('not ok') || lower.includes('tidak ok')) {
    return { bg: 'bg-red-900/30', border: 'border-red-600', text: 'text-red-300' };
  }
  if (lower.includes('tunggu qc')) {
    return { bg: 'bg-blue-900/30', border: 'border-blue-600', text: 'text-blue-300' };
  }
  if (lower.includes('login')) {
    return { bg: 'bg-blue-900/30', border: 'border-blue-600', text: 'text-blue-300' };
  }
  if (lower.includes('logout')) {
    return { bg: 'bg-orange-900/30', border: 'border-orange-600', text: 'text-orange-300' };
  }
  
  return { bg: 'bg-gray-700/20', border: 'border-gray-600', text: 'text-gray-300' };
}

export default function TimelineContent({
  initialStats,
  initialWorkstations,
  initialRecent,
  initialCurrent,
  initialDurations,
  initialEstimate,
  initialCards,
  initialStatusSummary,
  initialOperators,
  initialAbnormal,
  forcedStep,
  lineLabel,
  apiLine,
  workshop,
  showWorkstationTimeline = true,
}: TimelineContentProps) {
  const normalizedLine = (apiLine ?? "").trim().toLowerCase();
  const normalizedWorkshop = workshop?.trim().toLowerCase() ?? "";
  const isLantai12 = normalizedLine === "lantai 1" || normalizedLine === "lantai 2";
  const isLantai3 = normalizedLine === "lantai 3";
  const isWorkshopPage = normalizedWorkshop === "sukosari" || normalizedWorkshop === "tiron";
  const hideKanbanEstimateTarget = isLantai12 || isWorkshopPage;

  const [stats, setStats] = useState<ProductionStats>(initialStats);
  const [workstations, setWorkstations] = useState<WorkstationStats[]>(initialWorkstations);
  const [recent, setRecent] = useState<ProductionProgress[]>(initialRecent);
  const [current, setCurrent] = useState<CurrentWorkstationProgress[]>(initialCurrent);
  const [durations, setDurations] = useState<WorkstationDuration[]>(initialDurations);
  const [estimate, setEstimate] = useState<ProductionEstimate | null>(initialEstimate);
  const [cards, setCards] = useState<ProductStatusCard[]>(initialCards);
  const [statusSummary, setStatusSummary] = useState<ProductStatusSummary | null>(initialStatusSummary || null);
  const [operators, setOperators] = useState<OperatorStats[]>(initialOperators);
  const [abnormal, setAbnormal] = useState<AbnormalProgress[]>(initialAbnormal || []);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [daysBack, setDaysBack] = useState(7);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  // Fetch data function
  const fetchData = async (days: number = daysBack) => {
    setIsLoading(true);
    try {
      //console.log('[Timeline] Fetching data at', new Date().toLocaleTimeString('id-ID'));
      const workshopParam = workshop ? `&workshop=${encodeURIComponent(workshop)}` : '';
      const response = await fetch(`/api/production-progress/current?daysBack=${days}&line=${encodeURIComponent(apiLine)}${workshopParam}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setStats(data.stats);
      setWorkstations(data.workstations);
      setRecent(data.recent);
      setCurrent(data.current);
      setDurations(data.durations);
      setEstimate(data.estimate);
      setCards(data.cards || []);
      setSchedule(data.schedule || []);
      setStatusSummary(data.statusSummary || null);
      setOperators(data.operators || []);
      setAbnormal(data.abnormal || []);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 1 minute
  useEffect(() => {
    let isMounted = true;
    fetchData(daysBack);
    
    const interval = setInterval(() => {
      if (isMounted) {
        fetchData(daysBack);
      }
    }, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [daysBack]);

  const currentStep = pickCurrentStep(recent, workstations, forcedStep);

  const wsRowsByWs = new Map<number, CurrentWorkstationProgress[]>();
  for (const row of current) {
    if (!row || typeof row.current_workstation !== 'number') continue;
    const existing = wsRowsByWs.get(row.current_workstation) || [];
    existing.push(row);
    wsRowsByWs.set(row.current_workstation, existing);
  }

  const toMillis = (value?: string | Date | null) => {
    if (!value) return 0;
    const n = new Date(value).getTime();
    return Number.isFinite(n) ? n : 0;
  };

  for (const [ws, rows] of wsRowsByWs.entries()) {
    rows.sort((a, b) => toMillis(b.current_start_actual) - toMillis(a.current_start_actual));
    wsRowsByWs.set(ws, rows);
  }

  const currentByWs = new Map<number, CurrentWorkstationProgress>();
  const statusInfo = new Map<number, { status: string; at?: string | Date }>();

  for (const [ws, rows] of wsRowsByWs.entries()) {
    const latest = rows[0];
    if (!latest) continue;
    currentByWs.set(ws, latest);
    statusInfo.set(ws, {
      status: latest.current_status ?? "",
      at: latest.current_start_actual ?? undefined,
    });
  }

  const allowedWs = [1, 2, 3, 4, 5];
  const wsMap = new Map<number, WorkstationStats>(workstations.map((w) => [Number(w.workstation ?? 0), w]));
  const points = allowedWs.map((num) => {
    const agg = wsMap.get(num);
    const cur = currentByWs.get(num);
    return {
      workstation: num,
      total_processes: agg?.total_processes ?? 0,
      completed: agg?.completed ?? 0,
      avg_duration_sec: agg?.avg_duration_sec ?? 0,
      current_status: (cur?.current_status || null) as string | null,
      active_operator: (cur?.current_operator_actual_name || null) as string | null,
      product_name: (cur?.current_product_name || null) as string | null,
      id_perproduct: (cur?.current_id_perproduct || null) as string | null,
    } as WorkstationStats;
  });

  const recentStatusByWs = new Map<number, string>();
  for (const row of recent) {
    const ws = parseWsFromStatus(row.status);
    if (!ws || recentStatusByWs.has(ws)) continue;
    recentStatusByWs.set(ws, row.status || '');
  }

  const getStatusByWs = (ws: number) => {
    return statusInfo.get(ws)?.status || recentStatusByWs.get(ws) || '';
  };

  const inputCountByWs = new Map<number, number>();
  for (const [ws, rows] of wsRowsByWs.entries()) {
    inputCountByWs.set(ws, rows.length);
  }

  const getTimelineColor = (status?: string) => {
    const lower = (status || '').toLowerCase();
    if (lower.includes('tunggu qc')) {
      return { line: 'bg-blue-500', ring: 'border-blue-400' };
    }
    if (lower.includes('istirahat')) {
      return { line: 'bg-amber-400', ring: 'border-amber-300' };
    }
    if (lower.includes('selesai kit')) {
      return { line: 'bg-blue-500', ring: 'border-blue-400' };
    }
    if (lower.includes('on progress') || lower.includes('masuk')) {
      return { line: 'bg-emerald-500', ring: 'border-emerald-300' };
    }
    return { line: 'bg-gray-600', ring: 'border-gray-500' };
  };

  const linePairConfigs = [
    {
      label: 'Line 1/2',
      odd: { label: 'Line 1', workstation: 31 },
      even: { label: 'Line 2', workstation: 32 },
    },
    {
      label: 'Line 3/4',
      odd: { label: 'Line 3', workstation: 33 },
      even: { label: 'Line 4', workstation: 34 },
    },
    {
      label: 'Line 5/6',
      odd: { label: 'Line 5', workstation: 35 },
      even: { label: 'Line 6', workstation: 36 },
    },
  ];

  const oddNodeSlots = [1, 3];
  const evenNodeSlots = [0, 2, 4];

  const getWorkstationDisplay = (workstation: number) => {
    const wsData = currentByWs.get(workstation);
    const info = statusInfo.get(workstation);
    const status = info?.status || wsData?.current_status || '';
    const variant = statusVariant(status);
    const showElapsed = (
      (status || '').toLowerCase().includes('on progress') ||
      (status || '').toLowerCase().includes('masuk')
    ) && (variant.bg.includes('emerald') || variant.bg.includes('blue'));
    const isWaitingMulai = (status || '').toLowerCase().includes('istirahat');
    const isWaitingSelesai = (status || '').toLowerCase().includes('on progress') || (status || '').toLowerCase().includes('masuk');
    const showWaitingElapsed = isWaitingMulai && !isWaitingSelesai;

    return {
      wsData,
      info,
      status,
      variant,
      showElapsed,
      showWaitingElapsed,
      isPausedWaiting: isWaitingSelesai,
      estDuration: formatEst(durations.find((d) => d.workstation === workstation)?.actual_duration || null),
    };
  };

  const getWorkstationDisplays = (workstation: number) => {
    const rows = wsRowsByWs.get(workstation) || [];
    const estDuration = formatEst(durations.find((d) => d.workstation === workstation)?.actual_duration || null);

    // Deduplicate by id_perproduct (current_id_perproduct) to avoid showing the same product multiple times on nodes
    const uniqueRows: typeof rows = [];
    const seen = new Set<string>();
    for (const r of rows) {
      const id = String((r as any).current_id_perproduct ?? (r as any).current_id_product ?? '');
      if (id) {
        if (seen.has(id)) continue;
        seen.add(id);
      }
      uniqueRows.push(r);
      if (uniqueRows.length >= 3) break;
    }

    return uniqueRows.map((row) => {
      const status = row.current_status || '';
      const variant = statusVariant(status);
      const showElapsed = (
        status.toLowerCase().includes('on progress') ||
        status.toLowerCase().includes('masuk')
      ) && (variant.bg.includes('emerald') || variant.bg.includes('blue'));
      const isWaitingMulai = status.toLowerCase().includes('istirahat');
      const isWaitingSelesai = status.toLowerCase().includes('on progress') || status.toLowerCase().includes('masuk');
      const showWaitingElapsed = isWaitingMulai && !isWaitingSelesai;

      return {
        wsData: row,
        info: { status, at: row.current_start_actual ?? undefined },
        status,
        variant,
        showElapsed,
        showWaitingElapsed,
        isPausedWaiting: isWaitingSelesai,
        estDuration,
      };
    });
  };

  return (
    <>
       {/* <style>{arrowAnimationStyle}</style> */}

      <div className="p-6 sm:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-400" />
              {lineLabel}
            </h1>
            <p className="text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
              Current Production Status {isLoading && <span className="text-xs text-gray-500">(updating...)</span>}
            </p>
          </div>
        </div>
        
        {/* Estimasi Selesai Produksi */}
    {/*
        {estimate && (
          <Card className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-400" />
                  <div>
                    <div className="text-sm text-gray-300">Estimasi Selesai Produksi</div>
                    <div className="text-xs text-gray-400">{estimate.product_name} ({estimate.id_product})</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-400">
                    {new Date(estimate.estimated_finish || '').toLocaleDateString('id-ID', { 
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })} {new Date(estimate.estimated_finish || '').toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-gray-400">
                    Total Durasi: {formatEst(estimate.total_duration)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        *}

        {/* Timeline */}
        {showWorkstationTimeline && (
          <div className="relative">
            <Card className="bg-gray-900/60 border border-gray-700/60 backdrop-blur-sm">
              <button
                onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                className="absolute -top-3 -right-3 flex items-center gap-2 px-3 py-2 bg-gray-900/60 border border-gray-700/60 hover:bg-gray-800/80 text-white text-sm rounded-lg transition-colors duration-200 z-20"
              >
                <span>Perluas Tampilan Line</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isTimelineExpanded ? 'rotate-180' : ''}`} />
              </button>

              <CardContent className="p-4">
                <div className="w-full space-y-2">
                  {/* Animated container for line pairs */}
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isTimelineExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-2">
                      {linePairConfigs.map((pair) => {
                  const oddLatestDisplay = getWorkstationDisplay(pair.odd.workstation);
                  const evenLatestDisplay = getWorkstationDisplay(pair.even.workstation);
                  const oddDisplays = getWorkstationDisplays(pair.odd.workstation);
                  const evenDisplays = getWorkstationDisplays(pair.even.workstation);

                  return (
                    <div key={pair.label} className="grid grid-cols-[64px_1fr] gap-3 items-stretch">
                      <div className="grid grid-rows-[56px_24px_56px] items-center py-1 text-sm text-gray-300 leading-none">
                        <div className="text-right self-center">{pair.odd.label}</div>
                        <div></div>
                        <div className="text-right self-center">{pair.even.label}</div>
                      </div>
                      <div className="relative pt-1 pb-1">
                        <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-3 rounded-full bg-gray-700/80"></div>
                        <div className="relative flex items-center justify-between">
                          {Array.from({ length: 5 }, (_, nodeIdx) => {
                            const oddSlotIndex = oddNodeSlots.indexOf(nodeIdx);
                            const evenSlotIndex = evenNodeSlots.indexOf(nodeIdx);
                            const oddDisplay = oddSlotIndex >= 0 ? oddDisplays[oddSlotIndex] : undefined;
                            const evenDisplay = evenSlotIndex >= 0 ? evenDisplays[evenSlotIndex] : undefined;
                            const display = oddDisplay || evenDisplay;
                            const color = display?.status ? getTimelineColor(display.status) : null;
                            const ringClass = color?.ring && color.ring !== 'border-gray-500' ? color.ring : 'border-gray-500';
                            const hasOddInfo = !!(
                              oddDisplay?.wsData?.presentase ||
                              oddDisplay?.wsData?.current_product_name ||
                              oddDisplay?.wsData?.current_operator_actual_name ||
                              oddDisplay?.status ||
                              oddDisplay?.showElapsed ||
                              oddDisplay?.showWaitingElapsed ||
                              (oddDisplay?.estDuration && oddDisplay.estDuration !== '—')
                            );
                            const hasEvenInfo = !!(
                              evenDisplay?.wsData?.presentase ||
                              evenDisplay?.wsData?.current_product_name ||
                              evenDisplay?.wsData?.current_operator_actual_name ||
                              evenDisplay?.status ||
                              evenDisplay?.showElapsed ||
                              evenDisplay?.showWaitingElapsed ||
                              (evenDisplay?.estDuration && evenDisplay.estDuration !== '—')
                            );
                            const nodeBlinkClass = display?.variant.blink && (hasOddInfo || hasEvenInfo) ? 'animate-pulse' : '';
                            const showOddSide = hasOddInfo;
                            const showEvenSide = hasEvenInfo;

                            return (
                              <div key={`${pair.label}-${nodeIdx}`} className="w-1/5 flex flex-col items-center">
                                {showOddSide ? (
                                  <div className="h-14 text-[10px] text-gray-300 leading-tight text-center w-24">
                                    {oddDisplay?.wsData?.presentase ? <div className="text-emerald-400 font-semibold truncate">{`${oddDisplay.wsData.presentase}%`}</div> : null}
                                    {oddDisplay?.wsData?.current_product_name ? <div className="truncate font-semibold" title={oddDisplay.wsData.current_product_name}>{oddDisplay.wsData.current_product_name}</div> : null}
                                    {oddDisplay?.wsData?.current_operator_actual_name ? <div className="truncate" title={oddDisplay.wsData.current_operator_actual_name}>{oddDisplay.wsData.current_operator_actual_name}</div> : null}
                                    {oddDisplay?.status ? <div className="truncate text-gray-400" title={oddDisplay.status}>{oddDisplay.status}</div> : null}
                                    {oddDisplay?.showElapsed ? (
                                      <Elapsed since={oddDisplay.info?.at} className={`text-[10px] truncate ${oddDisplay.variant.bg.includes('blue') ? 'text-blue-400' : 'text-gray-400'}`} />
                                    ) : oddDisplay?.showWaitingElapsed && oddDisplay.info?.at ? (
                                      <span className="text-[10px] text-amber-400 truncate"><Elapsed since={oddDisplay.info?.at} isPaused={oddDisplay.isPausedWaiting} /></span>
                                    ) : oddDisplay?.estDuration && oddDisplay.estDuration !== '—' ? (
                                      <span className="text-[10px] text-gray-400 truncate">{oddDisplay.estDuration}</span>
                                    ) : null}
                                  </div>
                                ) : (
                                  <div className="h-14 w-24"></div>
                                )}

                                <div className={`w-6 h-6 rounded-full border-[6px] bg-gray-900 ${ringClass} ${nodeBlinkClass}`}></div>

                                {showEvenSide ? (
                                  <div className="h-14 mt-0.5 text-[10px] text-gray-300 leading-tight text-center w-24">
                                    {evenDisplay?.wsData?.current_product_name ? <div className="truncate font-semibold" title={evenDisplay.wsData.current_product_name}>{evenDisplay.wsData.current_product_name}</div> : null}
                                    {evenDisplay?.wsData?.current_operator_actual_name ? <div className="truncate" title={evenDisplay.wsData.current_operator_actual_name}>{evenDisplay.wsData.current_operator_actual_name}</div> : null}
                                    {evenDisplay?.status ? <div className="truncate text-gray-400" title={evenDisplay.status}>{evenDisplay.status}</div> : null}
                                    {evenDisplay?.showElapsed ? (
                                      <Elapsed since={evenDisplay.info?.at} className={`text-[10px] truncate ${evenDisplay.variant.bg.includes('blue') ? 'text-blue-400' : 'text-gray-400'}`} />
                                    ) : evenDisplay?.showWaitingElapsed && evenDisplay.info?.at ? (
                                      <span className="text-[10px] text-amber-400 truncate"><Elapsed since={evenDisplay.info?.at} isPaused={evenDisplay.isPausedWaiting} /></span>
                                    ) : evenDisplay?.estDuration && evenDisplay.estDuration !== '—' ? (
                                      <span className="text-[10px] text-gray-400 truncate">{evenDisplay.estDuration}</span>
                                    ) : null}
                                  </div>
                                ) : (
                                  <div className="h-14 mt-0.5 w-24"></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                    </div>
                  </div>

                {/* Line 7 */}
                <div className="space-y-2">
                  <div className="grid grid-cols-[64px_1fr] gap-3 items-stretch -mt-6">
                  <div className="grid grid-rows-[56px_24px_56px] items-center py-1 text-sm text-gray-300 leading-none">
                    <div></div>
                    <div></div>
                    <div className="text-right self-start pt-1">Line 7</div>
                  </div>
                  <div className="relative pt-1 pb-1">
                    <div className="absolute left-[10%] right-[10%] top-[64px] h-3 rounded-full bg-gray-700/80"></div>
                    <div className="relative flex items-center justify-between">
                      {points.map((ws) => {
                        const currentWsData = currentByWs.get(ws.workstation);
                        const info = statusInfo.get(ws.workstation ?? 0);
                        const status = info?.status;
                        const variant = statusVariant(status);
                        const showElapsed = (
                          (status || "").toLowerCase().includes("on progress") ||
                          (status || "").toLowerCase().includes("masuk")
                        ) && (variant.bg.includes("emerald") || variant.bg.includes("blue"));
                        const isWaitingMulai = (status || "").toLowerCase().includes("istirahat");
                        const isWaitingSelesai = (status || "").toLowerCase().includes("on progress") || (status || "").toLowerCase().includes("masuk");
                        const showWaitingElapsed = isWaitingMulai && !isWaitingSelesai;
                        const hasInfo = !!(
                          ws.product_name ||
                          ws.active_operator ||
                          ws.current_status ||
                          currentWsData?.presentase
                        );
                        const ringClass = hasInfo ? variant.border : 'border-gray-500';
                        const nodeBlinkClass = hasInfo && variant.blink ? 'animate-pulse' : '';

                        return (
                          <div key={ws.workstation} className="w-1/5 flex flex-col items-center">
                            <div className="h-[58px] w-24"></div>

                            <div className={`w-6 h-6 rounded-full border-[6px] bg-gray-900 ${ringClass} ${nodeBlinkClass}`}></div>

                            <div className="flex flex-col items-center gap-1 mt-2 shrink-0 w-24">
                              <div className="text-xs text-emerald-400 font-semibold">
                                {currentWsData?.presentase ? `${currentWsData.presentase}%` : "—"}
                              </div>
                            </div>

                            {hasInfo ? (
                              <div className="h-14 mt-0.5 text-[10px] text-gray-300 leading-tight text-center w-24">
                                {ws.product_name ? <div className="truncate font-semibold" title={ws.product_name}>{ws.product_name}</div> : null}
                                {ws.active_operator ? <div className="truncate" title={ws.active_operator}>{ws.active_operator}</div> : null}
                                {ws.current_status ? <div className="truncate text-gray-400" title={ws.current_status}>{ws.current_status}</div> : null}
                                {showElapsed ? (
                                  <Elapsed
                                    since={info?.at}
                                    className={`text-[10px] truncate ${variant.bg.includes('blue') ? 'text-blue-400' : 'text-gray-400'}`}
                                  />
                                ) : showWaitingElapsed && info?.at ? (
                                  <span className="text-[10px] text-amber-400 truncate">
                                    <Elapsed since={info?.at} isPaused={isWaitingSelesai} />
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 truncate">
                                    {formatEst(durations.find(d => d.workstation === ws.workstation)?.actual_duration || null)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="h-14 mt-0.5 w-24"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product status cards - Kanban Board */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Current Kanban Status</div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Tampilkan data:</label>
              <select
                value={daysBack}
                onChange={(e) => {
                  const newDays = Number(e.target.value);
                  setDaysBack(newDays);
                  fetchData(newDays);
                }}
                className="px-3 py-1 bg-slate-700 border border-slate-600 text-white rounded text-sm hover:bg-slate-600 transition-colors"
              >
                <option value="1">Hari ini</option>
                <option value="3">3 hari terakhir</option>
                <option value="7">7 hari terakhir</option>
                <option value="14">14 hari terakhir</option>
                <option value="30">30 hari terakhir</option>
                <option value="90">90 hari terakhir</option>
                <option value="365">1 tahun terakhir</option>
              </select>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Column 1: To Do */}
            <div className="flex flex-col gap-3 order-1">
              <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600 sticky top-0 z-10">
                <h3 className="text-white font-semibold text-sm flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  To Do
                </h3>
                <div className="text-xs text-gray-400 text-center mt-1">{schedule.length} produk</div>
              </div>
              <div className="space-y-3">
                {schedule.length > 0 ? (
                  schedule.map((product: any, idx: number) => {
                    const total = Number(product.total) || 0;
                    const jumlahTungguQc = Number(product.jumlah_tunggu_qc) || 0;
                    const totalFinishedQc = Number(product.jumlah_finish_good) || 0;
                    const tanggalSelesai = product.tanggal_selesai ? new Date(product.tanggal_selesai) : null;
                    const today = new Date();
                    const presentaseFromTable = Number(product.percentage);
                    // Use percentage directly from API; fall back to 0 if missing
                    const presentase = Number.isFinite(presentaseFromTable) ? presentaseFromTable : 0;
                    
                    // Tentukan status berdasarkan kondisi
                    let status = 'To Do';
                    let statusBg = 'bg-gray-600';
                    
                    if (jumlahTungguQc >= total && total > 0) {
                      // Selesai: tunggu_qc >= jumlah_per_ts (gunakan >= untuk handle edge case)
                      status = 'Selesai';
                      statusBg = 'bg-emerald-600';
                    } else if (jumlahTungguQc < total) {
                      if (tanggalSelesai && today > tanggalSelesai) {
                        // Terlambat: tunggu_qc < jumlah_per_ts AND today > jadwal_selesai
                        status = 'Terlambat / Tidak Tercatat';
                        statusBg = 'bg-red-600';
                      } else {
                        // To Do: tunggu_qc < jumlah_per_ts AND today <= jadwal_selesai
                        status = 'To Do';
                        statusBg = 'bg-gray-600';
                      }
                    }
                    
                    // Jangan tampilkan item yang sudah selesai di To Do column
                    if (status === 'Selesai') {
                      return null;
                    }

                    return (
                      <Card key={`todo-${product.id_product}-${idx}`} className="bg-slate-900 border border-slate-700 hover:border-gray-500 transition-colors">
                        <CardContent className="px-3 py-1">
                          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                            <div className="space-y-0.5 min-w-0 leading-tight">
                              <div className="text-sm font-semibold text-white truncate" title={product.product_name || "-"}>{product.product_name || "-"}</div>
                              <div className="text-xs text-gray-300 truncate" title={`Trainset ${product.trainset ?? "-"}`}>Trainset {product.trainset ?? "-"}</div>
                              <div className="text-xs text-gray-400 truncate" title={product.proses_produk || "-"}>
                                {product.proses_produk ?? "-"}
                              </div>
                              <Badge className={`border-0 text-xs font-semibold ${statusBg} text-white`}>
                                {status}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-0 text-right shrink-0 leading-tight">
                              <div className="text-xs font-semibold text-white whitespace-nowrap">
                                {jumlahTungguQc} / {total}
                              </div>
                              <div className="text-xs text-gray-300 whitespace-nowrap mt-0.5">
                                <span className="text-gray-400">Mulai:</span> {product.tanggal_mulai ? new Date(product.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : "-"}
                              </div>
                              <div className="text-xs text-gray-300 whitespace-nowrap">
                                <span className="text-gray-400">Selesai:</span> {product.tanggal_selesai ? new Date(product.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : "-"}
                              </div>
                              <div className="text-xs text-gray-300 whitespace-nowrap">
                                <span className="text-gray-400">Presentase:</span> {presentase}%
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }).filter(Boolean)
                ) : (
                  <p className="text-gray-500 text-sm mt-8 text-center">Belum ada data</p>
                )}
              </div>
            </div>

            {/* Column 2: On Progress */}
            <div className="flex flex-col gap-3 order-2">
              <div className="bg-amber-700/50 rounded-lg p-3 border border-amber-600 sticky top-0 z-10">
                <h3 className="text-white font-semibold text-sm flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  On Progress
                </h3>
                <div className="text-xs text-gray-200 text-center mt-1">
                  {cards.filter(card => {
                    const status = card.status || '';
                    return card.is_completed === 0 || status.toLowerCase().includes('masuk kit') || status.toLowerCase().includes('selesai kit');
                  }).length} produk
                </div>
              </div>
              <div className="space-y-3">
                {cards
                  .filter(card => {
                    const status = card.status || '';
                    return card.is_completed === 0 || status.toLowerCase().includes('masuk kit') || status.toLowerCase().includes('selesai kit');
                  })
                  .map((card, idx) => {
                    // Check if status is "Tunggu" (waiting)
                    const isWaiting = card.status?.toLowerCase().includes('tunggu');
                    const statusColor = getStatusColor(card.status);
                    const trackingHref = card.id_perproduct
                      ? `https://sinergi.ptrekaindo.co.id/product-tracking?q=${encodeURIComponent(card.id_perproduct)}`
                      : null;
                    const cardBody = (
                      <Card className="bg-slate-900 border border-slate-700 hover:border-amber-500 transition-colors">
                        <CardContent className="px-3 py-1">
                          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                            <div className="space-y-0.5 min-w-0 leading-tight">
                              <div className="text-sm font-semibold text-white truncate" title={card.product_name || "-"}>{card.product_name || "-"}</div>
                              <div className="text-xs text-gray-300 truncate" title={card.id_perproduct || card.id_product || "-"}>{card.id_perproduct || card.id_product || "-"}</div>
                              <div className="text-xs text-gray-400 truncate" title={card.operator_actual_name || "-"}>{card.operator_actual_name || "-"}</div>
                              {isWaiting && (
                                <Badge className={`${statusColor.bg} ${statusColor.border} ${statusColor.text} border text-xs font-semibold`}>
                                  ⏸ {card.status}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-0 text-right shrink-0 leading-tight">
                              {hideKanbanEstimateTarget ? (
                                <>
                                  <div className="text-xs text-gray-200 font-bold">{formatProgressCount(card)}</div>
                                  <div className="text-xs text-gray-300 truncate max-w-[120px]" title={card.sub_process || card.process_name || "-"}>{card.sub_process || card.process_name || "-"}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">Selesai</div>
                                  <div className="text-xs text-gray-300 whitespace-nowrap">{formatDateTime(card.estimated_finish || card.start_actual)}</div>
                                  <div className="text-xs text-gray-300 mt-0.5">{formatPercentage(card.percentage)}</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-xs text-gray-400">Estimasi</div>
                                  <div className="text-xs text-gray-300 whitespace-nowrap">{formatDateTime(card.estimated_finish)}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">Target</div>
                                  <div className="text-xs text-gray-300">{formatEst(card.total_duration)}</div>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );

                    return (
                      trackingHref ? (
                        <a
                          key={`progress-${card.id_product}-${idx}`}
                          href={trackingHref}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          {cardBody}
                        </a>
                      ) : (
                        <div key={`progress-${card.id_product}-${idx}`}>{cardBody}</div>
                      )
                    );
                  })}
              </div>
            </div>

            {/* Column 3: QC Process */}
            <div className="flex flex-col gap-3 order-3">
              <div className="bg-blue-700/50 rounded-lg p-3 border border-blue-600 sticky top-0 z-10">
                <h3 className="text-white font-semibold text-sm flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  QC Process
                </h3>
                <div className="text-xs text-gray-200 text-center mt-1">
                  {cards.filter(card => {
                    const status = card.status || '';
                    return status === 'Tunggu QC' && !status.toLowerCase().includes('masuk kit') && !status.toLowerCase().includes('selesai kit');
                  }).length} produk
                </div>
              </div>
              <div className="space-y-3">
                {cards
                  .filter(card => {
                    const status = card.status || '';
                    return card.is_completed === 1 && status !== 'Finish Good' && !status.toLowerCase().includes('masuk kit') && !status.toLowerCase().includes('selesai kit');
                  })
                  .map((card, qcIdx) => {
                    const trackingHref = card.id_perproduct
                      ? `https://sinergi.ptrekaindo.co.id/product-tracking?q=${encodeURIComponent(card.id_perproduct)}`
                      : null;
                    const cardBody = (
                      <Card className="bg-slate-900 border border-slate-700 hover:border-blue-500 transition-colors">
                        <CardContent className="px-3 py-1">
                          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                            <div className="space-y-0.5 min-w-0 leading-tight">
                              <div className="text-sm font-semibold text-white truncate" title={card.product_name || "-"}>{card.product_name || "-"}</div>
                              <div className="text-xs text-gray-300 truncate" title={card.id_perproduct || card.id_product || "-"}>{card.id_perproduct || card.id_product || "-"}</div>
                              <div className="text-xs text-gray-400 truncate" title={card.operator_actual_name || "-"}>{card.operator_actual_name || "-"}</div>
                              <Badge className="bg-blue-600 text-white border-0 text-xs">{card.status || "Tunggu QC"}</Badge>
                            </div>
                            <div className="flex flex-col gap-0 text-right shrink-0 leading-tight">
                              {hideKanbanEstimateTarget ? (
                                <>
                                  <div className="text-xs text-gray-200 font-bold">{formatProgressCount(card)}</div>
                                  <div className="text-xs text-gray-300 truncate max-w-[120px]" title={card.sub_process || card.process_name || "-"}>{card.sub_process || card.process_name || "-"}</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-xs text-gray-400">Estimasi</div>
                                  <div className="text-xs text-gray-300 whitespace-nowrap">{formatDateTime(card.estimated_finish)}</div>
                                </>
                              )}
                              <div className="text-xs text-gray-400 mt-0.5">Selesai</div>
                              <div className="text-xs text-gray-300 whitespace-nowrap">
                                {hideKanbanEstimateTarget ? formatDateTime(card.start_actual) : formatDateTime(card.finish_actual || card.start_actual)}
                              </div>
                              {!hideKanbanEstimateTarget ? (
                                <>
                                  <div className="text-xs text-gray-400 mt-0.5">Target</div>
                                  <div className="text-xs text-gray-300">{formatEst(card.total_duration)}</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-xs text-gray-300 mt-0.5">{formatPercentage(card.percentage)}</div>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );

                    return (
                      trackingHref ? (
                        <a
                          key={`qc-${card.id_product}-${qcIdx}`}
                          href={trackingHref}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          {cardBody}
                        </a>
                      ) : (
                        <div key={`qc-${card.id_product}-${qcIdx}`}>{cardBody}</div>
                      )
                    );
                  })}
              </div>
            </div>

            {/* Column 4: Finish Good */}
            <div className="flex flex-col gap-3 order-4">
              <div className="bg-emerald-700/50 rounded-lg p-3 border border-emerald-600 sticky top-0 z-10">
                <h3 className="text-white font-semibold text-sm flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  Finish Good
                </h3>
                <div className="text-xs text-gray-200 text-center mt-1">
                  {cards.filter(card => card.status === 'Finish Good').length} produk
                </div>
              </div>
              <div className="space-y-3">
                {cards
                  .filter(card => card.status === 'Finish Good')
                  .map((card, fgIdx) => {
                    const trackingHref = card.id_perproduct
                      ? `https://sinergi.ptrekaindo.co.id/product-tracking?q=${encodeURIComponent(card.id_perproduct)}`
                      : null;
                    const cardBody = (
                      <Card className="bg-slate-900 border border-slate-700 hover:border-emerald-500 transition-colors">
                       <CardContent className="px-3 py-1">
                          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                          <div className="space-y-0.5 min-w-0 leading-tight">
                              <div className="text-sm font-semibold text-white truncate" title={card.product_name || "-"}>{card.product_name || "-"}</div>
                              <div className="text-xs text-gray-300 truncate" title={card.id_perproduct || card.id_product || "-"}>{card.id_perproduct || card.id_product || "-"}</div>
                              <div className="text-xs text-gray-400 truncate" title={card.operator_actual_name || "-"}>{card.operator_actual_name || "-"}</div>
                              <Badge className="bg-emerald-600 text-white border-0 text-xs">Finish Good</Badge>
                            </div>
                            <div className="flex flex-col gap-0 text-right shrink-0 leading-tight">
                              {hideKanbanEstimateTarget ? (
                                <>
                                  <div className="text-xs text-gray-200 font-bold">{formatProgressCount(card)}</div>
                                  <div className="text-xs text-gray-300 truncate max-w-[120px]" title={card.sub_process || card.process_name || "-"}>{card.sub_process || card.process_name || "-"}</div>
                                </>
                              ) : null}
                              <div className="text-xs text-gray-400 mt-0.5">Selesai</div>
                              <div className="text-xs text-gray-300 whitespace-nowrap">{formatDateTime(card.start_actual)}</div>
                              {hideKanbanEstimateTarget ? (
                                <>
                                  <div className="text-xs text-gray-300 mt-0.5">{formatPercentage(card.percentage)}</div>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );

                    return (
                      trackingHref ? (
                        <a
                          key={`finish-${card.id_product}-${fgIdx}`}
                          href={trackingHref}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          {cardBody}
                        </a>
                      ) : (
                        <div key={`finish-${card.id_product}-${fgIdx}`}>{cardBody}</div>
                      )
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

{/* Daftar Operator Aktif - Detailed Cards */}
<Card className="bg-gray-800/50 border border-gray-700/60">
  <CardContent className="p-4 space-y-2">

    {/* Title */}
    <div className="text-white font-semibold mb-4 flex items-center gap-2">
      <Users className="w-4 h-4 text-blue-400" />
      Operator yang melapor di 24 jam terakhir
    </div>

    {/* Grid Operator */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {operators.length > 0 ? (
        operators.map((op) => (
          <div
            key={op.operator_actual_rfid}
            className="p-4 rounded-lg bg-gray-900/60"
          >

            {/* ================= HEADER ================= */}
            <div className="flex items-start justify-between">

              {/* Nama Operator */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate leading-tight" title={op.operator_actual_name || "-"}>
                  {op.operator_actual_name || "-"}
                </div>
              </div>

              {/* Total Selesai */}
              <div className="text-right ml-2 shrink-0">
                <div className="text-xs text-gray-400 leading-none">Total Selesai</div>
              </div>

            </div>

            {/* ================= PRODUCT INFO ================= */}
            <div className="flex items-end justify-between mt-0">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate leading-tight" title={op.latest_product_name || "-"}>
                  {op.latest_product_name || "-"}
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-400 leading-none ml-2 shrink-0">
                {op.total_selesai_all_time ?? 0}
              </div>
            </div>

            <div className="text-xs text-gray-400 truncate leading-tight" title={op.latest_id_perproduct || "-"}>
              {op.latest_id_perproduct || "-"}
            </div>

            {/* ================= DURATION ================= */}
            <div className="text-xs mt-1">
              {op.latest_start_actual ? (
                <Elapsed
                  since={op.latest_start_actual}
                  className="text-emerald-400 font-semibold"
                />
              ) : (
                <span className="text-gray-500">-</span>
              )}
            </div>

          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-500 text-sm">
            {isLantai12 ? "Tidak ada data operator pada 24 jam terakhir" : "Tidak ada data operator untuk hari ini"}
          </p>
        </div>
      )}
    </div>

  </CardContent>
</Card>

{/* Ringkasan Status */}
{statusSummary ? (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    {/* Selesai Produksi */}
    <Card className="bg-emerald-900/40 border border-emerald-700/60 hover:border-emerald-600 transition-colors">
      <CardContent className="py-2 px-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-gray-300 uppercase tracking-wide leading-tight">Selesai Produksi</div>
            <div className="text-2xl font-bold text-emerald-400 leading-tight">{statusSummary.selesai_produksi}</div>
            <div className="text-xs text-gray-400 mt-0.5">Produk</div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* On Progress */}
    <Card className="bg-amber-900/40 border border-amber-700/60 hover:border-amber-600 transition-colors">
      <CardContent className="py-2 px-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-gray-300 uppercase tracking-wide leading-tight">On Progress</div>
            <div className="text-2xl font-bold text-amber-400 leading-tight">{statusSummary.on_progress}</div>
            <div className="text-xs text-gray-400 mt-0.5">Produk</div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Finish Good */}
    <Card className="bg-emerald-900/40 border border-emerald-700/60 hover:border-emerald-600 transition-colors">
      <CardContent className="py-2 px-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-gray-300 uppercase tracking-wide leading-tight">Finish Good</div>
            <div className="text-2xl font-bold text-emerald-400 leading-tight">{statusSummary.finish_good}</div>
            <div className="text-xs text-gray-400 mt-0.5">Produk</div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Not OK */}
    <Card className="bg-rose-900/40 border border-rose-700/60 hover:border-rose-600 transition-colors">
      <CardContent className="py-2 px-4">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-gray-300 uppercase tracking-wide leading-tight">Not OK</div>
            <div className="text-2xl font-bold text-rose-400 leading-tight">{statusSummary.not_ok}</div>
            <div className="text-xs text-gray-400 mt-0.5">Produk</div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Kurang Komponen */}
    <Card className="bg-rose-900/40 border border-rose-700/60 hover:border-rose-600 transition-colors">
      <CardContent className="py-2 px-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-gray-300 uppercase tracking-wide leading-tight">Kurang Komponen</div>
            <div className="text-2xl font-bold text-rose-400 leading-tight">{statusSummary.gangguan}</div>
            <div className="text-xs text-gray-400 mt-0.5">Kejadian</div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Istirahat */}
    <Card className="bg-amber-900/40 border border-amber-700/60 hover:border-amber-600 transition-colors">
      <CardContent className="py-2 px-4">
        <div className="flex items-center gap-3">
          <PauseCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-gray-300 uppercase tracking-wide leading-tight">Istirahat</div>
            <div className="text-2xl font-bold text-amber-400 leading-tight">{statusSummary.tunggu}</div>
            <div className="text-xs text-gray-400 mt-0.5">Kejadian</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
) : (
  <div className="p-4 bg-gray-900/40 border border-gray-700/60 rounded-lg">
    <p className="text-gray-400 text-center">Loading status summary...</p>
  </div>
)}


        {/* Abnormal Progress Card */}
        <Card className="bg-gray-800/50 border border-gray-700/60">
          <CardContent className="p-4 space-y-2">
            <div className="text-white font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Abnormal Progress
              <span className="text-xs text-gray-400">({daysBack} hari terakhir)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {abnormal && abnormal.length > 0 ? (
                abnormal.map((item, abnormalIdx) => {
                  const kategoriColor = item.kategori?.includes('Laporan Abnormal') || item.status?.includes('Kurang Komponen')
                    ? 'border-rose-600 bg-rose-900/20' 
                    : 'border-amber-600 bg-amber-900/20';
                  
                  return (
                    <div
                      key={`abnormal-${item.operator_actual_rfid}-${item.id_perproduct}-${abnormalIdx}`}
                      className={`p-4 rounded-lg border ${kategoriColor}`}
                    >
                      {/* Header - Operator & Status Badge */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm truncate">
                            {item.operator_actual_name || "-"}
                          </div>
                        </div>
                        <Badge 
                          className={`ml-2 shrink-0 text-xs ${
                            item.kategori?.includes('Laporan Abnormal') || item.status?.includes('Kurang Komponen')
                              ? 'bg-rose-600 text-white' 
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {item.status || "-"}
                        </Badge>
                      </div>

                      {/* Product Info */}
                      <div className="mb-2">
                        <div className="text-sm font-semibold text-white truncate">
                          {item.product_name || "-"}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {item.id_perproduct || "-"}
                        </div>
                      </div>

                      {/* Start Time */}
                      <div className="text-xs text-gray-300 mb-2">
                        {item.start_actual ? (
                          <>
                            Start: {new Date(item.start_actual).toLocaleDateString('id-ID', { 
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })} {new Date(item.start_actual).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>

                      {/* Note */}
                      {item.note_qc && (
                        <div className="text-xs text-gray-300 bg-gray-700/50 p-2 rounded">
                          Note: {item.note_qc}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 text-sm">Tidak ada abnormal progress</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Production Progress Detailed Table */}
        <div className="bg-gray-900/60 border border-gray-700/60 backdrop-blur-sm rounded-lg p-6">
          <ProductionProgressTable data={recent} mode={isWorkshopPage ? 'protrack' : 'default'} />
        </div>
      </div>
    </>
  );
}