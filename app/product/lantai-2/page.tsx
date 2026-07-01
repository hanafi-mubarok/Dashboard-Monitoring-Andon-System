'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ModernSidebar from '@/components/ui/sidebar';
import ProductTrainsetChartLantai2 from '@/components/product/ProductTrainsetChartLantai2';
import ProductSummaryListLantai2 from '@/components/product/ProductSummaryListLantai2';
import type { ProductPercentageLantai2 } from '@/lib/queries/production-progress-protrack';
export const dynamic = 'force-dynamic';

export default function PengerjaanLantai2Page() {
  const [data, setData] = useState<ProductPercentageLantai2[]>([]);
  const [allData, setAllData] = useState<ProductPercentageLantai2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTrainset, setSelectedTrainset] = useState<string>('');
  const [projectOptions, setProjectOptions] = useState<string[]>([]);

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
        const fetchedData = result.data || [];
        setData(fetchedData);
        setAllData(fetchedData);
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

  useEffect(() => {
    const fetchProjectOptions = async () => {
      try {
        const res = await fetch('/api/product/project-options-lantai2');
        if (!res.ok) throw new Error('Failed to fetch project options');
        const json = await res.json();
        setProjectOptions(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        console.error('Failed to load project options:', err);
        setProjectOptions([]);
      }
    };

    fetchProjectOptions();
  }, []);

  useEffect(() => {
    if (!selectedProject && !selectedTrainset) return;
    let mounted = true;

    const fetchFilteredData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedProject) params.set('project_name', selectedProject);
        if (selectedTrainset) params.set('trainset', selectedTrainset);

        const res = await fetch(`/api/product/percentage-lantai2?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        const json = await res.json();
        console.log('Fetched filtered data:', json.data);
        if (!mounted) return;
        setData(Array.isArray(json.data) ? json.data : []);
        console.log('Fetched filtered data:', json.data);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to fetch filtered product percentage data:', err);
        setError('Gagal memuat data');
        setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFilteredData();
    return () => { mounted = false; };
  }, [selectedProject, selectedTrainset]);

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
      const dateVal = (item as any).start_actual ?? item.tanggal_mulai;
      if (item.trainset && dateVal) {
        const startDate = new Date(dateVal as string);
        if (startDate >= firstDayOfMonth && startDate <= seventhDayOfMonth) {
          trainsetInFirstWeek.set(String(item.trainset), dateVal as string);
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
    if (!selectedProject && projectOptions.length > 0) {
      setSelectedProject(projectOptions[0]);
    }
  }, [projectOptions, selectedProject]);

  useEffect(() => {
    // When project changes, try to get latest trainset from protrack (server-side),
    // fallback to client-side allData if API returns nothing.
    const fetchLatest = async () => {
      if (!selectedProject) {
        setSelectedTrainset('');
        return;
      }
      try {
        const res = await fetch(`/api/product/latest-trainset?project=${encodeURIComponent(selectedProject)}&line=Lantai%202&workshop=Candisewu`);
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
        }, projectRows[0] as ProductPercentageLantai2 | undefined);

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
  }, [selectedProject, allData]);

  useEffect(() => {
    if (!trainsetOptions.length) {
      setSelectedTrainset('');
      return;
    }
    if (selectedTrainset && !trainsetOptions.includes(selectedTrainset)) {
      setSelectedTrainset(trainsetOptions[0]);
    }
  }, [trainsetOptions]);

  // Set default trainset value based on first week of month on data load
  useEffect(() => {
    if (allData.length > 0 && !selectedTrainset) {
      const firstWeekTrainset = getFirstWeekOfMonthTrainset(allData);
      setSelectedTrainset(firstWeekTrainset || trainsetOptions[0] || '');
    }
  }, [allData.length]); // Only depend on allData.length to initialize once

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
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex items-center gap-3">
                  <label htmlFor="project-filter-lantai2" className="text-sm font-medium text-gray-300">Project</label>
                  <select
                    id="project-filter-lantai2"
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
              </div>

              {data.length > 0 ? (
                <>
                  <ProductTrainsetChartLantai2 data={data} trainset={effectiveTrainset} />
                  {effectiveTrainset && <ProductSummaryListLantai2 trainset={effectiveTrainset} project={selectedProject} />}
                </>
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
          )}
        </div>
      </div>
    </ModernSidebar>
  );
}
