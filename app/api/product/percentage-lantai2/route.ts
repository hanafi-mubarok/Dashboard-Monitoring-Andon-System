import { NextRequest } from 'next/server';
import { getProductPercentageLantai2 } from '@/lib/queries/production-progress-protrack';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const project = searchParams.get('project_name') ?? undefined;
    const trainset = searchParams.get('trainset') ?? undefined;
    const data = await getProductPercentageLantai2(project, trainset);
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch product percentage data:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
