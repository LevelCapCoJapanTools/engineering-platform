// 画面ID: D-01 設計・ADR 一覧
import { useMemo, useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import type { Design } from "../../lib/types";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { paths } from "../../lib/paths";
import { designs } from "../../mocks/core";
import { designMeta, reqSource } from "../../mocks/requirements";
import { Button, DataTable, EmptyState, ErrorState, ExternalActor, FilterBar, IdLink, PageHeader, ProjectLayout, Skeleton, SourceTag, StatusBadge, Tag, Timestamp } from "../../ui";
import type { Column } from "../../ui";
import { DESIGN_KIND, designFile, designPath, OpenInSource, org, ViewOnlyNote } from "./common";

const FILTERS = [
  { key: "kind", label: "種類", options: Object.entries(DESIGN_KIND).map(([value, label]) => ({ value, label })) },
  { key: "status", label: "状態", options: Object.entries(ARTIFACT_STATUS).map(([value, v]) => ({ value, label: v.label })) },
];

const columns: Column<Design>[] = [
  { key: "id", header: "ID", render: (d) => <IdLink id={d.id} to={designPath(d.id)} />, sortValue: (d) => d.id, hideable: false, width: 100 },
  { key: "title", header: "タイトル", render: (d) => <span className="strong" style={{ fontWeight: 500 }}>{d.title}</span>, sortValue: (d) => d.title, hideable: false },
  { key: "kind", header: "種類", render: (d) => <Tag square>{DESIGN_KIND[d.kind]}</Tag>, sortValue: (d) => d.kind },
  { key: "status", header: "状態", render: (d) => <StatusBadge vocab={ARTIFACT_STATUS[d.status]} size="sm" />, sortValue: (d) => d.status },
  { key: "reqs", header: "対応する要求", render: (d) => <span className="row nowrap" style={{ ["--gap" as string]: "6px" }}><strong>{d.requirement_ids.length}</strong><span className="tiny muted">{d.requirement_ids.slice(0, 2).join(", ")}{d.requirement_ids.length > 2 ? "…" : ""}</span></span>, sortValue: (d) => d.requirement_ids.length, align: "right" },
  { key: "author", header: "作成者", render: (d) => <ExternalActor userId={d.author_id} /> },
  { key: "reviewers", header: "レビュー者", render: (d) => <span className="stack" style={{ ["--gap" as string]: "2px" }}>{d.reviewer_ids.map((id) => <ExternalActor key={id} userId={id} />)}</span> },
  { key: "alts", header: "代替案", render: (d) => { const n = designMeta[d.id]?.alternatives?.length; return n ? <span className="small">{n}案を比較</span> : <span className="muted small">—</span>; } },
  { key: "file", header: "正本", render: (d) => <span className="mono tiny muted">{designFile(d.id)}</span>, defaultHidden: true },
  { key: "updated", header: "更新日時", render: (d) => <span className="small muted"><Timestamp at={d.updated_at} /></span>, sortValue: (d) => d.updated_at },
];

export function DesignList() {
  const state = useScreenState();
  const [values, setValues] = useState<Record<string, string>>(state === "filtered" ? { kind: "architecture", status: "obsolete" } : {});
  const [search, setSearch] = useState("");
  const rows = useMemo(() => (state === "empty" ? [] : designs.filter((d) => (!values.kind || d.kind === values.kind) && (!values.status || d.status === values.status) && (!search || `${d.id} ${d.title}`.includes(search)))), [values, search, state]);
  return (
    <ProjectLayout active="design" trail={[{ label: "設計・ADR" }]}>
      <PageHeader
        title="設計・ADR"
        description="アーキテクチャ、詳細設計、設計判断の記録（ADR）と、対応する要求・代替案・レビューの状況を確認します。正本は Git リポジトリの docs/design です。"
        meta={<SourceTag source={reqSource(`docs/design（${designs.length}件）`)} />}
        actions={<OpenInSource />}
      />
      <ViewOnlyNote />
      <FilterBar filters={FILTERS} values={values} onChange={(k, v) => setValues((x) => ({ ...x, [k]: v }))} search={search} onSearch={setSearch} searchPlaceholder="ID・タイトルで絞り込み" />
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(d) => d.id}
          onRowClick={(d) => navigate(designPath(d.id))}
          empty={
            state === "empty" ? (
              <EmptyState icon="book" title="同期された設計がありません" description="設計者が正本（docs/design）に設計や ADR を追加すると、ここに表示されます。" action={<Button icon="plug" to={paths.connectors(org)}>連携を確認</Button>} />
            ) : (
              <EmptyState variant="filtered" title="条件に一致する設計はありません" action={<Button onClick={() => { setValues({}); setSearch(""); }}>条件をクリア</Button>} />
            )
          }
        />
      )}
    </ProjectLayout>
  );
}
