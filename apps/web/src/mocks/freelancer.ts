// フリーエンジニア（受託者）画面の架空データ（2026-11-28 追補）。
// 共有データ mocks/engagement.ts を読み取り、受託者本人に見せる範囲だけをここで補う。
// 受託者には自分の発注額・条件だけを出す。JV 内部予算・顧客との契約額・他の受託者の報酬は持たない。
import type { Inquiry, Order } from "../lib/types";
import { CURRENT_FREELANCER_ID, inquiries, orders, submissions } from "./engagement";

/** 松田さん向けの追加の依頼（返事が必要・作業中の例） */
export const extraOrders: Order[] = [
  {
    id: "ORD-0105",
    project: "order-renewal",
    title: "受注帳票の印刷レイアウト修正",
    freelancer_id: CURRENT_FREELANCER_ID,
    client_company: "サンプルソフト株式会社",
    status: "offered",
    next_actor: "freelancer",
    next_action: "条件を確認して回答する",
    next_due: "2026-11-30",
    submission: "none",
    inspection: "notStarted",
    deploy: "notReady",
    customer_acceptance: "notRequested",
    payment: "notDue",
    terms: [
      {
        version: 1,
        issued_at: "2026-11-26T18:00:00+09:00",
        scope: ["受注帳票（A4縦）の項目配置を新しい見本に合わせる", "社名ロゴの差し替え"],
        out_of_scope: ["帳票の新規追加", "PDF 以外の出力形式"],
        deliverable: "外部リポジトリ sample-soft/order-web の確定コミットと確認結果",
        delivery_to: "サンプルソフト株式会社（案件窓口）",
        due: "2026-12-11",
        completion_criteria: ["見本 PDF と項目の位置が一致する", "3ページ以上の受注でも改ページ位置が崩れない"],
        inspection_due: "2026-12-18",
        fee: 220_000,
        payment_due: "2027-01-31",
        payment_method: "銀行振込（月末締め翌月末払い）",
      },
    ],
  },
  {
    id: "ORD-0106",
    project: "order-renewal",
    title: "受注検索の絞り込み条件の追加",
    freelancer_id: CURRENT_FREELANCER_ID,
    client_company: "サンプルソフト株式会社",
    status: "accepted",
    accepted_version: 1,
    accepted_at: "2026-11-22T10:00:00+09:00",
    next_actor: "freelancer",
    next_action: "実装して成果を提出する",
    next_due: "2026-12-06",
    submission: "draft",
    inspection: "notStarted",
    deploy: "notReady",
    customer_acceptance: "notRequested",
    payment: "notDue",
    terms: [
      {
        version: 1,
        issued_at: "2026-11-21T15:00:00+09:00",
        scope: ["受注検索に「状態」「担当営業所」の絞り込みを追加"],
        out_of_scope: ["検索条件の保存"],
        deliverable: "外部リポジトリ sample-soft/order-web の確定コミットと確認結果",
        delivery_to: "サンプルソフト株式会社（案件窓口）",
        due: "2026-12-06",
        completion_criteria: ["2つの条件を組み合わせて絞り込める", "条件を外すと全件表示に戻る"],
        inspection_due: "2026-12-13",
        fee: 180_000,
        payment_due: "2027-01-31",
        payment_method: "銀行振込（月末締め翌月末払い）",
      },
    ],
  },
];

/** 受託者本人の依頼だけ（他の受託者の依頼は含めない） */
export const myOrders = (clientCompany?: string) =>
  [...orders, ...extraOrders].filter((o) => o.freelancer_id === CURRENT_FREELANCER_ID && (!clientCompany || o.client_company === clientCompany));

export const myOrderById = (id: string) => [...orders, ...extraOrders].find((o) => o.id === id && o.freelancer_id === CURRENT_FREELANCER_ID);

/** 依頼の分類。1件は1つの分類にだけ入る */
export type OrderBucket = "reply" | "working" | "submitted" | "waiting";
export const BUCKET_LABEL: Record<OrderBucket, string> = {
  reply: "返事が必要",
  working: "作業中",
  submitted: "提出済み",
  waiting: "先方の回答待ち",
};
export function bucketOf(o: Order): OrderBucket {
  if (o.status === "offered" || o.status === "negotiating") return "reply";
  if (o.next_actor === "customer" || o.next_actor === "desk") return "waiting";
  if (o.submission === "none" || o.submission === "draft") return "working";
  return "submitted";
}

/** 依頼に添付された資料（受託者に共有済みのもの） */
export const orderMaterials: Record<string, { name: string; version: string; note?: string }[]> = {
  "ORD-0101": [
    { name: "受注一覧画面の仕様（抜粋）", version: "v3", note: "列の定義は §4.2" },
    { name: "CSV 出力の見本", version: "v2" },
  ],
  "ORD-0105": [{ name: "受注帳票の新しい見本 PDF", version: "v1" }],
  "ORD-0106": [{ name: "受注検索の仕様（抜粋）", version: "v1" }],
  "ORD-0104": [{ name: "プッシュ通知 API の仕様", version: "v2" }],
  "ORD-0201": [{ name: "問い合わせフォームの項目一覧", version: "v1" }],
};

/** 受託者の既読記録（既読と受諾は別） */
export const readLog: Record<string, { version: number; read_at: string }[]> = {
  "ORD-0101": [
    { version: 1, read_at: "2026-11-14T12:10:00+09:00" },
    { version: 2, read_at: "2026-11-18T11:05:00+09:00" },
  ],
  "ORD-0105": [{ version: 1, read_at: "2026-11-27T08:40:00+09:00" }],
};

/** 委託元の検収結果（完成条件ごと）。最終顧客の受入とは別の記録 */
export const inspectionResults: Record<string, { criterion: string; result: "pass" | "fail" | "pending"; note?: string; installment?: string }[]> = {
  "ORD-0101": [
    { criterion: "5列が指定の順で出力される", result: "pass", installment: "第1回" },
    { criterion: "文字コードは UTF-8（BOM 付き）", result: "pass", installment: "第1回" },
    { criterion: "1万行を10秒以内に出力できる", result: "pending", note: "検証環境で計測中（12/1 まで）", installment: "第2回" },
  ],
};

/** 提出の履歴（旧版も残す）。共有データの提出に、再提出の例を加える */
export const submissionHistory = [
  ...submissions.filter((s) => myOrders().some((o) => o.id === s.order_id)),
];

/** 支払と請求（受託者本人の分だけ） */
export const myPayments: { order_id: string; client_company: string; title: string; ordered: number; inspected: number; invoice_no?: string; invoice_at?: string; payment_due: string; paid_at?: string; paid_amount?: number; status: "notDue" | "invoiced" | "paid" | "mismatch" }[] = [
  { order_id: "ORD-0104", client_company: "サンプルソフト株式会社", title: "会員アプリのプッシュ通知 API", ordered: 750_000, inspected: 750_000, invoice_no: "INV-MATSUDA-2026-10", invoice_at: "2026-11-01", payment_due: "2026-11-30", paid_at: "2026-11-25", paid_amount: 750_000, status: "paid" },
  { order_id: "ORD-0101", client_company: "サンプルソフト株式会社", title: "受注一覧の CSV 出力", ordered: 450_000, inspected: 0, payment_due: "2026-12-31", status: "notDue" },
  { order_id: "ORD-0106", client_company: "サンプルソフト株式会社", title: "受注検索の絞り込み条件の追加", ordered: 180_000, inspected: 0, payment_due: "2027-01-31", status: "notDue" },
  { order_id: "ORD-0201", client_company: "デモラボ合同会社", title: "コーポレートサイトの問い合わせフォーム", ordered: 250_000, inspected: 0, payment_due: "2027-01-31", status: "notDue" },
];

/** 松田さんの追加の質問（回答待ち・作業停止の例） */
const extraQuestions: Inquiry[] = [
  {
    id: "INQ-0040",
    project: "order-renewal",
    order_id: "ORD-0106",
    from: "freelancer",
    asker_id: CURRENT_FREELANCER_ID,
    subject: "【作業を進められません】担当営業所の一覧の取得元",
    body: "担当営業所の絞り込みに使う営業所の一覧を、どの API から取得するかが仕様に見当たりません。12/2 までに分からないと納期に影響します。暫定案: 受注データにある営業所コードから一覧を作る。",
    status: "askingCustomer",
    owner_id: "u-aoki",
    deputy_id: "u-kimura",
    due: "2026-11-29",
    audience: "freelancer",
  },
  {
    id: "INQ-0041",
    project: "order-renewal",
    order_id: "ORD-0105",
    from: "freelancer",
    asker_id: CURRENT_FREELANCER_ID,
    subject: "新しいロゴ画像の解像度",
    body: "差し替えるロゴ画像は、印刷用に 300dpi 以上のものをいただけますか。",
    status: "received",
    owner_id: "u-aoki",
    due: "2026-11-30",
    audience: "freelancer",
  },
];

/** 受託者本人の質問（受付番号・回答予定つき）。共有の問い合わせ台帳から本人の分だけ */
export const myQuestions = () => [...extraQuestions, ...inquiries.filter((q) => q.asker_id === CURRENT_FREELANCER_ID)];

/** 質問の詳細の補足（受付と回答予定） */
export const questionMeta: Record<string, { received_at: string; answer_expected: string; blocker?: { until: string; blocked: string; workaround: string }; timeline: { at: string; text: string }[] }> = {
  "INQ-0040": {
    received_at: "2026-11-27T09:10:00+09:00",
    answer_expected: "2026-11-29",
    blocker: { until: "2026-12-02", blocked: "担当営業所での絞り込み", workaround: "受注データにある営業所コードから一覧を作る" },
    timeline: [
      { at: "2026-11-27T09:10:00+09:00", text: "窓口が受け付けました（受付番号 INQ-0040）" },
      { at: "2026-11-27T09:40:00+09:00", text: "窓口が発注企業へ確認しています。回答予定は 11/29 です" },
    ],
  },
  "INQ-0041": {
    received_at: "2026-11-27T10:05:00+09:00",
    answer_expected: "2026-11-30",
    timeline: [{ at: "2026-11-27T10:05:00+09:00", text: "窓口が受け付けました（受付番号 INQ-0041）" }],
  },
  "INQ-0031": {
    received_at: "2026-11-18T13:00:00+09:00",
    answer_expected: "2026-11-20",
    timeline: [
      { at: "2026-11-18T13:00:00+09:00", text: "窓口が受け付けました（受付番号 INQ-0031）" },
      { at: "2026-11-18T13:30:00+09:00", text: "窓口が発注企業へ確認しています" },
      { at: "2026-11-19T16:00:00+09:00", text: "回答が確定しました" },
    ],
  },
};

/** 連携できる Git サービス（参照の取込元） */
export const gitSources = [
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "azureRepos", label: "Azure Repos" },
  { value: "codecommit", label: "AWS CodeCommit" },
];
