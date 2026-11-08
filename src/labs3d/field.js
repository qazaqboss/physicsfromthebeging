FIG3D.field = (el, num) => {
  const ui = Lab3D.card(el, {
    fig: `Fig ${num}`,
    title: "Поле двух зарядов",
    hint: "Вращайте сцену, меняйте заряды",
    keys: [
      { mark: "red", label: "Положительный заряд" },
      { mark: "blue", label: "Отрицательный заряд" },
      { mark: "raised", label: "Силовые линии поля" },
    ],
    caption: "Линии выходят из «плюса» и входят в «минус». По ним бегут пробные заряды: где линии гуще, поле сильнее. Сила Кулона F = k·q₁q₂/r².",
    controls: `<div class="lab-row"><span class="lab-range-label">Второй заряд</span>${Lab.segmented("sign", [[-1, "−q"], [1, "+q"], [-2, "−2q"]], -1)}</div>` + Lab.range("d", "Расстояние", { min: 24, max: 70, step: 1, value: 46 }),
  });
  const S = Lab3D.scene(ui, { azimuth: 35, elevation: 26, radius: 92, center: [0, 0, 22] });
  const { T } = S;
  S.plate(170, 110);
  const Z = 30;
  const stands = [];
  const charges = [-1, 1].map((sx, i) => {
    const post = S.cyl(1.4, Z - 7, 0, 0, 0, "shade", "mid");
    const foot = S.cyl(6, 2.5, 0, 0, 0, "face", "mid");
    stands.push(post, foot);
    const ball = new T.Mesh(new T.SphereGeometry(6, 40, 28), S.mat(i ? "blue" : "red"));
    S.scene.add(ball);
    return { ball, post, foot, q: i ? -1 : 1 };
  });
  const lineMat = S.lineMat("mid");
  let lineGroup = new T.Group();
  S.scene.add(lineGroup);
  let paths = [];
  const dotGeo = new T.SphereGeometry(0.9, 10, 8);
  const dots = new T.InstancedMesh(dotGeo, S.mat("hi"), 140);
  S.scene.add(dots);
  let sep = 46, q2 = -1;

  function fieldAt(p) {
    const E = new T.Vector3();
    charges.forEach((c) => {
      const r = p.clone().sub(c.ball.position);
      const d = Math.max(r.length(), 1.5);
      E.addScaledVector(r, c.q / (d * d * d));
    });
    return E;
  }

  function build() {
    charges[0].ball.position.set(-sep / 2, 0, Z);
    charges[1].ball.position.set(sep / 2, 0, Z);
    charges[1].q = q2;
    charges[1].ball.material = S.mat(q2 > 0 ? "red" : "blue");
    charges.forEach((c) => {
      c.post.position.set(c.ball.position.x, 0, (Z - 7) / 2 + 0.01);
      c.foot.position.set(c.ball.position.x, 0, 1.25);
      c.ball.scale.setScalar(Math.abs(c.q) > 1 ? 1.25 : 1);
    });
    S.scene.remove(lineGroup);
    lineGroup = new T.Group();
    paths = [];
    const seeds = [];
    const n = 26;
    charges.forEach((c, ci) => {
      if (c.q < 0 && charges.some((o) => o.q > 0)) return;
      const count = Math.round(n * Math.abs(c.q));
      for (let i = 0; i < count; i++) {
        const y = 1 - (2 * (i + 0.5)) / count;
        const r = Math.sqrt(1 - y * y);
        const t = i * 2.39996;
        seeds.push({ from: c, dir: new T.Vector3(r * Math.cos(t), r * Math.sin(t), y), sign: c.q > 0 ? 1 : -1 });
      }
    });
    seeds.forEach(({ from, dir, sign }) => {
      const p = from.ball.position.clone().addScaledVector(dir, 6.5);
      const pts = [p.clone()];
      for (let s = 0; s < 420; s++) {
        const E = fieldAt(p);
        const m = E.length();
        if (m < 1e-7) break;
        const step = 0.9;
        const mid = p.clone().addScaledVector(E, (sign * step * 0.5) / m);
        const E2 = fieldAt(mid);
        p.addScaledVector(E2, (sign * step) / E2.length());
        pts.push(p.clone());
        const hit = charges.find((c) => c !== from && c.ball.position.distanceTo(p) < 6);
        if (hit || p.z < 1 || Math.abs(p.x) > 95 || Math.abs(p.y) > 70 || p.z > 95) break;
      }
      if (pts.length < 3) return;
      lineGroup.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), lineMat));
      const len = [0];
      for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + pts[i].distanceTo(pts[i - 1]));
      paths.push({ pts, len, total: len[len.length - 1], sign });
    });
    S.scene.add(lineGroup);
    S.dirty = true;
    const F = (8.99e9 * 1e-6 * 1e-6 * Math.abs(q2)) / Math.pow(sep / 1000, 2);
    ui.say(`q₁ = +1 мкКл · q₂ = ${q2 > 0 ? "+" : "−"}${Math.abs(q2)} мкКл · r = ${sep} мм · F = ${fmt(F, 1)} Н · ${q2 > 0 ? "отталкивание" : "притяжение"}`);
  }

  const m4 = new T.Matrix4();
  let clock = 0;
  Lab3D.run(ui, S, (dt, calm) => {
    clock += calm ? 0 : dt;
    let k2 = 0;
    paths.forEach((path, i) => {
      if (k2 >= 140) return;
      for (let j = 0; j < 2 && k2 < 140; j++) {
        const u = ((clock * 22 + i * 13.7 + j * path.total * 0.5) % path.total + path.total) % path.total;
        const d = path.sign > 0 ? u : path.total - u;
        let a = 1;
        while (a < path.len.length - 1 && path.len[a] < d) a++;
        const f = (d - path.len[a - 1]) / Math.max(1e-6, path.len[a] - path.len[a - 1]);
        const p = path.pts[a - 1].clone().lerp(path.pts[a], f);
        m4.makeTranslation(p.x, p.y, p.z);
        dots.setMatrixAt(k2++, m4);
      }
    });
    dots.count = k2;
    dots.instanceMatrix.needsUpdate = true;
    return true;
  });
  Lab.bindSeg(ui, "sign", (v) => {
    q2 = +v;
    build();
  });
  Lab.bindRange(ui, "d", (v) => {
    sep = v;
    build();
  }, (v) => `${v} мм`);
};
