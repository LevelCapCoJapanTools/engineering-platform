// 画面ID: J-10 スケジュール
// 当初・承認済み改訂・予測・実績を別々に表示し、依存関係による遅延の影響範囲と計画変更の履歴を示す。
// 基準日を選ぶと、その時点の予測を再現して過去時点の計画差異を確認できる。値は計画管理とカレンダーから同期する。
import { useState } from "react";
import {
  Button,
  ConfidenceTag,
  ErrorState,
  ExternalActor,
  FilterBar,
  Icon,
  PageHeader,
  PlanDates,
  ProjectLayout,
  RoadmapTimeline,
  Section,
  Select,
  Skeleton,
  SourceTag,
  StaleDataNotice,
  Tag,
  Timestamp,
} from "../../ui";
import type { TimelineRow } from "../../ui";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import type { Milestone } from "../../lib/types";
import { daysBetween, formatDate } from "../../lib/format";
import { calendarEvents, decisions, milestones } from "../../mocks/portfolio";
import { CAL_SOURCE, PLAN_SOURCE, forecastSnapshots, scheduleChanges } from "../../mocks/planning";
import type { ScheduleChange } from "../../mocks/planning";
import { DecisionLink, SourceBar, orgOf, projectOf } from "./shared";

export const J10_STATES = ["既定", "過去の基準日", "同期が古い", "読み込み中", "取得失敗"];

const CHANGE_KIND: Record<ScheduleChange["kind"], { label: string; tone: "info" | "warn" | "fail" | "neutral" | "special" | "pass" }> = {
  forecastUpdated: { label: "予測の更新", tone: "special" },
  milestoneMoved: { label: "マイルストーンの延期", tone: "warn" },
  issueDueChanged: { label: "作業項目の期限変更", tone: "info" },
  meetingMoved: { label: "会議の移動", tone: "neutral" },
  meetingCancelled: { label: "会議の取消", tone: "neutral" },
  baselineRevised: { label: "計画の改訂（承認済み）", tone: "pass" },
};

const SNAPSHOT_DATES = Object.keys(forecastSnapshots).sort().reverse();

/** 基準日時点の予測を当てはめる（実績は基準日より前のものだけ有効） */
function asOf(m: Milestone, date: string): Milestone {
  const snap = forecastSnapshots[date]?.[m.id];
  const actual = m.actual && m.actual <= date ? m.actual : undefined;
  return { ...m, actual, forecast: actual ? undefined : snap ?? m.forecast };
}

export function J10Schedule({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [date, setDate] = useState(state === "過去の基準日" ? "2026-11-20" : SNAPSHOT_DATES[0]);
  const [kind, setKind] = useState<Record<string, string>>({});
  const source = state === "同期が古い" ? { ...PLAN_SOURCE, synced_at: "2026-11-26T18:30:00+09:00", status: "stale" as const } : PLAN_SOURCE;
  const ms = milestones.filter((m) => m.project === pr).map((m) => asOf(m, date));
  const events = calendarEvents.filter((e) => e.project === pr);
  const projDecisions = decisions.filter((d) => d.project === pr && d.status === "pending");
  const isPast = date !== SNAPSHOT_DATES[0];

  const rows: TimelineRow[] = ms.map((m, i) => {
    const start = i === 0 ? "2026-08-01" : ms[i - 1].baseline;
    const current = m.actual ?? m.forecast ?? m.revised ?? m.baseline;
    const slip = daysBetween(m.revised ?? m.baseline, current);
    return {
      id: m.id,
      label: m.title,
      sub: <span className="row" style={{ ["--gap" as string]: "4px" }}><span className="mono">{m.id}</span><ConfidenceTag value={m.actual ? "actual" : m.confidence} /></span>,
      baseline: { start, end: m.baseline },
      current: { start, end: current, confidence: m.actual ? "actual" : m.confidence, tone: m.actual ? "pass" : slip > 0 ? "fail" : "info" },
      markers: [{ date: current, label: m.title, kind: "milestone" as const }],
    };
  });
  rows.push({
    id: "events",
    label: "会議・判断期限",
    sub: "共有カレンダーと経営判断",
    markers: [
      ...events.map((e) => ({ date: e.start.slice(0, 10), label: `${e.title}${e.status === "moved" ? "（移動）" : e.status === "cancelled" ? "（取消）" : ""}`, kind: (e.status === "cancelled" ? "cancelled" : "meeting") as "cancelled" | "meeting" })),
      ...projDecisions.map((d) => ({ date: d.due, label: `判断期限: ${d.title}`, kind: "decision" as const })),
    ],
  });

  // 依存関係による遅延の連鎖（クリティカルな遅延の影響範囲）
  const delayed = ms.filter((m) => !m.actual && daysBetween(m.revised ?? m.baseline, m.forecast ?? m.baseline) > 0);
  const chain = delayed.map((m) => ({ m, affected: ms.filter((x) => x.depends_on?.includes(m.id) || (x.depends_on ?? []).some((d) => ms.find((y) => y.id === d)?.depends_on?.includes(m.id))) }));
  const changes = scheduleChanges.filter((c) => (!kind.kind || c.kind === kind.kind) && c.at.slice(0, 10) <= date);

  return (
    <ProjectLayout org={org} project={pr} active="schedule" trail={[{ label: "スケジュール" }]}>
      <PageHeader
        title="スケジュール"
        description="当初計画・承認済み改訂・最新の予測・実績を分けて表示します。上書きで当初の期限や遅延の履歴は消えません。"
        actions={
          <div style={{ minWidth: 220 }}>
            <Select label="基準日" value={date} onChange={setDate} options={SNAPSHOT_DATES.map((d, i) => ({ value: d, label: `${formatDate(d)}${i === 0 ? "（最新）" : ""}` }))} />
          </div>
        }
      />
      {state === "読み込み中" ? (
        <Skeleton variant="table" rows={8} />
      ) : state === "取得失敗" ? (
        <ErrorState />
      ) : (
        <>
          <StaleDataNotice sources={[{ name: "計画・マイルストーン", source }, { name: "会議の日程", source: CAL_SOURCE }]} action={<Button size="sm" icon="plug" to={paths.connectors(org)}>連携の状態</Button>} />
          {isPast ? (
            <div className="banner tone-info" role="status">
              <Icon name="history" />
              <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                <strong>{formatDate(date)} 時点の計画差異を再現しています</strong>
                <span className="small">その時点で記録されていた予測と実績を表示しています。以後の変更は反映していません。</span>
              </div>
              <Button size="sm" onClick={() => setDate(SNAPSHOT_DATES[0])}>最新に戻す</Button>
            </div>
          ) : null}
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <SourceBar source={source} note="マイルストーン・作業項目の期日" />
          </div>
          <Section title="ロードマップ" sub="薄い棒が当初計画、濃い棒が確約・実績、斜線が予測です。赤い線は今日">
            <RoadmapTimeline rows={rows} from="2026-08-01" to="2027-03-31" ariaLabel="プロジェクトのスケジュール" />
          </Section>
          <Section title="マイルストーンの日付" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>マイルストーン</th><th>確度</th><th>日付の内訳</th><th>依存先</th><th>担当</th></tr></thead>
                <tbody>
                  {ms.map((m) => (
                    <tr key={m.id}>
                      <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong" style={{ fontWeight: 500 }}>{m.title}</span><span className="tiny muted mono">{m.id}</span>{m.change_reason ? <span className="tiny muted">{m.change_reason}</span> : null}</div></td>
                      <td><ConfidenceTag value={m.actual ? "actual" : m.confidence} /></td>
                      <td style={{ minWidth: 360 }}><PlanDates baseline={m.baseline} revised={m.revised} forecast={m.forecast} actual={m.actual} /></td>
                      <td className="mono small">{m.depends_on?.join(", ") ?? "—"}</td>
                      <td><ExternalActor userId={m.owner} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <div className="grid cols-2">
            <Section title="遅延の影響範囲" sub="依存関係をたどり、後続のマイルストーンへの影響を示します">
              {chain.length ? (
                <div className="stack" style={{ ["--gap" as string]: "12px" }}>
                  {chain.map(({ m, affected }) => (
                    <div key={m.id} className="pl-decision">
                      <div className="row between">
                        <span className="strong" style={{ fontWeight: 500 }}>{m.title}</span>
                        <Tag tone="fail" square>+{daysBetween(m.revised ?? m.baseline, m.forecast ?? m.baseline)}日</Tag>
                      </div>
                      <div className="pl-hist small">
                        <span className="tiny muted">影響:</span>
                        {affected.length ? affected.map((a) => (
                          <span key={a.id} className="row" style={{ ["--gap" as string]: "4px" }}><Icon name="arrowRight" size={12} />{a.title}<span className="tiny muted">（予測 {formatDate(a.forecast ?? a.baseline)}）</span></span>
                        )) : <span className="tiny muted">後続のマイルストーンはありません</span>}
                      </div>
                      {affected.some((a) => a.confidence === "committed") ? <span className="tiny text-fail">顧客との確約日に影響します</span> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="small muted">遅延しているマイルストーンはありません。</span>
              )}
            </Section>
            <Section title="次の判断と会議">
              <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                {projDecisions.map((d) => (
                  <div key={d.id} className="stack" style={{ ["--gap" as string]: "2px" }}>
                    <DecisionLink org={org} id={d.id} />
                    <span className="tiny muted">判断期限 {formatDate(d.due)}</span>
                  </div>
                ))}
                {events.map((e) => (
                  <div key={e.id} className="row between">
                    <span className="small">{e.title}{e.status === "moved" ? <Tag tone="warn" square>移動</Tag> : null}</span>
                    <span className="tiny muted">{formatDate(e.start)}</span>
                  </div>
                ))}
                <SourceTag source={CAL_SOURCE} compact />
                <span className="tiny muted">オンコールの当番表は別の画面（オンコール）で扱い、ここには表示しません。</span>
              </div>
            </Section>
          </div>
          <Section title="計画変更の履歴" sub="延期・期限変更・会議の移動・計画の改訂を区別して記録します" flush>
            <div style={{ padding: "0 20px" }}>
              <FilterBar values={kind} onChange={(k, v) => setKind((f) => ({ ...f, [k]: v }))} filters={[{ key: "kind", label: "種類", options: Object.entries(CHANGE_KIND).map(([value, v]) => ({ value, label: v.label })) }]} />
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>日時</th><th>種類</th><th>対象</th><th>変更</th><th>理由</th><th>変更者</th><th>承認</th><th>出典</th></tr></thead>
                <tbody>
                  {changes.length ? changes.map((c) => (
                    <tr key={c.id}>
                      <td className="small nowrap"><Timestamp at={c.at} mode="absolute" /></td>
                      <td><Tag square tone={CHANGE_KIND[c.kind].tone}>{CHANGE_KIND[c.kind].label}</Tag></td>
                      <td className="small">{c.target}</td>
                      <td className="small nowrap">{c.from} → {c.to}</td>
                      <td className="small">{c.reason}</td>
                      <td><ExternalActor userId={c.by} /></td>
                      <td>{c.approved_by ? <ExternalActor userId={c.approved_by} /> : c.kind === "forecastUpdated" ? <span className="tiny muted">予測のため不要</span> : <span className="tiny muted">—</span>}</td>
                      <td><SourceTag source={c.source} prefix="" compact /></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="small muted">この条件の変更はありません。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
          <p className="tiny muted">予測の更新は計画の改訂ではありません。確約日を動かすには計画の改訂と顧客の合意が必要です（<Link to={paths.plan(org, pr)}>プロジェクト計画</Link>）。</p>
        </>
      )}
    </ProjectLayout>
  );
}
