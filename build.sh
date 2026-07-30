#!/usr/bin/env bash
# Bundles the multi-page site into two single-file builds:
#   share.html         — standalone, for WhatsApp / email / opening offline
#   artifact-body.html — body-only, for publishing as a Claude artifact
#
# The pages themselves stay the source of truth. app.js notices when several
# pages share one document and switches from real links to in-page routing.
set -euo pipefail
cd "$(dirname "$0")"

# photos are inlined as data URIs for the one-file builds
node gen-credits.js --inline

PAGES="index arrival house photos walks walk-vintgar walk-radovna walk-pokljuka-gorge \
walk-osojnica walk-visevnik walk-debela-pec activities eat story more credits"

mains() {
  for p in $PAGES; do
    [ -f "$p.html" ] || { echo "missing $p.html" >&2; exit 1; }
    awk '/<main /,/<\/main>/' "$p.html"
    echo
  done
}

body() {
  echo '<style>'
  cat app.css
  echo '</style>'
  echo '<div class="shell">'
  mains
  echo '</div>'
  echo '<script>'
  cat credits.js
  cat app.js
  echo '</script>'
}

{
  echo '<!doctype html>'
  echo '<html lang="en">'
  echo '<head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  echo '<meta name="theme-color" content="#10404A">'
  echo '<meta name="apple-mobile-web-app-capable" content="yes">'
  echo '<title>Triglav Park House — Guest Guide</title>'
  echo '</head>'
  echo '<body>'
  body
  echo '</body>'
  echo '</html>'
} > share.html

{
  echo '<title>Triglav Park House — Guest Guide</title>'
  body
} > artifact-body.html

printf 'share.html         %s KB\n' "$(( $(wc -c < share.html) / 1024 ))"
printf 'artifact-body.html %s KB\n' "$(( $(wc -c < artifact-body.html) / 1024 ))"
grep -c '<main ' share.html | xargs printf 'pages bundled:     %s\n'

# leave the working copy pointing at the img/ files again
node gen-credits.js
