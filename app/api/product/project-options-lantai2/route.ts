import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT project_name
      FROM production_progress_protrack
      WHERE line = 'Lantai 2'
        AND workshop = 'Candisewu'
      ORDER BY project_name ASC;
    `);

    const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
    const data = (rows || [])
      .map((r: any) => (r?.project_name ?? '').toString().trim())
      .filter((v: string) => v.length > 0);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch project options Lantai 2:', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
