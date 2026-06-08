# Contributor & AI Assistant Instructions

Read this before editing any HTML file in this repo.

## Tracking scripts must stay on every public page

This site relies on a set of marketing / lead-attribution scripts. They are critical: without them, paid ads (Google, Meta, Twitter, etc.) cannot measure conversions and lead attribution breaks. They have been silently stripped on past PRs — usually by AI assistants regenerating HTML — so this doc exists to stop that from happening again.

### Required on every public HTML page

**In `<head>`:**

1. **Google Tag Manager** — `GTM-MJTW9WQ3` inline snippet (look for `<!-- Google Tag Manager -->`)
2. **Zoho `zf_gtm` postMessage listener** — pushes form events into `dataLayer` (look for `type == "zf_gtm"`)
3. **Zoho `ZFLead` UTM + `fbclid` passthrough** — header reads `<!-- Zoho UTM passthrough (modificado: incluye fbclid) -->`
4. **X (Twitter) conversion pixel** — header reads `<!-- X conversion tracking base code -->`, calls `twq('config','rcjjn')`

**Right after `<body>`:**

5. **GTM `<noscript>` iframe fallback** — `ns.html?id=GTM-MJTW9WQ3`

**Inside `<body>`:**

6. **`<script src="https://forms.zoho.com/js/zf_gclid.js"></script>`** — captures Google Click ID for the Zoho form

### Rules

- **Default behavior: carry these scripts forward exactly as-is.** If your change is not about these scripts, do not touch them.
- **AI-assisted edits in particular:** when you ask an AI to "rewrite this page," "clean up the head," or "rebuild this section," it will often silently drop these scripts. Diff your output against `main` and verify the scripts are still there before opening a PR.
- **You ARE allowed to update or replace these scripts** when there's a legitimate reason — new GTM container ID, new Zoho config, additional ad pixel, etc. When you do:
  - Update them **consistently across all 14 public pages**. Don't update one and leave the others stale.
  - Update this `CLAUDE.md` to reflect the new identifier / snippet so future contributors know what the new baseline is.
  - If a new third-party host is involved, update the CSP in `vercel.json` (see below).

### Public pages (the list)

`404.html`, `about.html`, `alumni.html`, `apply.html`, `comparison.html`, `corporate.html`, `curriculum.html`, `demo-day.html`, `demo-ppc.html`, `enroll.html`, `faq.html`, `housing.html`, `index.html`, `pricing.html`, `privacy.html`, `scholarship.html`, `team.html`, `terms.html`, `use-cases.html`

`HANDOFF.html` is an internal handoff doc, not a deployed page — exempt from these rules.

### Pre-PR verification

Run from the repo root. Each command should print nothing:

```bash
grep -L "GTM-MJTW9WQ3" *.html | grep -v HANDOFF
grep -L "ns.html?id=GTM-MJTW9WQ3" *.html | grep -v HANDOFF
grep -L "zf_gclid.js" *.html | grep -v HANDOFF
grep -L "modificado: incluye fbclid" *.html | grep -v HANDOFF
grep -L 'type == "zf_gtm"' *.html | grep -v HANDOFF
grep -L "twq('config','rcjjn')" *.html | grep -v HANDOFF
```

## CSP header

The Content Security Policy lives in `vercel.json` under the `/(.*)`route's headers. It's currently in `Content-Security-Policy-Report-Only` mode — violations show in the browser console but don't block resources yet.

**When adding a new third-party script** (new ad pixel, new analytics tool, etc.), add its host to the appropriate directive — usually `script-src` (for the JS file) and `connect-src` (for beacon / XHR endpoints). Otherwise the browser will report (and eventually block) it.

Currently allowed third-party hosts include: Zoho (`*.zoho.com`, `*.zohocdn.com`), Google Tag Manager, Google Analytics, DoubleClick, Pagesense, and Twitter Ads (`static.ads-twitter.com`, `analytics.twitter.com`).
