import { db } from '@/lib/db';
import { sql, type SQL } from 'drizzle-orm';

export interface Material {
  no_kpm: string | null;
  serial_number: string | null;
  id_produk: string | null;
    produk: string | null;
  komat: string | null;
  no: number | null;
  deskripsi: string | null;
  spesifikasi: string | null;
  product_name: string | null;
  project: string | null;
  trainset: string | null;
  qty_diminta: number;
  qty_diserahkan: number;
  qty_diterima: number;
  satuan: string | null;
  pic: string | null;
  status: string | null;
  date: string | null;
}

export interface StokMaterial {
  no_kpm: string | null;
}

export interface MonitoringKpmRow {
  no: number | null;
  st: string | null;
  post_date: string | null;
  no_kpm: string | null;
  item: number | null;
  komat: string | null;
  spesifikasi: string | null;
  proyek: string | null;
  typecar: string | null;
  ts: number | null;
  qty: number | null;
  uom: string | null;
  sn: string | null;
  pic: string | null;
  status: string | null;
  tgl_ready: string | null;
  qty_ready: number | null;
  status_komponen: string | null;
}

export type MonitoringKpmSortBy =
  | 'no'
  | 'ts'
  | 'pic'
  | 'status'
  | 'tgl_ready'
  | 'status_komponen';

export type SortDirection = 'asc' | 'desc';

export interface MonitoringKpmFilters {
  st?: string;
  postDate?: string;
  proyek?: string;
  status?: string;
  search?: string;
  sortBy?: MonitoringKpmSortBy;
  sortDir?: SortDirection;
  limit?: number;
  offset?: number;
}

export interface MonitoringKpmFilterOptions {
  stOptions: string[];
  proyekOptions: string[];
}

export interface MaterialOutLineChart {
  tanggal: string | null;
  baris_reservasi: number | null;
  baris_disiapkan: number | null;
  baris_out: number | null;
  jumlah_reservasi: number | null;
  jumlah_disiapkan: number | null;
}

export interface PotensiKekuranganMaterialRow {
  trainset: number | null;
  tanggal_mulai: string | null;
  line: string | null;
  id_product: string | null;
  product_name: string | null;
  komat: string | null;
  deskripsi: string | null;
  spesifikasi: string | null;
  satuan: string | null;
  jumlah_diminta: number | null;
  jumlah_tiapts: number | null;
  kebutuhan_produk: number | null;
  kebutuhan_incremental: number | null;
  stok_warehouse: number | null;
  stok_ppc: number | null;
  total_stok: number | null;
  sisa_stok: number | null;
  jumlah_kekurangan: number | null;
  status_material: 'Potensi Kurang' | 'Aman' | null;
}

export interface ProdukKekuranganMaterialChart {
  tanggal: string | null;
  baris_reservasi: number | null;
  baris_disiapkan: number | null;
  baris_out: number | null;
  jumlah_reservasi: number | null;
  jumlah_disiapkan: number | null;
}

export interface KekuranganMaterialChartRow {
  trainset: number | null;
  product_name: string | null;
  jumlah_material_kurang: number | null;
}



interface RecentNoKPMRow {
  nomor_awal: number | null;
}



export async function getAllMaterials(): Promise<Material[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM material_exported
      ORDER BY komat ASC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as Material[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}


export async function getRecentNoKPM(): Promise<number> {
  try {
    const result = await db.execute(sql`
      SELECT 
        CAST(SUBSTRING_INDEX(no_kpm, '/', 1) AS UNSIGNED) AS nomor_awal
      FROM stok_material
      WHERE no_kpm IS NOT NULL
        AND no_kpm <> ''
      ORDER BY no DESC
      LIMIT 1
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    const latestNo = (rows as RecentNoKPMRow[])[0]?.nomor_awal;
    return Number(latestNo) || 0;
  } catch (error) {
    console.error("Gagal mengambil nomor KPM terbaru:", error);
    return 0;
  }
}

function buildOrderBy(sortBy: MonitoringKpmSortBy | undefined) {
  switch (sortBy) {
    case 'no':
      return sql.raw('no');
    case 'pic':
      return sql.raw('pic');
    case 'status':
      return sql.raw('status');
    case 'tgl_ready':
      return sql.raw('tgl_ready');
    case 'status_komponen':
      return sql.raw('status_komponen');
    case 'ts':
    default:
      return sql.raw('no');
  }
}

function buildSortDir(sortDir: SortDirection | undefined) {
  return sortDir === 'asc' ? sql.raw('ASC') : sql.raw('DESC');
}

export async function getMonitoringKpmRows(
  filters: MonitoringKpmFilters
): Promise<MonitoringKpmRow[]> {
  try {
    const whereClauses: SQL[] = [];

    const st = (filters.st ?? '').trim();
    const postDate = (filters.postDate ?? '').trim();
    const proyek = (filters.proyek ?? '').trim();
    const status = (filters.status ?? '').trim();
    const search = (filters.search ?? '').trim();

    if (st) {
      whereClauses.push(sql`st = ${st}`);
    }

    if (postDate) {
      whereClauses.push(sql`DATE(post_date) = ${postDate}`);
    }

    if (proyek) {
      whereClauses.push(sql`proyek = ${proyek}`);
    }

    if (status) {
      whereClauses.push(sql`status = ${status}`);
    }

    if (search) {
      const keyword = `%${search}%`;
      whereClauses.push(sql`
        (
          no_kpm LIKE ${keyword}
          OR CAST(item AS CHAR) LIKE ${keyword}
          OR komat LIKE ${keyword}
          OR spesifikasi LIKE ${keyword}
        )
      `);
    }

    const whereSql =
      whereClauses.length > 0
        ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
        : sql``;

    const sortBy = buildOrderBy(filters.sortBy);
    const sortDir = buildSortDir(filters.sortDir);
    const safeLimit = Math.max(1, Math.min(500, Number(filters.limit) || 200));
    const safeOffset = Math.max(0, Number(filters.offset) || 0);

    const result = await db.execute(sql`
      SELECT
        no,
        st,
        post_date,
        no_kpm,
        item,
        komat,
        spesifikasi,
        proyek,
        typecar,
        ts,
        qty,
        uom,
        sn,
        pic,
        status,
        tgl_ready,
        qty_ready,
        status_komponen
      FROM stok_material
      ${whereSql}
      ORDER BY ${sortBy} ${sortDir}, no DESC
      LIMIT ${safeLimit}
      OFFSET ${safeOffset}
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as MonitoringKpmRow[];
  } catch (error) {
    console.error('Gagal mengambil data monitoring KPM:', error);
    return [];
  }
}

export async function getMonitoringKpmFilterOptions(): Promise<MonitoringKpmFilterOptions> {
  try {
    const [stResult, proyekResult] = await Promise.all([
      db.execute(sql`
        SELECT DISTINCT st
        FROM stok_material
        WHERE st IS NOT NULL AND st <> ''
        ORDER BY st ASC
      `),
      db.execute(sql`
        SELECT DISTINCT proyek
        FROM stok_material
        WHERE proyek IS NOT NULL AND proyek <> ''
        ORDER BY proyek ASC
      `),
    ]);

    const stRows = Array.isArray(stResult[0]) ? stResult[0] : stResult;
    const proyekRows = Array.isArray(proyekResult[0]) ? proyekResult[0] : proyekResult;

    return {
      stOptions: (stRows as Array<{ st: string | null }>)
        .map((row) => row.st)
        .filter((value): value is string => Boolean(value)),
      proyekOptions: (proyekRows as Array<{ proyek: string | null }>)
        .map((row) => row.proyek)
        .filter((value): value is string => Boolean(value)),
    };
  } catch (error) {
    console.error('Gagal mengambil opsi filter monitoring KPM:', error);
    return {
      stOptions: [],
      proyekOptions: [],
    };
  }
}

export interface StokMaterialTimeline {
  no_kpm: string | null;
  post_date: string | null;
  tgl_ready: string | null;
  out_date: string | null;
  pic: string | null;
  pic_reservasi: string | null;
  no_reservasi: string | null;
  qty_ready: number | null;
  status_komponen: string | null;
}

export async function getStokMaterialTimeline(
  no_kpm: string,
): Promise<StokMaterialTimeline[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        no_kpm,
        MAX(post_date) AS post_date,
        MAX(tgl_ready) AS tgl_ready,
        MAX(out_date) AS out_date,
        MAX(pic) AS pic,
        MAX(pic_reservasi) AS pic_reservasi,
        MAX(no_reservasi) AS no_reservasi,
        MAX(qty_ready) AS qty_ready,
        MAX(status_komponen) AS status_komponen
      FROM stok_material
      WHERE no_kpm = ${no_kpm}
      GROUP BY no_kpm
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as StokMaterialTimeline[];
  } catch (error) {
    console.error('Gagal mengambil timeline stok material:', error);
    return [];
  }
}

function isMonthValue(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function getCurrentMonthValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${today.getFullYear()}-${month}`;
}

export async function getMaterialOutLineChart(
  month?: string,
): Promise<MaterialOutLineChart[]> {
  try {
    const selectedMonth = isMonthValue((month ?? '').trim())
      ? (month ?? '').trim()
      : getCurrentMonthValue();

    const result = await db.execute(sql`
      SELECT 
        DATE(post_date) AS tanggal,
        COUNT(*) AS baris_reservasi,
        COUNT(tgl_ready) AS baris_disiapkan,
        COUNT(out_date) AS baris_out,
        SUM(COALESCE(qty, 0)) AS jumlah_reservasi,
        SUM(COALESCE(qty_ready, 0)) AS jumlah_disiapkan
      FROM stok_material
      WHERE post_date IS NOT NULL
        AND DATE_FORMAT(post_date, '%Y-%m') = ${selectedMonth}
      GROUP BY DATE(post_date)
      ORDER BY tanggal ASC;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as MaterialOutLineChart[];
  } catch (error) {
    console.error('Gagal mengambil line chart stok material:', error);
    return [];
  }
}

export const getMateriallineChart = getMaterialOutLineChart;

export async function getAvailableMonths(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT DATE_FORMAT(post_date, '%Y-%m') AS bulan
      FROM stok_material
      WHERE post_date IS NOT NULL
      ORDER BY bulan DESC
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return (rows as Array<{ bulan: string | null }>)
      .filter((row) => row.bulan !== null)
      .map((row) => row.bulan as string);
  } catch (error) {
    console.error('Gagal mengambil daftar bulan tersedia:', error);
    return [];
  }
}

export async function getPotensiKekuranganMaterial(): Promise<PotensiKekuranganMaterialRow[]> {
  try {
    const result = await db.execute(sql`
WITH trainset_awal AS (
    SELECT MAX(trainset) AS ts_awal
    FROM jadwal
    WHERE line = 'Lantai 3'
      AND tanggal_mulai <= CURDATE()
),

latest_stok AS (
    SELECT 
        sm.komat,
        sm.uom AS satuan,
        sm.stok_warehouse,
        sm.stok_ppc,
        sm.post_date,

        ROW_NUMBER() OVER (
            PARTITION BY sm.komat
            ORDER BY sm.post_date DESC, sm.no DESC
        ) AS rn

    FROM stok_material sm
),

base_kebutuhan AS (
    SELECT
        j.trainset,
        j.tanggal_mulai,
        j.line,
        j.id_product,
        j.product_name,

        mm.komat,
        mm.deskripsi,
        mm.spesifikasi,

        mm.jumlah_diminta,
        j.jumlah_tiapts,

        -- kebutuhan tiap product
        (mm.jumlah_diminta * j.jumlah_tiapts) AS kebutuhan_produk

    FROM jadwal j

    INNER JOIN master_material mm
        ON j.id_product = mm.id_produk

    CROSS JOIN trainset_awal ta

    WHERE j.line = 'Lantai 3'
      AND j.trainset >= ta.ts_awal
),

incremental_kebutuhan AS (
    SELECT
        bk.*,

        -- cumulative kebutuhan per komat
        SUM(bk.kebutuhan_produk) OVER (
            PARTITION BY bk.komat
            ORDER BY bk.trainset, bk.id_product
        ) AS kebutuhan_incremental

    FROM base_kebutuhan bk
)

SELECT
    ik.trainset,
    ik.tanggal_mulai,
    ik.line,

    ik.id_product,
    ik.product_name,

    ik.komat,
    ik.deskripsi,
    ik.spesifikasi,

    ls.satuan,

    ik.jumlah_diminta,
    ik.jumlah_tiapts,

    ik.kebutuhan_produk,
    ik.kebutuhan_incremental,

    COALESCE(ls.stok_warehouse, 0) AS stok_warehouse,
    COALESCE(ls.stok_ppc, 0) AS stok_ppc,

    (
        COALESCE(ls.stok_warehouse, 0)
        + COALESCE(ls.stok_ppc, 0)
    ) AS total_stok,

    -- sisa stok berjalan
    (
        (
            COALESCE(ls.stok_warehouse, 0)
            + COALESCE(ls.stok_ppc, 0)
        )
        - ik.kebutuhan_incremental
    ) AS sisa_stok,

    -- jumlah kekurangan
    CASE
        WHEN (
            (
                COALESCE(ls.stok_warehouse, 0)
                + COALESCE(ls.stok_ppc, 0)
            )
            - ik.kebutuhan_incremental
        ) < 0
        THEN ABS(
            (
                COALESCE(ls.stok_warehouse, 0)
                + COALESCE(ls.stok_ppc, 0)
            )
            - ik.kebutuhan_incremental
        )

        ELSE 0
    END AS jumlah_kekurangan,

    CASE
        WHEN (
            (
                COALESCE(ls.stok_warehouse, 0)
                + COALESCE(ls.stok_ppc, 0)
            )
            - ik.kebutuhan_incremental
        ) < 0
        THEN 'Potensi Kurang'

        ELSE 'Aman'
    END AS status_material

FROM incremental_kebutuhan ik

LEFT JOIN latest_stok ls
    ON ik.komat = ls.komat
    AND ls.rn = 1

ORDER BY
    ik.komat,
    ik.trainset,
    ik.id_product;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as PotensiKekuranganMaterialRow[];
  } catch (error) {
    console.error('Gagal mengambil data potensi kekurangan material:', error);
    return [];
  }
}


export async function getProductKekuranganMaterialChart(): Promise<KekuranganMaterialChartRow[]> {
  try {
    const result = await db.execute(sql`
WITH trainset_awal AS (
    SELECT MAX(trainset) AS ts_awal
    FROM jadwal
    WHERE line = 'Lantai 3'
      AND tanggal_mulai <= CURDATE()
),

latest_stok AS (
    SELECT 
        sm.komat,
        sm.stok_warehouse,
        sm.stok_ppc,

        ROW_NUMBER() OVER (
            PARTITION BY sm.komat
            ORDER BY sm.post_date DESC, sm.no DESC
        ) AS rn

    FROM stok_material sm
),

base_kebutuhan AS (
    SELECT
        j.trainset,
        j.id_product,
        j.product_name,

        mm.komat,

        (mm.jumlah_diminta * j.jumlah_tiapts) AS kebutuhan_produk

    FROM jadwal j

    INNER JOIN master_material mm
        ON j.id_product = mm.id_produk

    CROSS JOIN trainset_awal ta

    WHERE j.line = 'Lantai 3'
      AND j.trainset >= ta.ts_awal
),

incremental_kebutuhan AS (
    SELECT
        bk.*,

        SUM(bk.kebutuhan_produk) OVER (
            PARTITION BY bk.komat
            ORDER BY bk.trainset, bk.id_product
        ) AS kebutuhan_incremental

    FROM base_kebutuhan bk
),

final_data AS (
    SELECT
        ik.trainset,
        ik.id_product,
        ik.product_name,
        ik.komat,

        (
            COALESCE(ls.stok_warehouse, 0)
            + COALESCE(ls.stok_ppc, 0)
        ) AS total_stok,

        ik.kebutuhan_incremental,

        (
            (
                COALESCE(ls.stok_warehouse, 0)
                + COALESCE(ls.stok_ppc, 0)
            )
            - ik.kebutuhan_incremental
        ) AS sisa_stok

    FROM incremental_kebutuhan ik

    LEFT JOIN latest_stok ls
        ON ik.komat = ls.komat
        AND ls.rn = 1
)

SELECT
    fd.trainset,
    fd.product_name,

    COUNT(DISTINCT fd.komat) AS jumlah_material_kurang

FROM final_data fd

WHERE fd.sisa_stok < 0

GROUP BY
    fd.trainset,
    fd.product_name

ORDER BY
    fd.trainset,
    jumlah_material_kurang DESC;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as KekuranganMaterialChartRow[];
  } catch (error) {
    console.error('Gagal mengambil timeline stok material:', error);
    return [];
  }
}

export async function getMonitoringKpmCount(filters: MonitoringKpmFilters): Promise<number> {
  try {
    const whereClauses: SQL[] = [];

    const st = (filters.st ?? '').trim();
    const postDate = (filters.postDate ?? '').trim();
    const proyek = (filters.proyek ?? '').trim();
    const status = (filters.status ?? '').trim();
    const search = (filters.search ?? '').trim();

    if (st) {
      whereClauses.push(sql`st = ${st}`);
    }

    if (postDate) {
      whereClauses.push(sql`DATE(post_date) = ${postDate}`);
    }

    if (proyek) {
      whereClauses.push(sql`proyek = ${proyek}`);
    }

    if (status) {
      whereClauses.push(sql`status = ${status}`);
    }

    if (search) {
      const keyword = `%${search}%`;
      whereClauses.push(sql`
        (
          no_kpm LIKE ${keyword}
          OR CAST(item AS CHAR) LIKE ${keyword}
          OR komat LIKE ${keyword}
          OR spesifikasi LIKE ${keyword}
        )
      `);
    }

    const whereSql =
      whereClauses.length > 0
        ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
        : sql``;

    const result = await db.execute(sql`
      SELECT COUNT(*) AS total
      FROM stok_material
      ${whereSql}
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    const total = (rows as Array<{ total: number }>)[0]?.total;
    return Number(total) || 0;
  } catch (error) {
    console.error('Gagal menghitung data monitoring KPM:', error);
    return 0;
  }
}