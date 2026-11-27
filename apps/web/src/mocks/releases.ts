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
