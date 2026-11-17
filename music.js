/* Generative synthwave loop (Web Audio, no files). Toggle button: #musicBtn */
(() => {
  const btn = document.getElementById("musicBtn");
  let ctx, master, timer, step = 0, next = 0, on = false;
  const BPM = 96, S = 60 / BPM / 4; // 16th note
  // Am - F - C - G, one bar each (16 steps)
  const ROOTS = [57, 53, 48, 55], CH = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]];
  const hz = n => 440 * 2 ** ((n - 69) / 12);

  function tone(t, note, dur, type, vol, dest, lp) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = hz(note);
    f.type = "lowpass"; f.frequency.value = lp;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, hp) {
    const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; f.type = "highpass"; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25);
  }
  function play(i, t) {
    const bar = (i >> 4) % 4, s = i & 15, r = ROOTS[bar], c = CH[bar];
    if (s % 4 === 0) kick(t);
    if (s === 4 || s === 12) noise(t, 0.12, 0.12, 1800);
    if (s % 2 === 0) noise(t, 0.04, 0.04, 7000);
    if (s % 2 === 0) tone(t, r - 12 + (s % 8 === 6 ? 12 : 0), S * 1.8, "sawtooth", 0.16, master, 500);
    tone(t, r + 12 + c[(s / 2 | 0) % 3] + (s % 8 > 3 ? 12 : 0), S * 1.5, "square", 0.045, master, 2600);
    if (s === 0) c.forEach(n => tone(t, r + n, S * 15, "triangle", 0.07, master, 1200));
  }
  function tick() {
    while (next < ctx.currentTime + 0.2) { play(step++, next); next += S; }
  }
  function set(v) {
    on = v;
    btn.setAttribute("aria-pressed", v);
    btn.querySelector("span").textContent = v ? "MUSIC ON" : "MUSIC OFF";
    btn.firstChild.textContent = v ? "🔊 " : "🔇 ";
    localStorage.setItem("mb-music", v ? "1" : "0");
    if (v) {
      ctx ||= Object.assign(new AudioContext(), {});
      if (!master) { master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination); }
      ctx.resume(); next = ctx.currentTime + 0.05;
      timer = setInterval(tick, 50);
    } else {
      clearInterval(timer); ctx && ctx.suspend();
    }
  }
  btn.addEventListener("click", () => set(!on));
  // First user gesture (PRESS START) begins music unless the visitor muted it before.
  const first = () => { if (localStorage.getItem("mb-music") !== "0" && !on) set(true); };
  document.addEventListener("pointerdown", first, { once: true });
  document.addEventListener("keydown", first, { once: true });
  document.addEventListener("visibilitychange", () => { if (on) document.hidden ? ctx.suspend() : ctx.resume(); });
})();
