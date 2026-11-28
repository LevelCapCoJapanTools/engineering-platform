// 画面ID: K-06 正本と同期ルール
import "./connectors.css";
import { useState } from "react";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { sourceRules } from "../../mocks/connectors";
import { AppLayout, Banner, Button, Checkbox, crumbs, ErrorState, PageHeader, ProviderBadge, Section, Select, Skeleton, Tag, Toggle, useToast } from "../../ui";

export function K06Sources() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);
  const conflict = state === "conflict";

  return (
    <AppLayout org={org} active="connectors" breadcrumb={crumbs(org, undefined, { label: "連携と同期", to: paths.connectors(org) }, { label: "正本と同期ルール" })}>
      <PageHeader
        title="正本と同期ルール"
        description="項目ごとにどのシステムを正とするかを決めます。初期は正本から本サービスへの読取一方向です。変更は監査ログに残ります。"
        actions={<Button variant="primary" icon="check" disabled={!dirty} disabledReason="変更はありません" onClick={() => { setDirty(false); toast({ kind: "success", message: "同期ルールを保存しました" }); }}>保存</Button>}
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <div className="stack">
          {conflict ? (
            <Banner tone="warn" title="2 つの正本の値が食い違っています">
              MS-104 の期限が GitHub Projects では 2026/12/17、Jira では 2026/12/10 です。正本（GitHub Projects）の値を表示し、食い違いを PM（佐藤 美咲）に通知しました。本サービスはどちらの値も書き換えません。
            </Banner>
          ) : null}

          <Section title="項目ごとの正本" sub="同じ項目を複数のシステムが持つ場合の優先順位" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>項目</th><th>正本</th><th>参照のみ</th><th>食い違いの扱い</th></tr></thead>
                <tbody>
                  {sourceRules.map((r) => (
                    <tr key={r.item}>
                      <td className="strong small">{r.item}</td>
                      <td>{r.primary === "manual" ? <Tag tone="primary" square>本サービス</Tag> : <ProviderBadge provider={r.primary} size="sm" />}</td>
                      <td>{r.secondary ? <ProviderBadge provider={r.secondary} size="sm" /> : <span className="muted">—</span>}</td>
                      <td className="small">{r.conflict}{r.note ? <div className="tiny muted">{r.note}</div> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="grid cols-2">
            <Section title="同期の方向">
              <div className="stack">
                <Toggle label="正本から本サービスへ読み取る" checked disabled onChange={() => undefined} description="常に有効です" />
                <Toggle label="計画・予定を正本へ書き戻す" checked={false} disabled onChange={() => undefined} description="初期は無効です。書き戻す項目、競合の解決、承認、変更通知を決めてから追加します" />
                <p className="tiny muted">本サービスで行った経営判断は、監査対象の判断記録として本サービスに保存します。計画システムの日付は書き換えません。</p>
              </div>
            </Section>
            <Section title="同期の周期">
              <div className="stack">
                <Select label="計画・課題管理" defaultValue="15" onChange={touch} options={[{ value: "5", label: "5分ごと" }, { value: "15", label: "15分ごと" }, { value: "60", label: "1時間ごと" }]} help="Webhook がある場合は即時に反映し、周期実行で欠落を補います" />
                <Select label="カレンダー" defaultValue="push" onChange={touch} options={[{ value: "push", label: "変更通知（即時）＋1時間ごとの確認" }, { value: "60", label: "1時間ごと" }]} />
                <Select label="古い情報とみなすまでの時間" defaultValue="60" onChange={touch} options={[{ value: "30", label: "30分" }, { value: "60", label: "1時間" }, { value: "240", label: "4時間" }]} help="これを超えると、経営ダッシュボードで「古い情報」と表示します" />
              </div>
            </Section>
          </div>

          <div className="grid cols-2">
            <Section title="日付の扱い">
              <div className="stack">
                <Select label="組織のタイムゾーン" defaultValue="Asia/Tokyo" onChange={touch} options={[{ value: "Asia/Tokyo", label: "Asia/Tokyo（日本時間）" }, { value: "UTC", label: "UTC" }]} help="外部の予定は元のタイムゾーンを保持し、表示時に変換します。夏時間のある地域の予定も元の時刻で保持します" />
                <Select label="営業日カレンダー" defaultValue="jp" onChange={touch} options={[{ value: "jp", label: "日本の祝日＋会社の休業日" }, { value: "none", label: "土日のみ休み" }]} help="遅延日数と期限の計算に使います" />
                <Checkbox label="日付のみの期限を、その日の終わり（23:59）として扱う" defaultChecked onChange={touch} />
                <Checkbox label="終日の予定を、開始日の日付として扱う（時差で前後の日にずらさない）" defaultChecked onChange={touch} />
              </div>
            </Section>
            <Section title="カレンダーの取込み条件">
              <div className="stack">
                <Checkbox label="許可した共有カレンダーだけを取り込む" checked disabled description="個人の予定表は対象外です" />
                <Checkbox label="非公開（private）の予定を除外する" defaultChecked onChange={touch} />
                <Checkbox label="件名に案件コードがある予定だけを案件に結び付ける" defaultChecked onChange={touch} description="例: [ORD] 進捗レビュー" />
                <Checkbox label="本文・参加者一覧を取り込まない" defaultChecked onChange={touch} />
                <p className="tiny muted">繰返し予定は、シリーズ全体の変更と1回だけの変更（移動・取消）を区別して記録します。オンコールの当番表はここでは扱いません。</p>
              </div>
            </Section>
          </div>

          <Section title="変更・削除の扱い" sub="外部で消えたものを本サービスの記録から消さず、状態として残します">
            <ul className="kn-list">
              <li>マイルストーンの延期: 当初・承認済み改訂・予測を別々に保存し、上書きで当初の期限や遅延の履歴を消さない</li>
              <li>予定の取消・移動: 「取消」「移動」の状態として残し、判断期限と通知先を更新する</li>
              <li>課題のクローズ・再開: 状態の履歴として残す</li>
              <li>外部での削除: 「外部で削除」と表示し、計画履歴と証跡からは消さない</li>
            </ul>
          </Section>

          <Section title="接続解除・組織削除・停止時">
            <div className="stack">
              <Select label="接続を解除したときの取得済みデータ" defaultValue="90" onChange={touch} options={[{ value: "0", label: "すぐに削除する" }, { value: "30", label: "30日後に削除する" }, { value: "90", label: "90日後に削除する" }]} help="Evidence Manifest と監査ログは保持期間の設定に従い、ここでは削除しません" />
              <p className="small">組織を削除すると、外部データの複製は契約に定める期間内にすべて削除し、削除の完了を記録します。</p>
              <Banner tone="info" title="同期が止まったときの手動確認">
                連携先が停止している間は、経営ダッシュボードに最終同期時刻と「古い情報」を表示します。重要な判断の前は、正本（計画システム・カレンダー）を直接確認してください。各案件の PM へ確認依頼を送ることもできます。
              </Banner>
              <p className="tiny muted">API の呼出し回数は「利用量」で確認できます。上限に近づいた場合も、同期の周期を延ばすだけで、取得済みのデータと証跡は失われません。</p>
            </div>
          </Section>
        </div>
      )}
    </AppLayout>
  );
}
