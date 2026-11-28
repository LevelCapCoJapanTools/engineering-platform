// 画面ID: M-12 経営スケジュール
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { projectBySlug } from "../../mocks/core";
import { calendarEvents, connectors, decisions, milestones } from "../../mocks/portfolio";
import { recurringExceptions } from "../../mocks/investment";
import { AppLayout, Banner, Button, ConfidenceTag, crumbs, EmptyState, ErrorState, Icon, IdLink, PageHeader, Section, Segmented, Select, Skeleton, SourceTag, StaleDataNotice, Tag } from "../../ui";
import { RoleNote, userName } from "./parts";
import { ScheduleConflicts } from "../orders/embeds";

type Item = {
  key: string;
  date: string; // YYYY-MM-DD（JST）
  time?: string; // HH:mm（JST）
  kind: "milestone" | "forecast" | "decision" | "meeting";
  title: string;
  project?: string;
  cancelled?: boolean;
  moved?: string;
  recurringNote?: string;
  localTime?: string;
  allDay?: boolean;
  link?: string;
  sub?: string;
};

const jstDate = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const jstTime = (iso: string) => new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const localTime = (iso: string, tz: string) =>
  `${new Intl.DateTimeFormat("ja-JP", { timeZone: tz, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))}（${tz}）`;

const KIND_LABEL: Record<Item["kind"], string> = { milestone: "マイルストーン（当初）", forecast: "マイルストーン（予測）", decision: "判断期限", meeting: "会議" };

function buildItems(org: string): Item[] {
  const items: Item[] = [];
  for (const m of milestones) {
    const current = m.actual ?? m.forecast ?? m.revised;
    items.push({ key: `${m.id}-b`, date: m.baseline, kind: "milestone", title: `${m.title}（当初）`, project: m.project, link: paths.milestones(org, m.project), sub: m.id });
    if (current && current !== m.baseline) items.push({ key: `${m.id}-f`, date: current, kind: "forecast", title: `${m.title}（${m.actual ? "実績" : "予測"}）`, project: m.project, link: paths.schedule(org, m.project), sub: m.id });
  }
  for (const d of decisions.filter((x) => x.status === "pending")) {
    items.push({ key: d.id, date: d.due, kind: "decision", title: d.title, project: d.project, link: paths.decision(org, d.id), sub: d.id });
  }
  for (const e of calendarEvents) {
    const exc = recurringExceptions.find((x) => x.event === e.id);
    const start = exc?.changed_to ?? e.start;
    items.push({
      key: e.id,
      date: e.all_day ? e.start : jstDate(start),
      time: e.all_day ? undefined : jstTime(start),
      allDay: e.all_day,
      kind: "meeting",
      title: e.title,
      project: e.project,
      cancelled: e.status === "cancelled",
      moved: e.status === "moved" ? "日時が変更されました" : undefined,
      recurringNote: exc ? exc.note : e.recurring ? "繰返し予定" : undefined,
      localTime: !e.all_day && e.timezone !== "Asia/Tokyo" ? localTime(start, e.timezone) : undefined,
      sub: e.calendar,
    });
  }
  return items.sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
}

const MONTHS = ["2026-11", "2026-12", "2027-01", "2027-02", "2027-03"];

export function ExecSchedule() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [view, setView] = useState(state === "list" ? "list" : "month");
  const [month, setMonth] = useState("2026-12");
  const [project, setProject] = useState("");
  const trail = crumbs(org, undefined, { label: "スケジュール" });
  const cal = connectors.find((c) => c.category === "calendar")!;
  const planning = connectors.filter((c) => c.category === "planning");

  if (state === "loading") return <AppLayout org={org} active="execSchedule" breadcrumb={trail}><Skeleton variant="card" /></AppLayout>;
  if (state === "error") return <AppLayout org={org} active="execSchedule" breadcrumb={trail}><ErrorState /></AppLayout>;

  const all = state === "empty" ? [] : buildItems(org).filter((i) => !project || i.project === project);
  const sources = [
    ...planning.map((c) => ({ name: c.name, source: { provider: c.provider, synced_at: c.last_success_at, status: c.status } })),
    { name: cal.name, source: { provider: cal.provider, synced_at: state === "stale" ? "2026-11-26T09:00:00+09:00" : cal.last_success_at, status: state === "stale" ? ("failing" as const) : cal.status } },
  ];

  // 月表示のグリッド（月曜始まり）
  const [y, mo] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, mo - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const days: { iso: string; out: boolean }[] = [];
  for (let i = -offset; days.length < 42; i += 1) {
    const d = new Date(Date.UTC(y, mo - 1, 1 + i));
    days.push({ iso: d.toISOString().slice(0, 10), out: d.getUTCMonth() !== mo - 1 });
  }
  const monthIdx = MONTHS.indexOf(month);

  return (
    <AppLayout org={org} active="execSchedule" breadcrumb={trail}>
      <PageHeader
        title="経営スケジュール"
        description="案件横断で、マイルストーン（当初と予測）、経営会議・顧客レビューの日程、経営判断の期限を重ねて表示します。日程の正本は計画管理と共有カレンダーです。"
        tabs={<Segmented value={view} onChange={setView} options={[{ value: "month", label: "月表示" }, { value: "list", label: "リスト" }]} />}
      />
      <div className="stack">
        <StaleDataNotice sources={sources} action={<Button size="sm" to={paths.connectors(org)}>連携と同期へ</Button>} />
        <div className="row between">
          <div className="row">
            {view === "month" ? (
              <>
                <Button size="sm" icon="chevronLeft" iconOnly label="前の月" disabled={monthIdx <= 0} onClick={() => setMonth(MONTHS[monthIdx - 1])} />
                <strong>{y}年{mo}月</strong>
                <Button size="sm" icon="chevronRight" iconOnly label="次の月" disabled={monthIdx >= MONTHS.length - 1} onClick={() => setMonth(MONTHS[monthIdx + 1])} />
              </>
            ) : null}
            <div style={{ minWidth: 200 }}>
              <Select value={project} onChange={setProject} options={[{ value: "", label: "すべての案件" }, ...["order-renewal", "member-app-api", "inventory-dashboard", "legacy-migration"].map((s) => ({ value: s, label: projectBySlug(s).name }))]} />
            </div>
          </div>
          <span className="row" style={{ ["--gap" as string]: "8px" }}>
            <SourceTag source={{ provider: cal.provider, label: "経営会議・顧客レビュー", synced_at: cal.last_success_at, status: cal.status }} compact />
          </span>
        </div>

        {all.length === 0 ? (
          <div className="card"><EmptyState icon="calendar" title="表示する予定がありません" description="計画管理と共有カレンダーを接続すると、マイルストーンと会議が表示されます。" action={<Button to={paths.connectorNew(org)}>連携を追加</Button>} /></div>
        ) : view === "month" ? (
          <div className="pf-cal-wrap">
            <div className="pf-cal" role="grid" aria-label={`${y}年${mo}月の予定`}>
              {["月", "火", "水", "木", "金", "土", "日"].map((d) => <div key={d} className="pf-cal-head" role="columnheader">{d}</div>)}
              {days.map((d) => {
                const its = all.filter((i) => i.date === d.iso);
                return (
                  <div key={d.iso} className={`pf-cal-day${d.out ? " out" : ""}${d.iso === "2026-11-27" ? " today" : ""}`} role="gridcell">
                    <span className="pf-cal-num">{Number(d.iso.slice(8))}</span>
                    {its.map((i) => (
                      <span key={i.key} className={`pf-cal-item ${i.kind}${i.cancelled ? " cancelled" : ""}`} title={`${KIND_LABEL[i.kind]}: ${i.title}${i.time ? ` ${i.time} JST` : ""}${i.localTime ? ` / 現地 ${i.localTime}` : ""}${i.moved ? `（${i.moved}）` : ""}${i.cancelled ? "（取消）" : ""}`}>
                        {i.time ? `${i.time} ` : ""}{i.title}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Section title="予定と期限" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>日付（JST）</th><th>種類</th><th>内容</th><th>案件</th><th>補足</th></tr></thead>
                <tbody>
                  {all.filter((i) => i.date >= "2026-11-27").map((i) => (
                    <tr key={i.key}>
                      <td className="small" style={{ whiteSpace: "nowrap" }}>{formatDate(i.date)}{i.time ? ` ${i.time}` : i.allDay ? " 終日" : ""}</td>
                      <td>{i.kind === "decision" ? <Tag tone="warn" square icon="flag">判断期限</Tag> : i.kind === "meeting" ? <Tag tone="special" square icon="calendar">会議</Tag> : i.kind === "forecast" ? <ConfidenceTag value="forecast" /> : <Tag square icon="target">当初</Tag>}</td>
                      <td className="small">
                        <span className="stack" style={{ ["--gap" as string]: "2px" }}>
                          <span className={i.cancelled ? "muted" : "strong"} style={i.cancelled ? { textDecoration: "line-through" } : undefined}>{i.title}</span>
                          {i.sub ? <span className="tiny muted">{i.kind === "decision" || i.kind === "milestone" || i.kind === "forecast" ? <IdLink id={i.sub} to={i.link} /> : i.sub}</span> : null}
                        </span>
                      </td>
                      <td className="small">{i.project ? projectBySlug(i.project).name : <span className="muted">全社</span>}</td>
                      <td className="small">
                        <span className="stack" style={{ ["--gap" as string]: "2px" }}>
                          {i.cancelled ? <Tag tone="neutral" square>取消</Tag> : null}
                          {i.moved ? <Tag tone="warn" square>日時変更</Tag> : null}
                          {i.recurringNote ? <span className="tiny muted"><Icon name="refresh" size={11} /> {i.recurringNote}</span> : null}
                          {i.localTime ? <span className="tiny">現地 {i.localTime}</span> : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {state === "empty" ? null : <ScheduleConflicts org={org} />}

        <div className="grid cols-2">
          <Banner tone="info" title="取り込む予定">
            許可した共有カレンダー（経営会議、顧客レビュー）だけを同期します。個人の予定表・非公開の予定は取り込みません。件名・日時・主催者・会議URLだけを扱い、本文と参加者一覧は保存しません。
          </Banner>
          <Banner tone="info" title="オンコール当番は別の画面です">
            当番表はオンコール管理サービスが正本で、このスケジュールとは連動しません。<Button size="sm" variant="ghost" to={paths.oncall(org)} iconRight="arrowRight">オンコールを開く</Button>
          </Banner>
        </div>
        <RoleNote>
          日付はすべて日本時間で表示し、別のタイムゾーンで登録された会議は現地時刻を併記します。繰返し予定のうち1回だけ変更された回は、シリーズ全体と区別して表示します。会議の主催者: {userName("u-kimura")} ほか。
        </RoleNote>
      </div>
    </AppLayout>
  );
}
