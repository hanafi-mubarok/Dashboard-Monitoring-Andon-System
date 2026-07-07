import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { authUsers } from "@/lib/schema/auth";

export const dynamic = "force-dynamic";

type JadwalKey = {
  id_jadwal?: number;
  id_product?: string;
  product_name?: string;
  trainset?: number;
};

type JadwalPayload = {
  id_product: string;
  product_name: string;
  project: string | null;
  trainset: number;
  sub_output: string | null;
  jumlah_tiapts: number | null;
  total_personil: number | null;
  proses_produk: string | null;
  line: string | null;
  workshop: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  operator_assigned1: string | null;
  operator_assigned2: string | null;
  operator_assigned3: string | null;
  operator_assigned4: string | null;
};

type JwtPayload = {
  uid?: number;
};

function parseRowResult(result: any) {
  return Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : [];
}

function extractTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return "";
  const tokenPart = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  if (!tokenPart) return "";
  return decodeURIComponent(tokenPart.slice("token=".length));
}

async function authorizeScheduleMutation(request: Request) {
  const token = extractTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "JWT_SECRET belum diset" }, { status: 500 }),
    };
  }

  let userId = 0;
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    userId = Number(decoded?.uid || 0);
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!userId) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const users = await db
    .select({ role: authUsers.role, isActive: authUsers.isActive })
    .from(authUsers)
    .where(eq(authUsers.id, userId))
    .limit(1);

  const user = users[0];
  if (!user || Number(user.isActive) !== 1) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Akun nonaktif atau tidak ditemukan." }, { status: 403 }),
    };
  }

  if (user.role !== "PERENCANAAN" && user.role !== "ADMIN") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Hanya user role PERENCANAAN atau ADMIN yang boleh mengubah jadwal." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const };
}

function getProductionProgressTableByLine(line?: string) {
  const normalizedLine = (line ?? "").trim().toLowerCase();
  const tableName = normalizedLine === "lantai 1" || normalizedLine === "lantai 2"
    ? "production_progress_protrack"
    : "production_progress";
  return sql.raw(tableName);
}

function normalizePayload(body: any): JadwalPayload | null {
  const id_product = String(body?.id_product || "").trim();
  const product_name = String(body?.product_name || "").trim();
  const trainset = Number(body?.trainset);
  if (!id_product || !product_name || Number.isNaN(trainset)) return null;

  const sub_output = body?.sub_output && String(body.sub_output).trim() ? String(body.sub_output).trim() : null;
  const proses_produk = body?.proses_produk && String(body.proses_produk).trim() ? String(body.proses_produk).trim() : null;

  const jumlah_tiapts = body?.jumlah_tiapts === null || body?.jumlah_tiapts === "" ? null : Number(body?.jumlah_tiapts);
  const total_personil = body?.total_personil === null || body?.total_personil === "" ? null : Number(body?.total_personil);
  
  const project = body?.project && String(body.project).trim() ? String(body.project).trim() : null;
  const line = body?.line && String(body.line).trim() ? String(body.line).trim() : null;
  const workshop = body?.workshop && String(body.workshop).trim() ? String(body.workshop).trim() : null;
  const operator_assigned1 = body?.operator_assigned1 && String(body.operator_assigned1).trim()
    ? String(body.operator_assigned1).trim()
    : null;
  const operator_assigned2 = body?.operator_assigned2 && String(body.operator_assigned2).trim()
    ? String(body.operator_assigned2).trim()
    : null;
  const operator_assigned3 = body?.operator_assigned3 && String(body.operator_assigned3).trim()
    ? String(body.operator_assigned3).trim()
    : null;
  const operator_assigned4 = body?.operator_assigned4 && String(body.operator_assigned4).trim()
    ? String(body.operator_assigned4).trim()
    : null;

  return {
    id_product,
    product_name,
    project,
    trainset,
    sub_output,
    jumlah_tiapts: Number.isNaN(jumlah_tiapts) ? null : jumlah_tiapts,
    total_personil: Number.isNaN(total_personil) ? null : total_personil,
    proses_produk,
    line,
    workshop,
    tanggal_mulai: body?.tanggal_mulai || null,
    tanggal_selesai: body?.tanggal_selesai || null,
    operator_assigned1,
    operator_assigned2,
    operator_assigned3,
    operator_assigned4,
  };
}

function normalizeKey(body: any): JadwalKey | null {
  const key = body?.key || body;
  // Prefer numeric id_jadwal if provided
  const id_jadwal = key?.id_jadwal !== undefined ? Number(key.id_jadwal) : undefined;
  if (id_jadwal && !Number.isNaN(id_jadwal)) return { id_jadwal };

  const id_product = String(key?.id_product || "").trim();
  const product_name = String(key?.product_name || "").trim();
  const trainset = Number(key?.trainset);
  if (!id_product || !product_name || Number.isNaN(trainset)) return null;
  return { id_product, product_name, trainset };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trainsetParam = searchParams.get("trainset");
    const lineParam = searchParams.get("line") || "Lantai 3";
    const progressTable = getProductionProgressTableByLine(lineParam);

    let result;
    if (trainsetParam) {
      const trainset = Number(trainsetParam);
      result = await db.execute(sql`
    SELECT 
  j.id_product, 
  j.product_name,
  j.sub_output,
  j.proses_produk,
  j.project,
  j.trainset, 
  j.jumlah_tiapts,
  j.total_personil,
  j.operator_assigned1,
  j.operator_assigned2,
      j.operator_assigned3,
      j.operator_assigned4,
  j.line,
  j.workshop,
  j.tanggal_mulai, 
  j.tanggal_selesai,
  COALESCE(p.jumlah_tunggu_qc, 0) AS jumlah_tunggu_qc,
  COALESCE(p.jumlah_finish_good, 0) AS jumlah_finish_good,
  it.duration_time AS total_ideal_time_qc,
  GREATEST(
    j.jumlah_tiapts - COALESCE(p.jumlah_tunggu_qc,0),
    0
  ) AS jumlah_kekurangan,
    SELECT 
  j.id_jadwal,
  j.id_product, 
  j.product_name,
      AND j.trainset = p.trainset
    THEN 'Tepat Waktu'
    WHEN 
      COALESCE(p.jumlah_tunggu_qc,0) <> j.jumlah_tiapts
      AND CURRENT_DATE() > j.tanggal_selesai
    THEN 'Terlambat / Tidak Tercatat'
    WHEN 
      CURRENT_DATE() BETWEEN 
        DATE_SUB(j.tanggal_selesai, INTERVAL 3 DAY)
  j.operator_assigned4,
        AND j.tanggal_selesai
    THEN CONCAT('Kurang ', DATEDIFF(j.tanggal_selesai, CURRENT_DATE()), ' Hari')
    WHEN 
      MONTH(j.tanggal_selesai) <> MONTH(CURRENT_DATE())
      OR YEAR(j.tanggal_selesai) <> YEAR(CURRENT_DATE())
    THEN 'Waiting List'
    ELSE 'On Progress'
  END AS status

FROM jadwal AS j 

LEFT JOIN 
(
  SELECT 
    id_product,
    trainset,
    SUM(CASE 
      WHEN status = 'Tunggu QC' THEN 1 
      ELSE 0 
    END) AS jumlah_tunggu_qc,
    SUM(CASE 
      WHEN status = 'Finish Good' THEN 1 
      ELSE 0 
    END) AS jumlah_finish_good
  FROM ${progressTable}
  WHERE 
    MONTH(start_actual) = MONTH(CURRENT_DATE()) 
    AND YEAR(start_actual) = YEAR(CURRENT_DATE())
  GROUP BY id_product, trainset
) p 
  ON j.id_product = p.id_product
  AND j.trainset = p.trainset

LEFT JOIN ideal_time it
  ON j.id_product = it.id_product
  AND it.process_name = 'total_production_qc'

WHERE 
  j.trainset = ${trainset}
  AND j.line = ${lineParam}

ORDER BY j.tanggal_mulai ASC;
      `);
    } else {
      result = await db.execute(sql`
        SELECT
          j.id_jadwal,
          j.id_product,
          j.product_name,
          j.sub_output,
          j.proses_produk,
          j.project,
          j.trainset,
          j.jumlah_tiapts,
          j.total_personil,
          j.operator_assigned1,
          j.operator_assigned2,
          j.operator_assigned3,
          j.operator_assigned4,
          j.line,
          j.workshop,
          j.tanggal_mulai,
          j.tanggal_selesai,
          COALESCE(p.jumlah_tunggu_qc, 0) AS jumlah_tunggu_qc,
          COALESCE(p.jumlah_finish_good, 0) AS jumlah_finish_good,
          it.duration_time AS total_ideal_time_qc,
          GREATEST(
            j.jumlah_tiapts - COALESCE(p.jumlah_tunggu_qc,0),
            0
          ) AS jumlah_kekurangan,
          CASE
            WHEN 
              COALESCE(p.jumlah_tunggu_qc,0) = j.jumlah_tiapts
              AND j.trainset = p.trainset
            THEN 'Tepat Waktu'
            WHEN 
              COALESCE(p.jumlah_tunggu_qc,0) <> j.jumlah_tiapts
              AND CURRENT_DATE() > j.tanggal_selesai
            THEN 'Terlambat / Tidak Tercatat'
            WHEN 
              CURRENT_DATE() BETWEEN 
                DATE_SUB(j.tanggal_selesai, INTERVAL 3 DAY)
                AND j.tanggal_selesai
            THEN CONCAT('Kurang ', DATEDIFF(j.tanggal_selesai, CURRENT_DATE()), ' Hari')
            WHEN 
              MONTH(j.tanggal_selesai) <> MONTH(CURRENT_DATE())
              OR YEAR(j.tanggal_selesai) <> YEAR(CURRENT_DATE())
            THEN 'Waiting List'
            ELSE 'On Progress'
          END AS status
        FROM jadwal AS j
        LEFT JOIN (
          SELECT 
            id_product,
            trainset,
            COUNT(DISTINCT CASE WHEN status = 'Tunggu QC' THEN id_perproduct END) AS jumlah_tunggu_qc,
            COUNT(DISTINCT CASE WHEN status = 'Finish Good' THEN id_perproduct END) AS jumlah_finish_good,
            MAX(start_actual) AS last_progress
          FROM ${progressTable}
          WHERE MONTH(start_actual) = MONTH(CURRENT_DATE()) AND YEAR(start_actual) = YEAR(CURRENT_DATE())
          GROUP BY id_product, trainset
        ) p ON j.id_product = p.id_product AND j.trainset = p.trainset
        LEFT JOIN ideal_time it ON j.id_product = it.id_product AND it.process_name = 'total_production_qc'
        WHERE j.line = ${lineParam}
        ORDER BY j.tanggal_mulai ASC;
      `);
    }

    const rows = parseRowResult(result);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Failed to fetch jadwal:", error);
    return NextResponse.json({ rows: [], error: "Failed to fetch jadwal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeScheduleMutation(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const payload = normalizePayload(body);
    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO jadwal0
        (id_product, product_name, sub_output, proses_produk, project, trainset, jumlah_tiapts, total_personil, operator_assigned1, operator_assigned2, operator_assigned3, operator_assigned4, line, workshop, tanggal_mulai, tanggal_selesai)
      VALUES
        (${payload.id_product}, ${payload.product_name}, ${payload.sub_output}, ${payload.proses_produk}, ${payload.project}, ${payload.trainset}, ${payload.jumlah_tiapts}, ${payload.total_personil}, ${payload.operator_assigned1}, ${payload.operator_assigned2}, ${payload.operator_assigned3}, ${payload.operator_assigned4}, ${payload.line}, ${payload.workshop}, ${payload.tanggal_mulai}, ${payload.tanggal_selesai})
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to insert jadwal:", error);
    return NextResponse.json({ error: "Failed to insert jadwal" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorizeScheduleMutation(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const key = normalizeKey(body?.key);
    const payload = normalizePayload(body?.data);
    if (!key || !payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // If id_jadwal provided, update by id; otherwise fallback to composite key for compatibility
    if (key.id_jadwal && Number.isFinite(Number(key.id_jadwal))) {
      await db.execute(sql`
        UPDATE jadwal
        SET
          id_product = ${payload.id_product},
          product_name = ${payload.product_name},
          sub_output = ${payload.sub_output},
          proses_produk = ${payload.proses_produk},
          project = ${payload.project},
          trainset = ${payload.trainset},
          jumlah_tiapts = ${payload.jumlah_tiapts},
          total_personil = ${payload.total_personil},
          operator_assigned1 = ${payload.operator_assigned1},
          operator_assigned2 = ${payload.operator_assigned2},
          operator_assigned3 = ${payload.operator_assigned3},
          operator_assigned4 = ${payload.operator_assigned4},
          line = ${payload.line},
          workshop = ${payload.workshop},
          tanggal_mulai = ${payload.tanggal_mulai},
          tanggal_selesai = ${payload.tanggal_selesai}
        WHERE id_jadwal = ${Number(key.id_jadwal)}
      `);
    } else {
      await db.execute(sql`
        UPDATE jadwal
        SET
          id_product = ${payload.id_product},
          product_name = ${payload.product_name},
          sub_output = ${payload.sub_output},
          proses_produk = ${payload.proses_produk},
          project = ${payload.project},
          trainset = ${payload.trainset},
          jumlah_tiapts = ${payload.jumlah_tiapts},
          total_personil = ${payload.total_personil},
          operator_assigned1 = ${payload.operator_assigned1},
          operator_assigned2 = ${payload.operator_assigned2},
          operator_assigned3 = ${payload.operator_assigned3},
          operator_assigned4 = ${payload.operator_assigned4},
          line = ${payload.line},
          workshop = ${payload.workshop},
          tanggal_mulai = ${payload.tanggal_mulai},
          tanggal_selesai = ${payload.tanggal_selesai}
        WHERE id_product = ${key.id_product}
          AND product_name = ${key.product_name}
          AND trainset = ${key.trainset}
      `);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update jadwal:", error);
    return NextResponse.json({ error: "Failed to update jadwal" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authorizeScheduleMutation(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const key = normalizeKey(body);
    if (!key) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (key.id_jadwal && Number.isFinite(Number(key.id_jadwal))) {
      await db.execute(sql`
        DELETE FROM jadwal
        WHERE id_jadwal = ${Number(key.id_jadwal)}
      `);
    } else {
      await db.execute(sql`
        DELETE FROM jadwal
        WHERE id_product = ${key.id_product}
          AND product_name = ${key.product_name}
          AND trainset = ${key.trainset}
      `);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete jadwal:", error);
    return NextResponse.json({ error: "Failed to delete jadwal" }, { status: 500 });
  }
}
