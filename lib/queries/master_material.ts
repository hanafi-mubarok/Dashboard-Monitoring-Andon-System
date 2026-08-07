import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface Material {
  no: number | null;
  komat: string | null;
  deskripsi: string | null;
  spesifikasi: string | null;
  jumlah_diminta: string;
  satuan: string | null;
  produk: string | null;
  id_produk: string | null;
  stok_warehouse: number | null;
  stok_ppc: number | null;
}

export interface MaterialKurangTabel {
  id_produk: string | null;
  produk: string | null;
  komat: string | null;
  deskripsi: string | null;
  jumlah_diminta: number;
  jumlah_perts: number;
  max_trainset: number;
  trainset_material_terakhir: number;
  sisa_trainset: number;
  kebutuhan_sisa: number;
  qty_dalmat: number;
  qty_gudang: number;
  stok_available: number;
  critical_qty: number;
  critical_value: number;
}

export interface PlottingMaterialTabel {
  no: number | null;
  komat: string | null;
  spesifikasi: string | null;
  produk: string | null;
  project: string | null;
  request_date: string | null;
  po_date: string | null;
  arrival_date: string | null;
  lead_time: number | null;
  status: string | null;
  no_pr: string | null;
  no_po: string | null;
  vendor_name: string | null;
  jumlah_diminta: number;
  jumlah_perts: number;
  max_trainset: number;
  total_kebutuhan: number;
  satuan: string | null;
  qty_material_all_produk: number;
  sisa_trainset: number;
  qty_requested: number;
  qty_ordered: number;
  qty_arrived: number;
  dev_qty_pr_gr: number;
  qty_dalmat: number;
  qty_gudang: number;
  stok_available: number;
  total_material_coverage: number;
  deviasi_qty: number;
  status_komponen: string | null;
}

export async function getAllMaterials(): Promise<Material[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM master_material
      ORDER BY produk ASC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as Material[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}

export async function getDistinctProjects(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT project AS project_code
      FROM master_material
      WHERE project IS NOT NULL
        AND project <> ''
      ORDER BY project ASC
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return (rows as Array<{ project_code: string | null }>)
      .map((row) => row.project_code)
      .filter((value): value is string => Boolean(value));
  } catch (error) {
    console.error("Gagal mengambil daftar project:", error);
    return [];
  }
}

export async function getDistinctProducts(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT produk
      FROM master_material
      WHERE produk IS NOT NULL
        AND produk <> ''
      ORDER BY produk ASC
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return (rows as Array<{ produk: string | null }>)
      .map((row) => row.produk)
      .filter((value): value is string => Boolean(value));
  } catch (error) {
    console.error("Gagal mengambil daftar produk:", error);
    return [];
  }
}

export async function getDistinctProductsByProject(projectCode: string): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT produk
      FROM master_material
      WHERE project = ${projectCode}
        AND produk IS NOT NULL
        AND produk <> ''
      ORDER BY produk ASC
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return (rows as Array<{ produk: string | null }>)
      .map((row) => row.produk)
      .filter((value): value is string => Boolean(value));
  } catch (error) {
    console.error("Gagal mengambil daftar produk berdasarkan project:", error);
    return [];
  }
}

export async function getDistinctSubProducts(): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT keterangan
      FROM master_material
      WHERE keterangan IS NOT NULL
        AND keterangan <> ''
      ORDER BY keterangan ASC
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return (rows as Array<{ keterangan: string | null }>)
      .map((row) => row.keterangan)
      .filter((value): value is string => Boolean(value));
  } catch (error) {
    console.error("Gagal mengambil daftar sub produk:", error);
    return [];
  }
}

export async function getDistinctSubProductsByProject(projectCode: string): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT keterangan
      FROM master_material
      WHERE project = ${projectCode}
        AND keterangan IS NOT NULL
        AND keterangan <> ''
      ORDER BY keterangan ASC
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return (rows as Array<{ keterangan: string | null }>)
      .map((row) => row.keterangan)
      .filter((value): value is string => Boolean(value));
  } catch (error) {
    console.error("Gagal mengambil daftar sub produk berdasarkan project:", error);
    return [];
  }
}

export async function getMaterialByProduct(product: string): Promise<Material[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        mm.*,
        sm.stok_warehouse,
        sm.stok_ppc
      FROM master_material mm
      LEFT JOIN (
        SELECT s1.*
        FROM stok_material s1
        INNER JOIN (
          SELECT komat, MAX(no) as max_no
          FROM stok_material
          GROUP BY komat
        ) s2 
        ON s1.komat = s2.komat 
        AND s1.no = s2.max_no
      ) sm 
      ON mm.komat = sm.komat
      WHERE mm.produk = ${product}
      ORDER BY mm.no ASC
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as Material[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}

export async function getMaterialsByProject(projectCode: string): Promise<Material[]> {
  try {
    const products = await getDistinctProductsByProject(projectCode);
    if (!products.length) return [];

    const materials = await Promise.all(products.map((product) => getMaterialByProduct(product)));
    return materials.flat();
  } catch (error) {
    console.error("Gagal mengambil data material berdasarkan project:", error);
    return [];
  }
}

export async function getMaterialsBySubProduct(subProduct: string): Promise<Material[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        mm.*, 
        sm.stok_warehouse,
        sm.stok_ppc
      FROM master_material mm
      LEFT JOIN (
        SELECT s1.*
        FROM stok_material s1
        INNER JOIN (
          SELECT komat, MAX(no) as max_no
          FROM stok_material
          GROUP BY komat
        ) s2 
        ON s1.komat = s2.komat 
        AND s1.no = s2.max_no
      ) sm 
      ON mm.komat = sm.komat
      WHERE mm.keterangan = ${subProduct}
      ORDER BY mm.no ASC
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as Material[];
  } catch (error) {
    console.error("Gagal mengambil data material berdasarkan sub produk:", error);
    return [];
  }
}

export async function getMaterialsByProductAndSubProduct(product: string, subProduct: string): Promise<Material[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        mm.*, 
        sm.stok_warehouse,
        sm.stok_ppc
      FROM master_material mm
      LEFT JOIN (
        SELECT s1.*
        FROM stok_material s1
        INNER JOIN (
          SELECT komat, MAX(no) as max_no
          FROM stok_material
          GROUP BY komat
        ) s2 
        ON s1.komat = s2.komat 
        AND s1.no = s2.max_no
      ) sm 
      ON mm.komat = sm.komat
      WHERE mm.produk = ${product}
        AND mm.keterangan = ${subProduct}
      ORDER BY mm.no ASC
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as Material[];
  } catch (error) {
    console.error("Gagal mengambil data material berdasarkan produk dan sub produk:", error);
    return [];
  }
}

export async function getMaterialsByProjectAndSubProduct(projectCode: string, subProduct: string): Promise<Material[]> {
  try {
    const result = await db.execute(sql`
      SELECT 
        mm.*, 
        sm.stok_warehouse,
        sm.stok_ppc
      FROM master_material mm
      LEFT JOIN (
        SELECT s1.*
        FROM stok_material s1
        INNER JOIN (
          SELECT komat, MAX(no) as max_no
          FROM stok_material
          GROUP BY komat
        ) s2 
        ON s1.komat = s2.komat 
        AND s1.no = s2.max_no
      ) sm 
      ON mm.komat = sm.komat
      WHERE mm.project = ${projectCode}
        AND mm.keterangan = ${subProduct}
      ORDER BY mm.no ASC
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as Material[];
  } catch (error) {
    console.error("Gagal mengambil data material berdasarkan project dan sub produk:", error);
    return [];
  }
}


export async function getMaterialKurangTabel(): Promise<MaterialKurangTabel[]> {
  try {
    const result = await db.execute(sql`
SELECT
    mm.id_produk,
    mm.produk,

    mm.komat,
    mk.deskripsi,

    mm.jumlah_diminta,
    mm.jumlah_perts,
    mm.max_trainset,


    COALESCE(sm.ts_terakhir,0) AS trainset_material_terakhir,


    (
        mm.max_trainset -
        COALESCE(sm.ts_terakhir,0)
    ) AS sisa_trainset,


    (
        mm.jumlah_diminta *
        mm.jumlah_perts *
        (
            mm.max_trainset -
            COALESCE(sm.ts_terakhir,0)
        )
    ) AS kebutuhan_sisa,


    COALESCE(mk.qty_dalmat,0) AS qty_dalmat,
    COALESCE(mk.qty_gudang,0) AS qty_gudang,


    (
        COALESCE(mk.qty_dalmat,0) +
        COALESCE(mk.qty_gudang,0)
    ) AS stok_available,


    (
        (
            mm.jumlah_diminta *
            mm.jumlah_perts *
            (
                mm.max_trainset -
                COALESCE(sm.ts_terakhir,0)
            )
        )
        -
        (
            COALESCE(mk.qty_dalmat,0) +
            COALESCE(mk.qty_gudang,0)
        )
    ) AS critical_qty,


    (
        (
            (
                mm.jumlah_diminta *
                mm.jumlah_perts *
                (
                    mm.max_trainset -
                    COALESCE(sm.ts_terakhir,0)
                )
            )
            -
            (
                COALESCE(mk.qty_dalmat,0) +
                COALESCE(mk.qty_gudang,0)
            )
        )
        *
        COALESCE(mk.harga_satuan,0)
    ) AS critical_value


FROM
(
    SELECT
        ROW_NUMBER() OVER(
            ORDER BY produk, MIN(no)
        ) AS nomor,

        MIN(no) AS no,
        komat,
        MAX(spesifikasi) AS spesifikasi,
        produk,
        id_produk,
        project,

        SUM(jumlah_diminta) AS jumlah_diminta,

        MAX(jumlah_perts) AS jumlah_perts,
        MAX(max_trainset) AS max_trainset,

        MAX(satuan) AS satuan

    FROM master_material

    GROUP BY
        id_produk,
        komat,
        produk,
        project
) mm


LEFT JOIN master_komat mk
    ON mk.komat = mm.komat


LEFT JOIN
(
    SELECT
        id_product,
        komat,
        MAX(ts) AS ts_terakhir
    FROM stok_material
    WHERE qty_ready IS NOT NULL
    GROUP BY
        id_product,
        komat
) sm
ON sm.id_product = mm.id_produk
AND sm.komat = mm.komat

WHERE
(
    (
        mm.jumlah_diminta *
        mm.jumlah_perts *
        (
            mm.max_trainset -
            COALESCE(sm.ts_terakhir,0)
        )
    )
    -
    (
        COALESCE(mk.qty_dalmat,0) +
        COALESCE(mk.qty_gudang,0)
    )
) > 0


ORDER BY critical_value DESC;
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as MaterialKurangTabel[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}


export async function getPlottingMaterialTabel(): Promise<PlottingMaterialTabel[]> {
  try {
    const result = await db.execute(sql`
SELECT
    mm.no,
    mm.komat,
    mm.spesifikasi,


    mm.produk,
    mm.project,


    /* Informasi material_po terbaru */
    mp.request_date,
    mp.po_date,
    mp.arrival_date,
    mp.lead_time,
    mp.status,
    mp.no_pr,
    mp.no_po,
    mp.vendor_name,
    mm.jumlah_diminta,
    mm.jumlah_perts,
    mm.max_trainset,

    (
        mm.jumlah_diminta *
        mm.jumlah_perts *
        mm.max_trainset
    ) AS total_kebutuhan,

    mm.satuan,
    COALESCE(
    all_produk.qty_material_all_produk,
    0
) AS qty_material_all_produk,
COALESCE(
    progress_material.sisa_trainset_produk,
    mm.max_trainset
) AS sisa_trainset,

    /* Total pengadaan */
    COALESCE(qty.total_qty_requested,0) AS qty_requested,
    COALESCE(qty.total_qty_ordered,0) AS qty_ordered,
    COALESCE(qty.total_qty_arrived,0) AS qty_arrived,
    
    (
    COALESCE(qty.total_qty_requested,0)
    -
    COALESCE(qty.total_qty_arrived,0)
) AS dev_qty_pr_gr,

    mp.satuan,


    /* Stok master */
    COALESCE(mk.qty_dalmat,0) AS qty_dalmat,
    COALESCE(mk.qty_gudang,0) AS qty_gudang,


    (
        COALESCE(mk.qty_dalmat,0)
        +
        COALESCE(mk.qty_gudang,0)
    ) AS stok_available,
    (
    (
        COALESCE(qty.total_qty_requested,0)
        -
        COALESCE(qty.total_qty_arrived,0)
    )
    +
    (
        COALESCE(mk.qty_dalmat,0)
        +
        COALESCE(mk.qty_gudang,0)
    )
) AS total_material_coverage,


(
    (
        (
            COALESCE(qty.total_qty_requested,0)
            -
            COALESCE(qty.total_qty_arrived,0)
        )
        +
        (
            COALESCE(mk.qty_dalmat,0)
            +
            COALESCE(mk.qty_gudang,0)
        )
    )
    -
    COALESCE(all_produk.qty_material_all_produk,0)
) AS deviasi_qty,

CASE

    /* Belum ada stok dan belum ada pengadaan */
    WHEN
        COALESCE(qty.total_qty_requested,0) = 0
        AND
        (
            COALESCE(mk.qty_dalmat,0)
            +
            COALESCE(mk.qty_gudang,0)
        ) = 0

    THEN 'Belum Pengadaan'


    /* Stok existing sudah cukup tanpa pengadaan */
    WHEN
        (
            COALESCE(mk.qty_dalmat,0)
            +
            COALESCE(mk.qty_gudang,0)
        )
        >=
        COALESCE(all_produk.qty_material_all_produk,0)

    THEN 'Stok Cukup'


    /* Kebutuhan terpenuhi tetapi masih ada pengadaan berjalan */
 /* Kebutuhan terpenuhi, masih ada pengadaan, lead time < 30 hari */
WHEN
    (
        (
            COALESCE(qty.total_qty_requested,0)
            -
            COALESCE(qty.total_qty_arrived,0)
        )
        +
        (
            COALESCE(mk.qty_dalmat,0)
            +
            COALESCE(mk.qty_gudang,0)
        )
        -
        COALESCE(all_produk.qty_material_all_produk,0)
    ) >= 0

    AND

    (
        COALESCE(qty.total_qty_requested,0)
        -
        COALESCE(qty.total_qty_arrived,0)
    ) > 0

    AND COALESCE(mp.lead_time,0) < 30

THEN 'Cukup, Tunggu GR'


/* Kebutuhan terpenuhi, tetapi lead time panjang */
WHEN
    (
        (
            COALESCE(qty.total_qty_requested,0)
            -
            COALESCE(qty.total_qty_arrived,0)
        )
        +
        (
            COALESCE(mk.qty_dalmat,0)
            +
            COALESCE(mk.qty_gudang,0)
        )
        -
        COALESCE(all_produk.qty_material_all_produk,0)
    ) >= 0

    AND

    (
        COALESCE(qty.total_qty_requested,0)
        -
        COALESCE(qty.total_qty_arrived,0)
    ) > 0

    AND COALESCE(mp.lead_time,0) >= 30

THEN 'Cukup, Pengadaan Outstanding'

    /* Kebutuhan terpenuhi */
    WHEN
        (
            (
                COALESCE(qty.total_qty_requested,0)
                -
                COALESCE(qty.total_qty_arrived,0)
            )
            +
            (
                COALESCE(mk.qty_dalmat,0)
                +
                COALESCE(mk.qty_gudang,0)
            )
            -
            COALESCE(all_produk.qty_material_all_produk,0)
        ) >= 0

    THEN 'Cukup'


    /* Ada pengadaan tetapi masih kurang */
    WHEN
        COALESCE(qty.total_qty_requested,0) > 0

        AND

        (
            (
                COALESCE(qty.total_qty_requested,0)
                -
                COALESCE(qty.total_qty_arrived,0)
            )
            +
            (
                COALESCE(mk.qty_dalmat,0)
                +
                COALESCE(mk.qty_gudang,0)
            )
            -
            COALESCE(all_produk.qty_material_all_produk,0)
        ) < 0

    THEN 'Pengadaan Kurang'


    ELSE 'Stok Kurang, Belum Pengadaan'

END AS status_komponen
FROM master_material mm


/* Ambil material_po terbaru yang tidak dibatalkan */
LEFT JOIN
(
    SELECT mp.*
    FROM material_po mp
    INNER JOIN
    (
        SELECT
            komat,
            MAX(request_date) AS max_request_date
        FROM material_po
        WHERE status <> 'Dibatalkan'
        GROUP BY komat
    ) latest

    ON latest.komat = mp.komat
    AND latest.max_request_date = mp.request_date

    WHERE mp.status <> 'Dibatalkan'

) mp

ON mp.komat = mm.komat
    
LEFT JOIN
(
    SELECT
        mm.komat,

        SUM(
            mm.jumlah_diminta *
            mm.jumlah_perts *
            CASE
                /* Prioritas 1: Progress Material */
                WHEN sm.ts_terakhir IS NOT NULL
                    THEN mm.max_trainset - sm.ts_terakhir

                /* Prioritas 2: Progress QC */
                WHEN ppp.ts_qc_terakhir IS NOT NULL
                    THEN mm.max_trainset - ppp.ts_qc_terakhir

                /* Belum ada progress */
                ELSE mm.max_trainset
            END
        ) AS qty_material_all_produk,

        SUM(
            CASE
                WHEN sm.ts_terakhir IS NOT NULL
                    THEN mm.max_trainset - sm.ts_terakhir

                WHEN ppp.ts_qc_terakhir IS NOT NULL
                    THEN mm.max_trainset - ppp.ts_qc_terakhir

                ELSE mm.max_trainset
            END
        ) AS sisa_trainset_all_produk

    FROM master_material mm

    /* Progress Material */
    LEFT JOIN
    (
        SELECT
            id_product,
            komat,
            MAX(ts) AS ts_terakhir
        FROM stok_material
        WHERE qty_ready IS NOT NULL
          AND ts BETWEEN 0 AND 99
        GROUP BY
            id_product,
            komat
    ) sm
        ON sm.id_product = mm.id_produk
       AND sm.komat = mm.komat

    /* Progress QC */
    LEFT JOIN
    (
        SELECT
            id_product,
            MAX(trainset) AS ts_qc_terakhir
        FROM production_progress_protrack
        WHERE status = 'Tunggu QC'
          AND percentage = 100
          AND trainset BETWEEN 0 AND 99
        GROUP BY id_product
    ) ppp
        ON ppp.id_product = mm.id_produk

    GROUP BY
        mm.komat

) all_produk
ON all_produk.komat = mm.komat


  

/* Total qty pengadaan tanpa status dibatalkan */
LEFT JOIN (

    SELECT
        komat,

        SUM(COALESCE(qty_requested,0)) AS total_qty_requested,

        SUM(COALESCE(qty_ordered,0)) AS total_qty_ordered,

        SUM(COALESCE(qty_arrived,0)) AS total_qty_arrived

    FROM material_po

    WHERE status <> 'Dibatalkan'

    GROUP BY komat

) qty

ON qty.komat = mm.komat


/* Master stok */
LEFT JOIN master_komat mk

    ON mk.komat = mm.komat
    
 LEFT JOIN
(
    SELECT
        x.id_produk,
        x.komat,

        CASE
            WHEN x.ts_material IS NOT NULL
            THEN x.max_trainset - x.ts_material

            WHEN x.ts_qc IS NOT NULL
            THEN x.max_trainset - x.ts_qc

            ELSE x.max_trainset
        END AS sisa_trainset_produk

    FROM
    (
        SELECT
            mm.id_produk,
            mm.komat,
            mm.max_trainset,

            sm.ts_terakhir AS ts_material,

            ppp.ts_qc_terakhir AS ts_qc

        FROM master_material mm

        LEFT JOIN
        (
            SELECT
                id_product,
                komat,
                MAX(ts) AS ts_terakhir
            FROM stok_material
            WHERE qty_ready IS NOT NULL
            AND ts BETWEEN 0 AND 99
            GROUP BY id_product, komat
        ) sm

        ON sm.id_product = mm.id_produk
        AND sm.komat = mm.komat


        LEFT JOIN
        (
            SELECT
                id_product,
                MAX(trainset) AS ts_qc_terakhir
            FROM production_progress_protrack
            WHERE status='Tunggu QC'
            AND percentage=100
            AND trainset BETWEEN 0 AND 99
            GROUP BY id_product
        ) ppp

        ON ppp.id_product = mm.id_produk


        GROUP BY
            mm.id_produk,
            mm.komat,
            mm.max_trainset,
            sm.ts_terakhir,
            ppp.ts_qc_terakhir

    ) x

) progress_material

ON progress_material.id_produk = mm.id_produk
AND progress_material.komat = mm.komat




ORDER BY
    mm.produk,
    mm.no;
    `);
    
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as PlottingMaterialTabel[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}