// 画面群: 6.21 顧客への公開と共同経営（2026-11-28 追補）
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { RelationshipScreen } from "./U01_Relationship";
import { DisclosureScreen } from "./U02_Disclosure";
import { PreviewScreen } from "./U03_Preview";
import { DisclosureHistoryScreen } from "./U04_History";
import { JointFinanceScreen } from "./U05_JointFinance";
import { PortalJointScreen } from "./X16_PortalJoint";

const group = "6.21 顧客への公開と共同経営";

export const disclosureScreens: ScreenDef[] = [
  { id: "U-01", title: "顧客企業と案件の関係", path: paths.relationship(":org", ":project"), group, priority: "Must", states: ["default", "invited", "empty", "loading", "error"], render: (p) => <RelationshipScreen org={p.org} project={p.project} /> },
  { id: "U-02", title: "顧客への公開設定", path: paths.disclosure(":org", ":project"), group, priority: "Must", states: ["default", "alliance", "empty", "forbidden", "loading", "error"], render: (p) => <DisclosureScreen org={p.org} project={p.project} /> },
  { id: "U-03", title: "顧客目線のプレビューと公開版の確定", path: paths.disclosurePreview(":org", ":project"), group, priority: "Must", states: ["default", "alliance", "detected", "loading", "error"], render: (p) => <PreviewScreen org={p.org} project={p.project} /> },
  { id: "U-04", title: "公開停止と配信履歴", path: paths.disclosureHistory(":org", ":project"), group, priority: "Must", states: ["default", "stopped", "allianceEnded", "empty", "loading", "error"], render: (p) => <DisclosureHistoryScreen org={p.org} project={p.project} /> },
  { id: "U-05", title: "共同事業の収支・決裁（受注側）", path: paths.jointFinance(":org", ":project"), group, priority: "Should", states: ["default", "overLimit", "internalDetail", "outsourcing", "loading", "error"], render: (p) => <JointFinanceScreen org={p.org} project={p.project} /> },
  { id: "X-16", title: "共同事業の収支・決裁（顧客側）", path: paths.portalJoint(":project"), group, priority: "Should", states: ["default", "viewer", "ended", "loading", "error"], render: (p) => <PortalJointScreen project={p.project} /> },
];
