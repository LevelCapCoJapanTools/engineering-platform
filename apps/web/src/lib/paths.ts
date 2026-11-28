// 全画面のルート。画面間のリンクは必ずこの関数で作る。
// 本番のURL設計ではない（移植先で決める）。モックの画面遷移のためだけに使う。

const o = (org: string) => `/o/${org}`;
const p = (org: string, project: string) => `/o/${org}/p/${project}`;

export const paths = {
  // 公開サイト
  home: () => "/",
  features: () => "/features",
  pricing: () => "/pricing",
  security: () => "/security",
  standards: () => "/standards",
  contact: () => "/contact",
  terms: () => "/terms",
  privacy: () => "/privacy",
  cases: () => "/cases",
  caseDetail: (id: string) => `/cases/${id}`,

  // 認証・オンボーディング
  signin: () => "/signin",
  invite: (token: string) => `/invite/${token}`,
  orgs: () => "/orgs",
  onboardingOrg: () => "/onboarding/org",
  onboardingGithub: () => "/onboarding/github",
  onboardingRepos: () => "/onboarding/repos",
  onboardingProfile: () => "/onboarding/profile",
  onboardingMembers: () => "/onboarding/members",
  onboardingAi: () => "/onboarding/ai",
  onboardingDone: () => "/onboarding/done",
  onboardingPlanning: () => "/onboarding/planning",
  onboardingNotify: () => "/onboarding/notify",
  onboardingScope: () => "/onboarding/scope",

  // 組織
  orgHome: (org: string) => o(org),
  inbox: (org: string) => `${o(org)}/inbox`,
  notifications: (org: string) => `${o(org)}/notifications`,
  projects: (org: string) => `${o(org)}/projects`,
  projectNew: (org: string) => `${o(org)}/projects/new`,
  search: (org: string) => `${o(org)}/search`,

  // 経営（2026-11-28 追加。直接利用者は経営層）
  portfolio: (org: string) => `${o(org)}/portfolio`,
  decisions: (org: string) => `${o(org)}/decisions`,
  decision: (org: string, id: string) => `${o(org)}/decisions/${id}`,
  intake: (org: string) => `${o(org)}/intake`,
  intakeNew: (org: string) => `${o(org)}/intake-new`,
  businessCase: (org: string, id: string) => `${o(org)}/intake/${id}`,
  priorities: (org: string) => `${o(org)}/priorities`,
  capacity: (org: string) => `${o(org)}/capacity`,
  roadmap: (org: string) => `${o(org)}/roadmap`,
  benefits: (org: string) => `${o(org)}/benefits`,
  benefit: (org: string, id: string) => `${o(org)}/benefits/${id}`,
  execSchedule: (org: string) => `${o(org)}/schedule`,

  // 連携と同期
  connectors: (org: string) => `${o(org)}/connectors`,
  connectorNew: (org: string) => `${o(org)}/connectors-new`,
  connector: (org: string, id: string) => `${o(org)}/connectors/${id}`,
  capabilities: (org: string) => `${o(org)}/connector-capabilities`,
  mapping: (org: string) => `${o(org)}/connector-mapping`,
  sources: (org: string) => `${o(org)}/connector-sources`,
  deliveries: (org: string) => `${o(org)}/connector-events`,
  importDiag: (org: string) => `${o(org)}/connector-import`,
  referenceMatching: (org: string) => `${o(org)}/connector-references`,

  // 通知とオンコール
  channels: (org: string) => `${o(org)}/notify/channels`,
  channel: (org: string, id: string) => `${o(org)}/notify/channels/${id}`,
  notifyRules: (org: string) => `${o(org)}/notify/rules`,
  notifyLog: (org: string) => `${o(org)}/notify/deliveries`,
  oncall: (org: string) => `${o(org)}/oncall`,
  escalation: (org: string) => `${o(org)}/oncall/escalation`,
  incidents: (org: string) => `${o(org)}/incidents`,
  incident: (org: string, id: string) => `${o(org)}/incidents/${id}`,

  // 案件窓口（2026-11-28 追補）
  desk: (org: string) => `${o(org)}/desk`,
  deskInquiry: (org: string, id: string) => `${o(org)}/desk/inquiries/${id}`,
  deskOutbound: (org: string) => `${o(org)}/desk/outbound`,
  deskAssignments: (org: string) => `${o(org)}/desk/assignments`,
  deskReports: (org: string) => `${o(org)}/desk/reports`,
  deskChange: (org: string, id: string) => `${o(org)}/desk/changes/${id}`,

  // 受託者への発注（2026-11-28 追補）
  orders: (org: string) => `${o(org)}/orders`,
  orderNew: (org: string) => `${o(org)}/orders-new`,
  order: (org: string, id: string) => `${o(org)}/orders/${id}`,
  partners: (org: string) => `${o(org)}/partners`,
  settlements: (org: string) => `${o(org)}/settlements`,

  // プロジェクト: 計画と管理
  project: (org: string, pr: string) => p(org, pr),
  sow: (org: string, pr: string) => `${p(org, pr)}/sow`,
  sowDetail: (org: string, pr: string, id: string) => `${p(org, pr)}/sow/${id}`,
  plan: (org: string, pr: string) => `${p(org, pr)}/plan`,
  progress: (org: string, pr: string) => `${p(org, pr)}/progress`,
  risks: (org: string, pr: string) => `${p(org, pr)}/risks`,
  risk: (org: string, pr: string, id: string) => `${p(org, pr)}/risks/${id}`,
  changes: (org: string, pr: string) => `${p(org, pr)}/changes`,
  change: (org: string, pr: string, id: string) => `${p(org, pr)}/changes/${id}`,
  meetings: (org: string, pr: string) => `${p(org, pr)}/meetings`,
  meeting: (org: string, pr: string, id: string) => `${p(org, pr)}/meetings/${id}`,
  schedule: (org: string, pr: string) => `${p(org, pr)}/schedule`,
  milestones: (org: string, pr: string) => `${p(org, pr)}/milestones`,
  closure: (org: string, pr: string) => `${p(org, pr)}/closure`,
  documents: (org: string, pr: string) => `${p(org, pr)}/documents`,
  workBreakdown: (org: string, pr: string) => `${p(org, pr)}/work-breakdown`,
  projectCost: (org: string, pr: string) => `${p(org, pr)}/cost`,
  // 顧客への公開と共同経営
  relationship: (org: string, pr: string) => `${p(org, pr)}/relationship`,
  disclosure: (org: string, pr: string) => `${p(org, pr)}/disclosure`,
  disclosurePreview: (org: string, pr: string) => `${p(org, pr)}/disclosure-preview`,
  disclosureHistory: (org: string, pr: string) => `${p(org, pr)}/disclosure-history`,
  jointFinance: (org: string, pr: string) => `${p(org, pr)}/joint-finance`,
  // 契約・知的資産
  contracts: (org: string, pr: string) => `${p(org, pr)}/contracts`,
  contract: (org: string, pr: string, id: string) => `${p(org, pr)}/contracts/${id}`,
  ipAssets: (org: string, pr: string) => `${p(org, pr)}/ip`,
  ipAsset: (org: string, pr: string, id: string) => `${p(org, pr)}/ip/${id}`,
  licenses: (org: string, pr: string) => `${p(org, pr)}/licenses`,
  rightsHandover: (org: string, pr: string) => `${p(org, pr)}/rights-handover`,
  // アプリの配信名義・引き渡し
  appHandover: (org: string, pr: string) => `${p(org, pr)}/app-handover`,
  appEnrollment: (org: string, pr: string) => `${p(org, pr)}/app-handover/enrollment`,
  appInvitations: (org: string, pr: string) => `${p(org, pr)}/app-handover/invitations`,
  appTransfer: (org: string, pr: string) => `${p(org, pr)}/app-handover/transfer`,
  appOperations: (org: string, pr: string) => `${p(org, pr)}/app-handover/operations`,

  // 要求・設計・トレーサビリティ
  requirements: (org: string, pr: string) => `${p(org, pr)}/requirements`,
  requirement: (org: string, pr: string, id: string) => `${p(org, pr)}/requirements/${id}`,
  requirementReview: (org: string, pr: string, id: string) => `${p(org, pr)}/requirements/${id}/review`,
  requirementApproval: (org: string, pr: string) => `${p(org, pr)}/requirements-approval`,
  designs: (org: string, pr: string) => `${p(org, pr)}/design`,
  design: (org: string, pr: string, id: string) => `${p(org, pr)}/design/${id}`,
  trace: (org: string, pr: string) => `${p(org, pr)}/trace`,
  traceMatrix: (org: string, pr: string) => `${p(org, pr)}/trace-matrix`,
  verification: (org: string, pr: string) => `${p(org, pr)}/verification`,
  requirementDiff: (org: string, pr: string, id: string) => `${p(org, pr)}/requirements/${id}/diff`,
  defects: (org: string, pr: string) => `${p(org, pr)}/defects`,
  scans: (org: string, pr: string) => `${p(org, pr)}/scans`,
  builds: (org: string, pr: string) => `${p(org, pr)}/builds`,

  // ゲート・PR・例外
  gates: (org: string, pr: string) => `${p(org, pr)}/gates`,
  gate: (org: string, pr: string, run: string) => `${p(org, pr)}/gates/${run}`,
  pulls: (org: string, pr: string) => `${p(org, pr)}/pulls`,
  exceptions: (org: string, pr: string) => `${p(org, pr)}/exceptions`,
  exceptionNew: (org: string, pr: string) => `${p(org, pr)}/exceptions-new`,
  exception: (org: string, pr: string, id: string) => `${p(org, pr)}/exceptions/${id}`,
  gateSettings: (org: string, pr: string) => `${p(org, pr)}/gate-settings`,
  gateRegistration: (org: string, pr: string) => `${p(org, pr)}/gate-registration`,
  gateReplay: (org: string, pr: string, run: string) => `${p(org, pr)}/gates/${run}/replay`,

  // リリースと受入
  releases: (org: string, pr: string) => `${p(org, pr)}/releases`,
  release: (org: string, pr: string, id: string) => `${p(org, pr)}/releases/${id}`,
  acceptance: (org: string, pr: string, id: string) => `${p(org, pr)}/releases/${id}/acceptance`,
  baselines: (org: string, pr: string) => `${p(org, pr)}/baselines`,
  submissionsMatch: (org: string, pr: string) => `${p(org, pr)}/submissions`,
  releaseCandidate: (org: string, pr: string, id: string) => `${p(org, pr)}/releases/${id}/candidate`,
  executionPermit: (org: string, pr: string, id: string) => `${p(org, pr)}/releases/${id}/permit`,
  deployment: (org: string, pr: string, id: string) => `${p(org, pr)}/releases/${id}/deploy`,
  rollback: (org: string, pr: string, id: string) => `${p(org, pr)}/releases/${id}/rollback`,

  // 証跡と監査
  audit: (org: string, pr: string) => `${p(org, pr)}/audit`,
  control: (org: string, pr: string, id: string) => `${p(org, pr)}/audit/controls/${id}`,
  manifests: (org: string, pr: string) => `${p(org, pr)}/evidence`,
  manifest: (org: string, pr: string, id: string) => `${p(org, pr)}/evidence/${id}`,
  auditLog: (org: string, pr: string) => `${p(org, pr)}/audit-log`,
  auditExport: (org: string, pr: string) => `${p(org, pr)}/audit-export`,
  shares: (org: string, pr: string) => `${p(org, pr)}/shares`,
  tradeEvidence: (org: string, pr: string) => `${p(org, pr)}/trade-evidence`,

  // ポリシー
  policies: (org: string) => `${o(org)}/policies`,
  policy: (org: string, pack: string) => `${o(org)}/policies/${pack}`,
  tailoring: (org: string, pack: string) => `${o(org)}/policies/${pack}/tailoring`,
  policyDiff: (org: string, pack: string) => `${o(org)}/policies/${pack}/diff`,
  migration: (org: string, pack: string, id: string) => `${o(org)}/policies/${pack}/migrations/${id}`,
  packScope: (org: string, pack: string) => `${o(org)}/policies/${pack}/scope`,
  packSources: (org: string, pack: string) => `${o(org)}/policies/${pack}/sources`,
  packReviews: (org: string, pack: string) => `${o(org)}/policies/${pack}/reviews`,

  // 設定
  settings: (org: string) => `${o(org)}/settings`,
  members: (org: string) => `${o(org)}/settings/members`,
  integrations: (org: string) => `${o(org)}/settings/integrations`,
  aiSettings: (org: string) => `${o(org)}/settings/ai`,
  evidenceSettings: (org: string) => `${o(org)}/settings/evidence`,
  security_: (org: string) => `${o(org)}/settings/security`,
  billing: (org: string) => `${o(org)}/settings/billing`,
  actors: (org: string) => `${o(org)}/settings/actors`,
  scopes: (org: string) => `${o(org)}/settings/scopes`,
  aiEval: (org: string) => `${o(org)}/settings/ai-eval`,
  usage: (org: string) => `${o(org)}/settings/usage`,
  signing: (org: string) => `${o(org)}/settings/signing`,
  tradeScopes: (org: string) => `${o(org)}/settings/trade-scopes`,
  aiMediation: (org: string) => `${o(org)}/settings/ai-mediation`,
  me: () => "/me",

  // 外部利用者
  portal: (pr: string) => `/portal/${pr}`,
  portalApproval: (pr: string, id: string) => `/portal/${pr}/approvals/${id}`,
  portalAcceptance: (pr: string, id: string) => `/portal/${pr}/acceptance/${id}`,
  portalChangeNew: (pr: string) => `/portal/${pr}/changes-new`,
  review: (token: string) => `/review/${token}`,
  partner: () => "/partner",
  approvalLink: (token: string) => `/approve/${token}`,
  // 顧客ポータルの拡張（2026-11-28 追補）
  portalSchedule: (pr: string) => `/portal/${pr}/schedule`,
  portalRequests: (pr: string) => `/portal/${pr}/requests`,
  portalRequest: (pr: string, id: string) => `/portal/${pr}/requests/${id}`,
  portalRouting: (pr: string) => `/portal/${pr}/routing`,
  portalMaterials: (pr: string) => `/portal/${pr}/materials`,
  portalContracts: (pr: string) => `/portal/${pr}/contracts`,
  portalContract: (pr: string, id: string) => `/portal/${pr}/contracts/${id}`,
  portalHandover: (pr: string) => `/portal/${pr}/handover`,
  portalJoint: (pr: string) => `/portal/${pr}/joint`,

  // フリーエンジニア（2026-11-28 追補）
  freelancerInvite: (token: string) => `/f/invite/${token}`,
  freelancerHome: () => "/f",
  freelancerOrder: (id: string) => `/f/orders/${id}`,
  freelancerSubmit: (id: string) => `/f/orders/${id}/submit`,
  freelancerResult: (id: string) => `/f/orders/${id}/result`,
  freelancerQuestions: () => "/f/questions",
  freelancerHistory: () => "/f/history",

  // 共通の状態画面
  notFound: () => "/404",
  forbidden: () => "/403",
  error: () => "/500",
  maintenance: () => "/maintenance",
  sessionExpired: () => "/session-expired",
  status: () => "/status",
  support: () => "/support",

  // Web以外の表示面
  checkRun: () => "/surfaces/github-check",
  emails: () => "/surfaces/email",
  chatCards: () => "/surfaces/chat",

  // 開発用
  screens: () => "/screens",
  catalog: () => "/catalog",
  demo: () => "/demo",
};

/** モックで使う既定の組織・プロジェクト */
export const ORG = "sample-soft";
export const PROJECT = "order-renewal";
