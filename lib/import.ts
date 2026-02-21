/**
 * Project Import Utilities
 * Import projects from ZIP files
 */

import JSZip from 'jszip'
import type { FileNode } from './store'

export interface ImportResult {
  name: string
  description: string
  files: FileNode[]
  errors: string[]
}

/**
 * Import project from ZIP file
 */
export async function importProject(file: File): Promise<ImportResult> {
  const errors: string[] = []
  const files: FileNode[] = []

  try {
    // Load ZIP
    const zip = await JSZip.loadAsync(file)

    // Extract project name from ZIP filename or package.json
    let projectName = file.name.replace('.zip', '')
    let description = ''

    // Check for package.json
    const packageJsonFile = zip.file('package.json')
    if (packageJsonFile) {
      try {
        const content = await packageJsonFile.async('string')
        const packageJson = JSON.parse(content)
        if (packageJson.name) {
          projectName = packageJson.name
        }
        if (packageJson.description) {
          description = packageJson.description
        }
      } catch (error) {
        errors.push('Could not parse package.json')
      }
    }

    // Extract all files
    const filePromises: Promise<void>[] = []
    
    zip.forEach((relativePath, zipEntry) => {
      // Skip directories
      if (zipEntry.dir) return

      // Skip common files we don't need
      if (shouldSkipFile(relativePath)) return

      filePromises.push(
        (async () => {
          try {
            const content = await zipEntry.async('string')
            
            files.push({
              name: relativePath.split('/').pop() || relativePath,
              path: relativePath,
              content,
              type: 'file',
            })
          } catch (error) {
            errors.push(`Failed to read file: ${relativePath}`)
          }
        })()
      )
    })

    await Promise.all(filePromises)

    // Validate project structure
    const validation = validateProjectStructure(files)
    if (validation.errors.length > 0) {
      errors.push(...validation.errors)
    }

    // If no critical errors, consider it successful
    if (files.length === 0) {
      throw new Error('No valid files found in ZIP')
    }

    return {
      name: projectName,
      description,
      files,
      errors,
    }
  } catch (error) {
    throw new Error(
      `Failed to import project: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Check if file should be skipped during import
 */
function shouldSkipFile(path: string): boolean {
  const skipPatterns = [
    'node_modules/',
    '.next/',
    '.git/',
    'dist/',
    'build/',
    'out/',
    '.DS_Store',
    '.env.local',
    '.env.development.local',
    '.env.test.local',
    '.env.production.local',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
  ]

  return skipPatterns.some(pattern => path.includes(pattern))
}

/**
 * Validate project structure
 */
function validateProjectStructure(files: FileNode[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for essential files
  const hasAppFolder = files.some(f => f.path.startsWith('app/'))
  const hasPagesFolder = files.some(f => f.path.startsWith('pages/'))
  
  if (!hasAppFolder && !hasPagesFolder) {
    warnings.push('No app/ or pages/ folder found. This might not be a Next.js project.')
  }

  // Check for layout
  const hasLayout = files.some(f => f.path === 'app/layout.tsx' || f.path === 'app/layout.jsx')
  if (hasAppFolder && !hasLayout) {
    warnings.push('No app/layout.tsx found. Next.js App Router requires a root layout.')
  }

  // Check for page
  const hasPage = files.some(f => f.path === 'app/page.tsx' || f.path === 'app/page.jsx')
  if (hasAppFolder && !hasPage) {
    warnings.push('No app/page.tsx found. At least one page is recommended.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Import project from directory (using File System Access API)
 * Only works in browsers that support it (Chrome, Edge)
 */
export async function importFromDirectory(): Promise<ImportResult | null> {
  try {
    // @ts-ignore - File System Access API
    if (!window.showDirectoryPicker) {
      throw new Error('File System Access API not supported in this browser')
    }

    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker()
    
    const files: FileNode[] = []
    const errors: string[] = []

    // Read directory recursively
    await readDirectory(dirHandle, '', files, errors)

    if (files.length === 0) {
      throw new Error('No files found in directory')
    }

    // Get project name from directory
    const projectName = dirHandle.name

    return {
      name: projectName,
      description: '',
      files,
      errors,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // User cancelled
      return null
    }
    throw error
  }
}

/**
 * Read directory recursively
 */
async function readDirectory(
  dirHandle: any,
  path: string,
  files: FileNode[],
  errors: string[]
) {
  try {
    for await (const entry of dirHandle.values()) {
      const entryPath = path ? `${path}/${entry.name}` : entry.name

      // Skip files/folders we don't want
      if (shouldSkipFile(entryPath)) continue

      if (entry.kind === 'file') {
        try {
          const file = await entry.getFile()
          const content = await file.text()
          
          files.push({
            name: entry.name,
            path: entryPath,
            content,
            type: 'file',
          })
        } catch (error) {
          errors.push(`Failed to read file: ${entryPath}`)
        }
      } else if (entry.kind === 'directory') {
        await readDirectory(entry, entryPath, files, errors)
      }
    }
  } catch (error) {
    errors.push(`Failed to read directory: ${path}`)
  }
}

/**
 * Parse GitHub repository URL
 */
export function parseGitHubUrl(url: string): {
  owner: string
  repo: string
  branch?: string
} | null {
  // Match: github.com/owner/repo or github.com/owner/repo/tree/branch
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/)
  
  if (!match) return null

  return {
    owner: match[1],
    repo: match[2],
    branch: match[3],
  }
}

/**
 * Import from GitHub repository (future feature)
 */
export async function importFromGitHub(url: string): Promise<ImportResult> {
  const parsed = parseGitHubUrl(url)
  
  if (!parsed) {
    throw new Error('Invalid GitHub URL')
  }

  // TODO: Implement GitHub API integration
  throw new Error('GitHub import not yet implemented')
}
