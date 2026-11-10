(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const pick = a => a[Math.floor(Math.random() * a.length)];

  /* ---------- ACHIEVEMENTS (toasts + trophy counter) ---------- */
  const ACH = {
    about: '🧭 Explorer: you met Matteo',
    story: '📜 Historian: you read all my story',
    bugs: '🐛 Bug Hunter: all bugs squashed',
    photo: '📸 Photographer: 3 photos taken',
    terminal: '⌨️ Hacker: you used the terminal',
    quiz: '👑 Boss slayer: 3/3 in the quiz',
    level: '🏁 Speedrunner: level 1-1 clear',
    end: '🎬 The End: you read until the end',
  };
  const got = new Set();
  function achieve(id) {
    if (got.has(id) || !ACH[id]) return;
    got.add(id);
    $('#trophyCount').textContent = got.size;
    const t = document.createElement('p');
    t.className = 'toast px';
    t.textContent = `ACHIEVEMENT! ${ACH[id]}`;
    $('#toasts').append(t);
    setTimeout(() => t.remove(), 4200);
  }
  document.addEventListener('achieve', e => achieve(e.detail));

  // sections: animate stat bars + unlock "seen" achievements
  // rootMargin instead of a ratio threshold so very tall sections still trigger
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('seen');
    if (e.target.dataset.ach) achieve(e.target.dataset.ach);
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('main > section, .bonus-head').forEach(s => io.observe(s));

  /* ---------- START SCREEN + TITLE LETTERS ---------- */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h1 = $('.title h1');
  h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
  let n = 0;
  (function split(node) {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 1) return split(ch);
      if (ch.nodeType !== 3 || !ch.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      [...ch.textContent].forEach(l => {
        const s = document.createElement('span');
        s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
        s.style.setProperty('--i', n++); s.textContent = l;
        frag.append(s);
      });
      ch.replaceWith(frag);
    });
  })(h1);

  const start = $('#start');
  const begin = () => {
    if (start.classList.contains('bye')) return;
    start.classList.add('bye');
    document.body.classList.add('started');
    removeEventListener('keydown', begin);
    setTimeout(() => start.remove(), reduced ? 0 : 700);
  };
  start.addEventListener('click', begin);
  addEventListener('keydown', begin);
  $('#startBtn').focus({ preventScroll: true });

  /* ---------- COINS: every click gives a pixel coin ---------- */
  document.addEventListener('click', e => {
    if (reduced || !e.target.closest('.pbtn, .bug, .stat, summary, .hero-btn, .roadmap label')) return;
    const c = document.createElement('span');
    c.className = 'coin-pop px'; c.textContent = '+1';
    c.style.left = `${e.clientX}px`; c.style.top = `${e.clientY}px`;
    document.body.append(c);
    setTimeout(() => c.remove(), 800);
  });
  function burst(el) {
    if (reduced) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('i');
      const a = i / 10 * Math.PI * 2;
      p.className = 'bit';
      p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;--dx:${Math.cos(a) * 90}px;--dy:${Math.sin(a) * 70}px;background:${['#ffec27', '#00e436', '#ff004d', '#29adff'][i % 4]}`;
      document.body.append(p);
      setTimeout(() => p.remove(), 600);
    }
    const sec = el.closest('section');
    sec.classList.remove('shake'); void sec.offsetWidth; sec.classList.add('shake');
  }

  // XP bar = how far you scrolled
  const xp = $('#xpBar');
  const onScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; xp.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- HERO: click the pixel character ---------- */
  const LINES = ['Hi! I\'m Matteo\'s pixel hero.', 'Scroll down to meet Matteo!', 'I love code and photos.', 'Have you squashed the bugs?', 'Try the terminal: type "joke".', 'Ouch! That tickles.'];
  let li = 0;
  $('#heroBtn').onclick = () => {
    const b = $('#heroBtn');
    b.classList.remove('jump'); void b.offsetWidth; b.classList.add('jump');
    $('#bubble').textContent = LINES[li++ % LINES.length];
  };

  /* ---------- HERO: favourite game question ---------- */
  const FAV = {
    football: '⚽ Cool! My answer is different: the computer.',
    games: '🎮 Nice! For me, the best game is the computer.',
    pc: '💻 Me too! That\'s why this website looks like a video game.',
  };
  $$('[data-fav]').forEach(b => b.onclick = () => { $('#favOut').textContent = FAV[b.dataset.fav]; });

  /* ---------- ABOUT: flip the stat cards ---------- */
  $$('.stat[data-alt]').forEach(s => {
    const span = s.querySelector('span'), orig = span.textContent;
    s.onclick = () => { span.textContent = span.textContent === orig ? s.dataset.alt : orig; s.classList.toggle('flip'); };
  });

  /* ---------- STORY: open all levels ---------- */
  const levels = $$('.timeline details');
  levels.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) d.dataset.read = 1;
    if (levels.every(x => x.dataset.read)) achieve('story');
  }));

  /* ---------- BUGS: squash them ---------- */
  const bugs = $$('.bug');
  $('#bugTotal').textContent = bugs.length;
  bugs.forEach(b => {
    b.setAttribute('aria-pressed', 'false');
    b.onclick = () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on);
      if (on) burst(b);
      const n = bugs.filter(x => x.getAttribute('aria-pressed') === 'true').length;
      $('#squashed').textContent = n;
      if (n === bugs.length) achieve('bugs');
    };
  });

  /* ---------- PHOTO MODE ---------- */
  const TIPS = [
    'Golden hour: one hour before the sunset. The light is soft and warm.',
    'Rule of thirds: put the subject on a line, not in the centre.',
    'Blue hour: just after the sunset, the sky is deep blue.',
    'Wait for the moment. Patience makes the photo.',
    'Take many photos. Keep only the best one.',
    'Look at the light first, then at the subject.',
  ];
  const TIMES = ['t0', 't1', 't2', 't3'];
  let shots = 0, ti = 0;
  const vf = $('#vf');
  $('#shutter').onclick = () => {
    shots++;
    const time = TIMES.find(t => vf.classList.contains(t));
    const p = document.createElement('figure');
    p.className = 'polaroid';
    p.innerHTML = `<div class="viewfinder mini ${time}"><div class="scene"><i class="sun"></i><i class="mtn"></i></div></div><figcaption class="px">#${String(shots).padStart(3, '0')}</figcaption>`;
    $('#roll').prepend(p);
    while ($('#roll').children.length > 4) $('#roll').lastElementChild.remove();
    $('#tip').textContent = `Tip: ${TIPS[ti++ % TIPS.length]}`;
    document.body.classList.remove('flash'); void document.body.offsetWidth; document.body.classList.add('flash');
    vf.classList.remove(time); vf.classList.add(TIMES[(TIMES.indexOf(time) + 1) % TIMES.length]);
    if (shots === 3) achieve('photo');
  };

  /* ---------- TERMINAL ---------- */
  const out = $('#out'), cmdIn = $('#cmdIn');
  const JOKES = [
    'Why do programmers prefer dark mode? Because light attracts bugs!',
    'There are 10 types of people: people who understand binary, and people who don\'t.',
    'Why did the photographer go to prison? Because he was framed!',
    'I told my camera a joke. It didn\'t get the focus.',
    'A programmer goes shopping. "Buy one milk. If they have eggs, buy six." He comes home with six milks.',
  ];
  const CMDS = {
    help: () => 'Commands: about, skills, bugs, photo, joke, coffee, hello, sudo, clear',
    about: () => 'Matteo Buccudu. Loves computers, code and photos.\nMindset: curious, patient, creative.',
    skills: () => 'Coding        [#######...] 75%\nPhotography   [########..] 80%\nCuriosity     [#########.] 95%',
    bugs: () => '8 known bugs. 0 fixed.\nIt\'s not a bug, it\'s a feature.',
    photo: () => `Click! Saved as sunset_${1000 + Math.floor(Math.random() * 9000)}.jpg`,
    joke: () => pick(JOKES),
    coffee: () => 'Brewing... ☕ Energy +50%. Sleep resistance +10%.',
    hello: () => 'Hello, World!',
    sudo: () => 'Nice try! Permission denied. 😄',
  };
  function run(raw) {
    const c = raw.trim().toLowerCase();
    if (!c) return;
    if (c === 'clear') { out.textContent = ''; return; }
    const key = c.split(' ')[0];
    out.textContent += `\n$ ${c}\n${CMDS[key] ? CMDS[key]() : `command not found: ${key}. Try "help".`}\n`;
    out.scrollTop = out.scrollHeight;
    achieve('terminal');
  }
  $('#cmd').onsubmit = e => { e.preventDefault(); run(cmdIn.value); cmdIn.value = ''; };
  $$('[data-cmd]').forEach(b => b.onclick = () => run(b.dataset.cmd));

  /* ---------- ROADMAP ---------- */
  const boxes = $$('.roadmap input');
  boxes.forEach(b => b.onchange = () => {
    const n = boxes.filter(x => x.checked).length;
    $('#roadBar').style.setProperty('--v', `${n / boxes.length * 100}%`);
    $('#roadNum').textContent = `${n}/${boxes.length}`;
  });

  /* ---------- QUIZ ---------- */
  const QUIZ = [
    ['What do I never leave home without?', ['My keyboard', 'My camera', 'My rubber duck'], 1],
    ['What is my best quality?', ['Speed', 'Curiosity', 'Sleep'], 1],
    ['What did my first program say?', ['Game over', 'Good morning', 'Hello, World!'], 2],
  ];
  const box = $('#quizBox');
  let qi = 0, score = 0;
  function ask() {
    box.replaceChildren();
    if (qi === QUIZ.length) {
      const p = document.createElement('p');
      p.className = 'px result';
      p.textContent = score === QUIZ.length ? `${score}/${QUIZ.length} · BOSS DEFEATED! 👑` : `${score}/${QUIZ.length} · GAME OVER. Try again!`;
      const again = document.createElement('button');
      again.type = 'button'; again.className = 'pbtn'; again.textContent = '↺ Play again';
      again.onclick = () => { qi = score = 0; ask(); };
      box.append(p, again);
      if (score === QUIZ.length) achieve('quiz');
      return;
    }
    const [q, opts, right] = QUIZ[qi];
    const h = document.createElement('p');
    h.className = 'q'; h.textContent = `${qi + 1}/${QUIZ.length} · ${q}`;
    const hp = document.createElement('p');
    hp.className = 'px hp'; hp.textContent = `BOSS HP ${'■'.repeat(QUIZ.length - qi)}${'□'.repeat(qi)}`;
    const row = document.createElement('div'); row.className = 'answers';
    opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pbtn alt'; b.textContent = o;
      b.onclick = () => {
        row.querySelectorAll('button').forEach(x => x.disabled = true);
        b.classList.add(i === right ? 'right' : 'wrong');
        row.children[right].classList.add('right');
        if (i === right) score++;
        setTimeout(() => { qi++; ask(); }, 1100);
      };
      row.append(b);
    });
    box.append(hp, h, row);
  }
  ask();
})();
