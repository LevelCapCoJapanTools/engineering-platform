// リリースと受入の画面用の架空データ。
import { fakeSha } from "./core";
import type { ChecklistItem, TimelineItem } from "../ui";

export type Artifact = { name: string; sha256: string; signature: "unsigned" | "signed" | "verified" | "failed"; sbom: boolean; size: string };

export function releaseChecklist(ready: boolean): ChecklistItem[] {
  return [
    { id: "c1", title: "必要な文書がそろっている", state: "ok", detail: "納入物一覧、リリースノート、テスト報告", actor: "ci" },
    { id: "c2", title: "承認済み要求のテストがすべて成功", state: ready ? "ok" : "ng", detail: ready ? "38/38 件成功" : "TC-0110 が失敗、REQ-0003 と REQ-0006 にテストがありません", actor: "ci" },
    { id: "c3", title: "未解決の変更要求がない", state: ready ? "ok" : "ng", detail: ready ? "0件" : "CR-0004 が影響分析中", actor: "ci" },
    { id: "c4", title: "有効な例外を確認した", state: ready ? "ok" : "pending", detail: "EXC-0006, EXC-0007（PM の確認が必要）", actor: "human" },
    { id: "c5", title: "成果物が署名されている", state: ready ? "ok" : "pending", detail: ready ? "3/3 件署名済み" : "リリースゲート通過後に署名します", actor: "ci" },
    { id: "c6", title: "ゲート A〜D を通過", state: ready ? "ok" : "ng", detail: ready ? "run-5840 で通過" : "ゲートB がブロック（run-5800）", actor: "ci" },
  ];
}

export function artifacts(signed: boolean): Artifact[] {
  const sig = signed ? "verified" : "unsigned";
  return [
    { name: "order-api-1.4.0.tar.gz", sha256: fakeSha("art-api-140"), signature: sig, sbom: true, size: "18.4 MB" },
    { name: "order-web-1.4.0.zip", sha256: fakeSha("art-web-140"), signature: sig, sbom: true, size: "6.1 MB" },
    { name: "release-notes-1.4.0.pdf", sha256: fakeSha("art-notes-140"), signature: sig, sbom: false, size: "220 KB" },
  ];
}

export const includedChanges = [
  { kind: "要求", id: "REQ-0008", title: "発注書を PDF で出力できる" },
  { kind: "要求", id: "REQ-0003", title: "発注データを基幹システムへ連携する" },
  { kind: "変更要求", id: "CR-0002", title: "発注書 PDF に社印を入れる" },
  { kind: "PR", id: "#135", title: "PDF 帳票の生成" },
  { kind: "PR", id: "#139", title: "PDF 帳票のフォントを差し替え" },
  { kind: "PR", id: "#140", title: "基幹連携バッチの再送処理" },
];

export const knownIssues = [
  { id: "BUG-031", title: "PDF の2ページ目以降でヘッダーの社印が小さく表示される", severity: "低" },
];

export const releaseNotes = `## v1.4.0 の変更点

- 発注書を所定の様式で PDF 出力できるようになりました（社印の画像を含められます）
- 基幹システムへの連携に失敗した場合、翌日に自動で再送します

## 既知の問題

- PDF の2ページ目以降でヘッダーの社印が小さく表示されます（BUG-031）`;

export const acceptanceTimeline: TimelineItem[] = [
  { id: "a1", actor: { kind: "human", name: "渡辺 翔" }, action: "リリースを承認", target: "v1.2.1", at: "2026-10-20T17:50:00+09:00" },
  { id: "a2", actor: { kind: "system", name: "Signer" }, action: "Manifest に署名", target: "MAN-0012", at: "2026-10-20T18:05:00+09:00" },
  { id: "a3", actor: { kind: "human", name: "佐藤 美咲" }, action: "受入を依頼", target: "中村 拓也", at: "2026-11-20T10:00:00+09:00" },
  { id: "a4", actor: { kind: "human", name: "中村 拓也" }, action: "受入画面を閲覧", at: "2026-11-26T15:10:00+09:00" },
];

/** リリースの Go/No-Go の判断基準（L-02）。根拠と条件を記録する */
export function goNoGoCriteria(ready: boolean) {
  return [
    { id: "g1", title: "リリースゲート（A〜D）を通過", state: ready ? "ok" : "ng", basis: ready ? "run-5840" : "run-5800 でゲートB がブロック" },
    { id: "g2", title: "重大度・高以上の未解決の不具合がない", state: "ok", basis: "BUG-031（低）のみ。既知の問題としてリリースノートに記載" },
    { id: "g3", title: "有効な例外の期限がリリース後も残らない", state: ready ? "ok" : "pending", basis: "EXC-0007 の期限 12/3（延長申請 EXC-0009 が審議中）" },
    { id: "g4", title: "切戻し手順が確認済み", state: ready ? "ok" : "pending", basis: "リリース管理者の確認記録" },
    { id: "g5", title: "顧客への影響と説明の要否が判断済み", state: "pending", basis: "納入予測の後ろ倒し（DEC-0033）が判断待ち" },
  ] as { id: string; title: string; state: "ok" | "ng" | "pending"; basis: string }[];
}

/** 事後レビュー（リリース済みのとき） */
export const postReview = {
  held_at: "2026-11-12T16:00:00+09:00",
  good: ["リリースゲートの未充足が 0 件で当日に承認できた", "顧客の受入が 7 日で完了した"],
  issues: ["受入依頼のリマインドを手動で送った", "SBOM の生成を手作業で再実行した"],
  actions: [
    { title: "受入依頼の自動リマインド（3 日後）を通知ルールに追加", owner: "u-sato", due: "2026-12-05", done: false },
    { title: "SBOM の生成をリリースワークフローに組み込む", owner: "u-watanabe", due: "2026-11-30", done: true },
  ],
};

/** 受入条件と差戻し・再提出の履歴（L-03） */
export const acceptanceCriteria = [
  { id: "ac1", title: "納入物のハッシュが一覧と一致する", state: "ok" as const },
  { id: "ac2", title: "受入テスト（UAT-01〜08）が成功", state: "ok" as const },
  { id: "ac3", title: "検索結果の並び順が仕様どおり", state: "pending" as const },
  { id: "ac4", title: "操作マニュアルの更新", state: "pending" as const },
];

export const resubmissions = [
  { version: "v1.2.0", submitted_at: "2026-10-01T10:00:00+09:00", result: "returned" as const, reason: "CSV 出力の文字化け", digest: fakeSha("art-120") },
  { version: "v1.2.1", submitted_at: "2026-11-20T10:00:00+09:00", result: "pending" as const, reason: "差戻し理由を修正して再提出", digest: fakeSha("art-121") },
];
