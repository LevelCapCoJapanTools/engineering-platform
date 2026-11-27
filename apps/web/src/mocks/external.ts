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
