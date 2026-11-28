import type { ScreenDef } from "../../lib/router";
import { paths } from "../../lib/paths";
import { SignIn } from "./A01_SignIn";
import { Invite } from "./A02_Invite";
import { Orgs } from "./A03_Orgs";
import { OrgCreate } from "./A04_OrgCreate";
import { GitHubInstall } from "./A05_GitHub";
import { Repos } from "./A06_Repos";
import { Profile } from "./A07_Profile";
import { Members } from "./A08_Members";
import { AiSettings } from "./A09_Ai";
import { Done } from "./A10_Done";
import { Planning } from "./A11_Planning";
import { Notify } from "./A12_Notify";
import { Scope } from "./A13_Scope";

const group = "6.2 認証とオンボーディング";

export const authScreens: ScreenDef[] = [
  { id: "A-01", title: "サインイン", path: paths.signin(), group, priority: "Must", states: ["default", "authenticating", "mfa", "failed", "noOrg"], render: () => <SignIn /> },
  { id: "A-02", title: "招待の受諾", path: paths.invite(":token"), group, priority: "Must", states: ["valid", "customer", "freelancer", "forwarded", "revoked", "expired", "alreadyMember", "otherAccount"], render: () => <Invite /> },
  { id: "A-03", title: "組織の選択", path: paths.orgs(), group, priority: "Must", states: ["default", "empty", "loading", "error"], render: () => <Orgs /> },
  { id: "A-04", title: "組織の作成", path: paths.onboardingOrg(), group, priority: "Must", states: ["default", "error"], render: () => <OrgCreate /> },
  { id: "A-05", title: "コードホスティングの接続", path: paths.onboardingGithub(), group, priority: "Must", states: ["notInstalled", "installing", "done", "failed"], render: () => <GitHubInstall /> },
  { id: "A-06", title: "対象リポジトリの選択", path: paths.onboardingRepos(), group, priority: "Must", states: ["default", "limit", "empty", "loading", "error"], render: () => <Repos /> },
  { id: "A-11", title: "計画・カレンダーの接続", path: paths.onboardingPlanning(), group, priority: "Must", states: ["default", "connected", "noPlanning"], render: () => <Planning /> },
  { id: "A-13", title: "適用範囲の確認", path: paths.onboardingScope(), group, priority: "Must", states: ["inScope", "needsExpert", "outOfScope"], render: () => <Scope /> },
  { id: "A-07", title: "プロファイルとゲートの設定", path: paths.onboardingProfile(), group, priority: "Must", states: ["default"], render: () => <Profile /> },
  { id: "A-12", title: "通知先の設定", path: paths.onboardingNotify(), group, priority: "Must", states: ["default", "tested", "testFailed"], render: () => <Notify /> },
  { id: "A-08", title: "経営層の招待", path: paths.onboardingMembers(), group, priority: "Must", states: ["sodWarning", "ok"], render: () => <Members /> },
  { id: "A-09", title: "AIとデータの設定", path: paths.onboardingAi(), group, priority: "Must", states: ["default"], render: () => <AiSettings /> },
  { id: "A-10", title: "完了", path: paths.onboardingDone(), group, priority: "Must", states: ["default", "syncing"], render: () => <Done /> },
];
