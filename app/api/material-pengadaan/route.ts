import { NextRequest, NextResponse } from "next/server";
import { getPengadaanPercentage, getAverageLeadTime, getTopProjects, getDevQty, getKanbanPR, getKanbanPO, getKanbanGR, getVendorPerformance, getDistinctProjectCodes } from "@/lib/queries/material_po";
import { getKanbanReqPR } from "@/lib/queries/request_pr";

export async function GET(request: NextRequest) {
  try {
    const daysParam = request.nextUrl.searchParams.get("days");
    const projectCodeParam = request.nextUrl.searchParams.get("project_code")?.trim() ?? "";
    const days = daysParam ? Number(daysParam) : 30;

    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json(
        { success: false, error: "Parameter days harus angka positif" },
        { status: 400 }
      );
    }

    const projectCodesFilter = projectCodeParam ? [projectCodeParam] : undefined;

    const [percentageRows, leadTimeRows, topProjectsRows, devQtyRows, kanbanPRRows, kanbanReqPRRows, kanbanPORows, kanbanGRRows, vendorPerformanceRows, projectCodes] = await Promise.all([
      getPengadaanPercentage(undefined, projectCodesFilter, days),
      getAverageLeadTime(undefined, projectCodesFilter, days),
      getTopProjects(undefined, projectCodesFilter, days),
      getDevQty(undefined, projectCodesFilter, days),
      getKanbanPR(undefined, projectCodesFilter, days),
      getKanbanReqPR(days),
      getKanbanPO(undefined, projectCodesFilter, days),
      getKanbanGR(undefined, projectCodesFilter, days),
      getVendorPerformance(undefined, projectCodesFilter, days),
      getDistinctProjectCodes(days),
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
      avg_leadtime: leadTime?.avg_leadtime ? `${leadTime.avg_leadtime} hari` : "-",
      avg_pr_po: leadTime?.avg_pr_po ? `${leadTime.avg_pr_po} hari` : "-",
      avg_po_arrival: leadTime?.avg_po_arrival ? `${leadTime.avg_po_arrival} hari` : "-",
      on_time_percentage: leadTime?.on_time_percentage ?? 0,
      top_projects: Array.isArray(topProjectsRows) ? topProjectsRows : [],
      kanban_pr: Array.isArray(kanbanPRRows) ? kanbanPRRows : [],
      kanban_req_pr: Array.isArray(kanbanReqPRRows) ? kanbanReqPRRows : [],
      kanban_po: Array.isArray(kanbanPORows) ? kanbanPORows : [],
      kanban_gr: Array.isArray(kanbanGRRows) ? kanbanGRRows : [],
      dev_qty_pr_po: Array.isArray(devQtyRows) && devQtyRows.length > 0 ? devQtyRows[0]?.percentage_qty_pr_po ?? 0 : 0,
      dev_qty_po_gr: Array.isArray(devQtyRows) && devQtyRows.length > 0 ? devQtyRows[0]?.percentage_qty_po_gr ?? 0 : 0,
      vendor_performance: Array.isArray(vendorPerformanceRows) ? vendorPerformanceRows : [],
    };

    return NextResponse.json({ success: true, data, project_codes: projectCodes ?? [] }, { status: 200 });
  } catch (error) {
    console.error("API Error - gagal mengambil data pengadaan:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data pengadaan" },
      { status: 500 }
    );
  }
}
