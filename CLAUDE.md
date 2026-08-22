# MakerSquare Site — Contributor & AI Assistant Instructions

Read this before editing any HTML file in this repo. General working preferences (voice, git commits, session ritual, etc.) are in the global `~/.claude/CLAUDE.md`.

**Do NOT `git push` (as of Jul 20, 2026).** Commit locally with proper messages, then tell Marliis what's queued — she reviews and makes the final push herself. Pushes auto-deploy to production.

**Never `git commit --amend` in this repo.** Marliis may push the queue at any moment; amending a commit she already pushed forks history and lands her in a merge-conflict dialog (happened Jul 22, 2026). Follow-up changes always go in a NEW commit — even when they refine the previous one.

**Exception: `~/makersquare-blog-auto-publish.sh`.** The scheduled blog-publishing automation still pushes automatically, on purpose — it's narrow (only ever touches `blog/` and `sitemap.xml`), deterministic (pulls from a pre-written, pre-reviewed draft on a pre-approved editorial schedule), and never touches any other page. That's a different risk profile from an interactive session editing arbitrary files, which is what this rule is guarding against. If you're an interactive session (human or AI) making ad hoc edits — anywhere, including to blog files — the no-push rule applies to you. If you're that specific script running on its own schedule, it doesn't.

---

## Tracking scripts must stay on every public page

This site relies on a set of marketing / lead-attribution scripts. They are critical: without them, paid ads cannot measure conversions and lead attribution breaks. They have been silently stripped on past PRs — usually by AI assistants regenerating HTML — so this doc exists to stop that from happening again.

### Required on every public HTML page

**In `<head>`:**

1. **Google Tag Manager** — `GTM-MJTW9WQ3`, **delayed-load**. The loader creates `dataLayer` and pushes `gtm.start` immediately, but defers the `gtm.js` **request** until first user interaction (`scroll`, `mousemove`, `mousedown`, `touchstart`, `keydown`, `click`) or 3500ms, whichever comes first. `dataLayer` still queues, so pushes that happen before GTM loads — Zoho `zf_gtm` form events, `msc_chat_open`, `ms_ideas_submit` — are all replayed when it arrives. Identified by the `<!-- Google Tag Manager (delayed-load) -->` comment.

   ⚠️ **Do NOT revert to the eager `(function(w,d,s,l,i)...j.src=...` one-liner.** It puts 344KB of JS (`gtm.js` 155KB + `gtag/js` 189KB) on the mobile critical path. Measured Aug 20 2026: with the eager loader, blog posts ran mobile LCP 5.3–6.3s while the homepage — whose LCP element is text, not an image — sat at 2.9s. Blog perf score was 63.

   **History, so this doesn't regress again.** This doc claimed delayed-load had shipped in Aug 2026, but it had not: all 87 pages were still running the eager snippet as of Aug 20 2026, when it was actually implemented and rolled out. If you are reading this and the greps below fail, someone reverted it — find out why before re-landing, because the tradeoff is real: sessions that bounce in under 3.5s with zero interaction are not measured.

   **Known tradeoff.** Bounced sessions shorter than 3.5s with no interaction go unmeasured. That was accepted deliberately (Ravi, Aug 20 2026) to get blog Core Web Vitals passing. If ad measurement fidelity matters more than CWV for a given campaign, lower the 3500ms or revert — but do it knowingly, and update this section.
2. **Zoho `zf_gtm` postMessage listener** — pushes form events into `dataLayer` (look for `type == "zf_gtm"`)
3. **Zoho `ZFLead` UTM + `fbclid` passthrough** — header reads `<!-- Zoho UTM passthrough (modificado: incluye fbclid) -->`
4. ~~**X (Twitter) conversion pixel**~~ — REMOVED Aug 2026 (ads paused; it hurt mobile perf + best-practices with no ads running). The sweep missed `blog/` at the time; the last 8 blog posts were cleaned 2026-08-20, and `grep -rl "twq(" . --include='*.html'` is now empty. Re-add the `twq(.config.,.rcjjn.)` snippet, and its CSP hosts, if X ads resume.

**Right after `<body>`:**

5. **GTM `<noscript>` iframe fallback** — `ns.html?id=GTM-MJTW9WQ3`

**Inside `<body>`:**

6. **`<script src="https://forms.zoho.com/js/zf_gclid.js"></script>`** — captures Google Click ID for the Zoho form

### Rules

- **Default behavior: carry these scripts forward exactly as-is.** If your change is not about these scripts, do not touch them.
- **AI-assisted edits in particular:** when you ask an AI to "rewrite this page," "clean up the head," or "rebuild this section," it will often silently drop these scripts. Diff your output against `main` and verify the scripts are still there before opening a PR.
- **You ARE allowed to update or replace these scripts** when there's a legitimate reason — new GTM container ID, new Zoho config, additional ad pixel, etc. When you do:
  - Update them **consistently across all public pages**. Don't update one and leave the others stale.
  - Update this `CLAUDE.md` to reflect the new identifier / snippet.
  - If a new third-party host is involved, update the CSP in `vercel.json`.

### Public pages (the list)

`404.html`, `about.html`, `ai-training-austin.html`, `ai-training-vs-consultants.html`, `alumni.html`, `apply.html`, `case-study-roverpass.html`, `comparison.html`, `corporate.html`, `curriculum.html`, `demo-day.html`, `demo-night.html`, `demo-ppc.html`, `enroll.html`, `faq.html`, `housing.html`, `index.html`, `immersive.html`, `pricing.html`, `privacy.html`, `quickstart.html`, `quickstart-download.html`, `scholarship.html`, `team.html`, `terms.html`, `use-cases.html`, `workshop-register.html`, `workshops.html`

`HANDOFF.html` is an internal handoff doc — exempt from these rules.

### Pre-PR verification

Run from the repo root. Each command should print nothing:

```bash
# every public page, including blog/ and guides/
pages() { ls *.html blog/*.html guides/*.html | grep -v HANDOFF; }

for pat in "GTM-MJTW9WQ3" "ns.html?id=GTM-MJTW9WQ3" "zf_gclid.js" \
           "modificado: incluye fbclid" "Google Tag Manager (delayed-load)"; do
  pages() { ls *.html blog/*.html guides/*.html | grep -v HANDOFF; }
  missing=$(pages | while read -r f; do grep -qF "$pat" "$f" || echo "$f"; done)
  [ -z "$missing" ] && echo "OK   $pat" || echo "FAIL $pat -> $missing"
done

# spacing differs between top-level and blog/, so this one is a regex
missing=$(pages | while read -r f; do grep -qE "type ?== ?.zf_gtm." "$f" || echo "$f"; done)
[ -z "$missing" ] && echo "OK   zf_gtm listener" || echo "FAIL zf_gtm -> $missing"

# the eager GTM loader must never come back.
# NOTE: match on the IIFE close, not on "j.src=" - the delayed loader contains that too,
# so a looser pattern reports every page as a regression.
grep -rlF "insertBefore(j,f);})(window" . --include='*.html'

# the retired X pixel must stay gone
grep -rl "twq(" . --include='*.html'
```

The first two blocks should print only `OK` lines; the last two should print nothing.

A `for`/`read` loop is used rather than `grep -L file1 file2 ...` on purpose: on a machine where `grep`
is aliased to `ugrep` (Ravi's is), passing a long unquoted file list makes it warn `File name too long`
and bury the real result.

⚠️ **These glob `blog/` and `guides/` on purpose.** They used to check top-level `*.html` only, and
everything under `blog/` silently rotted for months as a result. Found on 2026-08-20: 8 blog posts still
carried the X pixel that was retired in Aug 2026, `blog/index.html` and
`blog/what-another-year-without-ai-skills-actually-costs.html` had no `zf_gtm` listener at all, and the
blog `ItemList` schema listed 12 of 43 posts. If you narrow these globs, that happens again.

Note the last one is a regex (`grep -LE`) rather than a fixed string: top-level pages write
`type == "zf_gtm"` with spaces, `blog/` writes `e.data.type=='zf_gtm'` without. A fixed-string grep
false-negatives on half the site.

Also assert the eager GTM loader has not come back — this should print nothing:

```bash
grep -rl "j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window" . --include='*.html'
```

Plus these two, to catch a delayed-GTM regression. The first should print nothing; the second should print nothing (no page may carry the eager loader):

```bash
grep -L "Google Tag Manager (delayed-load)" *.html blog/*.html guides/*.html | grep -v HANDOFF
grep -rl "j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window" . --include='*.html'
```

---

## CSP header

The Content Security Policy lives in `vercel.json` under the `/(.*)`route's headers. Currently in `Content-Security-Policy-Report-Only` mode — violations show in the browser console but don't block resources yet.

**When adding a new third-party script**, add its host to the appropriate directive — usually `script-src` and `connect-src`. Currently allowed: Zoho (`*.zoho.com`, `*.zohocdn.com`), Google Tag Manager, Google Analytics, DoubleClick, Pagesense. Twitter Ads hosts were removed along with the pixel — re-add `static.ads-twitter.com` and `analytics.twitter.com` if X ads resume.

---

## Enrollment language rules

The program moved from admissions → open enrollment. Never use the old language.

| ❌ Never say | ✅ Say instead |
|---|---|
| apply / application | enroll / enrollment |
| admissions | enrollment |
| interview | — (remove entirely) |
| selective / selective admission | open enrollment |
| Reserve Your Seat | Secure Your Spot |
| Apply Now | Secure Your Spot |

**CTA hierarchy (updated Jul 16, 2026, per Ravi):** ONE primary CTA sitewide — **"Schedule an intro call"** (opens the lt-modal booking form). The nav-right block is byte-identical on all standard pages (ghost **"Enroll"** → /enroll, primary **"Schedule an intro call"** → lt-modal). Earlier variants "Book a Call" / "Schedule an info call" are retired. Secondary is **"Enroll"** (ghost/link to /enroll). Do not add competing CTAs — the founder closes on calls. Corporate page may use "Talk to Our Training Team". NEVER use "Talk to Admissions" — banned language. Consumer workshops pulled from nav/home/footer Jul 2026 (page + Stripe links retained but unlinked); corporate/team workshops remain on /corporate.

---

## The blog auto-publisher writes from a stale template

`makersquare-ops-bot` publishes one post a day, straight to `main`, from a template that lives outside
this repo. It is not kept in step with the site, so each new post arrives missing whatever changed since
the template was last touched. This is the single largest source of rot in `blog/`.

Measured on 2026-08-21: one auto-published post reintroduced the eager GTM loader (in a line-wrapped form
that a fixed-string grep misses), the retired X pixel, 3 `/pricing` redirect links, three unsized images,
a PNG hero, no `BreadcrumbList`, no Keep-reading block, and an Article node missing `image` and
`dateModified`. Four of the eight posts still carrying the X pixel in Aug 2026 were its output.

**Two guards now exist. Neither replaces fixing the template.**

1. `scripts/conventions-check.py` — fails on any regression of the conventions in this file. Wired into
   CI, and the workflow now triggers `on: push` to `main` as well as `pull_request`, because the bot never
   opens a PR so `pull_request` alone never saw its commits. Errors are things that are clean today and
   must stay clean; the known unsized-image backlog on top-level pages warns instead of blocking, so the
   gate stays trustworthy.
2. `scripts/normalize-post.py <post.html>` — brings a post up to convention: delayed GTM, X-pixel removal,
   `/pricing` rewrite, footer Austin link, webp hero with dims and `fetchpriority`, `BreadcrumbList`,
   Article `image`/`dateModified`, and a Keep-reading block. Idempotent. It inserts a hub-only
   Keep-reading block, so **add the three cluster siblings by hand** — the script cannot know which
   cluster a new post belongs to.

**When a post lands and CI goes red:** run `normalize-post.py` on it, add the cluster links, add its
`.webp` card to `blog/index.html`, and add inbound links from 2-3 sibling posts so it is not an orphan.

## Images

**On-page `<img src>` uses `.webp`. `og:image` and JSON-LD `image` stay `.png`/`.jpg`.**

That split is deliberate. WebP cut the blog hero art 58% (median 45KB to 21KB), but social and
AI scrapers are less reliable with WebP than browsers are, so the crawler-facing tags keep the
original raster. Both files live in the repo; neither is dead.

- Blog/guide art: `images/**/foo-og.png` is the source of truth. Generate the sibling with
  `cwebp -q 82 -m 6 images/blog/foo-og.png -o images/blog/foo-og.webp`, then point the on-page
  `<img src>` at the `.webp` and leave `og:image` + JSON-LD `image` on the `.png`.
- **New posts:** the auto-publish script writes `<img src="...-og.png">`. That still works, it is
  just slower. Run the cwebp step and swap the `src` when you next touch the post.
- Logos: `logo-light.webp` / `logo-dark.webp` are **348x90** (2x the largest render, 174x45), and
  the `width`/`height` attributes must say `348`/`90`. The 1158x300 `logo-dark.png` is kept
  because the JSON-LD publisher logo declares those exact dimensions — do not resize that file.
- Every `<img>` needs `width` + `height` (CLS), the hero needs `fetchpriority="high"` (it is the
  LCP element), and everything below the fold needs `loading="lazy"`.
- JPEGs are capped at 1200px on the long edge, quality 78, progressive. Nothing above that ships.

## CSS rules — do not break these

- **`css/style.min.css` is minified — do not edit it directly.** Override with inline `style=""` attributes on elements when needed.
- **`nav-apply` class must stay as-is.** The nav "Enroll" button uses class `nav-apply` (not `nav-enroll`) — renaming it breaks nav styling.
- **3-column grid:** Default CSS has `repeat(2,...)`. For 3-column grids, override inline with `style="grid-template-columns:repeat(auto-fit,minmax(250px,1fr));"` — NEVER a fixed `repeat(3,...)` inline: inline styles beat the stylesheet's mobile media queries, so a fixed 3-column inline grid stays 3-across on phones (bug fixed sitewide Jul 24, 2026). auto-fit collapses to 2/1 columns on its own.
- **Step card badges:** Cards use `flex-direction:column` with `margin-top:auto` on `.step-time` badge for bottom-alignment. Don't remove this.

---

## Brand system

Colors:
- Navy (primary background): `#181849`
- Electric blue (CTAs, highlights): `#403DD8`
- Sky blue (accents): `#81AAFB`
- Cream (light backgrounds): `#F5F4F0`
- White: `#FFFFFF`

Fonts: **Fustat** (headings/display) + **Inter** (body) — loaded via Google Fonts

Tone: Premium, confident, not academic. Bold sans-serif. Not a lecture or pitch deck — a working builder's program.

---

## How to add a new public page

1. Copy an existing page (e.g., `faq.html`) as your starting template
2. Add all 6 tracking scripts (GTM head snippet, Zoho zf_gtm, Zoho UTM passthrough, Twitter pixel, GTM noscript body, zf_gclid.js)
3. Add the new filename to the **Public pages** list in this file
4. Add JSON-LD structured data (at minimum: Organization schema)
5. Add canonical URL, og tags, and meta description to `<head>`
6. Add the new URL to `sitemap.xml`
7. If the page needs a redirect, add it to `vercel.json`
8. If the page introduces a new third-party host, update CSP in `vercel.json`
9. Run the pre-PR verification commands above — output should be empty

Pages marked `noindex` (like `demo-ppc.html`) are exempt from sitemap but still need all tracking scripts.

---

## Products & Pricing (quick reference)

### 2-week program (main product)
- Price: $3,999 full pay / $3,499 scholarship
- Full payment at enrollment — no deposit, no split pay
- Location: Austin TX, 9am–3pm Mon–Fri (optional Saturday office hours)
- Schedule (as of Jul 31): C1 Jul 6–17 (completed), C2 Aug 3–14 (enrollment closed Jul 27), **C3 Jan 11–22, 2027 (the only open cohort; enrollment closes Jan 4)**. November cohort cancelled Jul 31 — Marliis can't teach after August (maternity leave ~mid-Sept); fall 2026 is 3-day workshops (Ravi solo) + private team training. Dates live in cohorts.json — edit there and run `node scripts/cohorts.mjs`, never hand-edit dates in HTML.

### Mini-workshops — ACTIVE again (revived Jul 31, 2026)
Consumer workshops are back on the site: nav + More dropdown restored, /workshops indexed and in sitemap.xml, llms.txt carries the schedule. Led by Ravi (Marliis on maternity leave from ~mid-Sept). **Stack language rule: the workshops teach the Claude stack (Claude Code, Claude API, Composio, GitHub Actions) — NEVER the old n8n/Zapier/Airtable agenda** (customer-facing curriculum: Obsidian `Curriculum/3-Day-Workshop-Curriculum-Public.md`).

| # | Dates | Topic | Early Bird Closes |
|---|---|---|---|
| WS-Sep | Sep 11–13, 2026 (Fri–Sun) | Build Your First AI Agent | Aug 26 |
| WS-Oct | Oct 16–18, 2026 (Fri–Sun) | Automate Your Ops with AI | Sep 25 |
| WS-Nov | Nov 6–8, 2026 (Fri–Sun) | Build Your First App with AI (vibe coding) | Oct 16 |

**⚠️ The early-bird-close dates above are the source of truth = the Stripe checkout deadlines in workshop-register.html (Aug 26 / Sep 25 / Oct 16). Any date shown on workshops.html, JSON-LD, or social must match these. Stale Wed dates (Sep 9/Oct 14/Nov 4) and earlier closes (Aug 19/Sep 23/Oct 14) have caused site-vs-checkout mismatches twice — verify against the register-page JS before changing.**

Pricing: Early bird $999 / Regular $1,199. Attendees get $200 off the January 2-week program (code WORKSHOP200). Private team sessions: custom quote only — never publish a price (~$950/person internally, min ~$4,000). **Stripe: all 6 payment links are LIVE (early-bird + regular for Sep, Oct, and Nov) — created Jul 31, 2026. workshop-register.html auto-switches EB→regular by date for all three. The "Reserve a seat" buttons on /workshops route through the Zoho lead form, which redirects to /workshop-register (Stripe) after capture.** Still true: no workshops on the enrollment page.

### Corporate training (priority product)
B2B is a primary motion. "For Teams" in main nav → `/corporate`: (1) private 3-day team workshop (entry offer, custom quote), (2) custom company program (core offer), (3) individual seats ($3,999). Never publish private-session pricing.

**Cross-sell:** Workshop attendees get code `WORKSHOP200` ($200 off 2-week program).

---

## Site structure (page directory)

| File | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Homepage |
| `enroll.html` | `/enroll` | **Primary conversion page** — enrollment form |
| `immersive.html` | `/immersive` | Immersive Program overview |
| `apply.html` | `/apply` | Legacy — 301 redirects to /enroll. Keep. |
| `curriculum.html` | `/curriculum` | Week-by-week program breakdown |
| `pricing.html` | `/pricing` | Retired Jul 2026 — 301 redirects to /immersive. Keep. |
| `corporate.html` | `/corporate` | B2B — companies sending teams |
| `team.html` | `/team` | Team + advisors |
| `housing.html` | `/housing` | Info for out-of-town attendees |
| `scholarship.html` | `/scholarship` | $500 discount for vets/first responders/educators |
| `use-cases.html` | `/use-cases` | Industry-specific AI use cases |
| `faq.html` | `/faq` | FAQ |
| `demo-day.html` | `/demo-day` | Demo Day info |
| `alumni.html` | `/alumni` | Alumni showcase |
| `about.html` | `/about` | About MakerSquare |
| `comparison.html` | `/comparison` | vs. other programs |
| `demo-ppc.html` | `/demo-ppc` | PPC landing page — noindex, not in sitemap |
| `quickstart.html` | `/quickstart` | Pre-cohort quickstart guide |
| `quickstart-download.html` | `/quickstart-download` | Downloadable quickstart |
| `terms.html` | `/terms` | Terms of service |
| `privacy.html` | `/privacy` | Privacy policy |
| `404.html` | `/404` | 404 error page |

**Do not add workshops to the enrollment page** — protects the $3,999 conversion. Cross-sell only from /workshops → full program, not the other direction.

---

## Reference

Obsidian vault (strategy docs, workshop plans, email copy): `/Users/marliisschneider/Desktop/makersquare-brain/`
- `Marketing/Workshops-Strategy.md` — canonical workshop reference


## Site assistant (chatbot)

`/api/chat` (Vercel serverless) answers visitor questions with Claude Haiku, grounded STRICTLY on the live `/llms.txt` — so keeping llms.txt accurate keeps the bot accurate; there is no second facts file. Widget: `js/ms-chat.js`, included on all indexable pages. It cannot quote prices/dates not present in llms.txt and funnels uncertainty + buying intent to Book a Call. Requires `ANTHROPIC_API_KEY` env var in Vercel (Settings → Environment Variables) — without it the bot returns a graceful book-a-call fallback. Widget pushes `msc_chat_open` to dataLayer for GTM.

`/api/ideas` powers the "What would you build?" generator (homepage, mode=individual) and the instant 3-day team sketch (/corporate, mode=team) via `js/ms-ideas.js` and `[data-ms-ideas]` mount points. Same ANTHROPIC_API_KEY; strict-JSON prompts; both push `ms_ideas_submit` to dataLayer.


## Agent readiness (Aug 2026)

Scored via https://isitagentready.com/makersquare.ai. Four pieces, all additive — none of them touch page HTML:

- **`robots.txt` Content Signals** — `search=yes, ai-input=yes, ai-train=no`, repeated in every user-agent group (a bot matching a named group ignores the `*` group entirely, so it must be repeated). Plus an `Agentmap:` line pointing at the catalog.
- **Markdown negotiation** — a request with `Accept: text/markdown` is 307'd by `vercel.json` to `/api/markdown`, which refetches its own HTML and converts it with `lib/html-to-markdown.cjs`. **It must be a `redirect`, not a `rewrite`:** Vercel checks rewrites *after* the filesystem, so a static page would always win. The `(?!api/)` guard in the source pattern stops the agent's followed request from re-entering the rule.
- **`.well-known/ai-catalog.json`** — ARD capability manifest; `Link` headers on `/(.*)` advertise it alongside llms.txt and the sitemap.
- **`llms-full.txt`** — every public page as one markdown doc. Regenerate with `node scripts/build-llms-full.mjs` after meaningful copy changes. `llms.txt` stays hand-written — it is the curated summary *and* the `/api/chat` grounding file; llms-full is the exhaustive companion, not a replacement.

`lib/html-to-markdown.cjs` is regex-based with no npm deps (this repo has no package.json on purpose). **It must stay CommonJS and stay outside `api/`.** With no package.json, Vercel compiles `api/*.js` to CJS, so importing an ESM `.mjs` sibling crashed the live function with ERR_REQUIRE_ESM (Aug 21, 2026) — the route 307'd correctly and then 500'd. Both callers use default-import interop (`import converter from ...`), which works whether the bundle ends up CJS or ESM. Two things it must keep doing: **not** stripping `<button>` (the FAQ accordion puts the actual questions in buttons), and stripping `nav`/`header`/`footer` (per-page boilerplate). After changing it, re-run the builder and skim the diff.

Deliberately **not** implemented: MCP Server Card, OAuth/OIDC discovery, WebMCP, Agent Skills index, DNS-AID, and the four agentic-commerce protocols. They all presuppose an API or storefront for agents to call. Score stays capped around 60/100 until that exists — that's the correct outcome, not a gap to close.
