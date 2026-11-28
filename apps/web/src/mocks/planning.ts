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

// ---- 2026-11-28 追加: 経営層向けの計画と管理（正本から同期した値） ----
import type { SourceRef } from "../lib/types";

/** 計画・作業項目の正本（GitHub Projects） */
export const PLAN_SOURCE: SourceRef = { provider: "githubProjects", label: "Project #3 受託案件ロードマップ", url: "https://github.example/orgs/sample-soft/projects/3", synced_at: "2026-11-27T10:15:00+09:00", status: "healthy" };
/** 会議の正本（共有カレンダー） */
export const CAL_SOURCE: SourceRef = { provider: "googleCalendar", label: "共有カレンダー「顧客レビュー」", synced_at: "2026-11-27T10:20:00+09:00", status: "healthy" };
/** 契約文書・設計文書の正本（文書リポジトリ） */
export const DOC_SOURCE: SourceRef = { provider: "github", label: "sample-soft/order-docs", url: "https://github.example/sample-soft/order-docs", synced_at: "2026-11-27T10:28:00+09:00", status: "healthy" };
/** PR・CI の正本 */
export const SCM_SOURCE: SourceRef = { provider: "github", label: "sample-soft/order-api ほか", synced_at: "2026-11-27T10:28:00+09:00", status: "healthy" };

/** SOW の構造化した内容（PM-01）。原本の箇所を出典として持つ */
export type SowScope = { section: string; kind: "scope" | "assumption" | "constraint" | "deliverable" | "deadline"; text: string; changed?: "added" | "changed" };
export const sowScopes: Record<string, SowScope[]> = {
  "SOW-3": [
    { section: "3.1", kind: "scope", text: "取引先ごとの発注書作成" },
    { section: "3.2", kind: "scope", text: "発注書の2段階承認" },
    { section: "3.3", kind: "scope", text: "取引先ごとの発注上限額の設定", changed: "added" },
    { section: "3.4", kind: "scope", text: "基幹システムへの夜間連携" },
    { section: "3.6", kind: "scope", text: "発注書の PDF 出力（社印を含む）", changed: "changed" },
    { section: "4.1", kind: "assumption", text: "顧客 IdP の検証環境が提供されること" },
    { section: "4.2", kind: "constraint", text: "操作ログは国内リージョンに7年間保存する" },
    { section: "6", kind: "deliverable", text: "ソースコード一式、設計書、テスト報告書、操作マニュアル", changed: "changed" },
    { section: "7", kind: "deadline", text: "v1.4.0 納入 2026-12-10" },
    { section: "7", kind: "deadline", text: "最終納入 2027-02-26", changed: "changed" },
  ],
};
export const sowChangeHistory = [
  { id: "SOW-3", at: "2026-11-12T10:00:00+09:00", by: "u-sato", reason: "CR-0002・CR-0003 の反映と、最終納入日の延長（顧客と合意）", agreed_by: "u-nakamura", source_location: "contracts/order-renewal/SOW_v3.pdf" },
  { id: "SOW-2", at: "2026-07-01T10:00:00+09:00", by: "u-sato", reason: "要求定義の完了に伴う範囲の確定", agreed_by: "u-nakamura", source_location: "contracts/order-renewal/SOW_v2.pdf" },
  { id: "SOW-1", at: "2026-05-20T10:00:00+09:00", by: "u-sato", reason: "契約締結時の初版", agreed_by: "u-nakamura", source_location: "contracts/order-renewal/SOW_v1.pdf" },
];

/** 計画のベースラインと改訂（PM-02）。上書きせず版として残す */
export type PlanRevision = { id: string; label: string; kind: "baseline" | "revision" | "pending"; at: string; end_date: string; reason: string; requested_by: string; approved_by?: string; approved_at?: string; changes: string[] };
export const planRevisions: PlanRevision[] = [
  { id: "PLAN-v4", label: "改訂案 v4", kind: "pending", at: "2026-11-26T18:00:00+09:00", end_date: "2027-03-12", reason: "結合テスト環境の準備遅延（RSK-012）を受け、最終受入を 2週間後ろ倒しする案", requested_by: "u-sato", changes: ["MS-104 v1.4.0 納入 12/10 → 12/17", "MS-106 最終受入 2027-02-26 → 2027-03-12"] },
  { id: "PLAN-v3", label: "承認済み改訂 v3", kind: "revision", at: "2026-11-13T10:00:00+09:00", end_date: "2027-02-26", reason: "SOW v3（操作マニュアル追加・最終納入日の延長）の反映", requested_by: "u-sato", approved_by: "u-nakamura", approved_at: "2026-11-20T15:00:00+09:00", changes: ["納入物に操作マニュアルを追加", "最終納入 2027-01-29 → 2027-02-26"] },
  { id: "PLAN-v2", label: "承認済み改訂 v2", kind: "revision", at: "2026-09-20T10:00:00+09:00", end_date: "2027-01-29", reason: "CR-0002 による基本設計の延長", requested_by: "u-sato", approved_by: "u-nakamura", approved_at: "2026-09-25T11:00:00+09:00", changes: ["MS-102 基本設計 9/30 → 10/9"] },
  { id: "PLAN-v1", label: "当初ベースライン v1", kind: "baseline", at: "2026-06-10T10:00:00+09:00", end_date: "2027-01-29", reason: "契約時の計画", requested_by: "u-sato", approved_by: "u-nakamura", approved_at: "2026-06-12T10:00:00+09:00", changes: ["初版"] },
];

/** 顧客との合意の記録（PM-02, PM-07） */
export const customerAgreements = [
  { id: "AGR-007", at: "2026-11-20T15:00:00+09:00", decider: "u-nakamura", content: "計画 v3（最終納入 2027-02-26）に合意", link: "PLAN-v3", source: "MTG-12" },
  { id: "AGR-006", at: "2026-11-06T16:00:00+09:00", decider: "u-nakamura", content: "CSV 一括登録を変更要求 CR-0003 として扱う", link: "CR-0003", source: "MTG-11" },
  { id: "AGR-005", at: "2026-09-25T11:00:00+09:00", decider: "u-nakamura", content: "基本設計の完了を 10/9 に延長", link: "PLAN-v2", source: "メール（文書リポジトリに保存）" },
];

/** 計画値と実績の集計（PM-04）。出典ごとに数える */
export const planVsActual = [
  { key: "issues", label: "計画した作業項目", planned: 64, done: 41, expected: 45, source: "githubProjects" as const, note: "Project #3 の項目（状態=完了）" },
  { key: "prs", label: "マージ済み PR", planned: 38, done: 29, expected: 30, source: "github" as const, note: "計画項目に紐づく PR" },
  { key: "tests", label: "成功したテストケース", planned: 180, done: 132, expected: 140, source: "githubActions" as const, note: "最新の main で成功したケース" },
  { key: "deliverables", label: "提出済みの納入物", planned: 9, done: 4, expected: 5, source: "github" as const, note: "J-11 の納入物" },
];

/** 体制の懸念（PM-03）。役割別・期間別の集計で、個人の稼働は表示しない */
export type StaffingConcern = { id: string; kind: "unassigned" | "overload" | "handover" | "leave"; role: string; period: string; count: number; detail: string; source: SourceRef; action_owner: string };
export const staffingConcerns: StaffingConcern[] = [
  { id: "STF-1", kind: "unassigned", role: "QA", period: "12月第1〜2週", count: 6, detail: "結合テストの作業項目 6件に担当がいません", source: PLAN_SOURCE, action_owner: "u-sato" },
  { id: "STF-2", kind: "overload", role: "設計者", period: "12月", count: 1, detail: "設計レビューの予定が計画容量の 140% です（2案件が同時期）", source: PLAN_SOURCE, action_owner: "u-ishii" },
  { id: "STF-3", kind: "leave", role: "開発者", period: "12/23〜1/5", count: 2, detail: "共有カレンダーの休暇予定と、v1.4.0 後の修正期間が重なっています", source: CAL_SOURCE, action_owner: "u-sato" },
  { id: "STF-4", kind: "handover", role: "リリース管理者", period: "1月", count: 1, detail: "担当交代の予定。引継ぎ記録がまだありません", source: PLAN_SOURCE, action_owner: "u-sato" },
];

/** リスクの追加情報（PM-05） */
export type RiskExtra = { residual: string; basis: string; completion?: { by: string; at: string; note: string }; gates?: string[]; releases?: string[]; decision?: string; source: SourceRef };
export const riskExtras: Record<string, RiskExtra> = {
  "RSK-011": { residual: "中（仕様確定が 12/5 を過ぎると v1.4.0 に影響）", basis: "MTG-12 で顧客と期限を合意。現行仕様で実装を継続", gates: ["run-5821"], releases: ["rel-140"], decision: "DEC-0033", source: PLAN_SOURCE },
  "RSK-012": { residual: "高（予測で v1.4.0 が 7 日遅延）", basis: "環境構築の外部委託先の納期が 12/1", releases: ["rel-140"], decision: "DEC-0033", source: PLAN_SOURCE },
  "RSK-009": { residual: "低（WAF で緩和済み）", basis: "外部公開経路がないことを確認（伊藤 誠）", gates: ["run-5821"], decision: "DEC-0029", source: PLAN_SOURCE },
  "COR-003": { residual: "なし", basis: "鍵のローテーション手順を修正", completion: { by: "u-yamamoto", at: "2026-08-20T17:00:00+09:00", note: "再署名と検証の成功を確認" }, source: PLAN_SOURCE },
};

/** 変更要求の影響の内訳（PM-06） */
export const changeImpacts: Record<string, { requirements: number; designs: number; tests: number; cost_yen: number; schedule_days: number; decision?: string; result?: string }> = {
  "CR-0004": { requirements: 1, designs: 1, tests: 2, cost_yen: 1_200_000, schedule_days: 0, decision: "DEC-0031" },
  "CR-0003": { requirements: 2, designs: 1, tests: 3, cost_yen: 800_000, schedule_days: 0, result: "REQ-0007 として要求に追加（v1.4.0 で実装中）" },
  "CR-0002": { requirements: 1, designs: 1, tests: 1, cost_yen: 300_000, schedule_days: 9, result: "REQ-0008 v2 に反映、基本設計を 10/9 に延長（PLAN-v2）" },
  "CR-0005": { requirements: 1, designs: 0, tests: 1, cost_yen: 0, schedule_days: 0 },
  "CR-0001": { requirements: 1, designs: 0, tests: 0, cost_yen: -200_000, schedule_days: 0, result: "要求を廃止" },
  "CR-0006": { requirements: 0, designs: 0, tests: 0, cost_yen: 0, schedule_days: 0, result: "却下（契約範囲外）" },
};

/** 会議とカレンダーの対応、決定者（PM-07） */
export const meetingSync: Record<string, { event_id: string; start: string; end: string; organizer: string; decider: string; status: "confirmed" | "moved" | "cancelled" }> = {
  "MTG-12": { event_id: "evt-2026-11-20-a", start: "2026-11-20T14:00:00+09:00", end: "2026-11-20T15:00:00+09:00", organizer: "u-sato", decider: "u-nakamura", status: "confirmed" },
  "MTG-11": { event_id: "evt-2026-11-06-a", start: "2026-11-06T14:00:00+09:00", end: "2026-11-06T15:00:00+09:00", organizer: "u-sato", decider: "u-nakamura", status: "confirmed" },
  "MTG-10": { event_id: "evt-2026-10-23-b", start: "2026-10-23T10:00:00+09:00", end: "2026-10-23T11:30:00+09:00", organizer: "u-tanaka", decider: "u-tanaka", status: "moved" },
};

/** スケジュール変更の履歴（4.2.1-7）。種類を区別する */
export type ScheduleChange = { id: string; at: string; kind: "milestoneMoved" | "issueDueChanged" | "meetingMoved" | "meetingCancelled" | "baselineRevised" | "forecastUpdated"; target: string; from: string; to: string; reason: string; by: string; approved_by?: string; source: SourceRef };
export const scheduleChanges: ScheduleChange[] = [
  { id: "SCH-031", at: "2026-11-26T18:05:00+09:00", kind: "forecastUpdated", target: "MS-104 v1.4.0 納入", from: "2026-12-10", to: "2026-12-17", reason: "結合テスト環境の準備が 12/1 にずれたため", by: "u-sato", source: PLAN_SOURCE },
  { id: "SCH-030", at: "2026-11-26T17:40:00+09:00", kind: "issueDueChanged", target: "#212 結合テスト環境の構築", from: "2026-11-24", to: "2026-12-01", reason: "外部委託先の納期変更", by: "u-ito", source: PLAN_SOURCE },
  { id: "SCH-029", at: "2026-11-25T09:10:00+09:00", kind: "meetingMoved", target: "架空商事 進捗レビュー", from: "2026-11-27 14:00", to: "2026-12-02 14:00", reason: "顧客側の都合（カレンダーで移動）", by: "u-sato", source: CAL_SOURCE },
  { id: "SCH-024", at: "2026-11-13T10:00:00+09:00", kind: "baselineRevised", target: "最終受入", from: "2027-01-29", to: "2027-02-26", reason: "SOW v3 の反映（PLAN-v3）", by: "u-sato", approved_by: "u-nakamura", source: PLAN_SOURCE },
  { id: "SCH-017", at: "2026-10-05T12:00:00+09:00", kind: "meetingCancelled", target: "設計レビュー（第2回）", from: "2026-10-09 10:00", to: "—", reason: "第1回で完了したため取消（記録は残す）", by: "u-tanaka", source: CAL_SOURCE },
  { id: "SCH-012", at: "2026-09-20T10:00:00+09:00", kind: "milestoneMoved", target: "MS-102 基本設計の完了", from: "2026-09-30", to: "2026-10-09", reason: "CR-0002 による要求追加（PLAN-v2）", by: "u-sato", approved_by: "u-nakamura", source: PLAN_SOURCE },
];

/** 基準日ごとの予測（過去時点の計画差異の再現） */
export const forecastSnapshots: Record<string, Record<string, string>> = {
  "2026-11-27": { "MS-104": "2026-12-17", "MS-105": "2026-12-01", "MS-106": "2027-03-12" },
  "2026-11-20": { "MS-104": "2026-12-10", "MS-105": "2026-11-24", "MS-106": "2027-02-26" },
  "2026-10-31": { "MS-104": "2026-12-10", "MS-105": "2026-11-24", "MS-106": "2027-02-26" },
};

/** 納入物（PM-08） */
export type DeliverableStatus = "notSubmitted" | "submitted" | "received" | "accepted" | "returned" | "resubmitted";
export type Deliverable = { id: string; title: string; milestone: string; planned: string; actual?: string; recipient: string; version?: string; sha256?: string; status: DeliverableStatus; history: { at: string; event: string; by: string; note?: string }[]; source: SourceRef };
export const deliverables: Deliverable[] = [
  { id: "DLV-01", title: "要求仕様書", milestone: "MS-101", planned: "2026-08-29", actual: "2026-09-05", recipient: "架空商事 情報システム部", version: "v2.0", sha256: fakeSha("dlv1"), status: "accepted", history: [{ at: "2026-08-29T17:00:00+09:00", event: "提出", by: "u-takahashi" }, { at: "2026-09-02T11:00:00+09:00", event: "差戻し", by: "u-nakamura", note: "非機能要求の測定条件が不足" }, { at: "2026-09-04T17:00:00+09:00", event: "再提出", by: "u-takahashi" }, { at: "2026-09-05T15:00:00+09:00", event: "受入", by: "u-nakamura" }], source: DOC_SOURCE },
  { id: "DLV-02", title: "基本設計書", milestone: "MS-102", planned: "2026-09-30", actual: "2026-10-08", recipient: "架空商事 情報システム部", version: "v1.1", sha256: fakeSha("dlv2"), status: "accepted", history: [{ at: "2026-10-08T17:00:00+09:00", event: "提出", by: "u-tanaka" }, { at: "2026-10-09T10:00:00+09:00", event: "受入", by: "u-nakamura" }], source: DOC_SOURCE },
  { id: "DLV-03", title: "v1.3.0 ソースコード一式", milestone: "MS-103", planned: "2026-11-13", actual: "2026-11-13", recipient: "架空商事 情報システム部", version: "v1.3.0", sha256: fakeSha("dlv3"), status: "accepted", history: [{ at: "2026-11-13T17:00:00+09:00", event: "提出", by: "u-watanabe" }, { at: "2026-11-20T15:00:00+09:00", event: "受入", by: "u-nakamura" }], source: SCM_SOURCE },
  { id: "DLV-04", title: "v1.3.0 テスト報告書", milestone: "MS-103", planned: "2026-11-13", actual: "2026-11-14", recipient: "架空商事 品質保証課", version: "v1.0", sha256: fakeSha("dlv4"), status: "received", history: [{ at: "2026-11-14T10:00:00+09:00", event: "提出", by: "u-ito" }, { at: "2026-11-14T13:00:00+09:00", event: "受領", by: "u-nakamura" }], source: DOC_SOURCE },
  { id: "DLV-05", title: "v1.4.0 ソースコード一式", milestone: "MS-104", planned: "2026-12-10", recipient: "架空商事 情報システム部", status: "notSubmitted", history: [], source: SCM_SOURCE },
  { id: "DLV-06", title: "操作マニュアル（初版）", milestone: "MS-104", planned: "2026-12-10", actual: "2026-11-25", recipient: "架空商事 業務部", version: "v0.9", sha256: fakeSha("dlv6"), status: "returned", history: [{ at: "2026-11-25T17:00:00+09:00", event: "提出", by: "u-takahashi" }, { at: "2026-11-26T16:00:00+09:00", event: "差戻し", by: "u-nakamura", note: "画面写真が旧デザインのまま" }], source: DOC_SOURCE },
  { id: "DLV-07", title: "最終納入一式", milestone: "MS-106", planned: "2027-02-26", recipient: "架空商事 情報システム部", status: "notSubmitted", history: [], source: DOC_SOURCE },
];

/** 終了・引継ぎ（PM-10） */
export const closureCriteria = [
  { id: "CLS-1", title: "最終納入物の顧客受入", state: "pending" as const, detail: "DLV-07 は未提出（予定 2027-02-26）" },
  { id: "CLS-2", title: "未解決のリスク・是正処置がない", state: "ng" as const, detail: "未完了 5件" },
  { id: "CLS-3", title: "有効な例外がない", state: "ng" as const, detail: "有効な例外 2件（EXC-0006, EXC-0008）" },
  { id: "CLS-4", title: "保守への引継ぎ記録", state: "pending" as const, detail: "保守契約の担当者が未定" },
  { id: "CLS-5", title: "教訓の記録", state: "pending" as const, detail: "振り返り会は 2027-03 に予定" },
  { id: "CLS-6", title: "最終 Evidence Manifest の作成と保管", state: "pending" as const, detail: "最終リリース後に作成" },
];
export const handoverItems = [
  { id: "HND-1", title: "運用手順書（夜間連携の再実行）", owner: "u-watanabe", to: "保守チーム（架空商事 委託先）", state: "draft" },
  { id: "HND-2", title: "既知の問題一覧", owner: "u-ito", to: "保守チーム", state: "notStarted" },
  { id: "HND-3", title: "アカウント・鍵の引継ぎ", owner: "u-yamamoto", to: "架空商事 情報システム部", state: "notStarted" },
];
export const lessons = [
  { id: "LSN-1", title: "顧客側の基幹更改と重なる時期は、仕様確定の期限を契約時に決める", category: "計画", from: "RSK-011", reuse: true },
  { id: "LSN-2", title: "結合テスト環境は外部委託の納期を計画のクリティカルパスに入れる", category: "スケジュール", from: "RSK-012", reuse: true },
  { id: "LSN-3", title: "操作マニュアルの画面写真は最終デザイン確定後に撮る", category: "納入物", from: "DLV-06", reuse: false },
];

/** 取り込んだ文書（SI-13） */
export type ImportedDoc = { id: string; name: string; kind: "markdown" | "structured" | "file"; format: string; check: "ok" | "warn" | "fail"; check_note?: string; version: string; sha256: string; data_class: DataClass; access: string; source: SourceRef; imported_at: string; imported_by: string; linked?: string[] };
export const importedDocs: ImportedDoc[] = [
  { id: "DOC-031", name: "docs/requirements/REQ-0012.md", kind: "markdown", format: "Markdown", check: "ok", version: "コミット 4f2a9c1", sha256: fakeSha("doc31"), data_class: "confidential", access: "プロジェクトの閲覧者", source: DOC_SOURCE, imported_at: "2026-11-27T10:28:00+09:00", imported_by: "システム（同期）", linked: ["REQ-0012"] },
  { id: "DOC-030", name: "trace/edges.yaml", kind: "structured", format: "YAML（スキーマ trace-edges@1）", check: "warn", check_note: "REQ-0006 からテストへの辺がありません（ゲート B と同じ指摘）", version: "コミット 4f2a9c1", sha256: fakeSha("doc30"), data_class: "internal", access: "プロジェクトの閲覧者", source: DOC_SOURCE, imported_at: "2026-11-27T10:28:00+09:00", imported_by: "システム（同期）" },
  { id: "DOC-029", name: "SOW_受発注刷新_v3.pdf", kind: "file", format: "PDF", check: "ok", version: "v3", sha256: fakeSha("sow3"), data_class: "confidential", access: "経営層・PM のみ", source: DOC_SOURCE, imported_at: "2026-11-12T10:00:00+09:00", imported_by: "佐藤 美咲（外部ID: msato-dev）", linked: ["SOW-3"] },
  { id: "DOC-028", name: "基本設計書_v1.1.docx", kind: "file", format: "Word 文書", check: "ok", version: "v1.1", sha256: fakeSha("dlv2"), data_class: "confidential", access: "プロジェクトの閲覧者", source: DOC_SOURCE, imported_at: "2026-10-08T17:00:00+09:00", imported_by: "田中 陽介（外部ID: ytanaka）", linked: ["DLV-02"] },
  { id: "DOC-027", name: "テスト結果_v1.3.0.xlsx", kind: "structured", format: "表計算（列: ケースID, 結果, 実施者）", check: "fail", check_note: "列「実施日」がありません。取込みは保留しています", version: "v1.0", sha256: fakeSha("doc27"), data_class: "internal", access: "プロジェクトの閲覧者", source: DOC_SOURCE, imported_at: "2026-11-14T10:00:00+09:00", imported_by: "伊藤 誠（外部ID: mito-qa）", linked: ["DLV-04"] },
  { id: "DOC-026", name: "顧客との議事メモ_1106.md", kind: "markdown", format: "Markdown", check: "ok", version: "コミット 9b1d3e0", sha256: fakeSha("doc26"), data_class: "confidential", access: "経営層・PM のみ", source: DOC_SOURCE, imported_at: "2026-11-06T18:00:00+09:00", imported_by: "システム（同期）", linked: ["MTG-11"] },
];
