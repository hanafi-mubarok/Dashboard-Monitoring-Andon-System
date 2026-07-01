import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await req.json();

    await db.execute(sql`
      UPDATE master_project
      SET
        no_po = ${body.no_po ?? null},
        project_name = ${body.project_name ?? null},
        client_name = ${body.client_name ?? null},
        klasifikasi = ${body.klasifikasi ?? null},
        qty = ${body.qty ?? null},
        satuan = ${body.satuan ?? null},
        batch = ${body.batch ?? null},
        start_date = ${body.start_date ?? null},
        delivery_date = ${body.delivery_date ?? null},
        status = ${body.status ?? null},
        is_active = ${body.is_active ?? '1'}
      WHERE id = ${numericId}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/master-project/[id] error', error);
    return NextResponse.json({ error: 'Gagal update data project' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM master_project
      WHERE id = ${numericId}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/master-project/[id] error', error);
    return NextResponse.json({ error: 'Gagal hapus data project' }, { status: 500 });
  }
}
