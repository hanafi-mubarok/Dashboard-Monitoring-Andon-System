import ModernSidebar from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import PengadaanDashboard from "@/components/material/PengadaanDashboard";
import MaterialRequestPoster from "@/components/material/MaterialRequestPoster";
import { getPengadaanPercentage, getAverageLeadTime, getTopProjects, getDevQty, getKanbanPR, getKanbanPO, getKanbanGR, getVendorPerformance } from "@/lib/queries/material_po";
import { getKanbanReqPR } from "@/lib/queries/request_pr";

function formatDateOnly(value?: Date | string | null) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function getDefaultDateRangeLabel() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return `${formatDateOnly(start)} - ${formatDateOnly(end)}`;
}

export default async function PengadaanMaterialPage() {
  // ambil semua data dari server secara parallel
  const [percentageRows, leadTimeRows, topProjectsRows, devQtyRows, kanbanPRRows, kanbanReqPRRows, kanbanPORows, kanbanGRRows, vendorPerformanceRows] = await Promise.all([
    getPengadaanPercentage(),
    getAverageLeadTime(),
    getTopProjects(),
    getDevQty(),
    getKanbanPR(),
    getKanbanReqPR(),
    getKanbanPO(),
    getKanbanGR(),
    getVendorPerformance(),
  ]);



  const stats = Array.isArray(percentageRows) && percentageRows.length > 0 ? percentageRows[0] : null;
  const leadTime = Array.isArray(leadTimeRows) && leadTimeRows.length > 0 ? leadTimeRows[0] : null;

  const data = {
    pr_percentage: stats?.pr_percentage ?? 100,
    po_percentage: stats?.po_percentage ?? 0,
    arrival_percentage: stats?.arrival_percentage ?? 0,
    total_pr: stats?.total_pr ?? 0,
    barang_pr: stats?.barang_pr ?? 0,
    qty_pr: stats?.qty_pr ?? 0,
    rp_pr: stats?.rp_pr ?? 0,
    total_po: stats?.total_po ?? 0,
    barang_po: stats?.barang_po ?? 0,
    qty_po: stats?.qty_po ?? 0,
    rp_po: stats?.rp_po ?? 0,
    total_arrived: stats?.total_arrived ?? 0,
    barang_arrived: stats?.barang_arrived ?? 0,
    qty_arrived: stats?.qty_arrived ?? 0,
    rp_arrived: stats?.rp_arrived ?? 0,
    // data lead time dari query
    avg_leadtime: leadTime?.avg_leadtime ? `${leadTime.avg_leadtime} hari` : "-",
    avg_pr_po: leadTime?.avg_pr_po ? `${leadTime.avg_pr_po} hari` : "-",
    avg_po_arrival: leadTime?.avg_po_arrival ? `${leadTime.avg_po_arrival} hari` : "-",
    on_time_percentage: leadTime?.on_time_percentage ?? 0,
    top_projects: Array.isArray(topProjectsRows) ? topProjectsRows : [],
    // kanban lists (server-side fetched)
    kanban_pr: Array.isArray(kanbanPRRows) ? kanbanPRRows : [],
    kanban_req_pr: Array.isArray(kanbanReqPRRows) ? kanbanReqPRRows : [],
    kanban_po: Array.isArray(kanbanPORows) ? kanbanPORows : [],
    kanban_gr: Array.isArray(kanbanGRRows) ? kanbanGRRows : [],
    // deviation qty data
    dev_qty_pr_po: Array.isArray(devQtyRows) && devQtyRows.length > 0 ? devQtyRows[0]?.percentage_qty_pr_po ?? 0 : 0,
    dev_qty_po_gr: Array.isArray(devQtyRows) && devQtyRows.length > 0 ? devQtyRows[0]?.percentage_qty_po_gr ?? 0 : 0,
    vendor_performance: Array.isArray(vendorPerformanceRows) ? vendorPerformanceRows : [],
  };

  return (
    <ModernSidebar>
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pengadaan Material</h1>
            <p className="text-sm text-gray-400 mt-1">Ringkasan status pengadaan material.</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-gray-500">Rentang data</div>
            <div className="text-sm text-gray-300">{getDefaultDateRangeLabel()}</div>
          </div>
        </div>

        <MaterialRequestPoster />

        <Card className="bg-transparent border-0 p-0">
          <CardContent className="p-0">
            <PengadaanDashboard data={data} editable={false} />
          </CardContent>
        </Card>
        {/* Fixed search anchor: jumps to the Data Tabel section in the dashboard */}
        <a href="#data-tabel-pr" title="Cari Data Material" aria-label="Cari Data Material" style={{ position: 'fixed', right: 18, top: '50%', transform: 'translateY(-50%)', zIndex: 9999 }}>
          <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9999, background: 'inherit', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.04)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true">
              <path d="M21 21l-4.35-4.35" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </a>
      </div>
    </ModernSidebar>
  );
}
