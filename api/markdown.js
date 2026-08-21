// /api/markdown — Markdown content negotiation for AI agents.
//
// vercel.json rewrites any page request carrying `Accept: text/markdown` here.
// Browsers (Accept: text/html,...) never match, so the HTML site is untouched.
// We fetch our own static HTML and convert it, which keeps one source of truth.

import { htmlToMarkdown } from './_html-to-markdown.mjs';

const MAX_HTML_BYTES = 2_000_000;

function cleanPath(raw) {
  const value = Array.isArray(raw) ? raw.find((v) => typeof v === 'string' && v.startsWith('/')) : raw;
  let p = typeof value === 'string' ? value : '/';

  p = p.split('?')[0].split('#')[0];
  if (!p.startsWith('/')) p = '/' + p;
  if (p.includes('..') || p.includes('//')) return null;

  // Assets and API routes are never markdown; .html is tolerated and normalised.
  const ext = (p.match(/\.([a-z0-9]+)$/i) || [])[1];
  if (ext && ext.toLowerCase() !== 'html') return null;
  if (ext) p = p.replace(/\.html$/i, '');
  if (p.startsWith('/api/') || p === '/api') return null;

  return p === '' ? '/' : p;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('# 405\n\nMethod not allowed.\n');
  }

  res.setHeader('Vary', 'Accept');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');

  const path = cleanPath(req.query?.path);
  if (path === null) {
    return res.status(404).send('# 404\n\nNo markdown representation for this path.\n');
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.makersquare.ai';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const canonical = `${proto}://${host}${path}`;

  try {
    const upstream = await fetch(canonical, {
      headers: {
        // text/html only, so this request never re-enters the markdown rewrite.
        accept: 'text/html',
        'user-agent': 'makersquare-markdown-renderer',
        'x-md-render': '1',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .send(`# ${upstream.status}\n\nNo page at ${canonical}\n\nSee [llms.txt](${proto}://${host}/llms.txt) for a site overview.\n`);
    }

    const html = await upstream.text();
    if (html.length > MAX_HTML_BYTES) {
      return res.status(413).send('# 413\n\nPage too large to convert.\n');
    }

    const markdown = htmlToMarkdown(html);

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Link', `<${canonical}>; rel="canonical"`);
    res.setHeader('X-Robots-Tag', 'noindex');

    return res.status(200).send(`${markdown}\n---\n\nSource: ${canonical}\n`);
  } catch (err) {
    console.error('[markdown] failed for', canonical, err);
    return res.status(502).send('# 502\n\nCould not render this page as markdown.\n');
  }
}
