// 通知とオンコールの架空データ（2026-11-28 追加）。基準日 2026-11-27。
// 実在の宛先・URL・トークンを含めない。資格情報はマスク済みの表示値だけを置く。
import type { DeliveryStatus, ProviderKey, Severity, SyncStatus } from "../lib/vocab";

/** チャネルの能力。送信のみのチャネルには応答操作を出さない */
export type ChannelCapabilities = { send: boolean; interactive: boolean; deliveryReceipt: boolean; userIdentity: boolean; threads: boolean };

export type NotifyChannel = {
  id: string;
  provider: ProviderKey;
  name: string;
  destination: string;
  /** 接続方式。送信専用の Webhook と、認証済みアプリ（双方向）を区別する */
  method: string;
  capabilities: ChannelCapabilities;
  status: SyncStatus;
  owner_id: string;
  co_owner_ids: string[];
  last_delivery_at?: string;
  last_error?: string;
  credential: { kind: string; masked: string; rotated_at?: string; expires_at?: string; note?: string };
  verified: boolean;
  scope: "org" | "project" | "user";
  project?: string;
  self_hosted?: { url: string; version: string; tls: string };
  security?: { signature: boolean; nonce: boolean; doubleClick: boolean; roleCheck: boolean };
};

export const channels: NotifyChannel[] = [
  {
    id: "ch-slack-exec", provider: "slack", name: "Slack #exec-decisions", destination: "#exec-decisions（sample-soft）", method: "Slack App（Interactivity・Events API）",
    capabilities: { send: true, interactive: true, deliveryReceipt: true, userIdentity: true, threads: true }, status: "healthy", owner_id: "u-yamamoto", co_owner_ids: ["u-kimura"],
    last_delivery_at: "2026-11-27T10:24:00+09:00", credential: { kind: "Bot トークン", masked: "xoxb-••••••••-3f9a", rotated_at: "2026-10-01T09:00:00+09:00" }, verified: true, scope: "org",
    security: { signature: true, nonce: true, doubleClick: true, roleCheck: true },
  },
  {
    id: "ch-slack-order", provider: "slack", name: "Slack #order-renewal", destination: "#order-renewal（sample-soft）", method: "Slack App（Interactivity・Events API）",
    capabilities: { send: true, interactive: true, deliveryReceipt: true, userIdentity: true, threads: true }, status: "healthy", owner_id: "u-yamamoto", co_owner_ids: ["u-mori"],
    last_delivery_at: "2026-11-27T09:39:00+09:00", credential: { kind: "Bot トークン", masked: "xoxb-••••••••-3f9a", rotated_at: "2026-10-01T09:00:00+09:00" }, verified: true, scope: "project", project: "order-renewal",
    security: { signature: true, nonce: true, doubleClick: true, roleCheck: true },
  },
  {
    id: "ch-teams", provider: "teams", name: "Teams 架空商事 共同", destination: "チーム「架空商事 共同」/ 一般", method: "Teams Workflows（送信のみ）",
    capabilities: { send: true, interactive: false, deliveryReceipt: false, userIdentity: false, threads: false }, status: "failing", owner_id: "u-sato", co_owner_ids: [],
    last_delivery_at: "2026-11-25T17:00:00+09:00", last_error: "Workflow の所有者アカウントが無効化されたため投稿できません（403）。共同所有者が設定されていません。", credential: { kind: "Workflow の URL", masked: "https://••••.logic.azure.example/workflows/••••/triggers/manual/••••", note: "URL を知っている人は投稿できるため、トークンと同様に扱う" }, verified: true, scope: "project", project: "order-renewal",
  },
  {
    id: "ch-discord", provider: "discord", name: "Discord #release-notes", destination: "サーバー「sample-soft」/ #release-notes", method: "Webhook（送信のみ）",
    capabilities: { send: true, interactive: false, deliveryReceipt: false, userIdentity: false, threads: false }, status: "healthy", owner_id: "u-yamamoto", co_owner_ids: ["u-mori"],
    last_delivery_at: "2026-11-26T18:00:00+09:00", credential: { kind: "Webhook URL", masked: "https://discord.example/api/webhooks/••••/••••••••", note: "URL を知っている人は投稿できるため、トークンと同様に扱う" }, verified: true, scope: "org",
  },
  {
    id: "ch-mm", provider: "mattermost", name: "Mattermost 品質チーム", destination: "~quality（社内 Mattermost）", method: "Bot アカウント＋Interactive Messages",
    capabilities: { send: true, interactive: true, deliveryReceipt: true, userIdentity: true, threads: true }, status: "healthy", owner_id: "u-mori", co_owner_ids: ["u-yamamoto"],
    last_delivery_at: "2026-11-27T08:00:00+09:00", credential: { kind: "Bot アクセストークン", masked: "mm-••••••••-b21c", rotated_at: "2026-09-15T09:00:00+09:00", expires_at: "2027-03-15" }, verified: true, scope: "org",
    self_hosted: { url: "https://mattermost.sample-soft.example", version: "10.x", tls: "TLS 1.3・証明書の有効期限 2027-02-10" },
    security: { signature: true, nonce: true, doubleClick: true, roleCheck: true },
  },
  {
    id: "ch-gchat", provider: "googleChat", name: "Google Chat 経営連絡", destination: "スペース「経営連絡」", method: "Chat アプリ（カードのボタン）",
    capabilities: { send: true, interactive: true, deliveryReceipt: true, userIdentity: true, threads: true }, status: "initialSync", owner_id: "u-kimura", co_owner_ids: [],
    credential: { kind: "サービスアカウント", masked: "chat-app@••••.iam.example", rotated_at: "2026-11-26T15:00:00+09:00" }, verified: false, scope: "org",
    security: { signature: true, nonce: true, doubleClick: true, roleCheck: true },
  },
  {
    id: "ch-chatwork", provider: "chatwork", name: "Chatwork 旧基幹移行", destination: "ルーム「旧基幹 データ移行」", method: "API トークン（送信）＋Webhook 受信",
    capabilities: { send: true, interactive: false, deliveryReceipt: false, userIdentity: true, threads: false }, status: "healthy", owner_id: "u-ishii", co_owner_ids: ["u-yamamoto"],
    last_delivery_at: "2026-11-27T07:30:00+09:00", credential: { kind: "API トークン", masked: "••••••••••••7c1e", rotated_at: "2026-06-01T09:00:00+09:00", note: "提供元の API トークンは権限が広く、有効期限がありません。定期的な再発行と、漏えい時の即時失効が必要です" }, verified: true, scope: "project", project: "legacy-migration",
  },
  {
    id: "ch-webhook", provider: "webhook", name: "社内ポータル（汎用 Webhook）", destination: "https://portal.sample-soft.example/hooks/••••", method: "HTTPS POST（HMAC 署名付き）",
    capabilities: { send: true, interactive: false, deliveryReceipt: true, userIdentity: false, threads: false }, status: "delayed", owner_id: "u-yamamoto", co_owner_ids: [],
    last_delivery_at: "2026-11-27T09:10:00+09:00", last_error: "応答が 10 秒を超えたため再試行中（3 回目）", credential: { kind: "署名用の共有鍵", masked: "whsec_••••••••a90d", rotated_at: "2026-08-20T09:00:00+09:00" }, verified: true, scope: "org",
  },
  {
    id: "ch-email", provider: "email", name: "メール（経営層）", destination: "経営層 4 名の登録アドレス", method: "メール配信",
    capabilities: { send: true, interactive: false, deliveryReceipt: true, userIdentity: true, threads: false }, status: "healthy", owner_id: "u-yamamoto", co_owner_ids: [],
    last_delivery_at: "2026-11-27T08:00:00+09:00", credential: { kind: "送信ドメインの認証", masked: "SPF・DKIM・DMARC 設定済み" }, verified: true, scope: "org",
  },
];

export const channelById = (id: string) => channels.find((c) => c.id === id);

/** 通知イベントの種類（標準化済み） */
export type NotifyEventKind =
  | "approvalRequested" | "approvalDue" | "approvalResult" | "gateBlocked" | "exceptionExpiring" | "returned" | "changeRequested"
  | "releaseApproval" | "acceptance" | "evidenceFailure" | "connectorFailure" | "syncStalled" | "milestoneApproaching" | "milestoneDelayed"
  | "decisionBeforeMeeting" | "oncallTriggered";

export const NOTIFY_EVENTS: Record<NotifyEventKind, { label: string; group: string; defaultSeverity: Severity }> = {
  approvalRequested: { label: "承認・判断の依頼", group: "承認", defaultSeverity: "medium" },
  approvalDue: { label: "承認・判断の期限", group: "承認", defaultSeverity: "high" },
  approvalResult: { label: "承認・判断の結果", group: "承認", defaultSeverity: "info" },
  gateBlocked: { label: "ゲートのブロック", group: "ゲート", defaultSeverity: "medium" },
  exceptionExpiring: { label: "例外の期限", group: "ゲート", defaultSeverity: "medium" },
  returned: { label: "要求・設計の差戻し", group: "要求と設計", defaultSeverity: "low" },
  changeRequested: { label: "変更要求の起票", group: "計画", defaultSeverity: "medium" },
  releaseApproval: { label: "リリースの承認", group: "リリース", defaultSeverity: "high" },
  acceptance: { label: "顧客の受入・差戻し", group: "リリース", defaultSeverity: "medium" },
  evidenceFailure: { label: "証跡・署名・保管の失敗", group: "証跡", defaultSeverity: "critical" },
  connectorFailure: { label: "連携の障害", group: "連携", defaultSeverity: "high" },
  syncStalled: { label: "同期の停止", group: "連携", defaultSeverity: "high" },
  milestoneApproaching: { label: "マイルストーンの接近", group: "計画", defaultSeverity: "low" },
  milestoneDelayed: { label: "マイルストーンの遅延・予定変更", group: "計画", defaultSeverity: "high" },
  decisionBeforeMeeting: { label: "会議前の未解決の判断", group: "計画", defaultSeverity: "medium" },
  oncallTriggered: { label: "オンコールの起票", group: "オンコール", defaultSeverity: "critical" },
};

export type NotifyRule = {
  id: string;
  event: NotifyEventKind;
  min_severity: Severity;
  scope: string;
  destinations: string[];
  recipients: string;
  aggregate: "none" | "15m" | "1h" | "daily";
  renotify?: string;
  quiet_hours: "respect" | "override";
  enabled: boolean;
  muted_until?: string;
};

export const notifyRules: NotifyRule[] = [
  { id: "NR-01", event: "approvalRequested", min_severity: "medium", scope: "全案件", destinations: ["ch-slack-exec", "ch-email"], recipients: "判断者（経営層）", aggregate: "none", renotify: "期限の 24 時間前に再通知", quiet_hours: "respect", enabled: true },
  { id: "NR-02", event: "approvalDue", min_severity: "high", scope: "全案件", destinations: ["ch-slack-exec", "ch-email"], recipients: "判断者と依頼者", aggregate: "none", renotify: "期限超過後 4 時間ごと（最大 3 回）", quiet_hours: "override", enabled: true },
  { id: "NR-03", event: "gateBlocked", min_severity: "medium", scope: "受発注システム刷新", destinations: ["ch-slack-order"], recipients: "PR の作成者（外部ID）", aggregate: "15m", quiet_hours: "respect", enabled: true },
  { id: "NR-04", event: "exceptionExpiring", min_severity: "medium", scope: "全案件", destinations: ["ch-slack-order", "ch-email"], recipients: "申請者・承認者", aggregate: "daily", renotify: "7日前・当日", quiet_hours: "respect", enabled: true },
  { id: "NR-05", event: "evidenceFailure", min_severity: "high", scope: "全案件", destinations: ["ch-slack-exec", "ch-email"], recipients: "組織管理者・CTO", aggregate: "none", quiet_hours: "override", enabled: true },
  { id: "NR-06", event: "syncStalled", min_severity: "high", scope: "全連携", destinations: ["ch-slack-exec"], recipients: "連携の接続者・組織管理者", aggregate: "1h", renotify: "復旧まで 4 時間ごと", quiet_hours: "respect", enabled: true },
  { id: "NR-07", event: "milestoneDelayed", min_severity: "high", scope: "全案件", destinations: ["ch-slack-exec", "ch-email"], recipients: "案件スポンサー", aggregate: "1h", quiet_hours: "respect", enabled: true },
  { id: "NR-08", event: "decisionBeforeMeeting", min_severity: "medium", scope: "経営会議カレンダー", destinations: ["ch-email"], recipients: "会議の主催者・判断者", aggregate: "none", renotify: "会議の 1 営業日前", quiet_hours: "respect", enabled: true },
  { id: "NR-09", event: "connectorFailure", min_severity: "high", scope: "全連携", destinations: ["ch-slack-exec"], recipients: "組織管理者", aggregate: "15m", quiet_hours: "respect", enabled: true },
  { id: "NR-10", event: "oncallTriggered", min_severity: "high", scope: "全サービス", destinations: ["ch-slack-order", "ch-mm"], recipients: "オンコール当番（PagerDuty が正本）", aggregate: "none", quiet_hours: "override", enabled: true },
  { id: "NR-11", event: "milestoneApproaching", min_severity: "low", scope: "全案件", destinations: ["ch-email"], recipients: "案件スポンサー", aggregate: "daily", quiet_hours: "respect", enabled: false, muted_until: "2026-12-01" },
  { id: "NR-12", event: "acceptance", min_severity: "medium", scope: "受発注システム刷新", destinations: ["ch-teams", "ch-email"], recipients: "PM・案件スポンサー", aggregate: "none", quiet_hours: "respect", enabled: true },
];

/** 配信ログ（Outbox） */
export type Delivery = {
  id: string;
  event_id: string;
  event: NotifyEventKind;
  severity: Severity;
  channel_id: string;
  recipient: string;
  idempotency_key: string;
  template: string;
  status: DeliveryStatus;
  attempts: number;
  next_retry_at?: string;
  provider_response?: string;
  created_at: string;
  updated_at: string;
  subject: string;
};

export const deliveries: Delivery[] = [
  { id: "DLV-9041", event_id: "EVT-77120", event: "approvalRequested", severity: "high", channel_id: "ch-slack-exec", recipient: "木村 達也", idempotency_key: "EVT-77120:ch-slack-exec:u-kimura", template: "approval-request@3.2.0 (ja)", status: "delivered", attempts: 1, provider_response: "200 ok（ts=1764206640.000100）", created_at: "2026-11-27T10:24:00+09:00", updated_at: "2026-11-27T10:24:01+09:00", subject: "DEC-0031 追加費用 120万円の承認（期限 12/2）" },
  { id: "DLV-9040", event_id: "EVT-77120", event: "approvalRequested", severity: "high", channel_id: "ch-email", recipient: "木村 達也", idempotency_key: "EVT-77120:ch-email:u-kimura", template: "approval-request@3.2.0 (ja)", status: "delivered", attempts: 1, provider_response: "250 queued", created_at: "2026-11-27T10:24:00+09:00", updated_at: "2026-11-27T10:24:03+09:00", subject: "DEC-0031 追加費用 120万円の承認（期限 12/2）" },
  { id: "DLV-9038", event_id: "EVT-77118", event: "acceptance", severity: "medium", channel_id: "ch-teams", recipient: "チーム「架空商事 共同」", idempotency_key: "EVT-77118:ch-teams", template: "acceptance@1.4.0 (ja)", status: "deadLetter", attempts: 6, provider_response: "403 Forbidden（Workflow の所有者が無効）", created_at: "2026-11-27T09:00:00+09:00", updated_at: "2026-11-27T10:05:00+09:00", subject: "v1.3.0 の受入が記録されました" },
  { id: "DLV-9037", event_id: "EVT-77117", event: "syncStalled", severity: "high", channel_id: "ch-slack-exec", recipient: "#exec-decisions", idempotency_key: "EVT-77117:ch-slack-exec", template: "sync-stalled@1.1.0 (ja)", status: "delivered", attempts: 1, provider_response: "200 ok", created_at: "2026-11-27T10:00:00+09:00", updated_at: "2026-11-27T10:00:01+09:00", subject: "Jira（旧基幹データ移行）の同期が停止しています（再認可が必要）" },
  { id: "DLV-9036", event_id: "EVT-77116", event: "milestoneDelayed", severity: "high", channel_id: "ch-webhook", recipient: "社内ポータル", idempotency_key: "EVT-77116:ch-webhook", template: "milestone-delay@2.0.1 (ja)", status: "retrying", attempts: 3, next_retry_at: "2026-11-27T10:38:00+09:00", provider_response: "タイムアウト（10 秒）", created_at: "2026-11-27T09:10:00+09:00", updated_at: "2026-11-27T10:22:00+09:00", subject: "MS-104 v1.4.0 納入の予測が 7 日後ろ倒し" },
  { id: "DLV-9035", event_id: "EVT-77116", event: "milestoneDelayed", severity: "high", channel_id: "ch-slack-exec", recipient: "木村 達也（案件スポンサー）", idempotency_key: "EVT-77116:ch-slack-exec:u-kimura", template: "milestone-delay@2.0.1 (ja)", status: "delivered", attempts: 1, provider_response: "200 ok", created_at: "2026-11-27T09:10:00+09:00", updated_at: "2026-11-27T09:10:01+09:00", subject: "MS-104 v1.4.0 納入の予測が 7 日後ろ倒し" },
  { id: "DLV-9033", event_id: "EVT-77112", event: "gateBlocked", severity: "medium", channel_id: "ch-slack-order", recipient: "@aya（鈴木 彩・外部ID）", idempotency_key: "EVT-77112:ch-slack-order:aya", template: "gate-blocked@2.3.0 (ja)", status: "delivered", attempts: 1, provider_response: "200 ok", created_at: "2026-11-27T09:39:00+09:00", updated_at: "2026-11-27T09:39:01+09:00", subject: "PR #142 がゲート B でブロックされました" },
  { id: "DLV-9032", event_id: "EVT-77113", event: "gateBlocked", severity: "medium", channel_id: "ch-slack-order", recipient: "@aya（鈴木 彩・外部ID）", idempotency_key: "EVT-77113:ch-slack-order:aya", template: "gate-blocked@2.3.0 (ja)", status: "suppressed", attempts: 0, provider_response: "15 分以内の同じ PR の通知に集約", created_at: "2026-11-27T09:41:00+09:00", updated_at: "2026-11-27T09:41:00+09:00", subject: "PR #142 がゲート B でブロックされました（再実行）" },
  { id: "DLV-9030", event_id: "EVT-77110", event: "oncallTriggered", severity: "critical", channel_id: "ch-slack-order", recipient: "#order-renewal", idempotency_key: "EVT-77110:ch-slack-order", template: "incident@1.2.0 (ja)", status: "delivered", attempts: 1, provider_response: "200 ok", created_at: "2026-11-27T09:58:00+09:00", updated_at: "2026-11-27T09:58:01+09:00", subject: "INC-0112 受発注 API の 5xx エラー率が 5% を超過" },
  { id: "DLV-9029", event_id: "EVT-77109", event: "connectorFailure", severity: "high", channel_id: "ch-discord", recipient: "#release-notes", idempotency_key: "EVT-77109:ch-discord", template: "connector-failure@1.0.3 (ja)", status: "accepted", attempts: 1, provider_response: "204 No Content（配信確認なし）", created_at: "2026-11-27T08:55:00+09:00", updated_at: "2026-11-27T08:55:01+09:00", subject: "GitLab（会員アプリ）の同期が遅延しています" },
  { id: "DLV-9027", event_id: "EVT-77105", event: "exceptionExpiring", severity: "medium", channel_id: "ch-chatwork", recipient: "ルーム「旧基幹 データ移行」", idempotency_key: "EVT-77105:ch-chatwork", template: "exception-expiring@1.3.0 (ja)", status: "failed", attempts: 2, provider_response: "429 Too Many Requests（Retry-After 300）", next_retry_at: "2026-11-27T10:35:00+09:00", created_at: "2026-11-27T07:30:00+09:00", updated_at: "2026-11-27T10:30:00+09:00", subject: "例外 EXC-0006 の期限まであと 3 日" },
  { id: "DLV-9025", event_id: "EVT-77101", event: "decisionBeforeMeeting", severity: "medium", channel_id: "ch-email", recipient: "木村 達也", idempotency_key: "EVT-77101:ch-email:u-kimura", template: "meeting-prep@1.0.0 (ja)", status: "queued", attempts: 0, created_at: "2026-11-27T10:29:00+09:00", updated_at: "2026-11-27T10:29:00+09:00", subject: "12/1 経営会議の前に未解決の判断が 2 件あります" },
];

/** 当番（正本は PagerDuty。ここでは参照のみ） */
export type OnCallShift = {
  service: string;
  project?: string;
  policy: string;
  primary: { user_id: string; until: string; timezone: string; override?: string };
  secondary: { user_id: string; until: string; timezone: string };
  next_primary: { user_id: string; from: string };
  coverage_gaps: { from: string; to: string; reason: string }[];
};

export const onCallShifts: OnCallShift[] = [
  {
    service: "受発注 API", project: "order-renewal", policy: "EP-受発注（重大度別）",
    primary: { user_id: "u-watanabe", until: "2026-11-28T10:00:00+09:00", timezone: "Asia/Tokyo" },
    secondary: { user_id: "u-suzuki", until: "2026-11-28T10:00:00+09:00", timezone: "Asia/Tokyo" },
    next_primary: { user_id: "u-suzuki", from: "2026-11-28T10:00:00+09:00" },
    coverage_gaps: [],
  },
  {
    service: "会員アプリ API", project: "member-app-api", policy: "EP-会員アプリ",
    primary: { user_id: "u-suzuki", until: "2026-11-27T18:00:00+09:00", timezone: "Asia/Tokyo", override: "渡辺 翔 の休暇のため臨時交代（11/27 のみ）" },
    secondary: { user_id: "u-ito", until: "2026-11-27T18:00:00+09:00", timezone: "Asia/Tokyo" },
    next_primary: { user_id: "u-watanabe", from: "2026-11-27T18:00:00+09:00" },
    coverage_gaps: [{ from: "2026-12-31T18:00:00+09:00", to: "2027-01-01T09:00:00+09:00", reason: "年末年始の夜間に二次担当が未設定" }],
  },
  {
    service: "証跡の保管", policy: "EP-基盤",
    primary: { user_id: "u-yamamoto", until: "2026-12-01T09:00:00+09:00", timezone: "Asia/Tokyo" },
    secondary: { user_id: "u-mori", until: "2026-12-01T09:00:00+09:00", timezone: "Asia/Tokyo" },
    next_primary: { user_id: "u-watanabe", from: "2026-12-01T09:00:00+09:00" },
    coverage_gaps: [{ from: "2026-11-29T00:00:00+09:00", to: "2026-11-29T08:00:00+09:00", reason: "土曜深夜に一次担当が不在（休日の当番表が未作成）" }],
  },
];

export type EscalationPolicy = {
  id: string;
  name: string;
  severity: Severity[];
  steps: { level: number; target: string; wait_minutes: number; channels: string[] }[];
  night_holiday: string;
  repeat: string;
};

export const escalationPolicies: EscalationPolicy[] = [
  { id: "EP-1", name: "EP-受発注（重大度別）", severity: ["critical", "high"], steps: [{ level: 1, target: "一次担当", wait_minutes: 5, channels: ["Push", "SMS", "Slack"] }, { level: 2, target: "二次担当", wait_minutes: 10, channels: ["Push", "音声"] }, { level: 3, target: "CTO（森 由紀子）", wait_minutes: 15, channels: ["音声", "メール"] }], night_holiday: "夜間・休日も同じ段階で呼び出す", repeat: "全段階で無応答なら 2 回まで繰り返す" },
  { id: "EP-2", name: "EP-受発注（中・低）", severity: ["medium", "low"], steps: [{ level: 1, target: "一次担当", wait_minutes: 30, channels: ["Slack", "メール"] }, { level: 2, target: "二次担当", wait_minutes: 60, channels: ["Push"] }], night_holiday: "夜間・休日は翌営業日 9:00 に送信", repeat: "繰り返さない" },
  { id: "EP-3", name: "EP-基盤", severity: ["critical", "high", "medium"], steps: [{ level: 1, target: "一次担当", wait_minutes: 10, channels: ["Push", "SMS"] }, { level: 2, target: "二次担当", wait_minutes: 15, channels: ["音声"] }, { level: 3, target: "組織管理者", wait_minutes: 20, channels: ["音声", "メール"] }], night_holiday: "夜間・休日も同じ段階で呼び出す", repeat: "1 回繰り返す" },
];

export type Drill = { id: string; kind: string; at: string; result: "pass" | "fail" | "partial"; detail: string; by: string };
export const drills: Drill[] = [
  { id: "DR-14", kind: "テストアラート（受発注 API）", at: "2026-11-20T15:00:00+09:00", result: "pass", detail: "一次担当が 2 分で受領。Slack と Push の両方に到達", by: "u-mori" },
  { id: "DR-13", kind: "フェイルオーバー確認（Slack 停止を想定）", at: "2026-11-13T15:00:00+09:00", result: "partial", detail: "Push と SMS には到達。Teams の代替通知が所有者無効で失敗", by: "u-mori" },
  { id: "DR-12", kind: "エスカレーション（一次担当の無応答）", at: "2026-10-30T15:00:00+09:00", result: "pass", detail: "5 分後に二次担当へ段階が進み、7 分で受領", by: "u-yamamoto" },
  { id: "DR-11", kind: "テストアラート（会員アプリ API）", at: "2026-10-16T15:00:00+09:00", result: "fail", detail: "二次担当の電話番号が古く、音声通知が不達", by: "u-mori" },
];

export const contactExpiries = [
  { item: "PagerDuty API キー（読み取り）", owner: "u-mori", expires_at: "2027-01-31", status: "ok" as const },
  { item: "渡辺 翔 の SMS 番号の確認", owner: "u-watanabe", expires_at: "2026-12-05", status: "soon" as const },
  { item: "伊藤 誠 の音声通知の番号", owner: "u-ito", expires_at: "2026-11-20", status: "expired" as const },
  { item: "Mattermost Bot トークン", owner: "u-mori", expires_at: "2027-03-15", status: "ok" as const },
];

/** インシデントの経過（INC-0111 / INC-0112） */
export type IncidentEvent = { at: string; kind: "trigger" | "notify" | "escalate" | "ack" | "handoff" | "update" | "resolve" | "fail" | "fallback"; text: string; actor: "system" | "human" | "ci"; name: string };
export const incidentTimeline: Record<string, IncidentEvent[]> = {
  "INC-0112": [
    { at: "2026-11-27T09:58:00+09:00", kind: "trigger", text: "監視から起票（重複キー order-api/5xx-rate）", actor: "system", name: "PagerDuty" },
    { at: "2026-11-27T09:58:05+09:00", kind: "notify", text: "一次担当 渡辺 翔 に Push・SMS・Slack で通知", actor: "system", name: "PagerDuty" },
    { at: "2026-11-27T10:03:00+09:00", kind: "ack", text: "受領（Slack のボタン。本人の外部IDを照合）", actor: "human", name: "渡辺 翔" },
    { at: "2026-11-27T10:12:00+09:00", kind: "update", text: "rel-140 の設定変更が原因の可能性。切戻しを準備中", actor: "human", name: "渡辺 翔" },
  ],
  "INC-0111": [
    { at: "2026-11-27T10:21:00+09:00", kind: "trigger", text: "監視から起票（重複キー member-api/latency-p95）", actor: "system", name: "PagerDuty" },
    { at: "2026-11-27T10:21:04+09:00", kind: "notify", text: "一次担当 鈴木 彩 に Slack で通知", actor: "system", name: "PagerDuty" },
    { at: "2026-11-27T10:21:06+09:00", kind: "fail", text: "Teams への通知に失敗（403）。Slack と Push は成功", actor: "system", name: "通知" },
    { at: "2026-11-27T10:26:00+09:00", kind: "escalate", text: "5 分間受領がないため二次担当 伊藤 誠 へ段階 2", actor: "system", name: "PagerDuty" },
    { at: "2026-11-27T10:26:03+09:00", kind: "fallback", text: "代替経路として音声通知を発信", actor: "system", name: "PagerDuty" },
  ],
  "INC-0108": [
    { at: "2026-11-26T22:05:00+09:00", kind: "trigger", text: "証跡保管先への書き込み失敗を検知", actor: "system", name: "Worker" },
    { at: "2026-11-26T22:12:00+09:00", kind: "ack", text: "受領", actor: "human", name: "山本 結衣" },
    { at: "2026-11-26T22:30:00+09:00", kind: "update", text: "保管先の IAM ロールの期限切れを更新。保留中の 3 件を再送", actor: "human", name: "山本 結衣" },
    { at: "2026-11-26T22:40:00+09:00", kind: "resolve", text: "解決。保留していた Manifest 3 件の保管と署名検証を確認", actor: "human", name: "山本 結衣" },
  ],
};

/** アプリ内通知（O-03） */
export type AppNotice = { id: string; event: NotifyEventKind; severity: Severity; text: string; project?: string; at: string; read: boolean; link?: string; deliveries: { channel_id: string; status: DeliveryStatus }[] };
export const appNotices: AppNotice[] = [
  { id: "AN-1", event: "approvalRequested", severity: "high", text: "DEC-0031 追加費用 120万円の承認を依頼されています（期限 12/2）", project: "order-renewal", at: "2026-11-27T10:24:00+09:00", read: false, deliveries: [{ channel_id: "ch-slack-exec", status: "delivered" }, { channel_id: "ch-email", status: "delivered" }] },
  { id: "AN-2", event: "oncallTriggered", severity: "critical", text: "INC-0111 会員アプリ API の応答遅延（未受領のため段階 2 へ）", project: "member-app-api", at: "2026-11-27T10:26:00+09:00", read: false, deliveries: [{ channel_id: "ch-slack-order", status: "delivered" }, { channel_id: "ch-teams", status: "failed" }] },
  { id: "AN-3", event: "syncStalled", severity: "high", text: "Jira（旧基幹データ移行）の同期が停止しています。接続者の再認可が必要です", project: "legacy-migration", at: "2026-11-27T10:00:00+09:00", read: false, deliveries: [{ channel_id: "ch-slack-exec", status: "delivered" }] },
  { id: "AN-4", event: "milestoneDelayed", severity: "high", text: "MS-104 v1.4.0 納入の予測が 12/10 から 12/17 に変わりました", project: "order-renewal", at: "2026-11-27T09:10:00+09:00", read: false, deliveries: [{ channel_id: "ch-slack-exec", status: "delivered" }, { channel_id: "ch-webhook", status: "retrying" }] },
  { id: "AN-5", event: "decisionBeforeMeeting", severity: "medium", text: "12/1 経営会議の前に未解決の判断が 2 件あります", at: "2026-11-27T08:00:00+09:00", read: true, deliveries: [{ channel_id: "ch-email", status: "queued" }] },
  { id: "AN-6", event: "acceptance", severity: "medium", text: "v1.3.0 の受入が記録されました（顧客: 中村 拓也）", project: "order-renewal", at: "2026-11-26T15:20:00+09:00", read: true, deliveries: [{ channel_id: "ch-teams", status: "deadLetter" }, { channel_id: "ch-email", status: "delivered" }] },
  { id: "AN-7", event: "exceptionExpiring", severity: "medium", text: "例外 EXC-0006 の期限まであと 3 日です", project: "order-renewal", at: "2026-11-27T07:30:00+09:00", read: true, deliveries: [{ channel_id: "ch-chatwork", status: "failed" }] },
  { id: "AN-8", event: "evidenceFailure", severity: "critical", text: "証跡保管先への書き込みに失敗しました（INC-0108 で解決済み）", at: "2026-11-26T22:05:00+09:00", read: true, deliveries: [{ channel_id: "ch-slack-exec", status: "delivered" }, { channel_id: "ch-email", status: "delivered" }] },
];
