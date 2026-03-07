import { WebContainer } from "@webcontainer/api";
import type { FileSystemTree } from "@webcontainer/api";
import { sanitizeAppTsx } from "./lib/sanitizeAppTsx";

/**
 * Single WebContainer instance for the entire app.
 * WebContainer.boot() must ONLY be called here.
 * Use a shared promise so concurrent getContainer() calls do not trigger multiple boots.
 */
let containerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getContainer(): Promise<WebContainer> {
  if (containerInstance) return containerInstance;
  if (!bootPromise) {
    bootPromise = (async () => {
      console.log("Preview: booting container");
      containerInstance = await WebContainer.boot();
      return containerInstance!;
    })();
  }
  return bootPromise;
}

const DEFAULT_PACKAGE_JSON = {
  name: "app",
  private: true,
  scripts: { dev: "vite", build: "vite build" },
  dependencies: {
    react: "^18.2.0",
    "react-dom": "^18.2.0",
  },
  devDependencies: {
    vite: "^5.0.0",
    typescript: "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
  },
};

const DEFAULT_VITE_CONFIG = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()]
});
`;

const DEFAULT_TSCONFIG = `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "strict": true
  }
}
`;

const DEFAULT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;

const DEFAULT_MAIN_TSX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

function setInTree(tree: FileSystemTree, path: string, contents: string): void {
  const parts = path.split("/").filter(Boolean);
  let current = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const name = parts[i];
    if (!current[name] || !("directory" in current[name])) {
      (current as Record<string, unknown>)[name] = { directory: {} };
    }
    current = (current[name] as { directory: FileSystemTree }).directory;
  }
  const fileName = parts[parts.length - 1];
  (current as Record<string, unknown>)[fileName] = { file: { contents } };
}

/**
 * Build a FileSystemTree from flat files. Injects default config files
 * (package.json, vite.config.ts, tsconfig.json) when not present.
 * Config files are never read from DB — they are mounted only for WebContainer.
 */
export function buildFilesForMount(files: { path: string; content: string }[]): FileSystemTree {
  const tree: FileSystemTree = {};
  if (!files.some((f) => f.path === "package.json")) {
    setInTree(tree, "package.json", JSON.stringify(DEFAULT_PACKAGE_JSON, null, 2));
  }
  if (!files.some((f) => f.path === "vite.config.ts")) {
    setInTree(tree, "vite.config.ts", DEFAULT_VITE_CONFIG);
  }
  if (!files.some((f) => f.path === "tsconfig.json")) {
    setInTree(tree, "tsconfig.json", DEFAULT_TSCONFIG);
  }
  if (!files.some((f) => f.path === "index.html")) {
    setInTree(tree, "index.html", DEFAULT_INDEX_HTML);
  }
  if (!files.some((f) => f.path === "src/main.tsx" || f.path === "main.tsx")) {
    setInTree(tree, "src/main.tsx", DEFAULT_MAIN_TSX);
  }
  for (const file of files) {
    const path = file.path === "App.tsx" ? "src/App.tsx" : file.path;
    const content =
      path === "src/App.tsx" ? sanitizeAppTsx(file.content) : file.content;
    setInTree(tree, path, content);
  }
  return tree;
}
