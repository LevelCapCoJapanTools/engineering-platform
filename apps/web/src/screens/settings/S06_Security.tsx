// 画面ID: S-06 セキュリティ
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { apiTokens, deprovisionTargets, securityAudit } from "../../mocks/settings";
import { userById } from "../../mocks/core";
import { ProviderBadge, Banner, Button, Combobox, ConfirmDialog, ErrorState, FileUpload, Icon, Modal, Section, Select, SettingsLayout, Skeleton, Tag, TextArea, TextField, Timestamp, Toggle, useToast } from "../../ui";

export function S06Security({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const ssoConfigured = state !== "SSO未設定";
  const [ssoOn, setSsoOn] = useState(ssoConfigured);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(state !== "MFA任意");

  return (
    <SettingsLayout org={org} active="security" title="セキュリティ" description="サインイン方法、MFA、セッション、利用者の無効化の反映、API トークンを管理します。変更はすべて監査ログに残ります。">
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <Section title="SSO（SAML）" sub="有効にすると、組織のメンバーは IdP 経由でのみサインインできます" actions={ssoConfigured ? <Tag tone="pass" icon="checkCircle">設定済み</Tag> : <Tag>未設定</Tag>}>
            <div className="stack">
              {!ssoConfigured ? <Banner tone="info">IdP のメタデータを登録すると SSO を有効にできます。有効にする前に、テストサインインで動作を確認してください。</Banner> : null}
              <div className="grid cols-2">
                <TextField label="IdP のエンティティ ID" defaultValue={ssoConfigured ? "https://idp.sample-soft.example/saml" : ""} placeholder="https://idp.example/saml" />
                <TextField label="サインインURL（SSO URL）" defaultValue={ssoConfigured ? "https://idp.sample-soft.example/sso" : ""} placeholder="https://idp.example/sso" />
              </div>
              <TextArea label="IdP の証明書（X.509）" rows={3} defaultValue={ssoConfigured ? "-----BEGIN CERTIFICATE-----\nMIIC…（省略）\n-----END CERTIFICATE-----" : ""} help="メタデータ XML をアップロードすると自動で入力されます" />
              <FileUpload label="メタデータ XML" accept=".xml" fileName="idp-metadata.xml" />
              <div className="row between">
                <Toggle label="SSO を有効にする" description="組織管理者1名はパスワードでのサインインを残せます（緊急用）" checked={ssoOn} disabled={!ssoConfigured} onChange={setSsoOn} />
                <div className="row">
                  <Button icon="play">テストサインイン</Button>
                  <Button variant="primary" onClick={() => toast({ kind: "success", message: "SSO の設定を保存しました" })}>保存</Button>
                </div>
              </div>
              <div className="small muted">Service Provider のメタデータ: <span className="mono">https://app.example/saml/sample-soft/metadata</span></div>
            </div>
          </Section>

          <Section title="多要素認証（MFA）" sub="経営判断や広い閲覧範囲を持つ利用者を守るため、MFA を必須にすることをおすすめします" actions={mfaRequired ? <Tag tone="pass" icon="shieldCheck">必須</Tag> : <Tag tone="warn" icon="alert">任意</Tag>}>
            <div className="stack">
              <Toggle label="すべての利用者に MFA を必須にする" description="SSO の利用者は IdP 側の MFA を要件にします。パスワードの利用者は認証アプリまたはセキュリティキーを登録します" checked={mfaRequired} onChange={(v) => { setMfaRequired(v); toast({ kind: "success", message: v ? "MFA を必須にしました" : "MFA を任意にしました" }); }} />
              {!mfaRequired ? <Banner tone="warn">MFA が任意になっています。1名の利用者が MFA を設定していません。</Banner> : null}
              <div className="grid cols-2">
                <Select label="使える要素" defaultValue="app-key" options={[{ value: "app-key", label: "認証アプリ・セキュリティキー" }, { value: "key", label: "セキュリティキーのみ" }]} help="SMS は使いません" />
                <Select label="IdP に求める条件" defaultValue="mfa" options={[{ value: "mfa", label: "IdP の MFA を必須（AuthnContext で確認）" }, { value: "none", label: "IdP の設定に任せる" }]} />
              </div>
            </div>
          </Section>

          <Section title="セッション">
            <div className="grid cols-2">
              <Select label="セッションの有効期間" defaultValue="12h" options={[{ value: "1h", label: "1時間" }, { value: "12h", label: "12時間" }, { value: "24h", label: "24時間" }, { value: "7d", label: "7日間" }]} help="期間が過ぎると再サインインが必要です" />
              <Select label="操作がない場合のタイムアウト" defaultValue="60" options={[{ value: "30", label: "30分" }, { value: "60", label: "60分" }, { value: "240", label: "4時間" }]} />
            </div>
          </Section>

          <Section title="利用者の無効化の反映先" sub="退職・異動で利用者や外部アクターを無効にしたとき、連携先・承認・通知・当番に反映します">
            <div className="stack">
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>反映先</th><th>方法</th></tr></thead>
                  <tbody>
                    {deprovisionTargets.map((d) => (
                      <tr key={d.name}>
                        <td><span className="row nowrap" style={{ ["--gap" as string]: "8px" }}><ProviderBadge provider={d.provider} size="sm" /><span className="small muted">{d.name}</span></span></td>
                        <td>{d.state === "手動確認が必要" ? <Tag tone="warn" square>{d.state}</Tag> : <Tag square>{d.state}</Tag>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Toggle label="IdP で無効化された利用者を自動で無効にする（SCIM）" description="IdP からの通知を受けて、このサービスと連携先の権限を同時に止めます" checked={ssoConfigured} disabled={!ssoConfigured} onChange={() => undefined} />
              <p className="tiny muted">反映の状況は人ごとに「外部アクターの対応付け」で確認できます。過去の承認記録と監査ログは消えません。</p>
            </div>
          </Section>

          <Section title="API トークン" sub="CI や社内スクリプトから読み取り専用で利用します。トークンはゲートの判定や承認を行えません" actions={<Button variant="primary" icon="plus" onClick={() => setCreating(true)}>トークンを作成</Button>} flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>名前</th><th>権限</th><th>作成日</th><th>最終使用</th><th>状態</th><th /></tr></thead>
                <tbody>
                  {apiTokens.map((t) => (
                    <tr key={t.id}>
                      <td className="strong"><span className="row nowrap"><Icon name="key" size={14} className="muted" />{t.name}</span></td>
                      <td className="small">{t.scope}</td>
                      <td><Timestamp at={t.created_at} mode="date" /></td>
                      <td><Timestamp at={t.last_used_at} /></td>
                      <td>{t.revoked ? <Tag tone="fail">失効済み</Tag> : <Tag tone="pass">有効</Tag>}</td>
                      <td style={{ textAlign: "right" }}>{t.revoked ? null : <Button size="sm" variant="ghost" icon="x" onClick={() => setRevoking(t.name)}>失効</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="セキュリティ操作の記録" sub="トークンの発行・失効、MFA や SSO の変更、利用者の無効化を記録します" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>日時</th><th>操作者</th><th>操作</th><th>対象</th></tr></thead>
                <tbody>
                  {securityAudit.map((a) => (
                    <tr key={a.at}>
                      <td><Timestamp at={a.at} mode="absolute" /></td>
                      <td className="small">{userById(a.actor)?.name}</td>
                      <td className="small strong">{a.action}</td>
                      <td className="small">{a.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      <Modal
        open={creating}
        onClose={() => { setCreating(false); setCreated(null); }}
        title={created ? "トークンを作成しました" : "API トークンを作成"}
        size="md"
        footer={
          created ? (
            <Button variant="primary" onClick={() => { setCreating(false); setCreated(null); }}>閉じる</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setCreating(false)}>キャンセル</Button>
              <Button variant="primary" disabled={!tokenName.trim()} onClick={() => setCreated("ept_live_7Q2m9xV4kR8sN1aZ6cB3")}>作成</Button>
            </>
          )
        }
      >
        {created ? (
          <div className="stack">
            <Banner tone="warn" title="このトークンは今しか表示されません">安全な場所に保管してください。紛失した場合は失効させて作り直してください。</Banner>
            <div className="share-link"><Icon name="key" size={14} /><span>{created}</span><Button size="sm" icon="copy" onClick={() => toast({ kind: "success", message: "コピーしました" })}>コピー</Button></div>
          </div>
        ) : (
          <div className="stack">
            <TextField label="名前" required value={tokenName} onChange={setTokenName} placeholder="例: 監査レポート出力" />
            <Combobox label="権限（読み取りのみ）" multiple value={["gates"]} options={[{ value: "gates", label: "ゲート判定の読み取り" }, { value: "audit", label: "監査ログの読み取り" }, { value: "projects", label: "プロジェクトの読み取り" }]} />
            <Select label="有効期限" defaultValue="90" options={[{ value: "30", label: "30日" }, { value: "90", label: "90日" }, { value: "365", label: "1年" }]} />
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={() => toast({ kind: "success", message: "トークンを失効させました" })}
        title="トークンを失効させますか？"
        message={`「${revoking ?? ""}」を使っている連携は動かなくなります。`}
        confirmLabel="失効させる"
        danger
      />
    </SettingsLayout>
  );
}
