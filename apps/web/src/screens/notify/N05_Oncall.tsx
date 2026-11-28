// 画面ID: N-05 オンコール当番
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { AppLayout, Banner, Button, crumbs, EmptyState, ErrorState, ExternalActor, PageHeader, Section, Skeleton, SourceTag, Tag, Timestamp } from "../../ui";
import { connectors } from "../../mocks/portfolio";
import { onCallShifts } from "../../mocks/notify";
import { OncallTabs, useOrg } from "./parts";
import { AckMethodsSection, CoverageSection } from "./oncall2";

export function N05Oncall() {
  const state = useScreenState();
  const org = useOrg();
  const pd = connectors.find((c) => c.provider === "pagerduty");
  const shifts = state === "未接続" ? [] : onCallShifts;
  const gaps = shifts.flatMap((s) => s.coverage_gaps.map((g) => ({ ...g, service: s.service })));
  const providerDown = state === "提供元の障害";

  return (
    <AppLayout org={org} active="oncall" breadcrumb={crumbs(org, undefined, { label: "オンコール" })}>
      <PageHeader
        title="オンコール当番"
        description="当番表とエスカレーションの正本はオンコール管理サービスです。ここでは参照だけを行い、変更は提供元で行います。プロジェクトの日程・経営会議のカレンダーとは別に管理します。"
        meta={pd ? <SourceTag source={{ provider: "pagerduty", synced_at: providerDown ? "2026-11-27T09:40:00+09:00" : pd.last_success_at, status: providerDown ? "failing" : pd.status }} /> : undefined}
        actions={<Button icon="external">PagerDuty で当番表を開く</Button>}
      />
      <OncallTabs org={org} active="oncall" />
      {state === "読み込み中" ? (
        <Skeleton variant="card" rows={3} />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : shifts.length === 0 ? (
        <div className="card">
          <EmptyState icon="phone" title="オンコール管理サービスが接続されていません" description="当番の参照とエスカレーションには、PagerDuty などの接続が必要です。チャットへの投稿だけでは、担当者が確認したことを保証できません。" action={<Button variant="primary" icon="plug" to={paths.connectorNew(org)}>オンコール管理を接続</Button>} />
        </div>
      ) : (
        <>
          {providerDown ? (
            <Banner tone="fail" title="オンコール管理サービスから当番を取得できません">
              50 分前の情報を表示しています。最新の当番は提供元で確認してください。新しいインシデントは代替経路（メール・Slack）で組織管理者にも通知しています。
            </Banner>
          ) : null}
          {gaps.length > 0 ? (
            <Banner tone="warn" title={`当番のカバー漏れが ${gaps.length} 件あります`}>
              {gaps.map((g, i) => <div key={i}>{g.service}: {g.reason}</div>)}
            </Banner>
          ) : null}
          {shifts.map((s) => (
            <Section key={s.service} title={s.service} sub={`エスカレーションポリシー: ${s.policy}`} actions={s.project ? <Tag square>案件 {s.project}</Tag> : <Tag square>基盤</Tag>}>
              <div className="stack">
                <div className="nt-shift">
                  <div>
                    <div className="tiny muted">一次担当（現在）</div>
                    <ExternalActor userId={s.primary.user_id} provider="pagerduty" handle={s.primary.user_id.replace("u-", "")} />
                    <div className="tiny muted">〜 <Timestamp at={s.primary.until} mode="absolute" /> · {s.primary.timezone}</div>
                    {s.primary.override ? <Tag tone="special" square>臨時交代</Tag> : null}
                  </div>
                  <div>
                    <div className="tiny muted">二次担当（現在）</div>
                    <ExternalActor userId={s.secondary.user_id} provider="pagerduty" handle={s.secondary.user_id.replace("u-", "")} />
                    <div className="tiny muted">〜 <Timestamp at={s.secondary.until} mode="absolute" /> · {s.secondary.timezone}</div>
                  </div>
                  <div>
                    <div className="tiny muted">次の一次担当</div>
                    <ExternalActor userId={s.next_primary.user_id} provider="pagerduty" handle={s.next_primary.user_id.replace("u-", "")} />
                    <div className="tiny muted"><Timestamp at={s.next_primary.from} mode="absolute" /> から</div>
                  </div>
                </div>
                {s.primary.override ? <p className="small muted">{s.primary.override}</p> : null}
                {s.coverage_gaps.length ? (
                  <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                    {s.coverage_gaps.map((g, i) => (
                      <div key={i} className="row small"><Tag tone="warn" square icon="alert">カバー漏れ</Tag><Timestamp at={g.from} mode="absolute" /> 〜 <Timestamp at={g.to} mode="absolute" /> · {g.reason}</div>
                    ))}
                  </div>
                ) : <span className="small muted">今後 30 日のカバー漏れはありません（夜間・休日を含む）。</span>}
              </div>
            </Section>
          ))}
          <p className="tiny muted">退職・無効化された人は、外部IDの対応付けから外れた時点で当番の警告に表示します。当番表からの削除は提供元で行います。</p>
          <CoverageSection />
          <AckMethodsSection />
        </>
      )}
    </AppLayout>
  );
}
