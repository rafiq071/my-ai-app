import React, { Suspense, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

const PREVIEW_SCRIPT = "/api/preview-files/App.js";

function Fallback() {
  return (
    <div style={{ padding: 40, fontFamily: "system-ui", color: "#64748b", textAlign: "center" }}>
      Loading preview…
    </div>
  );
}

function PreviewRoot() {
  const [App, setApp] = useState<React.ComponentType | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    setApp(null);
    (async () => {
      try {
        const mod = await import(/* @vite-ignore */ PREVIEW_SCRIPT);
        const Component = mod?.default;
        if (cancelled) return;
        if (Component) setApp(() => Component);
        else setErr("No default export");
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "Failed to load preview");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (err) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", color: "#dc2626" }}>
        <p>Preview failed to load.</p>
        <pre style={{ fontSize: 12, overflow: "auto" }}>{err}</pre>
      </div>
    );
  }
  if (!App) return <Fallback />;
  return (
    <Suspense fallback={<Fallback />}>
      <App />
    </Suspense>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PreviewRoot />
  </React.StrictMode>
);
