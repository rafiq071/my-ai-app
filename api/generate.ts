import "dotenv/config";
import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runPipeline } from "../ai/pipeline";

// Initialize once so env is loaded (dotenv/config above). On Vercel, set OPENAI_API_KEY in Project Settings → Environment Variables.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Extract a user-facing string from any thrown value (including OpenAI APIError). */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    const inner = o.error;
    if (inner && typeof inner === "object" && typeof (inner as Record<string, unknown>).message === "string") {
      const msg = (inner as Record<string, unknown>).message as string;
      if (msg) return msg;
    }
  }
  const s = String(err);
  if (s && s !== "[object Object]") return s;
  return "Something went wrong. Please try again.";
}

const PLAN_PROMPT = `You are a product designer. Given a user request for a website, output a JSON plan only. No markdown.

Schema (return exactly this JSON shape):
{
  "pages": ["Home"],
  "components": ["Navbar", "Hero", "Features", "Showcase", "About", "Testimonials", "Pricing", "FAQ", "Contact", "Footer"],
  "design": {
    "framework": "React",
    "styling": "TailwindCSS",
    "ui": "modern SaaS"
  }
}

Include all section components: Navbar, Hero, Features, Showcase, About, Testimonials, Pricing, FAQ, Contact, Footer. Return ONLY valid JSON.`;

const TEMPLATE_HINT = `
Convert a SHORT PRODUCT IDEA into a complete production-quality SaaS landing page. Examples: "AI SaaS for marketing automation", "Fitness coaching app", "Crypto portfolio tracker", "AI legal document generator". Infer the full product. Design quality must match Stripe, Linear, Vercel, Notion, Framer, Raycast — the page must look like a real startup website. STEP 1: Internally design (product positioning, hero messaging, key features, pricing, testimonials style, visual design system with typography hierarchy, spacing, cards, buttons). STEP 2: Generate with React + TypeScript + Tailwind only; no inline styles. Use the exact spacing and component specs; semantic HTML; accessibility; responsive grids; output only JSON.
`;

const SYSTEM_PROMPT = `You are a world-class product designer and senior React + Tailwind engineer. Your task is to convert a SHORT PRODUCT IDEA into a complete, production-quality SaaS landing page.

The user may give a simple prompt such as: "AI SaaS for marketing automation" | "Fitness coaching app" | "Crypto portfolio tracker" | "AI legal document generator". You must infer the full product and generate a beautiful modern landing page. Design quality must match: Stripe, Linear, Vercel, Notion, Framer, Raycast. The page must look like a real startup website.

------------------------------------------------
STEP 1 — DESIGN PLAN (apply internally before writing code)

Before writing code, design the page with:
• Define the product positioning
• Define hero messaging
• Define key product features
• Define pricing positioning
• Define testimonials style
• Define visual design system

Design system must include:

Typography hierarchy: Hero → Section titles → Body → Caption

Spacing system: Hero py-20 md:py-28 | Sections py-16 md:py-24 | Container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

Card system: rounded-xl, shadow-lg, hover:shadow-xl, hover:-translate-y-1, transition

Buttons — Primary: bg-gradient-to-r from-indigo-600 to-violet-600, text-white, hover:shadow-lg. Secondary: border border-gray-300, hover:bg-gray-50.

Visual style: Gradient hero; modern SaaS layout; glass / soft shadows; icons for features; responsive grids; smooth hover states.

------------------------------------------------
STEP 2 — GENERATE THE WEBSITE

After designing internally, generate the landing page using React + TypeScript + Tailwind. NO inline styles. Tailwind utility classes only.

------------------------------------------------
REQUIRED FILE STRUCTURE

Return code for: src/App.tsx | src/components/Navbar.tsx, Hero.tsx, Features.tsx, Showcase.tsx, About.tsx, Testimonials.tsx, Pricing.tsx, FAQ.tsx, Contact.tsx, Footer.tsx | src/components/ui/Button.tsx, Card.tsx, Container.tsx, Section.tsx | src/index.css

------------------------------------------------
PAGE STRUCTURE

Navbar | Hero (headline, supporting text, primary CTA, secondary CTA, hero illustration or UI mock) | Features (6 cards, icon + title + description) | Product Showcase (alternating image + text rows) | About (company/product explanation, trust badges or stats) | Testimonials (3–6: avatar, name, role, quote) | Pricing (3 tiers: Starter | Pro MOST POPULAR | Enterprise — Pro must have badge "Most Popular", larger shadow, slight scale) | FAQ (accordion: aria-expanded, aria-controls, keyboard accessible) | Contact (form: name, email, message with labels; also email, phone, location) | Footer (logo, product links, company links, social: Twitter, GitHub, LinkedIn with aria-label; current year)

------------------------------------------------
ACCESSIBILITY

Semantic HTML: header, nav, main, section, article, footer. Images must include alt text. Forms must include labels. FAQ must support keyboard navigation.

------------------------------------------------
RESPONSIVE

Mobile first. Use sm:, md:, lg:. Grids must adapt to mobile.

------------------------------------------------
OUTPUT FORMAT

Return ONLY valid JSON. Do NOT include explanations. No markdown.

Preferred: { "src/App.tsx": "...", "src/components/Navbar.tsx": "...", ... }

Alternative: { "files": [ { "path": "src/App.tsx", "content": "..." }, ... ] }

Return only the code files. Every section must have visual UI. Nav links must work: <a href="#features"> etc. and matching section id="features".

------------------------------------------------

NAVBAR — WORKING LINKS (CRITICAL)

All navigation links and the header CTA MUST work. Use anchor links that scroll to sections.

• Nav links: Use <a href="#features">Features</a>, <a href="#showcase">Product</a>, <a href="#about">About</a>, <a href="#pricing">Pricing</a>, <a href="#faq">FAQ</a>, <a href="#contact">Contact</a>. Do NOT use <button> for nav items or empty href="#".
• Header CTA button: Use <a href="#contact">Get Started</a> or <a href="#pricing">View Pricing</a>. Never a button with no onClick/href.
• Every section wrapper MUST have the matching id: <section id="features">, <section id="showcase">, <section id="about">, <section id="pricing">, <section id="faq">, <section id="contact">.
• When mapping over children or any array prop (e.g. in Card, feature lists), always guard: use (children || []).map(...) or (items || []).map(...) so the preview never hits "Cannot read properties of undefined (reading 'map')".

------------------------------------------------

CORE RULES

• React functional components only
• Always export default App
• TailwindCSS only
• No inline styles
• No plain HTML layouts
• Fully responsive
• Modular components
• Production-ready UI

------------------------------------------------

DESIGN SYSTEM — PREMIUM LOOK (NO PLAIN BLACK ON WHITE)

Avoid flat black text on pure white. Use a premium, modern palette:

• Page background: soft gradient or tint — e.g. bg-gradient-to-b from-slate-50 to-white or bg-gray-50. Never plain white for full page.
• Headlines: text-slate-900 or text-gray-900 (not pure black). Hero can use white text if hero has a dark/gradient background.
• Body text: text-slate-600 or text-gray-600.
• Accent: use a primary color for CTAs and links — e.g. bg-indigo-600 hover:bg-indigo-700, or gradient bg-gradient-to-r from-indigo-600 to-violet-600. Buttons should stand out.
• Navbar: bg-white/90 backdrop-blur border-b border-gray-200, or dark nav with bg-slate-900 text-white.
• Hero: either (a) light — bg-gradient-to-br from-indigo-50/30 to-white, headline text-slate-900, or (b) dark — bg-gradient-to-br from-slate-900 to-slate-800, headline text-white, subtext text-slate-300.
• Cards: bg-white with border border-slate-200 shadow-lg shadow-slate-200/50 rounded-xl or rounded-2xl. Hover: hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300. Use subtle shadows so sections have depth.
• Section spacing: py-16 md:py-24. Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8.

------------------------------------------------

UI PRIMITIVES

src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Container.tsx
src/components/ui/Section.tsx

Button: Primary — rounded-xl px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition. Secondary — rounded-xl px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition.

Cards: rounded-2xl border border-gray-200 p-6 bg-white shadow-lg shadow-gray-200/50 transition hover:shadow-xl. Feature cards: same with hover:-translate-y-1.

------------------------------------------------

MANDATORY PAGE COMPONENTS

src/components/Navbar.tsx
src/components/Hero.tsx
src/components/Features.tsx
src/components/Showcase.tsx
src/components/About.tsx
src/components/Testimonials.tsx
src/components/Pricing.tsx
src/components/FAQ.tsx
src/components/Contact.tsx
src/components/Footer.tsx
src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Container.tsx
src/components/ui/Section.tsx

------------------------------------------------

PAGE STRUCTURE (each section must have id for nav links)

Navbar (logo, <a href="#features"> etc., <a href="#contact"> CTA)
Hero (id="hero", gradient, headline, 2 CTAs, hero illustration/mock)
Features (id="features")
Showcase (id="showcase")
About (id="about")
Testimonials
Pricing (id="pricing") — Pro tier "Most Popular"
FAQ (id="faq") — accordion with aria-expanded/aria-controls
Contact (id="contact")
Footer (social aria-label, copyright year)

------------------------------------------------

HERO SECTION (VERY IMPORTANT)

Layout

grid grid-cols-1 lg:grid-cols-2 gap-12 items-center

Left side: small badge, headline, supporting text, two CTA buttons. Both buttons MUST be <a href="#contact"> and <a href="#features"> (or #pricing). Do not use <button> without href for CTAs.

Right side MUST contain a SaaS UI preview. Do NOT use empty grey boxes. IMAGES: If you use an <img> tag, the src MUST be a full, working URL that returns a real image. Use ONLY these or equivalent working URLs: https://picsum.photos/600/400 (generic), https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop (team/business), https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop (analytics). Do NOT use relative paths (e.g. /image.png) or placeholder URLs that 404 — they will show a broken image. PREFERRED: Avoid img for hero and use a rich mock instead: a div with bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl p-6 containing labels ("Revenue", "Growth"), numbers ("$12.4k", "+24%"), and small colored bars (divs with bg-indigo-500 h-8 rounded, varying widths). That way nothing can break and the design stays high quality.

------------------------------------------------

FEATURES SECTION

6 feature cards. NEVER use placeholder text like "Feature 1", "Feature 2", or "Description for feature 1".

Layout:

grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8

Each card: a unique inline SVG icon (or emoji that fits the feature), a REAL title and 1–2 sentence description that match the user's product. Example: for "Guest Posting" use titles like "High-DA Placements", "Niche-Relevant Outreach", "Custom Reporting" with specific benefit copy. Cards must use hover lift animation.

------------------------------------------------

SHOWCASE SECTION

Alternating layout sections. Left text / right UI mock, then reverse.

grid grid-cols-1 lg:grid-cols-2 gap-12 items-center

The UI side must NOT be empty grey rectangles. Use real-looking content: section labels ("Revenue", "Visits"), fake numbers (e.g. "$12,450", "2,340"), progress bars (a div with width and bg color), or a topic-relevant image (e.g. <img src="https://images.unsplash.com/..." className="rounded-xl w-full object-cover" alt="" />). Build mini analytics panels, small tables with row text, or dashboard cards with numbers so the right side looks like a real product screenshot.

------------------------------------------------

PRICING SECTION (3 TIERS: STARTER, PRO RECOMMENDED, ENTERPRISE)

3 pricing cards. NEVER use "Feature 1", "Feature 2", "Feature 3" as list items.

grid grid-cols-1 md:grid-cols-3 gap-8

Tiers: Starter, Pro (recommended), Enterprise. Middle card (Pro) MUST be highlighted: scale-105 border-2 border-indigo-500 bg-gradient-to-b from-indigo-50 to-white shadow-xl shadow-indigo-500/20; add a "Recommended" or "Popular" badge above it. Each card: plan name, price (e.g. $0, $29, $99), period (/month), short description, 4–6 REAL feature bullets that match the product, CTA button (<a href="#contact">). Use rounded-xl cards.

------------------------------------------------

TESTIMONIALS

3 testimonial cards. NEVER use "Client 1", "Company 1", or "Testimonial from client 1".

Each card: avatar (use <img src="https://i.pravatar.cc/100?u=1" alt="" className="rounded-full w-12 h-12" /> and vary u=1, u=2, u=3 for each card, OR use initials in a colored circle e.g. "SC" for Sarah Chen), a realistic fake name (e.g. Sarah Chen, Marcus Webb, Priya Patel), a company/role (e.g. "Head of Marketing, TechFlow"), and a short specific quote that sounds real (e.g. "We doubled our backlinks in 3 months."). Layout: grid md:grid-cols-3 gap-8.

------------------------------------------------

ABOUT US SECTION (MANDATORY — ATTRACTIVE)

Section with id="about". Headline "About Us" or "Who We Are". MUST include at least one high-quality photo: use <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Team" className="rounded-2xl w-full object-cover shadow-xl" /> (or https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80 for office). Two-column layout: image left or right (rounded-2xl, shadow-xl), other side: mission headline, 2–3 short paragraphs of real copy, then a row of value badges (e.g. "Customer first", "Quality focused") in rounded-xl pills with bg-indigo-50 text-indigo-700. Optional: small stats row ("10+ Years" "500+ Clients") with bold numbers. Use bg-gradient-to-b from-slate-50 to-white or similar soft background. No placeholder text.

------------------------------------------------

FAQ SECTION (MANDATORY — 5–8 QUESTIONS, ACCESSIBLE ACCORDION)

Section with id="faq". Headline "Frequently Asked Questions" with subtitle. 5–8 Q&A pairs. Use useState for accordion (open index). Each item: rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow; border-l-4 border-indigo-500 when open. Question: <button> or clickable div with aria-expanded={open === i} aria-controls={"faq-answer-" + i} id={"faq-question-" + i}, keyboard accessible. Answer: id={"faq-answer-" + i} aria-labelledby={"faq-question-" + i} role="region". Toggle icon (+/− or chevron). Max-w-4xl mx-auto. Section: py-16 md:py-24. End with "Can't find an answer? <a href="#contact">Contact us</a>." No placeholder questions.

------------------------------------------------

CONTACT SECTION (MANDATORY)

Section with id="contact". Headline "Contact Us" or "Get in Touch". MUST include: (1) Contact form with name, email, message fields and submit button (use <form onSubmit={e => e.preventDefault()}>, <label htmlFor="..."> for each input, <input id="...">, <textarea>). (2) Company info: email (mailto:), phone (tel:), and/or location in a card or list. Use rounded-xl cards, good spacing (e.g. grid lg:grid-cols-2 for form + info).

------------------------------------------------

FOOTER (MANDATORY)

Logo (link or text) at top or left. Then 4 columns or grid: Product (e.g. Features, Pricing), Company (About, Contact), Resources (optional), Legal (Terms, Privacy). Social icons: Twitter/X, GitHub, LinkedIn (use <a href="..." aria-label="..."> with icon or text). Copyright line at bottom: © {new Date().getFullYear()} Company Name. Use bg-slate-900 text-slate-300 or bg-slate-100 border-t; padding py-12 or py-16.

------------------------------------------------

CONTENT RULES — NO PLACEHOLDERS

• All copy must be specific to the user's product/topic. Infer from the prompt (e.g. "Guest Posting" → guest posting, SEO, backlinks, content).
• FORBIDDEN: "Feature 1/2/3", "Description for feature X", "Client 1/2/3", "Company 1/2/3", "Testimonial from client X", or any generic placeholder text.
• Features: 6 real titles and descriptions. Pricing: real feature bullets per plan. Testimonials: real-sounding names, companies, and quotes.
• Hero/Showcase right side: never leave empty grey boxes. Prefer a gradient + dashboard mock (labels, numbers, colored bars) so no image can break. If you use <img>, src MUST be a full working URL (e.g. https://picsum.photos/600/400 or https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop). Never use relative paths or fake URLs — they show a broken image icon.

------------------------------------------------

PROMPT EXPANSION

If the user prompt is short (e.g. "AI SaaS for marketing automation", "Landing page for a CRM"), expand it into a FULL high-end landing page: infer the product/service, write all headlines and copy around that theme, and generate every section (Hero, Features, Showcase/Product, About, Testimonials, Pricing, FAQ, Contact, Footer). Never generate minimal or incomplete layouts.

------------------------------------------------

OUTPUT FORMAT

CRITICAL: Your response must be ONLY the JSON object. No markdown, no code fences, no explanation before or after. Start your response with { and end with }. Return STRICT JSON only.

{
 "files":[
  { "path":"src/App.tsx","content":"..." },
  { "path":"src/components/Navbar.tsx","content":"..." },
  { "path":"src/components/Hero.tsx","content":"..." },
  { "path":"src/components/Features.tsx","content":"..." },
  { "path":"src/components/Showcase.tsx","content":"..." },
  { "path":"src/components/Pricing.tsx","content":"..." },
  { "path":"src/components/Testimonials.tsx","content":"..." },
  { "path":"src/components/About.tsx","content":"..." },
  { "path":"src/components/FAQ.tsx","content":"..." },
  { "path":"src/components/Contact.tsx","content":"..." },
  { "path":"src/components/Footer.tsx","content":"..." },
  { "path":"src/components/ui/Button.tsx","content":"..." },
  { "path":"src/components/ui/Card.tsx","content":"..." },
  { "path":"src/components/ui/Container.tsx","content":"..." },
  { "path":"src/components/ui/Section.tsx","content":"..." },
  { "path":"src/index.css","content":"..." }
 ]
}

Never output text outside JSON.
Escape quotes and newlines (\\n, \\").
Response must start with { and end with }.`;

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
Include the FULL content of the modified App.tsx. Escape JSON (\\\\n, \\\\").
Return ONLY valid JSON. No markdown, no explanations.`;

/** Strip markdown code fences from file content (AI sometimes embeds ```tsx in the string). */
function stripMarkdownFromCode(content: string): string {
  let s = String(content || "").trim();
  const tsxMatch = s.match(/^```(?:tsx|jsx|ts|js)?\s*([\s\S]*?)```\s*$/);
  if (tsxMatch && tsxMatch[1]) return tsxMatch[1].trim();
  const anyMatch = s.match(/^```\s*([\s\S]*?)```\s*$/);
  if (anyMatch && anyMatch[1]) return anyMatch[1].trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:tsx|jsx|ts|js)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  return s;
}

function extractJson(text: string): string {
  const t = (text || "").trim();
  const closed = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (closed && closed[1]) return closed[1].trim();
  const unclosed = t.match(/```(?:json)?\s*([\s\S]+)/);
  if (unclosed && unclosed[1]) return unclosed[1].trim();
  return t;
}

/** Extract first balanced { ... } from string. */
function extractBalancedJson(str: string): string | null {
  const start = str.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  let quote = "";
  for (let i = start; i < str.length; i++) {
    const c = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === quote) inString = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}

/** Repair common JSON mistakes from LLM output (trailing commas, BOM, truncation). */
function repairJson(s: string): string {
  let out = s
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trim();
  out = out.replace(/,(\s*[}\]])/g, "$1");
  return out.trim();
}

/** Try to fix truncated JSON by appending missing closing brackets. */
function tryCloseJson(s: string): string {
  const trimmed = s.trim();
  if (!trimmed.startsWith("{")) return s;
  let depth = 0;
  let arrayDepth = 0;
  let i = 0;
  const len = trimmed.length;
  let inString = false;
  let escape = false;
  let quote = "";
  while (i < len) {
    const c = trimmed[i];
    if (escape) {
      escape = false;
      i++;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === quote) inString = false;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      i++;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === "[") arrayDepth++;
    else if (c === "]") arrayDepth--;
    i++;
  }
  let suffix = "";
  while (arrayDepth > 0) {
    suffix += "]";
    arrayDepth--;
  }
  while (depth > 0) {
    suffix += "}";
    depth--;
  }
  return trimmed + suffix;
}

/** Normalize API response to files array. Accepts either { files: [{ path, content }] } or flat { "src/App.tsx": "...", ... }. */
function normalizeToFilesArray(parsed: any): { path: string; content: string }[] {
  if (!parsed || typeof parsed !== "object") return [];
  if (Array.isArray(parsed.files)) {
    return parsed.files
      .filter((f: any) => f && typeof f.path === "string" && typeof f.content === "string")
      .map((f: any) => ({ path: String(f.path).trim(), content: String(f.content) }));
  }
  const flat = Object.entries(parsed)
    .filter(
      ([k, v]) =>
        typeof v === "string" &&
        k.length > 0 &&
        (k.includes("/") || k.endsWith(".tsx") || k.endsWith(".ts") || k.endsWith(".css") || k.endsWith(".jsx"))
    )
    .map(([path, content]) => ({ path: String(path).trim(), content: String(content) }));
  return flat.length > 0 ? flat : [];
}

/** Safety parser: strip code fences, trim, extract JSON, repair, then parse. */
function parseJsonFromAI(raw: string): { ok: boolean; parsed?: any } {
  let text = String(raw || "");
  let cleaned = text
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
    .replace(/```\s*$/g, "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const candidates = [
    cleaned,
    extractJson(text),
    extractBalancedJson(text),
    extractBalancedJson(cleaned),
  ].filter(Boolean) as string[];
  const toTry = candidates.map((s) => String(s).trim()).filter((s) => s.startsWith("{"));
  for (const trimmed of toTry) {
    for (const candidate of [trimmed, repairJson(trimmed), tryCloseJson(trimmed), tryCloseJson(repairJson(trimmed))]) {
      try {
        const parsed = JSON.parse(candidate);
        return { ok: true, parsed };
      } catch {
        //
      }
    }
  }
  const fallback = extractBalancedJson(cleaned) || extractBalancedJson(text);
  if (fallback) {
    for (const candidate of [fallback, repairJson(fallback), tryCloseJson(fallback), tryCloseJson(repairJson(fallback))]) {
      try {
        return { ok: true, parsed: JSON.parse(candidate) };
      } catch {
        //
      }
    }
  }
  return { ok: false };
}

function autoFixGeneratedFiles(
  files: { path: string; content: string }[]
): { path: string; content: string }[] {
  const reactImport =
    'import React from "react";\nimport { useState, useEffect, useRef, useMemo, useCallback } from "react";\n';
  return files.map((f) => {
    let content = String(f.content || "").trim();
    const path = f.path === "App.tsx" ? "src/App.tsx" : f.path;
    const isTsx = path.endsWith(".tsx") || path.endsWith(".jsx");
    if (!isTsx) return { ...f, path, content };
    if (!content.includes("export default")) {
      content = content.replace(/\bexport\s+(function|const)\s+(\w+)\s*\(/g, "export default function $2(");
      if (!content.includes("export default"))
        content = content.replace(/^(function\s+\w+)\s*\(/m, "export default $1(");
    }
    if (!content.includes('from "react"') && !content.includes("from 'react'")) {
      const hasHooks = /\b(useState|useEffect|useRef|useMemo|useCallback)\s*\(/.test(content);
      if (hasHooks) content = reactImport + content;
      else content = 'import React from "react";\n' + content;
    }
    content = content.replace(/import\s+type\s+[^;]+;/g, "");
    content = content.replace(/import\s+[^;]*from\s+['"][^'"]*['"]\s*;?\s*$/gm, (line) => {
      if (/from\s+['"]react['"]/.test(line)) return line;
      if (/from\s+['"]\.\.?\//.test(line)) return line;
      return "";
    });
    content = content.replace(/import\s+[\s\S]*?from\s+['"]lucide-react['"]\s*;?/g, "");
    return { ...f, path, content };
  });
}

const DEFAULT_ABOUT_TSX = `import React from "react";
export default function About() {
  return (
    <section id="about" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Our team" className="rounded-2xl w-full object-cover shadow-xl" />
            <div className="absolute -bottom-4 -right-4 rounded-2xl bg-white shadow-xl border border-slate-100 px-6 py-4 flex gap-8">
              <div><div className="text-2xl font-bold text-indigo-600">10+</div><div className="text-sm text-slate-600">Years</div></div>
              <div><div className="text-2xl font-bold text-indigo-600">500+</div><div className="text-sm text-slate-600">Clients</div></div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">About Us</h2>
            <p className="text-lg text-slate-600 max-w-xl mb-4">We help businesses grow with modern tools and expert support. Our mission is to deliver real value through quality products and outstanding service.</p>
            <p className="text-lg text-slate-600 max-w-xl mb-8">Founded with a focus on simplicity and results, we work with teams of all sizes to achieve their goals. Get in touch to learn how we can help you.</p>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm">Quality first</span>
              <span className="px-4 py-2 rounded-xl bg-violet-50 text-violet-700 font-semibold text-sm">Customer focused</span>
              <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm">Results driven</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const DEFAULT_TEAM_TSX = `import React from "react";
const team = [
  { name: "Sarah Chen", role: "CEO & Co-founder", bio: "Former VP at a Fortune 500. Passionate about building products that scale.", img: "https://i.pravatar.cc/160?u=sarah" },
  { name: "Marcus Webb", role: "CTO", bio: "Ex-Google engineer. Loves clean architecture and developer experience.", img: "https://i.pravatar.cc/160?u=marcus" },
  { name: "Priya Patel", role: "Head of Product", bio: "Product leader with 12 years in SaaS. User obsession is the north star.", img: "https://i.pravatar.cc/160?u=priya" },
  { name: "Alex Rivera", role: "Head of Design", bio: "Design systems and brand. Making complex products feel simple.", img: "https://i.pravatar.cc/160?u=alex" },
];
export default function Team() {
  return (
    <section id="team" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Team</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">The people behind the product. We're here to help you succeed.</p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {team.map((member, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <img src={member.img} alt={member.name} className="rounded-full w-20 h-20 mx-auto mb-4 object-cover ring-4 ring-slate-100" />
            <h3 className="font-bold text-slate-900 text-lg">{member.name}</h3>
            <p className="text-indigo-600 font-medium text-sm mb-2">{member.role}</p>
            <p className="text-slate-600 text-sm">{member.bio}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`;

const DEFAULT_FAQ_TSX = String.raw`
import React, { useState } from "react";

export default function FAQ() {
  const [open, setOpen] = useState(null);

  const items = [
    { q: "What is this platform?", a: "This is an AI generated website." },
    { q: "Can I customize it?", a: "Yes. All components are editable." },
    { q: "Is it production ready?", a: "Yes. It generates clean React code." }
  ];

  return (
    <section id="faq" className="py-20">
      <h2 className="text-3xl font-bold text-center mb-10">FAQ</h2>
      <div className="max-w-2xl mx-auto">
        {items.map((item, i) => (
          <div key={i} className="border-b py-4">
            <button
              className="font-semibold w-full text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {item.q}
            </button>
            {open === i && <p className="mt-2 text-gray-600">{item.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
`;

const DEFAULT_CONTACT_TSX = `import React from "react";
export default function Contact() {
  return (
    <section id="contact" className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Contact Us</h2>
            <p className="text-lg text-slate-600 mb-8">Have a question or want to get started? Send us a message and we'll get back to you quickly.</p>
            <div className="space-y-4">
              <a href="mailto:support@example.com" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
                <span className="text-2xl">✉</span>
                <div><div className="text-sm text-slate-500">Email</div><div className="font-medium text-slate-900">support@example.com</div></div>
              </a>
            </div>
          </div>
          <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Send a message</h3>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input type="text" placeholder="Your name" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" placeholder="you@example.com" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea rows={4} placeholder="How can we help?" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors">Send message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}`;

function isStubContent(content: string, minLen = 400): boolean {
  const s = String(content || "").trim();
  return s.length < minLen || !s.includes("id=") || /placeholder|TODO|coming soon/i.test(s);
}

const MINIMAL_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>App</title></head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>`;

const MINIMAL_MAIN_TSX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
`;

/** Ensure App.tsx, index.html, and main.tsx exist in the file list; add minimal versions if missing. */
function ensureRequiredFiles(
  files: { path: string; content: string; type: "file" }[]
): { path: string; content: string; type: "file" }[] {
  const out = [...files];
  const has = (p: string) => out.some((f) => f.path === p || f.path === p.replace("src/", ""));
  if (!has("src/App.tsx")) {
    const appContent = out.find((f) => f.path === "App.tsx")?.content;
    out.push({
      path: "src/App.tsx",
      content: typeof appContent === "string" ? appContent : "export default function App() { return <div>App</div>; }",
      type: "file",
    });
  }
  if (!has("index.html")) {
    out.push({ path: "index.html", content: MINIMAL_INDEX_HTML, type: "file" });
  }
  if (!has("src/main.tsx")) {
    out.push({ path: "src/main.tsx", content: MINIMAL_MAIN_TSX, type: "file" });
  }
  return out;
}

function ensureAboutFaqContact(
  allFiles: { path: string; content: string }[],
  appContent: string
): { files: { path: string; content: string }[]; appContent: string } {
  let files = [...allFiles];
  const aboutFile = files.find((f) => f.path === "src/components/About.tsx");
  const faqFile = files.find((f) => f.path === "src/components/FAQ.tsx");
  const contactFile = files.find((f) => f.path === "src/components/Contact.tsx");

  if (!aboutFile || isStubContent(aboutFile.content)) {
    files = files.filter((f) => f.path !== "src/components/About.tsx");
    files.push({ path: "src/components/About.tsx", content: DEFAULT_ABOUT_TSX });
  }
  if (!faqFile || isStubContent(faqFile.content)) {
    files = files.filter((f) => f.path !== "src/components/FAQ.tsx");
    files.push({ path: "src/components/FAQ.tsx", content: DEFAULT_FAQ_TSX });
  }
  if (!contactFile || isStubContent(contactFile.content)) {
    files = files.filter((f) => f.path !== "src/components/Contact.tsx");
    files.push({ path: "src/components/Contact.tsx", content: DEFAULT_CONTACT_TSX });
  }

  let out = String(appContent || "");
  if (!out.includes("<About") && !out.includes("<About />")) {
    out = out.replace(/(<\/Testimonials>)/, "$1\n      <About />");
    if (!out.includes("<About")) out = out.replace(/(<Testimonials\s*\/>)/, "$1\n      <About />");
  }
  if (!out.includes("<FAQ") && !out.includes("<FAQ />")) {
    out = out.replace(/(<About\s*\/>)/, "$1\n      <FAQ />");
    if (!out.includes("<FAQ")) out = out.replace(/(<\/About>)/, "$1\n      <FAQ />");
  }
  if (!out.includes("<Contact") && !out.includes("<Contact />")) {
    out = out.replace(/(<Footer)/, "<Contact />\n      $1");
    if (!out.includes("<Contact")) out = out.replace(/(<\/FAQ>)/, "$1\n      <Contact />");
  }
  return { files, appContent: out };
}

async function handleRequest(req: VercelRequest, res: VercelResponse) {
  // Allow GET so you can check from browser: open https://your-app.vercel.app/api/generate
  if (req.method === "GET") {
    const hasKey = !!process.env.OPENAI_API_KEY;
    return res.status(200).json({
      ok: true,
      hasApiKey: hasKey,
      message: hasKey ? "OPENAI_API_KEY is set. Generation should work." : "OPENAI_API_KEY is missing. Add it in Vercel → Project Settings → Environment Variables and redeploy.",
    });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("[Config Error] Missing OPENAI_API_KEY");
    return res.status(500).json({
      success: false,
      error: "Missing OPENAI_API_KEY environment variable",
    });
  }

  let body: { prompt?: string; projectId?: string; existingFiles?: { path: string; content: string }[] };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ success: false, error: "Invalid JSON body" });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({ success: false, error: "prompt is required" });
  }

  const existingFiles = Array.isArray(body.existingFiles) ? body.existingFiles : [];
  const isModify = (body as { modify?: boolean }).modify === true;

  if (isModify) {
    const appFile = existingFiles.find((f) => f.path === "src/App.tsx" || f.path === "App.tsx");
    if (!appFile || typeof appFile.content !== "string") {
      return res.status(400).json({
        success: false,
        error: "Modify mode requires existing src/App.tsx. Generate a landing page first.",
      });
    }
    try {
      const userMessage = `User instruction: ${prompt}\n\nExisting src/App.tsx:\n\`\`\`tsx\n${appFile.content}\n\`\`\`\n\nReturn the full updated App.tsx as JSON in the "files" array. Only include the modified src/App.tsx.`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: MODIFY_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 8000,
        response_format: { type: "json_object" },
      });
      const text = completion.choices?.[0]?.message?.content ?? "";
      let parseResult = parseJsonFromAI(text);
      if (!parseResult.ok) {
        const retryCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: MODIFY_SYSTEM_PROMPT },
            { role: "user", content: "Return ONLY valid JSON, no markdown. Previous response was invalid. Try again:\n\n" + userMessage },
          ],
          temperature: 0.2,
          max_tokens: 8000,
          response_format: { type: "json_object" },
        });
        const retryText = retryCompletion.choices?.[0]?.message?.content ?? "";
        parseResult = parseJsonFromAI(retryText);
      }
      if (!parseResult.ok || !parseResult.parsed) {
        return res.status(500).json({ success: false, error: "AI did not return valid JSON for modify." });
      }
      const parsed = parseResult.parsed;
      const files = Array.isArray(parsed.files)
        ? parsed.files.filter(
            (f: any) => f && (f.path === "src/App.tsx" || f.path === "App.tsx") && typeof f.content === "string"
          )
        : [];
      if (files.length === 0) {
        return res.status(500).json({ success: false, error: "No updated App.tsx in response." });
      }
      let appContent = String(files[0].content);
      appContent = stripMarkdownFromCode(appContent);
      const name = String(parsed.name || "app").trim();
      const description = typeof parsed.description === "string" ? parsed.description : prompt;
      return res.status(200).json({
        success: true,
        project: {
          name,
          description,
          files: [{ path: "src/App.tsx", content: appContent }],
        },
      });
    } catch (err) {
      console.error("Modify error:", err);
      const message = getErrorMessage(err);
      return res.status(500).json({ success: false, error: message });
    }
  }

  try {
    console.log("[Pipeline] Starting generation");
    const result = await runPipeline(prompt, openai, console.log);
    console.log("[Pipeline] Completed");

    if (result.status === "error") {
      const errMsg = (result.error && String(result.error).trim()) || "Generation failed";
      return res.status(500).json({
        success: false,
        error: errMsg,
      });
    }
    if (!result.files?.length) {
      const errMsg = (result.error && String(result.error).trim()) || "Pipeline produced no files";
      return res.status(500).json({
        success: false,
        error: errMsg,
      });
    }

    let files: { path: string; content: string; type: "file" }[] = result.files.map((f) => ({
      path: f.path,
      content: f.content,
      type: "file" as const,
    }));

    const appFile = files.find((f) => f.path === "src/App.tsx" || f.path === "App.tsx");
    if (appFile && typeof appFile.content === "string") {
      const { files: filesWithSections, appContent: patchedApp } = ensureAboutFaqContact(files, appFile.content);
      files = filesWithSections.map((f) => ({ ...f, type: "file" as const }));
      const idx = files.findIndex((f) => f.path === "src/App.tsx" || f.path === "App.tsx");
      if (idx !== -1) files[idx] = { ...files[idx], content: patchedApp };
    }

    files = ensureRequiredFiles(files);

    return res.status(200).json({
      success: true,
      project: { name: "app", description: prompt, files },
      pipeline: {
        status: result.status,
        files_created: result.files_created,
        fixes_applied: result.fixes_applied,
      },
    });
  } catch (err) {
    console.error("[Pipeline Error]", err);
    const message = getErrorMessage(err);
    return res.status(500).json({
      success: false,
      error: err?.message || message || "Generation failed",
    });
  }
}

/** Ensure every response is JSON so the client never sees HTML error pages. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await handleRequest(req, res);
  } catch (err) {
    console.error("[api/generate] Unhandled error:", err);
    const message = getErrorMessage(err);
    try {
      return res.status(500).json({ success: false, error: message });
    } catch {
      // res may already be sent
    }
  }
}
