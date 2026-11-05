FIG.piston = (el, num) => {
  const { S, L, D } = Lab;
  const W = 540, H = 500;
  const PLATE = { x: -86, y: -66, w: 176, d: 132, r: 8 };
  const HEAT = { x: -38, y: -38, w: 76, d: 76, r: 5 };
  const HZ = 16, FL = 4, GZ = HZ + FL, R_IN = 24, R_GL = 25.5, GLASS_TOP = 168;
  const H0 = 60, PIST_H = 8, ROD = 22;
  const T0 = 273.15, AREA = Math.PI * (R_IN / 1000) ** 2, LOAD = 1.0, P_ATM = 101325;
  const PRESSURE = P_ATM + (LOAD * G_ACC) / AREA;
  const NU = (PRESSURE * AREA * (H0 / 1000)) / (8.314 * T0);
  const GAUGE = [58, -34], GZG = 30;
  const DISP = { x: 34, y: 22, w: 38, d: 24, r: 2 };
  const P = k.fitProjection([...k.boxCorners(PLATE, -17, 0), [0, 0, GLASS_TOP + 44], [-R_GL, -R_GL, GLASS_TOP], [R_GL, R_GL, GLASS_TOP]], W, H, { pad: 20, azimuth: 40 });
  const at = (p) => k.iso(p, P);
  const tv = k.towardViewer(P);

  function base() {
    const out = [Lab.plate(P, PLATE, { label: { x: -74, y: PLATE.y + PLATE.d - 22, w: 32, d: 13 } })];
    out.push(S(k.slabOf(HEAT, 0, HZ, P, 6, 1), { tone: "mid", inner: L(k.sideSeam(HEAT, 4, P, 6), { tone: "faint" }) }));
    out.push(Lab.knob(P, HEAT.x + 10, HEAT.y + HEAT.d - 10, 4, HZ, 3, 0.3));
    out.push(Lab.screwDots(P, [[HEAT.x + 4, HEAT.y + 4, HZ], [HEAT.x + HEAT.w - 4, HEAT.y + 4, HZ], [HEAT.x + HEAT.w - 4, HEAT.y + HEAT.d - 4, HZ]]));
    out.push(S(k.slabOf({ x: GAUGE[0] - 8, y: GAUGE[1] - 8, w: 16, d: 16, r: 2 }, 0, 4, P, 3, 0.5), { tone: "mid" }));
    out.push(S(k.cylinder(GAUGE[0], GAUGE[1], 2.4, 4, GZG - 4, P, 16), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(GAUGE[0], GAUGE[1], 13, GZG, 5, P, 48, 0.6), { tone: "hi", crease: "lo" }));
    out.push(L(k.ring(GAUGE[0], GAUGE[1], 11.4, GZG + 5, P, 48), { tone: "lo" }));
    const t = k.radialTicks(GAUGE[0], GAUGE[1], 10.6, 40, 5, GZG + 5, [1.1, 2.4], P, -Math.PI * 0.75, Math.PI * 1.5);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    out.push(k.wireSvg(at([GAUGE[0], GAUGE[1] + 2.4, 6]), at([R_GL + 1, -6, GZ + 1]), { via: [at([GAUGE[0], -6, 0.4]), at([HEAT.x + HEAT.w + 2, -6, 0.4]), at([HEAT.x + HEAT.w + 2, -6, HZ + 1])], tone: "mid" }));
    out.push(S(k.slabOf(DISP, 0, 20, P, 3, 0.6), { tone: "mid" }));
    const fy = DISP.y + DISP.d;
    const win = k.pathOf([[DISP.x + 4, fy, 6], [DISP.x + DISP.w - 4, fy, 6], [DISP.x + DISP.w - 4, fy, 16], [DISP.x + 4, fy, 16]].map(at), true);
    out.push(`<path d="${win}" style="fill:var(--anatomy-shade-0);stroke:var(--anatomy-mid);stroke-width:.6"/>`);
    out.push(Lab.knob(P, DISP.x + DISP.w - 8, DISP.y + 7, 2.6, 20, 2, 0.3));
    out.push(k.wireSvg(at([DISP.x, DISP.y + 6, 6]), at([HEAT.x + HEAT.w, 12, 8]), { via: [at([HEAT.x + HEAT.w + 6, DISP.y + 6, 0.4])], tone: "mid" }));
    return out.join("");
  }

  function glassBack() {
    const out = [S(k.cylinder(0, 0, R_GL + 3, HZ, FL, P, 64, 0.6), { tone: "mid" })];
    out.push(L(k.ring(0, 0, R_IN, GZ, P, 64), { tone: "faint" }));
    const back = [];
    for (let i = 0; i <= 48; i++) {
      const a = Math.PI + Math.atan2(tv[1], tv[0]) - Math.PI / 2 + (i / 48) * Math.PI;
      back.push([Math.cos(a) * R_GL, Math.sin(a) * R_GL]);
    }
    out.push(L(k.pathOf(back.map(([x, y]) => at([x, y, GLASS_TOP]))), { tone: "lo" }));
    return out.join("");
  }

  function glassFront() {
    const side = [-tv[1], tv[0]];
    const out = [];
    const edge = (sgn) => k.segment([sgn * side[0] * R_GL, sgn * side[1] * R_GL, GZ], [sgn * side[0] * R_GL, sgn * side[1] * R_GL, GLASS_TOP], P);
    out.push(L(edge(1) + edge(-1), { tone: "mid" }));
    out.push(L(k.sideArc(0, 0, R_GL, GLASS_TOP, P, 48) + k.sideArc(0, 0, R_GL, GZ + 0.2, P, 48), { tone: "mid" }));
    const shine = [0.55, 0.62].map((f) => {
      const a = Math.atan2(tv[1], tv[0]) + f - 0.9;
      return [Math.cos(a) * R_GL, Math.sin(a) * R_GL];
    });
    out.push(L(shine.map(([x, y]) => k.segment([x, y, GZ + 14], [x, y, GLASS_TOP - 14], P)).join(""), { tone: "faint" }));
    out.push(L([60, 100, 140].map((z) => k.sideArc(0, 0, R_GL, z, P, 48)).join(""), { tone: "faint" }));
    const ticks = [];
    for (let z = GZ + 10; z < GLASS_TOP - 4; z += 10) {
      const a = Math.atan2(tv[1], tv[0]) + 0.35;
      const p = [Math.cos(a) * R_GL, Math.sin(a) * R_GL, z];
      const q = [Math.cos(a + 0.14) * R_GL, Math.sin(a + 0.14) * R_GL, z];
      ticks.push(k.segment(p, q, P));
    }
    out.push(L(ticks.join(""), { tone: "lo" }));
    return out.join("");
  }

  function piston(z) {
    const out = [];
    out.push(S(k.cylinder(0, 0, R_IN - 0.4, z, PIST_H, P, 64), { tone: "hi", lit: true, inner: L(k.sideArc(0, 0, R_IN - 0.4, z + 2.4, P, 48) + k.sideArc(0, 0, R_IN - 0.4, z + 5, P, 48), { tone: "lo" }) }));
    out.push(S(k.cylinder(0, 0, 2.6, z + PIST_H, ROD, P, 20), { tone: "mid", crease: "none" }));
    const pz = z + PIST_H + ROD;
    out.push(S(k.cylinder(0, 0, 16, pz, 3, P, 48, 0.5), { tone: "mid" }));
    for (let i = 0; i < 2; i++) out.push(S(k.cylinder(0, 0, 13, pz + 3 + i * 6, 5.6, P, 48, 0.5), { tone: "mid", inner: L(k.sideArc(0, 0, 13, pz + 3 + i * 6 + 2.8, P, 32), { tone: "faint" }) }));
    out.push(S(k.cylinder(0, 0, 3, pz + 15, 4, P, 20), { tone: "mid" }));
    return out.join("");
  }

  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Стеклянный цилиндр с поршнем и грузом на электроплитке. При нагреве молекулы газа ускоряются и поршень поднимается; манометр показывает постоянное давление.",
    body: [base(), `<g data-part="coil"></g>`, `<g data-part="gauge"></g>`, `<g data-part="display"></g>`, glassBack(), `<g data-part="gas"></g>`, `<g data-part="piston"></g>`, glassFront()],
  });

  const ui = Lab.card(el, {
    fig: `Fig ${num}`,
    title: "Цилиндр с поршнем",
    hint: "Включите нагрев",
    readout: "",
    keys: [
      { mark: "lit", label: "Поршень с грузом 1 кг" },
      { mark: "dotted", label: "Молекулы газа" },
      { mark: "red", label: "Спираль плитки" },
    ],
    caption: `Давление задаёт груз на поршне: p = p₀ + mg/S ≈ ${fmt(PRESSURE / 1000, 1)} кПа и не меняется. В цилиндре ${fmt(NU * 1000, 1)} ммоль газа; при 0 °C он занимает ${fmt(AREA * H0 * 1e3, 0)} см³.`,
    svg,
    controls: Lab.range("t", "Плитка", { min: 0, max: 300, step: 1, value: 0, unit: "°C" }),
  });

  const gCoil = ui.part("coil"), gGas = ui.part("gas"), gPiston = ui.part("piston"), gGauge = ui.part("gauge"), gDisp = ui.part("display");
  let setC = 0;
  const st = { T: T0, tour: true, tourT: 0 };
  const parts = Array.from({ length: 46 }, () => {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (R_IN - 2);
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    return { p: [Math.cos(a) * r, Math.sin(a) * r, GZ + 2 + Math.random() * (H0 - 4)], d: [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)] };
  });

  function draw(dt) {
    const h = H0 * (st.T / T0);
    const z = GZ + h;
    const speed = 70 * Math.sqrt(st.T / T0);
    parts.forEach((q) => {
      for (let j = 0; j < 3; j++) q.p[j] += q.d[j] * speed * dt;
      const rr = Math.hypot(q.p[0], q.p[1]);
      if (rr > R_IN - 1.5) {
        const nx = q.p[0] / rr, ny = q.p[1] / rr;
        const dn = q.d[0] * nx + q.d[1] * ny;
        if (dn > 0) {
          q.d[0] -= 2 * dn * nx;
          q.d[1] -= 2 * dn * ny;
        }
        q.p[0] = nx * (R_IN - 1.5);
        q.p[1] = ny * (R_IN - 1.5);
      }
      if (q.p[2] < GZ + 1.5) {
        q.p[2] = GZ + 1.5;
        q.d[2] = Math.abs(q.d[2]);
      }
      if (q.p[2] > z - 1.5) {
        q.p[2] = z - 1.5;
        q.d[2] = -Math.abs(q.d[2]);
      }
    });
    const sorted = parts.map((q) => q.p).sort((a, b) => k.depthOf(a, P) - k.depthOf(b, P));
    gGas.innerHTML = D(sorted.map(at), { size: 1.05, tone: "hi" });
    gPiston.innerHTML = piston(z);
    const heat = Math.max(0, Math.min(1, setC / 300));
    const coil = [];
    for (let i = 0; i < 3; i++) coil.push(k.ring(0, 0, 30.5 + i * 2.6, HZ, P, 64));
    gCoil.innerHTML = `<g opacity="${(0.12 + 0.88 * heat).toFixed(2)}">${L(coil.join(""), { tone: heat > 0.02 ? "red" : "lo" })}</g>`;
    const ga = -Math.PI * 0.75 + (PRESSURE / 200000) * Math.PI * 1.5;
    gGauge.innerHTML = L(k.lineOnTop([GAUGE[0] - Math.sin(ga) * 2, GAUGE[1] + Math.cos(ga) * 2], [GAUGE[0] + Math.sin(ga) * 9, GAUGE[1] - Math.cos(ga) * 9], GZG + 5.1, P), { tone: "lit", free: "start" }) + D([at([GAUGE[0], GAUGE[1], GZG + 5.1])], { size: 0.8, tone: "hi" });
    const text = `${Math.round(st.T)} K`;
    gDisp.innerHTML = k.faceTextSvg(k.sideMatrix([DISP.x + DISP.w / 2, DISP.y + DISP.d], 8.2, P, "left"), text, { size: 7, tone: "hi", anchor: "middle" });
    const V = AREA * (h / 1000) * 1e6;
    ui.say(`T = ${Math.round(st.T - T0)} °C = ${Math.round(st.T)} K · V = ${fmt(V, 0)} см³ · V/T = ${fmt(V / st.T, 3)} · p = ${fmt(PRESSURE / 1000, 1)} кПа`);
  }

  const resume = Lab.idle(10000, () => {
    st.tour = true;
    st.tourT = 0;
  });
  const loop = Lab.loop(ui.stage, (dt, calm) => {
    if (st.tour && !calm) {
      st.tourT += dt;
      const want = Math.floor(st.tourT / 5) % 2 ? 0 : 273;
      setC = Lab.follow(setC, want, dt, 0.6, calm);
      ui.control("t").value = String(Math.round(setC));
      ui.root.querySelector('[data-out="t"]').textContent = `${Math.round(setC)} °C`;
    }
    st.T = Lab.follow(st.T, T0 + setC, dt, 0.9, calm);
    draw(calm ? 0 : dt);
    return true;
  });
  Lab.bindRange(ui, "t", (v) => {
    setC = v;
    loop.run();
  }, (v) => `${v} °C`);
  ui.control("t").addEventListener("input", () => {
    st.tour = false;
    resume();
  });
  draw(0);
};
