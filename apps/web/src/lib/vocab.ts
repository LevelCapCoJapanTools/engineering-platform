// 第2章（状態の語彙）と第3章（ロール）。全画面でこの語と色を使い、画面側で独自に定義しない。

export type Tone = "pass" | "fail" | "warn" | "info" | "neutral" | "special";
export type StatusVocab = { label: string; tone: Tone };

export const GATE_STATUS = {
  pass: { label: "通過", tone: "pass" },
  block: { label: "ブロック", tone: "fail" },
  warn: { label: "警告", tone: "warn" },
  exception: { label: "例外適用中", tone: "special" },
  running: { label: "実行中", tone: "info" },
  notRun: { label: "未実行", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type GateStatus = keyof typeof GATE_STATUS;

export const APPROVAL_STATUS = {
  draft: { label: "下書き", tone: "neutral" },
  pending: { label: "承認待ち", tone: "warn" },
  approved: { label: "承認済み", tone: "pass" },
  returned: { label: "差戻し", tone: "fail" },
  withdrawn: { label: "取り下げ", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type ApprovalStatus = keyof typeof APPROVAL_STATUS;

export const ARTIFACT_STATUS = {
  draft: { label: "下書き", tone: "neutral" },
  inReview: { label: "レビュー中", tone: "info" },
  pending: { label: "承認待ち", tone: "warn" },
  approved: { label: "承認済み", tone: "pass" },
  changing: { label: "変更中", tone: "special" },
  obsolete: { label: "廃止", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type ArtifactStatus = keyof typeof ARTIFACT_STATUS;

export const AI_STATUS = {
  unconfirmed: { label: "未確認", tone: "neutral" },
  adopted: { label: "採用", tone: "pass" },
  rejected: { label: "却下", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type AiStatus = keyof typeof AI_STATUS;

export const EXCEPTION_STATUS = {
  applying: { label: "申請中", tone: "warn" },
  active: { label: "有効", tone: "special" },
  expired: { label: "期限切れ", tone: "neutral" },
  rejected: { label: "却下", tone: "fail" },
  withdrawn: { label: "取り下げ", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type ExceptionStatus = keyof typeof EXCEPTION_STATUS;

export const RISK_STATUS = {
  open: { label: "未対応", tone: "fail" },
  inProgress: { label: "対応中", tone: "warn" },
  monitoring: { label: "監視中", tone: "info" },
  done: { label: "完了", tone: "pass" },
} as const satisfies Record<string, StatusVocab>;
export type RiskStatus = keyof typeof RISK_STATUS;

export const CHANGE_STATUS = {
  filed: { label: "起票", tone: "neutral" },
  analyzing: { label: "影響分析中", tone: "info" },
  pending: { label: "承認待ち", tone: "warn" },
  approved: { label: "承認済み", tone: "pass" },
  rejected: { label: "却下", tone: "fail" },
  applied: { label: "反映済み", tone: "pass" },
} as const satisfies Record<string, StatusVocab>;
export type ChangeStatus = keyof typeof CHANGE_STATUS;

export const RELEASE_STATUS = {
  preparing: { label: "準備中", tone: "neutral" },
  gateChecking: { label: "ゲート確認中", tone: "info" },
  pending: { label: "承認待ち", tone: "warn" },
  released: { label: "リリース済み", tone: "pass" },
  accepted: { label: "受入済み", tone: "pass" },
  returned: { label: "差戻し", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type ReleaseStatus = keyof typeof RELEASE_STATUS;

export const EVIDENCE_STATUS = {
  recorded: { label: "記録済み", tone: "neutral" },
  signed: { label: "署名済み", tone: "info" },
  worm: { label: "保管済み（WORM）", tone: "pass" },
  verifyFailed: { label: "検証失敗", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type EvidenceStatus = keyof typeof EVIDENCE_STATUS;

export const CONTROL_STATUS = {
  satisfied: { label: "充足", tone: "pass" },
  partial: { label: "一部充足", tone: "warn" },
  missing: { label: "欠落", tone: "fail" },
  exception: { label: "例外適用中", tone: "special" },
} as const satisfies Record<string, StatusVocab>;
export type ControlStatus = keyof typeof CONTROL_STATUS;

export const MEMBER_STATUS = {
  active: { label: "有効", tone: "pass" },
  invited: { label: "招待中", tone: "warn" },
  disabled: { label: "無効", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type MemberStatus = keyof typeof MEMBER_STATUS;

export const SHARE_STATUS = {
  none: { label: "未発行", tone: "neutral" },
  active: { label: "有効", tone: "pass" },
  expired: { label: "期限切れ", tone: "neutral" },
  revoked: { label: "失効済み", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type ShareStatus = keyof typeof SHARE_STATUS;

export type EnforcementLevel = "warnOnly" | "soft" | "hard";
export const ENFORCEMENT_LEVEL: Record<EnforcementLevel, StatusVocab & { description: string }> = {
  warnOnly: { label: "警告のみ", tone: "warn", description: "ブロックせず、PRに警告を表示する。導入初期の既定" },
  soft: { label: "ソフト", tone: "info", description: "ブロックするが、承認された例外があれば通過できる" },
  hard: { label: "ハード", tone: "fail", description: "ブロックし、例外による通過も認めない" },
};

export type ActorKind = "ci" | "human" | "ai" | "system";
export const ACTOR_KIND: Record<ActorKind, StatusVocab> = {
  ci: { label: "CI", tone: "info" },
  human: { label: "人間", tone: "pass" },
  ai: { label: "AI・参考", tone: "special" },
  system: { label: "システム", tone: "neutral" },
};

export type ControlLayer = "normative" | "guidance" | "tailoring" | "automated";
export const CONTROL_LAYER: Record<ControlLayer, StatusVocab> = {
  normative: { label: "規範", tone: "info" },
  guidance: { label: "ガイド", tone: "neutral" },
  tailoring: { label: "組織調整", tone: "warn" },
  automated: { label: "自動ルール", tone: "special" },
};

export type DataClass = "public" | "internal" | "confidential" | "highlyConfidential";
export const DATA_CLASS: Record<DataClass, StatusVocab & { runtime: string }> = {
  public: { label: "Public", tone: "neutral", runtime: "マネージドの汎用モデル" },
  internal: { label: "Internal", tone: "info", runtime: "学習利用なし・保持なし相当の契約があるエンタープライズAPI" },
  confidential: { label: "Confidential", tone: "warn", runtime: "プライベートエンドポイント／VPC" },
  highlyConfidential: { label: "Highly Confidential", tone: "fail", runtime: "オンプレミス／オープンウェイトモデル" },
};

export type Role =
  // 直接利用者（経営層）。SSOT 2026-11-28 の確定事項
  | "経営者"
  | "役員"
  | "事業責任者"
  | "CTO"
  | "事業部長"
  | "案件スポンサー"
  // 組織の運用
  | "組織管理者"
  | "ポリシー管理者"
  // プロセス上のアクター（既存システムで活動し、外部IDで記録する）
  | "PM"
  | "アナリスト"
  | "設計者"
  | "開発者"
  | "QA"
  | "リリース管理者"
  | "顧客"
  // 外部
  | "評価者"
  | "パートナー管理者"
  // 2026-11-28 追補: 取引の当事者（直接利用者）
  | "受注側統括責任者"
  | "案件窓口"
  | "フリーエンジニア"
  | "発注側プロジェクト責任者"
  | "発注側担当者"
  | "発注側承認者"
  | "発注側検収者"
  | "発注側署名者"
  | "発注側管理者";

/** audience: direct=本サービスに直接ログインする利用者、actor=外部システムで活動し外部IDで記録されるアクター、external=期限付きで閲覧する外部の人 */
export type RoleAudience = "direct" | "actor" | "external";
export const ROLES: { name: Role; org: string; ops: string; audience: RoleAudience }[] = [
  { name: "経営者", org: "開発会社", ops: "ポートフォリオの確認、投資・優先順位・資源配分の判断", audience: "direct" },
  { name: "役員", org: "開発会社", ops: "担当範囲の案件の確認と判断", audience: "direct" },
  { name: "事業責任者", org: "開発会社", ops: "事業ケース、便益、ロードマップの判断", audience: "direct" },
  { name: "CTO", org: "開発会社", ops: "技術リスク、品質統制、例外の判断", audience: "direct" },
  { name: "事業部長", org: "開発会社", ops: "事業部内の案件・要員・予算の判断", audience: "direct" },
  { name: "案件スポンサー", org: "開発会社", ops: "担当案件の継続妥当性、重要判断、エスカレーション対応", audience: "direct" },
  { name: "組織管理者", org: "開発会社", ops: "組織、利用者、連携、プランの管理", audience: "direct" },
  { name: "ポリシー管理者", org: "開発会社", ops: "ゲートのルールと Control Pack の管理", audience: "direct" },
  { name: "PM", org: "開発会社", ops: "計画、進捗、リスク、変更（課題・計画管理で実施）", audience: "actor" },
  { name: "アナリスト", org: "開発会社", ops: "要求の作成・管理（文書・課題管理で実施）", audience: "actor" },
  { name: "設計者", org: "開発会社", ops: "設計、ADR、レビュー（Git で実施）", audience: "actor" },
  { name: "開発者", org: "開発会社", ops: "実装、PR（Git で実施）", audience: "actor" },
  { name: "QA", org: "開発会社", ops: "テスト、検証結果の記録（CI・テスト管理で実施）", audience: "actor" },
  { name: "リリース管理者", org: "開発会社", ops: "リリース準備と承認（リリース管理で実施）", audience: "actor" },
  { name: "顧客", org: "発注元", ops: "要求承認、変更承認、受入（期限付きの承認リンクまたは顧客ポータル）", audience: "actor" },
  { name: "評価者", org: "外部", ops: "共有された監査パックの閲覧のみ（期限付き）", audience: "external" },
  { name: "パートナー管理者", org: "コンサル等", ops: "委任された顧客組織の横断管理", audience: "external" },
  { name: "受注側統括責任者", org: "受注側（JV）", ops: "受注・予算・遂行・顧客への公開範囲の統括（JV責任者）", audience: "direct" },
  { name: "案件窓口", org: "本サービス", ops: "顧客との往復、条件変更の折衝、リリース調整、受入の回収", audience: "direct" },
  { name: "フリーエンジニア", org: "受託者", ops: "条件の確認と受諾、成果の提出、合意範囲の修正", audience: "direct" },
  { name: "発注側プロジェクト責任者", org: "発注企業", ops: "自社の案件の判断、権限者の指名", audience: "direct" },
  { name: "発注側担当者", org: "発注企業", ops: "公開された資料の閲覧、レビュー、資料の提出", audience: "direct" },
  { name: "発注側承認者", org: "発注企業", ops: "申請の承認・差戻し（決裁上限の範囲）", audience: "direct" },
  { name: "発注側検収者", org: "発注企業", ops: "納入物の受入試験と受入・差戻し", audience: "direct" },
  { name: "発注側署名者", org: "発注企業", ops: "契約の締結（電子契約サービスで署名）", audience: "direct" },
  { name: "発注側管理者", org: "発注企業", ops: "自社の閲覧者・承認者・検収者・署名者と代理の登録", audience: "direct" },
];

/** 経営層（直接利用者）のロール */
export const EXECUTIVE_ROLES: Role[] = ["経営者", "役員", "事業責任者", "CTO", "事業部長", "案件スポンサー"];

export const PRODUCT_NAME = "Product Name";
export const COMPLIANCE_PHRASE = "ISO/IEC 29110 の適合準備を支援";
export const STANDARD_REFS = [
  "ISO/IEC 29110-4-1:2018",
  "ISO/IEC 29110-5-1-2:2025",
  "ISO/IEC 29110-5-5:2026",
  "ISO/IEC 29110-3-2:2018",
];

// ---- 2026-11-28 追加: 経営判断、同期、連携、通知、オンコール ----

export const SEVERITY = {
  critical: { label: "緊急", tone: "fail" },
  high: { label: "高", tone: "fail" },
  medium: { label: "中", tone: "warn" },
  low: { label: "低", tone: "info" },
  info: { label: "情報", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type Severity = keyof typeof SEVERITY;

/** 同期の健全性。古い情報を「最新」と誤認させないため、鮮度と状態を常に併記する */
export const SYNC_STATUS = {
  healthy: { label: "同期中", tone: "pass" },
  delayed: { label: "遅延", tone: "warn" },
  stale: { label: "古い情報", tone: "warn" },
  failing: { label: "同期失敗", tone: "fail" },
  authExpired: { label: "再認可が必要", tone: "fail" },
  initialSync: { label: "初回同期中", tone: "info" },
  paused: { label: "停止中", tone: "neutral" },
  disconnected: { label: "未接続", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type SyncStatus = keyof typeof SYNC_STATUS;

/** 日付の確度。確約（顧客と合意）／目標（社内目標）／予測（最新の見込み）／実績 */
export const DATE_CONFIDENCE = {
  committed: { label: "確約", tone: "info" },
  target: { label: "目標", tone: "neutral" },
  forecast: { label: "予測", tone: "special" },
  actual: { label: "実績", tone: "pass" },
} as const satisfies Record<string, StatusVocab>;
export type DateConfidence = keyof typeof DATE_CONFIDENCE;

/** 案件・プロジェクトの健全性（経営向け） */
export const HEALTH = {
  onTrack: { label: "順調", tone: "pass" },
  atRisk: { label: "注意", tone: "warn" },
  offTrack: { label: "遅延", tone: "fail" },
  unknown: { label: "判定不可", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type Health = keyof typeof HEALTH;

/** 経営判断の状態 */
export const DECISION_STATUS = {
  pending: { label: "判断待ち", tone: "warn" },
  approved: { label: "承認", tone: "pass" },
  conditional: { label: "条件付き承認", tone: "special" },
  onHold: { label: "保留", tone: "neutral" },
  rejected: { label: "却下", tone: "fail" },
  delegated: { label: "担当者へ回付", tone: "info" },
} as const satisfies Record<string, StatusVocab>;
export type DecisionStatus = keyof typeof DECISION_STATUS;

/** 事業ケース（案件受付）の状態 */
export const CASE_STATUS = {
  draft: { label: "作成中", tone: "neutral" },
  submitted: { label: "提出済み", tone: "info" },
  reviewing: { label: "審議中", tone: "warn" },
  approved: { label: "開始承認", tone: "pass" },
  onHold: { label: "保留", tone: "neutral" },
  rejected: { label: "却下", tone: "fail" },
  closed: { label: "終了", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type CaseStatus = keyof typeof CASE_STATUS;

/** 通知の配信状態（Outbox） */
export const DELIVERY_STATUS = {
  queued: { label: "送信待ち", tone: "neutral" },
  sending: { label: "送信中", tone: "info" },
  delivered: { label: "配信済み", tone: "pass" },
  accepted: { label: "受付済み（配信確認なし）", tone: "info" },
  retrying: { label: "再試行中", tone: "warn" },
  failed: { label: "失敗", tone: "fail" },
  deadLetter: { label: "再処理待ち", tone: "fail" },
  suppressed: { label: "集約・抑止", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type DeliveryStatus = keyof typeof DELIVERY_STATUS;

/** インシデントの状態。Ack（受領）と Resolve（解決）を区別する */
export const INCIDENT_STATUS = {
  triggered: { label: "未受領", tone: "fail" },
  acknowledged: { label: "受領済み", tone: "warn" },
  resolved: { label: "解決", tone: "pass" },
} as const satisfies Record<string, StatusVocab>;
export type IncidentStatus = keyof typeof INCIDENT_STATUS;

/** プロバイダーの能力の対応度 */
export const CAPABILITY = {
  yes: { label: "対応", tone: "pass" },
  partial: { label: "一部対応", tone: "warn" },
  no: { label: "非対応", tone: "neutral" },
  planned: { label: "予定", tone: "info" },
} as const satisfies Record<string, StatusVocab>;
export type CapabilityLevel = keyof typeof CAPABILITY;

/** 外部チェック結果の異常。どれも「通過」として扱わない */
export const CHECK_ANOMALY = {
  staleSha: { label: "古いコミットの結果", tone: "warn" },
  missing: { label: "必須チェックなし", tone: "fail" },
  duplicate: { label: "重複", tone: "warn" },
  cancelled: { label: "キャンセル", tone: "neutral" },
  timeout: { label: "タイムアウト", tone: "fail" },
  unknownProvider: { label: "提供元不明", tone: "fail" },
  signatureMismatch: { label: "署名不一致", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type CheckAnomaly = keyof typeof CHECK_ANOMALY;

export type ConnectorCategory = "scm" | "ci" | "planning" | "calendar" | "chat" | "oncall" | "storage" | "idp";
export const CONNECTOR_CATEGORY: Record<ConnectorCategory, { label: string; description: string }> = {
  scm: { label: "コードホスティング", description: "リポジトリ、PR/MR、コミット、レビュー、ブランチ保護" },
  ci: { label: "CI・品質ツール", description: "ビルド、テスト結果、SAST、依存関係、SBOM、成果物" },
  planning: { label: "課題・計画管理", description: "計画、作業項目、マイルストーン、依存関係、担当" },
  calendar: { label: "共有カレンダー", description: "経営会議・顧客会議・レビューの日程（許可した共有カレンダーのみ）" },
  chat: { label: "チャット通知", description: "通知の配信と、対応するチャネルでの応答操作" },
  oncall: { label: "オンコール管理", description: "当番表、エスカレーション、インシデント（正本はオンコール管理サービス）" },
  storage: { label: "証跡の保管先", description: "追記専用（WORM）の保管先と署名鍵" },
  idp: { label: "ID基盤", description: "SSO、利用者の無効化の反映" },
};

/** 連携できるサービス。拡張候補は planned とする */
export type ProviderKey =
  | "github" | "gitlab" | "codecommit" | "azureRepos" | "bitbucket" | "gitea"
  | "githubActions" | "gitlabCi" | "codebuild" | "azurePipelines" | "jenkins"
  | "githubProjects" | "gitlabIssues" | "azureBoards" | "jira"
  | "googleCalendar" | "m365Calendar"
  | "slack" | "discord" | "teams" | "mattermost" | "googleChat" | "chatwork" | "webhook" | "email"
  | "pagerduty" | "jsmOps" | "opsgenie"
  | "s3ObjectLock" | "azureImmutable"
  | "samlIdp";
export const PROVIDERS: Record<ProviderKey, { label: string; category: ConnectorCategory; status: "available" | "beta" | "planned" | "deprecated"; note?: string }> = {
  github: { label: "GitHub", category: "scm", status: "available", note: "GitHub.com／Enterprise Cloud・Server" },
  gitlab: { label: "GitLab", category: "scm", status: "beta", note: "GitLab.com／Self-Managed" },
  codecommit: { label: "AWS CodeCommit", category: "scm", status: "beta", note: "AWS アカウント・リージョン単位。計画管理は別途接続が必要" },
  azureRepos: { label: "Azure Repos", category: "scm", status: "beta", note: "Azure DevOps Services／Server" },
  bitbucket: { label: "Bitbucket", category: "scm", status: "planned", note: "Cloud／Data Center（拡張候補）" },
  gitea: { label: "Gitea／Forgejo", category: "scm", status: "planned", note: "汎用 Webhook＋REST アダプター（拡張候補）" },
  githubActions: { label: "GitHub Actions", category: "ci", status: "available" },
  gitlabCi: { label: "GitLab CI", category: "ci", status: "beta" },
  codebuild: { label: "AWS CodeBuild／CodePipeline", category: "ci", status: "beta" },
  azurePipelines: { label: "Azure Pipelines", category: "ci", status: "beta" },
  jenkins: { label: "Jenkins", category: "ci", status: "planned" },
  githubProjects: { label: "GitHub Projects", category: "planning", status: "available" },
  gitlabIssues: { label: "GitLab Issues／Milestones", category: "planning", status: "beta" },
  azureBoards: { label: "Azure Boards", category: "planning", status: "beta" },
  jira: { label: "Jira", category: "planning", status: "beta" },
  googleCalendar: { label: "Google Calendar", category: "calendar", status: "available" },
  m365Calendar: { label: "Microsoft 365 Calendar", category: "calendar", status: "available" },
  slack: { label: "Slack", category: "chat", status: "available" },
  discord: { label: "Discord", category: "chat", status: "available", note: "Webhook は送信専用" },
  teams: { label: "Microsoft Teams", category: "chat", status: "available", note: "Workflows または通知 Bot" },
  mattermost: { label: "Mattermost", category: "chat", status: "beta" },
  googleChat: { label: "Google Chat", category: "chat", status: "beta" },
  chatwork: { label: "Chatwork", category: "chat", status: "beta" },
  webhook: { label: "汎用 Webhook", category: "chat", status: "available" },
  email: { label: "メール", category: "chat", status: "available" },
  pagerduty: { label: "PagerDuty", category: "oncall", status: "available" },
  jsmOps: { label: "Jira Service Management Operations", category: "oncall", status: "planned" },
  opsgenie: { label: "Opsgenie", category: "oncall", status: "deprecated", note: "提供元がサポート終了を告知済み。新規接続は非推奨" },
  s3ObjectLock: { label: "Amazon S3 Object Lock", category: "storage", status: "available" },
  azureImmutable: { label: "Azure Immutable Blob", category: "storage", status: "beta" },
  samlIdp: { label: "SAML IdP", category: "idp", status: "available" },
};

// ---- 2026-11-28 追補: 発注企業・受注側JV・フリーエンジニアの取引 ----

/** 顧客との関係の型 */
export const RELATIONSHIP = {
  outsourcing: { label: "外注取引型", tone: "info" },
  alliance: { label: "業務提携型", tone: "special" },
} as const satisfies Record<string, StatusVocab>;
export type Relationship = keyof typeof RELATIONSHIP;

/** 受託者への発注（依頼書）の状態。受諾は版に紐付く */
export const ORDER_STATUS = {
  draft: { label: "作成中", tone: "neutral" },
  offered: { label: "回答待ち", tone: "warn" },
  negotiating: { label: "条件を相談中", tone: "info" },
  accepted: { label: "受諾済み", tone: "pass" },
  declined: { label: "辞退", tone: "neutral" },
  superseded: { label: "新しい版あり", tone: "special" },
  cancelled: { label: "中止", tone: "fail" },
  completed: { label: "完了", tone: "pass" },
} as const satisfies Record<string, StatusVocab>;
export type OrderStatus = keyof typeof ORDER_STATUS;

/** 受託者の提出 */
export const SUBMISSION_STATUS = {
  none: { label: "未提出", tone: "neutral" },
  draft: { label: "下書き", tone: "neutral" },
  submitted: { label: "提出済み", tone: "info" },
  verifying: { label: "照合中", tone: "info" },
  needsInfo: { label: "確認待ち", tone: "warn" },
  resubmitted: { label: "再提出済み", tone: "info" },
} as const satisfies Record<string, StatusVocab>;
export type SubmissionStatus = keyof typeof SUBMISSION_STATUS;

/** 委託元（受注側）による検収。最終顧客の受入とは別 */
export const INSPECTION_STATUS = {
  notStarted: { label: "検収前", tone: "neutral" },
  inProgress: { label: "検収中", tone: "info" },
  passed: { label: "検収済み", tone: "pass" },
  partial: { label: "一部検収", tone: "special" },
  returned: { label: "差戻し", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type InspectionStatus = keyof typeof INSPECTION_STATUS;

/** 実環境への配備 */
export const DEPLOY_STATUS = {
  notReady: { label: "未準備", tone: "neutral" },
  permitted: { label: "実行許可済み", tone: "info" },
  requested: { label: "起動依頼済み", tone: "info" },
  running: { label: "配備中", tone: "info" },
  unconfirmed: { label: "結果未確認", tone: "warn" },
  succeeded: { label: "配備済み（確認済み）", tone: "pass" },
  failed: { label: "配備失敗", tone: "fail" },
  rolledBack: { label: "切戻し済み", tone: "special" },
} as const satisfies Record<string, StatusVocab>;
export type DeployStatus = keyof typeof DEPLOY_STATUS;

/** 最終顧客の受入 */
export const CUSTOMER_ACCEPTANCE = {
  notRequested: { label: "依頼前", tone: "neutral" },
  requested: { label: "回答待ち", tone: "warn" },
  partial: { label: "一部受入", tone: "special" },
  accepted: { label: "受入済み", tone: "pass" },
  returned: { label: "差戻し", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type CustomerAcceptance = keyof typeof CUSTOMER_ACCEPTANCE;

/** 受託者への支払。顧客の受入待ちで支払期日を繰り下げない */
export const PAYMENT_STATUS = {
  notDue: { label: "支払予定", tone: "neutral" },
  invoiced: { label: "請求受領", tone: "info" },
  approved: { label: "支払承認済み", tone: "info" },
  paid: { label: "支払済み", tone: "pass" },
  mismatch: { label: "金額・期日の不一致", tone: "fail" },
  overdue: { label: "支払期日超過", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type PaymentStatus = keyof typeof PAYMENT_STATUS;

/** 問い合わせ（窓口の往復） */
export const INQUIRY_STATUS = {
  received: { label: "受付済み", tone: "info" },
  askingCustomer: { label: "顧客へ確認中", tone: "warn" },
  drafting: { label: "回答案を作成中", tone: "info" },
  answered: { label: "回答済み", tone: "pass" },
  onHold: { label: "保留（案件不明）", tone: "neutral" },
  escalated: { label: "代理へ引継ぎ", tone: "special" },
} as const satisfies Record<string, StatusVocab>;
export type InquiryStatus = keyof typeof INQUIRY_STATUS;

/** 顧客への公開 */
export const DISCLOSURE_STATUS = {
  hidden: { label: "非公開", tone: "neutral" },
  draft: { label: "公開前の確認中", tone: "warn" },
  published: { label: "公開中", tone: "pass" },
  expired: { label: "期限切れ", tone: "neutral" },
  stopped: { label: "公開停止", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type DisclosureStatus = keyof typeof DISCLOSURE_STATUS;

/** 契約 */
export const CONTRACT_STATUS = {
  draft: { label: "案", tone: "neutral" },
  negotiating: { label: "協議中", tone: "info" },
  reviewed: { label: "確認済み（未締結）", tone: "warn" },
  signing: { label: "署名待ち", tone: "warn" },
  signed: { label: "締結済み", tone: "pass" },
  declined: { label: "署名辞退", tone: "fail" },
  superseded: { label: "改訂済み", tone: "neutral" },
} as const satisfies Record<string, StatusVocab>;
export type ContractStatus = keyof typeof CONTRACT_STATUS;

/** 知的資産の扱い */
export const IP_DISPOSITION = {
  assign: { label: "譲渡", tone: "info" },
  retain: { label: "保有継続", tone: "neutral" },
  joint: { label: "共同保有", tone: "special" },
  license: { label: "利用許諾", tone: "warn" },
  undecided: { label: "未合意", tone: "fail" },
} as const satisfies Record<string, StatusVocab>;
export type IpDisposition = keyof typeof IP_DISPOSITION;

/** 誰に見えるか（公開範囲の表示） */
export const AUDIENCE = {
  internal: { label: "社内のみ", tone: "neutral" },
  customer: { label: "顧客に公開", tone: "info" },
  alliance: { label: "提携先と共有", tone: "special" },
  freelancer: { label: "受託者本人のみ", tone: "warn" },
} as const satisfies Record<string, StatusVocab>;
export type Audience = keyof typeof AUDIENCE;
