'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Elapsed from '@/components/ui/elapsed';
import type { ProductionProgress } from '@/lib/queries/production-progress-protrack';

interface ProductionProgressTableProps {
  data: ProductionProgress[];
  mode?: 'default' | 'protrack';
}

type SortColumn = 'id_perproduct' | 'product_name' | 'workstation' | 'operator_actual_name' | 'start_actual' | 'duration_time_actual' | 'finish_actual' | 'status';
type SortDirection = 'asc' | 'desc';

interface RealisasiResult {
  minutes: number;
  label: string;
  isOvertime: boolean;
  color: { bg: string; border: string; text: string };
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

function parseTimeToSeconds(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 3) return 0;
  const [h, m, s] = parts.map(p => parseInt(p, 10));
  return h * 3600 + m * 60 + s;
}

function formatTimeToReadable(timeStr?: string | null): string {
  if (!timeStr) return '—';
  
  const parts = timeStr.split(':');
  if (parts.length < 3) return timeStr;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (hours === 0) {
    // Kurang dari 1 jam, tampilkan hanya menit
    return `${minutes}m`;
  } else {
    // Lebih dari 1 jam, tampilkan jam dan menit
    return `${hours}j ${minutes}m`;
  }
}

function calculateRealisasi(actualTime?: string | null, idealTime?: string | null, status?: string | null) {
  const statusLower = status?.toLowerCase() || '';
  
  // Jika status mengandung gangguan, tunggu, login, logout - tampilkan hanya duration_time_actual
  if (statusLower.includes('gangguan') || statusLower.includes('tunggu') || statusLower.includes('login') || statusLower.includes('logout')) {
    if (!actualTime) {
      return {
        minutes: 0,
        label: '—',
        isOvertime: false,
        color: { bg: 'bg-gray-700/20', border: 'border-gray-600', text: 'text-gray-300' }
      };
    }

    // Determine color based on status
    let color;
    if (statusLower.includes('gangguan')) {
      color = { bg: 'bg-red-900/30', border: 'border-red-600', text: 'text-red-300' };
    } else if (statusLower.includes('tunggu')) {
      color = { bg: 'bg-amber-900/30', border: 'border-amber-600', text: 'text-amber-300' };
    } else if (statusLower.includes('logout')) {
      color = { bg: 'bg-orange-900/30', border: 'border-orange-600', text: 'text-orange-300' };
    } else if (statusLower.includes('login')) {
      color = { bg: 'bg-blue-900/30', border: 'border-blue-600', text: 'text-blue-300' };
    } else {
      color = { bg: 'bg-gray-700/20', border: 'border-gray-600', text: 'text-gray-300' };
    }

    return {
      minutes: 0,
      label: formatTimeToReadable(actualTime),
      isOvertime: false,
      color
    };
  }

  // Original logic untuk status normal - bandingkan dengan ideal_time
  if (!actualTime || !idealTime) {
    return {
      minutes: 0,
      label: '—',
      isOvertime: false,
      color: { bg: 'bg-gray-700/20', border: 'border-gray-600', text: 'text-gray-300' }
    };
  }
  
  const actualSeconds = parseTimeToSeconds(actualTime);
  const idealSeconds = parseTimeToSeconds(idealTime);
  const diffSeconds = actualSeconds - idealSeconds;
  const minutes = Math.abs(Math.floor(diffSeconds / 60));
  
  if (diffSeconds > 0) {
    // Overtime (red)
    return {
      minutes,
      label: `+${minutes}m`,
      isOvertime: true,
      color: { bg: 'bg-red-900/30', border: 'border-red-600', text: 'text-red-300' }
    };
  } else if (diffSeconds < 0) {
    // Under time (green)
    return {
      minutes,
      label: `-${minutes}m`,
      isOvertime: false,
      color: { bg: 'bg-emerald-900/30', border: 'border-emerald-600', text: 'text-emerald-300' }
    };
  } else {
    // Exactly on time (gray)
    return {
      minutes: 0,
      label: 'On Time',
      isOvertime: false,
      color: { bg: 'bg-gray-700/20', border: 'border-gray-600', text: 'text-gray-300' }
    };
  }
}

function getStatusColor(status?: string | null) {
  if (!status) return { bg: 'bg-gray-700/20', border: 'border-gray-600', text: 'text-gray-300' };
  
  const lower = status.toLowerCase();
  if (lower.includes('gangguan') || lower.includes('kurang komponen')) {
    return { bg: 'bg-rose-900/30', border: 'border-rose-600', text: 'text-rose-300' };
  }
  if (lower.includes('istirahat')) {
    return { bg: 'bg-amber-900/30', border: 'border-amber-600', text: 'text-amber-300' };
  }
  if (lower.includes('tunggu qc') || lower.includes('finish')) {
    return { bg: 'bg-emerald-900/30', border: 'border-emerald-600', text: 'text-emerald-300' };
  }
  if (lower.includes('not ok') || lower.includes('tidak ok')) {
    return { bg: 'bg-red-900/30', border: 'border-red-600', text: 'text-red-300' };
  }
  if (lower.includes('masuk') || lower.includes('on progress')) {
    return { bg: 'bg-blue-900/30', border: 'border-blue-600', text: 'text-blue-300' };
  }
  if (lower.includes('login')) {
    return { bg: 'bg-blue-900/30', border: 'border-blue-600', text: 'text-blue-300' };
  }
  if (lower.includes('logout')) {
    return { bg: 'bg-orange-900/30', border: 'border-orange-600', text: 'text-orange-300' };
  }
  
  return { bg: 'bg-gray-700/20', border: 'border-gray-600', text: 'text-gray-300' };
}

function getStatusIcon(status?: string | null) {
  if (!status) return '○';
  const lower = status.toLowerCase();
  if (lower.includes('gangguan') || lower.includes('kurang komponen'))  return '⚠';
  if (lower.includes('istirahat')) return '⏸';
  if (lower.includes('tunggu qc') || lower.includes('finish')) return '✓';
  if (lower.includes('not ok')) return '✗';
  if (lower.includes('masuk') || lower.includes('on progress'))  return '▶';
  return '○';
}

export default function ProductionProgressTable({ data, mode = 'default' }: ProductionProgressTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('start_actual');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [daysFilter, setDaysFilter] = useState(0); // 0 = semua data
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter by date range (last N days)
  const dateFiltered = useMemo(() => {
    if (daysFilter === 0) return data; // Semua data
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - daysFilter * 24 * 60 * 60 * 1000);
    
    return data.filter((item) => {
      if (!item.start_actual) return false;
      const itemDate = new Date(item.start_actual);
      return itemDate >= cutoffDate;
    });
  }, [data, daysFilter]);

  // Apply global search filter
  const filtered = useMemo(() => {
    if (!globalSearch) return dateFiltered;
    
    const searchLower = globalSearch.toLowerCase();
    
    return dateFiltered.filter((item) => {
      // Search in all relevant fields
      const searchFields = [
        String(item.id_perproduct || ''),
        String(item.product_name || ''),
        String(item.workstation || ''),
        String(item.operator_actual_name || ''),
        formatDateTime(item.start_actual),
      ];
      
      return searchFields.some(field => 
        field.toLowerCase().includes(searchLower)
      );
    });
  }, [dateFiltered, globalSearch]);

  // Apply sorting
  const sorted = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortColumn];
      let bVal: any = b[sortColumn];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Convert dates for comparison
      if (sortColumn === 'start_actual' || sortColumn === 'finish_actual') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    return sorted;
  }, [filtered, sortColumn, sortDirection]);

  // Reset to page 1 when data changes
  useMemo(() => {
    setCurrentPage(1);
  }, [sorted.length, daysFilter, globalSearch]);

  // Calculate pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sorted.slice(start, end);
  }, [sorted, currentPage]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Header with filter controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-semibold text-lg">Detail Produksi</h2>
          <p className="text-sm text-gray-400">{paginatedData.length} item ditampilkan di halaman {currentPage} dari {totalPages} | Total: {sorted.length} dari {data.length}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari semua kolom..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 text-white rounded text-sm hover:bg-slate-600 transition-colors focus:outline-none focus:border-blue-500 w-64"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Filter:</label>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-sm hover:bg-slate-600 transition-colors"
            >
              <option value="0">Semua data</option>
              <option value="1">Hari ini</option>
              <option value="3">3 hari terakhir</option>
              <option value="7">7 hari terakhir</option>
              <option value="14">14 hari terakhir</option>
              <option value="30">30 hari terakhir</option>
              <option value="90">90 hari terakhir</option>
              <option value="365">1 tahun terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full bg-gray-900">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              {mode === 'protrack' ? (
                <>
                  <th className="px-4 py-3 text-left text-white">ID Perproduk</th>
                  <th className="px-4 py-3 text-left text-white">Nama Produk</th>
                  <th className="px-4 py-3 text-left text-white">Sub-proses</th>
                  <th className="px-4 py-3 text-left text-white">Operator</th>
                  <th className="px-4 py-3 text-left text-white">Mulai</th>
                  <th className="px-4 py-3 text-left text-white">Status</th>
                  <th className="px-4 py-3 text-left text-white">Presentase</th>
                  <th className="px-4 py-3 text-left text-white">QTY</th>
                </>
              ) : (
                <>
                  {/* ID Perproduk */}
                  <th className="px-4 py-3 text-left text-white">
                    <button
                      onClick={() => handleSort('id_perproduct')}
                      className="flex items-center gap-2 font-semibold text-white hover:text-white transition-colors"
                    >
                      ID Perproduk
                      <SortIcon column="id_perproduct" />
                    </button>
                  </th>

                  {/* Product Name */}
                  <th className="px-4 py-3 text-left text-white">
                    <button
                      onClick={() => handleSort('product_name')}
                      className="flex items-center gap-2 font-semibold text-white hover:text-white transition-colors"
                    >
                      Nama Produk
                      <SortIcon column="product_name" />
                    </button>
                  </th>

                  {/* Workstation */}
                  <th className="px-4 py-3 text-left text-white">
                    <button
                      onClick={() => handleSort('workstation')}
                      className="flex items-center gap-2 font-semibold text-white hover:text-white transition-colors"
                    >
                      Workstation
                      <SortIcon column="workstation" />
                    </button>
                  </th>

                  {/* Operator */}
                  <th className="px-4 py-3 text-left text-white">
                    <button
                      onClick={() => handleSort('operator_actual_name')}
                      className="flex items-center gap-2 font-semibold text-white hover:text-white transition-colors"
                    >
                      Operator
                      <SortIcon column="operator_actual_name" />
                    </button>
                  </th>

                  {/* Start Actual */}
                  <th className="px-4 py-3 text-left text-white">
                    <button
                      onClick={() => handleSort('start_actual')}
                      className="flex items-center gap-2 font-semibold text-white hover:text-white transition-colors"
                    >
                      Mulai
                      <SortIcon column="start_actual" />
                    </button>
                  </th>

                  {/* Duration */}
                  <th className="px-4 py-3 text-left text-white">
                    <button
                      onClick={() => handleSort('duration_time_actual')}
                      className="flex items-center gap-2 font-semibold text-white hover:text-white transition-colors"
                    >
                      Durasi
                      <SortIcon column="duration_time_actual" />
                    </button>
                  </th>

                  {/* Finish Actual */}
                  <th className="px-4 py-3 text-left text-white">
                    <button
                      onClick={() => handleSort('finish_actual')}
                      className="flex items-center gap-2 font-semibold text-white hover:text-white transition-colors"
                    >
                      Selesai
                      <SortIcon column="finish_actual" />
                    </button>
                  </th>

                  {/* Status */}
                  <th className="px-4 py-3 text-left text-white">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 font-semibold text-white hover:text-white transition-colors"
                    >
                      Status
                      <SortIcon column="status" />
                    </button>
                  </th>

                  {/* Realisasi */}
                  <th className="px-4 py-3 text-left text-white">
                    <span className="font-semibold text-white">Realisasi</span>
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={mode === 'protrack' ? 8 : 9} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data yang ditemukan
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                if (mode === 'protrack') {
                  const statusColor = getStatusColor(item.status);
                  const statusIcon = getStatusIcon(item.status);
                  return (
                    <tr key={`${item.id_perproduct || item.id_process || idx}`} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-gray-200 font-medium">{item.id_perproduct || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-200" title={item.product_name || ''}>{item.product_name || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-200 truncate max-w-[160px]" title={item.sub_process || item.process_name || ''}>{item.sub_process || item.process_name || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-200" title={item.operator_actual_name || ''}>{item.operator_actual_name || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-300 text-sm">{formatDateTime(item.start_actual)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${statusColor.bg} ${statusColor.border} ${statusColor.text} border text-xs font-semibold`}
                        >
                          <span className="mr-1">{statusIcon}</span>
                          {item.status || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-200 font-semibold">{item.percentage != null ? `${item.percentage}%` : '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-200">{(item.qty_progress ?? '—') + '/' + (item.total ?? '—')}</span>
                      </td>
                    </tr>
                  );
                }

                // default mode row (existing layout)
                const statusColor = getStatusColor(item.status);
                const statusIcon = getStatusIcon(item.status);
                const isWaitingMulai = item.status?.toLowerCase().includes('tunggu mulai');
                const isWaitingSelesai = item.status?.toLowerCase().includes('tunggu selesai');
                const showElapsed = isWaitingMulai && !isWaitingSelesai;
                const isPaused = isWaitingSelesai;

                return (
                  <tr key={`${item.id_process || item.id_perproduct || idx}`} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-gray-200 font-medium">{item.id_perproduct || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-200">{item.product_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 font-semibold">
                        WS {item.workstation || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-200">{item.operator_actual_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-sm">{formatDateTime(item.start_actual)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-sm">
                        {item.duration_time_actual || (showElapsed && item.start_actual ? 
                          <Elapsed since={item.start_actual} className="text-amber-400 font-semibold" isPaused={isPaused} /> 
                          : '—')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300 text-sm">{formatDateTime(item.finish_actual)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${statusColor.bg} ${statusColor.border} ${statusColor.text} border text-xs font-semibold`}
                      >
                        <span className="mr-1">{statusIcon}</span>
                        {item.status || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const realisasi = calculateRealisasi(item.duration_time_actual, item.ideal_duration_time, item.status);
                        return (
                          <Badge
                            className={`${realisasi.color.bg} ${realisasi.color.border} ${realisasi.color.text} border text-xs font-semibold`}
                          >
                            {realisasi.label}
                          </Badge>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-400">
            Halaman <span className="font-semibold text-white">{currentPage}</span> dari <span className="font-semibold text-white">{totalPages}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-sm hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>

            {/* Page Input */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Ke halaman:</label>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const pageNum = parseInt(e.target.value, 10);
                  if (pageNum >= 1 && pageNum <= totalPages) {
                    setCurrentPage(pageNum);
                  }
                }}
                className="w-16 px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-sm hover:bg-slate-600 transition-colors focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-sm hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya
            </button>
          </div>

          <div className="text-sm text-gray-400">
            Baris per halaman: <span className="font-semibold text-white">{itemsPerPage}</span>
          </div>
        </div>
      )}

    </div>
  );
}
