FIG3D.rotation = (el, num) => {
  const ui = Lab3D.card(el, {
    fig: `Fig ${num}`,
    title: "Матрица поворота",
    hint: "Крутите углы, сравните порядок",
    keys: [
      { mark: "red", label: "Ось x′" },
      { mark: "green", label: "Ось y′" },
      { mark: "blue", label: "Ось z′" },
      { mark: "dashed", label: "Тот же поворот в обратном порядке" },
    ],
    caption: "R = Rz(γ)·Ry(β)·Rx(α). Столбцы матрицы — это куда переходят базисные векторы: первый столбец — новая ось x′, второй — y′, третий — z′. Определитель всегда равен 1.",
    controls: Lab.range("a", "α вокруг x", { min: -180, max: 180, step: 1, value: 35 }) + Lab.range("b", "β вокруг y", { min: -90, max: 90, step: 1, value: 25 }) + Lab.range("g", "γ вокруг z", { min: -180, max: 180, step: 1, value: 20 }) + `<label class="guide-auto lab-check"><input type="checkbox" data-control="ghost" checked> показать обратный порядок</label>`,
    hud: `<div class="mtx-wrap"><span class="mtx-label">R =</span><div data-hud="m"></div></div><div class="mtx-sub" data-hud="det"></div>`,
  });
  const S = Lab3D.scene(ui, { azimuth: 38, elevation: 24, radius: 74, center: [0, 0, 30] });
  const { T } = S;
  S.plate(150, 110);
  S.cyl(14, 4, 0, 0, 0, "face", "mid", 48);
  S.cyl(2, 14, 0, 0, 4, "shade", "mid");
  const C = new T.Vector3(0, 0, 38);
  const gim = [];
  for (let i = 0; i < 3; i++) {
    const tg = new T.TorusGeometry(30 - i * 3.5, 0.6, 8, 96);
    const t = new T.Mesh(tg, S.mat("mid"));
    t.position.copy(C);
    S.scene.add(t);
    gim.push(t);
  }
  const body = new T.Group();
  body.position.copy(C);
  const book = S.solid(new T.BoxGeometry(26, 18, 6), "face", "hi");
  body.add(book);
  const spine = S.solid(new T.BoxGeometry(26, 2, 6.4), "lit", "hi");
  spine.position.y = -9;
  body.add(spine);
  const label = S.solid(new T.BoxGeometry(14, 6, 0.6), "shade", "mid");
  label.position.z = 3.2;
  body.add(label);
  S.scene.add(body);
  const axes = ["red", "green", "blue"].map((c) => S.arrow(c, { shaft: 0.55, head: 2, headLen: 5 }));
  const ghost = ["red", "green", "blue"].map((c) => {
    const pts = [new T.Vector3(), new T.Vector3()];
    const l = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: 0x888888, dashSize: 2, gapSize: 1.6 }));
    l.material.userData.role = c;
    S.scene.add(l);
    return l;
  });
  const fixed = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((v) => S.line([C.toArray(), C.clone().add(new T.Vector3(...v).multiplyScalar(36)).toArray()], "faint"));
  const ang = { a: 35, b: 25, g: 20 };
  const cur = { a: 35, b: 25, g: 20 };
  const showGhost = ui.control("ghost");
  const rad = (x) => (x * Math.PI) / 180;
  const Rx = (t) => new T.Matrix4().makeRotationX(rad(t));
  const Ry = (t) => new T.Matrix4().makeRotationY(rad(t));
  const Rz = (t) => new T.Matrix4().makeRotationZ(rad(t));

  Lab3D.run(ui, S, (dt, calm) => {
    let moved = false;
    for (const key of ["a", "b", "g"]) {
      const n = Lab.follow(cur[key], ang[key], dt, 0.18, calm);
      if (n !== cur[key]) moved = true;
      cur[key] = n;
    }
    const R = Rz(cur.g).multiply(Ry(cur.b)).multiply(Rx(cur.a));
    const Rrev = Rx(cur.a).multiply(Ry(cur.b)).multiply(Rz(cur.g));
    body.quaternion.setFromRotationMatrix(R);
    gim[0].quaternion.setFromRotationMatrix(Rz(cur.g).multiply(new T.Matrix4().makeRotationX(Math.PI / 2)));
    gim[1].quaternion.setFromRotationMatrix(Rz(cur.g).multiply(Ry(cur.b)).multiply(new T.Matrix4().makeRotationY(Math.PI / 2)));
    gim[2].quaternion.setFromRotationMatrix(R);
    const e = R.elements;
    const cols = [0, 1, 2].map((c) => new T.Vector3(e[c * 4], e[c * 4 + 1], e[c * 4 + 2]));
    cols.forEach((v, i) => axes[i].set(C, C.clone().addScaledVector(v, 30)));
    const er = Rrev.elements;
    ghost.forEach((l, i) => {
      const v = new T.Vector3(er[i * 4], er[i * 4 + 1], er[i * 4 + 2]);
      l.geometry.setFromPoints([C, C.clone().addScaledVector(v, 30)]);
      l.computeLineDistances();
      l.material.color.set(S.P[l.material.userData.role]);
      l.visible = showGhost.checked;
    });
    const rows = [0, 1, 2].map((r) => [0, 1, 2].map((c) => e[c * 4 + r]));
    const m = Lab3D.matrixHtml(rows);
    if (ui.hud.dataset.m !== m) {
      ui.hud.querySelector('[data-hud="m"]').innerHTML = m;
      ui.hud.dataset.m = m;
    }
    const det = new T.Matrix3().setFromMatrix4(R).determinant();
    const diff = cols.reduce((s, v, i) => s + v.distanceTo(new T.Vector3(er[i * 4], er[i * 4 + 1], er[i * 4 + 2])), 0);
    ui.hud.querySelector('[data-hud="det"]').textContent = `det R = ${fmt(det, 3)} · Rᵀ·R = 1`;
    ui.say(`α = ${Math.round(cur.a)}° · β = ${Math.round(cur.b)}° · γ = ${Math.round(cur.g)}° · Rz·Ry·Rx ${diff > 0.05 ? "≠" : "="} Rx·Ry·Rz`);
    return moved || true;
  });
  for (const key of ["a", "b", "g"]) Lab.bindRange(ui, key, (v) => (ang[key] = v), (v) => `${v}°`);
};

FIG3D.bloch = (el, num) => {
  const ui = Lab3D.card(el, {
    fig: `Fig ${num}`,
    title: "Сфера Блоха",
    hint: "Наклоняйте спин, включите поле",
    keys: [
      { mark: "lit", label: "Вектор состояния |ψ⟩" },
      { mark: "dashed", label: "Проекции ⟨σx⟩, ⟨σy⟩, ⟨σz⟩" },
    ],
    caption: "Полюса — базисные состояния |0⟩ (спин вверх) и |1⟩ (спин вниз). Любая точка сферы — суперпозиция. В поле B вдоль z спин прецессирует: φ растёт с ларморовской частотой, а вероятности P(↑) и P(↓) не меняются.",
    controls: Lab.range("th", "θ", { min: 0, max: 180, step: 1, value: 60 }) + Lab.range("ph", "φ", { min: 0, max: 360, step: 1, value: 30 }) + `<label class="guide-auto lab-check"><input type="checkbox" data-control="field" checked> поле B вдоль z</label>`,
    hud: `<div class="ket" data-hud="ket"></div><div class="prob"><span>P(↑)</span><i><b data-hud="pu"></b></i><em data-hud="pv"></em></div><div class="mtx-row"><div><span class="mtx-label">σx</span>${Lab3D.matrixHtml([[0, 1], [1, 0]], "sm")}</div><div><span class="mtx-label">σy</span>${Lab3D.matrixHtml([[0, "−i"], ["i", 0]], "sm")}</div><div><span class="mtx-label">σz</span>${Lab3D.matrixHtml([[1, 0], [0, -1]], "sm")}</div></div>`,
  });
  const S = Lab3D.scene(ui, { azimuth: 30, elevation: 20, radius: 72, center: [0, 0, 40] });
  const { T } = S;
  S.plate(130, 100);
  S.cyl(16, 4, 0, 0, 0, "face", "mid", 48);
  S.cyl(1.8, 10, 0, 0, 4, "shade", "mid");
  const C = new T.Vector3(0, 0, 48);
  const R = 30;
  const shell = new T.Mesh(new T.SphereGeometry(R, 48, 32), new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false }));
  shell.position.copy(C);
  S.scene.add(shell);
  const circle = (n, f) => {
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(f((i / n) * Math.PI * 2));
    return pts;
  };
  for (const lat of [-60, -30, 0, 30, 60]) {
    const z = Math.sin((lat * Math.PI) / 180) * R, r = Math.cos((lat * Math.PI) / 180) * R;
    S.line(circle(96, (a) => [C.x + r * Math.cos(a), C.y + r * Math.sin(a), C.z + z]), lat === 0 ? "mid" : "faint");
  }
  for (let m = 0; m < 6; m++) {
    const p = (m / 6) * Math.PI;
    S.line(circle(96, (a) => [C.x + R * Math.sin(a) * Math.cos(p), C.y + R * Math.sin(a) * Math.sin(p), C.z + R * Math.cos(a)]), m === 0 ? "mid" : "faint");
  }
  const ring = new T.Mesh(new T.TorusGeometry(R + 2, 1, 10, 96), S.mat("face"));
  ring.position.copy(C);
  S.scene.add(ring);
  S.box(3, 3, C.z - R - 14, 0, 0, 14, "shade", "mid");
  const axC = { x: "red", y: "green", z: "blue" };
  S.arrow(axC.x, { shaft: 0.3, head: 1.3, headLen: 3.5 }).set(C, C.clone().add(new T.Vector3(R + 8, 0, 0)));
  S.arrow(axC.y, { shaft: 0.3, head: 1.3, headLen: 3.5 }).set(C, C.clone().add(new T.Vector3(0, R + 8, 0)));
  S.arrow(axC.z, { shaft: 0.3, head: 1.3, headLen: 3.5 }).set(C, C.clone().add(new T.Vector3(0, 0, R + 8)));
  const poleUp = new T.Mesh(new T.SphereGeometry(1.6, 16, 12), S.mat("hi"));
  poleUp.position.set(C.x, C.y, C.z + R);
  const poleDn = poleUp.clone();
  poleDn.position.set(C.x, C.y, C.z - R);
  S.scene.add(poleUp, poleDn);
  const psi = S.arrow("lit", { shaft: 0.9, head: 2.8, headLen: 6.5 });
  const tip = new T.Mesh(new T.SphereGeometry(2.4, 24, 16), S.mat("lit"));
  S.outline(tip, "hi", 80);
  S.scene.add(tip);
  const dash = (role) => {
    const l = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]), new T.LineDashedMaterial({ color: S.P[role], dashSize: 1.6, gapSize: 1.2 }));
    l.material.userData.role = role;
    S.scene.add(l);
    return l;
  };
  const dz = dash("hi"), dxy = dash("mid");
  const TRAIL = 220;
  const trPos = new Float32Array(TRAIL * 3);
  const trGeo = new T.BufferGeometry();
  trGeo.setAttribute("position", new T.BufferAttribute(trPos, 3));
  S.scene.add(new T.Line(trGeo, S.lineMat("mid")));
  let tn = 0;
  const target = { th: 60, ph: 30 };
  const cur = { th: 60, ph: 30 };
  const field = ui.control("field");
  const phIn = ui.control("ph");
  Lab3D.run(ui, S, (dt, calm) => {
    if (field.checked && !calm) {
      target.ph = (target.ph + dt * 50) % 360;
      cur.ph = target.ph;
      phIn.value = String(Math.round(target.ph));
      ui.root.querySelector('[data-out="ph"]').textContent = `${Math.round(target.ph)}°`;
    } else {
      let d = target.ph - cur.ph;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      cur.ph = Lab.follow(cur.ph, cur.ph + d, dt, 0.18, calm);
    }
    cur.th = Lab.follow(cur.th, target.th, dt, 0.18, calm);
    const th = (cur.th * Math.PI) / 180, ph = (cur.ph * Math.PI) / 180;
    const v = new T.Vector3(Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th));
    const p = C.clone().addScaledVector(v, R);
    psi.set(C, p);
    tip.position.copy(p);
    dz.geometry.setFromPoints([p, new T.Vector3(C.x, C.y, p.z)]);
    dz.computeLineDistances();
    dxy.geometry.setFromPoints([p, new T.Vector3(p.x, p.y, C.z)]);
    dxy.computeLineDistances();
    [dz, dxy].forEach((l) => l.material.color.set(S.P[l.material.userData.role]));
    if (tn < TRAIL) tn++;
    else trPos.copyWithin(0, 3);
    trPos.set(p.toArray(), (tn - 1) * 3);
    trGeo.setDrawRange(0, tn);
    trGeo.attributes.position.needsUpdate = true;
    const a0 = Math.cos(th / 2), a1 = Math.sin(th / 2);
    const P0 = a0 * a0;
    ui.hud.querySelector('[data-hud="ket"]').innerHTML = `|ψ⟩ = ${fmt(a0, 2)}|0⟩ + e<sup>i·${Math.round(cur.ph)}°</sup>·${fmt(a1, 2)}|1⟩`;
    ui.hud.querySelector('[data-hud="pu"]').style.width = `${(P0 * 100).toFixed(1)}%`;
    ui.hud.querySelector('[data-hud="pv"]').textContent = `${Math.round(P0 * 100)} %`;
    ui.say(`θ = ${Math.round(cur.th)}° · φ = ${Math.round(cur.ph)}° · ⟨σx⟩ = ${fmt(v.x)} · ⟨σy⟩ = ${fmt(v.y)} · ⟨σz⟩ = ${fmt(v.z)} · P(↑) = ${fmt(P0)}`);
    return true;
  });
  Lab.bindRange(ui, "th", (v) => {
    target.th = v;
    tn = 0;
  }, (v) => `${v}°`);
  Lab.bindRange(ui, "ph", (v) => {
    target.ph = v;
  }, (v) => `${v}°`);
  phIn.addEventListener("input", () => {
    field.checked = false;
    tn = 0;
  });
};
