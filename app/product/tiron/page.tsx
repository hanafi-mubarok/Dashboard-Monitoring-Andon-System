'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ModernSidebar from '@/components/ui/sidebar';
import ProductTrainsetChartSukosari from '@/components/product/ProductTrainsetChartSukosari';
import ProductSummaryListSukosari from '@/components/product/ProductSummaryListSukosari';
import type { ProductPercentageTiron } from '@/lib/queries/production-progress-protrack';
export const dynamic = 'force-dynamic';

type Props = {
  data: ProductPercentageTiron[];
  initialTrainset?: string;
};

export default function WorkshopTironPage({ data: initialData, initialTrainset }: Props) {
  const [data, setData] = useState<ProductPercentageTiron[]>(initialData || []);
  const [allData, setAllData] = useState<ProductPercentageTiron[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTrainset, setSelectedTrainset] = useState<string>(initialTrainset || '');
  const [projectOptions, setProjectOptions] = useState<string[]>([]);

  const trainsetOptions = useMemo(() => {
    const trainsets = new Set<string>();
    const source = selectedProject
      ? allData.filter((item) => String(item.project) === selectedProject)
      : allData;
    source.forEach((item) => {
      if (item.trainset) {
        trainsets.add(String(item.trainset));
      }
    });
    return Array.from(trainsets).sort((a, b) => Number(a) - Number(b));
  }, [allData, selectedProject]);

  useEffect(() => {
    if (allData.length > 0) return;
    let mounted = true;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams([['workshop', 'Tiron']]);
        const res = await fetch(`/api/product/percentage-tiron?${params.toString()}`);
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (!mounted) return;
        const fetchedData = Array.isArray(json.data) ? json.data : (json.data || []);
        setData(fetchedData);
        setAllData(fetchedData);
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError('Gagal memuat data');
        setData([]);
        setAllData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllData();
    return () => { mounted = false; };
  }, [allData.length]);

  // Fetch project options (server-side) with fallback to client-derived options from allData
  useEffect(() => {
    let mounted = true;
    const fetchProjectOptions = async () => {
      try {
        const params = new URLSearchParams([['workshop', 'Tiron']]);
        const res = await fetch(`/api/product/project-options-tiron?${params.toString()}`);
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (!mounted) return;
        const apiOptions = Array.isArray(json.data) ? json.data : [];
        if (apiOptions.length > 0) {
          setProjectOptions(apiOptions);
          // Auto-select the first project if none is selected
          if (!selectedProject && apiOptions.length > 0) {
            setSelectedProject(apiOptions[0]);
          }
        } else {
          const derived = Array.from(new Set(allData.map((d) => String(d.project || '').trim()).filter(Boolean)));
          setProjectOptions(derived);
          // Auto-select the first project if none is selected
          if (!selectedProject && derived.length > 0) {
            setSelectedProject(derived[0]);
          }
        }
      } catch (e) {
        if (!mounted) return;
        console.error('Gagal memuat pilihan project:', e);
        const derived = Array.from(new Set(allData.map((d) => String(d.project || '').trim()).filter(Boolean)));
        setProjectOptions(derived);
        // Auto-select the first project if none is selected
        if (!selectedProject && derived.length > 0) {
          setSelectedProject(derived[0]);
        }
      }
    };

    fetchProjectOptions();
    return () => { mounted = false; };
  }, [allData, selectedProject]);

  useEffect(() => {
    if (!selectedProject && !selectedTrainset) return;

    let mounted = true;
    const fetchFilteredData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams([
          ['project_name', selectedProject],
          ['trainset', selectedTrainset],
          ['workshop', 'Tiron'],
        ].filter(([, value]) => Boolean(value)));

        const res = await fetch(`/api/product/percentage-tiron?${params.toString()}`);
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (!mounted) return;
        setData(Array.isArray(json.data) ? json.data : (json.data || []));
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError('Gagal memuat data');
        setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFilteredData();
    return () => { mounted = false; };
  }, [selectedProject, selectedTrainset]);

  useEffect(() => {
    const fetchLatest = async () => {
      if (!selectedProject) {
        setSelectedTrainset('');
        return;
      }

      try {
        const res = await fetch(`/api/product/latest-trainset?project=${encodeURIComponent(selectedProject)}&line=null&workshop=Tiron`);
        if (res.ok) {
          const json = await res.json();
          if (json?.trainset) {
            setSelectedTrainset(String(json.trainset));
            return;
          }
        }
      } catch (e) {
        console.error('Failed to fetch latest trainset from API:', e);
      }

      const projectRows = allData.filter(
        (item) => String(item.project) === selectedProject && ((item as any).start_actual || item.tanggal_mulai)
      );
      if (projectRows.length > 0) {
        const latestRow = projectRows.reduce((latest, item) => {
          const a = (item as any).start_actual ?? item.tanggal_mulai;
          const b = latest ? ((latest as any).start_actual ?? latest.tanggal_mulai) : undefined;
          if (!b) return item;
          return new Date(String(a)) > new Date(String(b)) ? item : latest;
        }, projectRows[0]);

        if (latestRow?.trainset) {
          setSelectedTrainset(String(latestRow.trainset));
          return;
        }
      }

      if (trainsetOptions.length > 0) {
        setSelectedTrainset(trainsetOptions[0]);
      } else {
        setSelectedTrainset('');
      }
    };

    fetchLatest();
  }, [selectedProject, allData, trainsetOptions]);

  const effectiveTrainset = selectedTrainset || '';

  return (
    <ModernSidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Workshop Tiron</h1>
            <p className="text-gray-400">Halaman monitoring pengerjaan produksi Workshop Tiron</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end mb-4">
            <div className="flex items-center gap-3">
              <label htmlFor="project-filter-tiron" className="text-sm font-medium text-gray-300">Project</label>
              <select
                id="project-filter-tiron"
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                className="min-w-[200px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500"
              >
                {projectOptions.length > 0 ? (
                  projectOptions.map((project) => (
                    <option key={project} value={project}>{project}</option>
                  ))
                ) : (
                  <option value="">Tidak ada project</option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="trainset-filter-tiron" className="text-sm font-medium text-gray-300">Trainset</label>
              <select
                id="trainset-filter-tiron"
                value={effectiveTrainset}
                onChange={(event) => setSelectedTrainset(event.target.value)}
                className="min-w-[160px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500"
              >
                {trainsetOptions.length > 0 ? (
                  trainsetOptions.map((trainset) => (
                    <option key={trainset} value={trainset}>Trainset {trainset}</option>
                  ))
                ) : (
                  <option value="">Tidak ada data</option>
                )}
              </select>
            </div>
          </div>

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
              <ProductTrainsetChartSukosari data={data} trainset={effectiveTrainset} />
              {effectiveTrainset && <ProductSummaryListSukosari trainset={effectiveTrainset} project={selectedProject} workshop="Tiron" />}
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-300 mb-2">Tidak Ada Data</h2>
                  <p className="text-gray-400">Belum ada data pengerjaan Workshop Tiron yang tersedia</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModernSidebar>
  );
}
