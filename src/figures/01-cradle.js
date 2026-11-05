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
  const st = { mode: "lift", t: 0, amp: theta0, rate: 0, ang: XS.map(() => 0), from: XS.map(() => 0), flash: [] };
  const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * u * (u * (u * 6 - 15) + 10));

  function centreOf(i, angle) {
    return [XS[i] + LEN * Math.sin(angle), 0, PIVOT_Z - LEN * Math.cos(angle)];
  }

  function swingAngles(th) {
    const out = XS.map(() => 0);
    if (th < 0) for (let i = 0; i < count; i++) out[i] = th;
    if (th > 0) for (let i = N - count; i < N; i++) out[i] = th;
    return out;
  }

  function draw() {
    const angles = st.ang;
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
    const restZ = PIVOT_Z - LEN;
    if (!st.nodes) {
      gBack.innerHTML = L("M0 0", { tone: "mid" });
      gFront.innerHTML = L("M0 0", { tone: "mid" }) + `<g></g>`;
      const shadow = Lab.shadow(P, 0, 0, 0, R * 0.8, 1);
      const ball = Lab.ball(P, [0, 0, 0], R);
      gBalls.innerHTML = XS.map(() => `<g>${shadow}</g>`).join("") + XS.map(() => `<g>${ball}</g>`).join("") + `<g></g>`;
      const kids = [...gBalls.children];
      st.nodes = { back: gBack.firstChild, front: gFront.firstChild, ends: gFront.lastChild, shadows: kids.slice(0, N), balls: kids.slice(N, 2 * N), flash: kids[2 * N], order: "" };
    }
    const nd = st.nodes;
    nd.back.setAttribute("d", backD);
    nd.front.setAttribute("d", frontD);
    nd.ends.innerHTML = D(ends, { size: 0.9, tone: "hi" });
    const order = centres.map((c, i) => i).sort((a, b) => k.depthOf(centres[a], P) - k.depthOf(centres[b], P));
    const key = order.join("");
    if (key !== nd.order) {
      order.forEach((i) => gBalls.insertBefore(nd.balls[i], nd.flash));
      nd.order = key;
    }
    centres.forEach((c, i) => {
      const lift = Math.max(0, 1 - (c[2] - restZ) / 30);
      nd.shadows[i].setAttribute("transform", k.translateAlong(P, [c[0], 0, 0]));
      nd.shadows[i].setAttribute("opacity", (0.32 * lift).toFixed(3));
      nd.balls[i].setAttribute("transform", k.translateAlong(P, c));
      nd.balls[i].firstChild.toggleAttribute("data-lit", Math.abs(angles[i]) > 0.01);
    });
    nd.flash.innerHTML = st.flash.map((f) => {
      const c = at([f.x, 0, restZ]);
      const u = f.t / 0.45;
      return `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${(3 + u * 16).toFixed(1)}" fill="none" stroke="var(--anatomy-hi)" stroke-width="${(1.2 * (1 - u)).toFixed(2)}" opacity="${(0.7 * (1 - u) ** 2).toFixed(3)}"/>`;
    }).join("");
    const v = Math.abs(st.rate) * L_REAL;
    const n = st.mode === "swing" ? count : 0;
    ui.say(st.mode === "swing" ? `n = ${n} · v = ${fmt(v)} м/с · p = ${fmt(n * MASS * v)} кг·м/с` : `поднимаем ${count} ${count === 1 ? "шар" : "шара"} на ${Math.round((theta0 * 180) / Math.PI)}°`);
  }

  const release = () => {
    st.mode = "lift";
    st.t = 0;
    st.from = st.ang.slice();
    st.rate = 0;
  };

  const loop = Lab.loop(ui.stage, (dt, calm) => {
    st.t += dt;
    st.flash = st.flash.map((f) => ({ ...f, t: f.t + dt })).filter((f) => f.t < 0.45);
    if (st.mode === "lift") {
      const want = XS.map((_, i) => (i < count ? -theta0 : 0));
      const u = calm ? 1 : smooth(st.t / 1.1);
      st.ang = want.map((w, i) => st.from[i] + (w - st.from[i]) * u);
      if (st.t > 1.5) {
        st.mode = "swing";
        st.t = 0;
        st.amp = theta0;
        st.prev = -theta0;
      }
    } else {
      const a = st.amp * Math.exp(-st.t / 10);
      const th = -a * Math.cos(OMEGA * st.t);
      st.rate = a * OMEGA * Math.sin(OMEGA * st.t);
      if (Math.sign(th) !== Math.sign(st.prev) && a > 0.04) {
        st.flash.push({ x: th > 0 ? XS[count - 1] + R : XS[N - count] - R, t: 0 });
      }
      st.prev = th;
      st.ang = swingAngles(th);
      if ((a < 0.035 && Math.abs(th) < 0.004) || calm) release();
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
  st.ang = XS.map((_, i) => (i < count ? -theta0 : 0));
  st.from = st.ang.slice();
  draw();
};
