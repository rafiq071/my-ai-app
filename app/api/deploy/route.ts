import { NextRequest, NextResponse } from 'next/server'
import {
  createDeployment,
  prepareDeploymentFiles,
  addNextJsConfig,
  DeploymentConfig,
} from '@/lib/vercel'
import { requireAuth } from '@/lib/auth'
import { assertBetaAccess } from '@/lib/beta-access'
import { rateLimit } from '@/lib/rate-limit'
import { getFeatureFlag } from '@/lib/feature-flags'

const RL_WINDOW_MS = Number(process.env.RL_DEPLOY_WINDOW_MS || 60_000)
const RL_MAX = Number(process.env.RL_DEPLOY_MAX || 2)

export async function POST(request: NextRequest) {
  try {
    // Auth + beta access
    const user = await requireAuth().catch(() => null)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const access = await assertBetaAccess(request, (user as any).email || null)
    if (!access.ok) return NextResponse.json({ error: 'Invite required' }, { status: 403 })

    // Kill-switch for deployments (by default OFF)
    const deployEnabled = await getFeatureFlag('deploy_enabled')
    if (!deployEnabled) {
      return NextResponse.json({ error: 'Deploy is disabled in public beta' }, { status: 503 })
    }

    // Basic rate limit
    const rl = await rateLimit(request, { windowMs: RL_WINDOW_MS, max: RL_MAX })
    if (!rl.ok) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfterSeconds: retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const { projectName, files } = await request.json()

    // Validate input
    if (!projectName || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Invalid request: projectName and files are required' },
        { status: 400 }
      )
    }

    // Get Vercel token from environment
    const vercelToken = process.env.VERCEL_TOKEN

    if (!vercelToken) {
      return NextResponse.json(
        {
          error: 'Vercel token not configured',
          message: 'Please set VERCEL_TOKEN in your environment variables',
        },
        { status: 500 }
      )
    }

    // Prepare files for deployment
    let deploymentFiles = prepareDeploymentFiles(files)
    
    // Add Next.js config files
    deploymentFiles = addNextJsConfig(deploymentFiles)

    // Create deployment configuration
    const deploymentConfig: DeploymentConfig = {
      name: projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 63), // Vercel name limits
      files: deploymentFiles,
      projectSettings: {
        framework: 'nextjs',
        buildCommand: 'next build',
        outputDirectory: '.next',
        installCommand: 'npm install',
        devCommand: 'next dev',
      },
    }

    console.log(
      `Starting deployment for ${deploymentConfig.name} with ${deploymentFiles.length} files`
    )

    // Create deployment on Vercel
    const deployment = await createDeployment(deploymentConfig, vercelToken)

    console.log(`Deployment created: ${deployment.id}`)
    console.log(`URL: https://${deployment.url}`)

    // Return deployment info
    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        url: `https://${deployment.url}`,
        previewUrl: `https://${deployment.url}`,
        productionUrl: `https://${deploymentConfig.name}.vercel.app`,
        status: deployment.readyState,
        name: deploymentConfig.name,
        createdAt: new Date(deployment.createdAt).toISOString(),
      },
    })
  } catch (error) {
    console.error('Deployment error:', error)

    return NextResponse.json(
      {
        error: 'Deployment failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details:
          error instanceof Error
            ? error.stack
            : 'An unexpected error occurred during deployment',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check deployment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deploymentId = searchParams.get('deploymentId')

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'deploymentId is required' },
        { status: 400 }
      )
    }

    const vercelToken = process.env.VERCEL_TOKEN

    if (!vercelToken) {
      return NextResponse.json(
        { error: 'Vercel token not configured' },
        { status: 500 }
      )
    }

    // Import here to avoid issues
    const { getDeploymentStatus } = await import('@/lib/vercel')
    const status = await getDeploymentStatus(deploymentId, vercelToken)

    return NextResponse.json({
      success: true,
      status: {
        id: status.id,
        url: `https://${status.url}`,
        state: status.readyState,
        createdAt: new Date(status.createdAt).toISOString(),
        readyAt: status.readyAt
          ? new Date(status.readyAt).toISOString()
          : null,
        error: status.error,
      },
    })
  } catch (error) {
    console.error('Status check error:', error)

    return NextResponse.json(
      {
        error: 'Failed to check deployment status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
