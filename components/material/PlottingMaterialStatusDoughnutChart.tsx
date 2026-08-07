'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatusMaterialPie } from '../../lib/queries/material_plotting';
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut } from 'react-chartjs-2';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatQtyK } from '@/components/material/pengadaan-utils';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface PlottingMaterialStatusDoughnutChartProps {
  data?: StatusMaterialPie[];
  doughnutHeight?: number;
  totalDeviasiQty?: number;
  shortagePercentage?: number;
  avgLeadTime?: number;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}

function getStatusColor(status: string, index: number) {
  const mappedColors: Record<string, string> = {
    'Belum Pengadaan': '#F87171',
    'Pengadaan Kurang': '#FB7185',
    'Stok Cukup': '#34D399',
    'Stok Kurang, Belum Pengadaan': '#EF4444',
    'Cukup, Tunggu GR': '#FBBF24',
    'Cukup, Pengadaan Outstanding': '#FB923C',
  };

  const palette = ['#38BDF8', '#A78BFA', '#F472B6', '#2DD4BF', '#FACC15'];

  return mappedColors[status] ?? palette[index % palette.length];
}

export default function PlottingMaterialStatusDoughnutChart({
  data = [],
  doughnutHeight,
  totalDeviasiQty,
  shortagePercentage,
  avgLeadTime,
}: PlottingMaterialStatusDoughnutChartProps) {
  const isMobile = useIsMobile();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const chartRef = useRef<any>(null);
  const [overlayPos, setOverlayPos] = useState<{ left: number; top: number } | null>(null);

  // ---------------------------------------------------------------------
  // FIX #2: Tinggi chart berubah-ubah saat filter berubah
  // ---------------------------------------------------------------------
  // Root cause-nya biasanya ada di PARENT: doughnutHeight dihitung dinamis
  // berdasarkan jumlah baris legend (jumlah status unik). Saat filter
  // mengubah jumlah status, tinggi yang dikirim ikut berubah -> chart
  // "loncat". Di sini kita kunci tinggi supaya stabil: sekali dapat nilai
  // yang valid, tinggi tidak akan mengecil lagi, hanya boleh membesar kalau
  // parent memang mengirim nilai yang lebih besar.
  const lockedHeightRef = useRef<number | undefined>(undefined);
  const resolvedHeight = useMemo(() => {
    const incoming = doughnutHeight ?? 280;
    if (lockedHeightRef.current === undefined || incoming > lockedHeightRef.current) {
      lockedHeightRef.current = incoming;
    }
    return lockedHeightRef.current;
  }, [doughnutHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setContainerWidth(Math.floor(cr.width));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const legendOnRight = !isMobile && (containerWidth ?? 0) >= 480;
  const computedCutout = legendOnRight ? '64%' : '54%';

  const totalPercentage = useMemo(
    () => data.reduce((sum, item) => sum + Number(item.percentage ?? 0), 0),
    [data],
  );

  const totalCount = useMemo(() => {
    if (data.length > 0) {
      const rawTotal = (data[0] as any).total_semua_status;
      const parsedTotal = Number(rawTotal);
      return Number.isFinite(parsedTotal) ? parsedTotal : 0;
    }
    return 0;
  }, [data]);

  const displayTotal = totalCount;

  // ---------------------------------------------------------------------
  // FIX #1: Overlay "Total" tidak tepat di tengah donut
  // ---------------------------------------------------------------------
  // Sebelumnya posisi dihitung lewat DOM measurement terpisah (RAF + timeout)
  // yang race condition dengan proses layout internal Chart.js (terutama
  // saat legend pindah kanan/bawah atau cutout berubah). Sekarang posisi
  // dihitung LANGSUNG di dalam plugin Chart.js pada hook `afterDraw`, jadi
  // selalu sinkron dengan chartArea yang sebenar-benarnya sedang dirender.
  const computeOverlayFromChart = useCallback((chart: ChartJS) => {
    const area = chart?.chartArea;
    const canvas = chart?.canvas;
    const container = containerRef.current;
    if (!area || !canvas || !container) return;

    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;

    const centerX = Math.round(offsetX + (area.left + area.right) / 2);
    const centerY = Math.round(offsetY + (area.top + area.bottom) / 2);

    setOverlayPos((prev) => {
      if (prev && prev.left === centerX && prev.top === centerY) return prev;
      return { left: centerX, top: centerY };
    });
  }, []);

  const centerOverlayPlugin: Plugin<'doughnut'> = useMemo(
    () => ({
      id: 'centerOverlayPosition',
      afterDraw: (chart: ChartJS) => computeOverlayFromChart(chart),
      afterResize: (chart: ChartJS) => computeOverlayFromChart(chart),
    }),
    [computeOverlayFromChart],
  );

  const chartData: ChartData<'doughnut', number[], string> = useMemo(
    () => ({
      labels: data.map((item) => item.status_komponen),
      datasets: [
        {
          label: 'Status Material',
          data: data.map((item) => Number(item.percentage ?? 0)),
          backgroundColor: data.map((item, idx) => getStatusColor(item.status_komponen, idx)),
          borderColor: '#111827',
          borderWidth: 2,
          hoverOffset: 6,
          datalabels: {
            color: '#F9FAFB',
            anchor: 'center',
            align: 'center',
            offset: 0,
            clamp: true,
            font: { size: 12, weight: 600 },
            formatter: (value: unknown) => {
              const numericValue = Number(value ?? 0);
              if (!numericValue) return '';
              return `${Math.round((numericValue / totalPercentage) * 100)}%`;
            },
          },
        },
      ],
    }),
    [data, totalPercentage],
  );

  const options: ChartOptions<'doughnut'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: computedCutout,
      layout: {
        padding: isMobile ? 0 : { right: 0, top: 0, bottom: 0, left: 0 },
      },
      animation: { duration: 0, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          display: true,
          position: legendOnRight ? ('right' as const) : ('bottom' as const),
          align: legendOnRight ? ('start' as const) : ('center' as const),
          fullSize: legendOnRight,
          labels: {
            color: '#D1D5DB',
            font: { size: 10, family: 'sans-serif' },
            boxWidth: 8,
            boxHeight: 8,
            padding: isMobile ? 4 : 6,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: { enabled: false },
        datalabels: { display: true },
      },
      elements: { arc: { borderWidth: 1 } },
    }),
    [isMobile, legendOnRight, computedCutout],
  );

  return (
    <Card className="border border-gray-800/60 bg-gray-900/60 w-full h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">Status Material</CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          Distribusi status komponen material.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {data.length > 0 ? (
          <div className="space-y-4">
            <div ref={containerRef} style={{ height: resolvedHeight, width: '100%', overflow: 'hidden' }}>
              <div style={{ height: resolvedHeight, width: '100%', position: 'relative' }}>
                <Doughnut
                  ref={chartRef}
                  data={chartData}
                  options={options}
                  plugins={[centerOverlayPlugin]}
                />

                {overlayPos && (
                  <div
                    className="pointer-events-none absolute"
                    style={{
                      left: overlayPos.left,
                      top: overlayPos.top,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="text-center">
                      <div className="text-gray-400 text-xs">Total</div>
                      <div className="text-white font-bold text-2xl">
                        {displayTotal > 0 ? formatNumber(displayTotal) : '0'}
                      </div>
                      <div className="text-gray-400 text-xs">Item dalam BoM</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: 'Shortage',
                  value: typeof totalDeviasiQty === 'number' ? formatQtyK(totalDeviasiQty) : '-',
                },
                {
                  label: 'Avg Lead Time',
                  value: typeof avgLeadTime === 'number' ? `${avgLeadTime} Hari` : '-',
                },
              ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 30, 89, 0.6) 100%)',
                  border: '1px solid rgba(79, 172, 254, 0.25)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    opacity: 0.9,
                    color: '#ffffff',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-950/40 text-sm text-gray-400">
            Tidak ada data status.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
