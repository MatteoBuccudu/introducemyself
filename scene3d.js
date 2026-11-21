import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = s => document.querySelector(s);

/* ---------- helpers ---------- */
const mat = (color, rough = 0.7, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
const pivot = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); return g; };
// tapered limb segment hanging down from y
const seg = (rT, rB, len, m, y = 0) => mesh(new THREE.CylinderGeometry(rT, rB, len, 18), m, 0, y - len / 2, 0);
// (scaled) sphere: joints, muscles, head shapes
const blob = (r, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = mesh(new THREE.SphereGeometry(r, 22, 16), m, x, y, z); o.scale.set(sx, sy, sz); return o; };

// Human ~1.8 m with real proportions (≈7.5 heads), faces +z, feet at y=0.
// Joints: hip .93, knee .50, waist 1.0, shoulder 1.45, neck 1.52. Arms and head hang off the torso so a lean moves the whole upper body.
function person({ skin = 0xe0ac86, top, pants, shoes = 0x161616, hair = 0x1b1410, socks = pants, shorts = false, sleeves = "long", hood = false, cap = 0, beard = false, gloves = 0, h = 1 }) {
  const g = new THREE.Group(), p = { upper: 0.3, lower: 0.28 };
  const sk = mat(skin, 0.62), tm = mat(top, 0.85), pm = mat(pants, 0.8), hm = mat(hair, 0.95);

  // pelvis + legs (thigh, knee, calf, ankle, shoe)
  const pelvis = mesh(new THREE.CapsuleGeometry(0.115, 0.1, 6, 16), pm, 0, 0.96, 0); pelvis.rotation.z = Math.PI / 2; pelvis.scale.z = 0.78; g.add(pelvis);
  for (const [k, s] of [["L", 1], ["R", -1]]) {
    const leg = pivot(s * 0.095, 0.93, 0), shin = pivot(0, -0.43, 0), foot = pivot(0, -0.43, 0);
    const thighM = shorts ? sk : pm, shinM = shorts ? mat(socks, 0.9) : pm;
    leg.add(blob(0.085, pm, 0, 0, 0), seg(0.085, 0.058, 0.43, thighM), blob(0.075, thighM, 0, -0.18, 0.012, 1, 2.3, 1));
    if (shorts) leg.add(seg(0.1, 0.093, 0.2, pm, 0.02));
    shin.add(blob(0.058, shorts ? sk : pm, 0, 0, 0), seg(0.056, 0.036, 0.43, shinM), blob(0.05, shinM, 0, -0.13, -0.014, 1, 2.4, 1));
    const shoe = mesh(new THREE.CapsuleGeometry(0.05, 0.15, 6, 14).rotateX(Math.PI / 2), mat(shoes, 0.45), 0, -0.025, 0.045); shoe.scale.y = 0.7;
    foot.add(shoe, mesh(new THREE.BoxGeometry(0.096, 0.014, 0.25), mat(0xe6e6e6, 0.9), 0, -0.055, 0.045));
    shin.add(foot); leg.add(shin); g.add(leg); p["leg" + k] = leg; p["shin" + k] = shin; p["foot" + k] = foot;
  }

  // torso: V-shaped chest over a narrower waist
  p.torso = pivot(0, 1.0, 0); g.add(p.torso);
  const chest = mesh(new THREE.CapsuleGeometry(0.14, 0.14, 8, 20), tm, 0, 0.34, 0); chest.scale.set(1.3, 1, 0.74);
  const belly = mesh(new THREE.CapsuleGeometry(0.13, 0.1, 8, 18), tm, 0, 0.12, 0); belly.scale.set(1.15, 1, 0.78);
  p.torso.add(chest, belly);

  // head: skull, jaw, ears, eyes, brows, nose, mouth, hair
  p.head = pivot(0, 0.52, 0); p.torso.add(p.head);
  const H = p.head, lip = mat(new THREE.Color(skin).lerp(new THREE.Color(0x8a3a36), 0.45), 0.5);
  H.add(mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.16, 14), sk, 0, 0.02, 0));
  H.add(blob(0.1, sk, 0, 0.15, 0, 0.8, 1.15, 1), blob(0.06, sk, 0, 0.085, 0.035, 1.15, 0.9, 1));
  for (const s of [-1, 1]) {
    H.add(blob(0.026, sk, s * 0.079, 0.15, -0.005, 0.35, 1, 0.65));
    H.add(blob(0.013, mat(0xf4f1ea, 0.25), s * 0.032, 0.17, 0.081), blob(0.0075, mat(0x3b2a1e, 0.2), s * 0.032, 0.17, 0.092));
    const brow = mesh(new THREE.BoxGeometry(0.032, 0.007, 0.012), hm, s * 0.033, 0.193, 0.089); brow.rotation.z = -s * 0.12; H.add(brow);
  }
  const nose = mesh(new THREE.CapsuleGeometry(0.013, 0.03, 4, 10), sk, 0, 0.145, 0.098); nose.rotation.x = -0.35; H.add(nose);
  H.add(mesh(new THREE.BoxGeometry(0.042, 0.008, 0.01), lip, 0, 0.105, 0.092));
  if (beard) { const b = mesh(new THREE.SphereGeometry(0.104, 24, 12, 0.3, 2.54, 1.75, 0.95), mat(hair, 1), 0, 0.15, 0); b.scale.set(0.82, 1.15, 1.03); H.add(b); }
  if (hood) {
    const hd = mesh(new THREE.SphereGeometry(0.135, 28, 18, Math.PI / 2 + 0.9, 2 * Math.PI - 1.8, 0, 2.3), mat(top, 0.9, 0, { side: THREE.DoubleSide }), 0, 0.15, -0.02);
    hd.scale.set(0.95, 1.08, 1.1); H.add(hd); p.torso.add(blob(0.12, tm, 0, 0.5, -0.1, 1.3, 0.6, 0.6));
  } else if (cap) {
    const cm = mat(cap, 0.75);
    const dome = mesh(new THREE.SphereGeometry(0.108, 28, 14, 0, 6.283, 0, 1.5), cm, 0, 0.16, -0.005); dome.scale.set(0.84, 1.1, 1.03); dome.rotation.x = -0.2;
    // brim worn backwards, like sports shooters do so it clears the viewfinder
    const brim = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 24, 1, false, Math.PI - 1.5, 3), cm, 0, 0.175, -0.1); brim.rotation.x = -0.15;
    H.add(dome, brim);
  } else {
    const hc = mesh(new THREE.SphereGeometry(0.106, 28, 16, 0, 6.283, 0, 1.45), hm, 0, 0.155, -0.006); hc.scale.set(0.84, 1.12, 1.02); hc.rotation.x = -0.35; H.add(hc);
  }

  // arms: deltoid, upper arm, elbow, forearm, hand with thumb
  for (const [k, s] of [["L", 1], ["R", -1]]) {
    const arm = pivot(s * 0.215, 0.45, 0), fore = pivot(0, -0.3, 0); arm.rotation.z = s * 0.06;
    const am = sleeves === "long" ? tm : sk, hand = gloves ? mat(gloves, 0.6) : sk;
    arm.add(blob(0.068, tm, 0, 0, 0), seg(0.052, 0.042, 0.3, am), blob(0.046, am, 0, -0.13, 0.006, 1, 2.4, 1));
    if (sleeves === "short") arm.add(seg(0.066, 0.06, 0.15, tm, 0.02));
    fore.add(blob(0.043, am, 0, 0, 0), seg(0.043, 0.031, 0.25, am), blob(0.04, am, 0, -0.08, 0, 1.08, 2.3, 1));
    const palm = mesh(new THREE.CapsuleGeometry(0.03, 0.05, 4, 10), hand, 0, -0.29, 0); palm.scale.set(0.55, 1, 1.15);
    const thumb = mesh(new THREE.CapsuleGeometry(0.011, 0.03, 4, 8), hand, -s * 0.012, -0.265, 0.03); thumb.rotation.x = -0.5;
    fore.add(palm, thumb); arm.add(fore); p.torso.add(arm); p["arm" + k] = arm; p["fore" + k] = fore;
  }
  g.scale.setScalar(h); g.userData = p; return g;
}

// 2-bone IK: bends arm k so the palm reaches t (torso-local); pole pushes the elbow that way
const DOWN = new THREE.Vector3(0, -1, 0), _q = new THREE.Quaternion();
function reach(p, k, t, pole) {
  const arm = p["arm" + k], fore = p["fore" + k], s = arm.position, a = p.upper, b = p.lower;
  const d = t.clone().sub(s), len = Math.min(d.length(), a + b - 1e-3); d.normalize();
  const along = (a * a - b * b + len * len) / (2 * len), hgt = Math.sqrt(Math.max(0, a * a - along * along));
  const elbow = s.clone().addScaledVector(d, along).addScaledVector(pole.clone().addScaledVector(d, -pole.dot(d)).normalize(), hgt);
  arm.quaternion.setFromUnitVectors(DOWN, elbow.clone().sub(s).normalize());
  const hand = s.clone().addScaledVector(d, len).sub(elbow).normalize().applyQuaternion(_q.copy(arm.quaternion).invert());
  fore.quaternion.setFromUnitVectors(DOWN, hand);
}

function makeScene(canvas, { cam, look, fov = 38, bg, fog, exposure = 1 }) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = exposure;
  r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = bg; scene.fog = fog;
  const pm = new THREE.PMREMGenerator(r);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 120); camera.position.set(...cam);
  const target = new THREE.Vector3(...look), base = new THREE.Vector3(...cam), mouse = { x: 0, y: 0 };
  canvas.parentElement.addEventListener("pointermove", e => {
    const b = canvas.getBoundingClientRect(); mouse.x = ((e.clientX - b.left) / b.width - 0.5) * 2; mouse.y = ((e.clientY - b.top) / b.height - 0.5) * 2;
  });
  const fit = () => { const b = canvas.parentElement.getBoundingClientRect(); r.setSize(b.width, b.height, false); camera.aspect = b.width / b.height; camera.updateProjectionMatrix(); };
  new ResizeObserver(fit).observe(canvas.parentElement); fit();
  const api = { r, scene, camera, update: () => {}, visible: false };
  api.frame = t => {
    camera.position.set(base.x + mouse.x * 0.9, base.y - mouse.y * 0.4, base.z + mouse.x * 0.3); camera.lookAt(target);
    api.update(t); r.render(scene, camera);
  };
  new IntersectionObserver(([e]) => api.visible = e.isIntersecting).observe(canvas);
  return api;
}

/* ================= LEFT: football + photographer on the touchline ================= */
function football() {
  const sky = document.createElement("canvas"); sky.width = 2; sky.height = 256;
  const sg = sky.getContext("2d"), gr = sg.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "#2b3a7a"); gr.addColorStop(0.55, "#e88a6a"); gr.addColorStop(1, "#ffd29a"); sg.fillStyle = gr; sg.fillRect(0, 0, 2, 256);
  const bg = new THREE.CanvasTexture(sky); bg.colorSpace = THREE.SRGBColorSpace;
  // camera stands behind the photographer on the touchline, looking at the attack on the left goal
  const S = makeScene($("#cvFoot"), { cam: [-6.2, 1.75, 19.6], look: [-14.5, 0.95, 6.5], fov: 40, bg, fog: new THREE.Fog(0xe9a888, 30, 85), exposure: 0.95 });
  const { scene } = S;

  // pitch texture: mown stripes + lines + grain. Touchlines at z=±14.73, goal lines at x=±24.48
  const pc = document.createElement("canvas"); pc.width = 2048; pc.height = 1280; const c = pc.getContext("2d");
  for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? "#2f7d32" : "#3a8f3c"; c.fillRect(i * 128, 0, 128, 1280); }
  for (let i = 0; i < 90000; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? "10,60,10" : "120,190,90"},0.12)`; c.fillRect(Math.random() * 2048, Math.random() * 1280, 2, 3); }
  c.strokeStyle = "rgba(255,255,255,.92)"; c.fillStyle = "rgba(255,255,255,.92)"; c.lineWidth = 7; c.strokeRect(60, 60, 1928, 1160);
  c.beginPath(); c.moveTo(1024, 60); c.lineTo(1024, 1220); c.stroke();
  c.beginPath(); c.arc(1024, 640, 150, 0, 7); c.stroke(); c.strokeRect(60, 340, 260, 600); c.strokeRect(1728, 340, 260, 600);
  c.strokeRect(60, 520, 90, 240); c.strokeRect(1898, 520, 90, 240);
  c.beginPath(); c.arc(230, 640, 150, -0.93, 0.93); c.stroke(); c.beginPath(); c.arc(1818, 640, 150, Math.PI - 0.93, Math.PI + 0.93); c.stroke();
  for (const x of [230, 1024, 1818]) { c.beginPath(); c.arc(x, 640, 8, 0, 7); c.fill(); }
  const tex = new THREE.CanvasTexture(pc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const pitch = mesh(new THREE.PlaneGeometry(52, 32.5), mat(0xffffff, 0.95, 0, { map: tex })); pitch.rotation.x = -Math.PI / 2; pitch.castShadow = false; scene.add(pitch);
  const out = mesh(new THREE.PlaneGeometry(160, 120), mat(0x1f4a24, 1), 0, -0.02, 0); out.rotation.x = -Math.PI / 2; out.castShadow = false; scene.add(out);

  // ad boards + stands with crowd (far side and behind the goal)
  const adc = document.createElement("canvas"); adc.width = 1024; adc.height = 64; const a = adc.getContext("2d");
  const cols = ["#ffcc00", "#29adff", "#ff004d", "#ffffff"]; for (let i = 0; i < 8; i++) { a.fillStyle = cols[i % 4]; a.fillRect(i * 128, 0, 128, 64); a.fillStyle = "#111"; a.font = "bold 28px sans-serif"; a.fillText(["MB.CYBER", "PHOTO", "FAIR PLAY", "GOAL!"][i % 4], i * 128 + 10, 42); }
  const adt = new THREE.CanvasTexture(adc); adt.colorSpace = THREE.SRGBColorSpace;
  const adM = mat(0xffffff, 0.4, 0, { map: adt, emissive: 0xffffff, emissiveMap: adt, emissiveIntensity: 0.25 });
  scene.add(mesh(new THREE.BoxGeometry(50, 0.9, 0.12), adM, 0, 0.45, -17.5));
  const cc = document.createElement("canvas"); cc.width = 1024; cc.height = 256; const q = cc.getContext("2d"); q.fillStyle = "#2a2d3a"; q.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 5000; i++) { q.fillStyle = `hsl(${Math.random() * 360},55%,${35 + Math.random() * 35}%)`; q.fillRect(Math.random() * 1024, Math.random() * 256, 4, 5); }
  const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const standM = mat(0xffffff, 1, 0, { map: ct });
  const stand = mesh(new THREE.BoxGeometry(56, 9, 8), standM, 0, 4.5, -23); stand.rotation.x = -0.35; scene.add(stand);
  const end = new THREE.Group(); end.rotation.y = Math.PI / 2; end.position.set(-28.5, 0, 0); scene.add(end);
  end.add(mesh(new THREE.BoxGeometry(32, 0.9, 0.12), adM, 0, 0.45, 0));
  const endStand = mesh(new THREE.BoxGeometry(40, 9, 8), standM, 0, 4.5, -6); endStand.rotation.x = -0.35; end.add(endStand);

  // goal on the goal line, net behind it
  const goalM = mat(0xf4f4f4, 0.35, 0.3), netM = mat(0xffffff, 1, 0, { transparent: true, opacity: 0.35, side: THREE.DoubleSide, wireframe: true }), goal = new THREE.Group();
  for (const s of [-1, 1]) goal.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.44, 12), goalM, s * 3.66, 1.22, 0));
  const bar = mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.44, 12), goalM, 0, 2.44, 0); bar.rotation.z = Math.PI / 2; goal.add(bar);
  const net = (w, hh, x, y, z, rx, ry) => { const n = new THREE.Mesh(new THREE.PlaneGeometry(w, hh, Math.round(w * 4), Math.round(hh * 4)), netM); n.position.set(x, y, z); n.rotation.set(rx, ry, 0); goal.add(n); };
  net(7.32, 2.44, 0, 1.22, -1.8, 0, 0); net(7.32, 1.8, 0, 2.44, -0.9, -Math.PI / 2, 0);
  for (const s of [-1, 1]) net(1.8, 2.44, s * 3.66, 1.22, -0.9, 0, Math.PI / 2);
  goal.position.set(-24.48, 0, 0); goal.rotation.y = Math.PI / 2; scene.add(goal);

  // lights: low warm sun + fill + floodlights
  scene.add(new THREE.HemisphereLight(0xaab8ff, 0x335533, 0.7));
  const sun = new THREE.DirectionalLight(0xffc48a, 3.2); sun.position.set(2, 11, 16); sun.target.position.set(-12, 0, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 15, bottom: -15, near: 1, far: 50 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4; scene.add(sun, sun.target);
  for (const x of [-18, 18]) {
    scene.add(mesh(new THREE.CylinderGeometry(0.15, 0.2, 14, 8), mat(0x555a66, 0.5, 0.7), x, 7, -16));
    scene.add(mesh(new THREE.BoxGeometry(2.2, 1.1, 0.3), mat(0xffffff, 0.3, 0, { emissive: 0xfff2cc, emissiveIntensity: 2.2 }), x, 14.2, -16));
  }

  // regulation-size ball (22 cm)
  const ball = mesh(new THREE.IcosahedronGeometry(0.11, 3), mat(0xffffff, 0.35), 0, 0.11, 0); scene.add(ball);

  // players: shirts, shorts, socks, slightly different builds
  const kits = [[0xd7263d, 0xffffff, 0xd7263d], [0xd7263d, 0xffffff, 0xd7263d], [0xd7263d, 0xffffff, 0xd7263d], [0x1f6feb, 0x10203a, 0x10203a], [0x1f6feb, 0x10203a, 0x10203a], [0x1f6feb, 0x10203a, 0x10203a]];
  const skins = [0xf0c8a0, 0x8d5524, 0xc68642, 0xe0ac86, 0x5c3a1e, 0xf0c8a0];
  const players = kits.map(([top, pants, socks], i) => {
    const p = person({ top, pants, socks, shorts: true, sleeves: "short", skin: skins[i], shoes: i % 2 ? 0x111111 : 0xffd23f, hair: [0x1b1410, 0x2a1a10, 0xaa7733][i % 3], h: [1, 0.96, 1.04, 0.98, 1.03, 0.95][i] });
    scene.add(p); return { p, ph: i * 1.05, ax: 3 + (i % 3) * 1.5, az: 4 + (i % 2) * 2, cx: -15 + i, cz: -1 + (i % 3) * 2.5, sp: 0.35 + (i % 3) * 0.07 };
  });
  const pos = (pl, t) => { const u = t * pl.sp + pl.ph; return [pl.cx + Math.sin(u) * pl.ax, pl.cz + Math.sin(u * 1.7) * pl.az * 0.6]; };

  // goalkeeper: long sleeves, gloves, ready stance on the line
  const gk = person({ top: 0x2fbf71, pants: 0x111111, socks: 0x2fbf71, shorts: true, gloves: 0xf2f2f2, skin: 0xd9a47c, hair: 0x2a1a10 }), gd = gk.userData;
  gk.rotation.y = Math.PI / 2; gk.position.set(-23.6, -0.07, 0); scene.add(gk);
  for (const [k, s] of [["L", 1], ["R", -1]]) { gd["leg" + k].rotation.set(-0.45, 0, s * 0.18); gd["shin" + k].rotation.x = 0.8; gd["foot" + k].rotation.x = -0.35; }
  gd.torso.rotation.x = 0.35; gd.head.rotation.x = -0.3;

  // photographer kneeling on the touchline: cap, beard, PHOTO bib, white telephoto on a monopod
  const ph = person({ top: 0x2f3a46, pants: 0x1c1f26, shoes: 0x2b2b2b, cap: 0x22262d, beard: true, skin: 0xe6b894, hair: 0x3a2618 }), pd = ph.userData;
  const PH = new THREE.Vector3(-10.5, 0, 15.4), FACE = Math.atan2(-15 - PH.x, 2 - PH.z);
  ph.position.copy(PH); ph.rotation.y = FACE; scene.add(ph);
  // right knee on the grass with toes tucked, left foot planted forward
  pd.legR.rotation.x = 0; pd.shinR.rotation.x = 1.85; pd.footR.rotation.x = -0.28;
  pd.legL.rotation.x = -1.5; pd.shinL.rotation.x = 1.5; pd.legL.rotation.z = 0.08;
  const bc = document.createElement("canvas"); bc.width = 1024; bc.height = 128; const bx = bc.getContext("2d");
  bx.fillStyle = "#ff7a1a"; bx.fillRect(0, 0, 1024, 128); bx.fillStyle = "#111"; bx.font = "bold 64px sans-serif"; bx.textAlign = "center"; bx.fillText("PHOTO", 512, 88);
  const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace;
  const bib = mesh(new THREE.CylinderGeometry(0.205, 0.19, 0.34, 32, 1, true), mat(0xffffff, 0.8, 0, { map: bt, side: THREE.DoubleSide }), 0, 0.33, 0); bib.scale.z = 0.62; pd.torso.add(bib);
  // camera rig lives in torso space: viewfinder at the right eye (x -0.033, y .69)
  const rig = new THREE.Group(), body = mat(0x15171b, 0.4, 0.4), white = mat(0xe9e6dc, 0.35, 0.1), black = mat(0x0e0f12, 0.5, 0.2);
  rig.add(mesh(new THREE.BoxGeometry(0.15, 0.11, 0.08), body, -0.033, 0.65, 0.14), mesh(new THREE.BoxGeometry(0.06, 0.045, 0.06), body, -0.033, 0.715, 0.14));
  rig.add(mesh(new THREE.BoxGeometry(0.035, 0.1, 0.07), body, -0.12, 0.645, 0.15));
  const lensAt = (rT, rB, len, m, z) => { const l = mesh(new THREE.CylinderGeometry(rT, rB, len, 28), m, -0.033, 0.645, z); l.rotation.x = Math.PI / 2; rig.add(l); };
  lensAt(0.06, 0.045, 0.46, white, 0.41); lensAt(0.078, 0.07, 0.13, black, 0.7); lensAt(0.064, 0.064, 0.05, black, 0.33);
  rig.add(mesh(new THREE.CircleGeometry(0.06, 28), mat(0x2244aa, 0.05, 0.9, { emissive: 0x112266, emissiveIntensity: 0.5 }), -0.033, 0.645, 0.64));
  rig.add(mesh(new THREE.BoxGeometry(0.03, 0.06, 0.06), black, -0.033, 0.58, 0.33));
  rig.add(mesh(new THREE.CylinderGeometry(0.014, 0.011, 1.1, 10), mat(0x22252b, 0.3, 0.8), -0.033, 0.0, 0.33));
  pd.torso.add(rig);
  const handR = new THREE.Vector3(-0.125, 0.64, 0.15), handL = new THREE.Vector3(-0.02, 0.6, 0.46);
  const poleR = new THREE.Vector3(-1, -0.7, 0), poleL = new THREE.Vector3(1, -1, 0);
  scene.add(mesh(new THREE.BoxGeometry(0.34, 0.22, 0.2), mat(0x1a1c20, 0.8), PH.x - 0.7, 0.11, PH.z + 0.3)); // camera bag
  const flash = new THREE.PointLight(0xffffff, 0, 8, 2); flash.position.set(0, 1.4, 0.9); ph.add(flash);
  const flashEl = $("#flashFx"), shotsEl = $("#shots"); let shots = 0, nextShot = 1.6, pan = 0;

  S.update = t => {
    const T = reduced ? 3 : t;
    players.forEach((pl, i) => {
      const [x, z] = pos(pl, T), [x2, z2] = pos(pl, T + 0.05), d = pl.p.userData, w = T * 7.5 + i;
      pl.p.position.set(x, Math.abs(Math.sin(w)) * 0.04, z); pl.p.rotation.y = Math.atan2(x2 - x, z2 - z);
      d.legL.rotation.x = Math.sin(w) * 0.8; d.legR.rotation.x = -Math.sin(w) * 0.8;
      d.shinL.rotation.x = Math.max(0, -Math.sin(w)) * 1.3; d.shinR.rotation.x = Math.max(0, Math.sin(w)) * 1.3;
      d.armL.rotation.x = -Math.sin(w) * 0.7; d.armR.rotation.x = Math.sin(w) * 0.7; d.foreL.rotation.x = d.foreR.rotation.x = -1.2;
      d.torso.rotation.set(0.14, Math.sin(w) * 0.12, 0);
    });
    const l = players[0].p;
    ball.position.set(l.position.x + Math.sin(l.rotation.y) * 0.5, 0.11 + Math.abs(Math.sin(T * 7.5)) * 0.04, l.position.z + Math.cos(l.rotation.y) * 0.5);
    ball.rotation.x = T * 9;
    // keeper shuffles along the line, tracking the ball
    gk.position.z += (THREE.MathUtils.clamp(ball.position.z, -3, 3) - gk.position.z) * 0.04;
    const sh = Math.sin(T * 4) * 0.05; gd.armL.rotation.set(-0.5, 0, 0.75 + sh); gd.armR.rotation.set(-0.5, 0, -0.75 - sh); gd.foreL.rotation.x = gd.foreR.rotation.x = -0.6;
    // photographer pans the upper body to follow the ball (wrapped angle, clamped like a real torso)
    const ang = Math.atan2(ball.position.x - PH.x, ball.position.z - PH.z), want = THREE.MathUtils.clamp(Math.atan2(Math.sin(ang - FACE), Math.cos(ang - FACE)), -0.5, 0.5);
    pan += (want - pan) * 0.06;
    ph.position.y = -0.45 + Math.sin(T * 1.6) * 0.004;
    pd.torso.rotation.set(0.04 + Math.sin(T * 1.6) * 0.008, pan, 0); pd.head.rotation.set(0.04, 0, -0.05);
    reach(pd, "R", handR, poleR); reach(pd, "L", handL, poleL);
    if (T > nextShot) { nextShot = T + 1.8 + Math.random() * 1.6; shots++; shotsEl.textContent = shots; flash.intensity = 25; flashEl.classList.remove("on"); void flashEl.offsetWidth; flashEl.classList.add("on"); }
    flash.intensity *= 0.82;
  };
  return S;
}

/* ================= RIGHT: ethical hacker + file encryption ================= */
function hacker() {
  const S = makeScene($("#cvHack"), { cam: [-2.9, 2.2, -2.6], look: [0.2, 1.15, 0.9], fov: 42, bg: new THREE.Color(0x07080f), fog: new THREE.Fog(0x07080f, 6, 16), exposure: 1.15 });
  const { scene } = S;
  scene.environmentIntensity = 0.12;

  const floor = mesh(new THREE.PlaneGeometry(14, 14), mat(0x15171f, 0.35, 0.4)); floor.rotation.x = -Math.PI / 2; floor.castShadow = false; scene.add(floor);
  scene.add(mesh(new THREE.BoxGeometry(14, 5, 0.2), mat(0x10121a, 0.9), 0, 2.5, 3.4));
  scene.add(mesh(new THREE.BoxGeometry(0.2, 5, 14), mat(0x10121a, 0.9), 3.6, 2.5, 0));
  const neon = (c, x, y, z, w, h, d) => scene.add(mesh(new THREE.BoxGeometry(w, h, d), mat(0x000000, 1, 0, { emissive: c, emissiveIntensity: 3 }), x, y, z));
  neon(0xff2d95, 0, 3.4, 3.27, 5, 0.05, 0.05); neon(0x19e6ff, 3.47, 2.6, 0.5, 0.05, 0.05, 4);
  const green = mat(0x00ff9d, 0.3, 0, { emissive: 0x00ff9d, emissiveIntensity: 1.8 });
  const lk = new THREE.Group(); lk.add(mesh(new THREE.BoxGeometry(0.5, 0.4, 0.06), green));
  lk.add(mesh(new THREE.TorusGeometry(0.15, 0.04, 12, 24, Math.PI), green, 0, 0.2, 0)); lk.position.set(1.6, 2.5, 3.25); scene.add(lk);

  // desk
  scene.add(mesh(new THREE.BoxGeometry(3.2, 0.06, 1.1), mat(0x2b2118, 0.55, 0.05), 0, 0.75, 1.5));
  for (const sx of [-1.5, 1.5]) for (const sz of [1.1, 1.9]) scene.add(mesh(new THREE.BoxGeometry(0.06, 0.75, 0.06), mat(0x222831, 0.4, 0.8), sx, 0.375, sz));
  // monitors with live canvases
  const mons = [];
  const mkMon = (x, ry) => {
    const cv = document.createElement("canvas"); cv.width = 640; cv.height = 400; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.2, 0.72, 0.04), mat(0x0c0d11, 0.4, 0.6)));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.66), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); scr.position.z = -0.022; scr.rotation.y = Math.PI; g.add(scr);
    g.add(mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), mat(0x222831, 0.4, 0.8), 0, -0.45, 0.03));
    g.add(mesh(new THREE.BoxGeometry(0.4, 0.02, 0.22), mat(0x222831, 0.4, 0.8), 0, -0.6, 0.03));
    g.position.set(x, 1.38, 1.85); g.rotation.y = ry; scene.add(g); mons.push({ t, ctx: cv.getContext("2d") });
  };
  mkMon(-0.65, 0.16); mkMon(0.65, -0.16);
  // keyboard, mouse, mug, server tower
  scene.add(mesh(new THREE.BoxGeometry(0.55, 0.025, 0.18), mat(0x111318, 0.4, 0.5), 0, 0.793, 1.15));
  scene.add(mesh(new THREE.BoxGeometry(0.52, 0.005, 0.01), mat(0, 1, 0, { emissive: 0x19e6ff, emissiveIntensity: 3 }), 0, 0.808, 1.235));
  scene.add(mesh(new THREE.BoxGeometry(0.07, 0.03, 0.11), mat(0x111318, 0.4, 0.5), 0.55, 0.795, 1.15));
  scene.add(mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 20), mat(0xf5f5f5, 0.3), -0.95, 0.83, 1.2));
  scene.add(mesh(new THREE.BoxGeometry(0.4, 0.9, 0.5), mat(0x15171d, 0.35, 0.6), 2.4, 0.45, 2.3));
  const leds = [0, 1, 2, 3, 4, 5].map(i => { const l = mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), mat(0, 1, 0, { emissive: 0x00ff9d, emissiveIntensity: 3 }), 2.2, 0.15 + i * 0.1, 2.05); l.castShadow = false; scene.add(l); return l; });

  // chair, pulled close to the desk (seat top at .47 m)
  const lea = mat(0x181a20, 0.5, 0.1), CZ = 0.6;
  scene.add(mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), lea, 0, 0.43, CZ));
  const back = mesh(new THREE.BoxGeometry(0.5, 0.7, 0.07), lea, 0, 0.85, CZ - 0.27); back.rotation.x = -0.12; scene.add(back);
  scene.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12), mat(0x333840, 0.3, 0.9), 0, 0.25, CZ));
  scene.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 5), mat(0x333840, 0.3, 0.9), 0, 0.1, CZ));

  // hacker in a dark hoodie with headphones
  const hk = person({ top: 0x14161c, pants: 0x1d2330, shoes: 0xff2d95, hood: true, skin: 0xd9a47c });
  hk.position.set(0, -0.4, CZ); scene.add(hk); const hd = hk.userData;
  const hp = mesh(new THREE.TorusGeometry(0.135, 0.018, 10, 28, Math.PI * 1.1), mat(0x222222, 0.3, 0.6), 0, 0.15, 0); hp.rotation.set(0, Math.PI / 2, 0.15); hd.head.add(hp);
  for (const s of [-1, 1]) { const cup = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16), mat(0x19e6ff, 0.3, 0.6, { emissive: 0x19e6ff, emissiveIntensity: 0.8 }), s * 0.125, 0.14, 0); cup.rotation.z = Math.PI / 2; hd.head.add(cup); }
  for (const s of ["L", "R"]) { hd["leg" + s].rotation.x = -1.5; hd["shin" + s].rotation.x = 1.45; }
  const keyW = new THREE.Vector3(), keyT = new THREE.Vector3(), poleKL = new THREE.Vector3(1, -1, -0.3), poleKR = new THREE.Vector3(-1, -1, -0.3);

  // hologram: files orbiting, red = plain -> green = encrypted
  const files = [], holo = new THREE.Group(); holo.position.set(0, 1.95, 1.55); scene.add(holo);
  for (let i = 0; i < 6; i++) { const m = mat(0xff3355, 0.3, 0.2, { emissive: 0xff3355, emissiveIntensity: 1.4 }); const f = mesh(new THREE.BoxGeometry(0.14, 0.18, 0.02), m); f.castShadow = false; holo.add(f); files.push({ f, m, a: i / 6 * 6.283 }); }
  const rg = mesh(new THREE.TorusGeometry(0.42, 0.006, 8, 64), mat(0, 1, 0, { emissive: 0x19e6ff, emissiveIntensity: 3 })); rg.rotation.x = Math.PI / 2; rg.castShadow = false; holo.add(rg);

  // lights: cyan screen glow (casts shadows on the hacker), magenta rim, cool key
  scene.add(new THREE.HemisphereLight(0x2a3a7a, 0x0a0a12, 0.5));
  const s1 = new THREE.PointLight(0x19e6ff, 14, 7, 1.6); s1.position.set(-0.2, 1.4, 1.2); s1.castShadow = true; s1.shadow.mapSize.set(1024, 1024); s1.shadow.bias = -0.0008; scene.add(s1);
  const rim = new THREE.SpotLight(0xff2d95, 30, 12, 0.7, 0.6, 1.4); rim.position.set(-2.6, 3.2, -2.2); rim.target.position.set(0, 1.3, 0.3); rim.castShadow = true; rim.shadow.mapSize.set(1024, 1024); rim.shadow.bias = -0.0004; scene.add(rim, rim.target);
  const key = new THREE.SpotLight(0x6c8bff, 70, 10, 0.8, 0.8, 1.5); key.position.set(2.8, 3.4, -1.5); key.target.position.set(0, 1.2, 1); scene.add(key, key.target);

  // live screens
  const HEX = "0123456789abcdef", rnd = n => Array.from({ length: n }, () => HEX[Math.random() * 16 | 0]).join("");
  const log = [], names = ["report.pdf", "photos.zip", "notes.docx", "backup.db", "keys.txt", "match.raw"];
  let prog = 0, fileIdx = 0, locked = 0; const lockedEl = $("#locked");
  const code = ["from cryptography.hazmat import AESGCM", "key = scrypt(pw, salt, n=2**15)", "nonce = os.urandom(12)", "ct = AESGCM(key).encrypt(nonce, data, aad)", "open(f + '.enc','wb').write(nonce+ct)", "wipe(key); verify(tag)  # authenticated"];
  function draw(t) {
    const [A, B] = mons, a = A.ctx, b = B.ctx;
    a.fillStyle = "#04110f"; a.fillRect(0, 0, 640, 400); a.font = "17px monospace"; a.fillStyle = "#00ff9d";
    a.fillText("vault-crypt v1.0  [authorized lab]", 12, 24); a.fillStyle = "#19e6ff"; a.fillText("AES-256-GCM · scrypt · tag OK", 12, 46);
    a.fillStyle = "#7dffc9"; log.slice(-11).forEach((l, i) => a.fillText(l, 12, 80 + i * 23));
    a.strokeStyle = "#00ff9d"; a.strokeRect(12, 346, 616, 30); a.fillStyle = "#00ff9d"; a.fillRect(14, 348, 612 * prog, 26);
    a.fillStyle = "#04110f"; a.fillText(`${names[fileIdx]}  ${prog * 100 | 0}%`, 22, 367); A.t.needsUpdate = true;
    b.fillStyle = "#0a0716"; b.fillRect(0, 0, 640, 400); b.font = "15px monospace";
    code.forEach((l, i) => { b.fillStyle = i % 2 ? "#ff77c8" : "#a99cff"; b.fillText(String(i + 1).padStart(2, "0") + "  " + l, 10, 26 + i * 22); });
    for (let i = 0; i < 10; i++) { b.fillStyle = `rgba(25,230,255,${0.9 - i * 0.07})`; b.fillText(((t * 1000 + i * 16 | 0) % 65535).toString(16).padStart(4, "0") + "  " + rnd(8) + " " + rnd(8) + " " + rnd(8) + " " + rnd(8), 10, 190 + i * 20); }
    B.t.needsUpdate = true;
  }
  let last = 0, tick = 0;
  S.update = t => {
    const T = reduced ? 2 : t, ty = T * 11;
    hd.head.rotation.set(0.12 + Math.sin(T * 0.8) * 0.02, Math.sin(T * 0.5) * 0.15, 0); hd.torso.rotation.x = 0.15;
    // fingers on the keyboard: IK to world-space key positions, alternating taps
    hk.updateMatrixWorld(true);
    for (const [k, s, pole, ph] of [["L", 1, poleKL, 0], ["R", -1, poleKR, 1.7]]) {
      keyW.set(s * 0.13, 0.84 + Math.max(0, Math.sin(ty + ph)) * 0.02, 1.13);
      reach(hd, k, hd.torso.worldToLocal(keyT.copy(keyW)), pole);
    }
    holo.rotation.y = T * 0.5;
    files.forEach((o, i) => {
      const a = o.a + T * 0.9; o.f.position.set(Math.cos(a) * 0.42, Math.sin(T * 1.5 + i) * 0.04, Math.sin(a) * 0.42); o.f.rotation.y = -a;
      const c = (i + 0.5) / 6 < (fileIdx + prog) / 6 ? 0x00ff9d : 0xff3355; o.m.color.setHex(c); o.m.emissive.setHex(c);
    });
    s1.intensity = 14 + Math.sin(T * 9) * 0.8 + Math.sin(T * 23) * 0.5;
    leds.forEach((l, i) => l.material.emissiveIntensity = Math.sin(T * (3 + i) + i) > 0 ? 3 : 0.2);
    if (T - last > 0.09) {
      last = T; prog += 0.018 + Math.random() * 0.012;
      if (tick++ % 2 === 0) log.push(`> block ${rnd(6)} -> ${rnd(10)}`);
      if (prog >= 1) { prog = 0; locked++; lockedEl.textContent = locked; log.push(`[OK] ${names[fileIdx]}.enc sealed`); fileIdx = (fileIdx + 1) % names.length; log.push(`> deriving key for ${names[fileIdx]}...`); }
      draw(T);
    }
  };
  draw(0);
  return S;
}

/* ---------- boot ---------- */
try {
  const scenes = [football(), hacker()], clock = new THREE.Clock();
  let on = false;
  const loop = () => { if (!on) return; const t = clock.getElapsedTime(); scenes.forEach(s => s.visible && s.frame(t)); requestAnimationFrame(loop); };
  const sync = () => { const want = !document.hidden && scenes.some(s => s.visible); if (want && !on) { on = true; requestAnimationFrame(loop); } else if (!want) on = false; };
  scenes.forEach(s => new IntersectionObserver(sync).observe(s.r.domElement));
  document.addEventListener("visibilitychange", sync);
  if (reduced) scenes.forEach(s => s.frame(0));
} catch (e) { console.warn("3D disabled:", e); $("#studio").hidden = true; }
