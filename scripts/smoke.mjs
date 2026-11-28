import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

const api = process.env.API_URL ?? "http://127.0.0.1:8080";
const web = process.env.WEB_URL ?? "http://127.0.0.1:5173";
const runsPath = "/api/v1/demo/runs";
// compose.yaml のローカル専用の値。本番の秘密値ではない
const webhookSecret = process.env.EP_GITHUB_WEBHOOK_SECRET ?? "local-dev-only-webhook-secret";

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
assert.match(await (await request(web)).text(), /<div id="root">/);

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

// GitHub Webhook: 署名の検証、配信IDでの重複除外、古い版での巻戻しの防止
const postWebhook = (deliveryId, payload, secret = webhookSecret) => {
  const body = JSON.stringify(payload);
  const signature = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  return request(api + "/api/v1/webhooks/github", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": "pull_request",
      "X-GitHub-Delivery": deliveryId,
      "X-Hub-Signature-256": signature,
    },
    body,
  });
};
// 実行ごとに別のリポジトリ名にして、DB に残った前回の版の影響を受けないようにする
const smokeRepository = `example/smoke-${randomUUID()}`;
const pullRequest = (updatedAt) => ({
  action: "synchronize",
  repository: { full_name: smokeRepository },
  pull_request: { number: 7, updated_at: updatedAt },
});
const newer = randomUUID();
const older = randomUUID();

assert.equal((await postWebhook(randomUUID(), pullRequest("2026-11-27T01:00:00Z"), "wrong-secret")).status, 401);
for (const [delivery, payload, expected] of [
  [newer, pullRequest("2026-11-27T01:00:00Z"), "applied"],
  [newer, pullRequest("2026-11-27T01:00:00Z"), "duplicate"],
  [older, pullRequest("2026-11-27T00:30:00Z"), "ignored_older"],
]) {
  const response = await postWebhook(delivery, payload);
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { result: expected });
}
console.log("github webhook: verified, deduplicated, out-of-order ignored");
