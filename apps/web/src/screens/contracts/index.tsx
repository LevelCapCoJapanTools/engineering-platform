// 画面群: 6.22 契約と知的資産（2026-11-28 追補）
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Y01Contracts } from "./Y01_Contracts";
import { Y02ContractDetail } from "./Y02_ContractDetail";
import { Y03IpAssets } from "./Y03_IpAssets";
import { Y04IpAsset } from "./Y04_IpAsset";
import { Y05Licenses } from "./Y05_Licenses";
import { Y06RightsHandover } from "./Y06_RightsHandover";
import { X13PortalContracts } from "./X13_PortalContracts";
import { X14PortalContract } from "./X14_PortalContract";

const group = "6.22 契約と知的資産";

export const contractScreens: ScreenDef[] = [
  { id: "Y-01", title: "契約書庫", path: paths.contracts(":org", ":project"), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: () => <Y01Contracts /> },
  { id: "Y-02", title: "契約の詳細・協議・署名", path: paths.contract(":org", ":project", ":id"), group, priority: "Must", states: ["default", "reviewedOnly", "signing", "mismatch", "signed", "declined", "freelance", "loading", "error"], render: (p) => <Y02ContractDetail key={p.id} id={p.id} /> },
  { id: "Y-03", title: "知的資産台帳", path: paths.ipAssets(":org", ":project"), group, priority: "Must", states: ["default", "filtered", "empty", "loading", "error"], render: () => <Y03IpAssets /> },
  { id: "Y-04", title: "権利の分割・利用範囲", path: paths.ipAsset(":org", ":project", ":id"), group, priority: "Must", states: ["default", "license", "invalidShare", "undecided", "loading", "error"], render: (p) => <Y04IpAsset key={p.id} id={p.id} /> },
  { id: "Y-05", title: "再委託・第三者ライセンス", path: paths.licenses(":org", ":project"), group, priority: "Should", states: ["default", "allClear", "loading", "error"], render: () => <Y05Licenses /> },
  { id: "Y-06", title: "権利の発効・引渡明細", path: paths.rightsHandover(":org", ":project"), group, priority: "Should", states: ["default", "issued", "loading", "error"], render: () => <Y06RightsHandover /> },
  { id: "X-13", title: "顧客ポータル: 契約・知的資産", path: paths.portalContracts(":project"), group, priority: "Must", states: ["通常", "提携先", "契約なし", "読み込み中", "エラー"], render: (p) => <X13PortalContracts key={p.project} project={p.project} /> },
  { id: "X-14", title: "顧客ポータル: 契約の確認・署名", path: paths.portalContract(":project", ":id"), group, priority: "Must", states: ["確認（担当者）", "閲覧担当", "署名者", "締結済み", "表示できない契約", "読み込み中", "エラー"], render: (p) => <X14PortalContract key={`${p.project}-${p.id}`} project={p.project} id={p.id} /> },
];
