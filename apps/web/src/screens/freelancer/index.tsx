// 画面群: 6.18 フリーエンジニア（2026-11-28 追補）
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { F01Invite } from "./F01_Invite";
import { F02Home } from "./F02_Home";
import { F03OrderDetail } from "./F03_OrderDetail";
import { F04Questions } from "./F04_Questions";
import { F05Submit } from "./F05_Submit";
import { F06Result } from "./F06_Result";
import { F07History } from "./F07_History";

const group = "6.18 フリーエンジニア";

export const freelancerScreens: ScreenDef[] = [
  { id: "F-01", title: "招待・利用開始", path: paths.freelancerInvite(":token"), group, priority: "Must", states: ["本人確認前", "コード送信済み", "確認済み", "期限切れ", "別人（転送先）", "契約終了で失効"], render: () => <F01Invite /> },
  { id: "F-02", title: "自分への依頼", path: paths.freelancerHome(), group, priority: "Must", states: ["通常", "依頼元を切替", "初回0件", "読み込み中", "読み込み失敗"], render: () => <F02Home /> },
  { id: "F-03", title: "依頼詳細・条件", path: paths.freelancerOrder(":id"), group, priority: "Must", states: ["表示中の依頼", "回答待ち", "受諾済み", "旧版を表示中", "相談中", "辞退", "条件未確定"], render: (p) => <F03OrderDetail key={p.id} /> },
  { id: "F-04", title: "質問と回答", path: paths.freelancerQuestions(), group, priority: "Must", states: ["通常", "質問を作成", "作業停止の連絡", "回答済みを表示", "空"], render: () => <F04Questions /> },
  { id: "F-05", title: "成果の提出", path: paths.freelancerSubmit(":id"), group, priority: "Must", states: ["入力中", "参照を取込済み", "提出済み（控え）", "連携障害（確認待ち）", "下書きを復元", "セッション切れ"], render: (p) => <F05Submit key={p.id} /> },
  { id: "F-06", title: "提出結果・修正", path: paths.freelancerResult(":id"), group, priority: "Must", states: ["検収中", "一部検収（分納）", "差戻し（範囲内の修正）", "範囲外の要望", "検収済み"], render: (p) => <F06Result key={p.id} /> },
  { id: "F-07", title: "取引履歴", path: paths.freelancerHistory(), group, priority: "Must", states: ["通常", "不一致を照会", "依頼元を切替", "空"], render: () => <F07History /> },
];
