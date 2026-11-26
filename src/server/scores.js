const origins = new Set([
  "https://jamiekeaveneyportfolio.webflow.io",
  "https://jamiekeaveneyportfolio.com",
  "https://www.jamiekeaveneyportfolio.com"
]);
const firstNames = new Set("Amber Cobalt Copper Crimson Golden Indigo Lunar Neon Silver Solar Velvet Violet".split(" "));
const lastNames = new Set("Arc Comet Echo Finch Fox Lynx Orbit Otter Pixel Ray Star Wolf".split(" "));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hour = 3600;

function response(status, value, origin, headers = {}) {
  return new Response(value === null ? null : JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex",
      "Cache-Control": "no-store", Vary: "Origin",
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}), ...headers
    }
  });
}

async function body(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  if (Number(request.headers.get("content-length")) > 1024 || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, input = "";
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1024) { await reader.cancel(); return null; }
    input += decoder.decode(value, {stream:true});
  }
  try {
    const result = JSON.parse(input + decoder.decode());
    return result && typeof result === "object" && !Array.isArray(result) ? result : null;
  } catch { return null; }
}

async function digest(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, "0")).join("");
}

async function top(db) {
  const rows = await db.prepare("SELECT name, score FROM players ORDER BY score DESC, achieved_at, player LIMIT 10").all();
  return rows.results;
}

async function startRound(db, input, ip, now, origin) {
  // The secret and short-lived counter never expose an address or device identifier in board data.
  const secret = await db.batch([
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('salt', ?)").bind(crypto.randomUUID()),
    db.prepare("SELECT value FROM settings WHERE key = 'salt'")
  ]);
  const salt = secret[1].results[0].value;
  const bucket = Math.floor(now / hour);
  const network = await digest(salt + "|" + bucket + "|" + ip);
  const player = await digest(salt + "|" + input.player);
  const token = crypto.randomUUID();
  const limit = await db.prepare(`INSERT INTO limits (network, bucket, used) VALUES (?, ?, 1)
    ON CONFLICT(network, bucket) DO UPDATE SET used=used+1 WHERE used<50 RETURNING used`).bind(network,bucket).first();
  if (!limit) return response(429, {error:"Try again later."}, origin, {"Retry-After":String((bucket+1)*hour-now)});
  await db.batch([
    db.prepare("DELETE FROM rounds WHERE expires_at <= ?").bind(now),
    db.prepare("DELETE FROM limits WHERE bucket < ?").bind(bucket),
    db.prepare("INSERT INTO rounds (token, player, started_at, expires_at) VALUES (?, ?, ?, ?)").bind(token,player,now,now+hour)
  ]);
  return response(201, {token}, origin);
}

async function saveScore(db, input, now, origin) {
  const [first,last,extra] = typeof input.name === "string" ? input.name.split(" ") : [];
  if (extra !== undefined || !firstNames.has(first) || !lastNames.has(last) ||
      (typeof input.token !== "string" || !uuid.test(input.token)) || !Number.isSafeInteger(input.score) || input.score < 1 || input.score > 9999) {
    return response(400, {error:"Invalid score or player name."}, origin);
  }
  const salt = await db.prepare("SELECT value FROM settings WHERE key='salt'").first("value");
  if (!salt) return response(409,{error:"This round has expired."},origin);
  const player = await digest(salt + "|" + input.player);
  // A score must come from a live, single-use round with enough time for its countdown and rallies.
  const earliestStart = now - Math.ceil(2 + input.score * .23);
  const outcome = await db.batch([
    db.prepare(`INSERT INTO players (player, name, score, achieved_at)
      SELECT player, ?, ?, ? FROM rounds WHERE token=? AND player=? AND started_at<=? AND expires_at>?
      ON CONFLICT(player) DO UPDATE SET
        name=CASE WHEN excluded.score>=players.score THEN excluded.name ELSE players.name END,
        achieved_at=CASE WHEN excluded.score>players.score THEN excluded.achieved_at ELSE players.achieved_at END,
        score=MAX(players.score,excluded.score)`).bind(input.name,input.score,now,input.token,player,earliestStart,now),
    db.prepare("DELETE FROM rounds WHERE token=? AND player=?").bind(input.token,player),
    db.prepare(`DELETE FROM players WHERE player IN
      (SELECT player FROM players ORDER BY score DESC, achieved_at, player LIMIT -1 OFFSET 100)`)
  ]);
  if (!outcome[0].meta.changes) return response(409, {error:"This round has expired or was already submitted."}, origin);
  return response(200, {scores:await top(db)}, origin);
}

export default {
  async fetch(request, env, resourcePath) {
    const origin = request.headers.get("Origin");
    const path = resourcePath || new URL(request.url).pathname;
    if (!["/v1/scores","/v1/rounds"].includes(path)) return response(404,{error:"Not found."},null);
    // Browsers can omit Origin on same-origin requests. Fetch Metadata is set by the browser.
    // An explicit foreign or opaque origin must still pass the same allowlist as a preflight.
    const sameSiteRequest = origin === null &&
      request.headers.get("Sec-Fetch-Site") === "same-origin" &&
      origins.has(new URL(request.url).origin);
    const publicRead = origin === null && request.method === "GET";
    if (!origins.has(origin) && !sameSiteRequest && !publicRead) {
      return response(403, {error:"Unsupported origin."}, null);
    }
    if (request.method === "OPTIONS") return response(204,null,origin,{
      "Access-Control-Allow-Methods":"GET, POST, DELETE, OPTIONS","Access-Control-Allow-Headers":"Content-Type",
      "Access-Control-Max-Age":"86400"
    });
    try {
      if (request.method === "GET" && path === "/v1/scores") {
        return response(200,{scores:await top(env.DB)},origin,{"Cache-Control":"public, max-age=15"});
      }
      const withdrawing = path === "/v1/scores" && request.method === "DELETE";
      if (request.method !== "POST" && !withdrawing) return response(405,{error:"Unsupported method."},origin);
      const input=await body(request);
      if (!input || typeof input.player!=="string" || !uuid.test(input.player)) return response(400,{error:"Invalid player."},origin);
      if (withdrawing) {
        const salt = await env.DB.prepare("SELECT value FROM settings WHERE key='salt'").first("value");
        if (salt) {
          const player = await digest(salt + "|" + input.player);
          await env.DB.batch([
            env.DB.prepare("DELETE FROM players WHERE player=?").bind(player),
            env.DB.prepare("DELETE FROM rounds WHERE player=?").bind(player)
          ]);
        }
        return response(204,null,origin);
      }
      const now=Math.floor(Date.now()/1000);
      return path==="/v1/rounds"
        ? await startRound(env.DB,input,request.headers.get("CF-Connecting-IP") || "unknown",now,origin)
        : await saveScore(env.DB,input,now,origin);
    } catch {
      return response(503,{error:"Scores are temporarily unavailable."},origin);
    }
  }
};
