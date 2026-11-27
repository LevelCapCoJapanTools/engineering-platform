// ゲート・PR・例外の画面用の架空データ。
import type { AiFinding } from "../lib/types";
import type { TimelineItem } from "../ui";

/** PR に対するAIの参考所見（判定には使われない） */
export const prFindings: AiFinding[] = [
  { id: "AIF-310", kind: "linkCandidate", severity: "low", confidence: 0.73, target_id: "PR #142", excerpt: "src/audit/writer.rs: append_only_put()", highlight: "append_only_put", explanation: "この変更は REQ-0006（操作ログを7年間保存する）を実装している可能性があります。確定リンクにするとゲートBの判定入力に含まれます。", suggestion: "PR の説明に REQ-0006 を記載するか、トレーサビリティ画面でリンクを確定してください。", model: "model-family-b / 2026-09", template_version: "trace-link@0.9.0", status: "unconfirmed", created_at: "2026-11-27T09:39:30+09:00" },
  { id: "AIF-311", kind: "testability", severity: "medium", confidence: 0.66, target_id: "PR #142", excerpt: "失敗時は 3 回まで再試行し、それでも失敗したら破棄する", highlight: "破棄する", explanation: "ログの書き込みに失敗したときに破棄すると、REQ-0006 の「改ざんできない保管」と矛盾する可能性があります。失敗時の扱いを設計者に確認してください。", model: "model-family-a / 2026-10", template_version: "pr-review@0.4.1", status: "unconfirmed", created_at: "2026-11-27T09:39:30+09:00" },
];

export const runTimeline: TimelineItem[] = [
  { id: "t1", actor: { kind: "human", name: "鈴木 彩" }, action: "PR を更新", target: "#142", at: "2026-11-27T09:37:00+09:00" },
  { id: "t2", actor: { kind: "system", name: "Evidence Collector" }, action: "入力スナップショットを記録", at: "2026-11-27T09:38:00+09:00" },
  { id: "t3", actor: { kind: "ci", name: "Gate A" }, action: "通過と判定", at: "2026-11-27T09:38:30+09:00" },
  { id: "t4", actor: { kind: "ci", name: "Gate B" }, action: "ブロックと判定", detail: "TRC-002, QLT-004", at: "2026-11-27T09:39:00+09:00" },
  { id: "t5", actor: { kind: "ai", name: "PR レビュー" }, action: "参考所見を2件記録", at: "2026-11-27T09:39:30+09:00" },
  { id: "t6", actor: { kind: "human", name: "鈴木 彩" }, action: "例外を申請", target: "EXC-0008", at: "2026-11-27T09:50:00+09:00" },
];

export type PullRow = {
  number: number;
  title: string;
  author: { kind: "human" | "ai"; name: string };
  run_id?: string;
  review: "approved" | "pending" | "changes" | "none";
  requirement_ids: string[];
  updated_at: string;
  draft?: boolean;
};

export const pulls: PullRow[] = [
  { number: 143, title: "取引先 CSV 取込（下書き）", author: { kind: "ai", name: "coding-agent" }, run_id: "run-5830", review: "none", requirement_ids: ["REQ-0007"], updated_at: "2026-11-27T10:02:00+09:00", draft: true },
  { number: 142, title: "操作ログを追記専用ストレージへ書き込む", author: { kind: "human", name: "鈴木 彩" }, run_id: "run-5821", review: "approved", requirement_ids: ["REQ-0006"], updated_at: "2026-11-27T09:37:00+09:00" },
  { number: 141, title: "発注一覧の検索条件に状態を追加", author: { kind: "ai", name: "coding-agent" }, run_id: "run-5820", review: "pending", requirement_ids: ["REQ-0004"], updated_at: "2026-11-27T08:15:00+09:00" },
  { number: 140, title: "基幹連携バッチの再送処理", author: { kind: "human", name: "渡辺 翔" }, run_id: "run-5815", review: "approved", requirement_ids: ["REQ-0003"], updated_at: "2026-11-26T18:20:00+09:00" },
  { number: 139, title: "PDF 帳票のフォントを差し替え", author: { kind: "human", name: "鈴木 彩" }, run_id: "run-5810", review: "approved", requirement_ids: ["REQ-0008"], updated_at: "2026-11-26T11:02:00+09:00" },
  { number: 138, title: "README の誤記修正", author: { kind: "human", name: "伊藤 誠" }, run_id: "run-5808", review: "changes", requirement_ids: [], updated_at: "2026-11-25T15:40:00+09:00" },
];

/** 例外の承認履歴（E-03） */
export const exceptionTimeline: TimelineItem[] = [
  { id: "e1", actor: { kind: "ci", name: "Gate B" }, action: "ブロックと判定", target: "run-5821", detail: "TRC-002: REQ-0006 にテストへのリンクがありません", at: "2026-11-27T09:39:00+09:00" },
  { id: "e2", actor: { kind: "human", name: "鈴木 彩" }, action: "例外を申請", target: "EXC-0008", detail: "期限 2026-12-11", at: "2026-11-27T09:50:00+09:00" },
  { id: "e3", actor: { kind: "system", name: "通知" }, action: "承認者に依頼を送信", target: "佐藤 美咲", at: "2026-11-27T09:50:10+09:00" },
];
