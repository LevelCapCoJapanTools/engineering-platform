// 画面群: 6.23 アプリの配信名義と引き渡し（2026-11-28 追補）
// 対象案件は業務提携型の会員アプリ（member-app-api）。Apple 上の手続きは本人が行い、本サービスは準備・期限・照合を扱う。
import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Q01AppHandover, Q01_STATES } from "./Q01_AppHandover";
import { Q02Enrollment, Q02_STATES } from "./Q02_Enrollment";
import { Q03Invitations, Q03_STATES } from "./Q03_Invitations";
import { Q04Transfer, Q04_STATES } from "./Q04_Transfer";
import { Q05Operations, Q05_STATES } from "./Q05_Operations";
import { X15PortalHandover, X15_STATES } from "./X15_PortalHandover";

const group = "6.23 アプリの配信名義と引き渡し";
const org = ":org";
const pr = ":project";

export const appHandoverScreens: ScreenDef[] = [
  { id: "Q-01", title: "配信名義と引き渡し方式", path: paths.appHandover(org, pr), group, priority: "Must", states: Q01_STATES, render: (p) => <Q01AppHandover params={p} /> },
  { id: "Q-02", title: "Apple Developer 組織登録の支援", path: paths.appEnrollment(org, pr), group, priority: "Must", states: Q02_STATES, render: (p) => <Q02Enrollment params={p} /> },
  { id: "Q-03", title: "App Store Connect の作業者招待", path: paths.appInvitations(org, pr), group, priority: "Should", states: Q03_STATES, render: (p) => <Q03Invitations params={p} /> },
  { id: "Q-04", title: "公開済み iOS アプリの移管", path: paths.appTransfer(org, pr), group, priority: "Should", states: Q04_STATES, render: (p) => <Q04Transfer params={p} /> },
  { id: "Q-05", title: "運用権限の引き渡し", path: paths.appOperations(org, pr), group, priority: "Should", states: Q05_STATES, render: (p) => <Q05Operations params={p} /> },
  { id: "X-15", title: "アプリ・資産の引き渡し（顧客）", path: paths.portalHandover(":project"), group, priority: "Must", states: X15_STATES, render: () => <X15PortalHandover /> },
];
