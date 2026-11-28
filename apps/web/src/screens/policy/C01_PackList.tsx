// 画面ID: C-01 Control Pack 一覧
import { navigate, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { packPins, packs } from "../../mocks/policy";
import { userById } from "../../mocks/core";
import type { ControlPack } from "../../mocks/policy";
import {
  AppLayout,
  Banner,
  Button,
  crumbs,
  DataTable,
  EmptyState,
  EnforcementBadge,
  Section,
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
      <PageHeader
        title="Control Pack"
        description="統制項目と自動ルールをまとめたパックです。パックは製品側で提供し、組織での調整はテーラリングで行います。適合の判定や認証を行うものではありません。"
        actions={
          <>
            <Button icon="target" to={paths.packScope(org, "basic")}>適用範囲の確認</Button>
            <Button icon="book" to={paths.packSources(org, "basic")}>出典と利用許諾</Button>
            <Button icon="history" to={paths.packReviews(org, "basic")}>レビュー記録</Button>
          </>
        }
      />
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
      {state === "default" ? (
        <Section title="プロジェクトごとの版の固定" sub="プロジェクトの開始時に、プロファイル・Control Pack・ルール・テンプレート・強制レベルの版を固定します。新しい版は自動では適用されず、変更には承認が必要です" flush>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>プロジェクト</th><th>プロファイル</th><th>Control Pack</th><th>ルール</th><th>テンプレート</th><th>強制レベル</th><th>固定日・承認者</th><th>変更履歴</th></tr></thead>
              <tbody>
                {packPins.map((p) => (
                  <tr key={p.slug}>
                    <td className="strong">{p.project}</td>
                    <td className="small">{p.profile === "要専門家確認" ? <Tag tone="warn">要専門家確認</Tag> : p.profile}</td>
                    <td><PolicyVersionTag pack="" version={p.pack} outdated={p.pack !== "1.3.1"} /></td>
                    <td className="mono small">{p.rules}</td>
                    <td className="mono small">{p.templates}</td>
                    <td><EnforcementBadge level={p.enforcement} /></td>
                    <td className="small">{formatDate(p.pinned_at)} · {userById(p.approved_by)?.name}</td>
                    <td className="small">
                      {p.history.length ? p.history.map((h) => <div key={h.at}>{formatDate(h.at)} {h.change}（承認: {userById(h.approved_by)?.name}）</div>) : <span className="muted">変更なし</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}
      <p className="tiny muted">Entry・Intermediate・Advanced やシステムエンジニアリングのプロファイルは、別の Control Pack・別の版として扱います（現在は提供していません）。</p>
    </AppLayout>
  );
}
