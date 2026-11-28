// 画面群: 6.14 経営: ダッシュボードと判断（2026-11-28 追加）
// O-01（経営ダッシュボード）と O-02（経営判断）は org 画面群に登録している。
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Portfolio } from "./M01_Portfolio";
import { DecisionDetail } from "./M02_DecisionDetail";
import { DecisionLog } from "./M03_DecisionLog";

const group = "6.14 経営: ダッシュボードと判断";
const org = ":org";

export const executiveScreens: ScreenDef[] = [
  { id: "M-01", title: "ポートフォリオ", path: paths.portfolio(org), group, priority: "Must", states: ["default", "filtered", "empty", "loading", "error"], render: () => <Portfolio /> },
  { id: "M-03", title: "判断ログ", path: paths.decisions(org), group, priority: "Must", states: ["default", "filtered", "empty", "loading", "error"], render: () => <DecisionLog /> },
  { id: "M-02", title: "経営判断の詳細", path: paths.decision(org, ":id"), group, priority: "Must", states: ["default", "decided", "conditional", "delegated", "rejected", "sod", "forbidden", "loading", "error"], render: (p) => <DecisionDetail key={p.id} id={p.id} /> },
];
