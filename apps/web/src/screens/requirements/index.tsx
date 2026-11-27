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

const group = "6.5 プロジェクト: 要求・設計・トレーサビリティ";
const LIST_STATES = ["default", "loading", "empty", "filtered", "error"];

export const requirementScreens: ScreenDef[] = [
  { id: "R-01", title: "要求一覧", path: paths.requirements(":org", ":project"), group, priority: "Must", states: LIST_STATES, render: () => <RequirementList /> },
  { id: "R-02", title: "要求の詳細・編集", path: paths.requirement(":org", ":project", ":id"), group, priority: "Must", states: ["default", "new", "editing", "approvedEdit", "aiDraft", "pendingApproval", "sod", "loading", "error"], render: (p) => <RequirementDetail key={p.id} id={p.id} /> },
  { id: "R-03", title: "AI要求レビュー", path: paths.requirementReview(":org", ":project", ":id"), group, priority: "Must", states: ["default", "running", "noFindings", "stale", "suspicious", "aiDisabled"], render: (p) => <AiReview key={p.id} id={p.id} /> },
  { id: "R-04", title: "要求の一括承認依頼", path: paths.requirementApproval(":org", ":project"), group, priority: "Must", states: ["default", "allValid", "sent"], render: () => <ApprovalRequest /> },
  { id: "D-01", title: "設計・ADR 一覧", path: paths.designs(":org", ":project"), group, priority: "Must", states: LIST_STATES, render: () => <DesignList /> },
  { id: "D-02", title: "設計・ADR の詳細", path: paths.design(":org", ":project", ":id"), group, priority: "Must", states: ["default", "editing", "sod", "approved", "loading", "error"], render: (p) => <DesignDetail key={p.id} id={p.id} /> },
  { id: "T-01", title: "トレーサビリティグラフ", path: paths.trace(":org", ":project"), group, priority: "Must", states: ["default", "selected", "missingOnly", "noMissing", "large", "loading", "error"], render: () => <TraceGraphScreen /> },
  { id: "T-02", title: "トレーサビリティ表", path: paths.traceMatrix(":org", ":project"), group, priority: "Must", states: ["default", "drawer", "loading", "empty", "error"], render: () => <TraceMatrixScreen /> },
  { id: "T-03", title: "テスト・検証結果", path: paths.verification(":org", ":project"), group, priority: "Must", states: ["default", "results", "records", "recordDrawer", "sod", "registerModal", "recordModal", "loading", "empty", "error"], render: () => <Verification /> },
];
