import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workshop = searchParams.get('workshop') || '';
    const result = await db.execute(sql`SELECT COUNT(*) as cnt FROM production_progress_protrack WHERE workshop = ${workshop}`);
    const rows = Array.isArray(result[0]) ? result[0] : result;
    const cnt = rows && rows[0] ? Number(rows[0].cnt || 0) : 0;
    return NextResponse.json({ success: true, workshop, count: cnt });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
