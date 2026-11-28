// 「経営: 投資と配分」画面群の架空データ（M-04〜M-12）。基準日 2026-11-27。
// 共有データ（mocks/portfolio.ts）を前提に、優先順位・要員・予算・ロードマップ・便益を補う。
import type { CaseStatus, DateConfidence, DecisionStatus, ProviderKey } from "../lib/vocab";

/** 事業ケースの判断履歴 */
export const caseHistory: Record<string, { at: string; actor: string; action: string; detail?: string }[]> = {
  "BC-0007": [
    { at: "2026-11-18T10:00:00+09:00", actor: "u-tanaka", action: "事業ケースを提出" },
    { at: "2026-11-20T15:00:00+09:00", actor: "u-okada", action: "スポンサーとして審議を依頼", detail: "経営会議（12/15）で審議" },
    { at: "2026-11-25T09:30:00+09:00", actor: "u-mori", action: "コメント", detail: "既製エンジンの価格改定条項を契約前に確認すること" },
  ],
  "BC-0008": [{ at: "2026-11-25T15:00:00+09:00", actor: "u-sato", action: "事業ケースを提出" }],
  "BC-0005": [
    { at: "2026-06-01T10:00:00+09:00", actor: "u-sato", action: "事業ケースを提出" },
    { at: "2026-06-10T11:00:00+09:00", actor: "u-mori", action: "開始を承認", detail: "保守契約の継続を条件に受注" },
    { at: "2026-06-12T09:00:00+09:00", actor: "u-yamamoto", action: "プロジェクトを作成", detail: "member-app-api" },
  ],
  "BC-0009": [
    { at: "2026-11-02T10:00:00+09:00", actor: "u-takahashi", action: "事業ケースを提出" },
    { at: "2026-11-10T16:00:00+09:00", actor: "u-kimura", action: "却下", detail: "既製品で代替可能。期待便益が費用を下回る" },
  ],
};

export const CASE_STATUS_ORDER: CaseStatus[] = ["reviewing", "submitted", "draft", "approved", "onHold", "rejected", "closed"];

/** 優先順位の比較軸（1〜5。リスク・費用・期間は小さいほど良い） */
export type PriorityAxis = "value" | "strategy" | "commitment" | "risk" | "cost" | "duration" | "capacity";
export const PRIORITY_AXES: { key: PriorityAxis; label: string; higherIsBetter: boolean; help: string }[] = [
  { key: "value", label: "事業価値", higherIsBetter: true, help: "売上・利益・継続収益への寄与" },
  { key: "strategy", label: "戦略整合", higherIsBetter: true, help: "今年度の事業方針との合致" },
  { key: "commitment", label: "顧客約束", higherIsBetter: true, help: "契約・確約日がある" },
  { key: "risk", label: "リスク", higherIsBetter: false, help: "技術・要求・体制のリスク" },
  { key: "cost", label: "費用", higherIsBetter: false, help: "残りの投資額" },
  { key: "duration", label: "期間", higherIsBetter: false, help: "完了までの残り期間" },
  { key: "capacity", label: "能力制約", higherIsBetter: false, help: "不足するロール・キーパーソン依存" },
];

export const priorityItems: { id: string; name: string; kind: "project" | "case"; project?: string; case_id?: string; rank: number; scores: Record<PriorityAxis, number>; note?: string }[] = [
  { id: "PI-1", name: "受発注システム刷新", kind: "project", project: "order-renewal", rank: 1, scores: { value: 5, strategy: 4, commitment: 5, risk: 3, cost: 3, duration: 3, capacity: 3 }, note: "顧客との確約日あり（最終受入 2027-02-26）" },
  { id: "PI-2", name: "会員アプリ API 開発", kind: "project", project: "member-app-api", rank: 2, scores: { value: 4, strategy: 4, commitment: 5, risk: 2, cost: 2, duration: 2, capacity: 2 }, note: "DEC-0027 で 2 位に引き上げ" },
  { id: "PI-3", name: "旧基幹データ移行", kind: "project", project: "legacy-migration", rank: 3, scores: { value: 4, strategy: 3, commitment: 4, risk: 4, cost: 4, duration: 4, capacity: 5 }, note: "1月の設計者が不足（DEC-0032）" },
  { id: "PI-4", name: "在庫管理ダッシュボード", kind: "project", project: "inventory-dashboard", rank: 4, scores: { value: 3, strategy: 4, commitment: 2, risk: 1, cost: 1, duration: 1, capacity: 2 } },
  { id: "PI-5", name: "在庫予測機能の追加（BC-0007）", kind: "case", case_id: "BC-0007", rank: 5, scores: { value: 4, strategy: 5, commitment: 1, risk: 2, cost: 3, duration: 3, capacity: 3 }, note: "審議中" },
  { id: "PI-6", name: "配送管理システム（BC-0008）", kind: "case", case_id: "BC-0008", rank: 6, scores: { value: 3, strategy: 4, commitment: 2, risk: 3, cost: 2, duration: 2, capacity: 4 }, note: "提出済み" },
];

export const DEFAULT_WEIGHTS: Record<PriorityAxis, number> = { value: 3, strategy: 2, commitment: 3, risk: 2, cost: 1, duration: 1, capacity: 2 };

/** シナリオ比較 */
export const scenarios: { key: string; name: string; description: string; order: string[]; impacts: { milestone: string; project: string; change: string; days: number }[]; conflicts: string[]; extra_cost: number; recommended?: boolean }[] = [
  {
    key: "A", name: "シナリオ A: 会員アプリを先行（現行）", description: "現在の順位。旧基幹データ移行は外部委託 2 名を追加して並行する。",
    order: ["PI-1", "PI-2", "PI-3", "PI-4"],
    impacts: [{ milestone: "MS-401 移行リハーサル1回目", project: "legacy-migration", change: "委託先の立上げ次第", days: 0 }],
    conflicts: ["1月: 設計者が 1.5 人月不足（外部委託で補う前提）"], extra_cost: 2_800_000, recommended: true,
  },
  {
    key: "B", name: "シナリオ B: 旧基幹を先行", description: "会員アプリの設計者 1 名を旧基幹へ移す。外部委託は追加しない。",
    order: ["PI-1", "PI-3", "PI-2", "PI-4"],
    impacts: [
      { milestone: "MS-201 β版リリース", project: "member-app-api", change: "顧客との確約日（12/11）を超過", days: 10 },
      { milestone: "MS-202 本番リリース", project: "member-app-api", change: "目標日の後ろ倒し", days: 14 },
    ],
    conflicts: ["12月: 開発者が 0.5 人月不足", "キーパーソン（田中 陽介）が 2 案件を兼務"], extra_cost: 0,
  },
  {
    key: "C", name: "シナリオ C: 移行リハーサルを延期", description: "旧基幹のリハーサルを 2 週間延期し、要員の追加をしない。",
    order: ["PI-1", "PI-2", "PI-3", "PI-4"],
    impacts: [{ milestone: "MS-401 移行リハーサル1回目", project: "legacy-migration", change: "2027-01-29 へ延期（顧客の再承認が必要）", days: 14 }],
    conflicts: [], extra_cost: 0,
  },
];

export const priorityHistory: { id: string; at: string; decision: string; summary: string; decider: string; status: DecisionStatus }[] = [
  { id: "PRI-2026-11", at: "2026-11-14T11:00:00+09:00", decision: "DEC-0027", summary: "会員アプリ API を 3 位→2 位、在庫管理ダッシュボードの改善を 1 月へ延期", decider: "u-kimura", status: "approved" },
  { id: "PRI-2026-09", at: "2026-09-12T10:00:00+09:00", decision: "DEC-0011", summary: "旧基幹データ移行を受注し 3 位に追加", decider: "u-kimura", status: "approved" },
];

/** 要員（役割別・月別の人月）。個人ではなく役割の集計 */
export const CAPACITY_MONTHS = ["2026-12", "2027-01", "2027-02", "2027-03"];
export const capacityRoles: { role: string; supply: number[]; demand: { project: string; values: number[] }[]; keyPerson?: string }[] = [
  { role: "PM", supply: [3, 3, 3, 3], demand: [{ project: "order-renewal", values: [1, 1, 1, 0.5] }, { project: "member-app-api", values: [0.5, 0.5, 0, 0] }, { project: "legacy-migration", values: [1, 1, 1, 1] }, { project: "inventory-dashboard", values: [0.3, 0, 0, 0] }] },
  { role: "設計者", supply: [3, 3, 3, 3], demand: [{ project: "order-renewal", values: [1, 1, 0.5, 0.5] }, { project: "member-app-api", values: [1, 1, 0.5, 0] }, { project: "legacy-migration", values: [0.5, 2, 2, 1.5] }, { project: "inventory-dashboard", values: [0.5, 0.5, 0, 0] }], keyPerson: "基幹系の設計経験者が 1 名のみ（2 案件で必要）" },
  { role: "開発者", supply: [8, 8, 8, 8], demand: [{ project: "order-renewal", values: [4, 3, 3, 2] }, { project: "member-app-api", values: [2, 2, 1, 0] }, { project: "legacy-migration", values: [1, 2, 3, 4] }, { project: "inventory-dashboard", values: [1, 0.5, 0, 0] }] },
  { role: "QA", supply: [2, 2, 2, 2], demand: [{ project: "order-renewal", values: [1, 1, 1, 1] }, { project: "member-app-api", values: [0.5, 1, 0.5, 0] }, { project: "legacy-migration", values: [0, 0.5, 0.5, 1] }, { project: "inventory-dashboard", values: [0.3, 0, 0, 0] }] },
];

export const outsourcingOptions: { id: string; name: string; role: string; amount: string; cost: number; lead: string; note: string }[] = [
  { id: "OS-1", name: "委託先 A（基幹系の設計経験あり）", role: "設計者", amount: "2 名 × 3 か月", cost: 2_800_000, lead: "2 週間", note: "過去に 2 案件の実績。秘密保持契約は締結済み" },
  { id: "OS-2", name: "委託先 B（汎用の開発支援）", role: "開発者", amount: "2 名 × 2 か月", cost: 2_400_000, lead: "1 週間", note: "基幹系の経験なし" },
];

/** 予算の出典（会計システムとは未連携。手入力の値を含む） */
export const budgetSource: { provider: ProviderKey | "manual"; label: string; updated_at: string; by: string } = { provider: "manual", label: "会計システムからの月次集計（手入力）", updated_at: "2026-11-25T18:00:00+09:00", by: "u-ishii" };
export const ORG_BUDGET_CAP = 85_000_000;

/** 戦略ロードマップ */
export const strategicGoals: { id: string; title: string; period: string; owner: string; projects: string[]; cases: string[] }[] = [
  { id: "G-1", title: "受託案件の品質説明力を高め、継続取引を増やす", period: "2026年度", owner: "u-kimura", projects: ["order-renewal", "member-app-api", "legacy-migration"], cases: ["BC-0008"] },
  { id: "G-2", title: "自社サービスの継続課金を拡大する", period: "2026〜2027年度", owner: "u-okada", projects: ["inventory-dashboard"], cases: ["BC-0007"] },
];

export const roadmapItems: { id: string; goal: string; label: string; project?: string; case_id?: string; baseline?: { start: string; end: string }; current: { start: string; end: string; confidence: DateConfidence; tone?: "pass" | "warn" | "fail" | "info" }; depends_on?: string[] }[] = [
  { id: "RI-1", goal: "G-1", label: "受発注システム刷新", project: "order-renewal", baseline: { start: "2026-07-01", end: "2027-02-26" }, current: { start: "2026-07-01", end: "2027-03-12", confidence: "forecast", tone: "warn" } },
  { id: "RI-2", goal: "G-1", label: "会員アプリ API 開発", project: "member-app-api", baseline: { start: "2026-06-15", end: "2027-01-29" }, current: { start: "2026-06-15", end: "2027-01-29", confidence: "committed", tone: "pass" } },
  { id: "RI-3", goal: "G-1", label: "旧基幹データ移行", project: "legacy-migration", baseline: { start: "2026-10-01", end: "2027-03-31" }, current: { start: "2026-10-01", end: "2027-03-31", confidence: "committed", tone: "info" }, depends_on: ["RI-1"] },
  { id: "RI-4", goal: "G-1", label: "配送管理システム（第1段階・審議前）", case_id: "BC-0008", current: { start: "2027-01-12", end: "2027-03-31", confidence: "target", tone: "info" } },
  { id: "RI-5", goal: "G-2", label: "在庫管理ダッシュボード", project: "inventory-dashboard", baseline: { start: "2026-09-01", end: "2026-12-25" }, current: { start: "2026-09-01", end: "2026-12-22", confidence: "forecast", tone: "pass" } },
  { id: "RI-6", goal: "G-2", label: "在庫予測機能（審議中）", case_id: "BC-0007", current: { start: "2027-01-15", end: "2027-03-31", confidence: "target", tone: "info" }, depends_on: ["RI-5"] },
];

export const roadmapChanges: { id: string; at: string; item: string; change: string; reason: string; approver: string; decision?: string }[] = [
  { id: "RC-3", at: "2026-11-20T10:00:00+09:00", item: "受発注システム刷新", change: "最終受入の予測を 2027-02-26 → 2027-03-12", reason: "結合テスト環境の準備遅れ（予測の更新。確約日の改訂は未承認）", approver: "—（予測のため承認対象外）" },
  { id: "RC-2", at: "2026-11-14T11:00:00+09:00", item: "在庫管理ダッシュボード", change: "改善フェーズを 2027-01 へ延期", reason: "会員アプリ API の優先度引き上げ", approver: "u-kimura", decision: "DEC-0027" },
  { id: "RC-1", at: "2026-10-09T17:00:00+09:00", item: "受発注システム刷新", change: "基本設計の完了を 9/30 → 10/9（承認済み改訂）", reason: "CR-0002 による要求追加", approver: "u-nakamura" },
];

/** 便益・成果 */
export type BenefitKpi = { name: string; unit: string; baseline: number; target: number; actual?: number; measured_at?: string; source: string; source_kind: "synced" | "manual"; higherIsBetter: boolean; series: { at: string; value: number }[] };
export const benefits: { id: string; title: string; project?: string; case_id: string; sponsor: string; invested: number; expected: string; next_review: string; next_decision: "continue" | "change" | "stop" | "undecided"; status: "measuring" | "notStarted" | "achieved" | "behind"; kpis: BenefitKpi[]; assumptions: string[]; decision_id?: string }[] = [
  {
    id: "BEN-0001", title: "会員アプリ API の障害削減と保守継続", project: "member-app-api", case_id: "BC-0005", sponsor: "u-mori", invested: 14_000_000, expected: "障害 月 0.2 件以下、粗利率 26%", next_review: "2027-03-15", next_decision: "undecided", status: "measuring",
    kpis: [
      { name: "障害件数", unit: "件/月", baseline: 2, target: 0.2, actual: 0.7, measured_at: "2026-11-27", source: "PagerDuty のインシデント集計", source_kind: "synced", higherIsBetter: false, series: [{ at: "2026-08", value: 2 }, { at: "2026-09", value: 1.5 }, { at: "2026-10", value: 1 }, { at: "2026-11", value: 0.7 }] },
      { name: "粗利率", unit: "%", baseline: 0, target: 26, actual: 28, measured_at: "2026-11-25", source: "会計システムの月次集計（手入力）", source_kind: "manual", higherIsBetter: true, series: [{ at: "2026-09", value: 24 }, { at: "2026-10", value: 27 }, { at: "2026-11", value: 28 }] },
    ],
    assumptions: ["API の刷新で障害の主因（タイムアウト）が解消する", "保守契約が 2027 年度も継続する"],
  },
  {
    id: "BEN-0002", title: "受発注システム刷新の業務効率化（顧客側）", project: "order-renewal", case_id: "BC-0003", sponsor: "u-kimura", invested: 38_000_000, expected: "発注処理時間 50% 削減（顧客の業務指標）", next_review: "2027-06-30", next_decision: "undecided", status: "notStarted",
    kpis: [{ name: "発注1件の処理時間", unit: "分", baseline: 12, target: 6, source: "顧客の業務記録（受入後に共有予定）", source_kind: "manual", higherIsBetter: false, series: [] }],
    assumptions: ["v1.4.0 以降の取引先マスタ一括登録が使われる"],
  },
  {
    id: "BEN-0003", title: "在庫管理ダッシュボードによる継続課金", project: "inventory-dashboard", case_id: "BC-0004", sponsor: "u-okada", invested: 6_000_000, expected: "有料契約 40 社、解約率 年 6% 以下", next_review: "2026-12-15", next_decision: "change", status: "behind",
    kpis: [
      { name: "有料契約数", unit: "社", baseline: 0, target: 40, actual: 26, measured_at: "2026-11-26", source: "契約管理（手入力）", source_kind: "manual", higherIsBetter: true, series: [{ at: "2026-08", value: 8 }, { at: "2026-09", value: 15 }, { at: "2026-10", value: 21 }, { at: "2026-11", value: 26 }] },
      { name: "解約率", unit: "%/年", baseline: 6, target: 6, actual: 6.8, measured_at: "2026-11-26", source: "契約管理（手入力）", source_kind: "manual", higherIsBetter: false, series: [{ at: "2026-09", value: 6.1 }, { at: "2026-10", value: 6.5 }, { at: "2026-11", value: 6.8 }] },
    ],
    assumptions: ["欠品の可視化だけで解約が抑えられる（→ 実績では不足。BC-0007 の在庫予測で補う案）"],
    decision_id: "DEC-0034",
  },
];

/** M-12 経営スケジュールで扱う、繰返し予定の単一回変更 */
export const recurringExceptions: { event: string; original: string; changed_to?: string; kind: "moved" | "cancelled"; note: string }[] = [
  { event: "CAL-01", original: "2026-12-01T09:00:00+09:00", changed_to: "2026-12-01T10:00:00+09:00", kind: "moved", note: "繰返し（毎月第1火曜）のうち 12月の回だけ開始を 10:00 に変更。シリーズ全体は変更なし" },
];
