#!/usr/bin/env python3
"""Generate a complete, correct Type B blog DRAFT from a JSON content spec.

Lets each new post be authored as content only (takeaways, body, FAQ,
sources) rather than 380 lines of boilerplate. Output matches the format
the auto-publisher's Type B path handles, with all 6 tracking scripts,
JSON-LD (BlogPosting + FAQPage), hero image block, and standard nav/footer.

Spec JSON schema (one object):
{
  "slug": "ai-for-teachers",
  "title": "AI for Teachers: ...",              # <title> and og:title
  "meta": "meta description ...",
  "keyword": "ai for teachers, ...",            # comma list for JSON-LD keywords
  "tag": "AI at Work",                          # post-tag label
  "og_image": "ai-for-teachers-og.png",         # filename in images/blog/
  "read": "5 min read",
  "date_disp": "September 21, 2026",            # placeholder; publisher restamps
  "date_iso": "2026-09-21",
  "takeaways": ["...", "..."],
  "body_html": "<p>...</p><h2>...</h2><p>...</p>",  # the article body (no takeaways/faq/cta/sources)
  "faq": [["Question?","Answer."], ...],
  "sources": [["Title","https://url","Publisher · Year"], ...],
  "cta": "One-sentence CTA paragraph."
}

Usage: make_draft.py spec1.json [spec2.json ...]
Writes ~/makersquare-drafts/makersquare_blog_post_<N>_draft.html using the
next free draft number (or the number in the spec as "num").
"""
import json
import os
import re
import sys
import html as htmllib

DRAFTS = "/Users/marliisschneider/makersquare-drafts"
TEMPLATE = f"{DRAFTS}/makersquare_blog_post_20_draft.html"

_t = open(TEMPLATE).read()
STYLE_BLOCK = _t[_t.find("<style>"):_t.find("</style>") + len("</style>")]
NAV_BLOCK = _t[_t.find('<nav class="nav">'):_t.find('</div>\n\n', _t.find('<div class="mobile-menu">')) + len('</div>')]
FOOTER_BLOCK = _t[_t.find('<footer class="footer">'):_t.find('</footer>') + len('</footer>')]

UTM = "utm_source=blog&utm_medium=organic_content&utm_campaign=Blog_B2B_ORG_AI-Bootcamp_ATX_EN_Leads"


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def next_num():
    nums = []
    for f in os.listdir(DRAFTS):
        m = re.match(r'makersquare_blog_post_(\d+)_draft\.html', f)
        if m:
            nums.append(int(m.group(1)))
    return max(nums) + 1 if nums else 1


def build(spec):
    slug = spec["slug"]
    title = spec["title"]
    meta = spec["meta"]
    tag = spec.get("tag", "AI at Work")
    og = spec["og_image"]
    read = spec.get("read", "5 min read")
    date_disp = spec.get("date_disp", "September 14, 2026")
    date_iso = spec.get("date_iso", "2026-09-14")
    kw = spec.get("keyword", slug.replace('-', ' '))

    faq_ld = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in spec["faq"]
        ]
    }
    blog_ld = {
        "@context": "https://schema.org", "@type": "BlogPosting",
        "headline": title.split(" | ")[0],
        "description": meta,
        "author": {"@type": "Person", "name": "Marliis Schneider", "url": "https://www.makersquare.ai/about"},
        "publisher": {"@type": "Organization", "name": "MakerSquare", "url": "https://www.makersquare.ai",
                      "logo": {"@type": "ImageObject", "url": "https://www.makersquare.ai/logo-dark.png", "width": 1158, "height": 300}},
        "datePublished": date_iso,
        "url": f"https://www.makersquare.ai/blog/{slug}",
        "image": f"https://www.makersquare.ai/images/blog/{og}",
        "keywords": kw,
    }

    takeaways = "\n".join(f"          <li>{t}</li>" for t in spec["takeaways"])
    faq_items = "\n".join(
        f'        <div class="faq-item">\n'
        f'          <div class="faq-q">{esc(q)}</div>\n'
        f'          <div class="faq-a">{esc(a)}</div>\n'
        f'        </div>' for q, a in spec["faq"])
    sources = "\n".join(
        f'        <div class="source-item">\n'
        f'          <div class="source-num">{i+1}</div>\n'
        f'          <div>\n'
        f'            <div class="source-name"><a href="{url}" target="_blank" rel="noopener">{esc(nm)}</a></div>\n'
        f'            <div class="source-detail">{esc(det)}</div>\n'
        f'          </div>\n'
        f'        </div>' for i, (nm, url, det) in enumerate(spec["sources"]))

    cta_curr = f"https://www.makersquare.ai/curriculum?{UTM}&utm_content=MS_{slug}_curriculum_{date_iso.replace('-','')}"
    cta_news = f"https://ai-builder-brief.beehiiv.com/?{UTM}&utm_content=MS_{slug}_newsletter_{date_iso.replace('-','')}"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="facebook-domain-verification" content="fligau9appze71fwy7uaaw2v12bc4n" />
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','GTM-MJTW9WQ3');</script>
<!-- End Google Tag Manager -->
<!-- Zoho UTM passthrough (modificado: incluye fbclid) -->
<script>
(function(){{var p=new URLSearchParams(window.location.search);var keys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'];var stored={{}};keys.forEach(function(k){{if(p.get(k))stored[k]=p.get(k);}});if(Object.keys(stored).length){{try{{sessionStorage.setItem('zf_utm',JSON.stringify(stored));}}catch(e){{}}}}}})();
</script>
<!-- Zoho zf_gtm postMessage listener -->
<script>
window.addEventListener('message',function(e){{if(e.data&&e.data.type=='zf_gtm'){{window.dataLayer=window.dataLayer||[];window.dataLayer.push(e.data);}}}});
</script>
<!-- X conversion tracking base code -->
<script>
!function(e,t,n,s,u,a){{e.twq||(s=e.twq=function(){{s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);}},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}}(window,document,'script');
twq('config','rcjjn');
</script>
<title>{title}</title>
<meta name="description" content="{esc(meta)}">
<meta name="robots" content="index, follow">
<link rel="icon" type="image/png" href="../favicon.png">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<link rel="canonical" href="https://www.makersquare.ai/blog/{slug}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://www.makersquare.ai/blog/{slug}">
<meta property="og:title" content="{esc(title.split(' | ')[0])}">
<meta property="og:description" content="{esc(meta)}">
<meta property="og:image" content="https://www.makersquare.ai/images/blog/{og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fustat:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.min.css?v=9">

<script type="application/ld+json">
{json.dumps(blog_ld, indent=2)}
</script>

<script type="application/ld+json">
{json.dumps(faq_ld, indent=2)}
</script>

{STYLE_BLOCK}
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MJTW9WQ3"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

<script src="https://forms.zoho.com/js/zf_gclid.js"></script>

{NAV_BLOCK}

<section class="post-hero section">
  <div class="container">
    <div class="post-hero-inner">
      <div class="post-back"><a href="index.html">&#8592; Blog</a></div>
      <div class="post-tag">{tag}</div>
      <h1 class="post-title">{esc(title.split(' | ')[0])}</h1>
      <div class="post-meta">
        <span>Marliis Schneider</span>
        <span class="post-meta-dot"></span>
        <span>{date_disp}</span>
        <span class="post-meta-dot"></span>
        <span>{read}</span>
      </div>
      <div class="post-hero-img">
        <img src="../images/blog/{og}" alt="{esc(title.split(' | ')[0])}">
      </div>
    </div>
  </div>
</section>

<div class="post-body-wrap">
  <div class="container">
    <div class="post-body">

      <div class="takeaways-box">
        <div class="takeaways-label">Key takeaways</div>
        <ul class="takeaways-list">
{takeaways}
        </ul>
      </div>

      {spec["body_html"]}

      <div class="faq-section">
        <div class="faq-label">Frequently asked questions</div>
{faq_items}
      </div>

      <div class="post-cta">
        <p>{esc(spec["cta"])}</p>
        <div class="post-cta-actions">
          <a href="{cta_curr}" class="btn btn-arrow" style="background:var(--white);color:var(--navy);font-weight:700;">Get the curriculum </a>
          <a href="{cta_news}" target="_blank" rel="noopener" class="btn" style="background:transparent;color:rgba(255,255,255,0.65);border:1.5px solid rgba(255,255,255,0.2);">Sign up for the newsletter</a>
        </div>
      </div>

      <div class="sources-section">
        <div class="sources-label">Sources</div>
{sources}
      </div>

    </div>
  </div>
</div>

{FOOTER_BLOCK}

<script src="../js/main.min.js"></script>
</body>
</html>
"""


def main():
    for path in sys.argv[1:]:
        spec = json.load(open(path))
        num = spec.get("num") or next_num()
        out = f"{DRAFTS}/makersquare_blog_post_{num}_draft.html"
        open(out, "w").write(build(spec))
        print(f"draft {num}: {spec['slug']} -> {out}")


if __name__ == "__main__":
    main()
