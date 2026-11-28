// 画面ID: T-02 トレーサビリティ表
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { Requirement } from "../../lib/types";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { designs, requirements, testCases } from "../../mocks/core";
import { prTitles, reqSource } from "../../mocks/requirements";
import { Button, CoverageMeter, Drawer, EmptyState, ErrorState, FilterBar, IdLink, PageHeader, ProjectLayout, Segmented, Skeleton, SourceTag, StatusBadge, Tag, TraceMatrix, useToast } from "../../ui";
import type { MatrixCell } from "../../ui";
import { CHAIN_STAGES, ChainTable, chainOf, designPath, org, project, reqPath, ViewOnlyNote } from "./common";

const COLUMNS = [...CHAIN_STAGES];

function cellsOf(r: Requirement): MatrixCell[] {
  const links = chainOf(r);
  return COLUMNS.map((st) => ({ count: links.filter((l) => l.stage === st && !l.ai).length, ai: links.filter((l) => l.stage === st && l.ai).length }));
}

/** 成果物から要求への逆方向（孤立した成果物を見つける） */
function reverseRows() {
  const reqOf = (pred: (r: Requirement) => boolean) => requirements.filter((r) => r.status !== "obsolete" && pred(r)).map((r) => r.id);
  return [
    ...designs.map((d) => ({ id: d.id, title: d.title, kind: "設計", reqs: d.requirement_ids, to: designPath(d.id) })),
    ...Object.entries(prTitles).map(([n, t]) => ({ id: `PR #${n}`, title: t, kind: "コード／PR", reqs: reqOf((r) => r.pr_numbers.includes(Number(n))), to: undefined })),
    ...testCases.map((t) => ({ id: t.id, title: t.title, kind: "テストケース", reqs: t.requirement_ids, to: undefined })),
  ];
}

export function TraceMatrixScreen() {
  const state = useScreenState();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({ status: "approved" });
  const [open, setOpen] = useState<{ id: string; col: number } | null>(state === "drawer" ? { id: "REQ-0002", col: 5 } : null);
  const [direction, setDirection] = useState(state === "reverse" ? "reverse" : "forward");
  const reqs = state === "empty" ? [] : requirements.filter((r) => r.status !== "obsolete" && (!values.status || r.status === values.status) && (!values.kind || r.kind === values.kind));
  const matrix = reqs.map((r) => ({ id: r.id, title: r.title, cells: cellsOf(r) }));
  const opened = open ? requirements.find((r) => r.id === open.id) : undefined;
  return (
    <ProjectLayout active="trace" trail={[{ label: "トレーサビリティ", to: paths.trace(org, project) }, { label: "表" }]}>
      <PageHeader
        title="トレーサビリティ表"
        description="要求ごとに、設計からリリース成果物までの段別のリンク数を表示します。逆方向では、成果物がどの要求につながっているかと、要求につながらない成果物を確認できます。"
        meta={<SourceTag source={reqSource("trace/edges.yaml・CI レポート")} />}
        actions={
          <>
            <Button icon="trace" to={paths.trace(org, project)}>グラフで見る</Button>
            <Button icon="download" onClick={() => toast({ kind: "success", message: "トレーサビリティ表を CSV で出力しました" })}>CSV 出力</Button>
          </>
        }
      />
      <div className="row between">
        <Segmented value={direction} onChange={setDirection} options={[{ value: "forward", label: "要求 → 成果物" }, { value: "reverse", label: "成果物 → 要求（逆方向）" }]} />
        <ViewOnlyNote>リンクの追加・修正は担当者が正本で行います。</ViewOnlyNote>
      </div>
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
      ) : direction === "reverse" ? (
        <div className="card flush">
          <div className="table-wrap">
            <table className="table compact">
              <thead><tr><th>成果物</th><th>種類</th><th>つながる要求</th></tr></thead>
              <tbody>
                {reverseRows().map((a) => (
                  <tr key={a.id}>
                    <td><div className="stack" style={{ ["--gap" as string]: "2px" }}>{a.to ? <IdLink id={a.id} to={a.to} /> : <span className="id-link">{a.id}</span>}<span className="tiny muted">{a.title}</span></div></td>
                    <td><Tag square>{a.kind}</Tag></td>
                    <td>{a.reqs.length ? <span className="row" style={{ ["--gap" as string]: "6px" }}>{a.reqs.map((r) => <IdLink key={r} id={r} to={reqPath(r)} />)}</span> : <Tag tone="fail" icon="alertCircle">要求につながっていない</Tag>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
        {opened && open ? <ChainTable links={chainOf(opened).filter((l) => l.stage === COLUMNS[open.col])} empty={`${COLUMNS[open.col]}へのリンクはありません`} /> : null}
      </Drawer>
    </ProjectLayout>
  );
}
