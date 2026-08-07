"use client";

import React, { useState, useEffect, useMemo } from "react";
import PengadaanFunnel from "@/components/material/PengadaanFunnel";
import PengadaanTopProjects from "@/components/material/PengadaanTopProjects";
import PengadaanMetrics from "@/components/material/PengadaanMetrics";
import VendorPerformance from "@/components/material/VendorPerformance";
import PengadaanKanbanSection from "@/components/material/PengadaanKanbanSection";
import PengadaanTable from "@/components/material/PengadaanTable";
import {
  FUNNEL_MAX_WIDTH,
  H,
  TOTAL_HEIGHT,
  TOP_RIM_GUARD,
  MAX_FILL_RATIO,
  STAGE_META,
  formatRupiah,
  formatQtyK,
  formatDateOnly,
  renderStatusBadge,
  getAvgLeadTimePrBadgeClass,
  formatAvgLeadTimePr,
  getEffectiveStatus,
  renderMaterialQuantities,
} from "@/components/material/pengadaan-utils";

export default function PengadaanDashboard({ data: dataProp, editable = true }) {
  const defaultData = {
    pr_percentage: 100,
    po_percentage: 72,
    arrival_percentage: 46,
    total_pr: 128,
    barang_pr: 340,
    qty_pr: 5200,
    rp_pr: 8400,
    total_po: 96,
    barang_po: 265,
    qty_po: 3900,
    rp_po: 6100,
    total_arrived: 58,
    barang_arrived: 150,
    qty_arrived: 1800,
    rp_arrived: 2950,
    top_projects: [
      { project_code: "PRJ-2201", precentage: 24, total_qty: 1240, total_rp: "1.8M" },
      { project_code: "PRJ-1987", precentage: 19, total_qty: 980, total_rp: "1.4M" },
      { project_code: "PRJ-2043", precentage: 15, total_qty: 760, total_rp: "1.1M" },
      { project_code: "PRJ-2110", precentage: 12, total_qty: 610, total_rp: "0.9M" },
      { project_code: "PRJ-1876", precentage: 9, total_qty: 455, total_rp: "0.7M" },
    ],
    vendor_performance: [],
  };

  const [data, setData] = useState(dataProp || defaultData);
  const [mounted, setMounted] = useState(false);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [expandedPRs, setExpandedPRs] = useState({});
  const [expandedGRs, setExpandedGRs] = useState({});
  const [expandedRequestPRs, setExpandedRequestPRs] = useState({});
  const [poDetailsByPo, setPoDetailsByPo] = useState({});
  const [grDetailsByProject, setGrDetailsByProject] = useState({});
  const [prDetailsByPr, setPrDetailsByPr] = useState({});
  const [requestPRDetailsBySurat, setRequestPRDetailsBySurat] = useState({});
  const [poDetailLoading, setPoDetailLoading] = useState({});
  const [grDetailLoading, setGrDetailLoading] = useState({});
  const [prDetailLoading, setPrDetailLoading] = useState({});
  const [requestPRDetailLoading, setRequestPRDetailLoading] = useState({});
  const [poDetailError, setPoDetailError] = useState({});
  const [grDetailError, setGrDetailError] = useState({});
  const [prDetailError, setPrDetailError] = useState({});
  const [requestPRDetailError, setRequestPRDetailError] = useState({});
  const [daysFilter, setDaysFilter] = useState(30);
  const [projectFilter, setProjectFilter] = useState("");
  const [projectOptions, setProjectOptions] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState('');
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState('');
  const [tableSearchInput, setTableSearchInput] = useState('');
  // Table-only filters (separate from dashboard/kanban filters)
  const [tableDaysFilter, setTableDaysFilter] = useState(daysFilter);
  const [tableProjectFilter, setTableProjectFilter] = useState(projectFilter);
  const [tableStatusFilter, setTableStatusFilter] = useState('');
  const [tableSortKey, setTableSortKey] = useState('');
  const [tableSortOrder, setTableSortOrder] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  const dateRangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysFilter);
    return `${formatDateOnly(start)} - ${formatDateOnly(end)}`;
  }, [daysFilter]);

  const tableDateRangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - tableDaysFilter);
    return `${formatDateOnly(start)} - ${formatDateOnly(end)}`;
  }, [tableDaysFilter]);

  const fetchDashboardData = async (days, projectCode = projectFilter) => {
    setFilterLoading(true);
    setFilterError('');

    try {
      const params = new URLSearchParams({
        days: String(days),
      });
      if (projectCode) {
        params.set('project_code', projectCode);
      }

      const response = await fetch(`/api/material-pengadaan?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Gagal mengambil data pengadaan');
      }

      setData((prev) => ({
        ...prev,
        ...json.data,
        vendor_performance: json.data.vendor_performance ?? prev.vendor_performance ?? [],
      }));
      setProjectOptions(Array.isArray(json.project_codes) ? json.project_codes : []);

      if (projectCode && Array.isArray(json.project_codes) && !json.project_codes.includes(projectCode)) {
        setProjectFilter("");
      }
    } catch (error) {
      setFilterError(String(error));
    } finally {
      setFilterLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(daysFilter, projectFilter).catch((error) => {
      console.error('Gagal memuat data pengadaan:', error);
    });
  }, [daysFilter, projectFilter]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (dataProp) setData(dataProp);
  }, [dataProp]);

const widths = useMemo(() => {
  const clampPct = (v) => Math.min(Math.max(Number(v) || 0, 0), 100);
  const prPct = clampPct(data.pr_percentage);
  const poPct = clampPct(data.po_percentage);
  const arrivalPct = clampPct(data.arrival_percentage);

  const maxPct = Math.max(prPct, poPct, arrivalPct, 1);
  const scale = mounted ? 1 : 0.02;
  const effectiveMax = FUNNEL_MAX_WIDTH * MAX_FILL_RATIO;

  return {
    pr: effectiveMax * (prPct / maxPct) * scale,
    po: effectiveMax * (poPct / maxPct) * scale,
    arrival: Math.max(effectiveMax * (arrivalPct / maxPct) * scale, mounted ? 10 : 6),
  };
}, [mounted, data.pr_percentage, data.po_percentage, data.arrival_percentage])

const geom = useMemo(
  () => ({
    pr: { top: widths.pr, bottom: widths.pr, y: TOP_RIM_GUARD, h: H.pr },
    po: { top: widths.pr, bottom: widths.po, y: TOP_RIM_GUARD + H.pr, h: H.po },
    arrival: { top: widths.po, bottom: widths.arrival, y: TOP_RIM_GUARD + H.pr + H.po, h: H.arrival },
  }),
  [widths]
);

  const cardsByKey = {
    pr: { total: data.total_pr, barang: data.barang_pr, qty: data.qty_pr, rp: data.rp_pr },
    po: { total: data.total_po, barang: data.barang_po, qty: data.qty_po, rp: data.rp_po },
    arrival: { total: data.total_arrived, barang: data.barang_arrived, qty: data.qty_arrived, rp: data.rp_arrived },
  };

  const handleSlider = (key) => (e) => {
    setData((d) => ({ ...d, [key]: Number(e.target.value) }));
  };

  const fetchPODetails = async (projectCode) => {
    if (!projectCode || poDetailsByPo[projectCode] || poDetailLoading[projectCode]) return;
    setPoDetailLoading((prev) => ({ ...prev, [projectCode]: true }));
    setPoDetailError((prev) => ({ ...prev, [projectCode]: undefined }));

    try {
      const params = new URLSearchParams({
        mode: 'po',
        project_code: projectCode,
        days: String(daysFilter),
      });

      const response = await fetch(`/api/material-po/detail?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Gagal mengambil detail');
      setPoDetailsByPo((prev) => ({ ...prev, [projectCode]: json.rows || [] }));
    } catch (error) {
      setPoDetailError((prev) => ({ ...prev, [projectCode]: String(error) }));
    } finally {
      setPoDetailLoading((prev) => ({ ...prev, [projectCode]: false }));
    }
  };

  const togglePODetails = async (projectCode) => {
    if (!projectCode) return;
    setExpandedPOs((prev) => ({ ...prev, [projectCode]: !prev[projectCode] }));
    if (!poDetailsByPo[projectCode]) {
      await fetchPODetails(projectCode);
    }
  };

  const fetchPRDetails = async (filterValue, filterByProjectCode = true) => {
    if (!filterValue || prDetailsByPr[filterValue] || prDetailLoading[filterValue]) return;
    setPrDetailLoading((prev) => ({ ...prev, [filterValue]: true }));
    setPrDetailError((prev) => ({ ...prev, [filterValue]: undefined }));

    try {
      const params = new URLSearchParams({
        days: String(daysFilter),
      });
      if (filterByProjectCode) {
        params.set('project_code', filterValue);
      } else {
        params.set('no_pr', filterValue);
      }

      const response = await fetch(`/api/material-po/detail?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Gagal mengambil detail');
      setPrDetailsByPr((prev) => ({ ...prev, [filterValue]: json.rows || [] }));
    } catch (error) {
      setPrDetailError((prev) => ({ ...prev, [filterValue]: String(error) }));
    } finally {
      setPrDetailLoading((prev) => ({ ...prev, [filterValue]: false }));
    }
  };

  const togglePRDetails = async (filterValue, filterByProjectCode = true) => {
    if (!filterValue) return;
    setExpandedPRs((prev) => ({ ...prev, [filterValue]: !prev[filterValue] }));
    if (!prDetailsByPr[filterValue]) {
      await fetchPRDetails(filterValue, filterByProjectCode);
    }
  };

  const fetchGRDetails = async (projectCode) => {
    if (!projectCode || grDetailsByProject[projectCode] || grDetailLoading[projectCode]) return;
    setGrDetailLoading((prev) => ({ ...prev, [projectCode]: true }));
    setGrDetailError((prev) => ({ ...prev, [projectCode]: undefined }));

    try {
      const params = new URLSearchParams({
        project_code: projectCode,
        mode: 'gr',
        days: String(daysFilter),
      });

      const response = await fetch(`/api/material-po/detail?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Gagal mengambil detail');
      setGrDetailsByProject((prev) => ({ ...prev, [projectCode]: json.rows || [] }));
    } catch (error) {
      setGrDetailError((prev) => ({ ...prev, [projectCode]: String(error) }));
    } finally {
      setGrDetailLoading((prev) => ({ ...prev, [projectCode]: false }));
    }
  };

  const toggleGRDetails = async (projectCode) => {
    if (!projectCode) return;
    setExpandedGRs((prev) => ({ ...prev, [projectCode]: !prev[projectCode] }));
    if (!grDetailsByProject[projectCode]) {
      await fetchGRDetails(projectCode);
    }
  };


  const fetchRequestPRDetails = async (no_surat) => {
    if (!no_surat || requestPRDetailsBySurat[no_surat] || requestPRDetailLoading[no_surat]) return;
    setRequestPRDetailLoading((prev) => ({ ...prev, [no_surat]: true }));
    setRequestPRDetailError((prev) => ({ ...prev, [no_surat]: undefined }));

    try {
      const response = await fetch(`/api/material-po/detail?no_surat=${encodeURIComponent(no_surat)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Gagal mengambil detail');
      setRequestPRDetailsBySurat((prev) => ({ ...prev, [no_surat]: json.rows || [] }));
    } catch (error) {
      setRequestPRDetailError((prev) => ({ ...prev, [no_surat]: String(error) }));
    } finally {
      setRequestPRDetailLoading((prev) => ({ ...prev, [no_surat]: false }));
    }
  };

  const toggleRequestPRDetails = async (no_surat) => {
    if (!no_surat) return;
    setExpandedRequestPRs((prev) => ({ ...prev, [no_surat]: !prev[no_surat] }));
    if (!requestPRDetailsBySurat[no_surat]) {
      await fetchRequestPRDetails(no_surat);
    }
  };

  const fetchTableData = async (days = tableDaysFilter, projectCode = tableProjectFilter, status = tableStatusFilter) => {
    setTableLoading(true);
    setTableError('');

    try {
      const params = new URLSearchParams({
        days: String(days),
      });
      if (projectCode) {
        params.set('project_code', projectCode);
      }
      if (status) {
        params.set('status', status);
      }

      const response = await fetch(`/api/material-table?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Gagal mengambil data tabel material');
      }

      setTableData(Array.isArray(json.rows) ? json.rows : []);
      setStatusOptions(Array.isArray(json.status_options) ? json.status_options : []);
    } catch (error) {
      setTableError(String(error));
      setTableData([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(tableDaysFilter, tableProjectFilter, tableStatusFilter).catch((error) => {
      console.error('Gagal memuat tabel material:', error);
    });
  }, [tableDaysFilter, tableProjectFilter, tableStatusFilter]);

  const cx = FUNNEL_MAX_WIDTH / 2;
  const metaByKey = Object.fromEntries(STAGE_META.map((m) => [m.key, m]));

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 28px",
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        color: "#fff",
      }}
    >
      <style jsx>{`
        @keyframes rimPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.9; }
        }

        /* Responsive layout for dashboard */
        :global(.pd-container) { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; flex-wrap: nowrap; }
        :global(.pd-left) { flex: 1 1 640px; min-width: 560px; }
        :global(.pd-right) { width: 320px; display: flex; flex-direction: column; gap: 12px; align-items: flex-end; }
        :global(.pd-top-list) { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        :global(.pd-top-card) { padding: 12px 14px; border-radius: 12px; color: #fff; box-shadow: 0 6px 18px rgba(3,12,40,0.5); display: flex; flex-direction: column; gap: 6px; width: 100%; min-width: 0; flex: 1 1 auto; }

        /* Small screens: place top-projects under funnel, show horizontal row */
        @media (max-width: 900px) {
          :global(.pd-container) { flex-direction: column; }
          :global(.pd-left) { min-width: 0; }
          :global(.pd-right) { width: 100%; align-items: stretch; }
          :global(.pd-top-list) { flex-direction: row; overflow-x: auto; padding-bottom: 6px; }
          :global(.pd-top-card) { flex: 0 0 auto; width: 72vw; min-width: 180px; max-width: 320px; }
        }

        /* nicer horizontal scroll appearance */
        :global(.pd-top-list)::-webkit-scrollbar { height: 8px; }
        :global(.pd-top-list)::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 6px; }
        :global(.pd-top-list)::-webkit-scrollbar-track { background: transparent; }

        /* Metrics cards section */
        :global(.pd-metrics) { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
          gap: 18px; 
          margin-top: 28px; 
          margin-bottom: 28px;
          padding: 0 4px;
        }
        :global(.pd-metric-card) { 
          background: linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 30, 89, 0.6) 100%);
          border: 1px solid rgba(79, 172, 254, 0.25);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          transition: all 300ms ease;
        }
        :global(.pd-metric-card):hover { 
          border-color: rgba(79, 172, 254, 0.4);
          background: linear-gradient(135deg, rgba(40, 75, 160, 0.5) 0%, rgba(20, 40, 110, 0.7) 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(79, 172, 254, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        :global(.pd-metric-label) { 
          font-size: 12px; 
          opacity: 0.9; 
          color: #ffffff; 
          font-weight: 500; 
          line-height: 1.4; 
        }
        :global(.pd-metric-value) { 
          font-size: 28px; 
          font-weight: 800; 
          color: #ffffff; 
          letter-spacing: -0.5px; 
        }

        /* Kanban styles (moved here to avoid nested styled-jsx) */
        :global(.kanban-row) { display: flex; gap: 14px; align-items: flex-start; }
        :global(.kanban-col) { flex: 1 1 0; background: linear-gradient(180deg, rgba(6,8,23,0.45), rgba(6,8,23,0.25)); border-radius: 12px; padding: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
        :global(.kanban-header) { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; }
        :global(.kanban-count) { font-weight:800; font-size:18px; color:#fff; }
        :global(.kanban-card) { background: rgba(3,12,40,0.6); border-radius:10px; padding:10px; color:#fff; margin-bottom:10px; box-shadow: 0 6px 18px rgba(0,0,0,0.45); }
        :global(.kanban-badge) { padding:6px 10px; border-radius:999px; font-weight:700; color:#fff; font-size:12px; }

        /* Badge blinking animation */
        @keyframes badgePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(255, 255, 255, 0.3); }
          50% { opacity: 0.6; box-shadow: 0 0 16px rgba(59, 130, 246, 0.6); }
        }
        :global(.pulse-badge) { animation: badgePulse 1.5s ease-in-out infinite; }
      `}</style>

      <div className="pd-container">
        <div
          className="pd-left"
          style={{
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 12,
            padding: "24px 28px",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 22px 0", letterSpacing: 0.2 }}>
            Status Pengadaan
          </h2>

          <div style={{ display: "flex", gap: 0 }}>
            <PengadaanFunnel data={data} geom={geom} cx={cx} metaByKey={metaByKey} mounted={mounted} />

            {/* Kartu detail — sisi kiri kini dihitung dari lebar funnel absolut
                di batas atas & bawah tiap ruas, sehingga botIndent kartu A
                selalu = topIndent kartu B (garis diagonal menyambung lurus). */}
            <div style={{ position: "relative", flex: 1, height: TOTAL_HEIGHT + TOP_RIM_GUARD, marginLeft: 14 }}>
              {STAGE_META.map((meta, i) => {
                const g = geom[meta.key];
                const s = cardsByKey[meta.key];
                // Indent proporsional terhadap lebar funnel absolut (bukan taper
                // relatif per-kartu) — nilai ini identik di titik sambung antar kartu.
                const topIndent = 6 + (g.top / FUNNEL_MAX_WIDTH) * 40;
                const botIndent = 6 + (g.bottom / FUNNEL_MAX_WIDTH) * 40;
                // Konten teks digeser ke kanan mengikuti kedalaman notch di
                // tepi kiri kartu (topIndent selalu >= botIndent), supaya label
                // & angka tidak pernah tertimpa potongan diagonal — kartu
                // dengan notch lebih dalam (mis. PR) mendapat padding kiri
                // lebih besar dibanding kartu dengan notch dangkal (mis. GR).
                const edgePad = Math.max(topIndent, botIndent);
                return (
                  <div
                    key={meta.key}
                    style={{ position: "absolute", top: g.y, height: g.h, left: 0, right: 0, display: "flex", alignItems: "center" }}
                  >
                    <div
                      style={{
                        background: meta.cardBg,
                        borderRadius: "0 20px 20px 0",
                        padding: `12px 16px 12px ${20 + edgePad}px`,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1.3fr",
                        alignItems: "center",
                        gap: 4,
                        width: "100%",
                        height: "100%",
                        boxSizing: "border-box",
                        boxShadow: "-10px 0 18px -12px rgba(0,0,0,0.5)",
                        clipPath: `polygon(${topIndent + 9}px 0, 100% 0, 100% 100%, ${botIndent + 9}px 100%, ${botIndent}px calc(100% - 12px), ${topIndent}px 12px)`,
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateX(0)" : "translateX(12px)",
                        transition: `opacity 500ms ease ${i * 120}ms, transform 500ms ease ${i * 120}ms, clip-path 700ms cubic-bezier(.22,.9,.34,1)`,
                      }}
                    >
                      <div style={{ paddingLeft: 8 }}>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>Jumlah {meta.label}</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{s.total}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>Jumlah Barang</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{s.barang}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>Jumlah qty</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>
                          {formatQtyK(s.qty)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>Nilai Rupiah</div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>Rp {formatRupiah(s.rp)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {editable && (
            <div style={{ marginTop: 26, display: "flex", gap: 22, flexWrap: "wrap" }}>
              {["pr_percentage", "po_percentage", "arrival_percentage"].map((key, i) => (
                <label key={key} style={{ fontSize: 12, opacity: 0.85, display: "flex", flexDirection: "column", gap: 6 }}>
                  {STAGE_META[i].label} % (coba geser)
                  <input type="range" min={5} max={100} value={data[key]} onChange={handleSlider(key)} style={{ width: 160 }} />
                </label>
              ))}
            </div>
          )}
        </div>

      <PengadaanTopProjects topProjects={data.top_projects || []} />
      </div>

      <PengadaanMetrics data={data} />

      <VendorPerformance vendors={data.vendor_performance} />

      <PengadaanKanbanSection
        dateRangeLabel={dateRangeLabel}
        daysFilter={daysFilter}
        setDaysFilter={setDaysFilter}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        projectOptions={projectOptions}
        filterLoading={filterLoading}
        filterError={filterError}
        data={data}
        expandedRequestPRs={expandedRequestPRs}
        expandedPRs={expandedPRs}
        expandedPOs={expandedPOs}
        requestPRDetailsBySurat={requestPRDetailsBySurat}
        requestPRDetailLoading={requestPRDetailLoading}
        requestPRDetailError={requestPRDetailError}
        prDetailsByPr={prDetailsByPr}
        prDetailLoading={prDetailLoading}
        prDetailError={prDetailError}
        poDetailsByPo={poDetailsByPo}
        poDetailLoading={poDetailLoading}
        poDetailError={poDetailError}
        toggleRequestPRDetails={toggleRequestPRDetails}
        togglePRDetails={togglePRDetails}
        togglePODetails={togglePODetails}
        expandedGRs={expandedGRs}
        grDetailsByProject={grDetailsByProject}
        grDetailLoading={grDetailLoading}
        grDetailError={grDetailError}
        toggleGRDetails={toggleGRDetails}
        renderStatusBadge={renderStatusBadge}
        getAvgLeadTimePrBadgeClass={getAvgLeadTimePrBadgeClass}
        formatDateOnly={formatDateOnly}
        formatAvgLeadTimePr={formatAvgLeadTimePr}
        renderMaterialQuantities={renderMaterialQuantities}
        getEffectiveStatus={getEffectiveStatus}
      />

      <PengadaanTable
        tableDateRangeLabel={tableDateRangeLabel}
        tableDaysFilter={tableDaysFilter}
        setTableDaysFilter={setTableDaysFilter}
        tableProjectFilter={tableProjectFilter}
        setTableProjectFilter={setTableProjectFilter}
        tableStatusFilter={tableStatusFilter}
        setTableStatusFilter={setTableStatusFilter}
        tableSearchInput={tableSearchInput}
        setTableSearchInput={setTableSearchInput}
        tableSortKey={tableSortKey}
        setTableSortKey={setTableSortKey}
        tableSortOrder={tableSortOrder}
        setTableSortOrder={setTableSortOrder}
        projectOptions={projectOptions}
        statusOptions={statusOptions}
        tableLoading={tableLoading}
        tableError={tableError}
        tableData={tableData}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        rowsPerPage={rowsPerPage}
        renderStatusBadge={renderStatusBadge}
        getAvgLeadTimePrBadgeClass={getAvgLeadTimePrBadgeClass}
      />
    </div>
  );
}
