import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { RequirementList } from "./R01_RequirementList";
import { RequirementDetail } from "./R02_RequirementDetail";
import { AiReview } from "./R03_AiReview";
import { ApprovalRequest } from "./R04_ApprovalRequest";
import { DesignList } from "./D01_DesignList";
import { DesignDetail } from "./D02_DesignDetail";
import { TraceGraphScreen } from "./T01_TraceGraph";
import { TraceMatrixScreen } from "./T02_TraceMatrix";
import { Verification } from "./T03_Verification";
import { RequirementDiff } from "./R05_RequirementDiff";
import { Defects } from "./T04_Defects";
import { Scans } from "./T05_Scans";
import { Builds } from "./T06_Builds";

const group = "6.5 プロジェクト: 要求・設計・トレーサビリティ";
const LIST_STATES = ["default", "loading", "empty", "filtered", "error"];

export const requirementScreens: ScreenDef[] = [
  { id: "R-01", title: "要求一覧", path: paths.requirements(":org", ":project"), group, priority: "Must", states: [...LIST_STATES, "stale"], render: () => <RequirementList /> },
  { id: "R-02", title: "要求の詳細", path: paths.requirement(":org", ":project", ":id"), group, priority: "Must", states: ["default", "approved", "changing", "pendingApproval", "sod", "returned", "obsolete", "stale", "loading", "error"], render: (p) => <RequirementDetail key={p.id} id={p.id} /> },
  { id: "R-03", title: "AI要求レビュー", path: paths.requirementReview(":org", ":project", ":id"), group, priority: "Must", states: ["default", "running", "noFindings", "stale", "suspicious", "aiDisabled"], render: (p) => <AiReview key={p.id} id={p.id} /> },
  { id: "R-04", title: "要求の一括承認依頼", path: paths.requirementApproval(":org", ":project"), group, priority: "Must", states: ["default", "allValid", "sent"], render: () => <ApprovalRequest /> },
  { id: "R-05", title: "要求の版比較", path: paths.requirementDiff(":org", ":project", ":id"), group, priority: "Must", states: ["default", "reapproved", "noChange", "loading", "error"], render: (p) => <RequirementDiff key={p.id} id={p.id} /> },
  { id: "D-01", title: "設計・ADR 一覧", path: paths.designs(":org", ":project"), group, priority: "Must", states: LIST_STATES, render: () => <DesignList /> },
  { id: "D-02", title: "設計・ADR の詳細", path: paths.design(":org", ":project", ":id"), group, priority: "Must", states: ["default", "approved", "changesRequested", "sod", "loading", "error"], render: (p) => <DesignDetail key={p.id} id={p.id} /> },
  { id: "T-01", title: "トレーサビリティグラフ", path: paths.trace(":org", ":project"), group, priority: "Must", states: ["default", "selected", "missingOnly", "noMissing", "large", "loading", "error"], render: () => <TraceGraphScreen /> },
  { id: "T-02", title: "トレーサビリティ表", path: paths.traceMatrix(":org", ":project"), group, priority: "Must", states: ["default", "drawer", "reverse", "loading", "empty", "error"], render: () => <TraceMatrixScreen /> },
  { id: "T-03", title: "テスト・検証結果", path: paths.verification(":org", ":project"), group, priority: "Must", states: ["default", "results", "records", "validation", "recordDrawer", "sod", "loading", "empty", "error"], render: () => <Verification /> },

  { id: "T-04", title: "不具合と是正", path: paths.defects(":org", ":project"), group, priority: "Must", states: ["default", "drawer", "knownIssues", "empty", "loading", "error"], render: () => <Defects /> },
  { id: "T-05", title: "品質・セキュリティスキャン", path: paths.scans(":org", ":project"), group, priority: "Must", states: ["default", "drawer", "staleSha", "empty", "loading", "error"], render: () => <Scans /> },
  { id: "T-06", title: "ビルド・CI証跡", path: paths.builds(":org", ":project"), group, priority: "Must", states: ["default", "drawer", "mismatch", "empty", "loading", "error"], render: () => <Builds /> },
];
