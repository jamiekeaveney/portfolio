/* Loaded only with the 404 game. Player names are assembled from approved words. */
function createPongLeaderboard(root, pauseGame) {
  const key = "jk-pong-board-v1";
  const firstNames = ["Amber", "Cobalt", "Copper", "Crimson", "Golden", "Indigo", "Lunar", "Neon", "Silver", "Solar", "Velvet", "Violet"];
  const lastNames = ["Arc", "Comet", "Echo", "Finch", "Fox", "Lynx", "Orbit", "Otter", "Pixel", "Ray", "Star", "Wolf"];
  const houseScores = [
    { name: "House I", score: 32 },
    { name: "House II", score: 24 },
    { name: "House III", score: 16 }
  ];
  const maxRecords = 10;
  let memory = { name: "", scores: [] };
  let storageAvailable = true;
  let pendingScore = 0;
  let submitted = false;
  let sharedScores = null;
  let sharedRevision = 0;
  let roundTicket = null;
  let roundNumber = 0;
  let playerId;
  const api = root.getAttribute("data-score-api") || "https://jamiekeaveneyportfolio.webflow.io/pong-scores/v1/";

  async function request(resource, data) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    try {
      const options = { credentials: "omit", signal: controller.signal };
      if (data) Object.assign(options, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      const response = await fetch(new URL(resource, api), options);
      if (!response.ok) throw new Error("Scores unavailable");
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
      row => row && validName(row.name) && Number.isSafeInteger(row.score) && row.score > 0 && row.score <= 9999
    );
  }

  async function refreshShared() {
    const revision = ++sharedRevision;
    try {
      const scores = validScores(await request("scores"));
      if (revision === sharedRevision) sharedScores = scores;
    } catch {
      if (revision === sharedRevision) sharedScores = null;
    }
    if (dialog.open) render();
  }

  function validName(name) {
    if (typeof name !== "string") return false;
    const words = name.split(" ");
    return words.length === 2 && firstNames.includes(words[0]) && lastNames.includes(words[1]);
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
        name: validName(saved.name) ? saved.name : "",
        scores: ordered(scores.filter(row => row && validName(row.name) && Number.isSafeInteger(row.score) && row.score > 0))
      };
    } catch {
      // Storage may be disabled, full or contain data from an incomplete write.
    }
    return memory;
  }

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "pong_scores_toggle";
  openButton.textContent = "High scores";
  openButton.setAttribute("aria-haspopup", "dialog");
  const dialog = document.createElement("dialog");
  dialog.className = "pong_scores_dialog";
  dialog.setAttribute("aria-labelledby", "pong-scores-title");
  dialog.innerHTML = `
    <header class="pong_scores_header">
      <h2 id="pong-scores-title">High scores</h2>
      <button class="pong_scores_close" type="button" aria-label="Close high scores" autofocus>Close</button>
    </header>
    <div class="pong_scores_labels"><span>Player</span><span>Returns</span></div>
    <ol class="pong_scores_list"></ol>
    <p class="pong_scores_note"></p>
    <form class="pong_scores_form" hidden>
      <p class="pong_scores_result"></p>
      <fieldset><legend>Choose a player name</legend>
        <select aria-label="First part of player name"></select>
        <select aria-label="Second part of player name"></select>
      </fieldset>
      <button class="pong_scores_save" type="submit">Save score</button>
    </form>
    <p class="pong_scores_feedback" role="status"></p>
  `;
  root.append(openButton, dialog);
  const form = dialog.querySelector("form");
  const feedback = dialog.querySelector(".pong_scores_feedback");
  const [firstSelect, lastSelect] = form.querySelectorAll("select");
  function fill(select, names) {
    for (const name of names) {
      const option = document.createElement("option");
      option.value = option.textContent = name;
      select.append(option);
    }
  }
  fill(firstSelect, firstNames);
  fill(lastSelect, lastNames);

  function render() {
    const { scores } = read();
    const rows = ordered([...(sharedScores ?? scores), ...houseScores]).slice(0, maxRecords);
    const list = dialog.querySelector("ol");
    list.replaceChildren();
    for (const row of rows) {
      const entry = document.createElement("li");
      const player = document.createElement("span");
      const score = document.createElement("span");
      player.textContent = row.name;
      score.textContent = String(row.score).padStart(2, "0");
      entry.append(player, score);
      list.append(entry);
    }
    const scope = sharedScores === null
      ? (storageAvailable ? "Showing scores on this device." : "Showing scores for this visit.")
      : "Player scores are shared across the portfolio.";
    dialog.querySelector(".pong_scores_note").textContent = "House scores are preset targets. " + scope;
    form.hidden = !pendingScore || submitted;
    dialog.querySelector(".pong_scores_result").textContent =
      pendingScore + (pendingScore === 1 ? " return" : " returns") + " this round";
  }

  function open() {
    if (dialog.open) return;
    pauseGame();
    const saved = read().name;
    if (saved) [firstSelect.value, lastSelect.value] = saved.split(" ");
    feedback.textContent = "";
    render();
    dialog.showModal();
    refreshShared();
  }

  openButton.addEventListener("click", open);
  dialog.querySelector(".pong_scores_close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => openButton.focus({preventScroll: true}));
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const name = firstSelect.value + " " + lastSelect.value;
    if (submitted || !pendingScore || !validName(name)) return;
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
    if (navigator.locks) {
      try { await navigator.locks.request(key, save); }
      catch { save(); }
    } else save();

    try {
      const token = await ticket;
      if (!token) throw new Error("Round unavailable");
      const result = validScores(await request("scores", {player: player(), token, score, name}));
      ++sharedRevision;
      sharedScores = result;
      if (round === roundNumber) feedback.textContent = "Score submitted for " + name + ".";
    } catch {
      ++sharedRevision;
      sharedScores = null;
      if (round === roundNumber) feedback.textContent = storageAvailable
        ? "Shared scores unavailable. Your result was saved on this device."
        : "Shared scores unavailable. Your result is saved for this visit.";
    }
    if (round === roundNumber) {
      openButton.textContent = "High scores";
      render();
      if (dialog.open) dialog.querySelector(".pong_scores_close").focus();
    }
  });

  return {
    startRound() {
      ++roundNumber;
      pendingScore = 0;
      submitted = false;
      openButton.textContent = "High scores";
      roundTicket = Promise.resolve()
        .then(() => request("rounds", {player: player()}))
        .then(result => result.token)
        .catch(() => null);
    },
    finishRound(score) {
      pendingScore = score;
      submitted = false;
      if (score > 0) {
        openButton.textContent = "Save score";
        open();
      }
    }
  };
}
