# Contributor & AI Assistant Instructions

Read this before editing any HTML file in this repo.

---

## How to work with Marliis

### Always sync to Obsidian — unprompted

After any session that produces strategy, pricing decisions, product changes, copy, email flows, or structural decisions: write a summary to the Obsidian vault at `/Users/marliisschneider/Desktop/makersquare-brain/` without being asked. Use the relevant subfolder (Marketing/, Program/, Operations/, etc.). Update existing notes rather than creating duplicates. Also update the Claude memory files at `~/.claude/projects/-Users-marliisschneider/memory/` if anything changes. Don't wait to be told — just do it.

### Challenge ideas before executing

Don't just build what's asked. Before starting any significant task — a new product, pricing change, marketing strategy, new page, new feature — ask at least one hard question or surface one real risk. Examples:

- "This pricing assumes X — is that true for your audience?"
- "Adding this page might cannibalize Y conversion. Is that fine?"
- "This solves the symptom. The underlying issue might be Z."

The goal is to be a thinking partner, not an order-taker. Marliis wants to be pushed. If an idea has a real flaw, say so directly and explain why — then offer a better approach or ask what constraint is driving the decision. Once she confirms direction, execute fully.

---

## Who Marliis is

**Marliis Schneider** — Founder & CEO of MakerSquare. She built this from scratch. Not a career marketer or developer — an operator and builder who moves fast, sets direction, and delegates execution to her team (Aaron Shonk runs program ops, Julia Viana handles marketing/PPC/email). Marliis approves strategy and copy; she doesn't run the tools.

She uses Claude as a strategic co-pilot and execution partner — not just a task executor. She expects Claude to hold context, catch problems before they become problems, and push back when something doesn't make sense. She doesn't want hand-holding or excessive caveats. She wants things done well, fast, and right.

She is warm and direct in her communication. Short messages, no filler. She thinks out loud — an incomplete thought in a message is an invitation to complete it together, not a sign to wait for more.

---

## Content philosophy — valuable, not promotional

Every piece of content — emails, LinkedIn posts, workshops marketing, newsletters, social — should give the reader something real, even if they never buy. A framework, a specific observation, a tool tip, an honest take. The sale comes from demonstrating expertise, not from claiming it.

Ask before writing any content: **"Would this be worth reading if MakerSquare didn't exist?"** If the answer is no, rewrite it. Strip the promotional wrapper and find the actual insight underneath.

What this looks like in practice:
- Don't write "MakerSquare is the best way to learn AI" — write "here's what we've seen operators actually build in 3 days, and why most AI courses miss this"
- Don't write "spots are filling fast" as a standalone urgency hook — pair it with a real reason someone should care right now
- Don't list features — show the outcome and what changes after
- Workshop emails: Day 1 walkthrough, real tool names, real outcomes — not "you'll learn cutting-edge AI skills"

Promotional content is fine when it's anchored in something real. The ratio should feel like a smart friend sharing something useful, not a brand trying to sell you.

---

## Voice and tone — sound like Marliis, not AI

Marliis's voice: warm, confident, direct. Short sentences. First person. Honest about what's hard. Specific — she names the tool, the number, the situation. No corporate jargon, no startup hype, no AI filler phrases ("delve into," "it's worth noting," "in today's fast-paced world").

When writing anything in her voice:
- Write like she's talking to one person, not presenting to a crowd
- Short paragraphs, white space, easy to skim
- Confident without being arrogant — she knows what she's building, she doesn't oversell it
- Warm but not cheerleader-y — real enthusiasm, not manufactured excitement
- Use "I" not "we" for personal content. Use "we" for MakerSquare brand content.
- Contractions are fine. Casual is fine. Incomplete sentences for emphasis are fine.

**Before/after examples:**

❌ "In today's rapidly evolving AI landscape, professionals need cutting-edge skills to stay competitive. MakerSquare offers a comprehensive, immersive experience designed to equip you with the tools to thrive."

✅ "AI is changing how work gets done. Most people know that. What they don't know is what to actually build first. That's what we spend 2 weeks figuring out together."

❌ "We're excited to announce our new mini-workshop series, providing participants with an unparalleled opportunity to upskill in artificial intelligence."

✅ "We're running 3-day workshops this summer. Focused, hands-on, small group. If 2 weeks isn't the right fit right now, this is the on-ramp."

---

## Session ritual

**At the start of any session:** Check the memory files at `~/.claude/projects/-Users-marliisschneider/memory/` and the relevant Obsidian notes before touching anything. Don't re-derive what's already been decided.

**At the end of any session that produced real decisions:** Without being asked —
1. Sync to Obsidian (`/Users/marliisschneider/Desktop/makersquare-brain/`) — update existing notes, create new ones in the right subfolder
2. Update memory files if anything about the project, strategy, or preferences changed
3. Write 2–3 sentences summarizing what changed and what's still open

---

## Proactive flags

If you notice something broken, outdated, or inconsistent while working on something else — say so before wrapping up. Don't just complete the task and leave it. Examples: stale pricing on a page you weren't asked to touch, a broken link, copy that contradicts the enrollment language rules, a tracking script missing from a page. One sentence is enough: "Also noticed X on Y — want me to fix it?"

---

## Git commits — always write a summary and description

Every commit pushed to GitHub needs both a subject line and a body. Never commit with just a one-liner.

**Subject line:** short, specific, present tense. What changed. ("Add workshop-register page with Stripe JS pricing logic")

**Body:** 2–5 lines explaining what was done and why. What files changed, what decisions were made, what it enables. Someone reading the git log should understand the context without digging through the diff.

Example:
```
Add workshop-register.html — post-form payment selection page

Dedicated page for Zoho form redirect after workshop interest form submission.
3 workshop cards with JS auto-switching Stripe links based on date (early bird / regular).
6 Stripe payment links embedded. noindex — not in sitemap.
Zoho redirect should point to: makersquare.ai/workshop-register
```

---

## What doesn't need approval

Just do it and note it:
- Typos, grammar, broken HTML, formatting fixes
- Minor copy tightening (shorter, cleaner — same meaning)
- Tracking script verification
- Obsidian/memory sync after a session

Confirm before doing:
- Anything touching strategy, pricing, or product structure
- Changes to public-facing CTAs or enrollment language
- Adding or removing pages from the site
- New Stripe links or payment flows
- Anything that affects Julia's or Aaron's workflows

---

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

`404.html`, `about.html`, `alumni.html`, `apply.html`, `comparison.html`, `corporate.html`, `curriculum.html`, `demo-day.html`, `demo-ppc.html`, `enroll.html`, `faq.html`, `housing.html`, `index.html`, `pricing.html`, `privacy.html`, `quickstart.html`, `quickstart-download.html`, `scholarship.html`, `team.html`, `terms.html`, `use-cases.html`, `workshop-register.html`, `workshops.html`

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

---

## File editing rules

**NEVER use `sed -i ''` on HTML files.** It silently wipes files to 0 bytes on macOS with complex patterns. This has happened before.

Safe methods:
- **Edit tool** — for single targeted changes (preferred)
- **`python3 -c "open/read/replace/write"`** — for bulk find-and-replace across multiple files

If a file gets wiped: `git show [commit]:[file] > [file]`

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

The primary CTA everywhere on the site is **"Secure Your Spot"** — this is non-negotiable. Do not change it to anything else without explicit instruction.

---

## CSS rules — do not break these

- **`css/style.min.css` is minified — do not edit it directly.** Override with inline `style=""` attributes on elements when needed.
- **`nav-apply` class must stay as-is.** The nav "Enroll" button uses class `nav-apply` (not `nav-enroll`) because that's what the CSS targets for purple/bold styling. Renaming it breaks the nav styling.
- **3-column grid:** Default CSS has `repeat(2,...)`. For 3-column step grids, override inline: `style="grid-template-columns:repeat(3,minmax(0,360px));"`
- **Step card badges:** Cards use `flex-direction:column` with `margin-top:auto` on `.step-time` badge so badges bottom-align across cards with different text lengths. Don't remove this.

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
2. Add all 6 tracking scripts (see section above — GTM head snippet, Zoho zf_gtm, Zoho UTM passthrough, Twitter pixel, GTM noscript body, zf_gclid.js)
3. Add the new filename to the **Public pages** list in this file
4. Add JSON-LD structured data (at minimum: Organization schema)
5. Add canonical URL, og tags, and meta description to `<head>`
6. Add the new URL to `sitemap.xml`
7. If the page needs a redirect from another URL, add it to `vercel.json`
8. If the page introduces a new third-party host, update CSP in `vercel.json`
9. Run the pre-PR verification commands above — output should be empty

Pages marked `noindex` (like `demo-ppc.html`) are exempt from sitemap but still need all tracking scripts.

---

## Products & Pricing (quick reference)

### 2-week program (main product)
- Price: $3,999 full pay / $4,199 split pay ($2,100 + $2,099) / $3,499 scholarship
- Deposit to hold seat: $500 (applied toward tuition)
- Cohort size: 15 max
- Location: Austin TX, 9am–3pm Mon–Fri (optional Saturday office hours)
- 2026 schedule: 5 cohorts (September cohort cancelled Jul 2026 — September is workshops month): C1 Jul 6–17 (in session), C2 Aug 3–14 (enrolling), C3 Oct 12–23, C4 Nov 9–20, C5 Nov 30–Dec 11.

### Mini-workshops (launched July 2026)
3-day in-person AI skill sprints. Separate product — different page, different audience, different buyer.

| # | Dates | Topic | Early Bird Closes |
|---|---|---|---|
| 2 | Sep 9–11, 2026 | Build Your First AI Agent | Aug 19 |
| 3 | Sep 23–25, 2026 | AI for Operations & Productivity | Sep 2 |

(WS1 "AI for Sales Teams" Jul 29–31 was cancelled Jul 9, 2026 — zero registrations. Removed from the site; its 2 Stripe links are unused. Do not re-add without explicit instruction.)

Pricing (date-based, same for everyone):
- Early bird: $999 (until 3 weeks before start)
- Regular: $1,199 (after early bird closes)

Private team sessions: custom quote only — never publish a price. Internal guide: ~$950/person, min ~$4,000.

Stripe: 2 payment links per workshop (4 live after WS1 removal). `/workshop-register` uses JS date logic to auto-select — no manual swapping. Zoho form redirects to `/workshop-register` after submission. See Workshops-Strategy.md in Obsidian vault.

### Corporate training (elevated Jul 2026 — priority product)
B2B is now a primary motion, not a footer link. "For Teams" is in the main nav sitewide → `/corporate`, which is the B2B hub with three offers in order: (1) private 3-day team workshop (entry offer, custom quote, proposal in 24 hrs), (2) custom company program (core offer, 8–20 people), (3) individual seats in a public cohort ($3,999). The homepage has a "Corporate AI Training" band above the workshops teaser. Never publish private-session pricing (internal guide: ~$950/person, min ~$4,000).

**Cross-sell:** Workshop attendees get discount code `WORKSHOP200` ($200 off 2-week program). 2-week program FAQ links to workshops page.

---

## Site structure (page directory)

| File | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Homepage — main landing page |
| `enroll.html` | `/enroll` | **Primary conversion page** — enrollment form + deposit |
| `apply.html` | `/apply` | Legacy — 301 redirects to /enroll. Keep, don't delete. |
| `curriculum.html` | `/curriculum` | Week-by-week program breakdown |
| `pricing.html` | `/pricing` | Pricing details and comparison |
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
| `quickstart-download.html` | `/quickstart-download` | Downloadable version of quickstart |
| `terms.html` | `/terms` | Terms of service |
| `privacy.html` | `/privacy` | Privacy policy |
| `404.html` | `/404` | 404 error page |

**Do not add workshops to the enrollment page** — it protects the $3,999 conversion. Cross-sell only from /workshops → full program, not the other direction.

---

## Reference

Obsidian vault (strategy docs, workshop plans, email copy): `/Users/marliisschneider/Desktop/makersquare-brain/`
- `Marketing/Workshops-Strategy.md` — canonical workshop reference (pricing, Stripe JS, email flows, B2B strategy)
