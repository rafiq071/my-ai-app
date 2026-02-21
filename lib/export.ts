/**
 * Project Export Utilities
 * Export projects as ZIP files
 */

import JSZip from 'jszip'
import type { FileNode } from './store'

export interface ExportOptions {
  includeNodeModules?: boolean
  includeGitignore?: boolean
  includeReadme?: boolean
}

/**
 * Export project as ZIP file
 */
export async function exportProject(
  projectName: string,
  files: FileNode[],
  options: ExportOptions = {}
): Promise<Blob> {
  const zip = new JSZip()

  // Add all project files
  for (const file of files) {
    if (file.type === 'file') {
      zip.file(file.path, file.content)
    }
  }

  // Add package.json if not present
  if (!files.some(f => f.path === 'package.json')) {
    const packageJson = generatePackageJson(projectName)
    zip.file('package.json', JSON.stringify(packageJson, null, 2))
  }

  // Add .gitignore if requested
  if (options.includeGitignore && !files.some(f => f.path === '.gitignore')) {
    const gitignore = generateGitignore()
    zip.file('.gitignore', gitignore)
  }

  // Add README if requested
  if (options.includeReadme && !files.some(f => f.path === 'README.md')) {
    const readme = generateReadme(projectName)
    zip.file('README.md', readme)
  }

  // Add TypeScript config if not present
  if (!files.some(f => f.path === 'tsconfig.json')) {
    const tsconfig = generateTsconfig()
    zip.file('tsconfig.json', JSON.stringify(tsconfig, null, 2))
  }

  // Add Tailwind config if not present
  if (!files.some(f => f.path === 'tailwind.config.js')) {
    const tailwindConfig = generateTailwindConfig()
    zip.file('tailwind.config.js', tailwindConfig)
  }

  // Add PostCSS config if not present
  if (!files.some(f => f.path === 'postcss.config.js')) {
    const postcssConfig = generatePostcssConfig()
    zip.file('postcss.config.js', postcssConfig)
  }

  // Add Next.js config if not present
  if (!files.some(f => f.path === 'next.config.js')) {
    const nextConfig = generateNextConfig()
    zip.file('next.config.js', nextConfig)
  }

  // Generate ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' })
  return blob
}

/**
 * Download ZIP file
 */
export function downloadZip(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate package.json
 */
function generatePackageJson(projectName: string) {
  return {
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '16.1.6',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^18',
      '@types/react-dom': '^18',
      autoprefixer: '^10.0.1',
      postcss: '^8',
      tailwindcss: '^3.3.0',
      typescript: '^5',
    },
  }
}

/**
 * Generate .gitignore
 */
function generateGitignore() {
  return `# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
`
}

/**
 * Generate README
 */
function generateReadme(projectName: string) {
  return `# ${projectName}

This project was generated with [Lovable Clone](https://lovable-clone.com).

## Getting Started

First, install dependencies:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Library:** React 18

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
`
}

/**
 * Generate tsconfig.json
 */
function generateTsconfig() {
  return {
    compilerOptions: {
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
      plugins: [
        {
          name: 'next',
        },
      ],
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }
}

/**
 * Generate tailwind.config.js
 */
function generateTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */
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
}

/**
 * Generate postcss.config.js
 */
function generatePostcssConfig() {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
}

/**
 * Generate next.config.js
 */
function generateNextConfig() {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`
}
