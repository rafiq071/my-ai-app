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

Every page must look like a real funded startup landing page: modern, highly optimized, semantic structure, fast-loading. No dead links or non-working buttons.

------------------------------------------------

NAVBAR — WORKING LINKS (CRITICAL)

All navigation links and the header CTA MUST work. Use anchor links that scroll to sections.

• Nav links: Use <a href="#features">Features</a>, <a href="#pricing">Pricing</a>, <a href="#about">About</a>, <a href="#faq">FAQ</a>, <a href="#contact">Contact</a>. Do NOT use <button> for nav items or empty href="#".
• Header CTA button: Use <a href="#contact">Get Started</a> or <a href="#pricing">View Pricing</a> (real link that scrolls). Never a button with no onClick/href.
• Every section wrapper in the page MUST have the matching id so links work: <section id="features">, <section id="pricing">, <section id="about">, <section id="faq">, <section id="contact">. Add these ids to the outer element of each section.
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

PAGE STRUCTURE (order matters; each section must have id for nav links)

Navbar (with <a href="#features"> etc. and <a href="#contact"> for CTA)
Hero (id="hero" optional)
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

Left side: small badge, large headline, supporting text, two CTA buttons. Both buttons MUST be working links: primary <a href="#contact">Get Started</a> (or #pricing), secondary <a href="#features">Learn More</a>. Do not use <button> without href for CTAs.

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

Section with id="about". Headline e.g. "About Us" or "Who We Are". 2 columns or single column: company mission/story (2–3 short paragraphs), optional team or values. Real-sounding copy that matches the product. Use rounded-2xl cards or a clean grid. No placeholder text.

------------------------------------------------

FAQ SECTION (MANDATORY — BETTER QUALITY)

Section with id="faq". Headline "Frequently Asked Questions". 5–7 Q&A pairs. Use <details> and <summary> for accordion (click to expand), or useState to toggle open/closed. Each question: clear, specific (e.g. "How do I get started?", "What payment methods do you accept?"). Each answer: 2–3 sentences, helpful and specific to the product. Style: rounded-xl cards, border, padding. No "Question 1" / "Answer 1" placeholders.

------------------------------------------------

CTA SECTION

Centered call to action. Large headline, short description, CTA button. Button must be <a href="#contact"> so it works.

------------------------------------------------

CONTACT SECTION (MANDATORY)

Section with id="contact". Headline "Contact Us" or "Get in Touch". Include EITHER (a) a simple contact form: name, email, message, submit button (use <form>, <input>, <textarea>; submit can be type="submit" with e.preventDefault() in onClick to avoid page reload), OR (b) contact info: email (mailto:), phone, and/or address in a card layout. Optional: both form and info. Style: clean card(s), good spacing. Real-looking placeholder text (e.g. "your@email.com").

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
  { "path":"src/components/CTA.tsx","content":"..." },
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

const SYSTEM_PROMPT_LEGACY = `You are an expert product designer and copywriter. Generate HIGH-QUALITY, conversion-optimized landing pages at the level of Stripe, Linear, Vercel, and Notion. Every pixel and word should feel intentional and professional.

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

/** Extract first balanced { ... } from string. */
function extractBalancedJson(str) {
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

/** Safety parser: strip code fences, trim, extract JSON. */
function parseJsonFromAI(raw) {
  let text = String(raw || "");
  let cleaned = text
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
    .replace(/```\s*$/g, "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  console.log("AI raw response:", cleaned.slice(0, 2000) + (cleaned.length > 2000 ? "..." : ""));
  const toTry = [
    cleaned,
    extractJson(text),
    extractBalancedJson(text),
    extractBalancedJson(cleaned),
  ].filter(Boolean);
  for (const s of toTry) {
    const trimmed = String(s).trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      return { ok: true, parsed: JSON.parse(trimmed) };
    } catch (_) {}
  }
  const fallback = extractBalancedJson(cleaned) || extractBalancedJson(text);
  if (fallback) {
    try {
      return { ok: true, parsed: JSON.parse(fallback) };
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

/** Default About Us section — injected when AI omits or stubs it */
const DEFAULT_ABOUT_TSX = `import React from "react";
export default function About() {
  return (
    <section id="about" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">About Us</h2>
        <p className="text-lg text-slate-600 max-w-2xl mb-6">
          We help businesses grow with modern tools and expert support. Our mission is to deliver real value through quality products and outstanding service.
        </p>
        <p className="text-lg text-slate-600 max-w-2xl mb-8">
          Founded with a focus on simplicity and results, we work with teams of all sizes to achieve their goals. Get in touch to learn how we can help you.
        </p>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-semibold">Quality first</div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-violet-50 text-violet-700 font-semibold">Customer focused</div>
        </div>
      </div>
    </section>
  );
}`;

/** Default FAQ section — injected when AI omits or stubs it */
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

/** Default Contact section with form — injected when AI omits or stubs it */
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

function isStubContent(content, minLen = 400) {
  const s = String(content || "").trim();
  return s.length < minLen || !s.includes("id=") || /placeholder|TODO|coming soon/i.test(s);
}

/** Ensure About, FAQ, Contact exist and are rendered in App. Injects defaults when missing. */
function ensureAboutFaqContact(allFiles, appContent) {
  let files = [...allFiles];
  const hasAbout = files.some((f) => f.path === "src/components/About.tsx");
  const aboutFile = files.find((f) => f.path === "src/components/About.tsx");
  const hasFaq = files.some((f) => f.path === "src/components/FAQ.tsx");
  const faqFile = files.find((f) => f.path === "src/components/FAQ.tsx");
  const hasContact = files.some((f) => f.path === "src/components/Contact.tsx");
  const contactFile = files.find((f) => f.path === "src/components/Contact.tsx");

  if (!hasAbout || (aboutFile && isStubContent(aboutFile.content))) {
    files = files.filter((f) => f.path !== "src/components/About.tsx");
    files.push({ path: "src/components/About.tsx", content: DEFAULT_ABOUT_TSX, type: "file" });
  }
  if (!hasFaq || (faqFile && isStubContent(faqFile.content))) {
    files = files.filter((f) => f.path !== "src/components/FAQ.tsx");
    files.push({ path: "src/components/FAQ.tsx", content: DEFAULT_FAQ_TSX, type: "file" });
  }
  if (!hasContact || (contactFile && isStubContent(contactFile.content))) {
    files = files.filter((f) => f.path !== "src/components/Contact.tsx");
    files.push({ path: "src/components/Contact.tsx", content: DEFAULT_CONTACT_TSX, type: "file" });
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

/** Strip ./components/ imports and replace component tags so preview works with single-file mount. */
function sanitizeAppTsx(content) {
  let out = String(content || "");
  out = out.replace(/^\s*import\s+[\s\S]*?\s+from\s+['"]\.\.?\/components\/[^'"]+['"]\s*;?\s*$/gm, "");
  const componentNames = [
    "Pricing", "FAQ", "ContactForm", "FinalCTA", "Footer", "Hero", "Navbar",
    "Features", "Testimonials", "ProblemSolution", "CtaSection", "ContactSection", "About", "Contact",
  ];
  for (const name of componentNames) {
    const openClose = new RegExp(`<${name}[^>]*>[\\s\\S]*?<\\/${name}>`, "g");
    const open = new RegExp(`<${name}\\s*/?>`, "g");
    out = out.replace(openClose, `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`);
    out = out.replace(open, `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`);
  }
  return out;
}

/** Stage 3: Auto-fix generated files — ensure export default, add React imports, remove invalid imports. */
function autoFixGeneratedFiles(files) {
  const reactImport = "import React from \"react\";\nimport { useState, useEffect, useRef, useMemo, useCallback } from \"react\";\n";
  return files.map((f) => {
    let content = String(f.content || "").trim();
    const path = f.path === "App.tsx" ? "src/App.tsx" : f.path;
    const isTsx = path.endsWith(".tsx") || path.endsWith(".jsx");
    if (!isTsx) return { ...f, path, content };
    if (!content.includes("export default")) {
      content = content.replace(/\bexport\s+(function|const)\s+(\w+)\s*\(/g, "export default function $2(");
      if (!content.includes("export default")) content = content.replace(/^(function\s+\w+)\s*\(/m, "export default $1(");
    }
    if (!content.includes("from \"react\"") && !content.includes("from 'react'")) {
      const hasHooks = /\b(useState|useEffect|useRef|useMemo|useCallback)\s*\(/.test(content);
      if (hasHooks) content = reactImport + content;
      else content = "import React from \"react\";\n" + content;
    }
    content = content.replace(/import\s+type\s+[^;]+;/g, "");
    content = content.replace(/import\s+[^;]*from\s+['\"][^'\"]*['\"]\s*;?\s*$/gm, (line) => {
      if (/from\s+['\"]react['\"]/.test(line)) return line;
      if (/from\s+['\"]\.\.?\//.test(line)) return line;
      return "";
    });
    content = content.replace(/import\s+[\s\S]*?from\s+['\"]lucide-react['\"]\s*;?/g, "");
    return { ...f, path, content };
  });
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

  let planJson = null;
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
  } catch (e) {
    console.log("[AI] Plan stage skipped:", e?.message || e);
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
        { role: "system", content: TEMPLATE_HINT },
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
        { role: "system", content: TEMPLATE_HINT },
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
  allFiles = autoFixGeneratedFiles(allFiles);

  let appFile = allFiles.find(
    (f) => f.path === "src/App.tsx" || f.path === "App.tsx"
  );
  if (!appFile || typeof appFile.content !== "string") {
    throw new Error("No src/App.tsx in response.");
  }

  const { files: filesWithAboutFaqContact, appContent: appContentWithSections } = ensureAboutFaqContact(allFiles, appFile.content);
  allFiles = filesWithAboutFaqContact;
  appFile = { ...appFile, content: appContentWithSections };

  const hasComponents = allFiles.some((f) => f.path && f.path.startsWith("src/components/"));
  const sanitizedAppContent = hasComponents ? appFile.content : sanitizeAppTsx(appFile.content);

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
    .map((f) => {
      const p = f.path === "App.tsx" ? "src/App.tsx" : f.path;
      const content = p === "src/App.tsx" ? sanitizedAppContent : String(f.content);
      return { path: p, content, type: "file" };
    });
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
