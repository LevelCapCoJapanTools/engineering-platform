// 画面ID: S-01 組織の設定
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { orgSettings } from "../../mocks/settings";
import { Banner, Button, ConfirmDialog, ErrorState, FileUpload, Section, Select, Skeleton, SoDNotice, TextField, membersWithRole, SettingsLayout, useToast } from "../../ui";

export function S01OrgSettings({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [name, setName] = useState(orgSettings.name);
  const [slug, setSlug] = useState(orgSettings.slug);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const readOnly = state === "閲覧のみ";
  const nameError = state === "入力エラー" ? "組織名を入力してください" : !name.trim() ? "組織名を入力してください" : undefined;
  const slugError = state === "入力エラー" ? "この表示IDはすでに使われています" : !/^[a-z0-9-]+$/.test(slug) ? "半角英小文字・数字・ハイフンで入力してください" : undefined;

  const save = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      toast({ kind: "success", message: "組織の設定を保存しました" });
    }, 600);
  };

  return (
    <SettingsLayout org={org} active="org" title="組織の設定" description="組織の基本情報を管理します。変更は組織管理者のみが行えます。">
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {readOnly ? (
            <SoDNotice reason="組織の設定を変更できるのは組織管理者のみです。あなたのロール（PM、リリース管理者）では閲覧のみできます。" eligible={membersWithRole("組織管理者")} />
          ) : null}
          <Section title="基本情報" sub="組織名と表示IDはメンバーと顧客ポータルに表示されます">
            <div className="stack">
              <div className="grid cols-2">
                <TextField label="組織名" required value={name} onChange={setName} error={nameError} readOnly={readOnly} maxLength={60} />
                <TextField label="表示ID" required value={slug} onChange={setSlug} error={slugError} readOnly={readOnly} prefix="app.example/o/" help="URL に使われます。変更すると既存のリンクは転送されます" />
              </div>
              <FileUpload label="ロゴ" accept=".png,.svg（正方形、512px 以上推奨）" fileName="sample-soft-logo.png" />
              <div className="grid cols-2">
                <Select label="タイムゾーン" defaultValue={orgSettings.timezone} disabled={readOnly} options={[{ value: "Asia/Tokyo", label: "(UTC+09:00) 東京" }, { value: "UTC", label: "(UTC+00:00) 協定世界時" }, { value: "America/Los_Angeles", label: "(UTC-08:00) ロサンゼルス" }]} help="期限や監査ログの表示に使います。記録は UTC で保存します" />
                <Select label="言語" defaultValue={orgSettings.language} disabled={readOnly} options={[{ value: "ja", label: "日本語" }, { value: "en", label: "English（準備中）", disabled: true }]} />
              </div>
              <div className="row end">
                <Button variant="primary" icon="check" loading={saving} disabled={readOnly || Boolean(nameError) || Boolean(slugError)} disabledReason={readOnly ? "組織管理者のみ変更できます" : "入力内容を確認してください"} onClick={save}>
                  保存
                </Button>
              </div>
            </div>
          </Section>

          <section className="card" style={{ borderColor: "var(--tone-fail-border)" }}>
            <div className="stack" style={{ ["--gap" as string]: "12px" }}>
              <div>
                <h2 className="section-title" style={{ color: "var(--tone-fail)" }}>危険な操作</h2>
                <p className="section-sub">取り消せない操作です。実行前に監査パックを出力しておくことをおすすめします。</p>
              </div>
              <Banner tone="warn" title="組織を削除すると次のデータが削除されます">
                プロジェクト、要求、ゲートの判定、監査ログ。WORM に保管済みの Evidence Manifest は保持期限まで削除されず、保管先に残ります。
              </Banner>
              <div className="row between">
                <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                  <span className="strong">組織の削除</span>
                  <span className="small muted">4件のプロジェクトと 9 名のメンバーが影響を受けます</span>
                </div>
                <Button variant="danger" icon="trash" disabled={readOnly} disabledReason="組織管理者のみ削除できます" onClick={() => setConfirm(true)}>
                  組織を削除
                </Button>
              </div>
            </div>
          </section>
          <ConfirmDialog
            open={confirm}
            onClose={() => setConfirm(false)}
            onConfirm={() => toast({ kind: "info", message: "削除を受け付けました（モック）" })}
            title="組織を削除しますか？"
            message="この操作は取り消せません。WORM 保管済みの証跡を除き、組織のすべてのデータが削除されます。"
            confirmLabel="組織を削除する"
            danger
            requireText={orgSettings.name}
          />
        </>
      )}
    </SettingsLayout>
  );
}
