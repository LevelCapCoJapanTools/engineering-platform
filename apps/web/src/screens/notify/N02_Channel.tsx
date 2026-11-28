// 画面ID: N-02 チャネルの追加・詳細
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { PROVIDERS } from "../../lib/vocab";
import type { ProviderKey } from "../../lib/vocab";
import {
  AppLayout, Banner, Button, Combobox, ConfirmDialog, crumbs, DataTable, ErrorState, Icon, KeyValueList, OptionCard, PageHeader, ProviderBadge, Section, Select,
  Skeleton, SyncBadge, Tag, TextField, Timeline, Timestamp, Toggle, useToast,
} from "../../ui";
import { users } from "../../mocks/core";
import { channelById, channels, deliveries } from "../../mocks/notify";
import type { NotifyChannel } from "../../mocks/notify";
import { CapabilityTags, DeliveryBadge, NotifyTabs, SeverityBadge, useOrg, userName } from "./parts";

const STATE_FIXTURE: Record<string, string> = { 送信専用: "ch-discord", 配信失敗: "ch-teams", 自己ホスト: "ch-mm", Chatwork: "ch-chatwork" };

export function N02Channel() {
  const state = useScreenState();
  const org = useOrg();
  const id = useRoute().params.id ?? "ch-slack-exec";
  if (state === "追加" || (id === "new" && !STATE_FIXTURE[state])) return <AddChannel org={org} />;
  const ch = channelById(STATE_FIXTURE[state] ?? id) ?? channels[0];
  return <ChannelDetail org={org} ch={ch} state={state} />;
}

const ADDABLE: ProviderKey[] = ["slack", "teams", "discord", "mattermost", "googleChat", "chatwork", "webhook", "email"];
const METHODS: Record<string, { value: string; label: string; interactive: boolean }[]> = {
  slack: [{ value: "app", label: "Slack App（ボタン操作・配信確認あり）", interactive: true }, { value: "webhook", label: "Incoming Webhook（送信のみ）", interactive: false }],
  teams: [{ value: "bot", label: "通知 Bot（ボタン操作あり）", interactive: true }, { value: "workflow", label: "Workflows（送信のみ。共同所有者が必要）", interactive: false }],
  discord: [{ value: "webhook", label: "Webhook（送信のみ）", interactive: false }, { value: "bot", label: "Bot＋Interaction（署名検証つき）", interactive: true }],
  mattermost: [{ value: "bot", label: "Bot アカウント＋Interactive Messages", interactive: true }, { value: "webhook", label: "Incoming Webhook（送信のみ）", interactive: false }],
  googleChat: [{ value: "app", label: "Chat アプリ（カードのボタン）", interactive: true }, { value: "webhook", label: "Incoming Webhook（送信のみ）", interactive: false }],
  chatwork: [{ value: "token", label: "API トークン（送信）", interactive: false }],
  webhook: [{ value: "https", label: "HTTPS POST（HMAC 署名付き）", interactive: false }],
  email: [{ value: "mail", label: "メール配信", interactive: false }],
};

function AddChannel({ org }: { org: string }) {
  const toast = useToast();
  const [provider, setProvider] = useState<ProviderKey>("slack");
  const [method, setMethod] = useState("app");
  const [dest, setDest] = useState("");
  const [owners, setOwners] = useState<string[]>(["u-yamamoto"]);
  const [verified, setVerified] = useState(false);
  const [sent, setSent] = useState(false);
  const methods = METHODS[provider];
  const m = methods.find((x) => x.value === method) ?? methods[0];
  const needsCoOwner = provider === "teams" && m.value === "workflow" && owners.length < 2;
  const people = users.filter((u) => u.account).map((u) => ({ value: u.id, label: u.name, hint: u.title ?? u.roles.join("・") }));

  return (
    <AppLayout org={org} active="notify" breadcrumb={crumbs(org, undefined, { label: "通知", to: paths.channels(org) }, { label: "チャネルを追加" })}>
      <PageHeader title="チャネルを追加" description="宛先を検証し、テスト通知が届くことを確認してから有効にします。資格情報は暗号化して保管し、画面には再表示しません。" />
      <div className="grid main-side">
        <div className="stack">
          <Section title="1. 種類">
            <div className="nt-grid-2">
              {ADDABLE.map((k) => (
                <OptionCard key={k} name="provider" value={k} checked={provider === k} onChange={(v) => { setProvider(v as ProviderKey); setMethod(METHODS[v][0].value); setVerified(false); setSent(false); }} title={PROVIDERS[k].label} description={PROVIDERS[k].note} />
              ))}
            </div>
          </Section>
          <Section title="2. 接続方式">
            <div className="stack">
              <Select label="方式" value={m.value} onChange={setMethod} options={methods.map((x) => ({ value: x.value, label: x.label }))} />
              {m.interactive ? (
                <Banner tone="info" title="双方向の操作を有効にします">
                  ボタンからの承認・受領は、送信元の署名検証、Nonce と時刻の確認、二重クリックの抑止、本サービス側のロール照合を通ったときだけ受け付けます。結果はチャネルに返信し、監査ログに残します。
                </Banner>
              ) : (
                <Banner tone="info" title="送信専用の方式です">この方式では通知に承認・受領のボタンを表示せず、詳細画面へのリンクだけを載せます。</Banner>
              )}
              {provider === "chatwork" ? (
                <Banner tone="warn" title="API トークンの扱いに注意してください">
                  Chatwork の API トークンは権限が広く、有効期限がありません。通知専用のアカウントで発行し、定期的に再発行してください。漏えいした場合はすぐに失効させます。レート制限を超えた通知は自動で再試行します。
                </Banner>
              ) : null}
              {provider === "teams" && m.value === "workflow" ? (
                <Banner tone="warn" title="共同所有者を 1 人以上設定してください">Workflow は作成した個人に結び付きます。所有者の退職・無効化で投稿が止まるため、共同所有者と無効化の監視を設定します。</Banner>
              ) : null}
            </div>
          </Section>
          <Section title="3. 宛先と資格情報">
            <div className="stack">
              {provider === "mattermost" ? (
                <div className="grid cols-2">
                  <TextField label="サーバーの URL" required placeholder="https://mattermost.example.com" help="TLS が有効な URL のみ。証明書の期限を監視します" />
                  <TextField label="チャンネル" required placeholder="~quality" />
                </div>
              ) : provider === "email" ? (
                <Combobox label="宛先" multiple options={people} value={["u-kimura", "u-mori"]} />
              ) : (
                <TextField label="宛先（チャンネル・ルーム・URL）" required value={dest} onChange={setDest} placeholder={provider === "webhook" ? "https://..." : provider === "chatwork" ? "ルーム ID" : "#channel"} />
              )}
              {provider === "webhook" || (provider === "discord" && m.value === "webhook") || (provider === "teams" && m.value === "workflow") ? (
                <TextField label="Webhook URL" required type="password" placeholder="貼り付けると暗号化して保管します" help="URL を知っている人は投稿できるため、トークンと同様に扱います。保存後はマスク表示になります" />
              ) : provider === "chatwork" ? (
                <TextField label="API トークン" required type="password" placeholder="貼り付けると暗号化して保管します" />
              ) : provider !== "email" ? (
                <Button icon="external">{PROVIDERS[provider].label} で認可する</Button>
              ) : null}
              <Combobox label="所有者・共同所有者" multiple options={people} value={owners} onChange={setOwners} help="接続の管理者です。資格情報のローテーションと失効の通知を受け取ります" error={needsCoOwner ? "共同所有者を 1 人以上追加してください" : undefined} />
            </div>
          </Section>
          <Section title="4. 宛先の検証とテスト通知">
            <div className="stack">
              <p className="small muted">テスト通知に記載された確認コードを入力すると、宛先を検証済みにします。</p>
              <div className="row">
                <Button icon="send" disabled={sent} disabledReason="送信済みです" onClick={() => { setSent(true); toast({ kind: "success", message: "テスト通知を送信しました" }); }}>テスト通知を送る</Button>
                {sent ? <Tag tone="info" icon="clock">確認コードの入力待ち</Tag> : null}
              </div>
              {sent ? (
                <div className="row" style={{ alignItems: "flex-end" }}>
                  <div style={{ maxWidth: 200 }}><TextField label="確認コード" placeholder="6 桁" /></div>
                  <Button onClick={() => setVerified(true)} icon="check">検証する</Button>
                  {verified ? <Tag tone="pass" icon="checkCircle">検証済み</Tag> : null}
                </div>
              ) : null}
            </div>
          </Section>
          <div className="row end">
            <Button variant="ghost" to={paths.channels(org)}>キャンセル</Button>
            <Button variant="primary" icon="check" disabled={!verified || needsCoOwner} disabledReason={!verified ? "宛先の検証が必要です" : "共同所有者を追加してください"} onClick={() => toast({ kind: "success", message: "チャネルを追加しました。通知ルールで宛先に選べます" })}>
              チャネルを有効にする
            </Button>
          </div>
        </div>
        <div className="stack">
          <Section title="この方式でできること">
            <div className="stack">
              <ProviderBadge provider={provider} showStatus />
              <CapabilityTags c={{ send: true, interactive: m.interactive, deliveryReceipt: provider !== "discord" && provider !== "teams" && provider !== "chatwork", userIdentity: m.interactive, threads: m.interactive }} />
              <p className="tiny muted">チャネルへの投稿だけでは、相手が確認したとはみなしません。受領の確認が必要な連絡はオンコール管理を使います。</p>
            </div>
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}

function ChannelDetail({ org, ch, state }: { org: string; ch: NotifyChannel; state: string }) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(true);
  const [revoke, setRevoke] = useState(false);
  const recent = deliveries.filter((d) => d.channel_id === ch.id);
  const failing = ch.status === "failing" || state === "配信失敗";
  return (
    <AppLayout org={org} active="notify" breadcrumb={crumbs(org, undefined, { label: "通知", to: paths.channels(org) }, { label: ch.name })}>
      <PageHeader
        title={ch.name}
        status={<SyncBadge status={ch.status} size="md" />}
        description={`${ch.destination} · ${ch.method}`}
        actions={
          <>
            <Button icon="send" onClick={() => toast(failing ? { kind: "error", message: "テスト通知に失敗しました（403）" } : { kind: "success", message: "テスト通知を送信しました" })}>テスト通知</Button>
            <Button icon="refresh" onClick={() => toast({ kind: "info", message: "再認可の画面を開きます（モック）" })}>再認可</Button>
          </>
        }
      />
      <NotifyTabs org={org} active="channels" />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <div className="grid main-side">
          <div className="stack">
            {failing ? (
              <Banner tone="fail" title="このチャネルに配信できません" action={<Button size="sm" variant="primary" icon="users">共同所有者を設定</Button>}>
                {ch.last_error ?? "直近の配信に失敗しました。"} 届かなかった通知は再処理待ちです。同じ通知のほかのチャネルへの配信と、ゲートの判定・証跡の保存は完了しています。
              </Banner>
            ) : null}
            <Section title="接続">
              <KeyValueList
                cols={2}
                items={[
                  { label: "種類", value: <ProviderBadge provider={ch.provider} showStatus /> },
                  { label: "方式", value: ch.method },
                  { label: "宛先", value: <span>{ch.destination}{ch.verified ? <Tag tone="pass" square icon="check">検証済み</Tag> : <Tag tone="warn" square>検証待ち</Tag>}</span> },
                  { label: "能力", value: <CapabilityTags c={ch.capabilities} /> },
                  { label: "適用範囲", value: ch.scope === "project" ? `案件（${ch.project}）` : "組織" },
                  { label: "最終配信", value: ch.last_delivery_at ? <Timestamp at={ch.last_delivery_at} mode="absolute" /> : "—" },
                ]}
              />
              {ch.self_hosted ? (
                <div className="card tight stack" style={{ ["--gap" as string]: "4px", marginTop: 12 }}>
                  <strong className="small">Self-Hosted サーバー</strong>
                  <span className="small nt-mono">{ch.self_hosted.url}</span>
                  <span className="tiny muted">版 {ch.self_hosted.version} · {ch.self_hosted.tls}</span>
                </div>
              ) : null}
            </Section>
            {ch.capabilities.interactive && ch.security ? (
              <Section title="双方向操作の安全対策" sub="ボタンやコマンドからの操作は、次の確認をすべて通ったときだけ受け付けます">
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  {[
                    ["送信元の署名検証", ch.security.signature],
                    ["Nonce と時刻の確認（リプレイの拒否）", ch.security.nonce],
                    ["二重クリック・二重送信の抑止", ch.security.doubleClick],
                    ["本人の外部IDと本サービスのロール・判断権限の照合", ch.security.roleCheck],
                  ].map(([label, ok]) => (
                    <div key={String(label)} className="row"><Icon name={ok ? "checkCircle" : "xCircle"} className={ok ? "text-pass" : "text-fail"} /><span className="small">{label}</span></div>
                  ))}
                  <span className="tiny muted">操作の結果はチャネルに返信し、監査ログに記録します。</span>
                </div>
              </Section>
            ) : (
              <Section title="操作">
                <p className="small muted">送信専用のチャネルです。通知には承認・受領のボタンを表示せず、詳細画面へのリンクだけを載せます。</p>
              </Section>
            )}
            <Section title="最近の配信" sub="本文は保存しません。件名・宛先・結果のみ" flush>
              <DataTable
                bare
                compact
                rows={recent}
                rowKey={(d) => d.id}
                columns={[
                  { key: "at", header: "日時", render: (d) => <Timestamp at={d.created_at} mode="absolute" />, sortValue: (d) => d.created_at },
                  { key: "sev", header: "重大度", render: (d) => <SeverityBadge value={d.severity} /> },
                  { key: "subject", header: "件名", render: (d) => <span className="small">{d.subject}</span> },
                  { key: "status", header: "結果", render: (d) => <DeliveryBadge value={d.status} /> },
                ]}
                empty={<div className="empty"><h3>配信はまだありません</h3></div>}
              />
              <div style={{ padding: "8px 16px" }}><Button size="sm" variant="ghost" to={paths.notifyLog(org)} iconRight="arrowRight">配信ログを開く</Button></div>
            </Section>
            <Section title="変更の記録">
              <Timeline
                compact
                items={[
                  { id: "h1", actor: { kind: "human", name: userName(ch.owner_id) }, action: "チャネルを接続", at: "2026-09-01T10:00:00+09:00" },
                  ...(ch.credential.rotated_at ? [{ id: "h2", actor: { kind: "human" as const, name: userName(ch.owner_id) }, action: "資格情報をローテーション", at: ch.credential.rotated_at }] : []),
                  ...(failing ? [{ id: "h3", actor: { kind: "system" as const, name: "通知" }, action: "所有者アカウントの無効化を検知し、管理者へ代替通知", at: "2026-11-25T17:05:00+09:00" }] : []),
                ]}
              />
            </Section>
          </div>
          <div className="stack">
            <Section title="有効・無効">
              <Toggle label="このチャネルに配信する" description="無効にすると、このチャネル宛ての通知は送らず、配信ログに「抑止」と記録します" checked={enabled} onChange={setEnabled} />
            </Section>
            <Section title="所有者">
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <span className="small">所有者: <strong>{userName(ch.owner_id)}</strong></span>
                <span className="small">共同所有者: {ch.co_owner_ids.length ? ch.co_owner_ids.map(userName).join("、") : <Tag tone="warn" square>未設定</Tag>}</span>
                {ch.provider === "teams" ? <span className="tiny muted">Teams の Workflow は個人に結び付くため、所有者の無効化を監視しています。</span> : null}
                <Button size="sm" icon="users">所有者を変更</Button>
              </div>
            </Section>
            <Section title="資格情報">
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <span className="tiny muted">{ch.credential.kind}</span>
                <span className="nt-mono">{ch.credential.masked}</span>
                <span className="tiny muted">
                  {ch.credential.rotated_at ? <>最終ローテーション <Timestamp at={ch.credential.rotated_at} mode="date" /></> : "ローテーションの記録なし"}
                  {ch.credential.expires_at ? ` · 期限 ${ch.credential.expires_at}` : ""}
                </span>
                {ch.credential.note ? <Banner tone="warn">{ch.credential.note}</Banner> : null}
                <div className="row">
                  <Button size="sm" icon="refresh" onClick={() => toast({ kind: "success", message: "新しい資格情報を登録してください。登録後に古いものを失効します" })}>ローテーション</Button>
                  <Button size="sm" variant="danger" icon="xCircle" onClick={() => setRevoke(true)}>すぐに失効</Button>
                </div>
              </div>
            </Section>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={revoke}
        onClose={() => setRevoke(false)}
        onConfirm={() => { setRevoke(false); toast({ kind: "success", message: "資格情報を失効しました。このチャネルへの配信は停止しています" }); }}
        title="資格情報を失効させますか？"
        message="漏えいが疑われる場合に使います。失効後は再認可するまで、このチャネルに通知を送れません。"
        confirmLabel="失効する"
        danger
      />
    </AppLayout>
  );
}
