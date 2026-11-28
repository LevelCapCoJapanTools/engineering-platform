// 画面ID: M-01 ポートフォリオ
// 複数案件の健全性・計画対予測・予算・証跡準備度・次の判断を一覧で比較する。値は連携先から同期したもの。
import "./executive.css";
import { useMemo, useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { ProjectHealth } from "../../lib/types";
import { HEALTH } from "../../lib/vocab";
import { yenM } from "../../lib/format";
import { projectBySlug, userById } from "../../mocks/core";
import { projectHealth } from "../../mocks/portfolio";
import { DIVISIONS } from "../../mocks/executive";
import {
  AppLayout,
  Button,
  CoverageMeter,
  crumbs,
  DataTable,
  DeadlineIndicator,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  PlanDates,
  Skeleton,
  SourceTag,
  StaleDataNotice,
  StatCard,
  StatusBadge,
  Tag,
} from "../../ui";
import type { Column } from "../../ui";
import { BudgetCell, PersonRef } from "./parts";
import { PortfolioCostCell } from "../orders/embeds";

export function Portfolio() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [filters, setFilters] = useState<Record<string, string>>(state === "filtered" ? { health: "atRisk" } : {});
  const [q, setQ] = useState("");
  const base = state === "empty" ? [] : projectHealth;
  const rows = useMemo(
    () =>
      base.filter((h) => {
        const p = projectBySlug(h.slug);
        return (
          (!filters.division || h.division === filters.division) &&
          (!filters.customer || p.customer === filters.customer) &&
          (!filters.sponsor || h.sponsor_id === filters.sponsor) &&
          (!filters.health || h.health === filters.health) &&
          (!q || p.name.includes(q) || p.customer.includes(q))
        );
      }),
    [base, filters, q],
  );
  const customers = Array.from(new Set(projectHealth.map((h) => projectBySlug(h.slug).customer)));
  const sponsors = Array.from(new Set(projectHealth.map((h) => h.sponsor_id)));
  const totalBudget = rows.reduce((n, h) => n + h.budget, 0);
  const totalForecast = rows.reduce((n, h) => n + h.forecast_cost, 0);

  const cols: Column<ProjectHealth>[] = [
    { key: "name", header: "案件", hideable: false, sortValue: (h) => projectBySlug(h.slug).name, render: (h) => { const p = projectBySlug(h.slug); return <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{p.name}</span><span className="tiny muted">{p.customer}・{h.division}</span></span>; } },
    { key: "health", header: "健全性", sortValue: (h) => ["offTrack", "atRisk", "unknown", "onTrack"].indexOf(h.health), render: (h) => <StatusBadge vocab={HEALTH[h.health]} size="sm" /> },
    { key: "end", header: "終了（当初→予測）", sortValue: (h) => h.slip_days, render: (h) => <PlanDates baseline={h.baseline_end} forecast={h.forecast_end} compact /> },
    { key: "cost", header: "予測コスト／予算", sortValue: (h) => h.forecast_cost - h.budget, render: (h) => <BudgetCell h={h} /> },
    { key: "outsourcing", header: "外注原価・粗利見込（社内のみ）", sortValue: (h) => h.slug, render: (h) => <PortfolioCostCell slug={h.slug} /> },
    { key: "actual", header: "実績コスト", align: "right", sortValue: (h) => h.actual_cost, render: (h) => <span className="small">{yenM(h.actual_cost)}</span>, defaultHidden: true },
    { key: "evidence", header: "証跡準備度", sortValue: (h) => h.evidence_readiness, render: (h) => <CoverageMeter value={h.evidence_readiness} total={100} compact /> },
    { key: "risks", header: "未解決リスク", align: "right", sortValue: (h) => projectBySlug(h.slug).open_risks, render: (h) => { const n = projectBySlug(h.slug).open_risks; return n ? <span className="strong">{n}</span> : <span className="muted">0</span>; } },
    { key: "decision", header: "次の判断", sortValue: (h) => h.next_decision?.date ?? "9", render: (h) => (h.next_decision ? <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="small">{h.next_decision.title}</span><DeadlineIndicator date={h.next_decision.date} /></span> : <span className="muted">—</span>) },
    { key: "sponsor", header: "スポンサー", sortValue: (h) => h.sponsor_id, render: (h) => <PersonRef userId={h.sponsor_id} /> },
    { key: "source", header: "出典と鮮度", render: (h) => <SourceTag source={h.source} compact /> },
  ];

  return (
    <AppLayout org={org} active="portfolio" breadcrumb={crumbs(org, undefined, { label: "ポートフォリオ" })}>
      <PageHeader
        title="ポートフォリオ"
        description="すべての案件を同じ軸で比較します。健全性は同期した計画・予測・実績から算出した参考値で、判断は経営層が行います。"
        actions={
          <>
            <Button icon="sort" to={paths.priorities(org)}>優先順位</Button>
            <Button icon="map" to={paths.roadmap(org)}>ロードマップ</Button>
          </>
        }
      />
      {state === "error" ? (
        <ErrorState />
      ) : state === "loading" ? (
        <Skeleton rows={5} />
      ) : (
        <>
          <StaleDataNotice sources={base.map((h) => ({ name: projectBySlug(h.slug).name, source: h.source }))} action={<Button size="sm" to={paths.connectors(org)}>連携の状況</Button>} />
          <div className="grid auto-fit">
            <StatCard label="対象の案件" value={rows.length} unit="件" delta={`遅延・注意 ${rows.filter((h) => h.health === "atRisk" || h.health === "offTrack").length}件・判定不可 ${rows.filter((h) => h.health === "unknown").length}件`} />
            <StatCard label="予測コスト／承認予算" value={yenM(totalForecast)} delta={`承認予算 ${yenM(totalBudget)}`} tone={totalForecast > totalBudget ? "danger" : "good"} />
            <StatCard label="当初から遅れている案件" value={rows.filter((h) => h.slip_days > 0).length} unit="件" delta={`最大 +${Math.max(0, ...rows.map((h) => h.slip_days))}日`} tone={rows.some((h) => h.slip_days > 0) ? "warn" : undefined} />
            <StatCard label="証跡準備度 80% 未満" value={rows.filter((h) => h.evidence_readiness < 80).length} unit="件" delta="リリース前に担当者へ確認" />
          </div>
          <FilterBar
            filters={[
              { key: "division", label: "事業部", options: DIVISIONS.map((d) => ({ value: d, label: d })) },
              { key: "customer", label: "顧客", options: customers.map((c) => ({ value: c, label: c })) },
              { key: "sponsor", label: "スポンサー", options: sponsors.map((s) => ({ value: s, label: userById(s)?.name ?? s })) },
              { key: "health", label: "健全性", options: Object.entries(HEALTH).map(([value, v]) => ({ value, label: v.label })) },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            search={q}
            onSearch={setQ}
            searchPlaceholder="案件名・顧客名で絞り込み"
          />
          <DataTable
            columns={cols}
            rows={rows}
            rowKey={(h) => h.slug}
            onRowClick={(h) => navigate(paths.project(org, h.slug))}
            empty={
              base.length === 0 ? (
                <EmptyState icon="folder" title="案件がありません" description="案件受付で開始が承認された案件を登録すると、ここに表示されます。" action={<Button variant="primary" icon="briefcase" to={paths.intake(org)}>案件受付へ</Button>} />
              ) : (
                <EmptyState variant="filtered" title="条件に合う案件はありません" action={<Button size="sm" onClick={() => { setFilters({}); setQ(""); }}>条件をクリア</Button>} />
              )
            }
          />
          <p className="tiny muted">
            <Tag square>判定不可</Tag> は、計画データの同期が止まっているなど、健全性を判断できる材料がそろっていない案件です。最新とみなさず、出典の状況を確認してください。
          </p>
        </>
      )}
    </AppLayout>
  );
}
