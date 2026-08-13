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

1. **Google Tag Manager** — `GTM-MJTW9WQ3`, **delayed-load** (Aug 2026): the loader initializes `dataLayer` immediately but defers the gtm.js request until first user interaction or 3.5s, to keep third-party tags off the mobile critical path. Do NOT revert to the eager `(function(w,d,s,l,i)...` snippet — it tanks mobile performance. dataLayer still queues events so nothing is lost.
2. **Zoho `zf_gtm` postMessage listener** — pushes form events into `dataLayer` (look for `type == "zf_gtm"`)
3. **Zoho `ZFLead` UTM + `fbclid` passthrough** — header reads `<!-- Zoho UTM passthrough (modificado: incluye fbclid) -->`
4. ~~**X (Twitter) conversion pixel**~~ — REMOVED Aug 2026 (ads paused; it hurt mobile perf + best-practices with no ads running). Re-add the `twq(.config.,.rcjjn.)` snippet if X ads resume.

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
grep -L "GTM-MJTW9WQ3" *.html | grep -v HANDOFF
grep -L "ns.html?id=GTM-MJTW9WQ3" *.html | grep -v HANDOFF
grep -L "zf_gclid.js" *.html | grep -v HANDOFF
grep -L "modificado: incluye fbclid" *.html | grep -v HANDOFF
grep -L 'type == "zf_gtm"' *.html | grep -v HANDOFF
grep -L "twq('config','rcjjn')" *.html | grep -v HANDOFF
```

---

## CSP header

The Content Security Policy lives in `vercel.json` under the `/(.*)`route's headers. Currently in `Content-Security-Policy-Report-Only` mode — violations show in the browser console but don't block resources yet.

**When adding a new third-party script**, add its host to the appropriate directive — usually `script-src` and `connect-src`. Currently allowed: Zoho (`*.zoho.com`, `*.zohocdn.com`), Google Tag Manager, Google Analytics, DoubleClick, Pagesense, Twitter Ads (`static.ads-twitter.com`, `analytics.twitter.com`).

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
| WS-Sep | Sep 11–13, 2026 (Fri–Sun) | Build Your First AI Agent | Aug 21 |
| WS-Oct | Oct 16–18, 2026 (Fri–Sun) | Automate Your Ops with AI | Sep 25 |
| WS-Nov | Nov 6–8, 2026 (Fri–Sun) | Build Your First App with AI (vibe coding) | Oct 16 |

**⚠️ The early-bird-close dates above are the source of truth = the Stripe checkout deadlines in workshop-register.html (Aug 21 / Sep 25 / Oct 16). Any date shown on workshops.html, JSON-LD, or social must match these. Stale Wed dates (Sep 9/Oct 14/Nov 4) and earlier closes (Aug 19/Sep 23/Oct 14) have caused site-vs-checkout mismatches twice — verify against the register-page JS before changing.**

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
