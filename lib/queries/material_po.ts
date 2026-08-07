import { db } from "@/lib/db";
import { sql } from "drizzle-orm";


export interface PengadaanPercentage {
    total_pr: number;
    total_po: number;
    total_arrived: number;
    total_cancelled: number;
    barang_pr: number;
    barang_po: number;
    barang_arrived: number;
    barang_cancelled: number;
    qty_pr: number;
    qty_po: number;
    qty_arrived: number;
    qty_cancelled: number;
    rp_pr: number;
    rp_po: number;
    rp_arrived: number;
    rp_cancelled: number;
    pr_percentage: number;
    po_percentage: number;
    arrival_percentage: number;
    cancelled_percentage: number;
}

export interface AverageLeadTime {
    avg_leadtime: number;
    avg_pr_po: number;
    avg_po_arrival: number;
    on_time_percentage: number;
}

export interface TopProject {
    project_code: string;
    total_qty: number;
    total_rp: number;
    percentage: number;
}

export interface dev_qty {
    dev_qty_pr_po: number;
    dev_qty_po_gr: number;
    percentage_qty_pr_po: number;
    percentage_qty_po_gr: number;
}

export interface kanban_pr {
    //no_pr: string;
    //account_req: number;
    request_date: string;
    wbs: string;
 //   eta: string;
    project_code: string;
    total_pr: number;
    item_pr_diproses: number;
    total_item_pr: number;
    percentage_item_pr: number;
    avg_lead_time_pr: number;
    selisih_item_pr: number;
}

export interface kanban_po {
    //no_po: string;
    //vendor_name: string;
    wbs: string;
    project_code: string;
    total_po: number;
    po_date: string;
    item_po_diproses: number;
    total_item_po: number;
    percentage_item_po: number;
    arrival_date: string;
    avg_lead_time_po: number;
}

export interface kanban_gr {
    //no_po: string;
    //vendor_name: string;
    wbs: string;
    project_code: string;
    total_gr: number;
    item_gr_diproses: number;
    total_item_gr: number;
    percentage_item_gr: number;
    arrival_date: string;
    avg_lead_time_gr: number;
    selisih_item_gr: number;
}



export interface material_pr {
    no_item_pr: number;
    no_pr: string;
    komat: string;
    material_name: string;
    qty_requested: number;
    qty_ordered: number;
    qty_arrived: number;
    satuan: string;
    status: string;
}

export interface material_po {
    no_item_po: number;
    no_po: string;
    komat: string;
    material_name: string;
    qty_requested: number;
    qty_ordered: number;
    qty_arrived: number;
    satuan: string;
    status: string;
}

export interface material_gr {
    no_item_po: number;
    no_po: string;
    komat: string;
    material_name: string;
    qty_requested: number;
    qty_ordered: number;
    qty_arrived: number;
    satuan: string;
    status: string;
}


export interface tabel_material {
    account_req: number;
    wbs: string;
    no_pr: string;
    no_po: string;
    komat: string;
    material_name: string;
    material_group: string;
    vendor_name: string;
    qty_requested: number;
    qty_ordered: number;
    qty_arrived: number;
    satuan: string;
    price: number;
    request_date: string;
    est_incoming_date: string;
    po_date: string;
    arrival_date: string;
    status: string;
    project_code: string;
}

export interface vendor_performance {
    vendor_name: string;
    total_item: number;
    total_item_datang: number;
    total_qty_requested: number;
    total_qty_arrived: number;
    total_qty_ordered: number;
    percentage_arrived: number;
    avg_lead_time: number;
}

export async function getPengadaanPercentage(
  months?: string[],
  projectCodes?: string[],
  days?: number
): Promise<PengadaanPercentage[]> {
  try {
    const result = await db.execute(sql`
SELECT

    /* ===========================================
       TOTAL
       =========================================== */

    COUNT(DISTINCT mp.no_pr) AS total_pr,

    COUNT(DISTINCT CASE
        WHEN mp.no_po IS NOT NULL
         AND mp.no_po <> ''
        THEN mp.no_po
    END) AS total_po,

    COUNT(DISTINCT CASE
        WHEN mp.no_po IS NOT NULL
         AND mp.no_po <> ''
         AND mp.wbs IS NOT NULL
         AND mp.wbs <> ''
        THEN mp.no_po
    END) AS total_arrived,

    COUNT(DISTINCT CASE
        WHEN mp.status = 'Dibatalkan'
        THEN mp.no_pr
    END) AS total_cancelled,


    /* ===========================================
       JUMLAH BARANG
       =========================================== */

    SUM(CASE
        WHEN mp.status = 'Proses PR'
        THEN 1
        ELSE 0
    END) AS barang_pr,

    SUM(CASE
        WHEN mp.status = 'Proses PO'
        THEN 1
        ELSE 0
    END) AS barang_po,

    SUM(CASE
        WHEN mp.status = 'Diterima'
        THEN 1
        ELSE 0
    END) AS barang_arrived,

    SUM(CASE
        WHEN mp.status = 'Dibatalkan'
        THEN 1
        ELSE 0
    END) AS barang_cancelled,


    /* ===========================================
       QTY
       =========================================== */

    SUM(mp.qty_requested) AS qty_pr,

    SUM(
        CASE
            WHEN mp.no_po IS NOT NULL
             AND mp.no_po <> ''
            THEN mp.qty_ordered
            ELSE 0
        END
    ) AS qty_po,

    SUM(
        CASE
            WHEN mp.status = 'Diterima'
            THEN mp.qty_ordered
            ELSE 0
        END
    ) AS qty_arrived,

    SUM(
        CASE
            WHEN mp.status = 'Dibatalkan'
            THEN mp.qty_requested
            ELSE 0
        END
    ) AS qty_cancelled,


    /* ===========================================
       NILAI RUPIAH
       Prioritas:
       1. material_po.price
       2. qty × master_komat.harga_satuan
       =========================================== */

    COALESCE(
        SUM(
            CASE
                WHEN mp.status = 'Proses PR' THEN
                    CASE
                        WHEN mp.price IS NOT NULL
                        THEN mp.price
                        ELSE mp.qty_requested * COALESCE(mk.harga_satuan,0)
                    END
                ELSE 0
            END
        ),0
    ) AS rp_pr,


    COALESCE(
        SUM(
            CASE
                WHEN mp.status = 'Proses PO' THEN
                    CASE
                        WHEN mp.price IS NOT NULL
                        THEN mp.price
                        ELSE mp.qty_ordered * COALESCE(mk.harga_satuan,0)
                    END
                ELSE 0
            END
        ),0
    ) AS rp_po,


    COALESCE(
        SUM(
            CASE
                WHEN mp.status = 'Diterima' THEN
                    CASE
                        WHEN mp.price IS NOT NULL
                        THEN mp.price
                        ELSE mp.qty_ordered * COALESCE(mk.harga_satuan,0)
                    END
                ELSE 0
            END
        ),0
    ) AS rp_arrived,


    COALESCE(
        SUM(
            CASE
                WHEN mp.status = 'Dibatalkan' THEN
                    CASE
                        WHEN mp.price IS NOT NULL
                        THEN mp.price
                        ELSE mp.qty_requested * COALESCE(mk.harga_satuan,0)
                    END
                ELSE 0
            END
        ),0
    ) AS rp_cancelled,


    /* ===========================================
       PERSENTASE BERDASARKAN QTY
       Mengabaikan Dibatalkan
       =========================================== */


/* ===========================================
   PERSENTASE BERDASARKAN QTY
   Mengabaikan Dibatalkan
   =========================================== */


ROUND(
    SUM(
        CASE
            WHEN mp.status = 'Proses PR'
            THEN mp.qty_requested
            ELSE 0
        END
    ) * 100 /
    NULLIF(
        SUM(
            CASE
                WHEN mp.status <> 'Dibatalkan'
                THEN mp.qty_requested
                ELSE 0
            END
        ),
        0
    ),
    0
) AS pr_percentage,


ROUND(
    SUM(
        CASE
            WHEN mp.status = 'Proses PO'
            THEN mp.qty_requested
            ELSE 0
        END
    ) * 100 /
    NULLIF(
        SUM(
            CASE
                WHEN mp.status <> 'Dibatalkan'
                THEN mp.qty_requested
                ELSE 0
            END
        ),
        0
    ),
    0
) AS po_percentage,


ROUND(
    SUM(
        CASE
            WHEN mp.status = 'Diterima'
            THEN mp.qty_requested
            ELSE 0
        END
    ) * 100 /
    NULLIF(
        SUM(
            CASE
                WHEN mp.status <> 'Dibatalkan'
                THEN mp.qty_requested
                ELSE 0
            END
        ),
        0
    ),
    0
) AS arrival_percentage


FROM material_po mp

LEFT JOIN master_komat mk
    ON mp.komat = mk.komat

WHERE 1=1
${days ? sql`AND mp.request_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)` : sql``}

${months && months.length > 0
  ? sql`AND MONTH(mp.request_date) IN (${sql.join(
      months.map((m) => sql`${Number(m)}`),
      sql`, `
    )})`
  : sql``}

${projectCodes && projectCodes.length > 0
  ? sql`AND mp.project_code IN (${sql.join(
      projectCodes.map((p) => sql`${p}`),
      sql`, `
    )})`
  : sql``}
    `);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as PengadaanPercentage[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}


export async function getAverageLeadTime(
  months?: string[],
  projectCodes?: string[],
  days?: number
): Promise<AverageLeadTime[]> {
  try {
    const result = await db.execute(sql`
SELECT

    ROUND(AVG(mp.lead_time), 0) AS avg_leadtime,

    ROUND(
        AVG(
            CASE
                WHEN mp.status = 'Proses PO'
                THEN mp.lead_time
            END
        ),
        0
    ) AS avg_pr_po,

    ROUND(
        AVG(
            CASE
                WHEN mp.status = 'Diterima'
                THEN mp.lead_time
            END
        ),
        0
    ) AS avg_po_arrival,

    ROUND(
        (
            SUM(
                CASE
                    WHEN mp.status = 'Diterima'
                     AND mp.arrival_date IS NOT NULL
                     AND mp.est_incoming_date IS NOT NULL
                     AND mp.arrival_date <= mp.est_incoming_date
                    THEN 1
                    ELSE 0
                END
            ) * 100
        ) /
        NULLIF(
            SUM(
                CASE
                    WHEN mp.status = 'Diterima'
                     AND mp.arrival_date IS NOT NULL
                     AND mp.est_incoming_date IS NOT NULL
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ),
        0
    ) AS on_time_percentage

FROM material_po mp

WHERE 1=1
  AND mp.status <> 'Dibatalkan'
  ${days ? sql`AND mp.request_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)` : sql``}

${months && months.length > 0
  ? sql`
      AND MONTH(mp.request_date) IN (
        ${sql.join(
          months.map((m) => sql`${Number(m)}`),
          sql`, `
        )}
      )
    `
  : sql``}

${projectCodes && projectCodes.length > 0
  ? sql`
      AND mp.project_code IN (
        ${sql.join(
          projectCodes.map((p) => sql`${p}`),
          sql`, `
        )}
      )
    `
  : sql``}
`);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as AverageLeadTime[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}


export async function getTopProjects(
  months?: string[],
  projectCodes?: string[],
  days?: number
): Promise<TopProject[]> {
  try {
    const result = await db.execute(sql`

SELECT
    mp.project_code,

    SUM(mp.qty_requested) AS total_qty,

    SUM(
        CASE
            WHEN mp.price IS NOT NULL THEN mp.price
            ELSE mp.qty_requested * COALESCE(mk.harga_satuan, 0)
        END
    ) AS total_rp,

    ROUND(
        SUM(
            CASE
                WHEN mp.price IS NOT NULL THEN mp.price
                ELSE mp.qty_requested * COALESCE(mk.harga_satuan, 0)
            END
        ) * 100
        /
        SUM(
            SUM(
                CASE
                    WHEN mp.price IS NOT NULL THEN mp.price
                    ELSE mp.qty_requested * COALESCE(mk.harga_satuan, 0)
                END
            )
        ) OVER (),
        0
    ) AS percentage

FROM material_po mp

LEFT JOIN master_komat mk
    ON mp.komat = mk.komat

WHERE 1=1
    AND mp.project_code IS NOT NULL
    AND mp.project_code <> ''
    AND mp.status <> 'Dibatalkan'
    ${days ? sql`AND mp.request_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)` : sql``}

${projectCodes && projectCodes.length > 0
  ? sql`
    AND mp.project_code IN (
      ${sql.join(
        projectCodes.map((p) => sql`${p}`),
        sql`, `
      )}
    )
  `
  : sql``}

${months && months.length > 0
  ? sql`
    AND MONTH(mp.request_date) IN (
      ${sql.join(
        months.map((m) => sql`${Number(m)}`),
        sql`, `
      )}
    )
  `
  : sql``}

GROUP BY mp.project_code

ORDER BY total_rp DESC

LIMIT 5;
`);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as TopProject[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}

export async function getDistinctProjectCodes(days?: number): Promise<string[]> {
  try {
    const result = await db.execute(sql`
SELECT DISTINCT project_code
FROM material_po
WHERE project_code IS NOT NULL
  AND project_code <> ''
  ${days ? sql`AND request_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)` : sql``}
ORDER BY project_code;
`);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return Array.isArray(rows)
      ? rows
          .map((row: any) => String(row.project_code || "").trim())
          .filter(Boolean)
      : [];
  } catch (error) {
    console.error("Gagal mengambil project codes:", error);
    return [];
  }
}

export async function getDevQty(
  months?: string[],
  projectCodes?: string[],
  days?: number
): Promise<dev_qty[]> {
  try {
    const result = await db.execute(sql`
SELECT

    /* =====================================
       DEVIASI PR -> PO
       Hanya menghitung baris yang memiliki
       qty_requested dan qty_ordered
       ===================================== */

    SUM(
        CASE
            WHEN qty_requested IS NOT NULL
             AND qty_ordered IS NOT NULL
            THEN qty_requested - qty_ordered
            ELSE 0
        END
    ) AS dev_qty_pr_po,

    ROUND(
        SUM(
            CASE
                WHEN qty_requested IS NOT NULL
                 AND qty_ordered IS NOT NULL
                THEN qty_requested - qty_ordered
                ELSE 0
            END
        ) * 100 /
        NULLIF(
            SUM(
                CASE
                    WHEN qty_requested IS NOT NULL
                     AND qty_ordered IS NOT NULL
                    THEN qty_requested
                    ELSE 0
                END
            ),
            0
        ),
        2
    ) AS percentage_qty_pr_po,

    /* =====================================
       DEVIASI PO -> GR
       Hanya menghitung baris yang memiliki
       qty_ordered dan qty_arrived
       ===================================== */

    SUM(
        CASE
            WHEN qty_ordered IS NOT NULL
             AND qty_arrived IS NOT NULL
            THEN qty_ordered - qty_arrived
            ELSE 0
        END
    ) AS dev_qty_po_gr,

    ROUND(
        SUM(
            CASE
                WHEN qty_ordered IS NOT NULL
                 AND qty_arrived IS NOT NULL
                THEN qty_ordered - qty_arrived
                ELSE 0
            END
        ) * 100 /
        NULLIF(
            SUM(
                CASE
                    WHEN qty_ordered IS NOT NULL
                     AND qty_arrived IS NOT NULL
                    THEN qty_ordered
                    ELSE 0
                END
            ),
            0
        ),
        2
    ) AS percentage_qty_po_gr

FROM material_po
WHERE 1=1
${days ? sql`AND request_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)` : sql``}

${projectCodes && projectCodes.length > 0
  ? sql`
      AND project_code IN (
        ${sql.join(
          projectCodes.map((p) => sql`${p}`),
          sql`, `
        )}
      )
    `
  : sql``}

${months && months.length > 0
  ? sql`
      AND MONTH(request_date) IN (
        ${sql.join(
          months.map((m) => sql`${Number(m)}`),
          sql`, `
        )}
      )
    `
  : sql``}


`);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as dev_qty[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}

export async function getKanbanPR(
  months?: string[],
  projectCodes?: string[],
  days?: number
): Promise<kanban_pr[]> {
  try {
    const result = await db.execute(sql`
SELECT
    COALESCE(NULLIF(mp.project_code, ''), 'Belum Terlabel') AS project_code,

    /* 1 Project = 1 WBS */
    MAX(mp.wbs) AS wbs,

    /* Total PR */
    COUNT(DISTINCT mp.no_pr) AS total_pr,

    /* Request terakhir */
    MAX(mp.request_date) AS request_date,

    /* Jumlah item yang masih Proses PO */
    SUM(
        CASE
            WHEN mp.status = 'Proses PO' THEN 1
            ELSE 0
        END
    ) AS item_pr_diproses,

    /* Total item selain dibatalkan */
    SUM(
        CASE
            WHEN mp.status <> 'Dibatalkan' THEN 1
            ELSE 0
        END
    ) AS total_item_pr,

    /* Selisih item */
    SUM(
        CASE
            WHEN mp.status <> 'Dibatalkan' THEN 1
            ELSE 0
        END
    )
    -
    SUM(
        CASE
            WHEN mp.status = 'Proses PO' THEN 1
            ELSE 0
        END
    ) AS selisih_item_pr,

    /* Persentase item diproses */
    ROUND(
        SUM(
            CASE
                WHEN mp.status = 'Proses PO' THEN 1
                ELSE 0
            END
        ) * 100.0 /
        NULLIF(
            SUM(
                CASE
                    WHEN mp.status <> 'Dibatalkan' THEN 1
                    ELSE 0
                END
            ),
            0
        ),
        0
    ) AS percentage_item_pr,

    /* Average Lead Time */
    ROUND(
        AVG(mp.lead_time),
        0
    ) AS avg_lead_time_pr

FROM material_po mp

WHERE mp.no_pr IS NOT NULL

${days
  ? sql`
      AND mp.request_date >= DATE_SUB(
          CURDATE(),
          INTERVAL ${Number(days)} DAY
      )
    `
  : sql``}

${projectCodes && projectCodes.length > 0
  ? sql`
      AND COALESCE(NULLIF(mp.project_code, ''), 'Belum Terlabel')
      IN (
        ${sql.join(
          projectCodes.map((p) => sql`${p}`),
          sql`, `
        )}
      )
    `
  : sql``}

${months && months.length > 0
  ? sql`
      AND MONTH(mp.request_date) IN (
        ${sql.join(
          months.map((m) => sql`${Number(m)}`),
          sql`, `
        )}
      )
    `
  : sql``}

GROUP BY COALESCE(NULLIF(mp.project_code, ''), 'Belum Terlabel')

ORDER BY MAX(mp.request_date) DESC
`);

    const rows = Array.isArray(result[0]) ? result[0] : result;

    return rows as kanban_pr[];

  } catch (error) {
    console.error("Gagal mengambil data Kanban PR:", error);
    return [];
  }
}

export async function getKanbanPO(
  months?: string[],
  projectCodes?: string[],
  days?: number
): Promise<kanban_po[]> {
  try {
    const result = await db.execute(sql`
SELECT
    COALESCE(NULLIF(mp.project_code, ''), 'Belum Terlabel') AS project_code,

    /* WBS 1 project = 1 WBS */
    MAX(mp.wbs) AS wbs,

    /* Total PO dalam project */
    COUNT(DISTINCT mp.no_po) AS total_po,

    /* Tanggal PO pertama */
    MAX(mp.po_date) AS po_date,

    /* Tanggal kedatangan terakhir */
    MAX(mp.arrival_date) AS arrival_date,

    /* Average Lead Time */
    ROUND(
        AVG(
            CASE
                WHEN mp.arrival_date IS NULL
                    THEN DATEDIFF(CURDATE(), mp.po_date)
                WHEN mp.arrival_date IS NOT NULL
                     AND mp.lead_time IS NOT NULL
                    THEN mp.lead_time
            END
        ),
        0
    ) AS avg_lead_time_po,

    /* Jumlah item diterima */
    SUM(
        CASE
            WHEN mp.status = 'Diterima' THEN 1
            ELSE 0
        END
    ) AS item_po_diproses,

    /* Total item selain dibatalkan */
    SUM(
        CASE
            WHEN mp.status <> 'Dibatalkan' THEN 1
            ELSE 0
        END
    ) AS total_item_po,

    /* Persentase item diterima */
    ROUND(
        SUM(
            CASE
                WHEN mp.status = 'Diterima' THEN 1
                ELSE 0
            END
        ) * 100.0 /
        NULLIF(
            SUM(
                CASE
                    WHEN mp.status <> 'Dibatalkan' THEN 1
                    ELSE 0
                END
            ),
            0
        ),
        0
    ) AS percentage_item_po

FROM material_po mp

WHERE mp.no_po IS NOT NULL

${days ? sql`
AND (
    mp.po_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)

)
` : sql``}

${projectCodes && projectCodes.length > 0
  ? sql`
AND COALESCE(NULLIF(mp.project_code, ''), 'Belum Terlabel') IN (
    ${sql.join(projectCodes.map(p => sql`${p}`), sql`, `)}
)
`
  : sql``}

${months && months.length > 0
  ? sql`
AND MONTH(mp.po_date) IN (
    ${sql.join(months.map(m => sql`${Number(m)}`), sql`, `)}
)
`
  : sql``}

GROUP BY COALESCE(NULLIF(mp.project_code, ''), 'Belum Terlabel')

ORDER BY MAX(mp.po_date) DESC;
`);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as kanban_po[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}

export async function getKanbanGR(
  months?: string[],
  projectCodes?: string[],
  days?: number
): Promise<kanban_gr[]> {
  try {
    const result = await db.execute(sql`
SELECT
    COALESCE(NULLIF(mp.project_code, ''), 'Belum Terlabel') AS project_code,

    /* 1 Project = 1 WBS */
    MAX(mp.wbs) AS wbs,

    /* Total GR */
    COUNT(DISTINCT mp.no_po) AS total_gr,

    /* Request terakhir */
    MAX(mp.arrival_date) AS arrival_date,

    /* Jumlah item yang masih Proses PO */
    SUM(
        CASE
            WHEN mp.status = 'Diterima' THEN 1
            ELSE 0
        END
    ) AS item_gr_diproses,

    /* Total item GR selain dibatalkan */
    SUM(
        CASE
            WHEN mp.status <> 'Dibatalkan' THEN 1
            ELSE 0
        END
    ) AS total_item_gr,

    /* Selisih item */
    SUM(
        CASE
            WHEN mp.status <> 'Dibatalkan' THEN 1
            ELSE 0
        END
    )
    -
    SUM(
        CASE
            WHEN mp.status = 'Diterima' THEN 1
            ELSE 0
        END
    ) AS selisih_item_gr,

    /* Persentase item diproses */
    ROUND(
        SUM(
            CASE
                WHEN mp.status = 'Diterima' THEN 1
                ELSE 0
            END
        ) * 100.0 /
        NULLIF(
            SUM(
                CASE
                    WHEN mp.status <> 'Dibatalkan' THEN 1
                    ELSE 0
                END
            ),
            0
        ),
        0
    ) AS percentage_item_gr,

    /* Average Lead Time */
ROUND(
    AVG(
        CASE
            WHEN mp.status = 'Diterima'
            THEN mp.lead_time
        END
    ),
0
) AS avg_lead_time_gr

FROM material_po mp

WHERE mp.no_po IS NOT NULL
AND mp.status = 'Diterima'

${days
  ? sql`
      AND mp.po_date >= DATE_SUB(
          CURDATE(),
          INTERVAL ${Number(days)} DAY
      )
    `
  : sql``}

${projectCodes && projectCodes.length > 0
  ? sql`
      AND COALESCE(NULLIF(mp.project_code, ''), 'Belum Terlabel')
      IN (
        ${sql.join(
          projectCodes.map((p) => sql`${p}`),
          sql`, `
        )}
      )
    `
  : sql``}

${months && months.length > 0
  ? sql`
      AND MONTH(mp.po_date) IN (
        ${sql.join(
          months.map((m) => sql`${Number(m)}`),
          sql`, `
        )}
      )
    `
  : sql``}

GROUP BY COALESCE(NULLIF(mp.project_code, ''), 'Belum Terlabel')

ORDER BY MAX(mp.arrival_date) DESC
`);

    const rows = Array.isArray(result[0]) ? result[0] : result;

    return rows as kanban_gr[];

  } catch (error) {
    console.error("Gagal mengambil data Kanban GR:", error);
    return [];
  }
}


export async function getDetailMaterialPOByPO(
  projectCode?: string,
  days?: number
): Promise<material_po[]> {
  try {
    const result = await db.execute(sql`
      SELECT
        no_item_po,
        no_po,
        komat,
        material_name,
        qty_requested,
        qty_ordered,
        qty_arrived,
        satuan,
        status
      FROM material_po
      WHERE status = 'Proses PO'

      ${projectCode
        ? projectCode === "Belum Terlabel"
          ? sql`AND (project_code IS NULL OR project_code = '')`
          : sql`AND project_code = ${projectCode}`
        : sql``}

      ${days
        ? sql`AND po_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)`
        : sql``}

      ORDER BY no_item_po;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as material_po[];
  } catch (error) {
    console.error("Gagal mengambil detail data material PO:", error);
    return [];
  }
}

export async function getDetailMaterialPOByGR(
  projectCode?: string,
  days?: number
): Promise<material_gr[]> {
  try {
    const result = await db.execute(sql`
      SELECT
        no_item_po,
        no_po,
        komat,
        material_name,
        qty_requested,
        qty_ordered,
        qty_arrived,
        satuan,
        status
      FROM material_po
      WHERE status = 'Diterima'

      ${projectCode
        ? projectCode === "Belum Terlabel"
          ? sql`AND (project_code IS NULL OR project_code = '')`
          : sql`AND project_code = ${projectCode}`
        : sql``}

      ${days
        ? sql`AND po_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)`
        : sql``}

      ORDER BY no_item_po;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as material_gr[];
  } catch (error) {
    console.error("Gagal mengambil detail data material GR:", error);
    return [];
  }
}

export async function getDetailMaterialPR(
  filterValue?: string,
  filterByProjectCode = true,
  days?: number
): Promise<material_pr[]> {
  try {
    const result = await db.execute(sql`
SELECT
    no_item_pr,
    no_pr,
    komat,
    material_name,
    qty_requested,
    qty_ordered,
    qty_arrived,
    satuan,
    status
FROM material_po

WHERE status = 'Proses PR'

${filterValue
  ? filterByProjectCode
    ? filterValue === "Belum Terlabel"
      ? sql`
          AND (project_code IS NULL OR project_code = '')
        `
      : sql`
          AND project_code = ${filterValue}
        `
    : sql`
          AND no_pr = ${filterValue}
        `
  : sql``}

${days
  ? sql`
      AND request_date >= DATE_SUB(
        CURDATE(),
        INTERVAL ${Number(days)} DAY
      )
    `
  : sql``}

ORDER BY no_item_pr
`);

    const rows = Array.isArray(result[0]) ? result[0] : result;

    return rows as material_pr[];

  } catch (error) {
    console.error("Gagal mengambil detail data material PR:", error);
    return [];
  }
}

export async function getTabelMaterial(
  projectCodes?: string[],
  days?: number
): Promise<tabel_material[]> {
try {
  const result = await db.execute(sql`
SELECT 
    mp.account_req,
    mp.no_pr,
    mp.no_item_pr,
    mp.no_po,
    mp.komat,
    mp.material_name,
    mp.material_group,
    mp.vendor_name,
    mp.qty_requested,
    mp.qty_ordered,
    mp.qty_arrived,
    mp.satuan,

    /* ===========================================
       NILAI RUPIAH
       Prioritas:
       1. material_po.price
       2. qty_requested × master_komat.harga_satuan
       =========================================== */
    CASE
        WHEN mp.price IS NOT NULL
             AND mp.price <> 0
        THEN mp.price
        ELSE mp.qty_requested * COALESCE(mk.harga_satuan, 0)
    END AS price,

    mp.request_date,
    mp.est_incoming_date,
    mp.po_date,
    mp.arrival_date,
    mp.lead_time,
    mp.status,
    mp.project_code,
    mp.wbs

FROM material_po mp
LEFT JOIN master_komat mk
    ON mp.komat = mk.komat

WHERE 1=1

${days 
  ? sql`AND mp.request_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)` 
  : sql``}

${projectCodes && projectCodes.length > 0
  ? sql`
      AND mp.project_code IN (
        ${sql.join(
          projectCodes.map((p) => sql`${p}`),
          sql`, `
        )}
      )
    `
  : sql``}

ORDER BY 
    mp.request_date DESC,
    mp.no_pr ASC,
    mp.no_item_pr ASC
  `);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as tabel_material[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}

export async function getVendorPerformance(
  months?: string[],
  projectCodes?: string[],
  days?: number
): Promise<vendor_performance[]> {
  try {
    const result = await db.execute(sql`

SELECT
    vendor_name,

    -- Total seluruh item vendor
    COUNT(*) AS total_item,

    -- Total item yang sudah diterima
    SUM(
        CASE
            WHEN status = 'Diterima' THEN 1
            ELSE 0
        END
    ) AS total_item_datang,

    -- Total quantity
    SUM(COALESCE(qty_requested, 0)) AS total_qty_requested,
    SUM(COALESCE(qty_ordered, 0)) AS total_qty_ordered,
    SUM(COALESCE(qty_arrived, 0)) AS total_qty_arrived,

    -- Persentase kedatangan (tanpa desimal)
    ROUND(
        SUM(COALESCE(qty_arrived, 0)) * 100 /
        NULLIF(SUM(COALESCE(qty_ordered, 0)), 0)
    ) AS percentage_arrived,

    -- Rata-rata lead time (tanpa desimal)
    ROUND(AVG(lead_time)) AS avg_lead_time

FROM material_po

WHERE vendor_name IS NOT NULL
  AND vendor_name <> ''
  AND status <> 'Dibatalkan'
  ${days ? sql`AND request_date >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)` : sql``}
  ${projectCodes && projectCodes.length > 0
    ? sql`
      AND project_code IN (
        ${sql.join(
          projectCodes.map((p) => sql`${p}`),
          sql`, `
        )}
      )
    `
    : sql``}

GROUP BY vendor_name

ORDER BY avg_lead_time DESC
LIMIT 5;

        `);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as vendor_performance[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}