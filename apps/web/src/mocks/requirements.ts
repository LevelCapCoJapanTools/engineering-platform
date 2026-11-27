// 要求・設計・トレーサビリティ画面の架空データ。
import type { Comment } from "../ui";

export const requirementHistory: Record<string, { version: number; at: string; by: string; note: string; body: string }[]> = {
  "REQ-0007": [
    { version: 1, at: "2026-11-26T16:00:00+09:00", by: "u-takahashi", note: "CR-0003 から作成", body: "取引先マスタを CSV ファイルで一括登録・更新できる。必要に応じてエラー行を表示する。" },
  ],
  "REQ-0008": [
    { version: 3, at: "2026-10-25T10:00:00+09:00", by: "u-takahashi", note: "顧客承認", body: "発注書を所定の様式で PDF 出力できる。" },
    { version: 4, at: "2026-11-24T09:00:00+09:00", by: "u-takahashi", note: "CR-0002 を反映", body: "発注書を所定の様式で PDF 出力できる。\n社印の画像を含められる。" },
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
