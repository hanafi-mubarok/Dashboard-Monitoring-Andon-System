'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TabelPlotting } from '../../lib/queries/material_plotting';
import { renderStatusBadge } from '@/components/material/pengadaan-utils';

interface PlottingMaterialTabelProps {
  data: TabelPlotting[];
  isLoading?: boolean;
  projectFilter?: string;
  onProjectFilterChange?: (value: string) => void;
  productFilter?: string;
  onProductFilterChange?: (value: string) => void;
}

export default function PlottingMaterialTabelComponent({
  data,
  isLoading = false,
  projectFilter,
  onProjectFilterChange,
  productFilter,
  onProductFilterChange,
}: PlottingMaterialTabelProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [localProjectFilter, setLocalProjectFilter] = useState('All');
  const [localProductFilter, setLocalProductFilter] = useState('All');
  const effectiveProjectFilter = projectFilter ?? localProjectFilter;
  const effectiveProductFilter = productFilter ?? localProductFilter;
  const rowsPerPage = 25;

  const projectOptions = Array.from(
    new Set(
      data
        .map((row) => String(row.project || '').trim())
        .filter((p) => p !== '')
    )
  ).sort((a, b) => a.localeCompare(b, 'id'));

  const productOptions = Array.from(
    new Set(
      data
        .filter((row) => effectiveProjectFilter === 'All' || row.project === effectiveProjectFilter)
        .map((row) => String(row.produk || '').trim())
        .filter((p) => p !== '')
    )
  ).sort((a, b) => a.localeCompare(b, 'id'));

  React.useEffect(() => {
    if (effectiveProductFilter !== 'All' && !productOptions.includes(effectiveProductFilter)) {
      if (onProductFilterChange) {
        onProductFilterChange('All');
      } else {
        setLocalProductFilter('All');
      }
    }
  }, [effectiveProductFilter, productOptions, onProductFilterChange]);

  // use shared formatter from pengadaan-utils

  function formatDateOnly(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateWithTime(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + " " + date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatAvgLeadTimePr(value: any) {
    const parsed = typeof value === 'string' ? Number(String(value).replace(/[^\d.-]/g, '')) : Number(value);
    return Number.isFinite(parsed) ? parsed : '-';
  }

  function getAvgLeadTimePrBadgeClass(value: any) {
    const parsed = typeof value === 'string' ? Number(String(value).replace(/[^\d.-]/g, '')) : Number(value);
    if (!Number.isFinite(parsed)) return 'border-0 text-xs font-semibold bg-gray-600 text-white';
    if (parsed >= 90) return 'border-0 text-xs font-semibold bg-gray-600 text-white';
    if (parsed >= 30) return 'border-0 text-xs font-semibold bg-red-600 text-white';
    if (parsed >= 15) return 'border-0 text-xs font-semibold bg-amber-400 text-black';
    if (parsed < 15) return 'border-0 text-xs font-semibold bg-blue-600 text-white';
    return 'border-0 text-xs font-semibold bg-slate-500 text-white';
  }

  function renderLeadTimeBadge(value: any) {
    const parsed = formatAvgLeadTimePr(value);
    const cls = getAvgLeadTimePrBadgeClass(parsed);
    const label = parsed === '-' ? '-' : `${parsed} Hari`;
    return (
      <div className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-semibold ${cls}`}>
        {label}
      </div>
    );
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toLocaleString('id-ID');
    }
    return value;
  };

  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return 'bg-gray-600 text-gray-100';

    const statusLower = status.toLowerCase();
    const isBelumPengadaan = statusLower.includes('belum pengadaan');
    const isPengadaanKurang = statusLower.includes('pengadaan kurang');
    const isStokKurang = statusLower.includes('stok kurang');
    const isStokCukup = statusLower.includes('stok cukup');
    const isCukupSaja = statusLower === 'cukup';
    const isTungguGR = statusLower.includes('tunggu gr');
    const isPengadaanOutstanding = statusLower.includes('pengadaan outstanding');

    if (isBelumPengadaan || isPengadaanKurang || isStokKurang) {
      return 'bg-rose-600/80 text-rose-100';
    }
    if ((isStokCukup || isCukupSaja) && !isTungguGR && !isPengadaanOutstanding) {
      return 'bg-emerald-600/80 text-emerald-100';
    }
    if (isTungguGR || isPengadaanOutstanding) {
      return 'bg-amber-600/80 text-amber-100';
    }
    return 'bg-amber-600/80 text-amber-100';
  };

  const statusOptions = Array.from(new Set(data.map((row) => row.status_komponen || 'Belum Pengadaan')));

  const searchLower = searchInput.toLowerCase();
  const filteredRows = data.filter((row) => {
    const matchSearch = !searchLower
      ? true
      : [
          String(row.komat || ''),
          String(row.spesifikasi || ''),
          String(row.produk || ''),
        ]
        .join(' ')
        .toLowerCase()
        .includes(searchLower);
    const matchStatus = statusFilter === 'All' || (row.status_komponen || 'Belum Pengadaan') === statusFilter;
    const matchProject = effectiveProjectFilter === 'All' || row.project === effectiveProjectFilter;
    const matchProduct = effectiveProductFilter === 'All' || row.produk === effectiveProductFilter;
    return matchSearch && matchStatus && matchProject && matchProduct;
  });

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);
  const displayStart = totalRows === 0 ? 0 : startIndex + 1;
  const displayEnd = Math.min(startIndex + rowsPerPage, totalRows);

  const paginationPages = (() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const halfWindow = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    startPage = Math.max(1, endPage - maxButtons + 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  })();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-400">
        Memuat data...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="text-xs text-gray-500">Last Update</div>
          <div className="text-sm text-gray-400">{filteredRows.length > 0 ? formatDateWithTime(filteredRows[0].updated_at) : '-'}</div>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-300">Pencarian</div>
            <input
              type="text"
              placeholder="Cari Komat, Spesifikasi, Produk..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[250px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition hover:border-cyan-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-300">Status Komponen</div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition hover:border-cyan-500"
            >
              <option value="All">Semua Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-300">Project</div>
            <select
              value={effectiveProjectFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (onProjectFilterChange) {
                  onProjectFilterChange(value);
                } else {
                  setLocalProjectFilter(value);
                }
                setCurrentPage(1);
              }}
              className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition hover:border-cyan-500"
            >
              <option value="All">Semua Project</option>
              {projectOptions.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-300">Produk</div>
            <select
              value={effectiveProductFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (onProductFilterChange) {
                  onProductFilterChange(value);
                } else {
                  setLocalProductFilter(value);
                }
                setCurrentPage(1);
              }}
              className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition hover:border-cyan-500"
            >
              <option value="All">Semua Produk</option>
              {productOptions.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-700 rounded-lg bg-slate-950/50">
        <table className="w-full text-xs text-gray-300">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900/80 sticky top-0 z-20">
              <th className="px-4 py-3 text-left font-semibold text-white">Komat / Spesifikasi</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Produk / Project</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Lead Time / Status</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Dokumen & Vendor</th>
              <th className="px-4 py-3 text-right font-semibold text-white">Kebutuhan</th>
              <th className="px-4 py-3 text-right font-semibold text-white">Total Kebutuhan</th>
              <th className="px-4 py-3 text-right font-semibold text-white">Pengadaan</th>
              <th className="px-4 py-3 text-right font-semibold text-white">Stok</th>
              <th className="px-4 py-3 text-right font-semibold text-white">Kecukupan</th>
              <th className="px-4 py-3 text-center font-semibold text-white">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-gray-400">
                  Tidak ada data material
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr
                  key={`${row.no_po || row.no_pr}-${startIndex + idx}`}
                  className="border-b border-gray-800 hover:bg-gray-900/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-gray-300 text-[10px] mb-1">{row.komat || '-'}</div>
                    <div className="text-white font-semibold">{row.spesifikasi || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white font-semibold">{row.produk || '-'}</div>
                    <div className="text-gray-400">{row.project || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-[11px]">
                    <div>
                      <span className="text-gray-300">PR:</span>
                      <span className="text-white"> {formatDateOnly(row.request_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">PO:</span>
                      <span className="text-white"> {formatDateOnly(row.po_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">GR:</span>
                      <span className="text-emerald-400 font-semibold"> {formatDateOnly(row.arrival_date)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center flex flex-col items-center gap-1">
                    <div className="mt-0">{renderStatusBadge(row.status)}</div>
                    {renderLeadTimeBadge(row.lead_time)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-300 text-[10px] mb-1">
                      PR: <span className="text-white font-semibold">{row.no_pr || '-'}</span>
                    </div>
                    <div className="text-gray-300 text-[10px] mb-1">
                      PO: <span className="text-white font-semibold">{row.no_po || '-'}</span>
                    </div>
                    <div className="text-white font-semibold">{row.vendor_name || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-gray-300">Kebutuhan:</span>
                        <span className="text-white font-semibold"> {formatValue(row.jumlah_diminta)} {row.satuan || ''}</span>
                      </div>
                       <div>
                        <span className="text-gray-300"> x Jumlah Per TS:</span>
                        <span className="text-white font-semibold"> {formatValue(row.jumlah_perts)}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">x Sisa TS:</span>
                        <span className="text-white font-semibold"> {formatValue(row.sisa_trainset)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-gray-300">1 Produk:</span>
                        <span className="text-white font-semibold"> {formatValue(row.total_kebutuhan)} {row.satuan || ''}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">1 WBS:</span>
                        <span className="text-yellow-300 font-semibold"> {formatValue(row.qty_material_all_produk)} {row.satuan || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-gray-300">PR:</span>
                        <span className="text-white font-semibold"> {formatValue(row.qty_requested)} {row.satuan || ''}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">PO:</span>
                        <span className="text-white font-semibold"> {formatValue(row.qty_ordered)} {row.satuan || ''}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">GR:</span>
                        <span className="text-white font-semibold"> {formatValue(row.qty_arrived)} {row.satuan || ''}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">Sisa:</span>
                        <span className="text-teal-400 font-semibold"> {formatValue(row.dev_qty_pr_gr)} {row.satuan || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <div className="text-gray-300 text-[11px]">Stok Tersedia / WBS</div>
                        <div className="text-white font-semibold">{formatValue(row.qty_gudang)} {row.satuan || ''}</div>
                      </div>

                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="space-y-1 text-[11px]">
<div>
  <span className="text-gray-300">Kecukupan:</span>
  <span className="text-teal-400 font-semibold">
    {" "}{formatValue(row.total_material_coverage)} {row.satuan || ''}
  </span>
</div>
                      <div>
                        <span className="text-gray-300">Deviasi:</span>
                        <span className="text-white font-semibold"> {formatValue(row.deviasi_qty)} {row.satuan || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={`${getStatusBadgeClass(row.status_komponen)} whitespace-normal px-3 py-1 text-[11px] leading-snug`}>
                      {row.status_komponen || '-'}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <div>
          Menampilkan {displayStart} - {displayEnd} dari {totalRows} baris
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className={`rounded-md border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700 ${
              currentPage <= 1 ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            Sebelumnya
          </button>

          {paginationPages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setCurrentPage(pageNumber)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                pageNumber === currentPage
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-gray-600 text-gray-200 hover:bg-gray-700'
              }`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className={`rounded-md border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700 ${
              currentPage >= totalPages ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            Berikutnya
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Total: {totalRows} baris data
      </div>
    </div>
  );
}

