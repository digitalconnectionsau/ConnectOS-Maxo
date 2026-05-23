import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject, deleteProject, getProjectStats } from '@/lib/projects';
import { listTimeEntries } from '@/lib/time-tracking';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const project = await getProject(projectId);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [stats, entries] = await Promise.all([
    getProjectStats(projectId),
    listTimeEntries({ project_id: projectId, limit: 100 }),
  ]);
  return NextResponse.json({ project, stats, entries });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const project = await updateProject(projectId, body);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ project });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await deleteProject(projectId);
  return NextResponse.json({ ok: true });
}
