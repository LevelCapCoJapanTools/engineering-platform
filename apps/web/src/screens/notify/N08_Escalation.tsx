// 画面ID: N-08 エスカレーションと訓練
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { AppLayout, Banner, Button, crumbs, DataTable, ErrorState, PageHeader, Section, Select, Skeleton, SourceTag, Tag, Timestamp, useToast } from "../../ui";
import { contactExpiries, drills, escalationPolicies } from "../../mocks/notify";
import { OncallTabs, SeverityBadge, useOrg, userName } from "./parts";

export function N08Escalation() {
  const state = useScreenState();
  const org = useOrg();
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [target, setTarget] = useState("受発注 API");
  const expired = contactExpiries.filter((c) => c.status === "expired");

  return (
    <AppLayout org={org} active="oncall" breadcrumb={crumbs(org, undefined, { label: "オンコール" }, { label: "エスカレーションと訓練" })}>
      <PageHeader
        title="エスカレーションと訓練"
        description="重大度ごとの呼び出し段階と待機時間を確認し、定期的にテストアラートとフェイルオーバーの確認を行います。ポリシーの変更はオンコール管理サービスで行います。"
        meta={<SourceTag source={{ provider: "pagerduty", synced_at: "2026-11-27T10:26:00+09:00", status: "healthy" }} />}
      />
      <OncallTabs org={org} active="escalation" />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {expired.length > 0 || state === "期限切れあり" ? (
            <Banner tone="fail" title="期限切れの連絡先・資格情報があります">
              {expired.map((e) => `${e.item}（${userName(e.owner)}）`).join("、")}。この人への音声通知は届かない可能性があります。
            </Banner>
          ) : null}
          <Section title="エスカレーションポリシー">
            <div className="stack">
              {escalationPolicies.map((p) => (
                <div key={p.id} className="card tight stack" style={{ ["--gap" as string]: "8px" }}>
                  <div className="row between">
                    <strong>{p.name}</strong>
                    <span className="row" style={{ ["--gap" as string]: "4px" }}>{p.severity.map((s) => <SeverityBadge key={s} value={s} />)}</span>
                  </div>
                  <ol className="nt-steps">
                    {p.steps.map((s) => (
                      <li key={s.level}>
                        <span className="nt-step-no">{s.level}</span>
                        <span className="small"><strong>{s.target}</strong> · {s.channels.join("・")}</span>
                        <Tag square icon="clock">{s.wait_minutes} 分待つ</Tag>
                      </li>
                    ))}
                  </ol>
                  <span className="tiny muted">夜間・休日: {p.night_holiday} · 繰り返し: {p.repeat}</span>
                </div>
              ))}
            </div>
          </Section>
          <div className="grid cols-2">
            <Section title="テストアラート" sub="当番が受領できること、代替経路に届くことを確認します">
              <div className="stack">
                <Select label="対象のサービス" value={target} onChange={setTarget} options={[{ value: "受発注 API", label: "受発注 API" }, { value: "会員アプリ API", label: "会員アプリ API" }, { value: "証跡の保管", label: "証跡の保管" }]} />
                <Select label="確認すること" defaultValue="ack" options={[{ value: "ack", label: "一次担当の受領" }, { value: "escalate", label: "無応答時の二次担当への段階" }, { value: "failover", label: "チャット停止時の代替経路（Push・SMS・音声）" }]} />
                <Button variant="primary" icon="zap" loading={sending} onClick={() => { setSending(true); window.setTimeout(() => { setSending(false); toast({ kind: "success", message: `${target} にテストアラートを送りました。結果は訓練の記録に残ります` }); }, 900); }}>テストアラートを送る</Button>
                <span className="tiny muted">テストアラートは「訓練」と明記して送り、インシデントの統計に含めません。</span>
              </div>
            </Section>
            <Section title="連絡先・資格情報の期限" flush>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>項目</th><th>管理者</th><th>期限</th></tr></thead>
                  <tbody>
                    {contactExpiries.map((c) => (
                      <tr key={c.item}>
                        <td className="small">{c.item}</td>
                        <td className="small">{userName(c.owner)}</td>
                        <td>{c.status === "expired" ? <Tag tone="fail" square>期限切れ {c.expires_at}</Tag> : c.status === "soon" ? <Tag tone="warn" square>まもなく {c.expires_at}</Tag> : <span className="small">{c.expires_at}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
          <Section title="訓練の記録" flush>
            <DataTable
              bare
              rows={state === "訓練なし" ? [] : drills}
              rowKey={(d) => d.id}
              columns={[
                { key: "at", header: "日時", render: (d) => <Timestamp at={d.at} mode="absolute" />, sortValue: (d) => d.at },
                { key: "kind", header: "内容", render: (d) => <span className="small">{d.kind}</span> },
                { key: "result", header: "結果", render: (d) => <Tag tone={d.result === "pass" ? "pass" : d.result === "partial" ? "warn" : "fail"} square>{d.result === "pass" ? "成功" : d.result === "partial" ? "一部失敗" : "失敗"}</Tag> },
                { key: "detail", header: "詳細", render: (d) => <span className="small">{d.detail}</span> },
                { key: "by", header: "実施", render: (d) => <span className="small">{userName(d.by)}</span> },
              ]}
              empty={<div className="empty"><h3>訓練の記録はありません</h3><p>四半期に 1 回以上のテストアラートをおすすめします。</p></div>}
            />
          </Section>
        </>
      )}
    </AppLayout>
  );
}
