#!/bin/bash
# Ping IndexNow (Bing — powers ChatGPT search & Copilot) after deploying new/changed pages.
# Usage: ./scripts/indexnow-ping.sh /workshops /ai-training-austin
KEY="3d99456f5c906c0927d3cda3deead771"
for path in "$@"; do
  curl -s "https://api.indexnow.org/indexnow?url=https://www.makersquare.ai$path&key=$KEY" -o /dev/null -w "pinged %{url_effective} → %{http_code}\n"
done
