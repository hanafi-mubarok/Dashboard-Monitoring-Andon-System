import ModernSidebar from "@/components/ui/sidebar";
import TimelineContent from "../timeline/timeline-content";
import {
  getProductionStatsByWorkshop,
  getProductionProgressByWorkshop,
  getWorkstationStatsByWorkshop,
  getRecentProgressByWorkshop,
  getWorkstationDurationsByWorkshop,
  getProductionEstimateByWorkshop,
  getProductStatusCardsByWorkshop,
  getProductStatusSummaryByWorkshop,
  getRecentOperatorByWorkshop,
  getAbnormalProgressByWorkshop,
  type ProductionStats,
  type WorkstationStats,
  type ProductionProgress,
  type CurrentWorkstationProgress,
  type WorkstationDuration,
  type ProductionEstimate,
  type ProductStatusSummary,
  type OperatorStats,
  type AbnormalProgress,
} from "@/lib/queries/production-progress-protrack";
import { type ProductStatusCard } from "@/lib/queries/production-progress";

export const dynamic = "force-dynamic";

export default async function TironPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const lineLabel = "Workshop";
  const workshop = "Tiron";

  const emptyStats: ProductionStats = {
    total_processes: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
    avg_duration_sec: 0,
    total_duration_sec: 0,
  };

  let stats: ProductionStats = emptyStats;
  let workstations: WorkstationStats[] = [];
  let recent: ProductionProgress[] = [];
  let current: CurrentWorkstationProgress[] = [];
  let durations: WorkstationDuration[] = [];
  let estimate: ProductionEstimate | null = null;
  let cards: ProductStatusCard[] = [];
  let statusSummary: ProductStatusSummary | null = null;
  let operators: OperatorStats[] = [];
  let abnormal: AbnormalProgress[] = [];

  try {
    [
      stats,
      workstations,
      recent,
      current,
      durations,
      estimate,
      cards,
      statusSummary,
      operators,
      abnormal,
    ] = await Promise.all([
      getProductionStatsByWorkshop(workshop),
      getWorkstationStatsByWorkshop(workshop),
      getProductionProgressByWorkshop(workshop),
      getRecentProgressByWorkshop(workshop),
      getWorkstationDurationsByWorkshop(workshop),
      getProductionEstimateByWorkshop(workshop),
      getProductStatusCardsByWorkshop(7, workshop),
      getProductStatusSummaryByWorkshop(7, workshop),
      getRecentOperatorByWorkshop(workshop),
      getAbnormalProgressByWorkshop(7, workshop),
    ]);
  } catch (error) {
    console.error('[TironPage] Failed to fetch initial data:', error);
  }

  const forcedStepRaw = Array.isArray(resolvedSearchParams?.current)
    ? resolvedSearchParams?.current[0]
    : resolvedSearchParams?.current;
  const parsedStep = forcedStepRaw ? Number(forcedStepRaw) : undefined;
  const forcedStep = Number.isFinite(parsedStep) ? parsedStep : undefined;

  return (
    <ModernSidebar>
      <TimelineContent
        initialStats={stats}
        initialWorkstations={workstations}
        initialRecent={recent}
        initialCurrent={current}
        initialDurations={durations}
        initialEstimate={estimate}
        initialCards={cards}
        initialStatusSummary={statusSummary}
        initialOperators={operators}
        initialAbnormal={abnormal}
        forcedStep={forcedStep}
        lineLabel={`${lineLabel} - ${workshop}`}
        apiLine={lineLabel}
        workshop={workshop}
        showWorkstationTimeline={false}
      />
    </ModernSidebar>
  );
}
