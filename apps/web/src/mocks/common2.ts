// 関係者を支える共通機能（連携・通知・オンコール・権限・AI仲介）の架空データ（2026-11-28 追補）。
// 基準日は 2026-11-27。金額・人名・会社名はすべて架空。
import type { Audience, CapabilityLevel, ProviderKey, Severity } from "../lib/vocab";

// ---------- 31 外部 Git・CI との成果照合 ----------

/** 提供元ごとの成果参照の取得能力 */
export const referenceCapabilities: {
  provider: ProviderKey;
  ref: CapabilityLevel;
  pinnedSha: CapabilityLevel;
  ciResult: CapabilityLevel;
  review: CapabilityLevel;
  gate: CapabilityLevel;
  method: string;
  limit?: string;
  verified_at: string;
}[] = [
  { provider: "github", ref: "yes", pinnedSha: "yes", ciResult: "yes", review: "yes", gate: "yes", method: "GitHub App（PR、コミット、Check Run、レビュー）。必須ステータスチェックで必須化", verified_at: "2026-11-25" },
  { provider: "gitlab", ref: "yes", pinnedSha: "yes", ciResult: "yes", review: "yes", gate: "yes", method: "Webhook と API（MR、パイプライン、承認）。External Status Check で必須化", limit: "Self-Managed は未検証", verified_at: "2026-11-20" },
  { provider: "azureRepos", ref: "yes", pinnedSha: "yes", ciResult: "partial", review: "yes", gate: "yes", method: "Service Hook と PR Status（genre/name）。branch policy で必須化", limit: "Azure Pipelines 以外の CI 結果は PR Status に投稿されたものだけ取得", verified_at: "2026-11-18" },
  { provider: "codecommit", ref: "yes", pinnedSha: "yes", ciResult: "partial", review: "partial", gate: "partial", method: "EventBridge 通知と API（PR、コミット、承認ルール）。承認ルールとコメントで代替", limit: "CI 結果は CodeBuild の報告だけ。必須チェックの仕組みはなく、承認ルールで代替", verified_at: "2026-11-15" },
];

export type MatchState = "matched" | "unverified" | "mismatch" | "pending";

/** 依頼ごとの成果参照と検証結果の照合 */
export const referenceMatches: {
  id: string;
  order_id: string;
  order_title: string;
  freelancer_id: string;
  provider: ProviderKey;
  external_ref: string;
  submitted_sha: string;
  head_sha_now: string;
  ci: "success" | "failure" | "unavailable" | "pending";
  ci_run?: string;
  review: "approved" | "none" | "unavailable";
  state: MatchState;
  note: string;
  last_event_at: string;
}[] = [
  { id: "RM-01", order_id: "ORD-0101", order_title: "受注一覧の CSV 出力", freelancer_id: "u-matsuda", provider: "github", external_ref: "sample-soft/order-web#151", submitted_sha: "9f3c2a1e7b4d", head_sha_now: "c04b9e21f7aa", ci: "success", ci_run: "gh-run-99830211（9f3c2a1 の結果）", review: "approved", state: "matched", note: "提出後に PR の先端が c04b9e2 へ進んだが、照合は提出時の 9f3c2a1 で固定", last_event_at: "2026-11-27T10:12:00+09:00" },
  { id: "RM-02", order_id: "ORD-0102", order_title: "取引先マスタの CSV 一括取込", freelancer_id: "u-hayashi", provider: "gitlab", external_ref: "member-app/order-api!42", submitted_sha: "—", head_sha_now: "71de03b8a912", ci: "pending", review: "none", state: "pending", note: "提出前。MR の更新は記録のみ", last_event_at: "2026-11-26T22:10:00+09:00" },
  { id: "RM-03", order_id: "ORD-0201", order_title: "コーポレートサイトの問い合わせフォーム", freelancer_id: "u-matsuda", provider: "azureRepos", external_ref: "demo-lab/site PR 17", submitted_sha: "—", head_sha_now: "e81a2b77c0d3", ci: "unavailable", review: "approved", state: "unverified", note: "Jenkins の結果が PR Status に投稿されないため、CI 結果は「未確認」", last_event_at: "2026-11-25T18:00:00+09:00" },
  { id: "RM-04", order_id: "ORD-0099", order_title: "旧データの変換スクリプト", freelancer_id: "u-hayashi", provider: "codecommit", external_ref: "legacy-migration PR 9", submitted_sha: "5b2e9f004c1a", head_sha_now: "5b2e9f004c1a", ci: "success", ci_run: "codebuild:mig-build:212（別コミット 3aa01c2 の結果）", review: "unavailable", state: "mismatch", note: "成功した CI は別コミットの結果のため流用しない。提出版で再実行を依頼済み", last_event_at: "2026-11-27T08:40:00+09:00" },
];

/** 再配信・順不同の扱い（巻き戻らない） */
export const referenceEvents: { at: string; provider: ProviderKey; delivery: string; kind: string; version: string; result: "applied" | "duplicate" | "ignored_older" }[] = [
  { at: "2026-11-27T10:12:00+09:00", provider: "github", delivery: "d-7781", kind: "check_run.completed", version: "2026-11-27T01:11:40Z", result: "applied" },
  { at: "2026-11-27T10:12:03+09:00", provider: "github", delivery: "d-7781", kind: "check_run.completed（再配信）", version: "2026-11-27T01:11:40Z", result: "duplicate" },
  { at: "2026-11-27T10:13:10+09:00", provider: "github", delivery: "d-7769", kind: "check_run.in_progress（遅延到着）", version: "2026-11-27T01:05:02Z", result: "ignored_older" },
];

// ---------- 32 通知の公開範囲 ----------

/** 通知の出来事ごとの宛先の範囲 */
export const notifyAudienceRules: { event: string; audience: Audience; recipients: string; severity: Severity; deadline?: string; deputy?: string; note: string }[] = [
  { event: "新しい依頼・条件の再提示", audience: "freelancer", recipients: "対象の受託者本人のみ", severity: "medium", deadline: "回答期限の2日前と当日に催促", note: "報酬・条件は本文に入れず、本人確認付きリンクで表示" },
  { event: "質問への回答予定・確定回答", audience: "freelancer", recipients: "質問した受託者本人のみ", severity: "low", deadline: "回答予定日を過ぎたら窓口の代理へ移る", deputy: "木村 達也", note: "顧客名・社内メモは含めない" },
  { event: "委託検収の結果・差戻し", audience: "freelancer", recipients: "対象の受託者本人のみ", severity: "medium", deadline: "検査期日の前日に検収者へ催促", deputy: "森 由紀子", note: "他の受託者の結果は含めない" },
  { event: "JV からの申請（見積・変更・公開・受入）", audience: "customer", recipients: "申請ごとに指名された発注側の承認者・検収者", severity: "high", deadline: "回答期限の3営業日前・前日・当日", deputy: "発注側の代理（登録時）", note: "承認済みの公開範囲の項目だけ。内部予算・外注単価は含めない" },
  { event: "納入見込みの変更", audience: "customer", recipients: "発注側プロジェクト責任者と購読者", severity: "medium", note: "公開済みの予定だけ。JV内部会議は含めない" },
  { event: "共同費目の予算超過", audience: "alliance", recipients: "提携契約の決裁者（両社）", severity: "high", deadline: "決裁期限の前日", note: "合意した費目の集計だけ" },
  { event: "未検収・承認待ちの期限超過", audience: "internal", recipients: "主担当 → 期限後は代理 → 案件窓口", severity: "high", deadline: "期限当日に主担当、翌営業日に代理", deputy: "案件ごとの代理", note: "営業時間・休業日は案件の設定に従う" },
  { event: "本番障害（受託者の成果に関係）", audience: "internal", recipients: "当番（PagerDuty）と案件窓口", severity: "critical", note: "元の受託者を自動で呼び出さない" },
];

/** 公開停止・提携終了で止まるもの（40） */
export const revocationEffects: { item: string; effect: string }[] = [
  { item: "予約済みの通知（送信待ち）", effect: "送信せずに取消。配信ログに「公開停止により取消」と記録" },
  { item: "カレンダーの購読", effect: "購読 URL を失効。以後の更新は届かない" },
  { item: "共有リンク・承認リンク", effect: "失効。既存のセッションからの再取得も拒否" },
  { item: "配信済み・ダウンロード済みの控え", effect: "回収できないため、履歴で特定し、必要なら訂正・回収を依頼する" },
];

// ---------- 33 オンコール ----------

/** 休日・夜間に対応する組織と時間帯 */
export const oncallCoverage: { project: string; weekday: string; night: string; holiday: string; organization: string }[] = [
  { project: "受発注システム刷新", weekday: "9:00〜19:00 サンプルソフト（一次）", night: "19:00〜9:00 サンプルソフト当番（一次・二次）", holiday: "土日祝 9:00〜21:00 のみ対応", organization: "サンプルソフト株式会社（運用は発注企業へ引継ぎ予定）" },
  { project: "会員アプリ API 開発", weekday: "9:00〜19:00 サンプルソフト", night: "対応なし（翌営業日）", holiday: "対応なし", organization: "業務提携契約で定めた範囲。夜間は架空リテールの運用部門" },
];

/** チャット製品ごとの当番の応答方法 */
export const chatAckMethods: { provider: ProviderKey; delivery: CapabilityLevel; ack: string; note: string }[] = [
  { provider: "slack", delivery: "yes", ack: "メッセージのボタンで受領（本人確認済み）", note: "Slack App の Interactivity" },
  { provider: "teams", delivery: "partial", ack: "Workflow の応答、または認証リンク", note: "Workflow の所有者が無効化されると投稿が止まる" },
  { provider: "discord", delivery: "no", ack: "認証リンクのみ（Webhook は送信専用）", note: "投稿の成功は受領ではない" },
  { provider: "mattermost", delivery: "yes", ack: "Interactive Message のボタン", note: "Self-Hosted の TLS と送信元を確認" },
  { provider: "googleChat", delivery: "yes", ack: "Chat App のカードボタン", note: "Incoming Webhook の場合は認証リンク" },
  { provider: "chatwork", delivery: "no", ack: "認証リンクのみ", note: "API トークンは権限が広いため送信専用で使う" },
];

// ---------- 30 案件終了後の保守窓口 ----------

export const maintenanceDesks: { project: string; version: string; operator: string; desk: string; until: string; open_items: number; former_freelancers: string }[] = [
  { project: "会員アプリ API 開発（β版）", version: "v0.9.2（build 412）", operator: "架空リテール 運用部門（PagerDuty: member-api）", desk: "案件窓口（青木 さくら）", until: "2027-06-30", open_items: 1, former_freelancers: "松田 亮（当番に含めない。窓口経由で相談のみ）" },
  { project: "在庫管理ダッシュボード", version: "v2.3.0", operator: "サンプルソフト 運用当番", desk: "案件窓口（青木 さくら）", until: "2027-03-31", open_items: 0, former_freelancers: "—" },
];

// ---------- 01・35 招待と失効 ----------

export const externalInvites: {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  scope: string;
  status: "active" | "pending" | "expired" | "revoked";
  expires: string;
  last_access?: string;
  reason?: string;
}[] = [
  { id: "INV-301", name: "松田 亮", email: "matsuda@freelance.example", role: "フリーエンジニア", company: "個人事業主", scope: "ORD-0101（受発注システム刷新）、ORD-0104（会員アプリ API）", status: "active", expires: "契約終了まで（2027-03-31）", last_access: "2026-11-27T09:30:00+09:00" },
  { id: "INV-302", name: "林 由香", email: "hayashi@freelance.example", role: "フリーエンジニア", company: "個人事業主", scope: "ORD-0102（受発注システム刷新）", status: "active", expires: "契約終了まで（2027-01-31）", last_access: "2026-11-26T22:10:00+09:00" },
  { id: "INV-303", name: "小川 純", email: "ogawa@freelance.example", role: "フリーエンジニア", company: "個人事業主", scope: "ORD-0103 の条件確認のみ（受諾まで）", status: "pending", expires: "2026-11-30" },
  { id: "INV-304", name: "小松 恵", email: "komatsu@kakuu-shoji.example", role: "発注側承認者", company: "架空商事株式会社", scope: "受発注システム刷新（公開済みの項目と申請）", status: "active", expires: "契約期間（2027-03-31）", last_access: "2026-11-26T15:00:00+09:00" },
  { id: "INV-305", name: "前任の検収担当", email: "old-inspector@kakuu-shoji.example", role: "発注側検収者", company: "架空商事株式会社", scope: "受発注システム刷新", status: "revoked", expires: "—", reason: "担当交代（2026-11-01）。未決の受入依頼は野口 舞へ回付。旧リンクは失効" },
  { id: "INV-306", name: "（転送された招待）", email: "someone@other.example", role: "—", company: "—", scope: "INV-303 の招待 URL", status: "revoked", expires: "—", reason: "招待先と別のメールアドレスで開こうとしたため拒否" },
];

// ---------- 35 取引関係と案件の権限 ----------

export const tradeRelations: { party: string; kind: "JV" | "発注企業" | "受託者"; relation: string; projects: string; roles: string; data: string }[] = [
  { party: "サンプルソフト株式会社", kind: "JV", relation: "受注者（自社）", projects: "全案件", roles: "受注側統括責任者、案件窓口、組織管理者", data: "担当案件の社内値（内部予算・外注単価・粗利）は統括責任者と事業部長のみ" },
  { party: "架空商事株式会社", kind: "発注企業", relation: "外注取引型", projects: "受発注システム刷新", roles: "発注側PJ責任者、承認者、検収者、署名者、管理者", data: "契約額、合意納期、公開済みの進捗・資料" },
  { party: "架空リテール株式会社", kind: "発注企業", relation: "業務提携型", projects: "会員アプリ API 開発", roles: "発注側PJ責任者・署名者", data: "上記に加え、合意した共同費目（共同試験費等）と各社負担" },
  { party: "松田 亮", kind: "受託者", relation: "業務委託（2社から受託）", projects: "ORD-0101、ORD-0104（サンプルソフト）／ORD-0201（デモラボ）", roles: "フリーエンジニア", data: "自分への発注額・条件・提出・検収・支払のみ。依頼元ごとに分離" },
  { party: "林 由香", kind: "受託者", relation: "業務委託", projects: "ORD-0102", roles: "フリーエンジニア", data: "自分への発注額・条件のみ" },
];

export const permissionTests: { actor: string; target: string; via: { url: boolean; search: boolean; export: boolean; notify: boolean; ai: boolean }; result: "denied" | "allowed"; tested_at: string }[] = [
  { actor: "林 由香（受託者）", target: "松田 亮への発注額（ORD-0101）", via: { url: true, search: true, export: true, notify: true, ai: true }, result: "denied", tested_at: "2026-11-26" },
  { actor: "松田 亮（受託者・サンプルソフト選択中）", target: "デモラボの依頼 ORD-0201", via: { url: true, search: true, export: true, notify: true, ai: false }, result: "denied", tested_at: "2026-11-26" },
  { actor: "中村 拓也（架空商事）", target: "会員アプリ API（別顧客）の案件", via: { url: true, search: true, export: true, notify: true, ai: true }, result: "denied", tested_at: "2026-11-26" },
  { actor: "小松 恵（架空商事）", target: "受発注システム刷新の粗利・内部予算", via: { url: true, search: true, export: true, notify: true, ai: true }, result: "denied", tested_at: "2026-11-26" },
  { actor: "藤井 晃（架空リテール）", target: "共同試験費の予算・負担額", via: { url: true, search: true, export: true, notify: true, ai: true }, result: "allowed", tested_at: "2026-11-26" },
  { actor: "前任の検収担当（失効）", target: "受発注システム刷新の受入依頼（旧リンク）", via: { url: true, search: false, export: false, notify: true, ai: false }, result: "denied", tested_at: "2026-11-02" },
];

// ---------- 36 AI 仲介 ----------

export const mediationRecords: {
  id: string;
  at: string;
  purpose: string;
  project: string;
  data_sent: string;
  model: string;
  sources: string;
  grounding: "ok" | "insufficient";
  status: "approved" | "corrected" | "held" | "rejected";
  reviewer: string;
  note: string;
}[] = [
  { id: "MED-0141", at: "2026-11-27T09:40:00+09:00", purpose: "受託者の質問への回答案", project: "受発注システム刷新", data_sent: "SOW v3 §4、MTG-12 決定事項（公開可）", model: "model-family-a / 2026-10", sources: "SOW v3、MTG-12", grounding: "ok", status: "approved", reviewer: "青木 さくら", note: "根拠の版を添えて送信" },
  { id: "MED-0142", at: "2026-11-27T10:05:00+09:00", purpose: "顧客への納入見込みの説明文案", project: "受発注システム刷新", data_sent: "公開版の予定（MS-104 予測）", model: "model-family-a / 2026-10", sources: "公開版 PUB-0007", grounding: "ok", status: "corrected", reviewer: "木村 達也", note: "「12/17 に納入します」を「12/17 の見込み（確約日は 12/10 のまま協議中）」に訂正" },
  { id: "MED-0143", at: "2026-11-27T10:18:00+09:00", purpose: "顧客の質問「試験環境はいつ使えるか」への回答案", project: "受発注システム刷新", data_sent: "公開版の予定のみ", model: "model-family-a / 2026-10", sources: "—", grounding: "insufficient", status: "held", reviewer: "—", note: "根拠となる公開資料がないため、顧客への確認依頼に切替" },
  { id: "MED-0139", at: "2026-11-26T17:30:00+09:00", purpose: "週報（顧客向け）", project: "受発注システム刷新", data_sent: "公開版の進捗", model: "model-family-a / 2026-10", sources: "公開版 PUB-0006", grounding: "ok", status: "rejected", reviewer: "青木 さくら", note: "社内会議の名称が混入したため破棄し、定型の週報に切替" },
];

export const mediationEval: { case: string; total: number; detected: number; held: number; missed: number }[] = [
  { case: "誤った納期の確約", total: 20, detected: 19, held: 19, missed: 1 },
  { case: "他社・他案件の情報の混入", total: 25, detected: 25, held: 25, missed: 0 },
  { case: "根拠のない回答", total: 30, detected: 27, held: 27, missed: 3 },
  { case: "内部金額（予算・単価・粗利）の混入", total: 15, detected: 15, held: 15, missed: 0 },
];
