(() => {
  const init = () => {
    const root = document.documentElement;
    if (root.dataset.mobileExperienceReady === "true") return;
    root.dataset.mobileExperienceReady = "true";

    const body = document.body;
    const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
    const dockLinks = Array.from(
      document.querySelectorAll("[data-dock-target]"),
    );
    const menu = document.querySelector(".mobile-menu");

    root.classList.add("motion-ready");

    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
      );

      revealItems.forEach((item) => revealObserver.observe(item));

      const sectionObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (!visible || !visible.target.id) return;

          dockLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.dataset.dockTarget === visible.target.id,
            );
          });
        },
        {
          rootMargin: "-34% 0px -54% 0px",
          threshold: [0.05, 0.25, 0.5],
        },
      );

      document.querySelectorAll("main section[id]").forEach((section) => {
        sectionObserver.observe(section);
      });
    } else {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }

    let ticking = false;
    const updateScrollEffects = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;

      root.style.setProperty("--scroll-progress", String(progress));
      root.style.setProperty(
        "--mobile-parallax",
        `${Math.min(window.scrollY, 1100) * 0.035}px`,
      );
      body.dataset.scrollState = window.scrollY > 28 ? "scrolled" : "top";
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateScrollEffects);
          ticking = true;
        }
      },
      { passive: true },
    );

    menu?.addEventListener("click", (event) => {
      if (event.target.closest("a")) menu.open = false;
    });

    updateScrollEffects();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
