#!/usr/bin/env python3
"""Discover rankable, in-niche blog topics via DataForSEO Labs Keyword Ideas.

Seeds are our proven winning phrases (AI-for-profession / AI-tools-for-X /
how-to-with-AI). Filters to the rankable long-tail band (real demand, not
un-rankable head terms) and excludes generic/irrelevant terms. Aggregates
across seed clusters into one ranked, deduplicated candidate pool.
"""
import json
import re
import sys
import requests
from keyword_volume import load_env, ENV_PATH

SEED_CLUSTERS = [
    # profession / role
    ["ai for accountants", "ai for teachers", "ai for hr professionals", "ai for recruiters", "ai for financial advisors"],
    ["ai for nurses", "ai for architects", "ai for engineers", "ai for designers", "ai for writers"],
    ["ai for small business owners", "ai for entrepreneurs", "ai for startups", "ai for coaches", "ai for consultants"],
    # business function
    ["ai for customer service", "ai for marketing", "ai for sales", "ai for operations", "ai for hr"],
    ["ai for social media", "ai for email marketing", "ai for content marketing", "ai for seo", "ai for advertising"],
    # how-to / building
    ["how to use ai for business", "how to automate with ai", "ai automation for small business", "how to build ai agent", "ai workflow automation"],
    # tools framing
    ["best ai tools for business", "ai productivity tools", "ai tools for writing", "ai tools for small business", "ai tools for marketing"],
]

# volume band: rankable long-tail (real demand, not un-rankable head terms)
VOL_MIN, VOL_MAX = 40, 12000

# exclude generic head terms / irrelevant / off-brand we will never target
EXCLUDE = re.compile(
    r'\b(girlfriend|boyfriend|nsfw|undress|spicy|anime|waifu|porn|nude|character\.?ai|'
    r'chatbot online|free ai (image|photo|picture|video)|face swap|voice|song|music|'
    r'image generator|photo generator|picture generator|art generator|logo|avatar|'
    r'meme|essay|homework|detector|checker|humaniz|what is ai|ai stock|crypto)\b',
    re.IGNORECASE)


def discover():
    env = load_env(ENV_PATH)
    auth = (env["DATAFORSEO_LOGIN"], env["DATAFORSEO_PASSWORD"])
    pool = {}
    total_cost = 0.0
    for cluster in SEED_CLUSTERS:
        payload = [{
            "keywords": cluster,
            "location_code": 2840,
            "language_code": "en",
            "limit": 80,
            "filters": [
                ["keyword_info.search_volume", ">", VOL_MIN],
                "and",
                ["keyword_info.search_volume", "<", VOL_MAX],
            ],
            "order_by": ["keyword_info.search_volume,desc"],
        }]
        r = requests.post(
            "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live",
            auth=auth, json=payload, timeout=60)
        d = r.json()
        total_cost += d.get("cost", 0)
        task = d["tasks"][0]
        if not task.get("result"):
            continue
        for it in (task["result"][0].get("items") or []):
            kw = it["keyword"]
            if EXCLUDE.search(kw):
                continue
            ki = it.get("keyword_info", {})
            vol = ki.get("search_volume") or 0
            pool[kw] = {
                "keyword": kw,
                "search_volume": vol,
                "competition": ki.get("competition_level"),
                "cpc": ki.get("cpc"),
            }

    rows = sorted(pool.values(), key=lambda x: x["search_volume"], reverse=True)
    out = "/Users/marliisschneider/makersquare-site/scripts/keyword_discovery_results.json"
    with open(out, "w") as f:
        json.dump(rows, f, indent=2)

    print(f"Total cost: ${total_cost:.4f}")
    print(f"Unique candidate keywords (band {VOL_MIN}-{VOL_MAX}, filtered): {len(rows)}\n")
    print(f"{'Keyword':<50} {'Vol':>7} {'Comp':>8} {'CPC':>7}")
    print("-" * 76)
    for r in rows[:70]:
        cpc = f"${r['cpc']:.2f}" if r.get("cpc") else "-"
        print(f"{r['keyword'][:50]:<50} {r['search_volume']:>7} {str(r['competition']):>8} {cpc:>7}")
    print(f"\nFull list ({len(rows)}) saved to {out}")


if __name__ == "__main__":
    discover()
