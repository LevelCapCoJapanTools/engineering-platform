// 画面ID: G-03 PR 一覧
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { gateRuns, requirementById } from "../../mocks/core";
import { pulls } from "../../mocks/gates";
import type { PullRow } from "../../mocks/gates";
import {
  ActorLabel,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  GateSummaryStrip,
  IdLink,
  PageHeader,
  ProjectLayout,
  Skeleton,
  Tag,
  Timestamp,
} from "../../ui";
import type { Column } from "../../ui";

const REVIEW = {
  approved: { label: "承認済み", tone: "pass" as const },
  pending: { label: "レビュー待ち", tone: "warn" as const },
  changes: { label: "修正依頼", tone: "fail" as const },
  none: { label: "未依頼", tone: "neutral" as const },
};

export function PullsScreen({ org, project }: { org: string; project: string }) {
  const state = useScreenState();
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const rows = pulls.filter((p) => (!values.author || p.author.kind === values.author) && (!values.review || p.review === values.review) && (!search || `${p.number} ${p.title}`.includes(search)));
  const data = state === "empty" ? [] : rows;

  const columns: Column<PullRow>[] = [
    {
      key: "pr",
      header: "PR",
      render: (p) => (
        <span className="stack" style={{ ["--gap" as string]: "2px" }}>
          <span className="row" style={{ ["--gap" as string]: "6px" }}>
            <span className="mono small muted">#{p.number}</span>
            <span className="strong" style={{ fontWeight: 500 }}>{p.title}</span>
            {p.draft ? <Tag square>下書き</Tag> : null}
          </span>
        </span>
      ),
      sortValue: (p) => p.number,
    },
    { key: "author", header: "作成者", render: (p) => <ActorLabel kind={p.author.kind} name={p.author.name} size="sm" />, sortValue: (p) => p.author.kind },
    {
      key: "gates",
      header: "ゲート",
      render: (p) => {
        const run = gateRuns.find((g) => g.id === p.run_id);
        return run ? <GateSummaryStrip gates={run.gates} /> : <span className="muted">—</span>;
      },
    },
    { key: "review", header: "レビュー", render: (p) => <Tag tone={REVIEW[p.review].tone}>{REVIEW[p.review].label}</Tag>, sortValue: (p) => p.review },
    {
      key: "req",
      header: "対応する要求",
      render: (p) =>
        p.requirement_ids.length ? (
          <span className="row" style={{ ["--gap" as string]: "6px" }} onClick={(e) => e.stopPropagation()}>
            {p.requirement_ids.map((id) => <IdLink key={id} id={id} to={paths.requirement(org, project, id)} title={requirementById(id).title} />)}
          </span>
        ) : (
          <span className="small muted">なし</span>
        ),
    },
    { key: "updated", header: "更新日時", render: (p) => <Timestamp at={p.updated_at} />, sortValue: (p) => p.updated_at },
  ];

  return (
    <ProjectLayout org={org} project={project} active="pulls" trail={[{ label: "PR" }]}>
      <PageHeader title="PR" description="対象リポジトリの PR と、ゲートの判定・レビュー状況です。AIエージェントの PR は人間のレビュー承認が必須です。" />
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="PR 番号・タイトル"
        values={values}
        onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))}
        filters={[
          { key: "author", label: "作成者", options: [{ value: "human", label: "人間" }, { value: "ai", label: "AIエージェント" }] },
          { key: "review", label: "レビュー", options: Object.entries(REVIEW).map(([value, v]) => ({ value, label: v.label })) },
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
          rowKey={(p) => String(p.number)}
          onRowClick={(p) => p.run_id && navigate(paths.gate(org, project, p.run_id))}
          empty={state === "empty" ? <EmptyState icon="pullRequest" title="オープンな PR はありません" description="対象リポジトリで PR を作成すると、ここに表示されます。" /> : <EmptyState variant="filtered" title="条件に一致する PR はありません" />}
        />
      )}
    </ProjectLayout>
  );
}
