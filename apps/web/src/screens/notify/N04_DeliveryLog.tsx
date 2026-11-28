// 画面ID: N-04 配信ログ
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { DELIVERY_STATUS } from "../../lib/vocab";
import type { DeliveryStatus } from "../../lib/vocab";
import {
  AppLayout, Banner, Button, crumbs, DataTable, Drawer, ErrorState, FilterBar, KeyValueList, PageHeader, ProviderBadge, Skeleton, StatCard, Timestamp, useToast,
} from "../../ui";
import { channelById, deliveries, NOTIFY_EVENTS } from "../../mocks/notify";
import type { Delivery } from "../../mocks/notify";
import { DeliveryBadge, NotifyTabs, SeverityBadge, useOrg } from "./parts";

export function N04DeliveryLog() {
  const state = useScreenState();
  const org = useOrg();
  const toast = useToast();
  const [filters, setFilters] = useState<Record<string, string>>(state === "再処理待ち" ? { status: "deadLetter" } : {});
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Delivery | null>(null);
  const rows = (state === "空" ? [] : deliveries).filter(
    (d) => (!filters.status || d.status === filters.status) && (!filters.channel || d.channel_id === filters.channel) && (!q || `${d.subject}${d.event_id}${d.recipient}`.includes(q)),
  );
  const count = (s: DeliveryStatus[]) => deliveries.filter((d) => s.includes(d.status)).length;

  return (
    <AppLayout org={org} active="notify" breadcrumb={crumbs(org, undefined, { label: "通知" }, { label: "配信ログ" })}>
      <PageHeader
        title="配信ログ"
        description="通知は業務の記録が確定した後に送信キュー（Outbox）から配信します。同じ出来事は冪等キーで一度だけ送り、失敗は間隔を空けて再試行します。本文と Secret は保存しません。"
      />
      <NotifyTabs org={org} active="log" />
      {state === "読み込み中" ? (
        <Skeleton rows={8} />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <div className="grid auto-fit">
            <StatCard label="配信済み（24時間）" value={count(["delivered", "accepted"])} unit="件" tone="good" />
            <StatCard label="再試行中" value={count(["retrying", "queued", "sending"])} unit="件" />
            <StatCard label="失敗・再処理待ち" value={count(["failed", "deadLetter"])} unit="件" tone="danger" delta="管理者に代替通知済み" />
            <StatCard label="集約・抑止" value={count(["suppressed"])} unit="件" delta="重複キー・上限による" />
          </div>
          {count(["deadLetter"]) > 0 ? (
            <Banner tone="warn" title="再処理待ちの通知があります" action={<Button size="sm" icon="refresh" onClick={() => toast({ kind: "success", message: "再処理待ちの 1 件を再送しました" })}>まとめて再送</Button>}>
              再試行の上限に達した通知です。チャネルを直してから再送してください。1 つの宛先の障害は、ほかの宛先への配信やゲートの判定を止めません。
            </Banner>
          ) : null}
          <DataTable
            rows={rows}
            rowKey={(d) => d.id}
            onRowClick={setOpen}
            toolbar={
              <FilterBar
                values={filters}
                onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
                search={q}
                onSearch={setQ}
                searchPlaceholder="件名・イベント ID・宛先"
                filters={[
                  { key: "status", label: "状態", options: (Object.keys(DELIVERY_STATUS) as DeliveryStatus[]).map((k) => ({ value: k, label: DELIVERY_STATUS[k].label })) },
                  { key: "channel", label: "チャネル", options: [...new Set(deliveries.map((d) => d.channel_id))].map((c) => ({ value: c, label: channelById(c)?.name ?? c })) },
                ]}
              />
            }
            columns={[
              { key: "at", header: "日時", render: (d) => <Timestamp at={d.created_at} mode="absolute" />, sortValue: (d) => d.created_at },
              { key: "event", header: "出来事", render: (d) => <div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="small">{d.subject}</span><span className="tiny muted">{NOTIFY_EVENTS[d.event].label} · {d.event_id}</span></div> },
              { key: "sev", header: "重大度", render: (d) => <SeverityBadge value={d.severity} /> },
              { key: "channel", header: "チャネル", render: (d) => { const c = channelById(d.channel_id); return c ? <ProviderBadge provider={c.provider} size="sm" /> : d.channel_id; } },
              { key: "to", header: "宛先", render: (d) => <span className="small">{d.recipient}</span> },
              { key: "status", header: "状態", render: (d) => <DeliveryBadge value={d.status} /> },
              { key: "attempts", header: "試行", render: (d) => d.attempts, align: "right", sortValue: (d) => d.attempts },
              { key: "tpl", header: "テンプレート", render: (d) => <span className="tiny mono">{d.template}</span>, defaultHidden: true },
            ]}
            empty={<div className="empty"><h3>配信の記録はありません</h3><p>通知ルールに合う出来事が起きると記録されます。</p></div>}
          />
        </>
      )}
      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.subject ?? ""}
        subtitle={open ? `${open.id} · ${NOTIFY_EVENTS[open.event].label}` : undefined}
        footer={
          open && ["failed", "deadLetter"].includes(open.status) ? (
            <Button variant="primary" icon="refresh" onClick={() => { setOpen(null); toast({ kind: "success", message: "同じ冪等キーで再送しました。二重に届くことはありません" }); }}>再送</Button>
          ) : undefined
        }
      >
        {open ? (
          <div className="stack">
            <KeyValueList
              stacked
              items={[
                { label: "状態", value: <DeliveryBadge value={open.status} /> },
                { label: "イベント ID", value: <span className="mono">{open.event_id}</span> },
                { label: "冪等キー", value: <span className="nt-mono">{open.idempotency_key}</span> },
                { label: "チャネル・宛先", value: `${channelById(open.channel_id)?.name ?? open.channel_id} / ${open.recipient}` },
                { label: "テンプレート", value: <span className="mono">{open.template}</span> },
                { label: "試行回数", value: `${open.attempts} 回（最大 6 回。間隔は 1・2・4・8・16 分）` },
                { label: "次の再試行", value: open.next_retry_at ? <Timestamp at={open.next_retry_at} mode="absolute" /> : "—" },
                { label: "提供元の応答", value: open.provider_response ?? "—" },
                { label: "作成・更新", value: <><Timestamp at={open.created_at} mode="absolute" /> / <Timestamp at={open.updated_at} mode="absolute" /></> },
              ]}
            />
            {open.status === "accepted" ? <Banner tone="info">このチャネルは配信確認ができないため、提供元が受け付けた時点で記録しています。相手が読んだことは確認できません。</Banner> : null}
            <p className="tiny muted">送信した本文は保存しません。件名・宛先・結果・テンプレート版のみを監査用に残します。</p>
          </div>
        ) : null}
      </Drawer>
    </AppLayout>
  );
}
