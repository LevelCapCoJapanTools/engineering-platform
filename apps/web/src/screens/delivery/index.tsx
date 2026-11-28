// 画面群: 6.24 提出から配備・受入まで（2026-11-28 追補）
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { L05_STATES, L05SubmissionMatch } from "./L05_SubmissionMatch";
import { L06_STATES, L06ReleaseCandidate } from "./L06_ReleaseCandidate";
import { L07_STATES, L07ExecutionPermit } from "./L07_ExecutionPermit";
import { L08_STATES, L08Deployment } from "./L08_Deployment";
import { L09_STATES, L09Rollback } from "./L09_Rollback";
import { V09_STATES, V09TradeEvidence } from "./V09_TradeEvidence";

const group = "6.24 提出から配備・受入まで";

export const deliveryScreens: ScreenDef[] = [
  { id: "L-05", title: "提出と検証の照合", path: paths.submissionsMatch(":org", ":project"), group, priority: "Must", states: L05_STATES, render: () => <L05SubmissionMatch /> },
  { id: "L-06", title: "リリース候補と顧客向け説明", path: paths.releaseCandidate(":org", ":project", ":id"), group, priority: "Must", states: L06_STATES, render: () => <L06ReleaseCandidate /> },
  { id: "L-07", title: "Go/No-Go の回収と実行許可", path: paths.executionPermit(":org", ":project", ":id"), group, priority: "Must", states: L07_STATES, render: () => <L07ExecutionPermit /> },
  { id: "L-08", title: "配備依頼と完了確認", path: paths.deployment(":org", ":project", ":id"), group, priority: "Must", states: L08_STATES, render: () => <L08Deployment /> },
  { id: "L-09", title: "配備失敗・切戻し・続報", path: paths.rollback(":org", ":project", ":id"), group, priority: "Must", states: L09_STATES, render: () => <L09Rollback /> },
  { id: "V-09", title: "取引の証跡と不足一覧", path: paths.tradeEvidence(":org", ":project"), group, priority: "Must", states: V09_STATES, render: () => <V09TradeEvidence /> },
];
