// 既存画面（M-01、M-07、M-08、M-12、J-10）に埋め込む「受託者への発注と採算」の表示。
import { useState } from "react";
import { paths } from "../../lib/paths";
import { yenM } from "../../lib/format";
import { calendarEvents } from "../../mocks/portfolio";
import {
  ALLOCATION_BASE_DATE,
  allocationOptions,
  allotments,
  costOf,
  freelancerDates,
  grossMargin,
  MOVE_SIMULATION,
  scheduleConflicts,
} from "../../mocks/orders";
import { AudienceTag, Banner, Button, IdLink, Section, Segmented, Tag, Toggle, useToast } from "../../ui";
import { fmt, InternalYen, projectName } from "./parts";

/** M-01: 案件ごとの外注原価・発注残・粗利見込（社内のみ） */
export function PortfolioCostCell({ slug }: { slug: string }) {
  const c = costOf(slug);
  if (!c) return <span className="muted small">—</span>;
  const g = grossMargin(c);
  return (
    <span className="stack" style={{ ["--gap" as string]: "2px" }}>
      <span className="small">外注 {yenM(c.inspected + c.ordered_uninspected)}<span className="tiny muted">（発注残 {yenM(c.ordered_uninspected)}）</span></span>
      <span className="tiny">粗利見込 {yenM(g.margin)}・{(g.rate * 100).toFixed(1)}%</span>
    </span>
  );
}

/** M-07: 外注追加・機能分割・延期の配分案を同じ基準日で比較する */
export function AllocationOptions({ org }: { org: string }) {
  const toast = useToast();
  const [pick, setPick] = useState("split");
  const o = allocationOptions.find((x) => x.key === pick)!;
  return (
    <Section title="配分案の比較（受発注システム刷新 v1.4.0）" sub={`基準日 ${fmt(ALLOCATION_BASE_DATE)} の計画・発注・稼働枠で再計算。採択前の案では、承認済みの計画と顧客との確約日は変わりません`} actions={<AudienceTag value="internal" />}>
      <div className="stack">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>案</th><th style={{ textAlign: "right" }}>追加費用</th><th>着手可能日</th><th>顧客確約への影響</th><th>主なリスク</th></tr></thead>
            <tbody>
              {allocationOptions.map((x) => (
                <tr key={x.key} className={x.key === pick ? "selected" : undefined} onClick={() => setPick(x.key)} style={{ cursor: "pointer" }}>
                  <td><span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong small">{x.name}</span><span className="tiny muted">{x.summary}</span></span></td>
                  <td style={{ textAlign: "right" }}>{x.cost ? <InternalYen value={x.cost} /> : <span className="small">0</span>}</td>
                  <td className="small">{x.start === "—" ? "—" : fmt(x.start)}</td>
                  <td className="small">
                    <span className="stack" style={{ ["--gap" as string]: "2px" }}>
                      {x.commitments.map((c) => (
                        <span key={c.label}>{c.kept ? <Tag tone="pass" square>維持</Tag> : <Tag tone="fail" square>変更が必要</Tag>} {c.label}: {fmt(c.committed)} → {c.result.replace(/-/g, "/")}</span>
                      ))}
                    </span>
                  </td>
                  <td className="tiny">{x.risks.join("／")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Banner tone="info" title={`${o.name} を選択中（試算）`}>
          この案を採用するまで、計画・発注・顧客の確約日は更新されません。採用は経営判断として記録し、顧客の合意と受託者との条件の再合意が必要な場合は案件窓口が回収します。
        </Banner>
        <div className="row">
          <Button variant="primary" icon="flag" onClick={() => toast({ kind: "success", message: `「${o.name}」の判断依頼を作成しました（判断期限 12/1）` })}>この案で判断を依頼</Button>
          <Button variant="ghost" to={paths.decision(org, "DEC-0033")} iconRight="arrowRight">関連する判断 DEC-0033</Button>
        </div>
      </div>
    </Section>
  );
}

/** M-08: 外注枠の決裁を、個別の依頼書・受諾・確定した稼働枠・見込原価に結び付ける */
export function OutsourcingAllotments({ org }: { org: string }) {
  return (
    <Section title="外注枠と依頼書の結び付き" sub="外注枠の決裁から、個別の依頼書・受諾・確定した稼働枠・見込原価までをたどれます" actions={<AudienceTag value="internal" />} flush>
      <div className="stack" style={{ padding: 16 }}>
        {allotments.map((a) => {
          const sum = (s: string) => a.lines.filter((l) => l.state === s).reduce((n, l) => n + l.amount, 0);
          const w = (v: number) => `${(v / a.cap) * 100}%`;
          const ins = sum("inspected");
          const acc = sum("accepted");
          const off = sum("offered");
          return (
            <div key={a.project} className="stack" style={{ ["--gap" as string]: "8px" }}>
              <div className="row between">
                <span className="strong small">{projectName(a.project)}</span>
                <span className="small">外注枠 <InternalYen value={a.cap} /> ・決裁 <IdLink id={a.decision} to={paths.decision(org, a.decision)} /></span>
              </div>
              <div className="ord-bar" aria-label="外注枠の消化">
                <span className="inspected" style={{ left: 0, width: w(ins) }} />
                <span className="accepted" style={{ left: w(ins), width: w(acc) }} />
                <span className="offered" style={{ left: `calc(${w(ins)} + ${w(acc)})`, width: w(off) }} />
              </div>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>依頼</th><th>状態</th><th>稼働枠</th><th style={{ textAlign: "right" }}>見込原価</th></tr></thead>
                  <tbody>
                    {a.lines.map((l) => (
                      <tr key={l.label}>
                        <td className="small">{l.order_id ? <IdLink id={l.order_id} to={paths.order(org, l.order_id)} /> : null} {l.label.replace(/^ORD-\d+ /, "")}</td>
                        <td>{l.state === "inspected" ? <Tag tone="pass" square>検収済み</Tag> : l.state === "accepted" ? <Tag tone="info" square>受諾済み</Tag> : l.state === "offered" ? <Tag tone="warn" square dashed>回答待ち</Tag> : <Tag square dashed>未割当</Tag>}</td>
                        <td className="small">{l.slot ?? "—"}</td>
                        <td style={{ textAlign: "right" }}><InternalYen value={l.amount} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        <div className="ord-legend tiny muted">
          <span><span className="ord-swatch inspected" />検収済み</span>
          <span><span className="ord-swatch accepted" />受諾済み（確定した稼働枠）</span>
          <span><span className="ord-swatch offered" />回答待ち（仮押さえ）</span>
          <span><span className="ord-swatch unassigned" />未割当</span>
        </div>
        <div className="row">
          <Button size="sm" to={paths.partners(org)}>外注候補と稼働枠</Button>
          <Button size="sm" variant="ghost" to={paths.orders(org)}>受託者への発注</Button>
        </div>
      </div>
    </Section>
  );
}

/** M-12・J-10: 日程の衝突から判断依頼を作る。受託者の回答期限・提出見込みも重ねる */
export function ScheduleConflicts({ org, project }: { org: string; project?: string }) {
  const toast = useToast();
  const [simulate, setSimulate] = useState(false);
  const [tab, setTab] = useState("conflicts");
  const conflicts = scheduleConflicts.filter((c) => !project || c.project === project);
  const dates = freelancerDates.filter((d) => !project || d.project === project);
  const ev = calendarEvents.find((e) => e.id === "CAL-01");
  const recordTag = (label: string, v: string) => (
    <Tag tone={v === "agreed" || v === "updated" ? "pass" : v === "none" ? "neutral" : "warn"} square>
      {label}: {v === "draft" ? "案" : v === "proposed" ? "提示中" : v === "pending" ? "未合意" : v === "agreed" ? "合意済み" : v === "updated" ? "更新済み" : "なし"}
    </Tag>
  );
  return (
    <Section
      title="日程の衝突と受託者の期限"
      sub="回答待ちやリリース枠の衝突から、影響する依頼・顧客との約束・代替日を示し、判断期限を逆算します"
      actions={<Segmented value={tab} onChange={setTab} options={[{ value: "conflicts", label: `衝突 ${conflicts.length}` }, { value: "freelancer", label: "受託者の期限" }]} />}
    >
      {tab === "conflicts" ? (
        <div className="stack">
          {!project ? (
            <Toggle
              label={`試算: ${ev?.title ?? "経営会議"} を ${fmt(MOVE_SIMULATION.from)} から ${fmt(MOVE_SIMULATION.to)} へ1日動かす`}
              checked={simulate}
              onChange={setSimulate}
              description="試算は表示だけで、カレンダー（正本）は変えません"
            />
          ) : null}
          {simulate ? (
            <Banner tone="warn" title="再調整が必要な案件: 1件">
              {MOVE_SIMULATION.affected.map((a) => `${projectName(a.project)} — ${a.reason}`).join("。")}。影響しない案件: {MOVE_SIMULATION.unaffected.map(projectName).join("、")}。
            </Banner>
          ) : null}
          {conflicts.length === 0 ? <p className="small muted" style={{ margin: 0 }}>日程の衝突はありません。</p> : null}
          {conflicts.map((c) => (
            <div key={c.id} className="ord-conflict">
              <div className="row between">
                <span className="strong small">{c.id} {c.title}</span>
                <span className="small">判断期限 <strong>{fmt(c.decision_due)}</strong></span>
              </div>
              <span className="small">{c.cause}</span>
              <span className="tiny muted">判断期限の根拠: {c.due_basis}</span>
              <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                <span className="tiny muted">影響する依頼</span>
                {c.orders.map((o) => <span key={o.id} className="small"><IdLink id={o.id} to={paths.order(org, o.id)} /> {o.label}</span>)}
                <span className="tiny muted">顧客・受託者との約束</span>
                <span className="small">{c.commitment.label}: {fmt(c.commitment.date)}</span>
                <span className="tiny muted">代替日</span>
                {c.alternatives.map((a) => <span key={a.label} className="small">{fmt(a.date)} — {a.label}</span>)}
              </div>
              <div className="ord-records">
                {recordTag("日程案", c.records.plan)}
                {recordTag("顧客の合意", c.records.customer)}
                {recordTag("正本の更新", c.records.source)}
              </div>
              <div className="row">
                {c.decision_id ? (
                  <Button size="sm" variant="primary" icon="flag" to={paths.decision(org, c.decision_id)}>判断依頼 {c.decision_id} を開く</Button>
                ) : (
                  <Button size="sm" variant="primary" icon="flag" onClick={() => toast({ kind: "success", message: `${c.id} の判断依頼を作成しました（判断期限 ${fmt(c.decision_due)}）` })}>判断を依頼する</Button>
                )}
                <Button size="sm" variant="ghost" to={paths.desk(org)}>窓口の対応を見る</Button>
              </div>
            </div>
          ))}
          <p className="tiny muted" style={{ margin: 0 }}>日程案・顧客の合意・正本（計画管理）の更新は別々に記録します。本サービスから計画管理への書き戻しはせず、更新の担当者に正本へのリンクを渡します。</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>日付</th><th>種類</th><th>内容</th><th>案件</th></tr></thead>
            <tbody>
              {dates.map((d) => (
                <tr key={d.label}>
                  <td className="small">{fmt(d.date)}</td>
                  <td>{d.kind === "reply" ? <Tag tone="warn" square>回答期限</Tag> : d.kind === "inspection" ? <Tag tone="info" square>検収期日</Tag> : <Tag tone="special" square dashed>提出見込み</Tag>}</td>
                  <td className="small"><IdLink id={d.order_id} to={paths.order(org, d.order_id)} /> {d.label.replace(/^ORD-\d+ /, "")}</td>
                  <td className="small">{projectName(d.project)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tiny muted" style={{ margin: "8px 0 0" }}>出典: 本サービスが発行した依頼・回答期限。受託者の個人の予定表は取り込みません。</p>
        </div>
      )}
    </Section>
  );
}
