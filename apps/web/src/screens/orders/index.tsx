// 画面群: 6.20 受託者への発注と採算（2026-11-28 追補）
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { B01Orders } from "./B01_Orders";
import { B02OrderNew } from "./B02_OrderNew";
import { B03OrderDetail } from "./B03_OrderDetail";
import { B04Partners } from "./B04_Partners";
import { B05Settlements } from "./B05_Settlements";
import { B06WorkBreakdown } from "./B06_WorkBreakdown";
import { B07ProjectCost } from "./B07_ProjectCost";

const group = "6.20 受託者への発注と採算";

export const orderScreens: ScreenDef[] = [
  { id: "B-01", title: "受託者への発注", path: paths.orders(":org"), group, priority: "Must", states: ["default", "filtered", "empty", "loading", "error"], render: () => <B01Orders /> },
  { id: "B-02", title: "依頼書の作成", path: paths.orderNew(":org"), group, priority: "Must", states: ["default", "missing", "onHold", "aiDraft", "issued"], render: () => <B02OrderNew /> },
  { id: "B-03", title: "発注の詳細", path: paths.order(":org", ":id"), group, priority: "Must", states: ["default", "asInspector", "returned", "partial", "offered", "loading", "error"], render: (p) => <B03OrderDetail key={p.id} id={p.id} /> },
  { id: "B-04", title: "外注候補と稼働枠", path: paths.partners(":org"), group, priority: "Should", states: ["default", "released", "empty", "loading", "error"], render: () => <B04Partners /> },
  { id: "B-05", title: "発注・検収・請求・支払の照合", path: paths.settlements(":org"), group, priority: "Should", states: ["default", "import", "empty", "loading", "error"], render: () => <B05Settlements /> },
  { id: "B-06", title: "委託単位への分解", path: paths.workBreakdown(":org", ":project"), group, priority: "Should", states: ["default", "aiProposal", "preview", "empty", "loading", "error"], render: () => <B06WorkBreakdown /> },
  { id: "B-07", title: "外注原価・粗利見込", path: paths.projectCost(":org", ":project"), group, priority: "Should", states: ["default", "withChange", "asOf", "empty", "loading", "error"], render: () => <B07ProjectCost /> },
];
