// 画面ID: O-01 経営ダッシュボード
// 直接利用者は経営層。値は連携先（正本）から同期したもので、出典と鮮度を併記する。
import "../executive/executive.css";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { ProjectHealth, SourceRef } from "../../lib/types";
import { HEALTH } from "../../lib/vocab";
import { daysUntil, yenM } from "../../lib/format";
import { exceptions, orgs, projectBySlug, risks } from "../../mocks/core";
import { decisions, incidents, milestones, projectHealth } from "../../mocks/portfolio";
import { aiExecSummaries, capacitySummary, devTeamWork, operationsWork, sortDecisions } from "../../mocks/executive";
import type { WorkItem } from "../../mocks/executive";
import {
  AIUnavailableNotice,
  AppLayout,
  Button,
  CoverageMeter,
  crumbs,
  DataTable,
  EmptyState,
  ErrorState,
  Icon,
  IdLink,
  PageHeader,
  PlanDates,
  ProviderBadge,
  Section,
  Skeleton,
  SourceTag,
  StaleDataNotice,
  StatCard,
  StatusBadge,
  Tag,
} from "../../ui";
import type { Column } from "../../ui";
import { BudgetCell, DecisionCard, evidenceHref, PersonRef } from "../executive/parts";

const OPS_METRICS: { label: string; value: string; unit: string; note: string; tone?: "warn" | "good" }[] = [
  { label: "例外で通過した割合", value: "3.1", unit: "%", note: "ゲート実行 412件中 13件", tone: "good" },
  { label: "取り消されたブロック", value: "6.8", unit: "%", note: "ルールの誤りで再実行・取消したもの", tone: "warn" },
  { label: "リリース時の証跡欠落", value: "0", unit: "件", note: "直近リリース 9件", tone: "good" },
  { label: "PR のリードタイムの増分", value: "+4.2", unit: "%", note: "ゲート導入前の30日と比較" },
  { label: "AI所見の採用率", value: "61", unit: "%", note: "採用 88件／判断済み 144件" },
  { label: "承認済み要求のトレース網羅率", value: "92", unit: "%", note: "テストまでつながった要求の割合" },
];

/** 「データが古い」状態では、すべての出典を古い同期時刻に置き換える */
function withStaleness(h: ProjectHealth, stale: boolean): ProjectHealth {
  if (!stale) return h;
  const source: SourceRef = { ...h.source, synced_at: "2026-11-27T06:40:00+09:00", status: h.source.status === "healthy" ? "stale" : h.source.status };
  return { ...h, source };
}

function workHref(org: string, w: WorkItem) {
  const pr = w.project ?? "order-renewal";
  switch (w.to) {
    case "connector": return w.target ? paths.connector(org, w.target) : paths.connectors(org);
    case "exception": return paths.exception(org, pr, w.target ?? "");
    case "gate": return paths.gate(org, pr, w.target ?? "");
    case "incident": return paths.incident(org, w.target ?? "");
    case "milestone": return paths.milestones(org, pr);
    case "release": return paths.release(org, pr, w.target ?? "");
    default: return undefined;
  }
}

function WorkList({ org, items }: { org: string; items: WorkItem[] }) {
  return (
    <ul className="exec-work-list">
      {items.map((w) => {
        const to = workHref(org, w);
        return (
          <li key={w.id}>
            {to ? <Button variant="ghost" size="sm" to={to} iconRight="arrowRight">{w.title}</Button> : <span className="small strong">{w.title}</span>}
            <span className="row tiny muted" style={{ ["--gap" as string]: "8px" }}>
              <PersonRef userId={w.owner} />
              <ProviderBadge provider={w.source} size="sm" />
              {w.due ? <span>期限 {w.due.slice(5).replace("-", "/")}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Dashboard() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const orgName = (orgs.find((o) => o.slug === org) ?? orgs[0]).name;
  const stale = state === "stale";
  const empty = state === "empty";
  const loading = state === "loading";
  const health = empty ? [] : projectHealth.map((h) => withStaleness(h, stale));

  const pending = empty ? [] : sortDecisions(decisions.filter((d) => d.status === "pending"));
  const dueSoon = pending.filter((d) => daysUntil(d.due) <= 3).length;
  const troubled = health.filter((h) => h.health === "atRisk" || h.health === "offTrack");
  const overBudget = health.reduce((n, h) => n + Math.max(0, h.forecast_cost - h.budget), 0);
  const readiness = health.length ? Math.round(health.reduce((n, h) => n + h.evidence_readiness, 0) / health.length) : 0;
  const openIncidents = empty ? [] : incidents.filter((i) => i.status !== "resolved");
  const unacked = openIncidents.filter((i) => i.status === "triggered").length;
  const expiring = empty ? 0 : exceptions.filter((e) => e.status === "active" && daysUntil(e.expires_at) <= 7).length;
  const criticalRisks = empty ? [] : risks.filter((r) => r.status !== "done" && r.impact * r.likelihood >= 12);
  const blockedPrs = empty ? 0 : health.reduce((n, h) => n + projectBySlug(h.slug).blocked_prs, 0);
  const slipped = empty ? [] : milestones.filter((m) => m.forecast && !m.actual && m.forecast > (m.revised ?? m.baseline));

  const cols: Column<ProjectHealth>[] = [
    { key: "name", header: "案件", render: (h) => { const p = projectBySlug(h.slug); return <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{p.name}</span><span className="tiny muted">{p.customer}・{h.division}</span></span>; }, sortValue: (h) => projectBySlug(h.slug).name, hideable: false },
    { key: "health", header: "健全性", render: (h) => <StatusBadge vocab={HEALTH[h.health]} size="sm" />, sortValue: (h) => ["offTrack", "atRisk", "unknown", "onTrack"].indexOf(h.health) },
    { key: "end", header: "終了（当初→予測）", render: (h) => <PlanDates baseline={h.baseline_end} forecast={h.forecast_end} compact />, sortValue: (h) => h.slip_days },
    { key: "cost", header: "予測コスト／予算", render: (h) => <BudgetCell h={h} />, sortValue: (h) => h.forecast_cost - h.budget },
    { key: "evidence", header: "証跡準備度", render: (h) => <CoverageMeter value={h.evidence_readiness} total={100} compact />, sortValue: (h) => h.evidence_readiness },
    { key: "source", header: "出典", render: (h) => <SourceTag source={h.source} compact />, hideable: true },
  ];

  const sources = health.map((h) => ({ name: projectBySlug(h.slug).name, source: h.source }));

  return (
    <AppLayout org={org} active="dashboard" breadcrumb={crumbs(org, undefined, { label: "経営ダッシュボード" })}>
      <PageHeader
        title="経営ダッシュボード"
        description={`${orgName} の案件全体の状況と、経営判断が必要なことです。値は連携先（正本）から同期したもので、最終同期時点の内容です。`}
        actions={
          <>
            <Button icon="grid" to={paths.portfolio(org)}>ポートフォリオ</Button>
            <Button icon="calendar" to={paths.execSchedule(org)}>スケジュール</Button>
          </>
        }
      />
      {state === "error" ? (
        <ErrorState />
      ) : empty ? (
        <div className="card">
          <EmptyState
            icon="plug"
            title="表示できる案件がありません"
            description="計画・課題管理とコードホスティングを接続し、案件を登録すると、ここに計画対予測、経営判断、証跡の準備状況が表示されます。"
            action={
              <span className="row" style={{ ["--gap" as string]: "8px" }}>
                <Button variant="primary" icon="plug" to={paths.connectors(org)}>連携先を接続</Button>
                <Button icon="briefcase" to={paths.intake(org)}>案件受付へ</Button>
              </span>
            }
          />
        </div>
      ) : (
        <>
          {loading ? null : <StaleDataNotice sources={sources} action={<Button size="sm" to={paths.connectors(org)}>連携の状況</Button>} />}

          <div className="grid auto-fit">
            <StatCard label="判断待ち" icon="inbox" value={pending.length} unit="件" delta={`うち3日以内 ${dueSoon}件`} tone={dueSoon ? "warn" : undefined} to={paths.inbox(org)} loading={loading} />
            <StatCard label="遅延・注意の案件" icon="alert" value={troubled.length} unit={`／${health.length}件`} delta={`予測が遅れたマイルストーン ${slipped.length}件`} tone={troubled.length ? "warn" : "good"} to={paths.portfolio(org)} loading={loading} />
            <StatCard label="予算超過見込み" icon="creditCard" value={overBudget ? yenM(overBudget) : "なし"} delta="予測コストと承認予算の差の合計" tone={overBudget ? "danger" : "good"} to={paths.capacity(org)} loading={loading} />
            <StatCard label="証跡準備度（平均）" icon="archive" value={readiness} unit="%" delta="リリースに必要な証跡のそろい具合" to={paths.portfolio(org)} loading={loading} />
            <StatCard label="対応中のインシデント" icon="zap" value={openIncidents.length} unit="件" delta={unacked ? `未受領 ${unacked}件` : "すべて受領済み"} tone={unacked ? "danger" : undefined} to={paths.incidents(org)} loading={loading} />
            <StatCard label="7日以内に期限が来る例外" icon="flag" value={expiring} unit="件" delta="期限後は自動で再審査" to={paths.exceptions(org, "order-renewal")} loading={loading} />
          </div>

          {loading ? (
            <Skeleton variant="card" rows={3} />
          ) : (
            <Section title="経営判断が必要なこと" sub="期限・影響額・重大度の順。判断の記録は監査記録に残ります" actions={<Button size="sm" variant="ghost" to={paths.inbox(org)} iconRight="arrowRight">すべての判断</Button>}>
              {pending.length === 0 ? (
                <p className="small muted">判断待ちはありません。</p>
              ) : (
                <div className="grid cols-2">
                  {pending.slice(0, 4).map((d) => <DecisionCard key={d.id} org={org} d={d} />)}
                </div>
              )}
            </Section>
          )}

          <div className="grid main-side">
            <div className="stack">
              {loading ? (
                <Skeleton rows={4} />
              ) : (
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  <div className="row between">
                    <h2 className="section-title">案件の健全性と計画対予測</h2>
                    <Button size="sm" variant="ghost" to={paths.portfolio(org)} iconRight="arrowRight">ポートフォリオ</Button>
                  </div>
                  <DataTable columns={cols} rows={health} rowKey={(h) => h.slug} onRowClick={(h) => navigate(paths.project(org, h.slug))} />
                </div>
              )}

              {loading ? null : (
                <Section title="対応の分担" sub="経営判断と、実務の担当者が既存のツールで行う対応を分けて示します">
                  <div className="grid cols-3">
                    <div>
                      <div className="exec-lane-head"><Icon name="inbox" /><strong className="small">経営判断が必要</strong><span className="count">{pending.length}件</span></div>
                      <ul className="exec-work-list">
                        {pending.slice(0, 3).map((d) => (
                          <li key={d.id}>
                            <Button variant="ghost" size="sm" to={paths.decision(org, d.id)} iconRight="arrowRight">{d.title}</Button>
                            <span className="tiny muted">期限 {d.due.slice(5).replace("-", "/")}</span>
                          </li>
                        ))}
                        {pending.length === 0 ? <li className="small muted">ありません</li> : null}
                      </ul>
                    </div>
                    <div>
                      <div className="exec-lane-head"><Icon name="settings" /><strong className="small">運用担当の処理</strong><span className="count">{operationsWork.length}件</span></div>
                      <WorkList org={org} items={operationsWork} />
                    </div>
                    <div>
                      <div className="exec-lane-head"><Icon name="users" /><strong className="small">開発チームの対応</strong><span className="count">{devTeamWork.length}件</span></div>
                      <WorkList org={org} items={devTeamWork} />
                    </div>
                  </div>
                </Section>
              )}

              {loading ? null : (
                <Section title="重大リスクと統制の状況" sub="影響×発生可能性が 12 以上の未完了リスク、ブロック中の PR、期限が近い例外">
                  <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                    {criticalRisks.map((r) => (
                      <div key={r.id} className="row between" style={{ ["--gap" as string]: "8px" }}>
                        <span className="row" style={{ ["--gap" as string]: "8px" }}>
                          <IdLink id={r.id} to={paths.risk(org, "order-renewal", r.id)} />
                          <span className="small">{r.title}</span>
                        </span>
                        <span className="row tiny muted" style={{ ["--gap" as string]: "8px" }}>
                          <Tag tone="fail" square>影響{r.impact}×{r.likelihood}</Tag>
                          <PersonRef userId={r.owner_id} />
                        </span>
                      </div>
                    ))}
                    <div className="row" style={{ ["--gap" as string]: "8px" }}>
                      <Tag tone={blockedPrs ? "fail" : "pass"} icon="shieldX">ブロック中の PR {blockedPrs}件</Tag>
                      <Tag tone={expiring ? "warn" : "neutral"} icon="flag">期限が近い例外 {expiring}件</Tag>
                    </div>
                  </div>
                </Section>
              )}

              {loading ? null : (
                <Section title="ゲート運用の指標" sub="直近30日・全プロジェクト。導入効果の確認に使います">
                  <div className="grid auto-fit">
                    {OPS_METRICS.map((m) => (
                      <StatCard key={m.label} label={m.label} value={m.value} unit={m.unit} delta={m.note} tone={m.tone} />
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <div className="stack">
              <Section title={<span className="row" style={{ ["--gap" as string]: "6px" }}><Icon name="sparkles" />AIによる要約（参考）</span>} sub="元データへのリンクと確信度を確認してください。判断を自動で確定しません">
                {state === "aiDisabled" ? (
                  <AIUnavailableNotice reason="orgDisabled" />
                ) : loading ? (
                  <div className="stack">{[0, 1, 2].map((i) => <span key={i} className="skeleton" style={{ height: 64 }} />)}</div>
                ) : (
                  <div>
                    {aiExecSummaries.map((s) => (
                      <div key={s.id} className="exec-ai-item">
                        <span className="small">{s.text}</span>
                        <span className="row tiny" style={{ ["--gap" as string]: "6px" }}>
                          <Tag tone={s.confidence < 0.6 ? "warn" : "special"} square>確信度 {Math.round(s.confidence * 100)}%</Tag>
                          {s.confidence < 0.6 ? <span className="text-warn">低い確信度。元データを確認してください</span> : null}
                        </span>
                        <span className="row tiny" style={{ ["--gap" as string]: "6px" }}>
                          <span className="muted">根拠:</span>
                          {s.sources.map((src) => {
                            const to = evidenceHref(org, src.id, s.project);
                            return to ? <IdLink key={src.id} id={src.id} to={to} title={src.label} /> : <Tag key={src.id} square>{src.id}</Tag>;
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="予算・要員の要約" sub="役割別・期間別の集計です。個人の稼働は表示しません" actions={<Button size="sm" variant="ghost" to={paths.capacity(org)}>詳細</Button>}>
                {loading ? (
                  <Skeleton rows={3} />
                ) : (
                  <div className="stack" style={{ ["--gap" as string]: "12px" }}>
                    {capacitySummary.map((c) => {
                      const over = c.demand > c.supply;
                      return (
                        <div key={`${c.role}-${c.month}`} className="exec-capacity-row">
                          <span className="small">{c.role}<span className="tiny muted">（{c.month}）</span></span>
                          <span className={over ? "small text-fail strong" : "small"}>必要 {c.demand} ／ 確保 {c.supply} 人月</span>
                          <span className={over ? "exec-bar over" : "exec-bar"}><span style={{ width: `${Math.min(100, (c.supply / Math.max(c.demand, c.supply)) * 100)}%` }} /></span>
                        </div>
                      );
                    })}
                    <span className="tiny muted">予算: 予測コスト合計 {yenM(health.reduce((n, h) => n + h.forecast_cost, 0))}／承認予算 {yenM(health.reduce((n, h) => n + h.budget, 0))}</span>
                  </div>
                )}
              </Section>

              <Section title="データの出典" sub="経営向けの値はすべて連携先から読み取っています">
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  {health.map((h) => (
                    <div key={h.slug} className="stack" style={{ ["--gap" as string]: "2px" }}>
                      <span className="tiny strong">{projectBySlug(h.slug).name}</span>
                      <SourceTag source={h.source} />
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
