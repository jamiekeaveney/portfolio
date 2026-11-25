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
    const originalHeadings = headings.map(heading => heading.classList.contains("is-active"));
    const originalPanels = panels.map(panel => ({
      active: panel.classList.contains("is-active"),
      hidden: panel.getAttribute("aria-hidden"),
      inert: panel.inert
    }));
    function update() {
      if (!desktop.matches) {
        active = -1;
        headings.forEach(heading => heading.classList.remove("is-active"));
        // Compact layouts use their native flow; desktop selection must not
        // leave a visible comparison hidden from the keyboard or screen reader.
        panels.forEach(panel => {
          panel.classList.remove("is-active");
          panel.removeAttribute("aria-hidden");
          panel.inert = false;
        });
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
        panel.inert = !selected;
        panel.setAttribute("aria-hidden", String(!selected));
      });
    }

    desktop.addEventListener("change", update);
    ScrollTrigger.create({
      trigger: browser,
      start: "top bottom",
      end: "bottom top",
      onUpdate: update,
      onRefresh: update,
      onKill() {
        desktop.removeEventListener("change", update);
        headings.forEach((heading, index) => heading.classList.toggle("is-active", originalHeadings[index]));
        panels.forEach((panel, index) => {
          const original = originalPanels[index];
          panel.classList.toggle("is-active", original.active);
          panel.inert = original.inert;
          if (original.hidden === null) panel.removeAttribute("aria-hidden");
          else panel.setAttribute("aria-hidden", original.hidden);
        });
        initializedServices.delete(browser);
      }
    });
    update();
  });
}
