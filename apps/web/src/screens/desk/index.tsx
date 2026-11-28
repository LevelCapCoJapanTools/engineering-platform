// 画面群: 6.19 案件窓口（2026-11-28 追補）
// 利用者は案件窓口（サービスの担当者）。顧客・受託者・JV の間に立ち、往復・対外送信・再合意・期限・週報を引き受ける。
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { DeskInbox } from "./H01_DeskInbox";
import { InquiryThread } from "./H02_InquiryThread";
import { OutboundScreen } from "./H03_Outbound";
import { ChangeAgreementScreen } from "./H04_ChangeAgreement";
import { Assignments } from "./H05_Assignments";
import { Reports } from "./H06_Reports";

const group = "6.19 案件窓口";
const org = ":org";

export const deskScreens: ScreenDef[] = [
  { id: "H-01", title: "窓口の受信箱", path: paths.desk(org), group, priority: "Must", states: ["通常", "AI停止中", "空", "読み込み中", "エラー"], render: () => <DeskInbox /> },
  { id: "H-03", title: "対外送信の承認と配信結果", path: paths.deskOutbound(org), group, priority: "Must", states: ["通常", "再承認が必要", "配信失敗", "空", "読み込み中", "エラー"], render: () => <OutboundScreen /> },
  { id: "H-05", title: "担当・代理・応答期限", path: paths.deskAssignments(org), group, priority: "Must", states: ["通常", "代理へ移行", "休業日", "読み込み中", "エラー"], render: () => <Assignments /> },
  { id: "H-06", title: "相手別の週報", path: paths.deskReports(org), group, priority: "Should", states: ["顧客向け", "上層部向け", "受託者向け", "AI無効", "読み込み中", "エラー"], render: () => <Reports /> },
  { id: "H-02", title: "問い合わせの往復", path: paths.deskInquiry(org, ":id"), group, priority: "Must", states: ["回答案あり", "受託者への回答", "顧客返信を取り込み", "根拠不足（確認質問）", "社内情報の混入を検出", "回答済み", "AI停止中", "読み込み中", "エラー"], render: (p) => <InquiryThread key={p.id} id={p.id} /> },
  { id: "H-04", title: "変更条件の再合意", path: paths.deskChange(org, ":id"), group, priority: "Must", states: ["顧客のみ合意", "受託者が相談中", "両者合意", "経営判断が必要", "読み込み中", "エラー"], render: (p) => <ChangeAgreementScreen key={p.id} id={p.id} /> },
];
