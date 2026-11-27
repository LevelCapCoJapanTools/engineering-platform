// 第4章 4.1 レイアウトと第5章 5.1 レイアウト部品
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import type { IconName } from "./icons";
import { Avatar, cx, StatusBadge } from "./display";
import { Button, SearchBox } from "./inputs";
import { Menu } from "./overlay";
import { Link, navigate, setScreenState, useRoute } from "../lib/router";
import { ORG, PROJECT, paths } from "../lib/paths";
import { COMPLIANCE_PHRASE, PRODUCT_NAME } from "../lib/vocab";
import type { StatusVocab } from "../lib/vocab";
import { approvalRequests, currentUser, notifications, orgs, projectBySlug, projects } from "../mocks/core";
import { relativeTime } from "../lib/format";

// ---------- テーマ ----------
type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => undefined });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = window.localStorage.getItem("ep-theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch {
      /* 保存領域が使えない場合は既定のテーマ */
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("ep-theme", theme);
    } catch {
      /* 保存できなくても表示は切り替わる */
    }
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === "light" ? "ダークテーマに切替" : "ライトテーマに切替"} title={theme === "light" ? "ダークテーマ" : "ライトテーマ"}>
      <Icon name={theme === "light" ? "moon" : "sun"} />
    </button>
  );
}

export function Brand({ to = paths.home(), small }: { to?: string; small?: boolean }) {
  return (
    <Link to={to} className="brand" aria-label={`${PRODUCT_NAME} ホーム`}>
      <span className={cx("brand-mark", small && "sm")} aria-hidden />
      <span>{PRODUCT_NAME}</span>
    </Link>
  );
}

// ---------- 公開レイアウト ----------
const publicNav = [
  { to: paths.features(), label: "機能" },
  { to: paths.pricing(), label: "料金" },
  { to: paths.security(), label: "セキュリティ" },
  { to: paths.standards(), label: "規格との関係" },
];

export function PublicHeader() {
  const { path } = useRoute();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={cx("public-header", scrolled && "scrolled")}>
      <div className="public-header-inner">
        <Brand />
        <nav className="public-nav" aria-label="サイト">
          {publicNav.map((n) => (
            <Link key={n.to} to={n.to} className={cx(path === n.to && "active")}>{n.label}</Link>
          ))}
        </nav>
        <div className="row" style={{ marginLeft: "auto" }}>
          <ThemeToggle />
          <span className="desktop-only"><Button variant="ghost" to={paths.signin()}>サインイン</Button></span>
          <span className="desktop-only"><Button variant="primary" to={paths.contact()}>PoCを相談</Button></span>
          <button type="button" className="icon-btn mobile-only" onClick={() => setOpen((v) => !v)} aria-label="メニュー" aria-expanded={open}>
            <Icon name={open ? "x" : "menu"} />
          </button>
        </div>
      </div>
      {open ? (
        <nav className="mobile-nav" aria-label="サイト（モバイル）">
          {publicNav.map((n) => <Link key={n.to} to={n.to}>{n.label}</Link>)}
          <Link to={paths.signin()}>サインイン</Link>
          <div style={{ marginTop: 8 }}><Button variant="primary" block to={paths.contact()}>PoCを相談</Button></div>
        </nav>
      ) : null}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="container">
        <div className="cols">
          <div className="stack" style={{ ["--gap" as string]: "10px" }}>
            <Brand />
            <p>{COMPLIANCE_PHRASE}する、開発の継続的保証基盤。</p>
            <p>サンプルソフト株式会社（運営会社名は仮）</p>
          </div>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <strong>製品</strong>
            <Link to={paths.features()}>機能</Link>
            <Link to={paths.pricing()}>料金</Link>
            <Link to={paths.cases()}>導入事例</Link>
          </div>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <strong>信頼</strong>
            <Link to={paths.security()}>セキュリティとデータの扱い</Link>
            <Link to={paths.standards()}>規格との関係</Link>
          </div>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <strong>会社</strong>
            <Link to={paths.contact()}>お問い合わせ</Link>
            <Link to={paths.terms()}>利用規約</Link>
            <Link to={paths.privacy()}>プライバシーポリシー</Link>
          </div>
        </div>
        <p className="note">
          本サービスは ISO/IEC 29110 の適合準備を支援するもので、認証を行うものではありません。認証は第三者の認証機関が行います。
          「ISO」は国際標準化機構の登録商標です。本サービスは国際標準化機構による承認・認証を受けたものではありません。
        </p>
        <p className="tiny" style={{ marginTop: 12 }}>© 2026 Product Name</p>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public">
      <PublicHeader />
      <main className="public-main">{children}</main>
      <PublicFooter />
    </div>
  );
}

// ---------- 中央寄せ・オンボーディング ----------
export function CenterLayout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="center-layout">
      <Brand />
      <main className={cx("center-card", wide && "wide")}>{children}</main>
      <div className="center-foot">
        <Link to={paths.terms()}>利用規約</Link>
        <Link to={paths.privacy()}>プライバシーポリシー</Link>
        <Link to={paths.security()}>セキュリティ</Link>
        <ThemeToggle />
      </div>
    </div>
  );
}

export const ONBOARDING_STEPS = ["組織", "GitHub", "リポジトリ", "プロファイル", "メンバー", "AIとデータ", "完了"];

export function Stepper({ steps, current, errorAt }: { steps: string[]; current: number; errorAt?: number }) {
  return (
    <ol className="stepper" aria-label="進捗">
      {steps.map((s, i) => (
        <li key={s} className={cx(i < current && "done", i === current && "current", errorAt === i && "error")} aria-current={i === current ? "step" : undefined}>
          <span className="num">{i < current ? <Icon name="check" size={12} /> : errorAt === i ? "!" : i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function OnboardingLayout({ step, title, description, children, back, next, onNext, nextLabel = "次へ", nextDisabled, nextDisabledReason, extra, errorAt }: { step: number; title: string; description?: ReactNode; children: ReactNode; back?: string; next?: string; /** 遷移の前に画面の状態を変える場合に使う。指定すると next より優先する */ onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; nextDisabledReason?: string; extra?: ReactNode; errorAt?: number }) {
  return (
    <div className="onboarding">
      <div className="onboarding-top">
        <div className="row between"><Brand /><span className="small muted">セットアップ {step + 1}/{ONBOARDING_STEPS.length}</span></div>
        <Stepper steps={ONBOARDING_STEPS} current={step} errorAt={errorAt} />
      </div>
      <main className="onboarding-body">
        <div className="onboarding-card">
          <div className="stack" style={{ ["--gap" as string]: "6px" }}>
            <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>{title}</h1>
            {description ? <p className="muted">{description}</p> : null}
          </div>
          {children}
          <div className="onboarding-foot">
            {back ? <Button variant="ghost" icon="arrowLeft" to={back}>戻る</Button> : <span />}
            <div className="row">
              {extra}
              {onNext ? <Button variant="primary" iconRight="arrowRight" onClick={onNext} disabled={nextDisabled} disabledReason={nextDisabledReason}>{nextLabel}</Button> : next ? <Button variant="primary" iconRight="arrowRight" to={nextDisabled ? undefined : next} disabled={nextDisabled} disabledReason={nextDisabledReason}>{nextLabel}</Button> : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------- アプリのレイアウト ----------
export type NavKey =
  | "dashboard" | "inbox" | "notifications" | "projects" | "search" | "policies" | "settings"
  | "overview" | "sow" | "plan" | "progress" | "risks" | "changes" | "meetings"
  | "requirements" | "design" | "trace" | "verification"
  | "gates" | "pulls" | "exceptions" | "releases"
  | "audit" | "manifests" | "auditLog" | "auditExport";

type NavItem = { key: NavKey; label: string; icon: IconName; to: string; count?: number; alert?: boolean };

function orgNav(org: string): NavItem[] {
  return [
    { key: "dashboard", label: "ダッシュボード", icon: "home", to: paths.orgHome(org) },
    { key: "inbox", label: "承認待ち", icon: "inbox", to: paths.inbox(org), count: approvalRequests.length, alert: true },
    { key: "projects", label: "プロジェクト", icon: "folder", to: paths.projects(org) },
    { key: "policies", label: "ポリシー", icon: "layers", to: paths.policies(org) },
    { key: "settings", label: "設定", icon: "settings", to: paths.settings(org) },
  ];
}

function projectNav(org: string, pr: string): { group: string; items: NavItem[] }[] {
  const p = projectBySlug(pr);
  return [
    { group: "", items: [{ key: "overview", label: "概要", icon: "grid", to: paths.project(org, pr) }] },
    {
      group: "計画と管理",
      items: [
        { key: "sow", label: "SOW", icon: "fileText", to: paths.sow(org, pr) },
        { key: "plan", label: "プロジェクト計画", icon: "calendar", to: paths.plan(org, pr) },
        { key: "progress", label: "進捗", icon: "chart", to: paths.progress(org, pr) },
        { key: "risks", label: "リスク・是正", icon: "alert", to: paths.risks(org, pr), count: p.open_risks },
        { key: "changes", label: "変更要求", icon: "compare", to: paths.changes(org, pr), count: p.open_changes },
        { key: "meetings", label: "議事録", icon: "message", to: paths.meetings(org, pr) },
      ],
    },
    {
      group: "要求と設計",
      items: [
        { key: "requirements", label: "要求", icon: "list", to: paths.requirements(org, pr) },
        { key: "design", label: "設計・ADR", icon: "book", to: paths.designs(org, pr) },
        { key: "trace", label: "トレーサビリティ", icon: "trace", to: paths.trace(org, pr) },
        { key: "verification", label: "テスト・検証", icon: "checkSquare", to: paths.verification(org, pr) },
      ],
    },
    {
      group: "ゲートと例外",
      items: [
        { key: "gates", label: "ゲート実行", icon: "shield", to: paths.gates(org, pr), count: p.blocked_prs, alert: p.blocked_prs > 0 },
        { key: "pulls", label: "PR", icon: "pullRequest", to: paths.pulls(org, pr) },
        { key: "exceptions", label: "例外", icon: "flag", to: paths.exceptions(org, pr), count: p.active_exceptions },
      ],
    },
    { group: "リリース", items: [{ key: "releases", label: "リリースと受入", icon: "rocket", to: paths.releases(org, pr) }] },
    {
      group: "証跡と監査",
      items: [
        { key: "audit", label: "監査ダッシュボード", icon: "barChart", to: paths.audit(org, pr) },
        { key: "manifests", label: "Evidence Manifest", icon: "signature", to: paths.manifests(org, pr) },
        { key: "auditLog", label: "監査ログ", icon: "history", to: paths.auditLog(org, pr) },
        { key: "auditExport", label: "監査パックの出力", icon: "package", to: paths.auditExport(org, pr) },
      ],
    },
  ];
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link to={item.to} className={cx("nav-item", active && "active")} aria-current={active ? "page" : undefined} title={item.label}>
      <Icon name={item.icon} />
      <span>{item.label}</span>
      {item.count ? <span className={cx("nav-count", item.alert && "alert")}>{item.count}</span> : null}
    </Link>
  );
}

export function SideNav({ org, project, active, collapsed, onCollapse }: { org: string; project?: string; active: NavKey; collapsed: boolean; onCollapse: () => void }) {
  const p = project ? projectBySlug(project) : undefined;
  return (
    <nav className="sidenav" aria-label="メインナビゲーション">
      {orgNav(org).map((item) => <NavLink key={item.key} item={item} active={active === item.key} />)}
      {p && project ? (
        <>
          <div className="nav-group">プロジェクト</div>
          <Link to={paths.project(org, project)} className="nav-project" style={{ textDecoration: "none" }}>
            <span className="name">{p.name}</span>
            <span className="tiny muted">{p.customer}</span>
          </Link>
          {projectNav(org, project).map((g) => (
            <div key={g.group || "top"} className="stack" style={{ ["--gap" as string]: "2px" }}>
              {g.group ? <div className="nav-group">{g.group}</div> : null}
              {g.items.map((item) => <NavLink key={item.key} item={item} active={active === item.key} />)}
            </div>
          ))}
        </>
      ) : null}
      <div className="sidenav-foot">
        <button type="button" className="nav-item" onClick={onCollapse} style={{ border: 0, background: "none", width: "100%", cursor: "pointer" }} aria-label={collapsed ? "メニューを展開" : "メニューを折りたたむ"}>
          <Icon name={collapsed ? "chevronRight" : "chevronLeft"} />
          <span>折りたたむ</span>
        </button>
      </div>
    </nav>
  );
}

export function OrgSwitcher({ org }: { org: string }) {
  const current = orgs.find((o) => o.slug === org) ?? orgs[0];
  return (
    <Menu
      align="left"
      trigger={(toggle) => (
        <button type="button" className="org-switch" onClick={toggle} aria-haspopup="menu">
          <span className="org-logo">{current.initials}</span>
          <span className="truncate">{current.name}</span>
          <Icon name="chevronDown" size={14} />
        </button>
      )}
      items={[
        ...orgs.map((o) => ({ label: <span className="row nowrap"><span className="org-switch" style={{ border: 0, padding: 0 }}><span className="org-logo">{o.initials}</span></span>{o.name}<span className="tiny muted">{o.plan}</span></span>, onClick: () => navigate(paths.orgHome(o.slug)) })),
        "separator" as const,
        { label: "管理先の組織（パートナー）", icon: "building" as IconName, onClick: () => navigate(paths.partner()) },
        { label: "組織を作成", icon: "plus" as IconName, onClick: () => navigate(paths.onboardingOrg()) },
      ]}
    />
  );
}

export function NotificationMenu({ org }: { org: string }) {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <Menu
      trigger={(toggle) => (
        <button type="button" className="icon-btn" onClick={toggle} aria-label={`通知 ${unread}件の未読`}>
          <Icon name="bell" />
          {unread ? <span className="count info">{unread > 99 ? "99+" : unread}</span> : null}
        </button>
      )}
      items={[
        ...notifications.slice(0, 5).map((n) => ({ label: <span className="stack" style={{ ["--gap" as string]: "2px", fontWeight: n.read ? 400 : 600 }}><span className="small">{n.text}</span><span className="tiny muted">{relativeTime(n.at)}</span></span>, onClick: () => undefined })),
        "separator" as const,
        { label: "すべての通知を見る", icon: "arrowRight" as IconName, onClick: () => navigate(paths.notifications(org)) },
      ]}
    />
  );
}

export function UserMenu() {
  const { theme, toggle } = useTheme();
  return (
    <Menu
      trigger={(toggle2) => (
        <button type="button" className="user-btn" onClick={toggle2} aria-haspopup="menu">
          <Avatar user={currentUser} />
          <span className="desktop-only">{currentUser.name}</span>
          <Icon name="chevronDown" size={14} />
        </button>
      )}
      items={[
        { label: <span className="stack" style={{ ["--gap" as string]: "0" }}><strong>{currentUser.name}</strong><span className="tiny muted">{currentUser.email}</span></span> },
        "separator",
        { label: "個人設定", icon: "user", onClick: () => navigate(paths.me()) },
        { label: theme === "light" ? "ダークテーマ" : "ライトテーマ", icon: theme === "light" ? "moon" : "sun", onClick: toggle },
        "separator",
        { label: "サインアウト", icon: "logout", onClick: () => navigate(paths.signin()) },
      ]}
    />
  );
}

export function GlobalHeader({ org, onMenu }: { org: string; onMenu: () => void }) {
  return (
    <header className="global-header">
      <div className="row nowrap">
        <button type="button" className="icon-btn mobile-only" onClick={onMenu} aria-label="メニューを開く"><Icon name="menu" /></button>
        <Brand to={paths.orgHome(org)} />
      </div>
      <div className="header-center">
        <span className="desktop-only"><OrgSwitcher org={org} /></span>
        <form onSubmit={(e) => { e.preventDefault(); navigate(paths.search(org)); }} style={{ display: "contents" }}>
          <SearchBox placeholder="要求、ADR、PR、証跡を検索" shortcut="/" />
        </form>
      </div>
      <div className="header-actions">
        <Link to={paths.inbox(org)} className="icon-btn" aria-label={`承認待ち ${approvalRequests.length}件`}>
          <Icon name="inbox" />
          <span className="count">{approvalRequests.length}</span>
        </Link>
        <NotificationMenu org={org} />
        <UserMenu />
      </div>
    </header>
  );
}

export type Crumb = { label: string; to?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label="パンくずリスト">
      {items.map((c, i) => (
        <span key={i} className="row nowrap" style={{ ["--gap" as string]: "6px" }}>
          {i > 0 ? <span className="sep">›</span> : null}
          {c.to && i < items.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span className="current" aria-current="page">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/** パンくずの先頭（組織 › プロジェクト）を作る */
export function crumbs(org: string, project?: string, ...rest: Crumb[]): Crumb[] {
  const o = orgs.find((x) => x.slug === org) ?? orgs[0];
  const base: Crumb[] = [{ label: o.name, to: paths.orgHome(org) }];
  if (project) base.push({ label: projectBySlug(project).name, to: paths.project(org, project) });
  return [...base, ...rest];
}

export function AppLayout({ org = ORG, project, active, breadcrumb, children }: { org?: string; project?: string; active: NavKey; breadcrumb?: Crumb[]; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className={cx("app", collapsed && "collapsed", mobileOpen && "mobile-open")}>
      <GlobalHeader org={org} onMenu={() => setMobileOpen((v) => !v)} />
      <SideNav org={org} project={project} active={active} collapsed={collapsed} onCollapse={() => setCollapsed((v) => !v)} />
      <main className="main" onClick={() => mobileOpen && setMobileOpen(false)}>
        <div className="main-inner">
          {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
          {children}
        </div>
      </main>
    </div>
  );
}

/** プロジェクト画面用の AppLayout */
export function ProjectLayout({ org = ORG, project = PROJECT, active, trail, children }: { org?: string; project?: string; active: NavKey; trail: Crumb[]; children: ReactNode }) {
  return (
    <AppLayout org={org} project={project} active={active} breadcrumb={crumbs(org, project, ...trail)}>
      {children}
    </AppLayout>
  );
}

export function PageHeader({ title, id, status, description, actions, tabs, meta }: { title: ReactNode; id?: string; status?: StatusVocab | ReactNode; description?: ReactNode; actions?: ReactNode; tabs?: ReactNode; meta?: ReactNode }) {
  const statusNode = status && typeof status === "object" && "label" in (status as StatusVocab) && "tone" in (status as StatusVocab) ? <StatusBadge vocab={status as StatusVocab} /> : (status as ReactNode);
  return (
    <header className="page-header">
      <div className="page-header-top">
        <div className="stack" style={{ ["--gap" as string]: "6px", minWidth: 0 }}>
          <div className="page-title">
            {id ? <span className="page-id">{id}</span> : null}
            <h1>{title}</h1>
            {statusNode}
          </div>
          {description ? <p className="page-desc">{description}</p> : null}
          {meta ? <div className="row" style={{ ["--gap" as string]: "8px" }}>{meta}</div> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
      {tabs}
    </header>
  );
}

export function DetailLayout({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="detail">
      <div className="stack" style={{ minWidth: 0 }}>{main}</div>
      <aside className="meta-sidebar" aria-label="属性">{side}</aside>
    </div>
  );
}

export function MetaSection({ title, children, defaultOpen = true }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="meta-section" open={defaultOpen}>
      <summary>
        {title}
        <Icon name="chevronDown" size={14} className="muted" />
      </summary>
      <div className="meta-body">{children}</div>
    </details>
  );
}

/** 設定画面の左側サブナビ */
export function SettingsNav({ org, active }: { org: string; active: string }) {
  const items: { key: string; label: string; to: string; icon: IconName }[] = [
    { key: "org", label: "組織", to: paths.settings(org), icon: "building" },
    { key: "members", label: "メンバーとロール", to: paths.members(org), icon: "users" },
    { key: "integrations", label: "連携", to: paths.integrations(org), icon: "github" },
    { key: "ai", label: "AIとデータ分類", to: paths.aiSettings(org), icon: "sparkles" },
    { key: "evidence", label: "証跡の保管", to: paths.evidenceSettings(org), icon: "archive" },
    { key: "security", label: "セキュリティ", to: paths.security_(org), icon: "lock" },
    { key: "billing", label: "プランと請求", to: paths.billing(org), icon: "creditCard" },
  ];
  return (
    <nav className="stack" style={{ ["--gap" as string]: "2px" }} aria-label="設定">
      {items.map((i) => (
        <Link key={i.key} to={i.to} className={cx("nav-item", active === i.key && "active")}>
          <Icon name={i.icon} />
          <span>{i.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function SettingsLayout({ org = ORG, active, title, description, children, actions }: { org?: string; active: string; title: string; description?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <AppLayout org={org} active="settings" breadcrumb={crumbs(org, undefined, { label: "設定", to: paths.settings(org) }, { label: title })}>
      <PageHeader title={title} description={description} actions={actions} />
      <div className="grid settings-grid">
        <SettingsNav org={org} active={active} />
        <div className="stack">{children}</div>
      </div>
    </AppLayout>
  );
}

// ---------- ポータル ----------
export function PortalHeader({ project = PROJECT, wide, external = "customer" }: { project?: string; wide?: boolean; external?: "customer" | "assessor" }) {
  const p = projectBySlug(project);
  return (
    <header className="portal-header">
      <div className={cx("portal-header-inner", wide && "wide")}>
        <span className="brand-mark sm" aria-hidden />
        <div className="stack grow" style={{ ["--gap" as string]: "0", minWidth: 0 }}>
          <span className="strong truncate">{external === "customer" ? p.name : "監査パックの閲覧"}</span>
          <span className="tiny muted truncate">{external === "customer" ? `発注元: ${p.customer} · 開発: サンプルソフト株式会社` : "共有元: サンプルソフト株式会社"}</span>
        </div>
        <ThemeToggle />
        {external === "customer" ? (
          <Menu
            trigger={(toggle) => (
              <button type="button" className="user-btn" onClick={toggle}>
                <span className="avatar external">中</span>
                <span className="desktop-only">中村 拓也</span>
              </button>
            )}
            items={[{ label: "サインアウト", icon: "logout", onClick: () => navigate(paths.signin()) }]}
          />
        ) : null}
      </div>
    </header>
  );
}

export function PortalLayout({ children, project, wide, external }: { children: ReactNode; project?: string; wide?: boolean; external?: "customer" | "assessor" }) {
  return (
    <div className="portal">
      <PortalHeader project={project} wide={wide} external={external} />
      <main className={cx("portal-main", wide && "wide")}>{children}</main>
    </div>
  );
}

// ---------- 開発用: 画面の状態切替 ----------
export function StateSwitcher() {
  const { screen, query } = useRoute();
  if (!screen) return null;
  const states = screen.states ?? [];
  const current = query.get("state") ?? states[0];
  return (
    <div className="state-switcher" role="region" aria-label="モックの状態切替">
      <span className="mono">{screen.id}</span>
      {states.length > 1 ? (
        <select value={current} onChange={(e) => setScreenState(e.target.value)} aria-label="画面の状態">
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ) : null}
      <Link to={paths.screens()}>画面一覧</Link>
    </div>
  );
}

export { ORG, PROJECT, projects };
