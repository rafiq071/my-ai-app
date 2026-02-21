/**
 * Vercel API Client
 * Handles project deployment to Vercel platform
 */

export interface DeploymentFile {
  file: string // path
  data: string // base64 encoded content
}

export interface DeploymentConfig {
  name: string
  files: DeploymentFile[]
  projectSettings?: {
    framework?: 'nextjs' | 'react' | 'vue' | 'static'
    buildCommand?: string
    outputDirectory?: string
    installCommand?: string
    devCommand?: string
  }
  env?: Record<string, string>
}

export interface DeploymentResponse {
  id: string
  url: string
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED'
  name: string
  createdAt: number
  buildingAt?: number
  readyAt?: number
  error?: {
    message: string
    code: string
  }
}

export interface BuildLog {
  text: string
  timestamp: number
  type: 'stdout' | 'stderr'
}

/**
 * Create a new deployment on Vercel
 */
export async function createDeployment(
  config: DeploymentConfig,
  token: string
): Promise<DeploymentResponse> {
  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: config.name,
      files: config.files,
      projectSettings: config.projectSettings,
      target: 'production',
      env: config.env,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Vercel deployment failed: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return {
    id: data.id,
    url: data.url,
    readyState: data.readyState,
    name: data.name,
    createdAt: data.createdAt,
    buildingAt: data.buildingAt,
    readyAt: data.readyAt,
  }
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(
  deploymentId: string,
  token: string
): Promise<DeploymentResponse> {
  const response = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get deployment status')
  }

  const data = await response.json()
  return {
    id: data.id,
    url: data.url,
    readyState: data.readyState,
    name: data.name,
    createdAt: data.createdAt,
    buildingAt: data.buildingAt,
    readyAt: data.readyAt,
    error: data.error,
  }
}

/**
 * Get deployment build logs
 */
export async function getDeploymentLogs(
  deploymentId: string,
  token: string
): Promise<BuildLog[]> {
  const response = await fetch(
    `https://api.vercel.com/v2/deployments/${deploymentId}/events`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get deployment logs')
  }

  const logs: BuildLog[] = []
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) return logs

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      const lines = text.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const event = JSON.parse(line)
          if (event.type === 'stdout' || event.type === 'stderr') {
            logs.push({
              text: event.payload.text,
              timestamp: event.payload.date || Date.now(),
              type: event.type,
            })
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return logs
}

/**
 * Cancel a deployment
 */
export async function cancelDeployment(
  deploymentId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `https://api.vercel.com/v12/deployments/${deploymentId}/cancel`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to cancel deployment')
  }
}

/**
 * Prepare files for Vercel deployment
 * Converts project files to Vercel format
 */
export function prepareDeploymentFiles(
  files: Array<{ path: string; content: string; type: string }>
): DeploymentFile[] {
  return files
    .filter(f => f.type === 'file')
    .map(file => ({
      file: file.path,
      data: Buffer.from(file.content).toString('base64'),
    }))
}

/**
 * Add Next.js configuration files
 */
export function addNextJsConfig(files: DeploymentFile[]): DeploymentFile[] {
  const hasPackageJson = files.some(f => f.file === 'package.json')
  const hasNextConfig = files.some(f => f.file === 'next.config.js')

  const newFiles = [...files]

  // Add package.json if missing
  if (!hasPackageJson) {
    const packageJson = {
      name: 'generated-app',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '16.1.6',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^19.2.14',
        '@types/react-dom': '^18.2.0',
        autoprefixer: '^10.4.16',
        postcss: '^8.4.32',
        tailwindcss: '^3.4.0',
        typescript: '^5.9.3',
      },
    }

    newFiles.push({
      file: 'package.json',
      data: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
    })
  }

  // Add next.config.js if missing
  if (!hasNextConfig) {
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
`
    newFiles.push({
      file: 'next.config.js',
      data: Buffer.from(nextConfig).toString('base64'),
    })
  }

  // Add tsconfig.json if missing
  const hasTsConfig = files.some(f => f.file === 'tsconfig.json')
  if (!hasTsConfig) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    }

    newFiles.push({
      file: 'tsconfig.json',
      data: Buffer.from(JSON.stringify(tsConfig, null, 2)).toString('base64'),
    })
  }

  // Add tailwind.config.js
  const hasTailwind = files.some(f => f.file === 'tailwind.config.js')
  if (!hasTailwind) {
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
    newFiles.push({
      file: 'tailwind.config.js',
      data: Buffer.from(tailwindConfig).toString('base64'),
    })
  }

  // Add postcss.config.js
  const hasPostcss = files.some(f => f.file === 'postcss.config.js')
  if (!hasPostcss) {
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
    newFiles.push({
      file: 'postcss.config.js',
      data: Buffer.from(postcssConfig).toString('base64'),
    })
  }

  return newFiles
}
