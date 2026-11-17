/* ---------- MUSIC: original 8-bit loop made live with Web Audio (no files) ---------- */
(() => {
  const btn = document.getElementById('musicBtn');
  if (!btn || !window.AudioContext) { if (btn) btn.hidden = true; return; }

  // C – Am – F – G, one bar each, 8 eighth-notes per bar (MIDI numbers, 0 = rest)
  const lead = [
    72, 76, 79, 76, 84, 79, 76, 79,
    69, 72, 76, 72, 81, 76, 72, 76,
    65, 69, 72, 69, 77, 72, 69, 72,
    67, 71, 74, 71, 79, 0, 77, 74,
  ];
  const roots = [48, 45, 41, 43];
  const STEP = 60 / 140 / 2; // eighth note at 140 bpm

  let ctx, master, timer, next = 0, step = 0, on = false;
  const hz = m => 440 * 2 ** ((m - 69) / 12);

  function tone(type, midi, t, len, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = hz(midi);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + len);
  }

  function schedule() {
    while (next < ctx.currentTime + 0.2) {
      const n = lead[step % lead.length];
      if (n) tone('square', n, next, STEP * 0.9, 0.5);
      const root = roots[Math.floor(step / 8) % 4];
      if (step % 2 === 0) tone('triangle', root + (step % 4 ? 12 : 0), next, STEP * 1.8, 0.9);
      next += STEP; step++;
    }
  }

  function set(play) {
    on = play;
    btn.setAttribute('aria-pressed', on);
    btn.textContent = on ? '♪ ON' : '♪ OFF';
    if (on) {
      if (!ctx) {
        ctx = new AudioContext();
        master = ctx.createGain();
        master.gain.value = 0.06;
        master.connect(ctx.destination);
      }
      ctx.resume();
      next = ctx.currentTime + 0.05;
      timer = setInterval(schedule, 50);
    } else {
      clearInterval(timer);
      ctx?.suspend();
    }
  }

  btn.addEventListener('click', () => set(!on));
  // start with the game: PRESS START is the user gesture browsers need for audio
  const start = document.getElementById('start');
  if (start) {
    const go = () => { removeEventListener('keydown', go); start.removeEventListener('click', go); on || set(true); };
    start.addEventListener('click', go);
    addEventListener('keydown', go);
  }
})();
