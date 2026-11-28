import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { GateRunsScreen } from "./G01_GateRuns";
import { GateRunDetailScreen } from "./G02_GateRunDetail";
import { PullsScreen } from "./G03_Pulls";
import { ExceptionsScreen } from "./E01_Exceptions";
import { ExceptionNewScreen } from "./E02_ExceptionNew";
import { ExceptionDetailScreen } from "./E03_ExceptionDetail";
import { GateSettingsScreen } from "./G04_GateSettings";
import { GateRegistrationScreen } from "./G05_GateRegistration";
import { GateReplayScreen } from "./G06_GateReplay";

const GROUP = "6.6 プロジェクト: ゲート・PR・例外";
const LIST_STATES = ["default", "loading", "empty", "filtered", "error"];

export const gateScreens: ScreenDef[] = [
  { id: "G-01", title: "ゲート実行の一覧", path: paths.gates(":org", ":project"), group: GROUP, priority: "Must", states: LIST_STATES, render: (p) => <GateRunsScreen org={p.org} project={p.project} /> },
  { id: "G-02", title: "ゲート実行の詳細", path: paths.gate(":org", ":project", ":run"), group: GROUP, priority: "Must", states: ["default", "pass", "block", "warn", "exception", "running", "stale", "anomaly"], render: (p) => <GateRunDetailScreen org={p.org} project={p.project} runId={p.run} /> },
  { id: "G-03", title: "PR／MR 一覧", path: paths.pulls(":org", ":project"), group: GROUP, priority: "Should", states: ["default", "loading", "empty", "error"], render: (p) => <PullsScreen org={p.org} project={p.project} /> },
  { id: "E-01", title: "例外の一覧", path: paths.exceptions(":org", ":project"), group: GROUP, priority: "Must", states: ["default", "loading", "empty", "error"], render: (p) => <ExceptionsScreen org={p.org} project={p.project} /> },
  { id: "E-02", title: "例外の申請", path: paths.exceptionNew(":org", ":project"), group: GROUP, priority: "Must", states: ["default", "error", "submitting", "hard"], render: (p) => <ExceptionNewScreen org={p.org} project={p.project} /> },
  { id: "E-03", title: "例外の詳細・承認", path: paths.exception(":org", ":project", ":id"), group: GROUP, priority: "Must", states: ["default", "applying", "requester", "approver", "active", "riskAcceptance", "extended", "revoked", "expired", "rejected", "withdrawn"], render: (p) => <ExceptionDetailScreen org={p.org} project={p.project} id={p.id} /> },
  { id: "G-04", title: "ゲートの適用設定", path: paths.gateSettings(":org", ":project"), group: GROUP, priority: "Must", states: ["default", "noPending", "paused", "readOnly", "loading", "error"], render: (p) => <GateSettingsScreen org={p.org} project={p.project} /> },
  { id: "G-05", title: "必須チェックの登録状況", path: paths.gateRegistration(":org", ":project"), group: GROUP, priority: "Must", states: ["default", "allOk", "loading", "empty", "error"], render: (p) => <GateRegistrationScreen org={p.org} project={p.project} /> },
  { id: "G-06", title: "判定の再現", path: paths.gateReplay(":org", ":project", ":run"), group: GROUP, priority: "Must", states: ["default", "mismatch", "idle", "running", "error"], render: (p) => <GateReplayScreen org={p.org} project={p.project} runId={p.run} /> },
];
