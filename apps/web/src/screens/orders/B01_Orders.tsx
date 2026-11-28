// 画面ID: B-01 受託者への発注
// 受注側（この組織）が受託者に出した発注の一覧。6つの状態を別々に表示し、次に動く人と期限を示す。
import { useMemo, useState } from "react";
import { navigate, useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { Order } from "../../lib/types";
import { ORDER_STATUS } from "../../lib/vocab";
import { latestTerms } from "../../mocks/engagement";
import { ownOrders } from "../../mocks/orders";
import { AppLayout, Button, crumbs, DataTable, DeadlineIndicator, EmptyState, ErrorState, ExternalActor, FilterBar, NextActor, PageHeader, Skeleton, StatCard, TradeStateStrip, VersionPin } from "../../ui";
import type { Column } from "../../ui";
import { InternalOnly, InternalYen, projectName } from "./parts";

export function B01Orders() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [filters, setFilters] = useState<Record<string, string>>(state === "filtered" ? { next: "freelancer" } : {});
  const [q, setQ] = useState("");
  const base = state === "empty" ? [] : ownOrders;
  const rows = useMemo(
    () => base.filter((o) => (!filters.project || o.project === filters.project) && (!filters.status || o.status === filters.status) && (!filters.next || o.next_actor === filters.next) && (!q || `${o.id} ${o.title}`.includes(q))),
    [base, filters, q],
  );
  const trail = crumbs(org, undefined, { label: "受託者への発注" });

  const cols: Column<Order>[] = [
    { key: "id", header: "発注", hideable: false, sortValue: (o) => o.id, render: (o) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="mono small">{o.id}</span><span className="strong">{o.title}</span><span className="tiny muted">{projectName(o.project)}</span></span> },
    { key: "freelancer", header: "受託者", render: (o) => <ExternalActor userId={o.freelancer_id} /> },
    { key: "version", header: "条件の版", render: (o) => <VersionPin version={o.accepted_version ?? latestTerms(o).version} latest={latestTerms(o).version} accepted={o.accepted_version} /> },
    { key: "state", header: "取引の状態", render: (o) => <TradeStateStrip order={o} compact /> },
    { key: "next", header: "次に動く人", sortValue: (o) => o.next_due ?? "9", render: (o) => <span className="stack" style={{ ["--gap" as string]: "4px" }}><NextActor actor={o.next_actor} action={o.next_action} />{o.next_due ? <DeadlineIndicator date={o.next_due} compact /> : null}</span> },
    { key: "fee", header: "報酬（社内のみ）", align: "right", sortValue: (o) => latestTerms(o).fee, render: (o) => <InternalYen value={latestTerms(o).fee} /> },
  ];

  return (
    <AppLayout org={org} active="orders" breadcrumb={trail}>
      <PageHeader
        title="受託者への発注"
        description="受託者（フリーエンジニア）に出した依頼の一覧です。発注条件・提出・委託検収・配備・顧客受入・支払を別々の状態で管理します。受託者とのやり取りは案件窓口が引き受けます。"
        actions={<Button variant="primary" icon="plus" to={paths.orderNew(org)}>依頼書を作成</Button>}
      />
      {state === "loading" ? (
        <Skeleton rows={5} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          <div className="grid auto-fit">
            <StatCard label="受託者の回答待ち" value={base.filter((o) => o.status === "offered" || o.status === "negotiating").length} unit="件" delta="既読と受諾は区別しています" />
            <StatCard label="委託検収待ち" value={base.filter((o) => o.inspection === "inProgress" || (o.submission === "submitted" && o.inspection === "notStarted")).length} unit="件" delta="指定検収者が判断" tone="warn" />
            <StatCard label="作業中" value={base.filter((o) => o.status === "accepted" && o.submission === "none").length} unit="件" />
            <StatCard label="完了" value={base.filter((o) => o.status === "completed").length} unit="件" />
          </div>
          <InternalOnly>報酬は社内のみの値です。この組織が出した発注だけを表示し、受託者がほかの依頼元から受けている仕事は表示しません。</InternalOnly>
          <FilterBar
            filters={[
              { key: "project", label: "案件", options: [...new Set(ownOrders.map((o) => o.project))].map((p) => ({ value: p, label: projectName(p) })) },
              { key: "status", label: "発注条件", options: Object.entries(ORDER_STATUS).map(([value, v]) => ({ value, label: v.label })) },
              { key: "next", label: "次に動く人", options: [{ value: "freelancer", label: "受託者" }, { value: "desk", label: "案件窓口" }, { value: "inspector", label: "委託元の検収者" }, { value: "customer", label: "発注企業" }] },
            ]}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            search={q}
            onSearch={setQ}
            searchPlaceholder="発注番号・件名"
          />
          <DataTable
            columns={cols}
            rows={rows}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(paths.order(org, o.id))}
            empty={
              base.length === 0 ? (
                <EmptyState icon="send" title="まだ発注はありません" description="承認済みの案件から依頼書を作成すると、ここに表示されます。" action={<Button variant="primary" icon="plus" to={paths.orderNew(org)}>依頼書を作成</Button>} />
              ) : (
                <EmptyState variant="filtered" title="条件に合う発注はありません" action={<Button size="sm" onClick={() => { setFilters({}); setQ(""); }}>条件をクリア</Button>} />
              )
            }
          />
        </>
      )}
    </AppLayout>
  );
}
