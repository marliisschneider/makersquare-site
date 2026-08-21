// Dependency-free HTML -> Markdown converter.
//
// Used by two callers:
//   api/markdown.js             — serves markdown when an agent sends Accept: text/markdown
//   scripts/build-llms-full.mjs — assembles llms-full.txt from the site's key pages
//
// This repo has no package.json / build step on purpose, so no npm parser here.
// Regex-based conversion is imperfect but fine for our own hand-written HTML.
//
// CommonJS on purpose. Without a package.json, Vercel compiles api/*.js to CJS,
// so an ESM (.mjs) import from the function crashes at runtime with
// ERR_REQUIRE_ESM. A .cjs module can be require()d by the bundled function and
// default-imported by scripts/build-llms-full.mjs. Do not "modernise" this.

// nav/header/footer are per-page boilerplate; the rest carry no readable text.
// NOT stripped: <button> — our FAQ accordion puts the actual questions in buttons.
const BLOCK_STRIP = [
  'script', 'style', 'noscript', 'svg', 'iframe', 'template', 'canvas',
  'nav', 'header', 'footer', 'form',
];

// Decorative UI glyphs (accordion chevrons, section diamonds) that carry no meaning.
const DECORATIVE = /[\u25B2\u25BC\u25B6\u25C0\u25B8\u25C2\u25C6\u25C7\u25AA\u25FE]/g;

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’',
  lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·',
  times: '×', check: '✓', copy: '©', reg: '®', trade: '™',
  rarr: '→', larr: '←', uarr: '↑', darr: '↓', harr: '↔',
  bull: '•', dagger: '†', deg: '°', prime: '′', Prime: '″',
  laquo: '«', raquo: '»', sbquo: '‚', bdquo: '„',
  euro: '€', pound: '£', yen: '¥', cent: '¢',
  frac12: '½', frac14: '¼', frac34: '¾', minus: '−', plusmn: '±',
  starf: '★', star: '☆', lsaquo: '‹', rsaquo: '›', sect: '§', para: '¶',
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => {
      const v = ENTITIES[name.toLowerCase()];
      return v === undefined ? m : v;
    });
}

function stripTags(s) {
  return s.replace(/<[^>]*>/g, '');
}

// Inline-only text: tags become spaces (so "industry.</span><span>Now" doesn't
// weld into "industry.Now"), entities decoded, whitespace collapsed.
function inlineText(s) {
  return decodeEntities(s.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:’”)])/g, '$1')
    .replace(/([(“‘])\s+/g, '$1')
    .trim();
}

function convertTable(tableHtml) {
  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
    [...m[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi)].map((c) => inlineText(c[2]).replace(/\|/g, '\\|'))
  ).filter((r) => r.length);

  if (!rows.length) return '\n';

  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r) => [...r, ...Array(width - r.length).fill('')];
  const [head, ...body] = rows;

  return [
    `| ${pad(head).join(' | ')} |`,
    `| ${Array(width).fill('---').join(' | ')} |`,
    ...body.map((r) => `| ${pad(r).join(' | ')} |`),
  ].join('\n') + '\n\n';
}

function htmlToMarkdown(html) {
  let s = String(html);

  const titleMatch = s.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = s.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || s.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);

  const title = titleMatch ? inlineText(titleMatch[1]) : '';
  const description = descMatch ? decodeEntities(descMatch[1]).trim() : '';

  // Narrow to the real content before doing anything else.
  const main = s.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const body = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  s = main ? main[1] : body ? body[1] : s;

  s = s.replace(/<!--[\s\S]*?-->/g, '');
  for (const tag of BLOCK_STRIP) {
    s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    s = s.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  }

  // Protect code blocks from the inline passes below.
  const codeBlocks = [];
  s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, inner) => {
    const code = decodeEntities(stripTags(inner)).replace(/^\n+|\n+$/g, '');
    codeBlocks.push('```\n' + code + '\n```');
    return `\n%%MSCODE${codeBlocks.length - 1}%%\n`;
  });

  s = s.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (t) => '\n' + convertTable(t));

  // Ordered lists need a counter, so handle them before the generic <li> pass.
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    let n = 0;
    const items = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, li) => `\n${++n}. ${li.trim()}`);
    return '\n' + items + '\n';
  });
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, li) => `\n- ${li.trim()}`);
  s = s.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');

  // Demoted one level: the <title> below becomes the document's only H1.
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl, inner) => {
    const text = inlineText(inner);
    const depth = title ? Math.min(6, Number(lvl) + 1) : Number(lvl);
    return text ? `\n\n${'#'.repeat(depth)} ${text}\n\n` : '\n';
  });

  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    const text = inlineText(inner);
    return text ? `\n\n> ${text}\n\n` : '\n';
  });

  s = s.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (m, href, inner) => {
    const text = inlineText(inner);
    if (!text) return '';
    if (/^(javascript:|#)/i.test(href)) return text;
    return `[${text}](${href})`;
  });

  s = s.replace(/<img\b[^>]*>/gi, (tag) => {
    const alt = tag.match(/alt=["']([^"']*)["']/i);
    const src = tag.match(/src=["']([^"']*)["']/i);
    if (!alt || !alt[1].trim()) return ''; // decorative
    return `![${alt[1].trim()}](${src ? src[1] : ''})`;
  });

  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    const t = inlineText(inner);
    return t ? `**${t}**` : '';
  });
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, inner) => {
    const t = inlineText(inner);
    return t ? `*${t}*` : '';
  });
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => {
    const t = inlineText(inner);
    return t ? '`' + t + '`' : '';
  });

  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');
  s = s.replace(/<\/(p|div|section|article|tr|h[1-6]|figcaption)>/gi, '\n\n');
  s = s.replace(/<[^>]*>/g, ' ');

  s = decodeEntities(s);

  // Tidy whitespace: trim each line, cap blank runs, drop stray bullets.
  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^- *$/gm, '')
    .replace(DECORATIVE, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').replace(/ +([.,!?;:])/g, '$1').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  s = s.replace(/%%MSCODE(\d+)%%/g, (_, i) => codeBlocks[Number(i)]);

  const header = [
    title ? `# ${title}` : '',
    description ? `> ${description}` : '',
  ].filter(Boolean).join('\n\n');

  // The <title> already acts as the H1; drop a duplicate leading heading.
  if (title) {
    s = s.replace(/^#{2,3} (.+)\n+/, (m, h1) =>
      inlineText(h1).toLowerCase() === title.toLowerCase() ? '' : m);
  }

  return [header, s].filter(Boolean).join('\n\n').trim() + '\n';
}

module.exports = { htmlToMarkdown };
