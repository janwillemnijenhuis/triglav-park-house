# Triglav Park House — guest guide

A small guest guide app for [Triglav Park House](https://www.booking.com/hotel/si/triglav-park-house.html),
a former royal hunting lodge (1928) at Spodnje Gorje 188, Zgornje Gorje, in Triglav
National Park, Slovenia.

Draft, shown to the owner for approval. Dotted yellow boxes mark the details only
she can supply.

**Live:** https://janwillemnijenhuis.github.io/triglav-park-house/

## Layout

Sixteen plain HTML pages sharing one stylesheet and one script — no framework, no
build step for the site itself.

| | |
|---|---|
| `index.html` | home: hero, quick facts, navigation tiles |
| `arrival.html` | address, the last kilometre, check-in steps |
| `house.html` | orientation, facilities, house rules |
| `photos.html` | gallery with lightbox |
| `walks.html` + `walk-*.html` | six routes, one page each |
| `activities.html` | days out around Bled and Bohinj |
| `eat.html` | seven restaurants |
| `story.html` | 1928 to now |
| `more.html` | menu, contacts, what the draft still needs |
| `credits.html` | photo attribution (generated) |
| `app.css` | design tokens and components |
| `app.js` | shared chrome, procedural artwork, lightbox, router |
| `credits.js` | photo table (generated) |
| `img/` | photographs + `credits.json` |

`app.js` builds the top bar and tab bar on every page, so a new page only needs its
content and a `<main class="page" data-page="..." data-title="...">` wrapper.

## Scripts

```sh
node fetch-images.js       # re-download photos from Wikimedia Commons
node gen-credits.js        # write credits.js pointing at img/
node gen-credits-page.js   # write credits.html from img/credits.json
bash build.sh              # bundle everything into one sendable file
```

`build.sh` produces `share.html` (standalone, for email or WhatsApp) and
`artifact-body.html`, inlining the CSS, JS and every photo as data URIs. The same
`app.js` detects that several pages share one document and switches from real links
to in-page routing, so both builds behave identically.

## Pictures

Photographs of the gorge, mountains, lake, villages and food come from Wikimedia
Commons and are public domain, CC0, CC BY or CC BY-SA. Author and licence for each
one live in `img/credits.json` and are shown in the app on `credits.html`.

Pictures of the house itself are procedural artwork drawn on a canvas by `app.js` —
placeholders until the owner's own photographs arrive.

## Note

Access details (wifi password, key code, phone numbers) are deliberately *not* in
this repository. They should not go on a public URL.
