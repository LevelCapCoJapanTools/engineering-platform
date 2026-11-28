// 画面ID: M-08 要員・予算の配分
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDateTime, yen, yenM } from "../../lib/format";
import { projectBySlug } from "../../mocks/core";
import { connectors, decisions, projectHealth } from "../../mocks/portfolio";
import { CAPACITY_MONTHS, ORG_BUDGET_CAP, budgetSource, capacityRoles, outsourcingOptions } from "../../mocks/investment";
import { AppLayout, Banner, Button, crumbs, EmptyState, ErrorState, IdLink, PageHeader, Section, Segmented, Skeleton, SourceTag, StatCard, Tag } from "../../ui";
import { ManualSourceTag, MiniBar, RoleNote, userName } from "./parts";
import { OutsourcingAllotments } from "../orders/embeds";

const monthLabel = (m: string) => `${Number(m.slice(5, 7))}月`;

export function Capacity() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [view, setView] = useState("capacity");
  const planning = connectors.find((c) => c.id === "con-ghp")!;
  const trail = crumbs(org, undefined, { label: "要員・予算" });

  if (state === "loading") return <AppLayout org={org} active="capacity" breadcrumb={trail}><Skeleton /></AppLayout>;
  if (state === "error") return <AppLayout org={org} active="capacity" breadcrumb={trail}><ErrorState /></AppLayout>;

  const totals = capacityRoles.map((r) => {
    const demand = CAPACITY_MONTHS.map((_, i) => r.demand.reduce((n, d) => n + d.values[i], 0));
    return { ...r, demandTotal: demand };
  });
  const shortages = totals.flatMap((r) => r.demandTotal.map((d, i) => ({ role: r.role, month: CAPACITY_MONTHS[i], gap: d - r.supply[i] })).filter((x) => x.gap > 0));
  const budget = projectHealth.reduce((n, p) => n + p.budget, 0);
  const actual = projectHealth.reduce((n, p) => n + p.actual_cost, 0);
  const forecast = projectHealth.reduce((n, p) => n + p.forecast_cost, 0);
  const pending = decisions.find((d) => d.id === "DEC-0032")!;

  return (
    <AppLayout org={org} active="capacity" breadcrumb={trail}>
      <PageHeader
        title="要員・予算の配分"
        description="役割別・月別の必要量と供給量、予算の消費と予測を案件横断で比べます。具体的な担当者の割当は PM・部門責任者が計画管理で行います。"
        tabs={<Segmented value={view} onChange={setView} options={[{ value: "capacity", label: "要員（役割別）" }, { value: "budget", label: "予算" }]} />}
      />
      <div className="stack">
        <Banner tone="info" title="個人の稼働監視には使いません">役割ごと・月ごとの人月の集計だけを表示します。個人ごとの稼働時間や作業内容は取り込みません。</Banner>
        {state === "empty" ? (
          <div className="card"><EmptyState icon="users" title="要員計画のデータがありません" description="計画管理（GitHub Projects、Jira 等）でロールと見積り工数を設定すると、ここに集計されます。" action={<Button to={paths.connectors(org)}>連携と同期へ</Button>} /></div>
        ) : view === "capacity" ? (
          <>
            <div className="row between">
              <SourceTag source={{ provider: planning.provider, label: "ロール・見積り工数", synced_at: planning.last_success_at, status: planning.status }} />
              <span className="tiny muted">旧基幹データ移行（Jira）は再認可待ちのため 11/24 時点の値です</span>
            </div>
            <div className="grid auto-fit">
              <StatCard label="不足する月・ロール" icon="alert" value={shortages.length} unit="件" delta={shortages.map((s) => `${monthLabel(s.month)} ${s.role}`).join("、") || "なし"} tone={shortages.length ? "danger" : "good"} />
              <StatCard label="キーパーソン依存" icon="user" value={capacityRoles.filter((r) => r.keyPerson).length} unit="件" delta="設計者（基幹系）" tone="warn" />
              <StatCard label="判断待ち" icon="inbox" value={1} unit="件" delta="外部委託の追加（DEC-0032）" to={paths.decision(org, pending.id)} tone="warn" />
            </div>
            <Section title="役割別の必要量と供給量（人月）" sub="棒は必要量、縦線は供給量。必要量が供給を超える月は赤" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>ロール</th>{CAPACITY_MONTHS.map((m) => <th key={m}>{monthLabel(m)}</th>)}</tr></thead>
                  <tbody>
                    {totals.map((r) => (
                      <tr key={r.role}>
                        <td>
                          <span className="stack" style={{ ["--gap" as string]: "2px" }}>
                            <span className="strong">{r.role}</span>
                            {r.keyPerson ? <Tag tone="warn" square icon="user">{r.keyPerson}</Tag> : null}
                          </span>
                        </td>
                        {r.demandTotal.map((d, i) => {
                          const over = d > r.supply[i];
                          return (
                            <td key={i}>
                              <span className="pf-cap-cell">
                                <MiniBar value={d} max={Math.max(d, r.supply[i]) * 1.15} marker={r.supply[i]} tone={over ? "fail" : d / r.supply[i] > 0.9 ? "warn" : "pass"} label={`${r.role} ${monthLabel(CAPACITY_MONTHS[i])}: 必要 ${d} / 供給 ${r.supply[i]}`} />
                                <span className="tiny">必要 <strong>{d}</strong> / 供給 {r.supply[i]}{over ? <span className="text-fail">（{(d - r.supply[i]).toFixed(1)} 不足）</span> : null}</span>
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="案件間の競合" sub="不足する月の内訳（案件ごとの必要量）" flush>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>ロール・月</th>{projectHealth.map((p) => <th key={p.slug}>{projectBySlug(p.slug).name}</th>)}</tr></thead>
                  <tbody>
                    {shortages.map((s) => {
                      const role = capacityRoles.find((r) => r.role === s.role)!;
                      const idx = CAPACITY_MONTHS.indexOf(s.month);
                      return (
                        <tr key={`${s.role}-${s.month}`}>
                          <td className="strong small">{s.role}・{monthLabel(s.month)}<span className="text-fail tiny">（{s.gap.toFixed(1)} 不足）</span></td>
                          {projectHealth.map((p) => <td key={p.slug} className="small">{role.demand.find((d) => d.project === p.slug)?.values[idx] ?? 0}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="外部委託の選択肢" sub="費用と立上げ期間。採否は経営判断として記録します" actions={<Button size="sm" variant="primary" to={paths.decision(org, pending.id)}>DEC-0032 で判断する</Button>} flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>委託先</th><th>ロール</th><th>規模</th><th style={{ textAlign: "right" }}>費用</th><th>立上げ</th><th>補足</th></tr></thead>
                  <tbody>
                    {outsourcingOptions.map((o) => (
                      <tr key={o.id}>
                        <td className="strong small">{o.name}</td>
                        <td className="small">{o.role}</td>
                        <td className="small">{o.amount}</td>
                        <td style={{ textAlign: "right" }}>{yenM(o.cost)}</td>
                        <td className="small">{o.lead}</td>
                        <td className="small muted">{o.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <RoleNote>判断: 要員の追加・採用・外部委託、案件間の重大な競合の解消（経営層）／実務: 具体的な担当者・休暇・交代の調整（PM・部門責任者が計画管理で実施）。</RoleNote>
          </>
        ) : (
          <>
            <div className="row between">
              <ManualSourceTag>{budgetSource.label}・{formatDateTime(budgetSource.updated_at)} 更新（{userName(budgetSource.by)}）</ManualSourceTag>
              <span className="tiny muted">会計システムとは未連携です。手入力の値は更新日を確認してください</span>
            </div>
            <div className="grid auto-fit">
              <StatCard label="承認済み予算（4案件）" icon="creditCard" value={yenM(budget)} delta={`組織の上限 ${yenM(ORG_BUDGET_CAP)}`} />
              <StatCard label="消費（実績）" icon="barChart" value={yenM(actual)} delta={`予算の ${Math.round((actual / budget) * 100)}%`} />
              <StatCard label="完了時の予測" icon="trendingUp" value={yenM(forecast)} delta={`予算差 ${forecast - budget > 0 ? "+" : ""}${yenM(forecast - budget)}`} tone={forecast > budget ? "warn" : "good"} />
            </div>
            {forecast > budget ? <Banner tone="warn" title="予測が承認済み予算を超えています">受発注システム刷新で 220 万円の超過予測です。追加費用は変更要求（CR-0004）とあわせて判断してください。</Banner> : null}
            <OutsourcingAllotments org={org} />
            <Section title="案件別の予算・消費・予測" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>案件</th><th style={{ textAlign: "right" }}>予算</th><th style={{ textAlign: "right" }}>消費</th><th style={{ textAlign: "right" }}>予測</th><th>消費と予測</th><th>差</th></tr></thead>
                  <tbody>
                    {projectHealth.map((p) => {
                      const diff = p.forecast_cost - p.budget;
                      return (
                        <tr key={p.slug}>
                          <td><span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{projectBySlug(p.slug).name}</span><span className="tiny muted">スポンサー {userName(p.sponsor_id)}</span></span></td>
                          <td style={{ textAlign: "right" }}>{yen(p.budget)}</td>
                          <td style={{ textAlign: "right" }}>{yen(p.actual_cost)}</td>
                          <td style={{ textAlign: "right" }}>{yen(p.forecast_cost)}</td>
                          <td style={{ minWidth: 140 }}><MiniBar value={p.actual_cost} max={Math.max(p.budget, p.forecast_cost)} marker={p.budget} tone={p.forecast_cost > p.budget ? "warn" : "pass"} label={`消費 ${yenM(p.actual_cost)} / 予算 ${yenM(p.budget)}`} /></td>
                          <td>{diff > 0 ? <Tag tone="fail" square>+{yenM(diff)}</Tag> : <Tag tone="pass" square>{yenM(diff)}</Tag>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
            <p className="small muted" style={{ margin: 0 }}>関連する判断: <IdLink id="DEC-0031" to={paths.decision(org, "DEC-0031")} title="CR-0004 の追加費用の承認" />、<IdLink id="DEC-0032" to={paths.decision(org, "DEC-0032")} title="外部委託 2名の追加" /></p>
          </>
        )}
      </div>
    </AppLayout>
  );
}
