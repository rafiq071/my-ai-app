import { NextRequest, NextResponse } from 'next/server'
import {
  getTemplates,
  getTemplate,
  searchTemplates,
  createTemplate,
  incrementTemplateUsage,
  getMyTemplates,
  deleteTemplate,
  getTemplateCategories,
} from '@/lib/templates'
import { getCurrentUser } from '@/lib/auth'

// GET /api/templates - Get all templates or single template
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const my = searchParams.get('my')
    const categories = searchParams.get('categories')

    // Get categories
    if (categories === 'true') {
      const cats = await getTemplateCategories()
      return NextResponse.json({ success: true, categories: cats })
    }

    // Get user's templates
    if (my === 'true') {
      const user = await getCurrentUser()
      const templates = await getMyTemplates(user.id)
      return NextResponse.json({ success: true, templates })
    }

    // Get single template
    if (id) {
      const template = await getTemplate(id)
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, template })
    }

    // Search templates
    if (search) {
      const templates = await searchTemplates(search)
      return NextResponse.json({ success: true, templates })
    }

    // Get all templates (optionally filtered by category)
    const templates = await getTemplates(category || undefined)
    return NextResponse.json({ success: true, templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create new template OR use existing template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Use template (create project from template)
    if (action === 'use') {
      const { templateId } = body

      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        )
      }

      const template = await getTemplate(templateId)
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      // Increment usage count
      await incrementTemplateUsage(templateId)

      // Return template data for project creation
      return NextResponse.json({
        success: true,
        template,
      })
    }

    // Create template from project
    const user = await getCurrentUser()
    const { name, description, category, tags, files, isPublic } = body

    if (!name || !description || !category || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Name, description, category, and files are required' },
        { status: 400 }
      )
    }

    const template = await createTemplate(
      name,
      description,
      category,
      tags || [],
      files,
      user.id,
      isPublic !== false
    )

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    console.error('Error with template:', error)
    return NextResponse.json(
      {
        error: 'Template operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/templates - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership (RLS will also check this)
    const template = await getTemplate(id)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (template.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this template' },
        { status: 403 }
      )
    }

    await deleteTemplate(id)

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
