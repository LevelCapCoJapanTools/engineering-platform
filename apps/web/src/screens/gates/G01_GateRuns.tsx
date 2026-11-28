// 画面ID: G-01 ゲート実行の一覧
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { GATE_STATUS } from "../../lib/vocab";
import type { GateRun } from "../../lib/types";
import { gateRuns } from "../../mocks/core";
import { CHANGE_TERM, otherRuns, pullByNumber } from "../../mocks/gates";
import type { ScmProvider } from "../../mocks/gates";
import {
  ActorLabel,
  Button,
  ExternalActor,
  ProviderBadge,
  DataTable,
  EmptyState,
  EnforcementBadge,
  ErrorState,
  FilterBar,
  GateSummaryStrip,
  HashDisplay,
  PageHeader,
  PolicyVersionTag,
  ProjectLayout,
  Skeleton,
  StatCard,
  StatusBadge,
  Timestamp,
} from "../../ui";
import type { Column } from "../../ui";

type RunRow = GateRun & { provider: ScmProvider; repo: string };

const allRuns: RunRow[] = [
  ...gateRuns.map((r) => ({ ...r, provider: "github" as ScmProvider, repo: pullByNumber(r.pr_number)?.repo ?? "sample-soft/order-api" })),
  ...otherRuns,
];

export function GateRunsScreen({ org, project }: { org: string; project: string }) {
  const state = useScreenState();
  const [values, setValues] = useState<Record<string, string>>(state === "filtered" ? { verdict: "notRun" } : {});
  const [search, setSearch] = useState("");

  const rows = allRuns.filter((r) => {
    if (values.provider && r.provider !== values.provider) return false;
    if (values.verdict && r.verdict !== values.verdict) return false;
    if (values.gate && r.gates[values.gate as "A"] !== "block") return false;
    if (values.author && r.author.kind !== values.author) return false;
    if (values.branch === "main" && r.branch !== "main") return false;
    if (values.branch === "feature" && r.branch === "main") return false;
    if (search && !`${r.pr_title} ${r.pr_number ?? ""} ${r.branch}`.includes(search)) return false;
    return true;
  });
  const data = state === "empty" ? [] : rows;

  const columns: Column<RunRow>[] = [
    { key: "id", header: "実行ID", render: (r) => <span className="mono small">{r.id}</span>, sortValue: (r) => r.id },
    {
      key: "target",
      header: "対象",
      render: (r) => (
        <span className="stack" style={{ ["--gap" as string]: "2px" }}>
          <span className="strong" style={{ fontWeight: 500 }}>{r.pr_number ? `${CHANGE_TERM[r.provider]} #${r.pr_number} ` : ""}{r.pr_title}</span>
          <span className="tiny muted mono">{r.repo} · {r.branch}</span>
        </span>
      ),
    },
    { key: "provider", header: "提供元", render: (r) => <ProviderBadge provider={r.provider} size="sm" />, sortValue: (r) => r.provider },
    { key: "commit", header: "コミット", render: (r) => <span onClick={(e) => e.stopPropagation()}><HashDisplay value={r.commit_sha} /></span> },
    { key: "author", header: "作成者", render: (r) => (r.author.kind === "human" ? <ExternalActor userId={r.author.user_id} name={r.author.name} /> : <ActorLabel kind={r.author.kind} name={r.author.name} size="sm" />), sortValue: (r) => r.author.kind },
    { key: "gates", header: "ゲート A〜D", render: (r) => <GateSummaryStrip gates={r.gates} /> },
    { key: "verdict", header: "総合判定", render: (r) => <StatusBadge vocab={GATE_STATUS[r.verdict]} size="sm" />, sortValue: (r) => r.verdict },
    { key: "enforcement", header: "強制レベル", render: (r) => <EnforcementBadge level={r.enforcement} /> },
    { key: "policy", header: "ポリシー", render: (r) => <PolicyVersionTag pack="Basic" version={r.policy_version.replace("Basic Control Pack ", "")} />, defaultHidden: true },
    { key: "at", header: "実行日時", render: (r) => <Timestamp at={r.started_at} />, sortValue: (r) => r.started_at },
  ];

  const blocked = allRuns.filter((r) => r.verdict === "block").length;
  const exceptions = allRuns.filter((r) => r.verdict === "exception").length;
  const running = allRuns.filter((r) => r.verdict === "running").length;

  return (
    <ProjectLayout org={org} project={project} active="gates" trail={[{ label: "ゲート実行" }]}>
      <PageHeader
        title="ゲート実行"
        description="接続したすべての Git サービスの PR／MR とブランチについて、ゲート A〜D の判定結果を一覧します。判定は決定論的なルールと人間の承認だけで行います。"
        actions={
          <>
            <Button icon="settings" to={paths.gateSettings(org, project)}>適用設定</Button>
            <Button icon="shieldCheck" to={paths.gateRegistration(org, project)}>必須チェックの登録状況</Button>
            <Button icon="download">CSV 出力</Button>
          </>
        }
      />
      <div className="grid cols-4">
        <StatCard label="ブロック中" value={blocked} unit="件" tone={blocked ? "danger" : undefined} icon="xCircle" />
        <StatCard label="例外適用中" value={exceptions} unit="件" icon="flag" />
        <StatCard label="実行中" value={running} unit="件" icon="clock" />
        <StatCard label="直近7日の通過率" value={62} unit="%" icon="checkCircle" delta="前週 58%" />
      </div>
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="PR／MR 番号・タイトル・ブランチ"
        values={values}
        onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))}
        filters={[
          { key: "provider", label: "提供元", options: (["github", "gitlab", "codecommit", "azureRepos"] as ScmProvider[]).map((p) => ({ value: p, label: { github: "GitHub", gitlab: "GitLab", codecommit: "AWS CodeCommit", azureRepos: "Azure Repos" }[p] })) },
          { key: "verdict", label: "判定", options: Object.entries(GATE_STATUS).map(([value, v]) => ({ value, label: v.label })) },
          { key: "gate", label: "ブロックしたゲート", options: ["A", "B", "C", "D"].map((g) => ({ value: g, label: `ゲート${g}` })) },
          { key: "author", label: "作成者の種類", options: [{ value: "human", label: "人間" }, { value: "ai", label: "AIエージェント" }, { value: "system", label: "システム" }] },
          { key: "branch", label: "ブランチ", options: [{ value: "main", label: "main" }, { value: "feature", label: "main 以外" }] },
        ]}
      />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(paths.gate(org, project, r.id))}
          empty={
            state === "empty" ? (
              <EmptyState icon="shield" title="まだゲートは実行されていません" description="対象リポジトリで PR を作成すると、ゲート A〜D が自動で実行され、ここに表示されます。" />
            ) : (
              <EmptyState variant="filtered" title="条件に一致する実行はありません" description="絞り込み条件を変更してください。" />
            )
          }
        />
      )}
    </ProjectLayout>
  );
}
