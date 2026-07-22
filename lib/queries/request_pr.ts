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
}




export async function getKanbanReqPR(
  days?: number
): Promise<kanban_req_pr[]> {
  try {
    const result = await db.execute(sql`
SELECT
    rp.no_surat,
    MAX(rp.pic) AS pic,
    MAX(rp.tanggal) AS tanggal,
    MAX(rp.project_name) AS project_name,
    MAX(rp.link) AS link,

    /* Jumlah item dalam 1 no_surat */
    COUNT(*) AS jumlah_item,

    /* Jumlah item yang sudah diproses ke material_po */
    SUM(
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM material_po mp
                WHERE mp.material_name = rp.material_name
                  AND mp.request_date >= rp.tanggal
                  AND mp.qty_requested = rp.qty
            )
            THEN 1
            ELSE 0
        END
    ) AS jumlah_item_diproses,

    /* Persentase diproses */
    ROUND(
        SUM(
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM material_po mp
                    WHERE mp.material_name = rp.material_name
                      AND mp.request_date >= rp.tanggal
                      AND mp.qty_requested = rp.qty
                )
                THEN 1
                ELSE 0
            END
        ) * 100.0 / COUNT(*),
        0
    ) AS persentase_diproses,

    /* Lead time rata-rata per surat */
    ROUND(
        AVG(
            CASE
                /* Jika ditemukan di material_po */
                WHEN EXISTS (
                    SELECT 1
                    FROM material_po mp
                    WHERE mp.material_name = rp.material_name
                      AND mp.request_date >= rp.tanggal
                      AND mp.qty_requested = rp.qty
                )
                THEN (
                    SELECT DATEDIFF(MIN(mp.request_date), rp.tanggal)
                    FROM material_po mp
                    WHERE mp.material_name = rp.material_name
                      AND mp.request_date > rp.tanggal
                      AND mp.qty_requested = rp.qty
                )

                /* Jika belum ditemukan */
                ELSE DATEDIFF(CURDATE(), rp.tanggal)
            END
        ),
        0
    ) AS lead_time

FROM request_pr rp
WHERE 1=1
${days ? sql`AND rp.tanggal >= DATE_SUB(CURDATE(), INTERVAL ${Number(days)} DAY)` : sql``}
GROUP BY rp.no_surat
ORDER BY MAX(rp.tanggal) DESC;

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

    COALESCE(
        (
            SELECT mp.status
            FROM material_po mp
            WHERE mp.material_name = rp.material_name
              AND mp.request_date >= rp.tanggal
              AND mp.qty_requested = rp.qty
            ORDER BY mp.request_date DESC
            LIMIT 1
        ),
        'Reservasi'
    ) AS status

FROM request_pr rp
WHERE rp.no_surat = ${no_surat};

           `);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as material_req_pr[];
  } catch (error) {
    console.error("Gagal mengambil data material:", error);
    return [];
  }
}