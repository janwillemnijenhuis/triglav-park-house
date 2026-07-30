/* Writes credits.html from img/credits.json, so the attribution list can never
   drift out of step with the pictures actually in the app. */

const fs = require('fs');
const credits = JSON.parse(fs.readFileSync('img/credits.json', 'utf8'));

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The thumbnails go through the same data-photo hydration as every other
   picture, so they survive being inlined into the single-file build — a
   hard-coded img/ path would break the moment the file travels on its own. */
const rows = Object.entries(credits).map(([slug, c]) => `      <li>
        <div class="thumb art-wrap" data-photo="${esc(slug)}" data-credit="off"></div>
        <div class="txt">
          <h3>${esc(c.caption)}</h3>
          <p>${esc(c.author)} &middot; ${esc(c.licence)}</p>
          <a class="link" href="${esc(c.source)}" target="_blank" rel="noopener">On Wikimedia Commons
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
          </a>
        </div>
      </li>`).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#10404A">
<title>Photo credits — Triglav Park House</title>
<link rel="stylesheet" href="app.css">
<script defer src="credits.js"></script>
<script defer src="app.js"></script>
</head>
<body>
<div class="shell">

<main class="page" data-page="credits" data-tab="more" data-title="Photo credits" data-back="more.html" data-backlabel="More">

  <div class="stack">
    <h2>Photo credits</h2>
    <p class="lede">The landscape, town and food photographs in this guide come from Wikimedia Commons. Each one is public domain, CC0, CC BY or CC BY-SA, which means it may be reused as long as the photographer is credited &mdash; so here they all are.</p>
    <p class="small">The pictures of the house itself are placeholder artwork, drawn for this draft. They will be replaced with the owner's own photographs.</p>
  </div>

  <div class="stack">
    <ul class="credits">
${rows}
    </ul>
  </div>

  <div class="stack">
    <footer class="foot">
      If any photographer here would rather not appear in a private guest guide, the picture comes straight out &mdash; just say so.
    </footer>
  </div>

</main>

</div>
</body>
</html>
`;

fs.writeFileSync('credits.html', html);
console.log('credits.html: ' + Object.keys(credits).length + ' entries');
