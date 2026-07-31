#!/usr/bin/env python3
"""
Weekly Search Console report for makersquare.ai.
Pulls live GSC data via a service account and prints a markdown digest:
week-over-week totals, brand-term watch, top pages, and striking-distance
opportunities (ranking pos 4-15 with impressions but no clicks).

Auth: set env GSC_SA_KEY to the service-account JSON (a GitHub secret).
The service account must be added as a user on the Search Console property.
Gracefully no-ops if GSC_SA_KEY is unset (so CI doesn't fail before setup).
Run: python3 scripts/gsc-report.py
"""
import os, json, sys, datetime, re

KEY = os.environ.get("GSC_SA_KEY", "").strip()
if not KEY:
    print("GSC_SA_KEY not set — skipping live Search Console report (see setup in PR).")
    sys.exit(0)

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except ImportError:
    sys.exit("Install deps: pip install google-api-python-client google-auth")

SITE = "sc-domain:makersquare.ai"
creds = service_account.Credentials.from_service_account_info(
    json.loads(KEY), scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
sc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)

# GSC data lags ~3 days
end = datetime.date.today() - datetime.timedelta(days=3)
def rng(back0, back1): return (str(end - datetime.timedelta(days=back0)), str(end - datetime.timedelta(days=back1)))
this_s, this_e = rng(6, 0)
prev_s, prev_e = rng(13, 7)

def q(start, end_, dims=None, limit=200):
    body = {"startDate": start, "endDate": end_, "rowLimit": limit}
    if dims: body["dimensions"] = dims
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

def totals(rows):
    c = sum(r.get("clicks", 0) for r in rows); i = sum(r.get("impressions", 0) for r in rows)
    p = (sum(r.get("position", 0) * r.get("impressions", 0) for r in rows) / i) if i else 0
    return c, i, p

tw = q(this_s, this_e, ["date"]); pw = q(prev_s, prev_e, ["date"])
tc, ti, tp = totals(tw); pc, pi, pp = totals(pw)
def d(a, b): return f"{a} ({'+' if a-b>=0 else ''}{a-b} vs prior wk)"

out = []
out.append(f"# Search Console — week of {this_s} → {this_e}\n")
out.append(f"- **Clicks:** {d(tc, pc)}")
out.append(f"- **Impressions:** {d(ti, pi)}")
out.append(f"- **Avg position:** {tp:.1f} (prior {pp:.1f}) {'⚠️ worse' if tp>pp+0.5 else ''}\n")

# brand watch
brand = [r for r in q(this_s, this_e, ["query"]) if r["keys"][0] in ("makersquare", "maker square")]
if brand:
    bp = min(r["position"] for r in brand)
    out.append(f"**Brand watch** — best position for your name this week: **{bp:.1f}**"
               + (" ⚠️ (not #1 — something may be outranking you)" if bp > 2.5 else " ✅"))

# top pages
pages = sorted(q(this_s, this_e, ["page"]), key=lambda r: -r.get("clicks", 0))[:5]
out.append("\n**Top pages (clicks):**")
for r in pages:
    out.append(f"- {r['keys'][0].replace('https://www.makersquare.ai','')} — {r['clicks']} clicks / {r['impressions']} impr / pos {r['position']:.1f}")

# striking-distance opportunities: query+page, pos 4-15, impressions>=5, no clicks
opp = [r for r in q(this_s, this_e, ["query", "page"], 1000)
       if 4 <= r["position"] <= 15 and r["impressions"] >= 5 and r["clicks"] == 0]
opp.sort(key=lambda r: (r["position"], -r["impressions"]))
out.append("\n**Striking-distance (pos 4–15, impressions, no clicks — nudge these):**")
if opp:
    for r in opp[:8]:
        pg = r["keys"][1].replace("https://www.makersquare.ai", "")
        out.append(f"- pos {r['position']:.0f} · {r['impressions']} impr · \"{r['keys'][0][:55]}\" → {pg}")
else:
    out.append("- none this week")

report = "\n".join(out)
print(report)

# optional Slack delivery — set env SLACK_WEBHOOK (a GitHub secret)
hook = os.environ.get("SLACK_WEBHOOK", "").strip()
if hook:
    import urllib.request
    txt = re.sub(r"^# (.+)$", r"*\1*", report, flags=re.M)
    txt = re.sub(r"\*\*(.+?)\*\*", r"*\1*", txt)
    try:
        urllib.request.urlopen(urllib.request.Request(
            hook, data=json.dumps({"text": txt}).encode(),
            headers={"Content-Type": "application/json"}), timeout=15)
        print("\n(posted to Slack)")
    except Exception as e:
        print(f"\n(Slack post failed: {e})")
