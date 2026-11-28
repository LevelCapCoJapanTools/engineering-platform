// 画面ID: K-01 連携と同期
import "./connectors.css";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { CONNECTOR_CATEGORY, PROVIDERS } from "../../lib/vocab";
import type { ConnectorCategory } from "../../lib/vocab";
import type { ConnectorInstallation } from "../../lib/types";
import { connectors } from "../../mocks/portfolio";
import { AppLayout, Banner, Button, crumbs, EmptyState, ErrorState, Freshness, PageHeader, ProviderBadge, Section, Skeleton, StatCard, SyncBadge, Tag, useToast } from "../../ui";
import { connectorDetails } from "../../mocks/connectors";

const ORDER: ConnectorCategory[] = ["planning", "calendar", "scm", "ci", "chat", "oncall", "storage", "idp"];

const MODE_LABEL: Record<ConnectorInstallation["mode"], string> = {
  read: "読み取りのみ",
  readWriteStatus: "読み取り＋状態の書込み",
  send: "送信のみ",
  interactive: "送信＋応答操作",
};

export function K01Connectors() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const list = state === "empty" ? [] : connectors;
  const broken = list.filter((c) => c.status === "failing" || c.status === "authExpired");
  const delayed = list.filter((c) => c.status === "delayed" || c.status === "stale");
  const scms = list.filter((c) => c.category === "scm");
  const hasPlanningFor = (c: ConnectorInstallation) => c.provider !== "codecommit" || list.some((x) => x.category === "planning" && x.provider === "jira");

  return (
    <AppLayout org={org} active="connectors" breadcrumb={crumbs(org, undefined, { label: "連携と同期" })}>
      <PageHeader
        title="連携と同期"
        description="計画・カレンダー・コードホスティング・CI・通知の正本と接続し、経営向けの表示に使うデータを同期します。初期は正本からの読み取り（一方向）です。"
        actions={
          <>
            <Button icon="layers" to={paths.capabilities(org)}>能力の比較</Button>
            <Button variant="primary" icon="plus" to={paths.connectorNew(org)}>連携を追加</Button>
          </>
        }
      />
      {state === "loading" ? (
        <Skeleton variant="card" rows={4} />
      ) : state === "error" ? (
        <ErrorState />
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="plug"
            title="まだ連携がありません"
            description="経営ダッシュボードの計画・予測は、課題・計画管理と共有カレンダーから同期します。まず計画システムを接続してください。"
            action={<Button variant="primary" icon="plus" to={paths.connectorNew(org)}>連携を追加</Button>}
          />
        </div>
      ) : (
        <div className="stack">
          {broken.length > 0 ? (
            <Banner tone="fail" title={`${broken.length} 件の連携が止まっています`} action={<Button size="sm" to={paths.connector(org, broken[0].id)}>詳細を見る</Button>}>
              {broken.map((b) => `${b.name}（${b.error ?? "エラー"}）`).join("、")}。止まっている間の値は最終同期時点のもので、経営ダッシュボードでは「古い情報」と表示します。
            </Banner>
          ) : null}
          {scms.some((c) => !hasPlanningFor(c)) ? (
            <Banner tone="warn" title="計画管理を持たないコードホスティングがあります">
              AWS CodeCommit には課題・計画管理の機能がありません。対象案件の計画情報は、別の計画システム（GitHub Projects、Jira、Azure Boards 等）を接続しないと欠けます。
            </Banner>
          ) : null}

          <div className="grid auto-fit">
            <StatCard label="接続中" icon="plug" value={list.length} unit="件" />
            <StatCard label="止まっている連携" icon="alertCircle" value={broken.length} unit="件" tone={broken.length ? "danger" : undefined} />
            <StatCard label="遅延している連携" icon="clock" value={delayed.length} unit="件" tone={delayed.length ? "warn" : undefined} />
            <StatCard label="受信イベントの再処理待ち" icon="refresh" value={1} unit="件" tone="warn" to={paths.deliveries(org)} />
          </div>

          <div className="row" style={{ ["--gap" as string]: "8px" }}>
            <Button size="sm" variant="ghost" icon="link" to={paths.mapping(org)}>外部データの対応付け</Button>
            <Button size="sm" variant="ghost" icon="layers" to={paths.sources(org)}>正本と同期ルール</Button>
            <Button size="sm" variant="ghost" icon="history" to={paths.deliveries(org)}>受信イベントと再同期</Button>
            <Button size="sm" variant="ghost" icon="search" to={paths.importDiag(org)}>初期インポートと診断</Button>
          </div>

          {ORDER.filter((cat) => list.some((c) => c.category === cat) || cat === "planning" || cat === "calendar").map((cat) => {
            const items = list.filter((c) => c.category === cat);
            return (
              <Section key={cat} title={CONNECTOR_CATEGORY[cat].label} sub={CONNECTOR_CATEGORY[cat].description} flush>
                {cat === "oncall" ? (
                  <div className="kn-note small muted">当番表とエスカレーションの正本はオンコール管理サービスです。プロジェクト計画・経営会議の同期とは別に扱い、互いの更新・削除は波及しません。</div>
                ) : null}
                {items.length === 0 ? (
                  <div className="kn-note small muted">未接続です。<Button size="sm" variant="ghost" icon="plus" to={paths.connectorNew(org)}>接続する</Button></div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr><th>接続</th><th>対象</th><th>状態</th><th>最終同期</th><th className="num">対象数</th><th>方式</th><th aria-label="操作" /></tr>
                      </thead>
                      <tbody>
                        {items.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                                <ProviderBadge provider={c.provider} showStatus />
                                <span className="tiny muted">{c.name}</span>
                              </div>
                            </td>
                            <td className="small">
                              {c.scope}
                              {c.hosting ? <div className="tiny muted">{c.hosting}</div> : null}
                            </td>
                            <td>
                              <SyncBadge status={c.status} />
                              {c.error ? <div className="tiny text-fail kn-err">{c.error}</div> : null}
                            </td>
                            <td><Freshness at={c.last_success_at} status={c.status} /></td>
                            <td className="num">{c.object_count?.toLocaleString("ja-JP") ?? "—"}</td>
                            <td className="small">{MODE_LABEL[c.mode]}</td>
                            <td>
                              <div className="row nowrap end" style={{ ["--gap" as string]: "4px" }}>
                                {c.status === "authExpired" ? <Button size="sm" variant="primary" icon="key" onClick={() => toast({ kind: "info", message: `${PROVIDERS[c.provider].label} の再認可画面を開きます（モック）` })}>再認可</Button> : null}
                                {c.status === "failing" || c.status === "delayed" ? <Button size="sm" icon="refresh" onClick={() => toast({ kind: "success", message: "再試行を予約しました" })}>再試行</Button> : null}
                                <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.connector(org, c.id)}>詳細</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {cat === "scm" && items.length > 0 ? (
                  <div className="kn-note tiny muted">
                    {items.map((c) => `${PROVIDERS[c.provider].label}: ${connectorDetails[c.id]?.writes.join("、") ?? "—"}`).join(" ／ ")}
                  </div>
                ) : null}
              </Section>
            );
          })}
          <p className="tiny muted">
            <Tag square>ベータ</Tag> のサービスは、主要な操作を検証済みで一部の能力に制限があります。能力の差は「能力の比較」で確認できます。
          </p>
        </div>
      )}
    </AppLayout>
  );
}
