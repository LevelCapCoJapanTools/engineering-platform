// 画面ID: K-07 受信イベントと再同期
import "./connectors.css";
import { useState } from "react";
import { useScreenState, useRoute } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { PROVIDERS } from "../../lib/vocab";
import { connectors } from "../../mocks/portfolio";
import { inboundEvents, reconciliations } from "../../mocks/connectors";
import type { InboundEvent } from "../../mocks/connectors";
import { AppLayout, Banner, Button, crumbs, DataTable, EmptyState, ErrorState, FilterBar, PageHeader, ProviderBadge, Section, Skeleton, StatCard, Tag, useToast } from "../../ui";
import type { Column } from "../../ui";

const RESULT: Record<InboundEvent["result"], { label: string; tone: "pass" | "neutral" | "info" | "warn" | "fail" }> = {
  processed: { label: "処理済み", tone: "pass" },
  duplicate: { label: "重複（無視）", tone: "neutral" },
  reordered: { label: "順不同（古い結果）", tone: "info" },
  retrying: { label: "再試行中", tone: "warn" },
  deadLetter: { label: "再処理待ち", tone: "fail" },
  rejected: { label: "拒否", tone: "fail" },
  reconciled: { label: "照合して補正", tone: "info" },
};

export function K07Deliveries() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [filters, setFilters] = useState<Record<string, string>>({ result: "", provider: "" });
  const [q, setQ] = useState("");
  const all = state === "empty" ? [] : inboundEvents;
  const rows = all.filter((e) => (!filters.result || e.result === filters.result) && (!filters.provider || e.provider === filters.provider) && (!q || `${e.kind} ${e.resource} ${e.delivery_id}`.includes(q)));

  const cols: Column<InboundEvent>[] = [
    { key: "recv", header: "受信", render: (e) => <span className="small">{e.received_at === "—" ? "—" : formatDateTime(e.received_at)}</span>, sortValue: (e) => e.received_at },
    { key: "provider", header: "送信元", render: (e) => <ProviderBadge provider={e.provider} size="sm" /> },
    { key: "kind", header: "種類", render: (e) => <span className="mono small">{e.kind}</span> },
    { key: "res", header: "対象", render: (e) => <span className="small">{e.resource}{e.head_sha ? <span className="tiny muted mono"> @{e.head_sha}</span> : null}</span> },
    { key: "id", header: "配信 ID", render: (e) => <span className="mono tiny">{e.delivery_id}</span>, defaultHidden: false },
    { key: "sig", header: "署名", render: (e) => (e.signature === "valid" ? <Tag tone="pass" icon="check">一致</Tag> : e.signature === "invalid" ? <Tag tone="fail" icon="x">不一致</Tag> : <Tag>対象外</Tag>) },
    { key: "result", header: "結果", render: (e) => <Tag tone={RESULT[e.result].tone} square>{RESULT[e.result].label}</Tag>, sortValue: (e) => e.result },
    { key: "attempts", header: "試行", render: (e) => e.attempts, align: "right" },
    { key: "note", header: "内容", render: (e) => <span className="small">{e.note}</span> },
    {
      key: "act",
      header: "",
      render: (e) =>
        e.result === "deadLetter" ? (
          <Button size="sm" variant="primary" icon="refresh" onClick={() => toast({ kind: "success", message: "再処理しました。重複は配信 ID で除外します" })}>再処理</Button>
        ) : e.result === "retrying" ? (
          <Button size="sm" icon="refresh" onClick={() => toast({ kind: "info", message: "Retry-After の経過後に再試行します" })}>今すぐ再試行</Button>
        ) : null,
    },
  ];

  return (
    <AppLayout org={org} active="connectors" breadcrumb={crumbs(org, undefined, { label: "連携と同期", to: paths.connectors(org) }, { label: "受信イベントと再同期" })}>
      <PageHeader title="受信イベントと再同期" description="Webhook 等で受け取ったイベントを、署名の検証、重複の除外、順序の補正をしてから処理します。同じイベントを何度受け取っても、判定・監査・通知は二重に作りません。" />
      {state === "loading" ? (
        <Skeleton rows={8} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <div className="stack">
          <div className="grid auto-fit">
            <StatCard label="24時間の受信" icon="download" value={1873} unit="件" />
            <StatCard label="重複として無視" icon="copy" value={42} unit="件" />
            <StatCard label="署名の不一致（拒否）" icon="shieldX" value={all.filter((e) => e.signature === "invalid").length} unit="件" tone={all.some((e) => e.signature === "invalid") ? "danger" : undefined} />
            <StatCard label="再処理待ち" icon="alertCircle" value={all.filter((e) => e.result === "deadLetter").length} unit="件" tone={all.some((e) => e.result === "deadLetter") ? "warn" : undefined} />
          </div>
          {all.some((e) => e.signature === "invalid") ? (
            <Banner tone="warn" title="署名が一致しないリクエストを拒否しました">送信元の偽装や、Webhook シークレットの不一致の可能性があります。拒否したリクエストの本文は保存していません。</Banner>
          ) : null}

          <Section title="処理の順序" sub="すべての連携で同じ手順を通します">
            <div className="kn-flow">
              {["署名・送信元の検証", "配信 ID で重複を除外", "対象のコミット（SHA）と発生時刻で順序を確認", "共通のデータに変換", "コミットの変更で古い結果・承認を失効", "記録（失敗は指数バックオフで再試行、上限で再処理待ち）"].map((s, i) => (
                <span key={s} className="row nowrap" style={{ ["--gap" as string]: "8px" }}>
                  {i > 0 ? <span className="muted">→</span> : null}
                  <span className="kn-step">{s}</span>
                </span>
              ))}
            </div>
          </Section>

          <DataTable
            columns={cols}
            rows={rows}
            rowKey={(e) => e.id}
            toolbar={
              <FilterBar
                values={filters}
                onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
                search={q}
                onSearch={setQ}
                searchPlaceholder="種類・対象・配信 ID"
                filters={[
                  { key: "result", label: "結果", options: Object.entries(RESULT).map(([k, v]) => ({ value: k, label: v.label })) },
                  { key: "provider", label: "送信元", options: Array.from(new Set(inboundEvents.map((e) => e.provider))).map((p) => ({ value: p, label: PROVIDERS[p].label })) },
                ]}
              />
            }
            empty={<EmptyState icon="inbox" title="受信イベントはありません" description="連携を接続すると、受け取ったイベントがここに並びます。" />}
          />

          <Section title="欠落期間の再取得" sub="Webhook の欠落、権限切れ、停止期間の後に、API で差分を取り直して照合します" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>連携</th><th>期間</th><th>状態</th><th className="num">補完</th><th>メモ</th><th /></tr></thead>
                <tbody>
                  {reconciliations.map((r) => {
                    const c = connectors.find((x) => x.id === r.connector);
                    return (
                      <tr key={r.id}>
                        <td>{c ? <ProviderBadge provider={c.provider} size="sm" /> : r.connector}</td>
                        <td className="small">{formatDateTime(r.from)} 〜 {r.to.startsWith("（") ? r.to : formatDateTime(r.to)}</td>
                        <td>{r.status === "done" ? <Tag tone="pass">完了</Tag> : r.status === "running" ? <Tag tone="info">実行中</Tag> : <Tag tone="warn">待機中</Tag>}</td>
                        <td className="num">{r.found}</td>
                        <td className="small">{r.note}</td>
                        <td>{c ? <Button size="sm" variant="ghost" to={paths.connector(org, c.id)}>連携</Button> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="特別なイベントの扱い">
            <ul className="kn-list">
              <li><strong>force-push・履歴の書換え</strong>: 旧コミットへのリンクは「到達不能」として残し、新しいコミットでゲートを再評価する</li>
              <li><strong>PR／MR の再作成</strong>: 同じブランチの新しい PR に、要求リンクの引継ぎ候補を提示する（人が確定）</li>
              <li><strong>フォークからの PR</strong>: フォーク側のコミットとして記録し、書込み権限のない操作は行わない</li>
              <li><strong>マージコミット</strong>: マージ前に判定したコミットとの対応を記録する</li>
              <li><strong>ブランチ・リポジトリの削除</strong>: 「外部で削除」として状態に残し、証跡は消さない</li>
              <li><strong>リポジトリの移管</strong>: 移管先が同じ組織なら対応付けを維持し、別組織なら同期を止めて確認を求める</li>
              <li><strong>利用者の退職・権限変更</strong>: 外部IDの対応付けを無効にし、承認・通知・当番の宛先から外す</li>
            </ul>
          </Section>
        </div>
      )}
    </AppLayout>
  );
}
