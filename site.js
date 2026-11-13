(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- ACHIEVEMENTS (toasts + trophy counter) ---------- */
  const ACH = {
    about: "🧭 Explorer: you met Matteo",
    story: "📜 Historian: you read all my story",
    bugs: "🐛 Bug Hunter: all bugs squashed",
    photo: "📸 Photographer: you opened the photo roll",
    terminal: "⌨️ Hacker: you used the terminal",
    quiz: "👑 Boss slayer: 3/3 in the quiz",
    level: "🏁 Speedrunner: level 1-1 clear",
    cyber: "🛡️ Defender: you tried the whole cyber lab",
    end: "🎬 The End: you read until the end",
  };
  const got = new Set();
  function achieve(id) {
    if (got.has(id) || !ACH[id]) return;
    got.add(id);
    $("#trophyCount").textContent = got.size;
    const t = document.createElement("p");
    t.className = "toast px";
    t.textContent = `ACHIEVEMENT! ${ACH[id]}`;
    $("#toasts").append(t);
    setTimeout(() => t.remove(), 4200);
  }
  document.addEventListener("achieve", (e) => achieve(e.detail));

  // sections: animate stat bars + unlock "seen" achievements
  // rootMargin instead of a ratio threshold so very tall sections still trigger
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("seen");
        if (e.target.dataset.ach) achieve(e.target.dataset.ach);
        io.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -12% 0px" },
  );
  $$("main > section, .bonus-head").forEach((s) => io.observe(s));

  /* ---------- START SCREEN + TITLE LETTERS ---------- */
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const h1 = $(".title h1");
  h1.setAttribute("aria-label", h1.textContent.replace(/\s+/g, " ").trim());
  let n = 0;
  (function split(node) {
    [...node.childNodes].forEach((ch) => {
      if (ch.nodeType === 1) return split(ch);
      if (ch.nodeType !== 3 || !ch.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      [...ch.textContent].forEach((l) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.setAttribute("aria-hidden", "true");
        s.style.setProperty("--i", n++);
        s.textContent = l;
        frag.append(s);
      });
      ch.replaceWith(frag);
    });
  })(h1);

  const start = $("#start");
  const begin = () => {
    if (start.classList.contains("bye")) return;
    start.classList.add("bye");
    document.body.classList.add("started");
    removeEventListener("keydown", begin);
    setTimeout(() => start.remove(), reduced ? 0 : 700);
  };
  start.addEventListener("click", begin);
  addEventListener("keydown", begin);
  $("#startBtn").focus({ preventScroll: true });

  /* ---------- COINS: every click gives a pixel coin ---------- */
  document.addEventListener("click", (e) => {
    if (
      reduced ||
      !e.target.closest(
        ".pbtn, .bug, .stat, summary, .hero-btn, .roadmap label",
      )
    )
      return;
    const c = document.createElement("span");
    c.className = "coin-pop px";
    c.textContent = "+1";
    c.style.left = `${e.clientX}px`;
    c.style.top = `${e.clientY}px`;
    document.body.append(c);
    setTimeout(() => c.remove(), 800);
  });
  function burst(el) {
    if (reduced) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const p = document.createElement("i");
      const a = (i / 10) * Math.PI * 2;
      p.className = "bit";
      p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;--dx:${Math.cos(a) * 90}px;--dy:${Math.sin(a) * 70}px;background:${["#ffec27", "#00e436", "#ff004d", "#29adff"][i % 4]}`;
      document.body.append(p);
      setTimeout(() => p.remove(), 600);
    }
    const sec = el.closest("section");
    sec.classList.remove("shake");
    void sec.offsetWidth;
    sec.classList.add("shake");
  }

  /* ---------- B7: run matteo.js in the fake console ---------- */
  const runBtn = $("#runCode"),
    codeOut = $("#codeOut");
  const OUT = [
    "$ node matteo.js",
    "✓ Loaded profile: Matteo Buccudu",
    "♥ Loves: Computing",
    "★ Skills: Cybersecurity · Photography",
    "☺ Mindset: Curious, patient, creative",
    "» Two passions, one goal: create something great.",
  ];
  runBtn.addEventListener("click", () => {
    runBtn.disabled = true;
    codeOut.textContent = "";
    OUT.forEach((t, i) =>
      setTimeout(
        () => {
          const l = document.createElement("span");
          l.textContent = t;
          if (!i) l.className = "c";
          codeOut.append(l);
          if (i === OUT.length - 1) {
            runBtn.disabled = false;
            burst(runBtn);
          }
        },
        reduced ? 0 : i * 280,
      ),
    );
  });

  // XP bar = how far you scrolled
  const xp = $("#xpBar");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    xp.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- HERO: click the pixel character ---------- */
  const LINES = [
    "Hi! I'm Matteo's pixel hero.",
    "Scroll down to meet Matteo!",
    "I love cybersecurity and photos.",
    "Have you squashed the bugs?",
    'Try the terminal: type "joke".',
    "Ouch! That tickles.",
  ];
  let li = 0;
  $("#heroBtn").onclick = () => {
    const b = $("#heroBtn");
    b.classList.remove("jump");
    void b.offsetWidth;
    b.classList.add("jump");
    $("#bubble").textContent = LINES[li++ % LINES.length];
  };

  /* ---------- HERO: favourite game question ---------- */
  const FAV = {
    football: "⚽ Cool! My answer is different: the computer.",
    games: "🎮 Nice! For me, the best game is the computer.",
    pc: "💻 Me too! That's why this website looks like a video game.",
  };
  $$("[data-fav]").forEach(
    (b) =>
      (b.onclick = () => {
        $("#favOut").textContent = FAV[b.dataset.fav];
      }),
  );

  /* ---------- ABOUT: flip the stat cards ---------- */
  $$(".stat[data-alt]").forEach((s) => {
    const span = s.querySelector("span"),
      orig = span.textContent;
    s.onclick = () => {
      span.textContent = span.textContent === orig ? s.dataset.alt : orig;
      s.classList.toggle("flip");
    };
  });

  /* ---------- STORY: open all levels ---------- */
  const levels = $$(".timeline details");
  levels.forEach((d) =>
    d.addEventListener("toggle", () => {
      if (d.open) d.dataset.read = 1;
      if (levels.every((x) => x.dataset.read)) achieve("story");
    }),
  );

  /* ---------- BUGS: squash them ---------- */
  const bugs = $$(".bug");
  $("#bugTotal").textContent = bugs.length;
  bugs.forEach((b) => {
    b.setAttribute("aria-pressed", "false");
    b.onclick = () => {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on);
      if (on) burst(b);
      const n = bugs.filter(
        (x) => x.getAttribute("aria-pressed") === "true",
      ).length;
      $("#squashed").textContent = n;
      if (n === bugs.length) achieve("bugs");
    };
  });

  /* ---------- TERMINAL ---------- */
  const out = $("#out"),
    cmdIn = $("#cmdIn");
  const JOKES = [
    "Why do programmers prefer dark mode? Because light attracts bugs!",
    "There are 10 types of people: people who understand binary, and people who don't.",
    "Why did the photographer go to prison? Because he was framed!",
    "I told my camera a joke. It didn't get the focus.",
    'A programmer goes shopping. "Buy one milk. If they have eggs, buy six." He comes home with six milks.',
  ];
  const CMDS = {
    help: () =>
      "Commands: about, skills, scan, bugs, photo, joke, coffee, hello, sudo, clear",
    about: () =>
      "Matteo Buccudu. Loves computers, cybersecurity and photos.\nMindset: curious, patient, creative.",
    skills: () =>
      "Cybersecurity [#######...] 75%\nPhotography   [########..] 80%\nCuriosity     [#########.] 95%",
    scan: () =>
      "Scanning matteo.exe...\n0 viruses found.\n1 known bug: camera always on.",
    bugs: () => "8 known bugs. 0 fixed.\nIt's not a bug, it's a feature.",
    photo: () =>
      `Click! Saved as photo_${1000 + Math.floor(Math.random() * 9000)}.jpg`,
    joke: () => pick(JOKES),
    coffee: () => "Brewing... ☕ Energy +50%. Sleep resistance +10%.",
    hello: () => "Hello, World!",
    sudo: () => "Nice try! Permission denied. Good security! 🔐",
  };
  function run(raw) {
    const c = raw.trim().toLowerCase();
    if (!c) return;
    if (c === "clear") {
      out.textContent = "";
      return;
    }
    const key = c.split(" ")[0];
    out.textContent += `\n$ ${c}\n${CMDS[key] ? CMDS[key]() : `command not found: ${key}. Try "help".`}\n`;
    out.scrollTop = out.scrollHeight;
    achieve("terminal");
  }
  $("#cmd").onsubmit = (e) => {
    e.preventDefault();
    run(cmdIn.value);
    cmdIn.value = "";
  };
  $$("[data-cmd]").forEach((b) => (b.onclick = () => run(b.dataset.cmd)));


  /* ---------- CYBER LAB ---------- */
  const used = new Set();
  const useTool = (t) => { used.add(t); if (used.size === 3) achieve("cyber"); };

  // password lab: strength = length * log2(alphabet size), guessing 10 billion/s
  const COMMON = ["123456", "12345678", "1234", "password", "qwerty", "letmein", "admin", "iloveyou", "abc123", "111111", "matteo"];
  const dur = (s) => s < 1 ? "instantly" : s < 60 ? `${Math.round(s)} seconds` : s < 3600 ? `${Math.round(s / 60)} minutes`
    : s < 86400 ? `${Math.round(s / 3600)} hours` : s < 31557600 ? `${Math.round(s / 86400)} days`
      : s < 31557600e3 ? `${Math.round(s / 31557600)} years` : "centuries";
  const pw = $("#pw");
  pw.addEventListener("input", () => {
    const v = pw.value;
    const has = { len: v.length >= 12, low: /[a-z]/.test(v), up: /[A-Z]/.test(v), num: /\d/.test(v), sym: /[^A-Za-z0-9]/.test(v) };
    $$("#pwChecks li").forEach((li) => li.classList.toggle("ok", has[li.dataset.c]));
    const pool = (has.low ? 26 : 0) + (has.up ? 26 : 0) + (has.num ? 10 : 0) + (has.sym ? 32 : 0);
    const common = COMMON.includes(v.toLowerCase());
    const bits = common || !v ? 0 : v.length * Math.log2(pool);
    const [label, col] = bits < 28 ? ["WEAK", "var(--red)"] : bits < 50 ? ["OK", "var(--orange)"] : bits < 75 ? ["GOOD", "var(--blue)"] : ["STRONG", "var(--green)"];
    $("#pwBar").style.cssText = `--v:${v ? Math.max(8, Math.min(100, bits / 80 * 100)) : 0}%;--c:${col}`;
    $("#pwOut").textContent = !v ? "Waiting for a password..."
      : common ? "TOO COMMON! Hackers try it first. Cracked instantly."
        : `${label}. A fast computer cracks it in: ${dur(2 ** bits / 1e10)}.`;
    if (v) useTool("pw");
  });

  // password generator: crypto randomness, one char of every class guaranteed
  const SETS = { low: "abcdefghijkmnopqrstuvwxyz", up: "ABCDEFGHJKLMNPQRSTUVWXYZ", num: "23456789", sym: "!@#$%^&*()-_=+[]{};:,.?" };
  const FULL = { low: "abcdefghijklmnopqrstuvwxyz", up: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", num: "0123456789", sym: SETS.sym };
  const rnd = (n) => { // uniform 0..n-1 without modulo bias
    const lim = Math.floor(2 ** 32 / n) * n, a = new Uint32Array(1);
    do crypto.getRandomValues(a); while (a[0] >= lim);
    return a[0] % n;
  };
  const gOut = $("#gOut");
  function generate() {
    const sets = Object.entries($("#gAmb").checked ? SETS : FULL).filter(([k]) => k !== "sym" || $("#gSym").checked).map(([, v]) => v);
    const all = sets.join(""), len = +$("#gLen").value;
    const chars = sets.map((s) => s[rnd(s.length)]);
    while (chars.length < len) chars.push(all[rnd(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    gOut.textContent = chars.join("");
    $("#gInfo").textContent = `${Math.round(len * Math.log2(all.length))} bits. A fast computer needs: ${dur(2 ** (len * Math.log2(all.length)) / 1e10)}.`;
    useTool("gen");
  }
  $("#gGo").onclick = generate;
  $("#gLen").addEventListener("input", () => { $("#gLenN").textContent = $("#gLen").value; generate(); });
  ["#gSym", "#gAmb"].forEach((id) => $(id).addEventListener("change", generate));
  $("#gCopy").onclick = async () => {
    if (!/^[^ ]{12,}$/.test(gOut.textContent)) return;
    try { await navigator.clipboard.writeText(gOut.textContent); $("#gCopy").textContent = "Copied ✓"; }
    catch { $("#gCopy").textContent = "Select it by hand"; }
    setTimeout(() => { $("#gCopy").textContent = "Copy"; }, 1500);
  };
  $("#gTest").onclick = () => { pw.value = gOut.textContent.startsWith("Press") ? "" : gOut.textContent; pw.dispatchEvent(new Event("input")); pw.focus(); };
  generate(); used.delete("gen"); // first password is automatic: only a click counts for the trophy

  // phishing detector
  const MAILS = [
    ["support@paypa1-security.com", "URGENT: account locked!", "Click now or we delete your account: paypa1-login.xyz", true, "Fake domain (paypa1, with a number) and fake panic."],
    ["mum@home.it", "Dinner", "Dinner is ready. Come home at 8!", false, "Known sender, normal message, no link, no pressure."],
    ["prize@free-gifts.top", "YOU WON a free phone!", "Send us your password and address to get your prize.", true, "Nobody gives free phones. And nobody needs your password."],
    ["teacher@school.edu", "Homework", "Homework for Monday: page 42 of your book.", false, "Normal school message. No link, no password request."],
    ["billing@netflix-pay.top", "Payment failed", "Update your card in 24h: netflix-pay.top/card", true, "Strange domain, a deadline and a link to a card form."],
  ];
  const ph = $("#phBox");
  let pi = 0, pscore = 0;
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  function mail() {
    ph.replaceChildren();
    if (pi === MAILS.length) {
      ph.append(mk("p", "px result", pscore >= 4 ? `${pscore}/${MAILS.length} · CYBER DETECTIVE! 🕵️` : `${pscore}/${MAILS.length} · Be careful: read twice!`));
      const again = mk("button", "pbtn", "↺ Play again"); again.type = "button";
      again.onclick = () => { pi = pscore = 0; mail(); };
      ph.append(again); useTool("phish"); return;
    }
    const [from, subj, body, bad, why] = MAILS[pi];
    const card = mk("div", "mail");
    card.append(mk("p", "px", `${pi + 1}/${MAILS.length}`), mk("p", "m-from", `From: ${from}`), mk("p", "m-subj", subj), mk("p", "", body));
    const fb = mk("p", "fb"), row = mk("div", "answers");
    [["🎣 Phishing", true], ["✅ Safe", false]].forEach(([t, val]) => {
      const b = mk("button", "pbtn alt", t); b.type = "button";
      b.onclick = () => {
        row.querySelectorAll("button").forEach((x) => x.disabled = true);
        const ok = val === bad; if (ok) pscore++;
        b.classList.add(ok ? "right" : "wrong");
        fb.textContent = `${ok ? "✓ Correct!" : "✗ Not really."} ${why}`;
        const next = mk("button", "pbtn sm", "Next ▶"); next.type = "button";
        next.onclick = () => { pi++; mail(); };
        ph.append(next); next.focus({ preventScroll: true });
      };
      row.append(b);
    });
    ph.append(card, row, fb);
  }
  mail();

  /* ---------- PHOTO ROLL + LIGHTBOX ---------- */
  // Put your real photos in the photos/ folder with these names; until then a placeholder is shown.
  const PHOTOS = [
    { src: "photos/car-1.jpg", cap: "Car photography", k: "car" },
    { src: "photos/sport-2.jpg", cap: "Sport", k: "sport" },
    { src: "photos/city-1.jpg", cap: "Cityscape", k: "city" },
    { src: "photos/car-2.jpg", cap: "Car photography", k: "car" },
    { src: "photos/sport-3.jpg", cap: "Sport", k: "sport" },
    { src: "photos/city-2.jpg", cap: "Cityscape", k: "city" },
  ];
  const ICON = { sport: "⚽", car: "🚗", city: "🏙️" };
  const pic = (p) => {
    const w = mk("div", `pic ph-${p.k}`);
    w.append(mk("span", "ph-ico", ICON[p.k]), mk("span", "px ph-hint", p.src));
    const img = new Image();
    img.alt = p.cap; img.draggable = false;
    img.decoding = "async";
    img.onload = () => { w.classList.add("real"); w.replaceChildren(img); };
    img.src = p.src;
    return w;
  };
  let shown = PHOTOS, cur = 0;
  const lb = $("#lb");
  const gal = $("#gallery");
  function drawGallery(f) {
    shown = PHOTOS.filter((p) => f === "all" || p.k === f);
    gal.className = f === "all" ? "gallery bento" : "gallery";
    gal.replaceChildren(...shown.map((p, i) => {
      const b = mk("button", f === "all" ? `tile b${i + 1}` : "tile"); b.type = "button"; b.dataset.k = p.k;
      b.setAttribute("aria-label", `Open photo: ${p.cap}`);
      b.append(pic(p), mk("span", "px", p.cap));
      b.onclick = () => { cur = i; showPhoto(); if (!lb.open) lb.showModal(); achieve("photo"); };
      return b;
    }));
  }
  function showPhoto() {
    const p = shown[cur];
    $("#lbPic").replaceChildren(pic(p));
    $("#lbCap").textContent = p.cap;
    $("#lbN").textContent = `${cur + 1}/${shown.length}`;
  }
  const step = (d) => { cur = (cur + d + shown.length) % shown.length; showPhoto(); };
  $("#lbPrev").onclick = () => step(-1);
  $("#lbNext").onclick = () => step(1);
  $("#lbClose").onclick = () => lb.close();
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  let sx = null;
  lb.addEventListener("pointerdown", (e) => { sx = e.clientX; });
  lb.addEventListener("pointerup", (e) => {
    if (sx !== null && Math.abs(e.clientX - sx) > 50) step(e.clientX < sx ? 1 : -1);
    sx = null;
  });
  const pressed = (btns, on) => btns.forEach((b) => { const v = b === on; b.classList.toggle("on", v); b.classList.toggle("alt", !v); b.setAttribute("aria-pressed", v); });
  const fTabs = $$("[data-f]");
  fTabs.forEach((b) => b.onclick = () => { pressed(fTabs, b); drawGallery(b.dataset.f); });
  drawGallery("all");

  /* ---------- EXPOSURE LAB + FILTERS ---------- */
  const ISO = [100, 200, 400, 800, 1600, 3200], AP = [1.8, 2.8, 4, 5.6, 8, 11, 16], SH = [1000, 500, 250, 125, 60, 30, 15];
  const BLUR = [0, 0, 0, 1, 4, 10, 20], GRAIN = [0, 0, .05, .15, .3, .5];
  const FLT = {
    none: "grayscale(0)", golden: "sepia(.55) saturate(1.5) hue-rotate(-12deg)", bw: "grayscale(1) contrast(1.25)",
    night: "saturate(.7) hue-rotate(200deg) brightness(.85)", vintage: "sepia(.8) contrast(.9) saturate(.9)", vivid: "saturate(1.8) contrast(1.15)",
  };
  const expo = $("#expo"), iso = $("#iso"), ap = $("#ap"), sh = $("#sh");
  function expoUpdate() {
    const i = ISO[iso.value], n = AP[ap.value], s = SH[sh.value];
    $("#isoV").textContent = i; $("#apV").textContent = `f/${n}`; $("#shV").textContent = `1/${s}`;
    // light ∝ ISO × time / N²; reference (ISO 100, f/4, 1/125) = 1
    const ratio = (i / 100) * (125 / s) * 16 / (n * n);
    expo.style.setProperty("--b", Math.min(2.4, Math.max(.2, ratio ** .6)));
    expo.style.setProperty("--bg", 28 / (n * n));
    expo.style.setProperty("--gr", GRAIN[iso.value]);
    $("#mbBlur").setAttribute("stdDeviation", `${BLUR[sh.value]} 0`);
    $("#expoMsg").textContent = ratio < .45 ? "TOO DARK ▼" : ratio > 2.2 ? "TOO BRIGHT ▲" : "GOOD EXPOSURE ✓";
    $("#expoInfo").replaceChildren(...[
      `ISO ${i}: ${i >= 1600 ? "more noise, more light" : "clean image"}`,
      `f/${n}: ${n <= 2.8 ? "blurry background (bokeh)" : n >= 8 ? "everything is sharp" : "balanced"}`,
      `1/${s}: ${s <= 30 ? "motion blur! Great for panning" : s >= 500 ? "action frozen" : "good for most scenes"}`,
    ].map((t) => mk("li", "", t)));
  }
  [iso, ap, sh].forEach((el) => el.addEventListener("input", expoUpdate));
  const sTabs = $$("[data-scene]");
  sTabs.forEach((b) => b.onclick = () => {
    pressed(sTabs, b);
    expo.className = `expo s-${b.dataset.scene}`;
    $("#expoSub").textContent = b.dataset.scene === "car" ? "🏎️" : "⚽";
  });
  const fl = $$("[data-flt]");
  fl.forEach((b) => b.onclick = () => { pressed(fl, b); expo.style.setProperty("--flt", FLT[b.dataset.flt]); });
  expoUpdate();

  /* ---------- ROADMAP ---------- */
  const boxes = $$(".roadmap input");
  boxes.forEach(
    (b) =>
      (b.onchange = () => {
        const n = boxes.filter((x) => x.checked).length;
        $("#roadBar").style.setProperty("--v", `${(n / boxes.length) * 100}%`);
        $("#roadNum").textContent = `${n}/${boxes.length}`;
      }),
  );

  /* ---------- QUIZ ---------- */
  const QUIZ = [
    [
      "What do I never leave home without?",
      ["My keyboard", "My camera", "My rubber duck"],
      1,
    ],
    ["What is my best quality?", ["Speed", "Curiosity", "Sleep"], 1],
    [
      "What did my first program say?",
      ["Game over", "Good morning", "Hello, World!"],
      2,
    ],
  ];
  const box = $("#quizBox");
  let qi = 0,
    score = 0;
  function ask() {
    box.replaceChildren();
    if (qi === QUIZ.length) {
      const p = document.createElement("p");
      p.className = "px result";
      p.textContent =
        score === QUIZ.length
          ? `${score}/${QUIZ.length} · BOSS DEFEATED! 👑`
          : `${score}/${QUIZ.length} · GAME OVER. Try again!`;
      const again = document.createElement("button");
      again.type = "button";
      again.className = "pbtn";
      again.textContent = "↺ Play again";
      again.onclick = () => {
        qi = score = 0;
        ask();
      };
      box.append(p, again);
      if (score === QUIZ.length) achieve("quiz");
      return;
    }
    const [q, opts, right] = QUIZ[qi];
    const h = document.createElement("p");
    h.className = "q";
    h.textContent = `${qi + 1}/${QUIZ.length} · ${q}`;
    const hp = document.createElement("p");
    hp.className = "px hp";
    hp.textContent = `BOSS HP ${"■".repeat(QUIZ.length - qi)}${"□".repeat(qi)}`;
    const row = document.createElement("div");
    row.className = "answers";
    opts.forEach((o, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pbtn alt";
      b.textContent = o;
      b.onclick = () => {
        row.querySelectorAll("button").forEach((x) => (x.disabled = true));
        b.classList.add(i === right ? "right" : "wrong");
        row.children[right].classList.add("right");
        if (i === right) score++;
        setTimeout(() => {
          qi++;
          ask();
        }, 1100);
      };
      row.append(b);
    });
    box.append(hp, h, row);
  }
  ask();
})();
