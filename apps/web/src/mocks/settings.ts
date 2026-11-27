// 設定画面（S-01〜S-08）の架空データ
import type { DataClass } from "../lib/vocab";

export const orgSettings = {
  name: "サンプルソフト株式会社",
  slug: "sample-soft",
  timezone: "Asia/Tokyo",
  language: "ja",
};

export const githubInstallation = {
  account: "sample-soft",
  installed_at: "2025-04-02T10:00:00+09:00",
  last_synced_at: "2026-11-27T10:20:00+09:00",
  permissions: [
    { name: "Checks", access: "読み取り・書き込み", purpose: "ゲートの判定結果を PR のチェックとして表示する" },
    { name: "Pull requests", access: "読み取り", purpose: "PR の作成者、レビュー、変更ファイルを取得する" },
    { name: "Contents", access: "読み取り", purpose: "要求・設計・トレースのファイルを読み込む" },
    { name: "Metadata", access: "読み取り", purpose: "リポジトリ名と既定ブランチを取得する" },
    { name: "Commit statuses", access: "読み取り・書き込み", purpose: "必須ステータスチェックとして判定を登録する" },
  ],
  deliveries: [
    { id: "dlv-88231", event: "pull_request.synchronize", at: "2026-11-27T10:02:00+09:00", status: 200 },
    { id: "dlv-88230", event: "check_suite.completed", at: "2026-11-27T09:39:00+09:00", status: 200 },
    { id: "dlv-88229", event: "pull_request_review.submitted", at: "2026-11-27T09:12:00+09:00", status: 200 },
    { id: "dlv-88228", event: "push", at: "2026-11-27T08:15:00+09:00", status: 200 },
  ],
  failed_deliveries: [
    { id: "dlv-88232", event: "pull_request.opened", at: "2026-11-27T10:15:00+09:00", status: 401 },
    { id: "dlv-88233", event: "check_suite.requested", at: "2026-11-27T10:18:00+09:00", status: 401 },
  ],
};

export const aiFeatures = [
  { key: "reqReview", label: "要求レビュー", description: "要求の曖昧性・矛盾・テスト可能性を指摘する" },
  { key: "designReview", label: "設計レビュー", description: "設計と要求の対応漏れや矛盾を指摘する" },
  { key: "sowExtract", label: "SOW 抽出", description: "SOW から要求候補・納入物・期限を抽出する" },
  { key: "linkCandidate", label: "リンク候補", description: "PR やテストと要求の対応候補を提示する" },
  { key: "draft", label: "下書き作成", description: "計画書やリリースノートの下書きを作る" },
];

/** AIエージェントの種類と権限（禁止事項は設定で変更できない） */
export const aiAgents = [
  { key: "req", name: "要求レビュー", scope: "要求・SOW の読み取り", output: "参考所見" },
  { key: "design", name: "設計レビュー", scope: "設計・ADR・要求の読み取り", output: "参考所見" },
  { key: "impl", name: "実装支援", scope: "対象リポジトリの読み取り、ブランチへの書き込み", output: "PR（人間のレビューが必須）" },
  { key: "test", name: "テスト支援", scope: "対象リポジトリの読み取り、ブランチへの書き込み", output: "テストの PR（作成したコードの承認は不可）" },
  { key: "evidence", name: "証跡監査", scope: "証跡・監査ログの読み取り", output: "欠落・不整合の参考所見" },
];
export const aiForbidden = ["PR のマージ", "承認（要求・設計・リリース・受入）", "例外の承認", "ポリシーの編集", "証跡の削除", "自分が作ったコードの承認"];
export const aiToolAllowlist = ["リポジトリの読み取り", "ブランチへのコミット", "PR の作成", "所見の記録"];

export const projectDataClass: { slug: string; name: string; value: DataClass; inherited: boolean }[] = [
  { slug: "order-renewal", name: "受発注システム刷新", value: "confidential", inherited: false },
  { slug: "member-app-api", name: "会員アプリ API 開発", value: "internal", inherited: true },
  { slug: "inventory-dashboard", name: "在庫管理ダッシュボード", value: "internal", inherited: true },
  { slug: "legacy-migration", name: "旧基幹データ移行", value: "highlyConfidential", inherited: false },
];

export const aiSendLog = [
  { id: "ai-log-1", at: "2026-11-27T08:31:00+09:00", feature: "要求レビュー", project: "受発注システム刷新", data_class: "confidential" as DataClass, size: "4.2 KB" },
  { id: "ai-log-2", at: "2026-11-26T16:05:00+09:00", feature: "要求レビュー", project: "受発注システム刷新", data_class: "confidential" as DataClass, size: "3.8 KB" },
  { id: "ai-log-3", at: "2026-11-26T12:00:00+09:00", feature: "影響分析", project: "受発注システム刷新", data_class: "confidential" as DataClass, size: "6.1 KB" },
  { id: "ai-log-4", at: "2026-11-24T11:00:00+09:00", feature: "設計レビュー", project: "会員アプリ API 開発", data_class: "internal" as DataClass, size: "9.7 KB" },
  { id: "ai-log-5", at: "2026-11-21T10:00:00+09:00", feature: "リンク候補", project: "受発注システム刷新", data_class: "confidential" as DataClass, size: "12.4 KB" },
];

export const apiTokens = [
  { id: "tok-1", name: "CI 連携（GitHub Actions）", scope: "ゲート判定の読み取り", created_at: "2026-04-10T10:00:00+09:00", last_used_at: "2026-11-27T09:39:00+09:00", revoked: false },
  { id: "tok-2", name: "監査レポート出力スクリプト", scope: "監査ログの読み取り", created_at: "2026-08-01T10:00:00+09:00", last_used_at: "2026-11-01T02:00:00+09:00", revoked: false },
  { id: "tok-3", name: "旧ダッシュボード連携", scope: "プロジェクトの読み取り", created_at: "2025-10-01T10:00:00+09:00", last_used_at: "2026-03-30T10:00:00+09:00", revoked: true },
];

export const invoices = [
  { id: "INV-2026-11", period: "2026年11月", amount: 109780, status: "支払済み", issued_at: "2026-11-01" },
  { id: "INV-2026-10", period: "2026年10月", amount: 109780, status: "支払済み", issued_at: "2026-10-01" },
  { id: "INV-2026-09", period: "2026年9月", amount: 109780, status: "支払済み", issued_at: "2026-09-01" },
  { id: "INV-2026-08", period: "2026年8月", amount: 54780, status: "支払済み", issued_at: "2026-08-01" },
];

export const plans = [
  { key: "Starter", price: "¥49,800／月", repos: 3, summary: "3リポジトリ、ゲート、AIレビュー、標準の証跡" },
  { key: "Team", price: "¥99,800／月", repos: 10, summary: "10リポジトリ、WORM 保管、監査ダッシュボード、SSO" },
  { key: "Partner", price: "¥198,000〜／月", repos: 50, summary: "複数の顧客組織、テンプレート管理、監査パックの出力" },
  { key: "Private", price: "お問い合わせ", repos: 0, summary: "VPC／オンプレミス、閉域モデル、SLA" },
];

export const notificationKinds = [
  { key: "approval", label: "承認の依頼" },
  { key: "decision", label: "承認・差戻しの結果" },
  { key: "exception", label: "例外の期限（7日前、当日）" },
  { key: "gate", label: "ゲートのブロック（自分の PR）" },
  { key: "acceptance", label: "受入の依頼" },
  { key: "share", label: "共有リンクの発行" },
  { key: "mention", label: "コメントでのメンション" },
];
