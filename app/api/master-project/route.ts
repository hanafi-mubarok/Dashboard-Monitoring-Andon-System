import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.project_name || !body.client_name) {
      return NextResponse.json({ error: 'Nama project dan client wajib diisi' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO master_project (
        no_po, project_name, client_name, klasifikasi, qty, satuan, batch, start_date, delivery_date, status, is_active
      ) VALUES (
        ${body.no_po ?? null}, ${body.project_name ?? null}, ${body.client_name ?? null}, ${body.klasifikasi ?? null}, ${body.qty ?? null}, ${body.satuan ?? null}, ${body.batch ?? null}, ${body.start_date ?? null}, ${body.delivery_date ?? null}, ${body.status ?? null}, ${body.is_active ?? '1'}
      )
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/master-project error', error);
    return NextResponse.json({ error: 'Gagal membuat project' }, { status: 500 });
  }
}
