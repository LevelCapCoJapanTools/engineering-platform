// 画面群: 6.17 通知とオンコール（2026-11-28 追加）
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { N01Channels } from "./N01_Channels";
import { N02Channel } from "./N02_Channel";
import { N03Rules } from "./N03_Rules";
import { N04DeliveryLog } from "./N04_DeliveryLog";
import { N05Oncall } from "./N05_Oncall";
import { N06Incidents } from "./N06_Incidents";
import { N07Incident } from "./N07_Incident";
import { N08Escalation } from "./N08_Escalation";
import { N09ChatCards } from "./N09_ChatCards";

const group = "6.17 通知とオンコール";
const org = ":org";

export const notifyScreens: ScreenDef[] = [
  { id: "N-01", title: "通知チャネル", path: paths.channels(org), group, priority: "Must", states: ["通常", "未接続", "読み込み中", "エラー"], render: () => <N01Channels /> },
  { id: "N-02", title: "チャネルの追加・詳細", path: paths.channel(org, ":id"), group, priority: "Must", states: ["通常", "追加", "送信専用", "配信失敗", "自己ホスト", "Chatwork", "読み込み中", "エラー"], render: () => <N02Channel /> },
  { id: "N-03", title: "通知ルール", path: paths.notifyRules(org), group, priority: "Must", states: ["通常", "静穏時間中", "ルールなし", "読み込み中", "エラー"], render: () => <N03Rules /> },
  { id: "N-04", title: "配信ログ", path: paths.notifyLog(org), group, priority: "Must", states: ["通常", "再処理待ち", "空", "読み込み中", "エラー"], render: () => <N04DeliveryLog /> },
  { id: "N-05", title: "オンコール当番", path: paths.oncall(org), group, priority: "Should", states: ["通常", "提供元の障害", "未接続", "読み込み中", "エラー"], render: () => <N05Oncall /> },
  { id: "N-06", title: "インシデント一覧", path: paths.incidents(org), group, priority: "Should", states: ["通常", "空", "読み込み中", "エラー"], render: () => <N06Incidents /> },
  { id: "N-07", title: "インシデント詳細", path: paths.incident(org, ":id"), group, priority: "Should", states: ["通常", "未受領（エスカレーション中）", "受領済み", "解決", "配信失敗", "当番として操作", "読み込み中", "エラー"], render: () => <N07Incident /> },
  { id: "N-08", title: "エスカレーションと訓練", path: paths.escalation(org), group, priority: "Should", states: ["通常", "期限切れあり", "訓練なし", "読み込み中", "エラー"], render: () => <N08Escalation /> },
  { id: "N-09", title: "チャットでの表示", path: paths.chatCards(), group, priority: "Should", states: ["経営判断の依頼", "受託者への依頼", "顧客への申請", "インシデント", "同期の停止", "マイルストーンの遅延"], render: () => <N09ChatCards /> },
];
