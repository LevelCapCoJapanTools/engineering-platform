// 受託者への発注と採算の画面群（B-01〜B-07）と、M-01/M-07/M-08/M-12/J-10 の追加表示で使う架空データ。
// 基準日は 2026-11-27。金額は円（税抜）。すべて受注側の社内情報で、顧客・提携先・受託者には出さない。
import type { Order } from "../lib/types";
import { orders } from "./engagement";

/** 受注側（この組織）の会社名。ほかの依頼元の発注は一覧に出さない */
export const OWN_COMPANY = "サンプルソフト株式会社";

/** この組織が出した発注だけ（ORD-0201 は別の依頼元のため含まない） */
export const ownOrders: Order[] = orders.filter((o) => o.client_company === OWN_COMPANY);

/** 発注を発行した人（自己検収の禁止に使う） */
export const ORDER_ISSUER: Record<string, string> = {
  "ORD-0101": "u-kimura",
  "ORD-0102": "u-kimura",
  "ORD-0103": "u-kimura",
  "ORD-0104": "u-mori",
};

/** 案件ごとの指定検収者（委託元側） */
export const DESIGNATED_INSPECTOR: Record<string, string> = {
  "order-renewal": "u-mori",
  "member-app-api": "u-ishii",
};

/** 受託者との条件の相談（対案と再提示） */
export type Negotiation = { at: string; by: string; kind: "offer" | "counter" | "reoffer" | "accept" | "read"; version?: number; text: string };
export const negotiations: Record<string, Negotiation[]> = {
  "ORD-0101": [
    { at: "2026-11-14T10:00:00+09:00", by: "u-aoki", kind: "offer", version: 1, text: "v1 を提示（報酬 40万円、納期 11/28）" },
    { at: "2026-11-14T21:10:00+09:00", by: "u-matsuda", kind: "read", version: 1, text: "v1 を既読（受諾ではありません）" },
    { at: "2026-11-15T09:40:00+09:00", by: "u-matsuda", kind: "counter", version: 1, text: "1万行の性能条件の確認に工数がかかるため、報酬 45万円を相談したい。納期は同じで可" },
    { at: "2026-11-17T15:00:00+09:00", by: "u-aoki", kind: "reoffer", version: 2, text: "JV責任者の承認（外注枠の範囲内）を得て v2 を再提示。6列目は対象外と明記" },
    { at: "2026-11-18T11:20:00+09:00", by: "u-matsuda", kind: "accept", version: 2, text: "v2 を受諾" },
  ],
  "ORD-0103": [
    { at: "2026-11-26T17:00:00+09:00", by: "u-aoki", kind: "offer", version: 1, text: "v1 を提示（報酬 60万円、納期 12/18）" },
  ],
};

/** 委託元の検収（完成条件ごと）。分納を持つ発注は installment を分ける */
export type InspectionItem = { criterion: string; result: "pass" | "return" | "pending"; note?: string; evidence?: string };
export type Installment = { no: number; title: string; due: string; amount: number; submitted_at?: string; inspected_at?: string; status: "notStarted" | "inProgress" | "passed" | "returned"; items: InspectionItem[] };
export const installments: Record<string, Installment[]> = {
  "ORD-0101": [
    {
      no: 1,
      title: "受注一覧の CSV 出力",
      due: "2026-11-28",
      amount: 450_000,
      submitted_at: "2026-11-27T09:20:00+09:00",
      status: "inProgress",
      items: [
        { criterion: "5列が指定の順で出力される", result: "pass", evidence: "T-06 ビルド run-8812 の結合テスト" },
        { criterion: "文字コードは UTF-8（BOM 付き）", result: "pass", evidence: "提出の確認結果" },
        { criterion: "1万行を10秒以内に出力できる", result: "pending", note: "提出コミット 9f3c2a1 の性能テストの結果を照合中" },
      ],
    },
  ],
  "ORD-0102": [
    { no: 1, title: "取込 API（新規・更新）", due: "2026-12-04", amount: 700_000, status: "notStarted", items: [{ criterion: "1万行の UTF-8 CSV を60秒以内に取り込める", result: "pending" }] },
    { no: 2, title: "失敗行の一覧表示", due: "2026-12-11", amount: 500_000, status: "notStarted", items: [{ criterion: "失敗した行の行番号と理由を表示する", result: "pending" }] },
  ],
};

/** 分納のある発注で一部だけ検収した例（B-03 の「一部検収」状態で使う） */
export const partialExample: Installment[] = [
  { ...installments["ORD-0102"][0], submitted_at: "2026-12-04T17:00:00+09:00", inspected_at: "2026-12-07T11:00:00+09:00", status: "passed", items: [{ criterion: "1万行の UTF-8 CSV を60秒以内に取り込める", result: "pass", evidence: "T-06 ビルド run-8840 の性能テスト（42秒）" }] },
  { ...installments["ORD-0102"][1], submitted_at: "2026-12-04T17:00:00+09:00", status: "returned", items: [{ criterion: "失敗した行の行番号と理由を表示する", result: "return", note: "文字コード不正の行で理由が空欄になる。完成条件の範囲内の修正として再提出を依頼" }] },
];

/** 修正と追加依頼の仕分け */
export type ChangeTriage = { id: string; order_id: string; from: string; request: string; verdict: "fix" | "additional"; reason: string; next: string };
export const triage: ChangeTriage[] = [
  { id: "TRI-01", order_id: "ORD-0101", from: "顧客（中村 拓也）", request: "6列目に担当者を追加してほしい", verdict: "additional", reason: "v2 で「6列目（担当者）の追加」を対象外と明記済み", next: "追加見積として受託者に条件を相談（受託者の無償修正タスクは作らない）" },
  { id: "TRI-02", order_id: "ORD-0101", from: "検収者（森 由紀子）", request: "1万行で 10 秒を超える場合がある", verdict: "fix", reason: "完成条件「1万行を10秒以内」に照らして不一致", next: "条件の範囲内の修正として再提出を依頼（照合の結果待ち）" },
];

/** 外注候補（本人が共有した稼働可能枠）。単価は社内のみ */
export type Partner = { user_id?: string; name: string; kind: "freelancer" | "company"; skills: string[]; rate_per_day: number; shared: { month: string; days: number }[]; shared_at: string; status: "active" | "invited" };
export const partners: Partner[] = [
  { user_id: "u-matsuda", name: "松田 亮", kind: "freelancer", skills: ["TypeScript", "React", "CSV・帳票"], rate_per_day: 45_000, shared: [{ month: "2026-12", days: 10 }, { month: "2027-01", days: 15 }], shared_at: "2026-11-20T10:00:00+09:00", status: "active" },
  { user_id: "u-hayashi", name: "林 由香", kind: "freelancer", skills: ["Go", "Rust", "バッチ処理"], rate_per_day: 50_000, shared: [{ month: "2026-12", days: 12 }, { month: "2027-01", days: 8 }], shared_at: "2026-11-18T10:00:00+09:00", status: "active" },
  { user_id: "u-ogawa", name: "小川 純", kind: "freelancer", skills: ["検索", "PostgreSQL", "React"], rate_per_day: 48_000, shared: [{ month: "2026-12", days: 15 }, { month: "2027-01", days: 15 }], shared_at: "2026-11-25T10:00:00+09:00", status: "invited" },
  { name: "架空テック合同会社（2名）", kind: "company", skills: ["データ移行", "設計"], rate_per_day: 90_000, shared: [{ month: "2027-01", days: 30 }], shared_at: "2026-11-22T10:00:00+09:00", status: "active" },
];

/** 稼働枠の仮押さえ・受諾済みの枠 */
export type Slot = { id: string; partner: string; month: string; days: number; kind: "hold" | "accepted" | "released"; project: string; order_id?: string; expires?: string; note?: string; by: string };
export const slots: Slot[] = [
  { id: "SLT-11", partner: "林 由香", month: "2026-12", days: 12, kind: "accepted", project: "order-renewal", order_id: "ORD-0102", by: "u-ishii" },
  { id: "SLT-12", partner: "松田 亮", month: "2026-12", days: 4, kind: "accepted", project: "order-renewal", order_id: "ORD-0101", by: "u-ishii" },
  { id: "SLT-13", partner: "小川 純", month: "2026-12", days: 10, kind: "hold", project: "order-renewal", order_id: "ORD-0103", expires: "2026-11-30", by: "u-ishii" },
  { id: "SLT-14", partner: "小川 純", month: "2026-12", days: 8, kind: "hold", project: "legacy-migration", expires: "2026-12-02", by: "u-ishii", note: "SLT-13 と合わせると共有枠 15 日を 3 日超える" },
  { id: "SLT-09", partner: "松田 亮", month: "2026-11", days: 5, kind: "released", project: "inventory-dashboard", note: "回答期限切れ（11/20）で枠を戻した", by: "u-ishii" },
];

/** 外注枠の決裁と依頼書の結び付き（M-08 に表示） */
export type OutsourcingAllotment = { project: string; decision: string; cap: number; lines: { order_id?: string; label: string; amount: number; state: "accepted" | "offered" | "unassigned" | "inspected"; slot?: string }[] };
export const allotments: OutsourcingAllotment[] = [
  {
    project: "order-renewal",
    decision: "DEC-0027",
    cap: 3_000_000,
    lines: [
      { label: "ORD-0090 ログ出力基盤（完了）", amount: 600_000, state: "inspected" },
      { order_id: "ORD-0101", label: "ORD-0101 受注一覧の CSV 出力", amount: 450_000, state: "accepted", slot: "SLT-12" },
      { order_id: "ORD-0102", label: "ORD-0102 取引先マスタの CSV 一括取込", amount: 1_200_000, state: "accepted", slot: "SLT-11" },
      { order_id: "ORD-0103", label: "ORD-0103 操作ログの検索画面", amount: 600_000, state: "offered", slot: "SLT-13" },
      { label: "未割当（取込結果の画面）", amount: 150_000, state: "unassigned" },
    ],
  },
  {
    project: "member-app-api",
    decision: "DEC-0027",
    cap: 2_250_000,
    lines: [
      { order_id: "ORD-0104", label: "ORD-0104 会員アプリのプッシュ通知 API", amount: 750_000, state: "inspected" },
      { label: "未割当（β版後の改善）", amount: 1_500_000, state: "unassigned" },
    ],
  },
];

/** 案件別の外注原価・粗利（社内のみ） */
export type ProjectCost = {
  slug: string;
  revenue: number;
  internal_labor: number;
  estimate_outsourcing: number;
  ordered_uninspected: number;
  inspected: number;
  unordered_plan: number;
  change_forecast: { id: string; label: string; cost: number; revenue: number; approved: boolean }[];
};
export const projectCosts: ProjectCost[] = [
  { slug: "order-renewal", revenue: 10_000_000, internal_labor: 4_000_000, estimate_outsourcing: 3_000_000, ordered_uninspected: 1_650_000, inspected: 600_000, unordered_plan: 750_000, change_forecast: [{ id: "CR-0004", label: "上限額の税込判定", cost: 1_200_000, revenue: 1_500_000, approved: false }] },
  { slug: "member-app-api", revenue: 19_000_000, internal_labor: 11_150_000, estimate_outsourcing: 2_250_000, ordered_uninspected: 0, inspected: 750_000, unordered_plan: 1_500_000, change_forecast: [] },
  { slug: "inventory-dashboard", revenue: 6_000_000, internal_labor: 5_700_000, estimate_outsourcing: 0, ordered_uninspected: 0, inspected: 0, unordered_plan: 0, change_forecast: [] },
  { slug: "legacy-migration", revenue: 22_000_000, internal_labor: 16_000_000, estimate_outsourcing: 3_000_000, ordered_uninspected: 0, inspected: 0, unordered_plan: 3_000_000, change_forecast: [{ id: "DEC-0032", label: "外部委託 2名の追加", cost: 2_800_000, revenue: 0, approved: false }] },
];
export const costOf = (slug: string) => projectCosts.find((c) => c.slug === slug);

/** 外注原価の見込（発注残＋検収済み＋未発注の計画）。内部工数は別に持ち、二重に数えない */
export function outsourcingForecast(c: ProjectCost, includeUnapproved = false) {
  const changes = c.change_forecast.filter((x) => x.approved || includeUnapproved);
  return c.ordered_uninspected + c.inspected + c.unordered_plan + changes.reduce((n, x) => n + x.cost, 0);
}
export function grossMargin(c: ProjectCost, includeUnapproved = false) {
  const changes = c.change_forecast.filter((x) => x.approved || includeUnapproved);
  const revenue = c.revenue + changes.reduce((n, x) => n + x.revenue, 0);
  const cost = c.internal_labor + outsourcingForecast(c, includeUnapproved);
  return { revenue, cost, margin: revenue - cost, rate: revenue === 0 ? 0 : (revenue - cost) / revenue };
}

/** 基準日ごとの粗利見込（承認した時点の再現用） */
export type CostSnapshot = { date: string; label: string; revenue: number; internal_labor: number; outsourcing: number; event?: string };
export const costSnapshots: Record<string, CostSnapshot[]> = {
  "order-renewal": [
    { date: "2026-10-01", label: "受注時", revenue: 10_000_000, internal_labor: 4_000_000, outsourcing: 3_000_000, event: "見積原価で開始" },
    { date: "2026-11-18", label: "ORD-0101 v2 受諾時", revenue: 10_000_000, internal_labor: 4_000_000, outsourcing: 3_000_000, event: "報酬 +5万円は外注枠の未割当から振替（総額は不変）" },
    { date: "2026-11-27", label: "現在", revenue: 10_000_000, internal_labor: 4_000_000, outsourcing: 3_000_000 },
    { date: "2026-12-02", label: "CR-0004 を承認した場合（案）", revenue: 11_500_000, internal_labor: 4_000_000, outsourcing: 4_200_000, event: "DEC-0031 の判断待ち。採択前は確定値に含めない" },
  ],
};

/** 発注・検収・請求・支払の照合 */
export type Settlement = {
  id: string;
  order_id: string;
  freelancer: string;
  installment: string;
  inspected_amount?: number;
  inspected_at?: string;
  received_at?: string;
  invoice_no?: string;
  invoice_amount?: number;
  payment_due: string;
  paid_at?: string;
  paid_source?: string;
  issue?: "partial" | "amountMismatch" | "duplicateInvoice" | "invoiceBeforeInspection" | "overdue";
  note?: string;
};
export const settlements: Settlement[] = [
  { id: "STL-01", order_id: "ORD-0104", freelancer: "松田 亮", installment: "一括", inspected_amount: 750_000, inspected_at: "2026-11-05", received_at: "2026-10-30", invoice_no: "INV-M-0412", invoice_amount: 750_000, payment_due: "2026-11-30", paid_at: "2026-11-25", paid_source: "経理システムの支払記録（11/26 取込）" },
  { id: "STL-02", order_id: "ORD-0090", freelancer: "林 由香", installment: "分納1", inspected_amount: 300_000, inspected_at: "2026-10-20", received_at: "2026-10-15", invoice_no: "INV-H-0090-1", invoice_amount: 300_000, payment_due: "2026-11-30", paid_at: "2026-11-25", paid_source: "経理システムの支払記録（11/26 取込）" },
  { id: "STL-03", order_id: "ORD-0090", freelancer: "林 由香", installment: "分納2", inspected_amount: 300_000, inspected_at: "2026-11-10", received_at: "2026-11-06", invoice_no: "INV-H-0090-2", invoice_amount: 330_000, payment_due: "2026-12-31", issue: "amountMismatch", note: "請求額が検収額より 3万円多い。消費税の扱いか追加作業かを窓口が受託者に照会中" },
  { id: "STL-04", order_id: "ORD-0090", freelancer: "林 由香", installment: "分納2", invoice_no: "INV-H-0090-2", invoice_amount: 330_000, payment_due: "2026-12-31", issue: "duplicateInvoice", note: "同じ請求書番号を 11/12 と 11/20 に受領。2件目は支払対象から除外" },
  { id: "STL-05", order_id: "ORD-0101", freelancer: "松田 亮", installment: "一括", received_at: "2026-11-27", invoice_no: "INV-M-0431", invoice_amount: 450_000, payment_due: "2026-12-31", issue: "invoiceBeforeInspection", note: "検収前に請求書を受領。支払期日（12/31）は発注条件のまま。検収後に支払対象へ" },
];

/** 委託単位への分解（B-06） */
export type WorkPackage = {
  id: string;
  deliverable: string;
  title: string;
  depends_on: string[];
  inputs: string[];
  criteria: string[];
  inspector: string;
  assignee?: { kind: "freelancer" | "internal"; name: string; order_id?: string; state: "accepted" | "offered" | "draft" };
  ai_suggested?: boolean;
};
export const SOW_REF = "SOW v3 §4（v1.4.0 取引先マスタ・操作ログ）";
export const workPackages: WorkPackage[] = [
  { id: "WP-1", deliverable: "取引先マスタの CSV 取込", title: "取込 API（新規・更新・失敗行の記録）", depends_on: [], inputs: ["REQ-0007 v3", "SOW v3 §4.3"], criteria: ["1万行を60秒以内に取り込める", "失敗行を記録する"], inspector: "u-mori", assignee: { kind: "freelancer", name: "林 由香", order_id: "ORD-0102", state: "accepted" } },
  { id: "WP-2", deliverable: "取引先マスタの CSV 取込", title: "取込結果の画面（失敗行の一覧）", depends_on: ["WP-1"], inputs: ["WP-1 の API 仕様", "画面デザイン D-12"], criteria: ["失敗した行の行番号と理由を表示する"], inspector: "u-mori", ai_suggested: true },
  { id: "WP-3", deliverable: "受注一覧の CSV 出力", title: "CSV 出力ボタンと出力処理", depends_on: [], inputs: ["MTG-12 決定事項 3", "SOW v3 §4.2"], criteria: ["5列が指定の順で出力される", "UTF-8（BOM 付き）"], inspector: "u-mori", assignee: { kind: "freelancer", name: "松田 亮", order_id: "ORD-0101", state: "accepted" } },
  { id: "WP-4", deliverable: "操作ログの検索", title: "検索 API（期間・利用者・操作種別）", depends_on: [], inputs: ["REQ-0006 v2", "ADR-0004"], criteria: ["7年分から3秒以内"], inspector: "u-mori", assignee: { kind: "internal", name: "鈴木 彩（社内）", state: "accepted" } },
  { id: "WP-5", deliverable: "操作ログの検索", title: "検索画面", depends_on: ["WP-4"], inputs: ["WP-4 の API 仕様"], criteria: ["閲覧権限のない利用者には表示しない"], inspector: "u-mori", assignee: { kind: "freelancer", name: "小川 純", order_id: "ORD-0103", state: "offered" } },
];

/** 配分案（M-07 で比較。採択するまで承認済み計画・確約日は変わらない） */
export type AllocationOption = { key: string; name: string; summary: string; cost: number; start: string; commitments: { label: string; committed: string; result: string; kept: boolean }[]; risks: string[] };
export const ALLOCATION_BASE_DATE = "2026-11-27";
export const allocationOptions: AllocationOption[] = [
  { key: "add", name: "A 外注を追加", summary: "取込結果の画面（WP-2）を小川 純に追加発注し、並行で進める", cost: 480_000, start: "2026-12-01", commitments: [{ label: "v1.4.0 納入（架空商事）", committed: "2026-12-10", result: "2026-12-10", kept: true }], risks: ["小川 純の受諾が未定（回答期限 11/30）", "仮押さえが共有枠を3日超える"] },
  { key: "split", name: "B 機能を分割", summary: "v1.4.0 は CSV 出力と取込 API、取込結果の画面は v1.4.1（12/24）に分ける", cost: 0, start: "2026-12-04", commitments: [{ label: "v1.4.0 納入（架空商事）", committed: "2026-12-10", result: "2026-12-10（範囲を縮小）", kept: true }, { label: "取込結果の画面", committed: "2026-12-10", result: "2026-12-24", kept: false }], risks: ["顧客の範囲変更の合意が必要", "受託者の発注範囲は変わらない"] },
  { key: "delay", name: "C 延期", summary: "v1.4.0 全体を 12/17 に延期する", cost: 0, start: "—", commitments: [{ label: "v1.4.0 納入（架空商事）", committed: "2026-12-10", result: "2026-12-17", kept: false }, { label: "最終受入", committed: "2027-02-26", result: "2027-03-12（予測）", kept: false }], risks: ["確約日に対して 7 日の遅延", "受入試験の開始（12/10）がずれる"] },
];

/** 日程の衝突（M-12・J-10 で表示） */
export type ScheduleConflict = {
  id: string;
  project: string;
  title: string;
  cause: string;
  orders: { id: string; label: string }[];
  commitment: { label: string; date: string };
  alternatives: { date: string; label: string }[];
  /** 顧客への連絡に必要な日数と審議の日数から逆算した判断期限 */
  decision_due: string;
  due_basis: string;
  decision_id?: string;
  records: { plan: "draft" | "proposed" | "none"; customer: "pending" | "agreed" | "none"; source: "pending" | "updated" | "none" };
};
export const scheduleConflicts: ScheduleConflict[] = [
  {
    id: "CF-01",
    project: "order-renewal",
    title: "結合テスト環境の遅れと v1.4.0 の確約日",
    cause: "MS-105 結合テスト環境の予測が 12/1 になり、ORD-0102 の提出見込み（12/4）と委託検収（〜12/11）が確約日 12/10 を超える",
    orders: [{ id: "ORD-0102", label: "取引先マスタの CSV 一括取込（提出見込み 12/4）" }, { id: "ORD-0101", label: "受注一覧の CSV 出力（検収期日 12/5）" }],
    commitment: { label: "v1.4.0 納入（架空商事との確約）", date: "2026-12-10" },
    alternatives: [{ date: "2026-12-10", label: "範囲を縮小して確約日を守る（配分案 B）" }, { date: "2026-12-17", label: "全体を延期（配分案 C）" }],
    decision_due: "2026-12-01",
    due_basis: "顧客への事前連絡に 5 営業日（12/3 まで）＋顧客との調整 1 日＋経営会議 12/1 から逆算",
    decision_id: "DEC-0033",
    records: { plan: "proposed", customer: "pending", source: "none" },
  },
  {
    id: "CF-02",
    project: "order-renewal",
    title: "受託者の質問への回答待ち",
    cause: "INQ-0032（取引先コードの重複）の顧客回答が 12/1 を過ぎると、ORD-0102 の提出が 12/4 から遅れる",
    orders: [{ id: "ORD-0102", label: "取引先マスタの CSV 一括取込" }],
    commitment: { label: "ORD-0102 の納期（受託者との合意）", date: "2026-12-04" },
    alternatives: [{ date: "2026-12-04", label: "窓口が 11/29 までに顧客回答を回収" }, { date: "2026-12-08", label: "受託者と納期を再合意" }],
    decision_due: "2026-11-30",
    due_basis: "回答期限 11/29 の翌営業日に代理（木村）へ引継ぎ",
    records: { plan: "none", customer: "pending", source: "none" },
  },
];

/** 会議を動かしたときの影響（M-12 の試算） */
export const MOVE_SIMULATION = {
  event: "CAL-01 経営会議（月次）",
  from: "2026-12-01",
  to: "2026-12-02",
  affected: [{ project: "order-renewal", reason: "CF-01 の判断期限（12/1）を過ぎるため、顧客への事前連絡が 12/4 にずれる" }],
  unaffected: ["member-app-api", "inventory-dashboard", "legacy-migration"],
};

/** 受託者の回答期限・提出見込み（日程に重ねる） */
export const freelancerDates = [
  { order_id: "ORD-0103", project: "order-renewal", label: "ORD-0103 条件への回答期限（小川 純）", date: "2026-11-30", kind: "reply" as const },
  { order_id: "ORD-0101", project: "order-renewal", label: "ORD-0101 委託検収の期日", date: "2026-12-05", kind: "inspection" as const },
  { order_id: "ORD-0102", project: "order-renewal", label: "ORD-0102 提出見込み（林 由香）", date: "2026-12-04", kind: "submission" as const },
  { order_id: "ORD-0102", project: "order-renewal", label: "ORD-0102 分納2 の納期", date: "2026-12-11", kind: "submission" as const },
];
