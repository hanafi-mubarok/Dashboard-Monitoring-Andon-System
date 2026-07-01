import { NextResponse } from 'next/server';
import { getProductProgressProtrackHistory } from '@/lib/queries/production-progress-protrack';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id_product = url.searchParams.get('id_product');
    const trainset = url.searchParams.get('trainset') || '';
    const lineParam = url.searchParams.get('line');
    const line = lineParam == null || lineParam === '' ? null : (lineParam === 'Lantai 2' ? 'Lantai 2' : 'Lantai 1');

    if (!id_product) {
      return NextResponse.json({ error: 'Missing id_product' }, { status: 400 });
    }

    const rows = await getProductProgressProtrackHistory(id_product, trainset, line as any);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('protrack-history API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
