#!/usr/bin/env python3
"""Get trustworthy exact search volumes (Google Ads endpoint) for a curated
pool of candidate blog topics not yet covered by live/scheduled posts.
One flat-cost call (~$0.09) for up to 1000 keywords. Ranks by volume.
"""
import json
import requests
from keyword_volume import load_env, ENV_PATH

# Curated candidates — professions/functions/how-tos NOT already covered by the
# 17 live posts or the ~35 scheduled ones. Framed in our proven winning patterns.
CANDIDATES = [
    # professions / roles (new)
    "ai for teachers", "ai for nurses", "ai for architects", "ai for engineers",
    "ai for graphic designers", "ai for writers", "ai for copywriters",
    "ai for recruiters", "ai for financial advisors", "ai for therapists",
    "ai for photographers", "ai for insurance agents", "ai for dentists",
    "ai for doctors", "ai for contractors", "ai for restaurant owners",
    "ai for retail", "ai for nonprofits", "ai for property managers",
    "ai for interior designers", "ai for event planners", "ai for personal trainers",
    "ai for podcasters", "ai for saas founders", "ai for agencies",
    "ai for real estate investors", "ai for mortgage brokers", "ai for attorneys",
    "ai for physicians", "ai for veterinarians", "ai for pharmacists",
    "ai for accountants", "ai for bookkeepers", "ai for social media managers",
    "ai for virtual assistants", "ai for executive assistants", "ai for analysts",
    "ai for product managers", "ai for founders", "ai for solopreneurs",
    "ai for small business", "ai for realtors", "ai for teachers and educators",
    "ai for hr managers", "ai for office managers", "ai for administrative assistants",
    # business functions / use-cases
    "ai for lead generation", "ai for cold email", "ai for proposal writing",
    "ai for grant writing", "ai for market research", "ai for competitive analysis",
    "ai for hiring", "ai for onboarding", "ai for inventory management",
    "ai for scheduling", "ai for invoicing", "ai for bookkeeping",
    "ai for customer support", "ai for meeting notes", "ai for note taking",
    "ai for presentations", "ai for reports", "ai for data entry",
    "ai for project management", "ai for email management", "ai for calendar management",
    "ai for social media content", "ai for blog writing", "ai for seo",
    # how-to / building
    "how to use ai for small business", "how to automate tasks with ai",
    "how to build an ai chatbot", "how to build an ai agent",
    "how to write a business plan with ai", "how to do market research with ai",
    "how to build a website with ai", "how to use ai to write emails",
    "how to use chatgpt for business", "how to use ai for productivity",
    "how to make money with ai", "how to start an ai business",
    "ai side hustle", "ai business ideas", "ai automation ideas",
    "ai prompt examples", "ai use cases for business", "best ai tools 2026",
    "free ai tools for business", "ai tools for productivity",
    "ai tools for entrepreneurs", "ai tools for startups",
]


def main():
    env = load_env(ENV_PATH)
    auth = (env["DATAFORSEO_LOGIN"], env["DATAFORSEO_PASSWORD"])
    payload = [{
        "location_code": 2840,
        "language_code": "en",
        "keywords": CANDIDATES,
        "search_partners": False,
    }]
    r = requests.post(
        "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
        auth=auth, json=payload, timeout=60)
    d = r.json()
    task = d["tasks"][0]
    rows = []
    for it in (task.get("result") or []):
        if it is None:
            continue
        rows.append({
            "keyword": it.get("keyword"),
            "search_volume": it.get("search_volume") or 0,
            "competition": it.get("competition"),
            "cpc": it.get("cpc"),
        })
    rows.sort(key=lambda x: x["search_volume"], reverse=True)

    out = "/Users/marliisschneider/makersquare-site/scripts/candidate_volumes_results.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)

    print(f"Cost: ${task.get('cost')}")
    nonzero = [r for r in rows if r["search_volume"] > 0]
    print(f"Candidates with measurable volume: {len(nonzero)} of {len(rows)}\n")
    print(f"{'Keyword':<44} {'Vol':>7} {'Comp':>8} {'CPC':>7}")
    print("-" * 70)
    for r in rows:
        if r["search_volume"] == 0:
            continue
        cpc = f"${r['cpc']:.2f}" if r.get("cpc") else "-"
        print(f"{r['keyword'][:44]:<44} {r['search_volume']:>7} {str(r['competition']):>8} {cpc:>7}")
    print(f"\nFull list saved to {out}")


if __name__ == "__main__":
    main()
