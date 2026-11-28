// 外部利用者向け（X-01〜X-05）の架空データ
import type { ApprovalRequest } from "../lib/types";

/** 顧客（中村 拓也）宛ての承認待ち */
export const customerApprovals: ApprovalRequest[] = [
  { id: "APR-499", kind: "requirement", target_id: "REQ-0012", title: "発注金額の上限を取引先ごとに設定できる", project_slug: "order-renewal", project_name: "受発注システム刷新", requester_id: "u-takahashi", requested_at: "2026-11-26T11:10:00+09:00", due_at: "2026-11-27" },
  { id: "APR-503", kind: "change", target_id: "CR-0005", title: "ログ保存先のリージョンを国内に限定", project_slug: "order-renewal", project_name: "受発注システム刷新", requester_id: "u-tanaka", requested_at: "2026-11-27T09:00:00+09:00", due_at: "2026-12-04" },
  { id: "APR-490", kind: "acceptance", target_id: "rel-121", title: "v1.2.1 検索不具合の修正の受入", project_slug: "order-renewal", project_name: "受発注システム刷新", requester_id: "u-watanabe", requested_at: "2026-11-20T10:00:00+09:00", due_at: "2026-11-25" },
];

/** X-02 で表示する承認対象 */
export const approvalTargets: Record<string, { kind: "requirement" | "plan" | "change"; target_id: string; title: string; summary: string; before: string; after: string; criteria: string[]; version: string; requester: string; due_at: string }> = {
  "APR-499": {
    kind: "requirement",
    target_id: "REQ-0012",
    title: "発注金額の上限を取引先ごとに設定できる",
    summary: "取引先ごとに「1回の発注で使える上限額」を決められるようにします。上限を超える発注書を作ろうとすると、保存前に警告が表示されます。上限額は購買部の管理者だけが変更できます。",
    before: "取引先ごとに発注上限を設定できる。\n上限を超える場合は警告する。",
    after: "取引先ごとに1回あたりの発注上限額を設定できる。\n上限を超える発注書は、保存前に警告を表示する。\n上限額は購買部の管理者のみ変更できる。",
    criteria: ["取引先の詳細画面で上限額（円、税抜）を設定できる", "上限を超える発注書を保存しようとすると警告が表示される", "購買部の管理者以外は上限額を変更できない"],
    version: "v1 → v2",
    requester: "高橋 健（アナリスト）",
    due_at: "2026-11-27",
  },
  "APR-503": {
    kind: "change",
    target_id: "CR-0005",
    title: "ログ保存先のリージョンを国内に限定",
    summary: "操作ログの保存先を国内のデータセンターに限定します。保存期間（7年）や検索の操作は変わりません。月額の保管費用が約 5% 増える見込みです。",
    before: "操作ログは追記専用ストレージに保存する。",
    after: "操作ログは国内リージョンの追記専用ストレージに保存する。",
    criteria: ["保存先が国内リージョンであることを設定画面で確認できる", "既存のログも 2026-12-20 までに移行される"],
    version: "CR-0005",
    requester: "田中 陽介（設計者）",
    due_at: "2026-12-04",
  },
};

/** X-03 の受入対象 */
export const acceptanceTargets: Record<string, { version: string; title: string; summary: string; released_at: string; deliverables: { name: string; size: string; sha: string }[]; checklist: string[]; known_issues: string[] }> = {
  "rel-121": {
    version: "v1.2.1",
    title: "検索不具合の修正",
    summary: "発注一覧で、期間と取引先を同時に指定すると結果が0件になる不具合を修正しました。画面の操作方法は変わりません。",
    released_at: "2026-10-20T18:00:00+09:00",
    deliverables: [
      { name: "order-system-v1.2.1.zip", size: "48.2 MB", sha: "3b9f0c6a1e7d42f8b5c9a0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1" },
      { name: "リリースノート_v1.2.1.pdf", size: "320 KB", sha: "8c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d" },
      { name: "テスト結果報告書_v1.2.1.pdf", size: "1.1 MB", sha: "f0e1d2c3b4a5968778695a4b3c2d1e0f1a2b3c4d5e6f708192a3b4c5d6e7f809" },
    ],
    checklist: ["検証環境で、期間と取引先を同時に指定して検索できることを確認した", "既存の検索条件（状態のみ・期間のみ）で結果が変わらないことを確認した", "リリースノートの内容を確認した", "テスト結果報告書を確認した"],
    known_issues: ["取引先名に機種依存文字を含む場合、並べ替えの順序が五十音順にならない（v1.4.0 で修正予定）"],
  },
};

/** X-04 で共有されている統制項目（V-02 の閲覧専用版） */
export const sharedControlIds = ["CTL-PM-001", "CTL-PM-002", "CTL-PM-004", "CTL-SI-002", "CTL-SI-003", "CTL-SI-004", "CTL-SI-005", "CTL-SI-007"];

/** X-05 パートナーが管理する顧客組織 */
export const partnerOrgs = [
  { slug: "sample-soft", name: "サンプルソフト株式会社", projects: 4, blocked: 2, missing_evidence: 1, plan: "Team", status: "要対応" },
  { slug: "demo-lab", name: "デモラボ合同会社", projects: 1, blocked: 0, missing_evidence: 0, plan: "Starter", status: "良好" },
  { slug: "example-systems", name: "例示システムズ株式会社", projects: 3, blocked: 1, missing_evidence: 0, plan: "Team", status: "要対応" },
  { slug: "kakuu-dev", name: "架空開発合同会社", projects: 2, blocked: 0, missing_evidence: 3, plan: "Starter", status: "要対応" },
  { slug: "test-works", name: "テストワークス株式会社", projects: 1, blocked: 0, missing_evidence: 0, plan: "Starter", status: "良好" },
];

export const partnerTemplates = [
  { id: "TPL-01", name: "受託開発・標準（Web）", items: 12, used_by: 3, updated_at: "2026-11-10" },
  { id: "TPL-02", name: "小規模保守案件（6人月未満）", items: 7, used_by: 2, updated_at: "2026-10-02" },
  { id: "TPL-03", name: "顧客承認をメールで受ける組織向け", items: 4, used_by: 1, updated_at: "2026-09-14" },
];

// ---- 2026-11-28 追補: 顧客ポータルの拡張（X-01, X-07〜X-11） ----
// 顧客に見せるのは公開済みの値だけ。JV内部予算・外注単価・粗利・受託者の報酬・社内メモはここに置かない。

export type PortalDeliverable = {
  id: string;
  title: string;
  status: "done" | "inProgress" | "waitingCustomer" | "delayRisk";
  committed: string;
  forecast?: string;
  last_checked_at: string;
  impact: string;
  changed?: string;
};

/** 案件ごとの公開済み情報。key は project slug */
export const portalPublished: Record<string, {
  published: boolean;
  invited_at: string;
  invite_note: string;
  next_report: string;
  last_report: string;
  deliverables: PortalDeliverable[];
  decisions: { id: string; title: string; who: string; due: string; request_id?: string }[];
  changes: { at: string; text: string }[];
}> = {
  "order-renewal": {
    published: true,
    invited_at: "2026-06-03T10:00:00+09:00",
    invite_note: "受発注システム刷新の進捗確認と承認のためにご招待しました。",
    next_report: "2026-12-04",
    last_report: "2026-11-27T10:00:00+09:00",
    deliverables: [
      { id: "DLV-01", title: "v1.3.0 発注書 PDF・基幹連携", status: "done", committed: "2026-11-13", last_checked_at: "2026-11-13T18:00:00+09:00", impact: "受入済み（2026-11-20）" },
      { id: "DLV-02", title: "v1.4.0 取引先マスタ・操作ログ・受注一覧 CSV", status: "delayRisk", committed: "2026-12-10", forecast: "2026-12-17", last_checked_at: "2026-11-27T10:15:00+09:00", impact: "受入試験の開始が 12/17 以降になる見込み", changed: "結合テスト環境の準備が 12/1 にずれたため、納入見込みを 12/10 から 12/17 に変更（確約日は 12/10 のまま。調整を依頼中）" },
      { id: "DLV-03", title: "上限額の税込判定（CR-0004）", status: "waitingCustomer", committed: "2026-12-10", last_checked_at: "2026-11-27T09:00:00+09:00", impact: "ご承認後に v1.4.0 へ含めるかを決めます", changed: "追加見積をお送りしました（承認依頼 REQ-C-0012）" },
      { id: "DLV-04", title: "最終受入", status: "inProgress", committed: "2027-02-26", forecast: "2027-02-26", last_checked_at: "2026-11-27T10:15:00+09:00", impact: "影響なし" },
    ],
    decisions: [
      { id: "D1", title: "CR-0004 の追加見積（税込判定）を承認するか", who: "小松 恵（予算責任者）", due: "2026-12-02", request_id: "REQ-C-0012" },
      { id: "D2", title: "v1.4.0 の納入日の調整案（12/17）に合意するか", who: "中村 拓也（発注側プロジェクト責任者）", due: "2026-12-01", request_id: "REQ-C-0013" },
      { id: "D3", title: "ストア掲載用のロゴ（新版）の提出", who: "野口 舞（担当者）", due: "2026-12-05" },
    ],
    changes: [
      { at: "2026-11-27T10:00:00+09:00", text: "v1.4.0 の納入見込みを 12/17 に変更（理由: 結合テスト環境の準備遅れ）" },
      { at: "2026-11-26T17:00:00+09:00", text: "CR-0004 の追加見積を提示" },
      { at: "2026-11-20T15:00:00+09:00", text: "v1.3.0 の受入を記録" },
    ],
  },
  "member-app-api": {
    published: true,
    invited_at: "2026-07-01T10:00:00+09:00",
    invite_note: "会員アプリ API 開発（業務提携）の進捗と共同費用の確認のためにご招待しました。",
    next_report: "2026-12-03",
    last_report: "2026-11-26T18:00:00+09:00",
    deliverables: [
      { id: "DLV-11", title: "プッシュ通知 API", status: "done", committed: "2026-10-31", last_checked_at: "2026-11-07T12:00:00+09:00", impact: "受入済み" },
      { id: "DLV-12", title: "β版リリース", status: "inProgress", committed: "2026-12-11", forecast: "2026-12-11", last_checked_at: "2026-11-27T08:55:00+09:00", impact: "影響なし" },
    ],
    decisions: [{ id: "D11", title: "共同試験費の追加（20万円・折半）を決裁するか", who: "藤井 晃（共同決裁）", due: "2026-12-05", request_id: "REQ-C-0021" }],
    changes: [{ at: "2026-11-26T18:00:00+09:00", text: "共同試験費の実績を更新（52万円 / 予算 80万円）" }],
  },
};

/** 顧客向けに公開された予定（X-07）。社内会議・非公開予定はここに含めない */
export const portalScheduleItems: { id: string; project: string; kind: "committed" | "forecast" | "review" | "acceptanceDue"; title: string; date: string; time?: string; note?: string; updated_at: string }[] = [
  { id: "PS-01", project: "order-renewal", kind: "committed", title: "v1.4.0 納入（確約日）", date: "2026-12-10", note: "確約日は変更していません", updated_at: "2026-11-17T10:00:00+09:00" },
  { id: "PS-02", project: "order-renewal", kind: "forecast", title: "v1.4.0 納入見込み", date: "2026-12-17", note: "12/10 から変更（結合テスト環境の準備遅れ）", updated_at: "2026-11-27T10:00:00+09:00" },
  { id: "PS-03", project: "order-renewal", kind: "review", title: "進捗レビュー（オンライン）", date: "2026-12-02", time: "14:00", note: "日時変更あり（12/1 → 12/2）", updated_at: "2026-11-26T12:00:00+09:00" },
  { id: "PS-04", project: "order-renewal", kind: "acceptanceDue", title: "v1.4.0 受入回答の期限", date: "2026-12-24", updated_at: "2026-11-27T10:00:00+09:00" },
  { id: "PS-05", project: "order-renewal", kind: "committed", title: "最終受入（確約日）", date: "2027-02-26", updated_at: "2026-06-01T10:00:00+09:00" },
  { id: "PS-11", project: "member-app-api", kind: "committed", title: "β版リリース", date: "2026-12-11", updated_at: "2026-11-01T10:00:00+09:00" },
  { id: "PS-12", project: "member-app-api", kind: "review", title: "β版 Go/No-Go（共同）", date: "2026-12-09", time: "16:00", updated_at: "2026-11-20T10:00:00+09:00" },
];

export type CustomerRequestKind = "spec" | "estimate" | "schedule" | "release" | "acceptance";
export const REQUEST_KIND: Record<CustomerRequestKind, string> = { spec: "仕様", estimate: "追加見積", schedule: "日程", release: "リリース", acceptance: "受入" };

export type RouteStep = { role: string; user_id?: string; name: string; status: "done" | "waiting" | "pending" | "skipped"; at?: string; limit?: string };

/** JV から顧客への申請（X-08, X-09）。金額は顧客と合意する条件（顧客の支払額）だけ */
export const customerRequests: {
  id: string;
  project: string;
  kind: CustomerRequestKind;
  title: string;
  version: number;
  latest_version: number;
  amount?: number;
  decider: string;
  due: string;
  status: "pending" | "questioned" | "approved" | "returned";
  impact_if_approved: string;
  impact_if_returned: string;
  summary: string;
  jv_note: string;
  thread: { from: "customer" | "jv"; name: string; at: string; body: string }[];
  route: RouteStep[];
}[] = [
  {
    id: "REQ-C-0012", project: "order-renewal", kind: "estimate", title: "CR-0004 上限額の税込判定（追加見積）", version: 2, latest_version: 2, amount: 1_800_000,
    decider: "小松 恵（予算責任者）", due: "2026-12-02", status: "pending",
    impact_if_approved: "v1.4.0 に含めます。納期への影響はありません（確約日 12/10、見込み 12/17 は別件）",
    impact_if_returned: "現在の仕様（税抜判定）のまま v1.4.0 を納入します",
    summary: "上限額の判定を税込金額に変更します。追加費用 180 万円（税抜）。v1 から作業範囲を縮小（帳票の変更を除外）しました。",
    jv_note: "帳票側の税込表示は別の変更要求で扱う提案です。v1 からの差分は「対象外」に追記しています。",
    thread: [
      { from: "customer", name: "野口 舞", at: "2026-11-26T18:10:00+09:00", body: "帳票の金額表示も税込に変わりますか。" },
      { from: "jv", name: "案件窓口 青木 さくら", at: "2026-11-27T09:05:00+09:00", body: "帳票は今回の対象外です（v2 で対象外に明記しました）。必要であれば別途お見積りします。" },
    ],
    route: [
      { role: "担当レビュー", user_id: "u-noguchi", name: "野口 舞", status: "done", at: "2026-11-27T09:30:00+09:00" },
      { role: "発注側プロジェクト責任者", user_id: "u-nakamura", name: "中村 拓也", status: "done", at: "2026-11-27T10:00:00+09:00" },
      { role: "予算責任者の決裁", user_id: "u-komatsu", name: "小松 恵", status: "waiting", limit: "300 万円まで" },
    ],
  },
  {
    id: "REQ-C-0013", project: "order-renewal", kind: "schedule", title: "v1.4.0 の納入日の調整（12/10 → 12/17）", version: 1, latest_version: 1,
    decider: "中村 拓也（発注側プロジェクト責任者）", due: "2026-12-01", status: "questioned",
    impact_if_approved: "確約日を 12/17 に改訂し、受入回答の期限を 12/24 から 12/28 に変更します",
    impact_if_returned: "確約日 12/10 のまま、納入内容を分割する案（取引先マスタを先行）を再提示します",
    summary: "結合テスト環境の準備が 12/1 にずれたため、v1.4.0 の納入日を 12/17 に変更する調整案です。",
    jv_note: "分割納入（取引先マスタのみ 12/10）も選べます。",
    thread: [
      { from: "customer", name: "中村 拓也", at: "2026-11-27T10:20:00+09:00", body: "分割した場合、受入試験は2回に分かれますか。" },
    ],
    route: [{ role: "発注側プロジェクト責任者", user_id: "u-nakamura", name: "中村 拓也", status: "waiting" }],
  },
  {
    id: "REQ-C-0014", project: "order-renewal", kind: "spec", title: "REQ-0012 発注金額の上限を取引先ごとに設定（v2）", version: 1, latest_version: 2,
    decider: "中村 拓也（発注側プロジェクト責任者）", due: "2026-11-27", status: "pending",
    impact_if_approved: "v2 の受入基準で実装・検収します", impact_if_returned: "v1 の内容のまま保留します",
    summary: "取引先ごとに1回の発注で使える上限額を設定できるようにします。",
    jv_note: "11/27 に v2 へ更新しました（上限額を変更できる人を購買部の管理者に限定）。",
    thread: [], route: [{ role: "発注側プロジェクト責任者", user_id: "u-nakamura", name: "中村 拓也", status: "waiting" }],
  },
  {
    id: "REQ-C-0015", project: "order-renewal", kind: "release", title: "v1.3.1（帳票の不具合修正）のリリース", version: 1, latest_version: 1,
    decider: "中村 拓也（発注側プロジェクト責任者）", due: "2026-11-25", status: "approved",
    impact_if_approved: "11/26 夜に本番へ反映", impact_if_returned: "—", summary: "帳票の社印の位置ずれを修正します。", jv_note: "",
    thread: [], route: [{ role: "発注側プロジェクト責任者", user_id: "u-nakamura", name: "中村 拓也", status: "done", at: "2026-11-24T16:00:00+09:00" }],
  },
  {
    id: "REQ-C-0016", project: "order-renewal", kind: "acceptance", title: "v1.4.0 の受入（受入試験）", version: 1, latest_version: 1,
    decider: "野口 舞（検収者）", due: "2026-12-24", status: "pending",
    impact_if_approved: "最終受入の確約日（2027-02-26）に向けて次の納入へ進みます", impact_if_returned: "差戻し理由を確認し、修正版を再納入します",
    summary: "v1.4.0 の業務シナリオに沿って受入試験をお願いします（納入後に開始）。", jv_note: "納入見込み 12/17。",
    thread: [], route: [{ role: "検収者", user_id: "u-noguchi", name: "野口 舞", status: "pending" }],
  },
  {
    id: "REQ-C-0021", project: "member-app-api", kind: "estimate", title: "共同試験費の追加（20万円・折半）", version: 1, latest_version: 1, amount: 200_000,
    decider: "藤井 晃（共同決裁）／森 由紀子（受注側）", due: "2026-12-05", status: "pending",
    impact_if_approved: "共同試験費の予算が 100 万円になり、各社の負担は 10 万円ずつ増えます", impact_if_returned: "試験項目を絞り、現予算 80 万円で実施します",
    summary: "β版の端末試験を3機種追加します。提携契約の共同費目（共同試験費）の追加です。", jv_note: "受注側の決裁は完了しています。",
    thread: [],
    route: [
      { role: "受注側の決裁", name: "森 由紀子（サンプルソフト）", status: "done", at: "2026-11-26T15:00:00+09:00" },
      { role: "発注側の決裁", user_id: "u-fujii", name: "藤井 晃（架空リテール）", status: "waiting", limit: "50 万円まで" },
    ],
  },
];

/** 顧客側の権限者（X-10）。顧客の管理者が登録する */
export const customerAuthorities: { user_id: string; name: string; view: boolean; approve: boolean; inspect: boolean; sign: boolean; projects: string[]; limit?: number; deputy?: { name: string; from: string; to: string }; status: "active" | "ended" }[] = [
  { user_id: "u-nakamura", name: "中村 拓也", view: true, approve: true, inspect: false, sign: false, projects: ["order-renewal"], limit: 1_000_000, status: "active" },
  { user_id: "u-komatsu", name: "小松 恵", view: true, approve: true, inspect: false, sign: false, projects: ["order-renewal"], limit: 3_000_000, deputy: { name: "中村 拓也", from: "2026-12-26", to: "2027-01-05" }, status: "active" },
  { user_id: "u-noguchi", name: "野口 舞", view: true, approve: false, inspect: true, sign: false, projects: ["order-renewal"], status: "active" },
  { user_id: "u-sakai", name: "酒井 隆", view: true, approve: false, inspect: false, sign: true, projects: ["order-renewal"], status: "active" },
  { user_id: "u-former", name: "前田 智（異動）", view: true, approve: true, inspect: false, sign: false, projects: ["order-renewal"], limit: 1_000_000, status: "ended" },
];

/** 金額・内容別の承認経路（X-10） */
export const customerRoutes: { id: string; kind: string; condition: string; steps: string[] }[] = [
  { id: "RT-1", kind: "追加見積", condition: "100 万円まで", steps: ["担当レビュー", "発注側プロジェクト責任者"] },
  { id: "RT-2", kind: "追加見積", condition: "100 万円超〜300 万円", steps: ["担当レビュー", "発注側プロジェクト責任者", "予算責任者の決裁"] },
  { id: "RT-3", kind: "追加見積", condition: "300 万円超", steps: ["担当レビュー", "予算責任者の決裁", "役員決裁（社内稟議）"] },
  { id: "RT-4", kind: "日程・仕様", condition: "すべて", steps: ["発注側プロジェクト責任者"] },
  { id: "RT-5", kind: "受入", condition: "すべて", steps: ["検収者"] },
];

/** 顧客への資料提出の依頼（X-11） */
export const materialRequests: { id: string; project: string; title: string; purpose: string; due: string; to: string; status: "missing" | "submitted" | "replaced" | "accepted"; affects?: string; file?: string; version?: number; note?: string }[] = [
  { id: "MAT-01", project: "order-renewal", title: "会社ロゴ（新版・SVG）", purpose: "帳票とログイン画面の表示", due: "2026-12-05", to: "案件窓口", status: "replaced", affects: "v1.4.0 の帳票（12/10 確約）", file: "logo_2027.svg", version: 2, note: "旧ロゴ（v1）は v1.3.0 までの納入記録にそのまま残ります。v1.4.0 で使うかは窓口が指定します" },
  { id: "MAT-02", project: "order-renewal", title: "取引先マスタのサンプル CSV（匿名化済み）", purpose: "取込機能の受入試験", due: "2026-12-03", to: "案件窓口", status: "missing", affects: "v1.4.0 受入試験の準備" },
  { id: "MAT-03", project: "order-renewal", title: "画面の表示文言（敬語の統一表）", purpose: "画面文言の確定", due: "2026-11-20", to: "案件窓口", status: "accepted", file: "文言統一表.xlsx", version: 1 },
  { id: "MAT-11", project: "member-app-api", title: "ストア審査用の説明資料", purpose: "App Store の審査メモ", due: "2026-12-06", to: "案件窓口", status: "missing", affects: "β版リリース（12/11）" },
];

/** X-03 受入試験（UAT）の業務シナリオ。委託先への検収とは別の記録 */
export const uatScenarios: { id: string; feature: string; scenario: string; env: string; build: string; result: "pass" | "fail" | "untested" | "recheck"; note?: string; attachment?: string }[] = [
  { id: "UAT-01", feature: "取引先マスタの CSV 取込", scenario: "1,000 件の取引先を新規登録し、失敗行の一覧を確認する", env: "受入試験環境", build: "v1.4.0-rc2（commit 4e1a9c0）", result: "pass", attachment: "取込結果.png" },
  { id: "UAT-02", feature: "受注一覧の CSV 出力", scenario: "当月の受注を出力し、Excel で5列を確認する", env: "受入試験環境", build: "v1.4.0-rc2（commit 4e1a9c0）", result: "fail", note: "金額が税抜で出力される。税込で出したい（契約範囲外の可能性あり。窓口が確認）", attachment: "出力結果.csv" },
  { id: "UAT-03", feature: "操作ログの検索", scenario: "利用者と期間で検索し、3秒以内に表示されることを確認する", env: "受入試験環境", build: "v1.4.0-rc2（commit 4e1a9c0）", result: "untested" },
];
