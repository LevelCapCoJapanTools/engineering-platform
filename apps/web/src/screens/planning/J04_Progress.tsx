// 画面ID: J-04 進捗
// 計画値と実績（作業項目、PR、テスト、納入物）を正本から集計し、体制の懸念を役割別・期間別に示す（個人の稼働は表示しない）。
import { useState } from "react";
import {
  AIFindingCard,
  AISectionHead,
  AIUnavailableNotice,
  Button,
  ErrorState,
  ExternalActor,
  Icon,
  PageHeader,
  ProjectLayout,
  ProviderBadge,
  Section,
  Segmented,
  Skeleton,
  SourceTag,
  StaleDataNotice,
  Tag,
  Timeline,
  cx,
} from "../../ui";
import type { IconName } from "../../ui";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { userById } from "../../mocks/core";
import { PLAN_SOURCE, PROGRESS_NOW_WEEK, planVsActual, progressFindings, progressRecords, progressTasks, staffingConcerns } from "../../mocks/planning";
import type { ProgressTask, StaffingConcern } from "../../mocks/planning";
import { SourceBar, orgOf, projectOf } from "./shared";

export const J04_STATES = ["既定", "同期が古い", "読み込み中", "取得失敗", "AI無効"];

const CONCERN: Record<StaffingConcern["kind"], { label: string; icon: IconName; tone: string }> = {
  unassigned: { label: "未割当", icon: "user", tone: "warn" },
  overload: { label: "過負荷", icon: "alert", tone: "fail" },
  leave: { label: "休暇", icon: "calendar", tone: "info" },
  handover: { label: "担当交代", icon: "users", tone: "warn" },
};

const RANGES = { all: [0, 26], quarter: [8, 21], month: [10, 15] } as const;
const statusLabel: Record<ProgressTask["status"], { label: string; tone: "pass" | "info" | "neutral" }> = {
  done: { label: "完了", tone: "pass" },
  inProgress: { label: "進行中", tone: "info" },
  notStarted: { label: "未着手", tone: "neutral" },
};

function weekLabel(w: number) {
  const d = new Date("2026-09-01T00:00:00+09:00");
  d.setDate(d.getDate() + Math.round(w * 7));
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function J04Progress({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [range, setRange] = useState<keyof typeof RANGES>("all");
  const source = state === "同期が古い" ? { ...PLAN_SOURCE, synced_at: "2026-11-26T20:00:00+09:00", status: "stale" as const } : PLAN_SOURCE;
  const [lo, hi] = RANGES[range];
  const span = hi - lo;
  const pct = (w: number) => `${Math.max(0, Math.min(100, ((w - lo) / span) * 100))}%`;
  const width = (a: number, b: number) => `${Math.max(1.5, ((Math.min(b, hi) - Math.max(a, lo)) / span) * 100)}%`;
  const ticks = Array.from({ length: 6 }).map((_, i) => lo + (span / 5) * i);

  return (
    <ProjectLayout org={org} project={pr} active="progress" trail={[{ label: "進捗" }]}>
      <PageHeader
        title="進捗"
        description="計画した作業と実績（作業項目・PR・テスト・納入物）を、正本から集計して比較します。"
        actions={<Segmented value={range} onChange={(v) => setRange(v as keyof typeof RANGES)} options={[{ value: "month", label: "1か月" }, { value: "quarter", label: "3か月" }, { value: "all", label: "全期間" }]} />}
      />
      {state === "読み込み中" ? (
        <Skeleton variant="table" rows={8} />
      ) : state === "取得失敗" ? (
        <ErrorState />
      ) : (
        <>
          <StaleDataNotice sources={[{ name: "計画・作業項目", source }]} />
          <SourceBar source={source} note="作業項目と期日は計画管理、PR・テストは GitHub から集計" />
          <Section title="計画値と実績" sub="今日時点で完了しているはずの量（縦線）と実績を比較します">
            <div className="pl-kv-grid">
              {planVsActual.map((x) => (
                <div key={x.key} className="pl-pva">
                  <div className="row between"><span className="small strong">{x.label}</span><span className="small">{x.done} / {x.planned}</span></div>
                  <div className="pl-pva-bar" aria-label={`${x.label}: 実績 ${x.done}、今日時点の計画 ${x.expected}、総数 ${x.planned}`}>
                    <span style={{ width: `${(x.done / x.planned) * 100}%` }} />
                    <i style={{ left: `${(x.expected / x.planned) * 100}%` }} />
                  </div>
                  <span className={x.done < x.expected ? "tiny text-warn" : "tiny muted"}>{x.done < x.expected ? `今日時点の計画より ${x.expected - x.done} 件少ない` : "計画どおり"}</span>
                  <span className="tiny muted"><ProviderBadge provider={x.source} size="sm" /> {x.note}</span>
                </div>
              ))}
            </div>
          </Section>
          <Section title="体制の懸念" sub="役割別・期間別の集計です。個人の稼働状況は表示しません" flush>
            {staffingConcerns.map((c) => (
              <div key={c.id} className="pl-concern">
                <span className={cx("pl-next-icon", `tone-${CONCERN[c.kind].tone}`)}><Icon name={CONCERN[c.kind].icon} size={15} /></span>
                <div className="stack" style={{ ["--gap" as string]: "4px", minWidth: 0 }}>
                  <span className="row" style={{ ["--gap" as string]: "6px" }}><Tag square>{CONCERN[c.kind].label}</Tag><span className="strong" style={{ fontWeight: 500 }}>{c.role} · {c.period}</span></span>
                  <span className="small">{c.detail}</span>
                  <SourceTag source={c.source} compact />
                </div>
                <div className="stack" style={{ ["--gap" as string]: "2px", alignItems: "flex-end" }}>
                  <span className="tiny muted">対応</span>
                  <ExternalActor userId={c.action_owner} />
                </div>
              </div>
            ))}
            <div style={{ padding: "10px 20px" }} className="row between">
              <span className="tiny muted">複数案件にまたがる要員の競合は「要員・予算」で判断します。</span>
              <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.capacity(org)}>要員・予算</Button>
            </div>
          </Section>
          <Section title="計画と実績" sub="上段の灰色が計画、下段が実績（遅れは橙色）。赤い線は今日" actions={<span className="row small muted"><Tag square>計画</Tag><Tag tone="primary" square>実績</Tag><Tag tone="warn" square>遅れ</Tag></span>}>
            <div className="stack" style={{ ["--gap" as string]: "10px" }}>
              <div className="pl-gantt-scale">
                <span />
                <div className="ticks">{ticks.map((t) => <span key={t} style={{ left: pct(t) }}>{weekLabel(t)}</span>)}</div>
              </div>
              <div className="gantt">
                {progressTasks.map((t) => (
                  <div key={t.id} className="gantt-row">
                    <div className="stack" style={{ ["--gap" as string]: "0" }}>
                      <span className="strong truncate" style={{ fontWeight: 500 }}>{t.title}</span>
                      <span className="tiny muted mono">{t.id}</span>
                    </div>
                    <div className="gantt-track">
                      {t.planEnd > lo && t.planStart < hi ? <span className="gantt-bar plan" style={{ left: pct(t.planStart), width: width(t.planStart, t.planEnd) }} title={`計画: ${weekLabel(t.planStart)}〜${weekLabel(t.planEnd)}`} /> : null}
                      {t.actStart !== undefined && (t.actEnd ?? PROGRESS_NOW_WEEK) > lo && t.actStart < hi ? (
                        <span className={cx("gantt-bar actual", t.late && "late")} style={{ left: pct(t.actStart), width: width(t.actStart, t.actEnd ?? PROGRESS_NOW_WEEK) }} title={`実績: ${weekLabel(t.actStart)}〜${t.actEnd ? weekLabel(t.actEnd) : "進行中"}`} />
                      ) : null}
                      {PROGRESS_NOW_WEEK > lo && PROGRESS_NOW_WEEK < hi ? <span className="pl-gantt-now" style={{ left: pct(PROGRESS_NOW_WEEK) }} aria-hidden /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
          <div className="grid main-side">
            <Section title="計画した作業と実績の対応" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>作業</th><th>計画</th><th>実績</th><th>Issue／PR</th><th>状態</th></tr></thead>
                  <tbody>
                    {progressTasks.map((t) => (
                      <tr key={t.id}>
                        <td><span className="mono small muted">{t.id}</span> {t.title}</td>
                        <td className="small nowrap">{weekLabel(t.planStart)}〜{weekLabel(t.planEnd)}</td>
                        <td className="small nowrap">{t.actStart !== undefined ? `${weekLabel(t.actStart)}〜${t.actEnd ? weekLabel(t.actEnd) : "進行中"}` : "—"} {t.late ? <Tag tone="warn">遅れ</Tag> : null}</td>
                        <td className="small">{t.issues.length ? t.issues.join(", ") : <span className="muted">未対応付け</span>}</td>
                        <td><Tag tone={statusLabel[t.status].tone}>{statusLabel[t.status].label}</Tag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <div className="stack">
              <Section title="遅延の予兆">
                {state === "AI無効" ? (
                  <AIUnavailableNotice reason="orgDisabled" />
                ) : (
                  <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                    <AISectionHead count={progressFindings.length} note="参考情報。計画の変更は PM が作成し、承認者が判断します" />
                    {progressFindings.map((f) => <AIFindingCard key={f.id} finding={f} compact />)}
                  </div>
                )}
              </Section>
              <Section title="進捗報告（正本から同期）">
                <Timeline compact items={progressRecords.map((r) => ({ id: r.id, actor: { kind: "human" as const, name: `${userById(r.by)?.name ?? ""}（外部ID）` }, action: `週次報告 ${r.id}`, at: r.at, detail: r.summary }))} />
              </Section>
            </div>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
