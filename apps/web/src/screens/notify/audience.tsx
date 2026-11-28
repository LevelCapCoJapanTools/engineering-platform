// 通知の宛先の範囲（受託者本人限定・顧客は公開範囲内）と公開停止の扱い（2026-11-28 追補。資料 21・32・40）
import { paths } from "../../lib/paths";
import { SEVERITY } from "../../lib/vocab";
import { notifyAudienceRules, revocationEffects } from "../../mocks/common2";
import { AudienceTag, Banner, Button, Section, StatusBadge } from "../../ui";

export function AudienceRulesSection({ org, compact }: { org: string; compact?: boolean }) {
  const rows = compact ? notifyAudienceRules.slice(0, 4) : notifyAudienceRules;
  return (
    <Section
      title="宛先の範囲（相手ごとの制限）"
      sub="受託者向けは本人だけ、顧客向けは承認済みの公開範囲の項目だけを送ります。範囲の設定は顧客への公開と権限の設定に従います"
      actions={<Button size="sm" icon="eye" to={paths.disclosure(org, "order-renewal")}>顧客への公開設定</Button>}
      flush
    >
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>出来事</th><th>範囲</th><th>宛先</th><th>重大度</th>{compact ? null : <th>応答期限と代理</th>}<th>本文の制限</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.event}>
                <td className="strong small">{r.event}</td>
                <td><AudienceTag value={r.audience} /></td>
                <td className="small">{r.recipients}</td>
                <td><StatusBadge vocab={SEVERITY[r.severity]} size="sm" /></td>
                {compact ? null : <td className="small">{r.deadline ?? "—"}{r.deputy ? <div className="tiny muted">代理: {r.deputy}</div> : null}</td>}
                <td className="tiny muted">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function RevocationSection() {
  return (
    <Section title="公開停止・提携終了・担当交代のとき" sub="公開を止めると、送信待ちの通知と購読も止まります">
      <ul className="stack" style={{ ["--gap" as string]: "6px", margin: 0, paddingLeft: 18 }}>
        {revocationEffects.map((r) => (
          <li key={r.item} className="small"><strong>{r.item}</strong>: {r.effect}</li>
        ))}
      </ul>
    </Section>
  );
}

export function SendOnlyNotice() {
  return (
    <Banner tone="info" title="送信専用のチャネルでは、本文に条件や金額を載せません">
      Discord の Webhook や Chatwork など送信専用の構成では、通知は「確認が必要です」とリンクだけを送ります。受託者・顧客はリンク先で本人確認してから内容を確認・回答します。
    </Banner>
  );
}
