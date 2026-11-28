// 画面ID: L-01 リリース一覧
import { useState } from "react";
import { DECISION_STATUS } from "../../lib/vocab";
import { decisions } from "../../mocks/portfolio";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { APPROVAL_STATUS, GATE_STATUS, RELEASE_STATUS } from "../../lib/vocab";
import type { Release } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { releases } from "../../mocks/core";
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  ExternalActor,
  FilterBar,
  PageHeader,
  ProjectLayout,
  SignatureBadge,
  Skeleton,
  SourceTag,
  StatusBadge,
  Tag,
} from "../../ui";
import type { Column } from "../../ui";

export function ReleasesScreen({ org, project }: { org: string; project: string }) {
  const state = useScreenState();
  const [values, setValues] = useState<Record<string, string>>({});
  const rows = releases.filter((r) => !values.status || r.status === values.status);
  const data = state === "empty" ? [] : rows;

  const columns: Column<Release>[] = [
    { key: "version", header: "バージョン", render: (r) => <span className="mono strong">{r.version}</span>, sortValue: (r) => r.version },
    { key: "title", header: "タイトル", render: (r) => r.title },
    { key: "status", header: "状態", render: (r) => <StatusBadge vocab={RELEASE_STATUS[r.status]} size="sm" />, sortValue: (r) => r.status },
    { key: "gate", header: "リリースゲート", render: (r) => <StatusBadge vocab={GATE_STATUS[r.gate]} size="sm" /> },
    { key: "approver", header: "リリース承認者", render: (r) => (r.approver_id ? <ExternalActor userId={r.approver_id} /> : <span className="small muted">未承認</span>) },
    {
      key: "gonogo",
      header: "Go/No-Go",
      render: (r) => {
        if (r.id !== "rel-140") return r.released_at ? <Tag tone="pass" icon="check">Go</Tag> : <span className="small muted">—</span>;
        const d = decisions.find((x) => x.id === "DEC-0033");
        return d ? <StatusBadge vocab={DECISION_STATUS[d.status]} size="sm" /> : <span className="small muted">—</span>;
      },
    },
    { key: "acceptance", header: "受入", render: (r) => (r.acceptance === "notRequested" ? <Tag>未依頼</Tag> : <StatusBadge vocab={APPROVAL_STATUS[r.acceptance]} size="sm" />) },
    { key: "sig", header: "Manifest", render: (r) => <SignatureBadge state={r.signature} /> },
    { key: "date", header: "リリース日", render: (r) => <span className="small">{r.released_at ? formatDate(r.released_at) : `予定 ${formatDate(r.planned_at)}`}</span>, sortValue: (r) => r.released_at ?? r.planned_at },
  ];

  return (
    <ProjectLayout org={org} project={project} active="releases" trail={[{ label: "リリースと受入" }]}>
      <PageHeader
        title="リリースと受入"
        description="リリースゲート、Go/No-Go の判断、リリース承認、顧客の受入、署名済みの Evidence Manifest をリリースごとに確認します。リリースの作成・準備はリリース管理者が Git サービスで行い、ここには同期されます。"
        actions={
          <>
            <Button icon="commit" to={paths.baselines(org, project)}>構成管理</Button>
            <Button icon="external">リリース管理で開く</Button>
          </>
        }
      />
      <SourceTag source={{ provider: "github", label: "Releases（sample-soft/order-api）", synced_at: "2026-11-27T10:28:00+09:00", status: "healthy" }} />
      <FilterBar values={values} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} filters={[{ key: "status", label: "状態", options: Object.entries(RELEASE_STATUS).map(([value, v]) => ({ value, label: v.label })) }]} />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(paths.release(org, project, r.id))}
          empty={state === "empty" ? <EmptyState icon="rocket" title="リリースはまだありません" description="リリース管理者が Git サービスでリリースを作成すると、ここに表示されます。" /> : <EmptyState variant="filtered" title="条件に一致するリリースはありません" />}
        />
      )}
    </ProjectLayout>
  );
}
