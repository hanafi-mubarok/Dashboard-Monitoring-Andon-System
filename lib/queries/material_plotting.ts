import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface TabelPlotting {
  id: number;
  no: number;
  komat: string;
  spesifikasi: string;
  produk: string;
  project: string;
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
  qty_material_all_produk: number;
  sisa_trainset: number;
  qty_requested: number;
  qty_ordered: number;
  qty_arrived: number;
  dev_qty_pr_gr: number;
  satuan: string;
  qty_dalmat: number;
  qty_gudang: number;
  stok_available: number;
  total_material_coverage: number;
  deviasi_qty: number;
  status_komponen: string;
  created_at: string;
  updated_at: string;
}

export interface StatusMaterialPie {
  status_komponen: string;
  total: number;
  percentage: number;
  total_semua_status: number;
}

export interface MaterialReadiness {
  produk: string;
  total_material: number;
  material_ready: number;
  material_not_ready: number;
  readiness_percentage: number;
  material_readiness: string;
}

export interface ProdukKurang {
  id_product: number;
  project: string;
  produk: string;
  max_trainset: number;
  ts_selesai: number;
  material_start: number;
  material_end: number;
  material_cover_ts: number;
  gap_trainset: number;
  total_material: number;
  jumlah_material_kritis: number;
  persen_material_kritis: number;
  status: string;
    material_kritis: string;
}

export interface MaterialLeadCard {
    project: string;
    total_material: number;
    avg_lead_time: number;
    total_deviasi_qty: number;
    total_qty_gudang: number;
    qty_kekurangan_gudang: number;
    shortage_percentage: number;
}

export async function getPlottingMaterialTabel(project?: string, product?: string): Promise<TabelPlotting[]> {
  try {
    const whereConditions = [];
    if (project) whereConditions.push(sql`project = ${project}`);
    if (product) whereConditions.push(sql`produk = ${product}`);
    
    const whereClause = whereConditions.length > 0 
      ? sql`WHERE ${whereConditions[0]}${whereConditions.slice(1).reduce((acc, cond) => sql`${acc} AND ${cond}`, sql``)}`
      : sql``;

    const result = await db.execute(sql`
      SELECT *
      FROM material_plotting
      ${whereClause}
      ORDER BY produk ASC, no ASC, sisa_trainset DESC
    `);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as TabelPlotting[];
  } catch (error) {
    console.error('Gagal mengambil data material:', error);
    return [];
  }
}

export async function getStatusMaterial(project?: string, product?: string): Promise<StatusMaterialPie[]> {
  try {
    const whereConditions = [];
    if (project) whereConditions.push(sql`project = ${project}`);
    if (product) whereConditions.push(sql`produk = ${product}`);
    
    const whereClause = whereConditions.length > 0 
      ? sql`WHERE ${whereConditions[0]}${whereConditions.slice(1).reduce((acc, cond) => sql`${acc} AND ${cond}`, sql``)}`
      : sql``;

    const result = await db.execute(sql`
SELECT
    status_komponen,
    COUNT(*) AS total,
    SUM(COUNT(*)) OVER() AS total_semua_status,
    ROUND(
        COUNT(*) * 100 / SUM(COUNT(*)) OVER(),
        0
    ) AS percentage
FROM material_plotting
${whereClause}
GROUP BY status_komponen
ORDER BY total DESC;
    `);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as StatusMaterialPie[];
  } catch (error) {
    console.error('Gagal mengambil data material:', error);
    return [];
  }
}

export async function getMaterialReadiness(project?: string, product?: string): Promise<MaterialReadiness[]> {
  try {
    const whereConditions = [];
    if (project) whereConditions.push(sql`project = ${project}`);
    if (product) whereConditions.push(sql`produk = ${product}`);
    
    const whereClause = whereConditions.length > 0 
      ? sql`WHERE ${whereConditions[0]}${whereConditions.slice(1).reduce((acc, cond) => sql`${acc} AND ${cond}`, sql``)}`
      : sql``;

    const result = await db.execute(sql`
      SELECT
        produk,
        COUNT(*) AS total_material,
        SUM(
          CASE
            WHEN status_komponen IN (
              'Stok Cukup',
              'Cukup, Proses PR',
              'Cukup, Tunggu GR'
            )
            THEN 1
            ELSE 0
          END
        ) AS material_ready,
        SUM(
          CASE
            WHEN status_komponen IN (
              'Pengadaan Kurang',
              'Stok Kurang'
            )
            THEN 1
            ELSE 0
          END
        ) AS material_not_ready,
        ROUND(
          (
            SUM(
              CASE
                WHEN status_komponen IN (
                  'Stok Cukup',
                  'Cukup, Proses PR',
                  'Cukup, Tunggu GR'
                )
                THEN 1
                ELSE 0
              END
            ) / COUNT(*)
          ) * 100,
          0
        ) AS readiness_percentage,
        CASE
          WHEN SUM(
            CASE
              WHEN status_komponen IN (
                'Pengadaan Kurang',
                'Stok Kurang'
              )
              THEN 1
              ELSE 0
            END
          ) > 0
          THEN 'Not Ready'
          ELSE 'Ready'
        END AS material_readiness
      FROM material_plotting
      ${whereClause}
      GROUP BY produk
      ORDER BY readiness_percentage ASC;
    `);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as MaterialReadiness[];
  } catch (error) {
    console.error('Gagal mengambil data material:', error);
    return [];
  }
}

export async function getProdukKurangStackedbar(project?: string, product?: string): Promise<ProdukKurang[]> {
  try {
    const result = await db.execute(sql`
WITH material_calculation AS (

    SELECT

        mp.id_product,

        MIN(mp.project) AS project,

        mp.produk,

        mp.komat,


        MAX(mp.max_trainset) AS max_trainset,


        MIN(mp.sisa_trainset) AS sisa_trainset,


        FLOOR(

            (
                COALESCE(MAX(mp.stok_available),0)
            )
            /
            NULLIF(

                MAX(
                    mp.jumlah_diminta *
                    mp.jumlah_perts
                ),

                0

            )

        ) AS material_cover_ts



    FROM material_plotting mp



    WHERE mp.max_trainset IS NOT NULL
    ${project ? sql`AND mp.project = ${project}` : sql``}
    ${product ? sql`AND mp.produk = ${product}` : sql``}



    GROUP BY

        mp.id_product,

        mp.produk,

        mp.komat

),



product_material AS (

    SELECT


        id_product,

        project,

        produk,


        MAX(max_trainset) AS max_trainset,


        MIN(sisa_trainset) AS sisa_trainset,


        MIN(material_cover_ts) AS material_cover_ts



    FROM material_calculation



    GROUP BY

        id_product,

        project,

        produk

),



material_percentage AS (

    SELECT


        id_product,

        project,

        produk,


        COUNT(*) AS total_material,


        SUM(

            CASE

                WHEN material_cover_ts < sisa_trainset

                THEN 1

                ELSE 0

            END

        ) AS jumlah_material_kritis



    FROM material_calculation



    GROUP BY

        id_product,

        project,

        produk

),



critical_material AS (

    SELECT


        id_product,

        project,

        produk,


        GROUP_CONCAT(

            CONCAT(

                komat,

                ' (',

                material_cover_ts,

                ' TS)'

            )

            ORDER BY

                material_cover_ts ASC


            SEPARATOR '\n'

        ) AS material_kritis



    FROM material_calculation



    WHERE

        material_cover_ts < sisa_trainset



    GROUP BY

        id_product,

        project,

        produk

)



SELECT


    pm.project,

    pm.produk,


    pm.max_trainset,


    (
        pm.max_trainset -
        pm.sisa_trainset
    ) AS ts_selesai,


    (
        pm.max_trainset -
        pm.sisa_trainset
    ) AS material_start,


    CASE

        WHEN
            (
                pm.max_trainset -
                pm.sisa_trainset +
                pm.material_cover_ts
            ) < 
            (
                pm.max_trainset -
                pm.sisa_trainset
            )

        THEN
            (
                pm.max_trainset -
                pm.sisa_trainset
            )


        WHEN
            (
                pm.max_trainset -
                pm.sisa_trainset +
                pm.material_cover_ts
            ) > pm.max_trainset

        THEN
            pm.max_trainset


        ELSE

            (
                pm.max_trainset -
                pm.sisa_trainset +
                pm.material_cover_ts
            )


    END AS material_end,


    pm.material_cover_ts,


    (
        pm.material_cover_ts -
        pm.sisa_trainset
    ) AS gap_trainset,


    mp.total_material,


    mp.jumlah_material_kritis,


    ROUND(

        (
            mp.jumlah_material_kritis /
            NULLIF(
                mp.total_material,
                0
            )

        ) * 100,

        2

    ) AS persen_material_kritis,


    cm.material_kritis,


    CASE

        WHEN

            pm.material_cover_ts -
            pm.sisa_trainset < 0

        THEN 'CRITICAL'


        WHEN

            pm.material_cover_ts -
            pm.sisa_trainset = 0

        THEN 'PAS'


        ELSE 'AMAN'


    END AS status



FROM product_material pm



LEFT JOIN material_percentage mp

ON mp.id_product = pm.id_product

AND mp.project = pm.project

AND mp.produk = pm.produk



LEFT JOIN critical_material cm

ON cm.id_product = pm.id_product

AND cm.project = pm.project

AND cm.produk = pm.produk



ORDER BY

    gap_trainset ASC;
    `);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as ProdukKurang[];
  } catch (error) {
    console.error('Gagal mengambil data material:', error);
    return [];
  }
}

export async function getMaterialLongLeadCard(project?: string, product?: string): Promise<MaterialLeadCard[]> {
  try {
    const whereConditions = [];
    if (project) whereConditions.push(sql`project = ${project}`);
    if (product) whereConditions.push(sql`produk = ${product}`);
    
    const whereClause = whereConditions.length > 0 
      ? sql`WHERE ${whereConditions[0]}${whereConditions.slice(1).reduce((acc, cond) => sql`${acc} AND ${cond}`, sql``)}`
      : sql``;

    const result = await db.execute(sql`
SELECT

    project,

    COUNT(*) AS total_material,


    ROUND(
        AVG(lead_time),
        0
    ) AS avg_lead_time,


        SUM(
        CASE
            WHEN deviasi_qty < 0
            THEN deviasi_qty
            ELSE 0
        END
    ) AS total_deviasi_qty,


    SUM(qty_gudang) AS total_qty_gudang,


    SUM(
        CASE
            WHEN qty_gudang >= deviasi_qty
            THEN 0
            ELSE deviasi_qty - qty_gudang
        END
    ) AS qty_kekurangan_gudang,


    ROUND(

        SUM(
            CASE
                WHEN qty_gudang >= deviasi_qty
                THEN 0
                ELSE deviasi_qty - qty_gudang
            END
        )

        /

        NULLIF(
            SUM(deviasi_qty),
            0
        )

        *100,

        0

    ) AS shortage_percentage


FROM material_plotting

${whereClause}
GROUP BY project;
    `);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows as MaterialLeadCard[];
  } catch (error) {
    console.error('Gagal mengambil data material:', error);
    return [];
  }
}

