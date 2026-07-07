'use client';

import { useEffect, useState, useMemo } from 'react';
import ProductSummaryCardSukosari from './ProductSummaryCardSukosari';
import { Card, CardContent } from '@/components/ui/card';
import type { ProductSummarySukosari } from '@/lib/queries/production-progress-protrack';

interface ProductSummaryListSukosariProps {
  trainset: string | number;
  project?: string;
  workshop?: string;
}

export default function ProductSummaryListSukosari({ trainset, project, workshop = 'Sukosari' }: ProductSummaryListSukosariProps) {
  const [data, setData] = useState<ProductSummarySukosari[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('trainset', String(trainset));
        if (project) params.set('project_name', project);
        const endpoint = workshop.toLowerCase() === 'tiron' ? 'summary-tiron' : 'summary-sukosari';
        const response = await fetch(`/api/product/${endpoint}?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        setData(result.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch product summary Sukosari data:', err);
        setError('Gagal memuat data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainset]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
            <p className="text-gray-400 mt-4">Memuat data summary produk...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Tidak Ada Data</h2>
            <p className="text-gray-400">Belum ada data summary produk untuk trainset ini</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Summary Produk - {workshop}</h2>
      </div>
      <div className="grid gap-4">
        {data.map((product, index) => (
          <ProductSummaryCardSukosari
            key={`${product.id_product}-${index}`}
            data={product}
          />
        ))}
      </div>
      {/* Aggregate footer across all products */}
      {data.length > 0 && (
        <Card className="border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="px-4 py-3 sm:px-5 sm:py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="w-full sm:w-1/2">
                <p className="text-xs font-semibold text-gray-400">Rata-rata Presentase Semua Produk</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${Math.round((data.reduce((s, p) => s + Number(p.percentage ?? 0), 0) / data.length) || 0)}%` }}
                    />
                  </div>
                  <span className="min-w-fit rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400">
                    {`${Math.round((data.reduce((s, p) => s + Number(p.percentage ?? 0), 0) / data.length) || 0)}%`}
                  </span>
                </div>
              </div>

              <div className="text-right sm:text-right">
                <p className="text-xs font-semibold text-gray-400">Akumulasi Semua Produk</p>
                <p className="mt-1 text-sm font-bold text-white">
                  {`${data.reduce((s, p) => s + Number(p.qty_progress ?? 0), 0).toLocaleString('id-ID')}/${data.reduce((s, p) => s + Number(p.total ?? 0), 0).toLocaleString('id-ID')}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

