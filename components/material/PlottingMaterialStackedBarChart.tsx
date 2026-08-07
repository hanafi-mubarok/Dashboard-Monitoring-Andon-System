'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProdukKurang } from '../../lib/queries/material_plotting';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

interface PlottingMaterialStackedBarChartProps {
  data: ProdukKurang[];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}

export default function PlottingMaterialStackedBarChart({ data }: PlottingMaterialStackedBarChartProps) {
  const chartData = useMemo(
    () =>
      [...data]
        .slice(0, 20)
        .sort((left, right) => left.gap_trainset - right.gap_trainset)
        .map((item) => {
          const tsSelesaiValue = Math.max(0, Number(item.ts_selesai));
          const materialEndValue = Math.max(0, Number(item.material_end));
          const materialCoverage = Math.max(0, Number(item.material_end) - Number(item.ts_selesai));

          return {
            ...item,
            ts_selesai_value: tsSelesaiValue,
            material_end_value: materialEndValue,
            material_coverage_value: materialCoverage,
            chart_label: `${item.produk}`,
          };
        }),
    [data],
  );

  const visibleValues = chartData.flatMap((item) => [item.ts_selesai_value, item.material_end_value]);
  const minVisibleValue = visibleValues.length > 0 ? Math.min(...visibleValues) : 0;
  const maxVisibleValue = visibleValues.length > 0 ? Math.max(...visibleValues) : 0;
  const axisPadding = Math.max(1, Math.ceil((maxVisibleValue - minVisibleValue) * 0.15));
  const axisDomainStart = Math.max(0, minVisibleValue - axisPadding);
  const axisDomainEnd = maxVisibleValue + axisPadding;
  const chartHeight = Math.max(240, chartData.length * 36 + 24);

  const labels = chartData.map((item) => item.chart_label);
  const tsValues = chartData.map((item) => item.ts_selesai_value);
  const coverageValues = chartData.map((item) => item.material_coverage_value);
  const endValues = chartData.map((item) => item.material_end_value);

  const dataset: ChartData<'bar', number[], string> = {
    labels,
    datasets: [
      {
        label: 'Trainset Berjalan',
        data: tsValues,
        backgroundColor: '#22D3EE',
        borderColor: '#0F172A',
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 10,
        categoryPercentage: 0.68,
        barPercentage: 0.85,
        stack: 'material',
        datalabels: {
          color: '#ECFEFF',
          anchor: 'end',
          align: 'left',
          offset: 2,
          clamp: true,
          formatter: (value: unknown) => formatNumber(Number(value ?? 0)),
          font: {
            size: 11,
            weight: 700,
          },
        },
      },
      {
        label: 'Material Lengkap',
        data: coverageValues,
        backgroundColor: '#F59E0B',
        borderColor: '#451A03',
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 10,
        categoryPercentage: 0.68,
        barPercentage: 0.85,
        stack: 'material',
        datalabels: {
          color: '#FDE68A',
          anchor: 'end',
          align: 'right',
          offset: 2,
          clamp: true,
          formatter: (_value: unknown, context: { dataIndex: number }) =>
            formatNumber(Number(endValues[context.dataIndex] ?? 0)),
          font: {
            size: 11,
            weight: 700,
          },
        },
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 900,
      easing: 'easeOutQuart',
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    layout: {
      padding: {
        top: 6,
        right: 0,
        bottom: 6,
        left: 0,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#D1D5DB',
          font: { size: 12 },
          padding: 14,
          boxWidth: 18,
          boxHeight: 10,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#111827',
        borderColor: '#374151',
        borderWidth: 1,
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => (items.length ? String(items[0].label) : '-'),
          afterBody: (items) => {
            const row = chartData[items[0]?.dataIndex ?? 0];
            if (!row) return [];

            return [
              `ID Product: ${row.id_product}`,
              `Max trainset: ${formatNumber(Number(row.max_trainset))}`,
              `Gap: ${formatNumber(Number(row.gap_trainset))}`,
              `Status: ${row.status}`,
            ];
          },
          label: (context) => `${context.dataset.label}: ${formatNumber(Number(context.raw ?? 0))}`,
        },
      },
      datalabels: {
        clip: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        min: axisDomainStart,
        max: axisDomainEnd,
        grid: {
          color: 'rgba(148, 163, 184, 0.22)',
          tickBorderDash: [3, 3],
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 12 },
          callback: (value) => formatNumber(Number(value ?? 0)),
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#E5E7EB',
          font: { size: 11 },
          padding: 2,
        },
      },
    },
  };

  return (
    <Card className="border border-gray-800/60 bg-gray-900/60 w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-white">Kelengkapan Material</CardTitle>
        <CardDescription className="text-gray-400">
          Komparasi Kelengkapan Material dan Trainset Berjalan.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2 pr-0">
        {chartData.length > 0 ? (
          <div className="w-full">
            <div style={{ minWidth: 0, height: chartHeight }}>
              <Bar data={dataset} options={options} />
            </div>
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-950/40 text-sm text-gray-400">
            Tidak ada data plotting material.
          </div>
        )}
      </CardContent>
    </Card>
  );
}