// 画面ID: S-06 セキュリティ
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { apiTokens } from "../../mocks/settings";
import { Banner, Button, Combobox, ConfirmDialog, ErrorState, FileUpload, Icon, Modal, Section, Select, SettingsLayout, Skeleton, Tag, TextArea, TextField, Timestamp, Toggle, useToast } from "../../ui";

export function S06Security({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const ssoConfigured = state !== "SSO未設定";
  const [ssoOn, setSsoOn] = useState(ssoConfigured);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  return (
    <SettingsLayout org={org} active="security" title="セキュリティ" description="サインイン方法、セッション、API トークンを管理します。">
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

          <Section title="セッション">
            <div className="grid cols-2">
              <Select label="セッションの有効期間" defaultValue="12h" options={[{ value: "1h", label: "1時間" }, { value: "12h", label: "12時間" }, { value: "24h", label: "24時間" }, { value: "7d", label: "7日間" }]} help="期間が過ぎると再サインインが必要です" />
              <Select label="操作がない場合のタイムアウト" defaultValue="60" options={[{ value: "30", label: "30分" }, { value: "60", label: "60分" }, { value: "240", label: "4時間" }]} />
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
