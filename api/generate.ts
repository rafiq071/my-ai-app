import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const PLAN_PROMPT = `You are a product designer. Given a user request for a website, output a JSON plan only. No markdown.

Schema (return exactly this JSON shape):
{
  "pages": ["Home"],
  "components": ["Navbar", "Hero", "Features", "Testimonials", "Pricing", "CTA", "Footer"],
  "design": {
    "framework": "React",
    "styling": "TailwindCSS",
    "ui": "modern SaaS"
  }
}

Include all section components: Navbar, Hero, Features, Testimonials, Pricing, CTA, Footer. Return ONLY valid JSON.`;

const TEMPLATE_HINT = `
Use proven SaaS landing page layout patterns used by modern startups.

Preferred UI structures:

Hero with product preview
Feature grid (3 or 6 cards)
Alternating product sections
Pricing comparison table
Customer testimonials grid
Centered CTA banner
Multi-column footer

Design guidelines:

• Use generous spacing
• Use clear typography hierarchy
• Avoid cramped layouts
• Use grid systems
• Use visual hierarchy

Visual style inspiration:

Stripe
Linear
Vercel
Framer
Lovable

Generated pages must feel like real SaaS marketing sites.
`;

const SYSTEM_PROMPT = `You are a world-class senior frontend engineer and product designer building modern SaaS marketing websites comparable to Stripe, Linear, Vercel, and Lovable.

You NEVER generate text-only sections.

Every section MUST contain visual UI elements such as:

• cards
• dashboards
• analytics panels
• UI preview blocks
• feature cards
• pricing tables
• testimonial cards

Every page must look like a real funded startup landing page: modern, highly optimized, semantic structure. No dead links or non-working buttons.

------------------------------------------------

NAVBAR — WORKING LINKS (CRITICAL)

All navigation links and the header CTA MUST work. Use anchor links that scroll to sections.

• Nav links: Use <a href="#features">Features</a>, <a href="#pricing">Pricing</a>, <a href="#about">About</a>, <a href="#faq">FAQ</a>, <a href="#contact">Contact</a>. Do NOT use <button> for nav items or empty href="#".
• Header CTA button: Use <a href="#contact">Get Started</a> or <a href="#pricing">View Pricing</a>. Never a button with no onClick/href.
• Every section wrapper MUST have the matching id: <section id="features">, <section id="pricing">, <section id="about">, <section id="faq">, <section id="contact">.
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

STRICT COMPONENT WHITELIST (CRITICAL)

You are ONLY allowed to use these components in App.tsx:

Navbar
Hero
Features
Showcase
Pricing
Testimonials
CTA
Footer

App.tsx must NEVER reference any other components.

Do NOT create or reference any additional components (e.g. OurTeam, Stats, FAQ, Gallery, About, Contact, or anything else).

If App.tsx references a component, you MUST include the file in src/components/.

Example: If App.tsx uses <OurTeam /> you MUST return src/components/OurTeam.tsx with full content.
Never return App.tsx that references a component without including that component file.

All React components must be declared BEFORE export default App.

Correct order:
1. imports
2. component declarations
3. export default App

Never use a component before it is declared.

------------------------------------------------

DESIGN SYSTEM — PREMIUM LOOK (NO PLAIN BLACK ON WHITE)

Avoid flat black text on pure white. Use a premium, modern palette:

• Page background: soft gradient or tint — e.g. bg-gradient-to-b from-slate-50 to-white or bg-gray-50. Never plain white for full page.
• Headlines: text-slate-900 or text-gray-900 (not pure black). Hero can use white text if hero has a dark/gradient background.
• Body text: text-slate-600 or text-gray-600.
• Accent: use a primary color for CTAs and links — e.g. bg-indigo-600 hover:bg-indigo-700, or gradient bg-gradient-to-r from-indigo-600 to-violet-600. Buttons should stand out.
• Navbar: bg-white/90 backdrop-blur border-b border-gray-200, or dark nav with bg-slate-900 text-white.
• Hero: either (a) light — bg-gradient-to-br from-indigo-50/30 to-white, headline text-slate-900, or (b) dark — bg-gradient-to-br from-slate-900 to-slate-800, headline text-white, subtext text-slate-300.
• Cards: bg-white with border border-gray-200 shadow-lg shadow-gray-200/50 rounded-2xl. Use subtle shadows so sections have depth.
• Section spacing: py-24. Container: max-w-6xl mx-auto px-6.

------------------------------------------------

UI PRIMITIVES

src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Container.tsx
src/components/ui/Section.tsx

Button: Primary — rounded-xl px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition. Secondary — rounded-xl px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition.

Cards: rounded-2xl border border-gray-200 p-6 bg-white shadow-lg shadow-gray-200/50 transition hover:shadow-xl. Feature cards: same with hover:-translate-y-1.

------------------------------------------------

CRITICAL COMPONENT RULES

UI primitives must NEVER be redefined inside page components.

They must ALWAYS be imported from:

src/components/ui/

Example:

import Button from "./ui/Button"
import Card from "./ui/Card"
import Container from "./ui/Container"
import Section from "./ui/Section"

Page components must NEVER declare:

const Card = ...
function Card() ...

or any duplicate primitive definitions.

------------------------------------------------

IMPORT ORDER RULE

All imports must appear at the top of the file.

Correct example:

import Container from "./ui/Container"
import Section from "./ui/Section"
import Card from "./ui/Card"
import Button from "./ui/Button"

export default function Features() {
  return (
    <Section>
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>...</Card>
        </div>
      </Container>
    </Section>
  )
}

------------------------------------------------

STRICT FILE STRUCTURE

Every project must generate these files:

src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Container.tsx
src/components/ui/Section.tsx

These files contain the primitive components.

All other components MUST import them.

------------------------------------------------

PREVENT DUPLICATE DECLARATION

The generator must NEVER create:

const Card =
function Card(
export const Card

inside any file except:

src/components/ui/Card.tsx

Same rule for Button, Container, Section.

------------------------------------------------

MANDATORY PAGE COMPONENTS

src/components/Navbar.tsx
src/components/Hero.tsx
src/components/Features.tsx
src/components/Showcase.tsx
src/components/Pricing.tsx
src/components/Testimonials.tsx
src/components/About.tsx
src/components/FAQ.tsx
src/components/CTA.tsx
src/components/Contact.tsx
src/components/Footer.tsx

------------------------------------------------

PAGE STRUCTURE (each section must have id for nav links)

Navbar (with <a href="#features"> etc. and <a href="#contact"> for CTA)
Hero (CTAs: <a href="#contact">, <a href="#features">)
Features (id="features")
Showcase
Pricing (id="pricing")
Testimonials
About (id="about")
FAQ (id="faq")
CTA
Contact (id="contact")
Footer

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

PRICING SECTION

3 pricing cards. NEVER use "Feature 1", "Feature 2", "Feature 3" as list items.

grid grid-cols-1 md:grid-cols-3 gap-8

Middle card must be highlighted: scale-105 border-2 border-black shadow-xl

Each card: plan name, price, and a REAL feature list that matches the product (e.g. "10 guest posts/month", "Priority support", "Custom reports", "Dedicated manager"). Write 4–6 specific bullets per plan. CTA button per card.

------------------------------------------------

TESTIMONIALS

3 testimonial cards. NEVER use "Client 1", "Company 1", or "Testimonial from client 1".

Each card: avatar (use <img src="https://i.pravatar.cc/100?u=1" alt="" className="rounded-full w-12 h-12" /> and vary u=1, u=2, u=3 for each card, OR use initials in a colored circle e.g. "SC" for Sarah Chen), a realistic fake name (e.g. Sarah Chen, Marcus Webb, Priya Patel), a company/role (e.g. "Head of Marketing, TechFlow"), and a short specific quote that sounds real (e.g. "We doubled our backlinks in 3 months."). Layout: grid md:grid-cols-3 gap-8.

------------------------------------------------

ABOUT US SECTION (MANDATORY)

Section with id="about". Headline "About Us" or "Who We Are". Include at least one real photo: use <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Team" className="rounded-2xl w-full object-cover" /> (or similar Unsplash/Picsum URL) in a two-column layout — image on one side, mission/story (2–3 paragraphs) and optional values on the other. Real copy that matches the product. Rounded-2xl cards or clean grid. No placeholder text.

------------------------------------------------

FAQ SECTION (MANDATORY)

Section with id="faq". Headline "Frequently Asked Questions". 5–7 Q&A pairs. Use <details> and <summary> for accordion, or useState toggles. Questions: specific (e.g. "How do I get started?", "What payment methods do you accept?"). Answers: 2–3 sentences, helpful. Style: rounded-xl cards, border, padding. No "Question 1" placeholders.

------------------------------------------------

CTA SECTION

Centered call to action. CTA button must be <a href="#contact">.

------------------------------------------------

CONTACT SECTION (MANDATORY)

Section with id="contact". Headline "Contact Us" or "Get in Touch". Include EITHER (a) contact form: name, email, message, submit button (use <form>, preventDefault on submit), OR (b) contact info: email (mailto:), phone, address in cards. Style: clean cards, good spacing.

------------------------------------------------

FOOTER

4 columns

Product
Company
Resources
Legal

------------------------------------------------

CONTENT RULES — NO PLACEHOLDERS

• All copy must be specific to the user's product/topic. Infer from the prompt (e.g. "Guest Posting" → guest posting, SEO, backlinks, content).
• FORBIDDEN: "Feature 1/2/3", "Description for feature X", "Client 1/2/3", "Company 1/2/3", "Testimonial from client X", or any generic placeholder text.
• Features: 6 real titles and descriptions. Pricing: real feature bullets per plan. Testimonials: real-sounding names, companies, and quotes.
• Hero/Showcase right side: never leave empty grey boxes. Prefer a gradient + dashboard mock (labels, numbers, colored bars) so no image can break. If you use <img>, src MUST be a full working URL (e.g. https://picsum.photos/600/400 or https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop). Never use relative paths or fake URLs — they show a broken image icon.

------------------------------------------------

PROMPT EXPANSION

If the user prompt is short, expand it automatically into a full SaaS startup landing page with rich UI sections.

Never generate minimal layouts.

------------------------------------------------

OUTPUT FORMAT

IMPORTANT:
Every response MUST include src/App.tsx in the files array,
even when modifying an existing page.

App.tsx must always render the full page layout.

------------------------------------------------

Ensure App.tsx always looks like this:

import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import Features from "./components/Features"
import Showcase from "./components/Showcase"
import Pricing from "./components/Pricing"
import Testimonials from "./components/Testimonials"
import CTA from "./components/CTA"
import Footer from "./components/Footer"

export default function App() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <Hero />
      <Features />
      <Showcase />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}

------------------------------------------------

The response MUST always include ALL required files.
Never return partial updates.
Never omit src/App.tsx.

Return STRICT JSON only:

{
 "files":[
  { "path":"src/App.tsx","content":"..." },

  { "path":"src/components/Navbar.tsx","content":"..." },
  { "path":"src/components/Hero.tsx","content":"..." },
  { "path":"src/components/Features.tsx","content":"..." },
  { "path":"src/components/Showcase.tsx","content":"..." },
  { "path":"src/components/Pricing.tsx","content":"..." },
  { "path":"src/components/Testimonials.tsx","content":"..." },
  { "path":"src/components/CTA.tsx","content":"..." },
  { "path":"src/components/Footer.tsx","content":"..." },

  { "path":"src/components/ui/Button.tsx","content":"..." },
  { "path":"src/components/ui/Card.tsx","content":"..." },
  { "path":"src/components/ui/Container.tsx","content":"..." },
  { "path":"src/components/ui/Section.tsx","content":"..." },

  { "path":"src/index.css","content":"..." }
 ]
}

Never output text outside JSON.
CRITICAL: Your response must be ONLY the JSON object. No markdown, no code fences, no explanation before or after. Start your response with { and end with }.
Escape quotes and newlines (\\n, \\").
Response must start with { and end with }.`;

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

/** STEP 1 — SAFE JSON PARSE */
function tryParseJSON(text: string): { ok: boolean; parsed: any } {
  try {
    const parsed = JSON.parse(text);
    return { ok: true, parsed };
  } catch {
    return { ok: false, parsed: null };
  }
}

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

/** STEP 5 — COMPONENT USAGE DETECTION */
function getComponentUsagesInApp(content: string): string[] {
  const regex = /<([A-Z][A-Za-z0-9]*)/g;
  const ignore = new Set(["div", "span", "section", "main", "header", "footer"]);
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    if (!ignore.has(name)) {
      found.add(name);
    }
  }
  return [...found];
}

/** STEP 6 — DETECT MISSING COMPONENT FILES */
function getMissingComponentFiles(appContent: string, files: { path: string }[]): string[] {
  const paths = new Set(files.map((f) => f.path));
  const used = getComponentUsagesInApp(appContent);
  return used.filter((name) => !paths.has(`src/components/${name}.tsx`));
}

/** STEP 1 — VALIDATE JSON */
function validResponse(parsed: any): boolean {
  return parsed && Array.isArray(parsed.files) && parsed.files.length > 0;
}

/** STEP 2 — NORMALIZE FILE PATHS */
function normalizePaths<T extends { path: string }>(files: T[]): T[] {
  return files.map((f) => {
    let p = (f.path || "").trim();
    if (p === "App.tsx") {
      p = "src/App.tsx";
    }
    if (p.startsWith("components/")) {
      p = "src/" + p;
    }
    if (!p.startsWith("src/")) {
      p = "src/" + p;
    }
    return { ...f, path: p };
  });
}

/** STEP 8 — FINAL PROJECT VALIDATION */
function validForPreview(files: { path: string; content?: string }[]): boolean {
  if (!files || files.length === 0) {
    return false;
  }
  const paths = new Set(files.map((f) => f.path));
  if (!paths.has("src/App.tsx")) {
    return false;
  }
  const app = files.find((f) => f.path === "src/App.tsx");
  if (!app || !app.content) {
    return false;
  }
  const missing = getMissingComponentFiles(app.content, files);
  return missing.length === 0;
}

/** STEP 10 — SYNTAX VALIDATION BEFORE PREVIEW (skip .tsx/.jsx — they use JSX/imports so new Function() would always fail; preview runtime uses Babel) */
function isValidTSX(code: string): boolean {
  try {
    new Function(code);
    return true;
  } catch {
    return false;
  }
}

function validateSyntaxForPreview(files: { path: string; content?: string }[]): void {
  for (const f of files) {
    const path = f.path || "";
    if (path.endsWith(".tsx") || path.endsWith(".jsx")) {
      continue;
    }
    if (path.endsWith(".ts") || path.endsWith(".js")) {
      if (!isValidTSX(String(f.content ?? ""))) {
        throw new Error(`Syntax error detected in ${f.path}`);
      }
    }
  }
}

const REQUIRED_PATHS = [
  "src/App.tsx",
  "src/components/Navbar.tsx",
  "src/components/Hero.tsx",
  "src/components/Features.tsx",
  "src/components/Showcase.tsx",
  "src/components/Pricing.tsx",
  "src/components/Testimonials.tsx",
  "src/components/CTA.tsx",
  "src/components/Footer.tsx",
  "src/components/ui/Button.tsx",
  "src/components/ui/Card.tsx",
  "src/components/ui/Container.tsx",
  "src/components/ui/Section.tsx",
  "src/index.css",
];

const DEFAULT_APP_STRICT = `import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import Features from "./components/Features"
import Showcase from "./components/Showcase"
import Pricing from "./components/Pricing"
import Testimonials from "./components/Testimonials"
import CTA from "./components/CTA"
import Footer from "./components/Footer"

export default function App() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <Navbar />
      <Hero />
      <Features />
      <Showcase />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}
`;

const PLACEHOLDER_SECTION = (name: string) =>
  `import React from "react";\nexport default function ${name}() {\n  return (\n    <section className="py-24"><div className="max-w-6xl mx-auto px-6"><h2 className="text-3xl font-bold">${name}</h2></div></section>\n  );\n}\n`;

const PLACEHOLDER_UI = (name: string) =>
  `import React from "react";\nexport default function ${name}({ children, className = "" }: { children?: React.ReactNode; className?: string }) {\n  return <div className={className}>{children}</div>;\n}\n`;

/** Ensure the files array contains App.tsx and all required component/ui files. Inject placeholders if missing. */
function ensureRequiredFiles(
  files: { path: string; content: string; type?: string }[]
): { path: string; content: string; type?: string }[] {
  const byPath = new Map<string, { path: string; content: string; type?: string }>();
  for (const f of files) {
    const p = f.path === "App.tsx" ? "src/App.tsx" : f.path;
    byPath.set(p, { ...f, path: p });
  }
  if (!byPath.has("src/App.tsx")) {
    byPath.set("src/App.tsx", { path: "src/App.tsx", content: DEFAULT_APP_STRICT, type: "file" });
  }
  const sectionNames = ["Navbar", "Hero", "Features", "Showcase", "Pricing", "Testimonials", "CTA", "Footer"];
  for (const name of sectionNames) {
    const path = `src/components/${name}.tsx`;
    if (!byPath.has(path)) {
      byPath.set(path, { path, content: PLACEHOLDER_SECTION(name), type: "file" });
    }
  }
  const uiNames = ["Button", "Card", "Container", "Section"];
  for (const name of uiNames) {
    const path = `src/components/ui/${name}.tsx`;
    if (!byPath.has(path)) {
      byPath.set(path, { path, content: PLACEHOLDER_UI(name), type: "file" });
    }
  }
  if (!byPath.has("src/index.css")) {
    byPath.set("src/index.css", {
      path: "src/index.css",
      content: "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
      type: "file",
    });
  }
  return Array.from(byPath.values());
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
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Team" className="rounded-2xl w-full object-cover shadow-xl" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">About Us</h2>
            <p className="text-lg text-slate-600 max-w-2xl mb-6">We help businesses grow with modern tools and expert support. Our mission is to deliver real value through quality products and outstanding service.</p>
            <p className="text-lg text-slate-600 max-w-2xl mb-8">Founded with a focus on simplicity and results, we work with teams of all sizes to achieve their goals. Get in touch to learn how we can help you.</p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-semibold">Quality first</div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-violet-50 text-violet-700 font-semibold">Customer focused</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const DEFAULT_FAQ_TSX = `import React, { useState } from "react";
export default function FAQ() {
  const [open, setOpen] = useState(null);
  const items = [
    { q: "How do I get started?", a: "Sign up for a free account, describe your project, and our AI will generate a first version in minutes. You can edit and deploy from there." },
    { q: "What payment methods do you accept?", a: "We accept all major credit cards and PayPal. Invoicing is available for Team and Enterprise plans." },
    { q: "Can I cancel anytime?", a: "Yes. You can cancel your subscription at any time. You will keep access until the end of your billing period." },
    { q: "Do you offer support?", a: "Free tier includes community support. Pro and Team plans include priority email support and optional onboarding calls." },
    { q: "Is my data secure?", a: "Yes. We use industry-standard encryption and do not share your data with third parties. You can export or delete your data anytime." },
  ];
  return (
    <section id="faq" className="py-24 px-6 bg-white border-t border-slate-200">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
        <p className="text-slate-600 mb-10">Everything you need to know. Can't find an answer? Contact us.</p>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                <span className="font-semibold text-slate-900">{item.q}</span>
                <span className="text-2xl text-slate-400 flex-shrink-0">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <div className="px-5 pb-5 text-slate-600">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

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
    out = out.replace(/(<About \/>)/, "$1\n      <FAQ />");
  }
  if (!out.includes("<Contact") && !out.includes("<Contact />")) {
    out = out.replace(/(<\/CTA>)/, "$1\n      <Contact />");
    if (!out.includes("<Contact")) out = out.replace(/(<\/CtaSection>)/, "$1\n      <Contact />");
    if (!out.includes("<Contact")) out = out.replace(/(<Footer)/, "<Contact />\n      $1");
  }
  return { files, appContent: out };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: true, message: "OPENAI_API_KEY not set" });
  }

  let body: { prompt?: string; projectId?: string; existingFiles?: { path: string; content: string }[] };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: true, message: "Invalid JSON body" });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({ error: true, message: "prompt is required" });
  }

  const existingFiles = Array.isArray(body.existingFiles) ? body.existingFiles : [];
  const context =
    existingFiles.length > 0
      ? `\n\nCurrent project files (for context only):\n${existingFiles
          .slice(0, 20)
          .map((f: any) => `--- ${f.path} ---\n${(f.content || "").slice(0, 500)}`)
          .join("\n")}`
      : "";

  try {
    const openai = new OpenAI({ apiKey });

    let planJson: any = null;
    try {
      const planCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PLAN_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });
      const planText = planCompletion.choices?.[0]?.message?.content ?? "";
      const planResult = parseJsonFromAI(planText);
      if (planResult.ok && planResult.parsed) planJson = planResult.parsed;
    } catch {
      //
    }

    const userMessageForGenerate = planJson
      ? `Plan: ${JSON.stringify(planJson)}\n\nUser request: ${prompt}${context}`
      : prompt + context;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: TEMPLATE_HINT },
        { role: "user", content: userMessageForGenerate },
      ],
      temperature: 0.7,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    });

    let raw = completion.choices[0]?.message?.content ?? "";
    let parseResult = tryParseJSON(raw);
    if (!parseResult.ok || !validResponse(parseResult.parsed)) {
      const retryMessage = "Return valid JSON with a files array.\n\nUser request: " + userMessageForGenerate;
      const retryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: "Return valid JSON with a files array." },
          { role: "user", content: retryMessage },
        ],
        temperature: 0.3,
        max_tokens: 16000,
        response_format: { type: "json_object" },
      });
      raw = retryCompletion.choices[0]?.message?.content ?? "";
      parseResult = tryParseJSON(raw);
    }
    if (!parseResult.ok || !parseResult.parsed || !validResponse(parseResult.parsed)) {
      return res.status(500).json({ error: true, message: "Generated project failed validation." });
    }

    const parsed = parseResult.parsed;
    const name = String(parsed.name || "app").trim();
    const description = typeof parsed.description === "string" ? parsed.description : prompt;
    let files = Array.isArray(parsed.files)
      ? parsed.files
          .filter((f: any) => f && typeof f.path === "string" && typeof f.content === "string")
          .map((f: any) => ({
            path: String(f.path).trim(),
            content: String(f.content),
            type: (f.type === "directory" ? "directory" : "file") as "file" | "directory",
          }))
      : [];
    files = normalizePaths(files);

    if (files.length === 0) {
      return res.status(500).json({ error: true, message: "Generated project failed validation." });
    }

    files = autoFixGeneratedFiles(files);

    // Ensure all required files exist (inject App.tsx or placeholders for missing components/ui/index.css)
    files = ensureRequiredFiles(files);

    const missingComponentsRetryMessage = (missingList: string[]) =>
      `App.tsx references missing components.\nYou MUST include these files:\n\n${missingList.map((x) => `src/components/${x}.tsx`).join("\n")}`;

    let attempt = 0;
    const maxAttempts = 2;
    while (true) {
      const appContent = files.find((f: any) => f.path === "src/App.tsx")?.content ?? "";
      const missing = getMissingComponentFiles(appContent, files);
      if (missing.length === 0) break;
      if (attempt >= maxAttempts - 1) {
        return res.status(500).json({ error: true, message: "Generated project failed validation." });
      }
      const retryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: TEMPLATE_HINT },
          { role: "user", content: userMessageForGenerate + "\n\n" + missingComponentsRetryMessage(missing) },
        ],
        temperature: 0.3,
        max_tokens: 16000,
        response_format: { type: "json_object" },
      });
      const retryRaw = retryCompletion.choices[0]?.message?.content ?? "";
      const retryParseResult = tryParseJSON(retryRaw);
      if (!retryParseResult.ok || !validResponse(retryParseResult.parsed)) {
        return res.status(500).json({ error: true, message: "Generated project failed validation." });
      }
      const retryParsed = retryParseResult.parsed;
      files = Array.isArray(retryParsed.files)
        ? retryParsed.files
            .filter((f: any) => f && typeof f.path === "string" && typeof f.content === "string")
            .map((f: any) => ({
              path: String(f.path).trim(),
              content: String(f.content),
              type: (f.type === "directory" ? "directory" : "file") as "file" | "directory",
            }))
        : [];
      files = normalizePaths(files);
      if (files.length === 0) {
        return res.status(500).json({ error: true, message: "Generated project failed validation." });
      }
      files = autoFixGeneratedFiles(files);
      const idxApp = files.findIndex((f: any) => f.path === "src/App.tsx" || f.path === "App.tsx");
      if (idxApp !== -1) files[idxApp] = { ...files[idxApp], path: "src/App.tsx" };
      files = ensureRequiredFiles(files);
      userMessageForGenerate = userMessageForGenerate + "\n\n" + missingComponentsRetryMessage(missing);
      attempt++;
    }

    if (!validForPreview(files)) {
      return res.status(500).json({ error: true, message: "Generated project failed validation." });
    }

    validateSyntaxForPreview(files);

    return res.status(200).json({
      success: true,
      project: { name, description, files },
    });
  } catch (err) {
    console.error("Generate error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return res.status(500).json({ error: true, message });
  }
}
