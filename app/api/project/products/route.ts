import { NextRequest, NextResponse } from 'next/server';
import { getProductsbyProjects } from '@/lib/queries/master_project';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const project = searchParams.get('project') || undefined;
    const trainset = searchParams.get('trainset') || undefined;

    if (!project) {
      return NextResponse.json({ success: false, error: 'project parameter is required' }, { status: 400 });
    }

    if (!trainset) {
      return NextResponse.json({ success: false, error: 'trainset parameter is required' }, { status: 400 });
    }

    const trainsetNumber = Number(trainset);
    if (Number.isNaN(trainsetNumber)) {
      return NextResponse.json({ success: false, error: 'trainset must be a valid number' }, { status: 400 });
    }

    const data = await getProductsbyProjects(project, trainsetNumber);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching products by project:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products by project' }, { status: 500 });
  }
}
