// 画面ID: M-04 案件受付
import { useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { CASE_STATUS } from "../../lib/vocab";
import type { CaseStatus } from "../../lib/vocab";
import type { BusinessCase } from "../../lib/types";
import { formatDate, yenM } from "../../lib/format";
import { businessCases } from "../../mocks/portfolio";
import { AppLayout, Button, crumbs, DataTable, EmptyState, ErrorState, FilterBar, PageHeader, Skeleton, StatCard, StatusBadge } from "../../ui";
import type { Column } from "../../ui";
import { RoleNote, ScoreDots, userName } from "./parts";

export function Intake() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [filters, setFilters] = useState<Record<string, string>>(state === "filtered" ? { status: "rejected" } : {});
  const [q, setQ] = useState("");
  const rows = state === "empty" ? [] : businessCases.filter((c) => (!filters.status || c.status === filters.status) && (!filters.sponsor || c.sponsor_id === filters.sponsor) && (!q || `${c.id} ${c.title} ${c.customer ?? ""}`.includes(q)));
  const reviewing = businessCases.filter((c) => c.status === "reviewing" || c.status === "submitted");
  const cols: Column<BusinessCase>[] = [
    { key: "id", header: "ID", render: (c) => <span className="mono small">{c.id}</span>, sortValue: (c) => c.id, width: 90 },
    { key: "title", header: "案件", render: (c) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{c.title}</span><span className="tiny muted">{c.customer ?? "自社"}・{c.strategy}</span></span>, sortValue: (c) => c.title, hideable: false },
    { key: "status", header: "状態", render: (c) => <StatusBadge vocab={CASE_STATUS[c.status]} size="sm" />, sortValue: (c) => c.status },
    { key: "sponsor", header: "スポンサー", render: (c) => userName(c.sponsor_id) },
    { key: "proposer", header: "提案者", render: (c) => <span className="small">{userName(c.proposer)}</span> },
    { key: "value", header: "価値", render: (c) => <ScoreDots value={c.value_score} label="事業価値" />, sortValue: (c) => c.value_score },
    { key: "urgency", header: "緊急性", render: (c) => <ScoreDots value={c.urgency} label="緊急性" />, sortValue: (c) => c.urgency },
    { key: "risk", header: "リスク", render: (c) => <ScoreDots value={c.risk_score} invert label="リスク" />, sortValue: (c) => c.risk_score },
    { key: "cost", header: "費用", render: (c) => yenM(c.cost), sortValue: (c) => c.cost, align: "right" },
    { key: "review", header: "審議日", render: (c) => (c.review_date ? formatDate(c.review_date) : <span className="muted">—</span>), sortValue: (c) => c.review_date ?? "9" },
  ];
  return (
    <AppLayout org={org} active="intake" breadcrumb={crumbs(org, undefined, { label: "案件受付" })}>
      <PageHeader
        title="案件受付"
        description="新規案件・追加投資の事業ケースです。案は PM や現場の責任者が作成し、経営層が開始・保留・却下を判断します。"
        actions={<Button variant="primary" icon="plus" to={paths.intakeNew(org)}>事業ケースを登録</Button>}
      />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <div className="stack">
          <div className="grid auto-fit">
            <StatCard label="審議待ち" icon="briefcase" value={state === "empty" ? 0 : reviewing.length} unit="件" delta="提出済み・審議中" tone={reviewing.length && state !== "empty" ? "warn" : undefined} />
            <StatCard label="審議待ちの投資額" icon="creditCard" value={state === "empty" ? "0" : yenM(reviewing.reduce((n, c) => n + c.cost, 0))} delta="推奨案の費用の合計" />
            <StatCard label="今月の判断" icon="checkCircle" value={state === "empty" ? 0 : 1} unit="件" delta="却下 1（BC-0009）" />
          </div>
          <RoleNote>評点（価値・緊急性・リスク）は提案者の自己評価です。審議で見直した値は事業ケースの詳細に記録されます。</RoleNote>
          <FilterBar
            filters={[
              { key: "status", label: "状態", options: (Object.keys(CASE_STATUS) as CaseStatus[]).map((k) => ({ value: k, label: CASE_STATUS[k].label })) },
              { key: "sponsor", label: "スポンサー", options: ["u-kimura", "u-mori", "u-ishii", "u-okada"].map((u) => ({ value: u, label: userName(u) })) },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            search={q}
            onSearch={setQ}
            searchPlaceholder="ID・案件名・顧客で絞り込み"
          />
          <DataTable
            columns={cols}
            rows={rows}
            rowKey={(c) => c.id}
            onRowClick={(c) => navigate(paths.businessCase(org, c.id))}
            empty={
              state === "empty" ? (
                <EmptyState icon="briefcase" title="事業ケースはまだありません" description="新しい案件や追加投資の提案を登録すると、ここで審議状況を確認できます。" action={<Button variant="primary" icon="plus" to={paths.intakeNew(org)}>事業ケースを登録</Button>} />
              ) : (
                <EmptyState variant="filtered" icon="filter" title="条件に合う事業ケースはありません" action={<Button onClick={() => { setFilters({}); setQ(""); }}>条件をクリア</Button>} />
              )
            }
          />
        </div>
      )}
    </AppLayout>
  );
}
