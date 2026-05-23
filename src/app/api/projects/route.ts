import { NextRequest, NextResponse } from 'next/server';
import { listProjects, createProject } from '@/lib/projects';
import { getSessionUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projects = await listProjects({
    status: url.searchParams.get('status') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const project = await createProject(body, getSessionUserId(req));
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
