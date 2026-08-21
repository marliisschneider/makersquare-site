#!/usr/bin/env python3
"""Bring an auto-published blog post up to current site conventions.

The blog auto-publisher writes from a template that is not kept in step with the
site, so each new post arrives missing whatever changed since the template was
written. Run this on any post conventions-check.py complains about:

    python3 scripts/normalize-post.py blog/some-new-post.html

Idempotent — safe to re-run. Regenerates the .webp hero, so cwebp must be on PATH.
"""
import json, os, re, subprocess, sys

BASE = "https://www.makersquare.ai"
DELAYED = """<!-- Google Tag Manager (delayed-load) -->
<!-- dataLayer is created and gtm.start pushed IMMEDIATELY so queued events are never lost.
     Only the gtm.js request is deferred: it fires on first user interaction, or after 3500ms,
     whichever comes first. Do NOT revert to the eager loader - it puts 344KB of JS on the
     mobile critical path and was measured pushing blog LCP to 6.3s. -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var done=false,t=null,evts=['scroll','mousemove','mousedown','touchstart','keydown','click'],opts={passive:true,capture:true};
function load(){if(done)return;done=true;if(t)w.clearTimeout(t);
for(var k=0;k<evts.length;k++){w.removeEventListener(evts[k],load,opts);}
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);}
for(var k=0;k<evts.length;k++){w.addEventListener(evts[k],load,opts);}
t=w.setTimeout(load,3500);})(window,document,'script','dataLayer','GTM-MJTW9WQ3');</script>
<!-- End Google Tag Manager -->"""
LINK_STYLE = ('display:block;font-weight:650;font-size:0.95rem;line-height:1.45;'
  'color:var(--navy);text-decoration:none;border:1px solid rgba(24,24,73,0.10);'
  'border-radius:12px;padding:14px 16px;height:100%;')

def esc(s): return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')

def main(path):
    h = open(path).read()
    slug = os.path.basename(path)[:-5]
    url = f"{BASE}/blog/{slug}"
    did = []

    # 1. eager -> delayed GTM (whitespace-tolerant match)
    if 'Google Tag Manager (delayed-load)' not in h:
        m = re.search(r'<!-- Google Tag Manager -->\s*<script>\(function\(w,d,s,l,i\).*?<!-- End Google Tag Manager -->', h, re.S)
        if m: h = h.replace(m.group(0), DELAYED, 1); did.append('delayed GTM')

    # 2. retired X pixel
    m = re.search(r'<!-- X conversion tracking base code -->.*?</script>\n', h, re.S)
    if m: h = h.replace(m.group(0), '', 1); did.append('removed X pixel')

    # 3. /pricing 308 -> /immersive
    if 'href="/pricing"' in h:
        n = h.count('href="/pricing"'); h = h.replace('href="/pricing"', 'href="/immersive"')
        did.append(f'{n} /pricing links')

    # 4. footer Austin link (de-orphans /ai-training-austin)
    A = '<li><a href="/comparison">How We Compare</a></li>'
    if A in h and '/ai-training-austin' not in h:
        h = h.replace(A, A + '\n          <li><a href="/ai-training-austin">AI Training in Austin</a></li>', 1)
        did.append('footer Austin link')

    # 5. hero -> webp + dims + fetchpriority; logos + cards -> dims
    hero = re.search(r'(class="post-hero-img">\s*<img\s+src=")(\.\./images/[^"]+?)\.(png|jpe?g)(")([^>]*)>', h)
    if hero:
        src_rel, ext = hero.group(2), hero.group(3)
        local = src_rel.replace('../', '')
        webp = f'{local}.webp'
        if not os.path.exists(webp):
            subprocess.run(['cwebp','-q','82','-m','6','-quiet',f'{local}.{ext}','-o',webp], check=True)
            did.append(f'generated {webp}')
        attrs = hero.group(5)
        if 'width=' not in attrs:  attrs += ' width="1200" height="630"'
        if 'fetchpriority' not in attrs: attrs += ' fetchpriority="high" decoding="async"'
        h = h[:hero.start()] + f'{hero.group(1)}{src_rel}.webp{hero.group(4)}{attrs}>' + h[hero.end():]
        did.append('hero webp + dims + fetchpriority')
    h = h.replace('<img src="../logo-light.png" alt="MakerSquare — School of Applied AI">',
                  '<img src="../logo-light.webp" alt="MakerSquare — School of Applied AI" width="348" height="90">')
    h = h.replace('<img src="../logo-dark.png" alt="MakerSquare — School of Applied AI">',
                  '<img src="../logo-dark.webp" alt="MakerSquare — School of Applied AI" width="348" height="90" loading="lazy">')

    # 6. schema: BreadcrumbList, image, dateModified
    objs = []
    for b in re.findall(r'(?is)<script[^>]+ld\+json[^>]*>(.*?)</script>', h):
        try: objs.append(json.loads(b))
        except Exception: pass
    have = json.dumps(objs)
    art_m = re.search(r'(?is)(<script[^>]+ld\+json[^>]*>)(.*?)(</script>)', h)
    og = re.search(r'<meta property="og:image" content="([^"]+)"', h)
    pub = re.search(r'"datePublished":\s*"(\d{4}-\d{2}-\d{2})"', h)
    for m in re.finditer(r'(?is)(<script[^>]+ld\+json[^>]*>)(.*?)(</script>)', h):
        body = m.group(2)
        if '"BlogPosting"' not in body and '"Article"' not in body: continue
        new = body
        if '"image"' not in new and og:
            new = re.sub(r'("datePublished":\s*"[^"]+")', r'\1,\n  "image": "%s"' % og.group(1), new, count=1)
        if '"dateModified"' not in new and pub:
            new = re.sub(r'("datePublished":\s*"[^"]+")', r'\1,\n  "dateModified": "%s"' % pub.group(1), new, count=1)
        if new != body:
            h = h[:m.start(2)] + new + h[m.end(2):]; did.append('Article image/dateModified')
        break
    if '"BreadcrumbList"' not in have:
        t = re.search(r'class="post-title">(.*?)</h1>', h, re.S)
        label = re.sub(r'<[^>]+>', '', t.group(1)).strip() if t else slug
        crumbs = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
            {"@type":"ListItem","position":1,"name":"Home","item":BASE+"/"},
            {"@type":"ListItem","position":2,"name":"Blog","item":BASE+"/blog"},
            {"@type":"ListItem","position":3,"name":label,"item":url}]}
        i = h.rfind('</head>')
        h = h[:i] + '<script type="application/ld+json">\n' + json.dumps(crumbs, ensure_ascii=False) + '\n</script>\n' + h[i:]
        did.append('BreadcrumbList')

    # 7. Keep-reading block (hub link only; a human should add the 3 cluster siblings)
    if 'post-related' not in h:
        li = f'\n          <li><a href="/blog" style="{LINK_STYLE}">All MakerSquare posts</a></li>'
        block = ('\n      <!-- Keep reading (internal link cluster) -->\n'
          '      <div class="post-related" style="margin-top:var(--s9);padding-top:var(--s7);border-top:1px solid rgba(24,24,73,0.06);">\n'
          '        <div style="font-size:0.78rem;letter-spacing:0.08em;text-transform:uppercase;color:rgba(24,24,73,0.5);font-weight:700;margin-bottom:var(--s5);">Keep reading</div>\n'
          '        <ul style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--s4);">'
          f'{li}\n        </ul>\n      </div>\n\n      ')
        for a in ('<!-- CTA -->\n      <div class="post-cta">', '<div class="post-cta">', '<!-- Sources -->'):
            if a in h: h = h.replace(a, block + a, 1); did.append('Keep-reading block (hub only)'); break

    open(path, 'w').write(h)
    print(f"{path}: " + (", ".join(did) if did else "already conformant"))

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    for p in sys.argv[1:]: main(p)
