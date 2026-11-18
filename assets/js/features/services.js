function initScroll1() {
  if (!hasScrollTrigger) return;
  nextPage.querySelectorAll(".scroll-1_component").forEach((root => {
    if (root.hasAttribute("data-scroll-1-init")) return;
    const headings = [ ...root.querySelectorAll(".scroll-1_trigger_item") ], media = [ ...root.querySelectorAll(".scroll-1_target_item") ];
    if (!headings.length || !media.length) return;
    root.setAttribute("data-scroll-1-init", "");
    let current = -1;
    const select = () => {
      if (innerWidth < 992) {
        headings.forEach((el => el.classList.remove("is-active")));
        return;
      }
      const centre = innerHeight / 2, centres = headings.map((el => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      }));
      let closest = 0;
      centres.forEach(((y, i) => {
        if (Math.abs(y - centre) < Math.abs(centres[closest] - centre)) closest = i;
      }));
      if (current === closest) return;
      current = closest;
      headings.forEach(((el, i) => el.classList.toggle("is-active", i === closest)));
      media.forEach(((el, i) => el.classList.toggle("is-active", i === closest)));
    };
    ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      onUpdate: select,
      onRefresh: select
    });
    select();
  }));
}
// -----------------------------------------
// WORK PAGE — slide + list infinite scrollers
// -----------------------------------------
// Call: initWorkSlider(container) from initBeforeEnterFunctions.
// Self-managing lifecycle (no destroy hook needed):
//   1. create() tears down any previous instance
//   2. all listeners bind through one AbortController
//   3. the document wheel handler and ticker callbacks
//      self-destruct when the Barba container leaves the DOM
// Input locks during Barba transitions — flagged directly by
// barba.hooks (before → after) — and during the first-load
// loader, so the slider is inert exactly while pages animate.
// -----------------------------------------
// WORK PAGE — slide + list infinite scrollers
// -----------------------------------------
// Call: initWorkSlider(container) from initBeforeEnterFunctions.
// Self-managing lifecycle (no destroy hook needed):
//   1. create() tears down any previous instance
//   2. all listeners bind through one AbortController
//   3. the document wheel handler and ticker callbacks
//      self-destruct when the Barba container leaves the DOM
// Input locks during Barba transitions — flagged directly by
// barba.hooks (before → after) — and during the first-load
// loader, so the slider is inert exactly while pages animate.
