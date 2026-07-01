import { db } from "@/lib/db";
import { sql, type SQL } from "drizzle-orm";

export interface MasterProject {
  id: number;
  no_po: string | null;
  project_name: string | null;
  client_name: string | null;
  klasifikasi: 'Manufacture' | 'Trading' | 'Jasa' | null;
  qty: number | null;
  satuan: string | null;
  batch: number | null;
  start_date: string | null;
  delivery_date: string | null;
  status: 'Optimis Memenuhi' | 'Potensi Telat' | 'Close' | 'Terlambat' | 'Pengajuan ADD' | 'Proses PO Customer' | null;
  is_active: '1' | '0' | null;
  jumlah_selesai: number;
  percentage_selesai: number;
}

export interface ProductbyProject {
  id: number;
  project_name: string | null;
  id_product: number | null;
  product_name: string | null;
  trainset: number | null;
  sub_output: string | null;
  jumlah_tiapts: number | null;
  line: string | null;
  jumlah_selesai: number;
  progress_actual: number;
}

export async function getAllMasterProjects(): Promise<MasterProject[]> {
  try {
    const result = await db.execute(sql`
SELECT
    mp.id,
    mp.no_po,
    mp.project_name,
    mp.client_name,
    mp.klasifikasi,

    SUM(d.jumlah_tiapts) AS qty,

    mp.satuan,
    mp.batch,
    mp.start_date,
    mp.delivery_date,
    mp.status,
    mp.is_active,

    SUM(d.jumlah_selesai) AS jumlah_selesai,

    ROUND(
        SUM(d.jumlah_selesai) * 100
        / NULLIF(SUM(d.jumlah_tiapts), 0)
    ) AS percentage_selesai

FROM master_project mp

LEFT JOIN (

    SELECT
        j.project,
        j.trainset,
        j.id_product,
        j.jumlah_tiapts,

        CASE
            WHEN j.line = 'Lantai 3' THEN
                COALESCE(pp_l3.jumlah_selesai, 0)

            WHEN j.line IN ('Lantai 1', 'Lantai 2') THEN
                COALESCE(pp_pt.jumlah_selesai, 0)

            ELSE 0
        END AS jumlah_selesai

    FROM (

        SELECT
            id_product,
            trainset,
            project,
            MAX(jumlah_tiapts) AS jumlah_tiapts,
            MAX(line) AS line,
            MAX(sub_output) AS sub_output
        FROM jadwal
        WHERE sub_output = 'Finish Good'
        GROUP BY
            id_product,
            trainset,
            project

    ) j

    LEFT JOIN (
        SELECT
            id_product,
            trainset,
            COUNT(DISTINCT id_perproduct) AS jumlah_selesai
        FROM production_progress
        WHERE status = 'Tunggu QC'
        GROUP BY
            id_product,
            trainset
    ) pp_l3
        ON j.id_product = pp_l3.id_product
       AND j.trainset = pp_l3.trainset

    LEFT JOIN (
        SELECT
            id_product,
            trainset,
            sub_output,
            MAX(total) AS jumlah_selesai
        FROM production_progress_protrack
        WHERE sub_output = 'Finish Good'
        GROUP BY
            id_product,
            trainset,
            sub_output
    ) pp_pt
        ON j.id_product = pp_pt.id_product
       AND j.trainset = pp_pt.trainset
       AND j.sub_output = pp_pt.sub_output

) d
    ON mp.project_name = d.project
   AND mp.batch = d.trainset

GROUP BY
    mp.id,
    mp.no_po,
    mp.project_name,
    mp.client_name,
    mp.klasifikasi,
    mp.satuan,
    mp.batch,
    mp.start_date,
    mp.delivery_date,
    mp.status,
    mp.is_active

ORDER BY mp.id DESC;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as MasterProject[];
  } catch (error) {
    console.error('Gagal mengambil data master project:', error);
    return [];
  }
}

export async function getMasterProjectById(id: number): Promise<MasterProject | null> {
  try {
    const result = await db.execute(sql`
      SELECT 
        id,
        no_po,
        project_name,
        client_name,
        klasifikasi,
        qty,
        satuan,
        batch,
        start_date,
        delivery_date,
        status,
        is_active
      FROM master_project
      WHERE id = ${id}
      LIMIT 1
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return (rows as MasterProject[])[0] || null;
  } catch (error) {
    console.error('Gagal mengambil data master project:', error);
    return null;
  }
}

export async function getMasterProjectsByStatus(status: string): Promise<MasterProject[]> {
  try {
    const result = await db.execute(sql`
SELECT
    mp.id,
    mp.no_po,
    mp.project_name,
    mp.client_name,
    mp.klasifikasi,

    SUM(d.jumlah_tiapts) AS qty,

    mp.satuan,
    mp.batch,
    mp.start_date,
    mp.delivery_date,
    mp.status,
    mp.is_active,

    SUM(d.jumlah_selesai) AS jumlah_selesai,

    ROUND(
        SUM(d.jumlah_selesai) * 100
        / NULLIF(SUM(d.jumlah_tiapts), 0)
    ) AS percentage_selesai

FROM master_project mp

LEFT JOIN (

    SELECT
        j.project,
        j.trainset,
        j.id_product,
        j.jumlah_tiapts,

        CASE
            WHEN j.line = 'Lantai 3' THEN
                COALESCE(pp_l3.jumlah_selesai, 0)

            WHEN j.line IN ('Lantai 1', 'Lantai 2') THEN
                COALESCE(pp_pt.jumlah_selesai, 0)

            ELSE 0
        END AS jumlah_selesai

    FROM (
        SELECT
            id_product,
            trainset,
            project,
            MAX(jumlah_tiapts) AS jumlah_tiapts,
            MAX(line) AS line,
            MAX(sub_output) AS sub_output
        FROM jadwal
        WHERE sub_output = 'Finish Good'
        GROUP BY
            id_product,
            trainset,
            project
    ) j

    LEFT JOIN (
        SELECT
            id_product,
            trainset,
            COUNT(DISTINCT id_perproduct) AS jumlah_selesai
        FROM production_progress
        WHERE status = 'Tunggu QC'
        GROUP BY
            id_product,
            trainset
    ) pp_l3
        ON j.id_product = pp_l3.id_product
       AND j.trainset = pp_l3.trainset

    LEFT JOIN (
        SELECT
            id_product,
            trainset,
            sub_output,
            MAX(total) AS jumlah_selesai
        FROM production_progress_protrack
        WHERE sub_output = 'Finish Good'
        GROUP BY
            id_product,
            trainset,
            sub_output
    ) pp_pt
        ON j.id_product = pp_pt.id_product
       AND j.trainset = pp_pt.trainset
       AND j.sub_output = pp_pt.sub_output

) d
    ON mp.project_name = d.project
   AND mp.batch = d.trainset

WHERE mp.status = ${status}
  AND mp.is_active = '1'

GROUP BY
    mp.id,
    mp.no_po,
    mp.project_name,
    mp.client_name,
    mp.klasifikasi,
    mp.satuan,
    mp.batch,
    mp.start_date,
    mp.delivery_date,
    mp.status,
    mp.is_active

ORDER BY mp.delivery_date ASC;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as MasterProject[];
  } catch (error) {
    console.error('Gagal mengambil data master project berdasarkan status:', error);
    return [];
  }
}

export async function getActiveProjects(): Promise<MasterProject[]> {
  try {
    const result = await db.execute(sql`
SELECT
    mp.id,
    mp.no_po,
    mp.project_name,
    mp.client_name,
    mp.klasifikasi,

    SUM(d.jumlah_tiapts) AS qty,

    mp.satuan,
    mp.batch,
    mp.start_date,
    mp.delivery_date,
    mp.status,
    mp.is_active,

    SUM(d.jumlah_selesai) AS jumlah_selesai,

    ROUND(
        SUM(d.jumlah_selesai) * 100
        / NULLIF(SUM(d.jumlah_tiapts), 0)
    ) AS percentage_selesai

FROM master_project mp

LEFT JOIN (

    SELECT
        j.project,
        j.trainset,
        j.id_product,
        j.jumlah_tiapts,

        CASE
            WHEN j.line = 'Lantai 3' THEN
                COALESCE(pp_l3.jumlah_selesai, 0)

            WHEN j.line IN ('Lantai 1', 'Lantai 2') THEN
                COALESCE(pp_pt.jumlah_selesai, 0)

            ELSE 0
        END AS jumlah_selesai

    FROM (
        SELECT
            id_product,
            trainset,
            project,
            MAX(jumlah_tiapts) AS jumlah_tiapts,
            MAX(line) AS line,
            MAX(sub_output) AS sub_output
        FROM jadwal
        WHERE sub_output = 'Finish Good'
        GROUP BY
            id_product,
            trainset,
            project
    ) j

    LEFT JOIN (
        SELECT
            id_product,
            trainset,
            COUNT(DISTINCT id_perproduct) AS jumlah_selesai
        FROM production_progress
        WHERE status = 'Tunggu QC'
        GROUP BY
            id_product,
            trainset
    ) pp_l3
        ON j.id_product = pp_l3.id_product
       AND j.trainset = pp_l3.trainset

    LEFT JOIN (
        SELECT
            id_product,
            trainset,
            sub_output,
            MAX(total) AS jumlah_selesai
        FROM production_progress_protrack
        WHERE sub_output = 'Finish Good'
        GROUP BY
            id_product,
            trainset,
            sub_output
    ) pp_pt
        ON j.id_product = pp_pt.id_product
       AND j.trainset = pp_pt.trainset
       AND j.sub_output = pp_pt.sub_output

) d
    ON mp.project_name = d.project
   AND mp.batch = d.trainset

WHERE mp.is_active = '1'

GROUP BY
    mp.id,
    mp.no_po,
    mp.project_name,
    mp.client_name,
    mp.klasifikasi,
    mp.satuan,
    mp.batch,
    mp.start_date,
    mp.delivery_date,
    mp.status,
    mp.is_active

ORDER BY mp.start_date DESC;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as MasterProject[];
  } catch (error) {
    console.error('Gagal mengambil data project aktif:', error);
    return [];
  }
}

export interface MasterProjectFilters {
  search?: string;
  project_name?: string;
  client_name?: string;
  klasifikasi?: string;
  status?: string;
  sortBy?: 'project_name' | 'client_name' | 'delivery_date' | 'status' | 'start_date';
  sortDir?: 'asc' | 'desc';
}

function buildProjectOrderBy(sortBy: MasterProjectFilters['sortBy']) {
  switch (sortBy) {
    case 'project_name':
      return sql.raw('project_name');
    case 'client_name':
      return sql.raw('client_name');
    case 'status':
      return sql.raw('`status`');
    case 'start_date':
      return sql.raw('start_date');
    case 'delivery_date':
    default:
      return sql.raw('delivery_date');
  }
}

function buildProjectSortDir(sortDir: MasterProjectFilters['sortDir']) {
  return sortDir === 'desc' ? sql.raw('DESC') : sql.raw('ASC');
}

export async function getMasterProjectsWithFilters(
  filters: MasterProjectFilters
): Promise<MasterProject[]> {
  try {
    const whereClauses: SQL[] = [];

    const search = (filters.search ?? '').trim();
    const projectName = (filters.project_name ?? '').trim();
    const clientName = (filters.client_name ?? '').trim();
    const klasifikasi = (filters.klasifikasi ?? '').trim();
    const status = (filters.status ?? '').trim();

    if (search) {
      const keyword = `%${search}%`;
      whereClauses.push(sql`
        (
          project_name LIKE ${keyword}
          OR client_name LIKE ${keyword}
          OR no_po LIKE ${keyword}
        )
      `);
    }

    if (projectName) {
      whereClauses.push(sql`project_name LIKE ${`%${projectName}%`}`);
    }

    if (clientName) {
      whereClauses.push(sql`client_name LIKE ${`%${clientName}%`}`);
    }

    if (klasifikasi) {
      whereClauses.push(sql`klasifikasi = ${klasifikasi}`);
    }

    if (status) {
      whereClauses.push(sql`status = ${status}`);
    }

    const whereSql =
      whereClauses.length > 0
        ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
        : sql``;

    const orderBySql = buildProjectOrderBy(filters.sortBy);
    const orderDirSql = buildProjectSortDir(filters.sortDir);

    const result = await db.execute(sql`
SELECT
    mp.id,
    mp.no_po,
    mp.project_name,
    mp.client_name,
    mp.klasifikasi,

    SUM(d.jumlah_tiapts) AS qty,

    mp.satuan,
    mp.batch,
    mp.start_date,
    mp.delivery_date,
    mp.status,
    mp.is_active,

    SUM(d.jumlah_selesai) AS jumlah_selesai,

    ROUND(
        SUM(d.jumlah_selesai) * 100
        / NULLIF(SUM(d.jumlah_tiapts), 0)
    ) AS percentage_selesai

FROM master_project mp

LEFT JOIN (

    SELECT
        j.project,
        j.trainset,
        j.id_product,
        j.jumlah_tiapts,

        CASE
            WHEN j.line = 'Lantai 3' THEN
                COALESCE(pp_l3.jumlah_selesai, 0)

            WHEN j.line IN ('Lantai 1', 'Lantai 2') THEN
                COALESCE(pp_pt.jumlah_selesai, 0)

            ELSE 0
        END AS jumlah_selesai

    FROM (
        SELECT
            id_product,
            trainset,
            project,
            MAX(jumlah_tiapts) AS jumlah_tiapts,
            MAX(line) AS line,
            MAX(sub_output) AS sub_output
        FROM jadwal
        WHERE sub_output = 'Finish Good'
        GROUP BY
            id_product,
            trainset,
            project
    ) j

    LEFT JOIN (
        SELECT
            id_product,
            trainset,
            COUNT(DISTINCT id_perproduct) AS jumlah_selesai
        FROM production_progress
        WHERE status = 'Tunggu QC'
        GROUP BY
            id_product,
            trainset
    ) pp_l3
        ON j.id_product = pp_l3.id_product
       AND j.trainset = pp_l3.trainset

    LEFT JOIN (
        SELECT
            id_product,
            trainset,
            sub_output,
            MAX(total) AS jumlah_selesai
        FROM production_progress_protrack
        WHERE sub_output = 'Finish Good'
        GROUP BY
            id_product,
            trainset,
            sub_output
    ) pp_pt
        ON j.id_product = pp_pt.id_product
       AND j.trainset = pp_pt.trainset
       AND j.sub_output = pp_pt.sub_output

) d
    ON mp.project_name = d.project
   AND mp.batch = d.trainset

${whereSql}

GROUP BY
    mp.id,
    mp.no_po,
    mp.project_name,
    mp.client_name,
    mp.klasifikasi,
    mp.satuan,
    mp.batch,
    mp.start_date,
    mp.delivery_date,
    mp.status,
    mp.is_active

ORDER BY ${orderBySql} ${orderDirSql}, mp.id DESC;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as MasterProject[];
  } catch (error) {
    console.error('Gagal mengambil data master project dengan filter:', error);
    return [];
  }
}

export async function getMasterProjectFilterOptions() {
  try {
    const [projectNameResult, clientNameResult, klasifikasiResult, statusResult] = await Promise.all([
      db.execute(sql`
        SELECT DISTINCT project_name AS project_name
        FROM master_project
        WHERE project_name IS NOT NULL AND project_name <> ''
        ORDER BY project_name ASC
      `),
      db.execute(sql`
        SELECT DISTINCT client_name AS client_name
        FROM master_project
        WHERE client_name IS NOT NULL AND client_name <> ''
        ORDER BY client_name ASC
      `),
      db.execute(sql`
        SELECT DISTINCT klasifikasi AS klasifikasi
        FROM master_project
        WHERE klasifikasi IS NOT NULL
        ORDER BY klasifikasi ASC
      `),
      db.execute(sql`
        SELECT DISTINCT status AS status
        FROM master_project
        WHERE status IS NOT NULL
        ORDER BY status ASC
      `),
    ]);

    const projectNameRows = Array.isArray(projectNameResult[0])
      ? projectNameResult[0]
      : projectNameResult;
    const clientNameRows = Array.isArray(clientNameResult[0])
      ? clientNameResult[0]
      : clientNameResult;
    const klasifikasiRows = Array.isArray(klasifikasiResult[0])
      ? klasifikasiResult[0]
      : klasifikasiResult;
    const statusRows = Array.isArray(statusResult[0]) ? statusResult[0] : statusResult;

    const projectNameOptions = (projectNameRows as Array<Record<string, unknown>>)
      .map((row) => {
        const value = row.project_name ?? row.PROJECT_NAME;
        return typeof value === 'string' ? value.trim() : '';
      })
      .filter(Boolean);

    const clientNameOptions = (clientNameRows as Array<Record<string, unknown>>)
      .map((row) => {
        const value = row.client_name ?? row.CLIENT_NAME;
        return typeof value === 'string' ? value.trim() : '';
      })
      .filter(Boolean);

    const klasifikasiOptions = (klasifikasiRows as Array<Record<string, unknown>>)
      .map((row) => {
        const value = row.klasifikasi ?? row.KLASIFIKASI;
        return typeof value === 'string' ? value.trim() : '';
      })
      .filter(Boolean);

    const statusOptions = (statusRows as Array<Record<string, unknown>>)
      .map((row) => {
        const value = row.status ?? row.STATUS;
        return typeof value === 'string' ? value.trim() : '';
      })
      .filter(Boolean);

    return {
      projectNameOptions: Array.from(new Set(projectNameOptions)),
      clientNameOptions: Array.from(new Set(clientNameOptions)),
      klasifikasiOptions: Array.from(new Set(klasifikasiOptions)),
      statusOptions: Array.from(new Set(statusOptions)),
    };
  } catch (error) {
    console.error('Gagal mengambil opsi filter project:', error);
    return {
      projectNameOptions: [],
      clientNameOptions: [],
      klasifikasiOptions: [],
      statusOptions: [],
    };
  }
}

export async function getProductsbyProjects(project: string, trainset: number): Promise<ProductbyProject[]> {
  try {
    const result = await db.execute(sql`
SELECT
    mp.id,
    mp.project_name,

    j.id_product,
    j.product_name,
    j.trainset,
    j.sub_output,
    j.jumlah_tiapts,
    j.line,

    CASE
        WHEN j.line = 'Lantai 3' THEN
            COALESCE(pp_l3.jumlah_selesai, 0)

        WHEN j.line IN ('Lantai 1', 'Lantai 2') THEN
            COALESCE(pp_pt.jumlah_selesai, 0)

        ELSE 0
    END AS jumlah_selesai,

    CASE
        WHEN j.line = 'Lantai 3' THEN
            FLOOR(
                COALESCE(pp_l3.jumlah_selesai, 0) * 100
                / NULLIF(j.jumlah_tiapts, 0)
            )

        WHEN j.line IN ('Lantai 1', 'Lantai 2') THEN
            COALESCE(pp_pt.max_percentage, 0)

        ELSE 0
    END AS progress_actual

FROM master_project mp

INNER JOIN (
    SELECT
        id_product,
        trainset,
        project,
        MAX(product_name) AS product_name,
        MAX(sub_output) AS sub_output,
        MAX(jumlah_tiapts) AS jumlah_tiapts,
        MAX(line) AS line
    FROM jadwal
    WHERE sub_output = 'Finish Good'
    GROUP BY
        id_product,
        trainset,
        project
) j
    ON mp.batch = j.trainset
   AND mp.project_name = j.project

LEFT JOIN (
    SELECT
        id_product,
        trainset,
        COUNT(DISTINCT id_perproduct) AS jumlah_selesai
    FROM production_progress
    WHERE status = 'Tunggu QC'
    GROUP BY
        id_product,
        trainset
) pp_l3
    ON j.id_product = pp_l3.id_product
   AND j.trainset = pp_l3.trainset

LEFT JOIN (
    SELECT
        id_product,
        trainset,
        sub_output,
        MAX(total) AS jumlah_selesai,
        MAX(percentage) AS max_percentage
    FROM production_progress_protrack
    WHERE sub_output = 'Finish Good'
    GROUP BY
        id_product,
        trainset,
        sub_output
) pp_pt
    ON j.id_product = pp_pt.id_product
   AND j.trainset = pp_pt.trainset
   AND j.sub_output = pp_pt.sub_output

WHERE mp.project_name = ${project}
  AND mp.batch = ${trainset}

ORDER BY
    j.line,
    j.product_name;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProductbyProject[];
  } catch (error) {
    console.error('Gagal mengambil data project aktif:', error);
    return [];
  }
}

