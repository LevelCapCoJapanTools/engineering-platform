// 画面ID: L-03 受入の状況（社内向け）
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { APPROVAL_STATUS, CUSTOMER_ACCEPTANCE, INSPECTION_STATUS } from "../../lib/vocab";
import { orders } from "../../mocks/engagement";
import { formatDate, formatDateTime } from "../../lib/format";
import { evidence, fakeSha, releases, userById } from "../../mocks/core";
import { acceptanceCriteria, acceptanceTimeline, artifacts, resubmissions } from "../../mocks/releases";
import {
  Banner,
  Button,
  CommentThread,
  DeadlineIndicator,
  EmptyState,
  EvidenceItem,
  ExternalActor,
  HashDisplay,
  Tag,
  KeyValueList,
  OptionCard,
  PageHeader,
  ResponsibilitySplit,
  ProjectLayout,
  Section,
  StatusBadge,
  Timeline,
  useToast,
} from "../../ui";

export function AcceptanceScreen({ org, project, id }: { org: string; project: string; id: string }) {
  const state = useScreenState();
  const toast = useToast();
  const rel = releases.find((r) => r.id === id) ?? releases[0];
  const customer = userById("u-nakamura");
  const status = state === "accepted" ? "approved" : state === "returned" ? "returned" : "pending";
  const [route, setRoute] = useState<"fix" | "change" | "">("");
  const [routed, setRouted] = useState(false);
  // 委託元の検収（受託者に対する検収）。最終顧客の受入とは別の記録
  const commissioned = orders.filter((o) => o.project === project && o.submission !== "none");
  const customerAcceptance = state === "accepted" ? "accepted" : state === "returned" ? "returned" : state === "notRequested" ? "notRequested" : "requested";

  return (
    <ProjectLayout org={org} project={project} active="releases" trail={[{ label: "リリースと受入", to: paths.releases(org, project) }, { label: rel.version, to: paths.release(org, project, rel.id) }, { label: "受入の状況" }]}>
      <PageHeader
        id={rel.version}
        title="受入の状況"
        status={state === "notRequested" ? undefined : APPROVAL_STATUS[status]}
        description="最終顧客の受入を、案件窓口が依頼して回収します。顧客は期限付きの承認リンクまたは顧客ポータルで本人確認して対象版に回答します。委託先（受託者）への検収とは別の記録です。"
        actions={
          state === "notRequested" ? (
            <Button variant="primary" icon="send" onClick={() => toast({ kind: "success", message: "案件窓口が顧客に受入の依頼を送りました（対象版 v1.2.1・回答期限 12/4）" })}>受入の依頼を送る（窓口）</Button>
          ) : status === "pending" ? (
            <Button icon="mail" onClick={() => toast({ kind: "info", message: "案件窓口が顧客に催促を送りました。回答があれば旧い催促は止めます" })}>催促を送る（窓口）</Button>
          ) : null
        }
      />
      {state === "notRequested" ? (
        <div className="card">
          <EmptyState icon="mail" title="まだ受入を依頼していません" description="配備の結果を確認した後、案件窓口が顧客に受入を依頼します。依頼すると、顧客に期限付きの承認リンク（または顧客ポータル）で対象版・確認手順・回答期限が届きます。" />
        </div>
      ) : (
        <>
          {status === "returned" ? (
            <Banner tone="fail" title="顧客が受入を差し戻しました">案件窓口が理由を確認し、「修正（合意した条件に合わない）」か「変更（新しい希望）」に振り分けます。差戻しの回答は v1.2.1 に対するもので、別の版の承認には使えません。</Banner>
          ) : status === "approved" ? (
            <Banner tone="pass" title="顧客が受け入れました">受入記録は Evidence Manifest に含まれ、WORM の保管先に保存されています。</Banner>
          ) : null}
          <div className="grid main-side">
            <div className="stack">
              <Section title="委託検収と顧客受入（別の記録）" sub="受託者の成果に対する委託元の検収と、最終顧客の受入は別々に記録します" flush>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>対象</th><th>委託元の検収</th><th>顧客の受入</th></tr></thead>
                    <tbody>
                      {commissioned.map((o) => (
                        <tr key={o.id}>
                          <td className="small"><span className="mono">{o.id}</span> {o.title}</td>
                          <td><StatusBadge vocab={INSPECTION_STATUS[o.inspection]} size="sm" /></td>
                          <td><StatusBadge vocab={CUSTOMER_ACCEPTANCE[o.customer_acceptance]} size="sm" /></td>
                        </tr>
                      ))}
                      <tr>
                        <td className="small"><span className="mono">{rel.version}</span> リリース全体</td>
                        <td className="tiny muted">対象外（受託者の成果ごとに検収）</td>
                        <td><StatusBadge vocab={CUSTOMER_ACCEPTANCE[customerAcceptance]} size="sm" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "10px 20px" }} className="tiny muted">最終顧客が未回答でも、委託元の検収・給付の受領日・受託者の支払期日は変わりません。</div>
              </Section>
              <Section title="受入の種類">
                <div className="grid cols-2">
                  <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                    <Tag tone="info" square>事前受入（この納入）</Tag>
                    <span className="small">契約（基本契約 第12条）で、本番公開の前に顧客の受入試験が必要です。受入の回答が得られるまで、受入済みとして扱いません。</span>
                  </div>
                  <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                    <Tag square>公開後の確認</Tag>
                    <span className="small">軽微な修正は、公開後に顧客が動作を確認します。確認の回答は受入とは別に記録します。</span>
                  </div>
                </div>
              </Section>
              {status === "returned" ? (
                <Section title="差戻し理由の振り分け" sub="案件窓口が判断します。顧客の新しい希望だけで受託者に無償の修正を起票しません">
                  <div className="stack">
                    <OptionCard name="route" value="fix" checked={route === "fix"} onChange={(v) => setRoute(v as "fix")} title="修正（合意した完成条件に合わない）" description="受託者に対象版と再現条件を付けて修正を依頼します（同じ発注の範囲内）" />
                    <OptionCard name="route" value="change" checked={route === "change"} onChange={(v) => setRoute(v as "change")} title="変更（範囲外の新しい希望）" description="変更の再合意に回します。顧客条件と委託条件の両方で費用・期限・承認者を確認します" />
                    <div className="row end">
                      <Button variant="primary" icon="send" disabled={!route || routed} disabledReason={routed ? "振り分け済みです" : "振り分け先を選んでください"} onClick={() => { setRouted(true); toast({ kind: "success", message: route === "fix" ? "受託者に修正を依頼しました（ORD-0101 の範囲内）" : "変更の再合意として案件窓口の受信箱に起票しました" }); }}>
                        {routed ? "振り分け済み" : "振り分ける"}
                      </Button>
                    </div>
                  </div>
                </Section>
              ) : null}
              <Section title="依頼内容">
                <KeyValueList
                  items={[
                    { label: "依頼先", value: <ExternalActor userId={customer?.id} role="発注側検収者" /> },
                    { label: "依頼と回収", value: <ExternalActor userId="u-aoki" role="案件窓口" /> },
                    { label: "判断の方法", value: "期限付きの承認リンク（メールのワンタイムコードで本人確認）。回答は対象版に紐付きます" },
                    { label: "依頼日", value: formatDate("2026-11-20") },
                    { label: "回答期限", value: <DeadlineIndicator date="2026-12-04" /> },
                    { label: "メッセージ", value: "v1.2.1（検索不具合の修正）の受入確認をお願いします。チェックリストに沿ってご確認ください。" },
                  ]}
                />
              </Section>
              <Section title="受入条件" sub="顧客と合意した条件。すべて確認されると受入できます" flush>
                <div className="table-wrap">
                  <table className="table compact">
                    <tbody>
                      {acceptanceCriteria.map((c) => (
                        <tr key={c.id}>
                          <td className="small">{c.title}</td>
                          <td style={{ width: 120 }}>{c.state === "ok" || status === "approved" ? <Tag tone="pass" icon="check">確認済み</Tag> : <Tag icon="clock">未確認</Tag>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="納入物" sub="顧客は受け取ったファイルのハッシュを一覧と照合できます" flush>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>名前</th><th>SHA-256</th><th className="num">サイズ</th></tr></thead>
                    <tbody>
                      {artifacts(true).map((a) => (
                        <tr key={a.name}><td className="mono small">{a.name}</td><td><HashDisplay value={a.sha256} /></td><td className="num small">{a.size}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="差戻しと再提出の経緯" sub="再提出は新しい版として記録します" flush>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>版</th><th>提出日時</th><th>結果</th><th>理由</th><th>納入物のダイジェスト</th></tr></thead>
                    <tbody>
                      {resubmissions.map((r) => (
                        <tr key={r.version}>
                          <td className="mono small">{r.version}</td>
                          <td className="small">{formatDateTime(r.submitted_at)}</td>
                          <td>{r.result === "returned" ? <Tag tone="fail">差戻し</Tag> : status === "approved" ? <Tag tone="pass">受入</Tag> : status === "returned" ? <Tag tone="fail">差戻し</Tag> : <Tag tone="warn">判断待ち</Tag>}</td>
                          <td className="small">{r.reason}</td>
                          <td><HashDisplay value={r.digest} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="顧客のコメント">
                <CommentThread
                  comments={
                    status === "returned"
                      ? [{ id: "c1", user_id: "u-nakamura", body: "検索結果の並び順が発注日の降順になっていません。修正をお願いします。", at: "2026-11-26T15:20:00+09:00" }]
                      : status === "approved"
                        ? [{ id: "c1", user_id: "u-nakamura", body: "確認しました。問題ありません。", at: "2026-11-26T15:20:00+09:00" }]
                        : []
                  }
                />
              </Section>
            </div>
            <div className="stack">
              <Section title="責任の分担">
                <ResponsibilitySplit decide={<span className="small">受入・差戻し（発注側の検収者）</span>} act={<ExternalActor userId="u-aoki" role="案件窓口" />} note="窓口は依頼・催促・回収と、差戻し理由の振り分けを行います。受入の判断は代行しません。" />
              </Section>
              <Section title="顧客の判断">
                <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                  <div className="row between"><ExternalActor userId={customer?.id} role="顧客" /><StatusBadge vocab={APPROVAL_STATUS[status]} size="sm" /></div>
                  <span className="small muted">受入条件 {status === "pending" ? "2/4" : "4/4"} 確認済み</span>
                </div>
              </Section>
              <Section title="受入記録">
                {status === "approved" ? (
                  <EvidenceItem ev={{ id: "EV-1209", kind: "受入記録", title: `${rel.version} の顧客受入`, source: { kind: "human", name: customer?.name ?? "" }, sha256: fakeSha("accept"), recorded_at: "2026-11-26T15:21:00+09:00", status: "worm" }} />
                ) : (
                  <EvidenceItem ev={evidence.find((e) => e.missing) ?? evidence[0]} />
                )}
              </Section>
              <Section title="経緯">
                <Timeline items={acceptanceTimeline} compact />
              </Section>
            </div>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
