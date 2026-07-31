# SEO agent — makersquare.ai

Two automated jobs (`.github/workflows/seo-audit.yml`):

### 1. Guardrail (`scripts/seo-audit.py`) — no setup needed
Runs on every PR + every Friday. Scans all indexable pages and **blocks a PR** on real
bugs: copied/wrong-page social tags (the FAQ-tag class), `og:url` ≠ canonical, missing
title/description/canonical, sitemap listing a missing/noindex page. Reports over-length
titles/descriptions as warnings.

### 2. Weekly Search Console report (`scripts/gsc-report.py`) — needs one secret
Runs every Friday. Pulls live GSC data and writes a digest to the Actions run summary:
week-over-week clicks/impressions/position, brand-term watch, top pages, and
striking-distance opportunities (ranking pos 4–15 with impressions but no clicks).

**One-time setup (~10 min):**
1. In **Google Cloud Console** → create/pick a project → **APIs & Services → Enable APIs** → enable **Google Search Console API**.
2. **IAM & Admin → Service Accounts → Create** (name e.g. `gsc-report`). No roles needed. Open it → **Keys → Add key → JSON** → download.
3. In **Search Console** (search.google.com/search-console) → property `makersquare.ai` → **Settings → Users and permissions → Add user** → paste the service-account email (looks like `gsc-report@PROJECT.iam.gserviceaccount.com`) → permission **Restricted** (read) is enough.
4. In the **GitHub repo → Settings → Secrets and variables → Actions → New repository secret** → name **`GSC_SA_KEY`** → paste the full JSON key file contents → save.

Until `GSC_SA_KEY` is set, the report job runs and simply skips (no failure).
The digest appears under the Friday run's **Summary** in the Actions tab.
