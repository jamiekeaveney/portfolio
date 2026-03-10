// -----------------------------------------
// WEBFLOW REINIT
// -----------------------------------------

function syncWebflowPageIdFromNextHtml(nextHtml) {
  if (!nextHtml) return;

  try {
    const parsed = new DOMParser().parseFromString(nextHtml, "text/html");
    const nextPageId = parsed.documentElement.getAttribute("data-wf-page");

    if (nextPageId) {
      document.documentElement.setAttribute("data-wf-page", nextPageId);
    }
  } catch (_) {}
}

function resetWCurrent(overridePath) {
  document.querySelectorAll(".w--current").forEach((el) => {
    el.classList.remove("w--current");
  });

  const path = (overridePath || window.location.pathname).replace(/\/$/, "");

  document.querySelectorAll("a[href]").forEach((a) => {
    try {
      const url = new URL(a.getAttribute("href"), window.location.origin);
      const hrefPath = url.pathname.replace(/\/$/, "");

      if (hrefPath === path) {
        a.classList.add("w--current");
      }
    } catch (_) {}
  });
}

function destroyAndInitIX2() {
  if (!window.Webflow) return;

  try {
    window.Webflow.destroy();
  } catch (_) {}

  try {
    window.Webflow.require("ix2")?.init?.();
  } catch (_) {}

  try {
    document.dispatchEvent(new Event("readystatechange"));
  } catch (_) {}
}

function readyWebflow() {
  if (!window.Webflow) return;

  try {
    window.Webflow.ready();
  } catch (_) {}
}

function reinitWebflowIX2() {
  if (!window.Webflow) return;

  try {
    window.Webflow.destroy();
  } catch (_) {}

  try {
    window.Webflow.ready();
  } catch (_) {}

  try {
    const ix2 = window.Webflow.require("ix2");
    if (ix2 && ix2.init) ix2.init();
  } catch (_) {}

  try {
    document.dispatchEvent(new Event("readystatechange"));
  } catch (_) {}
}