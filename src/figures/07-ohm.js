FIG.ohm = (el, num) => {
  const { S, L, D } = Lab;
  const W = 620, H = 440;
  const BOARD = { x: -128, y: -84, w: 256, d: 168, r: 8 };
  const U = 4.5, RL = 5, RMAX = 20;
  const BAT = { x: -108, y: -66, w: 74, d: 28, r: 3 };
  const AMM = { x: -6, y: -70, w: 40, d: 34, r: 3 }, VOL = { x: 64, y: -70, w: 40, d: 34, r: 3 }, MZ = 14;
  const RH = { x0: -96, x1: 22, y: 42, z: 16, r: 7 };
  const LAMP = [84, 30];
  const P = k.fitProjection([...k.boxCorners(BOARD, -17, 0), [LAMP[0], LAMP[1], 52]], W, H, { pad: 22, azimuth: 46 });
  const at = (p) => k.iso(p, P);
  const SLIDE = [RH.x0 + 6, RH.x1 - 6];

  function post(x, y, z, tone = "mid") {
    return S(k.cylinder(x, y, 2.8, z, 2, P, 20), { tone: "mid" }) + S(k.cylinder(x, y, 2, z + 2, 3.2, P, 20), { tone }) + L(k.knurl(x, y, 2, z + 2, z + 5.2, 14, P), { tone: "lo" });
  }

  function battery() {
    const out = [S(k.slabOf(BAT, 0, 7, P, 3, 0.6), { tone: "mid" })];
    const cells = [-92, -71, -50];
    cells.forEach((x) => {
      out.push(S(k.cylinder(x, BAT.y + 14, 8, 7, 30, P, 40), { tone: "hi", inner: L(k.sideArc(x, BAT.y + 14, 8, 30, P, 32), { tone: "faint" }) }));
      out.push(S(k.cylinder(x, BAT.y + 14, 2.6, 37, 1.6, P, 16), { tone: "mid" }));
    });
    out.push(L(k.segment([-90, BAT.y + 14, 38.6], [-77, BAT.y + 14, 37], P) + k.segment([-69, BAT.y + 14, 38.6], [-56, BAT.y + 14, 37], P), { tone: "mid" }));
    out.push(post(BAT.x + 4, BAT.y + BAT.d - 5, 7, "hi"), post(BAT.x + BAT.w - 5, BAT.y + BAT.d - 5, 7, "hi"));
    return out.join("");
  }

  function meter(plan, letter) {
    const cx = plan.x + plan.w / 2, cy = plan.y + plan.d / 2 + 4;
    const out = [S(k.slabOf(plan, 0, MZ, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(plan, 3, P, 4), { tone: "faint" }) })];
    const face = { x: plan.x + 3, y: plan.y + 3, w: plan.w - 6, d: plan.d - 13, r: 2 };
    out.push(S(k.slabOf(face, MZ, 0.6, P, 3), { tone: "hi", crease: "none" }));
    const t = k.radialTicks(cx, cy, 15, 20, 5, MZ + 0.6, [1.4, 3], P, -Math.PI / 3, (Math.PI * 2) / 3);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    out.push(k.faceTextSvg(k.topMatrix([cx, cy - 5], MZ + 0.6, P, "x"), letter, { size: 4.4, tone: "mid", anchor: "middle" }));
    out.push(post(plan.x + 8, plan.y + plan.d - 5, MZ), post(plan.x + plan.w - 8, plan.y + plan.d - 5, MZ));
    return { svg: out.join(""), pivot: [cx, cy] };
  }

  function rheostat() {
    const out = [];
    for (const [x, w] of [[RH.x0 - 10, 10], [RH.x1, 10]]) out.push(S(k.slabOf({ x, y: RH.y - 10, w, d: 20, r: 1.6 }, 0, 34, P, 3, 0.6), { tone: "mid" }));
    const F = G.frameAlong([RH.x0, RH.y, RH.z], [1, 0, 0]);
    out.push(S(G.disc(0, RH.x1 - RH.x0, RH.r, F, P), { tone: "mid", crease: "none" }));
    const c = k.coil(RH.x0 + 2, RH.x1 - 2, [RH.y, RH.z], RH.r + 0.3, 46, "x", P);
    out.push(L(c.front, { tone: "lo" }));
    out.push(S(k.slabOf({ x: RH.x0 - 4, y: RH.y - 1.8, w: RH.x1 - RH.x0 + 8, d: 3.6, r: 0.8 }, 30, 3.6, P, 2, 0.3), { tone: "mid" }));
    out.push(post(RH.x0 - 5, RH.y + 6, 34), post(RH.x1 + 5, RH.y + 6, 34));
    out.push(Lab.screwDots(P, [[RH.x0 - 5, RH.y - 6, 34], [RH.x1 + 5, RH.y - 6, 34]]));
    return out.join("");
  }

  function slider(x) {
    return [
      S(k.slabOf({ x: x - 1, y: RH.y - 1.2, w: 2, d: 2.4, r: 0.4 }, RH.z + RH.r + 0.2, 30 - RH.z - RH.r - 0.2, P, 2), { tone: "hi", lit: true }),
      S(k.slabOf({ x: x - 5, y: RH.y - 5, w: 10, d: 10, r: 1.5 }, 28, 8, P, 3, 0.5), { tone: "hi", lit: true }),
      S(k.cylinder(x, RH.y, 2.6, 36, 6, P, 20), { tone: "hi", lit: true }),
    ].join("");
  }

  function lampBase() {
    const [x, y] = LAMP;
    return [
      S(k.slabOf({ x: x - 16, y: y - 14, w: 32, d: 28, r: 3 }, 0, 6, P, 4, 0.6), { tone: "mid" }),
      S(k.cylinder(x, y, 8, 6, 4, P, 36), { tone: "mid" }),
      S(k.cylinder(x, y, 6.4, 10, 8, P, 36), { tone: "mid", inner: L([12.5, 15].map((z) => k.sideArc(x, y, 6.4, z, P, 28)).join(""), { tone: "lo" }) }),
      post(x - 12, y + 9, 6), post(x + 12, y - 9, 6),
    ].join("");
  }

  const amm = meter(AMM, "A"), vol = meter(VOL, "V");
  const T = {
    batNeg: [BAT.x + 4, BAT.y + BAT.d - 5], batPos: [BAT.x + BAT.w - 5, BAT.y + BAT.d - 5],
    aIn: [AMM.x + 8, AMM.y + AMM.d - 5], aOut: [AMM.x + AMM.w - 8, AMM.y + AMM.d - 5],
    vA: [VOL.x + 8, VOL.y + VOL.d - 5], vB: [VOL.x + VOL.w - 8, VOL.y + VOL.d - 5],
    lA: [LAMP[0] - 12, LAMP[1] + 9], lB: [LAMP[0] + 12, LAMP[1] - 9],
    rEnd: [RH.x0 - 5, RH.y + 6], rRod: [RH.x1 + 5, RH.y + 6],
  };
  const tz = { batNeg: 12.2, batPos: 12.2, aIn: MZ + 5.2, aOut: MZ + 5.2, vA: MZ + 5.2, vB: MZ + 5.2, lA: 11.2, lB: 11.2, rEnd: 39.2, rRod: 39.2 };
  const P3 = (name) => [...T[name], tz[name]];
  const floor = (x, y) => [x, y, 0.4];
  const routes = {
    main: [
      [P3("batPos"), floor(T.batPos[0], -28), floor(T.aIn[0], -28), P3("aIn")],
      [P3("aOut"), floor(T.aOut[0], -24), floor(T.lB[0] + 10, -24), floor(T.lB[0] + 10, T.lB[1]), P3("lB")],
      [P3("lA"), floor(T.lA[0], 62), floor(T.rRod[0] + 4, 62), floor(T.rRod[0] + 4, T.rRod[1]), P3("rRod")],
      [P3("rEnd"), floor(T.rEnd[0] - 10, T.rEnd[1]), floor(T.rEnd[0] - 10, -24), floor(T.batNeg[0], -24), P3("batNeg")],
    ],
    volt: [
      [P3("vA"), floor(T.vA[0], -18), floor(T.lA[0] - 6, -18), floor(T.lA[0] - 6, T.lA[1] + 4), floor(T.lA[0], T.lA[1] + 4), P3("lA")],
      [P3("vB"), floor(T.vB[0], -30), floor(T.lB[0] + 18, -30), floor(T.lB[0] + 18, T.lB[1]), P3("lB")],
    ],
  };
  const wire = (pts, flow) => {
    const d = k.pathOf(pts.map(at));
    return `<path class="iso-line" data-tone="mid" d="${d}" style="stroke-width:1.5"/>` + (flow ? `<path class="iso-line" data-tone="lit" data-flow="" data-current d="${d}" style="stroke-width:.9"/>` : "") + D([at(pts[0]), at(pts[pts.length - 1])], { size: 1.1, tone: "hi" });
  };

  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Электрическая цепь на монтажной плате: батарея из трёх элементов, амперметр, лампа, реостат с ползунком и вольтметр, подключённый параллельно лампе.",
    body: [
      Lab.plate(P, BOARD, { label: { x: -116, y: 64, w: 30, d: 12 } }),
      routes.main.map((r) => wire(r, true)).join(""),
      routes.volt.map((r) => wire(r, false)).join(""),
      battery(), amm.svg, vol.svg, `<g data-part="needles"></g>`,
      rheostat(), `<g data-part="slider"></g>`, lampBase(), `<g data-part="lamp"></g>`,
    ],
  });

  const ui = Lab.card(el, {
    fig: `Fig ${num}`,
    title: "Закон Ома",
    hint: "Двигайте ползунок реостата",
    readout: "",
    keys: [
      { mark: "lit", label: "Ползунок и поток зарядов" },
      { mark: "raised", label: "Батарея 4,5 В, лампа 5 Ом" },
    ],
    caption: "Реостат — 0…20 Ом проволоки на керамической трубке. Он включён последовательно с лампой, поэтому I = U / (R + Rл). Вольтметр стоит параллельно лампе.",
    svg,
    controls: Lab.range("r", "Реостат", { min: 0, max: RMAX, step: 0.5, value: 4, unit: "Ом" }),
  });

  const defs = `<defs><radialGradient id="glow-${num}"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".35" stop-color="#ffb347" stop-opacity=".45"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient></defs>`;
  ui.svg.insertAdjacentHTML("afterbegin", defs);
  const gNeedles = ui.part("needles"), gSlider = ui.part("slider"), gLamp = ui.part("lamp");
  const flows = [...ui.svg.querySelectorAll("[data-current]")];
  let target = 4;
  const st = { R: 4, tour: true, tourT: 0 };

  function needle(pivot, share) {
    const a = -Math.PI / 3 + Math.max(0, Math.min(1, share)) * ((Math.PI * 2) / 3);
    const [x, y] = pivot;
    return L(k.lineOnTop([x - Math.sin(a) * 2, y + Math.cos(a) * 2], [x + Math.sin(a) * 14, y - Math.cos(a) * 14], MZ + 0.7, P), { tone: "lit", free: "start" }) + D([at([x, y, MZ + 0.7])], { size: 0.9, tone: "hi" });
  }

  function draw() {
    const I = U / (st.R + RL);
    const UL = I * RL;
    const Pw = I * I * RL;
    const glow = Pw / ((U / RL) ** 2 * RL);
    gNeedles.innerHTML = needle([AMM.x + AMM.w / 2, AMM.y + AMM.d / 2 + 4], I / 1) + needle([VOL.x + VOL.w / 2, VOL.y + VOL.d / 2 + 4], UL / 5);
    const xs = SLIDE[0] + (st.R / RMAX) * (SLIDE[1] - SLIDE[0]);
    gSlider.innerHTML = slider(xs);
    const c = [LAMP[0], LAMP[1], 30];
    const ctr = at(c);
    const bulb = G.sphereOf(c, 12, P);
    const fil = k.pathOf([[-4, 26], [-2.5, 32], [-1, 28], [0.5, 32], [2, 28], [3.5, 32], [5, 26]].map(([dx, z]) => at([c[0] + dx * 0.7, c[1] - dx * 0.7, z])));
    const rad = 40 + glow * 50;
    gLamp.innerHTML = `<circle cx="${ctr[0].toFixed(1)}" cy="${ctr[1].toFixed(1)}" r="${rad.toFixed(1)}" fill="url(#glow-${num})" opacity="${(glow ** 0.8).toFixed(3)}"/>` +
      `<path d="${bulb.fill}" style="fill:var(--anatomy-card);opacity:.55"/>` +
      L(k.segment([c[0] - 3, c[1] + 3, 18], [c[0] - 3, c[1] + 3, 26], P) + k.segment([c[0] + 3, c[1] - 3, 18], [c[0] + 3, c[1] - 3, 26], P), { tone: "mid" }) +
      `<path d="${fil}" fill="none" stroke="${glow > 0.05 ? "#ff8a1f" : "var(--anatomy-mid)"}" stroke-width="${(0.8 + glow).toFixed(2)}" stroke-linejoin="round"/>` +
      `<path class="iso-line" data-tone="hi" d="${bulb.outline}"/>` +
      `<circle cx="${ctr[0].toFixed(1)}" cy="${ctr[1].toFixed(1)}" r="${(rad * 0.35).toFixed(1)}" fill="url(#glow-${num})" opacity="${(glow * 0.9).toFixed(3)}"/>`;
    const dur = Math.max(250, 900 / I);
    flows.forEach((f) => (f.style.animationDuration = `${Math.round(dur)}ms`));
    ui.say(`R = ${fmt(st.R, 1)} Ом · I = ${fmt(I)} А · Uл = ${fmt(UL)} В · P = ${fmt(Pw)} Вт`);
  }

  const resume = Lab.idle(9000, () => {
    st.tour = true;
    st.tourT = 0;
  });
  const loop = Lab.loop(ui.stage, (dt, calm) => {
    if (st.tour && !calm) {
      st.tourT += dt;
      target = [2, 12, 20, 6][Math.floor(st.tourT / 3.2) % 4];
    }
    st.R = Lab.follow(st.R, target, dt, 0.45, calm);
    if (st.tour) {
      ui.control("r").value = String(st.R);
      ui.root.querySelector('[data-out="r"]').textContent = `${fmt(st.R, 1)} Ом`;
    }
    draw();
    return true;
  });
  Lab.bindRange(ui, "r", (v) => {
    target = v;
    loop.run();
  }, (v) => `${fmt(v, 1)} Ом`);
  ui.control("r").addEventListener("input", () => {
    st.tour = false;
    resume();
  });
  draw();
};
