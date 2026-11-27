// 画面ID: L-03 受入の状況（社内向け）
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { APPROVAL_STATUS } from "../../lib/vocab";
import { formatDate } from "../../lib/format";
import { evidence, fakeSha, releases, userById } from "../../mocks/core";
import { acceptanceTimeline, artifacts } from "../../mocks/releases";
import {
  Banner,
  Button,
  CommentThread,
  DeadlineIndicator,
  EmptyState,
  EvidenceItem,
  HashDisplay,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  Section,
  StatusBadge,
  Timeline,
  UserChip,
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
        description="顧客が操作する受入画面は顧客ポータルにあります。この画面では依頼内容と顧客の判断を確認します。"
        actions={
          state === "notRequested" ? (
            <Button variant="primary" icon="mail" onClick={() => toast({ kind: "success", message: "受入を依頼しました" })}>受入を依頼</Button>
          ) : status === "pending" ? (
            <Button icon="mail" onClick={() => toast({ kind: "info", message: "顧客にリマインドを送りました" })}>リマインドを送る</Button>
          ) : null
        }
      />
      {state === "notRequested" ? (
        <div className="card">
          <EmptyState icon="mail" title="まだ受入を依頼していません" description="リリース承認の後、顧客に受入を依頼します。依頼すると顧客ポータルに受入のチェックリストが表示されます。" action={<Button variant="primary" icon="mail" onClick={() => toast({ kind: "success", message: "受入を依頼しました" })}>受入を依頼</Button>} />
        </div>
      ) : (
        <>
          {status === "returned" ? (
            <Banner tone="fail" title="顧客が受入を差し戻しました">差戻しの理由を確認し、修正版のリリースを準備してください。</Banner>
          ) : status === "approved" ? (
            <Banner tone="pass" title="顧客が受け入れました">受入記録は Evidence Manifest に含まれ、WORM の保管先に保存されています。</Banner>
          ) : null}
          <div className="grid main-side">
            <div className="stack">
              <Section title="依頼内容">
                <KeyValueList
                  items={[
                    { label: "依頼先", value: <UserChip user={customer} /> },
                    { label: "依頼者", value: <UserChip user={userById("u-sato")} /> },
                    { label: "依頼日", value: formatDate("2026-11-20") },
                    { label: "回答期限", value: <DeadlineIndicator date="2026-12-04" /> },
                    { label: "メッセージ", value: "v1.2.1（検索不具合の修正）の受入確認をお願いします。チェックリストに沿ってご確認ください。" },
                  ]}
                />
              </Section>
              <Section title="納入物" flush>
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
                  <div className="row between"><UserChip user={customer} /><StatusBadge vocab={APPROVAL_STATUS[status]} size="sm" /></div>
                  <span className="small muted">チェックリスト {status === "pending" ? "2/4" : "4/4"} 確認済み</span>
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
