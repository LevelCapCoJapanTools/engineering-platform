// 要求・設計・トレーサビリティ画面で共通に使う表示ヘルパー（画面群ローカル）。
import type { ReactNode } from "react";
import { ORG, PROJECT, paths } from "../../lib/paths";
import type { Design, Requirement } from "../../lib/types";
import { designs, requirements, testCases } from "../../mocks/core";
import { prTitles } from "../../mocks/requirements";
import { Icon, Tag } from "../../ui";
import type { TraceEdge, TraceLink, TraceNode } from "../../ui";
import "./requirements.css";

export const org = ORG;
export const project = PROJECT;

export const KIND_LABEL: Record<Requirement["kind"], string> = { functional: "機能", nonFunctional: "非機能" };
export const PRIORITY: Record<Requirement["priority"], { label: string; tone: "fail" | "warn" | "neutral" }> = {
  high: { label: "高", tone: "fail" },
  medium: { label: "中", tone: "warn" },
  low: { label: "低", tone: "neutral" },
};
export const DESIGN_KIND: Record<Design["kind"], string> = { architecture: "アーキテクチャ", detailed: "詳細設計", adr: "ADR" };
export const ARTIFACT_FLOW_LABEL: Record<string, string> = {
  draft: "下書き",
  inReview: "レビュー中",
  pending: "承認待ち",
  approved: "承認済み",
  changing: "変更中",
  obsolete: "廃止",
};

export function PriorityTag({ value }: { value: Requirement["priority"] }) {
  const p = PRIORITY[value];
  return <Tag tone={p.tone} square>優先度 {p.label}</Tag>;
}

/** 有無の表示（色だけに頼らずアイコンと文言で示す） */
export function Presence({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span className={`presence ${ok ? "ok" : "ng"}`}>
      <Icon name={ok ? "checkCircle" : "xCircle"} size={14} />
      {label ?? (ok ? "あり" : "なし")}
    </span>
  );
}

export function reqPath(id: string) {
  return paths.requirement(org, project, id);
}
export function designPath(id: string) {
  return paths.design(org, project, id);
}

/** リンク候補（TraceLinkEditor 用） */
export const linkCandidates = [
  ...designs.map((d) => ({ id: d.id, title: d.title, kind: DESIGN_KIND[d.kind] })),
  ...testCases.map((t) => ({ id: t.id, title: t.title, kind: "テスト" })),
  ...Object.entries(prTitles).map(([n, t]) => ({ id: `PR #${n}`, title: t, kind: "PR" })),
];

export const requirementCandidates = requirements.map((r) => ({ id: r.id, title: r.title, kind: "要求" }));

/** 要求の確定リンクと AI 候補 */
export function linksOf(r: Requirement): TraceLink[] {
  const ls: TraceLink[] = [
    ...r.design_ids.map((id) => ({ id, title: designs.find((d) => d.id === id)?.title ?? "", kind: "設計", relation: "refines" })),
    ...r.pr_numbers.map((n) => ({ id: `PR #${n}`, title: prTitles[n] ?? "", kind: "PR", relation: "implements" })),
    ...r.test_ids.map((id) => ({ id, title: testCases.find((t) => t.id === id)?.title ?? "", kind: "テスト", relation: "verifies" })),
  ];
  if (r.id === "REQ-0006") ls.push({ id: "PR #142", title: prTitles[142], kind: "PR", relation: "implements", ai: true, confidence: 0.73 });
  if (r.id === "REQ-0007") ls.push({ id: "PR #143", title: "取引先 CSV 取込（下書き）", kind: "PR", relation: "implements", ai: true, confidence: 0.81 });
  if (r.id === "REQ-0003") ls.push({ id: "TC-0140", title: "性能: 同時接続50件", kind: "テスト", relation: "verifies", ai: true, confidence: 0.41 });
  return ls;
}

/** トレーサビリティグラフのノードとエッジ */
export function buildTraceGraph(opts: { onlyMissing?: boolean; status?: string; kind?: string } = {}) {
  const reqs = requirements.filter((r) => r.status !== "obsolete" && (!opts.status || r.status === opts.status) && (!opts.kind || r.kind === opts.kind));
  const nodes: TraceNode[] = [];
  const edges: TraceEdge[] = [];
  const seen = new Set<string>();
  const add = (n: TraceNode) => {
    if (!seen.has(n.id)) {
      seen.add(n.id);
      nodes.push(n);
    }
  };
  for (const r of reqs) {
    const missingDesign = r.design_ids.length === 0;
    const missingTest = r.test_ids.length === 0;
    if (opts.onlyMissing && !missingDesign && !missingTest) continue;
    add({ id: r.id, col: 0, title: r.title });
    if (missingDesign && r.status === "approved") {
      const mid = `missing-d-${r.id}`;
      add({ id: mid, col: 1, title: `${r.id} の設計`, missing: true });
      edges.push({ from: r.id, to: mid });
    }
    for (const d of r.design_ids) {
      add({ id: d, col: 1, title: designs.find((x) => x.id === d)?.title ?? d });
      edges.push({ from: r.id, to: d });
      for (const n of r.pr_numbers) edges.push({ from: d, to: `PR #${n}` });
    }
    for (const n of r.pr_numbers) add({ id: `PR #${n}`, col: 2, title: prTitles[n] ?? "" });
    if (missingTest && r.status === "approved") {
      const mid = `missing-t-${r.id}`;
      add({ id: mid, col: 3, title: `${r.id} のテスト`, missing: true });
      edges.push({ from: r.pr_numbers.length ? `PR #${r.pr_numbers[0]}` : r.id, to: mid });
    }
    for (const t of r.test_ids) {
      add({ id: t, col: 3, title: testCases.find((x) => x.id === t)?.title ?? t });
      edges.push({ from: r.pr_numbers.length ? `PR #${r.pr_numbers[0]}` : r.id, to: t });
    }
    for (const l of linksOf(r).filter((x) => x.ai)) {
      const col = l.kind === "PR" ? 2 : l.kind === "テスト" ? 3 : 1;
      add({ id: l.id, col: col as 1 | 2 | 3, title: l.title });
      edges.push({ from: r.id, to: l.id, ai: true });
    }
  }
  return { nodes, edges };
}

/** 承認済み要求のうちテストまでつながっている数 */
export function traceCoverage() {
  const approved = requirements.filter((r) => r.status === "approved");
  const linked = approved.filter((r) => r.design_ids.length > 0 && r.test_ids.length > 0);
  return { linked: linked.length, total: approved.length };
}

export function SectionCard({ title, sub, actions, children }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card flush">
      <div className="card-header">
        <div>
          <h2 className="section-title">{title}</h2>
          {sub ? <p className="section-sub">{sub}</p> : null}
        </div>
        {actions ? <div className="row">{actions}</div> : null}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}
