// Builds llms-full.txt — every public page's content as one markdown document,
// for agents that want the whole site rather than the llms.txt summary.
//
//   node scripts/build-llms-full.mjs
//
// Re-run it after meaningful copy changes (same habit as scripts/cohorts.mjs).
// llms.txt stays hand-written: it is the curated summary and the /api/chat
// grounding file. This is the exhaustive companion, not a replacement.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import converter from '../lib/html-to-markdown.cjs';

const { htmlToMarkdown } = converter;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.makersquare.ai';

// Noindex, thin, legal, or internal pages — excluded on purpose.
// pricing.html and apply.html are retired stubs that 301 elsewhere; including
// them would duplicate /immersive and /enroll under dead URLs.
const EXCLUDE = new Set([
  '404.html', 'demo-ppc.html', 'demo-ppc-legal.html', 'demo-ppc-pm.html',
  'quickstart-download.html', 'workshop-register.html', 'HANDOFF.html',
  'privacy.html', 'terms.html', 'pricing.html', 'apply.html', 'thank-you.html',
]);

// Ordered so the document reads top-down: what it is, then details, then proof.
const ORDER = [
  'index.html', 'immersive.html', 'curriculum.html', 'workshops.html',
  'corporate.html', 'enroll.html', 'scholarship.html', 'housing.html',
  'faq.html', 'comparison.html', 'use-cases.html', 'about.html', 'team.html',
  'demo-day.html', 'alumni.html',
];

const urlFor = (file) => (file === 'index.html' ? `${BASE}/` : `${BASE}/${file.replace(/\.html$/, '')}`);

function collect() {
  const all = readdirSync(ROOT).filter((f) => f.endsWith('.html') && !EXCLUDE.has(f));
  const ordered = ORDER.filter((f) => all.includes(f));
  const rest = all.filter((f) => !ORDER.includes(f)).sort();

  const blogDir = join(ROOT, 'blog');
  const blog = existsSync(blogDir)
    ? readdirSync(blogDir).filter((f) => f.endsWith('.html') && f !== 'index.html').sort().map((f) => `blog/${f}`)
    : [];

  return [...ordered, ...rest, ...blog];
}

const files = collect();
const sections = [];
let skipped = 0;

for (const file of files) {
  const html = readFileSync(join(ROOT, file), 'utf8');
  const md = htmlToMarkdown(html);

  // Thin pages are JS-rendered shells or redirect stubs — no useful text.
  if (md.length < 400) {
    skipped++;
    console.warn(`  skipped (thin, ${md.length} chars): ${file}`);
    continue;
  }

  const url = file.startsWith('blog/')
    ? `${BASE}/blog/${file.slice(5).replace(/\.html$/, '')}`
    : urlFor(file);

  sections.push(`<!-- ${url} -->\n\n${md.trim()}`);
}

const header = `# MakerSquare — Full Site Content

> Complete text of every public page on makersquare.ai, converted to markdown.
> For the short version, read ${BASE}/llms.txt
> Any single page can also be fetched as markdown by sending \`Accept: text/markdown\`.

MakerSquare is Austin's school of applied AI: in-person builder programs for
non-technical professionals — a 2-week immersive cohort, 3-day weekend
workshops, and private team training. Students ship a live website, a working
AI agent, and an automated workflow, then present at Demo Day.

Contact: hello@makersquare.ai · ${BASE}/

---
`;

const out = `${header}\n${sections.join('\n\n---\n\n')}\n`;
writeFileSync(join(ROOT, 'llms-full.txt'), out);

console.log(`\nllms-full.txt: ${sections.length} pages, ${skipped} skipped, ${out.length.toLocaleString()} chars`);
