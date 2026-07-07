import { getProductPercentageTiron } from '@/lib/queries/production-progress-protrack';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const workshop = url.searchParams.get('workshop') || 'Tiron';
    const project = url.searchParams.get('project_name') || url.searchParams.get('project') || undefined;
    const trainset = url.searchParams.get('trainset') || undefined;

    const data = await getProductPercentageTiron(workshop, project, trainset);
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch product percentage tiron:', error);
    return Response.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}
