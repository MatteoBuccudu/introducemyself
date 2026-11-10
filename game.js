(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- HERO DATA ---------- */
  const OPTS = {
    skin: ['#ffccaa', '#eaa97a', '#c68642', '#8d5524', '#5c3a1e'],
    hairC: ['#1a1c2c', '#5f3a1e', '#ab5236', '#ffcd75', '#ff77a8', '#29adff', '#c2c3c7'],
    shirt: ['#ff004d', '#29adff', '#00e436', '#ffa300', '#7e2553', '#1d2b53', '#fff1e8', '#83769c'],
    pants: ['#1d2b53', '#5f574f', '#1a1c2c', '#008751', '#ab5236'],
  };
  const HAIRS = ['short', 'spiky', 'long', 'cap', 'none'];
  const ACCS = ['camera', 'glasses', 'headphones', 'none'];
  const LIMITS = { ...Object.fromEntries(Object.entries(OPTS).map(([k, v]) => [k, v.length])), hair: HAIRS.length, acc: ACCS.length };
  const hero = { skin: 0, hairC: 1, shirt: 1, pants: 0, hair: 0, acc: 0, name: 'PLAYER 1' };

  try { // localStorage is untrusted: keep only valid indexes and a clean name
    const s = JSON.parse(localStorage.getItem('mb-hero')) || {};
    for (const k in LIMITS) if (Number.isInteger(s[k]) && s[k] >= 0 && s[k] < LIMITS[k]) hero[k] = s[k];
    if (typeof s.name === 'string') hero.name = cleanName(s.name);
  } catch { /* private mode / bad JSON: defaults */ }
  function cleanName(n) { return n.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 10).trim() || 'PLAYER 1'; }
  const save = () => { try { localStorage.setItem('mb-hero', JSON.stringify(hero)); } catch { } };

  /* ---------- SPRITE (12x17) ---------- */
  const BASE = [
    '............', '............',
    '...oooooo...', '..osssssso..', '..osssssso..', '..osesseso..', '..osssssso..', '..ossmmsso..', '...oooooo...',
    '..otttttto..', '.otttttttto.', '.otttttttto.', '.sottttttos.', '..oppppppo..',
  ];
  const LEGS = [
    ['..oppooppo..', '..oppooppo..', '..obboobbo..'],
    ['..oppooppo..', '.oppo..oppo.', '.obbo..obbo.'],
  ];
  const HAIR = {
    short: { 2: '...hhhhhh...', 3: '..hhhhhhhh..', 4: '..h......h..' },
    spiky: { 0: '...h...h....', 1: '..hhh.hhh.h.', 2: '..hhhhhhhhh.', 3: '..hhhhhhhh..', 4: '..h......h..' },
    long: { 2: '...hhhhhh...', 3: '..hhhhhhhh..', 4: '.hhh....hhh.', 5: '.hh......hh.', 6: '.hh......hh.', 7: '.hh......hh.', 8: '.hhh....hhh.', 9: '.hh......hh.' },
    cap: { 1: '...hhhhhh...', 2: '..hhhhhhhh..', 3: '..hhhhhhhhkk', 4: '..h......h..' },
    none: {},
  };
  const ACC = {
    camera: { 9: '...k....k...', 10: '....kkkk....', 11: '....kwwk....' },
    glasses: { 5: '...g.gg.g...' },
    headphones: { 1: '...kkkkkk...', 2: '..k......k..', 3: '.k........k.', 4: '.k........k.', 5: '.kk......kk.', 6: '.kk......kk.' },
    none: {},
  };
  // self-check: every sprite row must be 12 px wide
  [...BASE, ...LEGS.flat(), ...[HAIR, ACC].flatMap(o => Object.values(o).flatMap(Object.values))]
    .forEach(r => console.assert(r.length === 12, 'bad sprite row', r));

  function colour(ch) {
    return { o: '#1a1c2c', e: '#1a1c2c', m: '#7e2553', b: '#5f574f', k: '#333c57', w: '#29adff', g: '#fff1e8',
      s: OPTS.skin[hero.skin], t: OPTS.shirt[hero.shirt], p: OPTS.pants[hero.pants], h: OPTS.hairC[hero.hairC] }[ch];
  }
  let sprites = [];
  function rebuild() {
    sprites = LEGS.map(legs => {
      const g = [...BASE, ...legs].map(r => [...r]);
      for (const o of [HAIR[HAIRS[hero.hair]], ACC[ACCS[hero.acc]]])
        for (const [y, r] of Object.entries(o)) [...r].forEach((ch, x) => { if (ch !== '.') g[y][x] = ch; });
      const c = document.createElement('canvas'); c.width = 12; c.height = 17;
      const x = c.getContext('2d');
      g.forEach((row, y) => row.forEach((ch, X) => { const col = colour(ch); if (col) { x.fillStyle = col; x.fillRect(X, y, 1, 1); } }));
      return c;
    });
  }

  /* ---------- CREATOR UI ---------- */
  const nameIn = $('#name');
  document.querySelectorAll('.swatches').forEach(box => {
    const k = box.dataset.opt;
    OPTS[k].forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sw'; b.style.background = c;
      b.setAttribute('aria-label', `${box.closest('.opt').firstElementChild.textContent.toLowerCase()} ${i + 1}`);
      b.onclick = () => { hero[k] = i; update(); };
      box.append(b);
    });
  });
  document.querySelectorAll('.stepper').forEach(st => {
    const k = st.dataset.step, n = LIMITS[k], [prev, , next] = st.children;
    prev.onclick = () => { hero[k] = (hero[k] + n - 1) % n; update(); };
    next.onclick = () => { hero[k] = (hero[k] + 1) % n; update(); };
  });
  nameIn.value = hero.name;
  nameIn.oninput = () => { hero.name = cleanName(nameIn.value); update(); };
  $('#random').onclick = () => { for (const k in LIMITS) hero[k] = Math.floor(Math.random() * LIMITS[k]); update(); };

  function update() {
    save(); rebuild();
    document.querySelectorAll('.swatches').forEach(box =>
      [...box.children].forEach((b, i) => b.setAttribute('aria-pressed', i === hero[box.dataset.opt])));
    document.querySelectorAll('.stepper').forEach(st =>
      st.querySelector('output').textContent = (st.dataset.step === 'hair' ? HAIRS : ACCS)[hero[st.dataset.step]].toUpperCase());
    document.querySelectorAll('.hero-name').forEach(e => e.textContent = hero.name);
    drawViews();
  }
  let viewFrame = 0;
  function drawViews() {
    document.querySelectorAll('.sprite-view').forEach(c => {
      const x = c.getContext('2d'); x.clearRect(0, 0, 12, 17); x.drawImage(sprites[viewFrame], 0, 0);
    });
  }
  if (!reduced) setInterval(() => { viewFrame ^= 1; drawViews(); }, 320);

  /* ---------- FUN FACTS ---------- */
  const FACTS = [
    ['About me', 'My bug: I never leave home without my camera.'],
    ['About me', 'My best stat is curiosity: 95%.'],
    ['About me', 'My skills: coding, photography and computers.'],
    ['Tech trivia', 'The first computer bug was a real moth. It was in 1947.'],
    ['Tech trivia', 'The first photo took many hours.'],
    ['Tech trivia', 'The first website was from 1991. It was only text!'],
  ];
  let fi = 0;
  $('#nextFact').onclick = () => { fi = (fi + 1) % FACTS.length; $('#ftag').textContent = FACTS[fi][0]; $('#fact').textContent = FACTS[fi][1]; };

  /* ---------- LEVEL ---------- */
  const cv = $('#game'), g = cv.getContext('2d');
  const W = 320, H = 180, LW = 3200, GY = 148, PH = 17;
  g.imageSmoothingEnabled = false;

  let seed = 7; // deterministic RNG so the world looks the same every visit
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; };
  const tri = t => 1 - 4 * Math.abs((((t % 1) + 1) % 1) - .5); // tileable triangle wave

  const GROUNDS = [[0, 700], [750, 1300], [1360, 1950], [2010, LW]].map(([a, b]) => ({ x: a, y: GY, w: b - a }));
  const PLATS = [[300, 118, 48], [380, 94, 48], [900, 112, 64], [1100, 112, 48], [1220, 120, 40], [1600, 110, 64],
    [1700, 86, 48], [2200, 116, 48], [2300, 92, 48], [2400, 70, 48], [2700, 112, 64]].map(([x, y, w]) => ({ x, y, w }));
  const SOLIDS = [...GROUNDS, ...PLATS];
  const onGround = x => GROUNDS.some(s => x > s.x + 8 && x < s.x + s.w - 8);
  const SIGNS = [
    [120, 'WELCOME', () => `Hi ${hero.name}! This is Matteo's world. Walk right and read the signs.`],
    [520, 'ABOUT ME', () => 'Computers are my favourite game. I like to know how things work. Then I make my own things.'],
    [1000, 'PHOTOGRAPHY', () => 'I love light. I take good photos. I look, I wait, I click.'],
    [1500, 'CODING', () => 'I write code. I solve problems. Web, logic, and lots of curiosity.'],
    [2120, 'PERSONAL BUG', () => "$ run matteo.exe — Error: I can't leave home without my camera."],
    [2560, 'PLAYER STATS', () => 'Curiosity 95% · Sleep resistance 90% · Problem solving 85%.'],
  ].map(([x, title, text]) => ({ x, title, text }));
  const FLAG = 3110;

  // backgrounds: sky + 4 parallax layers, rendered once
  const sky = mk(W, H, x => {
    const bands = ['#1d2b53', '#2b2d6e', '#5a2a6e', '#7e2553', '#b8325a', '#ff5a4e', '#ff8a3d', '#ffa300', '#ffcd75'];
    const bh = 14;
    bands.forEach((c, i) => { x.fillStyle = c; x.fillRect(0, i * bh, W, i === bands.length - 1 ? H : bh); });
    for (let i = 1; i < bands.length; i++) { // checker dither between bands
      x.fillStyle = bands[i];
      for (let y = i * bh - 4; y < i * bh; y++) for (let X = (y % 2) + (y < i * bh - 2 ? 2 : 0); X < W; X += (y < i * bh - 2 ? 4 : 2)) x.fillRect(X, y, 1, 1);
    }
    x.fillStyle = '#fff1e8';
    for (let i = 0; i < 40; i++) x.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * 44), 1, 1);
    const cx = 232, cy = 106, r = 26; // striped retro sun
    for (let dy = -r; dy <= r; dy++) {
      if (dy > 4 && dy % 6 < Math.min(4, (dy - 4) / 4 + 1)) continue;
      const hw = Math.round(Math.sqrt(r * r - dy * dy));
      x.fillStyle = Math.abs(dy) < r - 3 && hw > 4 ? '#ffec27' : '#ffa300';
      x.fillRect(cx - hw, cy + dy, hw * 2, 1);
    }
  });
  const ridge = (col, rim, base, waves, snow) => mk(640, H, x => {
    for (let X = 0; X < 640; X++) {
      let h = base; for (const [a, k, p] of waves) h -= a * tri(k * X / 640 + p);
      h = Math.round(h / 2) * 2;
      x.fillStyle = col; x.fillRect(X, h, 1, H - h);
      x.fillStyle = rim; x.fillRect(X, h, 1, 1);
      if (snow && h < snow) { x.fillStyle = '#ffb3a0'; x.fillRect(X, h, 1, Math.min(5, snow - h)); }
    }
  });
  const mountains = ridge('#8b3a6b', '#c25a7a', 100, [[22, 3, 0], [10, 7, .3], [4, 17, .1]], 92);
  const hills = ridge('#5a2257', '#7e2553', 128, [[10, 2, .2], [6, 5, .7], [2, 13, 0]]);
  const city = mk(640, H, x => {
    const blds = []; for (let X = 0; X < 640;) { const w = 14 + Math.floor(rnd() * 24); blds.push([X, w, 30 + Math.floor(rnd() * 50)]); X += w + Math.floor(rnd() * 6); }
    for (const [bx, w, h] of blds) for (const ox of [0, -640, 640]) {
      const X = bx + ox, top = 150 - h;
      x.fillStyle = '#3a1a46'; x.fillRect(X, top, w, h);
      if (h > 60) x.fillRect(X + w / 2, top - 8, 1, 8);
      for (let wy = top + 4; wy < 146; wy += 5) for (let wx = X + 3; wx < X + w - 3; wx += 4) {
        if (((wx * 7 + wy * 13) % 10) < 3) { x.fillStyle = (wx + wy) % 3 ? '#ffcd75' : '#ffa300'; x.fillRect(wx, wy, 2, 2); }
      }
    }
  });
  const trees = mk(640, H, x => {
    x.fillStyle = '#1f1030'; x.fillRect(0, 150, 640, 30);
    for (let i = 0; i < 46; i++) {
      const tx = Math.floor(rnd() * 640), th = 18 + Math.floor(rnd() * 26);
      for (const ox of [0, -640, 640]) for (let y = 0; y < th; y++) {
        const hw = Math.floor((y % 8 + y / 3) / 2) + 1;
        x.fillRect(tx + ox - hw, 152 - th + y, hw * 2 + 1, 1);
      }
    }
  });
  const groundTile = mk(16, 32, x => {
    x.fillStyle = '#ab5236'; x.fillRect(0, 0, 16, 32);
    x.fillStyle = '#7a3a22'; [[3, 9], [11, 14], [6, 20], [13, 25], [2, 28]].forEach(([a, b]) => x.fillRect(a, b, 2, 2));
    x.fillStyle = '#5f3a1e'; [[8, 11], [1, 18], [10, 29]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
    x.fillStyle = '#008751'; x.fillRect(0, 3, 16, 3); x.fillRect(2, 6, 2, 1); x.fillRect(9, 6, 3, 1);
    x.fillStyle = '#00e436'; x.fillRect(0, 1, 16, 3); x.fillRect(3, 0, 1, 1); x.fillRect(7, 0, 1, 1); x.fillRect(12, 0, 1, 1);
  });
  const groundPat = g.createPattern(groundTile, 'repeat');
  const clouds = Array.from({ length: 6 }, () => ({ x: rnd() * 700, y: 10 + rnd() * 50, w: 16 + Math.floor(rnd() * 24), v: .05 + rnd() * .08 }));
  const deco = [];
  for (let X = 60; X < LW - 60; X += 26 + Math.floor(rnd() * 50)) if (onGround(X)) deco.push({ x: X, t: rnd() < .35 ? 'bush' : 'flower', c: rnd() < .5 ? '#ff77a8' : '#fff1e8' });
  for (let X = 240; X < LW - 100; X += 280) if (onGround(X)) deco.push({ x: X, t: 'lamp' });

  // state
  const keys = { left: false, right: false, jump: false };
  let P, coins, read, cur, won, camX, tick = 0, coyote = 0, jumpBuf = 0, sparks = [];
  function reset() {
    P = { x: 40, y: GY - PH, vx: 0, vy: 0, on: true, face: 1, check: 40 };
    coins = [];
    for (const p of PLATS) for (const d of [-10, 0, 10]) coins.push({ x: p.x + p.w / 2 + d - 3, y: p.y - 14 });
    for (const X of [200, 216, 232, 600, 616, 632, 820, 836, 1420, 1436, 1452, 1820, 1836, 2060, 2076, 2900, 2916, 2932, 2948])
      coins.push({ x: X, y: GY - 12 });
    coins.push({ x: 1720, y: 60, t: 'cam' }, { x: 2420, y: 44, t: 'key' });
    read = new Set(); cur = -1; won = false; camX = 0; sparks = [];
    dialog(null);
  }

  // dialog box with typewriter
  const dlg = $('#dlg'), dlgH = dlg.querySelector('h3'), dlgP = dlg.querySelector('p');
  let typeT;
  function dialog(title, text) {
    clearInterval(typeT);
    if (!title) { dlg.hidden = true; return; }
    dlg.hidden = false; dlgH.textContent = title;
    if (reduced) { dlgP.textContent = text; return; }
    let i = 0; dlgP.textContent = '';
    typeT = setInterval(() => { dlgP.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typeT); }, 22);
  }

  function step() {
    const acc = P.on ? .3 : .2;
    if (keys.left && !keys.right) { P.vx = Math.max(P.vx - acc, -2); P.face = -1; }
    else if (keys.right && !keys.left) { P.vx = Math.min(P.vx + acc, 2); P.face = 1; }
    else P.vx *= P.on ? .72 : .95;
    if (Math.abs(P.vx) < .05) P.vx = 0;
    if (jumpBuf > 0 && coyote > 0) { P.vy = -4.6; coyote = jumpBuf = 0; P.on = false; }
    if (!keys.jump && P.vy < -1.5) P.vy = -1.5; // short hop on release
    P.vy = Math.min(P.vy + .25, 6);
    P.x = Math.max(0, Math.min(LW - 12, P.x + P.vx));
    const prevB = P.y + PH; P.y += P.vy; P.on = false;
    if (P.vy >= 0) for (const s of SOLIDS) { // one-way platforms: land only from above
      if (P.x + 9 > s.x && P.x + 3 < s.x + s.w && prevB <= s.y + .01 && P.y + PH >= s.y) { P.y = s.y - PH; P.vy = 0; P.on = true; break; }
    }
    coyote = P.on ? 6 : coyote - 1; jumpBuf--;
    if (P.y > H + 40) Object.assign(P, { x: P.check, y: GY - 40, vx: 0, vy: 0 });

    for (const c of coins) if (!c.got && Math.abs(P.x + 6 - (c.x + 3)) < 8 && Math.abs(P.y + 8 - (c.y + 3)) < 11) {
      c.got = true;
      for (let i = 0; i < 6; i++) sparks.push({ x: c.x + 3, y: c.y + 3, vx: Math.cos(i) * 1.2, vy: Math.sin(i) * 1.2 - 1, life: 20 });
      if (c.t) dialog(c.t === 'cam' ? 'ITEM GET: CAMERA' : 'ITEM GET: KEYBOARD', c.t === 'cam' ? 'Photography +10! I never go anywhere without it.' : 'Coding +10! Keyboard Warrior unlocked.');
    }
    sparks = sparks.filter(s => (s.x += s.vx, s.y += s.vy, s.vy += .1, --s.life > 0));

    if (!won) {
      const i = SIGNS.findIndex(s => Math.abs(P.x + 6 - s.x) < 22);
      if (i !== cur) { cur = i; if (i >= 0) { read.add(i); P.check = SIGNS[i].x; dialog(SIGNS[i].title, SIGNS[i].text()); } else if (!dlgH.textContent.startsWith('ITEM')) dialog(null); }
      if (P.x + 6 > FLAG) {
        won = true;
        document.dispatchEvent(new CustomEvent('achieve', { detail: 'level' }));
        const got = coins.filter(c => c.got).length;
        dialog('★ LEVEL CLEAR ★', `Thank you for playing, ${hero.name}! Bits: ${got}/${coins.length} · Signs: ${read.size}/${SIGNS.length}. Every big idea starts with curiosity.`);
      }
    }
    camX = Math.max(0, Math.min(LW - W, P.x + 6 - W * .4));
  }

  function layer(img, f) {
    const off = -Math.round((camX * f) % img.width);
    g.drawImage(img, off, 0); g.drawImage(img, off + img.width, 0);
  }
  function draw() {
    g.drawImage(sky, 0, 0);
    g.fillStyle = '#ffccaa';
    for (const c of clouds) {
      const X = Math.round(((c.x - camX * .1 + tick * c.v) % 700 + 700) % 700) - 60;
      g.fillRect(X, c.y, c.w, 3); g.fillRect(X + 3, c.y - 2, c.w - 8, 2); g.fillStyle = '#ff9a8a'; g.fillRect(X + 2, c.y + 3, c.w - 4, 1); g.fillStyle = '#ffccaa';
    }
    layer(mountains, .12); layer(hills, .25);
    g.fillStyle = '#1a1c2c'; // birds
    for (let i = 0; i < 3; i++) { const bx = ((tick * .4 + i * 90) % 420) - 40, by = 40 + i * 9 + Math.round(Math.sin(tick / 20 + i) * 2), up = (tick >> 3) % 2; g.fillRect(bx, by, 1, 1); g.fillRect(bx - 1, by - up, 1, 1); g.fillRect(bx + 1, by - up, 1, 1); }
    layer(city, .45); layer(trees, .7);

    g.save(); g.translate(-Math.round(camX), 0);
    for (const d of deco) {
      if (d.x < camX - 40 || d.x > camX + W + 40) continue;
      if (d.t === 'lamp') {
        g.fillStyle = 'rgba(255,236,39,.12)'; g.fillRect(d.x - 10, GY - 34, 22, 34);
        g.fillStyle = '#1a1c2c'; g.fillRect(d.x, GY - 28, 2, 28); g.fillRect(d.x - 2, GY - 30, 6, 2);
        g.fillStyle = '#ffec27'; g.fillRect(d.x - 1, GY - 28, 4, 2);
      } else if (d.t === 'bush') {
        g.fillStyle = '#008751'; g.fillRect(d.x, GY - 6, 14, 6); g.fillRect(d.x + 3, GY - 9, 8, 3);
        g.fillStyle = '#00e436'; g.fillRect(d.x + 4, GY - 8, 3, 1); g.fillRect(d.x + 2, GY - 5, 2, 1);
      } else {
        g.fillStyle = '#008751'; g.fillRect(d.x, GY - 4, 1, 4);
        g.fillStyle = d.c; g.fillRect(d.x - 1, GY - 5, 3, 1); g.fillRect(d.x, GY - 6, 1, 3);
      }
    }
    g.save(); g.translate(0, GY); // align the 32px tile so grass sits on top
    for (const s of GROUNDS) {
      g.fillStyle = groundPat; g.fillRect(s.x, 0, s.w, H - GY);
      g.fillStyle = '#5f3a1e'; g.fillRect(s.x, 4, 1, H); g.fillRect(s.x + s.w - 1, 4, 1, H);
    }
    g.restore();
    for (const p of PLATS) {
      g.fillStyle = '#83769c'; g.fillRect(p.x, p.y, p.w, 8);
      g.fillStyle = '#c2c3c7'; g.fillRect(p.x, p.y, p.w, 2);
      g.fillStyle = '#5f574f'; g.fillRect(p.x, p.y + 7, p.w, 1);
      for (let X = p.x + 8; X < p.x + p.w; X += 8) g.fillRect(X, p.y + 2, 1, 5);
    }
    SIGNS.forEach((s, i) => {
      g.fillStyle = '#5f3a1e'; g.fillRect(s.x - 1, GY - 14, 2, 14); g.fillRect(s.x - 9, GY - 25, 18, 12);
      g.fillStyle = '#ab5236'; g.fillRect(s.x - 8, GY - 24, 16, 10);
      g.fillStyle = '#5f3a1e'; g.fillRect(s.x - 6, GY - 22, 12, 1); g.fillRect(s.x - 6, GY - 19, 9, 1); g.fillRect(s.x - 6, GY - 16, 11, 1);
      if (!read.has(i)) { g.fillStyle = '#ffec27'; const by = GY - 36 + ((tick >> 4) % 2); g.fillRect(s.x - 1, by, 2, 6); g.fillRect(s.x - 1, by + 8, 2, 2); }
    });
    g.fillStyle = '#c2c3c7'; g.fillRect(FLAG, GY - 64, 2, 64);
    g.fillStyle = '#ffec27'; g.fillRect(FLAG - 1, GY - 67, 4, 3);
    for (let y = 0; y < 14; y++) { const w = 20 - Math.abs(y - 7) * 2 + Math.round(Math.sin(tick / 8 + y / 3)); g.fillStyle = y % 4 < 2 ? '#ff004d' : '#fff1e8'; g.fillRect(FLAG + 2, GY - 62 + y, Math.max(1, w), 1); }

    coins.forEach((c, i) => {
      if (c.got) return;
      const by = c.y + ((tick >> 4) + i) % 2;
      if (c.t === 'cam') { g.fillStyle = '#1a1c2c'; g.fillRect(c.x - 2, by, 11, 8); g.fillRect(c.x, by - 2, 4, 2); g.fillStyle = '#29adff'; g.fillRect(c.x + 2, by + 2, 4, 4); g.fillStyle = '#fff1e8'; g.fillRect(c.x + 2, by + 2, 1, 1); return; }
      if (c.t === 'key') { g.fillStyle = '#1a1c2c'; g.fillRect(c.x - 3, by, 13, 7); g.fillStyle = '#c2c3c7'; for (let k = 0; k < 4; k++) { g.fillRect(c.x - 2 + k * 3, by + 1, 2, 2); g.fillRect(c.x - 1 + k * 3, by + 4, 2, 2); } return; }
      const w = [6, 4, 2, 4][((tick >> 3) + i) % 4];
      g.fillStyle = '#ffa300'; g.fillRect(c.x + (6 - w) / 2, by, w, 6);
      g.fillStyle = '#ffec27'; g.fillRect(c.x + (6 - w) / 2, by + 1, Math.max(1, w - 1), 4);
    });
    g.fillStyle = '#ffec27';
    for (const s of sparks) g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);

    const fr = !P.on ? 1 : (P.vx !== 0 ? (tick >> 3) % 2 : 0);
    g.fillStyle = 'rgba(0,0,0,.3)'; if (P.on) g.fillRect(Math.round(P.x) + 2, Math.round(P.y) + PH, 8, 1);
    g.save(); g.translate(Math.round(P.x) + (P.face < 0 ? 12 : 0), Math.round(P.y)); g.scale(P.face, 1);
    g.drawImage(sprites[fr], 0, 0); g.restore();
    g.restore();

    // HUD
    g.font = '8px "Press Start 2P"'; g.textBaseline = 'top';
    const got = coins.filter(c => c.got).length;
    const txt = (t, x, y, c = '#fff1e8') => { g.fillStyle = '#1a1c2c'; g.fillText(t, x + 1, y + 1); g.fillStyle = c; g.fillText(t, x, y); };
    txt(hero.name, 6, 6, '#ffec27');
    txt(`BITS ${String(got).padStart(2, '0')}/${coins.length}`, 6, 18);
    g.textAlign = 'right'; txt(`1-1  ${Math.floor(P.x / (FLAG - 40) * 100) > 99 ? 100 : Math.floor(P.x / (FLAG - 40) * 100)}%`, W - 6, 6); g.textAlign = 'left';
  }

  // loop runs only while the level is on screen
  let running = false, active = false, acc = 0, last = 0;
  function loop(t) {
    if (!running) return;
    acc += Math.min(100, t - (last || t)); last = t;
    while (acc >= 1000 / 60) { step(); tick++; acc -= 1000 / 60; }
    draw(); requestAnimationFrame(loop);
  }
  new IntersectionObserver(([e]) => {
    active = e.intersectionRatio >= .5;
    if (e.isIntersecting && !running) { running = true; last = 0; requestAnimationFrame(loop); }
    if (!e.isIntersecting) { running = false; for (const k in keys) keys[k] = false; }
  }, { threshold: [0, .5] }).observe(cv);

  const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump' };
  addEventListener('keydown', e => {
    if (!active || e.target.closest?.('input, textarea')) return;
    if (e.code === 'KeyR') { reset(); return; }
    const k = KEYMAP[e.code]; if (!k) return;
    e.preventDefault();
    if (k === 'jump' && !keys.jump) jumpBuf = 8;
    keys[k] = true;
  });
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  document.querySelectorAll('.pad [data-key]').forEach(b => {
    const k = b.dataset.key;
    const on = e => { e.preventDefault(); if (k === 'jump' && !keys.jump) jumpBuf = 8; keys[k] = true; b.classList.add('on'); };
    const off = () => { keys[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, off));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  $('#restart').onclick = () => { reset(); cv.focus(); };

  reset(); update();
  document.fonts?.ready.then(() => { if (!running) draw(); });
})();
