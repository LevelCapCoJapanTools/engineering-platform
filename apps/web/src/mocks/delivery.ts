// 提出から配備・受入までの架空データ（2026-11-28 追補。画面群 6.24）。
// 基準日は 2026-11-27。リリースは rel-140（v1.4.0）を例にする。
import { fakeSha } from "./core";

// ---------- L-05 提出と検証の照合 ----------

export type CheckState = "ok" | "failed" | "missing" | "otherSha";

export type MatchRow = {
  order_id: string;
  submission_id?: string;
  title: string;
  freelancer_id: string;
  commit_sha?: string;
  build?: { run_id: string; provider: string; sha: string; state: CheckState };
  tests?: { run_id: string; sha: string; passed: number; failed: number; state: CheckState };
  criteria: { title: string; state: CheckState; evidence: string }[];
  verifier_id?: string;
  verifier_state: "pending" | "done" | "none";
  route_to?: { who: string; what: string; due: string };
};

export const matchRows: MatchRow[] = [
  {
    order_id: "ORD-0101",
    submission_id: "SUB-0101-1",
    title: "受注一覧の CSV 出力",
    freelancer_id: "u-matsuda",
    commit_sha: "9f3c2a1e7b4d5c6a8e0f1b2c3d4e5f6a7b8c9d0e",
    build: { run_id: "gh-run-99820001", provider: "GitHub Actions", sha: "9f3c2a1e7b4d5c6a8e0f1b2c3d4e5f6a7b8c9d0e", state: "ok" },
    tests: { run_id: "gh-run-99820001", sha: "9f3c2a1e7b4d5c6a8e0f1b2c3d4e5f6a7b8c9d0e", passed: 24, failed: 0, state: "ok" },
    criteria: [
      { title: "5列が指定の順で出力される", state: "ok", evidence: "TC-0151（同じコミットの CI で成功）" },
      { title: "文字コードは UTF-8（BOM 付き）", state: "ok", evidence: "TC-0152（同じコミットの CI で成功）" },
      { title: "1万行を10秒以内に出力できる", state: "missing", evidence: "性能試験の結果が未取得（受託者の手元確認 6.2 秒は参考扱い）" },
    ],
    verifier_id: "u-ito",
    verifier_state: "pending",
    route_to: { who: "u-ito", what: "性能試験（TC-0153）をステージングで実行し、結果を記録する", due: "2026-11-30" },
  },
  {
    order_id: "ORD-0104",
    submission_id: "SUB-0104-1",
    title: "会員アプリのプッシュ通知 API",
    freelancer_id: "u-matsuda",
    commit_sha: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    build: { run_id: "gh-run-99710455", provider: "GitHub Actions", sha: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", state: "ok" },
    tests: { run_id: "gh-run-99710455", sha: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", passed: 41, failed: 0, state: "ok" },
    criteria: [
      { title: "1分あたり1万件を送信できる", state: "ok", evidence: "負荷試験 LT-07（同じコミット）" },
      { title: "失敗した配信を再送できる", state: "ok", evidence: "TC-0410（同じコミット）" },
    ],
    verifier_id: "u-ito",
    verifier_state: "done",
  },
  {
    order_id: "ORD-0102",
    title: "取引先マスタの CSV 一括取込",
    freelancer_id: "u-hayashi",
    criteria: [
      { title: "1万行の UTF-8 CSV を60秒以内に取り込める", state: "missing", evidence: "未提出" },
      { title: "失敗した行の行番号と理由を表示する", state: "missing", evidence: "未提出" },
    ],
    verifier_state: "none",
  },
];

/** 別コミットの CI 成功を流用しようとした例（照合で拒否する） */
export const staleRunExample = {
  run_id: "gh-run-99819870",
  sha: "4c1d0b9a8e7f6d5c4b3a29180716f5e4d3c2b1a0",
  note: "PR #151 の1つ前のコミットで成功した CI。提出版（9f3c2a1）とは別のため照合に使わない",
};

// ---------- L-06 リリース候補 ----------

export type CandidateItem = {
  id: string;
  kind: "提出" | "PR" | "変更要求";
  title: string;
  ref: string;
  sha?: string;
  source: string;
  include: boolean;
  reason: string;
};

export const candidateItems: CandidateItem[] = [
  { id: "SUB-0101-1", kind: "提出", title: "受注一覧の CSV 出力（ORD-0101）", ref: "PR #151", sha: "9f3c2a1", source: "松田 亮（受託者）", include: true, reason: "照合済み。性能試験は候補の固定までに取得" },
  { id: "PR-142", kind: "PR", title: "操作ログを追記専用ストレージへ書き込む", ref: "PR #142", sha: "c142e0a", source: "鈴木 彩", include: true, reason: "ゲート通過（run-5840）" },
  { id: "CR-0003", kind: "変更要求", title: "取引先マスタの CSV 一括登録（ORD-0102）", ref: "未提出", source: "林 由香（受託者）", include: false, reason: "提出前のため v1.5.0 へ" },
  { id: "PR-141", kind: "PR", title: "発注一覧の検索条件に状態を追加", ref: "PR #141", sha: "c141b7d", source: "coding-agent", include: false, reason: "人間のレビュー承認がないため除外" },
];

export const candidateFixed = {
  id: "RC-140-2",
  fixed_at: "2026-11-27T10:05:00+09:00",
  fixed_by: "u-aoki",
  digest: fakeSha("rc-140-2"),
  commits: [
    { repo: "sample-soft/order-web", sha: "9f3c2a1e7b4d" },
    { repo: "sample-soft/order-api", sha: "c142e0a91d3f" },
  ],
};

export const candidateTests = [
  { name: "単体テスト（order-web）", run: "gh-run-99820001", result: "24件成功" },
  { name: "単体テスト（order-api）", run: "gh-run-99820014", result: "112件成功" },
  { name: "結合テスト（ステージング）", run: "gh-run-99820102", result: "未実行（環境準備 12/1）" },
];

export const migrationSteps = [
  "操作ログ用の追記専用ストレージ（バケット）を作成する（手順 MG-01）",
  "アプリを v1.4.0 に更新する",
  "CSV 出力の権限を「受注照会」ロールに付与する",
];

export const rollbackSteps = [
  "アプリを v1.3.0 のコンテナに戻す（承認済み手順 RB-03）",
  "操作ログの書込み先を旧テーブルに戻す（書き込まれたログは保持）",
  "ヘルスチェックと受注一覧の表示を確認する",
];

export const releaseContacts = [
  { role: "リリース責任者", user_id: "u-watanabe", hours: "配備時間帯（12/17 22:00〜24:00）" },
  { role: "運用当番（一次）", user_id: "u-watanabe", hours: "PagerDuty の当番表に従う" },
  { role: "案件窓口（顧客連絡）", user_id: "u-aoki", hours: "平日 9:00〜18:00" },
];

export const aiReleaseNote = `## v1.4.0 で変わること（顧客向けの説明案）

- 受注一覧を CSV（5列、UTF-8）で書き出せるようになります
- 操作ログを改ざんできない保管先に保存します

### 既知の問題
- 発注一覧の並び替えで、同じ日付の順序が画面と CSV で異なる場合があります（BUG-031、低）`;

// ---------- L-07 実行許可 ----------

export type PermitCheck = { id: string; title: string; state: "ok" | "ng" | "pending"; detail: string; actor: "ci" | "human" | "system" };

export function permitChecks(variant: string): PermitCheck[] {
  return [
    { id: "p1", title: "リリース候補が固定され、成果版が一致している", state: variant === "versionChanged" ? "ng" : "ok", detail: variant === "versionChanged" ? "候補 RC-140-2 の固定後に order-web の先端が 0d4e8f2 に進みました。差し替えた候補で再回収が必要です" : "RC-140-2（order-web 9f3c2a1、order-api c142e0a）", actor: "system" },
    { id: "p2", title: "必須チェック（ゲート A〜D）が成果版で通過", state: variant === "checkFailed" ? "ng" : "ok", detail: variant === "checkFailed" ? "ゲートB: 結合テストが失敗（run-5852）" : "run-5848（ルール版 Basic Control Pack 1.3.0）", actor: "ci" },
    { id: "p3", title: "リリース管理者の承認（実務）", state: variant === "approvalExpired" ? "ng" : "ok", detail: variant === "approvalExpired" ? "承認の有効期限（11/26 23:59）が切れました。再承認が必要です" : "渡辺 翔・2026-11-27 09:40（期限 12/18）", actor: "human" },
    { id: "p4", title: "PM の承認（実務）", state: "ok", detail: "佐藤 美咲・2026-11-27 09:45", actor: "human" },
    { id: "p5", title: "Go/No-Go の経営判断", state: variant === "default" ? "pending" : "ok", detail: variant === "default" ? "案件スポンサー（木村 達也）の判断待ち（DEC-0033 と同時に審議）" : "条件付き Go・木村 達也・2026-11-27 10:20", actor: "human" },
    { id: "p6", title: "対象環境と時間枠", state: "ok", detail: "本番（ap-northeast-1）・2026-12-17 22:00〜24:00", actor: "system" },
  ];
}

export const permitPinned = {
  id: "PMT-0007",
  rule_version: "Basic Control Pack 1.3.0",
  rule_sha: fakeSha("policy-1.3.0"),
  candidate: "RC-140-2",
  candidate_digest: fakeSha("rc-140-2"),
  environment: "本番（ap-northeast-1）",
  window: "2026-12-17 22:00〜24:00",
  procedure: "deploy-production（GitHub Actions・事前登録 2026-10-01）",
};

// ---------- L-08 配備依頼と完了確認 ----------

export const deployConnection = {
  id: "con-gha-deploy",
  name: "GitHub Actions（配備専用）",
  scope: "sample-soft/order-api・order-web の workflow_dispatch: deploy-production のみ",
  note: "読取用の連携（con-gh）とは別の接続。配備の起動だけを許可",
};

export type DeployStep = { name: string; state: "waiting" | "running" | "ok" | "failed" | "skipped"; at?: string; detail?: string };

export function deploySteps(variant: string): DeployStep[] {
  const done = variant === "succeeded";
  const running = variant === "running" || variant === "unconfirmed";
  return [
    { name: "起動依頼（冪等キー PMT-0007）", state: variant === "default" ? "waiting" : "ok", at: variant === "default" ? undefined : "2026-12-17T22:00:04+09:00", detail: variant === "default" ? "時間枠の開始を待っています" : "外部の実行ID gh-run-99830011" },
    { name: "order-api の配備", state: variant === "default" ? "waiting" : "ok", at: variant === "default" ? undefined : "2026-12-17T22:07:41+09:00" },
    { name: "order-web の配備", state: variant === "default" ? "waiting" : running ? "running" : "ok", at: done ? "2026-12-17T22:12:10+09:00" : undefined },
    { name: "ヘルスチェック", state: done ? "ok" : "waiting", at: done ? "2026-12-17T22:14:02+09:00" : undefined },
    { name: "外部の実行結果との照合", state: done ? "ok" : variant === "unconfirmed" ? "running" : "waiting", at: done ? "2026-12-17T22:14:30+09:00" : undefined, detail: variant === "unconfirmed" ? "完了通知が 15 分届いていません。実行ID で外部の結果を照会しています" : done ? "外部の結果: success（実行ID gh-run-99830011）" : undefined },
  ];
}

// ---------- L-09 配備失敗・切戻し ----------

export const failureSummary = {
  at: "2026-12-17T22:11:52+09:00",
  failed_step: "order-web の配備",
  succeeded: ["order-api（v1.4.0）"],
  stopped: ["ヘルスチェック", "顧客への完了通知", "受入依頼の送付"],
  previous: "v1.3.0（order-web 7e21c0d / order-api 5b8f2aa）",
  impact: "受注一覧の CSV 出力ボタンが表示されない。受注・発注の業務は継続可能",
  owner_id: "u-watanabe",
  procedure: "RB-03（承認済み 2026-11-20・リリース責任者と CTO）",
};

export const customerFollowUps = [
  { id: "FU-1", at: "2026-12-17T22:25:00+09:00", text: "第1報: 本日の更新の一部が完了せず、前の版に戻す作業を行っています。業務への影響は CSV 出力が使えないことのみです。", state: "sent" as const, approved_by: "u-kimura" },
  { id: "FU-2", at: "2026-12-17T23:30:00+09:00", text: "第2報: 前の版への切戻しが完了し、動作を確認しました。再実施日は改めてご連絡します。", state: "scheduled" as const, approved_by: undefined },
];

// ---------- V-09 取引の証跡 ----------

export type ChainStep = {
  key: string;
  label: string;
  state: "recorded" | "missing" | "pending";
  actor?: string;
  version?: string;
  original?: string;
  at?: string;
  corrections?: string;
  note?: string;
};

export const tradeChains: Record<string, ChainStep[]> = {
  "ORD-0101": [
    { key: "order", label: "発注版", state: "recorded", actor: "u-kimura", version: "ORD-0101 v2", original: fakeSha("ord-0101-v2"), at: "2026-11-17T15:00:00+09:00", corrections: "v1（報酬40万円）→ v2（45万円・6列目を対象外に明記）" },
    { key: "accept", label: "受諾", state: "recorded", actor: "u-matsuda", version: "v2 に対する受諾", original: fakeSha("acc-0101"), at: "2026-11-18T11:20:00+09:00" },
    { key: "submit", label: "提出", state: "recorded", actor: "u-matsuda", version: "SUB-0101-1（9f3c2a1）", original: fakeSha("sub-0101-1"), at: "2026-11-27T09:20:00+09:00", corrections: "注意点の追記（11/27 09:31、受託者本人）" },
    { key: "verify", label: "検証", state: "pending", actor: "u-ito", version: "gh-run-99820001（同じコミット）", at: "2026-11-27T09:35:00+09:00", note: "性能試験（TC-0153）が未取得" },
    { key: "inspect", label: "委託検収", state: "missing", note: "検収者 伊藤 誠の判断待ち（期限 12/5）" },
    { key: "release", label: "リリース", state: "pending", version: "RC-140-2", note: "実行許可 PMT-0007 は経営判断待ち" },
    { key: "acceptance", label: "顧客受入", state: "missing", note: "配備確認後に窓口が依頼" },
  ],
  "ORD-0104": [
    { key: "order", label: "発注版", state: "recorded", actor: "u-mori", version: "ORD-0104 v1", original: fakeSha("ord-0104-v1"), at: "2026-09-29T10:00:00+09:00" },
    { key: "accept", label: "受諾", state: "recorded", actor: "u-matsuda", version: "v1 に対する受諾", original: fakeSha("acc-0104"), at: "2026-10-01T10:00:00+09:00" },
    { key: "submit", label: "提出", state: "recorded", actor: "u-matsuda", version: "SUB-0104-1（1a2b3c4）", original: fakeSha("sub-0104-1"), at: "2026-10-30T18:00:00+09:00" },
    { key: "verify", label: "検証", state: "recorded", actor: "u-ito", version: "gh-run-99710455", original: fakeSha("ver-0104"), at: "2026-11-01T11:00:00+09:00" },
    { key: "inspect", label: "委託検収", state: "recorded", actor: "u-ito", version: "検収 INS-0104", original: fakeSha("ins-0104"), at: "2026-11-05T15:00:00+09:00" },
    { key: "release", label: "リリース", state: "recorded", actor: "u-watanabe", version: "v0.9.0（配備確認済み）", original: fakeSha("rel-090"), at: "2026-11-10T22:30:00+09:00" },
    { key: "acceptance", label: "顧客受入", state: "recorded", actor: "u-fujii", version: "v0.9.0", original: fakeSha("cacc-090"), at: "2026-11-14T16:00:00+09:00" },
  ],
};

export const aiDraftsExcluded = [
  { id: "AID-31", title: "顧客向けリリース説明の下書き（v1.4.0）", note: "AI の下書き。合意の証拠に数えない（窓口が確認して送付した版のみ記録）" },
  { id: "AID-29", title: "INQ-0031 への回答案", note: "AI の回答案。顧客が確認した回答（MTG-12）を証拠にする" },
];

// ---------- J-12 運用の引受 ----------

export const operationsHandover = {
  operator: "架空商事株式会社 情報システム部（一次窓口）／サンプルソフト株式会社 保守窓口（二次）",
  maintenance: { start: "2027-04-01", end: "2028-03-31", contract: "保守契約 MNT-2027-01" },
  oncall: "PagerDuty の「受発注 API」当番表（サンプルソフト 保守チーム）。元の受託者は自動で当番にしない",
  inquiries: "終了後の照会は案件窓口（desk@product.example）が受け付け、対象版と運用担当を特定して回します",
};

export const handoverAcceptances = [
  { item: "運用手順書（v1.4.0 対応）", from: "u-watanabe", to: "架空商事 情報システム部（野口 舞）", state: "accepted" as const, at: "2027-03-10" },
  { item: "障害時の連絡先と当番表", from: "u-watanabe", to: "サンプルソフト 保守チーム", state: "accepted" as const, at: "2027-03-10" },
  { item: "既知問題と回避策（BUG-031 ほか）", from: "u-aoki", to: "架空商事 情報システム部", state: "pending" as const, at: undefined },
  { item: "監視とアラートの設定", from: "u-watanabe", to: "架空商事 情報システム部", state: "pending" as const, at: undefined },
];

export const unsettledTrades = [
  { order_id: "ORD-0101", title: "受注一覧の CSV 出力", state: "支払予定（12/31）・検収中", owner: "u-aoki" },
  { order_id: "ORD-0102", title: "取引先マスタの CSV 一括取込", state: "未提出・未検収", owner: "u-aoki" },
];

export const knownIssuesForOps = [
  { id: "BUG-031", title: "同じ日付の並び順が画面と CSV で異なる", severity: "低", workaround: "受注番号で並べ替える" },
];
