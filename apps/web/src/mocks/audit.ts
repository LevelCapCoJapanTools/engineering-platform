// 証跡と監査（V-01〜V-06）の架空データ
import { auditEvents, fakeSha } from "./core";
import type { ActorRef, SourceRef } from "../lib/types";
import type { ShareStatus } from "../lib/vocab";

export const processCoverage: { label: string; process: "PM" | "SI"; satisfied: number; total: number }[] = [
  { label: "PM.1 計画", process: "PM", satisfied: 2, total: 2 },
  { label: "PM.2 計画の実行", process: "PM", satisfied: 0, total: 1 },
  { label: "PM.3 評価と管理", process: "PM", satisfied: 1, total: 2 },
  { label: "PM.4 終結", process: "PM", satisfied: 0, total: 1 },
  { label: "SI.1 開始", process: "SI", satisfied: 1, total: 1 },
  { label: "SI.2 要求分析", process: "SI", satisfied: 1, total: 2 },
  { label: "SI.3 設計", process: "SI", satisfied: 1, total: 1 },
  { label: "SI.4 構築", process: "SI", satisfied: 1, total: 1 },
  { label: "SI.5 結合とテスト", process: "SI", satisfied: 0, total: 2 },
  { label: "SI.6 製品の納入", process: "SI", satisfied: 1, total: 1 },
];

/** 統制項目ごとに紐づく証跡ID */
export const controlEvidence: Record<string, string[]> = {
  "CTL-PM-001": ["EV-1201", "EV-1203"],
  "CTL-PM-002": ["EV-1201"],
  "CTL-PM-004": ["EV-1201"],
  "CTL-PM-006": ["EV-1207"],
  "CTL-SI-002": ["EV-1201"],
  "CTL-SI-003": ["EV-1206"],
  "CTL-SI-004": ["EV-1202"],
  "CTL-SI-005": ["EV-1203", "EV-1202", "EV-1204"],
  "CTL-SI-006": ["EV-1204"],
  "CTL-SI-007": ["EV-1205", "EV-1208"],
};

export const controlTailoring: Record<string, string> = {
  "CTL-SI-007": "TLR-002: 納入物の署名を Sigstore から KMS 署名に置き換え（2026-07-01 承認）",
  "CTL-SI-005": "なし（例外 EXC-0007 が 2026-12-03 まで有効）",
};

export type ManifestDetail = {
  id: string;
  project: string;
  profile: string;
  control_pack_version: string;
  commit_sha: string;
  policy_sha256: string;
  requirements_snapshot_sha256: string;
  ci_run_id: string;
  test_report_sha256: string;
  artifact_sha256: string;
  approvals: { role: string; user_id: string; at: string }[];
  ai_reviews: { purpose: string; model_family: string; prompt_template_sha256: string; result_sha256: string }[];
  exceptions: string[];
  created_at: string;
  signer: string;
  signed_at: string;
  transparency_log: string;
  storage: string;
};

export function manifestDetail(id: string): ManifestDetail {
  return {
    id,
    project: "P-2026-001 受発注システム刷新",
    profile: "software-basic",
    control_pack_version: "Basic Control Pack 1.3.0",
    commit_sha: fakeSha(`${id}-commit`).slice(0, 40),
    policy_sha256: fakeSha("policy-1.3.0"),
    requirements_snapshot_sha256: fakeSha(`${id}-req`),
    ci_run_id: "gh-run-99790012",
    test_report_sha256: fakeSha(`${id}-test`),
    artifact_sha256: fakeSha(`${id}-artifact`),
    approvals: [
      { role: "設計者", user_id: "u-tanaka", at: "2026-11-04T15:00:00+09:00" },
      { role: "リリース管理者", user_id: "u-sato", at: "2026-11-05T16:30:00+09:00" },
      { role: "顧客", user_id: "u-nakamura", at: "2026-11-05T16:40:00+09:00" },
    ],
    ai_reviews: [
      { purpose: "requirements-review", model_family: "model-family-a / 2026-10", prompt_template_sha256: fakeSha("req-review@1.4.0"), result_sha256: fakeSha(`${id}-ai1`) },
      { purpose: "release-note-draft", model_family: "model-family-b / 2026-09", prompt_template_sha256: fakeSha("release-note@0.3.0"), result_sha256: fakeSha(`${id}-ai2`) },
    ],
    exceptions: id === "MAN-0011" ? ["EXC-0004"] : [],
    created_at: "2026-11-05T17:05:00+09:00",
    signer: "release-signer@sample-soft（KMS 鍵 v3）",
    signed_at: "2026-11-05T17:05:20+09:00",
    transparency_log: "rekor-entry 7f21c9…（記録あり）",
    storage: "WORM 保管庫（東京リージョン・別アカウント）",
  };
}

export type ExportRecord = { id: string; at: string; by: string; range: string; sha256: string; share: "none" | "active" | "expired" | "revoked" };
export const exportHistory: ExportRecord[] = [
  { id: "EXP-0005", at: "2026-11-20T14:00:00+09:00", by: "u-sato", range: "v1.2.0〜v1.3.0", sha256: fakeSha("exp5"), share: "active" },
  { id: "EXP-0004", at: "2026-10-01T10:00:00+09:00", by: "u-yamamoto", range: "2026-07-01〜2026-09-30", sha256: fakeSha("exp4"), share: "expired" },
  { id: "EXP-0003", at: "2026-08-02T09:30:00+09:00", by: "u-sato", range: "v1.1.0", sha256: fakeSha("exp3"), share: "revoked" },
];

// ---- 2026-11-28 追加（ギャップ調査 4.9、STD-02、4.8） ----

/** 統制項目から証跡までの連鎖（STD-02）。組織手順・成果物・判断・Manifest を結ぶ */
export type ControlChain = {
  procedure: string;
  procedure_ref: string;
  artifacts: { name: string; ref: string; source: SourceRef }[];
  machine: string[];
  human: { role: string; user_id?: string; note: string }[];
  manifests: string[];
};

const synced = (provider: SourceRef["provider"], label?: string): SourceRef => ({ provider, label, synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" });

export const controlChains: Record<string, ControlChain> = {
  "CTL-PM-001": { procedure: "受託案件の立上げ手順", procedure_ref: "社内手順 PRC-01 v2", artifacts: [{ name: "SOW v3", ref: "SOW-003", source: synced("github", "docs/sow/sow-v3.md") }, { name: "プロジェクト計画", ref: "PLAN-v2", source: synced("githubProjects", "Project #3") }], machine: ["STR-010"], human: [{ role: "PM", user_id: "u-sato", note: "計画の作成（課題管理で実施）" }], manifests: ["MAN-0013", "MAN-0011"] },
  "CTL-PM-006": { procedure: "納入と受入の手順", procedure_ref: "社内手順 PRC-06 v1", artifacts: [{ name: "受入記録（v1.4.0）", ref: "EV-1207", source: { provider: "email", label: "期限付き承認リンク", status: "healthy" } }], machine: ["REL-005"], human: [{ role: "顧客", user_id: "u-nakamura", note: "受入の判断（期限付き承認リンク）" }], manifests: [] },
  "CTL-SI-005": { procedure: "テスト計画と追跡の手順", procedure_ref: "社内手順 PRC-11 v3", artifacts: [{ name: "trace/edges.yaml", ref: "EV-1203", source: synced("github", "order-api") }, { name: "結合テスト結果", ref: "EV-1204", source: synced("githubActions", "integration") }], machine: ["TRC-002"], human: [{ role: "QA", user_id: "u-ito", note: "テスト結果の確認（CI 上のレビュー）" }], manifests: ["MAN-0013"] },
  "CTL-SI-007": { procedure: "リリースと署名の手順", procedure_ref: "社内手順 PRC-14 v2（TLR-002 適用）", artifacts: [{ name: "Evidence Manifest", ref: "EV-1205", source: { provider: "s3ObjectLock", label: "evidence-archive", synced_at: "2026-11-26T22:00:00+09:00", status: "healthy" } }], machine: ["EVD-001", "EVD-002"], human: [{ role: "リリース管理者", user_id: "u-watanabe", note: "リリースの承認（リリース管理で実施）" }], manifests: ["MAN-0013", "MAN-0010"] },
};

/** 連鎖が未定義の統制項目は、統制項目の属性から既定の連鎖を作る */
export function chainFor(c: { id: string; activity: string; evidence_types: string[]; machine_rule_ids: string[]; human_role?: string }): ControlChain {
  return (
    controlChains[c.id] ?? {
      procedure: `${c.activity}の手順`,
      procedure_ref: "社内手順（未登録）",
      artifacts: c.evidence_types.map((t) => ({ name: t, ref: "—", source: synced("github") })),
      machine: c.machine_rule_ids,
      human: c.human_role ? [{ role: c.human_role, note: "承認（外部システムで実施）" }] : [],
      manifests: ["MAN-0013"],
    }
  );
}

/** 証跡の検証に失敗している統制項目（4.9-6）。失敗は充足として扱わない */
export const controlVerifyFailed: Record<string, string> = {
  "CTL-SI-007": "MAN-0010 の署名検証に失敗しています（成果物のハッシュが署名時と一致しません）",
};

/** 検証失敗の理由（4.9-2、6.5） */
export type VerifyFailure = "hashMismatch" | "expired" | "storageMissing" | "keyRevoked";
export const VERIFY_FAILURE: Record<VerifyFailure, { label: string; description: string }> = {
  hashMismatch: { label: "ハッシュ不一致", description: "署名時の値と現在の値が一致しません。署名後に内容が変更された可能性があります" },
  expired: { label: "証明書・鍵の期限切れ", description: "署名に使った証明書または鍵の有効期限が切れており、透明性ログの記録時刻でも有効性を確認できません" },
  storageMissing: { label: "保管先にない", description: "WORM 保管先に対象のオブジェクトが見つかりません（保管先の削除・移動の可能性）" },
  keyRevoked: { label: "鍵の失効", description: "署名に使った鍵が失効しています" },
};

export type ManifestExtra = {
  schema_version: string;
  profile_spec: string;
  policy_version: string;
  rule_version: string;
  template_version: string;
  digests: { path: string; sha256: string; size: string }[];
  retention_locator: string;
  verify: { at: string; result: "pass" | "fail"; reason?: VerifyFailure; by: string }[];
};

export function manifestExtra(id: string): ManifestExtra {
  const failed = id === "MAN-0010";
  return {
    schema_version: "evidence-manifest/1.2",
    profile_spec: "ISO/IEC 29110-4-1:2018（番号の参照のみ）",
    policy_version: "Basic Control Pack 1.3.0",
    rule_version: "gate-rules 1.3.0",
    template_version: "templates 2026.10",
    digests: [
      { path: "requirements/snapshot.json", sha256: fakeSha(`${id}-req`), size: "48 KB" },
      { path: "trace/edges.yaml", sha256: fakeSha(`${id}-trace`), size: "12 KB" },
      { path: "ci/gate-run.json", sha256: fakeSha(`${id}-gate`), size: "9 KB" },
      { path: "tests/report.xml", sha256: fakeSha(`${id}-test`), size: "220 KB" },
      { path: "artifacts/order-api.tar.gz", sha256: fakeSha(`${id}-artifact`), size: "38.2 MB" },
      { path: "sbom/order-api.spdx.json", sha256: fakeSha(`${id}-sbom`), size: "310 KB" },
    ],
    retention_locator: `s3://evidence-archive/sample-soft/order-renewal/${id}.json?versionId=${fakeSha(`${id}-ver`).slice(0, 24)}`,
    verify: failed
      ? [
          { at: "2026-11-27T09:00:00+09:00", result: "fail", reason: "hashMismatch", by: "定期検証（システム）" },
          { at: "2026-11-20T09:00:00+09:00", result: "pass", by: "定期検証（システム）" },
        ]
      : [
          { at: "2026-11-27T09:00:00+09:00", result: "pass", by: "定期検証（システム）" },
          { at: "2026-11-20T14:02:00+09:00", result: "pass", by: "監査パック EXP-0005 の生成時" },
        ],
  };
}

/** 監査ログの連鎖（4.9-5）。連番と前のレコードのハッシュでつなぎ、改ざんや欠番を検出する */
export type ChainedEvent = {
  seq: number;
  id: string;
  at: string;
  actor: ActorRef;
  action: string;
  target: string;
  detail?: string;
  before?: string;
  after?: string;
  prev_hash: string;
  hash: string;
  chain_ok: boolean;
};

const BEFORE_AFTER: Record<string, { before?: string; after?: string }> = {
  "例外を申請": { before: "—", after: "状態: 申請中" },
  "例外を承認": { before: "状態: 申請中", after: "状態: 有効（期限 12/03）" },
  "ブロックと判定": { before: "ゲート B: 未実行", after: "ゲート B: ブロック" },
  "Manifest を作成": { before: "—", after: "署名: 未署名" },
};

export function auditChain(tampered = false): ChainedEvent[] {
  const base = 128_400;
  return auditEvents.map((e, i) => {
    const seq = base - i;
    const ba = BEFORE_AFTER[e.action] ?? {};
    const broken = tampered && i === 3;
    return {
      seq,
      id: e.id,
      at: e.at,
      actor: e.actor,
      action: e.action,
      target: e.target,
      detail: e.detail,
      before: ba.before,
      after: ba.after,
      prev_hash: fakeSha(`chain-${seq - 1}`),
      hash: broken ? fakeSha(`chain-${seq}-altered`) : fakeSha(`chain-${seq}`),
      chain_ok: !broken,
    };
  });
}

/** 署名鍵（V-07） */
export type SigningKey = { id: string; provider: string; alias: string; algorithm: string; status: "active" | "scheduled" | "retired" | "revoked"; created_at: string; rotates_at?: string; fingerprint: string; used_for: string };
export const signingKeys: SigningKey[] = [
  { id: "key-v3", provider: "AWS KMS（東京・証跡用アカウント）", alias: "alias/evidence-signer-v3", algorithm: "ECDSA P-256 / SHA-256", status: "active", created_at: "2026-06-01", rotates_at: "2027-06-01", fingerprint: fakeSha("key-v3").slice(0, 32), used_for: "Evidence Manifest の署名" },
  { id: "key-v4", provider: "AWS KMS（東京・証跡用アカウント）", alias: "alias/evidence-signer-v4", algorithm: "ECDSA P-256 / SHA-256", status: "scheduled", created_at: "2026-11-20", rotates_at: "2026-12-01 に切替予定", fingerprint: fakeSha("key-v4").slice(0, 32), used_for: "切替後の Manifest 署名" },
  { id: "key-v2", provider: "AWS KMS（東京・証跡用アカウント）", alias: "alias/evidence-signer-v2", algorithm: "ECDSA P-256 / SHA-256", status: "retired", created_at: "2025-06-01", fingerprint: fakeSha("key-v2").slice(0, 32), used_for: "過去の署名の検証のみ" },
];

export const transparencyLog = { name: "透明性ログ（公開ログサービス）", status: "healthy" as const, last_entry_at: "2026-11-26T18:22:30+09:00", last_checked_at: "2026-11-27T10:00:00+09:00", entries: 186 };

export type VerifyRecord = { id: string; manifest: string; at: string; result: "pass" | "fail"; reason?: VerifyFailure; by: string; detail: string };
export const verifyHistory: VerifyRecord[] = [
  { id: "VRF-0412", manifest: "MAN-0010", at: "2026-11-27T09:00:00+09:00", result: "fail", reason: "hashMismatch", by: "定期検証（システム）", detail: "成果物とテスト報告のハッシュが署名時と一致しません" },
  { id: "VRF-0411", manifest: "MAN-0013", at: "2026-11-27T09:00:00+09:00", result: "pass", by: "定期検証（システム）", detail: "署名・透明性ログ・保管先のすべてが一致" },
  { id: "VRF-0410", manifest: "MAN-0012", at: "2026-11-27T09:00:00+09:00", result: "pass", by: "定期検証（システム）", detail: "署名・透明性ログ・保管先のすべてが一致" },
  { id: "VRF-0398", manifest: "MAN-0009", at: "2026-11-20T09:00:00+09:00", result: "fail", reason: "storageMissing", by: "定期検証（システム）", detail: "保管先のオブジェクトが見つかりません（旧バケットからの移行漏れ。COR-004 で是正中）" },
  { id: "VRF-0377", manifest: "MAN-0006", at: "2026-11-13T09:00:00+09:00", result: "fail", reason: "expired", by: "評価者による検証", detail: "署名時の証明書が失効済み。透明性ログの記録時刻で有効性を確認できませんでした" },
];

/** 評価者への共有リンク（V-08、4.8） */
export type ShareLink = {
  id: string;
  export_id: string;
  recipient: string;
  company: string;
  scope: string[];
  created_by: string;
  created_at: string;
  expires_at: string;
  status: ShareStatus;
  email_auth: boolean;
  allow_download: boolean;
  views: number;
  downloads: number;
  last_access_at?: string;
};
export const shareLinks: ShareLink[] = [
  { id: "SHR-0021", export_id: "EXP-0005", recipient: "assessor@review-office.example", company: "第三者評価事務所（架空）", scope: ["v1.2.0〜v1.3.0 の監査パック", "統制項目の対応表", "Manifest の検証手順"], created_by: "u-yamamoto", created_at: "2026-11-20T14:10:00+09:00", expires_at: "2026-12-20", status: "active", email_auth: true, allow_download: true, views: 14, downloads: 2, last_access_at: "2026-11-26T16:40:00+09:00" },
  { id: "SHR-0019", export_id: "EXP-0004", recipient: "assessor@review-office.example", company: "第三者評価事務所（架空）", scope: ["2026-07-01〜09-30 の監査パック"], created_by: "u-yamamoto", created_at: "2026-10-01T10:05:00+09:00", expires_at: "2026-10-31", status: "expired", email_auth: true, allow_download: true, views: 22, downloads: 3, last_access_at: "2026-10-29T11:00:00+09:00" },
  { id: "SHR-0015", export_id: "EXP-0003", recipient: "qa-team@kakuu-shoji.example", company: "架空商事株式会社", scope: ["v1.1.0 の監査パック（要約のみ）"], created_by: "u-sato", created_at: "2026-08-02T09:40:00+09:00", expires_at: "2026-09-01", status: "revoked", email_auth: true, allow_download: false, views: 4, downloads: 0, last_access_at: "2026-08-05T10:00:00+09:00" },
];

export type ShareAccess = { id: string; share_id: string; at: string; who: string; action: "閲覧" | "ダウンロード" | "拒否"; target: string; result: string; ip: string };
export const shareAccessLog: ShareAccess[] = [
  { id: "ACC-0907", share_id: "SHR-0021", at: "2026-11-26T16:40:00+09:00", who: "assessor@review-office.example（メール認証済み）", action: "ダウンロード", target: "audit-pack_order-renewal_2026-11-20.zip", result: "成功", ip: "203.0.113.x" },
  { id: "ACC-0906", share_id: "SHR-0021", at: "2026-11-26T16:31:00+09:00", who: "assessor@review-office.example（メール認証済み）", action: "閲覧", target: "統制項目の対応表", result: "成功", ip: "203.0.113.x" },
  { id: "ACC-0905", share_id: "SHR-0021", at: "2026-11-25T22:14:00+09:00", who: "unknown@another.example（認証失敗）", action: "拒否", target: "共有リンク SHR-0021", result: "メール認証に失敗（宛先以外のアドレス）", ip: "198.51.100.x" },
  { id: "ACC-0903", share_id: "SHR-0019", at: "2026-11-02T09:00:00+09:00", who: "assessor@review-office.example", action: "拒否", target: "共有リンク SHR-0019", result: "期限切れ（2026-10-31）", ip: "203.0.113.x" },
  { id: "ACC-0899", share_id: "SHR-0015", at: "2026-09-10T13:00:00+09:00", who: "qa-team@kakuu-shoji.example", action: "拒否", target: "共有リンク SHR-0015", result: "失効済み", ip: "192.0.2.x" },
];

/** 監査パックに含めるファイルとハッシュ（V-06） */
export const exportFiles: { path: string; sha256: string; size: string }[] = [
  { path: "summary.pdf", sha256: fakeSha("pack-summary"), size: "1.2 MB" },
  { path: "control-map.json", sha256: fakeSha("pack-map"), size: "86 KB" },
  { path: "manifests/MAN-0013.json", sha256: fakeSha("pack-man13"), size: "14 KB" },
  { path: "manifests/MAN-0012.json", sha256: fakeSha("pack-man12"), size: "13 KB" },
  { path: "artifacts/index.json", sha256: fakeSha("pack-artifacts"), size: "22 KB" },
  { path: "approvals.json", sha256: fakeSha("pack-approvals"), size: "31 KB" },
  { path: "exceptions.json", sha256: fakeSha("pack-exceptions"), size: "6 KB" },
  { path: "audit-log.jsonl", sha256: fakeSha("pack-log"), size: "2.1 MB" },
  { path: "VERIFY.md", sha256: fakeSha("pack-verify"), size: "4 KB" },
];

/** 証跡の保管先（S-05、4.9-3） */
export const storageTargets: { provider: "s3ObjectLock" | "azureImmutable"; name: string; region: string; backup_region: string; mode: string; status: "active" | "notConnected"; objects: string }[] = [
  { provider: "s3ObjectLock", name: "evidence-archive", region: "東京（ap-northeast-1）", backup_region: "大阪（ap-northeast-3）", mode: "コンプライアンスモード（保持期間中は管理者も削除不可）", status: "active", objects: "Manifest 42件、関連ファイル 318件（1.8 GB）" },
  { provider: "azureImmutable", name: "—", region: "—", backup_region: "—", mode: "時間ベースの保持ポリシー（ロック済み）", status: "notConnected", objects: "—" },
];

/** 法的保全（4.9-4）。保全中は保持期限を過ぎても削除しない */
export const legalHolds: { id: string; target: string; reason: string; set_by: string; set_at: string; status: "active" | "released" }[] = [
  { id: "LH-002", target: "受発注システム刷新の全証跡", reason: "顧客との契約紛争に備えた保全（法務部の依頼）", set_by: "u-kimura", set_at: "2026-10-12T10:00:00+09:00", status: "active" },
  { id: "LH-001", target: "MAN-0004〜0006", reason: "社内調査の完了まで", set_by: "u-yamamoto", set_at: "2026-03-02T10:00:00+09:00", status: "released" },
];
