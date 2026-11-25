const initializedServices = new WeakSet();

function initServices(page) {
  if (!hasScrollTrigger) return;
  page.querySelectorAll(".services_browser").forEach(browser => {
    if (initializedServices.has(browser)) return;
    const headings = [...browser.querySelectorAll(".services_heading")];
    const panels = [...browser.querySelectorAll(".services_media_panel")];
    if (!headings.length || !panels.length) return;
    initializedServices.add(browser);

    let active = -1;
    const desktop = matchMedia("(min-width: 62rem)");
    function update() {
      if (!desktop.matches) {
        active = -1;
        headings.forEach(heading => heading.classList.remove("is-active"));
        return;
      }

      const middle = innerHeight / 2;
      let nearest = 0;
      let distance = Infinity;
      headings.forEach((heading, index) => {
        const bounds = heading.getBoundingClientRect();
        const offset = Math.abs(bounds.top + bounds.height / 2 - middle);
        if (offset < distance) {
          nearest = index;
          distance = offset;
        }
      });
      if (nearest === active) return;
      active = nearest;
      headings.forEach((heading, index) => heading.classList.toggle("is-active", index === active));
      panels.forEach((panel, index) => {
        const selected = index === active;
        panel.classList.toggle("is-active", selected);
        panel.setAttribute("aria-hidden", String(!selected));
      });
    }

    ScrollTrigger.create({
      trigger: browser,
      start: "top bottom",
      end: "bottom top",
      onUpdate: update,
      onRefresh: update
    });
    update();
  });
}
