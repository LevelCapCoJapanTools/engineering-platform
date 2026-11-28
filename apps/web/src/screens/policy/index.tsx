import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { PackList } from "./C01_PackList";
import { PackDetail } from "./C02_PackDetail";
import { TailoringScreen } from "./C03_Tailoring";
import { PolicyDiff } from "./C04_PolicyDiff";
import { MigrationReport } from "./C05_MigrationReport";
import { ScopeScreen } from "./C06_Scope";
import { SourcesScreen } from "./C07_Sources";
import { ReviewsScreen } from "./C08_Reviews";

const group = "6.9 ポリシーと Control Pack";

export const policyScreens: ScreenDef[] = [
  { id: "C-01", title: "Control Pack 一覧", path: paths.policies(":org"), group, priority: "Must", states: ["default", "loading", "empty", "error"], render: (p) => <PackList org={p.org} /> },
  { id: "C-02", title: "Control Pack の詳細", path: paths.policy(":org", ":pack"), group, priority: "Must", states: ["default", "loading"], render: (p) => <PackDetail org={p.org} pack={p.pack} /> },
  { id: "C-03", title: "組織での調整（テーラリング）", path: paths.tailoring(":org", ":pack"), group, priority: "Must", states: ["default", "approver", "sod", "empty"], render: (p) => <TailoringScreen org={p.org} pack={p.pack} /> },
  { id: "C-04", title: "ポリシーのバージョン比較", path: paths.policyDiff(":org", ":pack"), group, priority: "Should", states: ["default", "noDiff"], render: (p) => <PolicyDiff org={p.org} pack={p.pack} /> },
  { id: "C-05", title: "移行レポート", path: paths.migration(":org", ":pack", ":id"), group, priority: "Should", states: ["default", "approved", "running", "done"], render: (p) => <MigrationReport org={p.org} pack={p.pack} id={p.id} /> },
  { id: "C-06", title: "適用範囲の確認", path: paths.packScope(":org", ":pack"), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: (p) => <ScopeScreen org={p.org} pack={p.pack} /> },
  { id: "C-07", title: "出典と利用許諾", path: paths.packSources(":org", ":pack"), group, priority: "Must", states: ["default", "loading", "error"], render: (p) => <SourcesScreen org={p.org} pack={p.pack} /> },
  { id: "C-08", title: "Control Pack のレビュー記録", path: paths.packReviews(":org", ":pack"), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: (p) => <ReviewsScreen org={p.org} pack={p.pack} /> },
];
