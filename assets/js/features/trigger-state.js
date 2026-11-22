(() => {
  const keyboard = "trigger--focused";
  const initialise = scope => {
    for (const element of scope.querySelectorAll("[data-state]")) {
      element.classList.add("component-state");
      const states = element.dataset.state.split(/\s+/);
      if (states.includes("current")) {
        element.classList.toggle("component-state--active",
          element.matches(".w--current") || Boolean(element.querySelector(".w--current")));
      }
      if (states.includes("checked")) {
        element.classList.toggle("component-state--checked", Boolean(element.querySelector(":checked")));
      }
    }
    for (const element of scope.querySelectorAll("[data-trigger]")) {
      for (const trigger of element.dataset.trigger.split(/\s+/)) {
        if (trigger && trigger !== "none") element.classList.add("trigger--" + trigger);
      }
    }
  };

  function peerGroup(target) {
    return target?.closest?.(".trigger--hover-other,.trigger--focus-other")?.closest(".trigger--group");
  }

  function updatePeers(event, modifier, entering) {
    const previous = peerGroup(entering ? event.relatedTarget : event.target);
    const next = peerGroup(entering ? event.target : event.relatedTarget);
    if (previous === next) return;
    previous?.classList.remove(modifier);
    next?.classList.add(modifier);
  }

  function setKeyboardFocus(target, active) {
    for (let item = target; item?.classList; item = item.parentElement) {
      if (item.classList.contains("trigger--focus") || item.classList.contains("trigger--focus-other")) {
        item.classList.toggle(keyboard, active);
      }
    }
  }

  document.addEventListener("pointerover", event => updatePeers(event, "trigger-group--pointed", true));
  document.addEventListener("pointerout", event => updatePeers(event, "trigger-group--pointed", false));
  document.addEventListener("focusin", event => {
    if (event.target.matches(":focus-visible")) {
      setKeyboardFocus(event.target, true);
      updatePeers(event, "trigger-group--focused", true);
    }
  });
  document.addEventListener("focusout", event => {
    setKeyboardFocus(event.target, false);
    peerGroup(event.target)?.classList.remove("trigger-group--focused");
  });
  document.addEventListener("change", event => {
    const owner = event.target.closest(".component-state");
    if (owner?.dataset.state?.split(/\s+/).includes("checked")) {
      owner.classList.toggle("component-state--checked", Boolean(owner.querySelector(":checked")));
    }
  });

  initialise(document);
  window.barba?.hooks.beforeEnter(data => initialise(data.next.container));
  window.barba?.hooks.after(() => initialise(document));
})();
