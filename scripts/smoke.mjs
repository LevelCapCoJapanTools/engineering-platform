import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";

const api = process.env.API_URL ?? "http://127.0.0.1:8080";
const web = process.env.WEB_URL ?? "http://127.0.0.1:5173";
const runsPath = "/api/v1/demo/runs";

function request(url, options) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(5_000) });
}

async function completedRun(path) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const response = await request(web + path);
    assert.equal(response.status, 200);
    const run = await response.json();
    if (run.decision) return run;
    await sleep(200);
  }
  throw new Error(`Worker did not record a decision for ${path}`);
}

assert.equal((await request(api + "/healthz")).status, 204);
assert.equal((await request(api + "/readyz")).status, 204);
assert.match(await (await request(web)).text(), /Engineering Platform/);

const missing = await request(api + runsPath + "/00000000-0000-0000-0000-000000000000");
assert.equal(missing.status, 404);

const postRun = (body) =>
  request(web + runsPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

assert.equal((await postRun({ scenario: "unknown" })).status, 422);

for (const [scenario, verdict, result] of [
  ["passing", "passed", "passed"],
  ["failing", "blocked", "unsuccessful"],
  ["pending", "blocked", "incomplete"],
  ["missing", "blocked", "missing"],
]) {
  const accepted = await postRun({ scenario });
  assert.equal(accepted.status, 202);
  const { id } = await accepted.json();
  const path = `${runsPath}/${id}`;
  assert.equal(accepted.headers.get("location"), path);

  const run = await completedRun(path);
  assert.equal(run.id, id);
  assert.equal(run.scenario, scenario);
  assert.equal(run.snapshot.repository, "example/demo-project");
  assert.match(run.snapshot.head_sha, /^[0-9a-f]{40}$/);
  assert.equal(run.decision.policy_version, "demo-ci-v1");
  assert.equal(run.decision.verdict, verdict);
  assert.deepEqual(run.decision.checks, [
    { name: "Rust", result: "passed" },
    { name: "Web", result },
  ]);
  assert.deepEqual(run.events.map(({ kind, actor }) => [kind, actor]), [
    ["queued", "local-demo"],
    ["evaluated", "worker"],
  ]);
  const times = run.events.map(({ occurred_at }) => Date.parse(occurred_at));
  assert(times[0] <= times[1]);
  console.log(`${scenario}: ${verdict}, audit recorded`);
}
