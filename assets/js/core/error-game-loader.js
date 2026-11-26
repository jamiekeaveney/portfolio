/* Resolve the 404-only game beside this version of the portfolio bundle. */
(() => {
  const entry = document.currentScript?.src;
  if (!entry) return;
  function loadGame() {
    const root = document.querySelector("[data-error-game]");
    if (!root) return;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("../css/pong.css", entry).href;
    document.head.append(css);
    const script = document.createElement("script");
    script.src = new URL("pong.min.js", entry).href;
    script.addEventListener("error", () => {
      const start = root.querySelector("[data-game-start]");
      if (start) start.hidden = true;
    }, {once: true});
    document.head.append(script);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadGame, {once: true});
  else loadGame();
})();
