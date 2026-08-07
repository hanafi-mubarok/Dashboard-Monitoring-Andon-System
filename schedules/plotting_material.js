const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  port: Number(process.env.DB_PORT || 3306),
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

const plottingQuery = `
INSERT INTO material_plotting (
  id,
  no,
  komat,
  spesifikasi,
  produk,
  project,
  request_date,
  po_date,
  arrival_date,
  lead_time,
  status,
  no_pr,
  no_po,
  vendor_name,
  jumlah_diminta,
  jumlah_perts,
  max_trainset,
  total_kebutuhan,
  qty_material_all_produk,
  sisa_trainset,
  qty_requested,
  qty_ordered,
  qty_arrived,
  dev_qty_pr_gr,
  satuan,
  qty_dalmat,
  qty_gudang,
  stok_available,
  total_material_coverage,
  deviasi_qty,
  status_komponen
)
SELECT
    mm.id,
    mm.no,
    mm.komat,
    mm.spesifikasi,
    mm.produk,
    mm.project,
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
    COALESCE(all_produk.qty_material_all_produk,0) AS qty_material_all_produk,
    COALESCE(progress_material.sisa_trainset_produk, mm.max_trainset) AS sisa_trainset,
    COALESCE(qty.total_qty_requested,0) AS qty_requested,
    COALESCE(qty.total_qty_ordered,0) AS qty_ordered,
    COALESCE(qty.total_qty_arrived,0) AS qty_arrived,
    (
      COALESCE(qty.total_qty_requested,0) -
      COALESCE(qty.total_qty_arrived,0)
    ) AS dev_qty_pr_gr,
    mm.satuan,
    COALESCE(mk.qty_dalmat,0) AS qty_dalmat,
    COALESCE(mk.qty_gudang,0) AS qty_gudang,
    (
      COALESCE(mk.qty_dalmat,0) +
      COALESCE(mk.qty_gudang,0)
    ) AS stok_available,
    (
      (
        COALESCE(qty.total_qty_requested,0) -
        COALESCE(qty.total_qty_arrived,0)
      ) +
      (
        COALESCE(mk.qty_dalmat,0) +
        COALESCE(mk.qty_gudang,0)
      )
    ) AS total_material_coverage,
    (
      (
        (
          COALESCE(qty.total_qty_requested,0) -
          COALESCE(qty.total_qty_arrived,0)
        ) +
        (
          COALESCE(mk.qty_dalmat,0) +
          COALESCE(mk.qty_gudang,0)
        )
      ) -
      COALESCE(all_produk.qty_material_all_produk,0)
    ) AS deviasi_qty,
    CASE
      WHEN COALESCE(qty.total_qty_requested,0) = 0
        AND (COALESCE(mk.qty_dalmat,0) + COALESCE(mk.qty_gudang,0)) = 0
      THEN 'Belum Pengadaan'
      WHEN (COALESCE(mk.qty_dalmat,0) + COALESCE(mk.qty_gudang,0)) >= COALESCE(all_produk.qty_material_all_produk,0)
      THEN 'Stok Cukup'
      WHEN ((COALESCE(qty.total_qty_requested,0) - COALESCE(qty.total_qty_arrived,0)) + (COALESCE(mk.qty_dalmat,0) + COALESCE(mk.qty_gudang,0)) - COALESCE(all_produk.qty_material_all_produk,0)) >= 0
        AND (COALESCE(qty.total_qty_requested,0) - COALESCE(qty.total_qty_arrived,0)) > 0
        AND COALESCE(mp.lead_time,0) < 30
      THEN 'Cukup, Tunggu GR'
      WHEN ((COALESCE(qty.total_qty_requested,0) - COALESCE(qty.total_qty_arrived,0)) + (COALESCE(mk.qty_dalmat,0) + COALESCE(mk.qty_gudang,0)) - COALESCE(all_produk.qty_material_all_produk,0)) >= 0
        AND (COALESCE(qty.total_qty_requested,0) - COALESCE(qty.total_qty_arrived,0)) > 0
        AND COALESCE(mp.lead_time,0) >= 30
      THEN 'Cukup, Pengadaan Outstanding'
      WHEN ((COALESCE(qty.total_qty_requested,0) - COALESCE(qty.total_qty_arrived,0)) + (COALESCE(mk.qty_dalmat,0) + COALESCE(mk.qty_gudang,0)) - COALESCE(all_produk.qty_material_all_produk,0)) >= 0
      THEN 'Cukup'
      WHEN COALESCE(qty.total_qty_requested,0) > 0
        AND ((COALESCE(qty.total_qty_requested,0) - COALESCE(qty.total_qty_arrived,0)) + (COALESCE(mk.qty_dalmat,0) + COALESCE(mk.qty_gudang,0)) - COALESCE(all_produk.qty_material_all_produk,0)) < 0
      THEN 'Pengadaan Kurang'
      ELSE 'Stok Kurang, Belum Pengadaan'
    END AS status_komponen
FROM master_material mm
LEFT JOIN (
  SELECT mp.*
  FROM material_po mp
  INNER JOIN (
    SELECT komat, MAX(request_date) AS max_request_date
    FROM material_po
    WHERE status <> 'Dibatalkan'
    GROUP BY komat
  ) latest ON latest.komat = mp.komat AND latest.max_request_date = mp.request_date
  WHERE mp.status <> 'Dibatalkan'
) mp ON mp.komat = mm.komat
LEFT JOIN (
  SELECT mm.komat,
    SUM(mm.jumlah_diminta * mm.jumlah_perts * CASE
      WHEN sm.ts_terakhir IS NOT NULL THEN mm.max_trainset - sm.ts_terakhir
      WHEN ppp.ts_qc_terakhir IS NOT NULL THEN mm.max_trainset - ppp.ts_qc_terakhir
      ELSE mm.max_trainset
    END) AS qty_material_all_produk
  FROM master_material mm
  LEFT JOIN (
    SELECT id_product, komat, MAX(ts) AS ts_terakhir
    FROM stok_material
    WHERE qty_ready IS NOT NULL AND ts BETWEEN 0 AND 99
    GROUP BY id_product, komat
  ) sm ON sm.id_product = mm.id_produk AND sm.komat = mm.komat
  LEFT JOIN (
    SELECT id_product, MAX(trainset) AS ts_qc_terakhir
    FROM production_progress_protrack
    WHERE status = 'Tunggu QC' AND percentage = 100 AND trainset BETWEEN 0 AND 99
    GROUP BY id_product
  ) ppp ON ppp.id_product = mm.id_produk
  GROUP BY mm.komat
) all_produk ON all_produk.komat = mm.komat
LEFT JOIN (
  SELECT komat,
    SUM(COALESCE(qty_requested,0)) AS total_qty_requested,
    SUM(COALESCE(qty_ordered,0)) AS total_qty_ordered,
    SUM(COALESCE(qty_arrived,0)) AS total_qty_arrived
  FROM material_po
  WHERE status <> 'Dibatalkan'
  GROUP BY komat
) qty ON qty.komat = mm.komat
LEFT JOIN master_komat mk ON mk.komat = mm.komat
LEFT JOIN (
  SELECT x.id_produk, x.komat,
    CASE
      WHEN x.ts_material IS NOT NULL THEN x.max_trainset - x.ts_material
      WHEN x.ts_qc IS NOT NULL THEN x.max_trainset - x.ts_qc
      ELSE x.max_trainset
    END AS sisa_trainset_produk
  FROM (
    SELECT mm.id_produk, mm.komat, mm.max_trainset,
      sm.ts_terakhir AS ts_material,
      ppp.ts_qc_terakhir AS ts_qc
    FROM master_material mm
    LEFT JOIN (
      SELECT id_product, komat, MAX(ts) AS ts_terakhir
      FROM stok_material
      WHERE qty_ready IS NOT NULL AND ts BETWEEN 0 AND 99
      GROUP BY id_product, komat
    ) sm ON sm.id_product = mm.id_produk AND sm.komat = mm.komat
    LEFT JOIN (
      SELECT id_product, MAX(trainset) AS ts_qc_terakhir
      FROM production_progress_protrack
      WHERE status = 'Tunggu QC' AND percentage = 100 AND trainset BETWEEN 0 AND 99
      GROUP BY id_product
    ) ppp ON ppp.id_product = mm.id_produk
    GROUP BY mm.id_produk, mm.komat, mm.max_trainset, sm.ts_terakhir, ppp.ts_qc_terakhir
  ) x
) progress_material ON progress_material.id_produk = mm.id_produk AND progress_material.komat = mm.komat
WHERE mm.no IS NOT NULL  AND mm.id IS NOT NULL ORDER BY mm.produk, mm.id
ON DUPLICATE KEY UPDATE
  no = VALUES(no),
  komat = VALUES(komat),
  spesifikasi = VALUES(spesifikasi),
  produk = VALUES(produk),
  project = VALUES(project),
  request_date = VALUES(request_date),
  po_date = VALUES(po_date),
  arrival_date = VALUES(arrival_date),
  lead_time = VALUES(lead_time),
  status = VALUES(status),
  no_pr = VALUES(no_pr),
  no_po = VALUES(no_po),
  vendor_name = VALUES(vendor_name),
  jumlah_diminta = VALUES(jumlah_diminta),
  jumlah_perts = VALUES(jumlah_perts),
  max_trainset = VALUES(max_trainset),
  total_kebutuhan = VALUES(total_kebutuhan),
  qty_material_all_produk = VALUES(qty_material_all_produk),
  sisa_trainset = VALUES(sisa_trainset),
  qty_requested = VALUES(qty_requested),
  qty_ordered = VALUES(qty_ordered),
  qty_arrived = VALUES(qty_arrived),
  dev_qty_pr_gr = VALUES(dev_qty_pr_gr),
  satuan = VALUES(satuan),
  qty_dalmat = VALUES(qty_dalmat),
  qty_gudang = VALUES(qty_gudang),
  stok_available = VALUES(stok_available),
  total_material_coverage = VALUES(total_material_coverage),
  deviasi_qty = VALUES(deviasi_qty),
  status_komponen = VALUES(status_komponen);
`;

async function syncMaterialPlotting() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [insertResult] = await connection.query(plottingQuery);
    await connection.commit();
    return insertResult.affectedRows || 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  syncMaterialPlotting,
};
