// 画面ID: G-05 必須チェックの登録状況
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { registrations } from "../../mocks/gates";
import type { Registration } from "../../mocks/gates";
import {
  Banner,
  Button,
  CapabilityCell,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  ProjectLayout,
  ProviderBadge,
  Section,
  Skeleton,
  StatCard,
  Tag,
  Timestamp,
  useToast,
} from "../../ui";
import type { Column } from "../../ui";

const STATE_TAG: Record<Registration["state"], { label: string; tone: "pass" | "fail" | "warn" | "neutral"; icon: "check" | "xCircle" | "alert" | "info" }> = {
  ok: { label: "登録済み", tone: "pass", icon: "check" },
  missing: { label: "未登録", tone: "fail", icon: "xCircle" },
  drift: { label: "設定が変更された", tone: "warn", icon: "alert" },
  unsupported: { label: "代替方式", tone: "neutral", icon: "info" },
};

/** 提供元ごとにゲートを必須化できる仕組みの差 */
const MECHANISMS = [
  { provider: "github" as const, how: "必須ステータスチェック（Checks API）", required: "yes" as const, merge: "yes" as const, note: "GitHub App が Check Run を作成・更新する" },
  { provider: "gitlab" as const, how: "External Status Check＋保護ブランチ", required: "yes" as const, merge: "yes" as const, note: "MR の HEAD SHA ごとに結果を投稿する" },
  { provider: "azureRepos" as const, how: "PR Status（genre/name）＋ブランチポリシー", required: "yes" as const, merge: "yes" as const, note: "状態 product-name/gate をポリシーで必須化する" },
  { provider: "codecommit" as const, how: "承認ルール＋コメント", required: "partial" as const, merge: "partial" as const, note: "チェックの書き込み API がない。承認ルールの充足でマージを制御する" },
];

export function GateRegistrationScreen({ org, project }: { org: string; project: string }) {
  const state = useScreenState();
  const toast = useToast();
  const rows = state === "allOk" ? registrations.map((r) => (r.state === "missing" || r.state === "drift" ? { ...r, state: "ok" as const, detail: "登録済み" } : r)) : registrations;
  const data = state === "empty" ? [] : rows;
  const problems = rows.filter((r) => r.state === "missing" || r.state === "drift");

  const columns: Column<Registration>[] = [
    { key: "repo", header: "リポジトリ", render: (r) => <span className="mono small">{r.repo}</span>, sortValue: (r) => r.repo },
    { key: "provider", header: "提供元", render: (r) => <ProviderBadge provider={r.provider} size="sm" />, sortValue: (r) => r.provider },
    { key: "branch", header: "ブランチ", render: (r) => <span className="mono small">{r.branch}</span> },
    { key: "mechanism", header: "必須化の方式", render: (r) => <span className="small">{r.mechanism}</span> },
    { key: "state", header: "状態", render: (r) => <Tag tone={STATE_TAG[r.state].tone} icon={STATE_TAG[r.state].icon}>{STATE_TAG[r.state].label}</Tag>, sortValue: (r) => r.state },
    { key: "detail", header: "内容", render: (r) => <span className="small">{r.detail}</span> },
    { key: "checked", header: "確認日時", render: (r) => <Timestamp at={r.checked_at} />, sortValue: (r) => r.checked_at },
  ];

  return (
    <ProjectLayout org={org} project={project} active="gateSettings" trail={[{ label: "ゲート実行", to: paths.gates(org, project) }, { label: "必須チェックの登録状況" }]}>
      <PageHeader
        title="必須チェックの登録状況"
        description="ゲートが各 Git サービスで必須として登録され、ブランチ保護が保たれているかを定期的に確認します。設定漏れや変更を検知すると、ポリシー管理者と案件スポンサーに通知します。"
        actions={
          <>
            <Button icon="settings" to={paths.gateSettings(org, project)}>ゲートの適用設定</Button>
            <Button icon="refresh" onClick={() => toast({ kind: "info", message: "登録状況の再確認を開始しました" })}>今すぐ確認</Button>
          </>
        }
      />
      {state === "loading" ? (
        <Skeleton />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {problems.length ? (
            <Banner tone="fail" title={`設定漏れ・変更が ${problems.length} 件あります`}>
              必須化されていないブランチでは、ゲートがブロックしてもマージできてしまいます。各サービスの管理者に修正を依頼してください。修正されるまで、この状態は経営ダッシュボードにも表示されます。
            </Banner>
          ) : state !== "empty" ? (
            <Banner tone="pass" title="すべての対象ブランチでゲートが必須化されています" />
          ) : null}
          <div className="grid cols-3">
            <StatCard label="登録済み" value={rows.filter((r) => r.state === "ok").length} unit="件" icon="checkCircle" />
            <StatCard label="設定漏れ・変更" value={problems.length} unit="件" icon="alert" tone={problems.length ? "danger" : undefined} />
            <StatCard label="代替方式" value={rows.filter((r) => r.state === "unsupported").length} unit="件" icon="info" delta="提供元にチェック API がない" />
          </div>
          <DataTable
            columns={columns}
            rows={data}
            rowKey={(r) => `${r.repo}-${r.branch}`}
            empty={<EmptyState icon="branch" title="対象のリポジトリがありません" description="連携と同期の画面でコードホスティングを接続すると、ここに表示されます。" action={<Button to={paths.connectors(org)}>連携と同期へ</Button>} />}
          />
          <Section title="提供元ごとの必須化の仕組み" sub="提供元によってできることが違います。できないことは隠さずに表示します" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>提供元</th><th>方式</th><th>必須化</th><th>マージの制御</th><th>補足</th></tr></thead>
                <tbody>
                  {MECHANISMS.map((m) => (
                    <tr key={m.provider}>
                      <td><ProviderBadge provider={m.provider} size="sm" /></td>
                      <td className="small">{m.how}</td>
                      <td><CapabilityCell level={m.required} /></td>
                      <td><CapabilityCell level={m.merge} /></td>
                      <td className="small">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "8px 16px 14px" }}>
              <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.capabilities(org)}>すべての能力の比較を見る</Button>
            </div>
          </Section>
        </>
      )}
    </ProjectLayout>
  );
}
