// 画面ID: M-03 判断ログ
// すべての経営判断の履歴。種類・状態・期間・案件で絞り込み、監査や評価者への説明に出力できる。
import "./executive.css";
import { useMemo, useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { Decision } from "../../lib/types";
import { DECISION_STATUS } from "../../lib/vocab";
import { daysUntil, formatDate, formatDateTime } from "../../lib/format";
import { decisions } from "../../mocks/portfolio";
import { DECISION_KIND, delegatedDecisions } from "../../mocks/executive";
import { AppLayout, Button, crumbs, DataTable, EmptyState, ErrorState, FilterBar, PageHeader, Skeleton, StatusBadge, Tag, useToast } from "../../ui";
import type { Column } from "../../ui";
import { PersonRef, projectName } from "./parts";

export function DecisionLog() {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const [filters, setFilters] = useState<Record<string, string>>(state === "filtered" ? { status: "rejected" } : {});
  const [q, setQ] = useState("");
  const base: Decision[] = state === "empty" ? [] : [...decisions, ...delegatedDecisions];
  const rows = useMemo(
    () =>
      base
        .filter((d) => {
          const at = d.decided_at ?? d.due;
          const age = -daysUntil(at);
          return (
            (!filters.kind || d.kind === filters.kind) &&
            (!filters.status || d.status === filters.status) &&
            (!filters.project || (filters.project === "org" ? !d.project : d.project === filters.project)) &&
            (!filters.period || age <= Number(filters.period)) &&
            (!q || d.title.includes(q) || d.id.includes(q))
          );
        })
        .sort((a, b) => (b.decided_at ?? b.due).localeCompare(a.decided_at ?? a.due)),
    [base, filters, q],
  );

  const cols: Column<Decision>[] = [
    { key: "id", header: "ID", render: (d) => <span className="mono small">{d.id}</span>, sortValue: (d) => d.id },
    { key: "title", header: "判断", hideable: false, render: (d) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="small strong">{d.title}</span><span className="tiny muted">{projectName(d.project)}</span></span> },
    { key: "kind", header: "種類", render: (d) => <Tag square>{DECISION_KIND[d.kind]}</Tag>, sortValue: (d) => d.kind },
    { key: "status", header: "結果", render: (d) => <StatusBadge vocab={DECISION_STATUS[d.status]} size="sm" />, sortValue: (d) => d.status },
    { key: "decider", header: "判断者", render: (d) => (d.decider_id ? <PersonRef userId={d.decider_id} /> : <span className="muted">—</span>) },
    { key: "at", header: "判断日時／期限", render: (d) => <span className="small">{d.decided_at ? formatDateTime(d.decided_at) : `期限 ${formatDate(d.due)}`}</span>, sortValue: (d) => d.decided_at ?? d.due },
    { key: "reason", header: "理由・条件", render: (d) => <span className="small">{d.reason ?? <span className="muted">—</span>}{d.conditions ? <span className="tiny muted"><br />条件: {d.conditions}</span> : null}</span>, defaultHidden: false },
    { key: "requester", header: "依頼者", render: (d) => <PersonRef userId={d.requested_by} />, defaultHidden: true },
  ];

  return (
    <AppLayout org={org} active="inbox" breadcrumb={crumbs(org, undefined, { label: "経営判断", to: paths.inbox(org) }, { label: "判断ログ" })}>
      <PageHeader
        title="判断ログ"
        description="経営判断の履歴です。判断者・日時・理由・条件は変更できない形で記録され、監査パックに含められます。"
        actions={
          <>
            <Button icon="download" disabled={rows.length === 0} disabledReason="出力する判断がありません" onClick={() => toast({ kind: "success", message: `${rows.length}件を CSV で出力しました（UTF-8・BOM 付き）` })}>CSV</Button>
            <Button icon="download" disabled={rows.length === 0} disabledReason="出力する判断がありません" onClick={() => toast({ kind: "success", message: `${rows.length}件を JSON で出力しました` })}>JSON</Button>
          </>
        }
      />
      <FilterBar
        filters={[
          { key: "kind", label: "種類", options: Object.entries(DECISION_KIND).map(([value, label]) => ({ value, label })) },
          { key: "status", label: "結果", options: Object.entries(DECISION_STATUS).map(([value, v]) => ({ value, label: v.label })) },
          { key: "project", label: "案件", options: [{ value: "order-renewal", label: "受発注システム刷新" }, { value: "member-app-api", label: "会員アプリ API 開発" }, { value: "legacy-migration", label: "旧基幹データ移行" }, { value: "org", label: "組織全体（案件なし）" }] },
          { key: "period", label: "期間", options: [{ value: "30", label: "直近30日" }, { value: "90", label: "直近90日" }, { value: "365", label: "直近1年" }] },
        ]}
        values={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        search={q}
        onSearch={setQ}
        searchPlaceholder="ID・判断の内容で絞り込み"
      />
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <DataTable
          columns={cols}
          rows={rows}
          rowKey={(d) => d.id}
          onRowClick={(d) => navigate(paths.decision(org, d.id))}
          empty={
            base.length === 0 ? (
              <EmptyState icon="history" title="判断の記録はまだありません" description="経営判断を記録すると、ここに履歴が残ります。" />
            ) : (
              <EmptyState variant="filtered" title="条件に合う判断はありません" action={<Button size="sm" onClick={() => { setFilters({}); setQ(""); }}>条件をクリア</Button>} />
            )
          }
        />
      )}
    </AppLayout>
  );
}
