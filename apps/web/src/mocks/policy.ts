// ポリシーと Control Pack（C-01〜C-05）の架空データ
import type { GateLetter } from "../lib/types";
import type { EnforcementLevel } from "../lib/vocab";

export type ControlPack = { slug: string; name: string; version: string; profile: string; published_at: string; projects: number; latest?: string };
export const packs: ControlPack[] = [
  { slug: "basic", name: "Basic Control Pack", version: "1.3.0", profile: "ソフトウェア Basic", published_at: "2026-10-15", projects: 2, latest: "1.3.1" },
  { slug: "basic-1-2", name: "Basic Control Pack", version: "1.2.1", profile: "ソフトウェア Basic", published_at: "2026-07-01", projects: 1, latest: "1.3.1" },
  { slug: "basic-1-1", name: "Basic Control Pack", version: "1.1.0", profile: "ソフトウェア Basic", published_at: "2026-03-01", projects: 1, latest: "1.3.1" },
];
export const packBySlug = (slug: string) => packs.find((p) => p.slug === slug) ?? packs[0];

export type AutoRule = { id: string; control_id: string; gate: GateLetter; level: EnforcementLevel; description: string };
export const rules: AutoRule[] = [
  { id: "STR-001", control_id: "CTL-SI-001", gate: "A", level: "hard", description: "必須メタデータ（profile、要求ID、版）がそろっている" },
  { id: "STR-002", control_id: "CTL-SI-001", gate: "A", level: "soft", description: "要求に一意の ID がある" },
  { id: "STR-004", control_id: "CTL-SI-001", gate: "A", level: "soft", description: "承認済みの要求に受入基準が1件以上ある" },
  { id: "STR-010", control_id: "CTL-PM-001", gate: "A", level: "warnOnly", description: "SOW の版とハッシュが記録されている" },
  { id: "TRC-001", control_id: "CTL-SI-003", gate: "B", level: "soft", description: "承認済みの要求に設計へのリンクがある" },
  { id: "TRC-002", control_id: "CTL-SI-005", gate: "B", level: "soft", description: "承認済みの要求にテストへのリンクがある" },
  { id: "QLT-001", control_id: "CTL-SI-004", gate: "B", level: "soft", description: "lint とビルドが成功している" },
  { id: "QLT-004", control_id: "CTL-SI-004", gate: "B", level: "soft", description: "重大度が高い既知の脆弱性がない" },
  { id: "APR-001", control_id: "CTL-SI-004", gate: "C", level: "hard", description: "作成者以外の人間による承認がある（AIエージェントの PR を含む）" },
  { id: "APR-002", control_id: "CTL-SI-002", gate: "C", level: "hard", description: "要求の顧客承認が記録されている" },
  { id: "REL-005", control_id: "CTL-PM-006", gate: "C", level: "hard", description: "リリースに顧客の受入記録がある" },
  { id: "EVD-001", control_id: "CTL-SI-007", gate: "D", level: "hard", description: "Evidence Manifest に署名されている" },
  { id: "EVD-002", control_id: "CTL-SI-007", gate: "D", level: "hard", description: "Manifest が WORM 保管先に保存されている" },
];

export const evidenceTypes: { name: string; description: string; collected_by: string; controls: string[] }[] = [
  { name: "SOW", description: "作業範囲の文書と版、ハッシュ", collected_by: "人間（アップロード）", controls: ["CTL-PM-001"] },
  { name: "承認記録", description: "承認者、ロール、時刻、対象の版", collected_by: "システム", controls: ["CTL-PM-002", "CTL-SI-002", "CTL-PM-004"] },
  { name: "トレーサビリティ記録", description: "要求から設計・コード・テストへのリンクのスナップショット", collected_by: "システム", controls: ["CTL-SI-005"] },
  { name: "CI ログ", description: "ゲートの判定結果と入力のハッシュ", collected_by: "CI", controls: ["CTL-SI-004"] },
  { name: "テスト報告", description: "テストの実行結果", collected_by: "CI", controls: ["CTL-SI-006"] },
  { name: "受入記録", description: "顧客による受入の判断", collected_by: "人間（顧客）", controls: ["CTL-PM-006"] },
  { name: "Evidence Manifest", description: "リリースの証跡一式の署名付き目録", collected_by: "システム", controls: ["CTL-SI-007"] },
];

export type Tailoring = { control_id: string; kind: "none" | "notApplicable" | "alternative" | "level"; detail: string; reason: string; status: "draft" | "pending" | "approved" | "returned"; requester?: string; approver?: string };
export const tailorings: Tailoring[] = [
  { control_id: "CTL-SI-007", kind: "alternative", detail: "Sigstore の代わりに社内 KMS で署名", reason: "顧客の要件で鍵を国内で管理するため", status: "approved", requester: "u-yamamoto", approver: "u-sato" },
  { control_id: "CTL-PM-003", kind: "level", detail: "強制レベルを「警告のみ」に変更", reason: "進捗記録は週次の定例で別途作成しているため", status: "pending", requester: "u-yamamoto", approver: "u-sato" },
  { control_id: "CTL-SI-008", kind: "notApplicable", detail: "適用しない", reason: "開発環境は顧客の標準環境を使うため", status: "returned", requester: "u-yamamoto", approver: "u-sato" },
  { control_id: "CTL-PM-001", kind: "none", detail: "", reason: "", status: "draft" },
  { control_id: "CTL-SI-005", kind: "none", detail: "", reason: "", status: "draft" },
];

export type PackDiffEntry = { kind: "added" | "changed" | "removed"; id: string; target: "統制項目" | "自動ルール"; before?: string; after?: string };
export const packDiff: PackDiffEntry[] = [
  { kind: "added", id: "REL-006", target: "自動ルール", after: "リリースノートに含まれる変更要求がすべて承認済み" },
  { kind: "changed", id: "TRC-002", target: "自動ルール", before: "承認済みの要求にテストへのリンクがある", after: "承認済みの要求に成功したテストへのリンクがある" },
  { kind: "changed", id: "CTL-SI-006", target: "統制項目", before: "テスト結果が記録されている", after: "テスト結果と検証結果が記録され、実施者と承認者が異なる" },
  { kind: "removed", id: "STR-009", target: "自動ルール", before: "PR タイトルに要求 ID を含める" },
];

export const migrationImpact: { project: string; newly_missing: number; changed_rules: number; status: "ready" | "attention" | "blocked" }[] = [
  { project: "受発注システム刷新", newly_missing: 2, changed_rules: 3, status: "attention" },
  { project: "会員アプリ API 開発", newly_missing: 0, changed_rules: 3, status: "ready" },
  { project: "在庫管理ダッシュボード", newly_missing: 5, changed_rules: 3, status: "blocked" },
];
