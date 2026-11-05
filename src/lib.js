const FIG = {};
const STILL = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = (v, d = 2) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d).replace(".", ",");
const G_ACC = 9.81;

const Lab = {
  S: (paths, style) => k.solidSvg(paths, style),
  L: (d, style) => k.lineSvg(d, style),
  D: (points, style) => k.dotsSvg(points, style),

  byDepth(points, P) {
    return [...points].sort((a, b) => k.depthOf([a[0], a[1], a[2] || 0], P) - k.depthOf([b[0], b[1], b[2] || 0], P));
  },

  plate(P, plan, { h = 12, foot = 5, ruler = null, label = null, groove = 5 } = {}) {
    const { S, L, D } = Lab;
    const at = (p) => k.iso(p, P);
    const out = [`<path class="iso-halo" d="${k.haloOf(plan, -h - foot, h, P)}"/>`];
    for (const [x, y] of Lab.byDepth(k.corners(plan, 20), P)) {
      out.push(S(k.cylinder(x, y, 7, -h - foot, 1.6, P, 28), { tone: "lo" }));
      out.push(S(k.cylinder(x, y, 5.4, -h - foot + 1.6, foot - 1.6, P, 28), { tone: "mid" }));
    }
    out.push(S(k.slabOf(plan, -h, h, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(plan, -h + 3, P, 8), { tone: "faint" }) }));
    out.push(L(k.planOutline(k.insetPlan(plan, groove), 0, P), { tone: "lo" }));
    const screws = k.corners(plan, 10);
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
    out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
    if (ruler) {
      const strip = { r: 1, d: 7, ...ruler };
      out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
      const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, ruler.step || 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
      out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
      out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
    }
    if (label) out.push(Lab.labelPlate(P, label));
    return out.join("");
  },

  labelPlate(P, plan, z = 0) {
    const { S, L, D } = Lab;
    const p = { r: 1, ...plan };
    const out = [S(k.slabOf(p, z, 0.8, P, 4), { tone: "lo", crease: "none" })];
    out.push(L(k.planOutline(k.insetPlan(p, 1.6), z + 0.8, P, 3), { tone: "faint" }));
    const lines = [0.75, 0.55, 0.35];
    lines.forEach((share, i) => {
      const y = p.y + 4 + i * ((p.d - 8) / 2);
      out.push(L(k.lineOnTop([p.x + 4, y], [p.x + 4 + (p.w - 10) * share, y], z + 0.8, P), { tone: "lo", free: true }));
    });
    out.push(D([k.iso([p.x + 2.2, p.y + p.d / 2, z + 0.8], P), k.iso([p.x + p.w - 2.2, p.y + p.d / 2, z + 0.8], P)], { size: 0.4 }));
    return out.join("");
  },

  knob(P, cx, cy, r, z, h, turn = 0) {
    const { S, L, D } = Lab;
    const a = turn * Math.PI * 2;
    return [
      S(k.cylinder(cx, cy, r + 1.2, z, 1.2, P, 32), { tone: "lo" }),
      S(k.cylinder(cx, cy, r, z + 1.2, h, P, 32), { tone: "mid" }),
      L(k.knurl(cx, cy, r, z + 1.2, z + 1.2 + h, 36, P), { tone: "lo" }),
      L(k.lineOnTop([cx, cy], [cx + Math.sin(a) * (r - 1), cy - Math.cos(a) * (r - 1)], z + 1.2 + h, P), { tone: "hi", free: "end" }),
      D([k.iso([cx, cy, z + 1.2 + h], P)], { size: 0.5, tone: "hi" }),
    ].join("");
  },

  screwDots(P, points, size = 0.45) {
    return Lab.D(points.map((p) => k.iso(p, P)), { size });
  },

  card(el, { fig, title, hint, readout, keys = [], caption, svg, controls = "", label }) {
    const stage = `<div class="iso-stage" tabindex="0" role="group" aria-label="${label || title}">${svg}</div>`;
    el.innerHTML = k.plateHtml({ fig, title, hint, readout, keys, caption, body: stage + (controls ? `<div class="lab-controls">${controls}</div>` : "") });
    const root = el.querySelector(".iso-figure");
    return {
      root,
      stage: root.querySelector(".iso-stage"),
      svg: root.querySelector("svg"),
      readout: root.querySelector("[data-readout]"),
      part: (name) => root.querySelector(`[data-part="${name}"]`),
      control: (name) => root.querySelector(`[data-control="${name}"]`),
      say(text) {
        if (this.readout.textContent !== text) this.readout.textContent = text;
      },
    };
  },

  range(name, label, { min, max, step, value, unit = "" }) {
    return `<label class="lab-range"><span class="lab-range-label">${label}</span><input type="range" data-control="${name}" min="${min}" max="${max}" step="${step}" value="${value}"><output data-out="${name}">${value}${unit ? " " + unit : ""}</output></label>`;
  },

  button(name, label, primary = false) {
    return `<button type="button" class="lab-btn"${primary ? " data-primary" : ""} data-control="${name}">${label}</button>`;
  },

  segmented(name, options, value) {
    return `<div class="lab-seg" role="radiogroup" data-control="${name}">${options
      .map(([v, text]) => `<button type="button" role="radio" aria-checked="${String(v) === String(value)}" data-value="${v}">${text}</button>`)
      .join("")}</div>`;
  },

  bindRange(ui, name, onInput, format) {
    const input = ui.control(name);
    const out = ui.root.querySelector(`[data-out="${name}"]`);
    const update = () => {
      const v = parseFloat(input.value);
      if (out) out.textContent = format ? format(v) : String(v);
      onInput(v);
    };
    input.addEventListener("input", update);
    update();
    return input;
  },

  bindSeg(ui, name, onPick) {
    const group = ui.control(name);
    const set = (value) => {
      group.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.value === String(value))));
    };
    group.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      set(b.dataset.value);
      onPick(b.dataset.value);
    });
    return set;
  },

  loop(stage, tick) {
    let frame = 0;
    let last = 0;
    let visible = false;
    const step = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      const going = tick(dt, STILL.matches);
      frame = visible && going !== false ? requestAnimationFrame(step) : 0;
    };
    const run = () => {
      if (!frame && visible) {
        last = 0;
        frame = requestAnimationFrame(step);
      }
    };
    new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) run();
      },
      { rootMargin: "80px 0px" },
    ).observe(stage);
    return { run };
  },

  follow(current, target, dt, seconds, calm) {
    if (calm) return target;
    const next = current + (target - current) * (1 - Math.exp(-dt / seconds));
    return Math.abs(target - next) < 1e-4 ? target : next;
  },

  idle(ms, fn) {
    let t = 0;
    return () => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  },

  pointerShare(ui, event, from = 0.15, to = 0.85) {
    const box = ui.svg.getBoundingClientRect();
    return clamp(((event.clientX - box.left) / box.width - from) / (to - from), 0, 1);
  },

  ball(P, centre, r, { tone = "hi", lit = false, steps = 48 } = {}) {
    return k.solidSvg(G.sphereOf(centre, r, P, { steps }), { tone, lit, crease: "none" });
  },

  helix(P, cx, cy, r, z0, z1, turns, steps = 24) {
    const tv = k.towardViewer(P);
    const back = [];
    const front = [];
    const n = Math.max(8, Math.round(turns * steps));
    let run = null;
    let side = null;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * turns * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const p = [cx + r * c, cy + r * s, lerp(z0, z1, i / n)];
      const facing = c * tv[0] + s * tv[1] >= 0 ? "front" : "back";
      if (facing !== side) {
        if (run && run.length) run.push(p);
        run = run ? [run[run.length - 1]] : [];
        (facing === "front" ? front : back).push(run);
        side = facing;
      }
      run.push(p);
    }
    const draw = (runs) => runs.filter((r) => r.length > 1).map((r) => k.pathOf(r.map((p) => k.iso(p, P)))).join("");
    return { back: draw(back), front: draw(front) };
  },
};
