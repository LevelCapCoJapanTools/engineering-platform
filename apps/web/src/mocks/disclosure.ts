// 顧客への公開と共同経営の架空データ（2026-11-28 追補、資料 6.F 37〜41、6.G 46）。
// 基準日は 2026-11-27。金額は円（税抜）。共有データ（mocks/engagement.ts）は読み取りのみ。
import type { Audience, DisclosureStatus, Relationship } from "../lib/vocab";

/** 案件と顧客企業の関係（U-01）。共有データにない「同じ会社の別案件」を加える */
export type ProjectRelation = {
  project: string;
  project_name: string;
  customer_company: string;
  relationship: Relationship;
  contract_parties: string[];
  contracts: { id: string; title: string; period: string }[];
  jv_lead_id: string;
  customer_lead_id: string;
  invite: { status: "notInvited" | "invited" | "joined"; invited_at?: string; visible: string };
  /** この案件で公開している費目（他案件の費目は混ざらない） */
  cost_items: string[];
};

export const projectRelations: ProjectRelation[] = [
  {
    project: "order-renewal",
    project_name: "受発注システム刷新",
    customer_company: "架空商事株式会社",
    relationship: "outsourcing",
    contract_parties: ["架空商事株式会社（発注者）", "サンプルソフト株式会社（受注者）"],
    contracts: [
      { id: "CT-0011", title: "システム開発基本契約", period: "2026-06-01〜2027-05-31" },
      { id: "CT-0012", title: "個別契約（受発注システム刷新）", period: "2026-06-01〜2027-03-31" },
    ],
    jv_lead_id: "u-kimura",
    customer_lead_id: "u-nakamura",
    invite: { status: "joined", invited_at: "2026-05-20T10:00:00+09:00", visible: "公開設定に従う（PUB-0003）" },
    cost_items: ["契約額"],
  },
  {
    project: "member-app-api",
    project_name: "会員アプリ API 開発",
    customer_company: "架空リテール株式会社",
    relationship: "alliance",
    contract_parties: ["架空リテール株式会社（発注者・提携先）", "サンプルソフト株式会社（受注者・提携先）"],
    contracts: [
      { id: "CT-0021", title: "業務提携契約（会員アプリ共同事業）", period: "2026-07-01〜2028-06-30" },
      { id: "CT-0022", title: "個別契約（会員アプリ API 開発）", period: "2026-07-01〜2027-01-29" },
    ],
    jv_lead_id: "u-mori",
    customer_lead_id: "u-fujii",
    invite: { status: "joined", invited_at: "2026-07-01T10:00:00+09:00", visible: "公開設定に従う（PUB-0007）" },
    cost_items: ["契約額", "共同試験費", "ストア掲載素材の制作費"],
  },
  {
    project: "retail-pos-renewal",
    project_name: "店舗 POS の帳票改修",
    customer_company: "架空リテール株式会社",
    relationship: "outsourcing",
    contract_parties: ["架空リテール株式会社（発注者）", "サンプルソフト株式会社（受注者）"],
    contracts: [{ id: "CT-0031", title: "個別契約（POS 帳票改修）", period: "2026-12-01〜2027-02-28" }],
    jv_lead_id: "u-ishii",
    customer_lead_id: "u-fujii",
    invite: { status: "invited", invited_at: "2026-11-26T14:00:00+09:00", visible: "案件名と招待内容のみ" },
    cost_items: ["契約額"],
  },
];

/** 公開できる項目の候補（U-02）。contract_allows は契約上の開示範囲 */
export type DisclosureItem = {
  key: string;
  label: string;
  group: "進捗・日程" | "契約・金額" | "資料" | "共同経営" | "社内";
  contract_allows: Record<Relationship, boolean>;
  blocked_reason?: string;
  recommended: boolean;
  granularity?: string[];
  attachment_version?: string;
  newly_added?: boolean;
  /** 社内の機微情報（初期非公開） */
  sensitive?: boolean;
};

export const disclosureItems: DisclosureItem[] = [
  { key: "progress", label: "納入物ごとの進捗", group: "進捗・日程", contract_allows: { outsourcing: true, alliance: true }, recommended: true, granularity: ["納入物ごと", "マイルストーンごと"] },
  { key: "milestones", label: "合意した納期と納入見込み", group: "進捗・日程", contract_allows: { outsourcing: true, alliance: true }, recommended: true, granularity: ["確約日と見込み", "確約日のみ"] },
  { key: "contract_amount", label: "契約額", group: "契約・金額", contract_allows: { outsourcing: true, alliance: true }, recommended: true },
  { key: "acceptance", label: "納入・受入の状況", group: "進捗・日程", contract_allows: { outsourcing: true, alliance: true }, recommended: false },
  { key: "release_notes", label: "リリース説明（承認済みの版）", group: "資料", contract_allows: { outsourcing: true, alliance: true }, recommended: false, attachment_version: "rel-140 説明 v2" },
  { key: "sow", label: "SOW（合意版）", group: "資料", contract_allows: { outsourcing: true, alliance: true }, recommended: false, attachment_version: "SOW v3" },
  { key: "joint_cost", label: "共同費目の予算・実績・各社負担額", group: "共同経営", contract_allows: { outsourcing: false, alliance: true }, blocked_reason: "外注取引型の契約には共同費目の取決めがありません", recommended: false, granularity: ["費目ごと・月次", "費目ごと・累計"] },
  { key: "joint_roadmap", label: "共同ロードマップ", group: "共同経営", contract_allows: { outsourcing: false, alliance: true }, blocked_reason: "外注取引型の契約には共同ロードマップの取決めがありません", recommended: false },
  { key: "internal_budget", label: "JV内部予算", group: "社内", contract_allows: { outsourcing: false, alliance: false }, blocked_reason: "契約上の開示範囲の外です（初期非公開）", recommended: false, sensitive: true },
  { key: "unit_price", label: "外注単価・個人別報酬", group: "社内", contract_allows: { outsourcing: false, alliance: false }, blocked_reason: "契約上の開示範囲の外です。受託者本人にだけ表示します", recommended: false, sensitive: true },
  { key: "margin", label: "粗利・粗利率", group: "社内", contract_allows: { outsourcing: false, alliance: false }, blocked_reason: "契約上の開示範囲の外です（初期非公開）", recommended: false, sensitive: true },
  { key: "internal_meeting", label: "社内会議資料", group: "社内", contract_allows: { outsourcing: false, alliance: false }, blocked_reason: "契約上の開示範囲の外です（初期非公開）", recommended: false, sensitive: true },
  { key: "risk_reserve", label: "予備費（12月に追加した社内費目）", group: "社内", contract_allows: { outsourcing: false, alliance: true }, recommended: false, newly_added: true, sensitive: true },
  { key: "test_report", label: "結合テスト報告書", group: "資料", contract_allows: { outsourcing: true, alliance: true }, recommended: false, attachment_version: "v1（11/26 追加）", newly_added: true },
];

/** 公開の相手（U-02, U-03） */
export const audiences = [
  { key: "kakuu-lead", company: "架空商事株式会社", role: "発注側プロジェクト責任者", person_id: "u-nakamura", project: "order-renewal" },
  { key: "kakuu-viewer", company: "架空商事株式会社", role: "発注側担当者", person_id: "u-noguchi", project: "order-renewal" },
  { key: "kakuu-approver", company: "架空商事株式会社", role: "発注側承認者", person_id: "u-komatsu", project: "order-renewal" },
  { key: "retail-lead", company: "架空リテール株式会社", role: "発注側プロジェクト責任者", person_id: "u-fujii", project: "member-app-api" },
];

/** 公開版（確定した版は元資料を更新しても変わらない） */
export type PublishedVersion = {
  id: string;
  project: string;
  audience: string;
  status: DisclosureStatus;
  items: string[];
  fixed_at: string;
  fixed_by: string;
  expires: string;
  source_note: string;
};

export const publishedVersions: PublishedVersion[] = [
  { id: "PUB-0003", project: "order-renewal", audience: "架空商事株式会社・全役割", status: "published", items: ["progress", "milestones", "contract_amount", "acceptance", "release_notes"], fixed_at: "2026-11-20T18:00:00+09:00", fixed_by: "u-kimura", expires: "2027-03-31", source_note: "元資料（社内の進捗表）は 11/26 に更新済み。公開版は 11/20 時点のまま" },
  { id: "PUB-0002", project: "order-renewal", audience: "架空商事株式会社・全役割", status: "expired", items: ["progress", "milestones", "contract_amount"], fixed_at: "2026-10-01T10:00:00+09:00", fixed_by: "u-kimura", expires: "2026-11-20", source_note: "PUB-0003 で置換" },
  { id: "PUB-0007", project: "member-app-api", audience: "架空リテール株式会社・全役割", status: "published", items: ["progress", "milestones", "contract_amount", "joint_cost", "joint_roadmap"], fixed_at: "2026-11-15T10:00:00+09:00", fixed_by: "u-mori", expires: "2028-06-30", source_note: "共同費目は月次の集計のみ" },
];

/** 公開前の混入検査（U-03）。各経路で非公開値・原本URLが出ないか */
export const leakChannels = ["画面", "API", "検索", "CSV 書き出し", "カレンダー購読", "通知文面", "AI 回答"] as const;
export type LeakResult = { channel: (typeof leakChannels)[number]; ok: boolean; detail: string };

export const leakChecksClean: LeakResult[] = leakChannels.map((c) => ({ channel: c, ok: true, detail: "非公開値・原本URLの混入なし" }));
export const leakChecksDetected: LeakResult[] = leakChannels.map((c) =>
  c === "CSV 書き出し"
    ? { channel: c, ok: false, detail: "「粗利率」列が含まれています（進捗表テンプレート v4 の新しい列）" }
    : c === "AI 回答"
      ? { channel: c, ok: false, detail: "回答例に社内会議資料の要約（MTG-14）が引用されています" }
      : { channel: c, ok: true, detail: "非公開値・原本URLの混入なし" },
);

/** 合計からの逆算の検査 */
export const inferenceChecks = [
  { label: "契約額 − 公開した費目の合計 から内部予算を逆算できない", ok: true },
  { label: "粗利率・単価が、公開した2つの値の比から求まらない", ok: true },
  { label: "絞込み結果の件数・合計から非公開費目を推測できない", ok: true },
];

/** 公開設定の変更履歴・閲覧・配信の記録（U-04） */
export const disclosureChanges = [
  { id: "DCH-012", at: "2026-11-26T17:40:00+09:00", by: "u-kimura", target: "PUB-0003 · 結合テスト報告書", change: "非公開のまま（公開候補から外す）", reason: "社内レビュー前のため" },
  { id: "DCH-011", at: "2026-11-20T18:00:00+09:00", by: "u-kimura", target: "PUB-0003", change: "公開版を確定（5項目）", reason: "11月の定例前に受入状況を追加" },
  { id: "DCH-010", at: "2026-11-20T17:55:00+09:00", by: "u-kimura", target: "PUB-0002", change: "公開停止（PUB-0003 へ置換）", reason: "版の更新" },
  { id: "DCH-009", at: "2026-11-15T10:00:00+09:00", by: "u-mori", target: "PUB-0007 · 共同費目", change: "共同試験費・素材制作費を追加（月次集計）", reason: "提携契約 CT-0021 第8条" },
];

export const disclosureAccess = [
  { id: "ACC-2101", at: "2026-11-27T09:10:00+09:00", who: "u-nakamura", action: "閲覧", target: "案件ホーム（PUB-0003）", channel: "画面" },
  { id: "ACC-2100", at: "2026-11-26T15:30:00+09:00", who: "u-noguchi", action: "ダウンロード", target: "リリース説明 rel-140 v2.pdf", channel: "画面" },
  { id: "ACC-2099", at: "2026-11-25T08:00:00+09:00", who: "u-komatsu", action: "購読の取得", target: "予定（PUB-0003）", channel: "カレンダー購読" },
  { id: "ACC-2098", at: "2026-11-24T19:05:00+09:00", who: "u-fujii", action: "CSV 書き出し", target: "共同費目（10月）", channel: "CSV" },
];

export const disclosureDeliveries = [
  { id: "OUT-551", at: "2026-11-25T09:00:00+09:00", to: "架空商事 3名", channel: "メール", content: "週次の進捗（PUB-0003）", status: "delivered" as const },
  { id: "OUT-552", at: "2026-11-27T09:00:00+09:00", to: "架空商事 #共同 チャンネル", channel: "Microsoft Teams", content: "納入見込みの更新（PUB-0003）", status: "failed" as const },
  { id: "OUT-560", at: "2026-12-02T09:00:00+09:00", to: "架空商事 3名", channel: "メール", content: "週次の進捗（予約）", status: "scheduled" as const },
  { id: "OUT-561", at: "2026-12-01T09:00:00+09:00", to: "架空リテール 2名", channel: "メール", content: "共同費目 11月分（予約）", status: "scheduled" as const },
];

/** 業務提携の共同決裁（U-05, X-16） */
export type JointApproval = {
  id: string;
  title: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "returned";
  due: string;
  approvals: { company: string; approver_id: string; role: string; status: "pending" | "approved" | "returned"; at?: string; comment?: string }[];
};

export const jointApprovals: JointApproval[] = [
  {
    id: "JDC-004",
    title: "共同試験費の上限を 80万円 → 100万円に改訂",
    amount: 200_000,
    reason: "決済連携の追加試験（2週間）。上限 80万円を超えるため共同決裁",
    status: "pending",
    due: "2026-12-04",
    approvals: [
      { company: "サンプルソフト株式会社", approver_id: "u-mori", role: "受注側統括責任者", status: "approved", at: "2026-11-26T11:00:00+09:00", comment: "折半を維持して承認" },
      { company: "架空リテール株式会社", approver_id: "u-fujii", role: "発注側プロジェクト責任者", status: "pending" },
    ],
  },
  {
    id: "JDC-003",
    title: "ストア掲載素材の制作費を架空リテールが全額負担",
    amount: 300_000,
    reason: "素材の権利を架空リテールが保有するため（提携契約 CT-0021 第9条）",
    status: "approved",
    due: "2026-10-20",
    approvals: [
      { company: "サンプルソフト株式会社", approver_id: "u-mori", role: "受注側統括責任者", status: "approved", at: "2026-10-15T10:00:00+09:00" },
      { company: "架空リテール株式会社", approver_id: "u-fujii", role: "発注側プロジェクト責任者", status: "approved", at: "2026-10-16T14:00:00+09:00" },
    ],
  },
];

/** 共同費目の承認上限（提携契約で定めた値） */
export const jointLimits: Record<string, number> = { "共同試験費": 800_000, "ストア掲載素材の制作費": 300_000 };

/** 共同費目の月次実績 */
export const jointMonthly = [
  { month: "2026-09", item: "共同試験費", actual: 120_000 },
  { month: "2026-10", item: "共同試験費", actual: 180_000 },
  { month: "2026-11", item: "共同試験費", actual: 220_000 },
  { month: "2026-10", item: "ストア掲載素材の制作費", actual: 300_000 },
];

export const audienceOf = (key: string): Audience => (key === "joint_cost" || key === "joint_roadmap" ? "alliance" : "customer");
