// 画面ID: T-02 トレーサビリティ表
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { Requirement } from "../../lib/types";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { requirements, testCases } from "../../mocks/core";
import { verificationRecords } from "../../mocks/requirements";
import { Button, CoverageMeter, Drawer, EmptyState, ErrorState, FilterBar, PageHeader, ProjectLayout, Skeleton, StatusBadge, TraceLinkEditor, TraceMatrix, useToast } from "../../ui";
import type { MatrixCell, TraceLink } from "../../ui";
import { linkCandidates, linksOf, org, project, reqPath } from "./common";

const COLUMNS = ["設計", "コード／PR", "テストケース", "テスト結果（成功）", "検証"];

function cellsOf(r: Requirement): MatrixCell[] {
  const ai = linksOf(r).filter((l) => l.ai);
  const passed = r.test_ids.filter((t) => testCases.find((x) => x.id === t)?.last_result === "passed").length;
  const ver = verificationRecords.filter((v) => v.target.includes(r.id)).length + (r.status === "approved" && r.test_ids.length ? 1 : 0);
  return [
    { count: r.design_ids.length, ai: ai.filter((l) => l.kind === "設計").length },
    { count: r.pr_numbers.length, ai: ai.filter((l) => l.kind === "PR").length },
    { count: r.test_ids.length, ai: ai.filter((l) => l.kind === "テスト").length },
    { count: passed },
    { count: ver },
  ];
}

function linksForCell(r: Requirement, col: number): TraceLink[] {
  const all = linksOf(r);
  if (col === 0) return all.filter((l) => l.kind === "設計");
  if (col === 1) return all.filter((l) => l.kind === "PR");
  if (col === 2 || col === 3) return all.filter((l) => l.kind === "テスト" && (col === 2 || testCases.find((t) => t.id === l.id)?.last_result === "passed"));
  return verificationRecords.filter((v) => v.target.includes(r.id)).map((v) => ({ id: v.id, title: v.target, kind: "検証", relation: "verifies" }));
}

export function TraceMatrixScreen() {
  const state = useScreenState();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({ status: "approved" });
  const [open, setOpen] = useState<{ id: string; col: number } | null>(state === "drawer" ? { id: "REQ-0001", col: 2 } : null);
  const reqs = state === "empty" ? [] : requirements.filter((r) => r.status !== "obsolete" && (!values.status || r.status === values.status) && (!values.kind || r.kind === values.kind));
  const matrix = reqs.map((r) => ({ id: r.id, title: r.title, cells: cellsOf(r) }));
  const opened = open ? requirements.find((r) => r.id === open.id) : undefined;
  return (
    <ProjectLayout active="trace" trail={[{ label: "トレーサビリティ", to: paths.trace(org, project) }, { label: "表" }]}>
      <PageHeader
        title="トレーサビリティ表"
        description="要求ごとに、成果物の種類別のリンク数を表示します。セルを押すとリンクの一覧を確認・編集できます。"
        actions={
          <>
            <Button icon="trace" to={paths.trace(org, project)}>グラフで見る</Button>
            <Button icon="download" onClick={() => toast({ kind: "success", message: "トレーサビリティ表を CSV で出力しました" })}>CSV 出力</Button>
          </>
        }
      />
      <FilterBar
        filters={[
          { key: "status", label: "要求の状態", options: Object.entries(ARTIFACT_STATUS).map(([value, v]) => ({ value, label: v.label })) },
          { key: "kind", label: "種類", options: [{ value: "functional", label: "機能" }, { value: "nonFunctional", label: "非機能" }] },
        ]}
        values={values}
        onChange={(k, v) => setValues((x) => ({ ...x, [k]: v }))}
      />
      {state === "loading" ? (
        <Skeleton rows={8} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          <div className="grid auto-fit">
            {COLUMNS.map((c, i) => (
              <div key={c} className="card tight">
                <CoverageMeter label={c} value={matrix.filter((m) => m.cells[i].count > 0).length} total={matrix.length} />
              </div>
            ))}
          </div>
          <div className="card flush">
            {matrix.length ? (
              <TraceMatrix rows={matrix} columns={COLUMNS} onCell={(id, col) => setOpen({ id, col })} />
            ) : (
              <EmptyState icon="trace" title={state === "empty" ? "表示する要求がありません" : "条件に一致する要求はありません"} description="要求を作成し、設計やテストとリンクすると表に表示されます。" action={<Button to={paths.requirements(org, project)}>要求一覧へ</Button>} />
            )}
          </div>
          <div className="row small muted" style={{ ["--gap" as string]: "16px" }}>
            <span><span className="matrix-cell yes" style={{ minWidth: 28, height: 20 }}>2</span> リンクあり</span>
            <span><span className="matrix-cell ai" style={{ minWidth: 28, height: 20 }}>AI 1</span> AI候補のみ（未確定）</span>
            <span><span className="matrix-cell no" style={{ minWidth: 28, height: 20 }}>—</span> なし</span>
          </div>
        </>
      )}
      <Drawer
        open={Boolean(open && opened)}
        onClose={() => setOpen(null)}
        title={opened ? `${opened.id} · ${COLUMNS[open!.col]}` : ""}
        subtitle={opened ? <span className="row"><StatusBadge vocab={ARTIFACT_STATUS[opened.status]} size="sm" />{opened.title}</span> : undefined}
        footer={opened ? <Button to={reqPath(opened.id)} iconRight="arrowRight">要求の詳細を開く</Button> : undefined}
      >
        {opened && open ? <TraceLinkEditor links={linksForCell(opened, open.col)} candidates={linkCandidates} readOnly={open.col >= 3} /> : null}
      </Drawer>
    </ProjectLayout>
  );
}
