// 画面ID: K-09 成果参照の照合（提供元別）
import "./connectors.css";
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { relativeTime } from "../../lib/format";
import { referenceCapabilities, referenceEvents, referenceMatches } from "../../mocks/common2";
import type { MatchState } from "../../mocks/common2";
import { AppLayout, Banner, Button, CapabilityCell, crumbs, EmptyState, ErrorState, ExternalActor, IdLink, PageHeader, ProviderBadge, Section, Segmented, Skeleton, Tag, useToast } from "../../ui";

const MATCH: Record<MatchState, { label: string; tone: "pass" | "warn" | "fail" | "neutral" }> = {
  matched: { label: "照合済み", tone: "pass" },
  unverified: { label: "未確認あり", tone: "warn" },
  mismatch: { label: "版が一致しない", tone: "fail" },
  pending: { label: "提出前", tone: "neutral" },
};

const CI: Record<string, string> = { success: "成功", failure: "失敗", unavailable: "未確認（取得できない）", pending: "未取得" };

export function K09ReferenceMatching() {
  const state = useScreenState();
  const org = useRoute().params.org ?? ORG;
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | MatchState>("all");
  const rows = state === "empty" ? [] : referenceMatches.filter((r) => filter === "all" || r.state === filter);

  return (
    <AppLayout org={org} active="connectors" breadcrumb={crumbs(org, undefined, { label: "連携と同期", to: paths.connectors(org) }, { label: "成果参照の照合" })}>
      <PageHeader
        title="成果参照の照合（提供元別）"
        description="受託者が提出した外部の参照（PR／MR、確定コミット）と、提供元から取得できた検証結果を依頼ごとに結び付けます。コード本文は保管しません。"
        actions={<Button icon="external" to={paths.capabilities(org)}>能力の比較</Button>}
      />
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <div className="stack">
          {state === "mismatch" || filter === "mismatch" ? null : (
            <Banner tone="info" title="提出は外部の参照だけで完了します">
              受託者は普段の Git 環境で実装し、参照（URL と確定コミット）を提出します。本サービスにエディタやコードの保管はありません。取得できない項目は「未確認」と表示し、成功扱いにしません。
            </Banner>
          )}
          {state === "mismatch" ? (
            <Banner tone="fail" title="別のコミットの CI 結果は流用しません">
              ORD-0099 の CI 成功は、提出版 5b2e9f0 ではなく 3aa01c2 の結果です。提出版で再実行するよう窓口から依頼しました。
            </Banner>
          ) : null}

          <Section title="依頼ごとの照合" sub="提出時のコミットで固定します。PR の先端が後から動いても、照合の対象は変わりません" flush
            actions={<Segmented value={filter} onChange={(v) => setFilter(v as "all" | MatchState)} options={[{ value: "all", label: "すべて" }, { value: "matched", label: "照合済み" }, { value: "unverified", label: "未確認あり" }, { value: "mismatch", label: "不一致" }]} />}>
            {rows.length === 0 ? (
              <EmptyState icon="link" title="照合する提出はありません" description="受託者が成果を提出すると、ここに提供元別の照合結果が表示されます。" />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>依頼</th><th>受託者</th><th>提供元・参照</th><th>提出時の版</th><th>CI の結果</th><th>レビュー</th><th>照合</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td><IdLink id={r.order_id} to={paths.order(org, r.order_id)} /><div className="tiny muted">{r.order_title}</div></td>
                        <td><ExternalActor userId={r.freelancer_id} /></td>
                        <td><ProviderBadge provider={r.provider} size="sm" /><div className="mono tiny">{r.external_ref}</div></td>
                        <td className="mono small">{r.submitted_sha}{r.head_sha_now !== r.submitted_sha && r.submitted_sha !== "—" ? <div className="tiny muted">現在の先端 {r.head_sha_now.slice(0, 7)}</div> : null}</td>
                        <td className="small">{CI[r.ci]}{r.ci_run ? <div className="tiny muted">{r.ci_run}</div> : null}</td>
                        <td className="small">{r.review === "approved" ? "承認あり" : r.review === "none" ? "なし" : "未確認"}</td>
                        <td>
                          <Tag tone={MATCH[r.state].tone} square>{MATCH[r.state].label}</Tag>
                          <div className="tiny muted" style={{ maxWidth: 260 }}>{r.note}</div>
                          <div className="tiny muted">最終イベント {relativeTime(r.last_event_at)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="提供元ごとの取得と必須化" sub="同じ提出例で提供元ごとに検証した結果です。取れない項目は照合でも「未確認」になります" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>提供元</th><th>参照</th><th>確定版</th><th>CI 結果</th><th>レビュー</th><th>必須化</th><th>方式・制限</th><th>最終試験日</th></tr></thead>
                <tbody>
                  {referenceCapabilities.map((c) => (
                    <tr key={c.provider}>
                      <td><ProviderBadge provider={c.provider} showStatus /></td>
                      <td><CapabilityCell level={c.ref} /></td>
                      <td><CapabilityCell level={c.pinnedSha} /></td>
                      <td><CapabilityCell level={c.ciResult} note={c.limit} /></td>
                      <td><CapabilityCell level={c.review} /></td>
                      <td><CapabilityCell level={c.gate} /></td>
                      <td className="small">{c.method}{c.limit ? <div className="tiny muted">制限: {c.limit}</div> : null}</td>
                      <td className="small">{c.verified_at.replace(/-/g, "/")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="再配信と順不同の扱い" sub="同じ配信は1回だけ反映し、遅れて届いた古い版で結果を巻き戻しません" flush
            actions={<Button size="sm" icon="refresh" onClick={() => toast({ kind: "success", message: "提供元の API から差分を再取得しました（重複は除外）" })}>差分を再取得</Button>}>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>受信</th><th>提供元</th><th>配信ID</th><th>イベント</th><th>版</th><th>結果</th></tr></thead>
                <tbody>
                  {referenceEvents.map((e) => (
                    <tr key={`${e.delivery}-${e.at}`}>
                      <td className="small">{relativeTime(e.at)}</td>
                      <td><ProviderBadge provider={e.provider} size="sm" /></td>
                      <td className="mono small">{e.delivery}</td>
                      <td className="small">{e.kind}</td>
                      <td className="mono tiny">{e.version}</td>
                      <td><Tag tone={e.result === "applied" ? "pass" : "neutral"} square>{e.result === "applied" ? "反映" : e.result === "duplicate" ? "重複（無視）" : "古い版（巻き戻さない）"}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}
    </AppLayout>
  );
}
