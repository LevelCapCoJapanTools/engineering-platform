// 画面ID: L-04 構成管理・ベースライン
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { APPROVAL_STATUS } from "../../lib/vocab";
import { formatDateTime } from "../../lib/format";
import { baselineItems, baselines } from "../../mocks/gates";
import type { BaselineItem } from "../../mocks/gates";
import {
  Banner,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  ExternalActor,
  IdLink,
  PageHeader,
  ProjectLayout,
  Section,
  Segmented,
  Select,
  Skeleton,
  SourceTag,
  StatusBadge,
  Tag,
} from "../../ui";
import type { Column } from "../../ui";

const ITEM_APPROVAL = {
  approved: APPROVAL_STATUS.approved,
  pending: APPROVAL_STATUS.pending,
  changing: { label: "変更中（再承認待ち）", tone: "special" as const },
};

export function BaselinesScreen({ org, project }: { org: string; project: string }) {
  const state = useScreenState();
  const [selected, setSelected] = useState(state === "approved" ? "BL-0004" : "BL-0005");
  const [view, setView] = useState(state === "compare" ? "compare" : "items");
  const [kind, setKind] = useState("");
  const bl = baselines.find((b) => b.id === selected) ?? baselines[0];
  const items = baselineItems(bl.id).filter((i) => !kind || i.kind === kind);
  const prev = baselineItems("BL-0004");
  const changed = baselineItems("BL-0005").filter((i) => {
    const p = prev.find((x) => x.id === i.id);
    return !p || p.version !== i.version;
  });

  const linkFor = (i: BaselineItem) =>
    i.kind === "要求" ? <IdLink id={i.id} to={paths.requirement(org, project, i.id)} /> : i.kind === "設計" ? <IdLink id={i.id} to={paths.design(org, project, i.id)} /> : <span className="mono small">{i.id}</span>;

  const columns: Column<BaselineItem>[] = [
    { key: "kind", header: "種類", render: (i) => <Tag square>{i.kind}</Tag>, sortValue: (i) => i.kind },
    { key: "id", header: "ID", render: linkFor },
    { key: "title", header: "名前", render: (i) => <span className="small">{i.title}</span> },
    { key: "version", header: "版", render: (i) => <span className="mono small">{i.version}</span> },
    { key: "ref", header: "参照（パス・ブランチ・タグ・SHA）", render: (i) => <span className="mono tiny">{i.ref}</span> },
    { key: "approval", header: "承認", render: (i) => <StatusBadge vocab={ITEM_APPROVAL[i.approval]} size="sm" />, sortValue: (i) => i.approval },
    { key: "reason", header: "変更理由", render: (i) => <span className="small">{i.reason ?? <span className="muted">—</span>}</span> },
  ];

  return (
    <ProjectLayout org={org} project={project} active="baselines" trail={[{ label: "リリースと受入", to: paths.releases(org, project) }, { label: "構成管理" }]}>
      <PageHeader
        title="構成管理・ベースライン"
        description="要求・設計・コード・テスト・成果物・文書の版を、ベースラインとしてまとめて確認します。各項目の正本は Git や文書管理にあり、ここでは版・変更理由・承認の状態を結び付けて表示します。"
        actions={<Button icon="arrowRight" to={paths.releases(org, project)}>リリースと受入</Button>}
      />
      <SourceTag source={{ provider: "github", label: "タグ・ブランチ（2 リポジトリ）", synced_at: "2026-11-27T10:28:00+09:00", status: "healthy" }} />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : state === "empty" ? (
        <div className="card">
          <EmptyState icon="commit" title="ベースラインはまだありません" description="リリース管理者がリリース候補のタグを作成すると、ベースラインが自動で作成されます。" />
        </div>
      ) : (
        <>
          <Section title="ベースライン" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>ID</th><th>名前</th><th>タグ</th><th>ブランチ</th><th>作成日時</th><th>承認</th><th>承認者</th></tr></thead>
                <tbody>
                  {baselines.map((b) => (
                    <tr key={b.id} className={b.id === selected ? "selected" : undefined} onClick={() => setSelected(b.id)} style={{ cursor: "pointer" }}>
                      <td className="mono small">{b.id}</td>
                      <td className="strong small">{b.name}</td>
                      <td className="mono small">{b.tag}</td>
                      <td className="mono small">{b.branch}</td>
                      <td className="small">{formatDateTime(b.created_at)}</td>
                      <td><StatusBadge vocab={APPROVAL_STATUS[b.status]} size="sm" /></td>
                      <td><ExternalActor userId={b.approver} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {bl.status === "pending" ? (
            <Banner tone="warn" title={`${bl.id} には承認待ち・変更中の項目があります`}>
              すべての項目が承認されるまで、このベースラインはリリースの入力として確定しません。REQ-0006 は顧客の再承認待ちです。
            </Banner>
          ) : null}

          <div className="row between">
            <Segmented value={view} onChange={setView} options={[{ value: "items", label: `${bl.id} の構成` }, { value: "compare", label: "BL-0004 → BL-0005 の差分" }]} />
            {view === "items" ? (
              <div style={{ width: 200 }}>
                <Select value={kind} onChange={setKind} placeholder="すべての種類" options={[{ value: "", label: "すべての種類" }, ...["要求", "設計", "コード", "テスト", "成果物", "文書"].map((k) => ({ value: k, label: k }))]} />
              </div>
            ) : null}
          </div>

          {view === "items" ? (
            <DataTable columns={columns} rows={items} rowKey={(i) => `${i.kind}-${i.id}`} empty={<EmptyState variant="filtered" title="この種類の項目はありません" />} />
          ) : (
            <Section title="前回のベースラインからの変更" sub={`${changed.length} 件の項目の版が変わりました`} flush>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>種類</th><th>ID</th><th>BL-0004</th><th>BL-0005</th><th>変更理由</th><th>承認</th></tr></thead>
                  <tbody>
                    {changed.map((i) => (
                      <tr key={i.id}>
                        <td><Tag square>{i.kind}</Tag></td>
                        <td>{linkFor(i)}</td>
                        <td className="mono small">{prev.find((p) => p.id === i.id)?.version ?? "—"}</td>
                        <td className="mono small">{i.version}</td>
                        <td className="small">{i.reason ?? <span className="muted">—</span>}</td>
                        <td><StatusBadge vocab={ITEM_APPROVAL[i.approval]} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}
    </ProjectLayout>
  );
}
