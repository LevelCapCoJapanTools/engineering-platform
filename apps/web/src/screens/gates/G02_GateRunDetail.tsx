// 画面ID: G-02 ゲート実行の詳細
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { GATE_STATUS } from "../../lib/vocab";
import type { GateLetter, GateRun } from "../../lib/types";
import { GATE_LABELS } from "../../lib/types";
import { exceptionById, gateRuns, requirementById, userById } from "../../mocks/core";
import { prFindings, runTimeline } from "../../mocks/gates";
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
};

function pickRun(state: string, runId: string): GateRun {
  const id = STATE_RUN[state] ?? runId;
  return gateRuns.find((g) => g.id === id) ?? gateRuns[0];
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
        <Banner tone="warn" title="この判定は古いコミットに対するものです" action={<Button size="sm" variant="primary" icon="arrowRight" onClick={() => navigate(paths.gate(org, project, "run-5830"))}>最新の実行へ</Button>}>
          PR に新しいコミット（<span className="mono">7c1e0a4</span>）が追加されています。最新のコミットに対する判定を確認してください。
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

      <Section title="必要な人間の承認（ゲートC）" sub="承認は人間だけが行えます。AIエージェントは承認できません。">
        {approvers.length ? (
          <ApprovalPanel
            approvers={approvers}
            blockedReason={
              isAgentPr
                ? "AIエージェントの PR は、開発者または設計者のロールを持つ人間が承認します。あなた（PM）はこの PR の承認者ではありません。"
                : approvers.every((a) => a.status === "approved")
                  ? undefined
                  : "このゲートの承認には設計者または開発者のロールが必要です。"
            }
            eligible={isAgentPr ? membersWithRole("開発者") : membersWithRole("設計者")}
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
            { label: "PR", value: run.pr_number ? <CodeRef kind="pr" repo="sample-soft/order-api" value={String(run.pr_number)} /> : <span className="muted">なし（ブランチ実行）</span> },
            { label: "ブランチ", value: <span className="mono small">{run.branch}</span> },
            { label: "作成者", value: <ActorLabel kind={run.author.kind} name={run.author.name} /> },
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
        title={run.pr_number ? `#${run.pr_number} ${run.pr_title}` : run.pr_title}
        status={GATE_STATUS[run.verdict]}
        meta={
          <>
            {run.pr_number ? <CodeRef kind="pr" repo="sample-soft/order-api" value={String(run.pr_number)} /> : null}
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
                { label: "GitHub で PR を開く", icon: "external" },
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
