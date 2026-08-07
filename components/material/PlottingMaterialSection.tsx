'use client';

import { useEffect, useMemo, useState } from 'react';
import PlottingMaterialStackedBarChart from '@/components/material/PlottingMaterialStackedBarChart';
import PlottingMaterialStatusDoughnutChart from '@/components/material/PlottingMaterialStatusDoughnutChart';
import PlottingMaterialTabelComponent from '@/components/material/PlottingMaterialTabel';
import type { ProdukKurang, StatusMaterialPie, TabelPlotting } from '../../lib/queries/material_plotting';

interface PlottingMaterialSectionProps {
  stackedBarData?: ProdukKurang[];
  tableData?: TabelPlotting[];
  statusMaterialData?: StatusMaterialPie[];
}

export default function PlottingMaterialSection({ stackedBarData = [], tableData = [], statusMaterialData = [] }: PlottingMaterialSectionProps) {
  const [projectFilter, setProjectFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [statusData, setStatusData] = useState<StatusMaterialPie[]>(statusMaterialData);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  const filteredStackedBarData = useMemo(() => {
    let filtered = stackedBarData;
    if (projectFilter !== 'All') {
      filtered = filtered.filter((item) => item.project === projectFilter);
    }
    if (productFilter !== 'All') {
      filtered = filtered.filter((item) => item.produk === productFilter);
    }
    return filtered;
  }, [projectFilter, productFilter, stackedBarData]);

  // compute stacked bar chart height to coordinate doughnut height (same logic as chart component)
  const stackedDisplayCount = Math.min(filteredStackedBarData.length, 15);
  const stackedChartHeight = Math.max(240, stackedDisplayCount * 36 + 24);
  const doughnutHeight = Math.floor(stackedChartHeight / 2);

  const filteredStatusMaterialData = statusData;

  const filteredTotalCount = useMemo(() => {
    return filteredStatusMaterialData.reduce((sum, item) => sum + Number(item.total ?? 0), 0);
  }, [filteredStatusMaterialData]);

  useEffect(() => {
    async function fetchStatusData() {
      try {
        setStatusData(statusMaterialData);
        setIsStatusLoading(true);

        const params = new URLSearchParams();
        if (projectFilter !== 'All') params.set('project', projectFilter);
        if (productFilter !== 'All') params.set('product', productFilter);

        const url = `/api/plotting-material/status${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to fetch status data: ${response.status}`);
        }

        const data = (await response.json()) as StatusMaterialPie[];
        setStatusData(data);
      } catch (error) {
        console.error('Error fetching filtered status material data:', error);
      } finally {
        setIsStatusLoading(false);
      }
    }

    fetchStatusData();
  }, [projectFilter, productFilter, statusMaterialData]);

  const projectRows = useMemo(() => {
    let filtered = tableData;
    if (projectFilter !== 'All') {
      filtered = filtered.filter((r) => r.project === projectFilter);
    }
    if (productFilter !== 'All') {
      filtered = filtered.filter((r) => r.produk === productFilter);
    }
    return filtered;
  }, [projectFilter, productFilter, tableData]);

  const { shortagePercentage, avgLeadTime, totalDeviasiQty } = useMemo(() => {
    const totalDeviasi = projectRows.reduce((s, r) => s + Number(r.deviasi_qty ?? 0), 0);
    const shortageSum = projectRows.reduce((s, r) => {
      const dev = Number(r.deviasi_qty ?? 0);
      const gud = Number(r.qty_gudang ?? 0);
      return s + Math.max(0, dev - gud);
    }, 0);
    const leadTimes = projectRows.map((r) => Number(r.lead_time ?? NaN)).filter((v) => Number.isFinite(v));
    const avgLead = leadTimes.length ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0;
    const shortagePct = totalDeviasi ? Math.round((shortageSum / totalDeviasi) * 100) : 0;
    return { shortagePercentage: shortagePct, avgLeadTime: avgLead, totalDeviasiQty: totalDeviasi };
  }, [projectRows]);

  return (
    <div className="relative">
      {isStatusLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-slate-900/95 px-6 py-5 text-center text-white shadow-xl">
            <div className="mb-3 text-lg font-semibold">Memuat Plotting Material...</div>
            <div className="h-2 w-36 rounded-full bg-slate-700 opacity-80 animate-pulse" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-0 items-start">
        <PlottingMaterialStackedBarChart data={filteredStackedBarData} />
        <PlottingMaterialStatusDoughnutChart
          data={filteredStatusMaterialData}
          doughnutHeight={doughnutHeight}
          totalDeviasiQty={totalDeviasiQty}
          shortagePercentage={shortagePercentage}
          avgLeadTime={avgLeadTime}
        />
      </div>

      <div id="data-tabel-plotting" style={{ marginTop: 32 }}>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Data Tabel Plotting Material</h2>
          <PlottingMaterialTabelComponent
            data={tableData}
            projectFilter={projectFilter}
            onProjectFilterChange={setProjectFilter}
            productFilter={productFilter}
            onProductFilterChange={setProductFilter}
          />
        </div>
      </div>
    </div>
  );
}