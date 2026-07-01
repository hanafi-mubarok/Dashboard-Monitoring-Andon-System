import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Helper function to safely extract rows from db.execute result
function extractRows(result: any): any[] {
  if (!result) return [];
  if (Array.isArray(result)) {
    // Result is [rows, fields] from mysql2
    return Array.isArray(result[0]) ? result[0] : [];
  }
  return Array.isArray(result) ? result : [];
}

function getProductionProgressTableByLine(line?: string) {
  const normalizedLine = (line ?? '').trim().toLowerCase();
  const tableName = normalizedLine === 'lantai 1' || normalizedLine === 'lantai 2'
    ? 'production_progress_protrack'
    : 'production_progress';
  return sql.raw(tableName);
}

export interface ProductionProgress {
  id_process: number;
  id_product: string | null;
  id_perproduct: string | null;
  project_name: string | null;
  product_name: string | null;
  line: string | null;
  workshop: string | null;
  process_name: string | null;
  workstation: number | null;
  operator_actual_rfid: number | null;
  operator_actual_name: string | null;
  start_actual: Date | string | null;
  duration_sec_actual: number | null;
  duration_time_actual: string | null;
  status: string | null;
  note_qc?: string | null;
  finish_actual: Date | string | null;
  ideal_duration_time?: string | null;
}

export interface ProductCardbyTrainset {
  id_product: string | null;
  product_name: string | null;
  tanggal_mulai: Date | string | null;
  tanggal_selesai: Date | string | null;
  jumlah_tiapts: number | null;
  trainset: string | number | null;
  start_actual: Date | string | null;
  finish_actual: Date | string | null;
  jumlah_selesai: number | null;
  percentage: number | null;
  deviasi_hari: number | null;
}

export interface ProductDetailByTrainset {
  id_perproduct: string | null;
  product_name: string | null;
  id_product: string | null;
  operator_actual_name: string | null;
  start_actual: Date | string | null;
  finish_actual: Date | string | null;
  durasi_jam: number | string | null;
  status: string | null;
}

export interface ProductionStats {
  total_processes: number;
  completed: number;
  in_progress: number;
  pending: number;
  avg_duration_sec: number;
  total_duration_sec: number;
}

export interface WorkstationStats {
  workstation: number;
  total_processes: number;
  completed: number;
  avg_duration_sec: number;
  active_operator: string | null;
  current_status: string | null;
  product_name: string | null;
  id_perproduct: string | null;
}

// Get all production progress records
export async function getAllProductionProgress(): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      ORDER BY start_actual DESC
    `);
    
    const rows = extractRows(result);
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get production progress by ID
export async function getProductionProgressById(id: number): Promise<ProductionProgress | null> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE id_process = ${id}
      LIMIT 1
    `);
    
    const rows = extractRows(result);
    return rows.length > 0 ? (rows[0] as ProductionProgress) : null;
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return null;
  }
}

// Get by workshop
export async function getProductionProgressByWorkshop(workshop: string): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE workshop = ${workshop}
      ORDER BY start_actual DESC
    `);
    
    const rows = extractRows(result);
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get by line
export async function getProductionProgressByLine(line: string, limit?: number): Promise<ProductionProgress[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const result = await db.execute(sql`
      SELECT * FROM ${progressTable}
      WHERE line = ${line}
      ORDER BY start_actual DESC
      ${typeof limit === 'number' ? sql`LIMIT ${limit}` : sql``}
    `);
    
    const rows = extractRows(result);
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get by workstation
export async function getProductionProgressByWorkstation(workstation: number): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE workstation = ${workstation}
      ORDER BY start_actual DESC
    `);
    
    const rows = extractRows(result);
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get by status
export async function getProductionProgressByStatus(status: string): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE status = ${status}
      ORDER BY start_actual DESC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get by operator RFID
export async function getProductionProgressByOperator(rfid: number): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE operator_actual_rfid = ${rfid}
      ORDER BY start_actual DESC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get by project
export async function getProductionProgressByProject(projectName: string): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE project_name = ${projectName}
      ORDER BY start_actual DESC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get by product
export async function getProductionProgressByProduct(productName: string): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE product_name = ${productName}
      ORDER BY start_actual DESC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get by date range
export async function getProductionProgressByDateRange(
  startDate: Date | string,
  endDate: Date | string
): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE start_actual BETWEEN ${startDate} AND ${endDate}
      ORDER BY start_actual DESC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get active processes (no finish_actual)
export async function getActiveProductionProgress(): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE finish_actual IS NULL
      ORDER BY start_actual DESC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get completed processes
export async function getCompletedProductionProgress(): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE finish_actual IS NOT NULL
      ORDER BY finish_actual DESC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get production statistics
export async function getProductionStatsLantai3(): Promise<ProductionStats> {
  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_processes,
        SUM(CASE WHEN finish_actual IS NOT NULL THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN finish_actual IS NULL AND start_actual IS NOT NULL THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN start_actual IS NULL THEN 1 ELSE 0 END) as pending,
        AVG(duration_sec_actual) as avg_duration_sec,
        SUM(duration_sec_actual) as total_duration_sec
      FROM production_progress
      WHERE line = 'Lantai 3';
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    if (!rows || rows.length === 0) {
      return {
        total_processes: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        avg_duration_sec: 0,
        total_duration_sec: 0,
      };
    }
    return rows[0] as ProductionStats;
  } catch (error) {
    console.error("Failed to fetch production stats:", error);
    return {
      total_processes: 0,
      completed: 0,
      in_progress: 0,
      pending: 0,
      avg_duration_sec: 0,
      total_duration_sec: 0,
    };
  }
}

// Get production statistics by workshop
export async function getProductionStatsByWorkshop(workshop: string): Promise<ProductionStats> {
  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_processes,
        SUM(CASE WHEN finish_actual IS NOT NULL THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN finish_actual IS NULL AND start_actual IS NOT NULL THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN start_actual IS NULL THEN 1 ELSE 0 END) as pending,
        AVG(duration_sec_actual) as avg_duration_sec,
        SUM(duration_sec_actual) as total_duration_sec
      FROM production_progress
      WHERE workshop = ${workshop}
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows[0] as ProductionStats;
  } catch (error) {
    console.error("Failed to fetch production stats:", error);
    return {
      total_processes: 0,
      completed: 0,
      in_progress: 0,
      pending: 0,
      avg_duration_sec: 0,
      total_duration_sec: 0,
    };
  }
}

// Get production statistics by line
export async function getProductionStatsByLine(line: string): Promise<ProductionStats> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_processes,
        SUM(CASE WHEN finish_actual IS NOT NULL THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN finish_actual IS NULL AND start_actual IS NOT NULL THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN start_actual IS NULL THEN 1 ELSE 0 END) as pending,
        AVG(duration_sec_actual) as avg_duration_sec,
        SUM(duration_sec_actual) as total_duration_sec
      FROM ${progressTable}
      WHERE line = ${line}
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows[0] as ProductionStats;
  } catch (error) {
    console.error("Failed to fetch production stats:", error);
    return {
      total_processes: 0,
      completed: 0,
      in_progress: 0,
      pending: 0,
      avg_duration_sec: 0,
      total_duration_sec: 0,
    };
  }
}

// Get workstation statistics
export async function getWorkstationStatsLantai3(): Promise<WorkstationStats[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    workstation,
    COUNT(*) AS total_processes,
    SUM(CASE WHEN finish_actual IS NOT NULL THEN 1 ELSE 0 END) AS completed,
    AVG(duration_sec_actual) AS avg_duration_sec,
    MAX(operator_actual_name) AS active_operator,
    MAX(status) AS current_status,
    MAX(product_name) AS product_name,
    MAX(id_perproduct) AS id_perproduct
FROM production_progress
WHERE 
    workstation IS NOT NULL
    AND line = 'Lantai 3'
GROUP BY 
    workstation
ORDER BY 
    workstation ASC;
    `);
    
    const rows = extractRows(result);
    return rows as WorkstationStats[];
  } catch (error) {
    console.error("Failed to fetch workstation stats:", error);
    return [];
  }
}

// Get workstation statistics by line
export async function getWorkstationStatsByLine(line: string): Promise<WorkstationStats[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const result = await db.execute(sql`
      SELECT 
        workstation,
        COUNT(*) as total_processes,
        SUM(CASE WHEN finish_actual IS NOT NULL THEN 1 ELSE 0 END) as completed,
        AVG(duration_sec_actual) as avg_duration_sec,
        MAX(operator_actual_name) as active_operator,
        MAX(product_name) as product_name,
        MAX(id_perproduct) as id_perproduct
      FROM ${progressTable}
      WHERE line = ${line} AND workstation IS NOT NULL
      GROUP BY workstation
      ORDER BY workstation ASC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as WorkstationStats[];
  } catch (error) {
    console.error("Failed to fetch workstation stats:", error);
    return [];
  }
}

// Get recent production progress (last N records)
export async function getRecentProductionProgressLantai3(limit: number = 100): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
SELECT 
  pp.*,
  it.duration_time AS ideal_duration_time
FROM production_progress pp
LEFT JOIN ideal_time it 
  ON pp.id_product = it.id_product 
  AND pp.workstation = it.workstation
  AND (
    (pp.workstation = 0 AND it.process_name = 'total_production_qc')
    OR (pp.workstation <> 0 AND it.process_name = pp.process_name)
  )
WHERE pp.line = 'Lantai 3'
ORDER BY pp.start_actual DESC
LIMIT ${limit};
    `);
    
    const rows = extractRows(result);
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Backward-compatible alias used by older imports/pages.
export const getRecentProductionProgress = getRecentProductionProgressLantai3;

export interface CurrentWorkstationProgress {
  current_id_product: string | null;
  target_durasi: string | null;
  presentase: number | null;
  current_id_perproduct: string | null;
  current_product_name: string | null;
  current_workstation: number;
  current_operator_actual_name: string | null;
  current_start_actual: Date | string | null;
  current_status: string | null;
  urutan: number;
}

export interface WorkstationDuration {
  workstation: number;
  actual_duration: string | null;
}

export interface ProductionEstimate {
  id_product: string;
  product_name: string | null;
  start_actual: Date | string | null;
  total_duration: string | null;
  estimated_finish: Date | string | null;
}

export interface ProductStatusSummary {
  selesai_produksi: number;
  on_progress: number;
  finish_good: number;
  not_ok: number;
  gangguan: number;
  tunggu: number;
}

export interface ProductStatusCard {
  id_product: string;
  id_perproduct: string | null;
  product_name: string | null;
  process_name: string | null;
  percentage: number | null;
  qty_progress: number | null;
  total: number | null;
  operator_actual_name: string | null;
  start_actual: Date | string | null;
  finish_actual: Date | string | null;
  total_duration: string | null;
  estimated_finish: Date | string | null;
  is_finish_good: number;
  note_qc: string | null;
  status: string | null;
  current_workstation: number | null;
  is_completed: number;
}

export interface OperatorStats {
  operator_actual_rfid: number | null;
  operator_actual_name: string | null;
  latest_product_name: string | null;
  latest_id_perproduct: string | null;
  latest_start_actual: Date | string | null;
  total_selesai_all_time: number;
  total_selesai_hari_ini: number;
}

export interface ProductStatsByTrainset {
  product_name: string | null;
  trainset: string | null;
  jumlah_tunggu_qc: number | null;
  jumlah_kurang_komponen: number | null;
  jumlah_tiapts: number | null;
  presentase_selesai: number | null;
  presentase_kekurangan_komponen: number | null;
}

// Get distinct projects ordered by most recently started record (newest first)
export async function getDistinctProjects(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT project_name
      FROM production_progress
      WHERE project_name IS NOT NULL AND TRIM(project_name) <> ''
      GROUP BY project_name
      ORDER BY MAX(start_actual) DESC
    `);

    const rows = extractRows(result);
    return rows.map((r: any) => String(r.project_name));
  } catch (error) {
    console.error('Failed to fetch distinct projects:', error);
    return [];
  }
}

// Get distinct trainsets for a given project
export async function getDistinctTrainsetsByProject(projectName: string): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT trainset
      FROM production_progress
      WHERE project_name = ${projectName}
      ORDER BY trainset DESC
    `);

    const rows = extractRows(result);
    return rows.map((r: any) => String(r.trainset));
  } catch (error) {
    console.error('Failed to fetch trainsets for project:', projectName, error);
    return [];
  }
}

export interface AbnormalProgress {
  operator_actual_rfid: number | null;
  operator_actual_name: string | null;
  id_perproduct: string | null;
  product_name: string | null;
  start_actual: Date | string | null;
  status: string | null;
  note_qc: string | null;
  kategori?: string | null;
}



// Get up to 3 latest active processes per workstation (finish_actual is null)
export async function getRecentProgress(line?: string): Promise<CurrentWorkstationProgress[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const result = await db.execute(sql`
WITH RankedData AS (
    SELECT
        pp.id_product AS current_id_product,
        t.duration_time AS target_durasi,
        t.percentage AS presentase,
        pp.id_perproduct AS current_id_perproduct,
        pp.product_name AS current_product_name,
        pp.workstation AS current_workstation,
        pp.operator_actual_name AS current_operator_actual_name,
        pp.start_actual AS current_start_actual,
        pp.status AS current_status,
        ROW_NUMBER() OVER (PARTITION BY pp.workstation ORDER BY pp.start_actual DESC) as urutan
    FROM ${progressTable} AS pp
    LEFT JOIN ideal_time AS t 
        ON pp.id_product = t.id_product 
        AND (
          pp.status = t.status
          OR (
            pp.status LIKE 'Selesai Kit %'
            AND t.status = REPLACE(pp.status, 'Selesai', 'Masuk')
          )
        )
    WHERE DATE(pp.start_actual) = CURDATE()
    AND pp.status NOT IN ('Tunggu Selesai', 'Gangguan Selesai')
    ${line ? sql`AND pp.line = ${line}` : sql``}
)
SELECT * FROM RankedData 
WHERE urutan <= 3
ORDER BY current_workstation ASC, urutan ASC;
    `);
    
    const rows = extractRows(result);
    return rows as CurrentWorkstationProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}


export async function getRecentOperatorByLine(line: string = 'Lantai 3'): Promise<OperatorStats[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const normalizedLine = (line ?? '').trim().toLowerCase();
    const isLantai12 = normalizedLine === 'lantai 1' || normalizedLine === 'lantai 2';
    const baseWindowFilter = isLantai12
      ? sql`p.start_actual >= NOW() - INTERVAL 24 HOUR`
      : sql`DATE(p.start_actual) = CURRENT_DATE()`;
    const completedCountExpr = isLantai12
      ? sql`COUNT(CASE WHEN p.status = 'Tunggu QC' AND p.start_actual >= NOW() - INTERVAL 24 HOUR THEN 1 END) AS total_selesai_hari_ini`
      : sql`COUNT(CASE WHEN p.status = 'Tunggu QC' THEN 1 END) AS total_selesai_hari_ini`;
    const result = await db.execute(sql`
SELECT 
    p.operator_actual_rfid, 
    p.operator_actual_name,

    -- Ambil product_name terbaru
    (
        SELECT pp.product_name
        FROM ${progressTable} pp
        WHERE pp.operator_actual_rfid = p.operator_actual_rfid
          AND pp.line = ${line}
        ORDER BY pp.start_actual DESC
        LIMIT 1
    ) AS latest_product_name,
    
    -- Ambil id_perproduct terbaru
    (
        SELECT pp.id_perproduct
        FROM ${progressTable} pp
        WHERE pp.operator_actual_rfid = p.operator_actual_rfid
          AND pp.line = ${line}
        ORDER BY pp.start_actual DESC
        LIMIT 1
    ) AS latest_id_perproduct,
    
    -- Ambil start_actual terbaru (On Progress)
    (
        SELECT pp.start_actual
        FROM ${progressTable} pp
        WHERE pp.operator_actual_rfid = p.operator_actual_rfid
          AND pp.status = 'On Progress'
          AND pp.line = ${line}
        ORDER BY pp.start_actual DESC
        LIMIT 1
    ) AS latest_start_actual,
    
    -- Total 'Tunggu QC' seumur hidup (hanya Lantai 3)
    (
        SELECT COUNT(*) 
        FROM ${progressTable} all_time 
        WHERE all_time.operator_actual_rfid = p.operator_actual_rfid 
          AND all_time.status = 'Tunggu QC'
          AND all_time.line = ${line}
    ) AS total_selesai_all_time,
    
    -- Total 'Tunggu QC' hari ini
    ${completedCountExpr}

FROM 
    ${progressTable} p
WHERE 
    ${baseWindowFilter}
  AND p.line = ${line}

GROUP BY 
    p.operator_actual_rfid, 
    p.operator_actual_name

ORDER BY 
    total_selesai_all_time DESC;
    `);
    
    const rows = extractRows(result);
    return rows as OperatorStats[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

export async function getRecentOperatorLantai3(): Promise<OperatorStats[]> {
  return getRecentOperatorByLine('Lantai 3');
}

export async function getAbnormalProgress(daysBack: number = 7, line?: string): Promise<AbnormalProgress[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const result = await db.execute(sql`
SELECT
  pp.operator_actual_rfid,
  pp.operator_actual_name,
  pp.id_perproduct,
  pp.product_name,
  pp.start_actual,

  CASE
    WHEN
      pp.status = 'On Progress'
      AND pp.start_actual <= NOW() - INTERVAL 3 DAY
      AND NOT EXISTS (
          SELECT 1
          FROM ${progressTable} qc
          WHERE qc.id_perproduct = pp.id_perproduct
            AND qc.status = 'Tunggu QC'
      )
    THEN 'On Progress > 3 Hari'
    ELSE pp.status
  END AS status,

  pp.note_qc,

  CASE
    WHEN
      pp.status = 'On Progress'
      AND pp.start_actual <= NOW() - INTERVAL 3 DAY
      AND NOT EXISTS (
          SELECT 1
          FROM ${progressTable} qc
          WHERE qc.id_perproduct = pp.id_perproduct
            AND qc.status = 'Tunggu QC'
      )
    THEN 'On Progress > 3 hari'

    WHEN
      pp.status IN ('Gangguan', 'Not OK', 'Kurang Komponen')
      OR (TRIM(pp.note_qc) IS NOT NULL AND TRIM(pp.note_qc) != '')
    THEN 'Laporan Abnormal'

  END AS kategori

FROM ${progressTable} pp

WHERE
    pp.start_actual >= NOW() - INTERVAL ${daysBack} DAY 
${line ? sql`AND pp.line = ${line}` : sql``}

AND
(
      (
        pp.status = 'On Progress'
        AND pp.start_actual <= NOW() - INTERVAL 3 DAY
        AND pp.start_actual = (
            SELECT MAX(sub.start_actual)
            FROM ${progressTable} sub
            WHERE sub.id_perproduct = pp.id_perproduct
        )
        AND NOT EXISTS (
            SELECT 1
            FROM ${progressTable} qc
            WHERE qc.id_perproduct = pp.id_perproduct
              AND qc.status = 'Tunggu QC'
        )
      )

   OR

      (
        pp.status IN ('Gangguan', 'Not OK', 'Kurang Komponen')
        OR (TRIM(pp.note_qc) IS NOT NULL AND TRIM(pp.note_qc) != '')
      )
);
    `);
    
    const rows = extractRows(result);
    return rows as AbnormalProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get actual duration for each workstation (today)
export async function getWorkstationDurations(line?: string): Promise<WorkstationDuration[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const result = await db.execute(sql`
      SELECT 
        workstation,
        duration_time_actual as actual_duration
      FROM ${progressTable}
      WHERE DATE(start_actual) = CURDATE()
      ${line ? sql`AND line = ${line}` : sql``}
      ORDER BY workstation ASC, start_actual DESC
    `);
    
    const rows = extractRows(result);
    return rows as WorkstationDuration[];
  } catch (error) {
    console.error("Failed to fetch workstation durations:", error);
    return [];
  }
}

// Get production estimate based on WS1 start time and total_production_qc duration
export async function getProductionEstimate(line?: string): Promise<ProductionEstimate | null> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const result = await db.execute(sql`
      SELECT 
        pp.id_product,
        pp.product_name,
        pp.start_actual,
        it.duration_time as total_duration,
        DATE_ADD(pp.start_actual, INTERVAL TIME_TO_SEC(it.duration_time) SECOND) as estimated_finish
      FROM ${progressTable} pp
      INNER JOIN ideal_time it 
        ON pp.id_product = it.id_product 
        AND it.process_name = 'total_production_qc'
      WHERE pp.workstation IN (0, 1) 
        AND DATE(pp.start_actual) = CURDATE()
        AND pp.finish_actual IS NULL
        ${line ? sql`AND pp.line = ${line}` : sql``}
      ORDER BY pp.start_actual DESC
      LIMIT 1
    `);
    
    const rows = extractRows(result);
    return rows.length > 0 ? (rows[0] as ProductionEstimate) : null;
  } catch (error) {
    console.error("Failed to fetch production estimate:", error);
    return null;
  }
}

// Get product status cards for specified date range (default: last 7 days)
export async function getProductStatusCards(daysBack: number = 7, line?: string): Promise<ProductStatusCard[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const normalizedLine = (line ?? '').trim().toLowerCase();
    const useProtrackProgress = normalizedLine === 'lantai 1' || normalizedLine === 'lantai 2';
    const percentageSelect = useProtrackProgress
      ? sql`COALESCE(l.percentage, 0) AS percentage,`
      : sql`NULL AS percentage,`;
    const progressCountSelect = useProtrackProgress
      ? sql`COALESCE(l.qty_progress, 0) AS qty_progress, COALESCE(l.total, 0) AS total,`
      : sql`NULL AS qty_progress, NULL AS total,`;
    const result = await db.execute(sql`
WITH ws1_start AS (
  SELECT
    id_perproduct,
    MIN(start_actual) as ws1_start_actual
  FROM ${progressTable}
  WHERE workstation IN (0, 1)
    AND DATE(start_actual) >= DATE_SUB(CURDATE(), INTERVAL ${daysBack} DAY)
    ${line ? sql`AND line = ${line}` : sql``}
  GROUP BY id_perproduct
),
latest AS (
  SELECT
    pp.*,
    ROW_NUMBER() OVER (PARTITION BY pp.id_perproduct ORDER BY pp.start_actual DESC) AS rn
  FROM ${progressTable} pp
  WHERE DATE(pp.start_actual) >= DATE_SUB(CURDATE(), INTERVAL ${daysBack} DAY)
    ${line ? sql`AND pp.line = ${line}` : sql``}
)
SELECT
  l.id_product,
  l.id_perproduct,
  l.product_name,
  l.process_name,
  ${percentageSelect}
  ${progressCountSelect}
  l.operator_actual_name,
  ws1.ws1_start_actual as start_actual,
  l.finish_actual,
  l.note_qc,
  l.status,
  l.workstation as current_workstation,
  it.duration_time AS total_duration,
  DATE_ADD(ws1.ws1_start_actual, INTERVAL TIME_TO_SEC(it.duration_time) SECOND) AS estimated_finish,
  CASE WHEN l.status = 'Finish Good' THEN 1 ELSE 0 END AS is_finish_good,
CASE 
    WHEN l.status = 'Tunggu QC' THEN 1
    WHEN l.status = 'Finish Good' THEN 1
    WHEN l.status IN ('QC Layout', 'QC Belltest', 'QC Function') THEN 1
    WHEN l.status IN ('On Progress', 'Masuk%', 'Istirahat', 'Tunggu', 'Kurang Komponen') THEN 0
    WHEN l.finish_actual IS NOT NULL THEN 1
    ELSE 0 
END AS is_completed
FROM latest l
LEFT JOIN ws1_start ws1 ON l.id_perproduct = ws1.id_perproduct
LEFT JOIN ideal_time it
  ON l.id_product = it.id_product
  AND it.process_name = 'total_production_qc'
WHERE l.rn = 1
ORDER BY l.start_actual DESC;
    `);

    const rows = extractRows(result);
    return rows as ProductStatusCard[];
  } catch (error) {
    console.error("Failed to fetch product status cards:", error);
    return [];
  }
}

// Get processes by workshop and line
export async function getProductionProgressByWorkshopAndLine(
  workshop: string,
  line: string
): Promise<ProductionProgress[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const result = await db.execute(sql`
      SELECT * FROM ${progressTable}
      WHERE workshop = ${workshop} AND line = ${line}
      ORDER BY start_actual DESC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Get processes by line and workstation
export async function getProductionProgressByLineAndWorkstation(
  line: string,
  workstation: number
): Promise<ProductionProgress[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const result = await db.execute(sql`
      SELECT * FROM ${progressTable}
      WHERE line = ${line} AND workstation = ${workstation}
      ORDER BY start_actual DESC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

// Search production progress (by project, product, or operator name)
export async function searchProductionProgress(searchTerm: string): Promise<ProductionProgress[]> {
  try {
    const searchPattern = `%${searchTerm}%`;
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE project_name LIKE ${searchPattern}
         OR product_name LIKE ${searchPattern}
         OR operator_actual_name LIKE ${searchPattern}
         OR process_name LIKE ${searchPattern}
      ORDER BY start_actual DESC
      LIMIT 100
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductionProgress[];
  } catch (error) {
    console.error("Failed to search production progress:", error);
    return [];
  }
}

// Dev helper: log recent production progress to the server console
export async function logProductionProgressSample(limit: number = 10): Promise<ProductionProgress[]> {
  try {
    const data = await getRecentProductionProgressLantai3(limit);
    //console.log(`[production_progress] showing ${data.length} rows (limit ${limit}):`, data);
    return data;
  } catch (error) {
    console.error("Failed to log production progress sample:", error);
    return [];
  }
}

// Get production status summary
export async function getProductStatusSummary(daysBack: number = 7, line?: string): Promise<ProductStatusSummary> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const result = await db.execute(sql`
/* ===================== CTE LATEST STATUS ===================== */
WITH LatestStatus AS (
    SELECT
        pp.id_perproduct,
        pp.status,
        pp.start_actual,

        ROW_NUMBER() OVER (
            PARTITION BY pp.id_perproduct
            ORDER BY pp.start_actual DESC
        ) AS rn

    FROM ${progressTable} pp
    ${line ? sql`WHERE pp.line = ${line}` : sql``}
),

/* ===================== HISTORI PERIODE ===================== */
HistoriPeriode AS (
    SELECT *
    FROM ${progressTable}
    WHERE start_actual >= ${startDate}
    ${line ? sql`AND line = ${line}` : sql``}
)

/* ===================== AGREGASI ===================== */
SELECT

    /* ================= Selesai Produksi ================= */
    COUNT(DISTINCT CASE
        WHEN
            ls.status LIKE 'Selesai WS%'
            OR ls.status IN ('Tunggu QC', 'Belum QC')
        THEN ls.id_perproduct
    END) AS selesai_produksi,

    /* ================= On Progress ================= */
    COUNT(DISTINCT CASE
        WHEN
            ls.status LIKE 'Masuk%'
            OR ls.status = 'On Progress'
        THEN ls.id_perproduct
    END) AS on_progress,

    /* ================= Finish Good ================= */
    COUNT(DISTINCT CASE
        WHEN ls.status = 'Finish Good'
        THEN ls.id_perproduct
    END) AS finish_good,

    /* ================= Not OK ================= */
    COUNT(DISTINCT CASE
        WHEN ls.status = 'Not OK'
        THEN ls.id_perproduct
    END) AS not_ok,

    /* ================= Gangguan (SEMUA KEJADIAN) ================= */
    COUNT(CASE
        WHEN
            hp.status LIKE '%Gangguan%'
            OR TRIM(hp.status) = 'Kurang Komponen'
        THEN 1
    END) AS gangguan,

    /* ================= Tunggu (SEMUA KEJADIAN) ================= */
    COUNT(CASE
        WHEN hp.status IN ('Tunggu', 'Istirahat')
        THEN 1
    END) AS tunggu

FROM LatestStatus ls

/* Join histori periode untuk hitung kejadian */
LEFT JOIN HistoriPeriode hp
    ON ls.id_perproduct = hp.id_perproduct

/* Latest only untuk status produksi */
WHERE ls.rn = 1

/* Filter periode untuk latest produksi juga */
AND ls.start_actual >= ${startDate};
    `);
    
    const rows = extractRows(result);
    if (rows.length > 0) {
      const row = rows[0];
      return {
        selesai_produksi: Number(row.selesai_produksi || 0),
        on_progress: Number(row.on_progress || 0),
        finish_good: Number(row.finish_good || 0),
        not_ok: Number(row.not_ok || 0),
        gangguan: Number(row.gangguan || 0),
        tunggu: Number(row.tunggu || 0),
      };
    }
    
    return {
      selesai_produksi: 0,
      on_progress: 0,
      finish_good: 0,
      not_ok: 0,
      gangguan: 0,
      tunggu: 0,
    };
  } catch (error) {
    console.error("Failed to fetch status summary:", error);
    return {
      selesai_produksi: 0,
      on_progress: 0,
      finish_good: 0,
      not_ok: 0,
      gangguan: 0,
      tunggu: 0,
    };
  }
}

export async function getProductSchedule(line?: string): Promise<any[]> {
  try {
    const progressTable = getProductionProgressTableByLine(line);
  const normalizedLine = (line ?? '').trim().toLowerCase();
  const useProtrackProgress = normalizedLine === 'lantai 1' || normalizedLine === 'lantai 2';

  if (useProtrackProgress) {
    const result = await db.execute(sql`
SELECT 
  j.id_product, 
  j.product_name, 
  j.trainset, 
  j.total_personil,
  j.proses_produk,
  j.jumlah_tiapts as total,
  j.tanggal_mulai, 
  j.tanggal_selesai,
  COALESCE(p.qty_progress, 0) AS jumlah_tunggu_qc,
  COALESCE(p.jumlah_finish_good, 0) AS jumlah_finish_good,
  COALESCE(p.percentage, 0) AS percentage
FROM 
  jadwal as j 
LEFT JOIN 
  (
    SELECT 
      id_product,
      trainset,
      COALESCE(MAX(qty_progress), 0) AS qty_progress,
      COALESCE(MAX(percentage), 0) AS percentage,
      SUM(CASE WHEN status = 'Finish Good' THEN 1 ELSE 0 END) AS jumlah_finish_good
    FROM ${progressTable}
    WHERE 
      MONTH(start_actual) = MONTH(CURRENT_DATE()) 
      AND YEAR(start_actual) = YEAR(CURRENT_DATE())
      ${line ? sql`AND line = ${line}` : sql``}
    GROUP BY id_product, trainset
  ) p 
  ON j.id_product = p.id_product
    AND j.trainset = p.trainset
WHERE 
  MONTH(j.tanggal_mulai) = MONTH(CURRENT_DATE()) 
  AND YEAR(j.tanggal_mulai) = YEAR(CURRENT_DATE())
  ${line ? sql`AND j.line = ${line}` : sql``}
ORDER BY 
  j.tanggal_selesai ASC;
    `);

    const rows = extractRows(result);
    return rows;
  }

    const result = await db.execute(sql`
SELECT 
    j.id_product,
    j.product_name,
    j.trainset,
    j.total_personil,
    j.proses_produk,
    j.jumlah_tiapts AS total,
    j.tanggal_mulai,
    j.tanggal_selesai,
    COALESCE(p.jumlah_tunggu_qc, 0) AS jumlah_tunggu_qc,
    COALESCE(p.jumlah_finish_good, 0) AS jumlah_finish_good,
    0 AS percentage
FROM 
    jadwal AS j
LEFT JOIN 
    (
        SELECT
            id_product,
            trainset,

            COUNT(DISTINCT CASE
                WHEN status = 'Tunggu QC'
                THEN id_perproduct
            END) AS jumlah_tunggu_qc,

            COUNT(DISTINCT CASE
                WHEN status = 'Finish Good'
                THEN id_perproduct
            END) AS jumlah_finish_good

        FROM ${progressTable}
        GROUP BY
            id_product,
            trainset
    ) p
    ON j.id_product = p.id_product
   AND j.trainset = p.trainset
WHERE
    MONTH(j.tanggal_mulai) = MONTH(CURRENT_DATE())
    AND YEAR(j.tanggal_mulai) = YEAR(CURRENT_DATE())
    ${line ? sql`AND j.line = ${line}` : sql``}
ORDER BY
    j.tanggal_selesai ASC;
    `);

    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error("Failed to fetch product schedule:", error);
    return [];
  }
}


export async function getProductStatsL3ByTrainset(): Promise<ProductStatsByTrainset[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    j.product_name,
    pp.trainset,

    COUNT(DISTINCT CASE 
        WHEN pp.status = 'Tunggu QC' 
        THEN pp.id_perproduct 
    END) AS jumlah_tunggu_qc,

    COUNT(DISTINCT CASE 
        WHEN pp.status = 'Kurang Komponen' 
        THEN pp.id_perproduct 
    END) AS jumlah_kurang_komponen,

    j.jumlah_tiapts,

    ROUND(
        COUNT(DISTINCT CASE 
            WHEN pp.status = 'Tunggu QC' 
            THEN pp.id_perproduct 
        END) * 100.0 / j.jumlah_tiapts
    ) AS presentase_selesai,

    ROUND(
        COUNT(DISTINCT CASE 
            WHEN pp.status = 'Kurang Komponen' 
            THEN pp.id_perproduct 
        END) * 100.0 / j.jumlah_tiapts
    ) AS presentase_kekurangan_komponen

FROM production_progress pp
JOIN jadwal j 
    ON pp.id_product = j.id_product 
   AND pp.trainset = j.trainset

WHERE j.line = 'Lantai 3'

GROUP BY j.product_name, pp.trainset, j.jumlah_tiapts;
    `);
    
    const rows = extractRows(result);
    return rows as ProductStatsByTrainset[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

export async function getProductCardbyTrainset(trainset: number): Promise<ProductCardbyTrainset[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    j.id_product,
    j.product_name,
    j.tanggal_mulai,
    j.tanggal_selesai,
    j.jumlah_tiapts,
    j.trainset,

    MIN(pp.start_actual) AS start_actual,
    MAX(pp.start_actual) AS finish_actual,

    COUNT(DISTINCT CASE 
        WHEN pp.status = 'Tunggu QC' 
        THEN pp.id_perproduct 
    END) AS jumlah_selesai,

    ROUND(
        COUNT(DISTINCT CASE 
            WHEN pp.status = 'Tunggu QC' 
            THEN pp.id_perproduct 
        END) / j.jumlah_tiapts * 100
    , 0) AS percentage,

    /* DEViasi (hari) */
    DATEDIFF(
        MAX(pp.start_actual), 
        j.tanggal_selesai
    ) AS deviasi_hari

FROM jadwal j
LEFT JOIN production_progress pp
    ON j.id_product = pp.id_product
    AND pp.trainset = ${trainset}

WHERE j.line = 'Lantai 3'
AND j.trainset = ${trainset}

GROUP BY 
    j.id_product,
    j.product_name,
    j.tanggal_mulai,
    j.tanggal_selesai,
    j.jumlah_tiapts,
    j.trainset

ORDER BY j.product_name ASC;
      
          `);
    
    const rows = extractRows(result);
    return rows as ProductCardbyTrainset[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

export async function getProductCardbyTrainsetL2(trainset: number | string): Promise<ProductCardbyTrainset[]> {
  try {
    const trainsetNumber = typeof trainset === 'string' ? Number(trainset) : trainset;
    const result = await db.execute(sql`
SELECT 
    j.id_product,
    j.product_name,
    j.tanggal_mulai,
    j.tanggal_selesai,
    j.jumlah_tiapts,
    j.trainset,

    MIN(pp.start_actual) AS start_actual,
    MAX(pp.start_actual) AS finish_actual,

    COUNT(DISTINCT CASE 
        WHEN pp.status = 'Selesai' 
        THEN pp.id_perproduct 
    END) AS jumlah_selesai,

    ROUND(
        COUNT(DISTINCT CASE 
            WHEN pp.status = 'Selesai' 
            THEN pp.id_perproduct 
        END) / j.jumlah_tiapts * 100
    , 0) AS percentage

FROM jadwal j
LEFT JOIN production_progress_protrack pp
    ON j.id_product = pp.id_product
    AND pp.trainset = ${trainsetNumber}

WHERE j.line = 'Lantai 2'
AND j.trainset = ${trainsetNumber}

GROUP BY 
    j.id_product,
    j.product_name,
    j.tanggal_mulai,
    j.tanggal_selesai,
    j.jumlah_tiapts,
    j.trainset

ORDER BY j.product_name ASC;
      
          `);
    
    const rows = extractRows(result);
    return rows as ProductCardbyTrainset[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

export async function getProductDetailbyTrainsetL3(trainset: number): Promise<ProductCardbyTrainset[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    p1.id_perproduct,
    p1.product_name,
    p1.id_product,
    p1.operator_actual_name,

    MIN(p1.start_actual) AS start_actual,
    MAX(p1.start_actual) AS finish_actual,

    /* Durasi dalam jam */
    SUM(
        CASE 
            WHEN p1.status = 'On Progress' 
                 AND p2.start_actual IS NOT NULL
            THEN TIMESTAMPDIFF(
                MINUTE,
                p1.start_actual,
                p2.start_actual
            )
            ELSE 0
        END
    ) / 60 AS durasi_jam

FROM production_progress p1

LEFT JOIN production_progress p2
    ON p1.id_perproduct = p2.id_perproduct
    AND p2.start_actual = (
        SELECT MIN(p3.start_actual)
        FROM production_progress p3
        WHERE p3.id_perproduct = p1.id_perproduct
        AND p3.start_actual > p1.start_actual
    )

WHERE p1.trainset = ${trainset}

GROUP BY 
    p1.id_perproduct,
    p1.product_name,
    p1.id_product,
    p1.operator_actual_name

ORDER BY p1.id_perproduct;
            
          `);
    
    const rows = extractRows(result);
    return rows as ProductCardbyTrainset[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}

export async function getProductDetailByProductL3(
  trainset: number,
  idProduct: string,
  productName?: string
): Promise<ProductDetailByTrainset[]> {
  try {
    const hasProductName = Boolean(productName && productName.trim());
    const result = await db.execute(sql`
WITH filtered AS (
  SELECT *
  FROM production_progress
  WHERE trainset = ${trainset}
    AND (
    id_product = ${idProduct}
    ${hasProductName ? sql`OR product_name = ${productName!.trim()}` : sql``}
    )
),
summary AS (
  SELECT
    id_perproduct,
    MIN(start_actual) AS start_actual,
    COALESCE(MAX(finish_actual), MAX(start_actual)) AS finish_actual
  FROM filtered
  GROUP BY id_perproduct
),
duration AS (
  SELECT
    p1.id_perproduct,
    ROUND(
      SUM(
        CASE
          WHEN p1.status = 'On Progress'
             AND p2.start_actual IS NOT NULL
          THEN TIMESTAMPDIFF(
            MINUTE,
            p1.start_actual,
            p2.start_actual
          )
          ELSE 0
        END
      ) / 60,
    2) AS durasi_jam
  FROM filtered p1
  LEFT JOIN filtered p2
    ON p1.id_perproduct = p2.id_perproduct
    AND p2.start_actual = (
      SELECT MIN(p3.start_actual)
      FROM filtered p3
      WHERE p3.id_perproduct = p1.id_perproduct
      AND p3.start_actual > p1.start_actual
    )
  GROUP BY p1.id_perproduct
),
latest AS (
  SELECT
    id_perproduct,
    product_name,
    id_product,
    operator_actual_name,
    status,
    ROW_NUMBER() OVER (
      PARTITION BY id_perproduct
      ORDER BY start_actual DESC, id_process DESC
    ) AS rn
  FROM filtered
)
SELECT
  s.id_perproduct,
  l.product_name,
  l.id_product,
  l.operator_actual_name,
  s.start_actual,
  s.finish_actual,
  d.durasi_jam,
  l.status
FROM summary s
JOIN duration d
  ON s.id_perproduct = d.id_perproduct
JOIN latest l
  ON s.id_perproduct = l.id_perproduct
   AND l.rn = 1
ORDER BY s.id_perproduct;
          `);

    const rows = extractRows(result);
    return rows as ProductDetailByTrainset[];
  } catch (error) {
    console.error('Failed to fetch product detail by product:', error);
    return [];
  }
}