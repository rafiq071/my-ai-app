// previewManager.ts

type PreviewStatus =
  | "idle"
  | "mounting"
  | "installing"
  | "starting"
  | "ready"
  | "error";

let currentStatus: PreviewStatus = "idle";
let serverUrl: string | null = null;

const statusListeners: ((status: PreviewStatus) => void)[] = [];
const errorListeners: ((error: string) => void)[] = [];
const serverReadyListeners: ((url: string) => void)[] = [];

function emitStatus(status: PreviewStatus) {
  currentStatus = status;
  statusListeners.forEach((cb) => cb(status));
}

function emitError(error: string) {
  errorListeners.forEach((cb) => cb(error));
}

function emitServerReady(url: string) {
  serverUrl = url;
  serverReadyListeners.forEach((cb) => cb(url));
}

export function onStatus(cb: (status: PreviewStatus) => void) {
  statusListeners.push(cb);
}

export function onPreviewError(cb: (error: string) => void) {
  errorListeners.push(cb);
}

export function onServerReady(cb: (url: string) => void) {
  serverReadyListeners.push(cb);
}

export function getStatus() {
  return currentStatus;
}

export function getServerUrl() {
  return serverUrl;
}

export function isDevServerRunning(): boolean {
  return serverUrl !== null;
}

let files: Record<string, string> = {};

export async function updateFile(path: string, content: string) {
  files[path] = content;
}

export async function updateFiles(newFiles: Record<string, string>) {
  files = { ...files, ...newFiles };
}

export async function runPreview() {
  try {
    emitStatus("mounting");

    await new Promise((r) => setTimeout(r, 500));

    emitStatus("installing");

    await new Promise((r) => setTimeout(r, 1000));

    emitStatus("starting");

    await new Promise((r) => setTimeout(r, 1000));

    const url = "http://localhost:5173";

    emitServerReady(url);

    emitStatus("ready");

    return { success: true, url };
  } catch (err: any) {
    emitStatus("error");
    emitError(err?.message || "Preview failed");
    return { success: false, error: err?.message };
  }
}

export async function runBuild() {
  try {
    await new Promise((r) => setTimeout(r, 1000));

    return {
      success: true,
      output: "Build completed successfully",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Build failed",
    };
  }
}

export function stopPreview() {
  serverUrl = null;
  emitStatus("idle");
}