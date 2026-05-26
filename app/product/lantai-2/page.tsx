'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ModernSidebar from '@/components/ui/sidebar';
import ProductTrainsetChartLantai2 from '@/components/product/ProductTrainsetChartLantai2';
import ProductSummaryListLantai2 from '@/components/product/ProductSummaryListLantai2';
import type { ProductPercentageLantai2 } from '@/lib/queries/production-progress-protrack';
export const dynamic = 'force-dynamic';

export default function PengerjaanLantai2Page() {
  const [data, setData] = useState<ProductPercentageLantai2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrainset, setSelectedTrainset] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/product/percentage-lantai2');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        //console.log('[Page] Fetched data:', result);
        setData(result.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch product percentage data:', err);
        setError('Gagal memuat data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFirstWeekOfMonthTrainset = (items: ProductPercentageLantai2[]): string | null => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Minggu pertama bulan = tanggal 1-7
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const seventhDayOfMonth = new Date(currentYear, currentMonth, 7);
    
    // Filter trainset yang memiliki tanggal_mulai dalam minggu pertama
    const trainsetInFirstWeek = new Map<string, Date | string>();
    items.forEach((item) => {
      if (item.trainset && item.tanggal_mulai) {
        const startDate = new Date(item.tanggal_mulai);
        if (startDate >= firstDayOfMonth && startDate <= seventhDayOfMonth) {
          trainsetInFirstWeek.set(String(item.trainset), item.tanggal_mulai);
        }
      }
    });
    
    if (trainsetInFirstWeek.size > 0) {
      // Kembalikan trainset dengan tanggal_mulai paling awal
      let earliestTrainset: string | null = null;
      let earliestDate: Date | null = null;
      
      trainsetInFirstWeek.forEach((date, trainset) => {
        const d = new Date(date);
        if (!earliestDate || d < earliestDate) {
          earliestDate = d;
          earliestTrainset = trainset;
        }
      });
      
      return earliestTrainset;
    }
    
    return null;
  };

  const trainsetOptions = useMemo(() => {
    const trainsets = new Set<string>();
    data.forEach((item) => {
      if (item.trainset) {
        trainsets.add(String(item.trainset));
      }
    });
    return Array.from(trainsets).sort((a, b) => {
      const aNum = Number(a);
      const bNum = Number(b);
      return aNum - bNum;
    });
  }, [data]);

  // Set default trainset value based on first week of month on data load
  useEffect(() => {
    if (data.length > 0 && !selectedTrainset) {
      const firstWeekTrainset = getFirstWeekOfMonthTrainset(data);
      setSelectedTrainset(firstWeekTrainset || trainsetOptions[0] || '');
    }
  }, [data.length]); // Only depend on data.length to initialize once

  const effectiveTrainset = selectedTrainset || '';

  return (
    <ModernSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Pengerjaan Lantai 2</h1>
            <p className="text-gray-400">Halaman monitoring pengerjaan produksi lantai 2</p>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                  </div>
                  <p className="text-gray-400 mt-4">Memuat data...</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-red-400 mb-2">Error</h2>
                  <p className="text-gray-400">{error}</p>
                </div>
              </div>
            </div>
          ) : data.length > 0 ? (
            <div className="space-y-6">
              {/* Trainset Selector */}
              <div className="flex items-center gap-3 justify-end">
                <label htmlFor="trainset-filter-lantai2" className="text-sm font-medium text-gray-300">
                  Trainset
                </label>
                <select
                  id="trainset-filter-lantai2"
                  value={effectiveTrainset}
                  onChange={(event) => setSelectedTrainset(event.target.value)}
                  className="min-w-[160px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500"
                >
                  {trainsetOptions.length > 0 ? (
                    trainsetOptions.map((trainset) => (
                      <option key={trainset} value={trainset}>
                        Trainset {trainset}
                      </option>
                    ))
                  ) : (
                    <option value="">Tidak ada data</option>
                  )}
                </select>
              </div>

              {/* Chart */}
              <ProductTrainsetChartLantai2 data={data} trainset={effectiveTrainset} />

              {/* Summary Cards - Only render when effectiveTrainset is set */}
              {effectiveTrainset && <ProductSummaryListLantai2 trainset={effectiveTrainset} />}
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-300 mb-2">
                    Tidak Ada Data
                  </h2>
                  <p className="text-gray-400">
                    Belum ada data pengerjaan lantai 2 yang tersedia
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModernSidebar>
  );
}
