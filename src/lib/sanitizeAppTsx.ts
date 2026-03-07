/**
 * Strip imports from ./components/ and replace component JSX with placeholders
 * so preview works when only App.tsx is mounted (no separate component files).
 */
export function sanitizeAppTsx(content: string): string {
  let out = content;
  out = out.replace(
    /^\s*import\s+[\s\S]*?\s+from\s+['"]\.\.?\/components\/[^'"]+['"]\s*;?\s*$/gm,
    ''
  );
  const componentNames = [
    'Pricing',
    'FAQ',
    'ContactForm',
    'FinalCTA',
    'Footer',
    'Hero',
    'Navbar',
    'Features',
    'Testimonials',
    'ProblemSolution',
    'CtaSection',
    'ContactSection',
  ];
  for (const name of componentNames) {
    const openClose = new RegExp(`<${name}[^>]*>[\\s\\S]*?<\\/${name}>`, 'g');
    const open = new RegExp(`<${name}\\s*/?>`, 'g');
    out = out.replace(
      openClose,
      `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`
    );
    out = out.replace(
      open,
      `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`
    );
  }
  return out;
}
