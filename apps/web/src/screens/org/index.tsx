import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Dashboard } from "./O01_Dashboard";
import { Inbox } from "./O02_Inbox";
import { Notifications } from "./O03_Notifications";
import { Projects } from "./O04_Projects";
import { ProjectNew } from "./O05_ProjectNew";
import { Search } from "./O06_Search";

const group = "6.3 組織の画面";
const org = ":org";

export const orgScreens: ScreenDef[] = [
  { id: "O-01", title: "経営ダッシュボード", path: paths.orgHome(org), group, priority: "Must", states: ["default", "stale", "aiDisabled", "empty", "loading", "error"], render: () => <Dashboard /> },
  { id: "O-02", title: "経営判断（受信箱）", path: paths.inbox(org), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: () => <Inbox /> },
  { id: "O-03", title: "通知", path: paths.notifications(org), group, priority: "Should", states: ["default", "empty", "loading", "error"], render: () => <Notifications /> },
  { id: "O-04", title: "プロジェクト一覧", path: paths.projects(org), group, priority: "Must", states: ["default", "stale", "filtered", "empty", "loading", "error"], render: () => <Projects /> },
  { id: "O-05", title: "プロジェクトの作成", path: paths.projectNew(org), group, priority: "Must", states: ["default", "error", "sod", "noCase"], render: () => <ProjectNew /> },
  { id: "O-06", title: "横断検索", path: paths.search(org), group, priority: "Should", states: ["default", "initial", "scoped", "empty", "loading", "error"], render: () => <Search /> },
];
