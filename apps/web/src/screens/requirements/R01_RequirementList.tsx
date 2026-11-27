// 画面ID: R-01 要求一覧
import { useMemo, useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { Requirement } from "../../lib/types";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { requirements, userById } from "../../mocks/core";
import {
  Button,
  CoverageMeter,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  IdLink,
  PageHeader,
  ProjectLayout,
  Skeleton,
  StatusBadge,
  Tag,
  Timestamp,
  useToast,
  UserChip,
} from "../../ui";
import type { Column } from "../../ui";
import { KIND_LABEL, org, Presence, PriorityTag, project, reqPath, traceCoverage } from "./common";

const FILTERS = [
  { key: "status", label: "状態", options: Object.entries(ARTIFACT_STATUS).map(([value, v]) => ({ value, label: v.label })) },
  { key: "kind", label: "種類", options: [{ value: "functional", label: "機能" }, { value: "nonFunctional", label: "非機能" }] },
  { key: "owner", label: "担当者", options: [{ value: "u-takahashi", label: "高橋 健" }, { value: "u-sato", label: "佐藤 美咲" }] },
  { key: "missing", label: "リンクの欠落", options: [{ value: "yes", label: "欠落あり" }] },
  { key: "ai", label: "AI所見", options: [{ value: "yes", label: "未確認の所見あり" }] },
];

export function requirementColumns(): Column<Requirement>[] {
  return [
    { key: "id", header: "REQ-ID", render: (r) => <IdLink id={r.id} to={reqPath(r.id)} />, sortValue: (r) => r.id, hideable: false, width: 96 },
    { key: "title", header: "タイトル", render: (r) => <span className="strong" style={{ fontWeight: 500 }}>{r.title}</span>, sortValue: (r) => r.title, hideable: false },
    { key: "kind", header: "種類", render: (r) => <Tag square>{KIND_LABEL[r.kind]}</Tag>, sortValue: (r) => r.kind },
    { key: "priority", header: "優先度", render: (r) => <PriorityTag value={r.priority} />, sortValue: (r) => ({ high: 0, medium: 1, low: 2 })[r.priority] },
    { key: "status", header: "状態", render: (r) => <StatusBadge vocab={ARTIFACT_STATUS[r.status]} size="sm" />, sortValue: (r) => r.status },
    { key: "owner", header: "担当者", render: (r) => <UserChip user={userById(r.owner_id)} showRole={false} plain /> },
    { key: "ac", header: "受入基準", render: (r) => <Presence ok={r.acceptance_criteria.length > 0} label={r.acceptance_criteria.length ? `${r.acceptance_criteria.length}件` : "なし"} />, sortValue: (r) => r.acceptance_criteria.length },
    { key: "design", header: "設計", render: (r) => <Presence ok={r.design_ids.length > 0} /> },
    { key: "test", header: "テスト", render: (r) => <Presence ok={r.test_ids.length > 0} /> },
    { key: "ai", header: "AI所見", render: (r) => (r.ai_open_findings ? <span className="ai-count" title="未確認のAI所見（参考）">AI {r.ai_open_findings}</span> : <span className="muted small">—</span>), sortValue: (r) => r.ai_open_findings },
    { key: "updated", header: "更新日時", render: (r) => <span className="small muted"><Timestamp at={r.updated_at} /></span>, sortValue: (r) => r.updated_at },
  ];
}

export function RequirementListBody({ state, selected, onSelect }: { state: string; selected?: string[]; onSelect?: (keys: string[]) => void }) {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>(state === "filtered" ? { status: "obsolete", ai: "yes" } : {});
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<string[]>(selected ?? []);
  const cov = traceCoverage();
  const rows = useMemo(() => {
    if (state === "empty") return [];
    return requirements.filter((r) => {
      if (values.status && r.status !== values.status) return false;
      if (values.kind && r.kind !== values.kind) return false;
      if (values.owner && r.owner_id !== values.owner) return false;
      if (values.missing && r.design_ids.length > 0 && r.test_ids.length > 0) return false;
      if (values.ai && r.ai_open_findings === 0) return false;
      if (search && !`${r.id} ${r.title} ${r.body}`.includes(search)) return false;
      return true;
    });
  }, [values, search, state]);
  const choose = (keys: string[]) => {
    setSel(keys);
    onSelect?.(keys);
  };
  return (
    <>
      <PageHeader
        title="要求"
        description="REQ-ID ごとの状態、受入基準、設計・テストへのつながりを管理します。"
        actions={
          <>
            <Button icon="download" onClick={() => toast({ kind: "success", message: "要求一覧の CSV を出力しました（12件）" })}>CSV 出力</Button>
            <Button variant="primary" icon="plus" to={reqPath("new")}>要求を作成</Button>
          </>
        }
      />
      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 360px)", alignItems: "center" }}>
        <FilterBar filters={FILTERS} values={values} onChange={(k, v) => setValues((x) => ({ ...x, [k]: v }))} search={search} onSearch={setSearch} searchPlaceholder="ID・タイトル・本文で絞り込み" />
        <div className="card tight">
          <CoverageMeter value={cov.linked} total={cov.total} label="承認済み要求のテストまでのトレース" />
        </div>
      </div>
      {sel.length ? (
        <div className="selection-bar">
          <span>{sel.length}件を選択中</span>
          <Button size="sm" variant="primary" icon="arrowRight" onClick={() => navigate(`${paths.requirementApproval(org, project)}?ids=${sel.join(",")}`)}>承認を依頼</Button>
          <Button size="sm" variant="ghost" onClick={() => choose([])}>選択を解除</Button>
        </div>
      ) : null}
      {state === "loading" ? (
        <Skeleton variant="table" rows={8} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <DataTable
          columns={requirementColumns()}
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(reqPath(r.id))}
          selectable
          selected={sel}
          onSelect={choose}
          empty={
            state === "empty" ? (
              <EmptyState icon="list" title="まだ要求がありません" description="要求を作成するか、SOW から AI が抽出した要求候補を登録してください。" action={<div className="row"><Button variant="primary" icon="plus" to={reqPath("new")}>要求を作成</Button><Button icon="fileText" to={paths.sow(org, project)}>SOW から登録</Button></div>} />
            ) : (
              <EmptyState variant="filtered" title="条件に一致する要求はありません" description="絞り込み条件を変更するか、条件をクリアしてください。" action={<Button onClick={() => { setValues({}); setSearch(""); }}>条件をクリア</Button>} />
            )
          }
        />
      )}
    </>
  );
}

export function RequirementList() {
  const state = useScreenState();
  return (
    <ProjectLayout active="requirements" trail={[{ label: "要求" }]}>
      <RequirementListBody state={state} />
    </ProjectLayout>
  );
}
