// 画面ID: O-04 プロジェクト一覧
import { useState } from "react";
import { useScreenState, navigate, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { PHASES } from "../../lib/types";
import type { Project } from "../../lib/types";
import { AppLayout, Button, CoverageMeter, crumbs, DataTable, EmptyState, EnforcementBadge, ErrorState, FilterBar, GateSummaryStrip, PageHeader, PlanDates, PolicyVersionTag, Skeleton, SourceTag, StaleDataNotice, StatusBadge, Tag, Toggle } from "../../ui";
import { HEALTH } from "../../lib/vocab";
import { healthBySlug } from "../../mocks/portfolio";
import { userById } from "../../mocks/core";
import type { Column } from "../../ui";
import { projects, repos } from "../../mocks/core";

const healthOf = (p: Project, stale: boolean) => {
  const h = healthBySlug(p.slug);
  if (!h) return undefined;
  return stale && p.slug === "order-renewal" ? { ...h, source: { ...h.source, synced_at: "2026-11-26T18:00:00+09:00", status: "failing" as const } } : h;
};

export function Projects() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [archived, setArchived] = useState(false);
  const [q, setQ] = useState(state === "filtered" ? "物流倉庫" : "");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const base = state === "empty" ? [] : projects.filter((p) => archived || !p.archived);
  const stale = state === "stale";
  const rows = base.filter((p) => (!q || `${p.name}${p.customer}`.includes(q)) && (!filters.phase || p.phase === filters.phase) && (!filters.enforcement || p.enforcement === filters.enforcement) && (!filters.health || healthBySlug(p.slug)?.health === filters.health));
  const cols: Column<Project>[] = [
    { key: "name", header: "プロジェクト", hideable: false, sortValue: (p) => p.name, render: (p) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="row" style={{ ["--gap" as string]: "6px" }}><span className="strong">{p.name}</span>{p.archived ? <Tag square>アーカイブ済み</Tag> : null}</span><span className="tiny muted">{p.slug}</span></span> },
    { key: "health", header: "健全性", sortValue: (p) => ["offTrack", "atRisk", "unknown", "onTrack"].indexOf(healthBySlug(p.slug)?.health ?? "unknown"), render: (p) => { const h = healthOf(p, stale); return h ? <StatusBadge vocab={HEALTH[h.source.status === "authExpired" || h.source.status === "failing" ? "unknown" : h.health]} size="sm" /> : <span className="muted">—</span>; } },
    { key: "customer", header: "顧客", sortValue: (p) => p.customer, render: (p) => p.customer },
    { key: "sponsor", header: "スポンサー", render: (p) => <span className="small">{userById(healthBySlug(p.slug)?.sponsor_id)?.name ?? "—"}</span> },
    { key: "end", header: "終了（予測）", sortValue: (p) => healthBySlug(p.slug)?.slip_days ?? 0, render: (p) => { const h = healthBySlug(p.slug); return h ? <PlanDates baseline={h.baseline_end} forecast={h.forecast_end} compact /> : <span className="muted">—</span>; } },
    { key: "source", header: "計画の出典", render: (p) => { const h = healthOf(p, stale); return h ? <SourceTag source={h.source} prefix="" compact /> : <Tag tone="warn" square>計画の正本なし</Tag>; } },
    { key: "repos", header: "リポジトリ", align: "right", sortValue: (p) => p.repos.length, render: (p) => <span title={p.repos.join("\n")}>{p.repos.length}</span> },
    { key: "phase", header: "フェーズ", sortValue: (p) => PHASES.findIndex((x) => x.key === p.phase), render: (p) => <Tag square>{PHASES.find((x) => x.key === p.phase)?.label}</Tag> },
    { key: "pack", header: "Control Pack", render: (p) => <PolicyVersionTag pack="Basic" version={p.pack_version} outdated={p.pack_outdated} /> },
    { key: "enf", header: "強制レベル", render: (p) => <EnforcementBadge level={p.enforcement} /> },
    { key: "gates", header: "ゲート", render: (p) => <GateSummaryStrip gates={p.main_gates} /> },
    { key: "trace", header: "トレーサビリティ", sortValue: (p) => p.trace_linked / p.trace_total, render: (p) => <CoverageMeter value={p.trace_linked} total={p.trace_total} compact /> },

  ];
  return (
    <AppLayout org={org} active="projects" breadcrumb={crumbs(org, undefined, { label: "プロジェクト" })}>
      <PageHeader title="プロジェクト" description={`${base.length}件 · 連携リポジトリ ${repos.length}件 · 閲覧範囲内の案件のみ表示`} actions={<><Button icon="grid" to={paths.portfolio(org)}>ポートフォリオで比較</Button><Button variant="primary" icon="plus" to={paths.projectNew(org)}>プロジェクトを作成</Button></>} />
      {state === "loading" || state === "error" || state === "empty" ? null : (
        <StaleDataNotice sources={base.map((p) => ({ name: p.name, source: healthOf(p, stale)?.source })).filter((x): x is { name: string; source: NonNullable<typeof x.source> } => Boolean(x.source))} action={<Button size="sm" to={paths.connectors(org)}>連携と同期</Button>} />
      )}
      <FilterBar
        search={q}
        onSearch={setQ}
        searchPlaceholder="プロジェクト名・顧客名"
        filters={[
          { key: "health", label: "健全性", options: Object.entries(HEALTH).map(([value, v]) => ({ value, label: v.label })) },
          { key: "phase", label: "フェーズ", options: PHASES.map((p) => ({ value: p.key, label: p.label })) },
          { key: "enforcement", label: "強制レベル", options: [{ value: "warnOnly", label: "警告のみ" }, { value: "soft", label: "ソフト" }, { value: "hard", label: "ハード" }] },
        ]}
        values={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        actions={<Toggle label="アーカイブ済みも表示" checked={archived} onChange={setArchived} />}
      />
      {state === "loading" ? (
        <Skeleton rows={4} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <DataTable
          columns={cols}
          rows={rows}
          rowKey={(p) => p.id}
          onRowClick={(p) => navigate(paths.project(org, p.slug))}
          empty={
            base.length === 0 ? (
              <EmptyState icon="folder" title="プロジェクトがありません" description="最初のプロジェクトを作成して、リポジトリと顧客を登録しましょう。" action={<Button variant="primary" icon="plus" to={paths.projectNew(org)}>プロジェクトを作成</Button>} />
            ) : (
              <EmptyState variant="filtered" title="条件に合うプロジェクトはありません" description="キーワードや絞り込み条件を変更してください。" action={<Button size="sm" onClick={() => { setQ(""); setFilters({}); }}>条件をクリア</Button>} />
            )
          }
        />
      )}
    </AppLayout>
  );
}
