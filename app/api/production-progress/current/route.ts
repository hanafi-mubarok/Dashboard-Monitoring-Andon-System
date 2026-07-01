import { NextResponse, type NextRequest } from "next/server";
import {
  getRecentProgress,
  getProductionStatsByLine,
  getWorkstationStatsByLine,
  getProductionProgressByLine,
  getWorkstationDurations,
  getProductionEstimate,
  getProductStatusCards,
  getProductStatusSummary,
  getProductSchedule,
  getRecentOperatorByLine,
  getAbnormalProgress,
} from "@/lib/queries/production-progress";

import * as protrack from '@/lib/queries/production-progress-protrack';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get daysBack from query parameter, default to 7
    const daysBack = Number(request.nextUrl.searchParams.get("daysBack")) || 7;
    const rawLine = request.nextUrl.searchParams.get("line");
    // Treat misspelled or placeholder 'Worskshop' as no-line (so workshop-only filter applies)
    const line = rawLine && !/worskshop/i.test(rawLine) ? rawLine : undefined;
    const workshop = request.nextUrl.searchParams.get("workshop");

    if (workshop) {
      const [data, stats, workstations, recent, durations, estimate, cards, statusSummary, schedule, operators, abnormal] = await Promise.all([
        protrack.getRecentProgressByWorkshop(workshop),
        protrack.getProductionStatsByWorkshop(workshop),
        protrack.getWorkstationStatsByWorkshop(workshop),
        protrack.getProductionProgressByWorkshop(workshop),
        protrack.getWorkstationDurationsByWorkshop(workshop),
        protrack.getProductionEstimateByWorkshop(workshop),
        protrack.getProductStatusCardsByWorkshop(daysBack, workshop),
        protrack.getProductStatusSummaryByWorkshop(daysBack, workshop),
        protrack.getProductScheduleByWorkshop(workshop),
        protrack.getRecentOperatorByWorkshop(workshop),
        protrack.getAbnormalProgressByWorkshop(daysBack, workshop),
      ]);

      return NextResponse.json({
        count: Array.isArray(data) ? data.length : 0,
        updatedAt: new Date().toISOString(),
        current: data,
        stats,
        workstations,
        recent,
        durations,
        estimate,
        cards,
        statusSummary,
        schedule,
        operators,
        abnormal,
      });
    }

    const effectiveLine = line || "Lantai 3";
    const [data, stats, workstations, recent, durations, estimate, cards, statusSummary, schedule, operators, abnormal] = await Promise.all([
      getRecentProgress(effectiveLine),
      getProductionStatsByLine(effectiveLine),
      getWorkstationStatsByLine(effectiveLine),
      getProductionProgressByLine(effectiveLine, 50),
      getWorkstationDurations(effectiveLine),
      getProductionEstimate(effectiveLine),
      getProductStatusCards(daysBack, effectiveLine),
      getProductStatusSummary(daysBack, effectiveLine),
      getProductSchedule(effectiveLine),
      getRecentOperatorByLine(effectiveLine),
      getAbnormalProgress(daysBack, effectiveLine),
    ]);

    //console.log('[GET /api/production-progress/current] Schedule items:', schedule?.length || 0);

    return NextResponse.json({
      count: data.length,
      updatedAt: new Date().toISOString(),
      current: data,
      stats,
      workstations,
      recent,
      durations,
      estimate,
      cards,
      statusSummary,
      schedule,
      operators,
      abnormal,
    });
  } catch (error) {
    //console.error("[GET /api/production-progress/current]", error);
    return NextResponse.json(
      { error: "Failed to fetch current workstation data" },
      { status: 500 }
    );
  }
}
