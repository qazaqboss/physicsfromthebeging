FIG.incline = (el, num) => {
  const { S, L, D } = Lab;
  const W = 640, H = 400;
  const X0 = -132, X1 = 128, HALF = 12, R = 6, GATE_Y = 19;
  const PLATE = { x: -158, y: -46, w: 316, d: 92, r: 8 };
  const START = 10;
  const P = k.fitProjection([...k.boxCorners(PLATE, -17, 0), [X0, -GATE_Y, 96], [X0, GATE_Y, 96]], W, H, { pad: 22, azimuth: 60 });
  const at = (p) => k.iso(p, P);
  const F = G.frameOf([0, 0, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  let alpha = (8 * Math.PI) / 180;

  const geo = () => {
    const run = X1 - X0;
    const top = run * Math.tan(alpha);
    const len = run / Math.cos(alpha);
    const unit = (len - START - 14) / 16;
    const gates = [1, 4, 9, 16].map((n) => START + unit * n);
    return { run, top, len, unit, gates };
  };
  const surf = (s) => [X0 + s * Math.cos(alpha), 0, geo().top - s * Math.sin(alpha)];
  const ballAt = (s) => {
    const p = surf(s);
    return [p[0] + (R - 1.2) * Math.sin(alpha), 0, p[2] + (R - 1.2) * Math.cos(alpha)];
  };

  function gatePost(x, y, h, lit) {
    return [
      S(k.cylinder(x, y, 3.2, 0, 2, P, 20), { tone: "mid" }),
      S(k.cylinder(x, y, 1.5, 2, h - 2, P, 16), { tone: lit ? "hi" : "mid", crease: "none", lit }),
    ].join("");
  }

  function rig(passed) {
    const g = geo();
    const back = [], front = [], bars = [];
    const wedge = G.prismOf(F, [[X0, 0], [X1, 0], [X0, g.top]], -HALF, HALF, P);
    const tick = [];
    const major = [];
    for (let s = 0, i = 0; s <= g.len - 2; s += g.unit / 2, i++) {
      const p = surf(s);
      const q = [p[0] - 2.4 * Math.sin(alpha) * 0, HALF, p[2] - (i % 2 ? 2.2 : 4)];
      (i % 2 ? tick : major).push(k.segment([p[0], HALF, p[2]], q, P));
    }
    const groove = k.segment([X0, -2.2, g.top], [X1, -2.2, 0], P) + k.segment([X0, 2.2, g.top], [X1, 2.2, 0], P);
    const wedgeSvg = S(wedge, { tone: "mid", inner: L(tick.join(""), { tone: "lo" }) + L(major.join(""), { tone: "mid" }) }) + L(groove, { tone: "lo" });
    g.gates.forEach((s, i) => {
      const p = surf(s);
      const hTop = p[2] + 2 * R + 4;
      const lit = passed > i;
      back.push(gatePost(p[0], -GATE_Y, hTop, lit));
      front.push(gatePost(p[0], GATE_Y, hTop, lit));
      bars.push(S(k.slabOf({ x: p[0] - 2, y: -GATE_Y - 2.4, w: 4, d: GATE_Y * 2 + 4.8, r: 1 }, hTop, 3, P, 3, 0.4), { tone: "mid", lit }));
      bars.push(S(k.slabOf({ x: p[0] - 3, y: -5, w: 6, d: 10, r: 1 }, hTop - 2, 2, P, 2), { tone: lit ? "hi" : "mid", crease: "none", lit }));
      bars.push(D([at([p[0], 0, hTop - 2])], { size: lit ? 1.1 : 0.7, tone: lit ? "hi" : "lo" }));
    });
    const latch = surf(START - 2.4);
    const latchSvg = S(k.slabOf({ x: X0 - 6, y: -HALF - 2, w: 6, d: HALF * 2 + 4, r: 1.2 }, 0, g.top + 8, P, 3, 0.5), { tone: "mid" }) +
      S(k.slabOf({ x: latch[0] - 1.2, y: -4, w: 2.4, d: 8, r: 0.6 }, latch[2], 6, P, 2), { tone: "mid" });
    const stop = S(k.slabOf({ x: X1 + 4, y: -HALF - 2, w: 8, d: HALF * 2 + 4, r: 1.5 }, 0, 10, P, 3, 0.5), { tone: "mid" }) +
      S(k.slabOf({ x: X1 + 2, y: -5, w: 2, d: 10, r: 0.6 }, 2, 6, P, 2), { tone: "lo" }) + Lab.screwDots(P, [[X1 + 8, -HALF + 1, 10], [X1 + 8, HALF - 1, 10]]);
    return {
      back: back.join("") + latchSvg + wedgeSvg + stop,
      front: bars.join("") + front.join(""),
    };
  }

  const base = Lab.plate(P, PLATE, { ruler: { x: -80, y: PLATE.y + PLATE.d - 14, w: 160, step: 4 }, label: { x: 96, y: PLATE.y + PLATE.d - 21, w: 34, d: 13 } }) +
    Lab.knob(P, -146 + 18, PLATE.y + PLATE.d - 14, 5, 0, 4, 0.1);

  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Наклонный жёлоб Галилея: шар скатывается и проходит четверо ворот, расставленных на расстояниях 1, 4, 9 и 16 единиц.",
    body: [base, `<g data-part="rig-back"></g>`, `<g data-part="ball"></g>`, `<g data-part="rig-front"></g>`, `<g data-part="flash"></g>`],
  });

  const ui = Lab.card(el, {
    fig: `Fig ${num}`,
    title: "Жёлоб Галилея",
    hint: "Измените угол и пустите шар",
    readout: "",
    keys: [
      { mark: "lit", label: "Шар и сработавшие ворота" },
      { mark: "raised", label: "Ворота на расстояниях 1 : 4 : 9 : 16" },
    ],
    caption: "Длина жёлоба 2,6 м. Шар катится без проскальзывания, поэтому a = 5/7 · g · sin α. Ворота срабатывают через равные промежутки времени.",
    svg,
    controls: Lab.range("angle", "Наклон α", { min: 3, max: 14, step: 0.5, value: 8, unit: "°" }) + Lab.button("go", "Пуск", true),
  });

  const gBack = ui.part("rig-back"), gFront = ui.part("rig-front"), gBall = ui.part("ball"), gFlash = ui.part("flash");
  const st = { phase: "wait", t: 0, s: START, v: 0, clock: 0, tEnd: 0, passed: 0, hits: [], from: START, drawnPassed: -1, drawnAlpha: -1 };
  const accel = () => (5 / 7) * G_ACC * Math.sin(alpha);
  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  const endOf = () => geo().len - R - 2;

  function draw() {
    const g = geo();
    if (st.drawnPassed !== st.passed || st.drawnAlpha !== alpha) {
      const r = rig(st.passed);
      gBack.innerHTML = r.back;
      gFront.innerHTML = r.front;
      st.drawnPassed = st.passed;
      st.drawnAlpha = alpha;
    }
    const s = Math.min(st.s, endOf());
    const c = ballAt(s);
    const roll = -(s - START) / R;
    const dir = [Math.cos(alpha), 0, -Math.sin(alpha)];
    const nrm = [Math.sin(alpha), 0, Math.cos(alpha)];
    const mark = [0, 1].map((j) => {
      const ang = roll + j * Math.PI;
      return [c[0] + R * 0.98 * (Math.sin(ang) * dir[0] + Math.cos(ang) * nrm[0]), c[1] - R * 0.35, c[2] + R * 0.98 * (Math.sin(ang) * dir[2] + Math.cos(ang) * nrm[2])];
    });
    gBall.innerHTML = `<path class="iso-halo" d="${k.haloOf({ x: c[0] - 4, y: -4, w: 8, d: 8, r: 4 }, surf(s)[2], 0.1, P)}" style="opacity:.25;filter:blur(3px)"/>` +
      Lab.ball(P, c, R, { lit: st.phase === "roll" || st.phase === "rest" }) + D(mark.filter((m) => k.depthOf(m, P) > k.depthOf(c, P)).map(at), { size: 0.8, tone: "hi" });
    gFlash.innerHTML = st.hits.map((h) => {
      const p = surf(g.gates[h.i]);
      const q = at([p[0], 0, p[2] + 2 * R + 2]);
      const u = Math.min(1, (st.clock - h.t) / 0.7);
      if (u >= 1 || u < 0) return "";
      return `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(2 + 14 * Math.sqrt(u)).toFixed(1)}" fill="none" stroke="var(--anatomy-hi)" stroke-width="${(1.3 * (1 - u)).toFixed(2)}" opacity="${((1 - u) ** 2).toFixed(3)}"/>`;
    }).join("");
    const t1 = Math.sqrt((2 * (g.unit / 100)) / accel());
    const deg = (alpha * 180) / Math.PI;
    if (st.phase === "rest" || st.phase === "return") ui.say(`t₁ : t₂ : t₃ : t₄ = ${[1, 2, 3, 4].map((n) => fmt(n * t1, 2)).join(" : ")} с`);
    else ui.say(`α = ${fmt(deg, 1)}° · a = ${fmt(accel())} м/с² · t = ${fmt(st.phase === "roll" ? Math.min(st.clock, st.tEnd || st.clock) : 0)} с · v = ${fmt(Math.abs(st.v) / 100)} м/с`);
  }

  const loop = Lab.loop(ui.stage, (dt, calm) => {
    const g = geo();
    const end = endOf();
    st.t += dt;
    if (st.phase === "wait") {
      st.s = START;
      st.v = 0;
      if (st.t > 0.9) {
        st.phase = "roll";
        st.t = 0;
        st.clock = 0;
        st.tEnd = 0;
        st.passed = 0;
        st.hits = [];
      }
    } else if (st.phase === "roll") {
      const a = accel() * 100;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const h = dt / n;
        st.clock += h;
        st.v += a * h;
        st.s += st.v * h;
        const passed = g.gates.filter((gs) => st.s >= gs).length;
        if (passed > st.passed && !st.tEnd) {
          for (let j = st.passed; j < passed; j++) st.hits.push({ i: j, t: st.clock });
          st.passed = passed;
        }
        if (st.s >= end && st.v > 0) {
          if (!st.tEnd) st.tEnd = st.clock;
          st.s = end;
          st.v = -0.32 * st.v;
        }
      }
      if (st.tEnd && Math.abs(st.v) < 6 && end - st.s < 0.6) {
        st.s = end;
        st.v = 0;
        st.phase = "rest";
        st.t = 0;
      }
      if (calm) {
        st.s = end;
        st.phase = "rest";
      }
    } else if (st.phase === "rest" && st.t > 2.8) {
      st.phase = "return";
      st.t = 0;
      st.from = st.s;
      st.passed = 0;
    } else if (st.phase === "return") {
      const u = ease(st.t / 1.5);
      st.s = st.from + (START - st.from) * u;
      st.v = 0;
      if (u >= 1) {
        st.phase = "wait";
        st.t = 0;
      }
    }
    draw();
    return !calm || st.phase !== "rest";
  });

  const restart = () => {
    st.phase = "return";
    st.t = 0;
    st.from = Math.min(st.s, endOf());
    st.passed = 0;
    st.hits = [];
    loop.run();
  };
  Lab.bindRange(ui, "angle", (v) => {
    alpha = (v * Math.PI) / 180;
    if (st.phase === "roll" || st.phase === "rest") restart();
    draw();
  }, (v) => `${String(v).replace(".", ",")}°`);
  ui.control("go").addEventListener("click", restart);
  draw();
};
