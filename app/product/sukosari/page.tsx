 'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ModernSidebar from '@/components/ui/sidebar';
import ProductTrainsetChartSukosari from '@/components/product/ProductTrainsetChartSukosari';
import ProductSummaryListSukosari from '@/components/product/ProductSummaryListSukosari';
import type { ProductPercentageSukosari } from '@/lib/queries/production-progress-protrack';
export const dynamic = 'force-dynamic';

type Props = {
  data: ProductPercentageSukosari[];
  initialTrainset?: string;
};

export default function WorkshopSukosariPage({ data: initialData, initialTrainset }: Props) {
  const [data, setData] = useState<ProductPercentageSukosari[]>(initialData || []);
  const [allData, setAllData] = useState<ProductPercentageSukosari[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTrainset, setSelectedTrainset] = useState<string>(initialTrainset || '');



  const getFirstWeekOfMonthTrainset = (items: ProductPercentageSukosari[]): string | null => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const seventhDayOfMonth = new Date(currentYear, currentMonth, 7);

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
    if (selectedProject || projectOptions.length === 0 || allData.length === 0) return;

    const latestRow = allData.reduce<
      ProductPercentageSukosari | undefined
    >((latest, item) => {
      if (!item.start_actual) return latest;
      if (!latest || !latest.start_actual) return item;
      return new Date(item.start_actual) > new Date(latest.start_actual) ? item : latest;
    }, undefined);

    if (latestRow?.project && projectOptions.includes(String(latestRow.project))) {
      setSelectedProject(String(latestRow.project));
    } else {
      setSelectedProject(projectOptions[0] || '');
    }
  }, [allData, projectOptions, selectedProject]);

  // Set default trainset only when project changes (do not depend on selectedTrainset to avoid reset on user selection)
  useEffect(() => {
    if (!selectedProject) {
      setSelectedTrainset('');
      return;
    }

    // Pick most recent trainset for selected project as default (only on project change)
    const projectRows = allData.filter((item) => String(item.project) === selectedProject && ((item as any).start_actual || item.tanggal_mulai));
    if (projectRows.length > 0) {
      const latestRow = projectRows.reduce((latest, item) => {
        const a = (item as any).start_actual ?? item.tanggal_mulai;
        const b = latest ? ((latest as any).start_actual ?? latest.tanggal_mulai) : undefined;
        if (!b) return item;
        return new Date(String(a)) > new Date(String(b)) ? item : latest;
      }, projectRows[0]);

      if (latestRow?.trainset) {
        setSelectedTrainset(String(latestRow.trainset));
      }
    }
  }, [selectedProject, allData]);

  // Validate trainset is in list when trainsetOptions changes (but don't override user choice)
  useEffect(() => {
    if (!trainsetOptions.length) {
      setSelectedTrainset('');
      return;
    }
    if (selectedTrainset && !trainsetOptions.includes(selectedTrainset)) {
      setSelectedTrainset(trainsetOptions[0]);
    }
  }, [trainsetOptions]);

  useEffect(() => {
    if (allData.length > 0) return;
    let mounted = true;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/product/percentage-sukosari');
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
        const res = await fetch('/api/product/project-options-sukosari');
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (!mounted) return;
        const apiOptions = Array.isArray(json.data) ? json.data : [];
        if (apiOptions.length > 0) {
          setProjectOptions(apiOptions);
        } else {
          const derived = Array.from(new Set(allData.map((d) => String(d.project || '').trim()).filter(Boolean)));
          setProjectOptions(derived);
        }
      } catch (e) {
        if (!mounted) return;
        console.error('Gagal memuat pilihan project:', e);
        const derived = Array.from(new Set(allData.map((d) => String(d.project || '').trim()).filter(Boolean)));
        setProjectOptions(derived);
      }
    };

    fetchProjectOptions();
    return () => { mounted = false; };
  }, [allData]);

  useEffect(() => {
    if (!selectedProject && !selectedTrainset) return;

    let mounted = true;
    const fetchFilteredData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedProject) params.set('project_name', selectedProject);
        if (selectedTrainset) params.set('trainset', selectedTrainset);

        const res = await fetch(`/api/product/percentage-sukosari?${params.toString()}`);
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

  // When project changes, try server-side latest trainset (protrack), fallback to client-side
  useEffect(() => {
    const fetchLatest = async () => {
      if (!selectedProject) {
        setSelectedTrainset('');
        return;
      }
      try {
        const res = await fetch(`/api/product/latest-trainset?project=${encodeURIComponent(selectedProject)}&line=null&workshop=Sukosari`);
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

      // client-side fallback
      const projectRows = allData.filter((item) => String(item.project) === selectedProject && ((item as any).start_actual || item.tanggal_mulai));
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
            <h1 className="text-4xl font-bold text-white mb-2">Workshop Sukosari</h1>
            <p className="text-gray-400">Halaman monitoring pengerjaan produksi Workshop Sukosari</p>
          </div>

          {/* Persistent filters: always show project + trainset selectors */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end mb-4">
            <div className="flex items-center gap-3">
              <label htmlFor="project-filter-sukosari" className="text-sm font-medium text-gray-300">Project</label>
              <select
                id="project-filter-sukosari"
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
              <label htmlFor="trainset-filter-sukosari" className="text-sm font-medium text-gray-300">Trainset</label>
              <select
                id="trainset-filter-sukosari"
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
              {effectiveTrainset && <ProductSummaryListSukosari trainset={effectiveTrainset} project={selectedProject} />}
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-300 mb-2">Tidak Ada Data</h2>
                  <p className="text-gray-400">Belum ada data pengerjaan Workshop Sukosari yang tersedia</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModernSidebar>
  );
}
