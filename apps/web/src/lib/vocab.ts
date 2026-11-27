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
  | "組織管理者"
  | "PM"
  | "アナリスト"
  | "設計者"
  | "開発者"
  | "QA"
  | "リリース管理者"
  | "ポリシー管理者"
  | "顧客"
  | "評価者"
  | "パートナー管理者";

export const ROLES: { name: Role; org: string; ops: string }[] = [
  { name: "組織管理者", org: "開発会社", ops: "組織、メンバー、連携、プランの管理" },
  { name: "PM", org: "開発会社", ops: "計画、進捗、リスク、変更、リリース判断" },
  { name: "アナリスト", org: "開発会社", ops: "要求の作成・管理" },
  { name: "設計者", org: "開発会社", ops: "設計、ADR、レビュー" },
  { name: "開発者", org: "開発会社", ops: "実装、PR" },
  { name: "QA", org: "開発会社", ops: "テスト、検証結果の記録" },
  { name: "リリース管理者", org: "開発会社", ops: "リリース承認" },
  { name: "ポリシー管理者", org: "開発会社", ops: "ゲートのルールと Control Pack の管理" },
  { name: "顧客", org: "発注元", ops: "自案件の要求承認、変更承認、受入" },
  { name: "評価者", org: "外部", ops: "共有された監査パックの閲覧のみ（期限付き）" },
  { name: "パートナー管理者", org: "コンサル等", ops: "複数の顧客組織の横断管理" },
];

export const PRODUCT_NAME = "Product Name";
export const COMPLIANCE_PHRASE = "ISO/IEC 29110 の適合準備を支援";
export const STANDARD_REFS = [
  "ISO/IEC 29110-4-1:2018",
  "ISO/IEC 29110-5-1-2:2025",
  "ISO/IEC 29110-5-5:2026",
  "ISO/IEC 29110-3-2:2018",
];
