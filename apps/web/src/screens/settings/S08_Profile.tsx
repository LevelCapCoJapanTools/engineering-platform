// 画面ID: S-08 個人設定
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { currentUser } from "../../mocks/core";
import { notificationKinds } from "../../mocks/settings";
import { AppLayout, Avatar, Banner, Button, Checkbox, ErrorState, FileUpload, PageHeader, ProviderBadge, RoleBadge, Section, Segmented, Select, Skeleton, Tag, TextField, crumbs, useTheme, useToast } from "../../ui";

export function S08Profile() {
  const state = useScreenState();
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const [name, setName] = useState(currentUser.name);
  const [prefs, setPrefs] = useState<Record<string, { mail: boolean; app: boolean }>>(
    Object.fromEntries(notificationKinds.map((k) => [k.key, { mail: ["approval", "exception", "acceptance"].includes(k.key), app: true }])),
  );
  const githubLinked = state !== "チャット未連携";

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
            <Section title="受け取り方" sub="組織の通知ルールのうち、あなた宛ての通知の届け方を選べます">
              <div className="stack">
                <div className="field">
                  <span className="field-label">チャネル</span>
                  <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                    <Checkbox label="アプリ内通知" defaultChecked disabled description="常に受け取ります" />
                    <Checkbox label="メール" defaultChecked />
                    <Checkbox label="Slack のダイレクトメッセージ" defaultChecked={githubLinked} disabled={!githubLinked} description={githubLinked ? "ボタンで判断できます" : "Slack アカウントの連携が必要です"} />
                  </div>
                </div>
                <div className="grid cols-2">
                  <TextField label="静穏時間" defaultValue="22:00〜7:00" help="緊急の通知（インシデント、証跡の保管失敗）は届きます" />
                  <Select label="タイムゾーン" defaultValue="org" options={[{ value: "org", label: "組織の設定（Asia/Tokyo）" }, { value: "America/Los_Angeles", label: "America/Los_Angeles" }]} />
                </div>
                <Select label="要約の頻度" defaultValue="daily" options={[{ value: "none", label: "要約を受け取らない（個別に受け取る）" }, { value: "daily", label: "毎朝 8:00 に要約" }, { value: "twice", label: "朝 8:00 と夕方 17:00 に要約" }, { value: "weekly", label: "毎週月曜 8:00 に要約" }]} help="要約に含めた通知は、個別には送りません（期限当日と緊急を除く）" />
                <Select label="一時的に止める" defaultValue="" options={[{ value: "", label: "止めない" }, { value: "1d", label: "明日まで（緊急を除く）" }, { value: "1w", label: "1 週間（緊急を除く）" }]} />
              </div>
            </Section>
          </div>

          <div className="stack">
            <Section title="連携しているアカウント" sub="チャットでのボタン操作を本人として照合するために使います">
              {githubLinked ? (
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  <div className="row between">
                    <span className="row"><ProviderBadge provider="slack" /><span className="tiny muted">@kimura</span></span>
                    <Button size="sm" variant="ghost">解除</Button>
                  </div>
                  <div className="row between">
                    <span className="row"><ProviderBadge provider="googleCalendar" /><span className="tiny muted">{currentUser.email}</span></span>
                    <Button size="sm" variant="ghost">解除</Button>
                  </div>
                </div>
              ) : (
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  <Banner tone="warn">チャットのアカウントが連携されていません。Slack などのボタンからの判断は、本人と照合できないため受け付けません。</Banner>
                  <Button icon="link" variant="primary">Slack アカウントを連携</Button>
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
