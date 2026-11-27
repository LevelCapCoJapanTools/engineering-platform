export type Scenario = "passing" | "failing" | "pending" | "missing";

export type CheckResult =
  | "passed"
  | "missing"
  | "ambiguous"
  | "incomplete"
  | "unsuccessful";

export interface Run {
  id: string;
  scenario: Scenario;
  snapshot: {
    repository: string;
    head_sha: string;
  };
  decision: {
    policy_version: string;
    verdict: "passed" | "blocked";
    checks: { name: string; result: CheckResult }[];
  } | null;
  events: {
    kind: "queued" | "evaluated";
    actor: "local-demo" | "worker";
    occurred_at: string;
  }[];
}

const runsPath = "/api/v1/demo/runs";

export function runIdFromUrl(search: string): string | null {
  const id = new URLSearchParams(search).get("run");
  const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  return id && uuidPattern.test(id) ? id : null;
}

export async function createRun(scenario: Scenario): Promise<{ id: string }> {
  const response = await fetch(runsPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!response.ok) throw new Error("判定を開始できませんでした。");
  return response.json();
}

export async function getRun(id: string, signal: AbortSignal): Promise<Run> {
  const response = await fetch(`${runsPath}/${encodeURIComponent(id)}`, {
    signal,
    cache: "no-store",
  });
  if (response.status === 404) throw new Error("指定された判定が見つかりません。");
  if (!response.ok) throw new Error("判定結果を取得できませんでした。");
  return response.json();
}
