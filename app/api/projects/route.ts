import { NextRequest, NextResponse } from 'next/server'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  updateProjectFiles,
  deleteProject,
} from '@/lib/database'

// GET /api/projects - Get all projects or single project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')

    if (projectId) {
      // Get single project
      const project = await getProject(projectId)
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, project })
    }

    // Get all projects
    const projects = await getProjects()
    return NextResponse.json({ success: true, projects })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const name = (error as any)?.name
    if (
      name === 'AuthSessionMissingError' ||
      msg.includes('Auth session missing') ||
      msg.includes('Not authenticated')
    ) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Auth session missing' },
        { status: 401 }
      )
    }
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch projects',
        message: msg || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const { name, description, files } = await request.json()

    if (!name || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Name and files are required' },
        { status: 400 }
      )
    }

    const project = await createProject(name, description || '', files)

    return NextResponse.json({
      success: true,
      project,
    })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      {
        error: 'Failed to create project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/projects - Update project
export async function PATCH(request: NextRequest) {
  try {
    const { id, name, description, files } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Update metadata if provided
    if (name !== undefined || description !== undefined) {
      await updateProject(id, { name, description })
    }

    // Update files if provided
    if (files && Array.isArray(files)) {
      await updateProjectFiles(id, files)
    }

    // Fetch updated project
    const project = await getProject(id)

    return NextResponse.json({
      success: true,
      project,
    })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      {
        error: 'Failed to update project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/projects - Delete project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    await deleteProject(id)

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete project',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
