// 計画と管理（J-01〜J-09）の架空サンプルデータ。
import type { AiFinding, Approver } from "../lib/types";
import type { DataClass } from "../lib/vocab";
import { fakeSha } from "./core";

export type SowVersion = {
  id: string;
  version: number;
  file_name: string;
  sha256: string;
  uploaded_by: string;
  uploaded_at: string;
  data_class: DataClass;
  status: "current" | "superseded" | "extracting";
  size: string;
  text: string;
};

export const sowVersions: SowVersion[] = [
  {
    id: "SOW-3", version: 3, file_name: "SOW_受発注刷新_v3.pdf", sha256: fakeSha("sow3"), uploaded_by: "u-sato", uploaded_at: "2026-11-12T10:00:00+09:00", data_class: "confidential", status: "current", size: "1.4 MB",
    text: "# 作業範囲記述書 v3\n\n## 3. 機能範囲\n- 3.1 取引先ごとの発注書作成\n- 3.2 発注書の2段階承認\n- 3.3 取引先ごとの発注上限額の設定\n- 3.4 基幹システムへの夜間連携\n- 3.5 発注一覧の検索\n- 3.6 発注書の PDF 出力（社印を含む）\n\n## 4. 非機能\n- 4.1 顧客 IdP による SSO\n- 5.1 主要操作は2秒以内に応答\n- 5.3 操作ログを7年間保存\n\n## 6. 納入物\n- ソースコード一式、設計書、テスト報告書、操作マニュアル\n\n## 7. 期限\n- v1.4.0 納入: 2026-12-10\n- 最終納入: 2027-02-26",
  },
  {
    id: "SOW-2", version: 2, file_name: "SOW_受発注刷新_v2.pdf", sha256: fakeSha("sow2"), uploaded_by: "u-sato", uploaded_at: "2026-07-01T10:00:00+09:00", data_class: "confidential", status: "superseded", size: "1.3 MB",
    text: "# 作業範囲記述書 v2\n\n## 3. 機能範囲\n- 3.1 取引先ごとの発注書作成\n- 3.2 発注書の2段階承認\n- 3.4 基幹システムへの夜間連携\n- 3.5 発注一覧の検索\n- 3.6 発注書の PDF 出力\n\n## 4. 非機能\n- 4.1 顧客 IdP による SSO\n- 5.1 主要操作は2秒以内に応答\n- 5.3 操作ログを7年間保存\n\n## 6. 納入物\n- ソースコード一式、設計書、テスト報告書\n\n## 7. 期限\n- 最終納入: 2027-01-29",
  },
  {
    id: "SOW-1", version: 1, file_name: "SOW_受発注刷新_v1.pdf", sha256: fakeSha("sow1"), uploaded_by: "u-sato", uploaded_at: "2026-05-20T10:00:00+09:00", data_class: "confidential", status: "superseded", size: "1.1 MB",
    text: "# 作業範囲記述書 v1\n\n## 3. 機能範囲\n- 3.1 発注書作成\n- 3.7 FAX 送信",
  },
];
export const sowById = (id: string) => sowVersions.find((s) => s.id === id) ?? sowVersions[0];

const ex = (id: string, kind: AiFinding["kind"], excerpt: string, highlight: string, explanation: string, suggestion: string, confidence: number): AiFinding => ({
  id, kind, severity: "medium", confidence, target_id: "SOW-3", excerpt, highlight, explanation, suggestion,
  model: "model-family-a / 2026-10", template_version: "sow-extract@0.8.0", status: "unconfirmed", created_at: "2026-11-12T10:05:00+09:00",
});

export const sowExtractions: Record<"requirements" | "deliverables" | "deadlines" | "constraints", AiFinding[]> = {
  requirements: [
    ex("SX-01", "extraction", "3.3 取引先ごとの発注上限額の設定", "発注上限額", "要求候補: 取引先ごとに発注上限額を設定できる（既存の REQ-0012 と重複の可能性）", "取引先ごとに1回あたりの発注上限額を設定し、超える場合は警告する。", 0.88),
    ex("SX-02", "extraction", "3.6 発注書の PDF 出力（社印を含む）", "社印を含む", "要求候補: 発注書 PDF に社印画像を含める（REQ-0008 の変更に相当）", "発注書 PDF に登録済みの社印画像を配置できる。", 0.81),
    ex("SX-03", "extraction", "6. 納入物 … 操作マニュアル", "操作マニュアル", "要求候補: 操作マニュアルを納入物に追加（v2 にはない項目）", "利用者向け操作マニュアルを PDF で納入する。", 0.67),
  ],
  deliverables: [
    ex("SX-11", "extraction", "ソースコード一式、設計書、テスト報告書、操作マニュアル", "操作マニュアル", "納入物候補: 4件（ソースコード、設計書、テスト報告書、操作マニュアル）", "納入物一覧に「操作マニュアル」を追加する。", 0.9),
  ],
  deadlines: [
    ex("SX-21", "extraction", "v1.4.0 納入: 2026-12-10", "2026-12-10", "期限候補: v1.4.0 の納入期限 2026-12-10", "リリース v1.4.0 の予定日を 2026-12-10 に設定する。", 0.95),
    ex("SX-22", "extraction", "最終納入: 2027-02-26", "2027-02-26", "期限候補: 最終納入 2027-02-26（v2 から約1か月延長）", "プロジェクト計画の終了日を 2027-02-26 に更新する。", 0.93),
  ],
  constraints: [
    ex("SX-31", "extraction", "4.1 顧客 IdP による SSO", "顧客 IdP", "前提・制約候補: 認証は顧客の IdP に依存する", "前提条件に「顧客 IdP の検証環境が提供されること」を追加する。", 0.62),
  ],
};

export type PlanSection = { key: string; title: string; required: boolean; body: string; missing?: string };
export const planSections: PlanSection[] = [
  { key: "overview", title: "概要", required: true, body: "架空商事株式会社の受発注業務を刷新する。SOW v3 を作業範囲とし、2027-02-26 に最終納入する。" },
  { key: "deliverables", title: "納入物", required: true, body: "- ソースコード一式\n- 設計書（アーキテクチャ、詳細設計、ADR）\n- テスト報告書\n- 操作マニュアル（SOW v3 で追加）" },
  { key: "wbs", title: "作業分解", required: true, body: "1. 要求の確定\n2. 設計\n3. 実装（発注、承認、連携、帳票）\n4. 結合テスト\n5. 受入支援" },
  { key: "schedule", title: "スケジュール", required: true, body: "| マイルストーン | 予定日 |\n| --- | --- |\n| 要求確定 | 2026-07-31 |\n| v1.3.0 | 2026-11-05 |\n| v1.4.0 | 2026-12-10 |\n| 最終納入 | 2027-02-26 |" },
  { key: "roles", title: "役割と体制", required: true, body: "- PM: 佐藤 美咲\n- アナリスト: 高橋 健\n- 設計者: 田中 陽介\n- 開発者: 鈴木 彩、渡辺 翔\n- QA: 伊藤 誠\n- 顧客窓口: 中村 拓也（架空商事）" },
  { key: "risks", title: "リスク", required: true, body: "主要なリスクはリスク台帳（RSK-011, RSK-012 ほか）で管理する。" },
  { key: "versioning", title: "版管理の方針", required: true, body: "", missing: "版管理の方針が未記入です（ブランチ戦略とタグ付けの規則を記載してください）" },
  { key: "qa", title: "品質保証の方針", required: true, body: "PR ごとに CI ゲート A〜D を実行し、リリースごとに Evidence Manifest を作成する。" },
  { key: "agreements", title: "顧客との合意事項", required: false, body: "", missing: "合意事項が未記入です" },
];

export const planApprovers: Approver[] = [
  { role: "PM", user_id: "u-sato", status: "approved", decided_at: "2026-11-13T10:00:00+09:00", comment: "SOW v3 を反映" },
  { role: "顧客", user_id: "u-nakamura", status: "pending" },
];

export type ProgressTask = { id: string; title: string; planStart: number; planEnd: number; actStart?: number; actEnd?: number; late?: boolean; issues: string[]; status: "done" | "inProgress" | "notStarted" };
// 値は 2026-09-01 からの週番号（0〜26）
export const progressTasks: ProgressTask[] = [
  { id: "WBS-1", title: "要求の確定", planStart: 0, planEnd: 4, actStart: 0, actEnd: 5, late: true, issues: ["#88", "#92"], status: "done" },
  { id: "WBS-2", title: "設計", planStart: 3, planEnd: 9, actStart: 4, actEnd: 10, late: true, issues: ["#95"], status: "done" },
  { id: "WBS-3.1", title: "発注・検索", planStart: 6, planEnd: 12, actStart: 7, actEnd: 12, issues: ["PR #118", "PR #126"], status: "done" },
  { id: "WBS-3.2", title: "承認フロー", planStart: 8, planEnd: 14, actStart: 9, actEnd: 15, late: true, issues: ["PR #131"], status: "done" },
  { id: "WBS-3.3", title: "基幹連携", planStart: 10, planEnd: 15, actStart: 11, late: true, issues: ["PR #140", "PR #142"], status: "inProgress" },
  { id: "WBS-3.4", title: "帳票（PDF）", planStart: 11, planEnd: 15, actStart: 11, issues: ["PR #135", "PR #139"], status: "inProgress" },
  { id: "WBS-4", title: "結合テスト", planStart: 14, planEnd: 20, issues: [], status: "notStarted" },
  { id: "WBS-5", title: "受入支援", planStart: 20, planEnd: 25, issues: [], status: "notStarted" },
];
export const PROGRESS_NOW_WEEK = 12.4;

export const progressFindings: AiFinding[] = [
  { id: "AIF-301", kind: "delay", severity: "high", confidence: 0.79, target_id: "WBS-3.3", excerpt: "WBS-3.3 基幹連携: 計画終了 第15週 / PR #142 がブロック中", highlight: "ブロック中", explanation: "基幹連携の PR がゲート B でブロックされ、関連リスク RSK-011 も対応中です。計画終了が1〜2週遅れる可能性があります。", suggestion: "RSK-011 の対応期限を前倒しし、結合テスト開始日を再確認する。", model: "model-family-a / 2026-10", template_version: "delay@0.5.0", status: "unconfirmed", created_at: "2026-11-27T08:00:00+09:00" },
  { id: "AIF-302", kind: "delay", severity: "low", confidence: 0.55, target_id: "WBS-4", excerpt: "WBS-4 結合テスト: 環境準備 RSK-012", highlight: "環境準備", explanation: "結合テスト環境の準備遅延（RSK-012）が開始に影響する可能性があります。", model: "model-family-a / 2026-10", template_version: "delay@0.5.0", status: "unconfirmed", created_at: "2026-11-27T08:00:00+09:00" },
];

export type ProgressRecord = { id: string; at: string; by: string; summary: string };
export const progressRecords: ProgressRecord[] = [
  { id: "PRG-018", at: "2026-11-21T17:00:00+09:00", by: "u-sato", summary: "帳票は計画どおり。基幹連携は仕様確定待ちで1週遅れ。" },
  { id: "PRG-017", at: "2026-11-14T17:00:00+09:00", by: "u-sato", summary: "v1.3.0 受入済み。承認フローのテスト失敗を是正処置 COR-004 で管理。" },
];

export type Meeting = { id: string; date: string; title: string; participants: string[]; body: string; decisions: { text: string; links: string[] }[] };
export const meetings: Meeting[] = [
  { id: "MTG-12", date: "2026-11-20", title: "定例会（第12回）", participants: ["u-sato", "u-takahashi", "u-tanaka", "u-nakamura"], body: "## 議題\n1. v1.4.0 の進捗\n2. 基幹連携の仕様\n3. 納期遅延の表示\n\n## 内容\n- 基幹側の仕様確定は 12/5 を目標とする\n- 納期遅延の発注をダッシュボードで強調したいとの要望あり", decisions: [{ text: "納期遅延の強調表示を要求として起票する", links: ["REQ-0010"] }, { text: "基幹連携の仕様確定期限を 12/5 とする", links: ["RSK-011"] }] },
  { id: "MTG-11", date: "2026-11-06", title: "定例会（第11回）", participants: ["u-sato", "u-takahashi", "u-nakamura"], body: "## 議題\n1. v1.3.0 受入\n2. CSV 一括登録の要望", decisions: [{ text: "CSV 一括登録を変更要求として扱う", links: ["CR-0003"] }] },
  { id: "MTG-10", date: "2026-10-23", title: "設計レビュー会", participants: ["u-tanaka", "u-sato", "u-watanabe"], body: "## 議題\n1. 帳票出力の設計", decisions: [{ text: "社印画像は帳票テンプレートで管理する", links: ["DSN-0006", "CR-0002"] }] },
];
export const meetingById = (id: string) => meetings.find((m) => m.id === id) ?? meetings[0];

export type ChangeDetail = {
  id: string;
  description: string;
  reason: string;
  desired: string;
  estimate: string;
  schedule: string;
  confirmed: { id: string; title: string; kind: string }[];
  approvers: Approver[];
};
export const changeDetails: Record<string, ChangeDetail> = {
  "CR-0004": {
    id: "CR-0004",
    description: "取引先ごとの発注上限額の判定を、税抜金額ではなく税込金額で行うよう変更したい。",
    reason: "経理部門の社内規程が税込基準に改定されたため。",
    desired: "2026-12-10（v1.4.0）",
    estimate: "+3人日（判定ロジックとテストの修正）",
    schedule: "v1.4.0 の予定日への影響なし（バッファ内）",
    confirmed: [{ id: "REQ-0012", title: "発注金額の上限を取引先ごとに設定できる", kind: "要求" }],
    approvers: [
      { role: "PM", user_id: "u-sato", status: "pending" },
      { role: "顧客", user_id: "u-nakamura", status: "pending" },
    ],
  },
};
