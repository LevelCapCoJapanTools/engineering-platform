// 要求・設計・トレーサビリティ画面の架空データ。
import type { Comment } from "../ui";
import type { SourceRef } from "../lib/types";
import type { ArtifactStatus, ProviderKey, Role, Severity } from "../lib/vocab";

export const requirementHistory: Record<string, { version: number; at: string; by: string; note: string; body: string; criteria?: string[]; hash?: string }[]> = {
  "REQ-0007": [
    { version: 1, at: "2026-11-26T16:00:00+09:00", by: "u-takahashi", note: "CR-0003 から作成", body: "取引先マスタを CSV ファイルで一括登録・更新できる。必要に応じてエラー行を表示する。" },
  ],
  "REQ-0008": [
    { version: 2, at: "2026-10-10T10:00:00+09:00", by: "u-takahashi", note: "レビュー指摘を反映", body: "発注書を PDF 出力できる。", criteria: ["A4 縦で出力される"] },
    { version: 3, at: "2026-10-25T10:00:00+09:00", by: "u-takahashi", note: "顧客承認", body: "発注書を所定の様式で PDF 出力できる。", criteria: ["A4 縦で出力される", "所定の様式（様式第3号）の項目がすべて入る"], hash: "req-0008-v3" },
    { version: 4, at: "2026-11-24T09:00:00+09:00", by: "u-takahashi", note: "CR-0002 を反映", body: "発注書を所定の様式で PDF 出力できる。\n社印の画像を含められる。", criteria: ["A4 縦で出力される", "所定の様式（様式第3号）の項目がすべて入る", "社印の画像を含められる"] },
  ],
};

export const requirementComments: Comment[] = [
  { id: "c1", user_id: "u-tanaka", body: "エラー行の表示は画面とダウンロードの両方が必要ですか？", at: "2026-11-26T17:10:00+09:00", replies: [{ id: "r1", user_id: "u-takahashi", body: "顧客に確認中です。CR-0003 のコメントを参照してください。", at: "2026-11-26T17:40:00+09:00" }] },
  { id: "c2", user_id: "u-nakamura", body: "1回の取込件数は最大1万件程度を想定しています。", at: "2026-11-27T09:05:00+09:00" },
];

export const designBodies: Record<string, string> = {
  "ADR-0003": `## 背景
基幹システムは API を公開しておらず、夜間のファイル取込のみに対応している。REQ-0003 では承認済みの発注データを毎日連携する必要がある。

## 決定
発注データを CSV ファイルとして共有ストレージに配置し、基幹システム側の夜間バッチで取り込む。送信済みファイルは 30 日間保持し、失敗時は手動または自動で再送できるようにする。

## 選択肢
| 選択肢 | 長所 | 短所 |
| --- | --- | --- |
| ファイル連携 | 基幹側の改修が不要 | リアルタイム性がない |
| API 連携 | 即時に反映される | 基幹側の改修が必要で納期に間に合わない |
| DB 直接連携 | 実装が速い | 責任分界があいまいになる |

## 結果
- 連携は最大 1 日遅れる
- 再送の手順を運用手順書に追加する
- 失敗の通知先は REQ-0003 の受入基準で定める`,
};

export const designComments: Comment[] = [
  { id: "d1", user_id: "u-sato", body: "再送の自動化は v1.4.0 に含めますか？範囲を明記してください。", at: "2026-11-21T10:00:00+09:00" },
  { id: "d2", user_id: "u-watanabe", body: "PR #140 で再送処理を実装済みです。", at: "2026-11-21T13:20:00+09:00", resolved: true },
];

export type VerificationRecord = {
  id: string;
  kind: "verification" | "validation";
  target: string;
  method: string;
  result: "passed" | "failed" | "conditional";
  performer_id: string;
  reviewer_id?: string;
  review_status: "approved" | "pending" | "draft";
  evidence: string;
  at: string;
};

export const verificationRecords: VerificationRecord[] = [
  { id: "VR-0018", kind: "verification", target: "DSN-0005 承認ワークフローの詳細設計", method: "設計レビュー（チェックリスト）", result: "passed", performer_id: "u-ito", reviewer_id: "u-tanaka", review_status: "approved", evidence: "EV-1206", at: "2026-10-19T15:00:00+09:00" },
  { id: "VR-0019", kind: "verification", target: "v1.3.0 結合テスト結果", method: "テスト結果のレビュー", result: "passed", performer_id: "u-ito", reviewer_id: "u-sato", review_status: "approved", evidence: "EV-1204", at: "2026-11-05T12:30:00+09:00" },
  { id: "VR-0022", kind: "verification", target: "REQ-0002 2段階承認", method: "結合テストの再実施", result: "failed", performer_id: "u-ito", review_status: "pending", evidence: "gh-run-99811500", at: "2026-11-26T14:00:00+09:00" },
  { id: "VL-0006", kind: "validation", target: "v1.3.0 顧客受入テスト", method: "顧客環境での業務シナリオ確認", result: "passed", performer_id: "u-nakamura", reviewer_id: "u-sato", review_status: "approved", evidence: "EV-1201", at: "2026-11-05T16:30:00+09:00" },
  { id: "VL-0007", kind: "validation", target: "PDF 帳票の様式確認", method: "顧客による様式レビュー", result: "conditional", performer_id: "u-nakamura", review_status: "draft", evidence: "—", at: "2026-11-25T11:00:00+09:00" },
];

export const testRuns = [
  { id: "gh-run-99812345", commit: "c142", branch: "feature/audit-log-writer", passed: 182, failed: 0, skipped: 3, at: "2026-11-27T09:36:00+09:00" },
  { id: "gh-run-99811500", commit: "c141", branch: "feature/search-status", passed: 179, failed: 1, skipped: 3, at: "2026-11-26T14:00:00+09:00" },
  { id: "gh-run-99809877", commit: "c140", branch: "feature/batch-retry", passed: 176, failed: 0, skipped: 4, at: "2026-11-26T18:18:00+09:00" },
  { id: "gh-run-99805550", commit: "c139", branch: "fix/pdf-font", passed: 176, failed: 0, skipped: 4, at: "2026-11-26T11:00:00+09:00" },
];

export const testFailures = [
  { test_id: "TC-0110", title: "50万円以上で2段階承認になる", run: "gh-run-99811500", message: "expected status 'pending_second' but got 'approved'", file: "tests/integration/approval_flow.rs", line: 88 },
];

/** PR の架空タイトル */
export const prTitles: Record<number, string> = {
  101: "SAML ログインの実装",
  104: "ログアウト処理",
  118: "発注書作成画面",
  124: "明細バリデーション",
  126: "発注一覧の検索",
  131: "2段階承認フロー",
  135: "PDF 帳票出力",
  140: "基幹連携バッチの再送処理",
  142: "操作ログを追記専用ストレージへ書き込む",
};


// ---- 2026-11-28 追加: 正本・承認記録・SI 証跡（SI-01〜SI-10） ----

/** 要求・設計は docs-as-code の正本（GitHub リポジトリ）から同期する */
export const REQ_REPO = "sample-soft/order-api";
export const reqSource = (file: string, at = "2026-11-27T10:28:00+09:00"): SourceRef => ({ provider: "github", label: file, synced_at: at, status: "healthy" });

export type ReqTransition = { at: string; from: ArtifactStatus | null; to: ArtifactStatus; by: string; via: string; version: number; note?: string };
export type ReqApproval = { version: number; role: Role; user_id: string; status: "approved" | "pending" | "returned" | "invalid"; at?: string; via: string; comment?: string; invalid_reason?: string };

/** 要求ごとの承認記録・状態遷移の上書き。指定がない要求は common.tsx の reqMeta() が状態から既定値を作る */
export const requirementMeta: Record<string, { approved_version?: number; approved_at?: string; transitions?: ReqTransition[]; approvals?: ReqApproval[]; issue?: string }> = {
  "REQ-0008": {
    approved_version: 3,
    approved_at: "2026-10-25T15:00:00+09:00",
    issue: "#212",
    transitions: [
      { at: "2026-10-01T10:00:00+09:00", from: null, to: "draft", by: "u-takahashi", via: "GitHub（docs/requirements）", version: 1 },
      { at: "2026-10-05T10:00:00+09:00", from: "draft", to: "inReview", by: "u-takahashi", via: "GitHub PR #96", version: 1 },
      { at: "2026-10-09T17:00:00+09:00", from: "inReview", to: "draft", by: "u-tanaka", via: "GitHub PR レビュー（変更を要求）", version: 1, note: "様式の指定が不足" },
      { at: "2026-10-20T10:00:00+09:00", from: "draft", to: "pending", by: "u-takahashi", via: "期限付き承認リンクで依頼", version: 3 },
      { at: "2026-10-25T15:00:00+09:00", from: "pending", to: "approved", by: "u-nakamura", via: "期限付き承認リンク", version: 3 },
      { at: "2026-11-24T09:00:00+09:00", from: "approved", to: "changing", by: "u-takahashi", via: "GitHub PR #139（CR-0002）", version: 4 },
    ],
    approvals: [
      { version: 3, role: "PM", user_id: "u-sato", status: "approved", at: "2026-10-22T11:00:00+09:00", via: "GitHub PR レビュー" },
      { version: 3, role: "顧客", user_id: "u-nakamura", status: "approved", at: "2026-10-25T15:00:00+09:00", via: "期限付き承認リンク", comment: "様式第3号で問題ありません。" },
      { version: 4, role: "PM", user_id: "u-sato", status: "approved", at: "2026-11-25T10:00:00+09:00", via: "GitHub PR レビュー" },
      { version: 4, role: "顧客", user_id: "u-nakamura", status: "pending", via: "期限付き承認リンク（期限 12/04）" },
    ],
  },
  "REQ-0012": {
    issue: "#230",
    transitions: [
      { at: "2026-11-10T10:00:00+09:00", from: null, to: "draft", by: "u-takahashi", via: "GitHub（docs/requirements）", version: 1 },
      { at: "2026-11-18T10:00:00+09:00", from: "draft", to: "inReview", by: "u-takahashi", via: "GitHub PR #133", version: 1 },
      { at: "2026-11-25T09:00:00+09:00", from: "inReview", to: "pending", by: "u-takahashi", via: "期限付き承認リンクで依頼", version: 1 },
    ],
    approvals: [
      { version: 1, role: "PM", user_id: "u-takahashi", status: "invalid", at: "2026-11-25T09:20:00+09:00", via: "GitHub PR レビュー", invalid_reason: "作成者本人の承認のため、承認として数えていません（職務分離）" },
      { version: 1, role: "PM", user_id: "u-sato", status: "pending", via: "GitHub PR レビュー" },
      { version: 1, role: "顧客", user_id: "u-nakamura", status: "pending", via: "期限付き承認リンク（期限 12/04）" },
    ],
  },
  "REQ-0005": {
    transitions: [
      { at: "2026-10-01T10:00:00+09:00", from: null, to: "draft", by: "u-takahashi", via: "GitHub（docs/requirements）", version: 1 },
      { at: "2026-11-01T10:00:00+09:00", from: "draft", to: "pending", by: "u-takahashi", via: "期限付き承認リンクで依頼", version: 1 },
      { at: "2026-11-05T16:00:00+09:00", from: "pending", to: "draft", by: "u-nakamura", via: "期限付き承認リンク（差戻し）", version: 1, note: "「速やかに」を数値で示してほしい" },
      { at: "2026-11-25T14:30:00+09:00", from: "draft", to: "pending", by: "u-takahashi", via: "期限付き承認リンクで再依頼", version: 2 },
    ],
    approvals: [
      { version: 1, role: "顧客", user_id: "u-nakamura", status: "returned", at: "2026-11-05T16:00:00+09:00", via: "期限付き承認リンク", comment: "「速やかに」を数値で示してほしい" },
      { version: 2, role: "PM", user_id: "u-sato", status: "approved", at: "2026-11-25T15:00:00+09:00", via: "GitHub PR レビュー" },
      { version: 2, role: "顧客", user_id: "u-nakamura", status: "pending", via: "期限付き承認リンク（期限 12/02）" },
    ],
  },
  "REQ-0011": {
    transitions: [
      { at: "2026-07-01T10:00:00+09:00", from: null, to: "draft", by: "u-takahashi", via: "GitHub（docs/requirements）", version: 1 },
      { at: "2026-07-20T10:00:00+09:00", from: "pending", to: "approved", by: "u-nakamura", via: "期限付き承認リンク", version: 1 },
      { at: "2026-09-02T10:00:00+09:00", from: "approved", to: "obsolete", by: "u-sato", via: "CR-0001 の承認に基づく", version: 1, note: "FAX 送信の廃止" },
    ],
  },
};

/** 設計判断の構造化データ（SI-03）。正本は GitHub の docs/design */
export type DesignAlternative = { name: string; pros: string; cons: string; chosen?: boolean };
export type DesignReview = { reviewer_id: string; at: string; result: "approved" | "changesRequested" | "commented"; via: string; note?: string };
export const designMeta: Record<string, { pr?: number; alternatives?: DesignAlternative[]; reason?: string; outcome?: string; revisions?: { version: number; at: string; by: string; note: string }[]; reviews?: DesignReview[] }> = {
  "ADR-0003": {
    pr: 137,
    alternatives: [
      { name: "ファイル連携", pros: "基幹側の改修が不要", cons: "連携が最大1日遅れる", chosen: true },
      { name: "API 連携", pros: "即時に反映される", cons: "基幹側の改修が必要で納期に間に合わない" },
      { name: "DB 直接連携", pros: "実装が速い", cons: "責任分界があいまいになる" },
    ],
    reason: "基幹システムの改修期間（6か月）が契約納期を超えるため。顧客の情報システム部門と 2026-11-18 の定例会で合意。",
    outcome: "連携は最大1日遅れる。再送の手順を運用手順書に追加する。",
    revisions: [
      { version: 1, at: "2026-11-18T15:00:00+09:00", by: "u-tanaka", note: "作成" },
      { version: 2, at: "2026-11-20T10:00:00+09:00", by: "u-tanaka", note: "再送の保持期間を 30 日に" },
    ],
    reviews: [
      { reviewer_id: "u-watanabe", at: "2026-11-21T13:20:00+09:00", result: "commented", via: "GitHub PR #137 レビュー", note: "再送処理は PR #140 で実装済み" },
      { reviewer_id: "u-sato", at: "2026-11-21T10:00:00+09:00", result: "changesRequested", via: "GitHub PR #137 レビュー", note: "v1.4.0 の範囲を明記すること" },
    ],
  },
  "ADR-0004": {
    pr: 121,
    alternatives: [
      { name: "追記専用ストレージ（WORM）", pros: "改ざんできない", cons: "保管費用が増える", chosen: true },
      { name: "通常の DB テーブル", pros: "検索が速い", cons: "管理者が書き換えられる" },
    ],
    reason: "REQ-0006 の受入基準「改ざんできない保管先」を満たすため。",
    outcome: "保管費用が月 2 万円増える。検索用の索引は別に持つ。",
    revisions: [{ version: 1, at: "2026-10-20T10:00:00+09:00", by: "u-tanaka", note: "作成" }, { version: 2, at: "2026-10-28T10:00:00+09:00", by: "u-tanaka", note: "索引の方式を追記" }],
    reviews: [{ reviewer_id: "u-yamamoto", at: "2026-10-28T16:00:00+09:00", result: "approved", via: "GitHub PR #121 レビュー" }],
  },
};

/** リンクの出典と確定者（SI-04）。via は記録された場所 */
export type LinkProvenance = { via: string; provider: ProviderKey; confirmed_by?: string; confirmed_at?: string };
export const linkProvenance: Record<string, LinkProvenance> = {
  design: { via: "trace/edges.yaml", provider: "github", confirmed_by: "u-tanaka", confirmed_at: "2026-10-20T10:00:00+09:00" },
  pr: { via: "PR 本文の Refs 記載", provider: "github", confirmed_by: "u-suzuki", confirmed_at: "2026-11-02T10:00:00+09:00" },
  test: { via: "テストコードの要求ID注記", provider: "github", confirmed_by: "u-ito", confirmed_at: "2026-11-05T10:00:00+09:00" },
  run: { via: "CI のテストレポート（JUnit）", provider: "githubActions" },
  vv: { via: "検証記録", provider: "github", confirmed_by: "u-sato" },
  release: { via: "リリースの Evidence Manifest", provider: "github", confirmed_by: "u-watanabe" },
};

/** 要求とリリース成果物の対応 */
export const requirementReleases: Record<string, { version: string; release_id: string; artifact: string; digest_seed: string }[]> = {
  "REQ-0001": [{ version: "v1.2.0", release_id: "rel-120", artifact: "order-api-1.2.0.tar.gz", digest_seed: "a120" }],
  "REQ-0004": [{ version: "v1.2.0", release_id: "rel-120", artifact: "order-api-1.2.0.tar.gz", digest_seed: "a120" }],
  "REQ-0002": [{ version: "v1.3.0", release_id: "rel-130", artifact: "order-api-1.3.0.tar.gz", digest_seed: "a130" }],
  "REQ-0009": [{ version: "v1.2.0", release_id: "rel-120", artifact: "order-web-1.2.0.tar.gz", digest_seed: "w120" }],
};

/** テスト実行の詳細（SI-07）。実行者は CI の ID または人 */
export const testRunDetails: Record<string, { provider: ProviderKey; executor: string; environment: string; sha_seed: string }> = {
  "gh-run-99812345": { provider: "githubActions", executor: "CI（github-actions[bot]）", environment: "ubuntu-24.04 / Rust 1.100.0 / PostgreSQL 17", sha_seed: "c142" },
  "gh-run-99811500": { provider: "githubActions", executor: "CI（github-actions[bot]）", environment: "ubuntu-24.04 / Rust 1.100.0 / PostgreSQL 17", sha_seed: "c141" },
  "gh-run-99809877": { provider: "githubActions", executor: "CI（github-actions[bot]）", environment: "ubuntu-24.04 / Rust 1.99.0 / PostgreSQL 17", sha_seed: "c140" },
  "gh-run-99805550": { provider: "githubActions", executor: "CI（github-actions[bot]）", environment: "ubuntu-24.04 / Rust 1.99.0 / PostgreSQL 17", sha_seed: "c139" },
};

export const skippedTests = [
  { test_id: "TC-0140", title: "性能: 同時接続50件", run: "gh-run-99812345", reason: "性能試験環境が未準備（MS-105 待ち）" },
  { test_id: "TC-0131", title: "PDF の印影の位置", run: "gh-run-99812345", reason: "フォントファイルの配布許諾を確認中" },
];

/** 再試験の記録 */
export const retests = [
  { id: "RT-0004", test_id: "TC-0110", defect: "DEF-0031", original_run: "gh-run-99811500", retest_run: "—", status: "pending" as const, note: "修正 PR #144 のマージ後に再実行" },
  { id: "RT-0003", test_id: "TC-0102", defect: "DEF-0028", original_run: "gh-run-99805000", retest_run: "gh-run-99805550", status: "passed" as const, note: "" },
];

/** 顧客の確認（妥当性確認） */
export const customerConfirmations = [
  { record: "VL-0006", by: "u-nakamura", at: "2026-11-05T16:30:00+09:00", via: "期限付き承認リンク", result: "確認済み" },
  { record: "VL-0007", by: "u-nakamura", at: "", via: "期限付き承認リンク（期限 12/04）", result: "未確認" },
];

/** 不具合（SI-10）。正本は GitHub Issues */
export type Defect = {
  id: string;
  issue: string;
  title: string;
  severity: Severity;
  status: "open" | "fixing" | "retest" | "closed" | "known";
  repro: string;
  assignee: string;
  fix_commit?: string;
  fix_pr?: number;
  retest?: "passed" | "failed" | "pending";
  requirement_ids: string[];
  found_in: string;
  release_note?: string;
  reported_by: string;
  reported_at: string;
  synced_at: string;
};
export const defects: Defect[] = [
  { id: "DEF-0031", issue: "#228", title: "50万円ちょうどの発注が1段階承認になる", severity: "high", status: "retest", repro: "1. 金額 500,000 円の発注を作成\n2. 承認依頼を送る\n3. 課長の承認のみで完了する", assignee: "u-suzuki", fix_commit: "c144", fix_pr: 144, retest: "pending", requirement_ids: ["REQ-0002"], found_in: "結合テスト（gh-run-99811500）", reported_by: "u-ito", reported_at: "2026-11-26T14:20:00+09:00", synced_at: "2026-11-27T10:28:00+09:00" },
  { id: "DEF-0030", issue: "#226", title: "CSV 取込で Shift_JIS のファイルが文字化けする", severity: "medium", status: "fixing", repro: "Shift_JIS の CSV を取り込む", assignee: "u-watanabe", requirement_ids: ["REQ-0007"], found_in: "顧客の試用", reported_by: "u-nakamura", reported_at: "2026-11-25T11:00:00+09:00", synced_at: "2026-11-27T10:28:00+09:00" },
  { id: "DEF-0029", issue: "#219", title: "PDF の社印が 1mm 右にずれる", severity: "low", status: "known", repro: "社印画像を含めて PDF を出力する", assignee: "u-watanabe", requirement_ids: ["REQ-0008"], found_in: "受入テスト（VL-0007）", release_note: "v1.4.0 の既知の問題として記載。v1.5.0 で修正予定", reported_by: "u-nakamura", reported_at: "2026-11-24T10:00:00+09:00", synced_at: "2026-11-27T10:28:00+09:00" },
  { id: "DEF-0028", issue: "#210", title: "明細0行の発注が保存できてしまう", severity: "high", status: "closed", repro: "明細を全て削除して保存する", assignee: "u-suzuki", fix_commit: "c139", fix_pr: 139, retest: "passed", requirement_ids: ["REQ-0001"], found_in: "単体テスト", reported_by: "u-ito", reported_at: "2026-11-20T10:00:00+09:00", synced_at: "2026-11-27T10:28:00+09:00" },
  { id: "DEF-0027", issue: "#205", title: "検索結果の件数表示が 1 件少ない", severity: "low", status: "open", repro: "条件なしで検索する", assignee: "u-suzuki", requirement_ids: [], found_in: "社内レビュー", reported_by: "u-tanaka", reported_at: "2026-11-18T10:00:00+09:00", synced_at: "2026-11-27T10:28:00+09:00" },
];

/** 品質・セキュリティスキャン（SI-09）。外部 CI から取り込んだ構造化結果 */
export type ScanKind = "sast" | "deps" | "secret" | "license" | "container" | "sbom";
export type Scan = {
  id: string;
  kind: ScanKind;
  tool: string;
  tool_version: string;
  config_seed: string;
  sha_seed: string;
  run_id: string;
  provider: ProviderKey;
  at: string;
  counts: { critical: number; high: number; medium: number; low: number };
  rule: string;
  result: "pass" | "block" | "warn" | "exception";
  exception?: string;
  stale?: boolean;
  note?: string;
};
export const scans: Scan[] = [
  { id: "SC-0412", kind: "sast", tool: "Semgrep", tool_version: "1.98.0", config_seed: "semgrep-p-default-v4", sha_seed: "c142", run_id: "gh-run-99812345", provider: "githubActions", at: "2026-11-27T09:36:00+09:00", counts: { critical: 0, high: 0, medium: 2, low: 5 }, rule: "QLT-003 重大度「高」以上が0件", result: "pass" },
  { id: "SC-0413", kind: "deps", tool: "cargo-audit", tool_version: "0.21.1", config_seed: "audit-toml-v2", sha_seed: "c142", run_id: "gh-run-99812345", provider: "githubActions", at: "2026-11-27T09:36:00+09:00", counts: { critical: 0, high: 1, medium: 0, low: 0 }, rule: "QLT-004 既知の脆弱性（高以上）が0件", result: "exception", exception: "EXC-0007" },
  { id: "SC-0414", kind: "secret", tool: "gitleaks", tool_version: "8.21.2", config_seed: "gitleaks-v1", sha_seed: "c142", run_id: "gh-run-99812345", provider: "githubActions", at: "2026-11-27T09:36:00+09:00", counts: { critical: 0, high: 0, medium: 0, low: 0 }, rule: "QLT-006 シークレットの検出が0件", result: "pass" },
  { id: "SC-0415", kind: "license", tool: "cargo-deny", tool_version: "0.16.3", config_seed: "deny-toml-v3", sha_seed: "c142", run_id: "gh-run-99812345", provider: "githubActions", at: "2026-11-27T09:36:00+09:00", counts: { critical: 0, high: 0, medium: 1, low: 0 }, rule: "QLT-007 許可リスト外のライセンスなし", result: "warn", note: "MPL-2.0 のライブラリ 1 件。許可リストに未登録" },
  { id: "SC-0416", kind: "container", tool: "Trivy", tool_version: "0.57.0", config_seed: "trivy-v1", sha_seed: "c141", run_id: "gh-run-99811500", provider: "githubActions", at: "2026-11-26T14:00:00+09:00", counts: { critical: 0, high: 0, medium: 3, low: 12 }, rule: "QLT-008 重大度「緊急」が0件", result: "pass", stale: true, note: "最新コミット（c142）のスキャンがないため、判定には使っていません" },
  { id: "SC-0417", kind: "sbom", tool: "Syft", tool_version: "1.16.0", config_seed: "syft-spdx", sha_seed: "c142", run_id: "gh-run-99812345", provider: "githubActions", at: "2026-11-27T09:36:00+09:00", counts: { critical: 0, high: 0, medium: 0, low: 0 }, rule: "STR-009 SBOM（SPDX）が生成されている", result: "pass", note: "パッケージ 214 件" },
];
export const scanFindings = [
  { scan: "SC-0413", id: "RUSTSEC-2026-0042", severity: "high" as Severity, target: "Cargo.lock: example-xml 0.31.2", fixed_in: "0.31.4", status: "例外適用中（EXC-0007、12/03 まで）" },
  { scan: "SC-0412", id: "rust.lang.security.unsafe-block", severity: "medium" as Severity, target: "src/pdf/render.rs:211", fixed_in: "—", status: "未対応" },
  { scan: "SC-0412", id: "rust.lang.correctness.unwrap-in-handler", severity: "medium" as Severity, target: "src/api/import.rs:88", fixed_in: "—", status: "未対応" },
  { scan: "SC-0415", id: "license:MPL-2.0", severity: "medium" as Severity, target: "example-font-loader 2.1.0", fixed_in: "—", status: "許可リストへの追加を申請中" },
];

/** ビルド・CI 証跡（SI-06）。複数の CI 基盤から取り込む */
export type BuildRun = {
  id: string;
  provider: ProviderKey;
  workflow: string;
  repo: string;
  branch: string;
  sha_seed: string;
  status: "success" | "failed" | "cancelled" | "running";
  attempt: number;
  trigger: string;
  started_at: string;
  duration_min: number;
  environment: string;
  lock_seed: string;
  artifacts: { name: string; seed: string }[];
  release?: string;
  note?: string;
};
export const buildRuns: BuildRun[] = [
  { id: "gh-run-99812345", provider: "githubActions", workflow: "ci.yml / build-test", repo: "sample-soft/order-api", branch: "feature/audit-log-writer", sha_seed: "c142", status: "success", attempt: 1, trigger: "pull_request #142", started_at: "2026-11-27T09:30:00+09:00", duration_min: 6, environment: "ubuntu-24.04 / Rust 1.100.0", lock_seed: "lock-142", artifacts: [{ name: "order-api", seed: "bin-142" }] },
  { id: "gh-run-99812001", provider: "githubActions", workflow: "release.yml", repo: "sample-soft/order-api", branch: "release/1.4", sha_seed: "c143r", status: "success", attempt: 2, trigger: "tag v1.4.0-rc.1", started_at: "2026-11-27T08:10:00+09:00", duration_min: 11, environment: "ubuntu-24.04 / Rust 1.100.0", lock_seed: "lock-143", artifacts: [{ name: "order-api-1.4.0-rc.1.tar.gz", seed: "rc1" }, { name: "sbom.spdx.json", seed: "sbom-rc1" }], release: "rel-140", note: "1回目は依存取得のタイムアウトで失敗。再実行で成功" },
  { id: "gh-run-99811500", provider: "githubActions", workflow: "ci.yml / build-test", repo: "sample-soft/order-api", branch: "feature/search-status", sha_seed: "c141", status: "failed", attempt: 1, trigger: "pull_request #141", started_at: "2026-11-26T13:52:00+09:00", duration_min: 8, environment: "ubuntu-24.04 / Rust 1.100.0", lock_seed: "lock-141", artifacts: [], note: "TC-0110 が失敗" },
  { id: "gh-run-99811000", provider: "githubActions", workflow: "ci.yml / build-test", repo: "sample-soft/order-web", branch: "feature/pdf-seal", sha_seed: "w088", status: "cancelled", attempt: 1, trigger: "push", started_at: "2026-11-26T11:00:00+09:00", duration_min: 1, environment: "ubuntu-24.04 / Node 24", lock_seed: "lock-w088", artifacts: [], note: "新しいコミットの push により取り消し" },
  { id: "gl-pipeline-48812", provider: "gitlabCi", workflow: ".gitlab-ci.yml / test", repo: "member-app/api", branch: "main", sha_seed: "m220", status: "success", attempt: 1, trigger: "merge_request !58", started_at: "2026-11-27T07:40:00+09:00", duration_min: 9, environment: "docker:node-24", lock_seed: "lock-m220", artifacts: [{ name: "member-api.tgz", seed: "m220" }] },
  { id: "cb-build-2219", provider: "codebuild", workflow: "legacy-migration-build", repo: "legacy-migration（CodeCommit）", branch: "main", sha_seed: "l031", status: "success", attempt: 1, trigger: "CodePipeline", started_at: "2026-11-26T22:00:00+09:00", duration_min: 14, environment: "aws/codebuild/standard:8.0", lock_seed: "lock-l031", artifacts: [{ name: "migration-tool.zip", seed: "l031" }] },
  { id: "az-build-771", provider: "azurePipelines", workflow: "azure-pipelines.yml", repo: "inventory-dashboard（Azure Repos）", branch: "develop", sha_seed: "i512", status: "running", attempt: 1, trigger: "PR 41", started_at: "2026-11-27T10:22:00+09:00", duration_min: 0, environment: "windows-2025", lock_seed: "lock-i512", artifacts: [] },
  { id: "jk-1882", provider: "jenkins", workflow: "nightly-e2e", repo: "sample-soft/order-web", branch: "main", sha_seed: "w087", status: "success", attempt: 1, trigger: "定期実行", started_at: "2026-11-27T02:00:00+09:00", duration_min: 32, environment: "jenkins-agent-linux-04", lock_seed: "lock-w087", artifacts: [], note: "Jenkins は予定中のコネクタ。手動取込の記録" },
];
