// 画面ID: V-03 Evidence Manifest 一覧
import { useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import type { Manifest } from "../../lib/types";
import { manifests } from "../../mocks/core";
import { manifestExtra, VERIFY_FAILURE } from "../../mocks/audit";
import {
  Banner,
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  IdLink,
  PageHeader,
  ProjectLayout,
  RetentionBadge,
  SignatureBadge,
  Skeleton,
  Tag,
  Timestamp,
} from "../../ui";
import type { Column } from "../../ui";

export function ManifestList({ org = ORG, project = PROJECT }: { org?: string; project?: string }) {
  const state = useScreenState();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const rows = state === "empty" ? [] : manifests.filter((m) => {
    if (filters.kind && m.target_kind !== filters.kind) return false;
    if (filters.signature && m.signature !== filters.signature) return false;
    if (search && !`${m.id} ${m.target}`.includes(search)) return false;
    return true;
  });
  const failed = manifests.filter((m) => m.signature === "failed");
  const columns: Column<Manifest>[] = [
    { key: "id", header: "Manifest ID", render: (m) => <IdLink id={m.id} to={paths.manifest(org, project, m.id)} />, sortValue: (m) => m.id, hideable: false },
    { key: "target", header: "対象", render: (m) => <span className="row" style={{ ["--gap" as string]: "6px" }}><Tag square>{m.target_kind === "release" ? "リリース" : "ゲート実行"}</Tag><span className="mono small">{m.target}</span></span>, sortValue: (m) => m.target },
    { key: "created", header: "作成日時", render: (m) => <Timestamp at={m.created_at} mode="absolute" />, sortValue: (m) => m.created_at },
    { key: "schema", header: "スキーマ", render: (m) => <span className="mono tiny">{manifestExtra(m.id).schema_version}</span> },
    { key: "sig", header: "署名", render: (m) => <SignatureBadge state={m.signature} />, sortValue: (m) => m.signature },
    {
      key: "reason",
      header: "直近の検証",
      render: (m) => {
        const v = manifestExtra(m.id).verify[0];
        if (m.signature === "unsigned") return <span className="small muted">未署名</span>;
        return v.result === "pass" ? <span className="small">一致</span> : <span className="small text-fail">{v.reason ? VERIFY_FAILURE[v.reason].label : "不一致"}</span>;
      },
    },
    { key: "ret", header: "保管", render: (m) => <RetentionBadge state={m.retention} until={m.retention_until} /> },
    { key: "approvals", header: "承認の数", align: "right", render: (m) => m.approval_count, sortValue: (m) => m.approval_count },
  ];
  return (
    <ProjectLayout org={org} project={project} active="manifests" trail={[{ label: "Evidence Manifest" }]}>
      <PageHeader title="Evidence Manifest" description="リリースやゲート実行ごとに、証跡のハッシュ・承認・例外・AIレビューの記録をまとめ、署名して別の信頼境界に保管した目録です。検証に失敗した目録は証跡として扱いません。" actions={<Button icon="signature" to={paths.signing(org)}>署名と検証</Button>} />
      {failed.length && state === "default" ? (
        <Banner tone="fail" title={`署名の検証に失敗した Manifest が ${failed.length} 件あります`}>
          {failed.map((m) => m.id).join("、")} の内容が署名時と一致しません。詳細画面で一致しない値を確認してください。
        </Banner>
      ) : null}
      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Manifest ID や対象で絞り込み"
        values={filters}
        onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        filters={[
          { key: "kind", label: "対象の種類", options: [{ value: "release", label: "リリース" }, { value: "gateRun", label: "ゲート実行" }] },
          { key: "signature", label: "署名", options: [{ value: "unsigned", label: "未署名" }, { value: "signed", label: "署名済み" }, { value: "verified", label: "検証成功" }, { value: "failed", label: "検証失敗" }] },
        ]}
      />
      {state === "loading" ? (
        <Skeleton rows={5} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(m) => m.id}
          onRowClick={(m) => navigate(paths.manifest(org, project, m.id))}
          empty={
            state === "empty" ? (
              <EmptyState icon="signature" title="Evidence Manifest はまだありません" description="最初のリリースを承認すると、証跡の目録が自動で作成・署名されます。" />
            ) : (
              <EmptyState variant="filtered" title="条件に合う Manifest はありません" description="絞り込み条件を変更してください。" />
            )
          }
        />
      )}
    </ProjectLayout>
  );
}
