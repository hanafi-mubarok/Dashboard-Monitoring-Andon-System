import { NextRequest, NextResponse } from "next/server";
import { getTabelMaterial } from "@/lib/queries/material_po";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get("days")
      ? parseInt(searchParams.get("days") as string)
      : undefined;
    const projectCode = searchParams.get("project_code");
    const status = searchParams.get("status")?.trim() || "";

    let projectCodes: string[] | undefined;
    if (projectCode && projectCode !== "") {
      projectCodes = [projectCode];
    }

    const tableData = await getTabelMaterial(projectCodes, days);
    const statusOptions = Array.from(
      new Set(
        tableData
          .map((row) => String(row.status || '').trim())
          .filter((status) => status.length > 0)
      )
    );

    const filteredRows = status
      ? tableData.filter((row) => String(row.status || '').trim() === status)
      : tableData;

    return NextResponse.json(
      {
        success: true,
        rows: filteredRows,
        status_options: statusOptions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching material table data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch material table data",
      },
      { status: 500 }
    );
  }
}
