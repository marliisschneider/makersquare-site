#!/usr/bin/env python3
"""Pull search volume for the remaining unwritten posts in the editorial
calendar (Blog-Publishing-Calendar.md), to prioritize the backlog by real
demand instead of judgment. Same endpoint/cost model as keyword_volume.py.
"""
import json
from pathlib import Path

import requests

from keyword_volume import load_env, ENV_PATH

BACKLOG_KEYWORDS = [
    "AI for operations professionals",
    "AI for sales teams",
    "AI for marketing teams",
    "build a custom AI workflow",
    "AI workforce development Austin",
    "AI for HR teams",
    "AI for finance teams",
    "AI for healthcare professionals",
    "AI for real estate agents",
    "AI for freelancers",
    "AI for project managers",
    "AI for content creators",
    "how to write better AI prompts",
    "how to build a chatbot for your business",
    "AI for customer service teams",
    "AI data analysis without coding",
    "how to evaluate AI tools for your business",
    "AI tools for remote teams",
    "build a custom AI assistant",
    "AI for e-commerce",
    "build an AI product without a technical cofounder",
    "AI for accounting and bookkeeping",
    "AI for educators and coaches",
    "AI upskilling ROI",
]


def main():
    env = load_env(ENV_PATH)
    login = env.get("DATAFORSEO_LOGIN")
    password = env.get("DATAFORSEO_PASSWORD")

    payload = [{
        "location_code": 2840,
        "language_code": "en",
        "keywords": BACKLOG_KEYWORDS,
        "search_partners": False,
    }]

    resp = requests.post(
        "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
        auth=(login, password),
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    task = data["tasks"][0]
    cost = task.get("cost", 0)
    results = task.get("result") or []

    rows = []
    for r in results:
        if r is None:
            continue
        rows.append({
            "keyword": r.get("keyword"),
            "search_volume": r.get("search_volume") or 0,
            "competition": r.get("competition"),
            "cpc": r.get("cpc"),
        })
    rows.sort(key=lambda r: r["search_volume"], reverse=True)

    print(f"Cost: ${cost}\n")
    print(f"{'Keyword':<50} {'Volume':>8} {'Competition':>12} {'CPC':>7}")
    print("-" * 80)
    for r in rows:
        comp = r["competition"] or "-"
        cpc = f"${r['cpc']:.2f}" if r["cpc"] else "-"
        print(f"{r['keyword']:<50} {r['search_volume']:>8} {comp:>12} {cpc:>7}")

    out_path = Path(__file__).resolve().parent / "keyword_volume_backlog_results.json"
    with open(out_path, "w") as f:
        json.dump(rows, f, indent=2)
    print(f"\nFull results saved to {out_path}")


if __name__ == "__main__":
    main()
