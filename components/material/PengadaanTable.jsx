"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatDateOnly, parseLeadTime, formatAvgLeadTimePr } from "@/components/material/pengadaan-utils";

export default function PengadaanTable({
  tableDateRangeLabel,
  tableDaysFilter,
  setTableDaysFilter,
  tableProjectFilter,
  setTableProjectFilter,
  tableStatusFilter,
  setTableStatusFilter,
  tableSearchInput,
  setTableSearchInput,
  tableSortKey,
  setTableSortKey,
  tableSortOrder,
  setTableSortOrder,
  projectOptions,
  statusOptions,
  tableLoading,
  tableError,
  tableData,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  renderStatusBadge,
  getAvgLeadTimePrBadgeClass,
}) {
  const searchLower = tableSearchInput.toLowerCase();
  const filteredRows = tableData.filter((row) => {
    const matchSearch = !searchLower
      ? true
      : [String(row.no_pr || ''), String(row.no_po || ''), String(row.komat || ''), String(row.material_name || ''), String(row.vendor_name || '')]
          .join(' ')
          .toLowerCase()
          .includes(searchLower);

    const matchStatus = !tableStatusFilter ? true : String(row.status || '') === tableStatusFilter;
    return matchSearch && matchStatus;
  });

  const dedupedRows = (() => {
    const seen = new Set();
    return filteredRows.filter((r) => {
      const key = `${String(r.no_pr || '')}|${String(r.no_po || '')}|${String(r.komat || '')}|${String(r.material_name || '')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const sortedRows = (() => {
    if (!tableSortKey) return dedupedRows;
    return [...dedupedRows].sort((a, b) => {
      const direction = tableSortOrder === 'asc' ? 1 : -1;
      if (tableSortKey === 'price') {
        const aValue = Number(a.price) || 0;
        const bValue = Number(b.price) || 0;
        return (aValue - bValue) * direction;
      }
      if (tableSortKey === 'lead_time') {
        return (parseLeadTime(a.lead_time) - parseLeadTime(b.lead_time)) * direction;
      }
      return 0;
    });
  })();

  const totalRows = dedupedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + rowsPerPage);
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

  return (
    <div id="data-tabel-pr" style={{ marginTop: 32 }}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Data Tabel Purchase Request</h2>

        <div className="flex flex-wrap items-end gap-3 mb-4 justify-between">
          <div className="flex items-end">
            <div className="flex flex-col">
              <div className="text-sm text-gray-300">Rentang data</div>
              <div className="text-xs text-gray-400">{tableDateRangeLabel}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <div className="text-sm text-gray-300">Status</div>
              <select
                value={tableStatusFilter}
                onChange={(e) => {
                  setTableStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="min-w-[160px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition hover:border-cyan-500"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm text-gray-300">Periode filter</div>
              <select
                value={tableDaysFilter}
                onChange={(e) => setTableDaysFilter(Number(e.target.value))}
                className="min-w-[160px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition hover:border-cyan-500"
              >
                <option value={3}>3 Hari Terakhir</option>
                <option value={7}>7 Hari Terakhir</option>
                <option value={14}>14 Hari Terakhir</option>
                <option value={30}>30 Hari Terakhir</option>
                <option value={90}>90 Hari Terakhir</option>
                <option value={180}>6 Bulan Terakhir</option>
                <option value={365}>1 Tahun Terakhir</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm text-gray-300">Project filter</div>
              <select
                value={tableProjectFilter}
                onChange={(e) => {
                  setTableProjectFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="min-w-[180px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition hover:border-cyan-500"
              >
                <option value="">Semua Project</option>
                {projectOptions.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm text-gray-300">Pencarian</div>
              <input
                type="text"
                placeholder="Cari No PR, No PO, Material, Vendor..."
                value={tableSearchInput}
                onChange={(e) => {
                  setTableSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
                className="min-w-[280px] rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition hover:border-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4">
          {tableLoading ? <span>Memuat data tabel...</span> : <span></span>}
          {tableError ? <span className="text-rose-400">{tableError}</span> : null}
        </div>

        <div className="overflow-x-auto border border-gray-700 rounded-lg bg-slate-950/50">
          <table className="w-full text-xs text-gray-300">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900/80 sticky top-0 z-20">
                <th className="px-4 py-3 text-left font-semibold text-white">Project & WBS</th>
                <th className="px-4 py-3 text-left font-semibold text-white">No PR / No PO</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Komat / Deskripsi Material</th>
                <th className="px-4 py-3 text-left font-semibold text-white" style={{ width: '120px' }}>PIC / Vendor</th>
                <th className="px-4 py-3 text-right font-semibold text-white">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-white">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      if (tableSortKey !== 'price') {
                        setTableSortKey('price');
                        setTableSortOrder('asc');
                      } else if (tableSortOrder === 'asc') {
                        setTableSortOrder('desc');
                      } else {
                        setTableSortKey('');
                        setTableSortOrder('');
                      }
                    }}
                    className="inline-flex items-center gap-1"
                  >
                    Harga
                    {tableSortKey === 'price'
                      ? tableSortOrder === 'asc' ? ' ▲' : ' ▼'
                      : ' ↕'}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-white">Riwayat Aktivitas</th>
                <th className="px-4 py-3 text-center font-semibold text-white">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-white">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      if (tableSortKey !== 'lead_time') {
                        setTableSortKey('lead_time');
                        setTableSortOrder('asc');
                      } else if (tableSortOrder === 'asc') {
                        setTableSortOrder('desc');
                      } else {
                        setTableSortKey('');
                        setTableSortOrder('');
                      }
                    }}
                    className="inline-flex items-center gap-1"
                  >
                    Lead Time
                    {tableSortKey === 'lead_time'
                      ? tableSortOrder === 'asc' ? ' ▲' : ' ▼'
                      : ' ↕'}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-6 text-center text-gray-400">Memuat data...</td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-6 text-center text-gray-400">Tidak ada data material</td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr key={`${row.no_po || row.no_pr}-${startIndex + idx}`} className="border-b border-gray-800 hover:bg-gray-900/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-white font-semibold">{row.project_code || '-'}</div>
                      <div className="text-gray-400">{row.wbs || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white">{row.no_pr || '-'}</div>
                      <div className="text-gray-400">{row.no_po || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-300 text-[10px] mb-1">{row.komat || '-'}</div>
                      <div className="text-white font-semibold">{row.material_name || '-'}</div>
                      <div className="text-gray-400">{row.material_group || '-'}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[120px]">
                      <div className="text-gray-300 text-[10px] mb-1">RK.PPC.{row.account_req || '-'}</div>
                      <div className="text-white font-semibold">{row.vendor_name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="space-y-1 text-right text-[11px]">
                        <div>
                          <span className="text-gray-300">PR:</span>
                          <span className="text-white font-semibold"> {row.qty_requested || 0} {row.satuan || ''}</span>
                        </div>
                        <div>
                          <span className="text-gray-300">PO:</span>
                          <span className="text-white font-semibold"> {row.qty_ordered || 0} {row.satuan || ''}</span>
                        </div>
                        <div>
                          <span className="text-gray-300">GR:</span>
                          <span className="text-emerald-400 font-semibold"> {row.qty_arrived || 0} {row.satuan || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-[11px]">
                        <div className="text-white font-semibold">{row.price != null ? `Rp ${formatRupiah(row.price)}` : '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] max-w-[200px]">
                      <div>
                        <span className="text-gray-300">PR:</span>
                        <span className="text-white"> {formatDateOnly(row.request_date)}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">ETA:</span>
                        <span className="text-white"> {formatDateOnly(row.est_incoming_date)}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">PO:</span>
                        <span className="text-white"> {formatDateOnly(row.po_date)}</span>
                      </div>
                      <div>
                        <span className="text-gray-300">GR:</span>
                        <span className="text-white"> {formatDateOnly(row.arrival_date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{renderStatusBadge(row.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${getAvgLeadTimePrBadgeClass(row.lead_time)}`}>
                        {formatAvgLeadTimePr(row.lead_time)} Hari
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <div>Menampilkan {displayStart} - {displayEnd} dari {totalRows} baris</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`rounded-md border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700 ${currentPage <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
            >Sebelumnya</button>

            {paginationPages.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${pageNumber === currentPage ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 'border-gray-600 text-gray-200 hover:bg-gray-700'}`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`rounded-md border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700 ${currentPage >= totalPages ? 'opacity-50 pointer-events-none' : ''}`}
            >Berikutnya</button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-400">Total: {tableData.length} baris data</div>
      </div>
    </div>
  );
}
