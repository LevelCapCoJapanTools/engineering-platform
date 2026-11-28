import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { ReleasesScreen } from "./L01_Releases";
import { ReleaseDetailScreen } from "./L02_ReleaseDetail";
import { AcceptanceScreen } from "./L03_Acceptance";
import { BaselinesScreen } from "./L04_Baselines";

const GROUP = "6.7 プロジェクト: リリースと受入";

export const releaseScreens: ScreenDef[] = [
  { id: "L-01", title: "リリース一覧", path: paths.releases(":org", ":project"), group: GROUP, priority: "Must", states: ["default", "loading", "empty", "error"], render: (p) => <ReleasesScreen org={p.org} project={p.project} /> },
  { id: "L-02", title: "リリース詳細・リリースゲート", path: paths.release(":org", ":project", ":id"), group: GROUP, priority: "Must", states: ["default", "ready", "decided", "released"], render: (p) => <ReleaseDetailScreen org={p.org} project={p.project} id={p.id} /> },
  { id: "L-03", title: "受入の状況", path: paths.acceptance(":org", ":project", ":id"), group: GROUP, priority: "Must", states: ["default", "notRequested", "accepted", "returned"], render: (p) => <AcceptanceScreen org={p.org} project={p.project} id={p.id} /> },
  { id: "L-04", title: "構成管理・ベースライン", path: paths.baselines(":org", ":project"), group: GROUP, priority: "Must", states: ["default", "approved", "compare", "loading", "empty", "error"], render: (p) => <BaselinesScreen org={p.org} project={p.project} /> },
];
