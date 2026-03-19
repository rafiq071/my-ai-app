import type OpenAI from "openai";
import type { GeneratedFile } from "./types";

/**
 * Rule-based fixes: ensure React import, export default, remove invalid imports.
 */
function applyRuleFixes(files: GeneratedFile[]): { files: GeneratedFile[]; fixesApplied: number } {
  let fixesApplied = 0;
  const reactImport = 'import React from "react";\n';
  const hooksImport = 'import { useState } from "react";\n';

  const out = files.map((f) => {
    let content = String(f.content || "").trim();
    const path = f.path;
    const isTsx = path.endsWith(".tsx") || path.endsWith(".jsx");

    if (!isTsx) return { path, content };

    if (!content.includes("export default")) {
      content = content.replace(/\bexport\s+(function|const)\s+(\w+)\s*\(/g, "export default function $2(");
      if (!content.includes("export default")) {
        content = content.replace(/^(function\s+\w+)\s*\(/m, "export default $1(");
      }
      if (content.includes("export default")) fixesApplied++;
    }

    if (!content.includes('from "react"') && !content.includes("from 'react'")) {
      const hasHooks = /\buseState\s*\(/.test(content);
      const hasJsx = /<[A-Za-z]/.test(content);
      if (hasJsx || hasHooks) {
        const toAdd = hasHooks ? hooksImport : reactImport;
        content = toAdd + content;
        fixesApplied++;
      }
    }

    content = content.replace(/import\s+[\s\S]*?\s+from\s+['\"][^'\"]*['\"]\s*;?\s*$/gm, (line) => {
      if (/from\s+['\"]react['\"]/.test(line)) return line;
      if (/from\s+['\"]\.\.?\//.test(line)) return line;
      fixesApplied++;
      return "";
    });

    if (content !== f.content) fixesApplied++;
    return { path, content };
  });

  return { files: out, fixesApplied };
}

const REVIEWER_SYSTEM = `You are a code reviewer. You receive an array of project files (path + content). Your job is to fix:
- missing React or component imports
- broken import paths (e.g. wrong relative path)
- obvious syntax errors that would prevent the app from running

Return ONLY a JSON object with a single key "files" which is an array of objects: { "path": "src/App.tsx", "content": "fixed full file content" }.
Return the same number of files in the same order. Only change content where a fix is needed; leave other files unchanged. No markdown, no explanations.`;

/**
 * Analyze generated files and apply fixes (rule-based + optional LLM pass).
 */
export async function review(
  files: GeneratedFile[],
  openai: OpenAI,
  log?: (msg: string) => void
): Promise<{ files: GeneratedFile[]; fixesApplied: number }> {
  console.log("[Reviewer] running");
  if (log) log("[Reviewer] Starting...");
  const ruleResult = applyRuleFixes(files);
  let currentFiles = ruleResult.files;
  let totalFixes = ruleResult.fixesApplied;

  if (totalFixes > 0 && log) log("[Review Fixes Applied] Rule-based: " + totalFixes + " fixes");

  if (currentFiles.length === 0) {
    if (log) log("[Reviewer] No files to review");
    return { files: currentFiles, fixesApplied: totalFixes };
  }

  const appFile = currentFiles.find((f) => f.path === "src/App.tsx" || f.path === "App.tsx");
  if (appFile && typeof appFile.content === "string") {
    const hasAllImports = currentFiles.every((f) => {
      const name = f.path.split("/").pop()?.replace(/\.(tsx|jsx)$/, "") ?? "";
      if (name === "App" || name === "index") return true;
      return appFile.content.includes(name);
    });
    if (!hasAllImports) {
      const componentPaths = currentFiles
        .filter((f) => f.path.startsWith("src/components/") && (f.path.endsWith(".tsx") || f.path.endsWith(".jsx")))
        .map((f) => f.path);
      let appContent = appFile.content;
      const existingImports = appContent.match(/import\s+\w+\s+from\s+['\"][^'\"]+['\"]\s*;?\s*/g) || [];
      for (const compPath of componentPaths) {
        const name = compPath.split("/").pop()?.replace(/\.(tsx|jsx)$/, "");
        if (!name || name === "App") continue;
        if (appContent.includes(`<${name}`) || appContent.includes(`<${name} />`)) {
          const relPath = compPath.replace("src/", "./").replace(/\.(tsx|jsx)$/, "");
          const importLine = `import ${name} from "${relPath}";\n`;
          if (!existingImports.some((i) => i.includes(name))) {
            const insertIdx = appContent.indexOf("export default");
            if (insertIdx !== -1) {
              appContent = appContent.slice(0, insertIdx) + importLine + appContent.slice(insertIdx);
              totalFixes++;
            }
          }
        }
      }
      currentFiles = currentFiles.map((f) =>
        f.path === appFile.path ? { path: f.path, content: appContent } : f
      );
    }
  }

  if (log) log("[Reviewer] Complete. Total fixes: " + totalFixes);
  return { files: currentFiles, fixesApplied: totalFixes };
}
