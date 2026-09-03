#!/usr/bin/env python3
"""Fail on regressions of the conventions CLAUDE.md documents.

Exists because the blog auto-publisher pushes straight to main from a template
that is not kept in step with the site. On 2026-08-21 one auto-published post
reintroduced the eager GTM loader, the retired X pixel, 3 /pricing redirect
links, unsized images and a PNG hero, all in a single commit.

Run: python3 scripts/conventions-check.py
"""
import glob, json, re, sys

def pages():
    out = sorted(glob.glob('*.html') + glob.glob('blog/*.html') + glob.glob('guides/*.html'))
    return [p for p in out if 'HANDOFF' not in p]

def posts():
    return [p for p in pages()
            if (p.startswith(('blog/', 'guides/')) and not p.endswith('index.html'))
            or p.startswith('case-study-')]

def noindex(h):
    m = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)', h, re.I)
    return bool(m and 'noindex' in m.group(1).lower())

def ldjson(h):
    for b in re.findall(r'(?is)<script[^>]+ld\+json[^>]*>(.*?)</script>', h):
        try: yield json.loads(b)
        except Exception: yield None

def node(objs, types):
    for j in objs:
        if j is None: continue
        stack=[j]
        while stack:
            o=stack.pop()
            if isinstance(o, dict):
                t=o.get('@type')
                ts=t if isinstance(t,list) else [t]
                if any(x in types for x in ts): return o
                stack.extend(o.values())
            elif isinstance(o, list):
                stack.extend(o)
    return None

REQUIRED = [
    ('GTM container',        lambda h: 'GTM-MJTW9WQ3' in h),
    ('GTM noscript',         lambda h: 'ns.html?id=GTM-MJTW9WQ3' in h),
    ('zf_gclid.js',          lambda h: 'zf_gclid.js' in h),
    ('Zoho UTM passthrough', lambda h: 'modificado: incluye fbclid' in h),
    ('zf_gtm listener',      lambda h: bool(re.search(r'type ?== ?.zf_gtm.', h))),
    ('delayed GTM loader',   lambda h: 'Google Tag Manager (delayed-load)' in h),
]
# whitespace-tolerant: the auto-publisher emits the eager loader with newlines,
# which a fixed-string check misses entirely.
EAGER = re.compile(r'insertBefore\(j,f\);\s*\}\)\(window')
BANNED = [
    ('eager GTM loader',   lambda h: bool(EAGER.search(h))),
    ('retired X pixel',    lambda h: 'twq(' in h or 'ads-twitter' in h),
    ('/pricing link (308)',lambda h: 'href="/pricing"' in h),
    ('payment-plan claim', lambda h: bool(re.search(r'2 payments|\$2,100|4,199|split fee|locks seat|payment plans?', h, re.I))),
]

errors, warns = [], []
for p in pages():
    h = open(p).read()
    for name, ok in REQUIRED:
        if not ok(h): errors.append((p, f"missing {name}"))
    for name, bad in BANNED:
        if bad(h): errors.append((p, f"contains {name}"))
    if not noindex(h) and p != 'index.html':
        if not node(ldjson(h), {'BreadcrumbList'}):
            errors.append((p, "missing BreadcrumbList schema"))
    # Image dimensions are ENFORCED under blog/ and guides/ (the blog template was the
    # CLS offender and is fixed). Top-level pages have a known backlog of unsized photos
    # but measure CLS 0, so they warn rather than block — see the note at the bottom.
    for img in re.findall(r'<img\b[^>]*>', h):
        if re.search(r'\bwidth=', img) and re.search(r'\bheight=', img): continue
        bucket = errors if p.startswith(('blog/', 'guides/')) else warns
        bucket.append((p, f"img without width/height: {img[:70]}"))
    # <div> balance. The auto-publisher pasted the second Keep-reading cluster <ul>
    # after post-related's closing </div>, leaving 8 posts off by one (2026-09) —
    # a stray/missing <div> silently reflows the CTA + sources out of post-body.
    opens, closes = len(re.findall(r'<div\b', h)), len(re.findall(r'</div>', h))
    if opens != closes:
        bucket = errors if p.startswith(('blog/', 'guides/')) else warns
        bucket.append((p, f"unbalanced <div>: {opens} open vs {closes} close"))

for p in posts():
    h = open(p).read()
    hero = re.search(r'<img[^>]+(?:post-hero|images/(?:blog|guides|events))[^>]*>', h)
    m = re.search(r'class="post-hero-img">\s*<img([^>]*)>', h)
    if m:
        a = m.group(1)
        if 'fetchpriority="high"' not in a:
            errors.append((p, "hero img missing fetchpriority=\"high\" (it is the LCP element)"))
        src = re.search(r'src="([^"]+)"', a)
        if src and not src.group(1).endswith('.webp'):
            # only an error when a .webp sibling actually exists to point at
            import os
            cand = re.sub(r'\.(png|jpe?g)$', '.webp', src.group(1).replace('../', ''))
            (errors if os.path.exists(cand) else warns).append(
                (p, f"hero img is not .webp ({src.group(1)})"))
    # case studies are link TARGETS in the cluster design, not ring members, so they
    # carry no outbound Keep-reading block by design.
    if 'post-related' not in h and not p.startswith('case-study-'):
        errors.append((p, "missing the Keep-reading internal-link block"))
    art = node(ldjson(h), {'BlogPosting', 'Article'})
    if not art:
        errors.append((p, "no BlogPosting/Article schema"))
    else:
        for k in ('headline', 'image', 'datePublished', 'dateModified', 'author', 'publisher'):
            if not art.get(k): errors.append((p, f"Article schema missing {k}"))

print(f"conventions-check: {len(pages())} pages, {len(posts())} posts")
if warns:
    print(f"\n{len(warns)} warning(s) — known backlog, does not block:")
    for p, e in sorted(warns)[:12]: print(f"  {p}: {e}")
    if len(warns) > 12: print(f"  ... and {len(warns)-12} more")
if errors:
    print(f"\n{len(errors)} ERROR(S):")
    for p, e in errors: print(f"  {p}: {e}")
    sys.exit(1)
print("\nall enforced conventions OK")
