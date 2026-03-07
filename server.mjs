/**
 * Local dev server for /api/generate so "Generate" works without Vercel.
 * Run: npm run dev (runs both Vite and this) or npm run dev:api in a separate terminal.
 * Set OPENAI_API_KEY in .env for AI generation.
 */
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from several possible locations so it always finds the key
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, ".env"),
];
let loadedFrom = null;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.parsed && result.parsed.OPENAI_API_KEY) {
      loadedFrom = envPath;
      break;
    }
  }
}

// Fallback: read OPENAI_API_KEY directly from .env if still missing (handles encoding/format issues)
if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
  for (const envPath of envPaths) {
    try {
      const raw = fs.readFileSync(envPath, "utf8");
      const match = raw.match(/OPENAI_API_KEY\s*=\s*(.+)/);
      if (match) {
        const value = match[1]
          .replace(/\s*#.*$/, "")
          .replace(/^["']|["']$/g, "")
          .replace(/\r/g, "")
          .trim();
        if (value) {
          process.env.OPENAI_API_KEY = value;
          loadedFrom = envPath;
          break;
        }
      }
    } catch (_) {}
  }
}

// Trim in case .env has trailing space, BOM, or Windows CR
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").replace(/\r/g, "").trim();
if (OPENAI_API_KEY) process.env.OPENAI_API_KEY = OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    "\n⚠ OPENAI_API_KEY is not set. Add it to a .env file in the project root, e.g:\n   OPENAI_API_KEY=sk-your-key-here\n   Get a key from https://platform.openai.com/api-keys\n   Then restart the server. Generate will work after that.\n"
  );
} else {
  const prefix = OPENAI_API_KEY.slice(0, 15) + (OPENAI_API_KEY.length > 15 ? "..." : "");
  console.log("OPENAI_API_KEY loaded. Key prefix:", prefix);
  if (loadedFrom) console.log("  .env from:", loadedFrom);
}

const SYSTEM_PROMPT = `You are an expert product designer and copywriter. Generate HIGH-QUALITY, conversion-optimized landing pages at the level of Stripe, Linear, Vercel, and Notion. Every pixel and word should feel intentional and professional.

OUTPUT: Valid JSON only. No markdown. Return exactly ONE file: src/App.tsx.
Schema: { "name": "string", "description": "string", "files": [ { "path": "src/App.tsx", "content": "string" } ] }
REQUIRED: The "files" array MUST contain exactly one file with path "src/App.tsx". Never omit it.
Return ONLY valid JSON. Do not include explanations or markdown.

CRITICAL: Put ALL UI in a single App.tsx file. Do NOT use import from "./components/..." or any other file. Do NOT create separate component files. Inline everything inside one export default function App() { return (...); }. Single file only.

Use React + inline styles only (style={{ ... }}). No Tailwind, no CSS files. Escape JSON (newlines as \\n, quotes as \\").

——— SECTIONS (include all, in this order) ———
1. NAVBAR — Sticky top. Logo/product name (bold, 1.25rem). Nav links: Features, Pricing, (About/Contact if relevant). One primary CTA button (gradient). Max-width container (e.g. 1200px), padding 1rem 2rem. Subtle borderBottom or boxShadow on scroll feel. fontFamily: "'Inter', system-ui, sans-serif".
2. HERO — Full-width section. Headline: 2.75rem–3.5rem, fontWeight 800, letterSpacing "-0.04em", lineHeight 1.1. Subheadline: 1.25rem, color #64748b, maxWidth 32rem, margin "0 auto". Two buttons: primary (gradient, 1rem padding) and secondary (outline). Optional: "Trusted by X+ companies" or logo strip. Background: soft gradient (e.g. radial at top) or #fafafa. padding 4rem 2rem.
3. FEATURES — Section title "Why [product]" or "Everything you need", 2rem font. Grid of 6 cards: 3 columns, gap 2rem. Each card: rounded 16px, padding 1.5rem, boxShadow "0 4px 24px rgba(0,0,0,0.06)", border "1px solid #f1f5f9". Icon/emoji in a 48px rounded box with light background. Title (1.125rem, fontWeight 600). Description 1–2 sentences, color #64748b. Use a consistent accent (e.g. #6366f1).
4. TESTIMONIALS — "Loved by teams everywhere" or similar. 3 testimonial cards. Quote text (1.125rem, fontStyle italic or normal). Author: name (fontWeight 600), role, company. Optional: avatar circle with initial. Cards with subtle border or shadow.
5. HOW IT WORKS / PROBLEM–SOLUTION — Two columns or 3 steps. Clear headings. Short paragraphs. Optional illustration placeholder (rounded box with emoji or "Step 1"). Spacing 2rem between steps.
6. PRICING — "Simple, transparent pricing". 3 tiers in a row. One tier has badge "Most Popular". Each: tier name, price (e.g. "$X/mo"), 4–6 feature bullets (checkmark or dot), one CTA button. Cards: rounded 16px, border, the popular one with borderColor accent or subtle background. gap 1.5rem.
7. FAQ — "Frequently asked questions". 5–7 Q&A pairs. Each: question (fontWeight 600, 1rem), answer (color #64748b, marginTop 0.5rem). Stack vertically with padding 1rem 0, borderBottom "1px solid #f1f5f9". Address real objections (pricing, security, integration).
8. FINAL CTA — Dark background (#0f172a or gradient). Headline (2rem), subtext, single CTA button (bright or white). padding 4rem 2rem, textAlign center.
9. FOOTER — background #f8fafc, borderTop "1px solid #e2e8f0". Links in rows: Product (Features, Pricing), Company (About, Blog), Legal (Privacy, Terms). Copyright line. padding 2rem, fontSize 0.875rem, color #64748b.

——— DESIGN & QUALITY RULES ———
- Typography: Use a clear hierarchy. Headlines 2rem+, subheads 1.25rem, body 1rem, small 0.875rem. fontWeight 800 for main headlines, 600 for section titles, 400/500 for body.
- Colors: Primary #6366f1, primary-dark #4f46e5. Neutrals: #0f172a (dark text), #334155 (secondary), #64748b (muted), #f1f5f9 (light bg), #e2e8f0 (borders). Gradients: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) for primary buttons and hero accents.
- Spacing: Consistent padding (2rem, 4rem for sections). gap 1.5rem–2rem in grids. maxWidth 72rem or 80rem for content containers, margin "0 auto".
- Buttons: Primary rounded 10–12px, padding 0.75rem 1.5rem, fontWeight 600. Hover optional (slightly darker or scale 1.02).
- Copy: Write SPECIFIC, benefit-driven copy. No "Lorem ipsum". No generic "We help businesses grow." Use concrete value: "Ship features 2x faster", "Trusted by 10,000+ developers". Headlines should state outcome or differentiation. CTAs: "Get started free", "Start building", "Try for free".
- Responsive: Use maxWidth, flexWrap, and percentage or rem so layout doesn’t break on small screens. Avoid fixed pixel widths for main content.
- Polish: Rounded corners 12–16px. Soft shadows (0 4px 24px rgba(0,0,0,0.06)). No harsh borders. Consistent 1px solid #e2e8f0 or #f1f5f9 for dividers.

Export default function App() with everything inlined.`;

const MODIFY_SYSTEM_PROMPT = `You MODIFY existing React/TSX code to fulfill the user's instruction. Do NOT regenerate the whole page. Change ONLY what is needed. Preserve the existing design system (colors, spacing, typography) unless the user asks to change it.

Rules:
- Keep ALL UI in a single App.tsx. No new component files. No imports from "./components/...".
- Use inline styles only. No Tailwind, no CSS files.
- Preserve structure: same sections and order unless the user asks to add/remove/reorder.
- When adding sections (e.g. testimonials, pricing), match the existing style: same palette (#6366f1, #64748b, etc.), same border-radius (12–16px), same shadow and spacing.
- Copy: keep tone professional and benefit-driven. No lorem ipsum.

Examples of instructions:
- "Change hero color to purple" → Update gradient/background and primary color in hero only.
- "Add testimonials section" → Insert a testimonials block (3 quotes, name/role/company) between two existing sections.
- "Make pricing cards larger" → Increase padding/fontSize on pricing cards.
- "Add a dark mode toggle" → Add state and a toggle that switches background/text colors.

OUTPUT: Valid JSON. Schema: { "name": "string", "description": "string", "files": [ { "path": "src/App.tsx", "content": "string" } ] }
Include the FULL content of the modified App.tsx. Escape JSON (\\n, \\").
Return ONLY valid JSON. No markdown, no explanations.`;

function extractJson(text) {
  const t = (text || "").trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/) || [];
  return (m[1] || t).trim();
}

/** Try to parse AI response as JSON; extract from markdown or first { } block if needed. */
function parseJsonFromAI(raw) {
  const text = String(raw || "").trim();
  console.log("AI raw response:", text.slice(0, 2000) + (text.length > 2000 ? "..." : ""));
  try {
    return { ok: true, parsed: JSON.parse(text) };
  } catch (_) {}
  const fromMarkdown = extractJson(text);
  if (fromMarkdown !== text) {
    try {
      return { ok: true, parsed: JSON.parse(fromMarkdown) };
    } catch (_) {}
  }
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return { ok: true, parsed: JSON.parse(objectMatch[0]) };
    } catch (_) {}
  }
  return { ok: false };
}

const DEFAULT_APP_TSX = `export default function App() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Welcome</h1>
      <p>Your app is loading. Edit this file to get started.</p>
    </div>
  );
}
`;

function hasAppTsx(parsed) {
  const files = parsed && parsed.files;
  if (!Array.isArray(files)) return false;
  return files.some((f) => f && (f.path === "src/App.tsx" || f.path === "App.tsx"));
}

function ensureAppTsxInFiles(allFiles) {
  const has = allFiles.some((f) => f && (f.path === "src/App.tsx" || f.path === "App.tsx"));
  if (has) return allFiles;
  return [{ path: "src/App.tsx", content: DEFAULT_APP_TSX, type: "file" }, ...allFiles];
}

/** Strip ./components/ imports and replace component tags so preview works with single-file mount. */
function sanitizeAppTsx(content) {
  let out = String(content || "");
  out = out.replace(/^\s*import\s+[\s\S]*?\s+from\s+['"]\.\.?\/components\/[^'"]+['"]\s*;?\s*$/gm, "");
  const componentNames = [
    "Pricing", "FAQ", "ContactForm", "FinalCTA", "Footer", "Hero", "Navbar",
    "Features", "Testimonials", "ProblemSolution", "CtaSection", "ContactSection",
  ];
  for (const name of componentNames) {
    const openClose = new RegExp(`<${name}[^>]*>[\\s\\S]*?<\\/${name}>`, "g");
    const open = new RegExp(`<${name}\\s*/?>`, "g");
    out = out.replace(openClose, `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`);
    out = out.replace(open, `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`);
  }
  return out;
}

// Fixed base template paths — never regenerated. Only src/App.tsx is replaced by AI.
// package.json is read from base-template/package.json (static). No Tailwind.
const BASE_TEMPLATE_PATHS = [
  "index.html",
  "src/main.tsx",
  "vite.config.ts",
  "tsconfig.json",
  "package.json",
];

const BASE_TEMPLATE_DIR = path.join(__dirname, "base-template");

function readBaseTemplate() {
  const files = [];
  for (const filePath of BASE_TEMPLATE_PATHS) {
    const isFromTemplateDir = filePath === "package.json" || filePath === "vite.config.ts";
    const fullPath = isFromTemplateDir
      ? path.join(BASE_TEMPLATE_DIR, filePath)
      : path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) continue;
    try {
      const content = fs.readFileSync(fullPath, "utf8");
      files.push({
        path: filePath,
        content,
        type: "file",
      });
    } catch (_) {}
  }
  return files;
}

async function handleGenerate(body) {
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) throw new Error("prompt is required");
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set. Add OPENAI_API_KEY=sk-... to a .env file in the project root and restart the server. Get a key from https://platform.openai.com/api-keys");

  console.log("[AI] Generate request, modify:", !!body.modify);

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID || undefined,
    project: process.env.OPENAI_PROJECT_ID || undefined,
  });

  const existingFiles = Array.isArray(body.existingFiles) ? body.existingFiles : [];
  const isModify = body.modify === true;

  if (isModify) {
    const appFile = existingFiles.find((f) => f.path === "src/App.tsx" || f.path === "App.tsx");
    if (!appFile || typeof appFile.content !== "string") {
      throw new Error("Modify mode requires existing src/App.tsx content. Open a project with a generated landing page first.");
    }
    const userMessage = `User instruction: ${prompt}\n\nExisting src/App.tsx:\n\`\`\`tsx\n${appFile.content}\n\`\`\`\n\nReturn the full updated App.tsx as JSON in the "files" array. Only include the modified src/App.tsx.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MODIFY_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 8000,
    });

    const text =
      completion.output_text ??
      completion.output?.[0]?.content?.[0]?.text ??
      completion.choices?.[0]?.message?.content ??
      "";
    let parseResult = parseJsonFromAI(String(text));
    if (!parseResult.ok) {
      const repairCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: MODIFY_SYSTEM_PROMPT },
          { role: "user", content: "Return ONLY valid JSON, no markdown. Previous response was invalid. Try again:\n\n" + userMessage },
        ],
        temperature: 0.2,
        max_tokens: 8000,
      });
      const retryText =
        repairCompletion.output_text ??
        repairCompletion.output?.[0]?.content?.[0]?.text ??
        repairCompletion.choices?.[0]?.message?.content ??
        "";
      parseResult = parseJsonFromAI(String(retryText));
    }
    if (!parseResult.ok) {
      throw new Error("AI generation failed. Retrying...");
    }
    const parsed = parseResult.parsed;
    const files = Array.isArray(parsed.files)
      ? parsed.files
          .filter((f) => f && (f.path === "src/App.tsx" || f.path === "App.tsx") && typeof f.content === "string")
          .map((f) => ({
            path: "src/App.tsx",
            content: String(f.content),
            type: "file",
          }))
      : [];
    if (files.length === 0) throw new Error("No updated App.tsx in response");
    const appContent = files[0].content;
    const baseFiles = readBaseTemplate();
    const mergedFiles = [
      ...baseFiles,
      { path: "src/App.tsx", content: appContent, type: "file" },
    ];
    console.log("[AI] Modify success");
    return {
      success: true,
      project: {
        name: String(parsed.name || "app").trim(),
        description: typeof parsed.description === "string" ? parsed.description : prompt,
        files: mergedFiles,
      },
    };
  }

  console.log("[AI] New generation, prompt length:", prompt.length);

  const context =
    existingFiles.length > 0
      ? "\n\nCurrent project files (for context only):\n" +
        existingFiles
          .slice(0, 20)
          .map((f) => `--- ${f.path} ---\n${(f.content || "").slice(0, 500)}`)
          .join("\n")
      : "";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt + context },
    ],
    temperature: 0.9,
    max_tokens: 6000,
  });

  const text =
    completion.output_text ??
    completion.output?.[0]?.content?.[0]?.text ??
    completion.choices?.[0]?.message?.content ??
    "";

  const raw = String(text);
  let parseResult = parseJsonFromAI(raw);
  if (!parseResult.ok) {
    const repairCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Return ONLY valid JSON. Do not include explanations or markdown. Previous response was invalid. Try again:\n\n" + prompt + context },
      ],
      temperature: 0.3,
      max_tokens: 6000,
    });
    const retryText =
      repairCompletion.output_text ??
      repairCompletion.output?.[0]?.content?.[0]?.text ??
      repairCompletion.choices?.[0]?.message?.content ??
      "";
    parseResult = parseJsonFromAI(String(retryText));
  }
  if (!parseResult.ok) {
    throw new Error("AI generation failed. Retrying...");
  }
  const parsed = parseResult.parsed;

  const name = String(parsed.name || "app").trim();
  const description = typeof parsed.description === "string" ? parsed.description : prompt;
  let allFiles = Array.isArray(parsed.files)
    ? parsed.files.filter((f) => f && typeof f.path === "string" && typeof f.content === "string")
    : [];

  if (!hasAppTsx(parsed)) {
    const appTsxRetryPrompt = "You must include src/App.tsx in the response. Return valid JSON only. No markdown.\n\nOriginal prompt: " + prompt + context;
    const repairCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: appTsxRetryPrompt },
      ],
      temperature: 0.3,
      max_tokens: 6000,
    });
    const retryText =
      repairCompletion.output_text ??
      repairCompletion.output?.[0]?.content?.[0]?.text ??
      repairCompletion.choices?.[0]?.message?.content ??
      "";
    const retryResult = parseJsonFromAI(String(retryText));
    if (retryResult.ok && Array.isArray(retryResult.parsed.files)) {
      allFiles = retryResult.parsed.files.filter((f) => f && typeof f.path === "string" && typeof f.content === "string");
    }
  }

  allFiles = ensureAppTsxInFiles(allFiles);

  const appFile = allFiles.find(
    (f) => f.path === "src/App.tsx" || f.path === "App.tsx"
  );
  if (!appFile || typeof appFile.content !== "string") {
    throw new Error("No src/App.tsx in response.");
  }

  const sanitizedAppContent = sanitizeAppTsx(appFile.content);

  const baseFiles = readBaseTemplate();
  const basePaths = new Set(baseFiles.map((f) => f.path));
  const aiOverrides = new Map(allFiles.map((f) => {
    const path = f.path === "App.tsx" ? "src/App.tsx" : f.path;
    const content = (path === "src/App.tsx" ? sanitizedAppContent : String(f.content));
    return [path, { path, content, type: "file" }];
  }));
  const merged = baseFiles.map((f) => {
    const over = aiOverrides.get(f.path);
    return over ? { path: f.path, content: over.content, type: "file" } : f;
  });
  const extra = allFiles
    .filter((f) => {
      const p = f.path === "App.tsx" ? "src/App.tsx" : f.path;
      return !basePaths.has(p) && p.startsWith("src/");
    })
    .map((f) => ({ path: f.path === "App.tsx" ? "src/App.tsx" : f.path, content: String(f.content), type: "file" }));
  const files = [...merged, ...extra];

  console.log("[AI] Generation success, files:", files.map((f) => f.path).join(", "));
  return { success: true, project: { name, description, files } };
}

const PORT = Number(process.env.API_PORT) || 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/generate") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: true, message: "Not Found" }));
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;
  let parsed;
  try {
    parsed = JSON.parse(body || "{}");
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: true, message: "Invalid JSON body" }));
    return;
  }

  try {
    const result = await handleGenerate(parsed);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error("[AI] Generate error:", err?.message || err);
    let message = "Generation failed";
    const is401 = err?.status === 401 || (err?.message && String(err.message).includes("401"));
    const isInvalidKey =
      err?.code === "invalid_api_key" ||
      (err?.message && /invalid|incorrect.*api key/i.test(String(err.message)));
    if (is401 || isInvalidKey) {
      message =
        "OpenAI rejected the API key. Try: 1) Create a new key at https://platform.openai.com/account/api-keys (Create new secret key). 2) If you use a project key (sk-proj-...), add OPENAI_ORG_ID and OPENAI_PROJECT_ID to .env (find them in your project’s Settings in the OpenAI dashboard). 3) Put the key in .env as OPENAI_API_KEY=sk-... with no quotes. 4) Restart the server (npm run dev).";
    } else if (err instanceof Error) {
      message = err.message;
      if (err.message && err.message.includes("Internal server error")) {
        message = "OpenAI API is temporarily unavailable. Try again in a moment.";
      }
      if (err.message && (err.message.includes("429") || err.message.includes("rate limit"))) {
        message = "Rate limit exceeded. Wait a moment and try again.";
      }
    }
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: true, message }));
  }
});

server.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}/api/generate`);
  if (!OPENAI_API_KEY) console.warn("Generate requests will fail until OPENAI_API_KEY is set in .env");
});
