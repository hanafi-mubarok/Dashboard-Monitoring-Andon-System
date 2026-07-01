'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface MasterProjectFiltersProps {
  projectNameOptions: string[];
  clientNameOptions: string[];
  klasifikasiOptions: string[];
  statusOptions: string[];
}

export default function MasterProjectFilters({
  projectNameOptions,
  clientNameOptions,
  klasifikasiOptions,
  statusOptions,
}: MasterProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const projectName = searchParams.get('project_name') ?? '';
  const clientName = searchParams.get('client_name') ?? '';
  const klasifikasi = searchParams.get('klasifikasi') ?? '';
  const status = searchParams.get('status') ?? '';

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateParams({ search: value });
  };

  const handleProjectName = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateParams({ project_name: value });
  };

  const handleClientName = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateParams({ client_name: value });
  };

  const handleKlasifikasi = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateParams({ klasifikasi: value });
  };

  const handleStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateParams({ status: value });
  };

  const handleReset = () => {
    router.push('?sortBy=delivery_date&sortDir=asc');
  };

  const updateParams = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`?${params.toString()}`);
  };

  // Add project form state
  const [showAdd, setShowAdd] = useState(false);
  const [newProject, setNewProject] = useState({
    no_po: '',
    project_name: '',
    client_name: '',
    klasifikasi: '',
    qty: '',
    satuan: '',
    batch: '',
    start_date: '',
    delivery_date: '',
    status: '',
    is_active: '1',
  });

  const onChangeNew = (key: string, value: string) => {
    setNewProject((p) => ({ ...p, [key]: value }));
  };

  const handleAddSubmit = async () => {
    if (!newProject.project_name.trim() || !newProject.client_name.trim()) {
      window.alert('Nama project dan client wajib diisi.');
      return;
    }

    try {
      const payload = {
        no_po: newProject.no_po.trim() || null,
        project_name: newProject.project_name.trim(),
        client_name: newProject.client_name.trim(),
        klasifikasi: newProject.klasifikasi || null,
        qty: newProject.qty ? Number(newProject.qty) : null,
        satuan: newProject.satuan || null,
        batch: newProject.batch ? Number(newProject.batch) : null,
        start_date: newProject.start_date || null,
        delivery_date: newProject.delivery_date || null,
        status: newProject.status || null,
        is_active: newProject.is_active || '1',
      };

      const res = await fetch('/api/master-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        window.alert(data?.error || 'Gagal menambah project');
        return;
      }

      // show success modal briefly
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setShowAdd(false);
        setNewProject({
        no_po: '',
        project_name: '',
        client_name: '',
        klasifikasi: '',
        qty: '',
        satuan: '',
        batch: '',
        start_date: '',
        delivery_date: '',
        status: '',
        is_active: '1',
      });
        router.refresh();
      }, 900);
    } catch (error) {
      console.error('Add project error', error);
      window.alert('Gagal menambah project');
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">

        <div className="xl:col-span-1">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-[0.18em] mb-1">
            Nama Project
          </label>
          <select
            value={projectName}
            onChange={handleProjectName}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">Semua Project</option>
            {projectNameOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-1">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-[0.18em] mb-1">
            Client
          </label>
          <select
            value={clientName}
            onChange={handleClientName}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">Semua Client</option>
            {clientNameOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-1">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-[0.18em] mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={handleStatus}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">Semua Status</option>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-1">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-[0.18em] mb-1">
            Pencarian Umum
          </label>
          <input
            type="text"
            placeholder="Cari nama project..."
            value={search}
            onChange={handleSearch}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="xl:col-span-1 flex items-end justify-end gap-2">
          <button
            onClick={handleReset}
            className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
          >
            Reset
          </button>

          <button
            onClick={() => setShowAdd((s) => !s)}
            className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500"
            type="button"
          >
            Tambah Project
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-cyan-300">Tambah Project</h4>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded-md p-1 text-gray-300 hover:bg-gray-800">
              Batal
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">No PO</label>
              <input value={newProject.no_po} onChange={(e) => onChangeNew('no_po', e.target.value)} placeholder="No PO" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Nama Project</label>
              <input value={newProject.project_name} onChange={(e) => onChangeNew('project_name', e.target.value)} placeholder="Nama Project" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Client</label>
              <input value={newProject.client_name} onChange={(e) => onChangeNew('client_name', e.target.value)} placeholder="Client" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Klasifikasi</label>
              <select value={newProject.klasifikasi} onChange={(e) => onChangeNew('klasifikasi', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white">
                <option value="">Pilih Klasifikasi</option>
                <option value="Manufacture">Manufacture</option>
                <option value="Trading">Trading</option>
                <option value="Jasa">Jasa</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Qty</label>
              <input value={newProject.qty} onChange={(e) => onChangeNew('qty', e.target.value)} placeholder="Qty" type="number" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Satuan</label>
              <input value={newProject.satuan} onChange={(e) => onChangeNew('satuan', e.target.value)} placeholder="Satuan" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Batch</label>
              <input value={newProject.batch} onChange={(e) => onChangeNew('batch', e.target.value)} placeholder="Batch" type="number" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Status</label>
              <select value={newProject.status} onChange={(e) => onChangeNew('status', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white">
                <option value="">Pilih Status</option>
                <option value="Optimis Memenuhi">Optimis Memenuhi</option>
                <option value="Potensi Telat">Potensi Telat</option>
                <option value="Close">Close</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Pengajuan ADD">Pengajuan ADD</option>
                <option value="Proses PO Customer">Proses PO Customer</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Start Date</label>
              <input value={newProject.start_date} onChange={(e) => onChangeNew('start_date', e.target.value)} type="date" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Delivery Date</label>
              <input value={newProject.delivery_date} onChange={(e) => onChangeNew('delivery_date', e.target.value)} type="date" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Aktif</label>
              <select value={newProject.is_active} onChange={(e) => onChangeNew('is_active', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white">
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleAddSubmit} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500" type="button">Simpan</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800" type="button">Batal</button>
          </div>
        </div>
      )}
      {/* Success modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center">
                  <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white">Berhasil!</h3>
                <p className="text-gray-400">Project berhasil disimpan</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
