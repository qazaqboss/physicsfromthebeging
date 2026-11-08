(() => {
  const body = document.body;
  const app = document.getElementById("app");
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

  COURSE.sort((a, b) => a.n - b.n);
  const TOPICS = [];
  COURSE.forEach((g) => g.topics.forEach((t, i) => {
    t.grade = g;
    t.i = i + 1;
    t.id = `${g.n}-${i + 1}`;
    t.code = `${g.n}.${i + 1}`;
    TOPICS.push(t);
  }));
  const byId = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
  const LABS = TOPICS.filter((t) => t.fig || t.lab3d);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const plural = (n, a, b, c) => (n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c);
  const GRADE_WORD = ["", "Первый", "Второй", "Третий", "Четвёртый", "Пятый", "Шестой", "Седьмой", "Восьмой", "Девятый", "Десятый", "Одиннадцатый", "Двенадцатый"];

  const theme = store.get("phys-theme", null) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  body.dataset.theme = theme;
  document.querySelector("[data-theme-toggle]").addEventListener("click", () => {
    const flip = () => {
      body.dataset.theme = body.dataset.theme === "dark" ? "light" : "dark";
      store.set("phys-theme", body.dataset.theme);
    };
    if (document.startViewTransition && !STILL.matches) document.startViewTransition(flip);
    else flip();
  });

  const legacy = { ch1: "7-1", ch2: "7-2", ch3: "9-1", ch4: "9-3", ch5: "9-4", ch6: "10-4", ch7: "8-5", ch8: "11-5" };
  const solved = new Set(store.get("phys-solved", []).map((id) => legacy[id] || id).filter((id) => byId[id]));
  const save = () => store.set("phys-solved", [...solved]);
  document.querySelector("[data-total]").textContent = String(TOPICS.length);

  const gradeNav = document.querySelector("[data-grade-nav]");
  gradeNav.innerHTML = COURSE.map((g) => `<a href="#/g/${g.n}" data-nav="${g.n}">${String(g.n).padStart(2, "0")}</a>`).join("");

  function paintProgress() {
    document.querySelector("[data-progress]").textContent = String(solved.size);
    gradeNav.querySelectorAll("a").forEach((a) => {
      const g = COURSE.find((x) => x.n === +a.dataset.nav);
      a.toggleAttribute("data-done", g.topics.every((t) => solved.has(t.id)));
    });
  }

  const formulaHtml = (f) => `<div class="formula${f.big ? "" : " small"}"><span class="f-main">${f.f}</span><span class="f-note">${f.note || ""}</span></div>`;
  const badge = (t) => (t.lab3d ? `<span class="tag tag-3d">3D</span>` : t.fig ? `<span class="tag">прибор</span>` : "");

  function gradeCard(g) {
    const done = g.topics.filter((t) => solved.has(t.id)).length;
    const labs = g.topics.filter((t) => t.fig || t.lab3d).length;
    return `<a class="grade-card" href="#/g/${g.n}">
      <span class="grade-num">${g.n}</span>
      <span class="grade-meta">${esc(g.stage)}</span>
      <span class="grade-title">${esc(g.title)}</span>
      <span class="grade-blurb">${esc(g.blurb)}</span>
      <span class="grade-foot"><span>${g.topics.length} тем${labs ? ` · ${labs} ${plural(labs, "лаборатория", "лаборатории", "лабораторий")}` : ""}</span><span class="grade-bar"><i style="width:${(done / g.topics.length) * 100}%"></i></span></span>
    </a>`;
  }

  function home() {
    const stages = [];
    COURSE.forEach((g) => {
      let s = stages.find((x) => x.name === g.stage);
      if (!s) stages.push((s = { name: g.stage, grades: [] }));
      s.grades.push(g);
    });
    app.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">Курс на 12 лет · ${TOPICS.length} тем · ${LABS.length} лабораторий</p>
          <h1>Физика,<br>которую можно<br><em>потрогать</em></h1>
          <p class="lead">От «твёрдое, жидкое, газ» в первом классе до матриц поворота и спина электрона в двенадцатом. Каждая тема — теория, формулы, опыт и вопрос. Приборы крутятся, числа на табло считаются честно, а гид Лина рассказывает голосом.</p>
          <div class="hero-cta">
            <a class="btn-primary" href="#/g/1">Начать с 1 класса</a>
            <button type="button" class="btn-ghost btn-guide" data-guide-start><span class="guide-avatar guide-avatar-sm" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>Экскурсия с голосовым гидом</button>
          </div>
          <dl class="hero-stats">
            <div><dt>12</dt><dd>лет обучения</dd></div>
            <div><dt>${TOPICS.length}</dt><dd>тем</dd></div>
            <div><dt>${LABS.length}</dt><dd>живых лабораторий</dd></div>
          </dl>
        </div>
        <div class="hero-figure" data-figure="cradle"></div>
      </section>
      <section class="map course-map" id="map">
        <div class="section-head">
          <p class="eyebrow">Карта курса</p>
          <h2>Двенадцать лет физики</h2>
          <p>Каждый класс — шесть тем. Начальная школа знакомит с природой, основная строит механику, тепло и электричество, старшая — электродинамику и оптику, а профильный класс доходит до теории относительности, квантов и матриц.</p>
        </div>
        ${stages.map((s) => `<div class="stage"><p class="stage-name">${esc(s.name)}</p><div class="grade-grid">${s.grades.map(gradeCard).join("")}</div></div>`).join("")}
      </section>
      <section class="labs-strip">
        <div class="section-head">
          <p class="eyebrow">Лаборатории</p>
          <h2>Приборы, которые можно трогать</h2>
          <p>Изометрические приборы в стиле Anatomy и 3D-сцены, которые можно вращать пальцем.</p>
        </div>
        <div class="labs-grid">${LABS.map((t) => `<a class="lab-chip" href="#/t/${t.id}"><span class="lab-code">${t.code}</span><span class="lab-name">${esc(t.title)}</span>${badge(t)}</a>`).join("")}</div>
      </section>`;
    mountFigures();
    countUp();
  }

  function grade(n) {
    const g = COURSE.find((x) => x.n === n);
    if (!g) return home();
    const prev = COURSE.find((x) => x.n === n - 1), next = COURSE.find((x) => x.n === n + 1);
    app.innerHTML = `
      <nav class="crumbs"><a href="#/">Курс</a><span>/</span><span>${n} класс</span></nav>
      <section class="grade-head">
        <span class="chapter-num">${String(n).padStart(2, "0")}</span>
        <div>
          <p class="eyebrow">${esc(g.stage)} · ${n} класс</p>
          <h2>${esc(g.title)}</h2>
          <p class="grade-lead">${esc(g.blurb)}</p>
          <button type="button" class="listen-btn" data-intro="${n}"><span class="guide-avatar guide-avatar-sm" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span data-intro-label>Лина рассказывает о классе</span></button>
        </div>
      </section>
      <ol class="topic-list">${g.topics.map((t) => `<li${solved.has(t.id) ? " data-done" : ""}><a href="#/t/${t.id}"><span class="topic-code">${t.code}</span><span class="topic-main"><span class="topic-title">${esc(t.title)}</span><span class="topic-lead">${esc(t.lead)}</span></span>${badge(t)}<span class="topic-check" aria-hidden="true"></span></a></li>`).join("")}</ol>
      <nav class="pager">${prev ? `<a href="#/g/${prev.n}">← ${prev.n} класс · ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a href="#/g/${next.n}">${next.n} класс · ${esc(next.title)} →</a>` : "<span></span>"}</nav>`;
    const btn = app.querySelector("[data-intro]");
    btn.addEventListener("click", () => Guide.playClip(`grade${n}`, btn));
  }

  function topic(id) {
    const t = byId[id];
    if (!t) return home();
    const idx = TOPICS.indexOf(t);
    const prev = TOPICS[idx - 1], next = TOPICS[idx + 1];
    const figure = t.fig ? `<div class="topic-figure" data-figure="${t.fig}"></div>` : t.lab3d ? `<div class="topic-figure" data-lab3d="${t.lab3d}"></div>` : `<div class="topic-figure topic-board"><p class="eyebrow">Главная формула</p><div class="board-f">${t.formulas[0].f}</div><p class="board-note">${t.formulas[0].note || ""}</p>${t.formulas[1] ? `<div class="board-f board-f2">${t.formulas[1].f}</div><p class="board-note">${t.formulas[1].note || ""}</p>` : ""}<p class="board-hint">${esc(t.grade.n)} класс · ${esc(t.grade.title)}</p></div>`;
    app.innerHTML = `
      <nav class="crumbs"><a href="#/">Курс</a><span>/</span><a href="#/g/${t.grade.n}">${t.grade.n} класс</a><span>/</span><span>${t.code}</span></nav>
      <section class="chapter topic" id="t-${t.id}">
        <div class="chapter-head">
          <span class="chapter-num">${t.code}</span>
          <div>
            <p class="eyebrow">${t.grade.n} класс · ${esc(t.grade.title)}</p>
            <h2>${esc(t.title)}</h2>
          </div>
        </div>
        <div class="chapter-body">
          <div class="chapter-text">
            <p class="topic-lead-p">${esc(t.lead)}</p>
            ${t.body.map((p) => `<p>${p}</p>`).join("")}
            ${t.formulas.map(formulaHtml).join("")}
            <div class="try"><p class="try-title">${t.fig || t.lab3d ? "Опыт" : "Попробуй сам"}</p><ol>${t.tryIt.map((x) => `<li>${x}</li>`).join("")}</ol></div>
            <div class="quiz" data-quiz="${t.id}">
              <p class="quiz-q">${esc(t.quiz.q)}</p>
              ${t.quiz.opts.map((o, i) => `<button data-option="${i}">${esc(o)}</button>`).join("")}
              <p class="quiz-why" hidden>${esc(t.quiz.why)}</p>
            </div>
          </div>
          ${figure}
        </div>
      </section>
      <nav class="pager">${prev ? `<a href="#/t/${prev.id}">← ${prev.code} ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a href="#/t/${next.id}">${next.code} ${esc(next.title)} →</a>` : "<span></span>"}</nav>`;
    const quiz = app.querySelector(".quiz");
    const reveal = () => {
      quiz.querySelector(`[data-option="${t.quiz.answer}"]`).dataset.state = "right";
      quiz.querySelector(".quiz-why").hidden = false;
    };
    if (solved.has(t.id)) reveal();
    quiz.addEventListener("click", (e) => {
      const b = e.target.closest("[data-option]");
      if (!b) return;
      if (+b.dataset.option === t.quiz.answer) {
        reveal();
        solved.add(t.id);
        save();
        paintProgress();
      } else b.dataset.state = "wrong";
    });
    mountFigures(`${t.grade.n}.${t.i}`);
  }

  function mountFigures(num) {
    app.querySelectorAll("[data-figure]").forEach((el) => {
      const make = FIG[el.dataset.figure];
      if (!make) return;
      try {
        make(el, num || 1);
      } catch (err) {
        console.error(el.dataset.figure, err);
      }
    });
    app.querySelectorAll("[data-lab3d]").forEach((el) => Lab3D.mount(el, el.dataset.lab3d, num || 1));
  }

  function countUp() {
    app.querySelectorAll(".hero-stats dt").forEach((dt) => {
      const end = parseInt(dt.textContent, 10);
      if (!Number.isFinite(end) || end === 0 || STILL.matches) return;
      const t0 = performance.now() + 400;
      dt.textContent = "0";
      const step = (now) => {
        const u = Math.min(1, Math.max(0, (now - t0) / 1100));
        dt.textContent = String(Math.round(end * (1 - (1 - u) ** 3)));
        if (u < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.setAttribute("data-in", "");
        reveal.unobserve(el);
        setTimeout(() => {
          el.classList.remove("reveal");
          el.removeAttribute("data-in");
          el.style.transitionDelay = "";
        }, 1100 + (parseFloat(el.style.transitionDelay) || 0));
      });
    },
    { rootMargin: "0px 0px -6% 0px" },
  );
  function animateIn() {
    app.querySelectorAll(".chapter-head, .grade-head, .section-head, .topic-figure, .stage, .labs-grid").forEach((el) => {
      el.classList.add("reveal");
      reveal.observe(el);
    });
    app.querySelectorAll(".chapter-text > *, .topic-list > li, .grade-grid > a").forEach((el) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${Math.min([...el.parentElement.children].indexOf(el), 8) * 60}ms`;
      reveal.observe(el);
    });
  }

  let current = "";
  function route() {
    const h = location.hash || "#/";
    if (h === current) return;
    current = h;
    const m = h.match(/^#\/(g|t)\/([\w-]+)/);
    const draw = () => {
      if (m && m[1] === "g") grade(+m[2]);
      else if (m && m[1] === "t") topic(m[2]);
      else home();
      gradeNav.querySelectorAll("a").forEach((a) => {
        const n = m ? +String(m[2]).split("-")[0] : 0;
        a.toggleAttribute("data-active", +a.dataset.nav === n);
      });
      paintProgress();
      animateIn();
      if (!Guide.navigating) window.scrollTo({ top: 0, behavior: "auto" });
      document.dispatchEvent(new CustomEvent("routed"));
    };
    if (document.startViewTransition && !STILL.matches && app.childElementCount) document.startViewTransition(draw);
    else draw();
  }
  addEventListener("hashchange", route);
  window.Site = { route, TOPICS, byId, COURSE, GRADE_WORD };

  const line = document.querySelector("[data-scroll-line]");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    line.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  route();
  onScroll();
})();
