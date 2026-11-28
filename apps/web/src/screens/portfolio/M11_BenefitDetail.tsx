// 画面ID: M-11 便益の詳細
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDate, yen } from "../../lib/format";
import { businessCases, decisions } from "../../mocks/portfolio";
import { benefits } from "../../mocks/investment";
import { AppLayout, Banner, Button, crumbs, DetailLayout, EmptyState, ErrorState, IdLink, KeyValueList, MetaSection, PageHeader, Section, Skeleton, Tag, useToast } from "../../ui";
import { ManualSourceTag, RoleNote, Sparkline, userName } from "./parts";
import { BENEFIT_STATUS, NEXT_DECISION, kpiProgress } from "./M10_Benefits";

export function BenefitDetail({ id }: { id: string }) {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const b = benefits.find((x) => x.id === id) ?? benefits[0];
  const bc = businessCases.find((c) => c.id === b.case_id);
  const dec = decisions.find((d) => d.id === b.decision_id);
  const [requested, setRequested] = useState(false);
  const trail = crumbs(org, undefined, { label: "便益・成果", to: paths.benefits(org) }, { label: b.id });

  if (state === "loading") return <AppLayout org={org} active="benefits" breadcrumb={trail}><Skeleton variant="detail" /></AppLayout>;
  if (state === "error") return <AppLayout org={org} active="benefits" breadcrumb={trail}><ErrorState /></AppLayout>;
  const kpis = state === "notMeasured" ? b.kpis.map((k) => ({ ...k, actual: undefined, measured_at: undefined, series: [] })) : b.kpis;

  return (
    <AppLayout org={org} active="benefits" breadcrumb={trail}>
      <PageHeader
        id={b.id}
        title={b.title}
        status={<Tag tone={BENEFIT_STATUS[b.status].tone} square>{BENEFIT_STATUS[b.status].label}</Tag>}
        description={`期待: ${b.expected}`}
        actions={dec ? <Button variant="primary" icon="inbox" to={paths.decision(org, dec.id)}>次の判断へ（{dec.id}）</Button> : <Button icon="flag" onClick={() => { setRequested(true); toast({ kind: "success", message: "スポンサーに見直しの審議を依頼しました" }); }} disabled={requested} disabledReason="依頼済みです">見直しを依頼</Button>}
      />
      <DetailLayout
        main={
          <div className="stack">
            {b.status === "behind" && state !== "notMeasured" ? <Banner tone="warn" title="実績が投資時の想定を下回っています">次の判断（{formatDate(b.next_review)}）で、継続・方針変更・終了を決めてください。</Banner> : null}
            {kpis.map((k) => {
              const prog = kpiProgress(k);
              return (
                <Section key={k.name} title={k.name} sub={k.higherIsBetter ? "大きいほど良い" : "小さいほど良い"}>
                  <div className="pf-kpi">
                    <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                      <KeyValueList cols={2} items={[
                        { label: "基準値（投資前）", value: `${k.baseline}${k.unit}` },
                        { label: "期待値（目標）", value: `${k.target}${k.unit}` },
                        { label: "実績値", value: k.actual !== undefined ? <strong>{k.actual}{k.unit}</strong> : <span className="muted">未測定</span> },
                        { label: "目標に対する進捗", value: prog !== undefined ? <Tag tone={prog >= 100 ? "pass" : prog >= 60 ? "warn" : "fail"} square>{prog}%</Tag> : "—" },
                        { label: "確認日", value: k.measured_at ? formatDate(k.measured_at) : "—" },
                      ]} />
                      {k.source_kind === "manual" ? <ManualSourceTag>{k.source}</ManualSourceTag> : <span className="source-tag"><span className="tiny muted">出典</span><Tag square icon="refresh">同期</Tag><span className="tiny muted">{k.source}</span></span>}
                    </div>
                    <div className="stack" style={{ ["--gap" as string]: "4px", alignItems: "flex-start" }}>
                      <span className="tiny muted">推移（点線は目標）</span>
                      <Sparkline series={k.series} target={k.target} label={`${k.name}の推移`} />
                    </div>
                  </div>
                </Section>
              );
            })}
            {kpis.every((k) => k.actual === undefined) ? <div className="card"><EmptyState icon="target" title="まだ測定値がありません" description="測定の開始日と出典を担当者に確認してください。リリース後に測定する指標もあります。" /></div> : null}
            <Section title="投資時の想定との比較">
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <span className="small muted">事業ケース {b.case_id} の前提</span>
                <ul className="small" style={{ margin: 0, paddingLeft: 20 }}>{b.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
              </div>
            </Section>
          </div>
        }
        side={
          <>
            <MetaSection title="投資">
              <KeyValueList stacked items={[
                { label: "投資額", value: yen(b.invested) },
                { label: "スポンサー", value: userName(b.sponsor) },
                { label: "事業ケース", value: bc ? <IdLink id={bc.id} to={paths.businessCase(org, bc.id)} title={bc.title} /> : <span className="mono small">{b.case_id}</span> },
                { label: "プロジェクト", value: b.project ? <IdLink id={b.project} to={paths.project(org, b.project)} /> : "—" },
              ]} />
            </MetaSection>
            <MetaSection title="次の判断">
              <KeyValueList stacked items={[
                { label: "見直し日", value: formatDate(b.next_review) },
                { label: "現在の見込み", value: NEXT_DECISION[b.next_decision] },
                { label: "経営判断", value: dec ? <IdLink id={dec.id} to={paths.decision(org, dec.id)} title={dec.title} /> : "未起票" },
              ]} />
            </MetaSection>
            <RoleNote>判断: 追加投資・方針変更・終了（経営層）／実務: 利用率・品質・顧客反応の測定（プロダクト・運用担当）。</RoleNote>
          </>
        }
      />
    </AppLayout>
  );
}
