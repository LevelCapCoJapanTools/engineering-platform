import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createRun, getRun, runIdFromUrl } from "./api";
import type { CheckResult, Run, Scenario } from "./api";

const scenarios: { value: Scenario; label: string; detail: string }[] = [
  { value: "passing", label: "すべて成功", detail: "Rust と Web が成功" },
  { value: "failing", label: "チェック失敗", detail: "Web が失敗" },
  { value: "pending", label: "チェック実行中", detail: "Web が未完了" },
  { value: "missing", label: "チェックが欠落", detail: "Web の結果が未登録" },
];

const checkLabels: Record<CheckResult, string> = {
  passed: "成功",
  missing: "欠落",
  ambiguous: "重複",
  incomplete: "未完了",
  unsuccessful: "成功以外",
};

const eventLabels = {
  queued: "判定を受け付け",
  evaluated: "判定結果を記録",
};

const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "short",
  timeStyle: "medium",
});

function runStatus(run: Run | null, id: string | null) {
  if (run?.decision?.verdict === "passed") return "通過";
  if (run?.decision?.verdict === "blocked") return "ブロック";
  if (run) return "Worker の処理待ち";
  return id ? "読み込み中" : "未実行";
}

export function App() {
  const [scenario, setScenario] = useState<Scenario>("passing");
  const [id, setId] = useState(() => runIdFromUrl(window.location.search));
  const [run, setRun] = useState<Run | null>(null);
  const [posting, setPosting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pollError, setPollError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!id) return;
    const runId = id;
    const controller = new AbortController();
    let timer: number | undefined;
    const deadline = Date.now() + 20_000;

    async function poll() {
      try {
        const next = await getRun(runId, controller.signal);
        if (controller.signal.aborted) return;
        setRun(next);
        if (next.decision) return;
        if (Date.now() < deadline) {
          timer = window.setTimeout(poll, 700);
        } else {
          setPollError("処理を待っています。時間をおいて再取得できます。");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPollError(error instanceof Error ? error.message : "取得に失敗しました。");
        }
      }
    }

    void poll();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [id, retry]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPosting(true);
    setSubmitError("");
    try {
      const created = await createRun(scenario);
      const url = new URL(window.location.href);
      url.searchParams.set("run", created.id);
      window.history.replaceState(null, "", url);
      setRun(null);
      setPollError("");
      setId(created.id);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "判定を開始できませんでした。");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="legacy-demo">
      <header className="topbar">
        <div className="shell topbar-content">
          <span className="brand"><span className="brand-mark" aria-hidden="true">EP</span>Engineering Platform</span>
          <span className="environment">ローカルデモ</span>
        </div>
      </header>

      <main className="shell">
        <div className="page-heading">
          <h1>CIゲート</h1>
          <p>サンプルのチェック結果を判定し、根拠と監査ログを確認できます。</p>
        </div>

        <div className="workspace">
          <section className="card scenario-card" aria-labelledby="scenario-title">
            <h2 id="scenario-title">判定を実行</h2>
            <form onSubmit={submit}>
              <fieldset disabled={posting}>
                <legend>シナリオを選択</legend>
                {scenarios.map(({ value, label, detail }) => (
                  <label className="scenario" key={value}>
                    <input
                      type="radio"
                      name="scenario"
                      value={value}
                      checked={value === scenario}
                      onChange={() => setScenario(value)}
                    />
                    <span><strong>{label}</strong><small>{detail}</small></span>
                  </label>
                ))}
              </fieldset>
              <button className="primary" type="submit" disabled={posting}>
                {posting ? "受付中…" : "ゲートを実行"}
              </button>
              {submitError && <p className="error" role="alert">{submitError}</p>}
            </form>
          </section>

          <div className="details">
            <section className="card" aria-labelledby="result-title">
              <div className="section-heading">
                <h2 id="result-title">判定結果</h2>
                <span className={`status ${run?.decision?.verdict ?? "waiting"}`} role="status">
                  {runStatus(run, id)}
                </span>
              </div>
              {pollError && (
                <div className="poll-error">
                  <p className="error" role="alert">{pollError}</p>
                  <button className="secondary" type="button" onClick={() => {
                    setPollError("");
                    setRetry((value) => value + 1);
                  }}>再取得</button>
                </div>
              )}
              {!id && <p className="empty">シナリオを選んで実行すると、判定結果が表示されます。</p>}
              {run && (
                <dl className="run-meta">
                  <div><dt>リポジトリ</dt><dd>{run.snapshot.repository}</dd></div>
                  <div><dt>コミット</dt><dd><code title={run.snapshot.head_sha}>{run.snapshot.head_sha.slice(0, 12)}</code></dd></div>
                  {run.decision && <div><dt>ポリシー</dt><dd><code>{run.decision.policy_version}</code></dd></div>}
                </dl>
              )}
              {run?.decision && (
                <table>
                  <thead><tr><th scope="col">必須チェック</th><th scope="col">結果</th></tr></thead>
                  <tbody>
                    {run.decision.checks.map((check) => (
                      <tr key={check.name}>
                        <th scope="row">{check.name}</th>
                        <td className={check.result === "passed" ? "check-pass" : "check-block"}>
                          {checkLabels[check.result]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="card" aria-labelledby="audit-title">
              <h2 id="audit-title">監査ログ</h2>
              {run ? (
                <>
                  <p className="run-id">実行ID <code>{run.id}</code></p>
                  <ol className="timeline">
                    {run.events.map((event) => (
                      <li key={event.kind}>
                        <div><strong>{eventLabels[event.kind]}</strong><small>{event.actor}</small></div>
                        <time dateTime={event.occurred_at}>{timeFormat.format(new Date(event.occurred_at))}</time>
                      </li>
                    ))}
                  </ol>
                </>
              ) : <p className="empty">イベントがここに表示されます。</p>}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
