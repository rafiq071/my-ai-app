import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  getProjectByIdAndUser,
  createProjectWithId,
  updateProjectAndFiles,
} from '@/lib/project-db-server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const project = await getProjectByIdAndUser(id, session.user.id)
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(project)
  } catch (e) {
    console.error('GET /api/project/[id]:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body: { name?: string; description?: string; files?: { path: string; content: string; type: string }[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = body.name ?? ''
  const description = body.description ?? ''
  const files = Array.isArray(body.files) ? body.files : []

  try {
    const project = await getProjectByIdAndUser(id, session.user.id)
    if (project) {
      const updated = await updateProjectAndFiles(
        id,
        session.user.id,
        name,
        description,
        files as { path: string; content: string; type: 'file' | 'directory' }[]
      )
      return NextResponse.json(updated)
    }
    const created = await createProjectWithId(
      id,
      session.user.id,
      name,
      description,
      files as { path: string; content: string; type: 'file' | 'directory' }[]
    )
    return NextResponse.json(created)
  } catch (e) {
    console.error('PUT /api/project/[id]:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
