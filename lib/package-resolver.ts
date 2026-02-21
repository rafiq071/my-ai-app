/**
 * NPM Package Resolver
 * Resolves npm packages to CDN URLs for browser usage
 */

// Popular packages with specific CDN URLs
const PACKAGE_OVERRIDES: Record<string, string> = {
  // HTTP clients
  'axios': 'https://cdn.skypack.dev/axios@1.6.0',
  
  // Utilities
  'lodash': 'https://cdn.skypack.dev/lodash@4.17.21',
  'date-fns': 'https://cdn.skypack.dev/date-fns@3.0.0',
  'classnames': 'https://cdn.skypack.dev/classnames@2.3.2',
  'clsx': 'https://cdn.skypack.dev/clsx@2.0.0',
  
  // Icons
  'react-icons': 'https://cdn.skypack.dev/react-icons@4.12.0',
  'lucide-react': 'https://cdn.skypack.dev/lucide-react@0.294.0',
  
  // State management
  'zustand': 'https://cdn.skypack.dev/zustand@4.4.7',
  
  // Forms
  'react-hook-form': 'https://cdn.skypack.dev/react-hook-form@7.48.2',
  
  // Animation
  'framer-motion': 'https://cdn.skypack.dev/framer-motion@10.16.4',
  
  // Charts (already have recharts, add more)
  'd3': 'https://cdn.skypack.dev/d3@7.8.5',
  
  // Utils
  'nanoid': 'https://cdn.skypack.dev/nanoid@5.0.3',
  'uuid': 'https://cdn.skypack.dev/uuid@9.0.1',
}

// CDN providers in order of preference
const CDN_PROVIDERS = [
  'https://cdn.skypack.dev',
  'https://esm.sh',
  'https://cdn.jsdelivr.net/npm',
]

/**
 * Resolve package import to CDN URL
 */
export function resolvePackage(packageName: string, version?: string): string {
  // Check if we have an override
  if (PACKAGE_OVERRIDES[packageName]) {
    return PACKAGE_OVERRIDES[packageName]
  }

  // Build CDN URL
  const versionStr = version || 'latest'
  
  // Try Skypack first (best ESM support)
  return `https://cdn.skypack.dev/${packageName}@${versionStr}`
}

/**
 * Extract package name and version from import statement
 */
export function parseImport(importStatement: string): {
  packageName: string
  version?: string
  path?: string
} | null {
  // Match: import ... from 'package-name'
  // or: import ... from 'package-name/sub/path'
  // or: import ... from 'package-name@version'
  
  const match = importStatement.match(/from\s+['"]([^'"]+)['"]/)
  if (!match) return null

  const fullPath = match[1]

  // Skip relative imports
  if (fullPath.startsWith('.') || fullPath.startsWith('/')) {
    return null
  }

  // Parse scoped packages (@org/package)
  const isScoped = fullPath.startsWith('@')
  
  let packageName: string
  let version: string | undefined
  let path: string | undefined

  if (isScoped) {
    // @org/package or @org/package/path
    const parts = fullPath.split('/')
    packageName = `${parts[0]}/${parts[1]}`
    if (parts.length > 2) {
      path = parts.slice(2).join('/')
    }
  } else {
    // package or package/path
    const parts = fullPath.split('/')
    packageName = parts[0]
    if (parts.length > 1) {
      path = parts.slice(1).join('/')
    }
  }

  // Check for version (package@1.0.0)
  if (packageName.includes('@')) {
    const versionMatch = packageName.match(/(.+)@(.+)/)
    if (versionMatch) {
      packageName = versionMatch[1]
      version = versionMatch[2]
    }
  }

  return { packageName, version, path }
}

/**
 * Transform import statement to use CDN
 */
export function transformImport(importStatement: string): string {
  const parsed = parseImport(importStatement)
  
  if (!parsed) {
    // Not a package import, return as-is
    return importStatement
  }

  const { packageName, version, path } = parsed
  
  // Get CDN URL
  let cdnUrl = resolvePackage(packageName, version)
  
  // Add subpath if present
  if (path) {
    cdnUrl = `${cdnUrl}/${path}`
  }

  // Replace the import path
  return importStatement.replace(
    /from\s+['"]([^'"]+)['"]/,
    `from '${cdnUrl}'`
  )
}

/**
 * Transform all imports in code
 */
export function transformImports(code: string): string {
  // Match all import statements
  const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"][^'"]+['"]/g
  
  return code.replace(importRegex, (match) => {
    try {
      return transformImport(match)
    } catch (error) {
      console.warn('Failed to transform import:', match, error)
      return match
    }
  })
}

/**
 * Get list of supported packages
 */
export function getSupportedPackages(): string[] {
  return Object.keys(PACKAGE_OVERRIDES).sort()
}

/**
 * Check if package is supported
 */
export function isPackageSupported(packageName: string): boolean {
  return packageName in PACKAGE_OVERRIDES
}

/**
 * Preload packages (fetch and cache)
 */
export async function preloadPackage(packageName: string): Promise<void> {
  const url = resolvePackage(packageName)
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load ${packageName}: ${response.statusText}`)
    }
    // Cache will handle storing
  } catch (error) {
    console.error(`Failed to preload ${packageName}:`, error)
  }
}

/**
 * Preload common packages
 */
export async function preloadCommonPackages(): Promise<void> {
  const common = ['axios', 'lodash', 'date-fns', 'classnames']
  
  await Promise.all(
    common.map(pkg => preloadPackage(pkg).catch(err => {
      console.warn(`Failed to preload ${pkg}:`, err)
    }))
  )
}
