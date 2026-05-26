"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import {
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  annotationPlugin,
  ChartDataLabels,
);

type OperatorGraphicsItem = {
  bulan: string;
  trainset?: number | string;
  jumlah_selesai: number;
  jumlah_not_ok: number;
  jumlah_terlambat: number;
  jumlah_kurang_komponen: number;
  total_on_progress: number;
  total_jam_kerja: number;
};

interface OperatorGraphicsChartProps {
  data: OperatorGraphicsItem[];
}

export default function OperatorGraphicsChart({ data }: OperatorGraphicsChartProps) {
  const rose = '#F43F5E';
  const emerald = '#10B981';
  const blue = '#F97316';
  const amber = '#F59E0B';
  const cyan = '#06B6D4';

  const maxItem = Math.max(
    60,
    ...data.flatMap((item) => [
      Number(item.jumlah_selesai ?? 0),
      Number(item.jumlah_not_ok ?? 0),
      Number(item.jumlah_terlambat ?? 0),
      Number(item.jumlah_kurang_komponen ?? 0),
      Number(item.total_on_progress ?? 0),
    ]),
  );

  const chartData: ChartData<'bar', number[], string> = {
    labels: data.map((item) => `Trainset ${String(item.trainset ?? item.bulan)}`),
    datasets: [
     {
        label: 'On Progress',
        data: data.map((item) => Number(item.total_on_progress ?? 0)),
        borderColor: cyan,
        backgroundColor: cyan,
        borderRadius: 10,
        borderWidth: 1,
        datalabels: {
          opacity: 0,
        },
      },
      {
        label: 'Selesai',
        data: data.map((item) => Number(item.jumlah_selesai ?? 0)),
        borderColor: emerald,
        backgroundColor: emerald,
        borderRadius: 10,
        borderWidth: 1,
        datalabels: {
          opacity: 0,
        },
      },
      {
        label: 'Terlambat',
        data: data.map((item) => Number(item.jumlah_terlambat ?? 0)),
        borderColor: amber,
        backgroundColor: amber,
        borderRadius: 10,
        borderWidth: 1,
        datalabels: {
          opacity: 0,
        },
      },
      {
        label: 'Kurang Komponen',
        data: data.map((item) => Number(item.jumlah_kurang_komponen ?? 0)),
        borderColor: blue,
        backgroundColor: blue,
        borderRadius: 10,
        borderWidth: 1,
        datalabels: {
          opacity: 0,
        },
      },
            {
        label: 'Not OK',
        data: data.map((item) => Number(item.jumlah_not_ok ?? 0)),
        borderColor: rose,
        backgroundColor: rose,
        borderRadius: 10,
        borderWidth: 1,
        datalabels: {
          opacity: 0,
        },
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#D1D5DB',
          font: { size: 12 },
          padding: 16,
          generateLabels: (chart) => {
            const defaultLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);

            return [
              ...defaultLabels,
              {
                text: 'Target (60 Item)',
                fillStyle: 'transparent',
                strokeStyle: rose,
                lineWidth: 2,
                lineDash: [5, 5],
                hidden: false,
                datasetIndex: -1,
              },
            ];
          },
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
      },
      datalabels: {
        display: false,
      },
      annotation: {
        annotations: {
          targetLine: {
            type: 'line',
            yMin: 60,
            yMax: 60,
            borderColor: rose,
            borderWidth: 2,
            borderDash: [5, 5],
            drawTime: 'beforeDatasetsDraw',
            label: {
              display: false,
            },
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 12 },
        },
      },
      y: {
        max: Math.ceil(maxItem * 1.15),
        grid: {
          display: false,
        },
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Total Item',
          color: '#D1D5DB',
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 12 },
          stepSize: 1,
        },
      },
    },
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 mb-6">
      <CardHeader>
        <CardTitle className="text-white">Grafik Kinerja Operator per Bulan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
