// 画面ID: U-04 公開停止と配信履歴
import "./disclosure.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { DISCLOSURE_STATUS } from "../../lib/vocab";
import { disclosureAccess, disclosureChanges, disclosureDeliveries, publishedVersions } from "../../mocks/disclosure";
import {
  Banner,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ExternalActor,
  PageHeader,
  ProjectLayout,
  Section,
  Skeleton,
  StatusBadge,
  Tabs,
  Tag,
  TextArea,
  useToast,
} from "../../ui";

const DELIVERY_TAG = {
  delivered: { label: "配信済み", tone: "pass" as const },
  failed: { label: "配信失敗", tone: "fail" as const },
  scheduled: { label: "予約", tone: "info" as const },
  cancelled: { label: "停止で取消", tone: "neutral" as const },
};

export function DisclosureHistoryScreen({ org = ORG, project = PROJECT }: { org?: string; project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [tab, setTab] = useState("changes");
  const [stopOpen, setStopOpen] = useState(false);
  const [stopped, setStopped] = useState(state === "stopped" || state === "allianceEnded");
  const [reason, setReason] = useState("");
  const [recallFor, setRecallFor] = useState<string | null>(null);
  const versions = publishedVersions.filter((v) => (state === "allianceEnded" ? v.project === "member-app-api" : v.project === project));
  const active = versions.find((v) => v.status === "published");
  const deliveries = disclosureDeliveries.map((d) => (stopped && d.status === "scheduled" ? { ...d, status: "cancelled" as const } : d));
  const empty = state === "empty";

  return (
    <ProjectLayout org={org} project={project} active="disclosure" trail={[{ label: "顧客への公開", to: paths.disclosure(org, project) }, { label: "公開停止と履歴" }]}>
      <PageHeader
        title="公開停止と配信履歴"
        description="公開設定の変更者・対象・理由と、相手の閲覧・ダウンロード・外部配信の記録を確認します。公開を停止すると、既存の画面からの再取得と予約配信が止まります。"
        actions={<Button variant="secondary" icon="xCircle" disabled={!active || stopped} disabledReason={stopped ? "公開は停止済みです" : "公開中の版がありません"} onClick={() => setStopOpen(true)}>公開を停止</Button>}
      />
      {state === "loading" ? (
        <Skeleton variant="table" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {state === "allianceEnded" ? (
            <Banner tone="warn" title="業務提携の終了（2026-11-30）に合わせて、公開を停止しました">
              架空リテール株式会社向けの共有リンク 2件、カレンダー購読 1件、送信待ち 1件を失効させました。共同費目の過去の配信控えは下の記録で確認できます。
            </Banner>
          ) : stopped ? (
            <Banner tone="info" title="公開を停止しました">
              相手の画面は案件名と招待内容だけになりました。既存のセッションからの再取得と、予約していた配信（{disclosureDisclosedCount(deliveries)} 件）を止めています。すでに配信・取得された控えは下の記録で特定できます。
            </Banner>
          ) : null}
          <Section title="公開版" flush>
            {versions.length === 0 || empty ? (
              <div className="card-body"><EmptyState icon="eye" title="公開した版はありません" description="公開設定で項目を選び、相手の見え方を確認してから公開してください。" /></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>公開版</th><th>相手</th><th>項目数</th><th>確定</th><th>期限</th><th>状態</th></tr></thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr key={v.id}>
                        <td className="mono">{v.id}</td>
                        <td className="small">{v.audience}</td>
                        <td className="small">{v.items.length}</td>
                        <td className="small">{formatDateTime(v.fixed_at)}</td>
                        <td className="small">{v.expires.replace(/-/g, "/")}</td>
                        <td><StatusBadge vocab={DISCLOSURE_STATUS[stopped && v.status === "published" ? "stopped" : v.status]} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "changes", label: "設定の変更", count: empty ? 0 : disclosureChanges.length },
              { value: "access", label: "閲覧・ダウンロード", count: empty ? 0 : disclosureAccess.length },
              { value: "deliveries", label: "外部への配信", count: empty ? 0 : deliveries.length },
            ]}
          />
          {empty ? (
            <div className="card"><EmptyState icon="history" title="記録はまだありません" /></div>
          ) : tab === "changes" ? (
            <div className="card flush table-wrap">
              <table className="table">
                <thead><tr><th>日時</th><th>変更者</th><th>対象</th><th>変更</th><th>理由</th></tr></thead>
                <tbody>
                  {disclosureChanges.map((c) => (
                    <tr key={c.id}>
                      <td className="small">{formatDateTime(c.at)}</td>
                      <td><ExternalActor userId={c.by} /></td>
                      <td className="small">{c.target}</td>
                      <td className="small">{c.change}</td>
                      <td className="small">{c.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === "access" ? (
            <div className="card flush table-wrap">
              <table className="table">
                <thead><tr><th>日時</th><th>相手</th><th>操作</th><th>対象</th><th>経路</th><th /></tr></thead>
                <tbody>
                  {disclosureAccess.map((a) => (
                    <tr key={a.id}>
                      <td className="small">{formatDateTime(a.at)}</td>
                      <td><ExternalActor userId={a.who} /></td>
                      <td><Tag square>{a.action}</Tag></td>
                      <td className="small">{a.target}</td>
                      <td className="small">{a.channel}</td>
                      <td>{a.action === "ダウンロード" || a.action === "CSV 書き出し" ? <Button size="sm" variant="ghost" onClick={() => setRecallFor(a.id)}>訂正・回収を依頼</Button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card flush table-wrap">
              <table className="table">
                <thead><tr><th>日時</th><th>宛先</th><th>経路</th><th>内容</th><th>状態</th><th /></tr></thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id}>
                      <td className="small">{formatDateTime(d.at)}</td>
                      <td className="small">{d.to}</td>
                      <td className="small">{d.channel}</td>
                      <td className="small">{d.content}</td>
                      <td><Tag tone={DELIVERY_TAG[d.status].tone}>{DELIVERY_TAG[d.status].label}</Tag></td>
                      <td>{d.status === "delivered" ? <Button size="sm" variant="ghost" onClick={() => setRecallFor(d.id)}>訂正・回収を依頼</Button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ConfirmDialog
            open={stopOpen}
            onClose={() => setStopOpen(false)}
            onConfirm={() => { setStopOpen(false); setStopped(true); toast({ kind: "success", message: `${active?.id} の公開を停止しました。予約配信を取り消しました` }); }}
            title="公開を停止しますか？"
            message={
              <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                <span>相手の画面は案件名と招待内容だけになります。既存のセッションからの再取得、共有リンク、カレンダー購読、予約配信を止めます。すでに配信・取得された控えは取り消せないため、必要なら訂正・回収を依頼してください。</span>
                <TextArea label="理由" required rows={2} value={reason} onChange={setReason} placeholder="例: 契約変更の協議中のため" />
              </div>
            }
            confirmLabel="公開を停止"
            danger
          />
          <ConfirmDialog
            open={recallFor !== null}
            onClose={() => setRecallFor(null)}
            onConfirm={() => { setRecallFor(null); toast({ kind: "success", message: "案件窓口に訂正・回収の連絡を依頼しました" }); }}
            title="訂正・回収を依頼しますか？"
            message={`${recallFor ?? ""} で相手に渡った控えについて、案件窓口から相手へ訂正の連絡と削除のお願いを送ります。文面は送信前に確認できます。`}
            confirmLabel="窓口に依頼"
          />
        </>
      )}
    </ProjectLayout>
  );
}

function disclosureDisclosedCount(ds: { status: string }[]) {
  return ds.filter((d) => d.status === "cancelled").length;
}
