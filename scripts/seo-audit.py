#!/usr/bin/env python3
"""
MakerSquare SEO audit — a guardrail for a healthy site.
Scans every indexable HTML page and flags real problems:
  ERROR  (blocks a PR): copied/wrong-page social tags, og:url != canonical,
         missing <title>/description/canonical, sitemap listing a noindex or missing page.
  WARN   (report only): titles > 60 chars or descriptions > 160 chars (truncate in search),
         og/twitter title drift.
Pure stdlib, no credentials. Run:  python3 scripts/seo-audit.py
Exit code 1 if any ERROR.
"""
import glob, re, sys, os

def content(h, key):
    m = re.search(r'<meta[^>]*' + key.replace('"', r'["\']') + r'[^>]*?content=(["\'])(.*?)\1', h, re.S | re.I)
    return m.group(2).strip() if m else None
def get1(h, pat):
    m = re.search(pat, h, re.S | re.I); return m.group(1).strip() if m else None
def norm(u):
    return (u or '').split('?')[0].rstrip('/').replace('https://www.makersquare.ai','').replace('https://makersquare.ai','') or '/'
def toks(s):
    STOP = set("the a an and or of to in for on with your you our we is are it that this what how not no makersquare ai austin tx from now other program".split())
    return set(w for w in re.findall(r"[a-z0-9]+", (s or '').lower()) if w not in STOP and len(w) > 2)

pages = sorted(p for p in glob.glob('**/*.html', recursive=True) if 'node_modules' not in p)
info, title2pages = {}, {}
for p in pages:
    h = open(p, encoding='utf-8', errors='ignore').read()
    d = dict(
        title=get1(h, r'<title>(.*?)</title>'),
        desc=content(h, 'name="description"'),
        canon=get1(h, r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\'](.*?)["\']'),
        robots=(content(h, 'name="robots"') or ''),
        ogt=content(h, 'property="og:title"'), ogd=content(h, 'property="og:description"'),
        ogu=content(h, 'property="og:url"'),
        twt=content(h, 'name="twitter:title"'))
    d['noindex'] = 'noindex' in d['robots'].lower()
    info[p] = d
    if d['title'] and not d['noindex']:
        title2pages.setdefault(d['title'].strip(), []).append(p)

errors, warns = [], []
for p, d in info.items():
    if d['noindex']:
        continue
    if not d['title']:  errors.append((p, "missing <title>"))
    if not d['desc']:   errors.append((p, "missing meta description"))
    if not d['canon']:  errors.append((p, "missing canonical"))
    # copy-paste: a social title equal to a DIFFERENT page's <title>
    for field in ('ogt', 'twt'):
        v = d[field]
        if v and v in title2pages and p not in title2pages[v]:
            errors.append((p, f"{field} is copied from another page ({title2pages[v][0]}): \"{v}\""))
    if d['ogu'] and d['canon'] and norm(d['ogu']) != norm(d['canon']):
        errors.append((p, f"og:url ({norm(d['ogu'])}) != canonical ({norm(d['canon'])})"))
    # length warnings (truncate in SERPs)
    if d['title'] and len(d['title']) > 60: warns.append((p, f"title {len(d['title'])} chars (>60, truncates)"))
    if d['desc'] and len(d['desc']) > 160:  warns.append((p, f"meta description {len(d['desc'])} chars (>160, truncates)"))
    # og/twitter title drift — near-zero overlap = one is copy-pasted from another page (bug)
    if d['ogt'] and d['twt']:
        ov = len(toks(d['ogt']) & toks(d['twt'])) / max(1, len(toks(d['ogt']) | toks(d['twt'])))
        if ov < 0.15:   errors.append((p, f"og:title and twitter:title are unrelated (one is likely copied): og=\"{d['ogt']}\" / tw=\"{d['twt']}\""))
        elif ov < 0.40: warns.append((p, "og:title and twitter:title differ (double-check they match the page)"))

# sitemap sanity
if os.path.exists('sitemap.xml'):
    sm = open('sitemap.xml').read()
    for loc in re.findall(r'<loc>https://www\.makersquare\.ai/([^<]*)</loc>', sm):
        l = loc.rstrip('/')
        cands = [l + '.html', (l + '/index.html'), 'index.html' if l == '' else '']
        if not any(c and os.path.exists(c) for c in cands):
            errors.append(('sitemap.xml', f"lists a URL with no file: /{l}"))
        else:
            fp = next((c for c in cands if c and os.path.exists(c)), None)
            if fp and info.get(fp, {}).get('noindex'):
                errors.append(('sitemap.xml', f"lists a noindex page: /{l}"))

print(f"SEO audit — {len(pages)} pages, {sum(1 for d in info.values() if d['noindex'])} noindex\n")
print(f"🔴 {len(errors)} error(s):")
for p, m in errors: print(f"  {p}: {m}")
print(f"\n🟡 {len(warns)} warning(s):")
for p, m in warns: print(f"  {p}: {m}")
sys.exit(1 if errors else 0)
