import { NextRequest, NextResponse } from 'next/server';
import { getProductSummaryLantai1 } from '@/lib/queries/production-progress-protrack';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trainset = searchParams.get('trainset');
    const project = searchParams.get('project_name') ?? undefined;

    if (!trainset) {
      return NextResponse.json(
        { success: false, error: 'Trainset parameter is required' },
        { status: 400 }
      );
    }

    const data = await getProductSummaryLantai1(trainset, project);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching product summary Lantai 1:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product summary Lantai 1' },
      { status: 500 }
    );
  }
}

