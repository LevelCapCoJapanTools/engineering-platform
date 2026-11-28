// 画面が受け取るデータの型。項目名は将来のAPIに合わせて snake_case にする。
import type {
  ActorKind,
  AiStatus,
  ApprovalStatus,
  ArtifactStatus,
  ChangeStatus,
  ControlLayer,
  ControlStatus,
  DataClass,
  EnforcementLevel,
  EvidenceStatus,
  ExceptionStatus,
  GateStatus,
  MemberStatus,
  ReleaseStatus,
  RiskStatus,
  Role,
  CaseStatus,
  ConnectorCategory,
  DateConfidence,
  DecisionStatus,
  Health,
  IncidentStatus,
  ProviderKey,
  Severity,
  SyncStatus,
  Audience,
  CustomerAcceptance,
  DeployStatus,
  InquiryStatus,
  InspectionStatus,
  OrderStatus,
  PaymentStatus,
  Relationship,
  SubmissionStatus,
} from "./vocab";

export type UserKind = "member" | "external" | "agent";

export type User = {
  id: string;
  name: string;
  initials: string;
  email: string;
  roles: Role[];
  kind: UserKind;
  status: MemberStatus;
  company?: string;
  github?: string;
  /** 役職（経営層の表示用） */
  title?: string;
  /** 本サービスに直接ログインするか。false はプロセス上のアクター（外部IDだけで記録） */
  account?: boolean;
  /** 外部システムの本人ID。活動記録の主体をこれで対応付ける */
  external_ids?: { provider: ProviderKey; handle: string }[];
  joined_at?: string;
  last_active_at?: string;
};

export type ActorRef = { kind: ActorKind; name: string; user_id?: string };

export type Org = { id: string; slug: string; name: string; initials: string; plan: string; project_count: number; my_roles: Role[]; pending_approvals: number };

export type Phase = "planning" | "requirements" | "design" | "construction" | "integration" | "delivery";
export const PHASES: { key: Phase; label: string }[] = [
  { key: "planning", label: "計画" },
  { key: "requirements", label: "要求" },
  { key: "design", label: "設計" },
  { key: "construction", label: "実装" },
  { key: "integration", label: "結合・テスト" },
  { key: "delivery", label: "納入" },
];

export type Repo = { id: string; full_name: string; visibility: "private" | "public" | "internal"; default_branch: string; updated_at: string };

export type GateLetter = "A" | "B" | "C" | "D";
export type GateSet = Record<GateLetter, GateStatus>;
export const GATE_NAMES: Record<GateLetter, string> = {
  A: "Structural",
  B: "Traceability & Quality",
  C: "Human Authority",
  D: "Evidence Integrity",
};
export const GATE_LABELS: Record<GateLetter, string> = {
  A: "構造",
  B: "トレーサビリティと品質",
  C: "人間の承認",
  D: "証跡の完全性",
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  customer: string;
  phase: Phase;
  control_pack: string;
  pack_version: string;
  pack_outdated: boolean;
  enforcement: EnforcementLevel;
  data_class: DataClass;
  repos: string[];
  main_gates: GateSet;
  trace_linked: number;
  trace_total: number;
  open_risks: number;
  open_changes: number;
  blocked_prs: number;
  active_exceptions: number;
  next_release?: { version: string; date: string };
  member_ids: string[];
  updated_at: string;
  archived?: boolean;
};

export type Requirement = {
  id: string;
  title: string;
  kind: "functional" | "nonFunctional";
  priority: "high" | "medium" | "low";
  status: ArtifactStatus;
  owner_id: string;
  body: string;
  acceptance_criteria: string[];
  source: string;
  design_ids: string[];
  pr_numbers: number[];
  test_ids: string[];
  ai_open_findings: number;
  version: number;
  updated_at: string;
  data_class: DataClass;
};

export type Design = {
  id: string;
  title: string;
  kind: "architecture" | "detailed" | "adr";
  status: ArtifactStatus;
  requirement_ids: string[];
  author_id: string;
  reviewer_ids: string[];
  updated_at: string;
};

export type TestCase = {
  id: string;
  title: string;
  kind: "unit" | "integration" | "acceptance";
  requirement_ids: string[];
  last_result: "passed" | "failed" | "skipped" | "notRun";
};

export type AiFindingKind = "ambiguity" | "conflict" | "testability" | "missing" | "linkCandidate" | "impact" | "delay" | "extraction" | "suspicious";
export const AI_FINDING_KIND: Record<AiFindingKind, string> = {
  ambiguity: "曖昧性",
  conflict: "矛盾",
  testability: "テスト可能性",
  missing: "不足",
  linkCandidate: "リンク候補",
  impact: "影響候補",
  delay: "遅延の予兆",
  extraction: "抽出結果",
  suspicious: "不審な指示",
};

export type AiFinding = {
  id: string;
  kind: AiFindingKind;
  severity: "high" | "medium" | "low";
  confidence: number;
  target_id: string;
  excerpt: string;
  highlight: string;
  explanation: string;
  suggestion?: string;
  model: string;
  template_version: string;
  status: AiStatus;
  stale?: boolean;
  decided_by?: string;
  reject_reason?: string;
  created_at: string;
};

export type GateReason = {
  rule_id: string;
  gate: GateLetter;
  result: "block" | "warn" | "pass";
  message: string;
  target?: string;
  fix?: string;
  exception_allowed: boolean;
};

export type GateRun = {
  id: string;
  pr_number?: number;
  pr_title: string;
  branch: string;
  commit_sha: string;
  author: ActorRef;
  gates: GateSet;
  verdict: GateStatus;
  enforcement: EnforcementLevel;
  policy_version: string;
  policy_sha256: string;
  input_sha256: string;
  ci_run_id: string;
  started_at: string;
  reasons: GateReason[];
  exception_id?: string;
  required_approvals: { role: Role; user_id?: string; status: ApprovalStatus }[];
};

export type ExceptionRecord = {
  id: string;
  rule_id: string;
  gate: GateLetter;
  target: string;
  requester_id: string;
  approver_id: string;
  status: ExceptionStatus;
  requested_at: string;
  expires_at: string;
  reason: string;
  risk: string;
  mitigation?: string;
};

export type Release = {
  id: string;
  version: string;
  title: string;
  status: ReleaseStatus;
  gate: GateStatus;
  approver_id?: string;
  acceptance: ApprovalStatus | "notRequested";
  manifest_id?: string;
  signature: "unsigned" | "signed" | "verified" | "failed";
  planned_at: string;
  released_at?: string;
};

export type Control = {
  id: string;
  description: string;
  layer: ControlLayer;
  process: "PM" | "SI";
  activity: string;
  status: ControlStatus;
  machine_rule_ids: string[];
  human_role?: Role;
  evidence_types: string[];
  evidence_count: number;
  source_ref: string;
  updated_at: string;
};

export type Evidence = {
  id: string;
  kind: string;
  title: string;
  source: ActorRef;
  sha256: string;
  recorded_at: string;
  status: EvidenceStatus;
  missing?: boolean;
};

export type Manifest = {
  id: string;
  target: string;
  target_kind: "release" | "gateRun";
  created_at: string;
  signature: "unsigned" | "signed" | "verified" | "failed";
  retention: "pending" | "stored" | "expiring";
  retention_until: string;
  approval_count: number;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: ActorRef;
  action: string;
  target: string;
  detail?: string;
};

export type ChangeRequest = {
  id: string;
  title: string;
  filed_by: string;
  filed_by_kind: "customer" | "internal";
  status: ChangeStatus;
  impact_count: number;
  approver_id?: string;
  filed_at: string;
};

export type Risk = {
  id: string;
  kind: "risk" | "corrective";
  title: string;
  impact: 1 | 2 | 3 | 4 | 5;
  likelihood: 1 | 2 | 3 | 4 | 5;
  status: RiskStatus;
  owner_id: string;
  due_at: string;
  related: string[];
};

export type ApprovalKind = "requirement" | "design" | "change" | "exception" | "release" | "acceptance" | "plan" | "tailoring" | "verification";
export const APPROVAL_KIND: Record<ApprovalKind, string> = {
  requirement: "要求",
  design: "設計",
  change: "変更",
  exception: "例外",
  release: "リリース",
  acceptance: "受入",
  plan: "計画",
  tailoring: "テーラリング",
  verification: "検証",
};

export type ApprovalRequest = {
  id: string;
  kind: ApprovalKind;
  target_id: string;
  title: string;
  project_slug: string;
  project_name: string;
  requester_id: string;
  requested_at: string;
  due_at: string;
};

export type Approver = {
  role: Role;
  user_id?: string;
  status: ApprovalStatus;
  decided_at?: string;
  comment?: string;
};

export type Notification = {
  id: string;
  kind: "approval" | "gate" | "exception" | "comment" | "release" | "system";
  text: string;
  at: string;
  read: boolean;
  link?: string;
};


// ---- 2026-11-28 追加: 経営判断・同期・連携 ----

/** データの出典。経営向け表示では常に正本と最終同期時刻を併記する */
export type SourceRef = { provider: ProviderKey; label?: string; url?: string; synced_at?: string; status?: SyncStatus };

export type ConnectorInstallation = {
  id: string;
  provider: ProviderKey;
  category: ConnectorCategory;
  name: string;
  /** 対象（組織、プロジェクト、カレンダー、チャンネル等） */
  scope: string;
  hosting?: string;
  status: SyncStatus;
  last_success_at?: string;
  last_attempt_at?: string;
  lag_minutes?: number;
  object_count?: number;
  error?: string;
  installed_by: string;
  credential_rotated_at?: string;
  mode: "read" | "readWriteStatus" | "send" | "interactive";
};

export type ProjectHealth = {
  slug: string;
  health: Health;
  sponsor_id: string;
  division: string;
  baseline_end: string;
  forecast_end: string;
  slip_days: number;
  budget: number;
  actual_cost: number;
  forecast_cost: number;
  evidence_readiness: number;
  next_decision?: { date: string; title: string };
  source: SourceRef;
  ai_summary?: string;
};

export type Milestone = {
  id: string;
  project: string;
  title: string;
  kind: "milestone" | "delivery" | "release" | "review";
  baseline: string;
  revised?: string;
  forecast?: string;
  actual?: string;
  confidence: DateConfidence;
  owner: string;
  depends_on?: string[];
  source: SourceRef;
  change_reason?: string;
  approved_by?: string;
};

export type Decision = {
  id: string;
  title: string;
  kind: "investment" | "priority" | "resource" | "riskAcceptance" | "exception" | "release" | "change" | "budget" | "benefit";
  project?: string;
  case_id?: string;
  status: DecisionStatus;
  due: string;
  impact: string;
  impact_yen?: number;
  severity: Severity;
  requested_by: string;
  decider_id?: string;
  /** 実務上の承認者が経営層ではない場合の正しい承認者 */
  practical_approver?: string;
  options?: string[];
  decided_at?: string;
  reason?: string;
  conditions?: string;
  follow_up?: { title: string; owner: string; due: string; done: boolean }[];
  evidence: string[];
};

export type BusinessCase = {
  id: string;
  title: string;
  status: CaseStatus;
  customer?: string;
  sponsor_id: string;
  proposer: string;
  strategy: string;
  problem: string;
  options: { name: string; cost: number; benefit: string; risk: string; recommended?: boolean }[];
  cost: number;
  expected_benefit: string;
  value_score: number;
  urgency: number;
  risk_score: number;
  kpis: { name: string; baseline: string; target: string; actual?: string; measured_at?: string; source?: string }[];
  review_date?: string;
  project?: string;
  submitted_at: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  project?: string;
  start: string;
  end?: string;
  all_day?: boolean;
  timezone: string;
  status: "confirmed" | "moved" | "cancelled";
  recurring?: boolean;
  organizer: string;
  calendar: string;
  source: SourceRef;
  decision_due?: string;
};

export type Incident = {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  service: string;
  project?: string;
  environment: string;
  triggered_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  escalation_level: number;
  related_release?: string;
  dedup_key: string;
};


// ---- 2026-11-28 追補: 発注企業・受注側JV・フリーエンジニアの取引 ----

/** 案件と顧客企業の関係（案件ごとに型と公開範囲を持つ） */
export type Engagement = {
  project: string;
  customer_company: string;
  relationship: Relationship;
  /** 受注側統括責任者（JV責任者） */
  jv_lead_id: string;
  /** 発注側プロジェクト責任者 */
  customer_lead_id: string;
  contract_amount: number;
  /** JV内部予算（顧客には初期非公開） */
  internal_budget: number;
  /** 受託者への委託費の合計（顧客には初期非公開） */
  commission_total: number;
  contract_period: { start: string; end: string };
  /** 業務提携型の共同費目（合意した費目だけ） */
  joint_items?: { name: string; budget: number; actual: number; share: { company: string; ratio: number }[] }[];
};

/** 受託者への発注条件の1つの版。受諾は版に紐付く */
export type OrderTerms = {
  version: number;
  issued_at: string;
  scope: string[];
  out_of_scope: string[];
  deliverable: string;
  delivery_to: string;
  due: string;
  completion_criteria: string[];
  inspection_due: string;
  fee: number;
  payment_due: string;
  payment_method: string;
  change_note?: string;
};

export type Order = {
  id: string;
  project: string;
  title: string;
  freelancer_id: string;
  /** 依頼元（受注側の会社） */
  client_company: string;
  status: OrderStatus;
  terms: OrderTerms[];
  accepted_version?: number;
  accepted_at?: string;
  milestone_id?: string;
  next_actor: "freelancer" | "desk" | "customer" | "inspector" | "none";
  next_action: string;
  next_due?: string;
  submission: SubmissionStatus;
  inspection: InspectionStatus;
  deploy: DeployStatus;
  customer_acceptance: CustomerAcceptance;
  payment: PaymentStatus;
};

export type Submission = {
  id: string;
  order_id: string;
  version: number;
  submitted_at: string;
  external_url: string;
  commit_sha: string;
  artifact?: string;
  checks: string;
  notes?: string;
  verification: "matched" | "pending" | "mismatch" | "unavailable";
};

export type Inquiry = {
  id: string;
  project: string;
  order_id?: string;
  from: "freelancer" | "customer" | "jv";
  asker_id: string;
  subject: string;
  body: string;
  status: InquiryStatus;
  owner_id: string;
  deputy_id?: string;
  due: string;
  answer?: string;
  answered_at?: string;
  sources?: string[];
  audience: Audience;
};
