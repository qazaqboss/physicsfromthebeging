FIG3D.lorentz = (el, num) => {
  const ui = Lab3D.card(el, {
    fig: `Fig ${num}`,
    title: "Заряд в магнитном поле",
    hint: "Меняйте поле и угол влёта",
    keys: [
      { mark: "lit", label: "Протон и его скорость" },
      { mark: "blue", label: "Линии поля B" },
      { mark: "red", label: "Сила Лоренца" },
    ],
    caption: "Сила F = q·v×B всегда перпендикулярна скорости: она поворачивает частицу, но не разгоняет её. Поперечная часть скорости даёт окружность радиуса r = mv⊥/(qB), продольная — сносит её вдоль поля. Получается спираль.",
    controls: Lab.range("b", "Поле B", { min: 0.4, max: 2, step: 0.05, value: 1 }) + Lab.range("a", "Угол к полю", { min: 10, max: 90, step: 1, value: 70 }),
  });
  const S = Lab3D.scene(ui, { azimuth: 30, elevation: 22, radius: 84, center: [0, 0, 34] });
  const { T } = S;
  S.plate(180, 110);
  const Z = 36, X0 = -80, X1 = 80;
  for (const sx of [-1, 1]) {
    S.box(10, 70, 4, sx * 88, 0, 0, "shade", "mid");
    S.box(6, 6, Z + 30, sx * 88, -30, 4, "face", "mid");
    S.box(6, 6, Z + 30, sx * 88, 30, 4, "face", "mid");
    const coil = new T.Mesh(new T.TorusGeometry(30, 3, 12, 64), S.mat("face"));
    S.outline(coil, "mid", 70);
    coil.position.set(sx * 84, 0, Z);
    coil.rotation.y = Math.PI / 2;
    S.scene.add(coil);
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, r = i ? 18 : 0;
    const l = S.line([[X0, Math.cos(a) * r, Z + Math.sin(a) * r], [X1, Math.cos(a) * r, Z + Math.sin(a) * r]], "blue");
    l.material.transparent = true;
    l.material.opacity = 0.45;
  }
  const bArrow = S.arrow("blue", { shaft: 0.5, head: 2.2, headLen: 5 });
  bArrow.set([X1 - 10, 0, Z + 26], [X1 + 6, 0, Z + 26]);
  const p = new T.Mesh(new T.SphereGeometry(2.6, 24, 16), S.mat("lit"));
  S.outline(p, "hi", 80);
  S.scene.add(p);
  const vA = S.arrow("hi", { shaft: 0.35, head: 1.4, headLen: 3.5 });
  const fA = S.arrow("red", { shaft: 0.35, head: 1.4, headLen: 3.5 });
  const N = 1400;
  const tr = new Float32Array(N * 3);
  const tg = new T.BufferGeometry();
  tg.setAttribute("position", new T.BufferAttribute(tr, 3));
  S.scene.add(new T.Line(tg, S.lineMat("mid")));
  let B = 1, ang = 70, n = 0;
  const st = { r: new T.Vector3(), v: new T.Vector3() };
  const V = 18;
  const launch = () => {
    const a = (ang * Math.PI) / 180;
    st.r.set(X0 + 4, 0, Z);
    st.v.set(V * Math.cos(a), V * Math.sin(a), 0);
    n = 0;
  };
  launch();
  Lab3D.run(ui, S, (dt, calm) => {
    const Bv = new T.Vector3(B * 0.9, 0, 0);
    const steps = 30, h = (calm ? 0 : dt * 1.6) / steps;
    let F = new T.Vector3();
    for (let i = 0; i < steps; i++) {
      F = st.v.clone().cross(Bv);
      const half = st.v.clone().addScaledVector(F, h / 2);
      F = half.cross(Bv);
      st.v.addScaledVector(F, h);
      st.v.setLength(V);
      st.r.addScaledVector(st.v, h);
    }
    p.position.copy(st.r);
    vA.set(st.r, st.r.clone().addScaledVector(st.v, 0.7));
    fA.set(st.r, st.r.clone().addScaledVector(st.v.clone().cross(Bv), 0.6));
    if (n < N) {
      tr.set(st.r.toArray(), n * 3);
      n++;
    }
    tg.setDrawRange(0, n);
    tg.attributes.position.needsUpdate = true;
    if (st.r.x > X1 || st.r.x < X0 - 10 || n >= N) launch();
    const a = (ang * Math.PI) / 180;
    const vPerp = V * Math.sin(a);
    const rad = vPerp / (B * 0.9);
    const pitch = ((2 * Math.PI) / (B * 0.9)) * V * Math.cos(a);
    ui.say(`B = ${fmt(B, 2)} Тл · угол ${ang}° · r = mv⊥/qB ≈ ${fmt(rad / 10, 1)} см · шаг спирали ≈ ${fmt(pitch / 10, 1)} см · |v| = const`);
    return true;
  });
  Lab.bindRange(ui, "b", (v) => {
    B = v;
    launch();
  }, (v) => `${fmt(v, 2)} Тл`);
  Lab.bindRange(ui, "a", (v) => {
    ang = v;
    launch();
  }, (v) => `${v}°`);
};

FIG3D.spacetime = (el, num) => {
  const ui = Lab3D.card(el, {
    fig: `Fig ${num}`,
    title: "Пространство-время",
    hint: "Меняйте скорость β",
    keys: [
      { mark: "lit", label: "Оси движущегося наблюдателя ct′, x′" },
      { mark: "raised", label: "Световой конус x = ±ct" },
      { mark: "red", label: "Линия одновременности t′ = const" },
    ],
    caption: "Время — вверх, плоскость — пространство (x, y). Конус — путь вспышки света. При скорости β оси ct′ и x′ наклоняются к конусу, но сам конус не меняется: скорость света одна для всех. Матрица Λ пересчитывает координаты события.",
    controls: Lab.range("b", "Скорость β = v/c", { min: -0.9, max: 0.9, step: 0.01, value: 0.5 }),
    hud: `<div class="mtx-wrap"><span class="mtx-label">Λ =</span><div data-hud="m"></div></div><div class="mtx-sub" data-hud="g"></div>`,
  });
  const S = Lab3D.scene(ui, { azimuth: 70, elevation: 16, radius: 74, center: [0, 0, 36] });
  const { T } = S;
  S.plate(140, 140);
  const O = new T.Vector3(0, 0, 36), L = 40;
  const cone = new T.Mesh(new T.ConeGeometry(L, L, 64, 1, true), new T.MeshLambertMaterial({ color: 0xf0a020, transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false }));
  cone.rotation.x = -Math.PI / 2;
  cone.position.set(O.x, O.y, O.z + L / 2);
  const cone2 = cone.clone();
  cone2.rotation.x = Math.PI / 2;
  cone2.position.set(O.x, O.y, O.z - L / 2);
  S.scene.add(cone, cone2);
  for (const s of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push([O.x + Math.cos(a) * L, O.y + Math.sin(a) * L, O.z + s * L]);
    }
    S.line(pts, "mid");
  }
  S.line([[O.x - L, O.y, O.z - L], [O.x + L, O.y, O.z + L]], "mid");
  S.line([[O.x + L, O.y, O.z - L], [O.x - L, O.y, O.z + L]], "mid");
  S.arrow("faint", { shaft: 0.3, head: 1.2, headLen: 3 }).set(O.clone().add(new T.Vector3(-46, 0, 0)), O.clone().add(new T.Vector3(46, 0, 0)));
  S.arrow("faint", { shaft: 0.3, head: 1.2, headLen: 3 }).set(O.clone().add(new T.Vector3(0, 0, -46)), O.clone().add(new T.Vector3(0, 0, 46)));
  S.cyl(1.4, O.z - 46, 0, 0, 0, "shade", "mid");
  const tA = S.arrow("lit", { shaft: 0.6, head: 2.2, headLen: 5 });
  const xA = S.arrow("lit", { shaft: 0.6, head: 2.2, headLen: 5 });
  const simul = [0, 1, 2].map(() => S.line([[0, 0, 0], [1, 0, 0]], "red"));
  const grid = [];
  for (let i = -3; i <= 3; i++) grid.push(S.line([[0, 0, 0], [1, 0, 0]], "faint"), S.line([[0, 0, 0], [1, 0, 0]], "faint"));
  const evs = [[18, 14], [-10, 22], [24, -8]].map(([x, ct]) => {
    const m = new T.Mesh(new T.SphereGeometry(1.8, 16, 12), S.mat("hi"));
    m.position.set(O.x + x, O.y, O.z + ct);
    S.scene.add(m);
    return { x, ct, m };
  });
  let target = 0.5, beta = 0.5;
  Lab3D.run(ui, S, (dt, calm) => {
    const nb = Lab.follow(beta, target, dt, 0.25, calm);
    const moved = nb !== beta;
    beta = nb;
    const g = 1 / Math.sqrt(1 - beta * beta);
    const toW = (xp, ctp) => O.clone().add(new T.Vector3(g * (xp + beta * ctp), 0, g * (ctp + beta * xp)));
    tA.set(toW(0, -44 / g), toW(0, 44 / g));
    xA.set(toW(-44 / g, 0), toW(44 / g, 0));
    let gi = 0;
    for (let i = -3; i <= 3; i++) {
      grid[gi++].geometry.setFromPoints([toW(i * 10, -30), toW(i * 10, 30)]);
      grid[gi++].geometry.setFromPoints([toW(-30, i * 10), toW(30, i * 10)]);
    }
    evs.forEach((e, i) => {
      const ctp = g * (e.ct - beta * e.x);
      simul[i].geometry.setFromPoints([toW(-40, ctp), toW(40, ctp)]);
    });
    const m = Lab3D.matrixHtml([[g, -beta * g], [-beta * g, g]]);
    if (ui.hud.dataset.m !== m) {
      ui.hud.querySelector('[data-hud="m"]').innerHTML = m;
      ui.hud.dataset.m = m;
    }
    ui.hud.querySelector('[data-hud="g"]').textContent = `γ = ${fmt(g, 3)} · det Λ = 1`;
    const t1 = evs.map((e) => g * (e.ct - beta * e.x));
    ui.say(`β = ${fmt(beta, 2)} · γ = ${fmt(g, 3)} · события в системе′: t′ = ${t1.map((t) => fmt(t / 10, 2)).join(" / ")} · s² не меняется`);
    return moved || true;
  });
  Lab.bindRange(ui, "b", (v) => (target = v), (v) => fmt(v, 2));
};

FIG3D.orbitals = (el, num) => {
  const ui = Lab3D.card(el, {
    fig: `Fig ${num}`,
    title: "Орбитали водорода",
    hint: "Выберите орбиталь, вращайте",
    keys: [
      { mark: "dotted", label: "Каждая точка — положение электрона при одном измерении" },
      { mark: "red", label: "ψ > 0" },
      { mark: "blue", label: "ψ < 0" },
    ],
    caption: "Точки выбраны случайно с вероятностью |ψ|² — так выглядела бы серия измерений. Цвет показывает знак волновой функции. Узловые поверхности, где ψ = 0, остаются пустыми.",
    controls: `<div class="lab-row"><span class="lab-range-label">Орбиталь</span>${Lab.segmented("orb", [["1s", "1s"], ["2s", "2s"], ["2p", "2p"], ["3d", "3dz²"], ["3dxy", "3dxy"]], "2p")}</div>`,
  });
  const S = Lab3D.scene(ui, { azimuth: 35, elevation: 22, radius: 64, center: [0, 0, 42] });
  const { T } = S;
  S.plate(130, 110);
  S.cyl(12, 3, 0, 0, 0, "face", "mid", 40);
  S.cyl(1.2, 18, 0, 0, 3, "shade", "mid");
  const C = new T.Vector3(0, 0, 44);
  const nuc = new T.Mesh(new T.SphereGeometry(1.4, 16, 12), S.mat("lit"));
  nuc.position.copy(C);
  S.scene.add(nuc);
  const NPTS = innerWidth < 700 ? 5000 : 9000;
  const geo = new T.BufferGeometry();
  const pos = new Float32Array(NPTS * 3), col = new Float32Array(NPTS * 3);
  geo.setAttribute("position", new T.BufferAttribute(pos, 3));
  geo.setAttribute("color", new T.BufferAttribute(col, 3));
  const cloud = new T.Points(geo, new T.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false }));
  cloud.position.copy(C);
  S.scene.add(cloud);
  const PSI = {
    "1s": (x, y, z, r) => Math.exp(-r),
    "2s": (x, y, z, r) => (2 - r) * Math.exp(-r / 2),
    "2p": (x, y, z, r) => z * Math.exp(-r / 2),
    "3d": (x, y, z, r) => (3 * z * z - r * r) * Math.exp(-r / 3),
    "3dxy": (x, y, z, r) => x * y * Math.exp(-r / 3),
  };
  const EXT = { "1s": 5, "2s": 13, "2p": 12, "3d": 20, "3dxy": 20 };
  const NAME = { "1s": "1s (n=1, l=0)", "2s": "2s (n=2, l=0)", "2p": "2pz (n=2, l=1)", "3d": "3dz² (n=3, l=2)", "3dxy": "3dxy (n=3, l=2)" };
  let orb = "2p";
  function sample() {
    const f = PSI[orb], R = EXT[orb];
    let max = 0;
    for (let i = 0; i < 4000; i++) {
      const x = (Math.random() * 2 - 1) * R, y = (Math.random() * 2 - 1) * R, z = (Math.random() * 2 - 1) * R;
      const v = f(x, y, z, Math.hypot(x, y, z)) ** 2;
      if (v > max) max = v;
    }
    const red = new T.Color(S.P.red), blue = new T.Color(S.P.blue);
    const scale = 28 / R;
    let n = 0, guard = 0;
    while (n < NPTS && guard < NPTS * 400) {
      guard++;
      const x = (Math.random() * 2 - 1) * R, y = (Math.random() * 2 - 1) * R, z = (Math.random() * 2 - 1) * R;
      const psi = f(x, y, z, Math.hypot(x, y, z));
      if (Math.random() * max * 1.05 > psi * psi) continue;
      pos.set([x * scale, y * scale, z * scale], n * 3);
      const c = psi >= 0 ? red : blue;
      col.set([c.r, c.g, c.b], n * 3);
      n++;
    }
    geo.setDrawRange(0, n);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    ui.say(`${NAME[orb]} · ${n} измерений · точки распределены как |ψ|²`);
  }
  sample();
  new MutationObserver(sample).observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
  let spin = 0;
  Lab3D.run(ui, S, (dt, calm) => {
    spin += calm ? 0 : dt * 0.25;
    cloud.rotation.z = spin;
    return true;
  });
  Lab.bindSeg(ui, "orb", (v) => {
    orb = v;
    sample();
  });
};
