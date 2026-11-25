/* Sligo local time: Europe/Dublin handles summer time automatically. */
(function() {
  var f = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Europe/Dublin"
  });
  function tick() {
    var h = "", m = "", period = "";
    updateCurrentYears();
    f.formatToParts(new Date).forEach((function(p) {
      if (p.type === "hour") h = p.value;
      if (p.type === "minute") m = p.value;
      if (p.type === "dayPeriod") period = p.value.toUpperCase();
    }));
    document.querySelectorAll(".sitenav_clock_h").forEach((function(el) {
      el.textContent = h;
    }));
    document.querySelectorAll(".sitenav_clock_m").forEach((function(el) {
      el.textContent = m;
    }));
    document.querySelectorAll(".sitenav_clock_period").forEach((function(el) {
      el.textContent = " " + period;
    }));
  }
  tick();
  setInterval(tick, 1e4);
})();

/* Opt-in current-facing dates only: project publication dates remain CMS content. */ function updateCurrentYears(scope = document, date = new Date) {
  const year = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "Europe/Dublin"
  }).format(date);
  scope.querySelectorAll("[data-current-year]").forEach((el => {
    const template = el.getAttribute("data-year-template") || "{year}";
    const value = template.replaceAll("{year}", year).replaceAll("{short}", year.slice(-2));
    if (el.textContent !== value) el.textContent = value;
  }));
}

if (window.barba) barba.hooks.beforeEnter((d => updateCurrentYears(d.next.container)));
