/**
 * Runtime Bundler - Transpiles and bundles React code in the browser
 * This is the CORE of the preview engine
 */

import * as Babel from '@babel/standalone'
import { transformImports } from './package-resolver'

export interface BundleFile {
  path: string
  content: string
  type: 'file' | 'directory'
}

export interface BundleResult {
  code: string
  error?: string
}

/**
 * Transpile TypeScript/JSX to JavaScript
 */
export function transpileCode(code: string, filename: string): string {
  try {
    // STEP 1: Transform npm package imports to CDN URLs
    const transformedCode = transformImports(code)
    
    // STEP 2: Transpile TypeScript/JSX to JavaScript
    const result = Babel.transform(transformedCode, {
      filename,
      presets: [
        'react',
        ['typescript', { isTSX: true, allExtensions: true }],
      ],
      plugins: [],
    })

    return result.code || ''
  } catch (error) {
    console.error('Transpilation error:', error)
    throw error
  }
}

/**
 * Resolve imports and create a module map
 */
export function createModuleMap(files: BundleFile[]): Record<string, string> {
  const modules: Record<string, string> = {}

  for (const file of files) {
    if (file.type === 'file') {
      try {
        // Transpile the code
        const transpiledCode = transpileCode(file.content, file.path)
        
        // Wrap in a module function
        const wrappedCode = `
(function(exports, require, module, __filename, __dirname) {
${transpiledCode}
})
        `.trim()
        
        modules[file.path] = wrappedCode
      } catch (error) {
        console.error(`Error processing ${file.path}:`, error)
        modules[file.path] = `
(function(exports, require, module) {
  throw new Error('Compilation error in ${file.path}');
})
        `.trim()
      }
    }
  }

  return modules
}

/**
 * Resolve module path (handle relative imports)
 */
export function resolveModulePath(currentPath: string, importPath: string): string {
  // Handle relative imports
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const currentDir = currentPath.split('/').slice(0, -1).join('/')
    const resolvedPath = importPath.split('/').reduce((acc, part) => {
      if (part === '..') {
        return acc.split('/').slice(0, -1).join('/')
      }
      if (part === '.') {
        return acc
      }
      return acc + '/' + part
    }, currentDir)
    
    // Try common extensions
    const extensions = ['', '.tsx', '.ts', '.jsx', '.js']
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext
      if (fullPath) return fullPath
    }
    
    return resolvedPath
  }

  // Handle @ imports (alias for root)
  if (importPath.startsWith('@/')) {
    return importPath.replace('@/', '')
  }

  // External packages (React, etc.) - will be provided globally
  return importPath
}

/**
 * Create a require function for the module system
 */
export function createRequire(
  modules: Record<string, string>,
  currentPath: string
): (path: string) => any {
  const cache: Record<string, any> = {}

  return function require(importPath: string): any {
    // Handle React and external libraries
    if (importPath === 'react') {
      return (window as any).React
    }
    if (importPath === 'react-dom' || importPath === 'react-dom/client') {
      return (window as any).ReactDOM
    }

    // Resolve the module path
    const modulePath = resolveModulePath(currentPath, importPath)

    // Check cache
    if (cache[modulePath]) {
      return cache[modulePath].exports
    }

    // Get module code
    const moduleCode = modules[modulePath]
    if (!moduleCode) {
      throw new Error(`Module not found: ${importPath} (resolved to ${modulePath})`)
    }

    // Create module object
    const module = { exports: {} }
    const exports = module.exports

    // Execute module
    try {
      const moduleFunction = eval(moduleCode)
      moduleFunction(
        exports,
        createRequire(modules, modulePath),
        module,
        modulePath,
        modulePath.split('/').slice(0, -1).join('/')
      )
    } catch (error) {
      console.error(`Error executing module ${modulePath}:`, error)
      throw error
    }

    // Cache and return
    cache[modulePath] = module
    return module.exports
  }
}

/**
 * Bundle all files and create executable code
 */
export async function bundleProject(files: BundleFile[]): Promise<BundleResult> {
  try {
    // Create module map
    const modules = createModuleMap(files)

    // Find entry point (app/page.tsx or similar)
    const entryPoints = ['app/page.tsx', 'page.tsx', 'App.tsx', 'app.tsx']
    let entryPoint = entryPoints.find(ep => modules[ep])

    if (!entryPoint) {
      // Try to find any .tsx file as entry
      entryPoint = Object.keys(modules).find(path => path.endsWith('.tsx'))
    }

    if (!entryPoint) {
      throw new Error('No entry point found (looking for app/page.tsx)')
    }

    // Create the bundle code
    const bundleCode = `
(function() {
  // Module registry
  const modules = ${JSON.stringify(modules)};
  
  // Require function factory
  function createRequire(currentPath) {
    const cache = {};
    
    return function require(importPath) {
      // External libraries
      if (importPath === 'react') return window.React;
      if (importPath === 'react-dom' || importPath === 'react-dom/client') return window.ReactDOM;
      
      // Resolve path
      let modulePath = importPath;
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const currentDir = currentPath.split('/').slice(0, -1).join('/');
        modulePath = currentDir + '/' + importPath.replace('./', '');
      }
      if (importPath.startsWith('@/')) {
        modulePath = importPath.replace('@/', '');
      }
      
      // Try extensions
      const extensions = ['', '.tsx', '.ts', '.jsx', '.js'];
      let foundPath = null;
      for (const ext of extensions) {
        if (modules[modulePath + ext]) {
          foundPath = modulePath + ext;
          break;
        }
      }
      
      if (!foundPath && modules[modulePath]) {
        foundPath = modulePath;
      }
      
      if (!foundPath) {
        throw new Error('Module not found: ' + importPath);
      }
      
      modulePath = foundPath;
      
      // Check cache
      if (cache[modulePath]) {
        return cache[modulePath].exports;
      }
      
      // Execute module
      const module = { exports: {} };
      const exports = module.exports;
      const moduleCode = modules[modulePath];
      
      try {
        const fn = eval(moduleCode);
        fn(exports, createRequire(modulePath), module, modulePath, modulePath.split('/').slice(0, -1).join('/'));
      } catch (error) {
        console.error('Error in module ' + modulePath + ':', error);
        throw error;
      }
      
      cache[modulePath] = module;
      return module.exports;
    };
  }
  
  // Load entry point and render
  try {
    const entryModule = createRequire('${entryPoint}')('${entryPoint}');
    const Component = entryModule.default || entryModule;
    
    // Render
    const root = window.ReactDOM.createRoot(document.getElementById('root'));
    root.render(window.React.createElement(Component));
  } catch (error) {
    console.error('Bundle execution error:', error);
    document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px;"><h2>Error</h2><pre>' + error.message + '</pre></div>';
  }
})();
    `

    return {
      code: bundleCode,
    }
  } catch (error) {
    return {
      code: '',
      error: error instanceof Error ? error.message : 'Unknown bundling error',
    }
  }
}
