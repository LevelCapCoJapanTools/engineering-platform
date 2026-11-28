// 契約と知的資産の架空データ（2026-11-28 追補、画面群 6.22）。
// 実在の会社・人名・契約書本文を含めない。条項の文面は短い架空の要約。
// 契約は当事者ごとに分け、受注側（JV）とフリーエンジニアの契約は顧客に公開しない。
import type { ContractStatus, IpDisposition } from "../lib/vocab";

export const JV_COMPANY = "サンプルソフト株式会社";

export type ContractKind = "master" | "individual" | "alliance" | "amendment" | "freelance";
export const CONTRACT_KIND: Record<ContractKind, string> = {
  master: "基本契約",
  individual: "個別契約",
  alliance: "業務提携契約",
  amendment: "変更覚書",
  freelance: "受託者との契約",
};

export type ClauseComment = {
  id: string;
  company: string;
  author_id: string;
  body: string;
  /** internal=自社内の検討メモ（相手に見せない）、counterparty=相手に提示した文面 */
  audience: "internal" | "counterparty";
  at: string;
};

export type Clause = {
  id: string;
  no: string;
  title: string;
  before?: string;
  after: string;
  /** agreed=合意済み、open=協議中、changed=改訂により再確認が必要 */
  state: "agreed" | "open" | "changed" | "unchanged";
  owner_id?: string;
  comments: ClauseComment[];
  /** 改訂前の版で記録された確認結果（改訂後の条項には引き継がない） */
  prior_review?: string;
};

export type Signer = { user_id: string; company: string; status: "pending" | "sent" | "viewed" | "signed" | "declined"; at?: string };

export type SignEvent = { id: string; at: string; kind: "sent" | "viewed" | "signed" | "declined" | "duplicate" | "mismatch" | "completed"; detail: string; doc_version?: number; applied: boolean };

export type Contract = {
  id: string;
  project: string;
  kind: ContractKind;
  title: string;
  parties: string[];
  status: ContractStatus;
  version: number;
  period: { start: string; end: string };
  /** 関連する契約・発注・要求の版 */
  related: string[];
  parent_id?: string;
  /** 顧客に公開するか（受託者との契約は常に false） */
  customer_visible: boolean;
  /** 業務上の確認（各社の担当） */
  reviews: { company: string; reviewer_id: string; status: "pending" | "done"; at?: string; doc_version: number }[];
  signers: Signer[];
  sign_events: SignEvent[];
  signed_at?: string;
  original_sha256?: string;
  certificate_id?: string;
  clauses: Clause[];
};

export const contracts: Contract[] = [
  {
    id: "CT-001",
    project: "order-renewal",
    kind: "master",
    title: "ソフトウェア開発業務 基本契約",
    parties: ["架空商事株式会社", JV_COMPANY],
    status: "signed",
    version: 1,
    period: { start: "2026-06-01", end: "2027-05-31" },
    related: ["SOW v1"],
    customer_visible: true,
    reviews: [
      { company: "架空商事株式会社", reviewer_id: "u-sakai", status: "done", at: "2026-05-25T10:00:00+09:00", doc_version: 1 },
      { company: JV_COMPANY, reviewer_id: "u-kimura", status: "done", at: "2026-05-24T18:00:00+09:00", doc_version: 1 },
    ],
    signers: [
      { user_id: "u-sakai", company: "架空商事株式会社", status: "signed", at: "2026-05-28T11:00:00+09:00" },
      { user_id: "u-kimura", company: JV_COMPANY, status: "signed", at: "2026-05-28T15:20:00+09:00" },
    ],
    sign_events: [],
    signed_at: "2026-05-28T15:20:00+09:00",
    original_sha256: "4b1d0c2e9a7f3e5d6c8b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d",
    certificate_id: "ESIGN-CERT-20260528-0031",
    clauses: [],
  },
  {
    id: "CT-002",
    project: "order-renewal",
    kind: "individual",
    title: "個別契約（受発注システム刷新）",
    parties: ["架空商事株式会社", JV_COMPANY],
    status: "signed",
    version: 2,
    period: { start: "2026-06-01", end: "2027-03-31" },
    related: ["CT-001", "SOW v3", "MS-106"],
    parent_id: "CT-001",
    customer_visible: true,
    reviews: [
      { company: "架空商事株式会社", reviewer_id: "u-nakamura", status: "done", at: "2026-09-02T10:00:00+09:00", doc_version: 2 },
      { company: JV_COMPANY, reviewer_id: "u-kimura", status: "done", at: "2026-09-01T17:00:00+09:00", doc_version: 2 },
    ],
    signers: [
      { user_id: "u-sakai", company: "架空商事株式会社", status: "signed", at: "2026-09-04T10:00:00+09:00" },
      { user_id: "u-kimura", company: JV_COMPANY, status: "signed", at: "2026-09-04T13:00:00+09:00" },
    ],
    sign_events: [],
    signed_at: "2026-09-04T13:00:00+09:00",
    original_sha256: "9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d",
    certificate_id: "ESIGN-CERT-20260904-0112",
    clauses: [],
  },
  {
    id: "CT-003",
    project: "order-renewal",
    kind: "amendment",
    title: "変更覚書（成果物の知的財産権の帰属）",
    parties: ["架空商事株式会社", JV_COMPANY],
    status: "negotiating",
    version: 3,
    period: { start: "2026-12-01", end: "2027-03-31" },
    related: ["CT-002 §12", "IP-101", "IP-102", "IP-103"],
    parent_id: "CT-002",
    customer_visible: true,
    reviews: [
      { company: "架空商事株式会社", reviewer_id: "u-nakamura", status: "pending", doc_version: 3 },
      { company: JV_COMPANY, reviewer_id: "u-kimura", status: "done", at: "2026-11-26T17:30:00+09:00", doc_version: 3 },
    ],
    signers: [
      { user_id: "u-sakai", company: "架空商事株式会社", status: "pending" },
      { user_id: "u-kimura", company: JV_COMPANY, status: "pending" },
    ],
    sign_events: [],
    clauses: [
      {
        id: "C-1", no: "第1条", title: "目的", state: "unchanged",
        after: "個別契約第12条（成果物の権利）を、資産の種類ごとの扱いに改める。",
        comments: [],
      },
      {
        id: "C-2", no: "第2条", title: "新規に作成した成果物",
        before: "新規に作成した成果物の著作権は、検収の完了をもって発注者に移転する。",
        after: "新規に作成した画面デザインと業務ロジックの著作権は、当該成果物の検収と対価の支払が完了した時点で発注者に移転する。",
        state: "changed", owner_id: "u-sakai",
        prior_review: "v2 で「検収の完了をもって移転」を架空商事の法務が確認済み（2026-11-20）。v3 で発効条件に支払を加えたため、再確認が必要",
        comments: [
          { id: "CM-1", company: JV_COMPANY, author_id: "u-kimura", body: "移転の時点を検収と支払の両方の完了に揃えたいと提案します。", audience: "counterparty", at: "2026-11-26T17:00:00+09:00" },
          { id: "CM-2", company: JV_COMPANY, author_id: "u-kimura", body: "（社内メモ）支払サイトが長い場合の扱いを顧客に確認すること。", audience: "internal", at: "2026-11-26T17:05:00+09:00" },
        ],
      },
      {
        id: "C-3", no: "第3条", title: "受注側が従前から保有する部品",
        before: "（規定なし）",
        after: "受注側が従前から保有する帳票出力部品の権利は受注側に留保し、発注者に本システムでの利用を無償で許諾する。",
        state: "open", owner_id: "u-sakai",
        comments: [
          { id: "CM-3", company: "架空商事株式会社", author_id: "u-sakai", body: "許諾の範囲に将来の改修を含めるか確認させてください。", audience: "counterparty", at: "2026-11-27T09:40:00+09:00" },
          { id: "CM-4", company: "架空商事株式会社", author_id: "u-sakai", body: "（社内メモ）他システムでの再利用も求めたい。", audience: "internal", at: "2026-11-27T09:45:00+09:00" },
        ],
      },
      {
        id: "C-4", no: "第4条", title: "第三者の素材", state: "agreed",
        before: "（規定なし）",
        after: "第三者の素材とオープンソースは、各ライセンスの条件に従って利用し、利用条件の一覧を納入時に交付する。",
        owner_id: "u-kimura",
        comments: [{ id: "CM-5", company: "架空商事株式会社", author_id: "u-nakamura", body: "この内容で問題ありません。", audience: "counterparty", at: "2026-11-25T10:00:00+09:00" }],
      },
    ],
  },
  {
    id: "CT-004",
    project: "order-renewal",
    kind: "amendment",
    title: "変更覚書（CR-0004 上限額の税込判定）",
    parties: ["架空商事株式会社", JV_COMPANY],
    status: "signing",
    version: 1,
    period: { start: "2026-12-01", end: "2027-03-31" },
    related: ["CT-002", "CR-0004", "DEC-0031"],
    parent_id: "CT-002",
    customer_visible: true,
    reviews: [
      { company: "架空商事株式会社", reviewer_id: "u-komatsu", status: "done", at: "2026-11-27T09:00:00+09:00", doc_version: 1 },
      { company: JV_COMPANY, reviewer_id: "u-kimura", status: "done", at: "2026-11-26T18:00:00+09:00", doc_version: 1 },
    ],
    signers: [
      { user_id: "u-sakai", company: "架空商事株式会社", status: "viewed", at: "2026-11-27T10:05:00+09:00" },
      { user_id: "u-kimura", company: JV_COMPANY, status: "signed", at: "2026-11-27T09:30:00+09:00" },
    ],
    sign_events: [
      { id: "SE-1", at: "2026-11-27T09:10:00+09:00", kind: "sent", detail: "確定版 v1 を署名者2名に送付", doc_version: 1, applied: true },
      { id: "SE-2", at: "2026-11-27T09:30:00+09:00", kind: "signed", detail: "木村 達也が署名（文書 v1）", doc_version: 1, applied: true },
      { id: "SE-3", at: "2026-11-27T09:31:00+09:00", kind: "duplicate", detail: "同じ署名完了の通知を再受信。記録済みのため反映しない", doc_version: 1, applied: false },
      { id: "SE-4", at: "2026-11-27T10:05:00+09:00", kind: "viewed", detail: "酒井 隆が文書を開封", doc_version: 1, applied: true },
    ],
    clauses: [
      { id: "C-1", no: "第1条", title: "変更内容", before: "上限額は税抜金額で判定する。", after: "上限額は税込金額で判定する。", state: "agreed", owner_id: "u-kimura", comments: [] },
      { id: "C-2", no: "第2条", title: "追加費用", before: "（規定なし）", after: "本変更の対価として 1,200,000 円（税抜）を追加する。", state: "agreed", owner_id: "u-kimura", comments: [] },
    ],
  },
  {
    id: "CT-F01",
    project: "order-renewal",
    kind: "freelance",
    title: "業務委託基本契約（松田 亮）",
    parties: [JV_COMPANY, "松田 亮（個人事業主）"],
    status: "signed",
    version: 1,
    period: { start: "2026-09-01", end: "2027-08-31" },
    related: ["ORD-0101", "ORD-0104"],
    customer_visible: false,
    reviews: [{ company: JV_COMPANY, reviewer_id: "u-kimura", status: "done", at: "2026-08-28T10:00:00+09:00", doc_version: 1 }],
    signers: [
      { user_id: "u-matsuda", company: "松田 亮（個人事業主）", status: "signed", at: "2026-08-30T20:00:00+09:00" },
      { user_id: "u-kimura", company: JV_COMPANY, status: "signed", at: "2026-08-31T09:00:00+09:00" },
    ],
    sign_events: [],
    signed_at: "2026-08-31T09:00:00+09:00",
    original_sha256: "1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e",
    certificate_id: "ESIGN-CERT-20260831-0077",
    clauses: [],
  },
  {
    id: "CT-F02",
    project: "order-renewal",
    kind: "freelance",
    title: "業務委託基本契約（林 由香）",
    parties: [JV_COMPANY, "林 由香（個人事業主）"],
    status: "signed",
    version: 1,
    period: { start: "2026-10-10", end: "2027-10-09" },
    related: ["ORD-0102"],
    customer_visible: false,
    reviews: [{ company: JV_COMPANY, reviewer_id: "u-kimura", status: "done", at: "2026-10-08T10:00:00+09:00", doc_version: 1 }],
    signers: [
      { user_id: "u-hayashi", company: "林 由香（個人事業主）", status: "signed", at: "2026-10-09T21:00:00+09:00" },
      { user_id: "u-kimura", company: JV_COMPANY, status: "signed", at: "2026-10-10T09:00:00+09:00" },
    ],
    sign_events: [],
    signed_at: "2026-10-10T09:00:00+09:00",
    clauses: [],
  },
  {
    id: "CT-101",
    project: "member-app-api",
    kind: "alliance",
    title: "会員アプリ共同事業 業務提携契約",
    parties: ["架空リテール株式会社", JV_COMPANY],
    status: "signed",
    version: 1,
    period: { start: "2026-07-01", end: "2028-06-30" },
    related: ["共同試験費", "BC-0005"],
    customer_visible: true,
    reviews: [
      { company: "架空リテール株式会社", reviewer_id: "u-fujii", status: "done", at: "2026-06-25T10:00:00+09:00", doc_version: 1 },
      { company: JV_COMPANY, reviewer_id: "u-mori", status: "done", at: "2026-06-24T10:00:00+09:00", doc_version: 1 },
    ],
    signers: [
      { user_id: "u-fujii", company: "架空リテール株式会社", status: "signed", at: "2026-06-28T10:00:00+09:00" },
      { user_id: "u-kimura", company: JV_COMPANY, status: "signed", at: "2026-06-29T10:00:00+09:00" },
    ],
    sign_events: [],
    signed_at: "2026-06-29T10:00:00+09:00",
    original_sha256: "7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b",
    certificate_id: "ESIGN-CERT-20260629-0009",
    clauses: [],
  },
  {
    id: "CT-102",
    project: "member-app-api",
    kind: "amendment",
    title: "共同開発覚書（会員アプリの権利の取扱い）",
    parties: ["架空リテール株式会社", JV_COMPANY],
    status: "declined",
    version: 2,
    period: { start: "2026-12-01", end: "2028-06-30" },
    related: ["CT-101", "IP-201", "IP-202", "IP-203"],
    parent_id: "CT-101",
    customer_visible: true,
    reviews: [
      { company: "架空リテール株式会社", reviewer_id: "u-fujii", status: "done", at: "2026-11-24T10:00:00+09:00", doc_version: 2 },
      { company: JV_COMPANY, reviewer_id: "u-mori", status: "done", at: "2026-11-23T10:00:00+09:00", doc_version: 2 },
    ],
    signers: [
      { user_id: "u-fujii", company: "架空リテール株式会社", status: "declined", at: "2026-11-26T11:00:00+09:00" },
      { user_id: "u-kimura", company: JV_COMPANY, status: "signed", at: "2026-11-25T10:00:00+09:00" },
    ],
    sign_events: [
      { id: "SE-11", at: "2026-11-25T09:00:00+09:00", kind: "sent", detail: "確定版 v2 を署名者2名に送付", doc_version: 2, applied: true },
      { id: "SE-12", at: "2026-11-25T10:00:00+09:00", kind: "signed", detail: "木村 達也が署名（文書 v2）", doc_version: 2, applied: true },
      { id: "SE-13", at: "2026-11-26T11:00:00+09:00", kind: "declined", detail: "藤井 晃が署名を辞退。理由「共同保有の持分を再協議したい」", doc_version: 2, applied: true },
    ],
    clauses: [],
  },
];

export const contractById = (id: string) => contracts.find((c) => c.id === id);

// ---------- 知的資産 ----------

export type IpKind = "code" | "design" | "trademark" | "data" | "document" | "font" | "image";
export const IP_KIND: Record<IpKind, string> = {
  code: "コード",
  design: "デザイン",
  trademark: "商標・ロゴ",
  data: "データ",
  document: "設計・文書",
  font: "フォント",
  image: "画像素材",
};

export type IpOrigin = "new" | "jvExisting" | "customerExisting" | "freelancer" | "thirdParty";
export const IP_ORIGIN: Record<IpOrigin, { label: string; tone: "info" | "neutral" | "warn" | "special" }> = {
  new: { label: "新規作成", tone: "info" },
  jvExisting: { label: "受注側の持込", tone: "neutral" },
  customerExisting: { label: "顧客の持込", tone: "warn" },
  freelancer: { label: "受託者の作成", tone: "info" },
  thirdParty: { label: "第三者の素材", tone: "special" },
};

export type IpShare = { holder: string; ratio: number };

export type IpAsset = {
  id: string;
  project: string;
  deliverable: string;
  name: string;
  kind: IpKind;
  origin: IpOrigin;
  holder: string;
  source: string;
  version: string;
  basis: string;
  disposition: IpDisposition;
  shares: IpShare[];
  /** 全持分を登録する合意か（true なら合計100%が必要） */
  full_allocation: boolean;
  purpose?: string;
  conditions?: string;
  consideration?: string;
  effective_condition?: string;
  rights_check: "confirmed" | "pending" | "missing";
  /** 顧客に公開する明細か */
  customer_visible: boolean;
  note?: string;
};

export const ipAssets: IpAsset[] = [
  { id: "IP-101", project: "order-renewal", deliverable: "受発注システム v1.4.0", name: "受注一覧の CSV 出力機能", kind: "code", origin: "freelancer", holder: JV_COMPANY, source: "sample-soft/order-web@9f3c2a1", version: "v1.4.0", basis: "CT-F01 第8条（受託者から受注側へ譲渡）／CT-003 第2条", disposition: "assign", shares: [{ holder: "架空商事株式会社", ratio: 100 }], full_allocation: true, effective_condition: "検収と対価の支払の完了（CT-003 第2条・協議中）", rights_check: "confirmed", customer_visible: true },
  { id: "IP-102", project: "order-renewal", deliverable: "受発注システム v1.4.0", name: "帳票出力部品（受注側の既存部品）", kind: "code", origin: "jvExisting", holder: JV_COMPANY, source: "sample-soft/report-kit v3.2", version: "v3.2", basis: "CT-003 第3条（協議中）", disposition: "license", shares: [{ holder: JV_COMPANY, ratio: 100 }], full_allocation: true, purpose: "本システムでの利用", conditions: "改変可。他システムへの再配布不可（協議中）", consideration: "無償", effective_condition: "覚書の締結", rights_check: "confirmed", customer_visible: true },
  { id: "IP-103", project: "order-renewal", deliverable: "受発注システム v1.4.0", name: "架空商事のロゴ", kind: "trademark", origin: "customerExisting", holder: "架空商事株式会社", source: "顧客支給 2026-06-10", version: "2024年版", basis: "CT-001 第9条（支給物の利用許諾）", disposition: "retain", shares: [{ holder: "架空商事株式会社", ratio: 100 }], full_allocation: true, purpose: "本システムの画面表示", conditions: "表示目的に限る", rights_check: "confirmed", customer_visible: true },
  { id: "IP-104", project: "order-renewal", deliverable: "受発注システム v1.4.0", name: "CSV 解析ライブラリ（オープンソース）", kind: "code", origin: "thirdParty", holder: "第三者（オープンソース）", source: "パッケージ csv-parse 5.x", version: "5.6.0", basis: "MIT ライセンス", disposition: "license", shares: [], full_allocation: false, conditions: "著作権表示とライセンス文の同梱", rights_check: "confirmed", customer_visible: true },
  { id: "IP-105", project: "order-renewal", deliverable: "受発注システム v1.4.0", name: "画面用アイコン素材", kind: "image", origin: "thirdParty", holder: "第三者（素材提供サイト）", source: "素材サイトの購入ライセンス（受注側の契約）", version: "—", basis: "素材サイトの利用規約（再配布の可否が未確認）", disposition: "license", shares: [], full_allocation: false, conditions: "再配布の許諾を確認中", rights_check: "pending", customer_visible: true, note: "納入物に同梱して再配布できるか、許諾の証跡がありません" },
  { id: "IP-106", project: "order-renewal", deliverable: "移行ツール", name: "旧システムからのデータ移行スクリプト", kind: "code", origin: "new", holder: JV_COMPANY, source: "sample-soft/order-api@tools/migrate", version: "v0.9", basis: "CT-002 第12条", disposition: "undecided", shares: [{ holder: "架空商事株式会社", ratio: 60 }, { holder: JV_COMPANY, ratio: 30 }], full_allocation: true, rights_check: "missing", customer_visible: true, note: "持分の合計が 90% で、全持分の登録になっていません" },
  { id: "IP-201", project: "member-app-api", deliverable: "会員アプリ iOS 1.0", name: "新規の画面デザイン", kind: "design", origin: "new", holder: JV_COMPANY, source: "デザインファイル v12", version: "v12", basis: "CT-102 第5条（未締結）", disposition: "assign", shares: [{ holder: "架空リテール株式会社", ratio: 100 }], full_allocation: true, effective_condition: "検収の完了", rights_check: "confirmed", customer_visible: true },
  { id: "IP-202", project: "member-app-api", deliverable: "会員アプリ iOS 1.0", name: "新規実装（アプリ本体と API）", kind: "code", origin: "new", holder: JV_COMPANY, source: "sample-soft/member-app-api@1a2b3c4", version: "1.0.0", basis: "CT-102 第6条（未締結）", disposition: "joint", shares: [{ holder: "架空リテール株式会社", ratio: 50 }, { holder: JV_COMPANY, ratio: 50 }], full_allocation: true, purpose: "共同事業の範囲での利用", conditions: "第三者への利用許諾は両社の合意が必要", effective_condition: "検収の完了", rights_check: "confirmed", customer_visible: true, note: "開発費の折半とは別に、署名済み契約の条項から登録します" },
  { id: "IP-203", project: "member-app-api", deliverable: "会員アプリ iOS 1.0", name: "認証ライブラリ（受注側の既存部品）", kind: "code", origin: "jvExisting", holder: JV_COMPANY, source: "sample-soft/auth-kit v2.1", version: "v2.1", basis: "CT-102 第7条（未締結）", disposition: "license", shares: [{ holder: JV_COMPANY, ratio: 100 }], full_allocation: true, purpose: "会員アプリ内での利用", conditions: "改変不可・再配布不可", consideration: "共同事業の対価に含む", rights_check: "confirmed", customer_visible: true },
  { id: "IP-204", project: "member-app-api", deliverable: "会員アプリ iOS 1.0", name: "架空リテールのロゴ", kind: "trademark", origin: "customerExisting", holder: "架空リテール株式会社", source: "顧客支給 2026-07-15", version: "2026年版", basis: "CT-101 第11条", disposition: "retain", shares: [{ holder: "架空リテール株式会社", ratio: 100 }], full_allocation: true, purpose: "アプリとストア掲載", rights_check: "confirmed", customer_visible: true },
  { id: "IP-205", project: "member-app-api", deliverable: "会員アプリ iOS 1.0", name: "画像処理ライブラリ（オープンソース）", kind: "code", origin: "thirdParty", holder: "第三者（オープンソース）", source: "パッケージ image-kit 3.x", version: "3.4.1", basis: "Apache License 2.0", disposition: "license", shares: [], full_allocation: false, conditions: "ライセンス文と NOTICE の同梱、変更点の明示", rights_check: "confirmed", customer_visible: true },
];

export const ipById = (id: string) => ipAssets.find((a) => a.id === id);

// ---------- 再委託・第三者ライセンスの照合 ----------

export type LicenseCheck = {
  id: string;
  project: string;
  asset_id: string;
  right: string;
  source_terms: string;
  /** 顧客に提示する権利と照合した結果 */
  result: "ok" | "pending" | "ng";
  reason?: string;
  evidence?: string;
  notice_duty?: string;
  checker_id: string;
  checked_at?: string;
  /** 受託者との契約に基づくもの（委託単価などは顧客に出さない） */
  freelance?: boolean;
};

export const licenseChecks: LicenseCheck[] = [
  { id: "LC-01", project: "order-renewal", asset_id: "IP-101", right: "著作権の発注者への移転", source_terms: "受託者との業務委託基本契約 第8条（成果物の権利を受注側へ譲渡、著作者人格権を行使しない）", result: "ok", evidence: "CT-F01 締結済み原本", checker_id: "u-kimura", checked_at: "2026-11-27T09:50:00+09:00", freelance: true },
  { id: "LC-02", project: "order-renewal", asset_id: "IP-104", right: "納入物への同梱と再配布", source_terms: "MIT ライセンス", result: "ok", evidence: "ライセンス文（パッケージ同梱）", notice_duty: "著作権表示とライセンス文を納入物に同梱", checker_id: "u-kimura", checked_at: "2026-11-26T15:00:00+09:00" },
  { id: "LC-03", project: "order-renewal", asset_id: "IP-105", right: "納入物への同梱と再配布", source_terms: "素材サイトの利用規約（受注側の購入ライセンス）", result: "pending", reason: "再配布の許諾を示す証跡がありません。素材提供元へ照会中（回答期限 2026-12-03）", notice_duty: "クレジット表記の要否を確認中", checker_id: "u-aoki" },
  { id: "LC-04", project: "order-renewal", asset_id: "IP-102", right: "発注者による本システムでの利用", source_terms: "受注側の保有部品（CT-003 第3条で許諾予定）", result: "pending", reason: "覚書が協議中のため、許諾の範囲（将来の改修を含むか）が未確定", checker_id: "u-kimura" },
  { id: "LC-05", project: "member-app-api", asset_id: "IP-202", right: "共同保有の持分", source_terms: "受託者との業務委託基本契約 第8条（受注側へ譲渡）", result: "ok", evidence: "CT-F01 締結済み原本", checker_id: "u-mori", checked_at: "2026-11-20T10:00:00+09:00", freelance: true },
  { id: "LC-06", project: "member-app-api", asset_id: "IP-205", right: "アプリへの同梱と配信", source_terms: "Apache License 2.0", result: "ok", evidence: "ライセンス文と NOTICE", notice_duty: "アプリ内の「ライセンス」画面に表示", checker_id: "u-mori", checked_at: "2026-11-20T10:00:00+09:00" },
];

// ---------- 権利の発効・引渡明細 ----------

export type RightsHandoverItem = {
  id: string;
  project: string;
  asset_id: string;
  delivered_version: string;
  /** 顧客がバイナリ・成果物を受け取った日 */
  received_at?: string;
  /** 契約上の権利が移る（発効する）日 */
  effective_at?: string;
  conditions: { label: string; done: boolean; confirmer_id?: string; at?: string }[];
  state: "effective" | "waiting" | "notApplicable" | "blocked";
  license_notice?: string;
  remaining?: string;
};

export const rightsHandover: RightsHandoverItem[] = [
  { id: "RH-01", project: "order-renewal", asset_id: "IP-101", delivered_version: "v1.4.0-rc1", received_at: "2026-11-27", conditions: [{ label: "委託元の検収（ORD-0101）", done: false }, { label: "顧客の受入（v1.4.0）", done: false }, { label: "対価の支払", done: false }, { label: "覚書 CT-003 の締結", done: false }], state: "waiting", remaining: "覚書の締結待ち。締結後、受入と支払の完了で権利が移ります" },
  { id: "RH-02", project: "order-renewal", asset_id: "IP-102", delivered_version: "v1.4.0-rc1", received_at: "2026-11-27", conditions: [{ label: "覚書 CT-003 の締結", done: false }], state: "waiting", remaining: "利用許諾の範囲を協議中" },
  { id: "RH-03", project: "order-renewal", asset_id: "IP-103", delivered_version: "—", conditions: [], state: "notApplicable", remaining: "顧客の保有資産。権利の移転はありません" },
  { id: "RH-04", project: "order-renewal", asset_id: "IP-104", delivered_version: "v1.4.0-rc1", received_at: "2026-11-27", conditions: [{ label: "ライセンス文の同梱", done: true, confirmer_id: "u-kimura", at: "2026-11-26T15:00:00+09:00" }], state: "effective", license_notice: "MIT（THIRD_PARTY_NOTICES.txt に記載）" },
  { id: "RH-05", project: "order-renewal", asset_id: "IP-105", delivered_version: "v1.4.0-rc1", received_at: "2026-11-27", conditions: [{ label: "再配布の許諾の確認", done: false }], state: "blocked", remaining: "権利確認待ち。許諾が確認できない場合は素材を差し替えます" },
  { id: "RH-11", project: "member-app-api", asset_id: "IP-201", delivered_version: "1.0.0 (12)", received_at: "2026-11-15", effective_at: "2026-11-20", conditions: [{ label: "委託元の検収（ORD-0104）", done: true, confirmer_id: "u-mori", at: "2026-11-07T10:00:00+09:00" }, { label: "顧客の受入", done: true, confirmer_id: "u-fujii", at: "2026-11-20T10:00:00+09:00" }], state: "effective" },
  { id: "RH-12", project: "member-app-api", asset_id: "IP-202", delivered_version: "1.0.0 (12)", received_at: "2026-11-15", conditions: [{ label: "共同開発覚書 CT-102 の締結", done: false }], state: "waiting", remaining: "署名辞退のため再協議中。共同保有の持分は未発効" },
  { id: "RH-13", project: "member-app-api", asset_id: "IP-205", delivered_version: "1.0.0 (12)", received_at: "2026-11-15", effective_at: "2026-11-15", conditions: [{ label: "アプリ内のライセンス表示", done: true, confirmer_id: "u-mori", at: "2026-11-15T10:00:00+09:00" }], state: "effective", license_notice: "Apache License 2.0（アプリの「ライセンス」画面）" },
];
