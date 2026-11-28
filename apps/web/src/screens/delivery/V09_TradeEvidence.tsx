// 画面ID: V-09 取引の証跡と不足一覧
// 発注版→受諾→提出→検証→委託検収→リリース→顧客受入を対応付け、未回収の項目を示す（改修 34）。
// AI の下書きは合意の証拠に数えない。第三者には許可した証跡だけを共有する（V-08）。
import "./delivery.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { aiDraftsExcluded, tradeChains } from "../../mocks/delivery";
import { orderById } from "../../mocks/engagement";
import {
  Banner,
  Button,
  ErrorState,
  ExternalActor,
  HashDisplay,
  Icon,
  PageHeader,
  ProjectLayout,
  Section,
  Select,
  Skeleton,
  Tag,
  TradeStateStrip,
} from "../../ui";
import { StepState, useOrgProject } from "./parts";

export const V09_STATES = ["default", "complete", "loading", "error"];

/** 資料9章「経営側で確認したい問い」と、通常の操作から集める記録 */
function questions(orderId: string) {
  const c = tradeChains[orderId];
  const has = (k: string) => c.find((s) => s.key === k)?.state === "recorded";
  return [
    { q: "何を、いつ、いくらで合意したか", records: "発注版、受諾者、合意済みの変更、計画の履歴", gap: has("order") && has("accept") ? null : "未回答の当事者・未確定の条件" },
    { q: "作ったものが要求に対応するか", records: "完成条件、提出コミット、同じ版の検証結果", gap: has("verify") ? null : "試験未取得（性能試験 TC-0153）・確認担当 伊藤 誠" },
    { q: "誰が何を根拠に公開したか", records: "ルール版と判定、例外、実務承認、経営判断、実配備の記録", gap: has("release") ? null : "実行許可が未発行・配備結果が未確認" },
    { q: "誰が受け取り、何が残ったか", records: "委託検収、顧客受入、差戻し・再提出、運用の引継ぎ", gap: has("inspect") && has("acceptance") ? null : "委託検収と顧客受入が未回答（対応責任者: 案件窓口）" },
  ];
}

export function V09TradeEvidence() {
  const state = useScreenState();
  const { org, project } = useOrgProject();
  const [orderId, setOrderId] = useState(state === "complete" ? "ORD-0104" : "ORD-0101");
  const chain = tradeChains[orderId];
  const order = orderById(orderId);
  const missing = chain.filter((s) => s.state !== "recorded");
  const qs = questions(orderId);

  return (
    <ProjectLayout org={org} project={project} active="tradeEvidence" trail={[{ label: "取引の証跡" }]}>
      <PageHeader
        title="取引の証跡と不足一覧"
        description="納入物を選ぶと、発注から顧客受入までの記録一式と、まだ回収できていない記録を表示します。合意の証拠は本人の操作と署名済みの記録だけで、AI の下書きは数えません。"
        actions={<Button icon="share" to={paths.shares(org, project)}>第三者に共有する範囲を選ぶ</Button>}
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          <div style={{ maxWidth: 420 }}>
            <Select
              label="納入物（発注）"
              value={orderId}
              onChange={setOrderId}
              options={Object.keys(tradeChains).map((k) => ({ value: k, label: `${k} ${orderById(k)?.title ?? ""}` }))}
            />
          </div>
          {missing.length ? (
            <Banner tone="warn" title={`未回収の記録が ${missing.length} 件あります`}>{missing.map((m) => m.label).join("、")}。対応責任者と期限は各段階に表示しています。</Banner>
          ) : (
            <Banner tone="pass" title="発注から顧客受入までの記録がそろっています">記録一式を監査パックに含められます。</Banner>
          )}
          {order ? <TradeStateStrip order={order} /> : null}
          <div className="grid main-side">
            <div className="stack">
              <Section title="記録の連鎖" sub="実行者・対象版・原本のハッシュ・時刻・訂正の履歴">
                <div className="dl-chain">
                  {chain.map((s) => (
                    <div key={s.key} className="dl-chain-step">
                      <span className={`dl-chain-dot ${s.state === "recorded" ? "" : s.state}`} aria-hidden>
                        <Icon name={s.state === "recorded" ? "check" : s.state === "missing" ? "alert" : "clock"} size={12} />
                      </span>
                      <div className="dl-chain-body">
                        <div className="row between">
                          <span className="strong small">{s.label}</span>
                          <StepState state={s.state} />
                        </div>
                        {s.version ? <span className="small">{s.version}</span> : null}
                        {s.actor ? <span className="small"><ExternalActor userId={s.actor} /></span> : null}
                        {s.at ? <span className="tiny muted">{formatDateTime(s.at)}</span> : null}
                        {s.original ? <HashDisplay value={s.original} label="原本" /> : null}
                        {s.corrections ? <span className="tiny muted">訂正: {s.corrections}</span> : null}
                        {s.note ? <span className="tiny" style={{ color: s.state === "missing" ? "var(--tone-fail)" : undefined }}>{s.note}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
            <div className="stack">
              <Section title="経営側で確認したい問い" flush>
                <div className="table-wrap">
                  <table className="table compact">
                    <tbody>
                      {qs.map((q) => (
                        <tr key={q.q}>
                          <td>
                            <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                              <span className="small strong">{q.q}</span>
                              <span className="tiny muted">集める記録: {q.records}</span>
                              {q.gap ? <Tag tone="warn" icon="alert">不足: {q.gap}</Tag> : <Tag tone="pass" icon="check">そろっています</Tag>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="証拠に数えないもの">
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  {aiDraftsExcluded.map((a) => (
                    <div key={a.id} className="stack" style={{ ["--gap" as string]: "2px" }}>
                      <span className="small"><Tag tone="special" square>AI・参考</Tag> {a.title}</span>
                      <span className="tiny muted">{a.note}</span>
                    </div>
                  ))}
                </div>
              </Section>
              <span className="tiny muted">規格の要求との対応は、Gate 0（正規資料の利用許諾と専門家レビュー）の後に確定します。</span>
            </div>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
