import ModernSidebar from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import MonitoringKpmFilters from "./monitoring-kpm-filters";
import MaterialOutLineChart from "@/components/material/MaterialOutLineChart";
import {
  getMonitoringKpmFilterOptions,
  getMonitoringKpmRows,
  getMonitoringKpmCount,
  type MonitoringKpmSortBy,
  type SortDirection,
  getMaterialOutLineChart,
  getAvailableMonths,
} from "@/lib/queries/stok_material";

interface MonitoringKpmPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SORTABLE_COLUMNS: Array<{ key: MonitoringKpmSortBy; label: string }> = [
  { key: "ts", label: "TS" },
  { key: "pic", label: "PIC" },
  { key: "status", label: "Status" },
  { key: "tgl_ready", label: "Tgl Ready" },
  { key: "status_komponen", label: "Status Komponen" },
];

function getQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
}

function getCurrentMonthValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${today.getFullYear()}-${month}`;
}

function isMonthValue(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID");
}

function buildSortHref(
  params: URLSearchParams,
  nextSortBy: MonitoringKpmSortBy,
  currentSortBy: MonitoringKpmSortBy,
  currentSortDir: SortDirection
) {
  const updated = new URLSearchParams(params.toString());
  // reset to first page when sorting
  updated.delete("page");
  const isSameColumn = currentSortBy === nextSortBy;
  const nextDir: SortDirection =
    isSameColumn && currentSortDir === "asc" ? "desc" : "asc";
  updated.set("sortBy", nextSortBy);
  updated.set("sortDir", nextDir);
  return `?${updated.toString()}`;
}

export default async function MonitoringKpmPage({ searchParams }: MonitoringKpmPageProps) {
  const resolvedSearchParams = await searchParams;
  const st = getQueryValue(resolvedSearchParams.st);
  const postDate = getQueryValue(resolvedSearchParams.post_date);
  const proyek = getQueryValue(resolvedSearchParams.proyek);
  const search = getQueryValue(resolvedSearchParams.search);
  const requestedMonth = getQueryValue(resolvedSearchParams.month);
  const defaultMonth = getCurrentMonthValue();
  const selectedMonth = isMonthValue(requestedMonth) ? requestedMonth : defaultMonth;

  const allowedSortBy: MonitoringKpmSortBy[] = [
    "no",
    "ts",
    "pic",
    "status",
    "tgl_ready",
    "status_komponen",
  ];
  const requestedSortBy = getQueryValue(resolvedSearchParams.sortBy) as MonitoringKpmSortBy;
  const sortBy = allowedSortBy.includes(requestedSortBy) ? requestedSortBy : "no";
  const requestedSortDir = getQueryValue(resolvedSearchParams.sortDir);
  const sortDir: SortDirection = requestedSortDir === "asc" ? "asc" : "desc";

  const requestedPage = parseInt(getQueryValue(resolvedSearchParams.page) || "1", 10);
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  const [rows, filterOptions, materialOutLineChart, availableMonths] = await Promise.all([
    // rows with pagination: limit 100
    getMonitoringKpmRows({
      st,
      postDate,
      proyek,
      search,
      sortBy,
      sortDir,
      limit: 100,
      offset: (page - 1) * 100,
    }),
    getMonitoringKpmFilterOptions(),
    getMaterialOutLineChart(selectedMonth),
    getAvailableMonths(),
  ]);

  const totalRows = await getMonitoringKpmCount({
    st,
    postDate,
    proyek,
    search,
    sortBy,
    sortDir,
  });
  const rowsPerPage = 100;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const pageStart = rows.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const pageEnd = Math.min(page * rowsPerPage, totalRows);

  const paginationPages = (() => {
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const halfWindow = Math.floor(maxButtons / 2);
    let startPage = Math.max(1, page - halfWindow);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    startPage = Math.max(1, endPage - maxButtons + 1);

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  })();

  const baseParams = new URLSearchParams();
  if (selectedMonth) baseParams.set("month", selectedMonth);
  if (st) baseParams.set("st", st);
  if (postDate) baseParams.set("post_date", postDate);
  if (proyek) baseParams.set("proyek", proyek);
  if (search) baseParams.set("search", search);
  if (sortBy) baseParams.set("sortBy", sortBy);
  if (sortDir) baseParams.set("sortDir", sortDir);
  // baseParams represents current filters (page will be set per-link)

  return (
    <ModernSidebar>
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoring KPM</h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitoring data stok material dengan filter, pencarian, dan pengurutan.
          </p>
        </div>

        <MaterialOutLineChart
          data={materialOutLineChart}
          monthLabel={new Intl.DateTimeFormat('id-ID', {
            month: 'long',
            year: 'numeric',
          }).format(new Date(`${selectedMonth}-01`))}
        />

        

        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
          <CardContent className="p-4">
            <MonitoringKpmFilters
              stOptions={filterOptions.stOptions}
              proyekOptions={filterOptions.proyekOptions}
              availableMonths={availableMonths}
              currentMonth={selectedMonth}
              defaultMonth={defaultMonth}
              currentSt={st}
              currentPostDate={postDate}
              currentSearch={search}
              currentProyek={proyek}
              sortBy={sortBy}
              sortDir={sortDir}
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900/70 border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap">
                    <Link
                      href={buildSortHref(baseParams, "no", sortBy, sortDir)}
                      className="hover:text-white"
                    >
                      No
                      {sortBy === "no" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </Link>
                  </th>
                  <th className="text-left p-3 text-gray-300 font-semibold">ST</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">Post Date</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">No KPM</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">Item</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">Komat</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">Spesifikasi</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">Proyek</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">Typecar</th>
                  {SORTABLE_COLUMNS.map((column) => {
                    const isActive = sortBy === column.key;
                    const indicator = isActive ? (sortDir === "asc" ? " ↑" : " ↓") : "";
                    return (
                      <th key={column.key} className="text-left p-3 text-gray-300 font-semibold whitespace-nowrap">
                        <Link
                          href={buildSortHref(baseParams, column.key, sortBy, sortDir)}
                          className="hover:text-white"
                        >
                          {column.label}
                          {indicator}
                        </Link>
                      </th>
                    );
                  })}
                  <th className="text-left p-3 text-gray-300 font-semibold">Qty Diminta</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">UOM</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">SN</th>
                  <th className="text-left p-3 text-gray-300 font-semibold">Qty Ready</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row, index) => (
                    <tr
                      key={`${row.no_kpm ?? "nokpm"}-${row.item ?? "item"}-${index}`}
                      className="border-b border-gray-800 hover:bg-gray-800/40"
                    >
                      <td className="p-3 text-gray-200 whitespace-nowrap">{row.no ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.st ?? "-"}</td>
                      <td className="p-3 text-gray-200">{formatDate(row.post_date)}</td>
                      <td className="p-3 text-white whitespace-nowrap">{row.no_kpm ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.item ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.komat ?? "-"}</td>
                      <td className="p-3 text-gray-200 min-w-[240px]">{row.spesifikasi ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.proyek ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.typecar ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.ts ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.pic ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.status ?? "-"}</td>
                      <td className="p-3 text-gray-200">{formatDate(row.tgl_ready)}</td>
                      <td className="p-3 text-gray-200">{row.status_komponen ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.qty ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.uom ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.sn ?? "-"}</td>
                      <td className="p-3 text-gray-200">{row.qty_ready ?? "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={18} className="p-8 text-center text-gray-400">
                      Data tidak ditemukan untuk filter saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex flex-col gap-3 rounded-md border-t border-gray-800 bg-gray-900/40 px-4 py-3 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Menampilkan {pageStart}-{pageEnd} dari {totalRows} data
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`?${new URLSearchParams({ ...Object.fromEntries(baseParams), page: String(Math.max(1, page - 1)) }).toString()}`}
                  className={`rounded-md border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Sebelumnya
                </Link>

                {paginationPages.map((pageNumber) => {
                  const pageParams = new URLSearchParams(baseParams.toString());
                  pageParams.set('page', String(pageNumber));

                  return (
                    <Link
                      key={pageNumber}
                      href={`?${pageParams.toString()}`}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        pageNumber === page
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-gray-600 text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  );
                })}

                <Link
                  href={`?${new URLSearchParams({ ...Object.fromEntries(baseParams), page: String(Math.min(totalPages, page + 1)) }).toString()}`}
                  className={`rounded-md border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-700 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Berikutnya
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernSidebar>
  );
}
