'use client';

import { useEffect, useState, useMemo, type MouseEvent } from 'react';
import ModernSidebar from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Search, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PAGE_SIZE = 100;

interface PotensiKekuranganMaterial {
  id: string;
  trainset: number;
  product_name: string;
  komat: string;
  spesifikasi: string;
  satuan: string;
  jumlah_diminta: number;
  jumlah_tiapts: number;
  kebutuhan_produk: number;
  kebutuhan_incremental: number;
  stok_ppc: number;
  stok_warehouse: number;
  total_stok: number;
  jumlah_kekurangan: number;
  status_material: 'Potensi Kurang' | 'Aman';
}

interface PotensiKekuranganMaterialRow {
  trainset: number | null;
  product_name: string | null;
  komat: string | null;
  spesifikasi: string | null;
  satuan: string | null;
  jumlah_diminta: number | null;
  jumlah_tiapts: number | null;
  kebutuhan_produk: number | null;
  kebutuhan_incremental: number | null;
  stok_ppc: number | null;
  stok_warehouse: number | null;
  total_stok: number | null;
  jumlah_kekurangan: number | null;
  status_material: 'Potensi Kurang' | 'Aman' | null;
}

interface KekuranganMaterialChartRow {
  trainset: number | null;
  product_name: string | null;
  jumlah_material_kurang: number | null;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Aman':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    case 'Potensi Kurang':
      return 'bg-red-500/20 text-red-300 border-red-500/50';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  }
}

function getStatusIcon(status: string) {
  if (status === 'Potensi Kurang') {
    return <AlertCircle className="w-4 h-4" />;
  }
  return null;
}

type SortKey =
  | 'trainset'
  | 'product_name'
  | 'komat'
  | 'spesifikasi'
  | 'jumlah_diminta'
  | 'jumlah_tiapts'
  | 'kebutuhan_produk'
  | 'kebutuhan_incremental'
  | 'stok_ppc'
  | 'stok_warehouse'
  | 'total_stok'
  | 'jumlah_kekurangan'
  | 'status_material';

type SortDirection = 'asc' | 'desc';

type SortCriterion = {
  key: SortKey;
  direction: SortDirection;
};

function compareStatusMaterial(left: string, right: string) {
  const weight = (value: string) => (value === 'Potensi Kurang' ? 0 : 1);
  return weight(left) - weight(right);
}

function formatQuantity(value: number, unit: string) {
  const formattedValue = value.toLocaleString('id-ID');
  return unit.trim() ? `${formattedValue} ${unit}` : formattedValue;
}

function renderCenteredQuantity(value: number, unit: string, prefix = '') {
  return (
    <span className="inline-flex w-full justify-center">
      {prefix}{formatQuantity(value, unit)}
    </span>
  );
}

function transformData(rows: PotensiKekuranganMaterialRow[]): PotensiKekuranganMaterial[] {
  return rows.map((row, idx) => ({
    id: `${row.komat}-${row.trainset}-${idx}`,
    trainset: row.trainset || 0,
    product_name: row.product_name || '',
    komat: row.komat || '',
    spesifikasi: row.spesifikasi || '',
    satuan: row.satuan || '',
    jumlah_diminta: row.jumlah_diminta || 0,
    jumlah_tiapts: row.jumlah_tiapts || 0,
    kebutuhan_produk: row.kebutuhan_produk || 0,
    kebutuhan_incremental: row.kebutuhan_incremental || 0,
    stok_ppc: row.stok_ppc || 0,
    stok_warehouse: row.stok_warehouse || 0,
    total_stok: row.total_stok || 0,
    jumlah_kekurangan: row.jumlah_kekurangan || 0,
    status_material: row.status_material as 'Potensi Kurang' | 'Aman',
  }));
}

export default function PotensiKekuranganMaterialPage() {
  const [allData, setAllData] = useState<PotensiKekuranganMaterial[]>([]);
  const [chartRows, setChartRows] = useState<KekuranganMaterialChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { key: 'status_material', direction: 'asc' },
    { key: 'kebutuhan_incremental', direction: 'asc' },
    { key: 'komat', direction: 'asc' },
    { key: 'trainset', direction: 'asc' },
  ]);

  const [searchKomat, setSearchKomat] = useState('');
  const [filterProductName, setFilterProductName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTrainset, setFilterTrainset] = useState('');

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/material/potensi-kekurangan');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          const transformed = transformData(result.data);
          const chartData = Array.isArray(result.chartData) ? result.chartData : [];
          
          // Filter WHERE komat IS NOT NULL
          const filtered = transformed.filter(item => item.komat && item.komat.trim() !== '');
          
          setAllData(filtered);
          setChartRows(chartData);
          setError(null);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Gagal memuat data:', err);
        setError('Gagal memuat data potensi kekurangan material');
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique filter options
  const productNames = useMemo(() => {
    const unique = Array.from(new Set(allData.map(d => d.product_name).filter(Boolean)));
    return unique.sort();
  }, [allData]);

  const trainsets = useMemo(() => {
    const unique = Array.from(new Set(allData.map(d => d.trainset)));
    return unique.sort((a, b) => a - b);
  }, [allData]);

  const statuses = useMemo(() => {
    return Array.from(new Set(allData.map(d => d.status_material))).sort();
  }, [allData]);

  const barColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  const chartOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
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
            label: (context) => {
              const value = Number(context.parsed.y ?? 0).toLocaleString('id-ID');
              return `${context.dataset.label}: ${value}`;
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
            font: { size: 11 },
          },
        },
        y: {
          beginAtZero: true,
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
            text: 'Jumlah Material Kurang',
            color: '#D1D5DB',
          },
        },
      },
    }),
    [],
  );

  const compareByKey = (left: PotensiKekuranganMaterial, right: PotensiKekuranganMaterial, key: SortKey) => {
    if (key === 'status_material') {
      return compareStatusMaterial(left.status_material, right.status_material);
    }

    if (
      key === 'trainset' ||
      key === 'jumlah_diminta' ||
      key === 'jumlah_tiapts' ||
      key === 'kebutuhan_produk' ||
      key === 'kebutuhan_incremental' ||
      key === 'stok_ppc' ||
      key === 'stok_warehouse' ||
      key === 'total_stok' ||
      key === 'jumlah_kekurangan'
    ) {
      return left[key] - right[key];
    }

    return String(left[key]).localeCompare(String(right[key]), 'id-ID');
  };

  const setSortByKey = (key: SortKey, isMultiSort: boolean) => {
    setSortCriteria((current) => {
      const existingIndex = current.findIndex((item) => item.key === key);

      if (!isMultiSort) {
        const nextDirection = existingIndex >= 0 && current[existingIndex].direction === 'asc' ? 'desc' : 'asc';
        return [
          { key, direction: nextDirection },
          ...current.filter((item) => item.key !== key),
        ];
      }

      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          key,
          direction: current[existingIndex].direction === 'asc' ? 'desc' : 'asc',
        };
        return updated;
      }

      return [...current, { key, direction: 'asc' }];
    });
  };

  // Filter data
  const filteredData = useMemo(() => {
    let result = allData;

    if (searchKomat.trim()) {
      const search = searchKomat.toLowerCase().trim();
      result = result.filter(item => item.komat.toLowerCase().includes(search));
    }

    if (filterProductName) {
      result = result.filter(item => item.product_name === filterProductName);
    }

    if (filterStatus) {
      result = result.filter(item => item.status_material === filterStatus);
    }

    if (filterTrainset) {
      result = result.filter(item => item.trainset === parseInt(filterTrainset));
    }

    return result;
  }, [allData, searchKomat, filterProductName, filterStatus, filterTrainset]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKomat, filterProductName, filterStatus, filterTrainset]);

  const chartData = useMemo<ChartData<'bar', Array<number | null>, string>>(() => {
    const visiblePairs = new Set(
      filteredData
        .filter((item) => item.status_material === 'Potensi Kurang')
        .map((item) => `${item.trainset}||${item.product_name}`),
    );

    const visibleRows = chartRows.filter((item) => {
      const trainsetKey = item.trainset ?? 0;
      const productKey = item.product_name || 'Unknown';
      return visiblePairs.has(`${trainsetKey}||${productKey}`);
    });

    const groupedByTrainset = visibleRows.reduce((acc, item) => {
      const trainsetKey = item.trainset ?? 0;
      const existing = acc.find((entry) => entry.trainset === trainsetKey);
      const productName = item.product_name || 'Unknown';
      const quantity = item.jumlah_material_kurang || 0;

      if (existing) {
        existing.total += quantity;
        existing[productName] = (existing[productName] || 0) + quantity;
      } else {
        acc.push({
          trainset: trainsetKey,
          total: quantity,
          [productName]: quantity,
        } as { trainset: number; total: number } & Record<string, number>);
      }

      return acc;
    }, [] as Array<{ trainset: number; total: number } & Record<string, number>>);

    const sorted = groupedByTrainset.sort((left, right) => {
      const totalDifference = left.total - right.total;
      if (totalDifference !== 0) {
        return totalDifference;
      }

      return left.trainset - right.trainset;
    });

    const labels = sorted.map((item) => `Trainset ${item.trainset}`);
    const uniqueProducts = Array.from(
      new Set(sorted.flatMap((item) => Object.keys(item).filter((key) => key !== 'trainset' && key !== 'total'))),
    ).filter((product) => sorted.some((item) => Number(item[product] ?? 0) > 0));

    return {
      labels,
      datasets: uniqueProducts.map((product, idx) => ({
        label: product,
        data: sorted.map((item) => {
          const value = Number(item[product] ?? 0);
          return value > 0 ? value : null;
        }),
        backgroundColor: barColors[idx % barColors.length],
        borderColor: barColors[idx % barColors.length],
        borderWidth: 1,
        borderRadius: 6,
      })),
    };
  }, [chartRows, filteredData]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((left, right) => {
      for (const criterion of sortCriteria) {
        const difference = compareByKey(left, right, criterion.key);
        if (difference !== 0) {
          return criterion.direction === 'asc' ? difference : -difference;
        }
      }

      return 0;
    });
  }, [filteredData, sortCriteria]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedData.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedData, currentPage]);

  const paginationPages = useMemo(() => {
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const halfWindow = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    startPage = Math.max(1, endPage - maxButtons + 1);

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [currentPage, totalPages]);

  const handleSort = (key: SortKey, isMultiSort: boolean) => {
    setSortByKey(key, isMultiSort);
  };

  const createSortHandler = (key: SortKey) => (event: MouseEvent<HTMLButtonElement>) => {
    handleSort(key, event.shiftKey);
  };

  const getSortIndicator = (key: SortKey) => {
    const index = sortCriteria.findIndex((item) => item.key === key);

    if (index === -1) {
      return <ChevronsUpDown className="ml-1 h-3 w-3 text-gray-500" />;
    }

    const direction = sortCriteria[index].direction;
    return direction === 'asc'
      ? <ChevronUp className="ml-1 h-3 w-3 text-cyan-400" />
      : <ChevronDown className="ml-1 h-3 w-3 text-cyan-400" />;
  };

  // Calculate statistics
  const kritisCount = filteredData.filter(d => d.status_material === 'Potensi Kurang').length;
  const amanCount = filteredData.filter(d => d.status_material === 'Aman').length;
  const pageStart = filteredData.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredData.length);

  if (loading) {
    return (
      <ModernSidebar>
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Potensi Kekurangan Material</h1>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </div>
      </ModernSidebar>
    );
  }

  if (error) {
    return (
      <ModernSidebar>
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Potensi Kekurangan Material</h1>
          </div>
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      </ModernSidebar>
    );
  }

  return (
    <ModernSidebar>
      <div className="p-6 sm:p-8 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Potensi Kekurangan Material</h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitor kebutuhan material incremental vs stok tersedia untuk perencanaan pengadaan.
          </p>
        </div>

        <Card className="border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Material Kurang per Trainset</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.labels?.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                Tidak ada data material kurang
              </div>
            ) : (
              <div className="h-[360px] w-full">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
          </CardContent>
        </Card>


        {/* Status Cards *
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Total Baris Material</p>
                <p className="text-3xl font-bold text-white">{filteredData.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-700/50 bg-emerald-900/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-emerald-400 text-sm mb-2">Aman</p>
                <p className="text-3xl font-bold text-emerald-400">{amanCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-red-700/50 bg-red-900/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-400 text-sm mb-2">Potensi Kurang</p>
                <p className="text-3xl font-bold text-red-400">{kritisCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        *}
        

        {/* Filters */}
        <Card className="border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="px-4 pb-4 pt-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-end">
              <div>
                <label className="text-sm text-gray-300 block mb-1">Produk</label>
                <select
                  value={filterProductName}
                  onChange={(e) => setFilterProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-gray-500"
                >
                  <option value="">Semua Produk</option>
                  {productNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300 block mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-gray-500"
                >
                  <option value="">Semua Status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300 block mb-1">Trainset</label>
                <select
                  value={filterTrainset}
                  onChange={(e) => setFilterTrainset(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-gray-500"
                >
                  <option value="">Semua Trainset</option>
                  {trainsets.map((ts) => (
                    <option key={ts} value={ts.toString()}>
                      Trainset {ts}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative lg:justify-self-end w-full">
                <label className="text-sm text-gray-300 block mb-1">Cari Komat</label>
                <Search className="absolute left-3 top-[38px] w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari Komat..."
                  value={searchKomat}
                  onChange={(e) => setSearchKomat(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>

              <button
                onClick={() => {
                  setSearchKomat('');
                  setFilterProductName('');
                  setFilterStatus('');
                  setFilterTrainset('');
                }}
                className="h-[42px] px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors lg:self-end"
              >
                Reset Filter
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Daftar Material</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Tidak ada data material yang sesuai filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[85vh] overflow-auto rounded-md border border-gray-700/40">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-left p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('trainset')} className="inline-flex items-center gap-1">
                            Trainset {getSortIndicator('trainset')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-left p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('product_name')} className="inline-flex items-center gap-1">
                            Produk {getSortIndicator('product_name')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-left p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('komat')} className="inline-flex items-center gap-1">
                            Komat {getSortIndicator('komat')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-left p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('spesifikasi')} className="inline-flex items-center gap-1">
                            Spesifikasi {getSortIndicator('spesifikasi')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-right p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('jumlah_diminta')} className="inline-flex items-center gap-1 ml-auto">
                            Qty Material Diminta {getSortIndicator('jumlah_diminta')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-right p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('jumlah_tiapts')} className="inline-flex items-center gap-1 ml-auto">
                            Qty Produk {getSortIndicator('jumlah_tiapts')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-right p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('kebutuhan_produk')} className="inline-flex items-center gap-1 ml-auto">
                            Qty Material 1 TS {getSortIndicator('kebutuhan_produk')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-right p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('kebutuhan_incremental')} className="inline-flex items-center gap-1 ml-auto">
                            Qty Kebutuhan Material {getSortIndicator('kebutuhan_incremental')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-right p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('stok_ppc')} className="inline-flex items-center gap-1 ml-auto">
                            Stok PPC {getSortIndicator('stok_ppc')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-right p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('stok_warehouse')} className="inline-flex items-center gap-1 ml-auto">
                            Stok WH {getSortIndicator('stok_warehouse')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-right p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('total_stok')} className="inline-flex items-center gap-1 ml-auto">
                            Total Stok {getSortIndicator('total_stok')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-right p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('jumlah_kekurangan')} className="inline-flex items-center gap-1 ml-auto">
                            Jumlah Kekurangan {getSortIndicator('jumlah_kekurangan')}
                          </button>
                        </th>
                        <th className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur text-center p-2 text-gray-300 font-semibold">
                          <button type="button" onClick={createSortHandler('status_material')} className="inline-flex items-center gap-1 justify-center mx-auto">
                            Status {getSortIndicator('status_material')}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="p-2 text-gray-200 font-mono">{item.trainset}</td>
                          <td className="p-2 text-gray-200">{item.product_name}</td>
                          <td className="p-2 text-gray-200 font-mono">{item.komat}</td>
                          <td className="p-2 text-gray-200">{item.spesifikasi}</td>
                          <td className="p-2 text-gray-200 text-center">{renderCenteredQuantity(item.jumlah_diminta, item.satuan)}</td>
                          <td className="p-2 text-gray-200 text-center">{renderCenteredQuantity(item.jumlah_tiapts, '')}</td>
                          <td className="p-2 text-gray-200 text-center">{renderCenteredQuantity(item.kebutuhan_produk, item.satuan)}</td>
                          <td className="p-2 text-gray-200 text-center font-semibold">{renderCenteredQuantity(item.kebutuhan_incremental, item.satuan)}</td>
                          <td className="p-2 text-gray-200 text-center">{renderCenteredQuantity(item.stok_ppc, item.satuan)}</td>
                          <td className="p-2 text-gray-200 text-center">{renderCenteredQuantity(item.stok_warehouse, item.satuan)}</td>
                          <td className="p-2 text-gray-200 text-center">{renderCenteredQuantity(item.total_stok, item.satuan)}</td>
                          <td className="p-2 text-gray-200 text-center">{renderCenteredQuantity(item.jumlah_kekurangan, item.satuan, '-')}</td>
                          <td className="p-2 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status_material)}`}>
                              {getStatusIcon(item.status_material)}
                              {item.status_material}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 rounded-md border border-gray-700/40 bg-gray-900/40 px-4 py-3 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    Menampilkan {pageStart}-{pageEnd} dari {filteredData.length} data
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="rounded-md border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>

                    {paginationPages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          page === currentPage
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                            : 'border-gray-600 text-gray-200 hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-md border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernSidebar>
  );
}
