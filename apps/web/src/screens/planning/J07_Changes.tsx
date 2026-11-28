// 画面ID: J-07 変更要求の一覧
// 変更要求は顧客ポータル・課題管理から同期される。経営層は費用・スケジュールへの影響と、経営判断が必要なものを確認する。
import { useState } from "react";
import { Button, DataTable, ExternalActor, FilterBar, IdLink, PageHeader, ProjectLayout, StatusBadge, Tag, Timestamp } from "../../ui";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { CHANGE_STATUS } from "../../lib/vocab";
import type { ChangeRequest } from "../../lib/types";
import { changes } from "../../mocks/core";
import { PLAN_SOURCE, changeImpacts } from "../../mocks/planning";
import { LIST_STATES, SourceBar, listStateView, orgOf, projectOf } from "./shared";

export const J07_STATES = LIST_STATES;

export function J07Changes({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const rows = changes.filter((c) => (!filters.status || c.status === filters.status) && (!filters.by || c.filed_by_kind === filters.by) && (!q || `${c.id}${c.title}`.includes(q)));
  const alt = listStateView(state, { icon: "compare", emptyTitle: "変更要求はまだありません", emptyDescription: "顧客や社内からの変更要求を記録し、影響を分析したうえで承認します。", emptyAction: <Button icon="external">課題・計画管理で開く</Button> });
  return (
    <ProjectLayout org={org} project={pr} active="changes" trail={[{ label: "変更要求" }]}>
      <PageHeader title="変更要求" description="変更の起票から影響分析、承認、反映までを追跡します。費用・スケジュールへの影響が大きいものは経営判断に回ります。" />
      <SourceBar source={PLAN_SOURCE} note="顧客の起票は顧客ポータル、社内の起票は課題・計画管理から同期" />
      {alt ?? (
        <>
          <FilterBar
            search={q}
            onSearch={setQ}
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            filters={[
              { key: "status", label: "状態", options: Object.entries(CHANGE_STATUS).map(([value, v]) => ({ value, label: v.label })) },
              { key: "by", label: "起票者", options: [{ value: "customer", label: "顧客" }, { value: "internal", label: "社内" }] },
            ]}
          />
          <DataTable<ChangeRequest>
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(paths.change(org, pr, r.id))}
            empty={listStateView("0件（絞り込み）", { emptyTitle: "" })}
            columns={[
              { key: "id", header: "CR-ID", render: (r) => <span className="id-link" style={{ color: "var(--primary)" }}>{r.id}</span>, sortValue: (r) => r.id, hideable: false },
              { key: "title", header: "タイトル", render: (r) => <span className="strong" style={{ fontWeight: 500 }}>{r.title}</span> },
              { key: "by", header: "起票者", render: (r) => <span className="row nowrap"><ExternalActor userId={r.filed_by} /><Tag square tone={r.filed_by_kind === "customer" ? "warn" : "neutral"}>{r.filed_by_kind === "customer" ? "顧客" : "社内"}</Tag></span> },
              { key: "impact", header: "影響範囲", align: "right", render: (r) => `${r.impact_count}件`, sortValue: (r) => r.impact_count },
              { key: "cost", header: "費用", align: "right", render: (r) => { const c = changeImpacts[r.id]?.cost_yen; return c === undefined ? "—" : c === 0 ? "なし" : `${c > 0 ? "+" : ""}${(c / 10000).toLocaleString("ja-JP")}万円`; }, sortValue: (r) => changeImpacts[r.id]?.cost_yen ?? 0 },
              { key: "days", header: "日程", align: "right", render: (r) => { const d = changeImpacts[r.id]?.schedule_days; return d === undefined ? "—" : d === 0 ? "影響なし" : `+${d}日`; }, sortValue: (r) => changeImpacts[r.id]?.schedule_days ?? 0 },
              { key: "decision", header: "経営判断", render: (r) => (changeImpacts[r.id]?.decision ? <span onClick={(e) => e.stopPropagation()}><IdLink id={changeImpacts[r.id]!.decision!} to={paths.decision(org, changeImpacts[r.id]!.decision!)} /></span> : <span className="tiny muted">不要</span>) },
              { key: "status", header: "状態", render: (r) => <StatusBadge vocab={CHANGE_STATUS[r.status]} size="sm" /> },
              { key: "approver", header: "承認者（実務）", render: (r) => (r.approver_id ? <ExternalActor userId={r.approver_id} /> : <span className="muted small">未定</span>) },
              { key: "at", header: "起票日時", render: (r) => <Timestamp at={r.filed_at} />, sortValue: (r) => r.filed_at },
            ]}
          />
        </>
      )}
    </ProjectLayout>
  );
}
