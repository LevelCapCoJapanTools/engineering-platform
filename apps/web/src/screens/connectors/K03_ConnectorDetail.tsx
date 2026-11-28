// 画面ID: K-03 連携の詳細
import "./connectors.css";
import { useState } from "react";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { CONNECTOR_CATEGORY, PROVIDERS, SYNC_STATUS } from "../../lib/vocab";
import type { SyncStatus } from "../../lib/vocab";
import type { ConnectorInstallation } from "../../lib/types";
import { formatDateTime } from "../../lib/format";
import { connectors } from "../../mocks/portfolio";
import { userById } from "../../mocks/core";
import { capabilityGroups, connectorAudit, connectorDetails, inboundEvents, reconciliations } from "../../mocks/connectors";
import {
  AppLayout,
  Banner,
  Button,
  CapabilityCell,
  ConfirmDialog,
  crumbs,
  ErrorState,
  Freshness,
  Icon,
  KeyValueList,
  PageHeader,
  ProviderBadge,
  Section,
  Skeleton,
  StatCard,
  SyncBadge,
  Tabs,
  Tag,
  Timestamp,
  useToast,
} from "../../ui";

/** 状態の切替で、表示する接続と状態を上書きする */
function applyState(base: ConnectorInstallation, state: string): ConnectorInstallation {
  const map: Partial<Record<string, Partial<ConnectorInstallation>>> = {
    healthy: { status: "healthy", error: undefined, lag_minutes: 2, last_success_at: "2026-11-27T10:28:00+09:00", last_attempt_at: "2026-11-27T10:28:00+09:00" },
    delayed: { status: "delayed", lag_minutes: 95, last_success_at: "2026-11-27T08:55:00+09:00", last_attempt_at: "2026-11-27T10:25:00+09:00", error: "API のレート制限（429）。Retry-After に従って再試行中" },
    authExpired: { status: "authExpired", last_success_at: "2026-11-24T18:00:00+09:00", last_attempt_at: "2026-11-27T10:00:00+09:00", lag_minutes: 3990, error: "アクセストークンが失効しました。接続者による再認可が必要です" },
    failing: { status: "failing", last_success_at: "2026-11-25T17:00:00+09:00", last_attempt_at: "2026-11-27T10:05:00+09:00", error: "接続先が HTTP 503 を返しています（3 回連続）。指数バックオフで再試行中" },
    initialSync: { status: "initialSync", last_success_at: undefined, last_attempt_at: "2026-11-27T10:29:00+09:00", lag_minutes: undefined, error: undefined },
  };
  return { ...base, ...(map[state] ?? {}) };
}

export function K03ConnectorDetail({ id }: { id: string }) {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [tab, setTab] = useState("health");
  const [confirm, setConfirm] = useState<"disconnect" | "fullSync" | "revoke" | null>(null);
  const base = connectors.find((c) => c.id === id) ?? connectors[0];
  const c = applyState(base, state);
  const d = connectorDetails[c.id] ?? connectorDetails["con-gh"];
  const status: SyncStatus = c.status;
  const capGroup = capabilityGroups.find((g) => g.category === c.category);
  const capRow = capGroup?.rows.find((r) => r.provider === c.provider);
  const events = inboundEvents.filter((e) => e.provider === c.provider);
  const recon = reconciliations.filter((r) => r.connector === c.id);
  const audit = connectorAudit.filter((a) => a.connector === c.id);
  const cursorInvalid = state === "authExpired" ? false : d.cursor.state === "invalidated";

  return (
    <AppLayout org={org} active="connectors" breadcrumb={crumbs(org, undefined, { label: "連携と同期", to: paths.connectors(org) }, { label: c.name })}>
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          <PageHeader
            title={c.name}
            status={<SyncBadge status={status} size="md" />}
            description={<span className="row" style={{ ["--gap" as string]: "8px" }}><ProviderBadge provider={c.provider} showStatus /><span className="muted">{CONNECTOR_CATEGORY[c.category].label}</span>{c.hosting ? <span className="muted">· {c.hosting}</span> : null}</span>}
            actions={
              <>
                <Button icon="refresh" onClick={() => toast({ kind: "success", message: "差分同期を開始しました" })} disabled={status === "authExpired" || status === "initialSync"} disabledReason={status === "authExpired" ? "再認可してから実行してください" : "初回同期の完了を待ってください"}>今すぐ同期</Button>
                <Button icon="database" onClick={() => setConfirm("fullSync")} disabled={status === "initialSync"} disabledReason="初回同期中です">全件を再同期</Button>
                {status === "authExpired" ? <Button variant="primary" icon="key" onClick={() => toast({ kind: "info", message: "接続先の認可画面を開きます（モック）" })}>再認可</Button> : null}
              </>
            }
          />

          {status === "authExpired" ? (
            <Banner tone="fail" title="再認可が必要です">
              {c.error}。{formatDateTime(c.last_success_at ?? "")} 以降の変更は取得できていません。再認可すると、欠落した期間を自動で再取得します。接続者: {userById(c.installed_by)?.name ?? "—"}
            </Banner>
          ) : status === "failing" ? (
            <Banner tone="fail" title="同期に失敗しています">{c.error}。最終成功時点の値を「古い情報」として表示しています。</Banner>
          ) : status === "delayed" ? (
            <Banner tone="warn" title="同期が遅れています">{c.error}。経営ダッシュボードでは最終同期時刻を併記しています。</Banner>
          ) : status === "initialSync" ? (
            <Banner tone="info" title="初回同期中です">全件を取得しています（412 / 530 件）。完了するまで、経営ダッシュボードではこの連携の値を「判定不可」と表示します。</Banner>
          ) : null}

          <div className="grid auto-fit">
            <StatCard label="最終成功" icon="checkCircle" value={c.last_success_at ? <Timestamp at={c.last_success_at} /> : "—"} />
            <StatCard label="最終試行" icon="clock" value={c.last_attempt_at ? <Timestamp at={c.last_attempt_at} /> : "—"} />
            <StatCard label="同期の遅れ" icon="hourglass" value={c.lag_minutes === undefined ? "—" : c.lag_minutes >= 60 ? `${Math.floor(c.lag_minutes / 60)}時間${c.lag_minutes % 60}分` : `${c.lag_minutes}分`} tone={c.lag_minutes && c.lag_minutes > 60 ? "warn" : undefined} />
            <StatCard label="対象数" icon="database" value={c.object_count?.toLocaleString("ja-JP") ?? "—"} unit="件" />
          </div>

          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "health", label: "同期の状態", icon: "gauge" },
              { value: "scope", label: "権限と取得データ", icon: "key" },
              { value: "events", label: "受信イベント", count: events.length, icon: "history" },
              { value: "audit", label: "変更の記録", count: audit.length, icon: "fileText" },
            ]}
          />

          {tab === "health" ? (
            <div className="stack">
              <Section title="同期の方式と位置">
                <KeyValueList
                  cols={2}
                  items={[
                    { label: "方式", value: d.cursor.kind },
                    { label: "同期の周期", value: d.interval },
                    { label: "差分の位置（カーソル）", value: d.cursor.state === "none" ? "—（送信のみ）" : cursorInvalid ? <Tag tone="fail">失効（全件の再同期が必要）</Tag> : <span className="row" style={{ ["--gap" as string]: "6px" }}><Tag tone="pass" icon="check">有効</Tag>{d.cursor.updated_at ? <span className="tiny muted">{formatDateTime(d.cursor.updated_at)} 更新</span> : null}</span> },
                    { label: "次回の実行", value: d.next_run_at ? formatDateTime(d.next_run_at) : "—" },
                    { label: "状態", value: <span className="row" style={{ ["--gap" as string]: "6px" }}><SyncBadge status={status} /><Freshness at={c.last_success_at} status={status} /></span> },
                    { label: "エラーの詳細", value: c.error ?? "なし" },
                  ]}
                />
                {d.cursor.note ? <p className="tiny muted" style={{ marginTop: 8 }}>{d.cursor.note}</p> : null}
              </Section>

              <div className="grid cols-2">
                <Section title="Webhook の検証">
                  {d.webhook ? (
                    <KeyValueList
                      items={[
                        { label: "検証方式", value: d.webhook.method },
                        { label: "検証結果", value: d.webhook.verified ? <Tag tone="pass" icon="shieldCheck">署名を検証中</Tag> : <Tag tone="fail" icon="shieldX">未検証</Tag> },
                        { label: "最終受信", value: d.webhook.last_received_at ? <Timestamp at={d.webhook.last_received_at} /> : "—" },
                        { label: "24時間の検証失敗", value: `${d.webhook.failures_24h} 件` },
                      ]}
                    />
                  ) : (
                    <p className="small muted">この連携は Webhook を使わず、定期取得だけで同期します。</p>
                  )}
                </Section>
                <Section title="レート制限">
                  {d.rate_limit ? (
                    <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                      <div className="kn-bar"><span style={{ width: `${Math.round((d.rate_limit.remaining / d.rate_limit.limit) * 100)}%` }} /></div>
                      <span className="small">残り {d.rate_limit.remaining.toLocaleString("ja-JP")} / {d.rate_limit.limit.toLocaleString("ja-JP")} 回（{formatDateTime(d.rate_limit.reset_at)} に回復）</span>
                      {d.rate_limit.retry_after_sec ? <Banner tone="warn">429 を受け取りました。Retry-After（{d.rate_limit.retry_after_sec} 秒）に従って待機しています。同じ操作を重複して送ることはありません。</Banner> : null}
                    </div>
                  ) : (
                    <p className="small muted">この連携ではレート制限の情報を取得できません。失敗時は指数バックオフで再試行します。</p>
                  )}
                </Section>
              </div>

              <Section title="欠落期間の再取得（リコンシリエーション）" sub="Webhook の欠落、権限切れ、停止期間の後に、API で差分を取り直します" flush>
                {recon.length === 0 ? (
                  <p className="kn-note small muted">記録はありません。</p>
                ) : (
                  <div className="table-wrap">
                    <table className="table compact">
                      <thead><tr><th>期間</th><th>状態</th><th className="num">補完した件数</th><th>メモ</th></tr></thead>
                      <tbody>
                        {recon.map((r) => (
                          <tr key={r.id}>
                            <td className="small">{formatDateTime(r.from)} 〜 {r.to.startsWith("（") ? r.to : formatDateTime(r.to)}</td>
                            <td>{r.status === "done" ? <Tag tone="pass">完了</Tag> : r.status === "running" ? <Tag tone="info">実行中</Tag> : <Tag tone="warn">待機中</Tag>}</td>
                            <td className="num">{r.found}</td>
                            <td className="small">{r.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              {capGroup && capRow ? (
                <Section title="このサービスで使える能力" actions={<Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.capabilities(org)}>すべての比較</Button>}>
                  <div className="row" style={{ ["--gap" as string]: "16px" }}>
                    {capGroup.columns.map((col) => (
                      <span key={col.key} className="row nowrap" style={{ ["--gap" as string]: "6px" }}>
                        <CapabilityCell level={capRow.values[col.key]} note={capRow.notes?.[col.key]} />
                        <span className="small">{col.label}</span>
                      </span>
                    ))}
                  </div>
                  {capRow.method ? <p className="tiny muted" style={{ marginTop: 8 }}>{capRow.method}</p> : null}
                </Section>
              ) : null}
            </div>
          ) : null}

          {tab === "scope" ? (
            <div className="stack">
              <div className="grid cols-2">
                <Section title="取得するデータ">
                  <ul className="kn-list">{d.reads.map((r) => <li key={r}><Icon name="eye" size={13} />{r}</li>)}</ul>
                </Section>
                <Section title="書き込みの用途">
                  <ul className="kn-list">{d.writes.map((r) => <li key={r}><Icon name="edit" size={13} />{r}</li>)}</ul>
                </Section>
              </div>
              <Section
                title="資格情報"
                actions={
                  <>
                    <Button size="sm" icon="refresh" onClick={() => toast({ kind: "success", message: "資格情報をローテーションしました。旧資格情報は失効しました" })}>ローテーション</Button>
                    <Button size="sm" icon="xCircle" onClick={() => setConfirm("revoke")}>失効させる</Button>
                  </>
                }
              >
                <KeyValueList
                  items={[
                    { label: "種類", value: d.credential.kind },
                    { label: "保管", value: d.credential.stored },
                    { label: "最終ローテーション", value: d.credential.rotated_at ? formatDateTime(d.credential.rotated_at) : "—" },
                    { label: "有効期限", value: d.credential.expires_at ?? "—" },
                    { label: "権限", value: <div className="row" style={{ ["--gap" as string]: "6px" }}>{d.credential.scopes.map((s) => <Tag key={s} square>{s}</Tag>)}</div> },
                    { label: "接続者", value: userById(c.installed_by)?.name ?? "—" },
                  ]}
                />
                <div className="row" style={{ marginTop: 12, ["--gap" as string]: "8px" }}>
                  <Button size="sm" icon="minus" onClick={() => toast({ kind: "info", message: "接続先で権限を縮小する画面を開きます（モック）" })}>権限を縮小</Button>
                  <span className="tiny muted">権限を縮小すると、使えなくなる能力を事前に表示します。</span>
                </div>
              </Section>
              <Section title="接続の解除">
                <div className="row between">
                  <span className="small">接続を解除すると同期は止まります。取得済みデータの複製は、保持期間の設定に従って削除します。証跡（Evidence Manifest と監査ログ）は削除しません。</span>
                  <Button variant="danger" icon="trash" onClick={() => setConfirm("disconnect")}>接続を解除</Button>
                </div>
              </Section>
            </div>
          ) : null}

          {tab === "events" ? (
            <Section title="直近の受信イベント" actions={<Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.deliveries(org)}>すべて見る</Button>} flush>
              {events.length === 0 ? (
                <p className="kn-note small muted">この連携の受信イベントはありません。</p>
              ) : (
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>受信</th><th>種類</th><th>対象</th><th>署名</th><th>結果</th></tr></thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id}>
                          <td className="small"><Timestamp at={e.received_at === "—" ? e.occurred_at : e.received_at} /></td>
                          <td className="mono small">{e.kind}</td>
                          <td className="small">{e.resource}</td>
                          <td>{e.signature === "valid" ? <Tag tone="pass" icon="check">一致</Tag> : e.signature === "invalid" ? <Tag tone="fail" icon="x">不一致</Tag> : <Tag>—</Tag>}</td>
                          <td className="small">{e.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          ) : null}

          {tab === "audit" ? (
            <Section title="接続の変更の記録" sub="接続、切断、権限の変更、資格情報の更新、再同期、手動での修正を記録します" flush>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>日時</th><th>実行者</th><th>操作</th><th>内容</th></tr></thead>
                  <tbody>
                    {(audit.length ? audit : connectorAudit.slice(0, 2)).map((a) => (
                      <tr key={a.id}>
                        <td className="small">{formatDateTime(a.at)}</td>
                        <td className="small">{a.actor === "system" ? <Tag square>システム</Tag> : userById(a.actor)?.name}</td>
                        <td className="small strong">{a.action}</td>
                        <td className="small">{a.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : null}

          <ConfirmDialog
            open={confirm === "fullSync"}
            onClose={() => setConfirm(null)}
            onConfirm={() => { setConfirm(null); toast({ kind: "success", message: "全件の再同期を予約しました。完了まで既存の値を表示し続けます" }); }}
            title="全件を再同期しますか？"
            message={`${PROVIDERS[c.provider].label} から対象のデータをすべて取得し直します。API の呼出し回数を多く使います。外部の同じ項目は上書きではなく照合し、過去の計画履歴は消しません。`}
            confirmLabel="再同期する"
          />
          <ConfirmDialog
            open={confirm === "revoke"}
            onClose={() => setConfirm(null)}
            onConfirm={() => { setConfirm(null); toast({ kind: "success", message: "資格情報を失効させました。同期は停止しています" }); }}
            title="資格情報を失効させますか？"
            message="漏えいが疑われる場合に使います。失効後は再認可するまで同期が止まります。"
            confirmLabel="失効させる"
            danger
          />
          <ConfirmDialog
            open={confirm === "disconnect"}
            onClose={() => setConfirm(null)}
            onConfirm={() => { setConfirm(null); toast({ kind: "success", message: "接続を解除しました" }); }}
            title="接続を解除しますか？"
            message={`同期を止め、取得済みデータの複製は保持期間の設定に従って削除します。この連携を正本にしている項目（${SYNC_STATUS.disconnected.label}）は、経営ダッシュボードで「判定不可」になります。`}
            confirmLabel="解除する"
            danger
            requireText={c.name}
          />
        </>
      )}
    </AppLayout>
  );
}
