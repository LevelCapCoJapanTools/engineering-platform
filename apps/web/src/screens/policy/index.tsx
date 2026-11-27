import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { PackList } from "./C01_PackList";
import { PackDetail } from "./C02_PackDetail";
import { TailoringScreen } from "./C03_Tailoring";
import { PolicyDiff } from "./C04_PolicyDiff";
import { MigrationReport } from "./C05_MigrationReport";

const group = "6.9 ポリシーと Control Pack";

export const policyScreens: ScreenDef[] = [
  { id: "C-01", title: "Control Pack 一覧", path: paths.policies(":org"), group, priority: "Must", states: ["default", "loading", "empty", "error"], render: (p) => <PackList org={p.org} /> },
  { id: "C-02", title: "Control Pack の詳細", path: paths.policy(":org", ":pack"), group, priority: "Must", states: ["default", "loading"], render: (p) => <PackDetail org={p.org} pack={p.pack} /> },
  { id: "C-03", title: "組織での調整（テーラリング）", path: paths.tailoring(":org", ":pack"), group, priority: "Should", states: ["default", "approver", "sod", "empty"], render: (p) => <TailoringScreen org={p.org} pack={p.pack} /> },
  { id: "C-04", title: "ポリシーのバージョン比較", path: paths.policyDiff(":org", ":pack"), group, priority: "Should", states: ["default", "noDiff"], render: (p) => <PolicyDiff org={p.org} pack={p.pack} /> },
  { id: "C-05", title: "移行レポート", path: paths.migration(":org", ":pack", ":id"), group, priority: "Later", states: ["default", "approved", "running", "done"], render: (p) => <MigrationReport org={p.org} pack={p.pack} id={p.id} /> },
];
