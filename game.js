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
  const hero = { skin: 0, hairC: 1, shirt: 1, pants: 0, hair: 0, acc: 0 };



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

  function update() {
    rebuild();
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
    ['About me', 'My skills: cybersecurity, photography and computers.'],
    ['Tech trivia', 'The first computer bug was a real moth. It was in 1947.'],
    ['Tech trivia', 'The first photo took many hours.'],
    ['Tech trivia', 'The first website was from 1991. It was only text!'],
  ];
  let fi = 0;
  $('#nextFact').onclick = () => { fi = (fi + 1) % FACTS.length; $('#ftag').textContent = FACTS[fi][0]; $('#fact').textContent = FACTS[fi][1]; };
  update();
})();
