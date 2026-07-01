'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Legend,
  LinearScale,
  Tooltip,
  Title,
  BarController,
  LineController,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar } from 'react-chartjs-2';
import type { ProductPercentageSukosari } from '@/lib/queries/production-progress-protrack';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

interface ProductTrainsetChartSukosariProps {
  data: ProductPercentageSukosari[];
  trainset: string | number;
}

interface GroupedData {
  productName: string;
  items: ProductPercentageSukosari[];
}

export default function ProductTrainsetChartSukosari({ data, trainset }: ProductTrainsetChartSukosariProps) {
  const effectiveTrainset = String(trainset);

  const groupedData = useMemo(() => {
    const rowsForTrainset = data.filter((item) => String(item.trainset ?? '').trim() === effectiveTrainset);
    
    //console.log('[Chart] Filtered rows for trainset:', effectiveTrainset, rowsForTrainset);

    const grouped = new Map<string, ProductPercentageSukosari[]>();
    rowsForTrainset.forEach((row) => {
      const productName = String(row.product_name ?? '').trim() || `product-${grouped.size}`;
      if (!grouped.has(productName)) {
        grouped.set(productName, []);
      }
      grouped.get(productName)!.push(row);
    });

    const result = Array.from(grouped.entries()).map(([productName, items]) => ({
      productName,
      items: items.sort((a, b) => {
        const processA = String(a.proses_produk ?? '').trim();
        const processB = String(b.proses_produk ?? '').trim();
        return processA.localeCompare(processB);
      }),
    }));

    //console.log('[Chart] Grouped data:', result);
    return result;
  }, [data, effectiveTrainset]);

  const { maxValue, labels, datasets, allItems, itemMap } = useMemo(() => {
    // Filter out items with 0% percentage first
    const nonZeroItems: ProductPercentageSukosari[] = [];
    groupedData.forEach((group) => {
      group.items.forEach((item) => {
        const percentage = Number(item.percentage ?? 0);
        if (percentage !== 0) {
          nonZeroItems.push(item);
        }
      });
    });

    //console.log('[Chart] Non-zero items:', nonZeroItems);

    // Get unique product names from ALL items (including those with 0%)
    const productList: string[] = [];
    const productIndexMap = new Map<string, number>();
    
    groupedData.forEach((group) => {
      const productName = String(group.productName ?? '').trim() || `product-${productList.length}`;
      if (!productIndexMap.has(productName)) {
        productIndexMap.set(productName, productList.length);
        productList.push(productName);
      }
    });

    //console.log('[Chart] Products (from all items):', productList);

    // Get unique process names with colors
    const processColors: Map<string, { bg: string; border: string }> = new Map();
    const colorPalette = [
      { bg: '#06B6D4', border: '#0891B2' }, // Cyan
      { bg: '#8B5CF6', border: '#7C3AED' }, // Purple
      { bg: '#EC4899', border: '#DB2777' }, // Pink
      { bg: '#F59E0B', border: '#D97706' }, // Amber
    ];

    let colorIndex = 0;
    const processList: string[] = [];
    const processIndexMap = new Map<string, number>();

    nonZeroItems.forEach((item) => {
      const processName = String(item.proses_produk ?? '').trim() || 'Unknown Process';
      if (!processIndexMap.has(processName)) {
        processIndexMap.set(processName, processList.length);
        processList.push(processName);
        processColors.set(processName, colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
      }
    });

    //console.log('[Chart] Processes:', processList);

    // Create a map for quick item lookup: product -> process -> item
    const itemMap = new Map<string, Map<string, ProductPercentageSukosari>>();
    nonZeroItems.forEach((item) => {
      const productName = String(item.product_name ?? '').trim() || `product-${productList.length}`;
      const processName = String(item.proses_produk ?? '').trim() || 'Unknown Process';
      
      if (!itemMap.has(productName)) {
        itemMap.set(productName, new Map());
      }
      itemMap.get(productName)!.set(processName, item);
    });

    // Create datasets - one dataset per process
    const newDatasets: any[] = [];
    processList.forEach((processName) => {
      const colors = processColors.get(processName)!;
      const dataValues = productList.map((productName) => {
        const item = itemMap.get(productName)?.get(processName);
        return item ? Number(item.percentage ?? 0) : 0;
      });

      newDatasets.push({
        label: processName,
        data: dataValues,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 6,
      });
    });

    // Add target line
    newDatasets.push({
      type: 'line',
      label: 'Target 100%',
      data: productList.map(() => 100),
      borderColor: '#F43F5E',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [6, 6],
      pointRadius: 0,
      fill: false,
      order: 0,
    });

    const newMaxValue = Math.max(
      100,
      ...nonZeroItems.map((item) => Number(item.percentage ?? 0))
    );

    //console.log('[Chart] Max value:', newMaxValue);
    //console.log('[Chart] Labels (products):', productList);
    //console.log('[Chart] Datasets:', newDatasets.map(d => ({ label: d.label, data: d.data })));

    return {
      maxValue: newMaxValue,
      labels: productList,
      datasets: newDatasets,
      allItems: nonZeroItems,
      itemMap: itemMap,
    };
  }, [groupedData]);

  const chartData = {
    labels,
    datasets,
  };

  const options: ChartOptions<'bar'> = {
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
          title: (items) => {
            if (items.length === 0) return '';
            const dataIndex = items[0].dataIndex;
            return String(labels[dataIndex] ?? '');
          },
          label: (context) => {
            const label = String(context.dataset.label ?? '');
            const value = Number(context.parsed.y);
            
            if (label === 'Target 100%') {
              return `${label}: 100%`;
            }
            return `${label}: ${value}%`;
          },
          afterLabel: (context) => {
            if (String(context.dataset.label ?? '') === 'Target 100%') {
              return '';
            }

            // Find item using product name (from labels) and process name (from dataset label)
            const productName = String(labels[context.dataIndex] ?? '');
            const processName = String(context.dataset.label ?? '');
            
            const processMap = itemMap?.get(productName);
            const item = processMap?.get(processName);
            //console.log('[Chart] Tooltip afterLabel lookup:', { productName, processName, item });
            if (item) {
              return [
                `QTY Progress: ${Number(item.qty_progress ?? 0).toLocaleString('id-ID')}`,
                `Total: ${Number(item.total ?? 0).toLocaleString('id-ID')}`,
              ];
            }
            return '';
          },
        },
      },
      datalabels: {
        color: '#E5E7EB',
        anchor: 'end',
        align: 'top',
        offset: 4,
        clamp: true,
        formatter: (value, context) => {
          const label = String(context.dataset.label ?? '');
          // Jangan tampilkan label untuk Target 100%
          if (label === 'Target 100%') {
            return '';
          }
          return `${Number(value).toLocaleString('id-ID', { maximumFractionDigits: 0 })}%`;
        },
        font: {
          weight: 'bold',
          size: 11,
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
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        max: Math.max(120, Math.ceil(maxValue * 1.1)),
        grid: {
          color: 'rgba(148, 163, 184, 0.12)',
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 12 },
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: 'Persentase',
          color: '#D1D5DB',
        },
      },
    },
  };

  return (
    <Card className="mb-6 border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-700/50">
        <CardTitle className="text-white">Grafik Produk per Trainset - Sukosari</CardTitle>
      </CardHeader>


      <CardContent className="p-4 sm:p-6">
        {groupedData.length > 0 && labels.length > 0 ? (
          <div className="h-[480px] w-full">
            <Bar data={chartData} options={options} />
          </div>
        ) : (
          <div className="flex h-[480px] items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-900/30 text-sm text-gray-400">
            Tidak ada data untuk trainset {effectiveTrainset || '-'}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

