FIG.cradle = (el, num) => {
  const { S, L, D } = Lab;
  const W = 640, H = 430;
  const R = 10, N = 5, PIVOT_Z = 136, LEN = 90, RAIL_Y = 24, POST_X = 116;
  const XS = Array.from({ length: N }, (_, i) => (i - (N - 1) / 2) * 2 * R);
  const PLATE = { x: -140, y: -58, w: 280, d: 116, r: 9 };
  const L_REAL = 0.18, MASS = 0.26;
  const OMEGA = Math.sqrt(G_ACC / L_REAL);
  const P = k.fitProjection([...k.boxCorners(PLATE, -17, 0), [-POST_X, -RAIL_Y, PIVOT_Z + 8], [POST_X, RAIL_Y, PIVOT_Z + 8]], W, H, { pad: 26, azimuth: 60 });
  const at = (p) => k.iso(p, P);

  function post(x, y) {
    return [
      S(k.cylinder(x, y, 6, 0, 3, P, 28), { tone: "mid" }),
      S(k.cylinder(x, y, 2.6, 3, PIVOT_Z - 3, P, 24), { tone: "mid", crease: "none", inner: L([30, 70, 110].map((z) => k.sideArc(x, y, 2.6, z, P, 12)).join(""), { tone: "faint" }) }),
      S(k.cylinder(x, y, 3.6, PIVOT_Z - 1, 7, P, 24), { tone: "mid" }),
    ].join("");
  }

  function rail(y) {
    const plan = { x: -POST_X, y: y - 1.8, w: POST_X * 2, d: 3.6, r: 1.6 };
    const out = [S(k.slabOf(plan, PIVOT_Z, 3, P, 4, 0.4), { tone: "mid" })];
    XS.forEach((x) => {
      out.push(S(k.slabOf({ x: x - 3, y: y - 3, w: 6, d: 6, r: 1 }, PIVOT_Z - 3, 3, P, 2), { tone: "mid", crease: "none" }));
    });
    out.push(Lab.screwDots(P, XS.map((x) => [x, y, PIVOT_Z + 3]), 0.4));
    return out.join("");
  }

  const base = [
    Lab.plate(P, PLATE, { ruler: { x: -118, y: PLATE.y + PLATE.d - 15, w: 200, step: 4 }, label: { x: 92, y: PLATE.y + PLATE.d - 22, w: 30, d: 14 } }),
    S(k.slabOf({ x: -POST_X - 10, y: -RAIL_Y - 10, w: 20, d: RAIL_Y * 2 + 20, r: 3 }, 0, 3, P, 4, 0.5), { tone: "mid" }),
    S(k.slabOf({ x: POST_X - 10, y: -RAIL_Y - 10, w: 20, d: RAIL_Y * 2 + 20, r: 3 }, 0, 3, P, 4, 0.5), { tone: "mid" }),
    Lab.screwDots(P, [[-POST_X, -RAIL_Y - 6, 3], [-POST_X, RAIL_Y + 6, 3], [POST_X, -RAIL_Y - 6, 3], [POST_X, RAIL_Y + 6, 3]]),
    L(XS.map((x) => k.ring(x, 0, R * 0.7, 0, P, 28)).join(""), { tone: "faint" }),
  ].join("");

  const back = [post(-POST_X, -RAIL_Y), post(POST_X, -RAIL_Y), rail(-RAIL_Y)].join("");
  const front = [rail(RAIL_Y), post(-POST_X, RAIL_Y), post(POST_X, RAIL_Y)].join("");

  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Маятник Ньютона: пять стальных шаров на V-образных нитях между двумя рейками.",
    body: [base, back, `<g data-part="back-strings"></g>`, `<g data-part="balls"></g>`, `<g data-part="front-strings"></g>`, front],
  });

  const controls =
    `<div class="lab-row"><span class="lab-range-label">Шаров</span>${Lab.segmented("count", [[1, "1"], [2, "2"], [3, "3"], [4, "4"]], 1)}</div>` +
    Lab.range("angle", "Угол", { min: 10, max: 35, step: 1, value: 28, unit: "°" }) +
    Lab.button("go", "Отпустить", true);

  const ui = Lab.card(el, {
    fig: `Fig ${num}`,
    title: "Маятник Ньютона",
    hint: "Выберите число шаров и отпустите",
    readout: "",
    keys: [
      { mark: "lit", label: "Шары, которые сейчас движутся" },
      { mark: "raised", label: "Стальные шары, m = 0,26 кг, нить 0,18 м" },
    ],
    caption: "Сколько шаров вы отпустите слева — столько же вылетит справа. Только так одновременно сохраняются и импульс, и кинетическая энергия при упругом ударе.",
    svg,
    controls,
  });

  const gBack = ui.part("back-strings"), gBalls = ui.part("balls"), gFront = ui.part("front-strings");
  let count = 1, theta0 = (28 * Math.PI) / 180;
  const st = { mode: "lift", t: 0, lift: 0, amp: theta0, theta: 0, rate: 0 };

  function centreOf(i, angle) {
    return [XS[i] + LEN * Math.sin(angle), 0, PIVOT_Z - LEN * Math.cos(angle)];
  }

  function draw() {
    const angles = XS.map(() => 0);
    const th = st.theta;
    if (th < 0) for (let i = 0; i < count; i++) angles[i] = th;
    if (th > 0) for (let i = N - count; i < N; i++) angles[i] = th;
    const centres = angles.map((a, i) => centreOf(i, a));
    let backD = "", frontD = "";
    const ends = [];
    centres.forEach((c, i) => {
      const a = angles[i];
      const top = [c[0] - R * Math.sin(a) * 0.98, 0, c[2] + R * Math.cos(a) * 0.98];
      backD += k.segment([XS[i], -RAIL_Y, PIVOT_Z - 3], top, P);
      frontD += k.segment([XS[i], RAIL_Y, PIVOT_Z - 3], top, P);
      ends.push(at(top));
    });
    gBack.innerHTML = L(backD, { tone: "mid" });
    gFront.innerHTML = L(frontD, { tone: "mid" }) + D(ends, { size: 0.9, tone: "hi" });
    const order = centres.map((c, i) => i).sort((a, b) => k.depthOf(centres[a], P) - k.depthOf(centres[b], P));
    gBalls.innerHTML = order.map((i) => {
      const moving = Math.abs(angles[i]) > 0.002 || (st.mode !== "swing" && angles[i] !== 0);
      return `<path class="iso-halo" d="${k.haloOf({ x: centres[i][0] - R * 0.7, y: -R * 0.7, w: R * 1.4, d: R * 1.4, r: R * 0.7 }, 0, 0.1, P)}" style="opacity:${0.18 * Math.max(0, 1 - (centres[i][2] - (PIVOT_Z - LEN)) / 30)}"/>` + Lab.ball(P, centres[i], R, { lit: moving });
    }).join("");
    const v = Math.abs(st.rate) * L_REAL;
    const n = st.mode === "swing" ? count : 0;
    ui.say(st.mode === "swing" ? `n = ${n} · v = ${fmt(v)} м/с · p = ${fmt(n * MASS * v)} кг·м/с` : `поднимаем ${count} ${count === 1 ? "шар" : "шара"} на ${Math.round((theta0 * 180) / Math.PI)}°`);
  }

  const release = () => {
    st.mode = "lift";
    st.t = 0;
  };

  const loop = Lab.loop(ui.stage, (dt, calm) => {
    st.t += dt;
    if (st.mode === "lift") {
      const target = -theta0;
      st.theta = Lab.follow(st.theta, target, dt, 0.18, calm);
      st.rate = 0;
      if (st.t > 1.1) {
        st.mode = "swing";
        st.t = 0;
        st.amp = theta0;
      }
    } else {
      const decay = Math.exp(-st.t / 9);
      const a = st.amp * decay;
      st.theta = -a * Math.cos(OMEGA * st.t);
      st.rate = a * OMEGA * Math.sin(OMEGA * st.t);
      if (a < 0.02 || calm) {
        st.mode = "lift";
        st.t = 0;
      }
    }
    draw();
    return true;
  });

  Lab.bindSeg(ui, "count", (v) => {
    count = +v;
    release();
    loop.run();
  });
  Lab.bindRange(ui, "angle", (v) => {
    theta0 = (v * Math.PI) / 180;
  }, (v) => `${v}°`);
  ui.control("go").addEventListener("click", () => {
    release();
    loop.run();
  });
  ui.control("angle").addEventListener("change", release);
  st.theta = -theta0;
  draw();
};
