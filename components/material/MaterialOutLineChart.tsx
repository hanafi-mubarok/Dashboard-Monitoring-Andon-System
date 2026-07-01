'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type {
  MaterialOutLineChart as MaterialOutLineChartRow,
  MaterialOutDoughnutChart as MaterialOutDoughnutChartRow,
} from '@/lib/queries/stok_material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MaterialOutLineChartProps {
  data: MaterialOutLineChartRow[];
  doughnutData: MaterialOutDoughnutChartRow[];
  showHarga?: boolean;
  monthLabel: string;
}

function formatDateLabel(value: string | null) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '0';
  return Number(value).toLocaleString('id-ID');
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function getDoughnutColor(index: number) {
  const palette = ['#06B6D4', '#10B981', '#F59E0B', '#F97316', '#A855F7', '#EF4444', '#3B82F6', '#84CC16'];
  return palette[index % palette.length];
}

export default function MaterialOutLineChart({ data, doughnutData, showHarga = false, monthLabel }: MaterialOutLineChartProps) {
  const chartData: ChartData<'line', number[], string> = useMemo(
    () => ({
      labels: data.map((item) => formatDateLabel(item.tanggal)),
      datasets: [
        {
          label: 'Item Direservasi',
          data: data.map((item) => Number(item.baris_reservasi ?? 0)),
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          pointBackgroundColor: '#06B6D4',
          pointBorderColor: '#06B6D4',
          pointRadius: 4,
          tension: 0.35,
          borderWidth: 2,
          fill: false,
          yAxisID: 'yBaris',
        },
        {
          label: 'Item Disiapkan',
          data: data.map((item) => Number(item.baris_disiapkan ?? 0)),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#10B981',
          pointRadius: 4,
          tension: 0.35,
          borderWidth: 2,
          fill: false,
          yAxisID: 'yBaris',
        },
        {
          label: 'Item Keluar',
          data: data.map((item) => Number(item.baris_out ?? 0)),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          pointBackgroundColor: '#F59E0B',
          pointBorderColor: '#F59E0B',
          pointRadius: 4,
          tension: 0.35,
          borderWidth: 2,
          fill: false,
          yAxisID: 'yBaris',
        },
        {
          label: 'Qty Item Direservasi',
          data: data.map((item) => Number(item.jumlah_reservasi ?? 0)),
          borderColor: '#F97316',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          pointBackgroundColor: '#F97316',
          pointBorderColor: '#F97316',
          pointRadius: 4,
          tension: 0.35,
          borderWidth: 2,
          fill: false,
          yAxisID: 'yQty',
        },
        {
          label: 'Qty Item Disiapkan',
          data: data.map((item) => Number(item.jumlah_disiapkan ?? 0)),
          borderColor: '#A855F7',
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          pointBackgroundColor: '#A855F7',
          pointBorderColor: '#A855F7',
          pointRadius: 4,
          tension: 0.35,
          borderWidth: 2,
          fill: false,
          yAxisID: 'yQty',
        },
      ],
    }),
    [data],
  );

  const visibleDoughnutData = useMemo(
    () =>
      doughnutData.filter((item) => {
        const percentage = Number(item.percentage_qty ?? 0);
        return percentage > 5;
      }),
    [doughnutData],
  );

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#D1D5DB',
          font: { size: 12 },
          padding: 16,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#111827',
        borderColor: '#374151',
        borderWidth: 1,
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatNumber(context.parsed.y)}`,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 11 },
        },
      },
      yBaris: {
        beginAtZero: true,
        position: 'left',
        grid: {
          color: 'rgba(148, 163, 184, 0.12)',
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 11 },
          precision: 0,
        },
        title: {
          display: true,
          text: 'Baris',
          color: '#D1D5DB',
        },
      },
      yQty: {
        beginAtZero: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 11 },
          precision: 0,
        },
        title: {
          display: true,
          text: 'Jumlah',
          color: '#D1D5DB',
        },
      },
    },
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-white">Material Out Line Chart</CardTitle>
        <p className="text-sm text-gray-400">Ringkasan per hari untuk {monthLabel}.</p>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full">
          {data.length > 0 ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900/40 text-sm text-gray-400">
              Data tidak tersedia untuk bulan ini.
            </div>
          )}
        </div>
        <div className="mt-4 rounded-xl border border-gray-700/60 bg-gray-900/30 p-4">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Distribusi Reservasi Material Terbanyak</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {visibleDoughnutData.length > 0 ? (
              visibleDoughnutData.map((item, index) => (
                <div key={`${item.proyek ?? 'tanpa-proyek'}-${index}`} className="flex items-start gap-2 rounded-lg border border-gray-700/60 bg-gray-950/30 px-3 py-2">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getDoughnutColor(index) }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{item.proyek ?? 'Tanpa Proyek'}</p>
                    <p className="text-xs text-gray-400">
                      Qty: {formatNumber(item.total_qty ?? 0)} Item • {Number(item.percentage_qty ?? 0).toFixed(1)}%
                    </p>
                    {showHarga ? (
                      <p className="text-xs text-gray-400">
                        Est. Harga: {formatCurrency(item.total_harga ?? 0)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-700 px-3 py-2 text-sm text-gray-500">
                Tidak ada data proyek bulan ini.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}