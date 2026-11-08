FIG3D.orbits = (el, num) => {
  const ui = Lab3D.card(el, {
    fig: `Fig ${num}`,
    title: "Орбиты и Кеплер",
    hint: "Меняйте скорость запуска",
    keys: [
      { mark: "lit", label: "Планета и её скорость" },
      { mark: "dotted", label: "След орбиты" },
    ],
    caption: "Модель: одна звезда, сила тяготения F = GMm/r². При v = v₁ орбита круговая, при v₁ < v < √2·v₁ — эллипс, при v ≥ √2·v₁ планета уходит навсегда. Масштаб времени ускорен.",
    controls: Lab.range("v", "Скорость", { min: 0.55, max: 1.5, step: 0.01, value: 1.15 }) + Lab.button("go", "Запуск", true),
  });
  const S = Lab3D.scene(ui, { azimuth: 40, elevation: 34, radius: 98, center: [0, 0, 8] });
  const { T } = S;
  S.plate(190, 150);
  const Z = 22;
  S.cyl(16, 4, 0, 0, 0, "face", "mid", 48);
  S.cyl(1.6, Z - 8, 0, 0, 4, "shade", "mid");
  const ring = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    ring.push([Math.cos(a) * 70, Math.sin(a) * 70, Z]);
  }
  S.line(ring, "faint");
  const ticks = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r2 = i % 6 ? 66 : 62;
    ticks.push(new T.Vector3(Math.cos(a) * 70, Math.sin(a) * 70, Z), new T.Vector3(Math.cos(a) * r2, Math.sin(a) * r2, Z));
  }
  S.scene.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(ticks), S.lineMat("lo")));
  const star = new T.Mesh(new T.SphereGeometry(8, 48, 32), new T.MeshBasicMaterial({ color: 0xf0a020 }));
  star.position.set(0, 0, Z);
  S.scene.add(star);
  const glowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,200,90,0.9)");
    gr.addColorStop(0.35, "rgba(255,170,60,0.35)");
    gr.addColorStop(1, "rgba(255,150,40,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  })();
  const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex, depthWrite: false, transparent: true }));
  glow.scale.set(46, 46, 1);
  glow.position.copy(star.position);
  S.scene.add(glow);
  const planet = new T.Mesh(new T.SphereGeometry(3.6, 32, 20), S.mat("lit"));
  S.outline(planet, "hi", 80);
  S.scene.add(planet);
  const vel = S.arrow("hi", { shaft: 0.35, head: 1.6, headLen: 4 });
  const MAXT = 900;
  const trailPos = new Float32Array(MAXT * 3);
  const trailGeo = new T.BufferGeometry();
  trailGeo.setAttribute("position", new T.BufferAttribute(trailPos, 3));
  const trail = new T.Line(trailGeo, S.lineMat("mid"));
  S.scene.add(trail);

  const GM = 1, R0 = 30;
  const v1 = Math.sqrt(GM / R0);
  let vk = 1.15;
  const st = { p: new T.Vector2(), v: new T.Vector2(), n: 0, t: 0, gone: 0 };
  function launch() {
    st.p.set(R0, 0);
    st.v.set(0, vk * v1);
    st.n = 0;
    st.t = 0;
    st.gone = 0;
  }
  launch();
  const k = 2.4;
  Lab3D.run(ui, S, (dt, calm) => {
    const steps = 60;
    const h = (calm ? 0 : dt * 22) / steps;
    for (let i = 0; i < steps; i++) {
      const r = st.p.length();
      const a = st.p.clone().multiplyScalar(-GM / (r * r * r));
      st.v.addScaledVector(a, h);
      st.p.addScaledVector(st.v, h);
    }
    st.t += dt;
    const r = st.p.length();
    const pos = new T.Vector3(st.p.x * k, st.p.y * k, Z);
    planet.position.copy(pos);
    vel.set(pos, pos.clone().add(new T.Vector3(st.v.x, st.v.y, 0).multiplyScalar(k * 70)));
    if (st.n < MAXT) {
      trailPos.set([pos.x, pos.y, pos.z], st.n * 3);
      st.n++;
    } else {
      trailPos.copyWithin(0, 3);
      trailPos.set([pos.x, pos.y, pos.z], (MAXT - 1) * 3);
    }
    trailGeo.setDrawRange(0, st.n);
    trailGeo.attributes.position.needsUpdate = true;
    const E = st.v.lengthSq() / 2 - GM / r;
    const kind = Math.abs(vk - 1) < 0.015 ? "круговая орбита" : E < 0 ? "эллипс" : "уходит на бесконечность";
    ui.say(`v = ${fmt(vk, 2)}·v₁ · r = ${fmt(r / R0, 2)}·R₀ · скорость сейчас ${fmt(st.v.length() / v1, 2)}·v₁ · ${kind}`);
    if (r * k > 115) {
      st.gone += dt;
      if (st.gone > 1.2) launch();
    }
    return true;
  });
  Lab.bindRange(ui, "v", (v) => {
    vk = v;
    launch();
  }, (v) => `${fmt(v, 2)}·v₁`);
  ui.control("go").addEventListener("click", launch);
};
