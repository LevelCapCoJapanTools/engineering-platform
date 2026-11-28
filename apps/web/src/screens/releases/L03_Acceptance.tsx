// 画面ID: L-03 受入の状況（社内向け）
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { APPROVAL_STATUS } from "../../lib/vocab";
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
  PageHeader,
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

  return (
    <ProjectLayout org={org} project={project} active="releases" trail={[{ label: "リリースと受入", to: paths.releases(org, project) }, { label: rel.version, to: paths.release(org, project, rel.id) }, { label: "受入の状況" }]}>
      <PageHeader
        id={rel.version}
        title="受入の状況"
        status={state === "notRequested" ? undefined : APPROVAL_STATUS[status]}
        description="顧客は期限付きの承認リンクまたは顧客ポータルで受入を判断し、本人確認の結果とともに記録されます。この画面では納入物・受入条件・顧客の判断・差戻しと再提出の経緯を確認します。"
        actions={
          status === "pending" && state !== "notRequested" ? (
            <Button icon="mail" onClick={() => toast({ kind: "info", message: "PM と顧客にリマインドを送りました" })}>リマインドを送る</Button>
          ) : null
        }
      />
      {state === "notRequested" ? (
        <div className="card">
          <EmptyState icon="mail" title="まだ受入を依頼していません" description="リリース承認の後、PM が顧客に受入を依頼します。依頼すると、顧客に期限付きの承認リンク（または顧客ポータル）で受入のチェックリストが届きます。" />
        </div>
      ) : (
        <>
          {status === "returned" ? (
            <Banner tone="fail" title="顧客が受入を差し戻しました">差戻しの理由を確認し、修正版を再提出します。再提出は新しい版として記録され、前の版の記録は残ります。</Banner>
          ) : status === "approved" ? (
            <Banner tone="pass" title="顧客が受け入れました">受入記録は Evidence Manifest に含まれ、WORM の保管先に保存されています。</Banner>
          ) : null}
          <div className="grid main-side">
            <div className="stack">
              <Section title="依頼内容">
                <KeyValueList
                  items={[
                    { label: "依頼先", value: <ExternalActor userId={customer?.id} role="顧客" /> },
                    { label: "依頼者", value: <ExternalActor userId="u-sato" role="PM" /> },
                    { label: "判断の方法", value: "期限付きの承認リンク（メールのワンタイムコードで本人確認）" },
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
