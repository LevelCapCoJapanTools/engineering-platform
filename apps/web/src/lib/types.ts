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
