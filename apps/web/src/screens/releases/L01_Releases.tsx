// 画面ID: L-01 リリース一覧
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { APPROVAL_STATUS, GATE_STATUS, RELEASE_STATUS } from "../../lib/vocab";
import type { Release } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { releases, userById } from "../../mocks/core";
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  Modal,
  PageHeader,
  ProjectLayout,
  SignatureBadge,
  Skeleton,
  StatusBadge,
  Tag,
  TextField,
  DatePicker,
  UserChip,
  useToast,
} from "../../ui";
import type { Column } from "../../ui";

export function ReleasesScreen({ org, project }: { org: string; project: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const rows = releases.filter((r) => !values.status || r.status === values.status);
  const data = state === "empty" ? [] : rows;

  const columns: Column<Release>[] = [
    { key: "version", header: "バージョン", render: (r) => <span className="mono strong">{r.version}</span>, sortValue: (r) => r.version },
    { key: "title", header: "タイトル", render: (r) => r.title },
    { key: "status", header: "状態", render: (r) => <StatusBadge vocab={RELEASE_STATUS[r.status]} size="sm" />, sortValue: (r) => r.status },
    { key: "gate", header: "リリースゲート", render: (r) => <StatusBadge vocab={GATE_STATUS[r.gate]} size="sm" /> },
    { key: "approver", header: "リリース承認者", render: (r) => (r.approver_id ? <UserChip user={userById(r.approver_id)} showRole={false} plain /> : <span className="small muted">未承認</span>) },
    { key: "acceptance", header: "受入", render: (r) => (r.acceptance === "notRequested" ? <Tag>未依頼</Tag> : <StatusBadge vocab={APPROVAL_STATUS[r.acceptance]} size="sm" />) },
    { key: "sig", header: "Manifest", render: (r) => <SignatureBadge state={r.signature} /> },
    { key: "date", header: "リリース日", render: (r) => <span className="small">{r.released_at ? formatDate(r.released_at) : `予定 ${formatDate(r.planned_at)}`}</span>, sortValue: (r) => r.released_at ?? r.planned_at },
  ];

  return (
    <ProjectLayout org={org} project={project} active="releases" trail={[{ label: "リリースと受入" }]}>
      <PageHeader
        title="リリースと受入"
        description="リリースゲート、リリース承認、顧客の受入、署名済みの Evidence Manifest をリリースごとに管理します。"
        actions={<Button variant="primary" icon="plus" onClick={() => setOpen(true)}>リリースを準備</Button>}
      />
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
          empty={state === "empty" ? <EmptyState icon="rocket" title="リリースはまだありません" description="納入の準備ができたら「リリースを準備」から作成します。" action={<Button variant="primary" icon="plus" onClick={() => setOpen(true)}>リリースを準備</Button>} /> : <EmptyState variant="filtered" title="条件に一致するリリースはありません" />}
        />
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="リリースを準備"
        description="作成するとリリースゲートの確認が始まります。"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button variant="primary" onClick={() => { setOpen(false); toast({ kind: "success", message: "v1.5.0 を作成しました" }); }}>作成</Button>
          </>
        }
      >
        <div className="stack">
          <div className="grid cols-2">
            <TextField label="バージョン" required defaultValue="v1.5.0" />
            <DatePicker label="リリース予定日" required defaultValue="2027-01-15" min="2026-11-28" />
          </div>
          <TextField label="タイトル" required placeholder="例: 取引先 CSV 一括登録" />
        </div>
      </Modal>
    </ProjectLayout>
  );
}
