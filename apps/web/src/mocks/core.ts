// 架空のサンプルデータ。実在の会社名・人名・規格本文を含めない。
// 基準日は 2026-11-27。
import type {
  AiFinding,
  ApprovalRequest,
  AuditEvent,
  ChangeRequest,
  Control,
  Design,
  Evidence,
  ExceptionRecord,
  GateRun,
  Manifest,
  Notification,
  Org,
  Project,
  Release,
  Repo,
  Requirement,
  Risk,
  TestCase,
  User,
} from "../lib/types";

/** 種から決まる疑似的な SHA-256（64桁の16進） */
export function fakeSha(seed: string): string {
  let h1 = 0x811c9dc5;
  let out = "";
  for (let round = 0; out.length < 64; round += 1) {
    for (const ch of `${seed}:${round}`) {
      h1 ^= ch.charCodeAt(0);
      h1 = Math.imul(h1, 0x01000193) >>> 0;
    }
    out += h1.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

export const TODAY = "2026-11-27";

export const users: User[] = [
  { id: "u-sato", name: "佐藤 美咲", initials: "佐", email: "sato@sample-soft.example", roles: ["PM", "リリース管理者"], kind: "member", status: "active", github: "msato-dev", joined_at: "2025-04-01", last_active_at: "2026-11-27T09:12:00+09:00" },
  { id: "u-takahashi", name: "高橋 健", initials: "高", email: "takahashi@sample-soft.example", roles: ["アナリスト"], kind: "member", status: "active", github: "ktakahashi", joined_at: "2025-04-01", last_active_at: "2026-11-27T08:40:00+09:00" },
  { id: "u-tanaka", name: "田中 陽介", initials: "田", email: "tanaka@sample-soft.example", roles: ["設計者"], kind: "member", status: "active", github: "ytanaka", joined_at: "2025-06-10", last_active_at: "2026-11-26T19:02:00+09:00" },
  { id: "u-suzuki", name: "鈴木 彩", initials: "鈴", email: "suzuki@sample-soft.example", roles: ["開発者"], kind: "member", status: "active", github: "aya-suzuki", joined_at: "2025-09-01", last_active_at: "2026-11-27T10:05:00+09:00" },
  { id: "u-ito", name: "伊藤 誠", initials: "伊", email: "ito@sample-soft.example", roles: ["QA"], kind: "member", status: "active", github: "mito-qa", joined_at: "2025-04-01", last_active_at: "2026-11-26T17:30:00+09:00" },
  { id: "u-watanabe", name: "渡辺 翔", initials: "渡", email: "watanabe@sample-soft.example", roles: ["開発者", "リリース管理者"], kind: "member", status: "active", github: "sho-w", joined_at: "2026-01-15", last_active_at: "2026-11-25T12:00:00+09:00" },
  { id: "u-yamamoto", name: "山本 結衣", initials: "山", email: "yamamoto@sample-soft.example", roles: ["組織管理者", "ポリシー管理者"], kind: "member", status: "active", github: "yui-yamamoto", joined_at: "2025-04-01", last_active_at: "2026-11-27T07:58:00+09:00" },
  { id: "u-kobayashi", name: "小林 直人", initials: "小", email: "kobayashi@sample-soft.example", roles: ["開発者"], kind: "member", status: "invited", joined_at: undefined },
  { id: "u-kato", name: "加藤 遥", initials: "加", email: "kato@sample-soft.example", roles: ["QA"], kind: "member", status: "disabled", joined_at: "2025-04-01", last_active_at: "2026-06-30T18:00:00+09:00" },
  { id: "u-nakamura", name: "中村 拓也", initials: "中", email: "nakamura@kakuu-shoji.example", roles: ["顧客"], kind: "external", status: "active", company: "架空商事株式会社", joined_at: "2026-05-20", last_active_at: "2026-11-26T15:20:00+09:00" },
  { id: "u-assessor", name: "評価者 A", initials: "評", email: "assessor@review-office.example", roles: ["評価者"], kind: "external", status: "active", company: "第三者評価事務所（架空）" },
  { id: "u-agent", name: "coding-agent", initials: "AI", email: "", roles: [], kind: "agent", status: "active" },
];

export const userById = (id?: string) => users.find((u) => u.id === id);
export const CURRENT_USER_ID = "u-sato";
export const currentUser = users.find((u) => u.id === CURRENT_USER_ID)!;

export const orgs: Org[] = [
  { id: "org-1", slug: "sample-soft", name: "サンプルソフト株式会社", initials: "S", plan: "Team", project_count: 4, my_roles: ["PM", "リリース管理者"], pending_approvals: 5 },
  { id: "org-2", slug: "demo-lab", name: "デモラボ合同会社", initials: "D", plan: "Starter", project_count: 1, my_roles: ["開発者"], pending_approvals: 0 },
];

export const repos: Repo[] = [
  { id: "r1", full_name: "sample-soft/order-api", visibility: "private", default_branch: "main", updated_at: "2026-11-27T09:40:00+09:00" },
  { id: "r2", full_name: "sample-soft/order-web", visibility: "private", default_branch: "main", updated_at: "2026-11-26T21:10:00+09:00" },
  { id: "r3", full_name: "sample-soft/member-app-api", visibility: "private", default_branch: "main", updated_at: "2026-11-24T11:00:00+09:00" },
  { id: "r4", full_name: "sample-soft/inventory-dashboard", visibility: "private", default_branch: "develop", updated_at: "2026-11-20T16:45:00+09:00" },
  { id: "r5", full_name: "sample-soft/shared-ui", visibility: "internal", default_branch: "main", updated_at: "2026-10-02T10:00:00+09:00" },
  { id: "r6", full_name: "sample-soft/tech-blog", visibility: "public", default_branch: "main", updated_at: "2026-08-14T09:00:00+09:00" },
];

export const projects: Project[] = [
  {
    id: "p1", slug: "order-renewal", name: "受発注システム刷新", customer: "架空商事株式会社", phase: "construction",
    control_pack: "Basic Control Pack", pack_version: "1.3.0", pack_outdated: false, enforcement: "soft", data_class: "confidential",
    repos: ["sample-soft/order-api", "sample-soft/order-web"], main_gates: { A: "pass", B: "block", C: "pass", D: "pass" },
    trace_linked: 31, trace_total: 38, open_risks: 4, open_changes: 2, blocked_prs: 2, active_exceptions: 2,
    next_release: { version: "v1.4.0", date: "2026-12-10" }, member_ids: ["u-sato", "u-takahashi", "u-tanaka", "u-suzuki", "u-ito", "u-watanabe", "u-nakamura"], updated_at: "2026-11-27T09:40:00+09:00",
  },
  {
    id: "p2", slug: "member-app-api", name: "会員アプリ API 開発", customer: "テスト物流株式会社", phase: "design",
    control_pack: "Basic Control Pack", pack_version: "1.2.1", pack_outdated: true, enforcement: "warnOnly", data_class: "internal",
    repos: ["sample-soft/member-app-api"], main_gates: { A: "pass", B: "warn", C: "notRun", D: "pass" },
    trace_linked: 12, trace_total: 20, open_risks: 2, open_changes: 1, blocked_prs: 0, active_exceptions: 0,
    next_release: { version: "v0.3.0", date: "2027-01-20" }, member_ids: ["u-sato", "u-tanaka", "u-watanabe"], updated_at: "2026-11-24T11:00:00+09:00",
  },
  {
    id: "p3", slug: "inventory-dashboard", name: "在庫管理ダッシュボード", customer: "例示食品株式会社", phase: "integration",
    control_pack: "Basic Control Pack", pack_version: "1.3.0", pack_outdated: false, enforcement: "hard", data_class: "internal",
    repos: ["sample-soft/inventory-dashboard"], main_gates: { A: "pass", B: "pass", C: "pass", D: "pass" },
    trace_linked: 26, trace_total: 26, open_risks: 1, open_changes: 0, blocked_prs: 0, active_exceptions: 1,
    next_release: { version: "v2.0.0", date: "2026-12-03" }, member_ids: ["u-sato", "u-ito", "u-suzuki"], updated_at: "2026-11-20T16:45:00+09:00",
  },
  {
    id: "p4", slug: "legacy-migration", name: "旧基幹データ移行", customer: "架空商事株式会社", phase: "delivery",
    control_pack: "Basic Control Pack", pack_version: "1.1.0", pack_outdated: true, enforcement: "soft", data_class: "highlyConfidential",
    repos: [], main_gates: { A: "pass", B: "pass", C: "pass", D: "running" },
    trace_linked: 9, trace_total: 9, open_risks: 0, open_changes: 0, blocked_prs: 0, active_exceptions: 0,
    member_ids: ["u-sato", "u-yamamoto"], updated_at: "2026-09-30T18:00:00+09:00", archived: true,
  },
];

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug) ?? projects[0];

export const requirements: Requirement[] = [
  { id: "REQ-0001", title: "取引先ごとに発注書を作成できる", kind: "functional", priority: "high", status: "approved", owner_id: "u-takahashi", body: "購買担当者は、登録済みの取引先を選んで発注書を作成できる。", acceptance_criteria: ["取引先一覧から1社を選択できる", "明細を1行以上入力しないと保存できない", "保存した発注書に連番の発注番号が付く"], source: "SOW v2 §3.1", design_ids: ["ADR-0002", "DSN-0004"], pr_numbers: [118, 124], test_ids: ["TC-0101", "TC-0102"], ai_open_findings: 0, version: 3, updated_at: "2026-10-20T10:00:00+09:00", data_class: "confidential" },
  { id: "REQ-0002", title: "発注書の承認フローを2段階にする", kind: "functional", priority: "high", status: "approved", owner_id: "u-takahashi", body: "一定金額以上の発注書は、課長と部長の2段階で承認する。", acceptance_criteria: ["50万円以上は2段階承認になる", "差戻し時は理由の入力が必須"], source: "SOW v2 §3.2", design_ids: ["DSN-0005"], pr_numbers: [131], test_ids: ["TC-0110"], ai_open_findings: 0, version: 2, updated_at: "2026-10-22T10:00:00+09:00", data_class: "confidential" },
  { id: "REQ-0003", title: "発注データを基幹システムへ連携する", kind: "functional", priority: "high", status: "approved", owner_id: "u-takahashi", body: "承認済みの発注データを、夜間バッチで基幹システムへ連携する。", acceptance_criteria: ["毎日 2:00 に連携が開始される", "失敗時は担当者にメールで通知される"], source: "SOW v2 §3.4", design_ids: ["ADR-0003"], pr_numbers: [140], test_ids: [], ai_open_findings: 1, version: 2, updated_at: "2026-11-02T10:00:00+09:00", data_class: "confidential" },
  { id: "REQ-0004", title: "発注一覧を条件で検索できる", kind: "functional", priority: "medium", status: "approved", owner_id: "u-takahashi", body: "発注一覧を、期間・取引先・状態で絞り込んで表示できる。", acceptance_criteria: ["3条件を組み合わせて検索できる"], source: "SOW v2 §3.5", design_ids: ["DSN-0004"], pr_numbers: [126], test_ids: ["TC-0120"], ai_open_findings: 0, version: 1, updated_at: "2026-10-12T10:00:00+09:00", data_class: "internal" },
  { id: "REQ-0005", title: "画面は主要な操作に2秒以内で応答する", kind: "nonFunctional", priority: "medium", status: "pending", owner_id: "u-takahashi", body: "一覧表示・保存などの主要な操作は、通常の負荷で速やかに応答すること。", acceptance_criteria: ["同時接続50件で95%の操作が2秒以内"], source: "SOW v2 §5.1", design_ids: [], pr_numbers: [], test_ids: [], ai_open_findings: 2, version: 1, updated_at: "2026-11-25T14:00:00+09:00", data_class: "internal" },
  { id: "REQ-0006", title: "操作ログを7年間保存する", kind: "nonFunctional", priority: "high", status: "approved", owner_id: "u-takahashi", body: "利用者の操作ログを7年間保存し、管理者が検索できる。", acceptance_criteria: ["ログは改ざんできない保管先に保存される", "管理者は期間で検索できる"], source: "SOW v2 §5.3", design_ids: ["ADR-0004"], pr_numbers: [], test_ids: [], ai_open_findings: 0, version: 1, updated_at: "2026-10-30T10:00:00+09:00", data_class: "confidential" },
  { id: "REQ-0007", title: "取引先マスタを CSV で一括登録できる", kind: "functional", priority: "low", status: "inReview", owner_id: "u-takahashi", body: "取引先マスタを CSV ファイルで一括登録・更新できる。必要に応じてエラー行を表示する。", acceptance_criteria: [], source: "CR-0003", design_ids: [], pr_numbers: [], test_ids: [], ai_open_findings: 3, version: 1, updated_at: "2026-11-26T16:00:00+09:00", data_class: "internal" },
  { id: "REQ-0008", title: "発注書を PDF で出力できる", kind: "functional", priority: "medium", status: "changing", owner_id: "u-takahashi", body: "発注書を所定の様式で PDF 出力できる。", acceptance_criteria: ["社印の画像を含められる"], source: "SOW v2 §3.6 / CR-0002", design_ids: ["DSN-0006"], pr_numbers: [135], test_ids: ["TC-0130"], ai_open_findings: 1, version: 4, updated_at: "2026-11-24T09:00:00+09:00", data_class: "internal" },
  { id: "REQ-0009", title: "利用者は SSO でログインする", kind: "functional", priority: "high", status: "approved", owner_id: "u-takahashi", body: "利用者は顧客の IdP を使った SSO でログインする。", acceptance_criteria: ["SAML 2.0 でログインできる", "ログアウト時にセッションが破棄される"], source: "SOW v2 §4.1", design_ids: ["ADR-0001"], pr_numbers: [101, 104], test_ids: ["TC-0001", "TC-0002"], ai_open_findings: 0, version: 2, updated_at: "2026-09-18T10:00:00+09:00", data_class: "internal" },
  { id: "REQ-0010", title: "納期遅延の発注をダッシュボードで強調する", kind: "functional", priority: "low", status: "draft", owner_id: "u-takahashi", body: "納期を過ぎた発注を目立つように表示する。", acceptance_criteria: [], source: "定例会 2026-11-20", design_ids: [], pr_numbers: [], test_ids: [], ai_open_findings: 2, version: 1, updated_at: "2026-11-27T08:30:00+09:00", data_class: "internal" },
  { id: "REQ-0011", title: "旧仕様の FAX 送信機能", kind: "functional", priority: "low", status: "obsolete", owner_id: "u-takahashi", body: "発注書を FAX で送信する（CR-0001 により廃止）。", acceptance_criteria: [], source: "SOW v1 §3.7", design_ids: [], pr_numbers: [], test_ids: [], ai_open_findings: 0, version: 2, updated_at: "2026-07-01T10:00:00+09:00", data_class: "internal" },
  { id: "REQ-0012", title: "発注金額の上限を取引先ごとに設定できる", kind: "functional", priority: "medium", status: "pending", owner_id: "u-takahashi", body: "取引先ごとに1回あたりの発注上限額を設定し、超える場合は警告する。", acceptance_criteria: [], source: "SOW v2 §3.3", design_ids: [], pr_numbers: [], test_ids: [], ai_open_findings: 1, version: 1, updated_at: "2026-11-26T11:00:00+09:00", data_class: "confidential" },
];
export const requirementById = (id: string) => requirements.find((r) => r.id === id) ?? requirements[0];

export const designs: Design[] = [
  { id: "ADR-0001", title: "認証に顧客 IdP の SAML を採用する", kind: "adr", status: "approved", requirement_ids: ["REQ-0009"], author_id: "u-tanaka", reviewer_ids: ["u-sato"], updated_at: "2026-08-30T10:00:00+09:00" },
  { id: "ADR-0002", title: "発注番号は DB のシーケンスで採番する", kind: "adr", status: "approved", requirement_ids: ["REQ-0001"], author_id: "u-tanaka", reviewer_ids: ["u-watanabe"], updated_at: "2026-09-12T10:00:00+09:00" },
  { id: "ADR-0003", title: "基幹連携はファイル連携とし、再送を可能にする", kind: "adr", status: "inReview", requirement_ids: ["REQ-0003"], author_id: "u-tanaka", reviewer_ids: ["u-sato"], updated_at: "2026-11-20T10:00:00+09:00" },
  { id: "ADR-0004", title: "操作ログは追記専用ストレージに保存する", kind: "adr", status: "approved", requirement_ids: ["REQ-0006"], author_id: "u-tanaka", reviewer_ids: ["u-yamamoto"], updated_at: "2026-10-28T10:00:00+09:00" },
  { id: "DSN-0004", title: "発注画面の詳細設計", kind: "detailed", status: "approved", requirement_ids: ["REQ-0001", "REQ-0004"], author_id: "u-tanaka", reviewer_ids: ["u-suzuki"], updated_at: "2026-10-05T10:00:00+09:00" },
  { id: "DSN-0005", title: "承認ワークフローの詳細設計", kind: "detailed", status: "approved", requirement_ids: ["REQ-0002"], author_id: "u-tanaka", reviewer_ids: ["u-suzuki"], updated_at: "2026-10-18T10:00:00+09:00" },
  { id: "DSN-0006", title: "帳票出力の詳細設計", kind: "detailed", status: "changing", requirement_ids: ["REQ-0008"], author_id: "u-tanaka", reviewer_ids: ["u-watanabe"], updated_at: "2026-11-24T10:00:00+09:00" },
  { id: "ARC-0001", title: "システム全体のアーキテクチャ", kind: "architecture", status: "approved", requirement_ids: ["REQ-0001", "REQ-0003", "REQ-0009"], author_id: "u-tanaka", reviewer_ids: ["u-sato"], updated_at: "2026-08-20T10:00:00+09:00" },
];
export const designById = (id: string) => designs.find((d) => d.id === id) ?? designs[0];

export const testCases: TestCase[] = [
  { id: "TC-0001", title: "SAML でログインできる", kind: "integration", requirement_ids: ["REQ-0009"], last_result: "passed" },
  { id: "TC-0002", title: "ログアウトでセッションが破棄される", kind: "integration", requirement_ids: ["REQ-0009"], last_result: "passed" },
  { id: "TC-0101", title: "取引先を選んで発注書を保存できる", kind: "acceptance", requirement_ids: ["REQ-0001"], last_result: "passed" },
  { id: "TC-0102", title: "明細0行では保存できない", kind: "unit", requirement_ids: ["REQ-0001"], last_result: "passed" },
  { id: "TC-0110", title: "50万円以上で2段階承認になる", kind: "integration", requirement_ids: ["REQ-0002"], last_result: "failed" },
  { id: "TC-0120", title: "3条件で検索できる", kind: "unit", requirement_ids: ["REQ-0004"], last_result: "passed" },
  { id: "TC-0130", title: "PDF に社印画像が入る", kind: "acceptance", requirement_ids: ["REQ-0008"], last_result: "notRun" },
  { id: "TC-0140", title: "性能: 同時接続50件", kind: "acceptance", requirement_ids: [], last_result: "skipped" },
];

export const aiFindings: AiFinding[] = [
  { id: "AIF-201", kind: "ambiguity", severity: "high", confidence: 0.86, target_id: "REQ-0007", excerpt: "必要に応じてエラー行を表示する。", highlight: "必要に応じて", explanation: "「必要に応じて」では、どの条件でエラー行を表示するかが決まりません。受入判定ができない可能性があります。", suggestion: "取込に失敗した行がある場合は、行番号と理由を一覧で表示する。", model: "model-family-a / 2026-10", template_version: "req-review@1.4.0", status: "unconfirmed", created_at: "2026-11-26T16:05:00+09:00" },
  { id: "AIF-202", kind: "testability", severity: "medium", confidence: 0.78, target_id: "REQ-0007", excerpt: "取引先マスタを CSV ファイルで一括登録・更新できる。", highlight: "一括登録・更新", explanation: "受入基準がありません。件数の上限や文字コードなど、検証可能な条件を追加してください。", suggestion: "受入基準: 1万行までの UTF-8 CSV を60秒以内に取り込める。", model: "model-family-a / 2026-10", template_version: "req-review@1.4.0", status: "unconfirmed", created_at: "2026-11-26T16:05:00+09:00" },
  { id: "AIF-203", kind: "conflict", severity: "medium", confidence: 0.64, target_id: "REQ-0007", excerpt: "一括登録・更新できる", highlight: "更新", explanation: "REQ-0012 の上限額設定と、CSV による上書き更新の優先順位が定義されていません。", model: "model-family-a / 2026-10", template_version: "req-review@1.4.0", status: "unconfirmed", created_at: "2026-11-26T16:05:00+09:00" },
  { id: "AIF-190", kind: "ambiguity", severity: "high", confidence: 0.91, target_id: "REQ-0005", excerpt: "通常の負荷で速やかに応答すること。", highlight: "速やかに", explanation: "「速やかに」は測定できません。受入基準の数値と本文を一致させてください。", suggestion: "主要な操作は、同時接続50件の条件で95%が2秒以内に応答する。", model: "model-family-a / 2026-10", template_version: "req-review@1.4.0", status: "adopted", decided_by: "u-takahashi", created_at: "2026-11-25T14:05:00+09:00" },
  { id: "AIF-191", kind: "missing", severity: "low", confidence: 0.52, target_id: "REQ-0005", excerpt: "一覧表示・保存などの主要な操作", highlight: "主要な操作", explanation: "対象となる操作の一覧がありません。", model: "model-family-a / 2026-10", template_version: "req-review@1.4.0", status: "rejected", decided_by: "u-takahashi", reject_reason: "対象操作は非機能要求一覧（別紙）で定義済みのため", created_at: "2026-11-25T14:05:00+09:00" },
  { id: "AIF-180", kind: "testability", severity: "medium", confidence: 0.7, target_id: "REQ-0003", excerpt: "失敗時は担当者にメールで通知される", highlight: "担当者", explanation: "通知先の担当者が誰かが定義されていません。", model: "model-family-a / 2026-10", template_version: "req-review@1.3.2", status: "unconfirmed", stale: true, created_at: "2026-10-30T10:00:00+09:00" },
  { id: "AIF-170", kind: "linkCandidate", severity: "low", confidence: 0.73, target_id: "REQ-0006", excerpt: "PR #142 audit-log writer", highlight: "PR #142", explanation: "PR #142 の変更は REQ-0006（操作ログの保存）を実装している可能性があります。", model: "model-family-b / 2026-09", template_version: "trace-link@0.9.0", status: "unconfirmed", created_at: "2026-11-21T10:00:00+09:00" },
  { id: "AIF-160", kind: "impact", severity: "medium", confidence: 0.81, target_id: "CR-0004", excerpt: "上限額の判定を税込に変更", highlight: "税込", explanation: "REQ-0012 と TC-0110 が影響を受ける可能性があります。", model: "model-family-a / 2026-10", template_version: "impact@1.0.0", status: "unconfirmed", created_at: "2026-11-26T12:00:00+09:00" },
];

export const gateRuns: GateRun[] = [
  {
    id: "run-5821", pr_number: 142, pr_title: "操作ログを追記専用ストレージへ書き込む", branch: "feature/audit-log-writer", commit_sha: fakeSha("c142"), author: { kind: "human", name: "鈴木 彩", user_id: "u-suzuki" },
    gates: { A: "pass", B: "block", C: "pass", D: "pass" }, verdict: "block", enforcement: "soft", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-5821"), ci_run_id: "gh-run-99812345", started_at: "2026-11-27T09:38:00+09:00",
    reasons: [
      { rule_id: "TRC-002", gate: "B", result: "block", message: "承認済みの要求 REQ-0006 にテストへのリンクがありません", target: "REQ-0006", fix: "tests/ に REQ-0006 を参照するテストを追加し、trace/edges.yaml に TC を登録してください。", exception_allowed: true },
      { rule_id: "QLT-004", gate: "B", result: "block", message: "依存ライブラリに既知の脆弱性（重大度: 高）が1件あります", target: "Cargo.lock", fix: "該当ライブラリを修正済みのバージョンへ更新してください。", exception_allowed: true },
      { rule_id: "STR-001", gate: "A", result: "pass", message: "必須メタデータがそろっています", exception_allowed: false },
    ],
    required_approvals: [{ role: "設計者", user_id: "u-tanaka", status: "approved" }],
  },
  {
    id: "run-5820", pr_number: 141, pr_title: "発注一覧の検索条件に状態を追加", branch: "feature/search-status", commit_sha: fakeSha("c141"), author: { kind: "ai", name: "coding-agent", user_id: "u-agent" },
    gates: { A: "pass", B: "pass", C: "block", D: "pass" }, verdict: "block", enforcement: "soft", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-5820"), ci_run_id: "gh-run-99811002", started_at: "2026-11-27T08:15:00+09:00",
    reasons: [{ rule_id: "APR-001", gate: "C", result: "block", message: "AIエージェントの PR には人間のレビュー承認が1件以上必要です", fix: "開発者または設計者がレビューして承認してください。", exception_allowed: false }],
    required_approvals: [{ role: "開発者", status: "pending" }],
  },
  {
    id: "run-5815", pr_number: 140, pr_title: "基幹連携バッチの再送処理", branch: "feature/batch-retry", commit_sha: fakeSha("c140"), author: { kind: "human", name: "渡辺 翔", user_id: "u-watanabe" },
    gates: { A: "pass", B: "exception", C: "pass", D: "pass" }, verdict: "exception", enforcement: "soft", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-5815"), ci_run_id: "gh-run-99809877", started_at: "2026-11-26T18:20:00+09:00",
    reasons: [{ rule_id: "TRC-002", gate: "B", result: "block", message: "承認済みの要求 REQ-0003 にテストへのリンクがありません", target: "REQ-0003", fix: "結合テスト環境の準備後にテストを追加してください。", exception_allowed: true }],
    exception_id: "EXC-0007", required_approvals: [{ role: "設計者", user_id: "u-tanaka", status: "approved" }],
  },
  {
    id: "run-5810", pr_number: 139, pr_title: "PDF 帳票のフォントを差し替え", branch: "fix/pdf-font", commit_sha: fakeSha("c139"), author: { kind: "human", name: "鈴木 彩", user_id: "u-suzuki" },
    gates: { A: "pass", B: "pass", C: "pass", D: "pass" }, verdict: "pass", enforcement: "soft", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-5810"), ci_run_id: "gh-run-99805550", started_at: "2026-11-26T11:02:00+09:00", reasons: [], required_approvals: [{ role: "開発者", user_id: "u-watanabe", status: "approved" }],
  },
  {
    id: "run-5808", pr_number: 138, pr_title: "README の誤記修正", branch: "docs/readme", commit_sha: fakeSha("c138"), author: { kind: "human", name: "伊藤 誠", user_id: "u-ito" },
    gates: { A: "warn", B: "pass", C: "pass", D: "pass" }, verdict: "warn", enforcement: "soft", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-5808"), ci_run_id: "gh-run-99801234", started_at: "2026-11-25T15:40:00+09:00",
    reasons: [{ rule_id: "STR-007", gate: "A", result: "warn", message: "PR の説明に関連する要求 ID がありません", fix: "PR の説明に関連する REQ-ID を記載してください（文書のみの変更なら不要）。", exception_allowed: false }], required_approvals: [],
  },
  {
    id: "run-5830", pr_number: 143, pr_title: "取引先 CSV 取込（下書き）", branch: "feature/csv-import", commit_sha: fakeSha("c143"), author: { kind: "ai", name: "coding-agent", user_id: "u-agent" },
    gates: { A: "pass", B: "running", C: "notRun", D: "notRun" }, verdict: "running", enforcement: "soft", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-5830"), ci_run_id: "gh-run-99813001", started_at: "2026-11-27T10:02:00+09:00", reasons: [], required_approvals: [],
  },
  {
    id: "run-5800", pr_title: "main への定期実行", branch: "main", commit_sha: fakeSha("main-1126"), author: { kind: "system", name: "スケジューラ" },
    gates: { A: "pass", B: "block", C: "pass", D: "pass" }, verdict: "block", enforcement: "soft", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-5800"), ci_run_id: "gh-run-99800001", started_at: "2026-11-26T02:00:00+09:00",
    reasons: [{ rule_id: "TRC-002", gate: "B", result: "block", message: "承認済み要求のうち 2 件にテストへのリンクがありません", target: "REQ-0003, REQ-0006", exception_allowed: true }], required_approvals: [],
  },
];
export const gateRunById = (id: string) => gateRuns.find((g) => g.id === id) ?? gateRuns[0];

export const exceptions: ExceptionRecord[] = [
  { id: "EXC-0007", rule_id: "TRC-002", gate: "B", target: "PR #140 / REQ-0003", requester_id: "u-watanabe", approver_id: "u-sato", status: "active", requested_at: "2026-11-26T18:30:00+09:00", expires_at: "2026-12-03", reason: "結合テスト環境の準備が 12/1 になるため、それまでテストを追加できない。", risk: "基幹連携の不具合を結合テストまで検出できない。", mitigation: "単体テストで再送ロジックを確認済み。12/2 までに結合テストを追加する。" },
  { id: "EXC-0006", rule_id: "QLT-004", gate: "B", target: "main / Cargo.lock", requester_id: "u-suzuki", approver_id: "u-sato", status: "active", requested_at: "2026-11-20T10:00:00+09:00", expires_at: "2026-11-30", reason: "修正版のライブラリが未公開。", risk: "既知の脆弱性を含む状態が続く。", mitigation: "該当機能は外部公開されていない。" },
  { id: "EXC-0008", rule_id: "TRC-002", gate: "B", target: "PR #142 / REQ-0006", requester_id: "u-suzuki", approver_id: "u-sato", status: "applying", requested_at: "2026-11-27T09:50:00+09:00", expires_at: "2026-12-11", reason: "ストレージのテスト用モックを別 PR で作成中。", risk: "ログ欠落を検出できない期間が生じる。" },
  { id: "EXC-0004", rule_id: "STR-003", gate: "A", target: "release v1.2.0", requester_id: "u-watanabe", approver_id: "u-sato", status: "expired", requested_at: "2026-09-01T10:00:00+09:00", expires_at: "2026-09-15", reason: "納品文書の様式変更待ち。", risk: "納品物一覧が旧様式になる。" },
  { id: "EXC-0005", rule_id: "QLT-001", gate: "B", target: "PR #120", requester_id: "u-suzuki", approver_id: "u-tanaka", status: "rejected", requested_at: "2026-10-10T10:00:00+09:00", expires_at: "2026-10-17", reason: "lint 警告が多すぎるため。", risk: "コード品質の低下。" },
];
export const exceptionById = (id: string) => exceptions.find((e) => e.id === id) ?? exceptions[0];

export const releases: Release[] = [
  { id: "rel-140", version: "v1.4.0", title: "PDF 出力と基幹連携の再送", status: "gateChecking", gate: "block", acceptance: "notRequested", signature: "unsigned", planned_at: "2026-12-10" },
  { id: "rel-130", version: "v1.3.0", title: "2段階承認フロー", status: "accepted", gate: "pass", approver_id: "u-sato", acceptance: "approved", manifest_id: "MAN-0013", signature: "verified", planned_at: "2026-11-05", released_at: "2026-11-05T17:00:00+09:00" },
  { id: "rel-121", version: "v1.2.1", title: "検索不具合の修正", status: "released", gate: "pass", approver_id: "u-watanabe", acceptance: "pending", manifest_id: "MAN-0012", signature: "signed", planned_at: "2026-10-20", released_at: "2026-10-20T18:00:00+09:00" },
  { id: "rel-120", version: "v1.2.0", title: "発注一覧と検索", status: "accepted", gate: "exception", approver_id: "u-sato", acceptance: "approved", manifest_id: "MAN-0011", signature: "verified", planned_at: "2026-09-15", released_at: "2026-09-15T17:00:00+09:00" },
];
export const releaseById = (id: string) => releases.find((r) => r.id === id) ?? releases[0];

export const controls: Control[] = [
  { id: "CTL-PM-001", description: "作業範囲（SOW）が版管理され、計画の出発点として参照されている", layer: "normative", process: "PM", activity: "計画", status: "satisfied", machine_rule_ids: ["STR-010"], human_role: "PM", evidence_types: ["SOW", "プロジェクト計画"], evidence_count: 4, source_ref: "ISO/IEC 29110-4-1:2018 PM.1（箇条番号のみ）", updated_at: "2026-11-20" },
  { id: "CTL-PM-002", description: "プロジェクト計画が顧客と合意され、承認記録がある", layer: "normative", process: "PM", activity: "計画", status: "satisfied", machine_rule_ids: ["APR-010"], human_role: "顧客", evidence_types: ["承認記録"], evidence_count: 2, source_ref: "ISO/IEC 29110-4-1:2018 PM.1", updated_at: "2026-10-01" },
  { id: "CTL-PM-003", description: "進捗が計画と比較され、記録されている", layer: "normative", process: "PM", activity: "計画の実行", status: "partial", machine_rule_ids: [], human_role: "PM", evidence_types: ["進捗記録"], evidence_count: 3, source_ref: "ISO/IEC 29110-4-1:2018 PM.2", updated_at: "2026-11-15" },
  { id: "CTL-PM-004", description: "変更要求が記録され、影響を評価したうえで承認されている", layer: "normative", process: "PM", activity: "評価と管理", status: "satisfied", machine_rule_ids: ["CHG-001"], human_role: "PM", evidence_types: ["変更要求", "承認記録"], evidence_count: 5, source_ref: "ISO/IEC 29110-4-1:2018 PM.2", updated_at: "2026-11-26" },
  { id: "CTL-PM-005", description: "リスクと是正処置が追跡され、完了まで管理されている", layer: "guidance", process: "PM", activity: "評価と管理", status: "partial", machine_rule_ids: [], human_role: "PM", evidence_types: ["リスク台帳"], evidence_count: 2, source_ref: "ISO/IEC 29110-5-1-2:2025（参考）", updated_at: "2026-11-10" },
  { id: "CTL-PM-006", description: "納入時に顧客の受入記録が残されている", layer: "normative", process: "PM", activity: "終結", status: "missing", machine_rule_ids: ["REL-005"], human_role: "顧客", evidence_types: ["受入記録"], evidence_count: 0, source_ref: "ISO/IEC 29110-4-1:2018 PM.4", updated_at: "2026-11-27" },
  { id: "CTL-SI-001", description: "要求に一意の ID と受入基準がある", layer: "automated", process: "SI", activity: "要求分析", status: "partial", machine_rule_ids: ["STR-002", "STR-004"], evidence_types: ["要求仕様"], evidence_count: 12, source_ref: "自社ルール（組織の自動化方針）", updated_at: "2026-11-27" },
  { id: "CTL-SI-002", description: "要求が顧客により承認されている", layer: "normative", process: "SI", activity: "要求分析", status: "satisfied", machine_rule_ids: ["APR-002"], human_role: "顧客", evidence_types: ["承認記録"], evidence_count: 8, source_ref: "ISO/IEC 29110-4-1:2018 SI.2", updated_at: "2026-11-01" },
  { id: "CTL-SI-003", description: "設計が要求に対応付けられ、レビューされている", layer: "normative", process: "SI", activity: "設計", status: "satisfied", machine_rule_ids: ["TRC-001"], human_role: "設計者", evidence_types: ["ADR", "レビュー記録"], evidence_count: 8, source_ref: "ISO/IEC 29110-4-1:2018 SI.3", updated_at: "2026-11-20" },
  { id: "CTL-SI-004", description: "コードの変更がレビューされ、CI の検査を通過している", layer: "automated", process: "SI", activity: "構築", status: "satisfied", machine_rule_ids: ["QLT-001", "QLT-004", "APR-001"], human_role: "開発者", evidence_types: ["PR レビュー", "CI ログ"], evidence_count: 42, source_ref: "自社ルール", updated_at: "2026-11-27" },
  { id: "CTL-SI-005", description: "承認済みの要求がテストまで追跡できる", layer: "normative", process: "SI", activity: "結合とテスト", status: "exception", machine_rule_ids: ["TRC-002"], evidence_types: ["トレーサビリティ記録", "テスト結果"], evidence_count: 31, source_ref: "ISO/IEC 29110-4-1:2018 SI.5", updated_at: "2026-11-26" },
  { id: "CTL-SI-006", description: "テスト結果と検証結果が記録されている", layer: "normative", process: "SI", activity: "結合とテスト", status: "partial", machine_rule_ids: ["VER-001"], human_role: "QA", evidence_types: ["テスト報告", "検証記録"], evidence_count: 9, source_ref: "ISO/IEC 29110-4-1:2018 SI.5", updated_at: "2026-11-25" },
  { id: "CTL-SI-007", description: "納入物の構成と版が記録され、署名されている", layer: "tailoring", process: "SI", activity: "製品の納入", status: "satisfied", machine_rule_ids: ["EVD-001", "EVD-002"], human_role: "リリース管理者", evidence_types: ["Evidence Manifest"], evidence_count: 3, source_ref: "組織での調整（TLR-002）", updated_at: "2026-11-05" },
  { id: "CTL-SI-008", description: "開発環境と構成の準備状況が確認されている", layer: "guidance", process: "SI", activity: "開始", status: "satisfied", machine_rule_ids: ["STR-011"], evidence_types: ["環境マニフェスト"], evidence_count: 1, source_ref: "ISO/IEC 29110-5-1-2:2025（参考）", updated_at: "2026-06-01" },
];
export const controlById = (id: string) => controls.find((c) => c.id === id) ?? controls[0];

export const evidence: Evidence[] = [
  { id: "EV-1201", kind: "承認記録", title: "REQ-0001〜0004 の顧客承認", source: { kind: "human", name: "中村 拓也", user_id: "u-nakamura" }, sha256: fakeSha("ev1201"), recorded_at: "2026-10-22T15:00:00+09:00", status: "worm" },
  { id: "EV-1202", kind: "CI ログ", title: "gh-run-99810011 のゲート判定", source: { kind: "ci", name: "Gate B" }, sha256: fakeSha("ev1202"), recorded_at: "2026-11-26T18:21:00+09:00", status: "signed" },
  { id: "EV-1203", kind: "トレーサビリティ記録", title: "trace/edges.yaml スナップショット", source: { kind: "system", name: "Evidence Collector" }, sha256: fakeSha("ev1203"), recorded_at: "2026-11-26T18:21:00+09:00", status: "recorded" },
  { id: "EV-1204", kind: "テスト報告", title: "v1.3.0 結合テスト結果", source: { kind: "ci", name: "integration" }, sha256: fakeSha("ev1204"), recorded_at: "2026-11-05T12:00:00+09:00", status: "worm" },
  { id: "EV-1205", kind: "Evidence Manifest", title: "MAN-0013（v1.3.0）", source: { kind: "system", name: "Signer" }, sha256: fakeSha("ev1205"), recorded_at: "2026-11-05T17:05:00+09:00", status: "worm" },
  { id: "EV-1206", kind: "レビュー記録", title: "ADR-0004 の設計レビュー", source: { kind: "human", name: "山本 結衣", user_id: "u-yamamoto" }, sha256: fakeSha("ev1206"), recorded_at: "2026-10-28T11:00:00+09:00", status: "signed" },
  { id: "EV-1207", kind: "受入記録", title: "v1.4.0 の顧客受入", source: { kind: "human", name: "中村 拓也", user_id: "u-nakamura" }, sha256: "", recorded_at: "", status: "recorded", missing: true },
  { id: "EV-1208", kind: "Evidence Manifest", title: "MAN-0010（v1.1.0）", source: { kind: "system", name: "Signer" }, sha256: fakeSha("ev1208"), recorded_at: "2026-08-01T17:05:00+09:00", status: "verifyFailed" },
];

export const manifests: Manifest[] = [
  { id: "MAN-0013", target: "v1.3.0", target_kind: "release", created_at: "2026-11-05T17:05:00+09:00", signature: "verified", retention: "stored", retention_until: "2033-11-05", approval_count: 3 },
  { id: "MAN-0012", target: "v1.2.1", target_kind: "release", created_at: "2026-10-20T18:05:00+09:00", signature: "signed", retention: "stored", retention_until: "2033-10-20", approval_count: 2 },
  { id: "MAN-0011", target: "v1.2.0", target_kind: "release", created_at: "2026-09-15T17:05:00+09:00", signature: "verified", retention: "stored", retention_until: "2033-09-15", approval_count: 3 },
  { id: "MAN-0010", target: "v1.1.0", target_kind: "release", created_at: "2026-08-01T17:05:00+09:00", signature: "failed", retention: "stored", retention_until: "2033-08-01", approval_count: 2 },
  { id: "MAN-0014", target: "run-5815", target_kind: "gateRun", created_at: "2026-11-26T18:22:00+09:00", signature: "unsigned", retention: "pending", retention_until: "-", approval_count: 1 },
];
export const manifestById = (id: string) => manifests.find((m) => m.id === id) ?? manifests[0];

export const auditEvents: AuditEvent[] = [
  { id: "AE-9001", at: "2026-11-27T10:02:00+09:00", actor: { kind: "ai", name: "coding-agent" }, action: "PR を作成", target: "PR #143", detail: "feature/csv-import" },
  { id: "AE-9000", at: "2026-11-27T09:50:00+09:00", actor: { kind: "human", name: "鈴木 彩" }, action: "例外を申請", target: "EXC-0008" },
  { id: "AE-8999", at: "2026-11-27T09:39:00+09:00", actor: { kind: "ci", name: "Gate B" }, action: "ブロックと判定", target: "run-5821", detail: "TRC-002, QLT-004" },
  { id: "AE-8998", at: "2026-11-27T08:31:00+09:00", actor: { kind: "ai", name: "要求レビュー" }, action: "所見を3件記録", target: "REQ-0010" },
  { id: "AE-8997", at: "2026-11-26T18:31:00+09:00", actor: { kind: "human", name: "佐藤 美咲" }, action: "例外を承認", target: "EXC-0007", detail: "期限 2026-12-03" },
  { id: "AE-8996", at: "2026-11-26T18:22:00+09:00", actor: { kind: "system", name: "Evidence Collector" }, action: "Manifest を作成", target: "MAN-0014" },
  { id: "AE-8995", at: "2026-11-26T16:10:00+09:00", actor: { kind: "human", name: "高橋 健" }, action: "AI所見を却下", target: "AIF-191", detail: "別紙で定義済み" },
  { id: "AE-8994", at: "2026-11-26T15:20:00+09:00", actor: { kind: "human", name: "中村 拓也" }, action: "変更要求を起票", target: "CR-0004" },
  { id: "AE-8993", at: "2026-11-26T11:03:00+09:00", actor: { kind: "ci", name: "Gate A-D" }, action: "通過と判定", target: "run-5810" },
  { id: "AE-8992", at: "2026-11-25T14:06:00+09:00", actor: { kind: "human", name: "高橋 健" }, action: "AI所見を採用", target: "AIF-190" },
  { id: "AE-8991", at: "2026-11-05T17:06:00+09:00", actor: { kind: "system", name: "Signer" }, action: "Manifest に署名し WORM へ保管", target: "MAN-0013" },
  { id: "AE-8990", at: "2026-11-05T16:40:00+09:00", actor: { kind: "human", name: "中村 拓也" }, action: "リリースを受入", target: "v1.3.0" },
];

export const changes: ChangeRequest[] = [
  { id: "CR-0004", title: "上限額の判定を税込金額に変更", filed_by: "u-nakamura", filed_by_kind: "customer", status: "analyzing", impact_count: 3, filed_at: "2026-11-26T15:20:00+09:00" },
  { id: "CR-0003", title: "取引先マスタの CSV 一括登録を追加", filed_by: "u-nakamura", filed_by_kind: "customer", status: "approved", impact_count: 2, approver_id: "u-sato", filed_at: "2026-11-10T10:00:00+09:00" },
  { id: "CR-0002", title: "発注書 PDF に社印を入れる", filed_by: "u-nakamura", filed_by_kind: "customer", status: "applied", impact_count: 3, approver_id: "u-sato", filed_at: "2026-10-30T10:00:00+09:00" },
  { id: "CR-0005", title: "ログ保存先のリージョンを国内に限定", filed_by: "u-tanaka", filed_by_kind: "internal", status: "pending", impact_count: 1, approver_id: "u-nakamura", filed_at: "2026-11-27T09:00:00+09:00" },
  { id: "CR-0001", title: "FAX 送信機能の廃止", filed_by: "u-nakamura", filed_by_kind: "customer", status: "applied", impact_count: 1, approver_id: "u-sato", filed_at: "2026-06-20T10:00:00+09:00" },
  { id: "CR-0006", title: "画面の配色を顧客ブランドに合わせる", filed_by: "u-nakamura", filed_by_kind: "customer", status: "rejected", impact_count: 0, approver_id: "u-sato", filed_at: "2026-11-01T10:00:00+09:00" },
];

export const risks: Risk[] = [
  { id: "RSK-011", kind: "risk", title: "基幹システム側の仕様確定が遅れている", impact: 4, likelihood: 4, status: "inProgress", owner_id: "u-sato", due_at: "2026-12-05", related: ["REQ-0003", "ADR-0003"] },
  { id: "RSK-012", kind: "risk", title: "結合テスト環境の準備遅延", impact: 3, likelihood: 4, status: "open", owner_id: "u-ito", due_at: "2026-12-01", related: ["EXC-0007"] },
  { id: "RSK-009", kind: "risk", title: "依存ライブラリの脆弱性対応", impact: 4, likelihood: 2, status: "monitoring", owner_id: "u-suzuki", due_at: "2026-11-30", related: ["EXC-0006"] },
  { id: "COR-004", kind: "corrective", title: "2段階承認テストの失敗原因の是正", impact: 3, likelihood: 3, status: "inProgress", owner_id: "u-watanabe", due_at: "2026-11-28", related: ["TC-0110"] },
  { id: "RSK-007", kind: "risk", title: "主要メンバーの休暇（12月）", impact: 2, likelihood: 5, status: "monitoring", owner_id: "u-sato", due_at: "2026-12-20", related: [] },
  { id: "COR-003", kind: "corrective", title: "署名検証失敗（MAN-0010）の原因調査", impact: 3, likelihood: 1, status: "done", owner_id: "u-yamamoto", due_at: "2026-08-20", related: ["MAN-0010"] },
  { id: "RSK-005", kind: "risk", title: "性能要件の測定方法が未合意", impact: 3, likelihood: 3, status: "open", owner_id: "u-takahashi", due_at: "2026-11-25", related: ["REQ-0005"] },
];

export const approvalRequests: ApprovalRequest[] = [
  { id: "APR-501", kind: "exception", target_id: "EXC-0008", title: "PR #142 のトレーサビリティ例外", project_slug: "order-renewal", project_name: "受発注システム刷新", requester_id: "u-suzuki", requested_at: "2026-11-27T09:50:00+09:00", due_at: "2026-11-28" },
  { id: "APR-500", kind: "change", target_id: "CR-0004", title: "上限額の判定を税込金額に変更", project_slug: "order-renewal", project_name: "受発注システム刷新", requester_id: "u-nakamura", requested_at: "2026-11-26T15:30:00+09:00", due_at: "2026-12-02" },
  { id: "APR-499", kind: "requirement", target_id: "REQ-0012", title: "発注金額の上限を取引先ごとに設定できる", project_slug: "order-renewal", project_name: "受発注システム刷新", requester_id: "u-takahashi", requested_at: "2026-11-26T11:10:00+09:00", due_at: "2026-11-27" },
  { id: "APR-498", kind: "release", target_id: "rel-140", title: "v1.4.0 のリリース承認", project_slug: "order-renewal", project_name: "受発注システム刷新", requester_id: "u-watanabe", requested_at: "2026-11-25T10:00:00+09:00", due_at: "2026-12-09" },
  { id: "APR-497", kind: "design", target_id: "ADR-0003", title: "基幹連携はファイル連携とし、再送を可能にする", project_slug: "order-renewal", project_name: "受発注システム刷新", requester_id: "u-tanaka", requested_at: "2026-11-20T10:00:00+09:00", due_at: "2026-11-24" },
  { id: "APR-496", kind: "verification", target_id: "VR-0021", title: "v2.0.0 の検証記録", project_slug: "inventory-dashboard", project_name: "在庫管理ダッシュボード", requester_id: "u-ito", requested_at: "2026-11-24T10:00:00+09:00", due_at: "2026-12-01" },
];

export const notifications: Notification[] = [
  { id: "N-1", kind: "approval", text: "鈴木 彩 さんが例外 EXC-0008 の承認を依頼しました", at: "2026-11-27T09:50:00+09:00", read: false },
  { id: "N-2", kind: "gate", text: "PR #142 がゲート B でブロックされました", at: "2026-11-27T09:39:00+09:00", read: false },
  { id: "N-3", kind: "exception", text: "例外 EXC-0006 の期限まで3日です", at: "2026-11-27T08:00:00+09:00", read: false },
  { id: "N-4", kind: "comment", text: "中村 拓也 さんが CR-0004 にコメントしました", at: "2026-11-26T15:25:00+09:00", read: true },
  { id: "N-5", kind: "release", text: "v1.2.1 の受入を顧客に依頼しました", at: "2026-11-20T10:00:00+09:00", read: true },
  { id: "N-6", kind: "system", text: "Basic Control Pack 1.3.1 が公開されました", at: "2026-11-18T10:00:00+09:00", read: true },
];

export const ORG_NAME = orgs[0].name;
