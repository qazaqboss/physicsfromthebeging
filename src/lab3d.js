const FIG3D = {};

const Lab3D = {
  _loading: null,
  ready() {
    if (window.THREE) return Promise.resolve();
    if (!this._loading) {
      this._loading = new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "vendor/three.min.js";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return this._loading;
  },

  palette() {
    const cs = getComputedStyle(document.body);
    const v = (n) => cs.getPropertyValue(n).trim() || "#888";
    return {
      card: v("--anatomy-card"),
      face: v("--anatomy-face"),
      top: v("--anatomy-top"),
      shade: v("--anatomy-shade-1"),
      hi: v("--anatomy-hi"),
      mid: v("--anatomy-mid"),
      lo: v("--anatomy-lo"),
      faint: v("--anatomy-faint"),
      lit: v("--anatomy-lit"),
      red: v("--anatomy-red"),
      green: v("--anatomy-green"),
      blue: v("--anatomy-blue"),
      dark: document.body.dataset.theme === "dark",
    };
  },

  card(el, { fig, title, hint, keys = [], caption, controls = "", label, hud = "" }) {
    const stage = `<div class="iso-stage lab3d-stage" tabindex="0" role="group" aria-label="${label || title}"><canvas class="lab3d-canvas"></canvas>${hud ? `<div class="lab3d-hud">${hud}</div>` : ""}<div class="lab3d-drag" aria-hidden="true">⟲ вращайте</div></div>`;
    el.innerHTML = k.plateHtml({ fig, title, hint, readout: "", keys, caption, body: stage + (controls ? `<div class="lab-controls">${controls}</div>` : "") });
    const root = el.querySelector(".iso-figure");
    return {
      root,
      stage: root.querySelector(".iso-stage"),
      canvas: root.querySelector("canvas"),
      hud: root.querySelector(".lab3d-hud"),
      readout: root.querySelector("[data-readout]"),
      control: (name) => root.querySelector(`[data-control="${name}"]`),
      say(text) {
        if (this.readout.textContent !== text) this.readout.textContent = text;
      },
    };
  },

  scene(ui, { azimuth = 40, elevation = 28, radius = 100, center = [0, 0, 20], aspect = 0.68 } = {}) {
    const T = THREE;
    const renderer = new T.WebGLRenderer({ canvas: ui.canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    const scene = new T.Scene();
    const cam = new T.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
    cam.up.set(0, 0, 1);
    const view = { az: azimuth, el: elevation, radius, center: new T.Vector3(...center), aspect };
    const hemi = new T.HemisphereLight(0xffffff, 0x888888, 0.75);
    hemi.position.set(0, 0, 1);
    const sun = new T.DirectionalLight(0xffffff, 0.55);
    sun.position.set(-0.6, -1, 1.6);
    const amb = new T.AmbientLight(0xffffff, 0.32);
    scene.add(hemi, sun, amb);
    const mats = [];
    const lines = [];
    let P = Lab3D.palette();

    const api = {
      T,
      scene,
      cam,
      renderer,
      view,
      get P() {
        return P;
      },
      mat(role = "face", extra = {}) {
        const m = new T.MeshLambertMaterial({ color: P[role] || role, ...extra });
        m.userData.role = role;
        mats.push(m);
        return m;
      },
      lineMat(role = "hi", extra = {}) {
        const m = new T.LineBasicMaterial({ color: P[role] || role, ...extra });
        m.userData.role = role;
        lines.push(m);
        return m;
      },
      outline(mesh, role = "hi", angle = 30) {
        const e = new T.LineSegments(new T.EdgesGeometry(mesh.geometry, angle), api.lineMat(role));
        mesh.add(e);
        return mesh;
      },
      solid(geo, role = "face", lineRole = "hi", angle = 30) {
        const m = new T.Mesh(geo, api.mat(role, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
        return api.outline(m, lineRole, angle);
      },
      box(w, d, h, x, y, z, role = "face", line = "hi") {
        const m = api.solid(new T.BoxGeometry(w, d, h), role, line);
        m.position.set(x, y, z + h / 2);
        scene.add(m);
        return m;
      },
      cyl(r, h, x, y, z, role = "face", line = "hi", seg = 32) {
        const g = new T.CylinderGeometry(r, r, h, seg);
        g.rotateX(Math.PI / 2);
        const m = api.solid(g, role, line, 40);
        m.position.set(x, y, z + h / 2);
        scene.add(m);
        return m;
      },
      line(points, role = "hi", extra) {
        const g = new T.BufferGeometry().setFromPoints(points.map((p) => (p.isVector3 ? p : new T.Vector3(...p))));
        const l = new T.Line(g, api.lineMat(role, extra));
        scene.add(l);
        return l;
      },
      plate(w, d, h = 6) {
        const g = new T.Group();
        const slab = api.solid(new T.BoxGeometry(w, d, h), "face", "mid");
        slab.position.z = -h / 2;
        g.add(slab);
        const inset = 5;
        const groove = [[-w / 2 + inset, -d / 2 + inset], [w / 2 - inset, -d / 2 + inset], [w / 2 - inset, d / 2 - inset], [-w / 2 + inset, d / 2 - inset], [-w / 2 + inset, -d / 2 + inset]];
        g.add(new T.Line(new T.BufferGeometry().setFromPoints(groove.map(([x, y]) => new T.Vector3(x, y, 0.05))), api.lineMat("lo")));
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const fg = new T.CylinderGeometry(4, 4.6, 3, 24);
          fg.rotateX(Math.PI / 2);
          const f = api.solid(fg, "shade", "mid", 40);
          f.position.set(sx * (w / 2 - 14), sy * (d / 2 - 14), -h - 1.5);
          g.add(f);
          const sg = new T.CircleGeometry(1.4, 16);
          const s = new T.Mesh(sg, api.mat("mid"));
          s.position.set(sx * (w / 2 - 8), sy * (d / 2 - 8), 0.08);
          g.add(s);
        }
        scene.add(g);
        return g;
      },
      arrow(role = "hi", { shaft = 0.5, head = 2.2, headLen = 5 } = {}) {
        const g = new T.Group();
        const sg = new T.CylinderGeometry(shaft, shaft, 1, 10);
        sg.translate(0, 0.5, 0);
        const s = new T.Mesh(sg, api.mat(role));
        const hg = new T.ConeGeometry(head, headLen, 16);
        hg.translate(0, -headLen / 2, 0);
        const h = new T.Mesh(hg, api.mat(role));
        g.add(s, h);
        g.userData = { s, h, headLen };
        g.set = (from, to) => {
          const a = from.isVector3 ? from : new T.Vector3(...from);
          const b = to.isVector3 ? to : new T.Vector3(...to);
          const dir = b.clone().sub(a);
          const len = dir.length();
          g.visible = len > 0.01;
          if (!g.visible) return;
          g.position.copy(a);
          g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize());
          const hl = Math.min(headLen, len * 0.45);
          s.scale.set(1, Math.max(0.001, len - hl * 0.9), 1);
          h.scale.set(hl / headLen, hl / headLen, hl / headLen);
          h.position.set(0, len, 0);
        };
        scene.add(g);
        return g;
      },
      repaint() {
        P = Lab3D.palette();
        mats.forEach((m) => m.color.set(P[m.userData.role] || m.userData.role));
        lines.forEach((m) => m.color.set(P[m.userData.role] || m.userData.role));
        hemi.groundColor.set(P.dark ? 0x222222 : 0x9a9a9a);
        hemi.intensity = P.dark ? 0.55 : 0.75;
        api.dirty = true;
      },
      resize() {
        const w = ui.canvas.clientWidth || 600;
        const h = Math.round(w * view.aspect);
        ui.canvas.style.height = `${h}px`;
        renderer.setSize(w, h, false);
        const r = view.radius;
        const ar = w / h;
        cam.left = -r * ar;
        cam.right = r * ar;
        cam.top = r;
        cam.bottom = -r;
        cam.updateProjectionMatrix();
        api.dirty = true;
      },
      place() {
        const a = (view.az * Math.PI) / 180;
        const e = (view.el * Math.PI) / 180;
        const d = 600;
        cam.position.set(view.center.x + Math.cos(e) * Math.cos(a) * d, view.center.y + Math.cos(e) * Math.sin(a) * d, view.center.z + Math.sin(e) * d);
        cam.lookAt(view.center);
      },
      render() {
        api.place();
        renderer.render(scene, cam);
        api.dirty = false;
      },
      dirty: true,
    };

    let drag = null;
    const hint = ui.stage.querySelector(".lab3d-drag");
    ui.canvas.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, az: view.az, el: view.el, id: e.pointerId, moved: false };
    });
    addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
      if (!drag.moved && Math.abs(dy) > Math.abs(dx) * 1.4 && e.pointerType === "touch") {
        drag = null;
        return;
      }
      drag.moved = true;
      if (hint) hint.style.opacity = "0";
      view.az = drag.az - dx * 0.4;
      view.el = Math.max(5, Math.min(85, drag.el + dy * 0.3));
      api.dirty = true;
    });
    addEventListener("pointerup", () => (drag = null));
    ui.canvas.style.touchAction = "pan-y";

    api.repaint();
    api.resize();
    new ResizeObserver(() => api.resize()).observe(ui.canvas);
    new MutationObserver(() => api.repaint()).observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
    return api;
  },

  run(ui, api, tick) {
    let alive = true;
    Lab.loop(ui.stage, (dt, calm) => {
      if (!ui.stage.isConnected) {
        if (alive) {
          alive = false;
          api.renderer.dispose();
        }
        return false;
      }
      const changed = tick(dt, calm);
      if (changed !== false || api.dirty) api.render();
      return true;
    });
  },

  mount(el, name, num) {
    el.innerHTML = `<div class="lab3d-loading">Загружаем 3D-лабораторию…</div>`;
    Lab3D.ready()
      .then(() => {
        if (el.isConnected) FIG3D[name](el, num);
      })
      .catch(() => {
        el.innerHTML = `<div class="lab3d-loading">Не удалось загрузить 3D (нет файла vendor/three.min.js).</div>`;
      });
  },

  matrixHtml(rows, cls = "") {
    return `<table class="mtx ${cls}"><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${typeof v === "number" ? fmt(v, 2) : v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  },
};
