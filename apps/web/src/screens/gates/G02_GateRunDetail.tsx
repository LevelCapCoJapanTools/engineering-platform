// 画面ID: G-02 ゲート実行の詳細
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { CHECK_ANOMALY, GATE_STATUS } from "../../lib/vocab";
import type { GateLetter, GateRun } from "../../lib/types";
import { GATE_LABELS } from "../../lib/types";
import { exceptionById, gateRuns, requirementById, userById } from "../../mocks/core";
import { CHANGE_TERM, checkInputs, invalidatedBySha, otherRuns, prFindings, pullByNumber, ruleDefs, runTimeline } from "../../mocks/gates";
import type { ScmProvider } from "../../mocks/gates";
import { formatDateTime } from "../../lib/format";
import {
  ActorLabel,
  AIFindingCard,
  AISectionHead,
  ApprovalPanel,
  Banner,
  Button,
  CodeRef,
  DetailLayout,
  EnforcementBadge,
  ExceptionSummary,
  ExternalActor,
  ProviderBadge,
  Tag,
  GateResultPanel,
  HashDisplay,
  Icon,
  IdLink,
  KeyValueList,
  MetaSection,
  MoreMenu,
  PageHeader,
  PolicyVersionTag,
  ProjectLayout,
  Section,
  StatusBadge,
  Timeline,
  Timestamp,
  membersWithRole,
  useToast,
} from "../../ui";
import type { Approver } from "../../lib/types";

const LETTERS: GateLetter[] = ["A", "B", "C", "D"];

const STATE_RUN: Record<string, string> = {
  pass: "run-5810",
  block: "run-5821",
  warn: "run-5808",
  exception: "run-5815",
  running: "run-5830",
  stale: "run-5821",
  anomaly: "run-5821",
};

function pickRun(state: string, runId: string): GateRun & { provider: ScmProvider; repo: string } {
  const id = STATE_RUN[state] ?? runId;
  const other = otherRuns.find((g) => g.id === id);
  if (other) return other;
  const run = gateRuns.find((g) => g.id === id) ?? gateRuns[0];
  return { ...run, provider: "github", repo: pullByNumber(run.pr_number)?.repo ?? "sample-soft/order-api" };
}

function summary(run: GateRun) {
  const blocks = run.reasons.filter((r) => r.result === "block");
  const warns = run.reasons.filter((r) => r.result === "warn");
  switch (run.verdict) {
    case "pass":
      return { tone: "pass" as const, text: "すべてのゲートを通過しました。マージできます。" };
    case "block":
      return { tone: "fail" as const, text: `ブロック: ${blocks.length}件の問題を修正してください。` };
    case "warn":
      return { tone: "warn" as const, text: `警告: ${warns.length}件の指摘があります。マージは可能ですが、確認してください。` };
    case "exception":
      return { tone: "info" as const, text: "承認済みの例外により通過しています。例外の期限までに修正してください。" };
    case "running":
      return { tone: "info" as const, text: "判定を実行しています。完了すると結果がここに表示されます。" };
    default:
      return { tone: "info" as const, text: "まだ判定は実行されていません。" };
  }
}

export function GateRunDetailScreen({ org, project, runId }: { org: string; project: string; runId: string }) {
  const state = useScreenState();
  const toast = useToast();
  const run = pickRun(state, runId);
  const s = summary(run);
  const fixes = run.reasons.filter((r) => r.result !== "pass");
  const exception = run.exception_id ? exceptionById(run.exception_id) : undefined;
  const isAgentPr = run.author.kind === "ai";
  const inputs = checkInputs(state === "anomaly");
  const anomalies = inputs.filter((c) => c.anomaly);
  const term = CHANGE_TERM[run.provider];

  const approvers: Approver[] = run.required_approvals.map((a) => ({
    role: a.role,
    user_id: a.user_id,
    status: a.status,
    decided_at: a.status === "approved" ? run.started_at : undefined,
  }));

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const reqIds = Array.from(new Set(run.reasons.flatMap((r) => (r.target ?? "").match(/REQ-\d{4}/g) ?? [])));

  const main = (
    <>
      {state === "stale" ? (
        <Banner tone="fail" title="新しいコミットが追加されたため、この判定と承認は失効しました" action={<Button size="sm" variant="primary" icon="arrowRight" onClick={() => navigate(paths.gate(org, project, "run-5830"))}>最新の実行へ</Button>}>
          <div className="stack" style={{ ["--gap" as string]: "4px" }}>
            <span>{CHANGE_TERM[run.provider]} に新しいコミット（<span className="mono">7c1e0a4</span>）が追加されました。古いコミットの結果や承認は新しいコミットに流用しません。新しいコミットで再評価と再承認が必要です。</span>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {invalidatedBySha.map((i) => <li key={i.kind + i.id}><strong>{i.kind}</strong> {i.id} — <span className="muted">{i.detail}</span></li>)}
            </ul>
          </div>
        </Banner>
      ) : null}
      {anomalies.length ? (
        <Banner tone="fail" title={`外部チェック結果に異常が ${anomalies.length} 件あります`}>
          異常な結果はどれも「通過」として扱いません。必須チェックが正しい提供元から、対象コミットに対して届くまでゲートは確定しません。下の「入力した外部チェック結果」で内容を確認してください。
        </Banner>
      ) : null}

      <section className="card stack" style={{ ["--gap" as string]: "12px" }} aria-label="判定の要約">
        <div className="row" style={{ ["--gap" as string]: "12px" }}>
          <StatusBadge vocab={GATE_STATUS[run.verdict]} size="lg" />
          <span className="strong" style={{ fontSize: "var(--text-md)" }}>{s.text}</span>
        </div>
        {fixes.length ? (
          <div className="stack" style={{ ["--gap" as string]: "6px" }}>
            <span className="label">修正が必要な項目</span>
            <ol style={{ margin: 0, paddingLeft: 20 }} className="stack">
              {fixes.map((r) => (
                <li key={r.rule_id + r.message} style={{ ["--gap" as string]: "0" }}>
                  <button type="button" className="btn ghost sm" style={{ padding: 0, minHeight: 0, justifyContent: "flex-start", textAlign: "left", whiteSpace: "normal" }} onClick={() => scrollTo(`gate-${r.gate}`)}>
                    <span className="mono muted">ゲート{r.gate} · {r.rule_id}</span>
                    <span style={{ fontWeight: 500, color: "var(--text-strong)" }}>{r.message}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        <div className="row small muted" style={{ ["--gap" as string]: "16px" }}>
          {LETTERS.map((l) => (
            <button key={l} type="button" className="btn ghost sm" onClick={() => scrollTo(`gate-${l}`)}>
              ゲート{l}（{GATE_LABELS[l]}）: <StatusBadge vocab={GATE_STATUS[run.gates[l]]} size="sm" />
            </button>
          ))}
        </div>
      </section>

      {exception ? (
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          <span className="label">適用中の例外</span>
          <ExceptionSummary ex={exception} />
        </div>
      ) : null}

      {LETTERS.map((l) => (
        <div key={l} id={`gate-${l}`} style={{ scrollMarginTop: 80 }}>
          <GateResultPanel
            letter={l}
            status={run.gates[l]}
            reasons={run.reasons.filter((r) => r.gate === l)}
            enforcement={run.enforcement}
            policyVersion={run.policy_version}
            onException={(r) => navigate(`${paths.exceptionNew(org, project)}?run=${run.id}&rule=${r.rule_id}`)}
          />
        </div>
      ))}

      <Section title="ルールと判定の根拠" sub="ルールごとに、対象の統制項目・判定の主体・必要な証跡・修正案を示します" flush>
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>ルール</th><th>説明</th><th>統制項目</th><th>判定の主体</th><th>証跡</th><th>結果</th><th>修正案</th></tr></thead>
            <tbody>
              {run.reasons.map((r) => {
                const d = ruleDefs[r.rule_id];
                return (
                  <tr key={r.rule_id + r.message}>
                    <td className="mono small">{r.rule_id}</td>
                    <td className="small">{d?.title ?? r.message}</td>
                    <td>{d ? <IdLink id={d.control} to={paths.control(org, project, d.control)} /> : <span className="muted">—</span>}</td>
                    <td><ActorLabel kind={d?.actor ?? "ci"} size="sm" /></td>
                    <td className="small">{d?.evidence ?? "—"}</td>
                    <td><StatusBadge vocab={GATE_STATUS[r.result === "block" ? "block" : r.result === "warn" ? "warn" : "pass"]} size="sm" /></td>
                    <td className="small">{r.fix ?? <span className="muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="入力した外部チェック結果" sub={`ゲートの入力に使った CI 等の結果です。対象コミット ${run.commit_sha.slice(0, 7)} と一致し、登録済みの提供元から届いたものだけを使います`} flush>
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>チェック</th><th>提供元</th><th>コミット</th><th>結果</th><th>扱い</th><th>受信</th></tr></thead>
            <tbody>
              {inputs.map((c) => (
                <tr key={c.name}>
                  <td className="mono small">{c.name}</td>
                  <td className="small">{c.provider}</td>
                  <td className="mono small">{c.sha}</td>
                  <td>{c.status === "success" ? <Tag tone="pass" icon="check">成功</Tag> : c.status === "failure" ? <Tag tone="fail" icon="x">失敗</Tag> : <Tag icon="clock">未完了</Tag>}</td>
                  <td>
                    {c.anomaly ? (
                      <span className="stack" style={{ ["--gap" as string]: "2px" }}>
                        <StatusBadge vocab={CHECK_ANOMALY[c.anomaly]} size="sm" />
                        <span className="tiny muted">{c.note}・通過として扱わない</span>
                      </span>
                    ) : (
                      <span className="small">{c.note ?? "判定に使用"}</span>
                    )}
                  </td>
                  <td><Timestamp at={c.at} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="必要な人間の承認（ゲートC）" sub="承認は人間だけが行えます。AIエージェントは承認できません。">
        {approvers.length ? (
          <ApprovalPanel
            approvers={approvers}
            blockedReason={
              isAgentPr
                ? `AIエージェントの ${term} は、開発者または設計者が Git サービス上のレビューで承認します。経営層の画面からは承認しません。`
                : approvers.every((a) => a.status === "approved")
                  ? undefined
                  : `このゲートの承認は、設計者または開発者が Git サービス上のレビューで行います。承認者の外部IDで記録します。`
            }
            eligible={isAgentPr ? membersWithRole("開発者") : membersWithRole("設計者")}
            canDecide={false}
          />
        ) : (
          <p className="small muted">この変更に必要な人間の承認はありません。</p>
        )}
      </Section>

      <section className="stack" style={{ ["--gap" as string]: "10px" }} aria-label="AIの参考所見">
        <AISectionHead count={run.verdict === "running" ? 0 : prFindings.length} />
        {run.verdict === "running" ? (
          <p className="small muted">判定の完了後に、AIのレビューを実行します。</p>
        ) : (
          prFindings.map((f) => <AIFindingCard key={f.id} finding={f} />)
        )}
      </section>

      <details className="card">
        <summary className="row between" style={{ cursor: "pointer", listStyle: "none" }}>
          <span className="section-title">判定の再現情報</span>
          <span className="small muted">保存済みの入力とポリシーだけで、同じ判定を再現できます <Icon name="chevronDown" size={13} /></span>
        </summary>
        <div style={{ marginTop: 16 }}>
          <KeyValueList
            items={[
              { label: "ポリシーのバージョン", value: <PolicyVersionTag pack="Basic Control Pack" version={run.policy_version.replace("Basic Control Pack ", "")} /> },
              { label: "ポリシーのハッシュ", value: <HashDisplay value={run.policy_sha256} /> },
              { label: "入力スナップショット", value: <HashDisplay value={run.input_sha256} /> },
              { label: "CI 実行ID", value: <span className="mono">{run.ci_run_id}</span> },
              { label: "コミット", value: <HashDisplay value={run.commit_sha} /> },
              { label: "判定日時", value: formatDateTime(run.started_at) },
              { label: "強制レベル", value: <EnforcementBadge level={run.enforcement} showDescription /> },
            ]}
          />
          <div className="row end" style={{ marginTop: 12 }}>
            <Button icon="refresh" to={paths.gateReplay(org, project, run.id)}>保存済みの入力で判定を再現</Button>
          </div>
        </div>
      </details>
    </>
  );

  const side = (
    <>
      <MetaSection title="対象">
        <KeyValueList
          stacked
          items={[
            { label: "提供元", value: <ProviderBadge provider={run.provider} size="sm" /> },
            { label: term, value: run.pr_number ? <CodeRef kind="pr" repo={run.repo} value={String(run.pr_number)} /> : <span className="muted">なし（ブランチ実行）</span> },
            { label: "ブランチ", value: <span className="mono small">{run.branch}</span> },
            { label: "作成者", value: run.author.kind === "human" ? <ExternalActor userId={run.author.user_id} name={run.author.name} /> : <ActorLabel kind={run.author.kind} name={run.author.name} /> },
            { label: "実行日時", value: <Timestamp at={run.started_at} mode="absolute" /> },
          ]}
        />
      </MetaSection>
      <MetaSection title="関連する要求">
        {reqIds.length ? (
          reqIds.map((id) => {
            const r = requirementById(id);
            return (
              <div key={id} className="row" style={{ ["--gap" as string]: "8px" }}>
                <IdLink id={id} to={paths.requirement(org, project, id)} title={r.title} />
                <span className="small truncate">{r.title}</span>
              </div>
            );
          })
        ) : (
          <span className="small muted">関連する要求はありません</span>
        )}
      </MetaSection>
      <MetaSection title="経緯">
        <Timeline items={runTimeline} compact />
      </MetaSection>
      {isAgentPr ? (
        <Banner tone="info" title="AIエージェントが作成した PR">
          {userById("u-agent")?.name} にはマージ・承認・ポリシー編集の権限がありません。人間のレビュー承認が必要です。
        </Banner>
      ) : null}
    </>
  );

  return (
    <ProjectLayout org={org} project={project} active="gates" trail={[{ label: "ゲート実行", to: paths.gates(org, project) }, { label: run.id }]}>
      <PageHeader
        id={run.id}
        title={run.pr_number ? `${term} #${run.pr_number} ${run.pr_title}` : run.pr_title}
        status={GATE_STATUS[run.verdict]}
        meta={
          <>
            <ProviderBadge provider={run.provider} size="sm" />
            {run.pr_number ? <CodeRef kind="pr" repo={run.repo} value={String(run.pr_number)} /> : null}
            <HashDisplay label="コミット" value={run.commit_sha} />
            <ActorLabel kind={run.author.kind} name={run.author.name} size="sm" />
            <EnforcementBadge level={run.enforcement} />
          </>
        }
        actions={
          <>
            <Button icon="refresh" loading={run.verdict === "running"} onClick={() => toast({ kind: "info", message: "ゲートの再実行を受け付けました" })}>再実行</Button>
            <MoreMenu
              items={[
                { label: `提供元で ${term} を開く`, icon: "external" },
                { label: "判定を再現する", icon: "refresh", onClick: () => navigate(paths.gateReplay(org, project, run.id)) },
                { label: "Evidence Manifest を見る", icon: "signature", onClick: () => navigate(paths.manifests(org, project)) },
                { label: "判定結果を JSON で出力", icon: "download" },
              ]}
            />
          </>
        }
      />
      <DetailLayout main={main} side={side} />
    </ProjectLayout>
  );
}
