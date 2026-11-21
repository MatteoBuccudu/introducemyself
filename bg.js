/* Static synthwave background: drawn once (and on resize), zero per-frame cost. */
(() => {
  const cv = document.getElementById("fx");
  if (!cv) return;
  const g = cv.getContext("2d");
  const PX = 2; // one canvas pixel = 2 screen pixels: crisp but cheap, drawn only once
  const hue = 268;
  const hsl = (h, s, l, a = 1) => `hsla(${h % 360},${s}%,${l}%,${a})`;
  // seeded PRNG so the stars do not jump around on resize
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function draw() {
    const W = cv.width = Math.ceil(innerWidth / PX), H = cv.height = Math.ceil(innerHeight / PX);
    const hor = Math.round(H * 0.58);
    seed = 7;

    const sky = g.createLinearGradient(0, 0, 0, hor);
    sky.addColorStop(0, hsl(hue - 40, 70, 5));
    sky.addColorStop(0.6, hsl(hue, 70, 20));
    sky.addColorStop(1, hsl(hue + 60, 85, 46));
    g.fillStyle = sky; g.fillRect(0, 0, W, hor);

    for (let i = 0, n = Math.round(W * H / 900); i < n; i++) {
      const c = rnd(), x = Math.floor(rnd() * W), y = Math.floor(rnd() * hor * 0.9);
      g.fillStyle = c > 0.9 ? hsl(50, 100, 80, 0.9) : hsl(200, 40, 92, 0.3 + rnd() * 0.5);
      g.fillRect(x, y, 1, 1);
    }

    // striped sun
    const r = Math.round(Math.min(W, H) * 0.26), sx = Math.round(W / 2), sy = hor - Math.round(r * 0.35);
    for (let y = -r; y <= r; y++) {
      const w = Math.sqrt(r * r - y * y), yy = sy + y;
      if (yy >= hor) break;
      const k = (y + r) / (2 * r);
      if (k > 0.55 && Math.floor(yy / (2 + (k - 0.5) * 10)) % 2 === 0) continue;
      g.fillStyle = hsl(hue + 85 - k * 55, 100, 62 - k * 8);
      g.fillRect(Math.round(sx - w), yy, Math.round(w * 2), 1);
    }

    // mountains
    for (const [amp, col, off] of [[0.11, hsl(hue, 60, 10), 0], [0.07, hsl(hue + 20, 65, 7), 40]]) {
      g.fillStyle = col;
      for (let x = 0; x < W; x++) {
        const u = (x + off) * 0.045;
        const h = (Math.abs(Math.sin(u * 1.3)) * 0.7 + Math.abs(Math.sin(u * 0.37 + 1)) * 0.5) * H * amp;
        g.fillRect(x, Math.round(hor - h), 1, Math.ceil(h));
      }
    }

    // floor + perspective grid
    g.fillStyle = hsl(hue - 10, 70, 5); g.fillRect(0, hor, W, H - hor);
    g.fillStyle = hsl(hue + 100, 100, 65, 0.85);
    for (let i = 0; i < 18; i++) g.fillRect(0, hor + Math.round(((i + 0.4) / 18) ** 2 * (H - hor)), W, 1);
    g.beginPath();
    for (let i = -22; i <= 22; i++) { g.moveTo(W / 2 + i * 0.9, hor); g.lineTo(W / 2 + i * W * 0.22, H); }
    g.strokeStyle = hsl(hue + 100, 100, 65, 0.85); g.lineWidth = 1; g.stroke();

    const glow = g.createLinearGradient(0, hor - 6, 0, hor + 14);
    glow.addColorStop(0, "rgba(255,255,255,0)"); glow.addColorStop(0.35, hsl(hue + 90, 100, 70, 0.55)); glow.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = glow; g.fillRect(0, hor - 6, W, 20);
  }

  draw();
  let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 150); }, { passive: true });
})();
