// 画面ID: B-04 外注候補と稼働枠
// 既存パートナーの技能と、本人が共有した稼働可能枠・単価（社内のみ）、仮押さえと受諾済みの枠。
// 個人の予定表は取り込まず、本人が共有した空き枠だけで判断する。個人の稼働監視には使わない。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { relativeTime } from "../../lib/format";
import { partners, slots } from "../../mocks/orders";
import type { Slot } from "../../mocks/orders";
import { AppLayout, Banner, Button, crumbs, EmptyState, ErrorState, IdLink, PageHeader, Section, Segmented, Skeleton, Tag, useToast } from "../../ui";
import { fmt, InternalOnly, InternalYen, projectName, userName } from "./parts";

const MONTHS = ["2026-12", "2027-01"];

export function B04Partners() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [month, setMonth] = useState("2026-12");
  const [list, setList] = useState<Slot[]>(state === "released" ? slots.map((s) => (s.id === "SLT-13" ? { ...s, kind: "released", note: "受託者が辞退したため枠を戻した" } : s)) : slots);
  const trail = crumbs(org, undefined, { label: "外注候補と稼働枠" });
  if (state === "loading") return <AppLayout org={org} active="partners" breadcrumb={trail}><Skeleton rows={4} /></AppLayout>;
  if (state === "error") return <AppLayout org={org} active="partners" breadcrumb={trail}><ErrorState /></AppLayout>;
  const rows = state === "empty" ? [] : partners;

  const usage = (name: string, m: string) => {
    const s = list.filter((x) => x.partner === name && x.month === m && x.kind !== "released");
    return { holds: s.filter((x) => x.kind === "hold").reduce((n, x) => n + x.days, 0), accepted: s.filter((x) => x.kind === "accepted").reduce((n, x) => n + x.days, 0) };
  };
  const overbooked = rows.filter((p) => {
    const shared = p.shared.find((x) => x.month === month)?.days ?? 0;
    const u = usage(p.name, month);
    return u.holds + u.accepted > shared;
  });

  return (
    <AppLayout org={org} active="partners" breadcrumb={trail}>
      <PageHeader
        title="外注候補と稼働枠"
        description="受託者本人が共有した稼働可能枠と、仮押さえ・受諾済みの枠を比べて依頼先を決めます。外注枠の範囲内の割当は、委任された事業部長が行います。"
        actions={<Button variant="primary" icon="send" to={paths.orderNew(org)}>依頼書を作成</Button>}
        tabs={<Segmented value={month} onChange={setMonth} options={MONTHS.map((m) => ({ value: m, label: `${Number(m.slice(5))}月` }))} />}
      />
      <InternalOnly>単価は社内のみです。稼働枠は本人が案件に共有した空き枠で、個人の予定表は取り込みません。個人の稼働監視や評価には使いません。</InternalOnly>
      {overbooked.length ? (
        <Banner tone="warn" title="仮押さえが共有された枠を超えています">
          {overbooked.map((p) => p.name).join("、")}: 同じ月の仮押さえと受諾済みの合計が、本人が共有した日数を超えています。どちらかの仮押さえを解除するか、本人に枠の追加を相談してください。
        </Banner>
      ) : null}
      {rows.length === 0 ? (
        <div className="card"><EmptyState icon="users" title="外注候補はまだいません" description="受託者を招待し、本人が稼働枠を共有すると表示されます。" /></div>
      ) : (
        <Section title={`${Number(month.slice(5))}月の稼働枠`} flush>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>候補</th><th>技能</th><th style={{ textAlign: "right" }}>単価／日（社内のみ）</th><th>共有された枠</th><th>受諾済み</th><th>仮押さえ</th><th>残り</th><th>共有日</th></tr></thead>
              <tbody>
                {rows.map((p) => {
                  const shared = p.shared.find((x) => x.month === month)?.days ?? 0;
                  const u = usage(p.name, month);
                  const left = shared - u.holds - u.accepted;
                  return (
                    <tr key={p.name}>
                      <td><span className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{p.name}</span><span className="tiny muted">{p.kind === "company" ? "会社" : "フリーエンジニア"}{p.status === "invited" ? "・招待中" : ""}</span></span></td>
                      <td><span className="row">{p.skills.map((s) => <Tag key={s} square>{s}</Tag>)}</span></td>
                      <td style={{ textAlign: "right" }}><InternalYen value={p.rate_per_day} /></td>
                      <td className="small">{shared ? `${shared} 日` : <span className="muted">共有なし</span>}</td>
                      <td className="small">{u.accepted} 日</td>
                      <td className="small">{u.holds} 日</td>
                      <td>{left < 0 ? <Tag tone="fail" square>{left} 日（超過）</Tag> : <span className="small">{left} 日</span>}</td>
                      <td className="tiny muted">{relativeTime(p.shared_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}
      <Section title="仮押さえと受諾済みの枠" sub="仮押さえは回答期限を過ぎるか辞退されると自動で枠に戻ります" flush>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>枠</th><th>候補</th><th>月</th><th>日数</th><th>種類</th><th>案件・発注</th><th>期限</th><th>割当者</th><th /></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="mono small">{s.id}</td>
                  <td className="small">{s.partner}</td>
                  <td className="small">{Number(s.month.slice(5))}月</td>
                  <td className="small">{s.days} 日</td>
                  <td>{s.kind === "accepted" ? <Tag tone="pass" square>受諾済み</Tag> : s.kind === "hold" ? <Tag tone="warn" square dashed>仮押さえ</Tag> : <Tag square>枠に戻した</Tag>}</td>
                  <td className="small"><span className="stack" style={{ ["--gap" as string]: "2px" }}><span>{projectName(s.project)}</span>{s.order_id ? <IdLink id={s.order_id} to={paths.order(org, s.order_id)} /> : null}{s.note ? <span className="tiny muted">{s.note}</span> : null}</span></td>
                  <td className="small">{fmt(s.expires)}</td>
                  <td className="small">{userName(s.by)}</td>
                  <td>
                    {s.kind === "hold" ? (
                      <Button size="sm" variant="ghost" onClick={() => { setList((l) => l.map((x) => (x.id === s.id ? { ...x, kind: "released", note: "手動で解除して枠に戻した" } : x))); toast({ kind: "success", message: `${s.id} を解除し、${s.days} 日を枠に戻しました` }); }}>解除</Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </AppLayout>
  );
}
