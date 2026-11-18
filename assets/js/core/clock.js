/* Sligo local time: Europe/Dublin handles summer time automatically. */
(function () {
  var f = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Europe/Dublin" });
  function tick() {
    var h = "", m = "", period = "";
    f.formatToParts(new Date()).forEach(function (p) {
      if (p.type === "hour") h = p.value;
      if (p.type === "minute") m = p.value;
      if (p.type === "dayPeriod") period = p.value.toUpperCase();
    });
    document.querySelectorAll(".sitenav__clock-h").forEach(function (el) { el.textContent = h; });
    document.querySelectorAll(".sitenav__clock-m").forEach(function (el) { el.textContent = m; });
    document.querySelectorAll(".sitenav__clock-period").forEach(function (el) { el.textContent = " " + period; });
  }
  tick();
  setInterval(tick, 10000);
})();
