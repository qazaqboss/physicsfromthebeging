FIG3D.emwave = (el, num) => {
  const ui = Lab3D.card(el, {
    fig: `Fig ${num}`,
    title: "Электромагнитная волна",
    hint: "Вращайте, меняйте длину волны",
    keys: [
      { mark: "red", label: "Электрическое поле E" },
      { mark: "blue", label: "Магнитное поле B" },
    ],
    caption: "E и B перпендикулярны друг другу и направлению движения, колеблются в одной фазе и бегут со скоростью света. Движение замедлено в ~10¹⁵ раз.",
    controls: Lab.range("lam", "Длина волны", { min: 30, max: 120, step: 1, value: 70 }),
  });
  const S = Lab3D.scene(ui, { azimuth: 52, elevation: 24, radius: 86, center: [0, 0, 24] });
  const { T } = S;
  S.plate(200, 90);
  const Z = 32, X0 = -85, X1 = 85;
  S.box(4, 4, Z, X0 - 6, 0, 0, "shade", "mid");
  S.box(14, 18, 12, X0 - 6, 0, Z - 6, "face", "mid");
  S.line([[X0, 0, Z], [X1, 0, Z]], "hi");
  const ax = S.arrow("hi", { shaft: 0.35, head: 1.8, headLen: 5 });
  ax.set([X1 - 2, 0, Z], [X1 + 10, 0, Z]);
  const N = 34;
  const E = [], B = [];
  for (let i = 0; i < N; i++) {
    E.push(S.arrow("red", { shaft: 0.3, head: 1.2, headLen: 3 }));
    B.push(S.arrow("blue", { shaft: 0.3, head: 1.2, headLen: 3 }));
  }
  const M = 160;
  const eGeo = new T.BufferGeometry().setAttribute("position", new T.BufferAttribute(new Float32Array(M * 3), 3));
  const bGeo = new T.BufferGeometry().setAttribute("position", new T.BufferAttribute(new Float32Array(M * 3), 3));
  S.scene.add(new T.Line(eGeo, S.lineMat("red")), new T.Line(bGeo, S.lineMat("blue")));
  let lam = 70, ph = 0;
  const A = 22;
  Lab3D.run(ui, S, (dt, calm) => {
    ph += calm ? 0 : dt * 2.2;
    const kx = (2 * Math.PI) / lam;
    for (let i = 0; i < N; i++) {
      const x = X0 + ((X1 - X0) * (i + 0.5)) / N;
      const s = Math.sin(kx * (x - X0) - ph);
      E[i].set([x, 0, Z], [x, 0, Z + A * s]);
      B[i].set([x, 0, Z], [x, A * 0.75 * s, Z]);
    }
    const ep = eGeo.attributes.position.array, bp = bGeo.attributes.position.array;
    for (let i = 0; i < M; i++) {
      const x = X0 + ((X1 - X0) * i) / (M - 1);
      const s = Math.sin(kx * (x - X0) - ph);
      ep.set([x, 0, Z + A * s], i * 3);
      bp.set([x, A * 0.75 * s, Z], i * 3);
    }
    eGeo.attributes.position.needsUpdate = true;
    bGeo.attributes.position.needsUpdate = true;
    const lamNm = 380 + ((lam - 30) / 90) * 370;
    ui.say(`λ = ${Math.round(lamNm)} нм (видимый свет) · ν = ${fmt(3e8 / (lamNm * 1e-9) / 1e14, 2)}·10¹⁴ Гц · c = λ·ν = 3·10⁸ м/с`);
    return true;
  });
  Lab.bindRange(ui, "lam", (v) => (lam = v), (v) => `${Math.round(380 + ((v - 30) / 90) * 370)} нм`);
};

FIG3D.interference = (el, num) => {
  const ui = Lab3D.card(el, {
    fig: `Fig ${num}`,
    title: "Интерференция",
    hint: "Меняйте расстояние и длину волны",
    keys: [
      { mark: "lit", label: "Два когерентных источника" },
      { mark: "raised", label: "Поверхность волн" },
    ],
    caption: "Два вибратора качают воду в одной фазе. Вдоль линий, где разность хода равна целому числу длин волн, волны усиливаются, а между ними гасят друг друга.",
    controls: Lab.range("d", "Между источниками", { min: 10, max: 50, step: 1, value: 28 }) + Lab.range("lam", "Длина волны", { min: 8, max: 22, step: 0.5, value: 13 }),
  });
  const S = Lab3D.scene(ui, { azimuth: 30, elevation: 42, radius: 92, center: [0, 0, 6] });
  const { T } = S;
  const W = 150, SEG = Math.min(120, innerWidth < 700 ? 90 : 120);
  S.box(W + 10, W + 10, 4, 0, 0, -4, "face", "mid");
  const geo = new T.PlaneGeometry(W, W, SEG, SEG);
  const water = new T.Mesh(geo, new T.MeshLambertMaterial({ color: 0x9fb3c8, flatShading: false }));
  water.position.z = 6;
  S.scene.add(water);
  const pos = geo.attributes.position;
  const base = Float32Array.from(pos.array);
  for (const sx of [-1, 1]) {
    S.box(W + 10, 3, 9, 0, (sx * (W + 7)) / 2, -4, "face", "mid");
    S.box(3, W + 10, 9, (sx * (W + 7)) / 2, 0, -4, "face", "mid");
  }
  const bar = S.box(4, 80, 4, -W / 2 + 12, 0, 26, "shade", "mid");
  const pins = [0, 1].map(() => S.cyl(1.4, 20, 0, 0, 6, "lit", "hi"));
  let d = 28, lam = 13, ph = 0;
  Lab3D.run(ui, S, (dt, calm) => {
    ph += calm ? 0 : dt * 3.2;
    const k2 = (2 * Math.PI) / lam;
    const sx = -W / 2 + 12;
    const y1 = -d / 2, y2 = d / 2;
    const bob = Math.sin(ph) * 1.2;
    pins[0].position.set(sx, y1, 6 + 10 + bob);
    pins[1].position.set(sx, y2, 6 + 10 + bob);
    bar.position.z = 26 + 2 + bob;
    const a = pos.array;
    for (let i = 0; i < a.length; i += 3) {
      const x = base[i], y = base[i + 1];
      const r1 = Math.hypot(x - sx, y - y1) + 0.5, r2 = Math.hypot(x - sx, y - y2) + 0.5;
      const h = (Math.sin(k2 * r1 - ph) / Math.sqrt(r1 / 6 + 1) + Math.sin(k2 * r2 - ph) / Math.sqrt(r2 / 6 + 1)) * 2.2;
      a[i + 2] = x < sx ? 0 : h;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    const L = 1, spacing = (lam / d) * L;
    ui.say(`d = ${d} мм · λ = ${fmt(lam, 1)} мм · угол первого максимума ≈ ${fmt((Math.asin(Math.min(1, lam / d)) * 180) / Math.PI, 0)}° · полос: ${Math.floor(d / lam) * 2 + 1}`);
    return true;
  });
  Lab.bindRange(ui, "d", (v) => (d = v), (v) => `${v} мм`);
  Lab.bindRange(ui, "lam", (v) => (lam = v), (v) => `${fmt(v, 1)} мм`);
};
