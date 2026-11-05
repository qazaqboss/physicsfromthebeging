FIG.lens = (el, num) => {
  const { S, L, D } = Lab;
  const W = 660, H = 400;
  const X0 = -186, X1 = 186, RZ = 24, CM = 3, FOC = 10;
  const XL = 46, AXZ = 62, HOBJ = 13;
  const SCR_MIN = X0 + 12;
  const P = k.fitProjection([[X0 - 8, -34, -2], [X1 + 8, 34, -2], [X0, 0, AXZ + 44], [X1, 0, AXZ + 30]], W, H, { pad: 18, azimuth: 64 });
  const at = (p) => k.iso(p, P);
  const RAY = "#f0a020";

  function bench() {
    const out = [];
    for (const x of [X0 + 34, X1 - 34]) {
      const foot = { x: x - 9, y: -32, w: 18, d: 64, r: 3 };
      out.push(`<path class="iso-halo" d="${k.haloOf(foot, 0, 2, P)}"/>`);
      for (const y of [-26, 26]) out.push(S(k.cylinder(x, y, 5, 0, 3, P, 24), { tone: "lo" }));
      out.push(S(k.slabOf(foot, 3, 8, P, 4, 0.6), { tone: "mid" }));
      out.push(S(k.slabOf({ x: x - 6, y: -10, w: 12, d: 20, r: 2 }, 11, RZ - 10 - 11, P, 3, 0.5), { tone: "mid" }));
      out.push(Lab.screwDots(P, [[x, -26, 11], [x, 26, 11]]));
    }
    const rail = { x: X0, y: -8, w: X1 - X0, d: 16, r: 1.5 };
    out.push(S(k.slabOf(rail, RZ - 10, 10, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(rail, RZ - 4, P, 3), { tone: "faint" }) }));
    const strip = { x: X0 + 6, y: 3, w: X1 - X0 - 12, d: 5, r: 0.8 };
    out.push(S(k.slabOf(strip, RZ, 0.5, P, 2), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.x + 2, strip.x + strip.w - 2, CM, 5, strip.y + 0.5, RZ + 0.5, [1.6, 3.2], P);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    out.push(S(k.slabOf({ x: X0 - 6, y: -10, w: 6, d: 20, r: 1.2 }, RZ - 12, 16, P, 3, 0.5), { tone: "mid" }), S(k.slabOf({ x: X1, y: -10, w: 6, d: 20, r: 1.2 }, RZ - 12, 16, P, 3, 0.5), { tone: "mid" }));
    return out.join("");
  }

  function rider(x, lit) {
    return [
      S(k.slabOf({ x: x - 9, y: -11, w: 18, d: 22, r: 2 }, RZ - 4, 10, P, 3, 0.6), { tone: "mid", lit }),
      Lab.knob(P, x + 5, 15, 2.6, RZ - 1, 3, 0.1),
      S(k.cylinder(x, 0, 4.5, RZ + 6, 3, P, 24), { tone: "mid" }),
    ].join("");
  }

  function lens() {
    const out = [rider(XL)];
    out.push(S(k.cylinder(XL, 0, 2.4, RZ + 9, AXZ - 21 - RZ - 9, P, 18), { tone: "mid", crease: "none" }));
    const F = G.frameAlong([XL - 3, 0, AXZ], [1, 0, 0]);
    out.push(S(G.ringBand(0, 6, 17.4, 21, F, P), { tone: "mid" }));
    const prof = [];
    for (let i = 0; i <= 12; i++) {
      const r = 17.6 * (1 - i / 12);
      const s = 3 + 2.6 * Math.sqrt(Math.max(0, 1 - (r / 17.6) ** 2)) + (i === 12 ? 0 : 0);
      prof.push([s, Math.max(r, 0.01), 1]);
    }
    const front = [[3, 17.6], ...prof.slice(1)];
    out.push(S(G.lathe(front.map(([s, r], i) => [s, r, i > 0 && i < front.length - 1 ? 1 : 0]), F, P), { tone: "hi", lit: true }));
    out.push(D(G.dotsOf(F, 6, 19.2, 10, P), { size: 0.45 }));
    return out.join("");
  }

  function flamePath(base3, h, w) {
    const [bx, by] = at(base3);
    const hh = k.screenRise(h, P);
    const f = (v) => v.toFixed(1);
    return `M${f(bx)} ${f(by)}C${f(bx - w * 1.15)} ${f(by - hh * 0.05)} ${f(bx - w * 0.75)} ${f(by - hh * 0.55)} ${f(bx)} ${f(by - hh)}C${f(bx + w * 0.75)} ${f(by - hh * 0.55)} ${f(bx + w * 1.15)} ${f(by - hh * 0.05)} ${f(bx)} ${f(by)}Z`;
  }

  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Оптическая скамья: свеча на рейтере, собирающая линза с фокусным расстоянием 10 см и экран, на котором появляется перевёрнутое изображение пламени.",
    body: [bench(), `<g data-part="screen"></g>`, `<g data-part="rays-back"></g>`, lens(), `<g data-part="rays-front"></g>`, `<g data-part="candle"></g>`],
  });

  const ui = Lab.card(el, {
    fig: `Fig ${num}`,
    title: "Оптическая скамья",
    hint: "Двигайте свечу вдоль скамьи",
    readout: "",
    keys: [
      { mark: "lit", label: "Линза, F = 10 см" },
      { mark: "red", label: "Три характерных луча" },
    ],
    caption: "Шкала скамьи в сантиметрах. Луч, параллельный оси, после линзы проходит через фокус; луч через центр линзы не преломляется. Там, где лучи сходятся, экран ловит резкое перевёрнутое изображение.",
    svg,
    controls: Lab.range("d", "Свеча d", { min: 5, max: 40, step: 0.5, value: 25, unit: "см" }),
  });

  const defs = `<defs><radialGradient id="flame-${num}"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset=".4" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient><filter id="soft-${num}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur data-blur stdDeviation="0"/></filter></defs>`;
  ui.svg.insertAdjacentHTML("afterbegin", defs);
  const blur = ui.svg.querySelector("[data-blur]");
  const gScreen = ui.part("screen"), gBack = ui.part("rays-back"), gFront = ui.part("rays-front"), gCandle = ui.part("candle");
  let target = 25;
  const st = { d: 25, xs: XL - 3 * ((FOC * 25) / 15), tour: true, tourT: 0, flick: 0, img: 0, dt: 0 };

  function draw() {
    const d = st.d;
    const xc = XL + d * CM;
    const real = d > FOC + 0.05;
    const f = real ? (FOC * d) / (d - FOC) : (FOC * d) / (d - FOC);
    const ximg = XL - f * CM;
    const want = real ? Math.max(SCR_MIN, ximg) : SCR_MIN;
    const xs = st.xs;
    const tip = [xc, 0, AXZ + HOBJ];
    const gamma = -f / d;
    const imgTip = [ximg, 0, AXZ + HOBJ * gamma];
    if (!st.parts) {
      const scr = { x: -1.2, y: -26, w: 2.4, d: 52, r: 0.6 };
      const cz0 = RZ + 9, cz1 = AXZ + 2;
      gScreen.innerHTML = `<g>${rider(0) + S(k.cylinder(0, 0, 2.2, RZ + 9, 14, P, 16), { tone: "mid", crease: "none" }) + S(k.slabOf(scr, RZ + 23, 72, P, 2, 0.3), { tone: "hi", crease: "lo" })}</g><g></g>`;
      gCandle.innerHTML = `<g>${rider(0, true) + S(k.cylinder(0, 0, 6, cz0, 3, P, 28), { tone: "mid" }) + S(k.cylinder(0, 0, 3.6, cz0 + 3, cz1 - cz0 - 3, P, 24), { tone: "hi", lit: true, crease: "none" }) + L(k.segment([0, 0, cz1], [0, 0, cz1 + 2.4], P), { tone: "hi" })}</g><g></g>`;
      st.parts = { scrBody: gScreen.firstChild, scrImg: gScreen.lastChild, cBody: gCandle.firstChild, cFlame: gCandle.lastChild };
    }
    st.parts.scrBody.setAttribute("transform", k.translateAlong(P, [xs, 0, 0]));
    st.parts.cBody.setAttribute("transform", k.translateAlong(P, [xc, 0, 0]));
    let screen = "";
    const defocus = Math.abs(xs - ximg) / CM;
    const sharp = real ? Math.max(0, 1 - defocus / 14) : 0;
    const fits = Math.max(0, Math.min(1, (42 - Math.abs(gamma) * HOBJ) / 14));
    st.img = Lab.follow(st.img, real ? fits : 0, st.dt, 0.25, STILL.matches);
    if (real && st.img > 0.01) {
      const sc = gamma * ((xs - XL) / (ximg - XL));
      const zBase = AXZ + sc * 2, zTip = AXZ + sc * HOBJ;
      const fl = flamePath([xs + 1.3, 0, zBase], zTip - zBase, 2.4 * Math.max(0.4, Math.min(3, Math.abs(sc))));
      const ctr = at([xs + 1.3, 0, (zBase + zTip) / 2]);
      const sd = (defocus * 0.5).toFixed(1);
      if (st.sd !== sd) {
        blur.setAttribute("stdDeviation", sd);
        st.sd = sd;
      }
      screen += `<g${defocus > 0.25 ? ` filter="url(#soft-${num})"` : ""} opacity="${((0.25 + 0.75 * sharp) * st.img).toFixed(3)}"><circle cx="${ctr[0].toFixed(1)}" cy="${ctr[1].toFixed(1)}" r="${(8 * Math.max(0.6, Math.abs(gamma))).toFixed(1)}" fill="url(#flame-${num})"/><path d="${fl}" fill="#ffb347" fill-opacity=".85" stroke="#e07a10" stroke-width=".6"/></g>`;
    }
    st.parts.scrImg.innerHTML = screen;
    const lensTop = [XL, 0, AXZ + HOBJ];
    const lensMid = [XL, 0, AXZ];
    const lensFoc = [XL, 0, AXZ + (HOBJ * FOC) / (FOC - d)];
    const rays = [[tip, lensTop], [tip, lensMid], [tip, lensFoc]];
    const opOf = (b) => Math.max(0, Math.min(1, (19 - Math.abs(b[2] - AXZ)) / 5));
    const after = rays.map(([a, b]) => {
      let dir;
      if (b === lensTop) dir = [-FOC * CM, 0, -HOBJ];
      else if (b === lensMid) dir = [b[0] - a[0], 0, b[2] - a[2]];
      else dir = [-1, 0, 0];
      const tx = (xs - b[0]) / dir[0];
      return [b, [b[0] + dir[0] * tx, 0, b[2] + dir[2] * tx]];
    });
    const ray = ([a, b], op) => (op < 0.01 ? "" : `<path d="${k.segment(a, b, P)}" fill="none" stroke="${RAY}" stroke-width="1" stroke-linecap="round" opacity="${(0.9 * op).toFixed(3)}"/>`);
    gFront.innerHTML = rays.map((r) => ray(r, opOf(r[1]))).join("");
    gBack.innerHTML = after.map((r) => ray(r, opOf(r[0]))).join("") + after.map(([b, e]) => (opOf(b) > 0.01 ? `<g opacity="${opOf(b).toFixed(3)}">${D([at(e)], { size: 0.8, tone: "hi" })}</g>` : "")).join("");
    const cz1 = AXZ + 2;
    st.flick += st.dt * 4.2;
    const wob = 1 + 0.06 * Math.sin(st.flick * 7) + 0.04 * Math.sin(st.flick * 13);
    const fc = at([xc, 0, AXZ + 6]);
    st.parts.cFlame.innerHTML = `<circle cx="${fc[0].toFixed(1)}" cy="${fc[1].toFixed(1)}" r="18" fill="url(#flame-${num})"/>` +
      `<path d="${flamePath([xc, 0, cz1 + 1.4], (AXZ + HOBJ - cz1 - 1.4) * wob, 2.6)}" fill="#ffb347" fill-opacity=".9" stroke="#e07a10" stroke-width=".7"/>`;
    const kind = !real ? "мнимое, прямое — экран пуст" : `${Math.abs(gamma) > 1.02 ? "увеличенное" : Math.abs(gamma) < 0.98 ? "уменьшенное" : "равное"}, перевёрнутое`;
    const fText = real ? (ximg < SCR_MIN ? `f = ${fmt(f, 1)} см (за скамьёй)` : `f = ${fmt(f, 1)} см`) : `f = ${fmt(f, 1)} см`;
    ui.say(`d = ${fmt(d, 1)} см · ${fText} · Γ = ${fmt(Math.abs(gamma), 2)} · ${kind}`);
    return want;
  }

  const resume = Lab.idle(9000, () => {
    st.tour = true;
    st.tourT = 0;
  });
  const loop = Lab.loop(ui.stage, (dt, calm) => {
    if (st.tour && !calm) {
      st.tourT += dt;
      target = [30, 20, 15, 13, 7, 25][Math.floor(st.tourT / 3.6) % 6];
      ui.control("d").value = String(st.d);
      ui.root.querySelector('[data-out="d"]').textContent = `${fmt(st.d, 1)} см`;
    }
    st.d = Lab.follow(st.d, target, dt, 0.6, calm);
    st.dt = dt;
    const want = draw();
    st.xs = Lab.follow(st.xs, want, dt, 0.55, calm);
    return true;
  });
  Lab.bindRange(ui, "d", (v) => {
    target = v;
    loop.run();
  }, (v) => `${fmt(v, 1)} см`);
  ui.control("d").addEventListener("input", () => {
    st.tour = false;
    resume();
  });
  draw();
};
