// 画面ID: N-03 通知ルール
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { SEVERITY } from "../../lib/vocab";
import type { Severity } from "../../lib/vocab";
import {
  AppLayout, Banner, Button, Checkbox, crumbs, Drawer, EmptyState, ErrorState, PageHeader, ProviderBadge, Section, Segmented, Select, Skeleton, Tag, TextArea,
  TextField, Toggle, useToast,
} from "../../ui";
import { channelById, channels, NOTIFY_EVENTS, notifyRules } from "../../mocks/notify";
import type { NotifyRule } from "../../mocks/notify";
import { NotifyTabs, SeverityBadge, useOrg } from "./parts";

const AGG: Record<NotifyRule["aggregate"], string> = { none: "集約しない", "15m": "15 分ごとに集約", "1h": "1 時間ごとに集約", daily: "1 日 1 回の要約" };

export function N03Rules() {
  const state = useScreenState();
  const org = useOrg();
  const toast = useToast();
  const [view, setView] = useState("list");
  const [rules, setRules] = useState(state === "ルールなし" ? [] : notifyRules);
  const [edit, setEdit] = useState<NotifyRule | null>(null);
  const [digest, setDigest] = useState(true);
  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);

  return (
    <AppLayout org={org} active="notify" breadcrumb={crumbs(org, undefined, { label: "通知" }, { label: "通知ルール" })}>
      <PageHeader
        title="通知ルール"
        description="どの出来事を、どの重大度から、どこへ届けるかを決めます。通知の送信はゲートの判定や証跡の保存とは別に行い、失敗してもそれらを止めません。"
        actions={
          <>
            <Button icon="plus" onClick={() => setEdit({ id: "new", event: "approvalRequested", min_severity: "medium", scope: "全案件", destinations: [], recipients: "", aggregate: "none", quiet_hours: "respect", enabled: true })}>ルールを追加</Button>
            <Button variant="primary" icon="check" disabled={!dirty} disabledReason="変更はありません" onClick={() => { setDirty(false); toast({ kind: "success", message: "通知の設定を保存しました" }); }}>保存</Button>
          </>
        }
      />
      <NotifyTabs org={org} active="rules" />
      {state === "読み込み中" ? (
        <Skeleton rows={6} />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {state === "静穏時間中" ? (
            <Banner tone="info" title="現在は静穏時間（22:00〜7:00）です">
              「静穏時間を守る」ルールの通知は 7:00 にまとめて送ります。緊急（オンコールの起票、証跡の保管失敗など）は静穏時間でも送ります。
            </Banner>
          ) : null}
          <Section title="ルール" sub={`${rules.length} 件`} actions={<Segmented value={view} onChange={setView} options={[{ value: "list", label: "一覧" }, { value: "matrix", label: "出来事 × チャネル" }]} />} flush>
            {rules.length === 0 ? (
              <EmptyState icon="bell" title="通知ルールがありません" description="ルールがなくても、アプリ内通知には表示されます。チャットやメールにも届けるにはルールを追加します。" />
            ) : view === "list" ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>出来事</th><th>重大度</th><th>範囲</th><th>宛先</th><th>受け取る人</th><th>集約・再通知</th><th>有効</th><th aria-label="操作" /></tr></thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id}>
                        <td><div className="strong small">{NOTIFY_EVENTS[r.event].label}</div><div className="tiny muted">{NOTIFY_EVENTS[r.event].group}</div></td>
                        <td><span className="row nowrap" style={{ ["--gap" as string]: "4px" }}><SeverityBadge value={r.min_severity} /><span className="tiny muted">以上</span></span></td>
                        <td className="small">{r.scope}</td>
                        <td>
                          <div className="stack" style={{ ["--gap" as string]: "3px" }}>
                            {r.destinations.map((d) => {
                              const c = channelById(d);
                              return c ? <span key={d} className="row nowrap" style={{ ["--gap" as string]: "4px" }}><ProviderBadge provider={c.provider} size="sm" />{c.status === "failing" ? <Tag tone="fail" square>配信不可</Tag> : null}</span> : null;
                            })}
                          </div>
                        </td>
                        <td className="small">{r.recipients}</td>
                        <td className="small">
                          {AGG[r.aggregate]}
                          {r.renotify ? <div className="tiny muted">{r.renotify}</div> : null}
                          <div className="tiny muted">{r.quiet_hours === "override" ? "静穏時間でも送る" : "静穏時間を守る"}</div>
                        </td>
                        <td>
                          <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                            <Toggle label={<span className="sr-only">有効</span>} checked={r.enabled} onChange={(v) => { setRules((xs) => xs.map((x) => (x.id === r.id ? { ...x, enabled: v } : x))); touch(); }} />
                            {r.muted_until ? <span className="tiny muted">{r.muted_until} までミュート</span> : null}
                          </div>
                        </td>
                        <td><Button size="sm" variant="ghost" onClick={() => setEdit(r)}>編集</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table compact nt-matrix">
                  <thead><tr><th>出来事</th>{channels.map((c) => <th key={c.id}><ProviderBadge provider={c.provider} size="sm" /><div className="tiny muted">{c.destination.split("（")[0]}</div></th>)}</tr></thead>
                  <tbody>
                    {(Object.keys(NOTIFY_EVENTS) as (keyof typeof NOTIFY_EVENTS)[]).map((e) => (
                      <tr key={e}>
                        <td className="small">{NOTIFY_EVENTS[e].label}</td>
                        {channels.map((c) => {
                          const hit = rules.some((r) => r.event === e && r.enabled && r.destinations.includes(c.id));
                          return <td key={c.id} style={{ textAlign: "center" }}>{hit ? <Tag tone="pass" square icon="check">送る</Tag> : <span className="muted">—</span>}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <div className="grid cols-2">
            <Section title="時間帯とタイムゾーン">
              <div className="stack">
                <Select label="タイムゾーン" defaultValue="Asia/Tokyo" onChange={touch} options={[{ value: "Asia/Tokyo", label: "Asia/Tokyo（組織の既定）" }, { value: "America/Los_Angeles", label: "America/Los_Angeles" }, { value: "UTC", label: "UTC" }]} />
                <div className="grid cols-2">
                  <TextField label="営業時間" defaultValue="9:00〜18:00（平日）" onChange={touch} />
                  <TextField label="静穏時間" defaultValue="22:00〜7:00" onChange={touch} help="緊急の通知は送ります" />
                </div>
                <Checkbox label="日本の祝日を休日として扱う" defaultChecked onChange={touch} />
              </div>
            </Section>
            <Section title="量の制御">
              <div className="stack">
                <Select label="同じ宛先への上限" defaultValue="20" onChange={touch} options={[{ value: "10", label: "1 時間に 10 件まで" }, { value: "20", label: "1 時間に 20 件まで" }, { value: "50", label: "1 時間に 50 件まで" }]} />
                <Checkbox label="同じ対象・同じ出来事は重複キーでまとめる" defaultChecked onChange={touch} description="例: 同じ PR の再実行によるブロックは 1 件にまとめる" />
                <span className="tiny muted">上限を超えた通知は捨てずに要約にまとめ、配信ログに「集約・抑止」と記録します。</span>
              </div>
            </Section>
            <Section title="文面">
              <div className="stack">
                <Select label="言語" defaultValue="ja" onChange={touch} options={[{ value: "ja", label: "日本語" }, { value: "en", label: "English" }, { value: "both", label: "日本語と英語を併記" }]} />
                <Checkbox label="担当者へのメンション（外部IDで照合できた人のみ）" defaultChecked onChange={touch} />
                <Checkbox label="同じ対象の通知をスレッドにまとめる（対応するチャネルのみ）" defaultChecked onChange={touch} />
                <Checkbox label="対応期限と詳細画面へのリンクを必ず載せる" defaultChecked disabled />
              </div>
            </Section>
            <Section title="機密情報のマスキング">
              <div className="stack">
                <Checkbox label="金額は経営層向けのチャネル以外では伏せる" defaultChecked onChange={touch} />
                <Checkbox label="顧客名は案件の参加者が見られるチャネル以外では伏せる" defaultChecked onChange={touch} />
                <Checkbox label="要求・コードの本文を載せない（件名と ID のみ）" defaultChecked disabled description="常に有効です" />
                <span className="tiny muted">Secret・認証情報は送信内容にも配信ログにも残しません。</span>
              </div>
            </Section>
          </div>

          <Section title="経営層向けの要約" sub="個別の通知の代わりに、判断に必要なことをまとめて届けます">
            <div className="stack">
              <Toggle label="毎朝の要約を送る" description="未解決の判断、期限が近い判断、遅延したマイルストーン、同期が止まっている連携、未受領のインシデントをまとめます" checked={digest} onChange={(v) => { setDigest(v); touch(); }} />
              <div className="grid cols-2">
                <Select label="送信時刻" defaultValue="8" disabled={!digest} onChange={touch} options={[{ value: "7", label: "7:00" }, { value: "8", label: "8:00" }, { value: "9", label: "9:00" }]} />
                <Select label="宛先" defaultValue="ch-email" disabled={!digest} onChange={touch} options={channels.filter((c) => c.scope === "org").map((c) => ({ value: c.id, label: c.name }))} />
              </div>
            </div>
          </Section>
        </>
      )}

      <Drawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id === "new" ? "ルールを追加" : "ルールを編集"}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>キャンセル</Button><Button variant="primary" onClick={() => { setEdit(null); touch(); toast({ kind: "success", message: "ルールを更新しました。保存すると反映されます" }); }}>適用</Button></>}
      >
        {edit ? (
          <div className="stack">
            <Select label="出来事" defaultValue={edit.event} options={Object.entries(NOTIFY_EVENTS).map(([k, v]) => ({ value: k, label: `${v.group}: ${v.label}` }))} />
            <Select label="重大度（以上）" defaultValue={edit.min_severity} options={(Object.keys(SEVERITY) as Severity[]).map((k) => ({ value: k, label: SEVERITY[k].label }))} />
            <TextField label="範囲" defaultValue={edit.scope} help="案件・連携・カレンダーで絞り込めます" />
            <div className="field">
              <span className="field-label">宛先</span>
              <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                {channels.map((c) => <Checkbox key={c.id} label={c.name} defaultChecked={edit.destinations.includes(c.id)} description={c.capabilities.interactive ? "ボタン操作あり" : "送信のみ"} />)}
              </div>
            </div>
            <Select label="集約" defaultValue={edit.aggregate} options={Object.entries(AGG).map(([k, v]) => ({ value: k, label: v }))} />
            <TextField label="再通知" defaultValue={edit.renotify ?? ""} placeholder="例: 期限の 24 時間前" />
            <Select label="静穏時間" defaultValue={edit.quiet_hours} options={[{ value: "respect", label: "静穏時間を守る" }, { value: "override", label: "静穏時間でも送る（緊急のみ推奨）" }]} />
            <TextField label="ミュートの期限" defaultValue={edit.muted_until ?? ""} placeholder="YYYY-MM-DD" />
            <TextArea label="文面テンプレート（日本語）" rows={3} defaultValue="{{subject}}（期限 {{due}}）\n{{summary}}\n{{link}}" />
          </div>
        ) : null}
      </Drawer>
    </AppLayout>
  );
}
