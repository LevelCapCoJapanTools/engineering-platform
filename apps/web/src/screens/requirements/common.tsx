// 要求・設計・トレーサビリティ画面で共通に使う表示ヘルパー（画面群ローカル）。
import type { ReactNode } from "react";
import { ORG, PROJECT, paths } from "../../lib/paths";
import type { Design, Requirement } from "../../lib/types";
import { designs, fakeSha, releases, requirements, testCases } from "../../mocks/core";
import { linkProvenance, prTitles, reqSource, requirementHistory, requirementMeta, requirementReleases, testRuns, verificationRecords } from "../../mocks/requirements";
import type { LinkProvenance, ReqApproval, ReqTransition } from "../../mocks/requirements";
import { Button, ExternalActor, HashDisplay, Icon, IdLink, ProviderBadge, Tag, Timestamp } from "../../ui";
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


// ---- 2026-11-28 追加: 正本・承認記録・トレースの出典 ----

/** 要求の正本ファイル */
export const reqFile = (id: string) => `docs/requirements/${id}.yaml`;
export const designFile = (id: string) => `docs/design/${id}.md`;

/** 要求の承認記録・状態遷移。上書きがなければ状態から既定値を作る */
export function reqMeta(r: Requirement): { approved_version?: number; approved_at?: string; transitions: ReqTransition[]; approvals: ReqApproval[]; issue?: string; approved_hash?: string } {
  const o = requirementMeta[r.id] ?? {};
  const created = "2026-09-01T10:00:00+09:00";
  const isApproved = r.status === "approved";
  const transitions: ReqTransition[] = o.transitions ?? [
    { at: created, from: null, to: "draft", by: r.owner_id, via: "GitHub（docs/requirements）", version: 1 },
    ...(r.status !== "draft" ? [{ at: "2026-09-08T10:00:00+09:00", from: "draft" as const, to: "inReview" as const, by: r.owner_id, via: "GitHub PR レビュー依頼", version: 1 }] : []),
    ...(r.status === "pending" || isApproved ? [{ at: "2026-09-15T10:00:00+09:00", from: "inReview" as const, to: "pending" as const, by: r.owner_id, via: "期限付き承認リンクで依頼", version: r.version }] : []),
    ...(isApproved ? [{ at: "2026-09-22T15:00:00+09:00", from: "pending" as const, to: "approved" as const, by: "u-nakamura", via: "期限付き承認リンク", version: r.version }] : []),
  ];
  const approvals: ReqApproval[] = o.approvals ?? (isApproved
    ? [
        { version: r.version, role: "PM", user_id: "u-sato", status: "approved", at: "2026-09-20T11:00:00+09:00", via: "GitHub PR レビュー" },
        { version: r.version, role: "顧客", user_id: "u-nakamura", status: "approved", at: "2026-09-22T15:00:00+09:00", via: "期限付き承認リンク" },
      ]
    : r.status === "pending"
      ? [
          { version: r.version, role: "PM", user_id: "u-sato", status: "pending", via: "GitHub PR レビュー" },
          { version: r.version, role: "顧客", user_id: "u-nakamura", status: "pending", via: "期限付き承認リンク" },
        ]
      : []);
  const approved_version = o.approved_version ?? (isApproved ? r.version : undefined);
  const approved_at = o.approved_at ?? (isApproved ? "2026-09-22T15:00:00+09:00" : undefined);
  return { ...o, transitions, approvals, approved_version, approved_at, approved_hash: approved_version ? fakeSha(`${r.id}-v${approved_version}`) : undefined };
}

export function reqSourceOf(r: Requirement) {
  return reqSource(reqFile(r.id));
}

/** 版の一覧（古い順） */
export function versionsOf(r: Requirement) {
  return requirementHistory[r.id] ?? [{ version: r.version, at: r.updated_at, by: r.owner_id, note: "作成", body: r.body, criteria: r.acceptance_criteria }];
}

/** 正本で開く（外部リンク。モックでは遷移しない） */
export function OpenInSource({ label = "正本で開く", size }: { label?: string; size?: "sm" }) {
  return <Button icon="external" size={size} onClick={() => undefined}>{label}</Button>;
}

/** 経営層の操作範囲の注記 */
export function ViewOnlyNote({ children }: { children?: ReactNode }) {
  return (
    <p className="tiny muted row" style={{ ["--gap" as string]: "6px" }}>
      <Icon name="eye" size={13} />
      {children ?? "この画面は閲覧と根拠の確認用です。作成・レビュー・承認は担当者と承認者が正本のシステムで行い、ここには同期した記録を表示します。"}
    </p>
  );
}

/** トレースの段（SI-04） */
export const CHAIN_STAGES = ["設計", "コード／PR", "テストケース", "実行結果", "検証", "妥当性確認", "リリース成果物"] as const;
export type ChainLink = { id: string; title: string; stage: (typeof CHAIN_STAGES)[number]; prov?: LinkProvenance; ai?: boolean; confidence?: number; result?: string; to?: string };

/** 要求から下流までのリンク（出典・確定者つき） */
export function chainOf(r: Requirement): ChainLink[] {
  const base = linksOf(r);
  const out: ChainLink[] = [];
  for (const l of base) {
    const stage = l.kind === "設計" ? "設計" : l.kind === "PR" ? "コード／PR" : "テストケース";
    const prov = l.ai ? undefined : l.kind === "設計" ? linkProvenance.design : l.kind === "PR" ? linkProvenance.pr : linkProvenance.test;
    out.push({ id: l.id, title: l.title, stage, prov, ai: l.ai, confidence: l.confidence, to: l.kind === "設計" ? paths.design(org, project, l.id) : undefined });
  }
  for (const t of r.test_ids) {
    const tc = testCases.find((x) => x.id === t);
    if (!tc || tc.last_result === "notRun") continue;
    out.push({ id: `${testRuns[0].id} · ${t}`, title: tc.title, stage: "実行結果", prov: linkProvenance.run, result: tc.last_result });
  }
  for (const v of verificationRecords.filter((x) => x.target.includes(r.id) || (r.design_ids.some((d) => x.target.includes(d))))) {
    out.push({ id: v.id, title: v.target, stage: v.kind === "verification" ? "検証" : "妥当性確認", prov: { ...linkProvenance.vv, confirmed_by: v.reviewer_id, confirmed_at: v.reviewer_id ? v.at : undefined }, result: v.result });
  }
  if (r.id === "REQ-0002") out.push({ id: "VL-0006", title: "v1.3.0 顧客受入テスト", stage: "妥当性確認", prov: { ...linkProvenance.vv, confirmed_by: "u-sato", confirmed_at: "2026-11-05T16:30:00+09:00" }, result: "passed" });
  for (const rel of requirementReleases[r.id] ?? []) {
    out.push({ id: rel.version, title: rel.artifact, stage: "リリース成果物", prov: linkProvenance.release, to: paths.release(org, project, rel.release_id) });
  }
  return out;
}

export function releaseTitle(id: string) {
  return releases.find((x) => x.id === id)?.title ?? "";
}

/** リンクの一覧（出典・確定者・AI候補を区別） */
export function ChainTable({ links, empty = "リンクはありません" }: { links: ChainLink[]; empty?: string }) {
  if (links.length === 0) return <p className="small muted">{empty}</p>;
  return (
    <div className="table-wrap">
      <table className="table compact">
        <thead><tr><th>リンク先</th><th>段</th><th>記録された場所</th><th>確定者</th></tr></thead>
        <tbody>
          {links.map((l) => (
            <tr key={`${l.stage}-${l.id}`} className={l.ai ? "req-ai-row" : undefined}>
              <td>
                <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                  {l.to ? <IdLink id={l.id} to={l.to} /> : <span className="id-link">{l.id}</span>}
                  <span className="tiny muted">{l.title}</span>
                </div>
              </td>
              <td><Tag square>{l.stage}</Tag>{l.result ? <span className={`result-dot ${l.result}`} style={{ marginLeft: 6 }}>{{ passed: "成功", failed: "失敗", skipped: "スキップ", conditional: "条件付き" }[l.result] ?? l.result}</span> : null}</td>
              <td>{l.prov ? <span className="stack" style={{ ["--gap" as string]: "2px" }}><ProviderBadge provider={l.prov.provider} size="sm" /><span className="tiny muted">{l.prov.via}</span></span> : <span className="tiny muted">—</span>}</td>
              <td>
                {l.ai ? (
                  <span className="ai-count" title="AI の候補。人が確定するまで集計に含めません">AI候補・未確定{l.confidence ? `（確信度 ${Math.round(l.confidence * 100)}%）` : ""}</span>
                ) : l.prov?.confirmed_by ? (
                  <span className="stack" style={{ ["--gap" as string]: "2px" }}><ExternalActor userId={l.prov.confirmed_by} />{l.prov.confirmed_at ? <span className="tiny muted"><Timestamp at={l.prov.confirmed_at} mode="date" /></span> : null}</span>
                ) : (
                  <span className="tiny muted">自動取込（CI）</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 承認記録の表（版ごと。職務分離で無効になった承認も残す） */
export function ApprovalRecords({ approvals }: { approvals: ReqApproval[] }) {
  if (approvals.length === 0) return <p className="small muted">承認の記録はまだありません。</p>;
  const label = { approved: "承認", pending: "未判断", returned: "差戻し", invalid: "無効" } as const;
  const tone = { approved: "pass", pending: "warn", returned: "fail", invalid: "fail" } as const;
  return (
    <div className="table-wrap">
      <table className="table compact">
        <thead><tr><th>版</th><th>役割</th><th>承認者</th><th>結果</th><th>記録された場所</th><th>日時</th></tr></thead>
        <tbody>
          {approvals.map((a, i) => (
            <tr key={i}>
              <td className="mono small">v{a.version}</td>
              <td className="small">{a.role}</td>
              <td><ExternalActor userId={a.user_id} /></td>
              <td>
                <Tag tone={tone[a.status]} square>{label[a.status]}</Tag>
                {a.invalid_reason ? <div className="tiny text-fail" style={{ marginTop: 4 }}>{a.invalid_reason}</div> : null}
                {a.comment ? <div className="tiny muted" style={{ marginTop: 4 }}>「{a.comment}」</div> : null}
              </td>
              <td className="tiny muted">{a.via}</td>
              <td className="tiny muted">{a.at ? <Timestamp at={a.at} mode="absolute" /> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApprovedPin({ version, at, hash }: { version?: number; at?: string; hash?: string }) {
  if (!version) return <span className="small muted">承認済みの版はありません</span>;
  return (
    <div className="stack" style={{ ["--gap" as string]: "4px" }}>
      <span className="row" style={{ ["--gap" as string]: "6px" }}><Icon name="lock" size={13} /><strong>v{version}</strong><span className="tiny muted">{at ? <Timestamp at={at} mode="date" /> : ""}</span></span>
      {hash ? <HashDisplay value={hash} label="承認版のハッシュ" /> : null}
    </div>
  );
}
