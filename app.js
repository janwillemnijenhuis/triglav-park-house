/* Triglav Park House — guest app
   Shared chrome (top bar + tab bar), procedural artwork, lightbox, and a
   router that works both as separate .html files and as one bundled file. */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ icons */

  var I = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H10v6H4a1 1 0 0 1-1-1z"/>',
    boot: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 17c4 0 4-5 0-5S4 8 8 7h8"/>',
    fork: '<path d="M7 3v7a2 2 0 0 0 4 0V3M9 12v9M15 3c-1.5 2-1.5 4 0 6v12"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-4 4 3 3-2 4 3"/>',
    more: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8 2 2-2 2 1.5 1.5L18 12l-2-2"/>',
    bed: '<path d="M3 18v-7h13a4 4 0 0 1 4 4v3M3 11V7"/><circle cx="8" cy="8" r="2"/>',
    map: '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h7"/>',
    phone: '<path d="M5 4h4l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    back: '<path d="m14 6-6 6 6 6"/>',
    ext: '<path d="M7 17 17 7M9 7h8v8"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    car: '<path d="M4 16h16M6 16v2M18 16v2M5 16l1.5-6h11L19 16"/><circle cx="8" cy="13" r="1"/><circle cx="16" cy="13" r="1"/>',
    wifi: '<path d="M5 12a10 10 0 0 1 14 0M8 15a6 6 0 0 1 8 0"/><circle cx="12" cy="18.5" r="1.2"/>',
    fire: '<path d="M12 3c2.5 3.5-1 4.5 0 7M6 13h12M7 13a5 5 0 0 0 10 0M12 18v3"/>',
    tree: '<path d="M12 3 7 11h10zM12 8l-6 9h12z"/><path d="M12 17v4"/>',
    water: '<path d="M4 9c3-3 5 3 8 0s5 3 8 0M4 15c3-3 5 3 8 0s5 3 8 0"/>',
    kids: '<circle cx="12" cy="6" r="2.5"/><path d="M12 9v6M8 12h8M9 21l3-6 3 6"/>',
    dish: '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="4"/>',
    cup: '<path d="M5 6h11v6a5 5 0 0 1-10 0zM16 8h2a2 2 0 0 1 0 4h-2M4 20h14"/>'
  };

  function svg(name, w) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.9) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[name] + '</svg>';
  }
  window.appIcon = svg;

  var TABS = [
    { page: 'index', href: 'index.html', label: 'Home', icon: 'home' },
    { page: 'walks', href: 'walks.html', label: 'Walks', icon: 'boot' },
    { page: 'eat', href: 'eat.html', label: 'Eat', icon: 'fork' },
    { page: 'photos', href: 'photos.html', label: 'Photos', icon: 'photo' },
    { page: 'more', href: 'more.html', label: 'More', icon: 'more' }
  ];

  /* ---------------------------------------------------------------- artwork */

  /* Seeded PRNG so a given tile always draws the same picture. */
  function rng(seed) {
    var a = (seed * 1831 + 7919) | 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function mix(a, b, t) {
    function hx(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    var x = hx(a), y = hx(b);
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' +
      Math.round(x[1] + (y[1] - x[1]) * t) + ',' +
      Math.round(x[2] + (y[2] - x[2]) * t) + ')';
  }

  /* Each scene: sky gradient, ridge colours, and which extras to draw. */
  var SCENES = {
    lodge: {
      light: { sky: ['#1D4A57', '#E9AE58'], far: '#3E6470', near: '#081C22', sun: [.68, .58, '#FFD79A'] },
      dark: { sky: ['#08222B', '#B4762C'], far: '#1B4048', near: '#030E12', sun: [.68, .58, '#E5B673'] },
      layers: 4, trees: 1, lodge: 1
    },
    valley: {
      light: { sky: ['#BFD8DE', '#F1E9D9'], far: '#7C9BA0', near: '#2A4A44', sun: [.24, .3, '#FFF3D6'] },
      dark: { sky: ['#0B2833', '#2C4A4A'], far: '#204049', near: '#04141A', sun: [.24, .3, '#8FB0AE'] },
      layers: 4, meadow: 1, river: 1, trees: 1
    },
    gorge: {
      light: { sky: ['#CFE2E4', '#EDF2EC'], far: '#8AA7A4', near: '#1E3A38', sun: [.5, .12, '#FFFFFF'] },
      dark: { sky: ['#0E2C33', '#1B4247'], far: '#2A4B4C', near: '#040F12', sun: [.5, .12, '#B9D6D2'] },
      layers: 3, narrow: 1, river: 1, mist: 1
    },
    lake: {
      light: { sky: ['#C6DCE3', '#F4ECDD'], far: '#83A2A8', near: '#28494C', sun: [.76, .26, '#FFEFCB'] },
      dark: { sky: ['#092530', '#28454C'], far: '#1E434B', near: '#040F14', sun: [.76, .26, '#9CBCBC'] },
      layers: 4, water: 1, island: 1
    },
    summit: {
      light: { sky: ['#93BBD2', '#E4EEF0'], far: '#8FA3AE', near: '#3C4E58', sun: [.3, .18, '#FFFFFF'] },
      dark: { sky: ['#0A2635', '#1D4150'], far: '#2A4756', near: '#0A161C', sun: [.3, .18, '#CFE0E8'] },
      layers: 5, rock: 1, snow: 1
    },
    plateau: {
      light: { sky: ['#C9DCDC', '#F0EEE1'], far: '#7E9C90', near: '#22423A', sun: [.6, .22, '#FFF6DE'] },
      dark: { sky: ['#0B2A2C', '#254541'], far: '#1D423C', near: '#04120F', sun: [.6, .22, '#93B2A4'] },
      layers: 5, trees: 2
    },
    forest: {
      light: { sky: ['#D6E4D8', '#F2F1E6'], far: '#7E9781', near: '#1D3A2C', sun: [.42, .16, '#FFFBEA'] },
      dark: { sky: ['#0C2622', '#1E3C31'], far: '#1E3F32', near: '#040F0C', sun: [.42, .16, '#8FAE96'] },
      layers: 2, trunks: 1
    },
    room: {
      light: { wall: ['#F1EBE0', '#DCD3C4'], warm: '#F6C775', floor: '#9A7A55' },
      dark: { wall: ['#20282A', '#121A1D'], warm: '#D9A45E', floor: '#3A2E24' },
      interior: 'window'
    },
    table: {
      light: { wall: ['#2A2320', '#171310'], warm: '#F2C173', floor: '#4A3729' },
      dark: { wall: ['#1A1614', '#0C0A09'], warm: '#E0AE5F', floor: '#332619' },
      interior: 'table'
    },
    archive: {
      light: { sky: ['#D8CDB6', '#EFE7D4'], far: '#9C8F76', near: '#3B3527', sun: [.7, .3, '#FFF6DC'] },
      dark: { sky: ['#241F17', '#3E3629'], far: '#4A4133', near: '#0F0D09', sun: [.7, .3, '#B3A282'] },
      layers: 4, trees: 1, lodge: 1, sepia: 1
    }
  };

  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) { return t === 'dark'; }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function paint(cv) {
    var wrap = cv.parentNode;
    var w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) { return false; }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var def = SCENES[cv.dataset.scene] || SCENES.valley;
    var p = isDark() ? def.dark : def.light;
    var rand = rng(parseInt(cv.dataset.seed || '1', 10) * 97 + (cv.dataset.scene || '').length);

    if (def.interior) { interior(ctx, w, h, p, def, rand); }
    else { landscape(ctx, w, h, p, def, rand); }

    grain(ctx, w, h, rand);
    cv.setAttribute('data-drawn', '');
    return true;
  }

  function landscape(ctx, w, h, p, def, rand) {
    var horizon = def.water ? h * 0.56 : h * 0.72;

    var g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, p.sky[0]);
    g.addColorStop(1, p.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (p.sun) {
      var sx = w * p.sun[0], sy = h * p.sun[1];
      var r = Math.max(w, h) * 0.5;
      var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      sg.addColorStop(0, p.sun[2]);
      sg.addColorStop(0.18, p.sun[2].length === 7 ? p.sun[2] + 'AA' : p.sun[2]);
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      if (def.water || def.rock) {
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(6, w * 0.022), 0, Math.PI * 2);
        ctx.fillStyle = p.sun[2];
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    var layers = def.layers || 3;
    var i, t, base, amp, y, x, jag;

    if (def.narrow) {
      /* gorge: two close walls with a bright slot of sky between them */
      for (i = 0; i < layers; i++) {
        t = i / (layers - 1 || 1);
        ctx.fillStyle = mix(p.far, p.near, 0.35 + t * 0.65);
        var lean = w * (0.14 + t * 0.1);
        var side = i % 2 === 0 ? 0 : 1;
        ctx.beginPath();
        if (side === 0) {
          ctx.moveTo(0, 0);
          for (y = 0; y <= h; y += h / 10) {
            ctx.lineTo(lean + Math.sin(y / h * 3 + i) * w * 0.06 + rand() * 4, y);
          }
          ctx.lineTo(0, h);
        } else {
          ctx.moveTo(w, 0);
          for (y = 0; y <= h; y += h / 10) {
            ctx.lineTo(w - lean - Math.sin(y / h * 2.4 + i) * w * 0.06 - rand() * 4, y);
          }
          ctx.lineTo(w, h);
        }
        ctx.closePath();
        ctx.fill();
      }
    } else {
      for (i = 0; i < layers; i++) {
        t = i / (layers - 1 || 1);
        base = horizon - (1 - t) * h * (def.rock ? 0.34 : 0.2) + t * h * 0.14;
        amp = h * (def.rock ? 0.16 : 0.08) * (1 - t * 0.35);
        jag = def.rock ? 1 : 0;
        var ph1 = rand() * 6.28, ph2 = rand() * 6.28, ph3 = rand() * 6.28;
        ctx.fillStyle = mix(p.far, p.near, t);
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (x = 0; x <= w; x += Math.max(2, w / 90)) {
          var u = x / w;
          y = base
            + Math.sin(u * 6.0 + ph1) * amp
            + Math.sin(u * 13.0 + ph2) * amp * (jag ? 0.55 : 0.32)
            + Math.sin(u * 27.0 + ph3) * amp * (jag ? 0.3 : 0.1);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        if (def.snow && i >= layers - 3) {
          ctx.save();
          ctx.clip();
          ctx.globalAlpha = 0.16 + (1 - t) * 0.2;
          ctx.fillStyle = '#FFFFFF';
          for (x = 0; x <= w; x += w / 26) {
            var sw = w / 26;
            ctx.fillRect(x, base - amp * 0.4 + rand() * amp * 0.5, sw * (0.4 + rand() * 0.6), h * 0.05 * rand());
          }
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }
    }

    if (def.water) {
      var wg = ctx.createLinearGradient(0, horizon, 0, h);
      wg.addColorStop(0, mix(p.near, p.sky[1], 0.34));
      wg.addColorStop(1, mix(p.near, '#000000', 0.15));
      ctx.fillStyle = wg;
      ctx.fillRect(0, horizon, w, h - horizon);
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      for (i = 0; i < 16; i++) {
        y = horizon + (h - horizon) * (i / 16) + rand() * 3;
        ctx.beginPath();
        var x0 = w * rand() * 0.5;
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + w * (0.12 + rand() * 0.4), y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (def.island) {
      /* Bled's island church, small and unmistakable */
      var ix = w * 0.62, iy = horizon - 1, s = Math.max(10, w * 0.05);
      ctx.fillStyle = mix(p.near, '#000000', 0.25);
      ctx.beginPath();
      ctx.ellipse(ix, iy + 2, s * 1.5, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(ix - s * 0.22, iy - s * 0.95, s * 0.44, s * 0.95);
      ctx.beginPath();
      ctx.moveTo(ix - s * 0.3, iy - s * 0.9);
      ctx.lineTo(ix, iy - s * 1.5);
      ctx.lineTo(ix + s * 0.3, iy - s * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(ix + s * 0.4, iy - s * 0.55, s * 0.5, s * 0.55);
    }

    if (def.meadow) {
      var mg = ctx.createLinearGradient(0, horizon - h * 0.05, 0, h);
      mg.addColorStop(0, mix(p.near, '#6E8B5A', 0.5));
      mg.addColorStop(1, mix(p.near, '#000000', 0.1));
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (x = 0; x <= w; x += w / 30) {
        ctx.lineTo(x, horizon + h * 0.02 + Math.sin(x / w * 4 + 1) * h * 0.02);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }

    if (def.river) {
      ctx.fillStyle = def.narrow ? mix(p.sky[0], '#FFFFFF', 0.45) : mix(p.sky[1], '#7FA9AE', 0.6);
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - w * 0.02, def.narrow ? h * 0.42 : horizon);
      ctx.lineTo(w * 0.5 + w * 0.02, def.narrow ? h * 0.42 : horizon);
      ctx.lineTo(w * 0.5 + w * 0.2, h);
      ctx.lineTo(w * 0.5 - w * 0.24, h);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#FFFFFF';
      for (i = 0; i < 7; i++) {
        y = (def.narrow ? h * 0.5 : horizon + 4) + (h - horizon) * rand() * 1.1;
        ctx.beginPath();
        ctx.moveTo(w * 0.5 - w * 0.12 * rand(), y);
        ctx.lineTo(w * 0.5 + w * 0.12 * rand(), y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (def.trunks) {
      /* looking into the trees */
      for (i = 0; i < 9; i++) {
        var tx = w * (i / 9) + rand() * w * 0.06;
        var tw = w * (0.02 + rand() * 0.035);
        var shade = 0.25 + rand() * 0.75;
        ctx.fillStyle = mix(p.far, p.near, shade);
        ctx.fillRect(tx, -h * 0.05, tw, h * 1.05);
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#000000';
        ctx.fillRect(tx + tw * 0.6, -h * 0.05, tw * 0.4, h * 1.05);
        ctx.globalAlpha = 1;
      }
      var fg = ctx.createLinearGradient(0, h * 0.6, 0, h);
      fg.addColorStop(0, 'rgba(0,0,0,0)');
      fg.addColorStop(1, mix(p.near, '#000000', 0.3));
      ctx.fillStyle = fg;
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
    }

    if (def.trees) {
      var rows = def.trees;
      for (var r0 = 0; r0 < rows; r0++) {
        var by = h * (0.82 + r0 * 0.09);
        var th = h * (0.16 - r0 * 0.03);
        ctx.fillStyle = mix(p.near, '#000000', 0.1 + r0 * 0.25);
        for (x = -10; x < w + 10; x += Math.max(7, w * 0.035)) {
          var tt = th * (0.6 + rand() * 0.8);
          var tw2 = tt * 0.42;
          ctx.beginPath();
          ctx.moveTo(x, by);
          ctx.lineTo(x + tw2 / 2, by - tt);
          ctx.lineTo(x + tw2, by);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    if (def.lodge) {
      var lx = w * 0.34, ly = h * 0.845, lw = w * 0.3, lh = h * 0.14;
      ctx.fillStyle = mix(p.near, '#000000', 0.45);
      ctx.fillRect(lx, ly - lh, lw, lh);
      ctx.beginPath();
      ctx.moveTo(lx - lw * 0.09, ly - lh);
      ctx.lineTo(lx + lw / 2, ly - lh * 1.72);
      ctx.lineTo(lx + lw * 1.09, ly - lh);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(lx + lw * 0.7, ly - lh * 2.0, lw * 0.09, lh * 0.5);
      ctx.fillStyle = p.sun ? p.sun[2] : '#F6C775';
      ctx.globalAlpha = 0.95;
      var ww = lw * 0.13, wh = lh * 0.3;
      ctx.fillRect(lx + lw * 0.14, ly - lh * 0.72, ww, wh);
      ctx.fillRect(lx + lw * 0.42, ly - lh * 0.72, ww, wh);
      ctx.fillRect(lx + lw * 0.7, ly - lh * 0.72, ww, wh);
      ctx.globalAlpha = 0.3;
      ctx.fillRect(lx + lw * 0.1, ly - lh * 0.78, lw * 0.8, wh * 1.4);
      ctx.globalAlpha = 1;
    }

    if (def.mist) {
      var mg2 = ctx.createLinearGradient(0, h * 0.35, 0, h * 0.75);
      mg2.addColorStop(0, 'rgba(255,255,255,0)');
      mg2.addColorStop(0.5, 'rgba(255,255,255,.2)');
      mg2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = mg2;
      ctx.fillRect(0, h * 0.35, w, h * 0.4);
    }
  }

  function interior(ctx, w, h, p, def, rand) {
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, p.wall[0]);
    g.addColorStop(1, p.wall[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (def.interior === 'window') {
      var wx = w * 0.42, wy = h * 0.16, ww = w * 0.44, wh = h * 0.46;
      var lg = ctx.createLinearGradient(wx, wy, wx, wy + wh);
      lg.addColorStop(0, p.warm);
      lg.addColorStop(1, mix(p.warm, '#FFFFFF', 0.5));
      ctx.fillStyle = lg;
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = mix(p.floor, '#000000', 0.3);
      ctx.lineWidth = Math.max(2, w * 0.012);
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.beginPath();
      ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh);
      ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2);
      ctx.stroke();

      /* light falling across the floor */
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = p.warm;
      ctx.beginPath();
      ctx.moveTo(wx, h);
      ctx.lineTo(wx - w * 0.2, h);
      ctx.lineTo(wx + ww * 0.4, h * 0.62);
      ctx.lineTo(wx + ww, h * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = p.floor;
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      for (var i = 0; i < 7; i++) {
        var y = h * 0.72 + (h * 0.28) * (i / 7);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      /* a bed or bench silhouette */
      ctx.fillStyle = mix(p.floor, '#000000', 0.45);
      ctx.fillRect(w * 0.06, h * 0.6, w * 0.3, h * 0.16);
      ctx.fillRect(w * 0.06, h * 0.5, w * 0.05, h * 0.12);
    } else {
      /* a table under pendant lamps */
      ctx.fillStyle = mix(p.wall[1], '#000000', 0.4);
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
      for (var k = 0; k < 3; k++) {
        var lx = w * (0.24 + k * 0.26);
        var ly = h * (0.3 + (k % 2) * 0.06);
        ctx.strokeStyle = mix(p.wall[0], '#000000', 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, ly); ctx.stroke();
        var rg = ctx.createRadialGradient(lx, ly, 0, lx, ly, w * 0.24);
        rg.addColorStop(0, p.warm);
        rg.addColorStop(0.25, mix(p.warm, p.wall[1], 0.55));
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = p.warm;
        ctx.beginPath();
        ctx.moveTo(lx - w * 0.035, ly);
        ctx.lineTo(lx + w * 0.035, ly);
        ctx.lineTo(lx + w * 0.02, ly - h * 0.05);
        ctx.lineTo(lx - w * 0.02, ly - h * 0.05);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = p.floor;
      ctx.fillRect(0, h * 0.68, w, h * 0.06);
      ctx.globalAlpha = 0.85;
      for (var d = 0; d < 3; d++) {
        ctx.fillStyle = mix('#FFFFFF', p.warm, 0.35);
        ctx.beginPath();
        ctx.ellipse(w * (0.26 + d * 0.24), h * 0.71, w * 0.05, h * 0.014, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function grain(ctx, w, h, rand) {
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#000000';
    var n = Math.round((w * h) / 900);
    for (var i = 0; i < n; i++) {
      ctx.fillRect(rand() * w, rand() * h, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  /* --------------------------------------------------------------- photos */
  /* Any .art-wrap carrying data-photo gets a real photograph from the table in
     credits.js, plus a visible credit — these are Wikimedia Commons pictures
     and the licences ask for attribution. Wrappers without data-photo keep the
     drawn artwork. */

  function photoCredit(p) {
    var el = document.createElement('p');
    el.className = 'credit';
    el.textContent = p.caption + ' — ' + p.author + ', ' + p.licence;
    return el;
  }

  function hydratePhotos(root) {
    var table = window.PHOTOS || {};
    var wraps = (root || document).querySelectorAll('.art-wrap[data-photo]');
    Array.prototype.forEach.call(wraps, function (wrap) {
      if (wrap.hasAttribute('data-hydrated')) { return; }
      var p = table[wrap.getAttribute('data-photo')];
      if (!p) { return; }
      wrap.setAttribute('data-hydrated', '');

      var img = document.createElement('img');
      img.src = p.src;
      img.alt = p.caption;
      img.loading = 'lazy';
      img.decoding = 'async';
      wrap.appendChild(img);

      if (wrap.getAttribute('data-credit') === 'off') { return; }
      var hero = wrap.closest ? wrap.closest('.hero') : null;
      if (hero) {
        var c = photoCredit(p);
        c.className = 'credit credit--hero';
        hero.appendChild(c);
      } else if (wrap.parentNode) {
        wrap.parentNode.insertBefore(photoCredit(p), wrap.nextSibling);
      }
    });
  }

  var io = null;
  function watchArt(root) {
    var cvs = (root || document).querySelectorAll('canvas[data-scene]');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(cvs, paint);
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !e.target.hasAttribute('data-drawn')) {
            if (paint(e.target)) { io.unobserve(e.target); }
          }
        });
      }, { rootMargin: '250px 0px' });
    }
    Array.prototype.forEach.call(cvs, function (cv) {
      if (!cv.hasAttribute('data-drawn')) { io.observe(cv); }
    });
  }

  function repaintAll() {
    Array.prototype.forEach.call(document.querySelectorAll('canvas[data-drawn]'), function (cv) {
      if (cv.parentNode.clientWidth) { paint(cv); }
    });
  }

  /* ----------------------------------------------------------------- chrome */

  function currentMain() {
    return document.querySelector('main.page:not([hidden])');
  }

  function buildChrome(main) {
    var shell = main.parentNode;
    var old = shell.querySelector('.topbar');
    if (old) { old.remove(); }

    if (main.dataset.chrome !== 'hero') {
      var bar = document.createElement('header');
      bar.className = 'topbar';
      var back = main.dataset.back || 'index.html';
      var backLabel = main.dataset.backlabel || 'Back';
      bar.innerHTML =
        '<a class="back" href="' + back + '">' + svg('back', 2.2) + backLabel + '</a>' +
        '<h1 class="title">' + (main.dataset.title || '') + '</h1>';
      shell.insertBefore(bar, main);
    }

    var tabbar = document.querySelector('.tabbar');
    if (!tabbar) {
      tabbar = document.createElement('nav');
      tabbar.className = 'tabbar';
      tabbar.setAttribute('aria-label', 'Sections');
      document.body.appendChild(tabbar);
    }
    var active = main.dataset.tab || main.dataset.page;
    tabbar.innerHTML = TABS.map(function (t) {
      return '<a href="' + t.href + '"' + (t.page === active ? ' aria-current="page"' : '') + '>' +
        svg(t.icon) + t.label + '</a>';
    }).join('');
  }

  /* -------------------------------------------------------------- lightbox */

  function ensureLightbox() {
    var box = document.getElementById('lightbox');
    if (box) { return box; }
    box = document.createElement('dialog');
    box.className = 'lightbox';
    box.id = 'lightbox';
    box.innerHTML =
      '<div class="inner">' +
      '<figure class="art-wrap"><canvas data-scene="valley" data-seed="1"></canvas><img alt="" hidden></figure>' +
      '<p id="lbcap"></p>' +
      '<button class="close" type="button">Close</button>' +
      '</div>';
    document.body.appendChild(box);
    box.querySelector('.close').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) { box.close(); } });
    return box;
  }

  document.addEventListener('click', function (e) {
    var shot = e.target.closest ? e.target.closest('.shot') : null;
    if (!shot) { return; }
    var box = ensureLightbox();
    var cv = box.querySelector('canvas');
    var im = box.querySelector('img');
    var wrap = shot.querySelector('.art-wrap');
    var slug = wrap && wrap.getAttribute('data-photo');
    var p = slug && (window.PHOTOS || {})[slug];
    var cap = shot.dataset.cap || '';

    if (p) {
      cv.hidden = true;
      im.hidden = false;
      im.src = p.src;
      im.alt = p.caption;
      cap = cap + ' — ' + p.author + ', ' + p.licence;
    } else {
      im.hidden = true;
      cv.hidden = false;
      var src = shot.querySelector('canvas');
      cv.dataset.scene = src ? src.dataset.scene : 'valley';
      cv.dataset.seed = src ? src.dataset.seed : '1';
      cv.removeAttribute('data-drawn');
    }
    box.querySelector('#lbcap').textContent = cap;
    if (typeof box.showModal === 'function') { box.showModal(); }
    if (!p) { requestAnimationFrame(function () { paint(cv); }); }
  });

  /* ----------------------------------------------------------------- router */
  /* With separate files this does nothing. In the single-file bundle every
     page lives in the same document, so links are intercepted instead. */

  var pages = null;

  function show(slug, push) {
    var main = document.querySelector('main.page[data-page="' + slug + '"]');
    if (!main) { return false; }
    pages.forEach(function (p) { p.hidden = p !== main; });
    buildChrome(main);
    hydratePhotos(main);
    watchArt(main);
    window.scrollTo(0, 0);
    if (push) {
      try { history.pushState({ p: slug }, '', '#' + slug); } catch (err) { location.hash = slug; }
    }
    document.title = (main.dataset.title || 'Triglav Park House') + ' — Triglav Park House';
    return true;
  }

  function initRouter() {
    pages = Array.prototype.slice.call(document.querySelectorAll('main.page'));
    if (pages.length < 2) { return false; }
    var shell = pages[0].parentNode;
    if (shell) { shell.setAttribute('data-ready', ''); }

    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) { return; }
      var href = a.getAttribute('href');
      if (!href || !/\.html$/.test(href)) { return; }
      var slug = href.replace(/\.html$/, '');
      if (document.querySelector('main.page[data-page="' + slug + '"]')) {
        e.preventDefault();
        show(slug, true);
      }
    });

    window.addEventListener('popstate', function () {
      show((location.hash || '#index').slice(1) || 'index', false);
    });

    var start = (location.hash || '').slice(1);
    if (!start || !show(start, false)) { show('index', false); }
    return true;
  }

  /* ------------------------------------------------------------------- boot */

  function init() {
    var main = document.querySelector('main.page');
    if (!main) { return; }

    if (!initRouter()) {
      buildChrome(main);
      hydratePhotos(document);
      watchArt(document);
    }

    var notice = document.querySelector('.notice button');
    if (notice) {
      notice.addEventListener('click', function () { notice.closest('.notice').remove(); });
    }

    window.addEventListener('scroll', function () {
      var bar = document.querySelector('.topbar');
      if (bar) {
        if (window.scrollY > 4) { bar.setAttribute('data-scrolled', ''); }
        else { bar.removeAttribute('data-scrolled'); }
      }
    }, { passive: true });

    var lastW = window.innerWidth, t;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) { return; }
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(repaintAll, 180);
    });

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) { mq.addEventListener('change', repaintAll); }
    }
    new MutationObserver(repaintAll).observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
