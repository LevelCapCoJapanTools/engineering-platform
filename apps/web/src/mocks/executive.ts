// 経営ダッシュボード・経営判断の画面で使う架空データ（2026-11-28 追加）。
// 共有データ（mocks/portfolio.ts）を読み取り、この画面群に必要な補足だけを持つ。基準日は 2026-11-27。
import type { ActorKind, ProviderKey, Severity } from "../lib/vocab";
import type { Decision } from "../lib/types";
import { decisions } from "./portfolio";

/** 判断の種類の表示名（画面群ローカル） */
export const DECISION_KIND: Record<Decision["kind"], string> = {
  investment: "投資",
  priority: "優先順位",
  resource: "要員・資源",
  riskAcceptance: "リスク受容",
  exception: "例外",
  release: "リリース・顧客説明",
  change: "変更・追加費用",
  budget: "予算",
  benefit: "便益・継続",
};

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

/** 受信箱の並び順: 期限が近い順 → 影響額が大きい順 → 重大度順 */
export function sortDecisions(list: Decision[]) {
  return [...list].sort((a, b) => a.due.localeCompare(b.due) || (b.impact_yen ?? 0) - (a.impact_yen ?? 0) || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** 経営層（直接利用者）が閲覧できない案件。M-02 の「権限なし」状態の例に使う */
export const OUT_OF_SCOPE_DECISION: Decision = {
  id: "DEC-0035",
  title: "自社サービス事業部の 2027 年度採用計画",
  kind: "resource",
  status: "pending",
  due: "2026-12-20",
  impact: "—",
  severity: "medium",
  requested_by: "u-okada",
  evidence: [],
};

/** 回付済み（実務上の承認者へ送った）判断。DEC-0033 を回付した後の状態の例 */
export const delegatedDecisions: Decision[] = [
  {
    ...decisions.find((d) => d.id === "DEC-0033")!,
    id: "DEC-0030",
    title: "v1.3.1 の不具合修正版を顧客へ説明するか",
    status: "delegated",
    due: "2026-11-26",
    decider_id: "u-kimura",
    decided_at: "2026-11-25T10:00:00+09:00",
    reason: "顧客説明は PM と顧客の合意事項のため、実務の承認者へ回付",
    practical_approver: "PM（佐藤 美咲）と顧客（中村 拓也）",
  },
];

/** 判断ごとの監査記録 */
export type DecisionAuditEntry = { id: string; at: string; actor: { kind: ActorKind; name: string }; action: string; detail?: string };
export const decisionAudit: Record<string, DecisionAuditEntry[]> = {
  "DEC-0031": [
    { id: "a1", at: "2026-11-26T15:30:00+09:00", actor: { kind: "human", name: "中村 拓也（顧客・外部ID）" }, action: "変更要求 CR-0004 を起票（顧客ポータル）" },
    { id: "a2", at: "2026-11-26T17:10:00+09:00", actor: { kind: "ai", name: "影響分析" }, action: "影響候補を記録（REQ-0012、TC-0110）", detail: "確信度 0.81。PM が確定済み" },
    { id: "a3", at: "2026-11-27T09:00:00+09:00", actor: { kind: "human", name: "佐藤 美咲（PM・GitHub: msato-dev）" }, action: "追加費用 120 万円の判断を経営に依頼" },
    { id: "a4", at: "2026-11-27T09:00:05+09:00", actor: { kind: "system", name: "通知" }, action: "Slack #exec-decisions へ通知（配信済み）" },
  ],
  "DEC-0029": [
    { id: "b1", at: "2026-11-18T10:00:00+09:00", actor: { kind: "human", name: "佐藤 美咲（PM・GitHub: msato-dev）" }, action: "リスク受容の判断を依頼" },
    { id: "b2", at: "2026-11-19T17:30:00+09:00", actor: { kind: "human", name: "森 由紀子（CTO）" }, action: "条件付きで承認", detail: "条件: 12/3 までに修正版へ更新" },
    { id: "b3", at: "2026-11-22T11:00:00+09:00", actor: { kind: "human", name: "伊藤 誠（QA・GitHub: mito-qa）" }, action: "フォローアップ「WAF ルールの確認記録」を完了" },
    { id: "b4", at: "2026-11-22T11:00:02+09:00", actor: { kind: "system", name: "Evidence Collector" }, action: "判断記録を MAN-0014 に含めて署名" },
  ],
  "DEC-0027": [
    { id: "c1", at: "2026-11-12T10:00:00+09:00", actor: { kind: "human", name: "石井 浩二（事業部長）" }, action: "優先順位の変更を提案" },
    { id: "c2", at: "2026-11-14T11:00:00+09:00", actor: { kind: "human", name: "木村 達也（代表取締役）" }, action: "承認" },
    { id: "c3", at: "2026-11-21T09:30:00+09:00", actor: { kind: "system", name: "同期" }, action: "要員計画の更新を GitHub Projects から確認（フォローアップ完了）" },
  ],
};

export const defaultAudit = (d: Decision): DecisionAuditEntry[] => [
  { id: `${d.id}-r`, at: "2026-11-26T10:00:00+09:00", actor: { kind: "human", name: "依頼者" }, action: "判断を依頼" },
];

/** 根拠（証跡・ID）のリンク先の種類 */
export function evidenceKind(id: string): "change" | "requirement" | "test" | "exception" | "gate" | "milestone" | "case" | "benefit" | "manifest" | "other" {
  if (id.startsWith("CR-")) return "change";
  if (id.startsWith("REQ-")) return "requirement";
  if (id.startsWith("TC-")) return "test";
  if (id.startsWith("EXC-")) return "exception";
  if (id.startsWith("run-")) return "gate";
  if (id.startsWith("MS-")) return "milestone";
  if (id.startsWith("BC-")) return "case";
  if (id.startsWith("BEN-")) return "benefit";
  if (id.startsWith("MAN-")) return "manifest";
  return "other";
}

/** AI の経営向け要約（参考）。元データへのリンクと確信度を必ず付ける */
export type AiExecSummary = { id: string; text: string; confidence: number; sources: { id: string; label: string }[]; project?: string };
export const aiExecSummaries: AiExecSummary[] = [
  { id: "AIS-1", project: "order-renewal", text: "結合テスト環境の準備遅れにより、v1.4.0 の納入予測が確約日 12/10 から 12/17 に後ろ倒しになる可能性があります。顧客への説明の要否を 12/1 の経営会議までに決める必要があります。", confidence: 0.78, sources: [{ id: "MS-104", label: "MS-104 予測日の更新" }, { id: "MS-105", label: "MS-105 結合テスト環境" }, { id: "EXC-0008", label: "EXC-0008 の期限" }] },
  { id: "AIS-2", project: "legacy-migration", text: "旧基幹データ移行は 1 月に設計者が約 1.5 人月不足する見込みです。ただし計画データ（Jira）が 3 日前から更新されていないため、この見込みは古い可能性があります。", confidence: 0.52, sources: [{ id: "MS-401", label: "MS-401 移行リハーサル" }, { id: "DEC-0032", label: "DEC-0032 外部委託の追加" }] },
  { id: "AIS-3", project: "member-app-api", text: "会員アプリ API は計画どおりですが、本番環境で応答遅延のインシデント（INC-0111）が未受領のまま 2 段目へエスカレーションされています。", confidence: 0.86, sources: [{ id: "INC-0111", label: "INC-0111" }, { id: "MS-201", label: "MS-201 β版リリース" }] },
];

/** 「運用担当の処理」と「開発チームの対応」。経営判断とは分けて表示する */
export type WorkItem = { id: string; title: string; owner: string; due?: string; source: ProviderKey; to?: "connector" | "exception" | "gate" | "incident" | "milestone" | "release"; target?: string; project?: string };
export const operationsWork: WorkItem[] = [
  { id: "OPS-1", title: "Jira（旧基幹データ移行）の再認可", owner: "u-ishii", due: "2026-11-27", source: "jira", to: "connector", target: "con-jira" },
  { id: "OPS-2", title: "Teams 通知の Workflow 共同所有者の設定", owner: "u-yamamoto", due: "2026-11-28", source: "teams", to: "connector", target: "con-teams" },
  { id: "OPS-3", title: "v1.3.0 の受入記録の取込み待ち（署名前）", owner: "u-yamamoto", source: "github", to: "release", target: "rel-140", project: "order-renewal" },
];
export const devTeamWork: WorkItem[] = [
  { id: "DEV-1", title: "PR #142 のテスト追加（ゲート B でブロック中）", owner: "u-suzuki", due: "2026-11-28", source: "github", to: "gate", target: "run-5821", project: "order-renewal" },
  { id: "DEV-2", title: "結合テスト環境の準備（予測 12/1）", owner: "u-ito", due: "2026-12-01", source: "githubProjects", to: "milestone", project: "order-renewal" },
  { id: "DEV-3", title: "INC-0111 応答遅延の一次対応（未受領）", owner: "u-suzuki", source: "pagerduty", to: "incident", target: "INC-0111", project: "member-app-api" },
  { id: "DEV-4", title: "EXC-0008 の期限（12/1）までにテストを追加", owner: "u-suzuki", due: "2026-12-01", source: "github", to: "exception", target: "EXC-0008", project: "order-renewal" },
];

/** 要員の要約（役割別・期間別の集計。個人の稼働監視ではない） */
export const capacitySummary = [
  { role: "設計者", month: "2027年1月", demand: 3.5, supply: 2.0 },
  { role: "開発者", month: "2027年1月", demand: 6.0, supply: 6.5 },
  { role: "QA", month: "2026年12月", demand: 2.5, supply: 2.0 },
];

/** 事業部・顧客の一覧（絞込み用） */
export const DIVISIONS = ["受託開発事業部", "自社サービス事業"];
