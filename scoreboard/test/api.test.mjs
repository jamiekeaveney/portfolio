import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import service from "../src/server/scores.js";

const staging = "https://jamiekeaveneyportfolio.webflow.io";
const production = "https://www.jamiekeaveneyportfolio.com";
const sql = new DatabaseSync(":memory:");
sql.exec(readFileSync(new URL("../migrations/0001_scores.sql", import.meta.url), "utf8"));
class Statement {
  constructor(query, args = []) { this.query = query; this.args = args; }
  bind(...args) { return new Statement(this.query, args); }
  first(key) {
    const row = sql.prepare(this.query).get(...this.args);
    return key ? row?.[key] ?? null : row ?? null;
  }
  all() { return {results: sql.prepare(this.query).all(...this.args)}; }
  execute() {
    if (/^SELECT/i.test(this.query)) return this.all();
    return {meta: sql.prepare(this.query).run(...this.args)};
  }
}
const DB = {
  prepare(query) { return new Statement(query); },
  batch(statements) {
    sql.exec("BEGIN");
    try {
      const result = statements.map(x => x.execute());
      sql.exec("COMMIT");
      return result;
    } catch (error) { sql.exec("ROLLBACK"); throw error; }
  }
};
function call(path, method, body, origin = staging) {
  const headers = new Headers({"Content-Type": "application/json"});
  if (origin) headers.set("Origin", origin);
  return service.fetch(new Request("https://scores.example/v1/" + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  }), {DB});
}
const player = crypto.randomUUID();
const second = crypto.randomUUID();
let now = Math.floor(Date.now()/1000);
async function ticket(id) {
  const reply = await call("rounds", "POST", {player:id});
  assert.equal(reply.status,201);
  return (await reply.json()).token;
}

test("ranked scores persist for a second visitor, respect personal best, validation and withdrawal",async t => {
  t.mock.method(Date, "now", () => now * 1000);
  assert.equal((await call("scores","GET",undefined,null)).status,200);
  const preflight = await call("scores","OPTIONS",undefined,production);
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"),production);
  assert.equal((await call("rounds","POST",{player},"https://example.org")).status,403);
  assert.equal((await call("rounds","POST",{player:"invalid"})).status,400);
  const sameOriginHeaders = {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"};
  const sameOriginRequest = headers => new Request(staging + "/v1/rounds", {
    method: "POST", headers, body: JSON.stringify({player})
  });
  assert.equal((await service.fetch(sameOriginRequest(sameOriginHeaders), {DB})).status,201);
  assert.equal((await service.fetch(sameOriginRequest({...sameOriginHeaders, Origin:"null"}), {DB})).status,403);
  assert.equal((await service.fetch(sameOriginRequest({...sameOriginHeaders, "Sec-Fetch-Site":"cross-site"}), {DB})).status,403);
  let token = await ticket(player);
  now += 8;
  const submit = (score,name,who = player,round = token) => call("scores","POST",{player:who,token:round,score,name});
  assert.equal((await submit(3,"Not Allowed")).status,400);
  assert.equal((await submit(3.5,"Lunar Fox")).status,400);
  assert.equal((await submit(0,"Lunar Fox")).status,400);
  assert.equal((await submit(3,"Lunar Fox",second)).status,409);
  assert.equal((await submit(3,"Lunar Fox")).status,200);
  assert.equal((await submit(3,"Lunar Fox")).status,409);
  assert.deepEqual((await (await call("scores","GET",undefined,production)).json()).scores,[{name:"Lunar Fox",score:3}]);
  token = await ticket(player);
  now += 4;
  assert.equal((await submit(2,"Neon Ray")).status,200);
  assert.deepEqual((await (await call("scores","GET")).json()).scores,[{name:"Lunar Fox",score:3}]);
  token = await ticket(second);
  now += 10;
  assert.equal((await submit(5,"Solar Arc",second)).status,200);
  const ranked = (await (await call("scores","GET")).json()).scores;
  assert.deepEqual(ranked,[{name:"Solar Arc",score:5},{name:"Lunar Fox",score:3}]);
  token = await ticket(player);
  assert.equal((await submit(99,"Lunar Fox")).status,409);
  token = await ticket(player);
  now += 3601;
  assert.equal((await submit(1,"Lunar Fox")).status,409);
  assert.equal((await call("scores","DELETE",{player:second})).status,204);
  assert.deepEqual((await (await call("scores","GET")).json()).scores,[{name:"Lunar Fox",score:3}]);
  // Move the local fixture's counter to its boundary without sending traffic.
  await ticket(player);
  sql.prepare("UPDATE limits SET used=50").run();
  const limit = await call("rounds","POST",{player});
  assert.equal(limit.status,429);
  assert(Number(limit.headers.get("Retry-After"))>0);
  assert.deepEqual((await (await call("scores","GET")).json()).scores,[{name:"Lunar Fox",score:3}]);
});
