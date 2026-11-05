(() => {
  const body = document.body;
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

  let figNo = 0;
  document.querySelectorAll("[data-figure]").forEach((el) => {
    const make = FIG[el.dataset.figure];
    if (!make) return;
    figNo += 1;
    try {
      make(el, figNo);
    } catch (err) {
      console.error(el.dataset.figure, err);
    }
  });

  const solved = new Set(store.get("phys-solved", []));
  const progress = document.querySelector("[data-progress]");
  const paint = () => {
    progress.textContent = String(solved.size);
    document.querySelectorAll("[data-nav]").forEach((a) => a.toggleAttribute("data-done", solved.has(a.dataset.nav)));
    document.querySelectorAll(".map-grid li").forEach((li) => {
      const id = li.querySelector("a").getAttribute("href").slice(1);
      li.toggleAttribute("data-done", solved.has(id));
    });
  };
  document.querySelectorAll("[data-quiz]").forEach((quiz) => {
    const id = quiz.dataset.quiz;
    const answer = quiz.dataset.answer;
    const why = quiz.querySelector(".quiz-why");
    const reveal = () => {
      quiz.querySelectorAll("[data-option]").forEach((b) => {
        if (b.dataset.option === answer) b.dataset.state = "right";
      });
      why.hidden = false;
    };
    if (solved.has(id)) reveal();
    quiz.addEventListener("click", (e) => {
      const b = e.target.closest("[data-option]");
      if (!b) return;
      if (b.dataset.option === answer) {
        reveal();
        solved.add(id);
        store.set("phys-solved", [...solved]);
        paint();
      } else {
        b.dataset.state = "wrong";
      }
    });
  });
  paint();

  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.toggleAttribute("data-active", a.dataset.nav === entry.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  document.querySelectorAll(".chapter").forEach((s) => spy.observe(s));

  const line = document.querySelector("[data-scroll-line]");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    line.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.setAttribute("data-in", "");
          reveal.unobserve(el);
          const wait = 1100 + (parseFloat(el.style.transitionDelay) || 0);
          setTimeout(() => {
            el.classList.remove("reveal");
            el.removeAttribute("data-in");
            el.style.transitionDelay = "";
          }, wait);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  document.querySelectorAll(".chapter-head, .chapter-figure, .section-head").forEach((el) => {
    el.classList.add("reveal");
    reveal.observe(el);
  });
  document.querySelectorAll(".chapter-text > *, .map-grid > li, .cheat > a").forEach((el, i, all) => {
    const siblings = [...el.parentElement.children];
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 8) * 70}ms`;
    reveal.observe(el);
  });

  const stats = document.querySelectorAll(".hero-stats dt");
  stats.forEach((dt) => {
    const end = parseInt(dt.textContent, 10);
    if (!Number.isFinite(end) || end === 0 || STILL.matches) return;
    const t0 = performance.now() + 500;
    dt.textContent = "0";
    const step = (now) => {
      const u = Math.min(1, Math.max(0, (now - t0) / 1100));
      const e = 1 - (1 - u) ** 3;
      dt.textContent = String(Math.round(end * e));
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
})();
