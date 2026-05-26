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
import type { MaterialOutLineChart as MaterialOutLineChartRow } from '@/lib/queries/stok_material';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MaterialOutLineChartProps {
  data: MaterialOutLineChartRow[];
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

export default function MaterialOutLineChart({ data, monthLabel }: MaterialOutLineChartProps) {
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
      </CardContent>
    </Card>
  );
}