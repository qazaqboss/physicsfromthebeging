FIG.melde = (el, num) => {
  const { S, L, D } = Lab;
  const W = 640, H = 380;
  const PLATE = { x: -170, y: -46, w: 340, d: 92, r: 8 };
  const SZ = 46, XA = -126, XB = 134, PR = 6;
  const LEN = 1.0, MU = 0.0005, HANG = 0.08;
  const TENSION = HANG * G_ACC;
  const V = Math.sqrt(TENSION / MU);
  const F1 = V / (2 * LEN);
  const Q = 22, AMAX = 15;
  const GEN = { x: -112, y: -40, w: 64, d: 22, r: 2 };
  const DIAL = [GEN.x + 22, GEN.y + 11];
  const P = k.fitProjection([...k.boxCorners(PLATE, -17, 0), [XA, 0, SZ + AMAX + 4], [XB, 0, SZ + AMAX + 4], [XB + 12, 0, 0]], W, H, { pad: 20, azimuth: 62 });
  const at = (p) => k.iso(p, P);
  let freq = F1;

  function base() {
    const out = [Lab.plate(P, PLATE, { ruler: { x: XA, y: PLATE.y + PLATE.d - 15, w: XB - XA, step: 5.2 }, label: { x: -40, y: GEN.y + 2, w: 30, d: 12 } })];
    out.push(S(k.slabOf(GEN, 0, 26, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(GEN, 4, P, 3), { tone: "faint" }) }));
    out.push(L(k.ring(DIAL[0], DIAL[1], 9, 26, P, 40), { tone: "lo" }));
    const t = k.radialTicks(DIAL[0], DIAL[1], 8, 30, 5, 26, [1, 2.2], P, -Math.PI * 0.75, Math.PI * 1.5);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    out.push(Lab.knob(P, GEN.x + 48, GEN.y + 11, 4.5, 26, 3, 0.15));
    out.push(Lab.screwDots(P, [[GEN.x + 3, GEN.y + 3, 26], [GEN.x + GEN.w - 3, GEN.y + 3, 26], [GEN.x + 3, GEN.y + GEN.d - 3, 26], [GEN.x + GEN.w - 3, GEN.y + GEN.d - 3, 26]]));
    out.push(k.wireSvg(at([GEN.x + 4, GEN.y + GEN.d, 3]), at([XA - 16, -6, 3]), { via: [at([GEN.x + 4, -10, 0.2]), at([XA - 20, -10, 0.2])], tone: "mid" }));
    const box = { x: XA - 30, y: -13, w: 26, d: 26, r: 3 };
    out.push(S(k.slabOf(box, 0, 30, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(box, 24, P, 4), { tone: "faint" }) }));
    out.push(L(k.ring(box.x + 13, 0, 8, 30, P, 32) + k.ring(box.x + 13, 0, 5, 30, P, 28), { tone: "lo" }));
    out.push(Lab.screwDots(P, [[box.x + 3, box.y + 3, 30], [box.x + 23, box.y + 23, 30], [box.x + 3, box.y + 23, 30], [box.x + 23, box.y + 3, 30]]));
    out.push(S(k.slabOf({ x: XB - 3, y: -12, w: 6, d: 4, r: 1 }, 0, SZ, P, 2, 0.4), { tone: "mid" }));
    out.push(S(k.slabOf({ x: XB - 8, y: -16, w: 16, d: 12, r: 2 }, 0, 5, P, 3, 0.5), { tone: "mid" }));
    return out.join("");
  }

  function pulley() {
    const F = G.frameAlong([XB, -2.6, SZ - PR], [0, 1, 0]);
    return [
      S(G.disc(0, 1.6, PR, F, P), { tone: "hi", crease: "none" }),
      S(G.disc(1.6, 3.6, PR - 1.2, F, P), { tone: "hi", crease: "none" }),
      S(G.disc(3.6, 5.2, PR, F, P), { tone: "hi", crease: "none" }),
      S(G.disc(5.2, 6.6, 1.4, F, P), { tone: "mid" }),
    ].join("");
  }

  function weight() {
    const x = XB + PR;
    const top = SZ - PR - 6;
    const out = [S(k.cylinder(x, 0, 0.8, top - 12, 12, P, 12), { tone: "mid", crease: "none" })];
    for (let i = 0; i < 4; i++) {
      const z = top - 12 - (i + 1) * 4;
      out.push(S(k.cylinder(x, 0, 7, z, 3.8, P, 32), { tone: "mid", inner: L(k.sideArc(x, 0, 7, z + 1.9, P, 24), { tone: "faint" }) }));
    }
    out.push(S(k.cylinder(x, 0, 8, top - 12 - 4 * 4 - 2, 2, P, 32), { tone: "mid" }));
    return out.join("");
  }

  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Опыт Мельде: вибратор раскачивает конец нити, нить натянута грузом через блок; на резонансных частотах образуется стоячая волна.",
    body: [base(), `<g data-part="needle"></g>`, weight(), `<g data-part="string"></g>`, `<g data-part="blade"></g>`, pulley()],
  });

  const ui = Lab.card(el, {
    fig: `Fig ${num}`,
    title: "Опыт Мельде",
    hint: "Крутите частоту генератора",
    readout: "",
    keys: [
      { mark: "lit", label: "Нить, L = 1 м, μ = 0,5 г/м" },
      { mark: "faint", label: "Огибающая: размах колебаний" },
    ],
    caption: `Груз 80 г натягивает нить с силой ${fmt(TENSION)} Н, волна бежит со скоростью ${fmt(V, 1)} м/с. Резонансы: ${[1, 2, 3, 4, 5].map((n) => fmt(n * F1, 1)).join(", ")} Гц. Движение замедлено стробоскопом.`,
    svg,
    controls: Lab.range("f", "Частота", { min: 5, max: 110, step: 0.1, value: F1.toFixed(1), unit: "Гц" }),
  });

  const gString = ui.part("string"), gNeedle = ui.part("needle"), gBlade = ui.part("blade");
  const MODES = 6;
  const st = { phase: 0, f: F1, tour: true, tourT: 0, amps: Array.from({ length: MODES }, (_, i) => (i === 0 ? 1 : 0)) };
  const gainOf = (f, n) => {
    const r = f / (n * F1);
    return Math.min(1, 1 / Math.sqrt((1 - r * r) ** 2 + (r / Q) ** 2) / Q);
  };
  const respond = (f) => {
    const n = Math.max(1, Math.min(MODES, Math.round(f / F1)));
    return { n, gain: gainOf(f, n) };
  };

  function draw() {
    const { n } = respond(st.f);
    const amps = st.amps.map((g) => AMAX * Math.max(0, g));
    const total = amps.reduce((x, y) => x + y, 0);
    const lead = amps.indexOf(Math.max(...amps)) + 1;
    const share = total > 0 ? amps[lead - 1] / total : 0;
    const gain = st.amps[lead - 1];
    const c = Math.cos(st.phase);
    const pts = [], up = [], dn = [];
    const N = 96;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = XA + (XB - XA) * u;
      let y = 0;
      for (let m = 0; m < MODES; m++) if (amps[m] > 0.01) y += amps[m] * Math.sin((m + 1) * Math.PI * u);
      pts.push(at([x, 0, SZ + y * c]));
      up.push(at([x, 0, SZ + Math.abs(y)]));
      dn.push(at([x, 0, SZ - Math.abs(y)]));
    }
    const nodes = [];
    for (let j = 1; j < lead; j++) nodes.push(at([XA + ((XB - XA) * j) / lead, 0, SZ]));
    const envOp = Math.max(0, Math.min(1, (gain - 0.08) / 0.3));
    const nodeOp = Math.max(0, Math.min(1, (share - 0.7) / 0.25)) * envOp;
    gString.innerHTML = (envOp > 0.01 ? `<g opacity="${envOp.toFixed(3)}">${L(k.pathOf(up) + k.pathOf(dn), { tone: "faint" })}</g>` : "") + L(k.pathOf(pts), { tone: "lit" }) + L(k.segment([XB + PR, 0, SZ - PR], [XB + PR, 0, SZ - PR - 6], P), { tone: "hi" }) + `<g opacity="${nodeOp.toFixed(3)}">${D(nodes, { size: 1, tone: "hi" })}</g>` + D([at([XA, 0, SZ]), at([XB, 0, SZ])], { size: 0.9, tone: "hi" });
    const wob = 0.6 * Math.sin(st.phase * 3);
    gBlade.innerHTML = S(k.slabOf({ x: XA - 18, y: -1.5, w: 3, d: 3, r: 0.6 }, 30, SZ - 30 + 1.5, P, 2), { tone: "mid" }) +
      S(k.slabOf({ x: XA - 15.4 + wob * 0, y: -1, w: 16, d: 2, r: 0.5 }, SZ - 1 + wob, 2, P, 2), { tone: "hi", lit: true });
    const a = -Math.PI * 0.75 + (Math.min(st.f, 110) / 110) * Math.PI * 1.5;
    gNeedle.innerHTML = L(k.lineOnTop([DIAL[0] - Math.sin(a) * 1.8, DIAL[1] + Math.cos(a) * 1.8], [DIAL[0] + Math.sin(a) * 7, DIAL[1] - Math.cos(a) * 7], 26.1, P), { tone: "lit", free: "start" }) + D([at([DIAL[0], DIAL[1], 26.1])], { size: 0.7, tone: "hi" });
    const lam = (2 * LEN) / lead;
    ui.say(gain > 0.3 ? `f = ${fmt(st.f, 1)} Гц · резонанс n = ${lead} · λ = ${fmt(lam)} м` : `f = ${fmt(st.f, 1)} Гц · нет резонанса (ближайший n = ${n})`);
  }

  const resume = Lab.idle(9000, () => {
    st.tour = true;
    st.tourT = 0;
  });
  const loop = Lab.loop(ui.stage, (dt, calm) => {
    st.phase += dt * 2 * Math.PI * (calm ? 0 : 0.9);
    st.amps = st.amps.map((g, i) => Lab.follow(g, gainOf(st.f, i + 1), dt, 0.35, calm));
    if (st.tour && !calm) {
      st.tourT += dt;
      const target = F1 * (1 + (Math.floor(st.tourT / 4.5) % 4));
      st.f = Lab.follow(st.f, target, dt, 1.1, calm);
      freq = st.f;
      const input = ui.control("f");
      input.value = st.f.toFixed(1);
      ui.root.querySelector('[data-out="f"]').textContent = `${fmt(st.f, 1)} Гц`;
    } else {
      st.f = Lab.follow(st.f, freq, dt, 0.15, calm);
    }
    draw();
    return true;
  });

  Lab.bindRange(ui, "f", (v) => {
    freq = v;
    loop.run();
  }, (v) => `${fmt(v, 1)} Гц`);
  ui.control("f").addEventListener("input", () => {
    st.tour = false;
    resume();
  });
  draw();
};
