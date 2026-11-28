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
    <SettingsLayout org={org} active="org" title="組織の設定" description="組織の基本情報と表示形式を管理します。変更は組織管理者のみが行えます。変更は監査ログに記録されます。">
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {readOnly ? (
            <SoDNotice reason="組織の設定を変更できるのは組織管理者のみです。あなたのロール（経営者、案件スポンサー）では閲覧のみできます。" eligible={membersWithRole("組織管理者")} />
          ) : null}
          <Section title="基本情報と表示形式" sub="組織名と表示IDは利用者と顧客ポータルに表示されます">
            <div className="stack">
              <div className="grid cols-2">
                <TextField label="組織名" required value={name} onChange={setName} error={nameError} readOnly={readOnly} maxLength={60} />
                <TextField label="表示ID" required value={slug} onChange={setSlug} error={slugError} readOnly={readOnly} prefix="app.example/o/" help="URL に使われます。変更すると既存のリンクは転送されます" />
              </div>
              <FileUpload label="ロゴ" accept=".png,.svg（正方形、512px 以上推奨）" fileName="sample-soft-logo.png" />
              <div className="grid cols-2">
                <Select label="タイムゾーン" defaultValue={orgSettings.timezone} disabled={readOnly} options={[{ value: "Asia/Tokyo", label: "(UTC+09:00) 東京" }, { value: "UTC", label: "(UTC+00:00) 協定世界時" }, { value: "America/Los_Angeles", label: "(UTC-08:00) ロサンゼルス" }]} help="期限や監査ログの表示に使います。記録は UTC で保存します" />
                <Select label="既定の言語" defaultValue={orgSettings.language} disabled={readOnly} options={[{ value: "ja", label: "日本語（標準）" }, { value: "en", label: "English" }]} help="利用者ごとに個人設定で切り替えられます。監査パックと通知の言語にも使います" />
              </div>
              <div className="grid cols-2">
                <Select label="日付の表示形式" defaultValue={orgSettings.dateFormat} disabled={readOnly} options={[{ value: "yyyy/MM/dd", label: "2026/11/27" }, { value: "yyyy-MM-dd", label: "2026-11-27（ISO 8601）" }, { value: "MMM d, yyyy", label: "Nov 27, 2026" }]} />
                <Select label="氏名の表示順" defaultValue={orgSettings.nameDisplay} disabled={readOnly} options={[{ value: "familyFirst", label: "姓 名（佐藤 美咲）" }, { value: "givenFirst", label: "名 姓（Misaki Sato）" }]} />
                <Select label="週の始まり" defaultValue={orgSettings.weekStart} disabled={readOnly} options={[{ value: "monday", label: "月曜日" }, { value: "sunday", label: "日曜日" }]} help="スケジュールとロードマップの表示に使います" />
                <Select label="年度の開始月" defaultValue={orgSettings.fiscalYearStart} disabled={readOnly} options={[{ value: "04", label: "4月" }, { value: "01", label: "1月" }, { value: "10", label: "10月" }]} help="予算と便益の集計期間に使います" />
                <Select label="営業日カレンダー" defaultValue={orgSettings.holidays} disabled={readOnly} options={[{ value: "jp", label: "日本の祝日＋年末年始（12/29〜1/3）" }, { value: "jp-only", label: "日本の祝日のみ" }, { value: "none", label: "土日のみ休日" }]} help="遅延日数・営業日の計算に使います" />
                <Select label="通貨" defaultValue={orgSettings.currency} disabled options={[{ value: "JPY", label: "日本円（JPY）" }]} help="予算・費用の表示に使います" />
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
                  <span className="small muted">4件のプロジェクト、4 名の利用者、11 件の連携が影響を受けます。連携先から取り込んだ複製データも削除します</span>
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
