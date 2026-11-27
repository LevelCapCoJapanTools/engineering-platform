// 画面ID: E-01 例外の一覧
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { EXCEPTION_STATUS } from "../../lib/vocab";
import type { ExceptionRecord } from "../../lib/types";
import { GATE_LABELS } from "../../lib/types";
import { daysUntil, formatDate } from "../../lib/format";
import { exceptions, userById } from "../../mocks/core";
import {
  Button,
  DataTable,
  DeadlineIndicator,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  ProjectLayout,
  Skeleton,
  StatCard,
  StatusBadge,
  UserChip,
} from "../../ui";
import type { Column } from "../../ui";

export function ExceptionsScreen({ org, project }: { org: string; project: string }) {
  const state = useScreenState();
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const rows = exceptions.filter((e) => {
    if (values.status && e.status !== values.status) return false;
    if (values.gate && e.gate !== values.gate) return false;
    if (values.due === "soon" && !(e.status === "active" && daysUntil(e.expires_at) <= 7)) return false;
    if (search && !`${e.id} ${e.target} ${e.rule_id}`.includes(search)) return false;
    return true;
  });
  const data = state === "empty" ? [] : rows;
  const active = exceptions.filter((e) => e.status === "active");
  const soon = active.filter((e) => daysUntil(e.expires_at) <= 7);
  const expired = exceptions.filter((e) => e.status === "expired");

  const columns: Column<ExceptionRecord>[] = [
    { key: "id", header: "ID", render: (e) => <span className="id-link" style={{ color: "var(--tone-special)" }}>{e.id}</span>, sortValue: (e) => e.id },
    { key: "rule", header: "対象のルールとゲート", render: (e) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="mono small">{e.rule_id}</span><span className="tiny muted">ゲート{e.gate}（{GATE_LABELS[e.gate]}）</span></span> },
    { key: "target", header: "対象", render: (e) => <span className="mono small">{e.target}</span> },
    { key: "requester", header: "申請者", render: (e) => <UserChip user={userById(e.requester_id)} showRole={false} plain /> },
    { key: "approver", header: "承認者", render: (e) => <UserChip user={userById(e.approver_id)} showRole={false} plain /> },
    { key: "status", header: "状態", render: (e) => <StatusBadge vocab={EXCEPTION_STATUS[e.status]} size="sm" />, sortValue: (e) => e.status },
    { key: "due", header: "期限", render: (e) => (e.status === "active" || e.status === "applying" ? <DeadlineIndicator date={e.expires_at} /> : <span className="small muted">{formatDate(e.expires_at)}</span>), sortValue: (e) => e.expires_at },
  ];

  return (
    <ProjectLayout org={org} project={project} active="exceptions" trail={[{ label: "例外" }]}>
      <PageHeader
        title="例外"
        description="ゲートの失敗を期限付きで通過させる例外です。申請者・理由・リスク・期限・独立した承認者を証跡として記録します。管理者による無条件のバイパスはありません。"
        actions={<Button variant="primary" icon="plus" to={paths.exceptionNew(org, project)}>例外を申請</Button>}
      />
      <div className="grid cols-3">
        <StatCard label="有効な例外" value={active.length} unit="件" icon="flag" to={paths.exceptions(org, project)} />
        <StatCard label="7日以内に期限切れ" value={soon.length} unit="件" icon="clock" tone={soon.length ? "warn" : undefined} />
        <StatCard label="期限切れ" value={expired.length} unit="件" icon="history" delta="期限到来時に自動で再審査" />
      </div>
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="ID・対象・ルール"
        values={values}
        onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))}
        filters={[
          { key: "status", label: "状態", options: Object.entries(EXCEPTION_STATUS).map(([value, v]) => ({ value, label: v.label })) },
          { key: "gate", label: "ゲート", options: ["A", "B", "C", "D"].map((g) => ({ value: g, label: `ゲート${g}` })) },
          { key: "due", label: "期限", options: [{ value: "soon", label: "7日以内" }] },
        ]}
      />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(e) => e.id}
          onRowClick={(e) => navigate(paths.exception(org, project, e.id))}
          empty={state === "empty" ? <EmptyState icon="flag" title="例外はありません" description="ゲートの失敗を一時的に通過させる必要があるときは、ゲート実行の詳細から例外を申請します。" /> : <EmptyState variant="filtered" title="条件に一致する例外はありません" />}
        />
      )}
    </ProjectLayout>
  );
}
