/* No motion settings here: this script only connects native media, details and toggle elements. */
/* Project media references. Layout and CMS content are native Designer elements. */
(() => {
  JKProject.register((s => {
    const page = s.page, root = page.querySelector("[data-case-layout]"), rail = page.querySelector("[data-case-media-rail]"), details = page.querySelector(".case_details");
    Object.assign(s, {
      root: root,
      rail: rail,
      details: details,
      featured: page.querySelector(".case_featured .case_media"),
      first: rail?.querySelector(".case_media"),
      toggle: page.querySelector("[data-case-expand]"),
      ready: true,
      progress: 1
    });
  }));
})();
