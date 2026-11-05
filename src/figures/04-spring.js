FIG.spring = (el, num) => {
  const { S, L, D } = Lab;
  const W = 560, H = 480;
  const PLATE = { x: -78, y: -52, w: 150, d: 104, r: 8 };
  const POST = [-52, -14], POST_TOP = 248, ARM_Z = 232;
  const AX = [22, -14], SPRING_TOP = 228, L0 = 46, COIL_R = 6.5;
  const RULER = { x: 14, y: -44, w: 16, d: 4, r: 0.8 };
  const RULER_TOP = 236;
  const K = 20, HANGER = 0.05, SLOT = 0.05, MM = 0.001;
  const P = k.fitProjection([...k.boxCorners(PLATE, -17, 0), [POST[0], POST[1], POST_TOP + 4], [AX[0] + 10, AX[1], POST_TOP]], W, H, { pad: 22, azimuth: 38 });
  const at = (p) => k.iso(p, P);

  function stand() {
    const out = [Lab.plate(P, PLATE, { label: { x: 20, y: PLATE.y + PLATE.d - 22, w: 34, d: 13 } })];
    out.push(S(k.slabOf({ x: POST[0] - 14, y: POST[1] - 20, w: 28, d: 40, r: 3 }, 0, 6, P, 4, 0.6), { tone: "mid" }));
    out.push(Lab.screwDots(P, [[POST[0] - 9, POST[1] - 15, 6], [POST[0] + 9, POST[1] + 15, 6], [POST[0] - 9, POST[1] + 15, 6]]));
    out.push(S(k.cylinder(POST[0], POST[1], 6, 6, 5, P, 28), { tone: "mid" }));
    out.push(S(k.cylinder(POST[0], POST[1], 3.4, 11, POST_TOP - 11, P, 24), { tone: "mid", crease: "none", inner: L([60, 120, 180].map((z) => k.sideArc(POST[0], POST[1], 3.4, z, P, 12)).join(""), { tone: "faint" }) }));
    out.push(S(k.cylinder(POST[0], POST[1], 4, POST_TOP, 2, P, 24), { tone: "mid" }));
    out.push(S(k.slabOf({ x: RULER.x - 4, y: RULER.y - 6, w: RULER.w + 8, d: 14, r: 2 }, 0, 5, P, 3, 0.5), { tone: "mid" }));
    out.push(Lab.screwDots(P, [[RULER.x - 1, RULER.y + 4, 5], [RULER.x + RULER.w + 1, RULER.y + 4, 5]]));
    const ticksMinor = [], ticksMajor = [];
    const face = RULER.y + RULER.d;
    let i = 0;
    for (let z = RULER_TOP - 6; z > 14; z -= 4, i++) {
      const len = i % 5 === 0 ? 6 : 3;
      (i % 5 === 0 ? ticksMajor : ticksMinor).push(k.segment([RULER.x, face, z], [RULER.x + len, face, z], P));
    }
    out.push(S(k.slabOf(RULER, 5, RULER_TOP - 5, P, 2, 0.4), { tone: "hi", crease: "lo", inner: L(ticksMinor.join(""), { tone: "lo" }) + L(ticksMajor.join(""), { tone: "mid" }) }));
    return out.join("");
  }

  function arm() {
    const out = [];
    const boss = { x: POST[0] - 7, y: POST[1] - 7, w: 14, d: 14, r: 2.4 };
    out.push(S(k.slabOf(boss, ARM_Z - 6, 14, P, 4, 0.6), { tone: "mid" }));
    out.push(S(k.slabOf({ x: POST[0] + 7, y: POST[1] - 3, w: AX[0] - POST[0] + 2, d: 6, r: 2 }, ARM_Z, 5, P, 4, 0.5), { tone: "mid" }));
    out.push(S(k.slabOf({ x: POST[0] - 1.4, y: POST[1] + 7, w: 2.8, d: 3, r: 0.8 }, ARM_Z - 1, 4, P, 2), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(POST[0], POST[1] + 11.4, 2.6, ARM_Z - 3, 6, P, 20), { tone: "mid" }));
    out.push(L(k.knurl(POST[0], POST[1] + 11.4, 2.6, ARM_Z - 3, ARM_Z + 3, 18, P), { tone: "lo" }));
    out.push(S(k.cylinder(AX[0], AX[1], 2.4, SPRING_TOP, ARM_Z - SPRING_TOP, P, 16), { tone: "mid" }));
    out.push(Lab.screwDots(P, [[POST[0] + 14, POST[1], ARM_Z + 5], [AX[0] - 6, AX[1], ARM_Z + 5]]));
    return out.join("");
  }

  function load(zTop, n) {
    const [x, y] = AX;
    const out = [];
    const hook = zTop - 6;
    out.push(S(k.cylinder(x, y, 1.2, hook, 6, P, 12), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(x, y, 2.4, hook - 3, 3, P, 16), { tone: "mid" }));
    const rodBottom = hook - 3 - 26;
    out.push(S(k.cylinder(x, y, 1.2, rodBottom, 26, P, 12), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(x, y, 9, rodBottom - 3, 3, P, 36), { tone: "hi", lit: true }));
    for (let i = 0; i < n; i++) {
      const z = rodBottom + i * 5;
      out.push(S(k.cylinder(x, y, 8, z, 4.6, P, 36), { tone: "hi", lit: true, inner: L(k.sideArc(x, y, 8, z + 2.3, P, 24), { tone: "faint" }) }));
    }
    const pz = rodBottom + 18;
    out.push(S(k.slabOf({ x: x - 1, y: RULER.y + RULER.d + 1, w: 2, d: y - (RULER.y + RULER.d + 1) - 1, r: 0.4 }, pz - 0.6, 1.2, P, 2), { tone: "hi", lit: true }));
    return { svg: out.join(""), pointer: pz };
  }

  const svg = k.figureSvg({
    width: W,
    height: H,
    label: "Штатив с пружиной: на пружине висит подвес с разновесами, указатель на подвесе показывает удлинение по вертикальной линейке.",
    body: [stand(), arm(), `<g data-part="back"></g>`, `<g data-part="load"></g>`, `<g data-part="front"></g>`],
  });

  const ui = Lab.card(el, {
    fig: `Fig ${num}`,
    title: "Пружинный маятник",
    hint: "Добавьте разновесы, оттяните груз",
    readout: "",
    keys: [
      { mark: "lit", label: "Подвес 50 г и разновесы по 50 г" },
      { mark: "raised", label: "Пружина k = 20 Н/м" },
    ],
    caption: "Пружина жёсткостью 20 Н/м. Равновесие там, где сила упругости k·x равна весу m·g. Колебания затухают из-за трения о воздух, но период остаётся 2π√(m/k).",
    svg,
    controls: `<div class="lab-row"><span class="lab-range-label">Разновесы</span>${Lab.segmented("n", [[0, "0"], [1, "+1"], [2, "+2"], [3, "+3"]], 1)}</div>` + Lab.button("pull", "Оттянуть", true),
  });

  const gBack = ui.part("back"), gLoad = ui.part("load"), gFront = ui.part("front");
  let n = 1;
  const massOf = () => HANGER + n * SLOT;
  const st = { x: (massOf() * G_ACC) / K, v: 0, t: 0, idle: 0 };

  function draw() {
    const ext = st.x / MM;
    const bottom = SPRING_TOP - L0 - ext;
    const turns = 18;
    const h = Lab.helix(P, AX[0], AX[1], COIL_R, bottom + 2, SPRING_TOP - 2, turns, 28);
    const lo = load(bottom, n);
    gBack.innerHTML = L(h.back, { tone: "lo" }) + S(k.cylinder(AX[0], AX[1], COIL_R + 0.8, SPRING_TOP - 2, 2, P, 24), { tone: "mid" });
    gLoad.innerHTML = lo.svg;
    gFront.innerHTML = L(h.front, { tone: "hi" }) + S(k.cylinder(AX[0], AX[1], COIL_R + 0.8, bottom, 2, P, 24), { tone: "mid" });
    const m = massOf();
    const T = 2 * Math.PI * Math.sqrt(m / K);
    ui.say(`m = ${Math.round(m * 1000)} г · x = ${fmt(st.x * 100, 1)} см · F = ${fmt(K * st.x)} Н · T = ${fmt(T)} с`);
  }

  const loop = Lab.loop(ui.stage, (dt, calm) => {
    const m = massOf();
    const eq = (m * G_ACC) / K;
    if (calm) {
      st.x = eq;
      st.v = 0;
    } else {
      const c = (2 * m) / 7;
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        const h = dt / steps;
        const a = (m * G_ACC - K * st.x - c * st.v) / m;
        st.v += a * h;
        st.x += st.v * h;
      }
    }
    st.idle += dt;
    if (st.idle > 7 && Math.abs(st.x - eq) < 0.002 && Math.abs(st.v) < 0.01) {
      st.idle = 0;
      st.x = eq + 0.03;
    }
    draw();
    return true;
  });

  Lab.bindSeg(ui, "n", (v) => {
    n = +v;
    st.idle = 0;
    loop.run();
  });
  ui.control("pull").addEventListener("click", () => {
    st.x = (massOf() * G_ACC) / K + 0.03;
    st.v = 0;
    st.idle = 0;
    loop.run();
  });
  st.x += 0.03;
  draw();
};
