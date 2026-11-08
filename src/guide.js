const Guide = (() => {
  const STEPS = GUIDE_STEPS;
  const DATA = typeof GUIDE_DATA === "object" ? GUIDE_DATA : {};
  const BARS = 28;
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const words = (text) => text.split(/\s+/).filter(Boolean);
  const bars5 = '<i></i>'.repeat(5);

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "guide-launcher";
  launcher.setAttribute("aria-label", "Голосовой гид");
  launcher.innerHTML = `<span class="guide-avatar" aria-hidden="true">${bars5}</span><span class="guide-launcher-text"><b>Гид Лина</b><span>экскурсия голосом</span></span>`;

  const panel = document.createElement("section");
  panel.className = "guide";
  panel.setAttribute("aria-label", "Голосовой гид");
  panel.hidden = true;
  panel.innerHTML = `
    <header class="guide-head">
      <span class="guide-avatar guide-avatar-lg" aria-hidden="true">${bars5}</span>
      <div class="guide-who"><b>Лина</b><span data-g="where"></span></div>
      <span class="guide-count" data-g="count"></span>
      <button type="button" class="guide-x" data-g="close" aria-label="Закрыть гида">✕</button>
    </header>
    <div class="guide-wave" aria-hidden="true">${"<i></i>".repeat(BARS)}</div>
    <p class="guide-text" data-g="text" aria-live="polite"></p>
    <div class="guide-bar" aria-hidden="true"><span data-g="bar"></span></div>
    <footer class="guide-ctrl">
      <button type="button" class="guide-btn" data-g="prev" aria-label="Назад">‹</button>
      <button type="button" class="guide-btn guide-play" data-g="play" aria-label="Пауза"><span></span></button>
      <button type="button" class="guide-btn" data-g="next" aria-label="Дальше">›</button>
      <label class="guide-auto"><input type="checkbox" data-g="auto" checked> авто</label>
      <div class="guide-dots" data-g="dots">${STEPS.map((s, i) => `<button type="button" data-step="${i}" aria-label="${esc(s.title)}"></button>`).join("")}</div>
    </footer>`;

  const ring = document.createElement("div");
  ring.className = "guide-ring";
  ring.hidden = true;
  document.body.append(ring, launcher, panel);

  const $ = (name) => panel.querySelector(`[data-g="${name}"]`);
  const bars = [...panel.querySelectorAll(".guide-wave i")];
  const audio = new Audio();
  audio.preload = "auto";
  const clip = new Audio();
  clip.preload = "auto";
  let clipBtn = null;

  const st = { i: 0, open: false, playing: false, wordEls: [], timings: null, env: [], raf: 0, next: 0, act: 0, targetEl: null, upto: -2 };
  const api = { navigating: false };
  const auto = $("auto");
  auto.checked = store.get("guide-auto", true);
  auto.addEventListener("change", () => store.set("guide-auto", auto.checked));

  function renderText(step) {
    const list = words(step.text);
    const d = DATA[step.id] || {};
    st.timings = d.words && d.words.length === list.length ? d.words : null;
    st.env = d.env || [];
    $("text").innerHTML = list.map((w) => `<span>${esc(w)}</span>`).join(" ");
    st.wordEls = [...$("text").children];
    st.upto = -2;
    $("text").scrollTop = 0;
  }

  function placeRing() {
    const el = st.targetEl;
    if (!el || !st.open || !el.isConnected) {
      ring.hidden = true;
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 10;
    ring.hidden = false;
    ring.style.transform = `translate(${r.left - pad}px, ${r.top - pad}px)`;
    ring.style.width = `${r.width + pad * 2}px`;
    ring.style.height = `${r.height + pad * 2}px`;
  }

  function settleTarget(step) {
    st.targetEl = document.querySelector(step.target);
    if (!st.targetEl) return;
    st.targetEl.scrollIntoView({ behavior: STILL.matches ? "auto" : "smooth", block: step.target === ".topic-figure" ? "center" : "start" });
    if (innerWidth > 1020) {
      const r = st.targetEl.getBoundingClientRect();
      const side = r.width < innerWidth * 0.8 && r.left + r.width / 2 > innerWidth / 2 ? "left" : "right";
      if (panel.dataset.side !== side) {
        panel.removeAttribute("data-in");
        setTimeout(() => {
          panel.dataset.side = side;
          if (st.open) panel.setAttribute("data-in", "");
        }, 260);
      }
    }
    clearTimeout(st.act);
    if (step.action) {
      st.act = setTimeout(() => {
        if (!st.open || STEPS[st.i] !== step) return;
        const sel = step.action.startsWith("seg:") ? `[data-value="${step.action.slice(4)}"]` : `[data-control="${step.action}"]`;
        const tryClick = (n) => {
          const b = document.querySelector(`${step.target} ${sel}`);
          if (b) b.click();
          else if (n > 0) setTimeout(() => tryClick(n - 1), 400);
        };
        tryClick(6);
      }, 1500);
    }
  }

  function go(i, { play = true } = {}) {
    clearTimeout(st.next);
    stopClip();
    st.i = Math.max(0, Math.min(STEPS.length - 1, i));
    const step = STEPS[st.i];
    $("count").textContent = `${st.i + 1} / ${STEPS.length}`;
    $("where").textContent = step.title;
    $("dots").querySelectorAll("button").forEach((b, j) => {
      b.toggleAttribute("data-on", j === st.i);
      b.toggleAttribute("data-done", j < st.i);
    });
    $("prev").disabled = st.i === 0;
    $("next").disabled = st.i === STEPS.length - 1;
    renderText(step);
    const here = location.hash || "#/";
    if (here !== step.route) {
      api.navigating = true;
      st.targetEl = null;
      const onRouted = () => {
        document.removeEventListener("routed", onRouted);
        setTimeout(() => {
          api.navigating = false;
          settleTarget(step);
        }, 120);
      };
      document.addEventListener("routed", onRouted);
      location.hash = step.route;
    } else settleTarget(step);
    audio.src = `audio/guide/${step.id}.mp3`;
    audio.currentTime = 0;
    if (play) {
      const p = audio.play();
      if (p && p.catch) p.catch(() => setPlaying(false));
    }
    const nextStep = STEPS[st.i + 1];
    if (nextStep) {
      const pre = new Audio();
      pre.preload = "auto";
      pre.src = `audio/guide/${nextStep.id}.mp3`;
    }
    store.set("guide-step", st.i);
    tick();
  }

  function setPlaying(on) {
    st.playing = on;
    panel.toggleAttribute("data-playing", on);
    launcher.toggleAttribute("data-playing", on);
    $("play").setAttribute("aria-label", on ? "Пауза" : "Слушать");
  }

  function open(i = store.get("guide-step", 0)) {
    st.open = true;
    panel.hidden = false;
    body.setAttribute("data-guide", "");
    requestAnimationFrame(() => panel.setAttribute("data-in", ""));
    launcher.setAttribute("data-hidden", "");
    go(i >= STEPS.length - 1 ? 0 : i);
  }

  function close() {
    st.open = false;
    audio.pause();
    clearTimeout(st.next);
    clearTimeout(st.act);
    panel.removeAttribute("data-in");
    body.removeAttribute("data-guide");
    launcher.removeAttribute("data-hidden");
    ring.hidden = true;
    setTimeout(() => {
      if (!st.open) panel.hidden = true;
    }, 400);
  }

  function tick() {
    cancelAnimationFrame(st.raf);
    const loop = () => {
      const t = audio.currentTime || 0;
      const dur = audio.duration || (DATA[STEPS[st.i].id] || {}).dur || 1;
      $("bar").style.transform = `scaleX(${Math.min(1, t / dur)})`;
      const n = st.wordEls.length;
      let upto = -1;
      if (st.timings) {
        for (let j = 0; j < n; j++) if (st.timings[j] <= t + 0.05) upto = j;
      } else upto = Math.floor((t / dur) * n) - 1;
      if (upto !== st.upto) {
        st.wordEls.forEach((el, j) => {
          const state = j < upto ? "said" : j === upto ? "now" : "";
          if (el.dataset.s !== state) el.dataset.s = state;
        });
        st.upto = upto;
        const box = $("text"), el = st.wordEls[upto];
        if (el && box.scrollHeight > box.clientHeight + 4) box.scrollTo({ top: Math.max(0, el.offsetTop - box.offsetTop - box.clientHeight * 0.35), behavior: STILL.matches ? "auto" : "smooth" });
      }
      const k = Math.floor(t * 25);
      const level = st.playing && st.env.length ? (st.env[Math.min(k, st.env.length - 1)] || 0) / 100 : 0;
      bars.forEach((b, j) => {
        const e = st.playing && st.env.length ? (st.env[Math.max(0, Math.min(st.env.length - 1, k - (BARS - 1 - j)))] || 0) / 100 : 0;
        b.style.transform = `scaleY(${(0.12 + e * 0.88).toFixed(3)})`;
      });
      document.querySelectorAll(".guide .guide-avatar, .guide-launcher .guide-avatar").forEach((a) => a.style.setProperty("--lvl", level.toFixed(3)));
      placeRing();
      if (st.open) st.raf = requestAnimationFrame(loop);
    };
    st.raf = requestAnimationFrame(loop);
  }

  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("ended", () => {
    setPlaying(false);
    if (auto.checked && st.open && st.i < STEPS.length - 1) st.next = setTimeout(() => go(st.i + 1), 1700);
  });

  function stopClip() {
    clip.pause();
    if (clipBtn) {
      clipBtn.removeAttribute("data-playing");
      const l = clipBtn.querySelector("[data-intro-label]");
      if (l) l.textContent = clipBtn.dataset.label || l.textContent;
    }
    clipBtn = null;
  }
  api.playClip = (id, btn) => {
    if (clipBtn === btn && !clip.paused) {
      stopClip();
      return;
    }
    stopClip();
    if (st.open) audio.pause();
    clipBtn = btn;
    const l = btn.querySelector("[data-intro-label]");
    if (l) {
      btn.dataset.label = btn.dataset.label || l.textContent;
      l.textContent = "Пауза";
    }
    btn.setAttribute("data-playing", "");
    clip.src = `audio/guide/${id}.mp3`;
    clip.play().catch(stopClip);
  };
  clip.addEventListener("ended", stopClip);

  launcher.addEventListener("click", () => open());
  $("close").addEventListener("click", close);
  $("prev").addEventListener("click", () => go(st.i - 1));
  $("next").addEventListener("click", () => go(st.i + 1));
  $("play").addEventListener("click", () => {
    if (audio.paused) {
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(() => {});
    } else audio.pause();
  });
  $("dots").addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (b) go(+b.dataset.step);
  });
  document.addEventListener("keydown", (e) => {
    if (!st.open) return;
    if (e.key === "Escape") close();
  });
  addEventListener("resize", placeRing, { passive: true });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-guide-start]");
    if (b) {
      e.preventDefault();
      open(0);
    }
    const l = e.target.closest("[data-guide-step]");
    if (l) open(+l.dataset.guideStep);
  });
  document.addEventListener("routed", () => {
    if (clipBtn && !clipBtn.isConnected) stopClip();
    const route = location.hash || "#/";
    const idx = STEPS.findIndex((s) => s.route === route && s.route.startsWith("#/t/"));
    const head = document.querySelector(".topic .chapter-head > div");
    if (idx >= 0 && head) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "listen-btn";
      b.dataset.guideStep = String(idx);
      b.innerHTML = `<span class="guide-avatar guide-avatar-sm" aria-hidden="true">${bars5}</span>Лина объясняет опыт`;
      head.appendChild(b);
    }
  });
  const body = document.body;
  return api;
})();
