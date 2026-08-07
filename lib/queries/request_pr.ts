import { db } from "@/lib/db";
import { sql } from "drizzle-orm";


export interface kanban_req_pr {
    no_surat: string;
    pic: string;
    tanggal: string;
    project_name: string;
    jumlah_item: number;
    jumlah_item_diproses: number;
    persentase_diproses: number;
    link: string;
    lead_time: number; 
}

export interface material_req_pr {
    kode_material: string;
    material_name: string;
    qty: number;
    satuan: string;
    status: string;
    qty_requested: number;
    qty_ordered: number;
    qty_arrived: number;
}




export async function getKanbanReqPR(
  days?: number
): Promise<kanban_req_pr[]> {
  try {
    const result = await db.execute(sql`
WITH pr_distinct AS (
    SELECT
        MIN(id) AS id
    FROM request_pr
    WHERE 1=1
    ${days 
        ? sql`AND tanggal >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)` 
        : sql``}
    GROUP BY
        no_surat,
        material_name
)

SELECT 
    rp.no_surat,

    MAX(rp.pic) AS pic,
    MAX(rp.tanggal) AS tanggal,
    MAX(rp.project_name) AS project_name,
    MAX(rp.link) AS link,

    /* Jumlah material unik per surat */
    COUNT(*) AS jumlah_item,

    /* Jumlah material yang sudah masuk material_po */
    SUM(
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM material_po mp
                WHERE (
                        mp.komat = rp.kode_material
                     OR mp.material_name = rp.material_name
                      )
                  AND mp.request_date >= rp.tanggal
                  AND mp.qty_requested = rp.qty
            )
            THEN 1
            ELSE 0
        END
    ) AS jumlah_item_diproses,


    /* Persentase material diproses */
    ROUND(
        SUM(
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM material_po mp
                    WHERE (
                            mp.komat = rp.kode_material
                         OR mp.material_name = rp.material_name
                          )
                      AND mp.request_date >= rp.tanggal
                      AND mp.qty_requested = rp.qty
                )
                THEN 1
                ELSE 0
            END
        ) * 100.0 / COUNT(*),
        0
    ) AS persentase_diproses,


    /* Rata-rata lead time */
    ROUND(
        AVG(
            CASE

                /* Jika sudah ada material_po */
                WHEN EXISTS (
                    SELECT 1
                    FROM material_po mp
                    WHERE (
                            mp.komat = rp.kode_material
                         OR mp.material_name = rp.material_name
                          )
                      AND mp.request_date >= rp.tanggal
                )
                THEN (
                    SELECT 
                        DATEDIFF(
                            MIN(mp.request_date),
                            rp.tanggal
                        )
                    FROM material_po mp
                    WHERE (
                            mp.komat = rp.kode_material
                         OR mp.material_name = rp.material_name
                          )
                      AND mp.request_date >= rp.tanggal
                )

                /* Jika belum diproses */
                ELSE DATEDIFF(
                    CURDATE(),
                    rp.tanggal
                )

            END
        ),
        0
    ) AS lead_time


FROM request_pr rp

INNER JOIN pr_distinct pd
    ON rp.id = pd.id


GROUP BY
    rp.no_surat

ORDER BY
    MAX(rp.tanggal) DESC;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as kanban_req_pr[];
  } catch (error) {
    console.error("Gagal mengambil detail data material PO:", error);
    return [];
  }
}

export async function getMaterialRequestPR(
  no_surat?: string,
): Promise<material_req_pr[]> {
  try {
    const result = await db.execute(sql`
SELECT 
    rp.kode_material,
    rp.material_name,
    rp.qty,
    rp.satuan,

    /* Status */
    COALESCE(
        (
            SELECT mp.status
            FROM material_po mp
            WHERE mp.komat = rp.kode_material
              AND mp.request_date >= rp.tanggal
            ORDER BY mp.request_date DESC
            LIMIT 1
        ),
        (
            SELECT mp.status
            FROM material_po mp
            WHERE mp.material_name = rp.material_name
              AND mp.request_date >= rp.tanggal
            ORDER BY mp.request_date DESC
            LIMIT 1
        ),
        'Reservasi'
    ) AS status,


    /* Qty Requested */
    COALESCE(
        (
            SELECT mp.qty_requested
            FROM material_po mp
            WHERE mp.komat = rp.kode_material
              AND mp.request_date >= rp.tanggal
            ORDER BY mp.request_date DESC
            LIMIT 1
        ),
        (
            SELECT mp.qty_requested
            FROM material_po mp
            WHERE mp.material_name = rp.material_name
              AND mp.request_date >= rp.tanggal
            ORDER BY mp.request_date DESC
            LIMIT 1
        ),
        0
    ) AS qty_requested,


    /* Qty Ordered */
    COALESCE(
        (
            SELECT mp.qty_ordered
            FROM material_po mp
            WHERE mp.komat = rp.kode_material
              AND mp.request_date >= rp.tanggal
            ORDER BY mp.request_date DESC
            LIMIT 1
        ),
        (
            SELECT mp.qty_ordered
            FROM material_po mp
            WHERE mp.material_name = rp.material_name
              AND mp.request_date >= rp.tanggal
            ORDER BY mp.request_date DESC
            LIMIT 1
        ),
        0
    ) AS qty_ordered,


    /* Qty Arrived */
    COALESCE(
        (
            SELECT mp.qty_arrived
            FROM material_po mp
            WHERE mp.komat = rp.kode_material
              AND mp.request_date >= rp.tanggal
            ORDER BY mp.request_date DESC
            LIMIT 1
        ),
        (
            SELECT mp.qty_arrived
            FROM material_po mp
            WHERE mp.material_name = rp.material_name
              AND mp.request_date >= rp.tanggal
            ORDER BY mp.request_date DESC
            LIMIT 1
        ),
        0
    ) AS qty_arrived


FROM request_pr rp

INNER JOIN (
    SELECT
        MIN(id) AS id
    FROM request_pr
    WHERE no_surat = ${no_surat}

    /* DISTINCT berdasarkan nama material saja */
    GROUP BY
        no_surat,
        material_name

) d
ON rp.id = d.id


ORDER BY
    rp.material_name;
    `);

    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as material_req_pr[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}