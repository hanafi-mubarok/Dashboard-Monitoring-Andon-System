import { NextResponse } from 'next/server';
import {
  getMissingSubProcessLantai1,
  getMissingSubProcessLantai2,
  getMissingSubProcessSukosari,
} from '@/lib/queries/production-progress-protrack';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id_product = url.searchParams.get('id_product');
    const trainset = url.searchParams.get('trainset') || '';
    const lineParam = url.searchParams.get('line');
    // if line is omitted or empty, treat as null (Sukosari)
    const line = lineParam == null || lineParam === '' ? null : (lineParam === 'Lantai 2' ? 'Lantai 2' : 'Lantai 1');

    if (!id_product) {
      return NextResponse.json({ error: 'Missing id_product' }, { status: 400 });
    }

    //console.log('[missing-subprocess] Fetching for id_product:', id_product, 'trainset:', trainset, 'line:', line);
    let rows;
    if (line === 'Lantai 2') {
      rows = await getMissingSubProcessLantai2(id_product, trainset);
    } else if (line === 'Lantai 1') {
      rows = await getMissingSubProcessLantai1(id_product, trainset);
    } else {
      // no line provided -> use Sukosari logic
      rows = await getMissingSubProcessSukosari(id_product, trainset);
    }
    //console.log('[missing-subprocess] Result rows:', rows.length, rows);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('missing-subprocess API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
