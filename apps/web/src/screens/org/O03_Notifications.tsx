// 画面ID: O-03 通知
import { useState } from "react";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { SEVERITY } from "../../lib/vocab";
import type { Severity } from "../../lib/vocab";
import { AppLayout, Button, crumbs, EmptyState, ErrorState, FilterBar, PageHeader, ProviderBadge, Skeleton, StatusBadge, Tabs, Tag, Timestamp } from "../../ui";
import { DELIVERY_STATUS } from "../../lib/vocab";
import { cx } from "../../ui";
import { projects } from "../../mocks/core";
import { appNotices, channelById, NOTIFY_EVENTS } from "../../mocks/notify";
import "../notify/notify.css";

export function Notifications() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [items, setItems] = useState(state === "empty" ? [] : appNotices);
  const [tab, setTab] = useState("unread");
  const [f, setF] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const list = items.filter((n) => (tab === "all" || !n.read) && (!f.severity || n.severity === f.severity) && (!f.project || n.project === f.project));
  const unread = items.filter((n) => !n.read).length;
  return (
    <AppLayout org={org} active="notify" breadcrumb={crumbs(org, undefined, { label: "通知" })}>
      <PageHeader
        title="通知"
        description={`未読 ${unread}件。アプリ内の通知と、同じ通知をチャットやメールに届けた記録を確認できます。`}
        actions={
          <>
            <Button icon="check" disabled={unread === 0} disabledReason="未読はありません" onClick={() => setItems((xs) => xs.map((n) => ({ ...n, read: true })))}>すべて既読にする</Button>
            <Button variant="ghost" icon="settings" to={paths.me()}>自分の通知設定</Button>
            <Button variant="ghost" icon="bell" to={paths.notifyRules(org)}>通知ルール</Button>
          </>
        }
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "unread", label: "未読", count: unread }, { value: "all", label: "すべて", count: items.length }]} />
      <FilterBar
        values={f}
        onChange={(k, v) => setF((x) => ({ ...x, [k]: v }))}
        filters={[
          { key: "severity", label: "重大度", options: (Object.keys(SEVERITY) as Severity[]).map((k) => ({ value: k, label: SEVERITY[k].label })) },
          { key: "project", label: "案件", options: projects.map((p) => ({ value: p.slug, label: p.name })) },
        ]}
      />
      {state === "loading" ? (
        <Skeleton rows={5} />
      ) : state === "error" ? (
        <ErrorState />
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState icon="bell" variant={items.length ? "filtered" : "initial"} title={items.length ? "該当する通知はありません" : "通知はありません"} description="経営判断の依頼、マイルストーンの遅延、同期の停止、インシデントなどが届くと表示されます。" />
        </div>
      ) : (
        <div className="card flush">
          {list.map((n) => {
            const p = projects.find((x) => x.slug === n.project);
            const failed = n.deliveries.some((d) => d.status === "failed" || d.status === "deadLetter");
            return (
              <div key={n.id} className={cx("nt-notice", !n.read && "unread")}>
                <StatusBadge vocab={SEVERITY[n.severity]} size="sm" icon={n.severity === "critical" || n.severity === "high"} />
                <div className="stack" style={{ ["--gap" as string]: "4px", minWidth: 0 }}>
                  <span style={{ fontWeight: n.read ? 400 : 600, color: "var(--text-strong)" }}>{n.text}</span>
                  <span className="tiny muted">
                    {NOTIFY_EVENTS[n.event].label}{p ? ` · ${p.name}` : ""} · <Timestamp at={n.at} />
                  </span>
                  <span className="row" style={{ ["--gap" as string]: "6px" }}>
                    <button type="button" className="nt-link-button tiny" onClick={() => setOpenId(openId === n.id ? null : n.id)} aria-expanded={openId === n.id}>
                      配信 {n.deliveries.length} 件{failed ? "（失敗あり）" : ""}
                    </button>
                    {failed ? <Tag tone="fail" square>一部届いていません</Tag> : null}
                  </span>
                  {openId === n.id ? (
                    <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                      {n.deliveries.map((d) => {
                        const c = channelById(d.channel_id);
                        return (
                          <span key={d.channel_id} className="row" style={{ ["--gap" as string]: "6px" }}>
                            {c ? <ProviderBadge provider={c.provider} size="sm" /> : d.channel_id}
                            <span className="tiny muted">{c?.destination}</span>
                            <StatusBadge vocab={DELIVERY_STATUS[d.status]} size="sm" />
                          </span>
                        );
                      })}
                      <Button size="sm" variant="ghost" to={paths.notifyLog(org)} iconRight="arrowRight">配信ログで確認</Button>
                    </div>
                  ) : null}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, read: !x.read } : x)))}>{n.read ? "未読にする" : "既読にする"}</Button>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
