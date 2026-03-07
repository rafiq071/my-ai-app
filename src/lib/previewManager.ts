/**
 * Global WebContainer preview manager.
 *
 * Requirements:
 * - SINGLE dev server: kill stale process before starting; do not start if already running.
 * - NO RESTART LOOPS: runId guard for stale events; runningPromise lock for concurrency.
 * - SMART INSTALL: npm install only if node_modules missing OR package.json hash changed.
 * - HMR: updateFile/updateFiles use container.fs.writeFile(); never restart dev server for edits.
 * - Iframe URL set ONLY in "server-ready" handler.
 * - CRASH RECOVERY: restart dev server only (do not reboot container).
 *
 * Logs (exact):
 *   Preview: booting container       (webcontainer.ts)
 *   Preview: mounting files
 *   Preview: installing dependencies
 *   Preview: skipping install (cache valid)
 *   Preview: starting dev server
 *   Preview ready: <url>
 *   Preview: HMR update <file>
 *   Preview: crash detected
 *
 * Events: onStatus(status) | onPreviewError(error) | onServerReady(url)
 */

import { getContainer, buildFilesForMount } from "../webcontainer";
import type { ProjectFile } from "../types";

const CONFIG_PATHS = ["vite.config.ts", "tsconfig.json", "package.json"];

function isConfigPath(p: string): boolean {
  return CONFIG_PATHS.includes(p);
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return String(h);
}

type Listener = (url: string) => void;
type ErrorListener = (message: string) => void;
type StatusListener = (status: "mounting" | "installing" | "starting" | "ready" | "restarting" | "error") => void;

let devProcess: { kill: () => void; exit: Promise<number>; output: ReadableStream<string> } | null = null;
let devServerRunning = false;
let previewRunId = 0;
let lastPackageJsonHash: string | null = null;
let runningPromise: Promise<void> | null = null;

const serverReadyListeners = new Set<Listener>();
const errorListeners = new Set<ErrorListener>();
const statusListeners = new Set<StatusListener>();

function log(msg: string, ...args: unknown[]): void {
  console.log(`Preview: ${msg}`, ...args);
}

function emitReady(url: string): void {
  serverReadyListeners.forEach((cb) => cb(url));
}

function emitError(message: string): void {
  errorListeners.forEach((cb) => cb(message));
}

function emitStatus(status: "mounting" | "installing" | "starting" | "ready" | "restarting" | "error"): void {
  statusListeners.forEach((cb) => cb(status));
}

/**
 * Subscribe to server-ready (preview URL).
 */
export function onServerReady(cb: Listener): () => void {
  serverReadyListeners.add(cb);
  return () => serverReadyListeners.delete(cb);
}

/**
 * Subscribe to preview errors.
 */
export function onPreviewError(cb: ErrorListener): () => void {
  errorListeners.add(cb);
  return () => errorListeners.delete(cb);
}

/**
 * Subscribe to status (building, ready, restarting, error).
 */
export function onStatus(cb: StatusListener): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

/**
 * Write a single file in the container. Use for fast updates (HMR).
 * Does not restart the dev server. Only works after runPreview() has succeeded.
 */
export async function updateFile(path: string, content: string): Promise<void> {
  if (!devServerRunning || !devProcess) {
    log("updateFile: dev server not running, skipping");
    return;
  }
  try {
    const container = await getContainer();
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    await container.fs.writeFile(normalizedPath, content);
    log("HMR update " + normalizedPath);
  } catch (e) {
    console.error("Preview: updateFile failed", e);
    emitError("Failed to update file");
  }
}

/**
 * Write multiple files. Used after AI modify for instant HMR.
 */
export async function updateFiles(files: { path: string; content: string }[]): Promise<void> {
  for (const f of files) {
    if (isConfigPath(f.path)) continue;
    await updateFile(f.path, f.content);
  }
}

/**
 * Run full preview: mount, install (if package.json changed), optionally build, start dev server.
 * Prevents multiple concurrent runs. Restart only when files change (new mount).
 */
export async function runPreview(
  files: ProjectFile[],
  iframeRef: { current: HTMLIFrameElement | null },
  options?: { runBuildBeforeDev?: boolean }
): Promise<void> {
  const fileList = files.map((f) => ({ path: f.path, content: f.content }));

  if (!fileList.length) {
    log("No files to preview");
    return;
  }

  if (runningPromise) {
    log("Already running, waiting for current run to finish");
    await runningPromise;
    if (devServerRunning) {
      log("Dev server already running, skipping restart");
      return;
    }
  }

  if (devServerRunning && !runningPromise) {
    log("Dev server already running, skipping restart");
    return;
  }

  if (devProcess) {
    try {
      devProcess.kill();
    } catch (e) {
      log("Kill previous process", e);
    }
    devProcess = null;
    devServerRunning = false;
  }

  previewRunId += 1;
  const thisRunId = previewRunId;

  const doRun = async (): Promise<void> => {
    emitStatus("mounting");
    emitError("");
    if (iframeRef.current) iframeRef.current.src = "about:blank";

    try {
      const container = await getContainer();

      log("mounting files");
      try {
        await container.mount(buildFilesForMount(fileList));
      } catch (mountErr) {
        console.error("Preview: mount failed", mountErr);
        emitError("Mount failed");
        emitStatus("error");
        return;
      }

      const pkgFile = fileList.find((f) => f.path === "package.json");
      const pkgHash = pkgFile ? hashString(pkgFile.content) : "";
      let nodeModulesExists = false;
      try {
        await container.fs.readdir("/node_modules");
        nodeModulesExists = true;
      } catch {
        /* node_modules missing */
      }

      const needInstall = !nodeModulesExists || lastPackageJsonHash !== pkgHash;
      if (needInstall) {
        emitStatus("installing");
        log("installing dependencies");
        const install = await container.spawn("npm", ["install"]);
        const code = await install.exit;
        if (code !== 0) {
          console.error("Preview: npm install failed, exit code", code);
          emitError("npm install failed");
          emitStatus("error");
          return;
        }
        lastPackageJsonHash = pkgHash;
      } else {
        log("skipping install (cache valid)");
      }

      if (options?.runBuildBeforeDev) {
        log("running build verification");
        const buildResult = await runBuild();
        if (!buildResult.success) {
          console.error("Preview: build failed", buildResult.error);
          emitError(buildResult.error || "Build failed");
          emitStatus("error");
          return;
        }
      }

      emitStatus("starting");
      log("starting dev server");
      devProcess = await container.spawn("npm", ["run", "dev"]);

      devProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            if (import.meta.env.DEV) console.log("[VITE]", data);
          },
        })
      ).catch(() => {});

      devProcess.exit.then((code: number) => {
        devProcess = null;
        devServerRunning = false;
        if (code !== 0) {
          log("crash detected");
          console.error("Preview: dev server exited with code", code);
          emitError("Preview crashed");
          emitStatus("error");
          if (thisRunId === previewRunId) {
            emitStatus("restarting");
            runPreview(files, iframeRef, options).catch((e) => {
              console.error("Preview: crash recovery failed", e);
              emitError("Preview restart failed");
            });
          }
        }
      }).catch((err: unknown) => {
        devProcess = null;
        devServerRunning = false;
        log("crash detected");
        console.error("Preview: dev server error", err);
        emitError("Preview crashed");
        emitStatus("error");
        if (thisRunId === previewRunId) {
          emitStatus("restarting");
          runPreview(files, iframeRef, options).catch((e) => {
            console.error("Preview: crash recovery failed", e);
            emitError("Preview restart failed");
          });
        }
      });

      container.on("server-ready", (_port: number, url: string) => {
        if (thisRunId !== previewRunId) {
          log("ignoring stale server-ready");
          return;
        }
        console.log("Preview ready:", url);
        devServerRunning = true;
        emitStatus("ready");
        emitError("");
        if (iframeRef.current) iframeRef.current.src = url;
        emitReady(url);
      });
    } catch (err) {
      console.error("Preview: runPreview error", err);
      emitError(err instanceof Error ? err.message : "Preview failed");
      emitStatus("error");
    } finally {
      runningPromise = null;
    }
  };

  runningPromise = doRun();
  await runningPromise;
}

/**
 * Run build in container (optional verification). Returns true if build succeeded.
 */
export async function runBuild(): Promise<{ success: boolean; error?: string }> {
  try {
    const container = await getContainer();
    const proc = await container.spawn("npm", ["run", "build"]);
    const code = await proc.exit;
    if (code !== 0) return { success: false, error: "Build failed" };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Build failed" };
  }
}

/**
 * Kill dev server (e.g. on project switch). Does not boot container.
 */
export function killDevServer(): void {
  if (devProcess) {
    try {
      devProcess.kill();
    } catch {
      /* noop */
    }
    devProcess = null;
  }
  devServerRunning = false;
  runningPromise = null;
}

export function isDevServerRunning(): boolean {
  return devServerRunning;
}
