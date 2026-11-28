// 経営層向け画面で共有する架空データ（2026-11-28 追加）。
// 各画面群は必要に応じて自分の mocks/<群>.ts で拡張し、このファイルの値を読み取って使う。
// 基準日は 2026-11-27。金額は円。
import type { BusinessCase, CalendarEvent, ConnectorInstallation, Decision, Incident, Milestone, ProjectHealth } from "../lib/types";

/** 連携先の接続（組織単位） */
export const connectors: ConnectorInstallation[] = [
  { id: "con-gh", provider: "github", category: "scm", name: "GitHub（sample-soft）", scope: "組織 sample-soft・6 リポジトリ", hosting: "GitHub.com", status: "healthy", last_success_at: "2026-11-27T10:28:00+09:00", last_attempt_at: "2026-11-27T10:28:00+09:00", lag_minutes: 2, object_count: 1284, installed_by: "u-yamamoto", credential_rotated_at: "2026-10-01T09:00:00+09:00", mode: "readWriteStatus" },
  { id: "con-gl", provider: "gitlab", category: "scm", name: "GitLab（会員アプリ）", scope: "グループ member-app・2 プロジェクト", hosting: "GitLab.com", status: "delayed", last_success_at: "2026-11-27T08:55:00+09:00", last_attempt_at: "2026-11-27T10:25:00+09:00", lag_minutes: 95, object_count: 412, error: "API のレート制限（429）。Retry-After に従って再試行中", installed_by: "u-yamamoto", mode: "readWriteStatus" },
  { id: "con-cc", provider: "codecommit", category: "scm", name: "AWS CodeCommit（旧基幹）", scope: "アカウント 1234-5678-9012・ap-northeast-1・1 リポジトリ", hosting: "AWS ap-northeast-1", status: "healthy", last_success_at: "2026-11-27T10:10:00+09:00", last_attempt_at: "2026-11-27T10:10:00+09:00", lag_minutes: 20, object_count: 96, installed_by: "u-yamamoto", mode: "read" },
  { id: "con-gha", provider: "githubActions", category: "ci", name: "GitHub Actions", scope: "6 リポジトリのワークフロー", status: "healthy", last_success_at: "2026-11-27T10:27:00+09:00", lag_minutes: 3, object_count: 5210, installed_by: "u-yamamoto", mode: "read" },
  { id: "con-ghp", provider: "githubProjects", category: "planning", name: "GitHub Projects（受託案件）", scope: "Project #3 受託案件ロードマップ", status: "healthy", last_success_at: "2026-11-27T10:15:00+09:00", last_attempt_at: "2026-11-27T10:15:00+09:00", lag_minutes: 15, object_count: 186, installed_by: "u-yamamoto", mode: "read" },
  { id: "con-jira", provider: "jira", category: "planning", name: "Jira（旧基幹データ移行）", scope: "プロジェクト MIG", status: "authExpired", last_success_at: "2026-11-24T18:00:00+09:00", last_attempt_at: "2026-11-27T10:00:00+09:00", lag_minutes: 3990, object_count: 74, error: "アクセストークンが失効しました。接続者による再認可が必要です", installed_by: "u-ishii", mode: "read" },
  { id: "con-gcal", provider: "googleCalendar", category: "calendar", name: "Google Calendar（経営会議）", scope: "共有カレンダー「経営会議」「顧客レビュー」", status: "healthy", last_success_at: "2026-11-27T10:20:00+09:00", lag_minutes: 10, object_count: 58, installed_by: "u-kimura", mode: "read" },
  { id: "con-slack", provider: "slack", category: "chat", name: "Slack（sample-soft）", scope: "#exec-decisions ほか 3 チャンネル", status: "healthy", last_success_at: "2026-11-27T10:24:00+09:00", installed_by: "u-yamamoto", mode: "interactive" },
  { id: "con-teams", provider: "teams", category: "chat", name: "Microsoft Teams（顧客共有）", scope: "チーム「架空商事 共同」", status: "failing", last_success_at: "2026-11-25T17:00:00+09:00", last_attempt_at: "2026-11-27T10:05:00+09:00", error: "Workflow の所有者が無効化されたため投稿できません。共同所有者の設定が必要です", installed_by: "u-sato", mode: "send" },
  { id: "con-pd", provider: "pagerduty", category: "oncall", name: "PagerDuty", scope: "サービス「受発注 API」「会員アプリ API」", status: "healthy", last_success_at: "2026-11-27T10:26:00+09:00", installed_by: "u-mori", mode: "interactive" },
  { id: "con-s3", provider: "s3ObjectLock", category: "storage", name: "S3 Object Lock（証跡）", scope: "バケット evidence-archive・Compliance モード", status: "healthy", last_success_at: "2026-11-26T22:00:00+09:00", installed_by: "u-yamamoto", mode: "read" },
];

/** 経営向けの案件の健全性 */
export const projectHealth: ProjectHealth[] = [
  { slug: "order-renewal", health: "atRisk", sponsor_id: "u-kimura", division: "受託開発事業部", baseline_end: "2027-02-26", forecast_end: "2027-03-12", slip_days: 14, budget: 38_000_000, actual_cost: 24_600_000, forecast_cost: 40_200_000, evidence_readiness: 82, next_decision: { date: "2026-12-02", title: "CR-0004（税込判定）の追加費用の承認" }, source: { provider: "githubProjects", label: "Project #3", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" }, ai_summary: "結合テスト環境の準備遅れにより、v1.4.0 の予測が 12/10 から 12/17 に後ろ倒しになる可能性があります。根拠: MS-104 の予測日更新、EXC-0008 の期限。" },
  { slug: "member-app-api", health: "onTrack", sponsor_id: "u-mori", division: "受託開発事業部", baseline_end: "2027-01-29", forecast_end: "2027-01-29", slip_days: 0, budget: 14_000_000, actual_cost: 6_100_000, forecast_cost: 13_400_000, evidence_readiness: 91, next_decision: { date: "2026-12-09", title: "β版リリースの Go/No-Go" }, source: { provider: "gitlabIssues", label: "member-app マイルストーン", synced_at: "2026-11-27T08:55:00+09:00", status: "delayed" } },
  { slug: "inventory-dashboard", health: "onTrack", sponsor_id: "u-ishii", division: "自社サービス事業", baseline_end: "2026-12-25", forecast_end: "2026-12-22", slip_days: -3, budget: 6_000_000, actual_cost: 4_900_000, forecast_cost: 5_700_000, evidence_readiness: 95, source: { provider: "githubProjects", label: "Project #5", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" } },
  { slug: "legacy-migration", health: "unknown", sponsor_id: "u-ishii", division: "受託開発事業部", baseline_end: "2027-03-31", forecast_end: "2027-03-31", slip_days: 0, budget: 22_000_000, actual_cost: 3_200_000, forecast_cost: 22_000_000, evidence_readiness: 40, next_decision: { date: "2026-12-04", title: "外部委託先の追加（要員不足）" }, source: { provider: "jira", label: "MIG", synced_at: "2026-11-24T18:00:00+09:00", status: "authExpired" } },
];

export const healthBySlug = (slug: string) => projectHealth.find((h) => h.slug === slug);

/** マイルストーン。当初（baseline）・承認済み改訂（revised）・予測（forecast）・実績（actual）を別々に持つ */
export const milestones: Milestone[] = [
  { id: "MS-101", project: "order-renewal", title: "要求の顧客承認", kind: "review", baseline: "2026-08-29", actual: "2026-09-05", confidence: "actual", owner: "u-sato", source: { provider: "githubProjects", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" } },
  { id: "MS-102", project: "order-renewal", title: "基本設計の完了", kind: "milestone", baseline: "2026-09-30", revised: "2026-10-09", actual: "2026-10-08", confidence: "actual", owner: "u-tanaka", source: { provider: "githubProjects", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" }, change_reason: "CR-0002 による要求追加", approved_by: "u-nakamura" },
  { id: "MS-103", project: "order-renewal", title: "v1.3.0 納入", kind: "delivery", baseline: "2026-11-13", actual: "2026-11-13", confidence: "actual", owner: "u-watanabe", source: { provider: "github", label: "Release v1.3.0", synced_at: "2026-11-27T10:28:00+09:00", status: "healthy" } },
  { id: "MS-104", project: "order-renewal", title: "v1.4.0 納入（取引先マスタ・操作ログ）", kind: "delivery", baseline: "2026-12-10", forecast: "2026-12-17", confidence: "forecast", owner: "u-watanabe", depends_on: ["MS-105"], source: { provider: "githubProjects", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" }, change_reason: "結合テスト環境の準備が 12/1 にずれたため（予測の更新。計画改訂は未承認）" },
  { id: "MS-105", project: "order-renewal", title: "結合テスト環境の準備", kind: "milestone", baseline: "2026-11-24", forecast: "2026-12-01", confidence: "forecast", owner: "u-ito", source: { provider: "githubProjects", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" } },
  { id: "MS-106", project: "order-renewal", title: "最終受入", kind: "delivery", baseline: "2027-02-26", forecast: "2027-03-12", confidence: "committed", owner: "u-sato", depends_on: ["MS-104"], source: { provider: "githubProjects", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" } },
  { id: "MS-201", project: "member-app-api", title: "β版リリース", kind: "release", baseline: "2026-12-11", forecast: "2026-12-11", confidence: "committed", owner: "u-suzuki", source: { provider: "gitlabIssues", synced_at: "2026-11-27T08:55:00+09:00", status: "delayed" } },
  { id: "MS-202", project: "member-app-api", title: "本番リリース", kind: "release", baseline: "2027-01-29", forecast: "2027-01-29", confidence: "target", owner: "u-suzuki", source: { provider: "gitlabIssues", synced_at: "2026-11-27T08:55:00+09:00", status: "delayed" } },
  { id: "MS-301", project: "inventory-dashboard", title: "在庫予測機能の公開", kind: "release", baseline: "2026-12-25", forecast: "2026-12-22", confidence: "target", owner: "u-tanaka", source: { provider: "githubProjects", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" } },
  { id: "MS-401", project: "legacy-migration", title: "移行リハーサル1回目", kind: "milestone", baseline: "2027-01-15", forecast: "2027-01-15", confidence: "committed", owner: "u-sato", source: { provider: "jira", synced_at: "2026-11-24T18:00:00+09:00", status: "authExpired" } },
];

/** 経営判断 */
export const decisions: Decision[] = [
  { id: "DEC-0031", title: "CR-0004（上限額の税込判定）の追加費用 120万円の承認", kind: "change", project: "order-renewal", status: "pending", due: "2026-12-02", impact: "追加費用 120万円、納期への影響なし（PM 試算）", impact_yen: 1_200_000, severity: "high", requested_by: "u-sato", options: ["承認（追加費用を受け入れる）", "条件付き承認（v1.5.0 に延期）", "却下"], evidence: ["CR-0004", "REQ-0012", "TC-0110"] },
  { id: "DEC-0032", title: "旧基幹データ移行への外部委託 2名の追加", kind: "resource", project: "legacy-migration", status: "pending", due: "2026-12-04", impact: "1月の設計者が 1.5 人月不足。委託費 280万円", impact_yen: 2_800_000, severity: "high", requested_by: "u-ishii", options: ["委託先 A を追加", "社内から 1 名異動", "移行リハーサルを 2 週間延期"], evidence: ["MS-401", "キャパシティ 2027-01"] },
  { id: "DEC-0033", title: "v1.4.0 の納入予測の後ろ倒し（12/10→12/17）を顧客へ説明するか", kind: "release", project: "order-renewal", status: "pending", due: "2026-12-01", impact: "確約日に対して 7 日の遅延予測", severity: "medium", requested_by: "u-sato", practical_approver: "PM（佐藤 美咲）と顧客（中村 拓也）の合意が必要", evidence: ["MS-104", "MS-105", "EXC-0008"] },
  { id: "DEC-0034", title: "在庫予測機能（自社サービス）の 2027 年度投資継続", kind: "investment", case_id: "BC-0007", status: "pending", due: "2026-12-15", impact: "年間 900万円の投資", impact_yen: 9_000_000, severity: "medium", requested_by: "u-okada", evidence: ["BC-0007", "BEN-0003"] },
  { id: "DEC-0029", title: "EXC-0006（依存ライブラリ脆弱性）のリスク受容", kind: "riskAcceptance", project: "order-renewal", status: "conditional", due: "2026-11-20", impact: "修正版の提供まで 14 日間の受容", severity: "high", requested_by: "u-sato", decider_id: "u-mori", decided_at: "2026-11-19T17:30:00+09:00", reason: "外部公開経路がなく、WAF で緩和済みのため", conditions: "12/3 までに修正版へ更新。更新できない場合は再審議", follow_up: [{ title: "修正版への更新 PR", owner: "u-suzuki", due: "2026-12-03", done: false }, { title: "WAF ルールの確認記録", owner: "u-ito", due: "2026-11-22", done: true }], evidence: ["EXC-0006", "run-5821"] },
  { id: "DEC-0027", title: "会員アプリ API を優先順位 2 位に引き上げ", kind: "priority", status: "approved", due: "2026-11-15", impact: "在庫ダッシュボードの改善を 1 月へ延期", severity: "medium", requested_by: "u-ishii", decider_id: "u-kimura", decided_at: "2026-11-14T11:00:00+09:00", reason: "顧客との確約日（β版 12/11）を守るため", follow_up: [{ title: "要員計画の更新", owner: "u-ishii", due: "2026-11-21", done: true }], evidence: ["PRI-2026-11"] },
  { id: "DEC-0025", title: "BC-0009 社内勤怠ツールの刷新（新規案件）", kind: "investment", case_id: "BC-0009", status: "rejected", due: "2026-11-10", impact: "初期費用 450万円", severity: "low", requested_by: "u-takahashi", decider_id: "u-kimura", decided_at: "2026-11-10T16:00:00+09:00", reason: "既製品で代替可能。期待便益が費用を下回る", evidence: ["BC-0009"] },
];

/** 事業ケース（案件受付） */
export const businessCases: BusinessCase[] = [
  {
    id: "BC-0007", title: "在庫予測機能の追加（自社サービス）", status: "reviewing", sponsor_id: "u-okada", proposer: "u-tanaka", strategy: "自社サービスの継続課金の拡大",
    problem: "既存顧客の 4 割が欠品による機会損失を課題に挙げている",
    options: [
      { name: "実施しない", cost: 0, benefit: "なし", risk: "解約率の上昇（年 3%）" },
      { name: "既製の予測エンジンを組み込む", cost: 9_000_000, benefit: "解約率 1.5pt 改善、追加課金", risk: "外部エンジンの価格改定", recommended: true },
      { name: "自社で予測モデルを開発", cost: 21_000_000, benefit: "差別化", risk: "専門人材の不足" },
    ],
    cost: 9_000_000, expected_benefit: "年間 1,800 万円の継続収益", value_score: 4, urgency: 3, risk_score: 2,
    kpis: [{ name: "解約率", baseline: "年 6.0%", target: "年 4.5%" }, { name: "追加課金の契約数", baseline: "0 社", target: "30 社" }],
    review_date: "2026-12-15", submitted_at: "2026-11-18T10:00:00+09:00",
  },
  {
    id: "BC-0008", title: "架空物流株式会社 配送管理システム（新規受託）", status: "submitted", customer: "架空物流株式会社", sponsor_id: "u-ishii", proposer: "u-sato", strategy: "物流業界の受託拡大",
    problem: "配送計画を表計算ソフトで管理しており、繁忙期に遅配が発生",
    options: [
      { name: "受注しない", cost: 0, benefit: "なし", risk: "業界参入の機会を逃す" },
      { name: "段階契約で受注（要求定義のみ先行）", cost: 3_000_000, benefit: "要求定義 600万円の売上、本開発の優先交渉権", risk: "本開発に進まない可能性", recommended: true },
      { name: "一括請負で受注", cost: 32_000_000, benefit: "売上 4,200 万円", risk: "要求不確定による赤字" },
    ],
    cost: 3_000_000, expected_benefit: "粗利 300 万円（第1段階）", value_score: 3, urgency: 4, risk_score: 3,
    kpis: [{ name: "粗利率", baseline: "—", target: "25%" }],
    review_date: "2026-12-09", submitted_at: "2026-11-25T15:00:00+09:00",
  },
  {
    id: "BC-0005", title: "会員アプリ API 開発（受託）", status: "approved", customer: "架空リテール株式会社", sponsor_id: "u-mori", proposer: "u-sato", strategy: "小売業界の継続取引",
    problem: "会員アプリの API が老朽化し、障害が月 2 回発生",
    options: [{ name: "受注", cost: 14_000_000, benefit: "売上 1,900 万円", risk: "モバイル側ベンダーとの調整", recommended: true }],
    cost: 14_000_000, expected_benefit: "粗利 500 万円、保守契約の継続", value_score: 4, urgency: 4, risk_score: 2,
    kpis: [{ name: "障害件数", baseline: "月 2 件", target: "月 0.2 件", actual: "—", source: "PagerDuty" }, { name: "粗利率", baseline: "—", target: "26%", actual: "28%（予測）", measured_at: "2026-11-27", source: "会計システムの集計（手入力）" }],
    project: "member-app-api", submitted_at: "2026-06-01T10:00:00+09:00",
  },
  {
    id: "BC-0009", title: "社内勤怠ツールの刷新", status: "rejected", sponsor_id: "u-kimura", proposer: "u-takahashi", strategy: "社内業務の効率化",
    problem: "勤怠の集計に月 10 時間かかる",
    options: [{ name: "自社開発", cost: 4_500_000, benefit: "月 10 時間の削減", risk: "保守負担" }, { name: "既製品を契約", cost: 300_000, benefit: "月 9 時間の削減", risk: "小さい", recommended: true }],
    cost: 4_500_000, expected_benefit: "月 10 時間の削減", value_score: 1, urgency: 1, risk_score: 1, kpis: [], submitted_at: "2026-11-02T10:00:00+09:00",
  },
];

/** 共有カレンダーから同期した予定（個人の非公開予定は取り込まない） */
export const calendarEvents: CalendarEvent[] = [
  { id: "CAL-01", title: "経営会議（月次）", start: "2026-12-01T09:00:00+09:00", end: "2026-12-01T11:00:00+09:00", timezone: "Asia/Tokyo", status: "confirmed", recurring: true, organizer: "u-kimura", calendar: "経営会議", source: { provider: "googleCalendar", synced_at: "2026-11-27T10:20:00+09:00", status: "healthy" }, decision_due: "DEC-0033" },
  { id: "CAL-02", title: "架空商事 進捗レビュー", project: "order-renewal", start: "2026-12-02T14:00:00+09:00", end: "2026-12-02T15:00:00+09:00", timezone: "Asia/Tokyo", status: "moved", organizer: "u-sato", calendar: "顧客レビュー", source: { provider: "googleCalendar", synced_at: "2026-11-27T10:20:00+09:00", status: "healthy" }, decision_due: "DEC-0031" },
  { id: "CAL-03", title: "会員アプリ β版 Go/No-Go", project: "member-app-api", start: "2026-12-09T16:00:00+09:00", end: "2026-12-09T17:00:00+09:00", timezone: "Asia/Tokyo", status: "confirmed", organizer: "u-mori", calendar: "経営会議", source: { provider: "googleCalendar", synced_at: "2026-11-27T10:20:00+09:00", status: "healthy" } },
  { id: "CAL-04", title: "在庫予測 投資審議", start: "2026-12-15T10:00:00+09:00", end: "2026-12-15T11:00:00+09:00", timezone: "Asia/Tokyo", status: "confirmed", organizer: "u-okada", calendar: "経営会議", source: { provider: "googleCalendar", synced_at: "2026-11-27T10:20:00+09:00", status: "healthy" }, decision_due: "DEC-0034" },
  { id: "CAL-05", title: "旧基幹 移行方針の顧客打合せ（米国拠点）", project: "legacy-migration", start: "2026-12-04T08:00:00+09:00", end: "2026-12-04T09:00:00+09:00", timezone: "America/Los_Angeles", status: "confirmed", organizer: "u-ishii", calendar: "顧客レビュー", source: { provider: "googleCalendar", synced_at: "2026-11-27T10:20:00+09:00", status: "healthy" } },
  { id: "CAL-06", title: "四半期レビュー", start: "2026-12-25", all_day: true, timezone: "Asia/Tokyo", status: "cancelled", organizer: "u-kimura", calendar: "経営会議", source: { provider: "googleCalendar", synced_at: "2026-11-27T10:20:00+09:00", status: "healthy" } },
];

/** インシデント（正本はオンコール管理サービス） */
export const incidents: Incident[] = [
  { id: "INC-0112", title: "受発注 API の 5xx エラー率が 5% を超過", severity: "critical", status: "acknowledged", service: "受発注 API", project: "order-renewal", environment: "ステージング", triggered_at: "2026-11-27T09:58:00+09:00", acknowledged_by: "u-watanabe", acknowledged_at: "2026-11-27T10:03:00+09:00", escalation_level: 1, related_release: "rel-140", dedup_key: "order-api/5xx-rate" },
  { id: "INC-0111", title: "会員アプリ API の応答遅延", severity: "high", status: "triggered", service: "会員アプリ API", project: "member-app-api", environment: "本番", triggered_at: "2026-11-27T10:21:00+09:00", escalation_level: 2, dedup_key: "member-api/latency-p95" },
  { id: "INC-0108", title: "証跡保管先への書き込み失敗", severity: "medium", status: "resolved", service: "証跡の保管", environment: "本番", triggered_at: "2026-11-26T22:05:00+09:00", acknowledged_by: "u-yamamoto", acknowledged_at: "2026-11-26T22:12:00+09:00", resolved_by: "u-yamamoto", resolved_at: "2026-11-26T22:40:00+09:00", escalation_level: 1, dedup_key: "evidence/write-failure" },
];
