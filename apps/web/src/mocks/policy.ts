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

/** 組織調整。基準版を上書きせず、差分として保存する（STD-05） */
export type Tailoring = {
  control_id: string;
  kind: "none" | "notApplicable" | "alternative" | "level";
  detail: string;
  reason: string;
  status: "draft" | "pending" | "approved" | "returned";
  requester?: string;
  approver?: string;
  alternative?: string;
  risk?: string;
  valid_from?: string;
  valid_until?: string;
  base_version?: string;
};
export const tailorings: Tailoring[] = [
  { control_id: "CTL-SI-007", kind: "alternative", detail: "Sigstore の代わりに社内 KMS で署名", reason: "顧客の要件で鍵を国内で管理するため", status: "approved", requester: "u-yamamoto", approver: "u-mori", alternative: "KMS 署名＋透明性ログへの記録", risk: "鍵管理の運用が社内に依存する", valid_from: "2026-07-01", valid_until: "2027-06-30", base_version: "1.3.0" },
  { control_id: "CTL-PM-003", kind: "level", detail: "強制レベルを「警告のみ」に変更", reason: "進捗記録は週次の定例で別途作成しているため", status: "pending", requester: "u-yamamoto", approver: "u-mori", alternative: "週次定例の議事録（カレンダー同期）を進捗記録とする", risk: "計画差異の記録が遅れる可能性", valid_from: "2026-12-01", valid_until: "2027-03-31", base_version: "1.3.0" },
  { control_id: "CTL-SI-008", kind: "notApplicable", detail: "適用しない", reason: "開発環境は顧客の標準環境を使うため", status: "returned", requester: "u-yamamoto", approver: "u-mori", risk: "環境の差異による不具合の見落とし", valid_until: "2027-03-31", base_version: "1.3.0" },
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


// ---- 2026-11-28 追加（STD-01〜STD-09） ----

/** 統制項目の出典と適用範囲（STD-01）。規格は番号と箇条番号だけを持ち、本文は持たない */
export const controlSources: Record<string, { profile: string; doc: string; clause: string; reviewed: string }> = {
  "CTL-PM-001": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-4-1:2018", clause: "PM.1", reviewed: "レビュー済み（REV-0006）" },
  "CTL-PM-002": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-4-1:2018", clause: "PM.1", reviewed: "レビュー済み（REV-0006）" },
  "CTL-PM-003": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-4-1:2018", clause: "PM.2", reviewed: "レビュー済み（REV-0006）" },
  "CTL-PM-004": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-4-1:2018", clause: "PM.2", reviewed: "レビュー済み（REV-0006）" },
  "CTL-PM-005": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-5-1-2:2025", clause: "PM（参考）", reviewed: "専門家レビュー待ち" },
  "CTL-PM-006": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-4-1:2018", clause: "PM.4", reviewed: "レビュー済み（REV-0006）" },
  "CTL-SI-001": { profile: "ソフトウェア Basic", doc: "自社ルール", clause: "—", reviewed: "社内承認" },
  "CTL-SI-002": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-4-1:2018", clause: "SI.2", reviewed: "レビュー済み（REV-0006）" },
  "CTL-SI-003": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-4-1:2018", clause: "SI.3", reviewed: "レビュー済み（REV-0006）" },
  "CTL-SI-004": { profile: "ソフトウェア Basic", doc: "自社ルール", clause: "—", reviewed: "社内承認" },
  "CTL-SI-005": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-4-1:2018", clause: "SI.5", reviewed: "差戻し対応中（REV-0007）" },
  "CTL-SI-006": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-4-1:2018", clause: "SI.5", reviewed: "レビュー済み（REV-0006）" },
  "CTL-SI-007": { profile: "ソフトウェア Basic", doc: "組織調整（TLR-002）", clause: "—", reviewed: "社内承認" },
  "CTL-SI-008": { profile: "ソフトウェア Basic", doc: "ISO/IEC 29110-5-1-2:2025", clause: "SI（参考）", reviewed: "専門家レビュー待ち" },
};

/** プロジェクトごとの版固定（STD-03）。開始時に固定し、変更は承認付きで記録する */
export const packPins: { project: string; slug: string; profile: string; pack: string; rules: string; templates: string; enforcement: EnforcementLevel; pinned_at: string; approved_by: string; history: { at: string; change: string; by: string; approved_by: string }[] }[] = [
  { project: "受発注システム刷新", slug: "order-renewal", profile: "ソフトウェア Basic（4-1:2018）", pack: "1.3.0", rules: "gate-rules 1.3.0", templates: "templates 2026.10", enforcement: "soft", pinned_at: "2026-06-01", approved_by: "u-mori", history: [{ at: "2026-10-20", change: "Control Pack 1.2.1 → 1.3.0（MIG-0003）", by: "u-yamamoto", approved_by: "u-mori" }, { at: "2026-08-01", change: "強制レベル 警告のみ → ソフト", by: "u-yamamoto", approved_by: "u-mori" }] },
  { project: "会員アプリ API 開発", slug: "member-app-api", profile: "ソフトウェア Basic（4-1:2018）", pack: "1.3.0", rules: "gate-rules 1.3.0", templates: "templates 2026.10", enforcement: "warnOnly", pinned_at: "2026-06-15", approved_by: "u-mori", history: [] },
  { project: "在庫管理ダッシュボード", slug: "inventory-dashboard", profile: "ソフトウェア Basic（4-1:2018）", pack: "1.2.1", rules: "gate-rules 1.2.1", templates: "templates 2026.07", enforcement: "soft", pinned_at: "2026-07-10", approved_by: "u-ishii", history: [] },
  { project: "旧基幹データ移行", slug: "legacy-migration", profile: "要専門家確認", pack: "1.1.0", rules: "gate-rules 1.1.0", templates: "templates 2026.03", enforcement: "warnOnly", pinned_at: "2026-03-05", approved_by: "u-ishii", history: [] },
];

/** 移行で新たに未充足になる統制項目（STD-06） */
export const migrationMissing: Record<string, string[]> = {
  "受発注システム刷新": ["CTL-SI-006（実施者と承認者の分離）", "REL-006（リリースノートの変更要求）"],
  "会員アプリ API 開発": [],
  "在庫管理ダッシュボード": ["CTL-SI-006", "REL-006", "TRC-002（成功したテスト）", "CTL-PM-003", "CTL-PM-006"],
};

/** 移行の実行記録（STD-06） */
export const migrationLog: { at: string; actor: string; step: string; result: "ok" | "warn" | "fail" }[] = [
  { at: "2026-11-26T09:30:00+09:00", actor: "u-yamamoto", step: "移行レポートを作成（1.3.0 → 1.3.1）", result: "ok" },
  { at: "2026-11-26T10:00:00+09:00", actor: "u-yamamoto", step: "ポリシー管理者として承認", result: "ok" },
  { at: "2026-11-26T10:05:00+09:00", actor: "system", step: "在庫管理ダッシュボードを対象外に設定（未充足 5 件）", result: "warn" },
];

/** 適用範囲の確認（STD-04）。規則に基づく表示で、適合判定ではない */
export type ScopeResult = "in" | "out" | "expert";
export const SCOPE_RESULT: Record<ScopeResult, { label: string; tone: "pass" | "fail" | "warn" }> = {
  in: { label: "対象", tone: "pass" },
  out: { label: "対象外", tone: "fail" },
  expert: { label: "要専門家確認", tone: "warn" },
};
export const scopeChecks: { project: string; slug: string; factors: { label: string; value: string; rule: string; result: ScopeResult }[]; recorded_by: string; recorded_at: string }[] = [
  {
    project: "受発注システム刷新", slug: "order-renewal", recorded_by: "u-sato", recorded_at: "2026-06-01",
    factors: [
      { label: "組織・チームの人数", value: "18 人（開発会社全体 22 人）", rule: "25 人以下", result: "in" },
      { label: "製品の数", value: "1（受発注システム）", rule: "単一製品", result: "in" },
      { label: "チームの数", value: "1", rule: "単一チーム", result: "in" },
      { label: "クリティカリティ", value: "業務システム（人命・安全に関わらない）", rule: "非セーフティクリティカル", result: "in" },
      { label: "開発形態", value: "反復型（2週間スプリント）", rule: "開発形態は問わない", result: "in" },
    ],
  },
  {
    project: "旧基幹データ移行", slug: "legacy-migration", recorded_by: "u-ishii", recorded_at: "2026-03-05",
    factors: [
      { label: "組織・チームの人数", value: "22 人＋外部委託 2 名（予定）", rule: "25 人以下", result: "expert" },
      { label: "製品の数", value: "1（データ移行）", rule: "単一製品", result: "in" },
      { label: "チームの数", value: "2（社内・委託先）", rule: "単一チーム", result: "expert" },
      { label: "クリティカリティ", value: "会計データの移行（業務クリティカル）", rule: "非セーフティクリティカル", result: "expert" },
      { label: "開発形態", value: "段階型", rule: "開発形態は問わない", result: "in" },
    ],
  },
  {
    project: "医療機器の組込みソフト（引合い）", slug: "", recorded_by: "u-ishii", recorded_at: "2026-11-25",
    factors: [
      { label: "組織・チームの人数", value: "6 人", rule: "25 人以下", result: "in" },
      { label: "クリティカリティ", value: "医療機器（安全に関わる）", rule: "非セーフティクリティカル", result: "out" },
    ],
  },
];

/** 参照する規格文書と利用許諾（STD-07）。本文はシステムに保存しない */
export type SourceDoc = {
  ref: string;
  role: string;
  acquired: "入手済み" | "未入手" | "無償公開（入手済み）";
  license: "許諾済み" | "確認中" | "未申請" | "不要（番号の参照のみ）";
  use: { db: boolean; prompt: boolean; test: boolean };
  scope: string;
  owner: string;
  checked_at: string;
};
export const sourceDocs: SourceDoc[] = [
  { ref: "ISO/IEC 29110-4-1:2018", role: "Basic の規範的なプロファイル仕様（Control の出典）", acquired: "入手済み", license: "確認中", use: { db: false, prompt: false, test: false }, scope: "番号・箇条番号の参照のみ。専門家が正規本文で人手レビュー", owner: "u-yamamoto", checked_at: "2026-11-20" },
  { ref: "ISO/IEC 29110-5-1-2:2025", role: "Basic の実施ガイド（ワークフロー・テンプレートの参考）", acquired: "無償公開（入手済み）", license: "未申請", use: { db: false, prompt: false, test: false }, scope: "無償公開でも AI・TDM への利用は許諾が必要。番号の参照のみ", owner: "u-yamamoto", checked_at: "2026-11-20" },
  { ref: "ISO/IEC 29110-5-5:2026", role: "Agile／DevOps ガイド（CI/CD への適用の参考）", acquired: "未入手", license: "未申請", use: { db: false, prompt: false, test: false }, scope: "未入手。Control への反映前に入手と専門家レビューが必要", owner: "u-yamamoto", checked_at: "2026-11-20" },
  { ref: "ISO/IEC 29110-3-2:2018", role: "認証スキーム（第三者認証との境界）", acquired: "入手済み", license: "不要（番号の参照のみ）", use: { db: false, prompt: false, test: false }, scope: "表示文言の確認にのみ使用", owner: "u-yamamoto", checked_at: "2026-10-01" },
  { ref: "国内の導入解説資料", role: "日本語の実務解説（UI・用語の参考）", acquired: "入手済み", license: "確認中", use: { db: false, prompt: false, test: false }, scope: "引用せず、用語の参考のみ", owner: "u-yamamoto", checked_at: "2026-09-15" },
];

/** Control Pack のレビュー記録（STD-09） */
export const packReviews: { id: string; version: string; reviewer: string; reviewer_role: string; kind: "承認" | "差戻し" | "コメント" | "適用判断"; at: string; summary: string; status: "完了" | "対応中" }[] = [
  { id: "REV-0007", version: "1.3.1（案）", reviewer: "規格専門家 B（外部・架空）", reviewer_role: "規格専門家", kind: "差戻し", at: "2026-11-24", summary: "CTL-SI-005 の説明が出典の範囲を超えている。説明文を自社の言葉で限定すること", status: "対応中" },
  { id: "REV-0006", version: "1.3.0", reviewer: "規格専門家 B（外部・架空）", reviewer_role: "規格専門家", kind: "承認", at: "2026-10-10", summary: "PM・SI の規範層 10 項目の対応付けを確認。参考層 2 項目は継続確認", status: "完了" },
  { id: "REV-0005", version: "1.3.0", reviewer: "山本 結衣", reviewer_role: "ポリシー管理者", kind: "適用判断", at: "2026-10-12", summary: "自動ルール層の強制レベルの既定を「ソフト」に設定", status: "完了" },
  { id: "REV-0004", version: "1.2.1", reviewer: "森 由紀子", reviewer_role: "CTO（承認者）", kind: "承認", at: "2026-06-28", summary: "公開を承認", status: "完了" },
];

export const assessorFeedback: { id: string; from: string; at: string; topic: string; feedback: string; response: string; status: "反映済み" | "対応中" | "見送り" }[] = [
  { id: "FB-003", from: "第三者評価事務所（架空）", at: "2026-11-22", topic: "監査パックの形式", feedback: "統制項目の対応表に、各証跡の取得元システムと取得日時の列がほしい", response: "control-map.json と PDF 要約に「出典」と「同期日時」を追加（1.3.1 で反映予定）", status: "対応中" },
  { id: "FB-002", from: "第三者評価事務所（架空）", at: "2026-10-05", topic: "署名の検証手順", feedback: "検証手順を評価者側のツールで再現できた。手順書の用語を統一してほしい", response: "VERIFY.md の用語を統一", status: "反映済み" },
  { id: "FB-001", from: "第三者評価事務所（架空）", at: "2026-08-20", topic: "AI 所見の扱い", feedback: "AI 所見は評価の根拠として扱わない。パックから除外できるようにしてほしい", response: "出力時に AI 所見を除外できる設定を追加", status: "反映済み" },
];
