// 画面ID: DEV-02 部品カタログ（第5章の全部品・全バリエーション・全状態）
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Accordion,
  ActorLabel,
  AIDraftBanner,
  AIFindingCard,
  AISectionHead,
  AIUnavailableNotice,
  ApprovalPanel,
  ApprovalRequestCard,
  Avatar,
  AvatarStack,
  Banner,
  Brand,
  Breadcrumb,
  Button,
  ChecklistPanel,
  Checkbox,
  CodeRef,
  Combobox,
  CommentThread,
  ConfirmDialog,
  ControlLayerTag,
  CoverageMeter,
  DataClassBadge,
  DataTable,
  DatePicker,
  DeadlineIndicator,
  DiffViewer,
  Drawer,
  EmptyState,
  EnforcementBadge,
  ErrorState,
  EvidenceItem,
  ExceptionSummary,
  FileUpload,
  FilterBar,
  GateResultPanel,
  GateSummaryStrip,
  GlobalHeader,
  HashDisplay,
  Icon,
  IdLink,
  JsonViewer,
  KeyValueList,
  MarkdownEditor,
  MarkdownViewer,
  Menu,
  MetaSection,
  Modal,
  MoreMenu,
  NotificationMenu,
  OptionCard,
  OrgSwitcher,
  PageHeader,
  Pagination,
  PhaseBand,
  PlanLimitNotice,
  PolicyVersionTag,
  Popover,
  PortalHeader,
  PublicFooter,
  PublicHeader,
  Radio,
  RetentionBadge,
  RoleBadge,
  SearchBox,
  Section,
  Segmented,
  Select,
  ShareLinkPanel,
  SideNav,
  SignatureBadge,
  Skeleton,
  SoDNotice,
  StatCard,
  StateFlow,
  StatusBadge,
  Stepper,
  Tabs,
  Tag,
  TextArea,
  TextField,
  ThemeToggle,
  Timeline,
  Timestamp,
  Toggle,
  Tooltip,
  TraceGraph,
  TraceLegend,
  TraceLinkEditor,
  TraceMatrix,
  UserChip,
  UserMenu,
  membersWithRole,
  useToast,
  ONBOARDING_STEPS,
} from "../../ui";
import type { Column, TimelineItem, TraceEdge, TraceNode } from "../../ui";
import { Link } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import {
  ACTOR_KIND,
  AI_STATUS,
  APPROVAL_STATUS,
  ARTIFACT_STATUS,
  CHANGE_STATUS,
  CONTROL_LAYER,
  CONTROL_STATUS,
  DATA_CLASS,
  ENFORCEMENT_LEVEL,
  EVIDENCE_STATUS,
  EXCEPTION_STATUS,
  GATE_STATUS,
  MEMBER_STATUS,
  RELEASE_STATUS,
  RISK_STATUS,
  ROLES,
  SHARE_STATUS,
} from "../../lib/vocab";
import type { ActorKind, ControlLayer, DataClass, EnforcementLevel, StatusVocab } from "../../lib/vocab";
import { PHASES } from "../../lib/types";
import type { Requirement } from "../../lib/types";
import {
  aiFindings,
  approvalRequests,
  evidence,
  exceptions,
  fakeSha,
  gateRunById,
  requirements,
  userById,
  users,
} from "../../mocks/core";
import "./catalog.css";
import { SYNC_TOC, SyncParts } from "./CatalogSync";

// ---------- 枠組み ----------
type TocEntry = { id: string; label: string };
const TOC: { group: string; items: TocEntry[] }[] = [
  { group: "基礎", items: [{ id: "tokens-color", label: "色" }, { id: "tokens-type", label: "文字" }, { id: "tokens-space", label: "余白・角丸・影" }, { id: "icons", label: "Icon" }] },
  { group: "第2章 主体と状態", items: [{ id: "actors", label: "判断の主体" }, { id: "vocab", label: "状態の語彙" }, { id: "roles", label: "ロール" }] },
  { group: "5.1 レイアウト", items: ["PublicHeader", "PublicFooter", "GlobalHeader", "OrgSwitcher", "UserMenu", "SideNav", "Breadcrumb", "PageHeader", "MetaSidebar", "Stepper", "PortalHeader"].map((x) => ({ id: x, label: x })) },
  { group: "5.2 表示", items: ["StatusBadge", "ActorLabel", "UserChip", "RoleBadge", "IdLink", "HashDisplay", "Timestamp", "DeadlineIndicator", "KeyValueList", "StatCard", "CoverageMeter", "GateSummaryStrip", "GateResultPanel", "EnforcementBadge", "PolicyVersionTag", "ControlLayerTag", "DataClassBadge", "SignatureBadge", "RetentionBadge", "Timeline", "DiffViewer", "MarkdownViewer", "JsonViewer", "CodeRef", "ChecklistPanel", "TraceGraph", "TraceMatrix", "EmptyState", "Skeleton", "ErrorState", "Banner", "Toast", "Tooltip", "Accordion", "PhaseBand"].map((x) => ({ id: x, label: x })) },
  { group: "5.3 入力", items: ["Button", "TextField", "TextArea", "MarkdownEditor", "Select", "Combobox", "DatePicker", "Checkbox", "OptionCard", "FileUpload", "SearchBox", "FilterBar", "Tabs", "Pagination", "DataTable"].map((x) => ({ id: x, label: x === "Checkbox" ? "Checkbox / Radio / Toggle" : x })) },
  { group: "5.4 重ね表示", items: ["Modal", "ConfirmDialog", "Drawer", "Popover"].map((x) => ({ id: x, label: x === "Popover" ? "Popover / Menu" : x })) },
  { group: "5.5 業務", items: ["ApprovalPanel", "ApprovalRequestCard", "SoDNotice", "AIFindingCard", "AIDraftBanner", "AIUnavailableNotice", "TraceLinkEditor", "ExceptionSummary", "EvidenceItem", "CommentThread", "ShareLinkPanel", "PlanLimitNotice", "StateFlow"].map((x) => ({ id: x, label: x })) },
  { group: "5.6 連携・経営", items: SYNC_TOC.map((x) => ({ id: x, label: x === "vocab-sync" ? "語彙（連携・経営）" : x })) },
];

function Sec({ id, title, desc, children }: { id: string; title?: string; desc?: ReactNode; children: ReactNode }) {
  return (
    <section className="cat-sec" id={id}>
      <div className="cat-sec-head">
        <h3>{title ?? id}</h3>
        {desc ? <p>{desc}</p> : null}
      </div>
      <div className="cat-demo">{children}</div>
    </section>
  );
}

function Row({ label, children, block }: { label: ReactNode; children: ReactNode; block?: boolean }) {
  return (
    <div className={block ? "cat-demo-row block" : "cat-demo-row"}>
      <span className="cat-label">{label}</span>
      <div className="cat-body">{children}</div>
    </div>
  );
}

function GroupTitle({ children }: { children: ReactNode }) {
  return <h2 className="cat-group-title">{children}</h2>;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- 基礎 ----------
const COLOR_TOKENS = [
  ["背景", ["--bg", "--bg-subtle", "--bg-sunken", "--surface", "--surface-raised"]],
  ["線と文字", ["--border", "--border-strong", "--text", "--text-strong", "--muted", "--muted-strong"]],
  ["主要色", ["--primary", "--primary-hover", "--primary-tint", "--primary-tint-strong", "--focus"]],
  ["状態トーン", ["--tone-pass", "--tone-pass-bg", "--tone-fail", "--tone-fail-bg", "--tone-warn", "--tone-warn-bg", "--tone-info", "--tone-info-bg", "--tone-neutral", "--tone-neutral-bg", "--tone-special", "--tone-special-bg"]],
] as const;

const ICON_NAMES = ["search", "bell", "inbox", "check", "checkCircle", "xCircle", "alert", "alertCircle", "info", "shield", "shieldCheck", "shieldX", "sparkles", "user", "users", "settings", "cpu", "circleDashed", "file", "fileText", "fileCheck", "folder", "pullRequest", "commit", "branch", "link", "copy", "download", "upload", "external", "lock", "key", "clock", "calendar", "flag", "layers", "list", "grid", "home", "chart", "barChart", "trace", "archive", "signature", "eye", "edit", "trash", "refresh", "filter", "more", "sun", "moon", "logout", "mail", "github", "database", "book", "scale", "package", "rocket", "message", "history", "compare", "building", "creditCard", "wrench"] as const;

function Foundations() {
  return (
    <>
      <GroupTitle>基礎</GroupTitle>
      <Sec id="tokens-color" title="色" desc="tokens.css の CSS 変数。ライト／ダークで値が切り替わる">
        {COLOR_TOKENS.map(([g, vars]) => (
          <Row key={g} label={g} block>
            <div className="cat-swatches">
              {vars.map((v) => (
                <div key={v} className="cat-swatch">
                  <span className="chip-color" style={{ background: `var(${v})` }} />
                  <code>{v}</code>
                </div>
              ))}
            </div>
          </Row>
        ))}
      </Sec>
      <Sec id="tokens-type" title="文字" desc="本文 13px、見出し 18px。等幅は ID とハッシュに使う">
        {[["--text-3xl", "40px 公開サイトの大見出し"], ["--text-2xl", "28px KPI の数値"], ["--text-xl", "22px 公開サイトの見出し"], ["--text-lg", "18px 画面タイトル"], ["--text-md", "14px セクション見出し"], ["--text-sm", "13px 本文（既定）"], ["--text-xs", "12px 補足・表の一部"], ["--text-2xs", "11px ラベル・バッジ"]].map(([v, d]) => (
          <Row key={v} label={<code>{v}</code>}>
            <span style={{ fontSize: `var(${v})`, color: "var(--text-strong)", fontWeight: 600, lineHeight: 1.3 }}>受発注システム刷新</span>
            <span className="tiny muted">{d}</span>
          </Row>
        ))}
        <Row label="等幅"><span className="mono">REQ-0012 · 9f2c4e1a · CTL-SI-005</span></Row>
      </Sec>
      <Sec id="tokens-space" title="余白・角丸・影">
        <Row label="余白" block>
          <div className="row" style={{ alignItems: "flex-end" }}>
            {["--space-1", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-8", "--space-10"].map((v) => (
              <div key={v} className="stack" style={{ ["--gap" as string]: "4px", alignItems: "center" }}>
                <span style={{ width: `var(${v})`, height: `var(${v})`, background: "var(--primary-tint-strong)", borderRadius: 2 }} />
                <code className="tiny">{v}</code>
              </div>
            ))}
          </div>
        </Row>
        <Row label="角丸">
          {["--radius-sm", "--radius", "--radius-lg", "--radius-pill"].map((v) => (
            <div key={v} className="stack" style={{ ["--gap" as string]: "4px", alignItems: "center" }}>
              <span style={{ width: 64, height: 40, border: "1px solid var(--border-strong)", borderRadius: `var(${v})`, background: "var(--bg-subtle)" }} />
              <code className="tiny">{v}</code>
            </div>
          ))}
        </Row>
        <Row label="影">
          {["--shadow-sm", "--shadow-md", "--shadow-lg"].map((v) => (
            <div key={v} className="stack" style={{ ["--gap" as string]: "8px", alignItems: "center", padding: 8 }}>
              <span style={{ width: 96, height: 56, borderRadius: 8, background: "var(--surface)", boxShadow: `var(${v})` }} />
              <code className="tiny">{v}</code>
            </div>
          ))}
        </Row>
      </Sec>
      <Sec id="icons" title="Icon" desc="線画アイコン（icons.tsx）。外部ライブラリに依存しない">
        <Row label="一覧" block>
          <div className="row" style={{ ["--gap" as string]: "6px" }}>
            {ICON_NAMES.map((n) => (
              <Tooltip key={n} text={n}>
                <span style={{ display: "inline-grid", placeItems: "center", width: 36, height: 36, border: "1px solid var(--border)", borderRadius: 8 }}>
                  <Icon name={n} size={18} />
                </span>
              </Tooltip>
            ))}
          </div>
        </Row>
      </Sec>
    </>
  );
}

// ---------- 第2章 ----------
const VOCABS: [string, Record<string, StatusVocab>][] = [
  ["ゲート", GATE_STATUS],
  ["承認", APPROVAL_STATUS],
  ["要求・設計", ARTIFACT_STATUS],
  ["AI所見", AI_STATUS],
  ["例外", EXCEPTION_STATUS],
  ["リスク・是正", RISK_STATUS],
  ["変更要求", CHANGE_STATUS],
  ["リリース", RELEASE_STATUS],
  ["証跡", EVIDENCE_STATUS],
  ["統制項目", CONTROL_STATUS],
  ["メンバー", MEMBER_STATUS],
  ["共有リンク", SHARE_STATUS],
];

function Chapter2() {
  return (
    <>
      <GroupTitle>第2章 判断の主体と状態の語彙</GroupTitle>
      <Sec id="actors" title="判断の主体" desc="CI／人間／AI／システムを色だけに頼らずアイコンとラベルで区別する。AI は破線で「参考」と明示">
        {(Object.keys(ACTOR_KIND) as ActorKind[]).map((k) => (
          <Row key={k} label={ACTOR_KIND[k].label}>
            <ActorLabel kind={k} />
            <ActorLabel kind={k} name={k === "ci" ? "Gate B" : k === "human" ? "佐藤 美咲" : k === "ai" ? "要求レビュー" : "Signer"} />
            <ActorLabel kind={k} size="sm" />
            <ActorLabel kind={k} iconOnly />
          </Row>
        ))}
      </Sec>
      <Sec id="vocab" title="状態の語彙" desc="vocab.ts の全語彙。全画面で同じ語と色を使う">
        {VOCABS.map(([label, v]) => (
          <Row key={label} label={label}>
            {Object.entries(v).map(([k, s]) => <StatusBadge key={k} vocab={s} />)}
          </Row>
        ))}
        <Row label="強制レベル">
          {(Object.keys(ENFORCEMENT_LEVEL) as EnforcementLevel[]).map((l) => <EnforcementBadge key={l} level={l} />)}
        </Row>
        <Row label="統制の層">
          {(Object.keys(CONTROL_LAYER) as ControlLayer[]).map((l) => <ControlLayerTag key={l} layer={l} />)}
        </Row>
        <Row label="データ分類">
          {(Object.keys(DATA_CLASS) as DataClass[]).map((d) => <DataClassBadge key={d} value={d} />)}
        </Row>
      </Sec>
      <Sec id="roles" title="ロール" desc="第3章">
        <Row label="RoleBadge">
          {ROLES.map((r) => <RoleBadge key={r.name} role={r.name} />)}
        </Row>
      </Sec>
    </>
  );
}

// ---------- 5.1 レイアウト ----------
function Layouts() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      <GroupTitle>5.1 レイアウト部品</GroupTitle>
      <Sec id="PublicHeader" desc="公開サイトのヘッダー。スクロールで縮小、スマートフォンではメニューボタンで開閉">
        <Row label="既定" block><div className="cat-frame"><PublicHeader /></div></Row>
      </Sec>
      <Sec id="PublicFooter" desc="会社情報、規約、規格の商標に関する注記">
        <Row label="既定" block><div className="cat-frame"><PublicFooter /></div></Row>
      </Sec>
      <Sec id="GlobalHeader" desc="アプリ上部。組織切替、検索、承認待ち、通知、ユーザー">
        <Row label="既定" block><div className="cat-frame" style={{ display: "grid" }}><GlobalHeader org={ORG} onMenu={() => undefined} /></div></Row>
      </Sec>
      <Sec id="OrgSwitcher" desc="現在の組織、所属組織の一覧、組織を作成、パートナー">
        <Row label="複数の組織"><OrgSwitcher org={ORG} /></Row>
        <Row label="別の組織を選択中"><OrgSwitcher org="demo-lab" /></Row>
      </Sec>
      <Sec id="UserMenu" title="UserMenu / NotificationMenu" desc="アバター、個人設定、テーマ切替、サインアウト／未読件数と通知">
        <Row label="UserMenu"><UserMenu /></Row>
        <Row label="NotificationMenu"><NotificationMenu org={ORG} /></Row>
        <Row label="ThemeToggle"><ThemeToggle /></Row>
        <Row label="Brand"><Brand to={paths.home()} /><Brand to={paths.home()} small /></Row>
      </Sec>
      <Sec id="SideNav" desc="組織の項目とプロジェクトの項目。展開・折りたたみ、現在地、件数バッジ">
        <Row label={collapsed ? "折りたたみ" : "展開（プロジェクト選択時）"} block>
          <div className="cat-frame" style={{ height: 460, width: collapsed ? 72 : 260, overflow: "auto" }}>
            <div className={collapsed ? "app collapsed" : "app"} style={{ display: "block", minHeight: 0 }}>
              <SideNav org={ORG} project={PROJECT} active="requirements" collapsed={collapsed} onCollapse={() => setCollapsed((v) => !v)} />
            </div>
          </div>
        </Row>
        <Row label="組織のみ" block>
          <div className="cat-frame" style={{ height: 300, width: 260 }}>
            <div className="app" style={{ display: "block", minHeight: 0 }}>
              <SideNav org={ORG} active="dashboard" collapsed={false} onCollapse={() => undefined} />
            </div>
          </div>
        </Row>
      </Sec>
      <Sec id="Breadcrumb" desc="組織 › プロジェクト › 画面 › 項目ID。長い場合は省略">
        <Row label="既定"><Breadcrumb items={[{ label: "サンプルソフト株式会社", to: "/" }, { label: "受発注システム刷新", to: "/" }, { label: "要求", to: "/" }, { label: "REQ-0007" }]} /></Row>
        <Row label="長い項目"><Breadcrumb items={[{ label: "サンプルソフト株式会社", to: "/" }, { label: "受発注システム刷新", to: "/" }, { label: "ゲート実行", to: "/" }, { label: "run-5821 操作ログを追記専用ストレージへ書き込む（長いタイトルの省略表示を確認するための例）" }]} /></Row>
      </Sec>
      <Sec id="PageHeader" desc="タイトル、ID、状態、説明、操作ボタン（最大3つ＋その他）、タブ">
        <Row label="ボタンなし" block><PageHeader title="プロジェクト一覧" description="組織のプロジェクトとゲートの状況" /></Row>
        <Row label="ID・状態・1〜3個" block>
          <PageHeader id="REQ-0007" title="取引先マスタを CSV で一括登録できる" status={ARTIFACT_STATUS.inReview} description="最終更新 1日前 · 版 1" actions={<><Button icon="sparkles">AIでレビュー</Button><Button icon="edit">編集</Button><Button variant="primary" icon="check">承認を依頼</Button></>} />
        </Row>
        <Row label="その他メニュー・タブ" block>
          <PageHeader id="EXC-0008" title="PR #142 のトレーサビリティ例外" status={EXCEPTION_STATUS.applying} actions={<><Button variant="primary" icon="check">承認</Button><MoreMenu items={[{ label: "取り下げ", icon: "x" }, { label: "リンクをコピー", icon: "link" }, "separator", { label: "削除", icon: "trash", danger: true, disabled: true }]} /></>} tabs={<Tabs value="content" onChange={() => undefined} tabs={[{ value: "content", label: "内容" }, { value: "related", label: "関連", count: 3 }, { value: "history", label: "履歴" }, { value: "comments", label: "コメント", count: 2 }]} />} />
        </Row>
      </Sec>
      <Sec id="MetaSidebar" title="MetaSidebar / MetaSection" desc="詳細画面の右側の属性一覧。折りたたみ可能なセクション">
        <Row label="開・閉" block>
          <div style={{ maxWidth: 320 }} className="stack">
            <MetaSection title="属性">
              <KeyValueList stacked items={[{ label: "担当者", value: <UserChip user={userById("u-takahashi")} /> }, { label: "作成日時", value: <Timestamp at="2026-11-26T16:00:00+09:00" mode="absolute" /> }, { label: "データ分類", value: <DataClassBadge value="internal" /> }]} />
            </MetaSection>
            <MetaSection title="関連項目" defaultOpen={false}>
              <IdLink id="CR-0003" />
            </MetaSection>
          </div>
        </Row>
      </Sec>
      <Sec id="Stepper" desc="オンボーディングの手順。完了、現在、未着手、エラー">
        <Row label="1/7" block><Stepper steps={ONBOARDING_STEPS} current={0} /></Row>
        <Row label="4/7" block><Stepper steps={ONBOARDING_STEPS} current={3} /></Row>
        <Row label="エラー" block><Stepper steps={ONBOARDING_STEPS} current={1} errorAt={1} /></Row>
        <Row label="完了" block><Stepper steps={ONBOARDING_STEPS} current={7} /></Row>
      </Sec>
      <Sec id="PortalHeader" desc="顧客ポータル・評価者ビューのヘッダー">
        <Row label="顧客" block><div className="cat-frame"><PortalHeader /></div></Row>
        <Row label="評価者" block><div className="cat-frame"><PortalHeader external="assessor" /></div></Row>
      </Sec>
    </>
  );
}

// ---------- 5.2 表示 ----------
const timelineItems: TimelineItem[] = [
  { id: "1", actor: { kind: "human", name: "高橋 健" }, action: "状態を変更", target: <StatusBadge vocab={ARTIFACT_STATUS.inReview} size="sm" />, at: "2026-11-27T09:00:00+09:00", kind: "status" },
  { id: "2", actor: { kind: "ai", name: "要求レビュー" }, action: "所見を3件記録", at: "2026-11-26T16:05:00+09:00", detail: "曖昧性 1 · テスト可能性 1 · 矛盾 1", kind: "ai" },
  { id: "3", actor: { kind: "ci", name: "Gate B" }, action: "ブロックと判定", target: <IdLink id="run-5821" />, at: "2026-11-27T09:39:00+09:00", kind: "gate" },
  { id: "4", actor: { kind: "human", name: "佐藤 美咲" }, action: "承認", at: "2026-11-26T18:31:00+09:00", detail: "期限は 12/3 までとします", kind: "approval" },
  { id: "5", actor: { kind: "system", name: "Signer" }, action: "Manifest に署名", target: <IdLink id="MAN-0013" />, at: "2026-11-05T17:06:00+09:00" },
];

const traceNodes: TraceNode[] = [
  { id: "REQ-0001", col: 0, title: "発注書を作成できる" },
  { id: "REQ-0003", col: 0, title: "基幹システムへ連携" },
  { id: "REQ-0006", col: 0, title: "操作ログを7年保存" },
  { id: "ADR-0002", col: 1, title: "シーケンスで採番" },
  { id: "ADR-0003", col: 1, title: "ファイル連携" },
  { id: "ADR-0004", col: 1, title: "追記専用ストレージ" },
  { id: "PR #124", col: 2, title: "発注書の保存" },
  { id: "PR #140", col: 2, title: "再送処理" },
  { id: "PR #142", col: 2, title: "ログ書込み" },
  { id: "TC-0101", col: 3, title: "発注書を保存できる" },
  { id: "missing-1", col: 3, title: "REQ-0003 のテスト", missing: true },
  { id: "missing-2", col: 3, title: "REQ-0006 のテスト", missing: true },
];
const traceEdges: TraceEdge[] = [
  { from: "REQ-0001", to: "ADR-0002" },
  { from: "ADR-0002", to: "PR #124" },
  { from: "PR #124", to: "TC-0101" },
  { from: "REQ-0003", to: "ADR-0003" },
  { from: "ADR-0003", to: "PR #140" },
  { from: "PR #140", to: "missing-1" },
  { from: "REQ-0006", to: "ADR-0004" },
  { from: "ADR-0004", to: "PR #142", ai: true },
  { from: "PR #142", to: "missing-2" },
];

function Displays() {
  const toast = useToast();
  const [sel, setSel] = useState<string | undefined>("REQ-0003");
  const block = gateRunById("run-5821");
  const sato = userById("u-sato");
  const agent = userById("u-agent");
  const customer = userById("u-nakamura");
  const disabled = userById("u-kato");
  return (
    <>
      <GroupTitle>5.2 表示部品</GroupTitle>
      <Sec id="StatusBadge" desc="第2章の状態語彙。色に加えてアイコンを持つ">
        <Row label="サイズ 小・中・大">
          <StatusBadge vocab={GATE_STATUS.block} size="sm" />
          <StatusBadge vocab={GATE_STATUS.block} />
          <StatusBadge vocab={GATE_STATUS.block} size="lg" />
        </Row>
        <Row label="アイコンなし"><StatusBadge vocab={APPROVAL_STATUS.approved} icon={false} /></Row>
        <Row label="Tag（汎用ラベル）">
          {(["pass", "fail", "warn", "info", "neutral", "special", "primary"] as const).map((t) => <Tag key={t} tone={t}>{t}</Tag>)}
          <Tag square icon="layers">四角</Tag>
          <Tag dashed tone="special">破線</Tag>
        </Row>
      </Sec>
      <Sec id="ActorLabel" desc="4種類 × アイコンのみ・名前付き（第2章の節を参照）">
        <Row label="名前付き">{(["ci", "human", "ai", "system"] as ActorKind[]).map((k) => <ActorLabel key={k} kind={k} name="名前" />)}</Row>
        <Row label="アイコンのみ">{(["ci", "human", "ai", "system"] as ActorKind[]).map((k) => <ActorLabel key={k} kind={k} iconOnly />)}</Row>
      </Sec>
      <Sec id="UserChip" desc="アバター、名前、ロール。外部・無効・AIエージェント">
        <Row label="通常"><UserChip user={sato} /><UserChip user={sato} showRole={false} /><UserChip user={sato} plain /></Row>
        <Row label="外部（顧客・評価者）"><UserChip user={customer} /><UserChip user={userById("u-assessor")} /></Row>
        <Row label="無効化されたユーザー"><UserChip user={disabled} /></Row>
        <Row label="AIエージェント"><UserChip user={agent} /></Row>
        <Row label="未割当"><UserChip user={undefined} /></Row>
        <Row label="Avatar / AvatarStack"><Avatar user={sato} /><Avatar user={sato} size="lg" /><Avatar user={sato} size="xl" /><Avatar user={customer} size="lg" /><Avatar user={agent} size="lg" /><AvatarStack users={users.slice(0, 7)} /></Row>
      </Sec>
      <Sec id="RoleBadge" desc="ロール名">
        <Row label="全ロール">{ROLES.map((r) => <RoleBadge key={r.name} role={r.name} />)}</Row>
      </Sec>
      <Sec id="IdLink" desc="IDリンク。マウスを乗せるとタイトルと状態を表示">
        <Row label="存在する（ホバー）"><IdLink id="REQ-0012" to={paths.requirement(ORG, PROJECT, "REQ-0012")} title="発注金額の上限を取引先ごとに設定できる" status={ARTIFACT_STATUS.pending} /><IdLink id="ADR-0003" title="基幹連携はファイル連携とし、再送を可能にする" status={ARTIFACT_STATUS.inReview} /><IdLink id="CTL-PM-001" /></Row>
        <Row label="削除済み"><IdLink id="REQ-0011" state="deleted" /></Row>
        <Row label="権限なし"><IdLink id="REQ-0201" state="forbidden" /></Row>
      </Sec>
      <Sec id="HashDisplay" desc="先頭8文字。コピーと全文表示">
        <Row label="通常"><HashDisplay value={fakeSha("a")} /><HashDisplay value={fakeSha("b")} label="SHA-256" /></Row>
        <Row label="検証一致"><HashDisplay value={fakeSha("c")} verified="match" /></Row>
        <Row label="検証不一致"><HashDisplay value={fakeSha("d")} verified="mismatch" /></Row>
        <Row label="全文" block><HashDisplay value={fakeSha("e")} full /></Row>
        <Row label="値なし"><HashDisplay value="" /></Row>
      </Sec>
      <Sec id="Timestamp" desc="相対時刻。マウスを乗せると絶対時刻とタイムゾーン">
        <Row label="相対"><Timestamp at="2026-11-27T10:29:40+09:00" /><Timestamp at="2026-11-27T10:05:00+09:00" /><Timestamp at="2026-11-27T07:00:00+09:00" /><Timestamp at="2026-11-20T10:00:00+09:00" /><Timestamp at="2026-08-01T10:00:00+09:00" /></Row>
        <Row label="絶対・日付"><Timestamp at="2026-11-27T09:39:00+09:00" mode="absolute" /><Timestamp at="2026-11-27T09:39:00+09:00" mode="date" /></Row>
      </Sec>
      <Sec id="DeadlineIndicator" desc="期限と残り日数">
        <Row label="余裕あり"><DeadlineIndicator date="2026-12-20" /></Row>
        <Row label="7日以内"><DeadlineIndicator date="2026-11-30" /></Row>
        <Row label="当日"><DeadlineIndicator date="2026-11-27" /></Row>
        <Row label="超過"><DeadlineIndicator date="2026-11-24" /></Row>
        <Row label="コンパクト"><DeadlineIndicator date="2026-12-03" compact /></Row>
      </Sec>
      <Sec id="KeyValueList" desc="項目名と値の一覧">
        <Row label="縦並び" block><KeyValueList items={[{ label: "顧客", value: "架空商事株式会社" }, { label: "フェーズ", value: "実装" }, { label: "Control Pack", value: <PolicyVersionTag pack="Basic Control Pack" version="1.3.0" /> }]} /></Row>
        <Row label="2列" block><KeyValueList cols={2} items={[{ label: "ブランチ", value: "feature/audit-log" }, { label: "コミット", value: <HashDisplay value={fakeSha("x")} /> }, { label: "実行ID", value: "gh-run-99812345" }, { label: "判定日時", value: <Timestamp at="2026-11-27T09:39:00+09:00" mode="absolute" /> }]} /></Row>
        <Row label="積み上げ" block><div style={{ maxWidth: 300 }}><KeyValueList stacked items={[{ label: "担当者", value: "高橋 健" }, { label: "期限", value: "2026/12/03" }]} /></div></Row>
      </Sec>
      <Sec id="StatCard" desc="KPIの数値。押すと絞り込み先へ">
        <Row label="通常・警告・危険・良好" block>
          <div className="grid cols-4">
            <StatCard label="承認待ち" value={5} unit="件" icon="inbox" delta="前日比 +2" to={paths.inbox(ORG)} />
            <StatCard label="7日以内に期限の例外" value={2} unit="件" icon="flag" tone="warn" />
            <StatCard label="ブロック中のPR" value={2} unit="件" icon="shieldX" tone="danger" />
            <StatCard label="統制項目の充足率" value={71} unit="%" icon="checkCircle" tone="good" />
          </div>
        </Row>
        <Row label="読み込み中" block><div className="grid cols-4"><StatCard label="承認待ち" value={0} loading /></div></Row>
      </Sec>
      <Sec id="CoverageMeter" desc="割合と分子・分母">
        <Row label="100%・一部・低・0%" block>
          <div className="grid cols-4">
            <CoverageMeter value={26} total={26} label="テストまで" />
            <CoverageMeter value={31} total={38} label="テストまで" />
            <CoverageMeter value={12} total={20} label="設計まで" />
            <CoverageMeter value={0} total={5} label="検証" />
          </div>
        </Row>
        <Row label="コンパクト"><CoverageMeter value={31} total={38} compact /></Row>
      </Sec>
      <Sec id="GateSummaryStrip" desc="ゲートA〜Dを4つの小さなアイコンで">
        <Row label="全通過"><GateSummaryStrip gates={{ A: "pass", B: "pass", C: "pass", D: "pass" }} /></Row>
        <Row label="ブロックあり"><GateSummaryStrip gates={{ A: "pass", B: "block", C: "pass", D: "pass" }} /></Row>
        <Row label="警告・例外"><GateSummaryStrip gates={{ A: "warn", B: "exception", C: "pass", D: "pass" }} /></Row>
        <Row label="実行中・未実行"><GateSummaryStrip gates={{ A: "pass", B: "running", C: "notRun", D: "notRun" }} /></Row>
      </Sec>
      <Sec id="GateResultPanel" desc="ゲート1つ分。判定、理由、修正方法、強制レベル、ポリシーのバージョン">
        <Row label="ブロック（ソフト）" block><GateResultPanel letter="B" status="block" reasons={block.reasons.filter((r) => r.gate === "B")} enforcement="soft" policyVersion={block.policy_version} onException={() => toast({ kind: "info", message: "例外の申請画面を開きます" })} /></Row>
        <Row label="ブロック（ハード）" block><GateResultPanel letter="C" status="block" reasons={gateRunById("run-5820").reasons} enforcement="hard" policyVersion={block.policy_version} /></Row>
        <Row label="警告" block><GateResultPanel letter="A" status="warn" reasons={gateRunById("run-5808").reasons} enforcement="soft" policyVersion={block.policy_version} /></Row>
        <Row label="通過" block><GateResultPanel letter="D" status="pass" reasons={[]} enforcement="soft" policyVersion={block.policy_version} /></Row>
        <Row label="例外適用中" block><GateResultPanel letter="B" status="exception" reasons={gateRunById("run-5815").reasons} enforcement="soft" policyVersion={block.policy_version} /></Row>
        <Row label="実行中・未実行" block>
          <div className="stack">
            <GateResultPanel letter="B" status="running" reasons={[]} enforcement="soft" policyVersion={block.policy_version} />
            <GateResultPanel letter="C" status="notRun" reasons={[]} enforcement="soft" policyVersion={block.policy_version} />
          </div>
        </Row>
      </Sec>
      <Sec id="EnforcementBadge" desc="強制レベル">
        {(Object.keys(ENFORCEMENT_LEVEL) as EnforcementLevel[]).map((l) => <Row key={l} label={ENFORCEMENT_LEVEL[l].label}><EnforcementBadge level={l} showDescription /></Row>)}
      </Sec>
      <Sec id="PolicyVersionTag" desc="Control Pack 名とバージョン">
        <Row label="最新・更新あり"><PolicyVersionTag pack="Basic Control Pack" version="1.3.0" /><PolicyVersionTag pack="Basic Control Pack" version="1.2.1" outdated /></Row>
      </Sec>
      <Sec id="ControlLayerTag" desc="統制の層"><Row label="4層">{(Object.keys(CONTROL_LAYER) as ControlLayer[]).map((l) => <ControlLayerTag key={l} layer={l} />)}</Row></Sec>
      <Sec id="DataClassBadge" desc="データ分類（ホバーで実行先）"><Row label="4分類">{(Object.keys(DATA_CLASS) as DataClass[]).map((d) => <DataClassBadge key={d} value={d} />)}</Row></Sec>
      <Sec id="SignatureBadge" desc="署名の状態と署名者">
        <Row label="4状態"><SignatureBadge state="unsigned" /><SignatureBadge state="signed" signer="Signer (KMS)" /><SignatureBadge state="verified" signer="Signer (KMS)" /><SignatureBadge state="failed" /></Row>
        <Row label="大"><SignatureBadge state="verified" size="lg" /><SignatureBadge state="failed" size="lg" /></Row>
      </Sec>
      <Sec id="RetentionBadge" desc="WORM 保管の状態と保持期限">
        <Row label="3状態"><RetentionBadge state="pending" /><RetentionBadge state="stored" until="2033-11-05" /><RetentionBadge state="expiring" until="2026-12-31" /></Row>
      </Sec>
      <Sec id="Timeline" desc="時系列の出来事。状態変更、承認、コメント、AI所見、ゲート結果">
        <Row label="通常" block><Timeline items={timelineItems} /></Row>
        <Row label="コンパクト" block><Timeline items={timelineItems.slice(0, 3)} compact /></Row>
      </Sec>
      <Sec id="DiffViewer" desc="文書の差分">
        <Row label="横並び" block><DiffViewer before={"取引先マスタを CSV ファイルで一括登録できる。\n必要に応じてエラー行を表示する。"} after={"取引先マスタを CSV ファイルで一括登録・更新できる。\n取込に失敗した行がある場合は、行番号と理由を一覧で表示する。"} /></Row>
        <Row label="縦並び" block><DiffViewer mode="unified" before={"上限額は税抜で判定する。"} after={"上限額は税込で判定する。"} /></Row>
        <Row label="変更なし" block><DiffViewer before="同じ内容" after="同じ内容" /></Row>
      </Sec>
      <Sec id="MarkdownViewer" desc="見出し、表、コード、引用。長文は折りたたみ">
        <Row label="通常" block><MarkdownViewer source={"## 背景\n基幹システムとの連携方式を決める。\n\n- ファイル連携\n- API 連携\n\n| 案 | 再送 |\n| --- | --- |\n| ファイル | 可 |\n| API | 要実装 |\n\n> 決定: ファイル連携とする。\n\n`retry_count` は 3 回。"} /></Row>
        <Row label="ハイライト" block><MarkdownViewer source={"取引先マスタを CSV ファイルで一括登録・更新できる。必要に応じてエラー行を表示する。"} highlights={["必要に応じて", "更新"]} activeHighlight="必要に応じて" /></Row>
        <Row label="折りたたみ" block><MarkdownViewer collapsible source={Array.from({ length: 14 }).map((_, i) => `${i + 1}. 長い本文の行 ${i + 1}`).join("\n")} /></Row>
      </Sec>
      <Sec id="JsonViewer" desc="JSON の整形表示、折りたたみ、コピー">
        <Row label="既定" block><JsonViewer value={{ project: "P-2026-001", profile: "software-basic", control_pack_version: "1.3.0", commit_sha: fakeSha("c").slice(0, 16), approvals: [{ role: "technical-lead", subject: "u-tanaka" }], exceptions: [], signed: true }} /></Row>
      </Sec>
      <Sec id="CodeRef" desc="リポジトリ、PR、コミット、ファイルへのリンク">
        <Row label="4種類"><CodeRef kind="repo" value="sample-soft/order-api" /><CodeRef kind="pr" repo="sample-soft/order-api" value="142" /><CodeRef kind="commit" repo="sample-soft/order-api" value={fakeSha("c142")} /><CodeRef kind="file" value="src/audit/writer.rs" line={42} /></Row>
      </Sec>
      <Sec id="ChecklistPanel" desc="充足状態、根拠、判定の主体">
        <Row label="一部未充足" block>
          <ChecklistPanel title="リリースゲート" items={[
            { id: "1", title: "必要な文書がそろっている", state: "ok", actor: "ci", detail: "要求仕様、設計、テスト報告" },
            { id: "2", title: "承認済み要求のテストがすべて成功", state: "ng", actor: "ci", detail: "TC-0110 が失敗" },
            { id: "3", title: "リリース承認", state: "pending", actor: "human", detail: "リリース管理者の承認待ち" },
          ]} />
        </Row>
        <Row label="全充足" block><ChecklistPanel title="計画の必須項目" items={[{ id: "1", title: "納入物", state: "ok" }, { id: "2", title: "スケジュール", state: "ok" }]} /></Row>
      </Sec>
      <Sec id="TraceGraph" title="TraceGraph / TraceLegend" desc="確定リンク（実線）、AI候補（破線）、欠落、選択、拡大縮小">
        <Row label="選択中" block>
          <div className="stack">
            <TraceLegend />
            <TraceGraph nodes={traceNodes} edges={traceEdges} selected={sel} onSelect={setSel} />
          </div>
        </Row>
        <Row label="AI候補を非表示" block><TraceGraph nodes={traceNodes} edges={traceEdges} showAi={false} height={260} /></Row>
      </Sec>
      <Sec id="TraceMatrix" desc="要求×成果物。リンクあり、なし、AI候補のみ">
        <Row label="既定" block>
          <TraceMatrix columns={["設計", "コード／PR", "テストケース", "テスト結果", "検証"]} rows={[
            { id: "REQ-0001", title: "発注書を作成できる", cells: [{ count: 2 }, { count: 2 }, { count: 2 }, { count: 2 }, { count: 1 }] },
            { id: "REQ-0003", title: "基幹システムへ連携", cells: [{ count: 1 }, { count: 1 }, { count: 0 }, { count: 0 }, { count: 0 }] },
            { id: "REQ-0006", title: "操作ログを7年保存", cells: [{ count: 1 }, { count: 0, ai: 1 }, { count: 0 }, { count: 0 }, { count: 0 }] },
          ]} onCell={(r, c) => toast({ kind: "info", message: `${r} の列 ${c + 1} を開きます` })} />
        </Row>
      </Sec>
      <Sec id="EmptyState" desc="初回、絞り込み結果なし、権限なし">
        <Row label="初回" block><EmptyState title="要求がまだありません" description="SOW から要求候補を取り込むか、最初の要求を作成してください。" action={<Button variant="primary" icon="plus">要求を作成</Button>} /></Row>
        <Row label="絞り込み結果なし" block><EmptyState variant="filtered" title="条件に一致する要求はありません" description="絞り込み条件を変更してください。" action={<Button>条件をクリア</Button>} /></Row>
        <Row label="権限なし" block><EmptyState variant="forbidden" title="閲覧する権限がありません" description="プロジェクトの PM に参加を依頼してください。" /></Row>
      </Sec>
      <Sec id="Skeleton" desc="読み込み中の形">
        <Row label="表" block><Skeleton rows={3} /></Row>
        <Row label="カード" block><Skeleton variant="card" /></Row>
        <Row label="詳細" block><Skeleton variant="detail" rows={4} /></Row>
      </Sec>
      <Sec id="ErrorState" desc="エラーの説明、再試行、問い合わせ用ID">
        <Row label="既定" block><ErrorState onRetry={() => toast({ kind: "info", message: "再試行しました" })} /></Row>
      </Sec>
      <Sec id="Banner" desc="情報、成功、警告、危険。閉じる可否">
        <Row label="情報" block><Banner tone="info" title="Basic Control Pack 1.3.1 が公開されました">移行レポートで影響を確認できます。</Banner></Row>
        <Row label="成功" block><Banner tone="pass" title="承認しました" onClose={() => undefined} /></Row>
        <Row label="警告" block><Banner tone="warn" title="承認済みの要求を編集しています">保存すると状態が「変更中」に戻り、再承認が必要です。</Banner></Row>
        <Row label="危険" block><Banner tone="fail" title="署名の検証に失敗しました" action={<Button size="sm">詳細</Button>}>artifact_sha256 が一致しません。</Banner></Row>
      </Sec>
      <Sec id="Toast" desc="操作結果の一時通知（右下）">
        <Row label="成功・失敗・元に戻す">
          <Button onClick={() => toast({ kind: "success", message: "保存しました" })}>成功</Button>
          <Button onClick={() => toast({ kind: "error", message: "保存できませんでした" })}>失敗</Button>
          <Button onClick={() => toast({ kind: "success", message: "AI所見を却下しました", undo: () => toast({ kind: "info", message: "元に戻しました" }) })}>元に戻すボタン付き</Button>
        </Row>
      </Sec>
      <Sec id="Tooltip" desc="補足説明">
        <Row label="ホバー"><Tooltip text="強制レベルがソフトのため、承認された例外で通過できます"><Button icon="info">ホバーしてください</Button></Tooltip></Row>
      </Sec>
      <Sec id="Accordion" desc="開閉する一覧">
        <Row label="既定" block>
          <Accordion defaultOpen={0} items={[
            { title: "AI はゲートの合否を決めますか？", body: "いいえ。判定は決定論的なルールと人間の承認で行い、AI の所見は参考として記録します。" },
            { title: "認証を取得できますか？", body: "本サービスは適合準備の支援です。認証は第三者の認証機関が行います。" },
            { title: "AI 機能を無効にできますか？", body: "組織または機能ごとに無効にできます。" },
          ]} />
        </Row>
      </Sec>
      <Sec id="PhaseBand" desc="フェーズの帯">
        <Row label="実装中" block><PhaseBand phases={PHASES} current="construction" /></Row>
        <Row label="計画中" block><PhaseBand phases={PHASES} current="planning" /></Row>
      </Sec>
      <Sec id="Section" title="Section（カード）" desc="見出し付きの領域">
        <Row label="既定" block><Section title="直近のゲート実行" sub="5件" actions={<Button size="sm" variant="ghost" iconRight="arrowRight">すべて見る</Button>}><span className="muted">内容</span></Section></Row>
      </Sec>
    </>
  );
}

// ---------- 5.3 入力 ----------
const reqColumns: Column<Requirement>[] = [
  { key: "id", header: "ID", render: (r) => <IdLink id={r.id} />, sortValue: (r) => r.id, hideable: false },
  { key: "title", header: "タイトル", render: (r) => r.title, sortValue: (r) => r.title },
  { key: "status", header: "状態", render: (r) => <StatusBadge vocab={ARTIFACT_STATUS[r.status]} size="sm" />, sortValue: (r) => r.status },
  { key: "ai", header: "AI所見", render: (r) => r.ai_open_findings || "—", sortValue: (r) => r.ai_open_findings, align: "right" },
  { key: "updated", header: "更新", render: (r) => <Timestamp at={r.updated_at} />, sortValue: (r) => r.updated_at, defaultHidden: true },
];

function Inputs() {
  const [radio, setRadio] = useState("soft");
  const [opt, setOpt] = useState("team");
  const [multi, setMulti] = useState<string[]>(["u-takahashi"]);
  const [single, setSingle] = useState<string[]>([]);
  const [tab, setTab] = useState("all");
  const [seg, setSeg] = useState("month");
  const [page, setPage] = useState(2);
  const [fv, setFv] = useState<Record<string, string>>({ status: "approved" });
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>(["REQ-0002"]);
  const userOpts = users.filter((u) => u.kind === "member").map((u) => ({ value: u.id, label: u.name, hint: u.roles.join("・"), disabled: u.status === "disabled", disabledReason: u.status === "disabled" ? "無効化されたユーザー" : undefined }));
  return (
    <>
      <GroupTitle>5.3 入力部品</GroupTitle>
      <Sec id="Button" desc="主要、副、危険、ゴースト、アイコンのみ × 各状態（ホバー・押下・フォーカスは実際に操作して確認）">
        {(["primary", "secondary", "danger", "ghost"] as const).map((v) => (
          <Row key={v} label={v}>
            <Button variant={v} size="sm">小</Button>
            <Button variant={v}>中</Button>
            <Button variant={v} size="lg">大</Button>
            <Button variant={v} icon="plus">アイコン付き</Button>
            <Button variant={v} iconRight="arrowRight">右アイコン</Button>
            <Button variant={v} loading>読み込み中</Button>
            <Button variant={v} disabled>無効</Button>
          </Row>
        ))}
        <Row label="アイコンのみ"><Button iconOnly icon="edit" label="編集" /><Button iconOnly icon="trash" label="削除" variant="ghost" /><Button iconOnly icon="more" label="その他" size="sm" /></Row>
        <Row label="無効（理由付き）"><Button variant="primary" icon="check" disabled disabledReason="作成者は自分の成果物を承認できません">承認する</Button><span className="tiny muted">マウスを乗せると理由を表示</span></Row>
        <Row label="リンク・全幅" block><div style={{ maxWidth: 320 }} className="stack"><Button to={paths.screens()} icon="list">画面一覧へ（リンク）</Button><Button variant="primary" block>全幅</Button></div></Row>
      </Sec>
      <Sec id="TextField" desc="ラベル、補足、必須、文字数、エラー、無効、読み取り専用">
        <Row label="状態" block>
          <div className="grid cols-3">
            <TextField label="組織名" required placeholder="例: サンプルソフト株式会社" help="請求書に記載されます" />
            <TextField label="プロジェクト名" required defaultValue="受発注システム刷新" maxLength={60} />
            <TextField label="メールアドレス" required defaultValue="sato@" error="メールアドレスの形式が正しくありません" />
            <TextField label="プロジェクトID" defaultValue="order-renewal" disabled help="作成後は変更できません" />
            <TextField label="インストール先" defaultValue="sample-soft" readOnly />
            <TextField label="検索" icon="search" placeholder="アイコン付き" />
            <TextField label="表示ID" prefix="app.example/" defaultValue="sample-soft" />
          </div>
        </Row>
      </Sec>
      <Sec id="TextArea" desc="複数行">
        <Row label="状態" block>
          <div className="grid cols-3">
            <TextArea label="理由" required placeholder="例外が必要な理由" maxLength={500} />
            <TextArea label="差戻しの理由" required error="差戻しの理由を入力してください" />
            <TextArea label="判断（記録済み）" defaultValue="12/2 までに結合テストを追加する。" readOnly />
          </div>
        </Row>
      </Sec>
      <Sec id="MarkdownEditor" desc="編集・プレビュー、#REQ- で ID 補完、AI下書き">
        <Row label="編集" block><MarkdownEditor label="本文" required defaultValue={"購買担当者は、登録済みの取引先を選んで発注書を作成できる。\n関連: #REQ-"} suggestions={requirements.map((r) => ({ id: r.id, title: r.title }))} onAiDraft={() => undefined} /></Row>
        <Row label="AI下書きを挿入済み" block><MarkdownEditor label="リスク" defaultValue={"- 基幹システム側の仕様確定の遅れ\n- 結合テスト環境の準備遅延"} aiDraft /></Row>
        <Row label="エラー" block><MarkdownEditor label="納入物" required error="納入物を1件以上記載してください" /></Row>
      </Sec>
      <Sec id="Select" desc="単一選択">
        <Row label="状態" block>
          <div className="grid cols-3">
            <Select label="データ分類" options={(Object.keys(DATA_CLASS) as DataClass[]).map((d) => ({ value: d, label: DATA_CLASS[d].label }))} defaultValue="confidential" />
            <Select label="プロファイル" required placeholder="選択してください" options={[{ value: "basic", label: "Basic" }, { value: "entry", label: "Entry（準備中）", disabled: true }]} error="選択してください" />
            <Select label="タイムゾーン" options={[{ value: "tokyo", label: "Asia/Tokyo" }]} disabled />
          </div>
        </Row>
      </Sec>
      <Sec id="Combobox" desc="検索付き選択。単一、複数、候補なし、読み込み中、選択不可の候補">
        <Row label="状態" block>
          <div className="grid cols-2">
            <Combobox label="承認者" options={userOpts} value={single} onChange={setSingle} />
            <Combobox label="レビュー者（複数）" multiple options={userOpts} value={multi} onChange={setMulti} help="無効化されたユーザーは選べません" />
            <Combobox label="候補なし" options={[]} value={[]} />
            <Combobox label="読み込み中" options={[]} value={[]} loading />
          </div>
        </Row>
      </Sec>
      <Sec id="DatePicker" desc="最小・最大日付の制約付き">
        <Row label="状態" block>
          <div className="grid cols-3">
            <DatePicker label="例外の期限" required min="2026-11-27" max="2026-12-27" defaultValue="2026-12-11" help="最大30日まで" />
            <DatePicker label="希望時期" error="過去の日付は指定できません" defaultValue="2026-11-01" />
          </div>
        </Row>
      </Sec>
      <Sec id="Checkbox" title="Checkbox / Radio / Toggle" desc="通常、無効、説明付き">
        <Row label="Checkbox"><Checkbox label="プライバシーポリシーに同意する" /><Checkbox label="選択済み" defaultChecked /><Checkbox label="無効" disabled /><Checkbox label="説明付き" description="AI所見を監査パックに含める" /></Row>
        <Row label="Radio">{(Object.keys(ENFORCEMENT_LEVEL) as EnforcementLevel[]).map((l) => <Radio key={l} name="cat-radio" value={l} label={ENFORCEMENT_LEVEL[l].label} checked={radio === l} onChange={setRadio} />)}<Radio name="cat-radio-d" value="x" label="無効" disabled /></Row>
        <Row label="Toggle"><Toggle label="AI機能" defaultChecked /><Toggle label="オフ" /><Toggle label="無効" disabled /><Toggle label="必須チェックに登録" description="GitHub の必須ステータスチェックに登録する" defaultChecked /></Row>
      </Sec>
      <Sec id="OptionCard" desc="カード型のラジオ／チェック。選択、無効">
        <Row label="状態" block>
          <div className="grid cols-3">
            <OptionCard name="cat-plan" value="starter" checked={opt === "starter"} onChange={setOpt} title="Starter" description="3 リポジトリ" />
            <OptionCard name="cat-plan" value="team" checked={opt === "team"} onChange={setOpt} title="Team" description="10 リポジトリ、WORM 保管" badge={<Tag tone="primary">推奨</Tag>} />
            <OptionCard name="cat-plan" value="entry" checked={false} disabled title="Entry プロファイル" description="準備中" />
          </div>
        </Row>
      </Sec>
      <Sec id="FileUpload" desc="待機、ドラッグ中、アップロード中、完了、失敗、形式エラー">
        <Row label="状態" block>
          <div className="grid cols-3">
            <FileUpload label="待機" state="idle" />
            <FileUpload label="ドラッグ中" state="dragging" />
            <FileUpload label="アップロード中" state="uploading" />
            <FileUpload label="完了" state="done" hash={fakeSha("sow")} />
            <FileUpload label="失敗" state="failed" />
            <FileUpload label="形式エラー" state="invalid" />
          </div>
        </Row>
      </Sec>
      <Sec id="SearchBox" desc="ヘッダー用（ショートカット付き）、一覧の絞り込み用">
        <Row label="2種類"><SearchBox placeholder="要求、ADR、PR、証跡を検索" shortcut="/" width={340} /><SearchBox placeholder="キーワードで絞り込み" width={240} /></Row>
      </Sec>
      <Sec id="FilterBar" desc="絞り込み条件の並びとチップ、条件のクリア">
        <Row label="条件あり" block>
          <FilterBar search={q} onSearch={setQ} values={fv} onChange={(k, v) => setFv((x) => ({ ...x, [k]: v }))} filters={[{ key: "status", label: "状態", options: Object.entries(ARTIFACT_STATUS).map(([value, s]) => ({ value, label: s.label })) }, { key: "owner", label: "担当者", options: users.slice(0, 4).map((u) => ({ value: u.id, label: u.name })) }]} actions={<Button variant="primary" icon="plus">要求を作成</Button>} />
        </Row>
      </Sec>
      <Sec id="Tabs" title="Tabs / Segmented" desc="件数付きタブ、切替">
        <Row label="Tabs" block><Tabs value={tab} onChange={setTab} tabs={[{ value: "all", label: "すべて", count: 6 }, { value: "req", label: "要求", count: 1 }, { value: "exc", label: "例外", count: 1, icon: "flag" }, { value: "rel", label: "リリース", count: 0 }]} /></Row>
        <Row label="Segmented"><Segmented value={seg} onChange={setSeg} options={[{ value: "month", label: "月額" }, { value: "year", label: "年額" }]} /></Row>
      </Sec>
      <Sec id="Pagination" desc="ページ送り">
        <Row label="既定" block><Pagination page={page} total={180} onChange={setPage} /></Row>
      </Sec>
      <Sec id="DataTable" desc="並べ替え、ページ送り、行クリック、列の表示切替、行の複数選択、0件">
        <Row label="選択・並べ替え" block><DataTable columns={reqColumns} rows={requirements.slice(0, 6)} rowKey={(r) => r.id} selectable selected={sel} onSelect={setSel} onRowClick={() => undefined} toolbar={<span className="small muted">{sel.length}件を選択中</span>} /></Row>
        <Row label="ページ送り" block><DataTable columns={reqColumns} rows={requirements} rowKey={(r) => r.id} pageSize={5} compact /></Row>
        <Row label="0件" block><DataTable columns={reqColumns} rows={[]} rowKey={(r) => r.id} empty={<EmptyState variant="filtered" title="条件に一致する要求はありません" />} /></Row>
      </Sec>
    </>
  );
}

// ---------- 5.4 重ね表示 ----------
function Overlays() {
  const [modal, setModal] = useState<"sm" | "md" | "lg" | null>(null);
  const [confirm, setConfirm] = useState<"normal" | "danger" | null>(null);
  const [drawer, setDrawer] = useState<480 | 720 | null>(null);
  const toast = useToast();
  return (
    <>
      <GroupTitle>5.4 重ね表示部品</GroupTitle>
      <Sec id="Modal" desc="中央のダイアログ。小、中、大">
        <Row label="サイズ">
          <Button onClick={() => setModal("sm")}>小</Button>
          <Button onClick={() => setModal("md")}>中</Button>
          <Button onClick={() => setModal("lg")}>大</Button>
        </Row>
      </Sec>
      <Modal open={modal !== null} onClose={() => setModal(null)} size={modal ?? "md"} title="要求の承認を依頼" description="選択した要求について、承認者に依頼します" footer={<><Button variant="ghost" onClick={() => setModal(null)}>キャンセル</Button><Button variant="primary" onClick={() => setModal(null)}>依頼する</Button></>}>
        <div className="stack">
          <Combobox label="承認者" options={users.map((u) => ({ value: u.id, label: u.name }))} value={["u-nakamura"]} />
          <TextArea label="依頼メッセージ" />
        </div>
      </Modal>
      <Sec id="ConfirmDialog" desc="通常、危険（対象IDの入力確認付き）">
        <Row label="2種類">
          <Button onClick={() => setConfirm("normal")}>通常の確認</Button>
          <Button variant="danger" onClick={() => setConfirm("danger")}>危険な操作</Button>
        </Row>
      </Sec>
      <ConfirmDialog open={confirm === "normal"} onClose={() => setConfirm(null)} onConfirm={() => toast({ kind: "success", message: "廃止しました" })} title="要求を廃止しますか？" message="REQ-0011 を廃止します。トレーサビリティの集計から除外されます。" confirmLabel="廃止する" />
      <ConfirmDialog open={confirm === "danger"} onClose={() => setConfirm(null)} onConfirm={() => toast({ kind: "success", message: "削除しました" })} title="組織を削除しますか？" message="すべてのプロジェクトと設定が削除されます。WORM に保管された証跡は保持期限まで残ります。" confirmLabel="削除する" danger requireText="sample-soft" />
      <Sec id="Drawer" desc="右から出るパネル。幅 480px、720px">
        <Row label="幅"><Button onClick={() => setDrawer(480)}>480px</Button><Button onClick={() => setDrawer(720)}>720px</Button></Row>
      </Sec>
      <Drawer open={drawer !== null} onClose={() => setDrawer(null)} width={drawer ?? 480} title="EXC-0008 PR #142 のトレーサビリティ例外" subtitle="承認待ち · 鈴木 彩" footer={<><Button variant="ghost" onClick={() => setDrawer(null)}>閉じる</Button><Button variant="primary" icon="check">承認する</Button></>}>
        <ExceptionSummary ex={exceptions[2]} />
      </Drawer>
      <Sec id="Popover" title="Popover / Menu" desc="小さな浮遊パネルとドロップダウンメニュー">
        <Row label="Popover">
          <Popover trigger={(toggle) => <Button icon="info" onClick={toggle}>詳細を表示</Button>}>
            <div className="stack" style={{ ["--gap" as string]: "6px" }}>
              <strong>強制レベル: ソフト</strong>
              <span className="muted">ブロックするが、承認された例外があれば通過できる。</span>
            </div>
          </Popover>
        </Row>
        <Row label="Menu / MoreMenu">
          <Menu align="left" trigger={(toggle) => <Button iconRight="chevronDown" onClick={toggle}>操作</Button>} items={[{ label: "編集", icon: "edit" }, { label: "複製", icon: "copy" }, "separator", { label: "無効な項目", icon: "lock", disabled: true }, { label: "削除", icon: "trash", danger: true }]} />
          <MoreMenu items={[{ label: "リンクをコピー", icon: "link" }, { label: "CSV 出力", icon: "download" }]} />
        </Row>
      </Sec>
    </>
  );
}

// ---------- 5.5 業務 ----------
function Domains() {
  const toast = useToast();
  return (
    <>
      <GroupTitle>5.5 業務部品</GroupTitle>
      <Sec id="ApprovalPanel" desc="承認待ち、一部承認、全承認、差戻し、自分は承認不可">
        <Row label="承認待ち（自分が承認者）" block>
          <div style={{ maxWidth: 360 }}><ApprovalPanel approvers={[{ role: "顧客", user_id: "u-nakamura", status: "pending" }, { role: "PM", user_id: "u-sato", status: "pending" }]} canDecide onDecide={(d) => toast({ kind: "success", message: d === "approved" ? "承認しました" : "差し戻しました" })} /></div>
        </Row>
        <Row label="一部承認" block>
          <div style={{ maxWidth: 360 }}><ApprovalPanel approvers={[{ role: "設計者", user_id: "u-tanaka", status: "approved", decided_at: "2026-11-26T18:00:00+09:00", comment: "設計どおりです" }, { role: "PM", status: "pending" }]} /></div>
        </Row>
        <Row label="全承認" block>
          <div style={{ maxWidth: 360 }}><ApprovalPanel approvers={[{ role: "顧客", user_id: "u-nakamura", status: "approved", decided_at: "2026-10-22T15:00:00+09:00" }]} /></div>
        </Row>
        <Row label="差戻し" block>
          <div style={{ maxWidth: 360 }}><ApprovalPanel approvers={[{ role: "顧客", user_id: "u-nakamura", status: "returned", decided_at: "2026-11-27T10:12:00+09:00", comment: "上限超過時に保存を止めるか確認させてください" }]} /></div>
        </Row>
        <Row label="承認不可（職務分離）" block>
          <div style={{ maxWidth: 360 }}><ApprovalPanel approvers={[{ role: "PM", status: "pending" }]} blockedReason="あなたはこの要求の作成者のため承認できません" eligible={membersWithRole("組織管理者")} /></div>
        </Row>
      </Sec>
      <Sec id="ApprovalRequestCard" desc="通常、期限間近、期限超過">
        <Row label="3状態" block>
          <div className="grid cols-3">
            <ApprovalRequestCard req={approvalRequests[3]} />
            <ApprovalRequestCard req={approvalRequests[0]} />
            <ApprovalRequestCard req={approvalRequests[4]} />
          </div>
        </Row>
      </Sec>
      <Sec id="SoDNotice" desc="操作できない理由と、操作できる人">
        <Row label="理由のみ" block><SoDNotice reason="AIエージェントはポリシー編集・証跡削除ができません" /></Row>
        <Row label="操作できる人付き" block><SoDNotice reason="あなたはこの要求の作成者のため承認できません" eligible={[userById("u-sato")!, userById("u-nakamura")!]} /></Row>
      </Sec>
      <Sec id="AIFindingCard" desc="未確認、採用、却下、対象が更新され古くなった。却下理由は必須">
        <Row label="未確認" block><AIFindingCard finding={aiFindings[0]} /></Row>
        <Row label="採用" block><AIFindingCard finding={aiFindings[3]} /></Row>
        <Row label="却下" block><AIFindingCard finding={aiFindings[4]} /></Row>
        <Row label="古い所見" block><AIFindingCard finding={aiFindings[5]} /></Row>
        <Row label="選択中・コンパクト" block><AIFindingCard finding={aiFindings[1]} active compact /></Row>
      </Sec>
      <Sec id="AIDraftBanner" title="AIDraftBanner / AISectionHead" desc="AI下書きの告知、AI所見の見出し">
        <Row label="下書き" block><AIDraftBanner /></Row>
        <Row label="所見の見出し" block><AISectionHead count={3} /></Row>
      </Sec>
      <Sec id="AIUnavailableNotice" desc="組織で無効、分類により無効、一時的な障害">
        <Row label="組織で無効" block><AIUnavailableNotice reason="orgDisabled" /></Row>
        <Row label="分類により無効" block><AIUnavailableNotice reason="dataClass" /></Row>
        <Row label="障害" block><AIUnavailableNotice reason="outage" /></Row>
      </Sec>
      <Sec id="TraceLinkEditor" desc="確定リンク、AI候補（確定に昇格）、削除の確認、追加">
        <Row label="編集" block>
          <TraceLinkEditor
            links={[
              { id: "ADR-0004", title: "操作ログは追記専用ストレージに保存する", kind: "ADR", relation: "refines" },
              { id: "PR #142", title: "操作ログを追記専用ストレージへ書き込む", kind: "PR", relation: "implements", ai: true, confidence: 0.73 },
            ]}
            candidates={[{ id: "TC-0140", title: "性能: 同時接続50件", kind: "テスト" }, { id: "DSN-0004", title: "発注画面の詳細設計", kind: "設計" }]}
          />
        </Row>
        <Row label="読み取り専用" block><TraceLinkEditor readOnly links={[{ id: "TC-0101", title: "取引先を選んで発注書を保存できる", kind: "テスト", relation: "verifies" }]} candidates={[]} /></Row>
      </Sec>
      <Sec id="ExceptionSummary" desc="申請中、有効、期限切れ">
        <Row label="申請中" block><ExceptionSummary ex={exceptions[2]} /></Row>
        <Row label="有効" block><ExceptionSummary ex={exceptions[0]} /></Row>
        <Row label="期限切れ（コンパクト）" block><ExceptionSummary ex={exceptions[3]} compact /></Row>
      </Sec>
      <Sec id="EvidenceItem" desc="通常、欠落（必要だが未取得）">
        <Row label="各状態" block>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            {evidence.map((e) => <EvidenceItem key={e.id} ev={e} />)}
          </div>
        </Row>
      </Sec>
      <Sec id="CommentThread" desc="0件、未解決あり、すべて解決済み。返信、@メンション">
        <Row label="未解決あり" block>
          <CommentThread comments={[
            { id: "c1", user_id: "u-nakamura", body: "上限額は税込で判定してほしいです。", at: "2026-11-26T15:25:00+09:00", replies: [{ id: "r1", user_id: "u-sato", body: "影響範囲を確認します。", at: "2026-11-26T16:00:00+09:00" }] },
            { id: "c2", user_id: "u-tanaka", body: "REQ-0012 の受入基準も更新が必要です。", at: "2026-11-27T09:00:00+09:00", resolved: true },
          ]} />
        </Row>
        <Row label="0件" block><CommentThread comments={[]} /></Row>
      </Sec>
      <Sec id="ShareLinkPanel" desc="未発行、有効、期限切れ、失効済み">
        <Row label="未発行" block><ShareLinkPanel /></Row>
        <Row label="有効" block><ShareLinkPanel initial="active" /></Row>
        <Row label="期限切れ" block><ShareLinkPanel initial="expired" /></Row>
        <Row label="失効済み" block><ShareLinkPanel initial="revoked" /></Row>
      </Sec>
      <Sec id="PlanLimitNotice" desc="プランの上限到達とアップグレードの導線">
        <Row label="既定" block><PlanLimitNotice used={3} limit={3} /></Row>
      </Sec>
      <Sec id="StateFlow" desc="状態遷移図。要求、変更要求、例外、リリース">
        <Row label="要求" block><StateFlow flow="requirement" current="レビュー中" /></Row>
        <Row label="要求（分岐）" block><StateFlow flow="requirement" current="変更中" /></Row>
        <Row label="変更要求" block><StateFlow flow="change" current="影響分析中" /></Row>
        <Row label="例外" block><StateFlow flow="exception" current="有効" /></Row>
        <Row label="リリース" block><StateFlow flow="release" current="ゲート確認中" /></Row>
      </Sec>
    </>
  );
}

export function Catalog() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header className="global-header" style={{ gridTemplateColumns: "auto 1fr auto" }}>
        <Brand to={paths.screens()} />
        <span className="small muted">部品カタログ · 第5章の全部品と全状態（5.6 連携・経営を含む）</span>
        <div className="row">
          <Link to={paths.screens()} className="btn secondary sm">画面一覧</Link>
          <ThemeToggle />
        </div>
      </header>
      <div className="cat">
        <nav className="cat-toc" aria-label="部品の目次">
          {TOC.map((g) => (
            <div key={g.group} className="stack" style={{ ["--gap" as string]: "1px" }}>
              <span className="grp">{g.group}</span>
              {g.items.map((i) => (
                <a key={i.id} href={`#${i.id}`} onClick={(e) => { e.preventDefault(); scrollTo(i.id); }}>{i.label}</a>
              ))}
            </div>
          ))}
        </nav>
        <main className="cat-main">
          <div className="stack" style={{ ["--gap" as string]: "6px" }}>
            <h1 style={{ fontSize: "var(--text-2xl)", color: "var(--text-strong)" }}>部品カタログ</h1>
            <p className="muted">全画面で同じ部品・語彙・色を使う。色だけに頼らずアイコンとラベルで区別する。右上でライト／ダークを切り替えて確認する。</p>
          </div>
          <Foundations />
          <Chapter2 />
          <Layouts />
          <Displays />
          <Inputs />
          <Overlays />
          <Domains />
          <SyncParts />
        </main>
      </div>
    </div>
  );
}
