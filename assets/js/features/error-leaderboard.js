/* Keep the public handle policy identical in the 404 bundle and the score service. */
function pongPlayerName(value) {
  if (typeof value !== "string" || value.length > 96) return "";
  const name = value.normalize("NFC").replace(/\p{Zs}+/gu, " ").replace(/^ | $/g, "");
  const words = /^[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:[ '_’·・‐‑-][\p{L}\p{N}][\p{L}\p{M}\p{N}]*)*$/u;
  if (!words.test(name) || [...name].length > 24 || /\p{Default_Ignorable_Code_Point}/u.test(name)) return "";

  // Match complete words to avoid rejecting names such as Scunthorpe or Cassidy.
  const folded = name.replace(/([a-z])([A-Z])/g, "$1 $2").normalize("NFKD")
    .toLowerCase().replace(/\p{M}/gu, "").replace(/[013457]/g, ch => ({"0":"o", "1":"i", "3":"e", "4":"a", "5":"s", "7":"t"})[ch]);
  const tokens = folded.split(/[^\p{L}\p{N}]+/u);
  const blocked = /^(?:fuck(?:s|ed|er|ers|ing|head|face)?|motherfuck(?:er|ers|ing)?|shit(?:s|ty|head|heads)?|bullshit|assholes?|arseholes?|bitch(?:es)?|bastards?|cunts?|dickheads?|wankers?|nigg(?:er|ers|a|as)|faggots?|kikes?)$/;
  if (tokens.some(token => blocked.test(token)) || blocked.test(tokens.join(""))) return "";
  return name;
}

function createPongLeaderboard(root, pauseGame) {
  const key = "jk-pong-board-v1";
  const houseScores = [
    { name: "FrameGhost", score: 32, preset: true },
    { name: "RasterFox", score: 24, preset: true },
    { name: "SpliceKid", score: 16, preset: true }
  ];
  const maxRecords = 10;
  let memory = { name: "", scores: [] };
  let storageAvailable = true;
  let pendingScore = 0;
  let submitted = false;
  let sharedScores = null;
  let loadingShared = false;
  let sharedRevision = 0;
  let roundTicket = null;
  let roundNumber = 0;
  let playerId;
  const configuredAPI = root.getAttribute("data-score-api")?.trim();
  // The shared service is enabled on the native 404 root after its database is live.
  const api = configuredAPI ? new URL(configuredAPI.replace(/\/+$/, "") + "/", location.origin) : null;

  async function request(resource, data) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const options = { credentials: "omit", signal: controller.signal };
      if (!data) options.cache = "no-store";
      if (data) Object.assign(options, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      const response = await fetch(new URL(resource, api), options);
      if (!response.ok) {
        const error = new Error("Scores unavailable");
        if (response.status === 422) error.invalidName = true;
        throw error;
      }
      return await response.json();
    } finally { clearTimeout(timeout); }
  }

  function player() {
    if (playerId) return playerId;
    const playerKey = "jk-pong-player-v1";
    try { playerId = localStorage.getItem(playerKey); } catch { /* Available for this visit only. */ }
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(playerId || "")) {
      playerId = crypto.randomUUID();
      try { localStorage.setItem(playerKey, playerId); } catch { /* The game still works in a private tab. */ }
    }
    return playerId;
  }

  function validScores(result) {
    if (!Array.isArray(result?.scores)) throw new Error("Invalid scores");
    return result.scores.slice(0, maxRecords).filter(
      row => row && pongPlayerName(row.name) && Number.isSafeInteger(row.score) && row.score > 0 && row.score <= 9999
    );
  }

  async function refreshShared() {
    if (!api) return;
    const revision = ++sharedRevision;
    loadingShared = true;
    if (dialog.open) render();
    try {
      const scores = validScores(await request("scores"));
      if (revision === sharedRevision) sharedScores = scores;
    } catch {
      if (revision === sharedRevision) sharedScores = null;
    }
    if (revision === sharedRevision) {
      loadingShared = false;
      if (dialog.open) render();
    }
  }

  function ordered(scores) {
    return scores.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }

  function read() {
    if (!storageAvailable) return memory;
    let raw;
    try { raw = localStorage.getItem(key); }
    catch { storageAvailable = false; return memory; }
    try {
      if (!raw) return memory;
      const saved = JSON.parse(raw);
      const scores = Array.isArray(saved.scores) ? saved.scores.slice(0, maxRecords) : [];
      memory = {
        name: pongPlayerName(saved.name),
        scores: ordered(scores.filter(row => row && pongPlayerName(row.name) && Number.isSafeInteger(row.score) && row.score > 0))
      };
    } catch {
      // Storage may be disabled, full or contain data from an incomplete write.
    }
    return memory;
  }

  const buttonSkin = root.querySelector(":scope > a.button_wrap > .button_main");
  const buttonTemplate = document.createElement("template");
  if (buttonSkin) {
    buttonTemplate.content.append(buttonSkin.cloneNode(true));
    // The shared link component uses divs. Preserve its classes and SVGs with phrasing content inside buttons.
    for (const div of buttonTemplate.content.querySelectorAll("div")) {
      const span = document.createElement("span");
      for (const attribute of div.attributes) span.setAttribute(attribute.name, attribute.value);
      span.append(...div.childNodes);
      div.replaceWith(span);
    }
  }

  function gameButton(className, label, type = "button") {
    const button = document.createElement("button");
    button.className = className + " button_wrap";
    button.type = type;
    button.setAttribute("data-trigger", "hover focus");
    button.setAttribute("data-wf--button--variant", "button-small");
    button.append(buttonTemplate.content.cloneNode(true));
    setButtonLabel(button, label);
    return button;
  }

  function setButtonLabel(button, label) {
    const copies = button.querySelectorAll(".button_text");
    if (copies.length) copies.forEach(copy => { copy.textContent = label; });
    else button.textContent = label;
  }

  const openButton = gameButton("pong_scores_toggle", "High scores");
  openButton.setAttribute("aria-haspopup", "dialog");
  openButton.setAttribute("aria-controls", "pong-scores");
  const dialog = document.createElement("dialog");
  dialog.id = "pong-scores";
  dialog.className = "pong_scores_dialog";
  dialog.setAttribute("aria-labelledby", "pong-scores-title");
  dialog.innerHTML = `
    <header class="pong_scores_header"><h2 id="pong-scores-title">High scores</h2></header>
    <div class="pong_scores_labels"><span>Player</span><span>Returns</span></div>
    <ol class="pong_scores_list"></ol>
    <p class="pong_scores_note"></p>
    <form class="pong_scores_form" hidden>
      <p class="pong_scores_result"></p>
      <label for="pong-player-name">Player name</label>
      <input id="pong-player-name" name="nickname" type="text" dir="auto" maxlength="96"
        autocomplete="nickname" spellcheck="false" required aria-describedby="pong-name-help pong-name-error">
      <p class="pong_scores_help" id="pong-name-help"></p>
      <p class="pong_scores_error" id="pong-name-error" aria-live="polite"></p>
    </form>
    <p class="pong_scores_feedback" role="status"></p>
  `;
  const closeButton = gameButton("pong_scores_close", "Close");
  closeButton.setAttribute("aria-label", "Close high scores");
  closeButton.autofocus = true;
  dialog.querySelector("header").append(closeButton);
  const form = dialog.querySelector("form");
  form.append(gameButton("pong_scores_save", "Save score", "submit"));
  const input = form.elements.nickname;
  const feedback = dialog.querySelector(".pong_scores_feedback");
  const nameError = dialog.querySelector(".pong_scores_error");
  dialog.querySelector(".pong_scores_help").textContent = api
    ? "Up to 24 characters. This name will be public." : "Up to 24 characters.";
  root.append(openButton, dialog);

  function askForName(message) {
    input.setAttribute("aria-invalid", "true");
    nameError.textContent = message;
    input.focus();
  }

  input.addEventListener("input", () => {
    input.removeAttribute("aria-invalid");
    nameError.textContent = "";
  });

  function render() {
    const { scores } = read();
    const rows = ordered([...(sharedScores ?? scores), ...houseScores]).slice(0, maxRecords);
    const list = dialog.querySelector("ol");
    list.replaceChildren();
    for (const row of rows) {
      const entry = document.createElement("li");
      const player = document.createElement("span");
      const score = document.createElement("span");
      const name = document.createElement("bdi");
      name.textContent = row.name;
      player.append(name);
      if (row.preset) {
        const label = document.createElement("small");
        label.className = "pong_scores_preset";
        label.textContent = "Preset";
        player.append(label);
      }
      score.textContent = String(row.score).padStart(2, "0");
      entry.append(player, score);
      list.append(entry);
    }
    const scope = sharedScores === null
      ? (storageAvailable ? "Showing scores on this device." : "Showing scores for this visit.")
      : "Player scores are shared across the portfolio.";
    const note = loadingShared ? "Loading shared scores…" : scope;
    dialog.querySelector(".pong_scores_note").textContent = note;
    form.hidden = !pendingScore || submitted;
    dialog.querySelector(".pong_scores_result").textContent =
      pendingScore + (pendingScore === 1 ? " return" : " returns") + " this round";
  }

  function open() {
    if (dialog.open) return;
    pauseGame();
    input.value = read().name;
    input.removeAttribute("aria-invalid");
    nameError.textContent = "";
    feedback.textContent = "";
    render();
    dialog.showModal();
    refreshShared();
  }

  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => openButton.focus({preventScroll: true}));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitted || !pendingScore) return;
    const name = pongPlayerName(input.value);
    if (!name) {
      askForName("Choose another name, using up to 24 letters, numbers, spaces, apostrophes, hyphens or underscores.");
      return;
    }
    submitted = true;
    const score = pendingScore;
    const round = roundNumber;
    const ticket = roundTicket;
    form.hidden = true;
    feedback.textContent = "Saving score…";
    function save() {
      const saved = read();
      const previous = saved.scores.find(row => row.name === name);
      const best = Math.max(previous?.score || 0, score);
      const scores = saved.scores.filter(row => row.name !== name);
      scores.push({ name, score: best });
      memory = { name, scores: ordered(scores).slice(0, maxRecords) };
      try { localStorage.setItem(key, JSON.stringify(memory)); }
      catch { storageAvailable = false; }
      render();
    }
    let deviceFallback = false;
    try {
      const token = await ticket;
      if (!token) throw new Error("Round unavailable");
      const result = validScores(await request("scores", {player: player(), token, score, name}));
      ++sharedRevision;
      loadingShared = false;
      sharedScores = result;
      if (round === roundNumber) feedback.textContent = "Score submitted for " + name + ".";
    } catch (error) {
      if (error.invalidName) {
        if (round === roundNumber) {
          submitted = false;
          feedback.textContent = "";
          render();
          askForName("Choose another player name to post this score.");
        }
        return;
      }
      ++sharedRevision;
      loadingShared = false;
      sharedScores = null;
      deviceFallback = true;
    }
    if (navigator.locks) {
      try { await navigator.locks.request(key, save); }
      catch { save(); }
    } else save();
    if (round === roundNumber) {
      if (deviceFallback) {
        const scope = storageAvailable ? "on this device" : "for this visit";
        const ranked = memory.scores.some(row => row.name === name);
        feedback.textContent = (api ? "Shared scores unavailable. " : "") +
          (ranked ? "Your personal best is saved " + scope + "." : "This round finished outside the top ten " + scope + ".");
      }
      setButtonLabel(openButton, "High scores");
      render();
      if (dialog.open) closeButton.focus();
    }
  });

  return {
    startRound() {
      ++roundNumber;
      pendingScore = 0;
      submitted = false;
      setButtonLabel(openButton, "High scores");
      roundTicket = api
        ? Promise.resolve().then(() => request("rounds", {player: player()})).then(result => result.token).catch(() => null)
        : null;
    },
    finishRound(score) {
      pendingScore = score;
      submitted = false;
      if (score > 0) {
        setButtonLabel(openButton, "Save score");
        open();
      }
    }
  };
}
