'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { MasterProject } from '@/lib/queries/master_project';
import ProductsByProject from '@/components/product/ProductsByProject';

interface ProjectTableClientProps {
  projects: MasterProject[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  baseParams: string;
}

type EditableProject = {
  id: number;
  no_po: string;
  project_name: string;
  client_name: string;
  klasifikasi: 'Manufacture' | 'Trading' | 'Jasa' | '';
  qty: string;
  satuan: string;
  batch: string;
  start_date: string;
  delivery_date: string;
  status:
    | 'Optimis Memenuhi'
    | 'Potensi Telat'
    | 'Close'
    | 'Terlambat'
    | 'Pengajuan ADD'
    | 'Proses PO Customer'
    | '';
  is_active: '1' | '0';
};

function formatDate(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
}

function getStatusColor(status: string | null) {
  switch (status) {
    case 'Optimis Memenuhi':
      return 'bg-green-500/10 text-green-400';
    case 'Potensi Telat':
      return 'bg-yellow-500/10 text-yellow-400';
    case 'Close':
      return 'bg-blue-500/10 text-blue-400';
    case 'Terlambat':
      return 'bg-red-500/10 text-red-400';
    case 'Pengajuan ADD':
      return 'bg-purple-500/10 text-purple-400';
    case 'Proses PO Customer':
      return 'bg-orange-500/10 text-orange-400';
    default:
      return 'bg-gray-500/10 text-gray-400';
  }
}

function toDateInput(value: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function buildSortHref(paramsString: string, nextSortBy: string, currentSortBy: string, currentSortDir: 'asc' | 'desc') {
  const updated = new URLSearchParams(paramsString);
  const isSameColumn = currentSortBy === nextSortBy;
  const nextDir = isSameColumn && currentSortDir === 'asc' ? 'desc' : 'asc';
  updated.set('sortBy', nextSortBy);
  updated.set('sortDir', nextDir);
  return `?${updated.toString()}`;
}

export default function ProjectTableClient({ projects, sortBy, sortDir, baseParams }: ProjectTableClientProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditableProject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addingProjectId, setAddingProjectId] = useState<number | null>(null);
  const [addingSubmitting, setAddingSubmitting] = useState(false);
  const [showAddSuccessModal, setShowAddSuccessModal] = useState(false);
  const [newJadwal, setNewJadwal] = useState({
    id_product: '',
    product_name: '',
    sub_output: '',
    jumlah_tiapts: '',
    total_personil: '',
    proses_produk: '',
    line: '',
    workshop: 'Candisewu',
    tanggal_mulai: '',
    tanggal_selesai: '',
  });

  const toggleDetails = (id: number) => {
    setExpandedProjectId((prev) => (prev === id ? null : id));
  };

  const toggleAddJadwal = (id: number) => {
    if (addingProjectId === id) {
      setAddingProjectId(null);
    } else {
      setAddingProjectId(id);
      setNewJadwal({
        id_product: '',
        product_name: '',
        sub_output: '',
        jumlah_tiapts: '',
        total_personil: '',
        proses_produk: '',
        line: '',
        workshop: 'Candisewu',
        tanggal_mulai: '',
        tanggal_selesai: '',
      });
    }
  };

  const onChangeNew = (key: string, value: string) => setNewJadwal((s) => ({ ...s, [key]: value }));

  const submitNewJadwal = async (project: MasterProject) => {
    if (!newJadwal.id_product.trim() || !newJadwal.product_name.trim()) {
      window.alert('ID Product dan Nama Produk wajib diisi');
      return;
    }
    try {
      setAddingSubmitting(true);
      const payload = {
        id_product: newJadwal.id_product.trim(),
        project: project.project_name ?? null,
        trainset: project.batch ?? null,
        product_name: newJadwal.product_name.trim(),
        sub_output: newJadwal.sub_output || null,
        jumlah_tiapts: newJadwal.jumlah_tiapts ? Number(newJadwal.jumlah_tiapts) : null,
        total_personil: newJadwal.total_personil ? Number(newJadwal.total_personil) : null,
        proses_produk: newJadwal.proses_produk || null,
        line: newJadwal.line || null,
        workshop: newJadwal.workshop || null,
        tanggal_mulai: newJadwal.tanggal_mulai || null,
        tanggal_selesai: newJadwal.tanggal_selesai || null,
      };

      const res = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data?.error || 'Gagal menambahkan jadwal');
        return;
      }
      setAddingProjectId(null);
      setShowAddSuccessModal(true);
      setTimeout(() => {
        setShowAddSuccessModal(false);
        router.refresh();
      }, 900);
    } finally {
      setAddingSubmitting(false);
    }
  };

  const sortableHeaders = useMemo(
    () => [
      { key: 'project_name', label: 'Nama Project' },
      { key: 'client_name', label: 'Client' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'delivery_date', label: 'Delivery Date' },
      { key: 'status', label: 'Status' },
    ],
    []
  );

  const startEdit = (project: MasterProject) => {
    setEditing({
      id: project.id,
      no_po: project.no_po ?? '',
      project_name: project.project_name ?? '',
      client_name: project.client_name ?? '',
      klasifikasi: (project.klasifikasi ?? '') as EditableProject['klasifikasi'],
      qty: project.qty != null ? String(project.qty) : '',
      satuan: project.satuan ?? '',
      batch: project.batch != null ? String(project.batch) : '',
      start_date: toDateInput(project.start_date),
      delivery_date: toDateInput(project.delivery_date),
      status: (project.status ?? '') as EditableProject['status'],
      is_active: (project.is_active ?? '1') as '1' | '0',
    });
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm('Hapus data project ini?');
    if (!ok) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/master-project/${id}`, { method: 'DELETE', cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data?.error || 'Gagal menghapus data project');
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeField = (key: keyof EditableProject, value: string) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editing.project_name.trim() || !editing.client_name.trim()) {
      window.alert('Nama project dan client wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        no_po: editing.no_po.trim() || null,
        project_name: editing.project_name.trim(),
        client_name: editing.client_name.trim(),
        klasifikasi: editing.klasifikasi || null,
        qty: editing.qty ? Number(editing.qty) : null,
        satuan: editing.satuan.trim() || null,
        batch: editing.batch ? Number(editing.batch) : null,
        start_date: editing.start_date || null,
        delivery_date: editing.delivery_date || null,
        status: editing.status || null,
        is_active: editing.is_active,
      };

      const res = await fetch(`/api/master-project/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data?.error || 'Gagal menyimpan perubahan');
        return;
      }

      // show success modal briefly
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        setEditing(null);
        router.refresh();
      }, 900);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {editing ? (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cyan-300">Edit Data Project (ID: {editing.id})</h3>
            <button
              onClick={() => setEditing(null)}
              className="rounded-md p-1 text-gray-300 hover:bg-gray-800 hover:text-white"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">No PO</label>
              <input value={editing.no_po} onChange={(e) => onChangeField('no_po', e.target.value)} placeholder="No PO" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Nama Project</label>
              <input value={editing.project_name} onChange={(e) => onChangeField('project_name', e.target.value)} placeholder="Nama Project" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Client</label>
              <input value={editing.client_name} onChange={(e) => onChangeField('client_name', e.target.value)} placeholder="Client" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Klasifikasi</label>
              <select value={editing.klasifikasi} onChange={(e) => onChangeField('klasifikasi', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white">
                <option value="">Pilih Klasifikasi</option>
                <option value="Manufacture">Manufacture</option>
                <option value="Trading">Trading</option>
                <option value="Jasa">Jasa</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Qty</label>
              <input value={editing.qty} onChange={(e) => onChangeField('qty', e.target.value)} placeholder="Qty" type="number" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Satuan</label>
              <input value={editing.satuan} onChange={(e) => onChangeField('satuan', e.target.value)} placeholder="Satuan" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Batch</label>
              <input value={editing.batch} onChange={(e) => onChangeField('batch', e.target.value)} placeholder="Batch" type="number" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Status</label>
              <select value={editing.status} onChange={(e) => onChangeField('status', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white">
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
              <input value={editing.start_date} onChange={(e) => onChangeField('start_date', e.target.value)} type="date" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Delivery Date</label>
              <input value={editing.delivery_date} onChange={(e) => onChangeField('delivery_date', e.target.value)} type="date" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-300 mb-1">Aktif</label>
              <select value={editing.is_active} onChange={(e) => onChangeField('is_active', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white">
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={submitting}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
              type="button"
            >
              Simpan Perubahan
            </button>
            <button
              onClick={() => setEditing(null)}
              disabled={submitting}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {/* Success modal */}
      {showSuccessModal && (
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
                <p className="text-gray-400">Perubahan berhasil disimpan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add-jadwal success modal */}
      {showAddSuccessModal && (
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
                <p className="text-gray-400">Jadwal berhasil ditambahkan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
<thead>
  <tr className="bg-gray-900/70 border-b border-gray-700">
    <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap">
      <Link
        href={buildSortHref(baseParams, 'project_name', sortBy, sortDir)}
        className="hover:text-white"
      >
        Nama Project {sortBy === 'project_name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </Link>
    </th>

    <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap">
      <Link
        href={buildSortHref(baseParams, 'client_name', sortBy, sortDir)}
        className="hover:text-white"
      >
        Client {sortBy === 'client_name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </Link>
    </th>

    <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap">
      <Link
        href={buildSortHref(baseParams, 'start_date', sortBy, sortDir)}
        className="hover:text-white"
      >
        Start Date {sortBy === 'start_date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </Link>
    </th>

    <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap">
      <Link
        href={buildSortHref(baseParams, 'delivery_date', sortBy, sortDir)}
        className="hover:text-white"
      >
        Delivery Date {sortBy === 'delivery_date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </Link>
    </th>

    <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap">
      Satuan
    </th>

    <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap text-right">
      Batch
    </th>

    <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap text-right">
      Jumlah
    </th>

    <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap">
      Presentase
    </th>

    <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap">
      <Link
        href={buildSortHref(baseParams, 'status', sortBy, sortDir)}
        className="hover:text-white"
      >
        Status {sortBy === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </Link>
    </th>

    <th className="text-center p-3 text-gray-300 font-semibold whitespace-nowrap">
      Aksi
    </th>
  </tr>
</thead>
<tbody>
  {projects.length > 0 ? (
    projects.map((project) => (<>
      <tr
        key={project.id}
        className="border-b border-gray-800 hover:bg-gray-800/40"
      >
        {/* Nama Project */}
        <td className="p-3 text-gray-200">
          {project.project_name ?? '-'}
        </td>

        {/* Client */}
        <td className="p-3 text-gray-200">
          {project.client_name ?? '-'}
        </td>

        {/* Start Date */}
        <td className="p-3 text-gray-200">
          {formatDate(project.start_date)}
        </td>

        {/* Delivery Date */}
        <td className="p-3 text-gray-200">
          {formatDate(project.delivery_date)}
        </td>

        {/* Satuan */}
        <td className="p-3 text-gray-200">
          {project.satuan ?? '-'}
        </td>

        {/* Batch */}
        <td className="p-3 text-right text-gray-200">
          {project.batch ?? '-'}
        </td>

        {/* Jumlah */}
        <td className="p-3 text-right">
          <div className="flex flex-col items-end">
            <p className="mt-1.5 text-base font-bold text-white">
              {project.jumlah_selesai?.toLocaleString('id-ID') ?? '-'}
              /
              <span className="text-gray-400">
                {project.qty?.toLocaleString('id-ID') ?? '-'}
              </span>
            </p>
          </div>
        </td>

        {/* Presentase */}
        <td className="p-3">
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative h-2 w-16 overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    Math.max(project.percentage_selesai ?? 0, 0),
                    100
                  )}%`,
                }}
              />
            </div>

            <span className="min-w-fit rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400">
              {Math.round(project.percentage_selesai ?? 0)}%
            </span>
          </div>
        </td>

        {/* Status */}
        <td className="p-3">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              project.status
            )}`}
          >
            {project.status ?? '-'}
          </span>
        </td>

        {/* Aksi */}
        <td className="p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(project)}
                className="rounded-md border border-cyan-700/40 bg-cyan-700/10 p-1.5 text-cyan-300 hover:bg-cyan-600/20"
                type="button"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                onClick={() => handleDelete(project.id)}
                disabled={submitting}
                className="rounded-md border border-red-700/40 bg-red-700/10 p-1.5 text-red-300 hover:bg-red-600/20 disabled:opacity-60"
                type="button"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Add product button */}
              <button
                onClick={() => toggleAddJadwal(project.id)}
                aria-label={addingProjectId === project.id ? 'Batal Tambah Produk' : 'Tambah Produk'}
                className="flex items-center justify-center rounded-md border border-green-700 bg-green-700/10 p-1.5 text-green-300 transition hover:bg-green-600/20"
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* Toggle details button (chevron style like ProductSummaryCard) */}
              <button
                onClick={() => toggleDetails(project.id)}
                aria-label={expandedProjectId === project.id ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
                className="flex items-center justify-center rounded-md border border-gray-700 bg-gray-900 p-1.5 text-gray-300 transition hover:border-cyan-500 hover:bg-gray-800 hover:text-cyan-400"
                type="button"
                aria-expanded={expandedProjectId === project.id}
              >
                {expandedProjectId === project.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>


            </div>
        </td>
      </tr>
        {addingProjectId === project.id && (
          <tr>
            <td colSpan={10} className="p-4 bg-gray-900/30">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">ID Product</label>
                  <input value={newJadwal.id_product} onChange={(e) => onChangeNew('id_product', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">Nama Produk</label>
                  <input value={newJadwal.product_name} onChange={(e) => onChangeNew('product_name', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">Sub Output</label>
                  <input value={newJadwal.sub_output} onChange={(e) => onChangeNew('sub_output', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">Jumlah / TS</label>
                  <input type="number" value={newJadwal.jumlah_tiapts} onChange={(e) => onChangeNew('jumlah_tiapts', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">Total Personil</label>
                  <input type="number" value={newJadwal.total_personil} onChange={(e) => onChangeNew('total_personil', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">Proses Produk</label>
                  <input value={newJadwal.proses_produk} onChange={(e) => onChangeNew('proses_produk', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">Line</label>
                  <input value={newJadwal.line} onChange={(e) => onChangeNew('line', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">Workshop</label>
                  <select value={newJadwal.workshop} onChange={(e) => onChangeNew('workshop', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white">
                    <option value="Candisewu">Candisewu</option>
                    <option value="Sukosari">Sukosari</option>
                    <option value="Tiron">Tiron</option>
                    <option value="INKA">INKA</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">Tanggal Mulai</label>
                  <input type="date" value={newJadwal.tanggal_mulai} onChange={(e) => onChangeNew('tanggal_mulai', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-300 mb-1">Tanggal Selesai</label>
                  <input type="date" value={newJadwal.tanggal_selesai} onChange={(e) => onChangeNew('tanggal_selesai', e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-white" />
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button disabled={addingSubmitting} onClick={() => submitNewJadwal(project)} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-60">Tambah</button>
                <button disabled={addingSubmitting} onClick={() => setAddingProjectId(null)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Batal</button>
              </div>
            </td>
          </tr>
        )}
        {expandedProjectId === project.id && (
          <tr>
            <td colSpan={10} className="p-4 bg-gray-900/40">
              <div className="space-y-3">
                <div className="text-sm text-gray-300 font-semibold">Detail Produk untuk project {project.project_name} TS/Batch  {project.batch}</div>
                <div>
                  {/* Lazy-load component that fetches by project+trainset */}
                  <ProductsByProject project={project.project_name ?? ''} trainset={project.batch ?? ''} />
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    ))
  ) : (
    <tr>
      <td colSpan={10} className="p-8 text-center text-gray-400">
        Tidak ada data project sesuai filter.
      </td>
    </tr>
  )}
</tbody>
      </table>
    </div>
  );
}
