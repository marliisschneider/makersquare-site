# MakerSquare Website — Context & Current State
_Last updated: May 21, 2026_

---

## What MakerSquare Is

2-week in-person AI builder program in Austin, TX. Built for operators, founders, and professionals — not coders. Participants ship 3 real AI products and present at a public Demo Day. No coding experience required.

- **Price:** $3,999 (full pay) or $4,199 (split pay: $2,100 now + $2,099 at week 1)
- **Scholarship:** $3,499 (for military veterans, first responders, educators — $500 discount)
- **Deposit to hold seat:** $500 (applied toward tuition)
- **Remaining balance after deposit:** $3,499
- **Cohort size:** 15 people max
- **2026 schedule:** 8 cohorts, July–December (Cohort 1 starts July 6)
- **Location:** Austin, TX (9am–5pm Mon–Fri)

---

## Team

| Name | Role | Notes |
|------|------|-------|
| Marliis Schneider | Founder & CEO | marliis.reinkort@gmail.com |
| Aaron Shonk | Program Manager | Full-time, day-to-day operations |
| Julia Viana | Senior Marketing Coordinator | Joined May 2026, handles PPC + Zoho |

**Advisors / Mentors (on team page):**
- Ravi Parikh — CEO & Co-founder, RoverPass
- Chris Shonk — Co-founder, ATX Venture Partners
- Levon Terteryan — Founder, Playgram.ai
- Vijay Mehra — CEO, LenderBox

---

## Enrollment Model (Updated May 2026)

**Old model:** Application → admissions interview → acceptance → payment  
**New model:** Short form → $500 deposit → confirmed in 24 hrs → join community

### Three-step enrollment flow (live on site):
1. **Tell us about yourself** — Name, email, industry, what you want to build. Under 2 minutes. No resume, no essay.
2. **Secure your spot** — $500 deposit via Stripe, applied toward $3,999 tuition. Confirmation within 24 hours.
3. **Join the community** — Pre-cohort prep kit, tool access, MakerSquare Slack invite.

### Language rules:
- Never say "apply", "application", "admissions", "interview", "selective admission"
- Say "enroll", "enrollment", "secure your spot", "deposit"
- CTA everywhere is **"Secure Your Spot"** (not "Apply Now", not "Reserve Your Seat")

---

## Pages

| URL | File | Purpose | Notes |
|-----|------|---------|-------|
| `/` | index.html | Homepage | Main landing page |
| `/enroll` | enroll.html | Enrollment page | **Primary conversion page** — replaced /apply |
| `/apply` | apply.html | Legacy redirect | vercel.json redirects /apply → /enroll (301). Keep file, don't delete. |
| `/curriculum` | curriculum.html | Program curriculum | Week-by-week breakdown |
| `/pricing` | pricing.html | Pricing details | $3,999 full / $4,199 split / $3,499 scholarship |
| `/team` | team.html | Team & advisors | Julia Viana added May 2026 |
| `/housing` | housing.html | Housing info | For out-of-town attendees |
| `/scholarship` | scholarship.html | Scholarship details | $500 discount for vets/first responders/educators |
| `/corporate` | corporate.html | B2B / corporate | For companies sending teams |
| `/use-cases` | use-cases.html | Industry use cases | What participants in each industry build |
| `/demo-ppc` | demo-ppc.html | PPC landing page | **noindex/nofollow** — for paid ads only, not in sitemap |
| `/404` | 404.html | 404 page | |
| `/terms` | terms.html | Terms of service | |
| `/privacy` | privacy.html | Privacy policy | |

---

## Stripe Payment Links

| Product | Amount | Link |
|---------|--------|------|
| Enrollment Deposit | $500 | `https://buy.stripe.com/3cIeVccBd6Qx58V3y16wE00` |
| Tuition Balance | $3,499 | _(being set up — product name: "MakerSquare — Tuition Balance", desc: "Remaining balance after $500 deposit. Total tuition: $3,999.")_ |

---

## Lead Capture: Zoho Forms

- Enrollment form embedded on `/enroll` and `/demo-ppc`
- **Zoho form fields (simplified):** Full Name, Email, Industry/Role, "What do you want to build?"
- Julia Viana manages Zoho — she needs to simplify form to 4 fields before PPC launch
- UTM passthrough script is live in demo-ppc.html

---

## Technical Stack

- **Hosting:** Vercel (auto-deploy from GitHub on push to main)
- **Domain:** makersquare.ai (www canonical)
- **CSS:** `css/style.min.css` — minified, do not edit directly. Override with inline styles when needed.
- **JS:** `js/` folder (minor scripts)
- **Analytics:** Google Tag Manager (GTM-MJTW9WQ3) + Zoho PageSense
- **Fonts:** Fustat (display/headings) + Inter (body) via Google Fonts
- **Schema:** JSON-LD structured data on all pages (Course, CourseInstance, FAQPage, BreadcrumbList, Organization)
- **Git:** GitHub repo, push via GitHub Desktop (no SSH/gh CLI set up)

### vercel.json redirects:
- `/apply` → `/enroll` (301 permanent)

### Important CSS notes:
- Nav "Enroll" button uses class `nav-apply` (NOT nav-enroll) — the CSS only has `.nav-links a.nav-apply` rules for purple/bold styling. If you rename to nav-enroll the styling breaks.
- 3-column steps grid: CSS has `repeat(2,...)` so override inline: `style="grid-template-columns:repeat(3,minmax(0,360px));"`
- Step cards use flex-column with `margin-top:auto` on `.step-time` badge to keep badges bottom-aligned across cards with different text lengths.

### File editing rules:
- **NEVER use `sed -i ''` on HTML files** — it silently wipes files to 0 bytes on macOS with complex patterns
- Safe methods: Edit tool (single targeted changes) or `python3 -c "read/replace/write"` (bulk changes)
- If a file gets wiped: restore with `git show [commit]:[file] > [file]`

---

## SEO

- All pages have canonical URLs, og tags, JSON-LD schema
- Sitemap: `/sitemap.xml` — `/enroll` listed (not /apply)
- robots.txt: standard, demo-ppc.html excluded via `noindex` meta tag (not via robots.txt)
- Schema prices everywhere: `"price": "3999"` (not 5999 — that was old pricing)
- Schema offer URLs: `https://www.makersquare.ai/enroll` (not /apply)
- **Known issue:** Google favicon shows blank white circle — favicon.png (32x32) likely has white background. Needs a new favicon with colored (indigo) background to show in search results.

---

## Recent Changes (May 2026)

### Enrollment rebranding
- Created `/enroll` page — full replacement for old /apply
- Removed all application/admissions/interview language sitewide
- Added 3rd enrollment step: "Join the community" (prep kit + Slack invite)
- Added Julia Viana to team page (Senior Marketing Coordinator, Joined May 2026)
- Changed Aaron Shonk title from "Head of Admissions" → "Head of Enrollment"
- All CTAs changed from "Apply Now" / "Reserve Your Seat" → **"Secure Your Spot"**
- All links updated from `/apply` → `/enroll`
- Added vercel.json 301 redirect /apply → /enroll

### Pricing updates
- Price changed from $5,999 → $3,999 sitewide
- Split pay option: $4,199 ($2,100 + $2,099)
- Scholarship: $3,499 (was linked to old price)
- Schema updated everywhere (was still showing $5,999)

### Design fixes
- Step cards: flex-column layout so badge anchors to card bottom (fixes 03 card appearing lower)
- Homepage bento card: removed "Selective admission. Personal interview with every applicant." → "Capped at 15 seats per cohort."

### SEO fixes
- Schema prices: $5,999 → $3,999 in enroll.html, apply.html, curriculum.html
- Schema offer URLs: /apply → /enroll in index.html, pricing.html, curriculum.html
- og:title on enroll.html/apply.html: "Apply to MakerSquare" → "Enroll at MakerSquare"
- Sitemap: /apply → /enroll
- Meta description on index.html: removed "Apply now for the next cohort"

---

## Pending / To-Do

- [ ] **Favicon:** Create new favicon with indigo background (white M on #3B3BCC or similar) so it shows in Google search
- [ ] **Stripe:** Finish setting up "MakerSquare — Tuition Balance" ($3,499) payment link
- [ ] **Zoho form:** Julia to simplify to 4 fields (Name, Email, Industry, What to build)
- [ ] **Ad creatives:** Julia to update CTA from "Apply Now" → "Learn More" before PPC launch
- [ ] **Stripe deposit link** (`$500`): activates once Stripe verifies new account
- [ ] **Julia onboarding message:** Marliis to send Julia the full onboarding message drafted in session
