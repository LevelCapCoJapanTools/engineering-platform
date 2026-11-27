// 証跡と監査（V-01〜V-06）の架空データ
import { fakeSha } from "./core";

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
