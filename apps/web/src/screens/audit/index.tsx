import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { AuditDashboard } from "./V01_AuditDashboard";
import { ControlDetail } from "./V02_ControlDetail";
import { ManifestList } from "./V03_ManifestList";
import { ManifestDetail } from "./V04_ManifestDetail";
import { AuditLog } from "./V05_AuditLog";
import { AuditExport } from "./V06_AuditExport";
import { SigningScreen } from "./V07_Signing";
import { SharesScreen } from "./V08_Shares";

const group = "6.8 証跡と監査";

export const auditScreens: ScreenDef[] = [
  { id: "V-01", title: "監査ダッシュボード", path: paths.audit(":org", ":project"), group, priority: "Must", states: ["default", "loading", "empty", "error"], render: (p) => <AuditDashboard org={p.org} project={p.project} /> },
  { id: "V-02", title: "統制項目の詳細", path: paths.control(":org", ":project", ":id"), group, priority: "Must", states: ["default", "satisfied", "partial", "missing", "exception", "verifyFailed"], render: (p) => <ControlDetail org={p.org} project={p.project} id={p.id} /> },
  { id: "V-03", title: "Evidence Manifest 一覧", path: paths.manifests(":org", ":project"), group, priority: "Must", states: ["default", "loading", "empty", "error"], render: (p) => <ManifestList org={p.org} project={p.project} /> },
  { id: "V-04", title: "Evidence Manifest の詳細", path: paths.manifest(":org", ":project", ":id"), group, priority: "Must", states: ["default", "verified", "failed", "expired", "storageMissing", "unsigned", "storing"], render: (p) => <ManifestDetail org={p.org} project={p.project} id={p.id} /> },
  { id: "V-05", title: "監査ログ", path: paths.auditLog(":org", ":project"), group, priority: "Must", states: ["default", "tampered", "loading", "empty", "error"], render: (p) => <AuditLog org={p.org} project={p.project} /> },
  { id: "V-06", title: "監査パックの出力", path: paths.auditExport(":org", ":project"), group, priority: "Must", states: ["default", "generating", "done", "failed", "noHistory"], render: (p) => <AuditExport org={p.org} project={p.project} /> },
  { id: "V-07", title: "署名と検証", path: paths.signing(":org"), group, priority: "Must", states: ["default", "rotationDue", "logDown", "loading", "error"], render: (p) => <SigningScreen org={p.org} /> },
  { id: "V-08", title: "共有リンクとアクセス記録", path: paths.shares(":org", ":project"), group, priority: "Must", states: ["default", "denied", "empty", "loading", "error"], render: (p) => <SharesScreen org={p.org} project={p.project} /> },
];
