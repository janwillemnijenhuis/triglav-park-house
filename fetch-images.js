/* Downloads the guide's photographs from Wikimedia Commons at display size and
   records the licence and author of each one, so the app can credit them.
   Run with: node fetch-images.js
   Every file below is public domain, CC0, CC BY or CC BY-SA — free to reuse
   with attribution. Nothing here is scraped from a site that forbids it. */

const fs = require('fs');
const path = require('path');

const UA = 'TriglavParkHouseGuestGuide/1.0 (private guest guide; janwillem.nijenhuis@nedap.com)';
const OUT = path.join(__dirname, 'img');

/* slug, Commons file name, requested width, caption used in the app.
   Widths are chosen for a 460px-wide phone layout: 900 for full-bleed heroes,
   ~600 for cards, less for small tiles — the whole set has to stay small
   enough to inline into one sendable file. */
const MANIFEST = [
  ['vintgar',          'Blejski Vintgar 01.jpg',                                    900, 'Vintgar Gorge'],
  ['sum',              'Waterfall Šum in Slovenia (51785088749).jpg',               620, 'The Šum waterfall'],
  ['radovna',          'Radovna pri vasi Krnica.jpg',                               900, 'The Radovna near Krnica'],
  ['pokljuka-gorge',   'PokljuskaSoteska2.JPG',                                     900, 'Pokljuka Gorge'],
  ['visevnik',         'View form Viševnik, Slovenia (2024).jpg',                   900, 'From the top of Viševnik'],
  ['debela-pec',       'Debela pec.jpg',                                            900, 'Debela peč'],
  ['osojnica',         'Mala Osojnica - Blick ins Tal (51581283953).jpg',           900, 'Lake Bled from Mala Osojnica'],
  ['bled-island',      'Bled Island 05.jpg',                                        900, 'Bled island'],
  ['bled-castle',      'Bled Castle 05.jpg',                                        620, 'Bled Castle'],
  ['pokljuka',         'Pokljuka-244355.jpg',                                       900, 'The Pokljuka plateau'],
  ['pokljuka-pasture', 'Mountain pastures at Pokljuka plateau, Julian alps (52340727204).jpg', 620, 'Pasture on Pokljuka'],
  ['bohinj',           'Bohinjsko jezero 2.jpg',                                    620, 'Lake Bohinj'],
  ['savica',           'Savica Fall.jpg',                                           520, 'The Savica waterfall'],
  ['radovljica',       'Radovljica old town centre.jpg',                            620, 'Radovljica old town'],
  ['mezakla',          'Mežakla - panorama.jpg',                                    900, 'The Mežakla plateau'],
  ['gorje',            '2017-8-Zgornje Gorje (3).jpg',                              900, 'Zgornje Gorje'],
  ['triglav',          'Panorama of the Triglav National park including Triglav.jpg', 1100, 'Triglav National Park'],
  ['kremsnita',        'Bled Cremeschnitte (blejska kremšnita).jpg',                560, 'Blejska kremšnita'],
  ['king-alexander',   '1920 Alexander I of Yugoslavia.png',                        460, 'King Alexander I, 1920'],
  ['vintgar-postcard', 'Postcard of Blejski Vintgar, Šum waterfall.jpg',            520, 'The Šum waterfall on an old postcard'],
  ['mezakla-postcard', 'Postcard of Mežakla 1960.jpg',                              560, 'Mežakla, 1960']
];

const plain = (v) => String(v || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

async function api(params) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams(params);
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) { throw new Error('api ' + r.status); }
  return r.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Commons only renders a few permitted thumbnail widths — in practice 500px or
   960px for these files, and any other width in the URL returns HTTP 400. So
   ask the API and use the URL it gives back verbatim. 500px suits a 460px-wide
   phone layout and keeps the one-file build sendable. */
const IIWIDTH = '400';

/* Commons rate-limits bursts, so download one at a time and back off on 429. */
async function download(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) { return Buffer.from(await res.arrayBuffer()); }
    if (res.status !== 429 && res.status !== 503) { throw new Error('http ' + res.status); }
    await sleep(2000 * (attempt + 1));
  }
  throw new Error('rate limited after 4 attempts');
}

(async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  /* metadata for every file in two calls (the API caps titles per request) */
  const pages = [];
  for (let i = 0; i < MANIFEST.length; i += 12) {
    const chunk = MANIFEST.slice(i, i + 12);
    const data = await api({
      action: 'query',
      titles: chunk.map((r) => 'File:' + r[1]).join('|'),
      prop: 'imageinfo',
      iiprop: 'url|size|extmetadata',
      iiurlwidth: IIWIDTH,
      format: 'json'
    });
    pages.push(...Object.values((data.query && data.query.pages) || {}));
  }

  const credits = {};
  let total = 0;

  for (const [slug, file, width, caption] of MANIFEST) {
    const page = pages.find((p) => p.title === 'File:' + file);
    if (!page || page.missing !== undefined || !page.imageinfo) {
      console.log('MISSING  ' + slug + '  (' + file + ')');
      continue;
    }
    const ii = page.imageinfo[0];
    const em = ii.extmetadata || {};
    const src = ii.thumburl || ii.url;
    const ext = path.extname(new URL(src).pathname).toLowerCase() || '.jpg';
    const name = slug + ext;

    let buf;
    try {
      buf = await download(src);
    } catch (err) {
      console.log('FAIL     ' + slug + '  ' + err.message);
      continue;
    }
    fs.writeFileSync(path.join(OUT, name), buf);
    total += buf.length;
    await sleep(500);

    credits[slug] = {
      file: name,
      caption,
      title: file,
      author: plain(em.Artist && em.Artist.value) || 'Unknown',
      licence: plain(em.LicenseShortName && em.LicenseShortName.value) || 'see source',
      source: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent('File:' + file),
      requestedWidth: width,
      bytes: buf.length
    };
    console.log(
      String(Math.round(buf.length / 1024)).padStart(4) + ' KB  ' +
      name.padEnd(24) + credits[slug].licence.padEnd(15) + credits[slug].author.slice(0, 34)
    );
  }

  fs.writeFileSync(path.join(OUT, 'credits.json'), JSON.stringify(credits, null, 2));
  console.log('\n' + Object.keys(credits).length + ' images, ' + Math.round(total / 1024) + ' KB total');

}());
