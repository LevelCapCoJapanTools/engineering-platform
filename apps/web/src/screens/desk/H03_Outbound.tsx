// 画面ID: H-03 対外送信の承認と配信結果
// 委任済みルールで自動送信する受領通知・定型の催促と、人の確認が必要な連絡（金額・範囲・納期・障害説明）を分ける。
// 承認後に文面や宛先が変われば再承認。送信済みと配信失敗を区別し、再送しても同じ確約を二重に発信しない（重複防止キー）。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { StatusVocab } from "../../lib/vocab";
import { formatDateTime } from "../../lib/format";
import { delegationRules, outbound } from "../../mocks/desk";
import type { Outbound as OutboundItem } from "../../mocks/desk";
import {
  AppLayout,
  Banner,
  Button,
  crumbs,
  EmptyState,
  ErrorState,
  ExternalActor,
  KeyValueList,
  PageHeader,
  Section,
  Skeleton,
  StatusBadge,
  Tabs,
  Tag,
  useToast,
} from "../../ui";
import { projectName } from "./parts";

const OUT_STATUS: Record<OutboundItem["status"], StatusVocab> = {
  pendingApproval: { label: "確認待ち", tone: "warn" },
  reapproval: { label: "再承認が必要", tone: "special" },
  approved: { label: "承認済み（送信待ち）", tone: "info" },
  sent: { label: "送信済み", tone: "pass" },
  failed: { label: "配信失敗", tone: "fail" },
  suppressed: { label: "送信しなかった", tone: "neutral" },
};

export function OutboundScreen() {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const initialTab = state === "再承認が必要" ? "review" : state === "配信失敗" ? "failed" : "review";
  const [tab, setTab] = useState(initialTab);
  const [done, setDone] = useState<Record<string, OutboundItem["status"]>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const items = state === "空" ? [] : outbound;
  const statusOf = (o: OutboundItem) => done[o.id] ?? o.status;
  const lists: Record<string, OutboundItem[]> = {
    review: items.filter((o) => ["pendingApproval", "reapproval", "approved"].includes(statusOf(o))),
    sent: items.filter((o) => statusOf(o) === "sent"),
    failed: items.filter((o) => statusOf(o) === "failed"),
    auto: items.filter((o) => o.kind === "auto"),
  };
  const act = (o: OutboundItem, next: OutboundItem["status"], message: string) => {
    setBusy(o.id);
    window.setTimeout(() => {
      setBusy(null);
      setDone((d) => ({ ...d, [o.id]: next }));
      toast({ kind: "success", message });
    }, 600);
  };

  return (
    <AppLayout org={org} active="desk" breadcrumb={crumbs(org, undefined, { label: "案件窓口", to: paths.desk(org) }, { label: "対外送信" })}>
      <PageHeader
        title="対外送信の承認と配信結果"
        description="顧客・受託者への連絡はサービスの窓口名義で送ります。受領通知と定型の催促は委任ルールで自動送信し、金額・範囲・納期・障害説明は人が確認してから送ります。"
      />
      {state === "読み込み中" ? (
        <Skeleton rows={5} />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <Section title="委任ルール" sub="ルールで送れるのは定型の連絡だけです。確約を含む連絡は必ず人が確認します" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>ルール</th><th>対象</th><th>送り方</th></tr></thead>
                <tbody>
                  {delegationRules.map((r) => (
                    <tr key={r.id}>
                      <td className="small"><span className="mono">{r.id}</span> {r.name}</td>
                      <td className="small">{r.scope}</td>
                      <td>{r.auto ? <Tag tone="info" square icon="zap">自動（委任済み）</Tag> : <Tag tone="warn" square icon="user">人の確認が必要</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "review", label: "確認待ち", count: lists.review.length },
              { value: "failed", label: "配信失敗", count: lists.failed.length },
              { value: "sent", label: "送信済み", count: lists.sent.length },
              { value: "auto", label: "自動送信の記録", count: lists.auto.length },
            ]}
          />
          {lists[tab].length === 0 ? (
            <div className="card">
              <EmptyState icon="send" title={items.length === 0 ? "対外送信はまだありません" : "この区分の送信はありません"} description="問い合わせへの回答や、日程・金額の連絡を作成すると、ここで確認してから送ります。" variant={items.length === 0 ? "initial" : "filtered"} />
            </div>
          ) : (
            <div className="stack">
              {lists[tab].map((o) => {
                const st = statusOf(o);
                return (
                  <section key={o.id} className="card stack" style={{ ["--gap" as string]: "10px" }} aria-label={o.subject}>
                    <div className="row between">
                      <div className="row" style={{ ["--gap" as string]: "8px" }}>
                        <span className="mono small">{o.id}</span>
                        <Tag square tone={o.kind === "auto" ? "info" : "warn"}>{o.category}</Tag>
                        <StatusBadge vocab={OUT_STATUS[st]} size="sm" />
                        <span className="tiny muted">{projectName(o.project)}</span>
                      </div>
                      <span className="tiny muted mono">重複防止キー {o.dedup_key}</span>
                    </div>
                    <strong>{o.subject}</strong>
                    {st === "reapproval" && o.change_after_approval ? <Banner tone="warn" title="承認後に内容が変わりました">{o.change_after_approval}</Banner> : null}
                    {st === "failed" && o.error ? <Banner tone="fail" title="配信に失敗しました">{o.error}</Banner> : null}
                    {st === "suppressed" && o.error ? <Banner tone="info">{o.error}</Banner> : null}
                    <KeyValueList
                      cols={2}
                      items={[
                        { label: "宛先", value: o.to.join("、") },
                        { label: "送信経路", value: o.channel },
                        { label: "対象版", value: o.target_version },
                        { label: "送り方", value: o.kind === "auto" ? `自動（${o.rule}）` : "人が確認して送信" },
                        { label: "承認", value: o.approved_by ? <span className="row" style={{ ["--gap" as string]: "6px" }}><ExternalActor userId={o.approved_by} />{o.approved_at ? <span className="tiny muted">{formatDateTime(o.approved_at)}</span> : null}</span> : <span className="muted">—</span> },
                        { label: "送信日時", value: o.sent_at ? formatDateTime(o.sent_at) : "—" },
                      ]}
                    />
                    <div className="dk-draft">{o.body}</div>
                    <div className="row end">
                      {st === "pendingApproval" ? (
                        <Button variant="primary" icon="send" loading={busy === o.id} onClick={() => act(o, "sent", `${o.id} を承認し、窓口名義で送信しました`)}>宛先・文面・対象版を確認して送信</Button>
                      ) : st === "reapproval" ? (
                        <Button variant="primary" icon="refresh" loading={busy === o.id} onClick={() => act(o, "sent", `${o.id} を再承認して送信しました（変更後の宛先を含む）`)}>変更後の内容で再承認して送信</Button>
                      ) : st === "failed" ? (
                        <>
                          <span className="tiny muted">再送しても同じ重複防止キーを使うため、届いた先に二重には発信されません</span>
                          <Button variant="primary" icon="mail" loading={busy === o.id} onClick={() => act(o, "sent", `${o.id} を代替経路（メール）で再送しました`)}>代替経路（メール）で再送</Button>
                        </>
                      ) : st === "sent" ? (
                        <Button icon="send" disabled disabledReason="送信済みです。同じ確約を二重に発信しません">送信済み</Button>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
