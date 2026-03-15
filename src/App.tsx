import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";
import { Session } from "@supabase/supabase-js";
import type { ProjectFile, Project } from "./types";
import PreviewFrame from "./preview/PreviewFrame";
import { sendPreview } from "./lib/sendPreview";

const CONFIG_PATHS = ["vite.config.ts", "tsconfig.json", "package.json"];

function isConfigPath(path: string): boolean {
  return CONFIG_PATHS.includes(path);
}

function getFileIcon(path: string): string {
  if (!path) return "📄";
  if (path.endsWith(".tsx") || path.endsWith(".jsx")) return "⚛";
  if (path.endsWith(".ts") || path.endsWith(".js")) return "📜";
  if (path.endsWith(".html")) return "🌐";
  if (path.endsWith(".css") || path.endsWith(".scss")) return "🎨";
  if (path.endsWith(".json")) return "📋";
  return "📄";
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorDirty, setEditorDirty] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [modifyInstruction, setModifyInstruction] = useState("");
  const [modifyLoading, setModifyLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fileCount = projectFiles.length;
  const hasUnsaved = editorDirty;

  const isSupabasePlaceholder =
    typeof import.meta.env.VITE_SUPABASE_URL === "string" &&
    (import.meta.env.VITE_SUPABASE_URL.includes("your-project") ||
      import.meta.env.VITE_SUPABASE_ANON_KEY === "your-anon-key");

  function consolidateForPreview(files: Array<{ path: string; content: string }>): Array<{ path: string; content: string }> {
    const list = files.filter((f) => f?.path && typeof f.content === "string");
    const appFile = list.find((f) => f.path === "src/App.tsx" || f.path === "App.tsx");
    if (!appFile) return list;
    const componentFiles = list.filter((f) => f.path.startsWith("src/components/") && (f.path.endsWith(".tsx") || f.path.endsWith(".jsx")));
    if (componentFiles.length === 0) return list;
    const stripImportsAndExport = (code: string): string => {
      return code
        .replace(/import\s+[\s\S]*?from\s+['"][^'"]*['"]\s*;?/g, "")
        .replace(/export\s+default\s+/, "")
        .trim();
    };
    const parts: string[] = ['import React from "react";', 'import { useState, useEffect, useRef } from "react";'];
    for (const f of componentFiles) parts.push(stripImportsAndExport(String(f.content)));
    let appContent = String(appFile.content)
      .replace(/import\s+[\s\S]*?from\s+['"]\.\.?\/components\/[^'"]*['"]\s*;?/g, "")
      .replace(/import\s+[\s\S]*?from\s+['"]react['"]\s*;?/gi, "")
      .replace(/import\s+[\s\S]*?from\s+['"]lucide-react['"]\s*;?/gi, "")
      .replace(/export\s+default\s+/, "");
    parts.push(appContent);
    const singleContent = parts.filter(Boolean).join("\n\n");
    const hasExport = singleContent.includes("export default");
    const finalContent = hasExport ? singleContent : singleContent.replace(/\bfunction App\s*\(/, "export default function App(");
    return [{ path: "src/App.tsx", content: finalContent }];
  }

  function runPreview(files: Array<{ path: string; content: string }>) {
    const list = files
      .filter((f) => f?.path && !isConfigPath(f.path))
      .map((f) => ({ path: f.path, content: String(f.content ?? "") }));
    syncPreviewSandbox(list);
  }

  async function syncPreviewSandbox(files: Array<{ path: string; content: string }>) {
    const list = consolidateForPreview(
      files
        .filter((f) => f?.path && !isConfigPath(f.path))
        .map((f) => ({ path: f.path, content: String(f.content ?? "") }))
    );
    if (list.length === 0) return;
    try {
      await fetch("/api/preview-sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: list }),
      });
    } catch (_) {}
    sendPreview(list, iframeRef);
  }

  function handleRun() {
    const filesToUse = projectFiles.map((f) =>
      selectedFilePath && f.path === selectedFilePath && editorContent.trim()
        ? { ...f, content: editorContent }
        : f
    );
    runPreview(filesToUse.map((f) => ({ path: f.path, content: String(f.content ?? "") })));
  }

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session);
    }).finally(() => {
      if (!cancelled) setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) return;
    const onScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [session]);

  useEffect(() => {
    if (!session) {
      setProjects([]);
      return;
    }
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => data && setProjects(data));
  }, [session]);

  useEffect(() => {
    if (!activeProject) {
      setProjectFiles([]);
      setSelectedFilePath(null);
      setEditorContent("");
      setEditorDirty(false);
      return;
    }
    const projectId = activeProject.id;
    loadFiles(projectId).then((data) => {
      if (!data) return;
      setEditorDirty(false);
      if (data.length > 0) {
        setSelectedFilePath(data[0].path);
        setEditorContent(data[0].content);
        const list = data
          .filter((f: ProjectFile) => f?.path && !isConfigPath(f.path))
          .map((f: ProjectFile) => ({ path: f.path, content: String(f.content ?? "") }));
        syncPreviewSandbox(list);
      } else {
        setSelectedFilePath(null);
        setEditorContent("");
      }
    });
  }, [activeProject?.id]);

  useEffect(() => {
    if (!selectedFilePath || !projectFiles.length) {
      if (!selectedFilePath) setEditorContent("");
      return;
    }
    const f = projectFiles.find((x) => x.path === selectedFilePath);
    if (f) {
      setEditorContent(f.content);
      setEditorDirty(false);
    }
  }, [selectedFilePath, projectFiles]);

  const loadFiles = async (projectId: string) => {
    const { data, error } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .order("path", { ascending: true });

    if (!error && data) {
      setProjectFiles(data);
    }
    return data;
  };

  const saveCurrentFile = async () => {
    if (!activeProject || !selectedFilePath || !editorDirty || !session) return;
    const existing = projectFiles.find((x) => x.path === selectedFilePath);
    if (existing) {
      const { error } = await supabase
        .from("project_files")
        .update({ content: editorContent })
        .eq("id", existing.id);
      if (!error) {
        setProjectFiles((prev) =>
          prev.map((p) => (p.path === selectedFilePath ? { ...p, content: editorContent } : p))
        );
        setEditorDirty(false);
      }
    } else {
      const projectId = activeProject.id;
      const file = { path: selectedFilePath, content: editorContent };
      const { data, error } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          user_id: session.user.id,
          path: file.path,
          content: file.content,
        })
        .select()
        .single();
      if (!error && data) {
        setProjectFiles((prev) => [...prev, data]);
        setEditorDirty(false);
      }
    }
  };

  const addNewFile = () => {
    const path = "src/NewFile.tsx";
    if (projectFiles.some((f) => f.path === path)) return;
    setSelectedFilePath(path);
    setEditorContent("// New file\n");
    setEditorDirty(true);
  };

  const handleGenerate = async () => {
    if (aiLoading) return;
    if (!aiPrompt.trim() || !activeProject || !session) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          projectId: activeProject.id,
          existingFiles: projectFiles.map((f) => ({ path: f.path, content: f.content })),
        }),
      });
      clearTimeout(timeoutId);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          res.status === 404
            ? "API not found. Run 'npm run dev' (starts both app and API) or run 'npm run dev:api' in another terminal."
            : json.message || res.statusText || "Generation failed";
        setAiError(msg);
        return;
      }
      const files = json.project?.files ?? json.files ?? [];
      if (files.length === 0) {
        setAiError("No files returned");
        return;
      }
      for (const file of files) {
        const path = file.path || file.name;
        if (isConfigPath(path)) continue;
        const content = file.content ?? "";
        const existing = projectFiles.find((p) => p.path === path);
        if (existing) {
          await supabase.from("project_files").update({ content }).eq("id", existing.id);
        } else {
          const projectId = activeProject.id;
          const filePayload = { path, content };
          const { data, error: insertError } = await supabase
            .from("project_files")
            .insert({
              project_id: projectId,
              user_id: session.user.id,
              path: filePayload.path,
              content: filePayload.content,
            })
            .select()
            .single();
          if (!insertError && data) {
            setProjectFiles((prev) => [...prev, data]);
            setEditorDirty(false);
          }
        }
      }

      const projectId = activeProject.id;
      const loaded = await loadFiles(projectId);

      setAiPrompt("");
      setAiError(null);

      if (loaded && loaded.length > 0) {
        setProjectFiles(loaded);
        const list = loaded
          .filter((f: ProjectFile) => f?.path && !isConfigPath(f.path))
          .map((f: ProjectFile) => ({ path: f.path, content: String(f.content ?? "") }));
        runPreview(list);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setAiError(e instanceof Error && e.name === "AbortError" ? "Generation timed out. Try again." : msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleModify = async () => {
    if (modifyLoading) return;
    if (!modifyInstruction.trim() || !activeProject || !session) return;
    const appFile = projectFiles.find((f) => f.path === "src/App.tsx");
    if (!appFile) {
      setAiError("No App.tsx found. Generate a landing page first.");
      return;
    }

    setModifyLoading(true);
    setAiError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: modifyInstruction.trim(),
          modify: true,
          projectId: activeProject.id,
          existingFiles: projectFiles.map((f) => ({ path: f.path, content: f.content })),
        }),
      });
      clearTimeout(timeoutId);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiError(json.message || res.statusText || "Modification failed");
        return;
      }
      const files = json.project?.files ?? json.files ?? [];
      const updatedApp = files.find((f: { path?: string; content?: string }) => (f.path === "src/App.tsx" || f.path === "App.tsx") && f.content);
      if (!updatedApp?.content) {
        setAiError("No updated App.tsx in response");
        return;
      }
      const newContent = String(updatedApp.content);
      await supabase
        .from("project_files")
        .update({ content: newContent })
        .eq("id", appFile.id);
      setProjectFiles((prev) =>
        prev.map((p) => (p.path === "src/App.tsx" ? { ...p, content: newContent } : p))
      );
      setEditorContent(newContent);
      setEditorDirty(false);
      setModifyInstruction("");
      setAiError(null);
      const nextFiles = projectFiles.map((p) =>
        p.path === "src/App.tsx" ? { ...p, content: newContent } : p
      );
      const list = nextFiles
        .filter((f) => f?.path && !isConfigPath(f.path))
        .map((f) => ({ path: f.path, content: String(f.content ?? "") }));
      runPreview(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Modification failed";
      setAiError(e instanceof Error && e.name === "AbortError" ? "Request timed out. Try again." : msg);
    } finally {
      setModifyLoading(false);
    }
  };

  async function createProject() {
    if (!session || !newProjectName.trim()) return;
    const { error } = await supabase
      .from("projects")
      .insert({ name: newProjectName.trim(), user_id: session.user.id });
    if (!error) {
      setNewProjectName("");
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setProjects(data);
    }
  }

  async function deleteProject(project: Project) {
    if (!session) return;
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    await supabase.from("project_files").delete().eq("project_id", project.id);
    const { error } = await supabase.from("projects").delete().eq("id", project.id).eq("user_id", session.user.id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      if (activeProject?.id === project.id) setActiveProject(null);
    }
  }

  async function signUp() {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
      return;
    }
  }

  async function signIn() {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", color: "#0f172a", background: "#fafafa" }}>
      <style>{`*{box-sizing:border-box}body{margin:0;min-height:100vh}#root{min-height:100vh}.editor-grid{display:grid;grid-template-columns:240px 1fr 1fr;min-height:0}@media (max-width:900px){.editor-grid{grid-template-columns:1fr!important}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}input:focus,textarea:focus{outline:none;box-shadow:0 0 0 2px rgba(99,102,241,0.35)}`}</style>
      {authLoading ? (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: "0.9375rem", fontWeight: 500, color: "#64748b" }}>Loading…</p>
        </div>
      ) : !session ? (
        <>
          <nav
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              width: "100%",
              transition: "all 0.25s ease",
              ...(navScrolled ? { background: "rgba(255,255,255,0.8)", boxShadow: "0 1px 0 rgba(0,0,0,0.06)", backdropFilter: "blur(12px)" } : { background: "transparent" }),
            }}
          >
            <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.04em", color: "#0f172a" }}>Appfactory</span>
              <a
                href="#auth"
                style={{ padding: "0.625rem 1.25rem", borderRadius: "9999px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", fontWeight: 600, fontSize: "0.9375rem", boxShadow: "0 4px 14px rgba(99,102,241,0.35)", textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.4)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.35)"; }}
              >
                Get started
              </a>
            </div>
          </nav>

          <section style={{ position: "relative", padding: "8rem 0", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(139,92,246,0.08), transparent), #fafafa" }} />
            <div style={{ position: "relative", maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>AI-powered development</p>
              <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "#0f172a", marginBottom: "1.5rem" }}>
                Build apps with AI in minutes
              </h1>
              <p style={{ fontSize: "1.25rem", color: "#475569", maxWidth: "36rem", margin: "0 auto 2.5rem", lineHeight: 1.65 }}>
                Describe what you want. Get a full Vite + React app. Edit in the browser. No setup, no config.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
                <a href="#auth" style={{ display: "inline-flex", padding: "1rem 1.75rem", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", fontWeight: 600, fontSize: "1rem", boxShadow: "0 4px 14px rgba(99,102,241,0.4)", textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.45)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.4)"; }}>Get started free</a>
                <a href="#features" style={{ display: "inline-flex", padding: "1rem 1.75rem", borderRadius: "12px", border: "1px solid #e2e8f0", color: "#334155", fontWeight: 600, fontSize: "1rem", textDecoration: "none", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: "border-color 0.2s, box-shadow 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; }}>See how it works</a>
              </div>
            </div>
          </section>

          <section id="features" style={{ padding: "6rem 0", background: "#fff" }}>
            <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", textAlign: "center", marginBottom: "0.5rem" }}>Everything you need to ship</h2>
              <p style={{ color: "#64748b", fontSize: "1.125rem", textAlign: "center", marginBottom: "4rem", maxWidth: "32rem", marginLeft: "auto", marginRight: "auto" }}>From prompt to deploy in one workflow.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
                {[
                  { icon: "⚡", title: "AI generation", desc: "Describe your app in plain English. Get production-ready React + TypeScript code in seconds." },
                  { icon: "🖥️", title: "Live preview", desc: "Run Vite in the browser. See changes instantly without leaving the tab." },
                  { icon: "📁", title: "Projects & files", desc: "Organize work in projects. Edit files, save to the cloud, and iterate with confidence." },
                ].map((f) => (
                  <div key={f.title} style={{ padding: "2rem", borderRadius: "16px", background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}>
                    <span style={{ width: 48, height: 48, borderRadius: "12px", background: "linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "1.25rem" }}>{f.icon}</span>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>{f.title}</h3>
                    <p style={{ color: "#64748b", lineHeight: 1.6, fontSize: "0.9375rem" }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="auth" style={{ padding: "6rem 0", background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)" }}>
            <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: "26rem", padding: "2.5rem", borderRadius: "20px", background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: "1.5rem" }}>Sign in</h2>
                {isSupabasePlaceholder && (
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "10px" }}>
                    Add your Supabase URL and anon key to <code style={{ background: "#e2e8f0", padding: "0.125rem 0.375rem", borderRadius: "4px", fontSize: "0.8125rem" }}>.env</code>, then restart.
                  </p>
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setAuthError(null); }}
                  style={{ width: "100%", padding: "0.875rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1rem", fontSize: "0.9375rem", background: "#fff" }}
                  aria-label="Email"
                  autoComplete="email"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
                  style={{ width: "100%", padding: "0.875rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1rem", fontSize: "0.9375rem", background: "#fff" }}
                  aria-label="Password"
                  autoComplete="current-password"
                />
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                  <button type="button" onClick={signUp} disabled={isSupabasePlaceholder} style={{ flex: 1, padding: "0.875rem 1.25rem", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer", opacity: isSupabasePlaceholder ? 0.5 : 1, fontSize: "0.9375rem" }}>
                    Sign up
                  </button>
                  <button type="button" onClick={signIn} disabled={isSupabasePlaceholder} style={{ flex: 1, padding: "0.875rem 1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0", fontWeight: 600, cursor: "pointer", opacity: isSupabasePlaceholder ? 0.5 : 1, background: "#fff", color: "#334155", fontSize: "0.9375rem" }}>
                    Log in
                  </button>
                </div>
                {authError && <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#dc2626" }}>{authError}</p>}
              </div>
            </div>
          </section>

          <section style={{ padding: "6rem 0", background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>
            <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: "0.75rem" }}>Ready to build?</h2>
              <p style={{ fontSize: "1.125rem", color: "#94a3b8", marginBottom: "2rem", maxWidth: "28rem", margin: "0 auto 2rem" }}>Join and start creating apps with AI today.</p>
              <a href="#auth" style={{ display: "inline-flex", padding: "1rem 1.75rem", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>Get started free</a>
            </div>
          </section>

          <footer style={{ padding: "2.5rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", fontSize: "0.875rem", color: "#64748b", textAlign: "center" }}>
            <div style={{ maxWidth: "72rem", margin: "0 auto" }}>© Appfactory — Build apps with AI</div>
          </footer>
        </>
      ) : !activeProject ? (
        <>
          <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(15,23,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", backdropFilter: "blur(12px)" }}>
            <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }}>Appfactory</span>
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#94a3b8", background: "rgba(255,255,255,0.1)", padding: "0.25rem 0.5rem", borderRadius: "8px", letterSpacing: "0.05em" }}>DASHBOARD</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>{session.user.email}</span>
                <button type="button" onClick={signOut} style={{ padding: "0.5rem 1.25rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", fontWeight: 500, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#e2e8f0", fontSize: "0.875rem" }}>Logout</button>
              </div>
            </div>
          </header>
          <main style={{ flex: 1, maxWidth: "72rem", margin: "0 auto", width: "100%", padding: "2.5rem 1.5rem" }}>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: "0.375rem" }}>Your projects</h2>
              <p style={{ fontSize: "0.9375rem", color: "#64748b" }}>Create a project and generate landing pages with AI</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ padding: "1.5rem", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", boxShadow: "0 8px 32px rgba(99,102,241,0.3)", color: "#fff" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, display: "block", lineHeight: 1, letterSpacing: "-0.02em" }}>{projects.length}</span>
                <span style={{ fontSize: "0.8125rem", opacity: 0.9 }}>Projects</span>
              </div>
              <div style={{ padding: "1.5rem", borderRadius: "16px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, display: "block", lineHeight: 1, color: "#0f172a" }}>{projects.filter((p) => p.updated_at || p.created_at).length}</span>
                <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>Active</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search projects..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                style={{ padding: "0.75rem 1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0", width: "18rem", fontSize: "0.9375rem", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                aria-label="Search projects"
              />
              <input
                type="text"
                placeholder="New project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                style={{ padding: "0.75rem 1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0", width: "18rem", fontSize: "0.9375rem", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                aria-label="New project name"
              />
              <button type="button" onClick={createProject} style={{ padding: "0.75rem 1.5rem", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)", fontSize: "0.9375rem" }} aria-label="Create project">+ New project</button>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
              {projects
                .filter((p) => !projectSearch.trim() || p.name.toLowerCase().includes(projectSearch.trim().toLowerCase()))
                .map((p) => (
                  <li
                    key={p.id}
                    onClick={() => setActiveProject(p)}
                    onKeyDown={(e) => e.key === "Enter" && setActiveProject(p)}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderRadius: "14px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", cursor: "pointer", transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#f1f5f9"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                      <span style={{ width: 44, height: 44, borderRadius: "12px", background: "linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>📁</span>
                      <div>
                        <span style={{ fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", fontSize: "1rem" }}>{p.name}</span>
                        <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>Click to open</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteProject(p); }}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem", color: "#94a3b8", cursor: "pointer", border: "none", background: "none", borderRadius: "8px" }}
                      title="Delete project"
                      aria-label={`Delete ${p.name}`}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#94a3b8"; }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
            </ul>
          </main>
        </>
      ) : (
        <>
          <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(15,23,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", backdropFilter: "blur(12px)" }}>
            <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0.875rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                <button type="button" onClick={() => setActiveProject(null)} style={{ padding: "0.5rem 0.75rem", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", background: "rgba(255,255,255,0.06)", cursor: "pointer", flexShrink: 0, fontSize: "0.875rem", fontWeight: 500 }} title="Back to projects">← Projects</button>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  <span style={{ fontSize: "1.0625rem", fontWeight: 700, letterSpacing: "-0.025em", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeProject.name}</span>
                  {selectedFilePath && (
                    <>
                      <span style={{ color: "#64748b" }}>/</span>
                      <span style={{ fontSize: "0.8125rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={selectedFilePath}>{selectedFilePath.split("/").pop()}</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                <span style={{ fontSize: "0.8125rem", color: "#64748b", padding: "0.25rem 0.625rem", borderRadius: "8px", background: "rgba(255,255,255,0.08)" }}>{fileCount} file{fileCount !== 1 ? "s" : ""}</span>
                {hasUnsaved && <span style={{ fontSize: "0.8125rem", color: "#a5b4fc", fontWeight: 600 }}>● Unsaved</span>}
                <span style={{ fontSize: "0.8125rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{session.user.email}</span>
                <button type="button" onClick={signOut} style={{ padding: "0.5rem 1.25rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#e2e8f0" }}>Logout</button>
              </div>
            </div>
          </header>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#f1f5f9" }}>
          <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "1.5rem 1.5rem", boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
            <div style={{ maxWidth: "72rem", margin: "0 auto", display: "flex", gap: "1.5rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ borderRadius: "6px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", padding: "0.2rem 0.5rem", fontSize: "10px" }}>AI Generate</span>
                  Describe the website or app you want
                </span>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. A premium SaaS landing page for a project management tool, with hero, features grid, testimonials, pricing, and CTA"
                  rows={2}
                  style={{ width: "100%", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "0.875rem 1.25rem", color: "#0f172a", fontSize: "0.9375rem", resize: "none", minHeight: "56px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                />
              </div>
              <button type="button" onClick={handleGenerate} disabled={aiLoading} style={{ padding: "0.875rem 2rem", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer", opacity: aiLoading ? 0.6 : 1, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }} aria-busy={aiLoading}>
                {aiLoading && <span style={{ width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} aria-hidden />}
                {aiLoading ? "Generating…" : "Generate"}
              </button>
            </div>
            {aiError && <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "#dc2626" }}>{aiError}</p>}
            <div style={{ maxWidth: "72rem", margin: "0 auto", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>Modify existing page</span>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                <input
                  type="text"
                  value={modifyInstruction}
                  onChange={(e) => setModifyInstruction(e.target.value)}
                  placeholder="e.g. Change hero to dark theme, add testimonials, make pricing cards larger"
                  style={{ flex: 1, borderRadius: "10px", border: "1px solid #e2e8f0", padding: "0.75rem 1.25rem", color: "#0f172a", fontSize: "0.9375rem", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                />
                <button type="button" onClick={handleModify} disabled={modifyLoading || !modifyInstruction.trim()} style={{ padding: "0.75rem 1.5rem", borderRadius: "10px", border: "1px solid #e2e8f0", fontWeight: 600, cursor: "pointer", opacity: modifyLoading || !modifyInstruction.trim() ? 0.5 : 1, flexShrink: 0, background: "#fff", color: "#475569" }}>
                  {modifyLoading ? "Applying…" : "Apply"}
                </button>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: "grid", minHeight: 0 }} className="editor-grid">
            <div style={{ background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", background: "#fafafa" }}>
                <h3 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Files</h3>
                <button type="button" onClick={addNewFile} style={{ padding: "0.375rem 0.75rem", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 600, color: "#6366f1", border: "none", background: "rgba(99,102,241,0.1)", cursor: "pointer" }}>+ New</button>
              </div>
              <ul style={{ flex: 1, overflowY: "auto", padding: "0.5rem", margin: 0, listStyle: "none" }}>
                {projectFiles.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedFilePath(f.path)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "10px",
                        textAlign: "left",
                        fontSize: "0.875rem",
                        border: "none",
                        cursor: "pointer",
                        background: selectedFilePath === f.path ? "rgba(99,102,241,0.12)" : "transparent",
                        color: selectedFilePath === f.path ? "#4338ca" : "#475569",
                        fontWeight: selectedFilePath === f.path ? 600 : 400,
                      }}
                      title={f.path}
                    >
                      <span>{getFileIcon(f.path)}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.path.split("/").pop()}</span>
                    </button>
                  </li>
                ))}
                {editorDirty && selectedFilePath && !projectFiles.some((p) => p.path === selectedFilePath) && (
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "10px", fontSize: "0.875rem", color: "#64748b", fontStyle: "italic" }}>
                    <span>{getFileIcon(selectedFilePath)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFilePath} (unsaved)</span>
                  </li>
                )}
              </ul>
            </div>

            <div style={{ background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", background: "#fafafa" }}>
                <h3 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFilePath || "Editor"}</h3>
                <button type="button" onClick={saveCurrentFile} disabled={!editorDirty} style={{ padding: "0.375rem 0.75rem", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 600, color: editorDirty ? "#6366f1" : "#94a3b8", border: "none", background: editorDirty ? "rgba(99,102,241,0.1)" : "none", cursor: editorDirty ? "pointer" : "default" }}>Save</button>
              </div>
              <textarea
                value={editorContent}
                onChange={(e) => { setEditorContent(e.target.value); setEditorDirty(true); }}
                placeholder="Select a file or edit code here. Use the AI bar above to generate or modify your app."
                spellCheck={false}
                style={{ flex: 1, minHeight: 0, padding: "1rem 1.25rem", fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5, color: "#0f172a", background: "#fafafa", border: "none", resize: "none", outline: "none" }}
              />
            </div>

            <div style={{ background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)" }}>
                <h3 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 2px rgba(34,197,94,0.3)" }} /> Live preview
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => window.open("/preview-runtime.html", "_blank")}
                    style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}
                  >
                    ↗ Open in new tab
                  </button>
                  <button type="button" onClick={handleRun} disabled={!projectFiles.length} style={{ padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 600, color: "#6366f1", border: "1px solid #c7d2fe", background: "#fff", cursor: !projectFiles.length ? "default" : "pointer", opacity: !projectFiles.length ? 0.5 : 1 }} title="Refresh preview" aria-label="Run preview">Run</button>
                </div>
              </div>
              {!projectFiles.length && (
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", textAlign: "center", color: "#64748b", fontSize: "0.9375rem", maxWidth: "20rem", zIndex: 1 }}>
                  <div style={{ width: "48px", height: "48px", margin: "0 auto 1rem", borderRadius: "12px", background: "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>◇</div>
                  <strong style={{ display: "block", color: "#334155", marginBottom: "0.5rem", fontSize: "1rem" }}>Live preview</strong>
                  <p style={{ margin: 0, lineHeight: 1.5 }}>Enter a prompt above and click <strong>Generate</strong> to build your site, then click <strong>Run</strong> to see it here.</p>
                </div>
              )}
              <div style={{ flex: 1, minHeight: 0, position: "relative", background: "#f8fafc", padding: projectFiles.length ? "12px" : 0 }}>
                <PreviewFrame key={previewKey} iframeRef={iframeRef} />
              </div>
            </div>
          </div>

          <footer style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "0.75rem 1.5rem", background: "#fff", borderTop: "1px solid #e2e8f0", fontSize: "0.75rem", color: "#64748b" }}>
            <span>Project: {activeProject.name}</span>
            <span>{fileCount} files</span>
            {selectedFilePath && <span style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "240px" }}>{selectedFilePath}</span>}
            {hasUnsaved && <span style={{ color: "#6366f1", fontWeight: 600 }}>● Unsaved</span>}
          </footer>
        </main>
        </>
      )}
    </div>
  );
}
