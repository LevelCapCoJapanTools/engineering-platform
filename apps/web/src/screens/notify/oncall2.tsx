// オンコールの受領・代替経路・保守窓口（2026-11-28 追補。資料 30・33）
import { CAPABILITY } from "../../lib/vocab";
import type { IncidentStatus } from "../../lib/vocab";
import { chatAckMethods, maintenanceDesks, oncallCoverage } from "../../mocks/common2";
import { Banner, CapabilityCell, ProviderBadge, Section, Tag } from "../../ui";

/** 休日・夜間に対応する組織と時間帯 */
export function CoverageSection() {
  return (
    <Section title="対応する組織と時間帯" sub="休日・夜間に誰が引き受けるかを案件の開始時に決め、ここに明示します" flush>
      <div className="table-wrap">
        <table className="table compact">
          <thead><tr><th>案件</th><th>平日</th><th>夜間</th><th>休日</th><th>引き受ける組織</th></tr></thead>
          <tbody>
            {oncallCoverage.map((c) => (
              <tr key={c.project}>
                <td className="strong small">{c.project}</td>
                <td className="small">{c.weekday}</td>
                <td className="small">{c.night}</td>
                <td className="small">{c.holiday}</td>
                <td className="tiny muted">{c.organization}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/** チャット製品ごとの当番の応答方法 */
export function AckMethodsSection() {
  return (
    <Section title="チャットからの受領方法" sub="チャットへの投稿が成功しても、当番が受け取ったことにはしません。受領は本人確認した操作だけを記録します" flush>
      <div className="table-wrap">
        <table className="table compact">
          <thead><tr><th>チャット</th><th>ボタンでの受領</th><th>受領の方法</th><th>注意</th></tr></thead>
          <tbody>
            {chatAckMethods.map((m) => (
              <tr key={m.provider}>
                <td><ProviderBadge provider={m.provider} size="sm" /></td>
                <td><span className="row nowrap" style={{ ["--gap" as string]: "6px" }}><CapabilityCell level={m.delivery} /><span className="tiny muted">{CAPABILITY[m.delivery].label}</span></span></td>
                <td className="small">{m.ack}</td>
                <td className="tiny muted">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/** 配信と受領の区別、代替経路、解決後の呼出し停止 */
export function DeliveryVsAckSection({ status }: { status: IncidentStatus }) {
  const rows: { route: string; delivered: string; ack: string; tone: "pass" | "warn" | "fail" | "neutral" }[] = [
    { route: "Slack #oncall-order（一次）", delivered: "投稿成功 10:21", ack: status === "triggered" ? "未受領" : "受領 10:03（渡辺 翔・本人確認済み）", tone: status === "triggered" ? "warn" : "pass" },
    { route: "Microsoft Teams（顧客共有）", delivered: "投稿失敗（Workflow の所有者が無効）", ack: "—", tone: "fail" },
    { route: "PagerDuty の Push（二次）", delivered: status === "triggered" ? "段階2で送信 10:26" : "送信なし（一次が受領）", ack: status === "triggered" ? "未受領（10:36 に音声へ）" : "—", tone: status === "triggered" ? "warn" : "neutral" },
    { route: "PagerDuty の音声（二次・代替）", delivered: status === "triggered" ? "予定 10:36" : "—", ack: "—", tone: "neutral" },
  ];
  return (
    <Section title="通知の配信と受領" sub="配信の成功と人の受領を分けて記録します。チャットが止まっても、当番系の別経路で二次へ移ります">
      <div className="stack">
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>経路</th><th>配信</th><th>受領</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.route}>
                  <td className="small">{r.route}</td>
                  <td className="small">{r.delivered}</td>
                  <td><Tag tone={r.tone} square>{r.ack}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {status === "resolved" ? (
          <Banner tone="pass" title="同じ障害の呼出しを止めました">解決を記録したため、重複キー order-api/5xx-rate の呼出しと催促はすべて停止しています。</Banner>
        ) : (
          <p className="tiny muted">元の受託者（成果を作った人）は自動で呼び出しません。必要なときは窓口が本人に相談し、本人の承諾を得てから依頼します。</p>
        )}
      </div>
    </Section>
  );
}

/** 案件終了後の保守窓口 */
export function MaintenanceSection() {
  return (
    <Section title="終了した案件の保守窓口" sub="受入後の問い合わせは窓口が受け付け、対象の版と運用担当を特定します。元の受託者を自動で当番にしません" flush>
      <div className="table-wrap">
        <table className="table compact">
          <thead><tr><th>案件</th><th>対象の版</th><th>運用担当</th><th>受付窓口</th><th>保守期間</th><th>未引継ぎ</th><th>元の受託者</th></tr></thead>
          <tbody>
            {maintenanceDesks.map((m) => (
              <tr key={m.project}>
                <td className="strong small">{m.project}</td>
                <td className="mono small">{m.version}</td>
                <td className="small">{m.operator}</td>
                <td className="small">{m.desk}</td>
                <td className="small">{m.until.replace(/-/g, "/")} まで</td>
                <td>{m.open_items ? <Tag tone="warn" square>{m.open_items} 件</Tag> : <Tag tone="pass" square>なし</Tag>}</td>
                <td className="tiny muted">{m.former_freelancers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
