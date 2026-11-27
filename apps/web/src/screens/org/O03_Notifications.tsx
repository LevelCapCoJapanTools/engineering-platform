// 画面ID: O-03 通知
import { useState } from "react";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { Notification } from "../../lib/types";
import { AppLayout, Button, crumbs, cx, EmptyState, ErrorState, Icon, PageHeader, Skeleton, Tabs, Timestamp } from "../../ui";
import type { IconName } from "../../ui";
import { notifications as seed } from "../../mocks/core";

const KIND: Record<Notification["kind"], { label: string; icon: IconName; tone: string }> = {
  approval: { label: "承認", icon: "inbox", tone: "warn" },
  gate: { label: "ゲート", icon: "shield", tone: "fail" },
  exception: { label: "例外", icon: "flag", tone: "special" },
  comment: { label: "コメント", icon: "message", tone: "info" },
  release: { label: "リリース", icon: "rocket", tone: "pass" },
  system: { label: "お知らせ", icon: "bell", tone: "neutral" },
};

export function Notifications() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const [items, setItems] = useState(state === "empty" ? [] : seed);
  const [tab, setTab] = useState("all");
  const list = items.filter((n) => tab === "all" || (tab === "unread" ? !n.read : n.kind === tab));
  const unread = items.filter((n) => !n.read).length;
  return (
    <AppLayout org={org} active="dashboard" breadcrumb={crumbs(org, undefined, { label: "通知" })}>
      <PageHeader
        title="通知"
        description={`未読 ${unread}件`}
        actions={
          <>
            <Button icon="check" disabled={unread === 0} onClick={() => setItems((xs) => xs.map((n) => ({ ...n, read: true })))}>すべて既読にする</Button>
            <Button variant="ghost" icon="settings" to={paths.me()}>通知の設定</Button>
          </>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "すべて", count: items.length },
          { value: "unread", label: "未読", count: unread },
          ...(Object.keys(KIND) as Notification["kind"][]).map((k) => ({ value: k, label: KIND[k].label })),
        ]}
      />
      {state === "loading" ? (
        <Skeleton rows={5} />
      ) : state === "error" ? (
        <ErrorState />
      ) : list.length === 0 ? (
        <div className="card"><EmptyState icon="bell" title={items.length ? "該当する通知はありません" : "通知はありません"} description="承認の依頼、ゲートのブロック、例外の期限などが届くと表示されます。" /></div>
      ) : (
        <div className="card flush">
          {list.map((n) => (
            <div key={n.id} className="row" style={{ ["--gap" as string]: "14px", padding: "14px 18px", borderBottom: "1px solid var(--border)", background: n.read ? undefined : "var(--primary-tint)" }}>
              <span className={cx("badge square", `tone-${KIND[n.kind].tone}`)} style={{ padding: 6 }}><Icon name={KIND[n.kind].icon} /></span>
              <div className="stack grow" style={{ ["--gap" as string]: "2px", minWidth: 0 }}>
                <span style={{ fontWeight: n.read ? 400 : 600, color: "var(--text-strong)" }}>{n.text}</span>
                <span className="tiny muted">{KIND[n.kind].label} · <Timestamp at={n.at} /></span>
              </div>
              {!n.read ? <span aria-label="未読" style={{ width: 8, height: 8, borderRadius: 999, background: "var(--primary)" }} /> : null}
              <Button size="sm" variant="ghost" onClick={() => setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, read: !x.read } : x)))}>{n.read ? "未読にする" : "既読にする"}</Button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
