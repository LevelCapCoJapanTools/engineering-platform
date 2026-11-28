// 取引（発注企業・受注側JV・フリーエンジニア）の共通部品（2026-11-28 追補）。
// 1つの案件で、発注条件・提出・委託検収・配備・顧客受入・支払を別々の状態として見せる。
import type { ReactNode } from "react";
import type { Order } from "../lib/types";
import type { Audience, Relationship } from "../lib/vocab";
import {
  AUDIENCE,
  CUSTOMER_ACCEPTANCE,
  DEPLOY_STATUS,
  INSPECTION_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  RELATIONSHIP,
  SUBMISSION_STATUS,
} from "../lib/vocab";
import { Link, navigate } from "../lib/router";
import { paths, PROJECT } from "../lib/paths";
import { projectBySlug, userById } from "../mocks/core";
import { CURRENT_CUSTOMER_ID, CURRENT_FREELANCER_ID, engagementOf, inquiries, orders } from "../mocks/engagement";
import { Icon } from "./icons";
import type { IconName } from "./icons";
import { cx, StatusBadge, Tag } from "./display";
import { Menu } from "./overlay";
import { ThemeToggle } from "./layout";

/** 取引の6つの状態。組合せ（例: 委託検収済み・配備待ち・支払予定）は正常な状態として並べて見せる */
export function TradeStateStrip({ order, compact }: { order: Pick<Order, "status" | "submission" | "inspection" | "deploy" | "customer_acceptance" | "payment">; compact?: boolean }) {
  const items = [
    { label: "発注条件", vocab: ORDER_STATUS[order.status] },
    { label: "提出", vocab: SUBMISSION_STATUS[order.submission] },
    { label: "委託検収", vocab: INSPECTION_STATUS[order.inspection] },
    { label: "配備", vocab: DEPLOY_STATUS[order.deploy] },
    { label: "顧客受入", vocab: CUSTOMER_ACCEPTANCE[order.customer_acceptance] },
    { label: "支払", vocab: PAYMENT_STATUS[order.payment] },
  ];
  return (
    <dl className={cx("trade-strip", compact && "compact")} aria-label="取引の状態">
      {items.map((i) => (
        <div key={i.label}>
          <dt>{i.label}</dt>
          <dd><StatusBadge vocab={i.vocab} size="sm" /></dd>
        </div>
      ))}
    </dl>
  );
}

/** 誰に見えるか */
export function AudienceTag({ value }: { value: Audience }) {
  const v = AUDIENCE[value];
  const icon: IconName = value === "internal" ? "lock" : value === "freelancer" ? "user" : value === "alliance" ? "users" : "eye";
  return <Tag tone={v.tone} square icon={icon}>{v.label}</Tag>;
}

/** 顧客との関係の型 */
export function RelationshipTag({ value }: { value: Relationship }) {
  return <StatusBadge vocab={RELATIONSHIP[value]} size="sm" icon={false} />;
}

/** 条件の版。受諾した版と最新版が違うときは知らせる */
export function VersionPin({ version, latest, accepted }: { version: number; latest?: number; accepted?: number }) {
  const isLatest = latest === undefined || version === latest;
  return (
    <span className="version-pin">
      <Tag square>v{version}</Tag>
      {accepted === version ? <Tag tone="pass" square icon="check">受諾済みの版</Tag> : null}
      {!isLatest ? <Tag tone="special" square icon="alert">新しい版 v{latest} があります</Tag> : null}
    </span>
  );
}

/** 公開範囲の外の値。値そのものを出さず、合計や件数からも推測できない表示にする */
export function Masked({ visible, children, label = "非公開" }: { visible: boolean; children: ReactNode; label?: string }) {
  if (visible) return <>{children}</>;
  return <span className="masked" aria-label={label}><Icon name="lock" size={12} />{label}</span>;
}

/** 次に動く人 */
export function NextActor({ actor, action, due }: { actor: Order["next_actor"]; action: string; due?: string }) {
  const label = { freelancer: "あなた（受託者）", desk: "案件窓口", customer: "発注企業", inspector: "委託元の検収者", none: "—" }[actor];
  return (
    <span className={cx("next-actor", actor === "freelancer" && "mine")}>
      <span className="tiny muted">次に動く人</span>
      <strong className="small">{label}</strong>
      <span className="small">{action}</span>
      {due ? <span className="tiny muted">期限 {due.replace(/-/g, "/")}</span> : null}
    </span>
  );
}

// ---------- フリーエンジニア向けレイアウト ----------

export type FreelancerNav = "orders" | "questions" | "history";

/** 依頼元（受注側の会社）。同じ人が複数社から受託しても、選んだ会社の依頼だけを出す */
export function freelancerClients(freelancerId = CURRENT_FREELANCER_ID) {
  return [...new Set(orders.filter((o) => o.freelancer_id === freelancerId).map((o) => o.client_company))];
}

export function FreelancerLayout({ active, client, onClientChange, children }: { active: FreelancerNav; client?: string; onClientChange?: (c: string) => void; children: ReactNode }) {
  const me = userById(CURRENT_FREELANCER_ID);
  const clients = freelancerClients();
  const current = client ?? clients[0];
  const myOrders = orders.filter((o) => o.freelancer_id === CURRENT_FREELANCER_ID && o.client_company === current);
  const needsReply = myOrders.filter((o) => o.next_actor === "freelancer").length;
  const myQuestions = inquiries.filter((q) => q.asker_id === CURRENT_FREELANCER_ID && q.status !== "answered").length;
  const nav: { key: FreelancerNav; label: string; icon: IconName; to: string; count?: number }[] = [
    { key: "orders", label: "依頼", icon: "inbox", to: paths.freelancerHome(), count: needsReply },
    { key: "questions", label: "質問と回答", icon: "message", to: paths.freelancerQuestions(), count: myQuestions },
    { key: "history", label: "提出・取引履歴", icon: "history", to: paths.freelancerHistory() },
  ];
  return (
    <div className="fl">
      <header className="fl-header">
        <div className="fl-header-inner">
          <span className="brand-mark sm" aria-hidden />
          <label className="fl-client">
            <span className="tiny muted">依頼元</span>
            <select value={current} onChange={(e) => onClientChange?.(e.target.value)} aria-label="依頼元を切り替える">
              {clients.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <span className="grow" />
          <ThemeToggle />
          <Menu
            trigger={(toggle) => (
              <button type="button" className="user-btn" onClick={toggle}>
                <span className="avatar external">{me?.initials}</span>
                <span className="desktop-only">{me?.name}</span>
              </button>
            )}
            items={[{ label: "サインアウト", icon: "logout", onClick: () => navigate(paths.signin()) }]}
          />
        </div>
        <nav className="fl-nav" aria-label="受託者メニュー">
          {nav.map((n) => (
            <Link key={n.key} to={n.to} className={cx("fl-nav-item", active === n.key && "active")} aria-current={active === n.key ? "page" : undefined}>
              <Icon name={n.icon} size={16} />
              <span>{n.label}</span>
              {n.count ? <span className="count">{n.count}</span> : null}
            </Link>
          ))}
        </nav>
      </header>
      <main className="fl-main">{children}</main>
    </div>
  );
}

// ---------- 顧客ポータル（発注企業）のレイアウト ----------

export type CustomerNav = "home" | "schedule" | "requests" | "contracts" | "handover" | "materials" | "joint" | "routing";

export function CustomerPortalLayout({ project = PROJECT, active, children, userId = CURRENT_CUSTOMER_ID }: { project?: string; active: CustomerNav; children: ReactNode; userId?: string }) {
  const p = projectBySlug(project);
  const eng = engagementOf(project);
  const me = userById(userId);
  const tabs: { key: CustomerNav; label: string; to: string; show: boolean }[] = [
    { key: "home", label: "案件ホーム", to: paths.portal(project), show: true },
    { key: "schedule", label: "予定", to: paths.portalSchedule(project), show: true },
    { key: "requests", label: "申請・承認", to: paths.portalRequests(project), show: true },
    { key: "contracts", label: "契約・知的資産", to: paths.portalContracts(project), show: true },
    { key: "handover", label: "引き渡し", to: paths.portalHandover(project), show: true },
    { key: "materials", label: "資料の提出", to: paths.portalMaterials(project), show: true },
    { key: "joint", label: "共同事業の収支", to: paths.portalJoint(project), show: eng?.relationship === "alliance" },
    { key: "routing", label: "社内の権限者", to: paths.portalRouting(project), show: true },
  ];
  return (
    <div className="portal">
      <header className="portal-header">
        <div className="portal-header-inner wide">
          <span className="brand-mark sm" aria-hidden />
          <div className="stack grow" style={{ ["--gap" as string]: "0", minWidth: 0 }}>
            <span className="strong truncate">{p.name}</span>
            <span className="tiny muted truncate">発注元: {eng?.customer_company ?? p.customer} · 受注: サンプルソフト株式会社 {eng ? `· ${RELATIONSHIP[eng.relationship].label}` : ""}</span>
          </div>
          <ThemeToggle />
          <Menu
            trigger={(toggle) => (
              <button type="button" className="user-btn" onClick={toggle}>
                <span className="avatar external">{me?.initials}</span>
                <span className="desktop-only">{me?.name}</span>
              </button>
            )}
            items={[{ label: "サインアウト", icon: "logout", onClick: () => navigate(paths.signin()) }]}
          />
        </div>
        <nav className="tabs portal-tabs" aria-label="顧客ポータルのメニュー">
          {tabs.filter((t) => t.show).map((t) => (
            <Link key={t.key} to={t.to} className={cx("tab", active === t.key && "active")} aria-current={active === t.key ? "page" : undefined}>{t.label}</Link>
          ))}
        </nav>
      </header>
      <main className="portal-main wide">{children}</main>
    </div>
  );
}
