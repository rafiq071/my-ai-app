import type { ProjectFile } from "../types";

type Listener = (url: string) => void;
type ErrorListener = (message: string) => void;
type StatusListener = (
  status: "mounting" | "installing" | "starting" | "ready" | "restarting" | "error"
) => void;

const serverReadyListeners = new Set<Listener>();
const errorListeners = new Set<ErrorListener>();
const statusListeners = new Set<StatusListener>();

function emitServerReady(url: string) {
  serverReadyListeners.forEach((cb) => cb(url));
}

function emitError(message: string) {
  errorListeners.forEach((cb) => cb(message));
}

function emitStatus(
  status: "mounting" | "installing" | "starting" | "ready" | "restarting" | "error"
) {
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

export function onStatus(cb: StatusListener) {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

export async function updateFiles(
  files: { path: string; content: string }[]
): Promise<void> {
  // currently not needed but required for interface
  return;
}

export async function runPreview(
  files: ProjectFile[],
  iframeRef: { current: HTMLIFrameElement | null },
  options?: { runBuildBeforeDev?: boolean }
): Promise<void> {

  emitStatus("starting");

  try {

    if (!iframeRef.current) {
      emitError("Preview iframe not found");
      return;
    }

    // find index.html
    const indexFile = files.find((f) => f.path.endsWith("index.html"));

    if (!indexFile) {
      emitError("index.html not found in generated files");
      emitStatus("error");
      return;
    }

    // render preview
    iframeRef.current.srcdoc = indexFile.content;

    emitServerReady("preview");
    emitStatus("ready");

  } catch (err) {

    console.error(err);
    emitError("Preview failed to render");
    emitStatus("error");

  }
}

export function killDevServer(): void {
  return;
}

export function isDevServerRunning(): boolean {
  return true;
}