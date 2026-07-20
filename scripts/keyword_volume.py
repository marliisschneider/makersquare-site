#!/usr/bin/env python3
"""Pull real Google Ads search volume for the MakerSquare blog keyword bank.

Reads DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD from ../.env.local and hits the
DataForSEO Google Ads Search Volume Live endpoint in a single request
(cost: $0.075 flat, regardless of keyword count up to 1000).
"""
import json
import os
import sys
from pathlib import Path

import requests

ENV_PATH = Path(__file__).resolve().parent.parent / ".env.local"


def load_env(path):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    return env


KEYWORD_BANK = [
    # AI adoption / ROI
    "why companies aren't seeing ROI from AI",
    "why AI tools aren't working for my team",
    "how to actually get ROI from AI at work",
    "AI productivity for professionals",
    "AI adoption strategy for non-technical teams",
    "measuring AI impact at work",
    # AI skills for non-technical professionals
    "how to learn AI without coding",
    "AI training for non-technical professionals",
    "AI skills for operators",
    "AI tools for consultants",
    "AI tools for lawyers",
    "AI for business owners",
    "non-technical AI skills",
    "AI upskilling programs 2026",
    "how to build AI tools without coding",
    # Practical building
    "how to build an AI tool for your business",
    "AI automation for non-engineers",
    "how to use Claude for business",
    "build custom AI tools without coding",
    "AI workflows for small teams",
    # Local / specific
    "AI training program Austin Texas",
    "in-person AI training Austin",
    "AI builder program Austin",
    "AI training for small businesses in Austin",
    "small business AI training Austin",
    "AI training for small and mid-sized businesses Austin",
    "corporate AI training Austin Texas",
]


def main():
    env = load_env(ENV_PATH)
    login = env.get("DATAFORSEO_LOGIN")
    password = env.get("DATAFORSEO_PASSWORD")
    if not login or not password:
        sys.exit(f"Missing DATAFORSEO_LOGIN/PASSWORD in {ENV_PATH}")

    payload = [{
        "location_code": 2840,  # United States
        "language_code": "en",
        "keywords": KEYWORD_BANK,
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

    if data.get("status_code") != 20000:
        sys.exit(f"API error: {data.get('status_code')} {data.get('status_message')}")

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
    print(f"{'Keyword':<55} {'Volume':>8} {'Competition':>12} {'CPC':>7}")
    print("-" * 85)
    for r in rows:
        comp = r["competition"] or "-"
        cpc = f"${r['cpc']:.2f}" if r["cpc"] else "-"
        print(f"{r['keyword']:<55} {r['search_volume']:>8} {comp:>12} {cpc:>7}")

    out_path = Path(__file__).resolve().parent / "keyword_volume_results.json"
    with open(out_path, "w") as f:
        json.dump(rows, f, indent=2)
    print(f"\nFull results saved to {out_path}")


if __name__ == "__main__":
    main()
