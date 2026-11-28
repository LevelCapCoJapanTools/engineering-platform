// 画面ID: A-02 招待の受諾
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths, ORG } from "../../lib/paths";
import { Avatar, Banner, Button, CenterLayout, ConfirmDialog, Icon, KeyValueList, RoleBadge, UserChip } from "../../ui";
import { orgs, projectBySlug, userById } from "../../mocks/core";

export function Invite() {
  const state = useScreenState();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declined, setDeclined] = useState(false);
  const org = orgs[0];
  const inviter = userById("u-yamamoto");
  const customer = state === "customer";
  const project = projectBySlug("order-renewal");

  if (declined) {
    return (
      <CenterLayout>
        <div className="empty">
          <span className="empty-icon"><Icon name="x" /></span>
          <h3>招待を辞退しました</h3>
          <p>{inviter?.name} さんに辞退したことを通知しました。このページは閉じてかまいません。</p>
        </div>
      </CenterLayout>
    );
  }

  return (
    <CenterLayout>
      <div className="row" style={{ ["--gap" as string]: "12px" }}>
        <span className="org-switch" style={{ border: 0, padding: 0 }}><span className="org-logo" style={{ width: 40, height: 40, fontSize: 16, borderRadius: 10 }}>{org.initials}</span></span>
        <div className="stack" style={{ ["--gap" as string]: "2px" }}>
          <span className="small muted">組織への招待</span>
          <h1 style={{ fontSize: "var(--text-lg)", color: "var(--text-strong)" }}>{org.name}</h1>
        </div>
      </div>

      {state === "expired" ? (
        <Banner tone="warn" title="この招待は期限切れです">
          招待の有効期限（7日間）が過ぎました。招待者に再送を依頼してください。
          <div style={{ marginTop: 10 }}><Button size="sm" icon="mail">{inviter?.name} さんに再送を依頼</Button></div>
        </Banner>
      ) : null}
      {state === "alreadyMember" ? (
        <Banner tone="info" title="すでにこの組織に参加しています">
          <div style={{ marginTop: 8 }}><Button size="sm" variant="primary" to={paths.orgHome(ORG)} iconRight="arrowRight">組織のダッシュボードへ</Button></div>
        </Banner>
      ) : null}
      {state === "otherAccount" ? (
        <Banner tone="warn" title="別のアカウントでサインインしています">
          この招待は <span className="mono">okada@sample-soft.example</span> 宛てです。現在 <span className="mono">kimura@sample-soft.example</span> でサインインしています。
          <div style={{ marginTop: 10 }}><Button size="sm" to={paths.signin()} icon="logout">サインアウトして切り替える</Button></div>
        </Banner>
      ) : null}

      <div className="card tight stack" style={{ ["--gap" as string]: "12px", background: "var(--bg-subtle)" }}>
        <div className="row" style={{ ["--gap" as string]: "10px" }}>
          <Avatar user={inviter} size="lg" />
          <div className="small"><strong>{inviter?.name}</strong> さん（組織管理者）があなたを招待しました</div>
        </div>
        <KeyValueList
          items={[
            { label: "付与されるロール", value: customer ? <RoleBadge role="顧客" /> : <span className="row"><RoleBadge role="事業責任者" /></span> },
            ...(customer
              ? [
                  { label: "対象プロジェクト", value: project.name },
                  { label: "閲覧できる範囲", value: <span className="small">このプロジェクトの承認依頼、進捗の要約、リリースのみ</span> },
                ]
              : [{ label: "閲覧範囲", value: <span className="small">自社サービス事業・在庫管理ダッシュボード（機密区分 Internal まで）</span> }, { label: "判断権限", value: <span className="small">便益の確認、予算の追加 50 万円まで</span> }]),
            { label: "招待先", value: <span className="mono small">{customer ? "nakamura@kakuu-shoji.example" : "okada@sample-soft.example"}</span> },
            { label: "有効期限", value: state === "expired" ? <span className="text-fail">2026-11-20（期限切れ）</span> : "2026-12-04" },
          ]}
        />
      </div>

      {state === "expired" || state === "alreadyMember" ? null : (
        <div className="row">
          <Button variant="primary" size="lg" icon="check" to={state === "otherAccount" ? undefined : customer ? paths.portal("order-renewal") : paths.orgHome(ORG)} disabled={state === "otherAccount"} disabledReason="招待先のアカウントでサインインしてください">参加する</Button>
          <Button variant="ghost" size="lg" onClick={() => setDeclineOpen(true)}>辞退する</Button>
        </div>
      )}
      <p className="tiny muted">参加時に MFA の設定を求めます。参加すると、組織の管理者があなたの名前、メールアドレス、操作の記録を閲覧できます。{customer ? "顧客の方は、アカウントを作らずに期限付きの承認リンクで承認することもできます。" : ""}</p>
      <UserChip user={inviter} role="招待者" />

      <ConfirmDialog open={declineOpen} onClose={() => setDeclineOpen(false)} onConfirm={() => setDeclined(true)} title="招待を辞退しますか？" message="辞退すると、この招待リンクは使えなくなります。参加するには再度招待を受ける必要があります。" confirmLabel="辞退する" />
    </CenterLayout>
  );
}
