// ゲート・PR・例外の画面用の架空データ。
import type { AiFinding, GateRun } from "../lib/types";
import type { CheckAnomaly, EnforcementLevel, Severity } from "../lib/vocab";
import { fakeSha } from "./core";
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

/** 変更要求（PR/MR）を扱う提供元。用語は提供元ごとに異なる */
export type ScmProvider = "github" | "gitlab" | "codecommit" | "azureRepos";
export const CHANGE_TERM: Record<ScmProvider, string> = { github: "PR", gitlab: "MR", codecommit: "PR", azureRepos: "PR" };

export type PullRow = {
  number: number;
  title: string;
  provider: ScmProvider;
  repo: string;
  author: { kind: "human" | "ai"; name: string; user_id?: string };
  run_id?: string;
  review: "approved" | "pending" | "changes" | "none";
  requirement_ids: string[];
  updated_at: string;
  draft?: boolean;
};

export const pulls: PullRow[] = [
  { number: 143, title: "取引先 CSV 取込（下書き）", provider: "github", repo: "sample-soft/order-api", author: { kind: "ai", name: "coding-agent", user_id: "u-agent" }, run_id: "run-5830", review: "none", requirement_ids: ["REQ-0007"], updated_at: "2026-11-27T10:02:00+09:00", draft: true },
  { number: 142, title: "操作ログを追記専用ストレージへ書き込む", provider: "github", repo: "sample-soft/order-api", author: { kind: "human", name: "鈴木 彩", user_id: "u-suzuki" }, run_id: "run-5821", review: "approved", requirement_ids: ["REQ-0006"], updated_at: "2026-11-27T09:37:00+09:00" },
  { number: 141, title: "発注一覧の検索条件に状態を追加", provider: "github", repo: "sample-soft/order-web", author: { kind: "ai", name: "coding-agent", user_id: "u-agent" }, run_id: "run-5820", review: "pending", requirement_ids: ["REQ-0004"], updated_at: "2026-11-27T08:15:00+09:00" },
  { number: 140, title: "基幹連携バッチの再送処理", provider: "github", repo: "sample-soft/order-api", author: { kind: "human", name: "渡辺 翔", user_id: "u-watanabe" }, run_id: "run-5815", review: "approved", requirement_ids: ["REQ-0003"], updated_at: "2026-11-26T18:20:00+09:00" },
  { number: 139, title: "PDF 帳票のフォントを差し替え", provider: "github", repo: "sample-soft/order-web", author: { kind: "human", name: "鈴木 彩", user_id: "u-suzuki" }, run_id: "run-5810", review: "approved", requirement_ids: ["REQ-0008"], updated_at: "2026-11-26T11:02:00+09:00" },
  { number: 138, title: "README の誤記修正", provider: "github", repo: "sample-soft/order-api", author: { kind: "human", name: "伊藤 誠", user_id: "u-ito" }, run_id: "run-5808", review: "changes", requirement_ids: [], updated_at: "2026-11-25T15:40:00+09:00" },
  { number: 57, title: "会員ポイントの付与 API", provider: "gitlab", repo: "member-app/api", author: { kind: "human", name: "鈴木 彩", user_id: "u-suzuki" }, run_id: "run-g57", review: "pending", requirement_ids: [], updated_at: "2026-11-27T08:50:00+09:00" },
  { number: 12, title: "移行スクリプトの文字コード変換", provider: "codecommit", repo: "legacy-migration（ap-northeast-1）", author: { kind: "human", name: "渡辺 翔", user_id: "u-watanabe" }, run_id: "run-cc12", review: "approved", requirement_ids: [], updated_at: "2026-11-26T17:10:00+09:00" },
  { number: 208, title: "在庫予測のバッチ間隔を設定可能にする", provider: "azureRepos", repo: "inventory/dashboard", author: { kind: "human", name: "田中 陽介", user_id: "u-tanaka" }, run_id: "run-az208", review: "none", requirement_ids: [], updated_at: "2026-11-25T11:30:00+09:00" },
];

export const pullByNumber = (n?: number) => pulls.find((p) => p.number === n && p.provider === "github");

/** ルールの定義（G-02）。規格本文ではなく自社作成の説明 */
export const ruleDefs: Record<string, { title: string; control: string; actor: "ci" | "human"; evidence: string }> = {
  "STR-001": { title: "必須メタデータ（Profile、Control Pack 版、要求ID）がそろっている", control: "CTL-SI-001", actor: "ci", evidence: "入力スナップショット" },
  "TRC-002": { title: "承認済みの要求にテストへのリンクがある", control: "CTL-SI-005", actor: "ci", evidence: "トレーサビリティ記録" },
  "QLT-001": { title: "lint の警告がしきい値以下", control: "CTL-SI-004", actor: "ci", evidence: "CI ログ" },
  "QLT-004": { title: "依存ライブラリに重大度・高以上の既知の脆弱性がない", control: "CTL-SI-004", actor: "ci", evidence: "依存関係スキャン結果" },
  "APR-001": { title: "AIエージェントの PR に人間のレビュー承認がある", control: "CTL-SI-004", actor: "human", evidence: "レビュー記録" },
  "STR-003": { title: "納入物一覧が所定の様式に沿っている", control: "CTL-SI-007", actor: "ci", evidence: "納入物一覧" },
};

/** ゲートに入力された外部チェック結果。異常は通過として扱わない */
export type CheckInput = { name: string; provider: string; sha: string; status: "success" | "failure" | "pending"; anomaly?: CheckAnomaly; note?: string; at: string };

export function checkInputs(anomaly: boolean): CheckInput[] {
  const head = "7c1e0a4";
  if (!anomaly) {
    return [
      { name: "Rust", provider: "GitHub Actions", sha: head, status: "success", at: "2026-11-27T09:36:40+09:00" },
      { name: "Web", provider: "GitHub Actions", sha: head, status: "success", at: "2026-11-27T09:36:55+09:00" },
      { name: "dependency-scan", provider: "GitHub Actions", sha: head, status: "failure", at: "2026-11-27T09:37:10+09:00", note: "重大度・高 1 件（QLT-004 の入力）" },
    ];
  }
  return [
    { name: "Rust", provider: "GitHub Actions", sha: "3f9b21d", status: "success", anomaly: "staleSha", at: "2026-11-27T09:20:00+09:00", note: "対象コミット 7c1e0a4 と一致しない" },
    { name: "Web", provider: "GitHub Actions", sha: head, status: "pending", anomaly: "missing", at: "2026-11-27T09:37:00+09:00", note: "必須チェックの結果が届いていない" },
    { name: "dependency-scan", provider: "GitHub Actions", sha: head, status: "success", anomaly: "duplicate", at: "2026-11-27T09:37:10+09:00", note: "同じ実行IDの結果が 2 回届いた（後着を無視）" },
    { name: "integration-test", provider: "GitHub Actions", sha: head, status: "failure", anomaly: "cancelled", at: "2026-11-27T09:38:00+09:00", note: "ワークフローがキャンセルされた" },
    { name: "e2e", provider: "GitHub Actions", sha: head, status: "pending", anomaly: "timeout", at: "2026-11-27T09:08:00+09:00", note: "30 分以内に完了しなかった" },
    { name: "sast", provider: "不明なアプリ（id 99120）", sha: head, status: "success", anomaly: "unknownProvider", at: "2026-11-27T09:37:30+09:00", note: "登録された提供元ではない" },
    { name: "sbom", provider: "GitHub Actions", sha: head, status: "success", anomaly: "signatureMismatch", at: "2026-11-27T09:37:40+09:00", note: "添付の署名が検証できない" },
  ];
}

/** 新しいコミットで失効したもの（SCM-06） */
export const invalidatedBySha = [
  { kind: "ゲート判定", id: "run-5821", detail: "コミット 3f9b21d に対する判定" },
  { kind: "承認", id: "設計者 田中 陽介", detail: "2026-11-27 09:20 の承認。新しいコミットで再承認が必要" },
  { kind: "外部チェック", id: "Rust / Web", detail: "3f9b21d の結果は新しいコミットに流用しない" },
];

/** 判定の再現（G-06） */
export function replayResult(match: boolean) {
  const orig = { verdict: "block", gates: "A: 通過 / B: ブロック / C: 通過 / D: 通過", reasons: "TRC-002, QLT-004", manifest: fakeSha("man-run-5821") };
  return {
    original: orig,
    replay: match ? orig : { verdict: "block", gates: "A: 通過 / B: ブロック / C: 通過 / D: 通過", reasons: "TRC-002, QLT-004, QLT-007", manifest: fakeSha("man-run-5821-replay") },
    causes: match
      ? []
      : [
          "ルール QLT-007 は Basic Control Pack 1.3.1 で追加されたもので、元の判定（1.3.0）には含まれていません。再現には判定時のルール版を指定してください。",
          "入力スナップショットの依存関係スキャン結果のハッシュが、保管済みのものと一致しません（保管先の検証を確認してください）。",
        ],
  };
}

/** ゲートの適用設定（G-04） */
export const enforcementScopes = [
  { id: "s1", scope: "プロジェクトの既定", target: "受発注システム刷新", level: "soft" as EnforcementLevel, since: "2026-11-01", next: { level: "hard" as EnforcementLevel, date: "2027-01-15", status: "承認待ち" } },
  { id: "s2", scope: "ブランチ", target: "main", level: "hard" as EnforcementLevel, since: "2026-11-15" },
  { id: "s3", scope: "ブランチ", target: "release/*", level: "hard" as EnforcementLevel, since: "2026-11-15" },
  { id: "s4", scope: "ブランチ", target: "feature/*", level: "warnOnly" as EnforcementLevel, since: "2026-10-01" },
  { id: "s5", scope: "リリース", target: "v1.4.0", level: "hard" as EnforcementLevel, since: "2026-11-20" },
];

export const gateKinds = [
  { key: "pr", name: "PR／MR のゲート（A〜D）", trigger: "PR／MR の作成・更新", level: "soft" as EnforcementLevel, enabled: true, paused: false },
  { key: "milestone", name: "マイルストーンのゲート", trigger: "計画管理でマイルストーンを完了にしたとき", level: "warnOnly" as EnforcementLevel, enabled: true, paused: false },
  { key: "customer", name: "顧客承認のゲート", trigger: "要求・計画・変更の承認依頼", level: "soft" as EnforcementLevel, enabled: true, paused: false },
  { key: "release", name: "リリースのゲート", trigger: "リリースの作成", level: "hard" as EnforcementLevel, enabled: true, paused: false },
  { key: "acceptance", name: "受入のゲート", trigger: "納入物の受入依頼", level: "soft" as EnforcementLevel, enabled: true, paused: true },
];

export const enforcementAudit: TimelineItem[] = [
  { id: "g1", actor: { kind: "human", name: "山本 結衣（ポリシー管理者）" }, action: "受入のゲートを一時停止", detail: "顧客ポータルの移行作業のため。12/1 に自動で再開", at: "2026-11-26T18:00:00+09:00" },
  { id: "g2", actor: { kind: "human", name: "森 由紀子（CTO）" }, action: "一時停止を承認", target: "受入のゲート", at: "2026-11-26T18:20:00+09:00" },
  { id: "g3", actor: { kind: "human", name: "山本 結衣（ポリシー管理者）" }, action: "強制レベルの変更を申請", detail: "プロジェクトの既定: ソフト → ハード（2027-01-15 から）", at: "2026-11-25T10:00:00+09:00" },
  { id: "g4", actor: { kind: "human", name: "山本 結衣（ポリシー管理者）" }, action: "main をハードに変更", detail: "承認者: 森 由紀子", at: "2026-11-15T09:00:00+09:00" },
  { id: "g5", actor: { kind: "system", name: "ゲート" }, action: "プロジェクトの既定を警告のみ → ソフトに変更", detail: "段階導入の予定どおり", at: "2026-11-01T00:00:00+09:00" },
];

/** 職務分離（G-04） */
export const sodRules = [
  { op: "強制レベル・ルールの変更", request: "ポリシー管理者", approve: "CTO または 経営者（申請者以外）", never: "申請者本人、AIエージェント" },
  { op: "ゲートの一時停止・再開", request: "ポリシー管理者", approve: "CTO（申請者以外）", never: "申請者本人、AIエージェント" },
  { op: "例外の承認", request: "PR の作成者・PM", approve: "独立した承認者（申請者以外）", never: "申請者本人、AIエージェント、ポリシー管理者による自己承認" },
  { op: "重大なリスクの受容", request: "PM・CTO", approve: "案件スポンサー（経営判断）", never: "申請者本人" },
  { op: "ゲートのバイパス", request: "—", approve: "—", never: "管理者を含め誰も実行できない（例外の申請のみ）" },
];

/** 必須チェックの登録状況（G-05） */
export type Registration = { repo: string; provider: ScmProvider; mechanism: string; branch: string; state: "ok" | "missing" | "drift" | "unsupported"; detail: string; checked_at: string };
export const registrations: Registration[] = [
  { repo: "sample-soft/order-api", provider: "github", mechanism: "必須ステータスチェック（Checks API）", branch: "main", state: "ok", detail: "「Product Name ゲート」が必須。管理者も強制対象", checked_at: "2026-11-27T10:00:00+09:00" },
  { repo: "sample-soft/order-web", provider: "github", mechanism: "必須ステータスチェック（Checks API）", branch: "main", state: "drift", detail: "11/26 19:40 に「管理者を強制対象に含める」が無効化された（変更者: GitHub ユーザー ytanaka）", checked_at: "2026-11-27T10:00:00+09:00" },
  { repo: "sample-soft/order-api", provider: "github", mechanism: "必須ステータスチェック（Checks API）", branch: "release/*", state: "missing", detail: "ブランチ保護ルールがない", checked_at: "2026-11-27T10:00:00+09:00" },
  { repo: "member-app/api", provider: "gitlab", mechanism: "External Status Check＋保護ブランチ", branch: "main", state: "ok", detail: "MR の HEAD SHA ごとに結果を投稿", checked_at: "2026-11-27T08:55:00+09:00" },
  { repo: "inventory/dashboard", provider: "azureRepos", mechanism: "PR Status（product-name/gate）＋ブランチポリシー", branch: "main", state: "ok", detail: "状態 product-name/gate を必須化", checked_at: "2026-11-27T09:30:00+09:00" },
  { repo: "legacy-migration（ap-northeast-1）", provider: "codecommit", mechanism: "承認ルール（product-name-gate）", branch: "main", state: "unsupported", detail: "チェックの書き込み API がないため、承認ルールとコメントで代替。マージの強制は承認ルールのみ", checked_at: "2026-11-27T10:10:00+09:00" },
];

/** 構成管理のベースライン（L-04） */
export type BaselineItem = { kind: "要求" | "設計" | "コード" | "テスト" | "成果物" | "文書"; id: string; title: string; version: string; ref: string; approval: "approved" | "pending" | "changing"; reason?: string };
export const baselines = [
  { id: "BL-0005", name: "v1.4.0 リリース候補", created_at: "2026-11-26T18:00:00+09:00", tag: "v1.4.0-rc1", branch: "release/1.4", status: "pending" as const, approver: "u-watanabe" },
  { id: "BL-0004", name: "v1.3.0 納入", created_at: "2026-11-05T17:00:00+09:00", tag: "v1.3.0", branch: "main", status: "approved" as const, approver: "u-watanabe" },
  { id: "BL-0003", name: "基本設計の完了", created_at: "2026-10-08T17:00:00+09:00", tag: "design-1.0", branch: "main", status: "approved" as const, approver: "u-tanaka" },
];
export function baselineItems(id: string): BaselineItem[] {
  const rc = id === "BL-0005";
  return [
    { kind: "要求", id: "REQ-0003", title: "発注データを基幹システムへ連携する", version: rc ? "v4" : "v3", ref: "docs/requirements/REQ-0003.yaml", approval: "approved", reason: rc ? "CR-0002 による再送条件の追加" : undefined },
    { kind: "要求", id: "REQ-0006", title: "操作ログを追記専用で保存する", version: "v2", ref: "docs/requirements/REQ-0006.yaml", approval: rc ? "changing" : "approved", reason: rc ? "保存期間の見直し（顧客の再承認待ち）" : undefined },
    { kind: "設計", id: "ADR-0004", title: "操作ログの保管方式", version: "v2", ref: "docs/design/adr/0004.md", approval: "approved" },
    { kind: "コード", id: "order-api", title: "受発注 API", version: rc ? "7c1e0a4" : "5e0d9b2", ref: rc ? "release/1.4" : "tag v1.3.0", approval: rc ? "pending" : "approved" },
    { kind: "コード", id: "order-web", title: "受発注 Web", version: rc ? "a41f0c8" : "c902e11", ref: rc ? "release/1.4" : "tag v1.3.0", approval: rc ? "pending" : "approved" },
    { kind: "テスト", id: "TC-0110", title: "上限額の判定", version: "v2", ref: "tests/integration/limit.rs", approval: "approved" },
    { kind: "成果物", id: "order-api-1.4.0.tar.gz", title: "API の配布物", version: rc ? "1.4.0-rc1" : "1.3.0", ref: `sha256:${fakeSha(rc ? "art-api-140" : "art-api-130").slice(0, 12)}…`, approval: rc ? "pending" : "approved" },
    { kind: "文書", id: "DOC-REL-NOTES", title: "リリースノート", version: rc ? "1.4.0 下書き" : "1.3.0", ref: "docs/release-notes.md", approval: rc ? "pending" : "approved" },
  ];
}

/** 例外の承認履歴（E-03） */
export const exceptionTimeline: TimelineItem[] = [
  { id: "e1", actor: { kind: "ci", name: "Gate B" }, action: "ブロックと判定", target: "run-5821", detail: "TRC-002: REQ-0006 にテストへのリンクがありません", at: "2026-11-27T09:39:00+09:00" },
  { id: "e2", actor: { kind: "human", name: "鈴木 彩" }, action: "例外を申請", target: "EXC-0008", detail: "期限 2026-12-11", at: "2026-11-27T09:50:00+09:00" },
  { id: "e3", actor: { kind: "system", name: "通知" }, action: "承認者に依頼を送信", target: "佐藤 美咲", at: "2026-11-27T09:50:10+09:00" },
];

/** 例外の補足情報（E-01〜E-03）。重大度、延長・取消の記録 */
export const exceptionMeta: Record<string, { severity: Severity; records: { id: string; kind: "申請" | "承認" | "却下" | "延長（新しい申請）" | "取消" | "再審査" | "再ブロック"; by: string; at: string; note?: string; ref?: string }[] }> = {
  "EXC-0007": {
    severity: "medium",
    records: [
      { id: "r1", kind: "申請", by: "u-watanabe", at: "2026-11-26T18:30:00+09:00", note: "期限 2026-12-03" },
      { id: "r2", kind: "承認", by: "u-sato", at: "2026-11-26T19:05:00+09:00", note: "独立承認（申請者以外）" },
      { id: "r3", kind: "延長（新しい申請）", by: "u-watanabe", at: "2026-11-27T09:00:00+09:00", note: "12/10 までの延長。元の承認は延長しない", ref: "EXC-0009" },
    ],
  },
  "EXC-0006": {
    severity: "high",
    records: [
      { id: "r1", kind: "申請", by: "u-suzuki", at: "2026-11-20T10:00:00+09:00" },
      { id: "r2", kind: "承認", by: "u-sato", at: "2026-11-20T11:00:00+09:00" },
    ],
  },
  "EXC-0008": { severity: "medium", records: [{ id: "r1", kind: "申請", by: "u-suzuki", at: "2026-11-27T09:50:00+09:00" }] },
  "EXC-0004": {
    severity: "low",
    records: [
      { id: "r1", kind: "申請", by: "u-watanabe", at: "2026-09-01T10:00:00+09:00" },
      { id: "r2", kind: "承認", by: "u-sato", at: "2026-09-01T12:00:00+09:00" },
      { id: "r3", kind: "再審査", by: "system", at: "2026-09-15T23:59:00+09:00", note: "原因が未修正" },
      { id: "r4", kind: "再ブロック", by: "system", at: "2026-09-15T23:59:00+09:00", note: "ゲートA（STR-003）が再びブロック" },
    ],
  },
  "EXC-0005": { severity: "low", records: [{ id: "r1", kind: "申請", by: "u-suzuki", at: "2026-10-10T10:00:00+09:00" }, { id: "r2", kind: "却下", by: "u-tanaka", at: "2026-10-10T15:00:00+09:00" }] },
};

/** GitHub 以外の提供元でのゲート実行（G-01） */
export const otherRuns: (GateRun & { provider: ScmProvider; repo: string })[] = [
  {
    id: "run-g57", provider: "gitlab", repo: "member-app/api", pr_number: 57, pr_title: "会員ポイントの付与 API", branch: "feature/points", commit_sha: fakeSha("g57"), author: { kind: "human", name: "鈴木 彩", user_id: "u-suzuki" },
    gates: { A: "pass", B: "pass", C: "block", D: "pass" }, verdict: "block", enforcement: "soft", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-g57"), ci_run_id: "gl-pipeline-88123", started_at: "2026-11-27T08:52:00+09:00",
    reasons: [{ rule_id: "APR-001", gate: "C", result: "block", message: "MR のレビュー承認がありません", exception_allowed: false }], required_approvals: [{ role: "設計者", status: "pending" }],
  },
  {
    id: "run-cc12", provider: "codecommit", repo: "legacy-migration（ap-northeast-1）", pr_number: 12, pr_title: "移行スクリプトの文字コード変換", branch: "feature/encoding", commit_sha: fakeSha("cc12"), author: { kind: "human", name: "渡辺 翔", user_id: "u-watanabe" },
    gates: { A: "pass", B: "warn", C: "pass", D: "pass" }, verdict: "warn", enforcement: "warnOnly", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-cc12"), ci_run_id: "codebuild-7781", started_at: "2026-11-26T17:12:00+09:00",
    reasons: [{ rule_id: "TRC-002", gate: "B", result: "warn", message: "要求へのリンクがありません（計画管理の接続が未設定）", exception_allowed: true }], required_approvals: [],
  },
  {
    id: "run-az208", provider: "azureRepos", repo: "inventory/dashboard", pr_number: 208, pr_title: "在庫予測のバッチ間隔を設定可能にする", branch: "feature/batch-interval", commit_sha: fakeSha("az208"), author: { kind: "human", name: "田中 陽介", user_id: "u-tanaka" },
    gates: { A: "pass", B: "pass", C: "pass", D: "pass" }, verdict: "pass", enforcement: "soft", policy_version: "Basic Control Pack 1.3.0", policy_sha256: fakeSha("policy-1.3.0"), input_sha256: fakeSha("in-az208"), ci_run_id: "azp-55102", started_at: "2026-11-25T11:35:00+09:00",
    reasons: [], required_approvals: [{ role: "設計者", user_id: "u-tanaka", status: "approved" }],
  },
];
