// 連携と同期の画面群（K-01〜K-08）の架空データ。基準日 2026-11-27。
// 接続そのものは mocks/portfolio.ts の connectors を正とし、ここでは詳細・能力・対応付け・イベントを持つ。
import type { CapabilityLevel, ConnectorCategory, ProviderKey } from "../lib/vocab";

/** 接続ごとの詳細（カーソル、Webhook、レート制限、資格情報、取得データ） */
export type ConnectorDetail = {
  id: string;
  cursor: { kind: string; state: "valid" | "invalidated" | "none"; updated_at?: string; note?: string };
  webhook?: { verified: boolean; method: string; last_received_at?: string; failures_24h: number };
  rate_limit?: { remaining: number; limit: number; reset_at: string; retry_after_sec?: number };
  credential: { kind: string; stored: string; rotated_at?: string; expires_at?: string; scopes: string[] };
  reads: string[];
  writes: string[];
  counts: { label: string; value: number }[];
  next_run_at?: string;
  interval: string;
};

export const connectorDetails: Record<string, ConnectorDetail> = {
  "con-gh": {
    id: "con-gh",
    cursor: { kind: "Webhook＋定期リコンシリエーション", state: "valid", updated_at: "2026-11-27T10:28:00+09:00", note: "6時間ごとに API で差分を再取得し、Webhook の欠落を補う" },
    webhook: { verified: true, method: "HMAC-SHA256 署名（X-Hub-Signature-256）", last_received_at: "2026-11-27T10:28:00+09:00", failures_24h: 0 },
    rate_limit: { remaining: 4210, limit: 5000, reset_at: "2026-11-27T11:00:00+09:00" },
    credential: { kind: "GitHub App のインストールトークン（1時間で失効）", stored: "暗号化して保管（鍵は KMS）。画面・ログには表示しない", rotated_at: "2026-10-01T09:00:00+09:00", scopes: ["Contents: 読み取り", "Pull requests: 読み取り", "Checks: 読み書き", "Commit statuses: 読み書き", "Administration: 読み取り（ブランチ保護の確認）"] },
    reads: ["リポジトリ、ブランチ、ブランチ保護", "PR、コミット、レビュー", "Check Suite／Check Run", "リリース、タグ"],
    writes: ["Check Run の作成・更新（ゲートの判定結果と注記）"],
    counts: [{ label: "リポジトリ", value: 6 }, { label: "PR", value: 214 }, { label: "コミット", value: 1012 }, { label: "チェック実行", value: 52 }],
    next_run_at: "2026-11-27T16:00:00+09:00",
    interval: "Webhook（即時）＋ 6時間ごとの差分確認",
  },
  "con-gl": {
    id: "con-gl",
    cursor: { kind: "Webhook＋更新日時による差分取得", state: "valid", updated_at: "2026-11-27T08:55:00+09:00" },
    webhook: { verified: true, method: "シークレットトークン（X-Gitlab-Token）", last_received_at: "2026-11-27T10:12:00+09:00", failures_24h: 0 },
    rate_limit: { remaining: 0, limit: 2000, reset_at: "2026-11-27T10:40:00+09:00", retry_after_sec: 540 },
    credential: { kind: "グループアクセストークン", stored: "暗号化して保管（鍵は KMS）", rotated_at: "2026-09-12T10:00:00+09:00", expires_at: "2027-03-12", scopes: ["read_api", "read_repository", "api（External Status Check の結果投稿のみに使用）"] },
    reads: ["プロジェクト、保護ブランチ", "Merge Request、コミット、承認", "パイプライン、Commit Status"],
    writes: ["External Status Check の結果投稿"],
    counts: [{ label: "プロジェクト", value: 2 }, { label: "MR", value: 88 }, { label: "コミット", value: 320 }],
    next_run_at: "2026-11-27T10:40:00+09:00",
    interval: "Webhook（即時）＋ 1時間ごとの差分確認",
  },
  "con-cc": {
    id: "con-cc",
    cursor: { kind: "EventBridge 経由のイベント＋定期の差分取得", state: "valid", updated_at: "2026-11-27T10:10:00+09:00" },
    webhook: { verified: true, method: "EventBridge → HTTPS 送信先（API 送信先の認証＋送信元アカウントの確認）", last_received_at: "2026-11-27T10:10:00+09:00", failures_24h: 0 },
    credential: { kind: "IAM ロールの引き受け（外部 ID 付き）", stored: "長期のアクセスキーは保管しない。ロール ARN のみ保存", scopes: ["codecommit:Get*", "codecommit:List*", "codecommit:GetPullRequest*"] },
    reads: ["リポジトリ、コミット", "プルリクエスト、承認ルールの状態"],
    writes: ["なし（読み取りのみで接続中）"],
    counts: [{ label: "リポジトリ", value: 1 }, { label: "プルリクエスト", value: 21 }, { label: "コミット", value: 75 }],
    interval: "イベント（即時）＋ 1日1回の差分確認",
  },
  "con-gha": {
    id: "con-gha",
    cursor: { kind: "workflow_run イベント", state: "valid", updated_at: "2026-11-27T10:27:00+09:00" },
    webhook: { verified: true, method: "GitHub App と共通の署名検証", last_received_at: "2026-11-27T10:27:00+09:00", failures_24h: 0 },
    credential: { kind: "GitHub App（共通）", stored: "GitHub の接続と共通", scopes: ["Actions: 読み取り"] },
    reads: ["ワークフロー実行、ジョブ、成果物のダイジェスト", "テストレポート、SAST・依存関係スキャンの結果ファイル"],
    writes: ["なし"],
    counts: [{ label: "実行", value: 5210 }],
    interval: "イベント（即時）",
  },
  "con-ghp": {
    id: "con-ghp",
    cursor: { kind: "GraphQL の更新日時カーソル", state: "valid", updated_at: "2026-11-27T10:15:00+09:00" },
    credential: { kind: "GitHub App（共通）", stored: "GitHub の接続と共通", scopes: ["Projects: 読み取り", "Issues: 読み取り"] },
    reads: ["Project、Item、Field（Start date／Target date／Status／Iteration）、Assignee、URL"],
    writes: ["なし（読取一方向）"],
    counts: [{ label: "Project", value: 2 }, { label: "Item", value: 186 }, { label: "日付フィールド", value: 4 }],
    next_run_at: "2026-11-27T10:30:00+09:00",
    interval: "15分ごと",
  },
  "con-jira": {
    id: "con-jira",
    cursor: { kind: "JQL（updated >= 最終同期）", state: "valid", updated_at: "2026-11-24T18:00:00+09:00", note: "最終同期以降の変更は未取得" },
    credential: { kind: "OAuth 2.0（3LO）", stored: "暗号化して保管。リフレッシュトークンが失効", rotated_at: "2026-08-01T10:00:00+09:00", expires_at: "2026-11-24", scopes: ["read:jira-work", "read:jira-user"] },
    reads: ["Project、Issue、Version、Status、Due date、Assignee、Issue Link"],
    writes: ["なし（読取一方向）"],
    counts: [{ label: "Issue", value: 74 }, { label: "Version", value: 3 }],
    interval: "30分ごと",
  },
  "con-gcal": {
    id: "con-gcal",
    cursor: { kind: "syncToken（カレンダーごと）", state: "valid", updated_at: "2026-11-27T10:20:00+09:00", note: "トークンが無効（HTTP 410）になったら、そのカレンダーを全件再同期する" },
    webhook: { verified: true, method: "プッシュ通知チャネル（チャネルトークンの照合）", last_received_at: "2026-11-27T10:20:00+09:00", failures_24h: 0 },
    credential: { kind: "OAuth 2.0（接続者: 木村 達也）", stored: "暗号化して保管", rotated_at: "2026-11-01T09:00:00+09:00", scopes: ["calendar.events.readonly（許可した共有カレンダーのみ）"] },
    reads: ["件名、開始・終了、終日、繰返し、取消、主催者、会議URL"],
    writes: ["なし（読取一方向）"],
    counts: [{ label: "カレンダー", value: 2 }, { label: "予定", value: 58 }, { label: "除外した非公開予定", value: 0 }],
    interval: "プッシュ通知（即時）＋ 1時間ごとの差分確認",
  },
  "con-slack": {
    id: "con-slack",
    cursor: { kind: "—（送信と応答のみ）", state: "none" },
    webhook: { verified: true, method: "署名シークレット（X-Slack-Signature）とタイムスタンプの確認", last_received_at: "2026-11-27T10:24:00+09:00", failures_24h: 0 },
    credential: { kind: "Bot トークン", stored: "暗号化して保管", rotated_at: "2026-10-15T09:00:00+09:00", scopes: ["chat:write", "commands", "users:read（本人確認のみ）"] },
    reads: ["ボタン操作をした利用者の ID"],
    writes: ["通知の投稿、スレッドへの返信"],
    counts: [{ label: "チャンネル", value: 4 }],
    interval: "イベント（即時）",
  },
  "con-teams": {
    id: "con-teams",
    cursor: { kind: "—（送信のみ）", state: "none" },
    credential: { kind: "Workflows の受信 URL", stored: "暗号化して保管。画面では末尾4文字のみ表示", rotated_at: "2026-07-01T09:00:00+09:00", scopes: ["投稿のみ"] },
    reads: ["なし"],
    writes: ["Adaptive Card の投稿"],
    counts: [{ label: "チャネル", value: 1 }],
    interval: "イベント（即時）",
  },
  "con-pd": {
    id: "con-pd",
    cursor: { kind: "当番表の定期照会＋インシデントの Webhook", state: "valid", updated_at: "2026-11-27T10:26:00+09:00" },
    webhook: { verified: true, method: "Webhook 署名（X-PagerDuty-Signature）", last_received_at: "2026-11-27T10:21:00+09:00", failures_24h: 0 },
    credential: { kind: "API キー（読み取り）＋ Events API の連携キー", stored: "暗号化して保管", rotated_at: "2026-09-01T09:00:00+09:00", scopes: ["当番表・エスカレーションの読み取り", "インシデントの起票"] },
    reads: ["当番表、エスカレーションポリシー、インシデントの状態"],
    writes: ["インシデントの起票"],
    counts: [{ label: "サービス", value: 2 }, { label: "当番表", value: 2 }],
    interval: "当番表は 15 分ごと、インシデントは即時",
  },
  "con-s3": {
    id: "con-s3",
    cursor: { kind: "—", state: "none" },
    credential: { kind: "IAM ロールの引き受け", stored: "ロール ARN のみ保存", scopes: ["s3:PutObject", "s3:GetObject", "s3:GetObjectRetention"] },
    reads: ["保管済みオブジェクトの保持期限の確認"],
    writes: ["Evidence Manifest と証跡ファイルの書き込み（上書き・削除の権限なし）"],
    counts: [{ label: "保管済み Manifest", value: 14 }],
    interval: "リリースごと",
  },
};

/** 接続の変更の監査 */
export const connectorAudit: { id: string; connector: string; at: string; actor: string; action: string; detail?: string }[] = [
  { id: "ca-1", connector: "con-gh", at: "2026-10-01T09:00:00+09:00", actor: "u-yamamoto", action: "資格情報をローテーション", detail: "GitHub App の秘密鍵を更新。旧鍵を失効" },
  { id: "ca-2", connector: "con-gh", at: "2026-09-20T14:10:00+09:00", actor: "u-yamamoto", action: "対象リポジトリを追加", detail: "sample-soft/shared-ui" },
  { id: "ca-3", connector: "con-gh", at: "2026-08-14T11:00:00+09:00", actor: "u-yamamoto", action: "権限を縮小", detail: "Issues: 読み書き → 読み取り" },
  { id: "ca-4", connector: "con-gh", at: "2026-04-01T10:00:00+09:00", actor: "u-yamamoto", action: "接続", detail: "GitHub App をインストール" },
  { id: "ca-5", connector: "con-jira", at: "2026-11-24T18:05:00+09:00", actor: "system", action: "再認可が必要と判定", detail: "リフレッシュトークンが失効（HTTP 401）" },
  { id: "ca-6", connector: "con-gl", at: "2026-11-27T09:00:00+09:00", actor: "system", action: "レート制限により待機", detail: "Retry-After 540 秒" },
];

/** 能力マトリクス */
export type CapabilityKey = string;
export type CapabilityRow = { provider: ProviderKey; values: Record<CapabilityKey, CapabilityLevel>; notes?: Record<CapabilityKey, string>; method?: string };
export const capabilityGroups: { category: ConnectorCategory; columns: { key: CapabilityKey; label: string }[]; rows: CapabilityRow[] }[] = [
  {
    category: "scm",
    columns: [
      { key: "events", label: "イベント受信" },
      { key: "status", label: "状態の書込み" },
      { key: "required", label: "必須ゲート化" },
      { key: "merge", label: "マージ制御" },
      { key: "reviews", label: "レビュー取得" },
      { key: "comments", label: "コメント" },
      { key: "audit", label: "監査情報" },
    ],
    rows: [
      { provider: "github", method: "GitHub Checks API（GitHub App のみ書込み可）＋ブランチ保護の必須チェック", values: { events: "yes", status: "yes", required: "yes", merge: "yes", reviews: "yes", comments: "yes", audit: "partial" }, notes: { audit: "組織の監査ログは Enterprise プランのみ取得可" } },
      { provider: "gitlab", method: "External Status Check（MR の HEAD SHA ごとに結果を投稿）＋保護ブランチ", values: { events: "yes", status: "yes", required: "partial", merge: "partial", reviews: "yes", comments: "yes", audit: "partial" }, notes: { required: "マージの必須化は GitLab の上位プランの機能", merge: "ステータスチェックの合格をマージ条件にできるのは上位プランのみ", audit: "監査イベントのストリーミングは上位プランのみ" } },
      { provider: "azureRepos", method: "PR Status API（genre/name 形式）を branch policy で必須化", values: { events: "yes", status: "yes", required: "yes", merge: "yes", reviews: "yes", comments: "yes", audit: "partial" }, notes: { audit: "Services と Server で取得できる範囲が異なる" } },
      { provider: "codecommit", method: "Checks 相当の API はない。承認ルールとコメントでマージを制御（検証中）", values: { events: "yes", status: "no", required: "partial", merge: "partial", reviews: "partial", comments: "yes", audit: "partial" }, notes: { status: "外部チェックの状態を投稿する API がない", required: "承認ルール（必要な承認数・承認者プール）で代替", merge: "承認ルールを満たさない PR はマージ不可。判定結果の反映方法は PoC で検証", reviews: "承認の状態のみ。レビューコメントは別取得", audit: "CloudTrail を別途接続した場合のみ" } },
      { provider: "bitbucket", values: { events: "planned", status: "planned", required: "planned", merge: "planned", reviews: "planned", comments: "planned", audit: "planned" } },
      { provider: "gitea", method: "汎用 Webhook＋REST アダプター（読み取りのみ／状態書込み可／必須ゲート可を個別に表示）", values: { events: "planned", status: "planned", required: "planned", merge: "no", reviews: "planned", comments: "planned", audit: "no" } },
    ],
  },
  {
    category: "planning",
    columns: [
      { key: "events", label: "イベント受信" },
      { key: "dates", label: "開始・終了日" },
      { key: "deps", label: "依存関係" },
      { key: "milestone", label: "マイルストーン" },
      { key: "assignee", label: "担当" },
      { key: "writeback", label: "書戻し" },
    ],
    rows: [
      { provider: "githubProjects", method: "Project の日付フィールドと Iteration を取得", values: { events: "partial", dates: "yes", deps: "partial", milestone: "yes", assignee: "yes", writeback: "no" }, notes: { events: "Project の変更イベントは一部のみ。定期取得で補う", deps: "Issue のサブ課題・関連のみ", writeback: "初期は読取一方向" } },
      { provider: "gitlabIssues", method: "Milestone の期限と Issue 群", values: { events: "yes", dates: "yes", deps: "partial", milestone: "yes", assignee: "yes", writeback: "no" }, notes: { deps: "ブロック関係は上位プランのみ", writeback: "初期は読取一方向" } },
      { provider: "azureBoards", method: "Work Item の日付フィールドと Iteration Path", values: { events: "yes", dates: "yes", deps: "yes", milestone: "yes", assignee: "yes", writeback: "no" }, notes: { dates: "プロセス定義により使うフィールドが異なる", writeback: "初期は読取一方向" } },
      { provider: "jira", method: "Issue、Version、Issue Link", values: { events: "yes", dates: "yes", deps: "yes", milestone: "yes", assignee: "yes", writeback: "no" }, notes: { writeback: "初期は読取一方向" } },
    ],
  },
  {
    category: "calendar",
    columns: [
      { key: "delta", label: "差分取得" },
      { key: "recurring", label: "繰返し" },
      { key: "cancel", label: "取消の検知" },
      { key: "tz", label: "タイムゾーン" },
      { key: "push", label: "変更通知" },
      { key: "writeback", label: "書戻し" },
    ],
    rows: [
      { provider: "googleCalendar", method: "syncToken による差分取得。HTTP 410 で全件再同期", values: { delta: "yes", recurring: "yes", cancel: "yes", tz: "yes", push: "yes", writeback: "no" }, notes: { writeback: "読取のみ" } },
      { provider: "m365Calendar", method: "calendarView の deltaLink／nextLink を期間ごとに保持", values: { delta: "yes", recurring: "yes", cancel: "yes", tz: "yes", push: "yes", writeback: "no" }, notes: { delta: "期間（calendarView）ごとに差分リンクを持つ", writeback: "読取のみ" } },
    ],
  },
  {
    category: "chat",
    columns: [
      { key: "send", label: "送信" },
      { key: "interactive", label: "インタラクション" },
      { key: "identity", label: "ユーザー識別" },
      { key: "receipt", label: "配信確認" },
    ],
    rows: [
      { provider: "slack", method: "Slack App（Interactivity）。Incoming Webhook は送信のみ", values: { send: "yes", interactive: "yes", identity: "yes", receipt: "partial" }, notes: { receipt: "投稿の成功は確認できるが、本人が読んだかは分からない" } },
      { provider: "teams", method: "Workflows の受信 URL、または通知 Bot", values: { send: "yes", interactive: "partial", identity: "partial", receipt: "partial" }, notes: { interactive: "ボタン応答は Workflows で応答処理を構成するか Bot が必要", identity: "Bot の場合のみ", receipt: "Workflows の所有者が無効化されると投稿できない" } },
      { provider: "discord", method: "Webhook は送信専用。双方向には Bot と署名検証が必要", values: { send: "yes", interactive: "no", identity: "no", receipt: "partial" }, notes: { interactive: "Webhook では操作を受け取れない" } },
      { provider: "mattermost", method: "REST API、Interactive Messages、Slash Commands", values: { send: "yes", interactive: "yes", identity: "yes", receipt: "partial" }, notes: { interactive: "管理者による Integration の有効化が必要" } },
      { provider: "googleChat", method: "Chat App（Incoming Webhook は送信のみ）", values: { send: "yes", interactive: "yes", identity: "yes", receipt: "partial" } },
      { provider: "chatwork", method: "メッセージ API と Webhook。操作は安全なリンクで処理", values: { send: "yes", interactive: "partial", identity: "partial", receipt: "partial" }, notes: { interactive: "ボタン操作はなく、期限付きリンクで処理" } },
      { provider: "webhook", values: { send: "yes", interactive: "no", identity: "no", receipt: "partial" } },
      { provider: "email", values: { send: "yes", interactive: "partial", identity: "partial", receipt: "no" }, notes: { interactive: "期限付きリンクのみ" } },
    ],
  },
  {
    category: "oncall",
    columns: [
      { key: "schedule", label: "当番照会" },
      { key: "paging", label: "ページング" },
      { key: "ack", label: "受領・解決" },
      { key: "fallback", label: "代替経路（Push／SMS／音声）" },
    ],
    rows: [
      { provider: "pagerduty", method: "Schedules、Escalation Policies、Incidents", values: { schedule: "yes", paging: "yes", ack: "yes", fallback: "yes" } },
      { provider: "jsmOps", values: { schedule: "planned", paging: "planned", ack: "planned", fallback: "planned" } },
      { provider: "opsgenie", method: "提供元がサポート終了を告知済み。新規接続は非推奨", values: { schedule: "partial", paging: "partial", ack: "partial", fallback: "partial" }, notes: { schedule: "移行期間中のみ" } },
    ],
  },
];

/** 外部データと案件などの対応付け */
export type MappingRow = {
  id: string;
  provider: ProviderKey;
  external_kind: string;
  external_id: string;
  external_title: string;
  target_kind: "案件" | "リポジトリ" | "課題" | "マイルストーン" | "リリース";
  target?: string;
  status: "confirmed" | "candidate" | "duplicate" | "orphan" | "wrongOrg";
  confirmed_by?: string;
  basis?: string;
  confidence?: number;
};
export const mappingRows: MappingRow[] = [
  { id: "map-1", provider: "githubProjects", external_kind: "Project", external_id: "PVT_kwDO…3", external_title: "受託案件ロードマップ", target_kind: "案件", target: "受発注システム刷新／会員アプリ API", status: "confirmed", confirmed_by: "u-yamamoto", basis: "接続時に案件を指定" },
  { id: "map-2", provider: "github", external_kind: "Repository", external_id: "sample-soft/order-api", external_title: "order-api", target_kind: "リポジトリ", target: "受発注システム刷新", status: "confirmed", confirmed_by: "u-yamamoto", basis: "接続時に指定" },
  { id: "map-3", provider: "githubProjects", external_kind: "Item（Milestone）", external_id: "PVTI_…104", external_title: "v1.4.0 納入", target_kind: "マイルストーン", target: "MS-104", status: "confirmed", confirmed_by: "u-sato", basis: "Project の Release フィールドが v1.4.0" },
  { id: "map-4", provider: "githubProjects", external_kind: "Item", external_id: "PVTI_…118", external_title: "結合テスト環境の準備（再）", target_kind: "マイルストーン", target: "MS-105", status: "duplicate", basis: "同じタイトル・同じ期限の Item が2件ある（PVTI_…105 と重複）" },
  { id: "map-5", provider: "gitlabIssues", external_kind: "Milestone", external_id: "member-app/%12", external_title: "β版", target_kind: "マイルストーン", target: "MS-201", status: "candidate", confidence: 0.82, basis: "名称と期限（12/11）が一致。AI・参考の候補" },
  { id: "map-6", provider: "jira", external_kind: "Version", external_id: "MIG-v0.9", external_title: "移行リハーサル", target_kind: "マイルストーン", status: "orphan", basis: "どの案件にも対応付いていない" },
  { id: "map-7", provider: "github", external_kind: "Repository", external_id: "sample-soft/tech-blog", external_title: "tech-blog", target_kind: "リポジトリ", status: "orphan", basis: "案件に属さないリポジトリ。対象外にするか確認" },
  { id: "map-8", provider: "googleCalendar", external_kind: "Event", external_id: "evt_7f2…", external_title: "架空物流 キックオフ（仮）", target_kind: "案件", target: "受発注システム刷新", status: "wrongOrg", basis: "主催者が別の顧客案件。件名の顧客名と案件の顧客が一致しない" },
  { id: "map-9", provider: "codecommit", external_kind: "Repository", external_id: "legacy-core", external_title: "legacy-core", target_kind: "リポジトリ", target: "旧基幹データ移行", status: "confirmed", confirmed_by: "u-ishii", basis: "接続時に指定" },
  { id: "map-10", provider: "github", external_kind: "Release", external_id: "order-api@v1.3.0", external_title: "v1.3.0", target_kind: "リリース", target: "rel-130", status: "confirmed", confirmed_by: "system", basis: "タグ名がリリース名と一致（規則による自動対応付け）" },
];

/** 項目ごとの正本 */
export const sourceRules: { item: string; primary: ProviderKey | "manual"; secondary?: ProviderKey; conflict: string; note?: string }[] = [
  { item: "案件（名称・顧客・スポンサー）", primary: "manual", conflict: "本サービスの事業ケースが正本", note: "開始が承認された事業ケースから作成" },
  { item: "マイルストーンと期限", primary: "githubProjects", secondary: "jira", conflict: "案件ごとに指定した計画システムを優先。他方は参照のみ" },
  { item: "作業項目の開始・終了日", primary: "githubProjects", secondary: "gitlabIssues", conflict: "案件ごとに指定した計画システムを優先" },
  { item: "担当（組織・責任者）", primary: "githubProjects", conflict: "計画システムの値。外部IDで人に対応付け" },
  { item: "状態・進捗", primary: "githubProjects", secondary: "github", conflict: "計画の状態を優先。PR・テストの実績は補足として集計" },
  { item: "リリース・タグ", primary: "github", conflict: "コードホスティングの値" },
  { item: "経営会議・顧客会議", primary: "googleCalendar", conflict: "許可した共有カレンダーのみ" },
  { item: "経営判断", primary: "manual", conflict: "本サービスの判断記録が正本。計画システムへは書き戻さない" },
];

/** 受信イベント */
export type InboundEvent = {
  id: string;
  delivery_id: string;
  provider: ProviderKey;
  kind: string;
  resource: string;
  head_sha?: string;
  occurred_at: string;
  received_at: string;
  signature: "valid" | "invalid" | "notApplicable";
  result: "processed" | "duplicate" | "reordered" | "retrying" | "deadLetter" | "rejected" | "reconciled";
  attempts: number;
  note?: string;
};
export const inboundEvents: InboundEvent[] = [
  { id: "ev-1", delivery_id: "7b1e…a201", provider: "github", kind: "pull_request.synchronize", resource: "order-api#142", head_sha: "9f2c1ab", occurred_at: "2026-11-27T10:27:40+09:00", received_at: "2026-11-27T10:27:42+09:00", signature: "valid", result: "processed", attempts: 1, note: "新しいコミットのため、旧コミットのゲート結果と承認を失効" },
  { id: "ev-2", delivery_id: "7b1e…a201", provider: "github", kind: "pull_request.synchronize", resource: "order-api#142", head_sha: "9f2c1ab", occurred_at: "2026-11-27T10:27:40+09:00", received_at: "2026-11-27T10:27:58+09:00", signature: "valid", result: "duplicate", attempts: 1, note: "同じ配信 ID の再送。処理せず記録のみ" },
  { id: "ev-3", delivery_id: "c40d…11fe", provider: "github", kind: "check_run.completed", resource: "order-api#142", head_sha: "5d01e3c", occurred_at: "2026-11-27T10:26:10+09:00", received_at: "2026-11-27T10:28:01+09:00", signature: "valid", result: "reordered", attempts: 1, note: "古いコミットの結果が後から届いた。最新コミットの判定には使わない" },
  { id: "ev-4", delivery_id: "e91a…0c3b", provider: "github", kind: "push（force-push）", resource: "order-web:feature/search-status", head_sha: "a17b9e0", occurred_at: "2026-11-27T09:40:00+09:00", received_at: "2026-11-27T09:40:02+09:00", signature: "valid", result: "processed", attempts: 1, note: "履歴の書換え。旧コミットへのリンクは「到達不能」として保持" },
  { id: "ev-5", delivery_id: "—", provider: "github", kind: "（不明な送信元）", resource: "—", occurred_at: "2026-11-27T08:12:00+09:00", received_at: "2026-11-27T08:12:00+09:00", signature: "invalid", result: "rejected", attempts: 1, note: "署名が一致しない。処理せず拒否（本文は保存しない）" },
  { id: "ev-6", delivery_id: "gl-55821", provider: "gitlab", kind: "merge_request.update", resource: "member-app/api!88", head_sha: "3e9f0d2", occurred_at: "2026-11-27T10:12:00+09:00", received_at: "2026-11-27T10:12:01+09:00", signature: "valid", result: "retrying", attempts: 3, note: "詳細の取得で 429。Retry-After に従い 10:40 に再試行" },
  { id: "ev-7", delivery_id: "gl-55790", provider: "gitlab", kind: "pipeline", resource: "member-app/api", head_sha: "1c0aa4e", occurred_at: "2026-11-27T07:02:00+09:00", received_at: "2026-11-27T07:02:01+09:00", signature: "valid", result: "deadLetter", attempts: 8, note: "8回失敗したため再処理待ち。手動で再処理できる" },
  { id: "ev-8", delivery_id: "—", provider: "jira", kind: "（欠落期間の再取得）", resource: "MIG", occurred_at: "2026-11-24T18:00:00+09:00", received_at: "—", signature: "notApplicable", result: "retrying", attempts: 0, note: "再認可後に 11/24 18:00 以降を再取得する予定" },
  { id: "ev-9", delivery_id: "—", provider: "github", kind: "repository.transferred", resource: "sample-soft/shared-ui", occurred_at: "2026-11-20T15:00:00+09:00", received_at: "2026-11-20T15:00:03+09:00", signature: "valid", result: "processed", attempts: 1, note: "移管先も同じ組織のため対応付けを維持" },
  { id: "ev-10", delivery_id: "—", provider: "github", kind: "pull_request.reopened（再作成）", resource: "order-web#139 → #144", occurred_at: "2026-11-19T11:00:00+09:00", received_at: "2026-11-19T11:00:01+09:00", signature: "valid", result: "reconciled", attempts: 1, note: "閉じた #139 と同じブランチで #144 が作成された。要求リンクの引継ぎ候補を提示" },
];

/** 欠落期間のリコンシリエーション */
export const reconciliations: { id: string; connector: string; from: string; to: string; status: "done" | "running" | "waiting"; found: number; note: string }[] = [
  { id: "rc-1", connector: "con-gh", from: "2026-11-27T04:00:00+09:00", to: "2026-11-27T10:00:00+09:00", status: "done", found: 0, note: "欠落なし" },
  { id: "rc-2", connector: "con-gh", from: "2026-11-26T22:00:00+09:00", to: "2026-11-27T04:00:00+09:00", status: "done", found: 2, note: "Webhook で届かなかったレビュー 2 件を API で補完" },
  { id: "rc-3", connector: "con-gl", from: "2026-11-27T08:55:00+09:00", to: "（現在）", status: "waiting", found: 0, note: "レート制限の解除待ち" },
  { id: "rc-4", connector: "con-jira", from: "2026-11-24T18:00:00+09:00", to: "（現在）", status: "waiting", found: 0, note: "再認可待ち" },
];

/** 初期インポート */
export const importJobs: { connector: string; label: string; done: number; total: number; status: "done" | "running" | "failed"; note?: string }[] = [
  { connector: "con-gh", label: "GitHub（PR・コミット・チェック）", done: 1284, total: 1284, status: "done" },
  { connector: "con-ghp", label: "GitHub Projects（Item・日付）", done: 186, total: 186, status: "done" },
  { connector: "con-gl", label: "GitLab（MR・パイプライン）", done: 412, total: 530, status: "running", note: "レート制限のため待機中" },
  { connector: "con-jira", label: "Jira（Issue・Version）", done: 74, total: 96, status: "failed", note: "再認可が必要" },
  { connector: "con-gcal", label: "Google Calendar（共有カレンダー）", done: 58, total: 58, status: "done" },
];

export type DiagnosticIssue = { id: string; kind: "duplicate" | "unlinked" | "missingDate" | "stalled"; severity: "high" | "medium" | "low"; provider: ProviderKey; target: string; detail: string; fix: string };
export const diagnostics: DiagnosticIssue[] = [
  { id: "dg-1", kind: "duplicate", severity: "medium", provider: "githubProjects", target: "PVTI_…105 / PVTI_…118", detail: "同じマイルストーン（結合テスト環境の準備）が2件ある", fix: "どちらかを正とし、もう一方を対象外にする" },
  { id: "dg-2", kind: "unlinked", severity: "medium", provider: "jira", target: "MIG-v0.9", detail: "どの案件にも対応付いていない Version", fix: "対応付け画面で案件を指定する" },
  { id: "dg-3", kind: "unlinked", severity: "low", provider: "github", target: "sample-soft/tech-blog", detail: "案件に属さないリポジトリ", fix: "対象外にする" },
  { id: "dg-4", kind: "missingDate", severity: "high", provider: "githubProjects", target: "PVTI_…131 最終受入資料の準備", detail: "Target date が未設定のため、経営スケジュールに表示できない", fix: "GitHub Projects で日付を設定する（正本で編集）" },
  { id: "dg-5", kind: "missingDate", severity: "medium", provider: "gitlabIssues", target: "member-app/%13 本番リリース", detail: "Start date がなく、期間の棒を描けない", fix: "GitLab で開始日を設定する" },
  { id: "dg-6", kind: "stalled", severity: "high", provider: "jira", target: "Jira（旧基幹データ移行）", detail: "3日間同期していない。旧基幹データ移行の健全性は「判定不可」と表示中", fix: "接続者（石井 浩二）が再認可する" },
];
