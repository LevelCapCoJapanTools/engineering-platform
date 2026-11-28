// 画面ID: M-07 優先順位とシナリオ比較
import { useMemo, useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { DECISION_STATUS } from "../../lib/vocab";
import { formatDateTime, yenM } from "../../lib/format";
import { DEFAULT_WEIGHTS, PRIORITY_AXES, priorityHistory, priorityItems, scenarios } from "../../mocks/investment";
import type { PriorityAxis } from "../../mocks/investment";
import { AppLayout, Banner, Button, crumbs, EmptyState, ErrorState, IdLink, Modal, PageHeader, Section, Segmented, Skeleton, StatusBadge, Tag, TextArea, useToast } from "../../ui";
import { RoleNote, ScoreDots, userName } from "./parts";
import { AllocationOptions } from "../orders/embeds";

function score(scores: Record<PriorityAxis, number>, weights: Record<PriorityAxis, number>) {
  let total = 0;
  let max = 0;
  for (const a of PRIORITY_AXES) {
    const v = a.higherIsBetter ? scores[a.key] : 6 - scores[a.key];
    total += v * weights[a.key];
    max += 5 * weights[a.key];
  }
  return max === 0 ? 0 : Math.round((total / max) * 100);
}

export function Priorities() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [weights, setWeights] = useState<Record<PriorityAxis, number>>(DEFAULT_WEIGHTS);
  const [view, setView] = useState(state === "scenario" ? "scenario" : state === "allocation" ? "allocation" : "compare");
  const [scenario, setScenario] = useState("B");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);

  const ranked = useMemo(() => priorityItems.map((p) => ({ ...p, score: score(p.scores, weights) })).sort((a, b) => b.score - a.score), [weights]);
  const changed = ranked.some((p, i) => priorityItems.find((x) => x.id === p.id)!.rank !== i + 1) || state === "changed";
  const sc = scenarios.find((s) => s.key === scenario)!;
  const trail = crumbs(org, undefined, { label: "優先順位" });

  if (state === "loading") return <AppLayout org={org} active="priorities" breadcrumb={trail}><Skeleton /></AppLayout>;
  if (state === "error") return <AppLayout org={org} active="priorities" breadcrumb={trail}><ErrorState /></AppLayout>;

  return (
    <AppLayout org={org} active="priorities" breadcrumb={trail}>
      <PageHeader
        title="優先順位とシナリオ比較"
        description="進行中の案件と審議中の事業ケースを共通の軸で比べ、限られた予算・要員をどこに使うかを判断します。順位の変更は経営判断として記録されます。"
        actions={<Button variant="primary" icon="check" disabled={!changed} disabledReason="現在の順位から変更がありません" onClick={() => setOpen(true)}>順位の変更を判断する</Button>}
        tabs={<Segmented value={view} onChange={setView} options={[{ value: "compare", label: "共通軸で比較" }, { value: "scenario", label: "シナリオ比較" }, { value: "allocation", label: "配分案（外注・分割・延期）" }, { value: "history", label: "順位変更の記録" }]} />}
      />
      {state === "empty" ? (
        <div className="card"><EmptyState icon="sort" title="比較できる案件がありません" description="プロジェクトを作成するか、事業ケースを登録すると比較できます。" action={<Button to={paths.intake(org)}>案件受付へ</Button>} /></div>
      ) : view === "compare" ? (
        <div className="stack">
          <RoleNote>評点は PM・事業責任者が案件ごとに登録した値です（1〜5）。リスク・費用・期間・能力制約は小さいほど有利として計算します。重みを変えても、判断として記録するまで順位は確定しません。</RoleNote>
          <div className="grid main-side">
            <Section title="比較表" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>順位</th>
                      <th>案件</th>
                      {PRIORITY_AXES.map((a) => <th key={a.key} title={a.help}>{a.label}</th>)}
                      <th style={{ textAlign: "right" }}>総合</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((p, i) => {
                      const prev = priorityItems.find((x) => x.id === p.id)!.rank;
                      return (
                        <tr key={p.id}>
                          <td>
                            <span className="row nowrap" style={{ ["--gap" as string]: "4px" }}>
                              <strong>{i + 1}</strong>
                              {prev !== i + 1 ? <Tag tone={prev > i + 1 ? "pass" : "warn"} square>{prev > i + 1 ? "↑" : "↓"}{Math.abs(prev - (i + 1))}</Tag> : null}
                            </span>
                          </td>
                          <td>
                            <span className="stack" style={{ ["--gap" as string]: "2px" }}>
                              <span className="strong">{p.name}</span>
                              <span className="tiny muted">{p.kind === "case" ? "事業ケース（審議中）" : "進行中"}{p.note ? `・${p.note}` : ""}</span>
                            </span>
                          </td>
                          {PRIORITY_AXES.map((a) => <td key={a.key}><ScoreDots value={p.scores[a.key]} invert={!a.higherIsBetter} label={a.label} /></td>)}
                          <td style={{ textAlign: "right" }} className="strong">{p.score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="重み" sub="0〜5。判断の前提として記録されます" actions={<Button size="sm" variant="ghost" icon="refresh" onClick={() => setWeights(DEFAULT_WEIGHTS)}>既定に戻す</Button>}>
              <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                {PRIORITY_AXES.map((a) => (
                  <label key={a.key} className="pf-weight small">
                    <span>{a.label}</span>
                    <input type="range" min={0} max={5} value={weights[a.key]} onChange={(e) => setWeights((w) => ({ ...w, [a.key]: Number(e.target.value) }))} aria-label={`${a.label}の重み`} />
                    <span className="strong">{weights[a.key]}</span>
                  </label>
                ))}
              </div>
            </Section>
          </div>
          {changed ? <Banner tone="info" title="重みの変更で順位が変わりました">影響（遅れるマイルストーン、要員の競合）はシナリオ比較で確認してから判断してください。</Banner> : null}
        </div>
      ) : view === "allocation" ? (
        <AllocationOptions org={org} />
      ) : view === "scenario" ? (
        <div className="stack">
          <Segmented value={scenario} onChange={setScenario} options={scenarios.map((s) => ({ value: s.key, label: `シナリオ ${s.key}` }))} />
          <div className="grid cols-3">
            {scenarios.map((s) => (
              <button key={s.key} type="button" className={`pf-option${s.key === scenario ? " recommended" : ""}`} onClick={() => setScenario(s.key)} style={{ textAlign: "left", background: "var(--surface)", cursor: "pointer" }}>
                <span className="row between"><strong className="small">{s.name}</strong>{s.recommended ? <Tag tone="primary" square>現行</Tag> : null}</span>
                <span className="small muted">{s.description}</span>
                <span className="small">追加費用 <strong>{s.extra_cost ? yenM(s.extra_cost) : "なし"}</strong>・遅れるマイルストーン <strong>{s.impacts.filter((x) => x.days > 0).length}</strong> 件・競合 <strong>{s.conflicts.length}</strong> 件</span>
              </button>
            ))}
          </div>
          <Section title={`${sc.name} の影響`}>
            <div className="stack">
              <div>
                <h3 className="small strong" style={{ margin: "0 0 6px" }}>順位</h3>
                <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>{sc.order.map((id) => <li key={id}>{priorityItems.find((p) => p.id === id)?.name}</li>)}</ol>
              </div>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>影響を受けるマイルストーン</th><th>内容</th><th style={{ textAlign: "right" }}>ずれ</th></tr></thead>
                  <tbody>
                    {sc.impacts.map((m) => (
                      <tr key={m.milestone}>
                        <td className="strong small">{m.milestone}</td>
                        <td className="small">{m.change}</td>
                        <td style={{ textAlign: "right" }}>{m.days > 0 ? <Tag tone="fail" square>+{m.days}日</Tag> : <Tag square>なし</Tag>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="small strong" style={{ margin: "0 0 6px" }}>要員の競合</h3>
                {sc.conflicts.length ? <ul className="small" style={{ margin: 0, paddingLeft: 20 }}>{sc.conflicts.map((c) => <li key={c}>{c}</li>)}</ul> : <p className="small muted" style={{ margin: 0 }}>競合はありません</p>}
              </div>
              <div className="row">
                <Button icon="users" to={paths.capacity(org)}>要員・予算の詳細</Button>
                <Button icon="map" to={paths.roadmap(org)}>ロードマップで見る</Button>
              </div>
              <p className="tiny muted" style={{ margin: 0 }}>影響は計画管理（GitHub Projects ほか）から同期した日付と依存関係から求めた見込みです。顧客との確約日を超える場合は、PM と顧客の合意が別途必要です。</p>
            </div>
          </Section>
        </div>
      ) : (
        <Section title="順位変更の記録" flush>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>記録</th><th>日時</th><th>内容</th><th>判断者</th><th>判断</th></tr></thead>
              <tbody>
                {priorityHistory.map((h) => (
                  <tr key={h.id}>
                    <td className="mono small">{h.id}</td>
                    <td className="small">{formatDateTime(h.at)}</td>
                    <td className="small">{h.summary}</td>
                    <td className="small">{userName(h.decider)}</td>
                    <td><span className="row nowrap" style={{ ["--gap" as string]: "6px" }}><IdLink id={h.decision} to={paths.decision(org, h.decision)} /><StatusBadge vocab={DECISION_STATUS[h.status]} size="sm" /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="順位の変更を判断する"
        description="変更後の順位、重み、理由を経営判断として記録し、関係する PM と事業部長に通知します。"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>キャンセル</Button>
            <Button variant="primary" icon="check" onClick={() => { setTried(true); if (reason.trim()) { setOpen(false); toast({ kind: "success", message: "順位の変更を判断ログに記録しました（DEC-0035）" }); } }}>判断を記録</Button>
          </>
        }
      >
        <div className="stack">
          <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>{ranked.map((p) => <li key={p.id}>{p.name}（{p.score}）</li>)}</ol>
          <TextArea label="理由" required rows={3} value={reason} onChange={setReason} error={tried && !reason.trim() ? "理由を入力してください" : undefined} placeholder="例: 顧客との確約日を守るため" />
          <p className="tiny muted" style={{ margin: 0 }}>計画管理の正本（GitHub Projects ほか）の日程は自動で書き換えません。PM が正本を更新すると、ここに反映されます。</p>
        </div>
      </Modal>
    </AppLayout>
  );
}
