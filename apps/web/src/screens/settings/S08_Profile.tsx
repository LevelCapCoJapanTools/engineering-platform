// 画面ID: S-08 個人設定
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { currentUser } from "../../mocks/core";
import { notificationKinds } from "../../mocks/settings";
import { AppLayout, Avatar, Banner, Button, ErrorState, FileUpload, Icon, PageHeader, RoleBadge, Section, Segmented, Select, Skeleton, Tag, TextField, crumbs, useTheme, useToast } from "../../ui";

export function S08Profile() {
  const state = useScreenState();
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const [name, setName] = useState(currentUser.name);
  const [prefs, setPrefs] = useState<Record<string, { mail: boolean; app: boolean }>>(
    Object.fromEntries(notificationKinds.map((k) => [k.key, { mail: ["approval", "exception", "acceptance"].includes(k.key), app: true }])),
  );
  const githubLinked = state !== "GitHub未連携";

  return (
    <AppLayout org={ORG} active="settings" breadcrumb={crumbs(ORG, undefined, { label: "個人設定" })}>
      <PageHeader title="個人設定" description="プロフィール、通知、表示を設定します。この設定はあなたにだけ適用されます。" actions={<Button variant="primary" icon="check" onClick={() => toast({ kind: "success", message: "個人設定を保存しました" })}>保存</Button>} />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <div className="grid main-side">
          <div className="stack">
            <Section title="プロフィール">
              <div className="stack">
                <div className="row" style={{ ["--gap" as string]: "16px" }}>
                  <Avatar user={currentUser} size="xl" />
                  <div className="grow"><FileUpload label="アバター画像" accept=".png,.jpg" fileName="avatar.png" /></div>
                </div>
                <div className="grid cols-2">
                  <TextField label="名前" required value={name} onChange={setName} error={!name.trim() ? "名前を入力してください" : undefined} />
                  <TextField label="メールアドレス" value={currentUser.email} readOnly help="メールアドレスの変更は組織管理者に依頼してください" />
                </div>
                <div className="row" style={{ ["--gap" as string]: "6px" }}>
                  <span className="small muted">ロール（組織管理者が設定）:</span>
                  {currentUser.roles.map((r) => <RoleBadge key={r} role={r} />)}
                </div>
              </div>
            </Section>

            <Section title="通知" sub="種類ごとに受け取り方を選べます" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>通知の種類</th><th style={{ textAlign: "center" }}>メール</th><th style={{ textAlign: "center" }}>アプリ内</th></tr></thead>
                  <tbody>
                    {notificationKinds.map((k) => (
                      <tr key={k.key}>
                        <td>{k.label}</td>
                        {(["mail", "app"] as const).map((ch) => (
                          <td key={ch} style={{ textAlign: "center" }}>
                            <label className="toggle" style={{ justifyContent: "center" }}>
                              <input type="checkbox" role="switch" aria-label={`${k.label}（${ch === "mail" ? "メール" : "アプリ内"}）`} checked={prefs[k.key][ch]} onChange={(e) => setPrefs((p) => ({ ...p, [k.key]: { ...p[k.key], [ch]: e.target.checked } }))} />
                              <span className="track" />
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          <div className="stack">
            <Section title="連携しているアカウント">
              {githubLinked ? (
                <div className="row between">
                  <span className="row"><Icon name="github" size={18} /><span className="stack" style={{ ["--gap" as string]: "0" }}><span className="strong">{currentUser.github}</span><span className="tiny muted">GitHub · PR の作成者・レビュー者の照合に使います</span></span></span>
                  <Button size="sm" variant="ghost">解除</Button>
                </div>
              ) : (
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  <Banner tone="warn">GitHub アカウントが連携されていません。PR のレビューを承認として記録できません。</Banner>
                  <Button icon="github" variant="primary">GitHub アカウントを連携</Button>
                </div>
              )}
            </Section>
            <Section title="表示">
              <div className="stack">
                <div className="field">
                  <span className="field-label">テーマ</span>
                  <Segmented value={theme} onChange={(v) => { if (v !== theme) toggle(); }} options={[{ value: "light", label: "ライト" }, { value: "dark", label: "ダーク" }]} />
                </div>
                <Select label="言語" defaultValue="ja" options={[{ value: "ja", label: "日本語" }, { value: "en", label: "English（準備中）", disabled: true }]} />
                <div className="row" style={{ ["--gap" as string]: "6px" }}><Tag icon="clock">タイムゾーン: 組織の設定（Asia/Tokyo）</Tag></div>
              </div>
            </Section>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
