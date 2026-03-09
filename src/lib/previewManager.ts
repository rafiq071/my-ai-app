import type { ProjectFile } from "../types";

type Listener = (url: string) => void;
type ErrorListener = (message: string) => void;

type StatusListener = (
  status:
    | "mounting"
    | "installing"
    | "starting"
    | "ready"
    | "restarting"
    | "error"
) => void;

const serverReadyListeners = new Set<Listener>();
const errorListeners = new Set<ErrorListener>();
const statusListeners = new Set<StatusListener>();

function emitError(message: string) {
  errorListeners.forEach((cb) => cb(message));
}

function emitStatus(
  status:
    | "mounting"
    | "installing"
    | "starting"
    | "ready"
    | "restarting"
    | "error"
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
  _files: { path: string; content: string }[]
): Promise<void> {
  return;
}

export async function runPreview(
  files?: ProjectFile[],
  iframeRef?: { current: HTMLIFrameElement | null },
  options?: { runBuildBeforeDev?: boolean }
): Promise<void> {
  emitStatus("starting");

  if (iframeRef?.current) {
    iframeRef.current.src = "about:blank";
  }

  setTimeout(() => {
    emitError("Preview unavailable in Vercel environment");
    emitStatus("error");
  }, 500);
}

export function killDevServer(..._args: any[]): void {}

export function isDevServerRunning(): boolean {
  return false;
}