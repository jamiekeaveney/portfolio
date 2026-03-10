// -----------------------------------------
// SCROLL 1
// -----------------------------------------

function initScroll1() {
  if (!hasScrollTrigger) return;

  nextPage.querySelectorAll(".scroll-1_component").forEach((component) => {
    if (component.hasAttribute("data-scroll-1-init")) return;
    component.setAttribute("data-scroll-1-init", "");

    const triggers = component.querySelectorAll(".scroll-1_trigger_item");
    const targets = component.querySelectorAll(".scroll-1_target_item");

    if (!triggers.length || !targets.length) return;

    function makeActive(index) {
      triggers.forEach((el, i) => el.classList.toggle("is-active", i === index));
      targets.forEach((el, i) => el.classList.toggle("is-active", i === index));
    }

    makeActive(0);

    triggers.forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top center",
        end: "bottom center",
        onToggle: ({ isActive }) => {
          if (isActive) makeActive(i);
        }
      });
    });
  });
}