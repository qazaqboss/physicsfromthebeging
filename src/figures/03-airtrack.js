FIG.airtrack = (el, num) => {
  const { S, L, D } = Lab;
  const W = 640, H = 500;
  const TOP = { x: -176, y: -46, w: 306, d: 92, r: 4 };
  const FLOOR = -118, TZ = 30, TX0 = -160, TX1 = 112;
  const PUL = [138, 0, 26], PR = 6;
  const M = 0.2, UNIT = 0.005;
  const X_START = -120, TRAVEL = 0.5;
  const P = k.fitProjection([...k.boxCorners(TOP, FLOOR, TZ + 22), [150, 0, FLOOR]], W, H, { pad: 14, azimuth: 62 });
  const at = (p) => k.iso(p, P);
  let mass = 0.02;

  function table() {
    const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(TOP, 6), FLOOR, 2, P)}"/>`];
    const legs = Lab.byDepth(k.corners(TOP, 10), P);
    legs.forEach(([x, y]) => {
      out.push(S(k.slabOf({ x: x - 4, y: y - 4, w: 8, d: 8, r: 1 }, FLOOR, -12 - FLOOR, P, 2, 0.4), { tone: "mid" }));
      out.push(S(k.slabOf({ x: x - 5, y: y - 5, w: 10, d: 10, r: 1.5 }, FLOOR, 3, P, 2), { tone: "lo" }));
    });
    const shelf = k.insetPlan(TOP, 6);
    out.splice(3, 0, S(k.slabOf({ ...shelf, r: 2 }, FLOOR + 30, 3, P, 3, 0.4), { tone: "lo" }));
    out.push(S(k.slabOf(TOP, -12, 12, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(TOP, -4, P, 4), { tone: "faint" }) }));
    out.push(L(k.planOutline(k.insetPlan(TOP, 4), 0, P, 3), { tone: "faint" }));
    out.push(Lab.labelPlate(P, { x: -40, y: TOP.y + TOP.d - 18, w: 36, d: 13 }));
    const strip = { x: TX0 + 12, y: 10.5, w: 250, d: 6, r: 1 };
    out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.6, 0.6, [1.8, 3.4], P);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    return out.join("");
  }

  function track() {
    const out = [];
    for (const x of [TX0 + 24, TX1 - 30]) {
      out.push(S(k.slabOf({ x: x - 10, y: -9, w: 20, d: 18, r: 2 }, 0, 4, P, 3, 0.5), { tone: "mid" }));
      out.push(S(k.slabOf({ x: x - 4, y: -4, w: 8, d: 8, r: 1 }, 4, TZ - 10 - 4, P, 2), { tone: "mid" }));
      for (const y of [-6, 6]) out.push(Lab.knob(P, x - 7, y, 2, 0, 3, 0.2));
    }
    const beam = { x: TX0, y: -7, w: TX1 - TX0, d: 14, r: 1.2 };
    out.push(S(k.slabOf({ ...beam, y: -4, d: 8 }, TZ - 10, 4, P, 2), { tone: "lo" }));
    out.push(S(k.slabOf(beam, TZ - 6, 6, P, 3, 0.6), { tone: "hi", crease: "lo" }));
    const holes = k.dotGrid(TX0 + 8, -4, 64, 3, 4, TZ, P);
    out.push(D(holes, { size: 0.32, tone: "lo" }));
    out.push(S(k.slabOf({ x: TX0 - 6, y: -9, w: 6, d: 18, r: 1.2 }, TZ - 10, 16, P, 3, 0.5), { tone: "mid" }));
    out.push(S(k.slabOf({ x: TX0 - 16, y: -10, w: 10, d: 20, r: 2 }, 0, 16, P, 3, 0.5), { tone: "mid" }));
    out.push(S(k.cylinder(TX0 - 11, 0, 3.4, 16, 6, P, 20), { tone: "mid" }));
    out.push(S(k.slabOf({ x: TX1, y: -9, w: 5, d: 18, r: 1.2 }, TZ - 10, 16, P, 3, 0.5), { tone: "mid" }));
    out.push(Lab.screwDots(P, [[TX1 + 2.5, -6, TZ + 6], [TX1 + 2.5, 6, TZ + 6], [TX0 - 3, -6, TZ + 6], [TX0 - 3, 6, TZ + 6]]));
    return out.join("");
  }

  function pulleyBack() {
    const out = [];
    out.push(S(k.slabOf({ x: 124, y: -8, w: 10, d: 16, r: 1.2 }, -18, 22, P, 2, 0.4), { tone: "mid" }));
    out.push(S(k.slabOf({ x: 130, y: -8, w: 4, d: 3, r: 0.8 }, 4, PUL[2] - 4 + 2, P, 2), { tone: "mid" }));
    return out.join("");
  }
  function pulleyFront(turn) {
    const F = G.frameAlong([PUL[0], -4.8, PUL[2]], [0, 1, 0]);
    const out = [];
    out.push(S(G.disc(0, 1.6, PR, F, P), { tone: "hi", crease: "none" }));
    out.push(S(G.disc(1.6, 3.4, PR - 1.2, F, P), { tone: "hi", crease: "none" }));
    out.push(S(G.disc(3.4, 5, PR, F, P), { tone: "hi", crease: "none" }));
    out.push(L(G.spokesOf(F, 5, 1.6, PR - 1.2, 4, P, { phase: turn }), { tone: "lo" }));
    out.push(S(G.disc(5, 6.4, 1.4, F, P), { tone: "mid" }));
    out.push(S(k.slabOf({ x: 130, y: 5, w: 4, d: 3, r: 0.8 }, 4, PUL[2] - 4 + 2, P, 2), { tone: "mid" }));
    out.push(S(k.slabOf({ x: 132, y: -9, w: 4, d: 18, r: 1 }, -26, 8, P, 2), { tone: "mid" }));
    out.push(Lab.knob(P, 134, 0, 3, -32, 4, 0.3));
    return out.join("");
  }

  function glider(lit) {
    const out = [];
    for (const y of [-11, 8]) out.push(S(k.slabOf({ x: -15, y, w: 30, d: 3, r: 0.8 }, TZ - 7, 8, P, 2, 0.3), { tone: "mid", lit }));
    out.push(S(k.slabOf({ x: -16, y: -11, w: 32, d: 22, r: 2 }, TZ + 0.6, 2.4, P, 3, 0.4), { tone: "hi", lit }));
    out.push(S(k.slabOf({ x: -9, y: -6, w: 18, d: 12, r: 1.4 }, TZ + 3, 4, P, 3, 0.4), { tone: "hi", lit }));
    out.push(S(k.slabOf({ x: -1, y: -6, w: 2, d: 12, r: 0.4 }, TZ + 7, 11, P, 2), { tone: "hi", lit }));
    out.push(S(k.slabOf({ x: 15, y: -1.2, w: 3, d: 2.4, r: 0.6 }, TZ + 1, 3, P, 2), { tone: "mid" }));
    out.push(Lab.screwDots(P, [[-12, -8, TZ + 3], [12, -8, TZ + 3], [-12, 8, TZ + 3], [12, 8, TZ + 3]], 0.4));
    return out.join("");
  }

  function hanger(z, n, lit, dx = 0) {
    const x = PUL[0] + PR + dx;
    const out = [];
    const h = 2.2;
    const z0 = z - 4 - n * h - 2;
    out.push(S(k.cylinder(x, 0, 6, z0, 2, P, 28), { tone: "hi", lit }));
    for (let i = 0; i < n; i++) {
      out.push(S(k.cylinder(x, 0, 5, z0 + 2 + i * h, h - 0.2, P, 28), { tone: "hi", lit, inner: L(k.sideArc(x, 0, 5, z0 + 2 + i * h + h - 0.25, P, 20), { tone: "faint" }) }));
    }
    out.push(S(k.cylinder(x, 0, 0.8, z0 + 2 + n * h, z - (z0 + 2 + n * h), P, 12), { tone: "mid", crease: "none" }));
    out.push(D([at([x, 0, z])], { size: 0.8, tone: "hi" }));
    return out.join("");
  }

  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Воздушный трек на лабораторном столе: каретка тянется нитью через блок, на конце нити висит грузик.",
    body: [table(), `<g data-part="hang"></g>`, pulleyBack(), track(), `<g data-part="marks"></g>`, `<g data-part="string"></g>`, `<g data-part="glider"></g>`, `<g data-part="pulley"></g>`],
  });

  const ui = Lab.card(el, {
    fig: `Fig ${num}`,
    title: "Воздушный трек",
    hint: "Выберите грузик и нажмите пуск",
    readout: "",
    keys: [
      { mark: "lit", label: "Каретка M = 0,2 кг и грузик" },
      { mark: "dotted", label: "Метки каждые 0,1 с" },
    ],
    caption: "Трение убрано воздушной подушкой. Вес грузика m·g разгоняет сразу обе массы, поэтому a = m·g / (M + m). Путь каретки — 0,5 м.",
    svg,
    controls: `<div class="lab-row"><span class="lab-range-label">Грузик</span>${Lab.segmented("mass", [[0.01, "10 г"], [0.02, "20 г"], [0.05, "50 г"], [0.1, "100 г"]], 0.02)}</div>` + Lab.button("go", "Пуск", true),
  });

  const gHang = ui.part("hang"), gMarks = ui.part("marks"), gString = ui.part("string"), gGlider = ui.part("glider"), gPulley = ui.part("pulley");
  const st = { phase: "wait", t: 0, s: 0, tEnd: 0, vHit: 0, from: 0, sway: 0, swayT: 0, fade: 1 };
  const acc = () => (mass * G_ACC) / (M + mass);
  const HOOK_Z = PUL[2] + PR;
  const HANG_TOP = HOOK_Z - 10;
  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * u * (u * (u * 6 - 15) + 10));
  const W_BUMP = 38;

  function draw() {
    const a = acc();
    const x = X_START + st.s / UNIT;
    const tNow = st.phase === "run" ? st.t : st.phase === "wait" ? 0 : st.tEnd;
    gGlider.setAttribute("transform", k.translateAlong(P, [x, 0, 0]));
    if (!gGlider.firstChild) gGlider.innerHTML = glider(true);
    const zHang = HANG_TOP - Math.min(st.s, TRAVEL) / UNIT;
    const n = Math.round(mass / 0.01);
    const sway = st.sway * Math.exp(-st.swayT / 1.4) * Math.sin(2 * Math.PI * 1.1 * st.swayT);
    const dx = sway * Math.min(1, (PUL[2] - zHang) / 60);
    gHang.innerHTML = hanger(zHang, n, true, dx);
    gString.innerHTML = L(k.segment([x + 18, 0, HOOK_Z - 2], [PUL[0], 0, HOOK_Z], P) + k.segment([PUL[0] + PR, 0, PUL[2]], [PUL[0] + PR + dx, 0, zHang], P), { tone: "hi" });
    gPulley.innerHTML = pulleyFront(-(st.s / UNIT) / PR);
    const marks = [];
    for (let tm = 0; tm <= tNow + 1e-6; tm += 0.1) marks.push(at([X_START + (a * tm * tm) / 2 / UNIT, 0, TZ]));
    gMarks.innerHTML = `<g opacity="${st.fade.toFixed(3)}">${D(marks, { size: 1, tone: "hi" })}</g>`;
    const v = a * tNow;
    ui.say(`m = ${Math.round(mass * 1000)} г · a = ${fmt(a)} м/с² · t = ${fmt(tNow)} с · v = ${fmt(v)} м/с`);
  }

  const loop = Lab.loop(ui.stage, (dt, calm) => {
    st.t += dt;
    st.swayT += dt;
    const a = acc();
    if (st.phase === "wait") {
      st.s = 0;
      st.fade = 1;
      if (st.t > 0.9) {
        st.phase = "run";
        st.t = 0;
      }
    } else if (st.phase === "run") {
      st.s = (a * st.t * st.t) / 2;
      if (st.s >= TRAVEL || calm) {
        st.tEnd = Math.sqrt((2 * TRAVEL) / a);
        st.vHit = a * st.tEnd;
        st.s = TRAVEL;
        st.phase = calm ? "done" : "hit";
        st.t = 0;
        st.sway = calm ? 0 : Math.min(6, st.vHit * 5);
        st.swayT = 0;
      }
    } else if (st.phase === "hit") {
      st.s = TRAVEL + (st.vHit / W_BUMP) * 0.35 * Math.exp(-st.t / 0.07) * Math.sin(W_BUMP * st.t);
      if (st.t > 0.5) {
        st.s = TRAVEL;
        st.phase = "done";
        st.t = 0;
      }
    } else if (st.phase === "done") {
      if (st.t > 2.6) {
        st.phase = "back";
        st.t = 0;
        st.from = st.s;
      }
    } else if (st.phase === "back") {
      const u = calm ? 1 : ease(st.t / 1.4);
      st.s = st.from * (1 - u);
      st.fade = 1 - u;
      if (u >= 1) {
        st.s = 0;
        st.phase = "wait";
        st.t = 0;
      }
    }
    draw();
    return true;
  });

  const restart = () => {
    st.phase = "back";
    st.t = 0;
    st.from = st.s;
    loop.run();
  };
  Lab.bindSeg(ui, "mass", (v) => {
    mass = +v;
    restart();
  });
  ui.control("go").addEventListener("click", restart);
  draw();
};
