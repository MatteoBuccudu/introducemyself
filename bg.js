/* Synthwave background: low-res canvas (pixel look, cheap to draw), scroll shifts the colors and speeds up the road. */
(() => {
  const cv = document.getElementById("fx");
  if (!cv) return;
  const g = cv.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PX = 4; // one canvas pixel = 4 screen pixels
  let W, H, hor, stars = [], shoot = null, mx = 0, scr = 0, speed = 0, lastY = scrollY, t = 0, run = true;

  const size = () => {
    W = cv.width = Math.ceil(innerWidth / PX);
    H = cv.height = Math.ceil(innerHeight / PX);
    hor = Math.round(H * 0.58);
    stars = Array.from({ length: Math.round(W * H / 260) }, () => ({ x: Math.random() * W, y: Math.random() * hor, p: Math.random() * 6.28, c: Math.random() }));
  };
  size();
  addEventListener("resize", size, { passive: true });
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; }, { passive: true });
  document.addEventListener("visibilitychange", () => { run = !document.hidden; if (run) requestAnimationFrame(frame); });

  const hsl = (h, s, l, a = 1) => `hsla(${h % 360},${s}%,${l}%,${a})`;

  function frame(now) {
    if (!run) return;
    const dy = scrollY - lastY; lastY = scrollY;
    speed += (Math.min(Math.abs(dy), 80) / 80 - speed) * 0.08;
    t = now / 1000;
    const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const hue = 262 + p * 110; // violet -> pink -> orange as you scroll down
    const ox = mx * -6;

    // sky
    const sky = g.createLinearGradient(0, 0, 0, hor);
    sky.addColorStop(0, hsl(hue - 40, 70, 6));
    sky.addColorStop(0.65, hsl(hue, 75, 22));
    sky.addColorStop(1, hsl(hue + 60, 90, 52));
    g.fillStyle = sky; g.fillRect(0, 0, W, hor);

    // stars
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + s.c) + s.p));
      g.fillStyle = s.c > 0.85 ? hsl(50, 100, 80, a) : hsl(200, 40, 92, a);
      g.fillRect(Math.floor(s.x + ox * 0.3), Math.floor(s.y), 1, 1);
    }

    // shooting star
    if (!shoot && !reduced && Math.random() < 0.006) shoot = { x: Math.random() * W, y: Math.random() * hor * 0.4, l: 0 };
    if (shoot) {
      shoot.l += 1.6; shoot.x += 1.8; shoot.y += 0.7;
      for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(255,255,255,${1 - i / 14})`; g.fillRect(Math.floor(shoot.x - i * 1.8), Math.floor(shoot.y - i * 0.7), 1, 1); }
      if (shoot.l > 60) shoot = null;
    }

    // striped sun
    const r = Math.round(Math.min(W, H) * 0.26), sx = Math.round(W / 2 + ox), sy = hor - Math.round(r * 0.35 - p * r * 0.5);
    for (let y = -r; y <= r; y++) {
      const w = Math.sqrt(r * r - y * y), yy = sy + y;
      if (yy >= hor) break;
      const k = (y + r) / (2 * r);
      if (k > 0.5 && Math.floor((yy + t * 3) / (2 + (k - 0.5) * 10)) % 2 === 0 && k > 0.55) continue; // cutout stripes
      g.fillStyle = hsl(hue + 85 - k * 55, 100, 62 - k * 8);
      g.fillRect(Math.round(sx - w), yy, Math.round(w * 2), 1);
    }

    // far mountains (two layers, parallax with the mouse)
    for (const [amp, col, off, sp] of [[0.11, hsl(hue, 60, 10), 0, 0.5], [0.07, hsl(hue + 20, 65, 7), 40, 1]]) {
      g.fillStyle = col;
      for (let x = 0; x < W; x++) {
        const u = (x + ox * sp + off) * 0.045;
        const h = (Math.abs(Math.sin(u * 1.3)) * 0.7 + Math.abs(Math.sin(u * 0.37 + 1)) * 0.5) * H * amp;
        g.fillRect(x, Math.round(hor - h), 1, Math.ceil(h));
      }
    }

    // floor + perspective grid
    g.fillStyle = hsl(hue - 10, 70, 5); g.fillRect(0, hor, W, H - hor);
    scr = (scr + (0.35 + speed * 3) * 0.016 * (reduced ? 0 : 1)) % 1;
    const gl = hsl(hue + 100, 100, 65, 0.9);
    g.fillStyle = gl;
    for (let i = 0; i < 18; i++) { // horizontal lines: spacing grows toward the viewer
      const z = (i + scr) / 18, y = hor + Math.round((z * z) * (H - hor));
      g.fillRect(0, y, W, 1);
    }
    for (let i = -22; i <= 22; i++) { // vertical lines converge to the vanishing point
      const x0 = W / 2 + ox + i * 0.9, x1 = W / 2 + ox * 2 + i * W * 0.22;
      for (let y = hor; y < H; y += 1) { const k = (y - hor) / (H - hor); g.fillRect(Math.round(x0 + (x1 - x0) * k), y, 1, 1); }
    }
    // horizon glow
    const glow = g.createLinearGradient(0, hor - 6, 0, hor + 14);
    glow.addColorStop(0, "rgba(255,255,255,0)"); glow.addColorStop(0.35, hsl(hue + 90, 100, 70, 0.55)); glow.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = glow; g.fillRect(0, hor - 6, W, 20);

    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (reduced) addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true });
})();
