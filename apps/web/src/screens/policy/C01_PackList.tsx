// 画面ID: C-01 Control Pack 一覧
import { navigate, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { packs } from "../../mocks/policy";
import type { ControlPack } from "../../mocks/policy";
import {
  AppLayout,
  Banner,
  Button,
  crumbs,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  PolicyVersionTag,
  Skeleton,
  Tag,
} from "../../ui";
import type { Column } from "../../ui";

export function PackList({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const rows = state === "empty" ? [] : packs;
  const columns: Column<ControlPack>[] = [
    { key: "name", header: "パック名", render: (p) => <span className="strong">{p.name}</span>, sortValue: (p) => p.name, hideable: false },
    { key: "version", header: "バージョン", render: (p) => <PolicyVersionTag pack="" version={p.version} outdated={p.latest !== undefined && p.latest !== p.version} />, sortValue: (p) => p.version },
    { key: "profile", header: "対象プロファイル", render: (p) => <Tag square>{p.profile}</Tag> },
    { key: "published", header: "公開日", render: (p) => formatDate(p.published_at), sortValue: (p) => p.published_at },
    { key: "projects", header: "適用中のプロジェクト", align: "right", render: (p) => `${p.projects}件`, sortValue: (p) => p.projects },
    { key: "latest", header: "新しいバージョン", render: (p) => (p.latest && p.latest !== p.version ? <Tag tone="warn" icon="arrowRight">{p.latest} があります</Tag> : <span className="muted small">最新</span>) },
  ];
  return (
    <AppLayout org={org} active="policies" breadcrumb={crumbs(org, undefined, { label: "ポリシー" })}>
      <PageHeader title="Control Pack" description="統制項目と自動ルールをまとめたパックです。パックは製品側で提供し、組織での調整はテーラリングで行います。" />
      {state === "default" ? (
        <Banner tone="info" title="Basic Control Pack 1.3.1 が公開されました" action={<Button size="sm" to={paths.policyDiff(org, "basic")}>変更点を見る</Button>}>
          自動では適用されません。移行レポートで影響を確認してから、プロジェクトごとに移行します。
        </Banner>
      ) : null}
      {state === "loading" ? (
        <Skeleton rows={3} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p.slug}
          onRowClick={(p) => navigate(paths.policy(org, p.slug))}
          empty={<EmptyState icon="layers" title="利用できる Control Pack がありません" description="プランに含まれる Control Pack が有効になると、ここに表示されます。" />}
        />
      )}
    </AppLayout>
  );
}
