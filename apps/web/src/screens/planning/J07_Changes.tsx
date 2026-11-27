// 画面ID: J-07 変更要求の一覧
import { useState } from "react";
import { Button, DataTable, FilterBar, PageHeader, ProjectLayout, StatusBadge, Tag, Timestamp, UserChip } from "../../ui";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { CHANGE_STATUS } from "../../lib/vocab";
import type { ChangeRequest } from "../../lib/types";
import { changes, userById } from "../../mocks/core";
import { LIST_STATES, listStateView, orgOf, projectOf } from "./shared";

export const J07_STATES = LIST_STATES;

export function J07Changes({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const rows = changes.filter((c) => (!filters.status || c.status === filters.status) && (!filters.by || c.filed_by_kind === filters.by) && (!q || `${c.id}${c.title}`.includes(q)));
  const alt = listStateView(state, { icon: "compare", emptyTitle: "変更要求はまだありません", emptyDescription: "顧客や社内からの変更要求を記録し、影響を分析したうえで承認します。", emptyAction: <Button variant="primary" icon="plus">変更要求を起票</Button> });
  return (
    <ProjectLayout org={org} project={pr} active="changes" trail={[{ label: "変更要求" }]}>
      <PageHeader title="変更要求" description="変更の起票から影響分析、承認、反映までを追跡します。" actions={<Button variant="primary" icon="plus" onClick={() => navigate(paths.change(org, pr, "CR-0004"))}>変更要求を起票</Button>} />
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
              { key: "by", header: "起票者", render: (r) => <span className="row nowrap"><UserChip user={userById(r.filed_by)} showRole={false} plain /><Tag square tone={r.filed_by_kind === "customer" ? "warn" : "neutral"}>{r.filed_by_kind === "customer" ? "顧客" : "社内"}</Tag></span> },
              { key: "impact", header: "影響範囲", align: "right", render: (r) => `${r.impact_count}件`, sortValue: (r) => r.impact_count },
              { key: "status", header: "状態", render: (r) => <StatusBadge vocab={CHANGE_STATUS[r.status]} size="sm" /> },
              { key: "approver", header: "承認者", render: (r) => (r.approver_id ? <UserChip user={userById(r.approver_id)} showRole={false} plain /> : <span className="muted small">未定</span>) },
              { key: "at", header: "起票日時", render: (r) => <Timestamp at={r.filed_at} />, sortValue: (r) => r.filed_at },
            ]}
          />
        </>
      )}
    </ProjectLayout>
  );
}
