// 画面ID: S-13 取引関係と案件の権限
import { Link, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { permissionTests, tradeRelations } from "../../mocks/common2";
import { Banner, Button, ErrorState, Icon, Section, SettingsLayout, Skeleton, Tag, useToast } from "../../ui";
import { ExternalInvitesSection } from "./trade2";

const VIA: { key: keyof (typeof permissionTests)[number]["via"]; label: string }[] = [
  { key: "url", label: "直接 URL" },
  { key: "search", label: "検索" },
  { key: "export", label: "出力" },
  { key: "notify", label: "通知" },
  { key: "ai", label: "AI 回答" },
];

export function S13TradeScopes({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const tests = state === "試験失敗あり"
    ? permissionTests.map((t, i) => (i === 3 ? { ...t, result: "allowed" as const } : t))
    : permissionTests;
  const failed = tests.filter((t) => t.result === "allowed" && !t.target.includes("共同試験費"));

  return (
    <SettingsLayout
      org={org}
      active="tradeScopes"
      title="取引関係と案件の権限"
      description="受注側（JV）・発注企業・受託者の取引関係と役割から、案件・発注ごとに開ける範囲を決めます。範囲は画面・添付・検索・出力・通知・AI 回答のすべてに同じように適用します。"
      actions={<Button icon="refresh" onClick={() => toast({ kind: "success", message: "権限の試験を実行しました（架空データ）" })}>権限の試験を実行</Button>}
    >
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {failed.length > 0 ? (
            <Banner tone="fail" title={`権限の試験で ${failed.length} 件の漏れが見つかりました`} action={<Button size="sm" to={paths.disclosure(org, "order-renewal")}>顧客への公開設定</Button>}>
              公開範囲の外の値が取得できる経路があります。修正するまで、該当する顧客への公開を停止しています。
            </Banner>
          ) : (
            <Banner tone="pass" title="直近の権限の試験はすべて想定どおりです">
              別の受託者の報酬、別の顧客の案件、社内の粗利・内部予算は、直接 URL・検索・出力・通知・AI 回答のいずれからも取得できませんでした。
            </Banner>
          )}

          <Section title="取引関係" sub="同じ会社・人でも、案件や依頼元ごとに関係と見える範囲が分かれます" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>相手</th><th>区分</th><th>関係</th><th>案件・発注</th><th>役割</th><th>見える値</th></tr></thead>
                <tbody>
                  {tradeRelations.map((r) => (
                    <tr key={r.party}>
                      <td className="strong small">{r.party}</td>
                      <td><Tag square tone={r.kind === "JV" ? "primary" : r.kind === "発注企業" ? "info" : "warn"}>{r.kind}</Tag></td>
                      <td className="small">{r.relation}</td>
                      <td className="small">{r.projects}</td>
                      <td className="small">{r.roles}</td>
                      <td className="tiny muted" style={{ maxWidth: 280 }}>{r.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="権限の試験結果" sub="期待どおりなら「拒否」です。業務提携型で合意した共同費目だけは、提携先に「許可」が正しい結果です" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead>
                  <tr><th>試した人</th><th>取得しようとした値</th>{VIA.map((v) => <th key={v.key}>{v.label}</th>)}<th>結果</th><th>試験日</th></tr>
                </thead>
                <tbody>
                  {tests.map((t) => {
                    const expectedAllowed = t.target.includes("共同試験費");
                    const ok = (t.result === "allowed") === expectedAllowed;
                    return (
                      <tr key={`${t.actor}-${t.target}`}>
                        <td className="small">{t.actor}</td>
                        <td className="small">{t.target}</td>
                        {VIA.map((v) => <td key={v.key}>{t.via[v.key] ? <Icon name="check" size={13} label="試験済み" /> : <span className="muted tiny">—</span>}</td>)}
                        <td>{ok ? <Tag tone="pass" square>{t.result === "denied" ? "拒否（想定どおり）" : "許可（合意どおり）"}</Tag> : <Tag tone="fail" square>漏れ</Tag>}</td>
                        <td className="small">{formatDate(t.tested_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <ExternalInvitesSection org={org} />

          <Section title="担当交代と契約終了">
            <ul className="stack small" style={{ ["--gap" as string]: "6px", margin: 0, paddingLeft: 18 }}>
              <li>担当を交代すると、前任者の権限と発行済みのリンクを失効し、未決の申請は権限のある後任へ回付します。</li>
              <li>契約が終わると、その案件・発注の作業資料への権限を失効します。本人が保有すべき帳票（発注書、提出の控え、検収・支払の記録）は控えとして取得できます。</li>
              <li>失効は連携先・承認・通知・当番にも反映します（<Link to={paths.actors(org)}>外部アクターの対応付け</Link>）。</li>
            </ul>
          </Section>
        </>
      )}
    </SettingsLayout>
  );
}
