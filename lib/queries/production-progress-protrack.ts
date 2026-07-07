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

export interface ProductionProgress {
  id_process: number;
  id_product: string | null;
  id_perproduct: string | null;
  project_name: string | null;
  product_name: string | null;
  line: string | null;
  workshop: string | null;
  process_name: string | null;
  sub_process?: string | null;
  percentage?: number | null;
  qty_progress?: number | null;
  total?: number | null;
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

export interface ProductPercentageLantai2 {
  id_product: string;
  trainset: string | number;
  product_name: string | null;
  jumlah_tiapts: number | null;
  proses_produk: string | null;
  line: string | null;
  status: string;
  percentage: number;
  qty_progress: number;
  total: number;
  project?: string | null;
  tanggal_mulai: Date | string | null;
  start_actual?: Date | string | null;
}

export interface ProductSummaryLantai2 {
  id_product: string;
  trainset: string | number;
  product_name: string | null;
  line: string | null;
  percentage: number; // Average of 2 processes
  percentage_cutting: number;
  percentage_marking: number;
  qty_progress: number; // Total qty from both processes
  total: number; // Target total
  tanggal_mulai: Date | string | null;
  tanggal_selesai: Date | string | null;
  start_actual: Date | string | null;
  finish_actual: Date | string | null;
}

export interface ProductPercentageLantai1 {
  id_product: string;
  trainset: string | number;
  product_name: string | null;
  jumlah_tiapts: number | null;
  proses_produk: string | null;
  line: string | null;
  status: string;
  percentage: number;
  qty_progress: number;
  total: number;
  project?: string | null;
  tanggal_mulai: Date | string | null;
  start_actual?: Date | string | null;
}

export interface ProductSummaryLantai1 {
  id_product: string;
  trainset: string | number;
  product_name: string | null;
  line: string | null;
  percentage: number;
  percentage_cutting: number;
  percentage_marking: number;
  qty_progress: number;
  total: number;
  tanggal_mulai: Date | string | null;
  tanggal_selesai: Date | string | null;
  start_actual: Date | string | null;
  finish_actual: Date | string | null;
}

export interface ProductPercentageSukosari {
  id_product: string;
  trainset: string | number;
  product_name: string | null;
  jumlah_tiapts: number | null;
  proses_produk: string | null;
  line: string | null;
  status: string;
  percentage: number;
  qty_progress: number;
  total: number;
  tanggal_mulai: Date | string | null;
  start_actual?: Date | string | null;
  project?: string | null;
}

export interface ProductSummarySukosari {
  id_product: string;
  trainset: string | number;
  product_name: string | null;
  line: string | null;
  percentage: number;
  percentage_cutting: number;
  percentage_marking: number;
  qty_progress: number;
  total: number;
  tanggal_mulai: Date | string | null;
  tanggal_selesai: Date | string | null;
  start_actual: Date | string | null;
  finish_actual: Date | string | null;
}

export interface ProductPercentageTiron {
  id_product: string;
  trainset: string | number;
  product_name: string | null;
  jumlah_tiapts: number | null;
  proses_produk: string | null;
  line: string | null;
  status: string;
  percentage: number;
  qty_progress: number;
  total: number;
  tanggal_mulai: Date | string | null;
  start_actual?: Date | string | null;
  project?: string | null;
}

export interface ProductSummaryTiron {
  id_product: string;
  trainset: string | number;
  product_name: string | null;
  line: string | null;
  percentage: number;
  percentage_cutting: number;
  percentage_marking: number;
  qty_progress: number;
  total: number;
  tanggal_mulai: Date | string | null;
  tanggal_selesai: Date | string | null;
  start_actual: Date | string | null;
  finish_actual: Date | string | null;
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
      SELECT * FROM production_progress_protrack
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
export async function getProductionProgressByLine(line: string): Promise<ProductionProgress[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM production_progress
      WHERE line = ${line}
      ORDER BY start_actual DESC
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
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_processes,
        SUM(CASE WHEN finish_actual IS NOT NULL THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN finish_actual IS NULL AND start_actual IS NOT NULL THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN start_actual IS NULL THEN 1 ELSE 0 END) as pending,
        AVG(duration_sec_actual) as avg_duration_sec,
        SUM(duration_sec_actual) as total_duration_sec
      FROM production_progress
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
    const result = await db.execute(sql`
      SELECT 
        workstation,
        COUNT(*) as total_processes,
        SUM(CASE WHEN finish_actual IS NOT NULL THEN 1 ELSE 0 END) as completed,
        AVG(duration_sec_actual) as avg_duration_sec,
        MAX(operator_actual_name) as active_operator,
        MAX(product_name) as product_name,
        MAX(id_perproduct) as id_perproduct
      FROM production_progress
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

// Get latest active process per workstation (finish_actual is null)
export async function getRecentProgress(): Promise<CurrentWorkstationProgress[]> {
  try {
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
    FROM production_progress AS pp
    LEFT JOIN ideal_time AS t 
        ON pp.id_product = t.id_product 
        AND pp.status = t.status
    WHERE DATE(pp.start_actual) = CURDATE()
    AND pp.status NOT IN ('Tunggu Selesai', 'Gangguan Selesai')
)
SELECT * FROM RankedData 
WHERE urutan = 1;
    `);
    
    const rows = extractRows(result);
    return rows as CurrentWorkstationProgress[];
  } catch (error) {
    console.error("Failed to fetch production progress:", error);
    return [];
  }
}


export async function getRecentOperatorLantai3(): Promise<OperatorStats[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    p.operator_actual_rfid, 
    p.operator_actual_name,

    -- Ambil product_name terbaru
    (
        SELECT pp.product_name
        FROM production_progress pp
        WHERE pp.operator_actual_rfid = p.operator_actual_rfid
          AND pp.line = 'Lantai 3'
        ORDER BY pp.start_actual DESC
        LIMIT 1
    ) AS latest_product_name,
    
    -- Ambil id_perproduct terbaru
    (
        SELECT pp.id_perproduct
        FROM production_progress pp
        WHERE pp.operator_actual_rfid = p.operator_actual_rfid
          AND pp.line = 'Lantai 3'
        ORDER BY pp.start_actual DESC
        LIMIT 1
    ) AS latest_id_perproduct,
    
    -- Ambil start_actual terbaru (On Progress)
    (
        SELECT pp.start_actual
        FROM production_progress pp
        WHERE pp.operator_actual_rfid = p.operator_actual_rfid
          AND pp.status = 'On Progress'
          AND pp.line = 'Lantai 3'
        ORDER BY pp.start_actual DESC
        LIMIT 1
    ) AS latest_start_actual,
    
    -- Total 'Tunggu QC' seumur hidup (hanya Lantai 3)
    (
        SELECT COUNT(*) 
        FROM production_progress all_time 
        WHERE all_time.operator_actual_rfid = p.operator_actual_rfid 
          AND all_time.status = 'Tunggu QC'
          AND all_time.line = 'Lantai 3'
    ) AS total_selesai_all_time,
    
    -- Total 'Tunggu QC' hari ini
    COUNT(CASE WHEN p.status = 'Tunggu QC' THEN 1 END) AS total_selesai_hari_ini

FROM 
    production_progress p
WHERE 
    DATE(p.start_actual) = CURRENT_DATE()
    AND p.line = 'Lantai 3'

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

export async function getAbnormalProgress(daysBack: number = 7): Promise<AbnormalProgress[]> {
  try {
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
          FROM production_progress qc
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
          FROM production_progress qc
          WHERE qc.id_perproduct = pp.id_perproduct
            AND qc.status = 'Tunggu QC'
      )
    THEN 'On Progress > 3 hari'

    WHEN
      pp.status IN ('Gangguan', 'Not OK', 'Kurang Komponen')
      OR (TRIM(pp.note_qc) IS NOT NULL AND TRIM(pp.note_qc) != '')
    THEN 'Laporan Abnormal'

  END AS kategori

FROM production_progress pp

WHERE
    pp.start_actual >= NOW() - INTERVAL ${daysBack} DAY 

AND
(
      (
        pp.status = 'On Progress'
        AND pp.start_actual <= NOW() - INTERVAL 3 DAY
        AND pp.start_actual = (
            SELECT MAX(sub.start_actual)
            FROM production_progress sub
            WHERE sub.id_perproduct = pp.id_perproduct
        )
        AND NOT EXISTS (
            SELECT 1
            FROM production_progress qc
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
export async function getWorkstationDurations(): Promise<WorkstationDuration[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        workstation,
        duration_time_actual as actual_duration
      FROM production_progress
      WHERE DATE(start_actual) = CURDATE()
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
export async function getProductionEstimate(): Promise<ProductionEstimate | null> {
  try {
    const result = await db.execute(sql`
      SELECT 
        pp.id_product,
        pp.product_name,
        pp.start_actual,
        it.duration_time as total_duration,
        DATE_ADD(pp.start_actual, INTERVAL TIME_TO_SEC(it.duration_time) SECOND) as estimated_finish
      FROM production_progress pp
      INNER JOIN ideal_time it 
        ON pp.id_product = it.id_product 
        AND it.process_name = 'total_production_qc'
      WHERE pp.workstation IN (0, 1) 
        AND DATE(pp.start_actual) = CURDATE()
        AND pp.finish_actual IS NULL
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
export async function getProductStatusCards(daysBack: number = 7): Promise<ProductStatusCard[]> {
  try {
    const result = await db.execute(sql`
WITH ws1_start AS (
  SELECT
    id_perproduct,
    MIN(start_actual) as ws1_start_actual
  FROM production_progress
  WHERE workstation IN (0, 1)
    AND DATE(start_actual) >= DATE_SUB(CURDATE(), INTERVAL ${daysBack} DAY)
  GROUP BY id_perproduct
),
latest AS (
  SELECT
    pp.*,
    ROW_NUMBER() OVER (PARTITION BY pp.id_perproduct ORDER BY pp.start_actual DESC) AS rn
  FROM production_progress pp
  WHERE DATE(pp.start_actual) >= DATE_SUB(CURDATE(), INTERVAL ${daysBack} DAY)
)
SELECT
  l.id_product,
  l.id_perproduct,
  l.product_name,
  l.process_name,
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
    const result = await db.execute(sql`
      SELECT * FROM production_progress_protrack
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
    const result = await db.execute(sql`
      SELECT * FROM production_progress
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
export async function getProductStatusSummary(daysBack: number = 7): Promise<ProductStatusSummary> {
  try {
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

    FROM production_progress pp
),

/* ===================== HISTORI PERIODE ===================== */
HistoriPeriode AS (
    SELECT *
    FROM production_progress
    WHERE start_actual >= ${startDate}
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

export async function getProductSchedule(): Promise<any[]> {
  try {
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
    COALESCE(p.jumlah_tunggu_qc, 0) AS jumlah_tunggu_qc,
    COALESCE(p.jumlah_finish_good, 0) AS jumlah_finish_good
FROM 
    jadwal as j 
LEFT JOIN 
    (
        SELECT 
            id_product, 
      trainset,
            -- Hitung Tunggu QC
            SUM(CASE WHEN status = 'Tunggu QC' THEN 1 ELSE 0 END) AS jumlah_tunggu_qc,
            -- Hitung Finish Good
            SUM(CASE WHEN status = 'Finish Good' THEN 1 ELSE 0 END) AS jumlah_finish_good
        FROM production_progress
        WHERE 
            -- Filter: Hanya ambil progress yang start_actual-nya bulan ini
            MONTH(start_actual) = MONTH(CURRENT_DATE()) 
            AND YEAR(start_actual) = YEAR(CURRENT_DATE())
          GROUP BY id_product, trainset
    ) p 
    ON j.id_product = p.id_product
        AND j.trainset = p.trainset
WHERE 
    -- Filter: Hanya ambil jadwal yang tanggal_mulai-nya bulan ini
    MONTH(j.tanggal_mulai) = MONTH(CURRENT_DATE()) 
    AND YEAR(j.tanggal_mulai) = YEAR(CURRENT_DATE())
    AND j.line = 'Lantai 3'
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

// Get product schedule filtered by workshop (used when workshop-specific pages have null/empty line)
export async function getProductScheduleByWorkshop(workshop: string): Promise<any[]> {
  try {
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
    FROM production_progress_protrack
    WHERE 
      MONTH(start_actual) = MONTH(CURRENT_DATE()) 
      AND YEAR(start_actual) = YEAR(CURRENT_DATE())
      AND workshop = ${workshop}
    GROUP BY id_product, trainset
  ) p 
  ON j.id_product = p.id_product
    AND j.trainset = p.trainset
WHERE 
  MONTH(j.tanggal_mulai) = MONTH(CURRENT_DATE()) 
  AND YEAR(j.tanggal_mulai) = YEAR(CURRENT_DATE())
  AND j.workshop = ${workshop}
ORDER BY 
  j.tanggal_selesai ASC;

    `);

    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error("Failed to fetch product schedule by workshop:", error);
    return [];
  }
}

// --- Workshop-aware helpers (filter by workshop instead of line) ---
export async function getWorkstationStatsByWorkshop(workshop: string): Promise<WorkstationStats[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        workstation,
        COUNT(*) as total_processes,
        SUM(CASE WHEN finish_actual IS NOT NULL THEN 1 ELSE 0 END) as completed,
        AVG(duration_sec_actual) as avg_duration_sec,
        MAX(operator_actual_name) as active_operator,
        MAX(product_name) as product_name,
        MAX(id_perproduct) as id_perproduct
      FROM production_progress_protrack
      WHERE workshop = ${workshop} AND workstation IS NOT NULL
      GROUP BY workstation
      ORDER BY workstation ASC
    `);
    const rows = extractRows(result);
    return rows as WorkstationStats[];
  } catch (error) {
    console.error('Failed to fetch workstation stats by workshop:', error);
    return [];
  }
}

export async function getRecentProgressByWorkshop(workshop: string): Promise<any[]> {
  try {
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
    FROM production_progress_protrack AS pp
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
    AND pp.workshop = ${workshop}
)
SELECT * FROM RankedData 
WHERE urutan <= 3
ORDER BY current_workstation ASC, urutan ASC;
    `);
    const rows = extractRows(result);
    return rows as any[];
  } catch (error) {
    console.error('Failed to fetch recent progress by workshop:', error);
    return [];
  }
}

export async function getWorkstationDurationsByWorkshop(workshop?: string): Promise<WorkstationDuration[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        workstation,
        duration_time_actual as actual_duration
      FROM production_progress_protrack
      WHERE DATE(start_actual) = CURDATE()
      ${workshop ? sql`AND workshop = ${workshop}` : sql``}
      ORDER BY workstation ASC, start_actual DESC
    `);
    const rows = extractRows(result);
    return rows as WorkstationDuration[];
  } catch (error) {
    console.error('Failed to fetch workstation durations by workshop:', error);
    return [];
  }
}

export async function getProductionEstimateByWorkshop(workshop?: string): Promise<ProductionEstimate | null> {
  try {
    const result = await db.execute(sql`
      SELECT 
        pp.id_product,
        pp.product_name,
        pp.start_actual,
        it.duration_time as total_duration,
        DATE_ADD(pp.start_actual, INTERVAL TIME_TO_SEC(it.duration_time) SECOND) as estimated_finish
      FROM production_progress_protrack pp
      INNER JOIN ideal_time it 
        ON pp.id_product = it.id_product 
        AND it.process_name = 'total_production_qc'
      WHERE pp.workstation IN (0, 1) 
        AND DATE(pp.start_actual) = CURDATE()
        AND pp.finish_actual IS NULL
        ${workshop ? sql`AND pp.workshop = ${workshop}` : sql``}
      ORDER BY pp.start_actual DESC
      LIMIT 1
    `);
    const rows = extractRows(result);
    return rows.length > 0 ? (rows[0] as ProductionEstimate) : null;
  } catch (error) {
    console.error('Failed to fetch production estimate by workshop:', error);
    return null;
  }
}

export async function getProductStatusCardsByWorkshop(daysBack: number = 7, workshop?: string): Promise<any[]> {
  try {
    const result = await db.execute(sql`
WITH ws1_start AS (
  SELECT
    id_perproduct,
    MIN(start_actual) as ws1_start_actual
  FROM production_progress_protrack
  WHERE workstation IN (0, 1)
    AND DATE(start_actual) >= DATE_SUB(CURDATE(), INTERVAL ${daysBack} DAY)
    ${workshop ? sql`AND workshop = ${workshop}` : sql``}
  GROUP BY id_perproduct
),
latest AS (
  SELECT
    pp.*,
    ROW_NUMBER() OVER (PARTITION BY pp.id_perproduct ORDER BY pp.start_actual DESC) AS rn
  FROM production_progress_protrack pp
  WHERE DATE(pp.start_actual) >= DATE_SUB(CURDATE(), INTERVAL ${daysBack} DAY)
    ${workshop ? sql`AND pp.workshop = ${workshop}` : sql``}
)
SELECT
  l.id_product,
  l.id_perproduct,
  l.product_name,
  l.sub_process,
  l.process_name,
  COALESCE(l.percentage, 0) AS percentage,
  COALESCE(l.qty_progress, 0) AS qty_progress,
  COALESCE(l.total, 0) AS total,
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
LEFT JOIN ideal_time it ON l.id_product = it.id_product AND it.process_name = 'total_production_qc'
WHERE l.rn = 1
ORDER BY l.start_actual DESC;
    `);

    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error('Failed to fetch product status cards by workshop:', error);
    return [];
  }
}

export async function getProductStatusSummaryByWorkshop(daysBack: number = 7, workshop?: string): Promise<any> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const result = await db.execute(sql`
WITH LatestStatus AS (
    SELECT
        pp.id_perproduct,
        pp.status,
        pp.start_actual,
        ROW_NUMBER() OVER (PARTITION BY pp.id_perproduct ORDER BY pp.start_actual DESC) AS rn
    FROM production_progress_protrack pp
    ${workshop ? sql`WHERE pp.workshop = ${workshop}` : sql``}
),
HistoriPeriode AS (
    SELECT *
    FROM production_progress_protrack
    WHERE start_actual >= ${startDate}
    ${workshop ? sql`AND workshop = ${workshop}` : sql``}
)
SELECT
    COUNT(DISTINCT CASE WHEN ls.status LIKE 'Selesai WS%' OR ls.status IN ('Tunggu QC', 'Belum QC') THEN ls.id_perproduct END) AS selesai_produksi,
    COUNT(DISTINCT CASE WHEN ls.status LIKE 'Masuk%' OR ls.status = 'On Progress' THEN ls.id_perproduct END) AS on_progress,
    COUNT(DISTINCT CASE WHEN ls.status = 'Finish Good' THEN ls.id_perproduct END) AS finish_good,
    COUNT(DISTINCT CASE WHEN ls.status = 'Not OK' THEN ls.id_perproduct END) AS not_ok,
    COUNT(CASE WHEN hp.status LIKE '%Gangguan%' OR TRIM(hp.status) = 'Kurang Komponen' THEN 1 END) AS gangguan,
    COUNT(CASE WHEN hp.status LIKE '%Tunggu%' THEN 1 END) AS tunggu
FROM LatestStatus ls
LEFT JOIN HistoriPeriode hp ON ls.id_perproduct = hp.id_perproduct AND ls.rn = 1
;
    `);
    const rows = extractRows(result);
    return rows.length > 0 ? rows[0] : { selesai_produksi:0,on_progress:0,finish_good:0,not_ok:0,gangguan:0,tunggu:0 };
  } catch (error) {
    console.error('Failed to fetch status summary by workshop:', error);
    return { selesai_produksi:0,on_progress:0,finish_good:0,not_ok:0,gangguan:0,tunggu:0 };
  }
}

export async function getRecentOperatorByWorkshop(workshop: string): Promise<any[]> {
  try {
    const baseWindowFilter = sql`p.start_actual >= NOW() - INTERVAL 24 HOUR`;
    const result = await db.execute(sql`
SELECT 
    p.operator_actual_rfid, 
    p.operator_actual_name,
    (
        SELECT pp.product_name
        FROM production_progress_protrack pp
        WHERE pp.operator_actual_rfid = p.operator_actual_rfid
          AND pp.workshop = ${workshop}
        ORDER BY pp.start_actual DESC
        LIMIT 1
    ) AS latest_product_name,
    (
        SELECT pp.id_perproduct
        FROM production_progress_protrack pp
        WHERE pp.operator_actual_rfid = p.operator_actual_rfid
          AND pp.workshop = ${workshop}
        ORDER BY pp.start_actual DESC
        LIMIT 1
    ) AS latest_id_perproduct,
    (
        SELECT pp.start_actual
        FROM production_progress_protrack pp
        WHERE pp.operator_actual_rfid = p.operator_actual_rfid
          AND pp.status = 'On Progress'
          AND pp.workshop = ${workshop}
        ORDER BY pp.start_actual DESC
        LIMIT 1
    ) AS latest_start_actual,
    (
        SELECT COUNT(*) FROM production_progress_protrack all_time WHERE all_time.operator_actual_rfid = p.operator_actual_rfid AND all_time.status = 'Tunggu QC' AND all_time.workshop = ${workshop}
    ) AS total_selesai_all_time,
    COUNT(CASE WHEN p.status = 'Tunggu QC' THEN 1 END) AS total_selesai_hari_ini
FROM production_progress_protrack p
WHERE ${baseWindowFilter}
  AND p.workshop = ${workshop}
GROUP BY p.operator_actual_rfid, p.operator_actual_name
ORDER BY total_selesai_all_time DESC;
    `);
    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error('Failed to fetch recent operator by workshop:', error);
    return [];
  }
}

export async function getAbnormalProgressByWorkshop(daysBack: number = 7, workshop?: string): Promise<any[]> {
  try {
    const result = await db.execute(sql`
SELECT
  pp.operator_actual_rfid,
  pp.operator_actual_name,
  pp.id_perproduct,
  pp.product_name,
  pp.start_actual,
  CASE WHEN pp.status = 'On Progress' AND pp.start_actual <= NOW() - INTERVAL 3 DAY AND NOT EXISTS (SELECT 1 FROM production_progress qc WHERE qc.id_perproduct = pp.id_perproduct AND qc.status = 'Tunggu QC') THEN 'On Progress > 3 Hari' ELSE pp.status END AS status,
  pp.note_qc,
  CASE WHEN pp.status = 'On Progress' AND pp.start_actual <= NOW() - INTERVAL 3 DAY AND NOT EXISTS (SELECT 1 FROM production_progress_protrack qc WHERE qc.id_perproduct = pp.id_perproduct AND qc.status = 'Tunggu QC') THEN 'On Progress > 3 hari' WHEN pp.status IN ('Gangguan', 'Not OK', 'Kurang Komponen') OR (TRIM(pp.note_qc) IS NOT NULL AND TRIM(pp.note_qc) != '') THEN 'Laporan Abnormal' END AS kategori
FROM production_progress_protrack pp
WHERE pp.start_actual >= NOW() - INTERVAL ${daysBack} DAY
  ${workshop ? sql`AND pp.workshop = ${workshop}` : sql``}
  AND (
    (
      pp.status = 'On Progress'
      AND pp.start_actual <= NOW() - INTERVAL 3 DAY
      AND pp.start_actual = (
          SELECT MAX(sub.start_actual)
          FROM production_progress_protrack sub
          WHERE sub.id_perproduct = pp.id_perproduct
      )
      AND NOT EXISTS (
          SELECT 1 FROM production_progress_protrack qc WHERE qc.id_perproduct = pp.id_perproduct AND qc.status = 'Tunggu QC'
      )
    ) OR (
      pp.status IN ('Gangguan', 'Not OK', 'Kurang Komponen')
      OR (TRIM(pp.note_qc) IS NOT NULL AND TRIM(pp.note_qc) != '')
    )
  );
    `);
    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error('Failed to fetch abnormal progress by workshop:', error);
    return [];
  }
}


export async function getProductPercentageLantai2(project?: string, trainset?: string): Promise<ProductPercentageLantai2[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    j.id_product, 
    j.trainset, 
    j.product_name, 
    j.jumlah_tiapts, 
    j.proses_produk, 
    j.line,
    COALESCE(pp.status, '-') AS status, 
    COALESCE(pp.percentage, 0) AS percentage, 
    COALESCE(pp.qty_progress, 0) AS qty_progress, 
    COALESCE(pp.total, 0) AS total,
    COALESCE(pp.project_name, j.project) AS project,
    j.tanggal_mulai,
    pp.start_actual

FROM jadwal j

LEFT JOIN (
  SELECT p.*
  FROM production_progress_protrack p
  JOIN (
    SELECT 
      id_product, 
      trainset, 
      sub_process, 
      MAX(start_actual) AS max_time
    FROM production_progress_protrack
    WHERE line = 'Lantai 2'
    ${project ? sql`AND project_name = ${project}` : sql``}
    ${trainset ? sql`AND trainset = ${trainset}` : sql``}
    GROUP BY id_product, trainset, sub_process
  ) latest
  ON p.id_product = latest.id_product
  AND p.trainset = latest.trainset
  AND p.sub_process = latest.sub_process
  AND p.start_actual = latest.max_time
  WHERE 1 = 1
  ${project ? sql`AND p.project_name = ${project}` : sql``}
  ${trainset ? sql`AND p.trainset = ${trainset}` : sql``}
) pp
ON j.id_product = pp.id_product
AND j.trainset = pp.trainset
AND j.proses_produk = pp.sub_process

WHERE j.line = 'Lantai 2'
${project ? sql`AND j.project = ${project}` : sql``}
${trainset ? sql`AND j.trainset = ${trainset}` : sql``}

ORDER BY j.product_name ASC;
          `);

    const rows = extractRows(result);
    return rows as ProductPercentageLantai2[];
  } catch (error) {
    console.error("Failed to fetch product percentage:", error);
    return [];
  }
}

export async function getProductSummaryLantai2(trainset: string | number, project?: string): Promise<ProductSummaryLantai2[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    j.id_product,
    j.trainset,
    j.product_name,
    j.line,

MAX(CASE 
    WHEN p.sub_process = 'Cutting' 
    THEN p.percentage 
END) AS percentage_cutting,

SUM(CASE 
    WHEN p.sub_process = 'Marking dan Crimping' 
    THEN COALESCE(p.percentage, 0) ELSE 0 
END) AS percentage_marking,

CASE
    -- Jika proses terakhir sudah 100 maka langsung 100
    WHEN MAX(
        CASE 
            WHEN p.sub_process = 'Marking dan Crimping' 
            THEN p.percentage 
        END
    ) = 100
    THEN 100

    -- Selain itu hitung normal rata-rata
    ELSE ROUND((
        COALESCE(MAX(CASE 
            WHEN p.sub_process = 'Cutting' 
            THEN p.percentage 
        END), 0)
        +
        COALESCE(MAX(CASE 
            WHEN p.sub_process = 'Marking dan Crimping' 
            THEN p.percentage 
        END), 0)
    ) / 2)
END AS percentage,

MAX(COALESCE(p.qty_progress, 0)) AS qty_progress,

MAX(j.jumlah_tiapts) AS total,

MIN(j.tanggal_mulai) AS tanggal_mulai,
MAX(j.tanggal_selesai) AS tanggal_selesai,

MIN(p.start_actual) AS start_actual,
MAX(p.start_actual) AS finish_actual

FROM jadwal j

LEFT JOIN (
  SELECT p1.*
  FROM production_progress_protrack p1
  JOIN (
    SELECT 
      id_product, 
      trainset,  
      sub_process, 
      MAX(start_actual) AS max_time
    FROM production_progress_protrack
    WHERE line = 'Lantai 2'
      AND trainset = ${trainset}
      ${project ? sql`AND project_name = ${project}` : sql``}
    GROUP BY id_product, trainset, sub_process
  ) latest
  ON p1.id_product = latest.id_product
  AND p1.trainset = latest.trainset
  AND p1.sub_process = latest.sub_process
  AND p1.start_actual = latest.max_time
  WHERE p1.trainset = ${trainset}
    ${project ? sql`AND p1.project_name = ${project}` : sql``}
) p
ON j.id_product = p.id_product
AND j.trainset = p.trainset    

WHERE j.line = 'Lantai 2'
  AND j.trainset = ${trainset}
  ${project ? sql`AND j.project = ${project}` : sql``}

GROUP BY 
    j.id_product,
    j.trainset,
    j.product_name,
    j.line

ORDER BY j.product_name ASC;
    `);

    const rows = extractRows(result);
    return rows as ProductSummaryLantai2[];
  } catch (error) {
    console.error("Failed to fetch product summary Lantai 2:", error);
    return [];
  }
}

export async function getProductPercentageLantai1(project?: string, trainset?: string): Promise<ProductPercentageLantai1[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    j.id_product, 
    j.trainset, 
    j.product_name, 
    j.jumlah_tiapts, 
    j.proses_produk, 
    j.line,
    COALESCE(pp.status, '-') AS status, 
    COALESCE(pp.percentage, 0) AS percentage, 
    COALESCE(pp.qty_progress, 0) AS qty_progress, 
    COALESCE(pp.total, 0) AS total,
    COALESCE(pp.project_name, j.project) AS project,
    j.tanggal_mulai,
    pp.start_actual
FROM jadwal j
LEFT JOIN (
    SELECT p.*
    FROM production_progress_protrack p
    JOIN (
        SELECT 
            id_product, 
            trainset, 
            process_name, 
            MAX(start_actual) AS max_time
        FROM production_progress_protrack
        WHERE line = 'Lantai 1'
        ${project ? sql`AND project_name = ${project}` : sql``}
        ${trainset ? sql`AND trainset = ${trainset}` : sql``}
        GROUP BY id_product, trainset, process_name
    ) latest
    ON p.id_product = latest.id_product
    AND p.trainset = latest.trainset
    AND p.start_actual = latest.max_time
    WHERE 1 = 1
    ${project ? sql`AND p.project_name = ${project}` : sql``}
    ${trainset ? sql`AND p.trainset = ${trainset}` : sql``}
) pp
ON j.id_product = pp.id_product
AND j.trainset = pp.trainset
WHERE j.line = 'Lantai 1'
${project ? sql`AND j.project = ${project}` : sql``}
${trainset ? sql`AND j.trainset = ${trainset}` : sql``}
ORDER BY j.product_name ASC;
          `);

    const rows = extractRows(result);
    //console.log("Fetched product percentage Lantai 1:", rows);
    return rows as ProductPercentageLantai1[];
  } catch (error) {
    console.error("Failed to fetch product percentage Lantai 1:", error);
    return [];
  }
}

export async function getProductSummaryLantai1(trainset: string | number, project?: string): Promise<ProductSummaryLantai1[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    j.id_product,
    j.trainset,
    j.product_name,
    j.line,

    /* =====================================
       PERSENTASE AKTUAL
       ===================================== */
    CASE
        WHEN MAX(
            CASE 
                WHEN p.sub_output = 'Finish Good'
                     AND p.percentage = 100
                THEN 1
                ELSE 0
            END
        ) = 1
        THEN 100

        ELSE ROUND(
            MAX(COALESCE(p.percentage, 0))
            /
            MAX(COALESCE(mp.jumlah_proses_per_line, 1))
        , 0)
    END AS percentage,

    MAX(COALESCE(p.percentage, 0)) AS actual_percentage,

    MAX(COALESCE(mp.jumlah_proses_per_line, 1)) AS total_proses,

    COUNT(DISTINCT p.sub_output) AS actual_sub_output,

    MAX(COALESCE(p.qty_progress, 0)) AS qty_progress,

    /* =========================
       TOTAL DARI p.total
       ========================= */
    MAX(COALESCE(p.total, 0)) AS total,

    MIN(j.tanggal_mulai) AS tanggal_mulai,
    MAX(j.tanggal_selesai) AS tanggal_selesai,

    MIN(p.start_actual) AS start_actual,
    MAX(p.start_actual) AS finish_actual

FROM jadwal j

/* =========================
   ACTUAL TERAKHIR
   ========================= */
LEFT JOIN (
    SELECT p1.*
    FROM production_progress_protrack p1

    JOIN (
        SELECT 
            id_product, 
            trainset,
            sub_output,
            MAX(start_actual) AS max_time

        FROM production_progress_protrack

        WHERE line = 'Lantai 1'
          AND trainset = ${trainset}
          ${project ? sql`AND project_name = ${project}` : sql``}

        GROUP BY 
            id_product, 
            trainset,
            sub_output

    ) latest
        ON p1.id_product = latest.id_product
        AND p1.trainset = latest.trainset
        AND p1.sub_output = latest.sub_output
        AND p1.start_actual = latest.max_time

    WHERE p1.trainset = ${trainset}
      ${project ? sql`AND p1.project_name = ${project}` : sql``}

) p
    ON j.id_product = p.id_product
    AND j.trainset = p.trainset   

/* =========================
   MASTER PROSES
   ========================= */
LEFT JOIN master_proses_cs mp
    ON j.id_product = mp.id_product
    AND j.line = mp.line

WHERE j.line = 'Lantai 1'
  AND j.trainset = ${trainset}
  ${project ? sql`AND j.project = ${project}` : sql``}

GROUP BY 
    j.id_product,
    j.trainset,
    j.product_name,
    j.line

ORDER BY j.product_name ASC;
    `);

    const rows = extractRows(result);
    return rows as ProductSummaryLantai1[];
  } catch (error) {
    console.error("Failed to fetch product summary Lantai 1:", error);
    return [];
  }
}

export async function getProductSummarySukosari(
  trainset: string | number,
  workshop?: string,
  project?: string
): Promise<ProductSummarySukosari[]> {
  try {
    const result = await db.execute(sql`

SELECT
    j.id_product,
    j.trainset,
    j.product_name,
    j.line,

    CASE
        WHEN MAX(
            CASE
                WHEN pm.id_process = lp.last_process_id
                THEN 1
                ELSE 0
            END
        ) = 1
        THEN 100

        ELSE ROUND(
            MAX(COALESCE(p.percentage,0))
            /
            MAX(COALESCE(mp.jumlah_proses_per_line,1))
        ,0)
    END AS percentage,

    MAX(COALESCE(p.percentage,0)) AS actual_percentage,

    MAX(COALESCE(mp.jumlah_proses_per_line,1)) AS total_proses,

    COUNT(DISTINCT p.sub_output) AS actual_sub_output,

    MAX(COALESCE(p.qty_progress,0)) AS qty_progress,

    MAX(COALESCE(p.total,0)) AS total,

    MIN(j.tanggal_mulai) AS tanggal_mulai,

    MAX(j.tanggal_selesai) AS tanggal_selesai,

    MIN(p.start_actual) AS start_actual,

    MAX(p.start_actual) AS finish_actual

FROM jadwal j

LEFT JOIN (

    SELECT p1.*

    FROM production_progress_protrack p1

    JOIN (

        SELECT
            id_product,
            trainset,
            sub_output,
            sub_process,
            MAX(start_actual) AS max_time

        FROM production_progress_protrack

        WHERE workshop='Sukosari'
          AND trainset=${trainset}
          ${project ? sql`AND project_name = ${project}` : sql``}

        GROUP BY
            id_product,
            trainset,
            sub_output,
            sub_process

    ) latest

        ON p1.id_product = latest.id_product
       AND p1.trainset = latest.trainset
       AND p1.sub_output = latest.sub_output
       AND p1.sub_process = latest.sub_process
       AND p1.start_actual = latest.max_time

    WHERE p1.trainset=${trainset}
      ${project ? sql`AND p1.project_name = ${project}` : sql``}

) p

ON j.id_product = p.id_product
AND j.trainset = p.trainset


/* Mapping progress ke master agar memperoleh id_process yang benar */
LEFT JOIN master_proses_sks pm

ON pm.id_product = p.id_product
AND pm.sub_output = p.sub_output
AND pm.sub_proses = p.sub_process


LEFT JOIN master_proses_sks mp

ON j.id_product = mp.id_product
AND j.line = mp.line


LEFT JOIN (

    SELECT
        id_product,
        MAX(id_process) AS last_process_id

    FROM master_proses_sks

    WHERE sub_proses NOT IN (
        'QC REKA',
        'QC INKA'
    )

    GROUP BY id_product

) lp

ON j.id_product = lp.id_product


WHERE j.workshop='Sukosari'
AND j.trainset=${trainset}
${project ? sql`AND j.project=${project}` : sql``}


GROUP BY
    j.id_product,
    j.trainset,
    j.product_name,
    j.line


ORDER BY
    j.product_name ASC;


    `);

    const rows = extractRows(result);
    return rows as ProductSummarySukosari[];
  } catch (error) {
    console.error("Failed to fetch product summary Sukosari:", error);
    return [];
  }
}

export async function getProductPercentageSukosari(
  workshop?: string,
  project?: string,
  trainset?: string
): Promise<ProductPercentageSukosari[]> {
  try {
    const targetWorkshop = workshop ?? 'Sukosari';
    const result = await db.execute(sql`
SELECT 
    j.id_product,
    j.trainset,
    j.product_name,
    j.jumlah_tiapts,
    j.proses_produk,
    j.line,
    COALESCE(pp.status, '-') AS status,
    COALESCE(pp.percentage, 0) AS percentage,
    COALESCE(pp.qty_progress, 0) AS qty_progress,
    COALESCE(pp.total, 0) AS total,
    COALESCE(pp.project_name, j.project) AS project,
    pp.start_actual,
    j.tanggal_mulai

FROM jadwal j

LEFT JOIN (
    SELECT p.*
    FROM production_progress_protrack p

    JOIN (
        SELECT
            id_product,
            trainset,
            sub_process,
            MAX(start_actual) AS max_time

        FROM production_progress_protrack

        WHERE 1 = 1
        ${workshop ? sql`AND workshop = ${workshop}` : sql``}
        ${project ? sql`AND project_name = ${project}` : sql``}
        ${trainset ? sql`AND trainset = ${trainset}` : sql``}

        GROUP BY
            id_product,
            trainset,
            sub_process

    ) latest
        ON p.id_product = latest.id_product
        AND p.trainset = latest.trainset
        AND p.sub_process = latest.sub_process
        AND p.start_actual = latest.max_time

    WHERE 1 = 1
    ${workshop ? sql`AND p.workshop = ${workshop}` : sql``}
    ${project ? sql`AND p.project_name = ${project}` : sql``}
    ${trainset ? sql`AND p.trainset = ${trainset}` : sql``}

) pp
    ON j.id_product = pp.id_product
    AND j.trainset = pp.trainset
    AND j.proses_produk = pp.sub_process

WHERE j.workshop = ${targetWorkshop}
${project ? sql`AND j.project = ${project}` : sql``}
${trainset ? sql`AND j.trainset = ${trainset}` : sql``}

ORDER BY j.product_name ASC;
    `);

    const rows = extractRows(result);
    console.log("Fetched product percentage Sukosari:", rows);
    return rows as ProductPercentageSukosari[];
  } catch (error) {
    console.error("Failed to fetch product percentage Sukosari:", error);
    return [];
  }
}


export async function getProductSummaryTiron(
  trainset: string | number,
  workshop?: string,
  project?: string
): Promise<ProductSummaryTiron[]> {
  try {
    const result = await db.execute(sql`

WITH latest_progress AS (
    SELECT p1.*
    FROM production_progress_protrack p1
    JOIN (
        SELECT
            id_product,
            trainset,
            sub_output,
            sub_process,
            MAX(start_actual) AS max_time
        FROM production_progress_protrack
        WHERE workshop='Tiron'
          AND trainset=${trainset}
          ${project ? sql`AND project_name=${project}` : sql``}
        GROUP BY id_product,trainset,sub_output,sub_process
    ) l
      ON p1.id_product=l.id_product
     AND p1.trainset=l.trainset
     AND p1.sub_output=l.sub_output
     AND p1.sub_process=l.sub_process
     AND p1.start_actual=l.max_time
),
product_name_per_product AS (
    SELECT
        id_product,
        trainset,
        MAX(product_name) AS product_name
    FROM production_progress_protrack
    WHERE workshop='Tiron'
      AND trainset=${trainset}
      ${project ? sql`AND project_name=${project}` : sql``}
    GROUP BY id_product,trainset
),
last_process AS (
    SELECT id_product,MAX(id_process) AS last_process_id
    FROM master_proses_sks
    WHERE sub_proses NOT IN ('QC REKA','QC INKA')
    GROUP BY id_product
),
base AS (
    SELECT DISTINCT id_product,trainset
    FROM jadwal
    WHERE workshop='Tiron'
      AND trainset=${trainset}
      ${project ? sql`AND project=${project}` : sql``}
    UNION
    SELECT DISTINCT id_product,trainset
    FROM latest_progress
    WHERE trainset=${trainset}
)
SELECT
    b.id_product,
    b.trainset,
    COALESCE(MAX(j.product_name),pn.product_name) AS product_name,
    MAX(j.line) AS line,
    CASE
      WHEN MAX(CASE WHEN pm.id_process=lp.last_process_id THEN 1 ELSE 0 END)=1
      THEN 100
      ELSE ROUND(MAX(COALESCE(p.percentage,0))/MAX(COALESCE(mp.jumlah_proses_per_line,1)),0)
    END AS percentage,
    MAX(COALESCE(p.percentage,0)) AS actual_percentage,
    MAX(COALESCE(mp.jumlah_proses_per_line,1)) AS total_proses,
    COUNT(DISTINCT p.sub_output) AS actual_sub_output,
    MAX(COALESCE(p.qty_progress,0)) AS qty_progress,
    MAX(COALESCE(p.total,0)) AS total,
    MIN(j.tanggal_mulai) AS tanggal_mulai,
    MAX(j.tanggal_selesai) AS tanggal_selesai,
    MIN(p.start_actual) AS start_actual,
    MAX(p.start_actual) AS finish_actual
FROM base b
LEFT JOIN jadwal j
 ON b.id_product=j.id_product
AND b.trainset=j.trainset
AND j.workshop='Tiron'
LEFT JOIN latest_progress p
 ON b.id_product=p.id_product
AND b.trainset=p.trainset
LEFT JOIN product_name_per_product pn
 ON pn.id_product=b.id_product
AND pn.trainset=b.trainset
LEFT JOIN master_proses_sks pm
 ON pm.id_product=p.id_product
AND pm.sub_output=p.sub_output
AND pm.sub_proses=p.sub_process
LEFT JOIN master_proses_sks mp
 ON mp.id_product=b.id_product
AND (j.line IS NULL OR mp.line=j.line)
LEFT JOIN last_process lp
 ON lp.id_product=b.id_product
GROUP BY
 b.id_product,b.trainset,pn.product_name
ORDER BY
 COALESCE(MAX(j.product_name),pn.product_name,b.id_product),
 b.id_product;
    `);

    const rows = extractRows(result);
    return rows as ProductSummaryTiron[];
  } catch (error) {
    console.error("Failed to fetch product summary Tiron:", error);
    return [];
  }
}

export async function getProductPercentageTiron(
  workshop?: string,
  project?: string,
  trainset?: string
): Promise<ProductPercentageTiron[]> {
  try {
    const result = await db.execute(sql`

WITH latest_progress AS (
SELECT p.*
FROM production_progress_protrack p
INNER JOIN (
SELECT id_product,trainset,process_name,MAX(start_actual) max_time
FROM production_progress_protrack
WHERE 1=1
${workshop ? sql`AND workshop = ${workshop}` : sql``}
${project ? sql`AND project_name = ${project}` : sql``}
${trainset ? sql`AND trainset = ${trainset}` : sql``}
GROUP BY id_product,trainset,process_name
) latest
ON latest.id_product=p.id_product
AND latest.trainset=p.trainset
AND latest.process_name=p.process_name
AND latest.max_time=p.start_actual
WHERE 1=1
${workshop ? sql`AND p.workshop = ${workshop}` : sql``}
${project ? sql`AND p.project_name = ${project}` : sql``}
${trainset ? sql`AND p.trainset = ${trainset}` : sql``}
)
SELECT j.id_product,j.trainset,j.product_name,j.jumlah_tiapts,j.proses_produk,j.line,
COALESCE(lp.status,'-') status,COALESCE(lp.percentage,0) percentage,
COALESCE(lp.qty_progress,0) qty_progress,COALESCE(lp.total,0) total,
COALESCE(lp.project_name,j.project) project,lp.start_actual,j.tanggal_mulai
FROM jadwal j
LEFT JOIN latest_progress lp
ON lp.id_product=j.id_product
AND lp.trainset=j.trainset
AND lp.process_name=j.proses_produk
WHERE j.workshop='Tiron'
${project ? sql`AND j.project=${project}` : sql``}
${trainset ? sql`AND j.trainset=${trainset}` : sql``}
UNION ALL
SELECT lp.id_product,lp.trainset,lp.product_name,NULL,lp.process_name,NULL,
lp.status,lp.percentage,lp.qty_progress,lp.total,lp.project_name,
lp.start_actual,NULL
FROM latest_progress lp
LEFT JOIN jadwal j
ON j.id_product=lp.id_product
AND j.trainset=lp.trainset
AND j.proses_produk=lp.process_name
AND j.workshop='Tiron'
WHERE j.id_product IS NULL
ORDER BY product_name,id_product,trainset,start_actual;

    `);

    const rows = extractRows(result);
    console.log("Fetched product percentage Tiron:", rows);
    return rows as ProductPercentageTiron[];
  } catch (error) {
    console.error("Failed to fetch product percentage Tiron:", error);
    return [];
  }
}

export async function getDistinctProjectNamesFromProductionProgressProtrack(
  line?: string | null,
  workshop?: string
): Promise<string[]> {
  try {
    // Build dynamic query with optional filters for `line` and `workshop`.
    let query: any = sql`
      SELECT DISTINCT project_name
      FROM production_progress_protrack
      WHERE 1 = 1
    `;

    if (line === null) {
      query = sql`${query} AND line IS NULL`;
    } else if (line) {
      query = sql`${query} AND line = ${line}`;
    }

    if (workshop) {
      query = sql`${query} AND workshop = ${workshop}`;
    }

    query = sql`${query} ORDER BY project_name ASC;`;

    const result = await db.execute(query);
    const rows = extractRows(result) as Array<{ project_name: string }>;
    return rows
      .map((row) => String(row.project_name ?? '').trim())
      .filter((value) => value.length > 0);
  } catch (error) {
    console.error('Failed to fetch distinct project names:', error);
    return [];
  }
}

// Get the latest trainset value (most recent start_actual) for a given project from production_progress_protrack
export async function getLatestTrainsetFromProductionProgressProtrack(
  projectName?: string,
  line?: string | null,
  workshop?: string
): Promise<string | null> {
  try {
    let base = sql`
      SELECT trainset, start_actual
      FROM production_progress_protrack
      WHERE 1 = 1
    `;

    if (projectName) {
      base = sql`${base} AND project_name = ${projectName}`;
    }

    if (line === null) {
      base = sql`${base} AND line IS NULL`;
    } else if (line) {
      base = sql`${base} AND line = ${line}`;
    }

    if (workshop) {
      base = sql`${base} AND workshop = ${workshop}`;
    }

    base = sql`${base} ORDER BY start_actual DESC LIMIT 1`;

    const result = await db.execute(base);
    const rows = extractRows(result) as Array<{ trainset?: string | number; start_actual?: Date | string }>; 
    if (rows && rows.length > 0) {
      return rows[0].trainset != null ? String(rows[0].trainset) : null;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch latest trainset from protrack:', error);
    return null;
  }
}

// Get history for a product (production_progress_protrack) filtered by id_product and trainset
export async function getProductProgressProtrackHistory(
  id_product: string,
  trainset: string | number,
  line: 'Lantai 1' | 'Lantai 2' | null = null,
  workshop?: string
): Promise<any[]> {
  try {
    const result = await db.execute(sql`
SELECT
    p.operator_actual_name,
    p.process_name,
    p.sub_process,
    p.sub_output,
    p.start_actual,
    p.status,
    p.percentage,
    p.qty_progress,
    p.total,
    p.note_qc,
    p.id_perproduct

FROM (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY 
                id_product,
                trainset,
                operator_actual_name,
                process_name,
                sub_process,
                start_actual
            ORDER BY id_process DESC
        ) AS rn

    FROM production_progress_protrack
    WHERE id_product = ${id_product}
      AND trainset = ${trainset}
      ${line ? sql`AND line = ${line}` : sql``}
) p

WHERE p.rn = 1

ORDER BY p.start_actual DESC;
    `);

    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error('Failed to fetch protrack history:', error);
    return [];
  }
}
 
export async function getProductProgressProtrackHistoryLantai2(
  id_product: string,
  trainset: string | number,
): Promise<any[]> {
  try {
    const result = await db.execute(sql`
SELECT
    p.operator_actual_name,
    p.process_name,
    p.sub_process,
    p.sub_output,
    p.start_actual,
    p.status,
    p.percentage,
    p.qty_progress,
    p.total,
    p.note_qc

FROM (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY 
                id_product,
                trainset,
                operator_actual_name,
                process_name,
                sub_process,
                start_actual
            ORDER BY id_process DESC
        ) AS rn

    FROM production_progress_protrack

    WHERE id_product = ${id_product}
      AND trainset = ${trainset}
      AND line = 'Lantai 2'
) p

WHERE p.rn = 1

ORDER BY p.start_actual DESC;
    `);

    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error('Failed to fetch protrack history:', error);
    return [];
  }
}


// Get sub process yang belum diinput berdasarkan master_proses_cs
export async function getMissingSubProcessLantai1(
  id_product: string,
  trainset: string | number,
  workshop?: string
): Promise<any[]> {
  try {
    const result = await db.execute(sql`
SELECT DISTINCT
    mp.proses,
    mp.sub_proses,
    mp.sub_output,
    mp.qty_total
FROM master_proses_cs mp

LEFT JOIN (
    SELECT DISTINCT
        id_product,
        process_name,
        sub_process,
        sub_output
    FROM production_progress_protrack
    WHERE trainset = ${trainset}
      AND line = 'Lantai 1'
      ${workshop ? sql`AND workshop = ${workshop}` : sql`AND workshop = 'Candisewu'`}
) p
    ON mp.id_product = p.id_product
    AND mp.proses = p.process_name
    AND mp.sub_proses = p.sub_process
    AND mp.sub_output = p.sub_output

WHERE mp.id_product = ${id_product}
  AND mp.line = 'Lantai 1'
  AND p.sub_process IS NULL
  AND mp.sub_proses NOT IN (
      'SPS',
      'QC REKA',
      'Pembuatan Name plate dan Marking'
  )

ORDER BY
    mp.proses,
    mp.sub_proses,
    mp.sub_output;
    `);

    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error('Failed to fetch missing sub process:', error);
    return [];
  }
}


export async function getMissingSubProcessLantai2(
  id_product: string,
  trainset: string | number,
  workshop?: string
): Promise<any[]> {
  try {
    const result = await db.execute(sql`
SELECT
    mp.product_name,
    mp.line,
    mp.sub_output,
    mp.proses,
    mp.sub_proses,

    mp.qty_total

FROM master_proses_cs mp

/* =====================================
   CEK APAKAH SUB PROSES SUDAH ADA
   DI ACTUAL
   ===================================== */
LEFT JOIN (
    SELECT DISTINCT
        id_product,
        trainset,
        process_name,
        sub_process,
        sub_output

    FROM production_progress_protrack

    WHERE trainset = ${trainset}
      AND line = 'Lantai 2'
      ${workshop ? sql`AND workshop = ${workshop}` : sql`AND workshop = 'Candisewu'`}

) p
    ON mp.id_product = p.id_product
    AND mp.proses = p.process_name
    AND mp.sub_proses = p.sub_process
    AND mp.sub_output = p.sub_output

/* =====================================
   HANYA TAMPILKAN YANG BELUM ADA
   ===================================== */
WHERE mp.id_product = ${id_product}
  AND mp.line = 'Lantai 2'
  AND p.sub_process IS NULL

  /* =====================================
     EXCLUDE SUB PROSES TERTENTU
     ===================================== */
  AND mp.sub_proses NOT IN (
      'SPS',
      'QC REKA',
      'Pembuatan Name plate dan Marking'
  )

ORDER BY 
    mp.proses ASC,
    mp.sub_proses ASC;
    `);

    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error('Failed to fetch missing sub process:', error);
    return [];
  }
}

export async function getMissingSubProcessSukosari(
  id_product: string,
  trainset: string | number,
  workshop?: string
): Promise<any[]> {
  try {
    const result = await db.execute(sql`
SELECT
    mp.product_name,
    mp.line,
    mp.sub_output,
    mp.proses,
    mp.sub_proses,
    mp.qty_total

FROM (

    SELECT *
    FROM (

        SELECT
            m.*,
            ROW_NUMBER() OVER (
                PARTITION BY m.id_process
                ORDER BY m.id_process
            ) AS rn

        FROM master_proses_sks m

    ) x

    WHERE x.rn = 1

) mp

/* =====================================
   CEK APAKAH SUB PROSES SUDAH ADA
   DI ACTUAL
   ===================================== */
LEFT JOIN (
    SELECT DISTINCT
        id_product,
        trainset,
        process_name,
        sub_process,
        sub_output

    FROM production_progress_protrack

    WHERE trainset = ${trainset}
      ${workshop ? sql`AND workshop = ${workshop}` : sql``}

) p
    ON mp.id_product = p.id_product
    AND mp.proses = p.process_name
    AND mp.sub_proses = p.sub_process
    AND mp.sub_output = p.sub_output

/* =====================================
   HANYA TAMPILKAN YANG BELUM ADA
   ===================================== */
WHERE mp.id_product = ${id_product}
  AND p.sub_process IS NULL

  /* =====================================
     EXCLUDE SUB PROSES TERTENTU
     ===================================== */
  AND mp.sub_proses NOT IN (
      'SPS',
      'QC REKA',
      'QC INKA',
      'Pembuatan Name plate dan Marking'
  )

ORDER BY
    mp.id_process ASC;
    `);

    const rows = extractRows(result);
    return rows;
  } catch (error) {
    console.error('Failed to fetch missing sub process:', error);
    return [];
  }
}
