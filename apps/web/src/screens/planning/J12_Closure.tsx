// 画面ID: J-12 終了・引継ぎ
// 完了条件、未解決事項、顧客受入、保守引継ぎ、教訓、最終証跡のクローズを確認する。
// 終了の承認は経営層（案件スポンサー）が行い、引継ぎ・教訓の作成は現場が正本で行う。
import { useState } from "react";
import {
  Banner,
  Button,
  ChecklistPanel,
  ConfirmDialog,
  ErrorState,
  ExternalActor,
  IdLink,
  PageHeader,
  ProjectLayout,
  ResponsibilitySplit,
  Section,
  Skeleton,
  StatusBadge,
  Tag,
  Toggle,
  useToast,
} from "../../ui";
import type { ChecklistItem } from "../../ui";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { EXCEPTION_STATUS, RISK_STATUS } from "../../lib/vocab";
import { exceptions, risks } from "../../mocks/core";
import { DOC_SOURCE, closureCriteria, deliverables, handoverItems, lessons } from "../../mocks/planning";
import { handoverAcceptances, knownIssuesForOps, operationsHandover, unsettledTrades } from "../../mocks/delivery";
import { SourceBar, orgOf, projectOf } from "./shared";

export const J12_STATES = ["進行中（既定）", "顧客受入済み・未引継ぎあり", "終了の承認待ち", "終了済み", "読み込み中", "取得失敗"];

const HANDOVER_STATE: Record<string, { label: string; tone: "neutral" | "info" | "pass" }> = {
  notStarted: { label: "未着手", tone: "neutral" },
  draft: { label: "作成中", tone: "info" },
  done: { label: "完了", tone: "pass" },
};

export function J12Closure({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const pr = projectOf(params);
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [reuse, setReuse] = useState<Record<string, boolean>>(Object.fromEntries(lessons.map((l) => [l.id, l.reuse])));
  const allDone = state === "終了の承認待ち" || state === "終了済み";
  const criteria: ChecklistItem[] = closureCriteria.map((c) => ({ id: c.id, title: c.title, state: allDone ? "ok" : c.state, detail: allDone ? "確認済み" : c.detail, actor: c.id === "CLS-6" ? "system" : "human" }));
  const remaining = criteria.filter((c) => c.state !== "ok").length;
  const openRisks = allDone ? [] : risks.filter((r) => r.status !== "done");
  const activeExceptions = allDone ? [] : exceptions.filter((e) => e.status === "active");
  const finalDelivery = deliverables.find((d) => d.id === "DLV-07")!;
  const handover = allDone ? handoverItems.map((h) => ({ ...h, state: "done" })) : handoverItems;
  // 運用への引受（改修 30）。顧客受入済みでも、未引継ぎの事項は終了前に見えるようにする
  const accepted = state !== "進行中（既定）";
  const acceptances = allDone ? handoverAcceptances.map((h) => ({ ...h, state: "accepted" as const, at: h.at ?? "2027-03-15" })) : handoverAcceptances;
  const pendingHandover = acceptances.filter((h) => h.state !== "accepted").length;
  const unsettled = allDone ? [] : unsettledTrades;

  return (
    <ProjectLayout org={org} project={pr} active="closure" trail={[{ label: "終了・引継ぎ" }]}>
      <PageHeader
        title="終了・引継ぎ"
        description="完了条件、未解決事項、顧客受入、保守への引継ぎ、教訓、最終証跡を確認し、案件を閉じます。"
        status={state === "終了済み" ? <Tag tone="pass" icon="check">終了済み</Tag> : undefined}
        actions={
          <Button variant="primary" icon="archive" disabled={remaining > 0 || pendingHandover > 0 || unsettled.length > 0 || state === "終了済み"} disabledReason={state === "終了済み" ? "すでに終了しています" : remaining > 0 ? `完了条件が ${remaining} 件残っています` : pendingHandover > 0 ? `運用への引継ぎが ${pendingHandover} 件残っています` : `未決済の取引が ${unsettled.length} 件あります`} onClick={() => setConfirm(true)}>
            終了を承認
          </Button>
        }
      />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "取得失敗" ? (
        <ErrorState />
      ) : (
        <>
          {state === "終了済み" ? (
            <Banner tone="pass" title="この案件は 2027-03-18 に終了しました">最終 Evidence Manifest（MAN-0021）を追記専用の保管先に保管しました。記録は保持期間中、削除・上書きできません。</Banner>
          ) : state === "顧客受入済み・未引継ぎあり" ? (
            <Banner tone="warn" title={`顧客の受入は済んでいますが、運用への引継ぎが ${pendingHandover} 件残っています`}>引受の記録がそろうまで案件を終了できません。未決済の取引も {unsettled.length} 件あります。</Banner>
          ) : remaining > 0 ? (
            <Banner tone="info" title={`終了まで、完了条件があと ${remaining} 件あります`}>最終納入（予定 2027-02-26）後に、残りの条件を確認します。</Banner>
          ) : null}
          <div className="grid main-side">
            <div className="stack">
              <Section title="完了条件">
                <ChecklistPanel items={criteria} />
              </Section>
              <Section title="未解決事項" sub="終了前に完了・移管・受容のいずれかが必要です" flush>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>ID</th><th>内容</th><th>状態</th><th>対応</th></tr></thead>
                    <tbody>
                      {openRisks.map((r) => (
                        <tr key={r.id}>
                          <td><IdLink id={r.id} to={paths.risk(org, pr, r.id)} /></td>
                          <td className="small">{r.title}</td>
                          <td><StatusBadge vocab={RISK_STATUS[r.status]} size="sm" /></td>
                          <td><ExternalActor userId={r.owner_id} /></td>
                        </tr>
                      ))}
                      {activeExceptions.map((e) => (
                        <tr key={e.id}>
                          <td><IdLink id={e.id} to={paths.exception(org, pr, e.id)} /></td>
                          <td className="small">有効な例外</td>
                          <td><StatusBadge vocab={EXCEPTION_STATUS[e.status]} size="sm" /></td>
                          <td className="tiny muted">期限到来で再審査</td>
                        </tr>
                      ))}
                      {!openRisks.length && !activeExceptions.length ? <tr><td colSpan={4} className="small muted">未解決事項はありません。</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="保守への引継ぎ" flush>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>項目</th><th>作成者</th><th>引継ぎ先</th><th>状態</th></tr></thead>
                    <tbody>
                      {handover.map((h) => (
                        <tr key={h.id}>
                          <td className="small">{h.title}</td>
                          <td><ExternalActor userId={h.owner} /></td>
                          <td className="small">{h.to}</td>
                          <td><Tag square tone={HANDOVER_STATE[h.state].tone}>{HANDOVER_STATE[h.state].label}</Tag></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "10px 20px" }}><SourceBar source={DOC_SOURCE} note="引継ぎ資料は docs/handover/ で作成" /></div>
              </Section>
              <Section title="運用への引受" sub="運用先、保守期間、当番、終了後の照会の受付先">
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  <div className="row between"><span className="small muted">運用先</span><span className="small">{operationsHandover.operator}</span></div>
                  <div className="row between"><span className="small muted">保守期間</span><span className="small">{operationsHandover.maintenance.start.replace(/-/g, "/")}〜{operationsHandover.maintenance.end.replace(/-/g, "/")}（{operationsHandover.maintenance.contract}）</span></div>
                  <div className="row between"><span className="small muted">当番</span><span className="small">{operationsHandover.oncall}</span></div>
                  <div className="row between"><span className="small muted">終了後の照会</span><span className="small">{operationsHandover.inquiries}</span></div>
                </div>
              </Section>
              <Section title="手順・連絡先の引受記録" sub="渡した人と受け取った人、受け取った日を記録します" flush>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>項目</th><th>渡す人</th><th>受け取る人</th><th>状態</th></tr></thead>
                    <tbody>
                      {acceptances.map((h) => (
                        <tr key={h.item}>
                          <td className="small">{h.item}</td>
                          <td><ExternalActor userId={h.from} /></td>
                          <td className="small">{h.to}</td>
                          <td>{h.state === "accepted" ? <Tag tone="pass" icon="check">引受済み {h.at?.replace(/-/g, "/")}</Tag> : <Tag tone="warn" icon="clock">未引継ぎ</Tag>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="既知の問題（運用へ渡すもの）" flush>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>ID</th><th>内容</th><th>重要度</th><th>回避策</th></tr></thead>
                    <tbody>
                      {knownIssuesForOps.map((k) => (
                        <tr key={k.id}><td className="mono small">{k.id}</td><td className="small">{k.title}</td><td><Tag square>{k.severity}</Tag></td><td className="small">{k.workaround}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="未決済の取引" sub="受託者への発注で、検収・支払が終わっていないもの" flush>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>発注</th><th>状態</th><th>担当</th></tr></thead>
                    <tbody>
                      {unsettled.map((u) => (
                        <tr key={u.order_id}>
                          <td className="small"><Link to={paths.order(org, u.order_id)} className="mono">{u.order_id}</Link> {u.title}</td>
                          <td className="small">{u.state}</td>
                          <td><ExternalActor userId={u.owner} /></td>
                        </tr>
                      ))}
                      {!unsettled.length ? <tr><td colSpan={3} className="small muted">未決済の取引はありません。</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="教訓" sub="次の案件で再利用するものを選びます。再利用するものは案件受付のチェックリストに表示されます">
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  {lessons.map((l) => (
                    <div key={l.id} className="pl-decision">
                      <div className="row between">
                        <span className="strong" style={{ fontWeight: 500 }}>{l.title}</span>
                        <Tag square>{l.category}</Tag>
                      </div>
                      <div className="row between">
                        <span className="tiny muted">出典: {l.from}</span>
                        <Toggle label="次の案件で再利用" checked={reuse[l.id]} disabled={state === "終了済み"} onChange={(v) => { setReuse((x) => ({ ...x, [l.id]: v })); toast({ kind: "success", message: v ? "再利用する教訓に追加しました" : "再利用をやめました" }); }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
            <div className="stack">
              <Section title="責任の分担">
                <ResponsibilitySplit decide={<span className="small">案件の終了（案件スポンサー）</span>} act={<ExternalActor userId="u-sato" role="PM" />} note="完了条件の確認と引継ぎ資料の作成は PM と現場が行います" />
              </Section>
              <Section title="顧客受入">
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  <span className="small strong">{finalDelivery.title}</span>
                  <Tag square tone={accepted ? "pass" : "neutral"}>{accepted ? "受入済み" : "未提出"}</Tag>
                  {accepted && pendingHandover ? <Tag square tone="warn" icon="alert">未引継ぎ {pendingHandover}件</Tag> : null}
                  <Link to={paths.milestones(org, pr)} className="small">マイルストーン・納入物</Link>
                </div>
              </Section>
              <Section title="最終証跡">
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  <span className="small">最終リリースの Evidence Manifest を作成し、署名して追記専用の保管先に保管すると、証跡を閉じます。</span>
                  {state === "終了済み" ? <IdLink id="MAN-0021" to={paths.manifest(org, pr, "MAN-0021")} /> : <span className="tiny muted">最終リリース後に作成されます</span>}
                  <Link to={paths.auditExport(org, pr)} className="small">監査パックの出力</Link>
                </div>
              </Section>
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => toast({ kind: "success", message: "案件の終了を承認しました。判断を監査ログに記録しました" })}
        title="案件の終了を承認しますか？"
        message="承認すると、最終証跡を閉じ、以後の同期は読み取り専用の保管に切り替わります。判断者と日時は監査ログに残ります。"
        confirmLabel="終了を承認"
      />
    </ProjectLayout>
  );
}
