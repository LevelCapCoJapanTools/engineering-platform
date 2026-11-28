// 画面ID: N-01 通知チャネル
import { useState } from "react";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { PROVIDERS } from "../../lib/vocab";
import { AppLayout, Banner, Button, crumbs, EmptyState, ErrorState, PageHeader, ProviderBadge, Section, Skeleton, SyncBadge, Tag, Timestamp, useToast } from "../../ui";
import { channels } from "../../mocks/notify";
import { CapabilityTags, NotifyTabs, useOrg, userName } from "./parts";

export function N01Channels() {
  const state = useScreenState();
  const org = useOrg();
  const toast = useToast();
  const [testing, setTesting] = useState<string | null>(null);
  const list = state === "未接続" ? [] : channels;
  const broken = list.filter((c) => c.status === "failing" || c.status === "authExpired");
  const noCoOwner = list.filter((c) => c.co_owner_ids.length === 0 && c.provider === "teams");

  const test = (id: string) => {
    setTesting(id);
    window.setTimeout(() => {
      setTesting(null);
      const c = channels.find((x) => x.id === id);
      toast(c?.status === "failing" ? { kind: "error", message: `${c.name} へのテスト通知に失敗しました。詳細を確認してください` } : { kind: "success", message: "テスト通知を送信しました。届いたことを宛先で確認してください" });
    }, 900);
  };

  return (
    <AppLayout org={org} active="notify" breadcrumb={crumbs(org, undefined, { label: "通知" }, { label: "チャネル" })}>
      <PageHeader
        title="通知チャネル"
        description="通知を届けるチャット・メール・Webhook の接続です。チャネルへの投稿は通知の経路であり、相手が確認したことの証明にはなりません。応答の保証が必要な連絡はオンコール管理を使います。"
        actions={<Button variant="primary" icon="plus" to={paths.channel(org, "new")}>チャネルを追加</Button>}
      />
      <NotifyTabs org={org} active="channels" />
      {state === "読み込み中" ? (
        <Skeleton variant="card" rows={4} />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState icon="message" title="通知チャネルがありません" description="アプリ内通知とメールは既定で使えます。Slack や Teams などに届けるには、チャネルを追加してください。" action={<Button variant="primary" icon="plus" to={paths.channel(org, "new")}>チャネルを追加</Button>} />
        </div>
      ) : (
        <>
          {broken.length > 0 ? (
            <Banner tone="fail" title={`${broken.length} 件のチャネルに配信できません`}>
              {broken.map((c) => c.name).join("、")}。届かなかった通知は配信ログで再処理を待っています。ほかのチャネルへの配信とゲートの判定は止まりません。
            </Banner>
          ) : null}
          {noCoOwner.length > 0 ? (
            <Banner tone="warn" title="共同所有者が設定されていないチャネルがあります">
              Teams の Workflow は作成した個人に結び付きます。その人が退職・無効化されると投稿できなくなるため、共同所有者を設定してください。
            </Banner>
          ) : null}
          <Section title="接続中のチャネル" sub={`${list.length} 件`} flush>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>チャネル</th><th>宛先</th><th>能力</th><th>状態</th><th>所有者</th><th>最終配信</th><th aria-label="操作" /></tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                          <Link className="strong" to={paths.channel(org, c.id)}>{c.name}</Link>
                          <span className="row" style={{ ["--gap" as string]: "6px" }}><ProviderBadge provider={c.provider} size="sm" showStatus />{c.scope === "project" ? <Tag square>案件</Tag> : <Tag square>組織</Tag>}</span>
                        </div>
                      </td>
                      <td className="small">{c.destination}<div className="tiny muted">{c.method}</div></td>
                      <td><CapabilityTags c={c.capabilities} /></td>
                      <td>
                        <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                          <SyncBadge status={c.status} />
                          {!c.verified ? <span className="tiny muted">宛先の検証待ち</span> : null}
                        </div>
                      </td>
                      <td className="small">
                        {userName(c.owner_id)}
                        <div className="tiny muted">{c.co_owner_ids.length ? `共同所有者 ${c.co_owner_ids.map(userName).join("、")}` : "共同所有者なし"}</div>
                      </td>
                      <td className="small">{c.last_delivery_at ? <Timestamp at={c.last_delivery_at} /> : <span className="muted">—</span>}</td>
                      <td>
                        <div className="row nowrap" style={{ ["--gap" as string]: "6px" }}>
                          <Button size="sm" icon="send" loading={testing === c.id} onClick={() => test(c.id)}>テスト通知</Button>
                          <Button size="sm" variant="ghost" to={paths.channel(org, c.id)}>詳細</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Section title="チャネルの種類と能力" sub="送信専用の方式では、通知に承認・受領のボタンを表示しません。双方向の操作には認証済みのアプリと送信元の検証が必要です">
            <div className="nt-grid-2">
              {(["slack", "teams", "discord", "mattermost", "googleChat", "chatwork", "webhook", "email"] as const).map((k) => (
                <div key={k} className="card tight stack" style={{ ["--gap" as string]: "6px" }}>
                  <ProviderBadge provider={k} showStatus />
                  <span className="small muted">{CHANNEL_NOTES[k]}</span>
                  {PROVIDERS[k].note ? <span className="tiny muted">{PROVIDERS[k].note}</span> : null}
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </AppLayout>
  );
}

const CHANNEL_NOTES: Record<string, string> = {
  slack: "Slack App で接続すると、ボタンでの承認・受領ができます。Incoming Webhook は送信専用です。",
  teams: "Workflows（送信）または通知 Bot で接続します。旧来の Office 365 コネクタ型 Webhook は使えません。",
  discord: "Webhook は特定チャンネルへの送信専用です。URL はトークンと同様に保護します。",
  mattermost: "Self-Hosted の URL と TLS、管理者による Integration の有効化が必要です。ボタン操作に対応します。",
  googleChat: "Chat アプリで接続するとカードのボタンで操作できます。Incoming Webhook は送信専用です。",
  chatwork: "API トークンで送信します。トークンは権限が広く期限がないため、定期的な再発行が必要です。",
  webhook: "任意の HTTPS 宛先へ署名付きで送信します。配信確認は応答コードで判定します。",
  email: "経営層の登録アドレスへ送信します。返信による操作はできません。",
};
