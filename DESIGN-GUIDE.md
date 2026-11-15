# MakerSquare Design Guide

Read this before building or redesigning any public page. It describes how the live site already looks, so new pages match it. Written 2026-11-13 from an audit of the live site at three widths (phone 390px, iPad 820px, desktop 1440px) plus `css/style.min.css`.

Words on the page follow `Marketing/Messaging-Guide.md` (Obsidian) and the enrollment language rules in `CLAUDE.md`. This file covers how things look.

---

## 1. Source of truth

- **`css/style.min.css`** holds every design token (below). It is minified: never edit it. Use the tokens through `var(--name)` in inline styles or a page `<style>` block.
- **Best reference pages:** `index.html` (homepage), `corporate.html` (B2B page with the standard light hero), `workshops.html` (dark hero variant).
- **Logos:** `logo-light.webp` / `logo-dark.webp` on the site; source files in `makersquare-brain/Marketing/brand/`. The brand spelling is **MakerSquare** (capital S).

## 2. Color

Use tokens only. Do not introduce new hex values.

| Token | Hex | Use for |
|---|---|---|
| `--navy` | #181849 | Headings, dark sections, footer |
| `--indigo` | #403DD8 | Primary buttons, links, section labels, accent text |
| `--indigo-hover` | #3532B8 | Primary button hover |
| `--azure` | #538EE5 | Middle stop of the headline gradient |
| `--sky` | #81AAFB | Accent text on dark backgrounds |
| `--ice` | #C1D4FA | Borders on light badges |
| `--cloud` | #ECF0FD | Badge and icon tile fills, ghost button hover |
| `--light-bg` | #f7f7fb | Alternate section background (`.section--alt`) |
| `--card-bg` | #f5f5fa | Muted panel inside a white card |
| `--white` | #FFFFFF | Page and card background |
| `--text` | #1a1a2e | Body text |
| `--text-secondary` | #6b6b8d | Paragraphs, card copy |
| `--text-muted` | #6a6a88 | Captions, small labels, microcopy |
| `--green` | #22C55E | "Live" dots, success checks only |
| `--amber` | #F59E0B | Workshop "next up" highlights only |

- Dark sections use the navy gradient `linear-gradient(180deg,#1d1d5c,#181849)`, optionally with the dot texture `radial-gradient(circle,rgba(255,255,255,0.035) 1px,transparent 1px) 0 0/18px 18px` layered on top.
- On dark backgrounds: headings white, accent words `--sky`, paragraphs `rgba(255,255,255,0.65–0.7)`.
- **`--cream` does not exist** in the stylesheet, even though `CLAUDE.md` lists cream (#F5F4F0). `var(--cream)` renders as no background. Use `--light-bg`.

## 3. Type

- **Fustat** (`var(--font-display)`) for headings, buttons, card titles, FAQ questions. Weight 800 for headings, 700 for buttons.
- **Inter** (`var(--font)`) for everything else. Body 16px, line-height 1.6.
- Never write `font-family:'Fustat'` directly; use the token.

| Element | Size | Notes |
|---|---|---|
| H1 | `clamp(2.4rem,5vw,3.8rem)` | letter-spacing -0.04em, line-height 1.12 |
| H2 | `clamp(1.8rem,3.5vw,2.8rem)` | letter-spacing -0.03em |
| H3 (card title) | 1–1.15rem, weight 700–800 | |
| Hero paragraph | 1.05–1.1rem, line-height 1.7–1.75, max-width ~520–640px | `--text-secondary` |
| Section paragraph | 0.95rem, line-height 1.7 | |
| Card copy | 0.82–0.9rem, line-height 1.6–1.65 | |
| Section label | 0.75rem, 700, uppercase, letter-spacing 0.1em, `--indigo` | class `.section-label` (has a small square before it) |
| Microcopy | 0.82–0.88rem, `--text-muted` | e.g. "No coding test · No interview · Confirmed in 24 hrs" |

**Two-tone headlines are the signature.** H1s and most H2s are two short lines: line one in navy, line two in accent.
- Light background: line two uses `.text-gradient` (indigo → azure → sky) in heroes, `.text-accent` (indigo) in section H2s.
- Dark background: line two in `--sky`.
- Examples: "AI training for your team. / Built around your business." "We don't teach engineers. / We teach people who know their field."

## 4. Spacing, radius, shadow

- Spacing scale: `--s1` 4px, `--s2` 8, `--s3` 12, `--s4` 16, `--s5` 20, `--s6` 24, `--s7` 32, `--s8` 40, `--s9` 48, `--s10` 64, `--s11` 80, `--s12` 96. Use these, not raw px.
- Section padding: `.section` = `--section-pad` (100px desktop, 72px on phones).
- Container: `.container`, max-width 1200px, side padding 32px (20px on phones). Narrow text sections use an inline `max-width:720–880px`.
- Radius: buttons `--r-sm` (8px) or `--r-md` (12px) for large; cards `--r-xl` (20px); pills `--r-full`.
- Shadows: cards `0 4px 20px rgba(24,24,73,0.06)` or `--shadow-sm`; hover `--shadow-md`; primary button hover `--shadow-indigo`.

## 5. Breakpoints and devices

| Width | What changes |
|---|---|
| ≤1140px | Nav links and nav buttons hide; hamburger menu appears (this covers iPad portrait and landscape) |
| ≤1024px | Two-column heroes stack (visual drops below text); 3–4 column grids go to 2 |
| ≤768px | Phone layout: every grid goes to 1 column, section padding 72px, container padding 20px |

- **Test every new page at 390, 820 and 1440 wide.** No horizontal scroll at any width.
- Grids: use `grid-template-columns:repeat(auto-fit,minmax(240–300px,1fr))`. Never an inline fixed `repeat(3,...)`; inline styles beat the stylesheet's phone rules and stay 3-across on phones.
- Two-column comparison rows (like a JD table) stack on phones and show a small label above each half.
- The chat bubble (bottom right) floats over content on phones. Keep important buttons out of the bottom-right corner of the first screen.

## 6. Page structure

Standard order for a marketing page:
1. **Nav**: byte-identical on all standard pages (copy from `ai-training-austin.html` or `index.html`). Right side: ghost "Enroll" + primary "Schedule An Intro Call".
2. **Breadcrumbs** (`.breadcrumbs`): Home / Page name.
3. **Hero** (see below).
4. **3–6 content sections**, alternating white and `.section--alt` (`--light-bg`).
5. **One dark proof section** (testimonials or student builds), navy gradient, usually in the middle of the page.
6. **FAQ**.
7. **Dark CTA band** (navy gradient) with the primary button.
8. **Keep reading** links, then **footer** (copy unchanged), then the intro-call modal and chat widget.

Use at most 2–3 dark sections per page. A page should read mostly light.

### Hero: two styles exist
- **Light hero (default).** White background with soft gradient glow, section label, two-tone H1, paragraph, primary button + one line of microcopy, optional visual on the right (stacks below on iPad/phone). Used by `index`, `corporate`, `curriculum`, `enroll`, `team`. **Use this for new product and role pages.**
- **Dark hero.** Navy gradient, centered or left-aligned, white H1 with `--sky` second line. Used by `workshops` and `ai-training-austin`. Use only for event-style or campaign pages.

## 7. Components

- **Primary button:** `class="btn btn-primary btn-lg btn-arrow"`. The arrow comes from CSS; don't type "→" inside it.
- **Intro call:** add `data-lt-trigger` to any button to open the booking modal. Label is exactly **"Schedule An Intro Call"** (title case "An"; 107 of 120 uses on the site). Only /corporate may say "Talk to Our Training Team".
- **One primary CTA per page.** A secondary action uses `.btn-ghost` (on dark backgrounds: white text, `rgba(255,255,255,0.3)` border).
- **Card:** white, `border:1px solid rgba(24,24,73,0.06)`, `border-radius:var(--r-xl)`, padding `--s6` to `--s8`, hover lifts 2–3px with `--shadow-md`. Card label = small uppercase indigo tag (0.65rem, 800, letter-spacing 0.1em), then a Fustat title, then `--text-secondary` copy.
- **Icon tile:** 52px square, `--r-md`, `--cloud` fill with `--ice` border, line icon in indigo. No emoji icons.
- **Badge / pill:** light: `.hero-badge` (`--cloud` fill, `--ice` border, indigo text). Dark: `rgba(255,255,255,0.06)` fill, `rgba(129,170,251,0.25)` border. A green pulsing dot marks something live or enrolling.
- **Stat cards:** row of small white cards with a Fustat number in indigo or navy and a muted label.
- **Testimonial card:** white card on a navy section, quote with key phrases in indigo bold, avatar + name + role under a thin divider.
- **FAQ:** `.faq-item` accordion (index, workshops) or simple white Q&A cards. Every visible FAQ also goes in `FAQPage` JSON-LD.
- **Scroll reveal:** add `class="reveal"` (and `reveal-d2`, `reveal-d3` for stagger) to section headings and cards. Content fades up on scroll. For full-page screenshots, scroll the page first or the sections look empty.

## 8. Don'ts

- No new colors, fonts, or font sizes outside this guide.
- Don't edit `css/style.min.css`. If you change any file in `css/` or `js/`, bump its `?v=` everywhere (see `CLAUDE.md`).
- No emoji in headings or as icons. No stock photos; use real cohort photos from `images/cohort1`, `images/cohort2`, `images/events`.
- No competing CTAs ("Apply", "Book a Call", "Learn more" buttons).
- Don't drop the tracking scripts when copying a page (see `CLAUDE.md`).

## 9. Before shipping a public page

- [ ] Screenshots at 390, 820, 1440 (scroll first so `.reveal` content shows). No horizontal scroll.
- [ ] Hero follows section 6; headline is two-tone.
- [ ] Only tokens used; `grep -n '#[0-9a-fA-F]\{6\}'` on the page shows nothing new.
- [ ] Every CTA says "Schedule An Intro Call" and has `data-lt-trigger`.
- [ ] `python3 scripts/conventions-check.py` passes.

## 10. Inconsistencies found in the Nov 13 audit (to fix sitewide)

1. **Logo reads "Makersquare"** (lowercase s) in the nav and footer images. The brand is MakerSquare; capital-S files exist in `makersquare-brain/Marketing/brand/`.
2. **CTA casing:** 10 buttons say "Schedule an Intro Call" or "Schedule an intro call" instead of "Schedule An Intro Call"; 2 say "Book an Intro Call".
3. **`var(--cream)`** is used on pages (e.g. `ai-training-austin.html`) but never defined, so those sections lose their background. 20 more places hard-code #f5f4f0.
4. **`font-family:'Fustat', sans-serif`** hard-coded 6 times instead of the token.
5. **Homepage on phones:** a large gap opens between "You already know your" and "industry." in the H1, and the chat bubble covers the dates row near the bottom of the first screen.
6. Two hero styles (light and dark) are mixed without a rule. Section 6 now sets one.
7. At 820px wide the footer overflows by 4px (horizontal scroll) on every page, including the homepage.
