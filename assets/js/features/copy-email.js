/* Clipboard result is application state; hover/focus and every visual transition are CSS. */
(() => {
  let clean = () => {};
  function mount(page) {
    clean();
    const abort = new AbortController;
    clean = () => abort.abort();
    const buttons = new Set([ ...document.querySelectorAll('.nav_wrap [data-wf--button--variant^="copy-email"]'), ...(page || document).querySelectorAll('[data-wf--button--variant^="copy-email"]') ]);
    buttons.forEach((button => {
      const email = button.querySelector(".button_text")?.textContent.trim();
      if (!email) return;
      button.removeAttribute("data-copy-status");
      button.setAttribute("role", "button");
      button.setAttribute("aria-label", "Copy " + email + " to clipboard");
      button.setAttribute("data-barba-prevent", "");
      let pending = false, epoch = 0;
      const reset = () => {
        epoch++;
        button.removeAttribute("data-copy-status");
        button.setAttribute("aria-label", "Copy " + email + " to clipboard");
      };
      const copy = async event => {
        event.preventDefault();
        event.stopPropagation();
        if (pending) return;
        pending = true;
        const token = epoch;
        try {
          await navigator.clipboard.writeText(email);
          if (token === epoch && !abort.signal.aborted && button.isConnected) {
            button.dataset.copyStatus = "copied";
            button.setAttribute("aria-label", "Email copied to clipboard");
          }
        } catch {
          if (token === epoch && !abort.signal.aborted && button.isConnected) {
            button.setAttribute("aria-label", "Copy unavailable. Email: " + email);
          }
        } finally {
          pending = false;
        }
      };
      const opts = {
        signal: abort.signal
      };
      button.addEventListener("click", copy, opts);
      button.addEventListener("keydown", (e => {
        if (e.key === " ") copy(e);
      }), opts);
      button.addEventListener("pointerleave", reset, opts);
      button.addEventListener("blur", reset, opts);
    }));
  }
  function boot() {
    mount(document.querySelector('[data-barba="container"]'));
    if (window.barba) barba.hooks.afterEnter((d => mount(d.next.container)));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();
