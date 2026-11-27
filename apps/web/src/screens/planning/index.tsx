import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { LIST_STATES } from "./shared";
import { J01Overview } from "./J01_Overview";
import { J02SowDetail, J02SowList, J02_DETAIL_STATES, J02_LIST_STATES } from "./J02_Sow";
import { J03Plan, J03_STATES } from "./J03_Plan";
import { J04Progress, J04_STATES } from "./J04_Progress";
import { J05Risks, J05_STATES } from "./J05_Risks";
import { J06RiskDetail, J06_STATES } from "./J06_RiskDetail";
import { J07Changes, J07_STATES } from "./J07_Changes";
import { J08ChangeDetail, J08_STATES } from "./J08_ChangeDetail";
import { J09MeetingDetail, J09MeetingList, J09_DETAIL_STATES } from "./J09_Meetings";

const G = "6.4 プロジェクト: 計画と管理";
const O = ":org";
const P = ":project";
const I = ":id";

export const planningScreens: ScreenDef[] = [
  { id: "J-01", title: "プロジェクト概要", path: paths.project(O, P), group: G, priority: "Must", states: ["既定", "読み込み中", "取得失敗"], render: (p) => <J01Overview params={p} /> },
  { id: "J-02", title: "SOW の一覧・詳細", path: paths.sow(O, P), group: G, priority: "Must", states: J02_LIST_STATES, render: (p) => <J02SowList params={p} /> },
  { id: "J-02", title: "SOW の詳細", path: paths.sowDetail(O, P, I), group: G, priority: "Must", states: J02_DETAIL_STATES, render: (p) => <J02SowDetail params={p} /> },
  { id: "J-03", title: "プロジェクト計画", path: paths.plan(O, P), group: G, priority: "Must", states: J03_STATES, render: (p) => <J03Plan params={p} /> },
  { id: "J-04", title: "進捗", path: paths.progress(O, P), group: G, priority: "Should", states: J04_STATES, render: (p) => <J04Progress params={p} /> },
  { id: "J-05", title: "リスク・是正の一覧", path: paths.risks(O, P), group: G, priority: "Must", states: J05_STATES, render: (p) => <J05Risks params={p} /> },
  { id: "J-06", title: "リスク・是正の詳細", path: paths.risk(O, P, I), group: G, priority: "Must", states: J06_STATES, render: (p) => <J06RiskDetail params={p} /> },
  { id: "J-07", title: "変更要求の一覧", path: paths.changes(O, P), group: G, priority: "Must", states: J07_STATES, render: (p) => <J07Changes params={p} /> },
  { id: "J-08", title: "変更要求の詳細", path: paths.change(O, P, I), group: G, priority: "Must", states: J08_STATES, render: (p) => <J08ChangeDetail params={p} /> },
  { id: "J-09", title: "議事録", path: paths.meetings(O, P), group: G, priority: "Should", states: LIST_STATES, render: (p) => <J09MeetingList params={p} /> },
  { id: "J-09", title: "議事録の詳細", path: paths.meeting(O, P, I), group: G, priority: "Should", states: J09_DETAIL_STATES, render: (p) => <J09MeetingDetail params={p} /> },
];
