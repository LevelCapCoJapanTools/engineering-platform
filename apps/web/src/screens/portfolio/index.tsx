// 画面群: 6.15 経営: 投資と配分（2026-11-28 追加）
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Intake } from "./M04_Intake";
import { IntakeNew } from "./M05_IntakeNew";
import { BusinessCaseDetail } from "./M06_BusinessCase";
import { Priorities } from "./M07_Priorities";
import { Capacity } from "./M08_Capacity";
import { Roadmap } from "./M09_Roadmap";
import { Benefits } from "./M10_Benefits";
import { BenefitDetail } from "./M11_BenefitDetail";
import { ExecSchedule } from "./M12_ExecSchedule";

const group = "6.15 経営: 投資と配分";
const org = ":org";

export const portfolioScreens: ScreenDef[] = [
  { id: "M-04", title: "案件受付", path: paths.intake(org), group, priority: "Must", states: ["default", "filtered", "empty", "loading", "error"], render: () => <Intake /> },
  { id: "M-05", title: "事業ケースの作成", path: paths.intakeNew(org), group, priority: "Must", states: ["default", "filled", "missing", "submitted"], render: () => <IntakeNew /> },
  { id: "M-06", title: "事業ケースの詳細・判断", path: paths.businessCase(org, ":id"), group, priority: "Must", states: ["default", "reviewing", "approved", "onHold", "rejected", "forbidden", "loading", "error"], render: (p) => <BusinessCaseDetail key={p.id} id={p.id} /> },
  { id: "M-07", title: "優先順位とシナリオ比較", path: paths.priorities(org), group, priority: "Must", states: ["default", "scenario", "changed", "empty", "loading", "error"], render: () => <Priorities /> },
  { id: "M-08", title: "要員・予算の配分", path: paths.capacity(org), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: () => <Capacity /> },
  { id: "M-09", title: "戦略ロードマップ", path: paths.roadmap(org), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: () => <Roadmap /> },
  { id: "M-10", title: "便益・成果", path: paths.benefits(org), group, priority: "Should", states: ["default", "empty", "loading", "error"], render: () => <Benefits /> },
  { id: "M-11", title: "便益の詳細", path: paths.benefit(org, ":id"), group, priority: "Should", states: ["default", "notMeasured", "loading", "error"], render: (p) => <BenefitDetail key={p.id} id={p.id} /> },
  { id: "M-12", title: "経営スケジュール", path: paths.execSchedule(org), group, priority: "Must", states: ["default", "list", "stale", "empty", "loading", "error"], render: () => <ExecSchedule /> },
];
