import type { ProjectFile } from "../types";

type Listener = (url: string) => void;
type ErrorListener = (message: string) => void;
type StatusListener =
  | "mounting"
  | "installing"
  | "starting"
  | "ready"
  | "restarting"
  | "error";

const serverReadyListeners = new Set<(url: string) => void>();
const errorListeners = new Set<(msg: string) => void>();
const statusListeners = new Set<(s: StatusListener) => void>();

function emitError(msg: string) {
  errorListeners.forEach((cb) => cb(msg));
}

function emitStatus(status: StatusListener) {
  statusListeners.forEach((cb) => cb(status));
}

export function onServerReady(cb: Listener) {
  serverReadyListeners.add(cb);
  return () => serverReadyListeners.delete(cb);
}

export function onPreviewError(cb: ErrorListener) {
  errorListeners.add(cb);
  return () => errorListeners.delete(cb);
}

export function onStatus(cb: (s: StatusListener) => void) {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

export async function updateFiles() {}

export async function runPreview(
  files: ProjectFile[],
  iframeRef: { current: HTMLIFrameElement | null }
) {
  try {
    emitStatus("starting");

    if (!files || files.length === 0) {
      emitError("No files generated");
      emitStatus("error");
      return;
    }

    const htmlFile =
      files.find((f) => f.path === "index.html") ||
      files.find((f) => f.path.endsWith(".html"));

    if (!htmlFile) {
      emitError("index.html not found");
      emitStatus("error");
      return;
    }

    const blob = new Blob([htmlFile.content], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    if (iframeRef.current) {
      iframeRef.current.src = url;
    }

    serverReadyListeners.forEach((cb) => cb(url));
    emitStatus("ready");
  } catch (e) {
    emitError("Preview failed");
    emitStatus("error");
  }
}

export function killDevServer() {}

export function isDevServerRunning() {
  return false;
}