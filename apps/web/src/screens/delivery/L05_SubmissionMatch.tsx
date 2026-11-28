// 画面ID: L-05 提出と検証の照合
// 受託者の提出を、合意した完成条件・対象コミット・ビルド・テスト・検証者とそろえる（改修 23）。
// 別コミットで成功したテストを提出版の結果として流用しない。
import "./delivery.css";
import { useState } from "react";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { matchRows, staleRunExample } from "../../mocks/delivery";
import { orderById, submissions } from "../../mocks/engagement";
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  ExternalActor,
  PageHeader,
  ProjectLayout,
  ResponsibilitySplit,
  Section,
  Skeleton,
  Tag,
  TradeStateStrip,
  useToast,
} from "../../ui";
import { CheckCell, shortSha, useOrgProject } from "./parts";

export const L05_STATES = ["default", "staleRun", "empty", "loading", "error"];

export function L05SubmissionMatch() {
  const state = useScreenState();
  const toast = useToast();
  const { org, project } = useOrgProject();
  const rows = state === "empty" ? [] : matchRows;
  const [selected, setSelected] = useState("ORD-0101");
  const row = rows.find((r) => r.order_id === selected) ?? rows[0];
  const order = row ? orderById(row.order_id) : undefined;
  const sub = row?.submission_id ? submissions.find((s) => s.id === row.submission_id) : undefined;
  const [routed, setRouted] = useState(false);

  return (
    <ProjectLayout org={org} project={project} active="submissionsMatch" trail={[{ label: "提出と検証の照合" }]}>
      <PageHeader
        title="提出と検証の照合"
        description="受託者の提出を、合意した完成条件、提出時点のコミット、そのコミットのビルドとテスト、検証者とそろえます。別のコミットで成功した結果は流用しません。不足分は案件窓口が対応先に回します。"
      />
      {state === "loading" ? (
        <Skeleton variant="table" />
      ) : state === "error" ? (
        <ErrorState />
      ) : rows.length === 0 ? (
        <div className="card"><EmptyState icon="inbox" title="照合する提出はまだありません" description="受託者が成果を提出すると、ここに提出版と検証結果の対応が表示されます。" /></div>
      ) : (
        <>
          {state === "staleRun" ? (
            <Banner tone="fail" title="別のコミットの成功結果は照合に使えません">
              CI 実行 {staleRunExample.run_id}（コミット {shortSha(staleRunExample.sha)}）は提出版 {shortSha(row?.commit_sha)} とは別のコミットの結果です。{staleRunExample.note}。
            </Banner>
          ) : null}
          <Section title="提出ごとの照合" sub="ビルドとテストは、提出版と同じコミットの結果だけを数えます" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>発注</th><th>受託者</th><th>提出版</th><th>ビルド</th><th>テスト</th><th>完成条件</th><th>検証者</th></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const ok = r.criteria.filter((c) => c.state === "ok").length;
                    return (
                      <tr key={r.order_id} className={r.order_id === selected ? "selected" : undefined} onClick={() => setSelected(r.order_id)} style={{ cursor: "pointer" }}>
                        <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="mono small">{r.order_id}</span><span className="small">{r.title}</span></div></td>
                        <td><ExternalActor userId={r.freelancer_id} /></td>
                        <td>{r.commit_sha ? <span className="mono small">{shortSha(r.commit_sha)}</span> : <Tag>未提出</Tag>}</td>
                        <td>{r.build ? <CheckCell state={state === "staleRun" && r.order_id === "ORD-0101" ? "otherSha" : r.build.state}>{r.build.run_id}</CheckCell> : <CheckCell state="missing" />}</td>
                        <td>{r.tests ? <CheckCell state={state === "staleRun" && r.order_id === "ORD-0101" ? "otherSha" : r.tests.state}>{r.tests.passed}件成功・{r.tests.failed}件失敗</CheckCell> : <CheckCell state="missing" />}</td>
                        <td className="small">{ok}/{r.criteria.length} 確認済み</td>
                        <td>{r.verifier_id ? <ExternalActor userId={r.verifier_id} role="検証者" /> : <span className="muted small">未割当</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
          {row && order ? (
            <div className="grid main-side">
              <div className="stack">
                <Section title={`${row.order_id} ${row.title}`} sub="合意した完成条件ごとの根拠">
                  <div className="stack">
                    <TradeStateStrip order={order} />
                    <div className="table-wrap">
                      <table className="table compact">
                        <thead><tr><th>完成条件（受諾した版）</th><th>結果</th><th>根拠</th></tr></thead>
                        <tbody>
                          {row.criteria.map((c) => (
                            <tr key={c.title}>
                              <td className="small">{c.title}</td>
                              <td><CheckCell state={state === "staleRun" && c.state === "ok" ? "otherSha" : c.state} /></td>
                              <td className="small">{state === "staleRun" && c.state === "ok" ? `別コミット ${shortSha(staleRunExample.sha)} の結果のため数えない` : c.evidence}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Section>
                {row.route_to ? (
                  <Section title="不足分の対応先" sub="不足は受託者に聞き返さず、窓口が担当に回します">
                    <div className="stack">
                      <div className="row between">
                        <span className="small"><ExternalActor userId={row.route_to.who} role="QA" /> — {row.route_to.what}（期限 {row.route_to.due.replace(/-/g, "/")}）</span>
                        <Button size="sm" icon="send" disabled={routed} disabledReason="回付済みです" onClick={() => { setRouted(true); toast({ kind: "success", message: "検証者に回しました。期限を窓口の受信箱で追跡します" }); }}>{routed ? "回付済み" : "対応先へ回す"}</Button>
                      </div>
                      <ResponsibilitySplit decide={<span className="small">検収の合否（委託元の検収者）</span>} act={<ExternalActor userId="u-aoki" role="案件窓口" />} note="受託者には、合意した完成条件に照らした修正が必要な場合だけ連絡します。" />
                    </div>
                  </Section>
                ) : null}
              </div>
              <div className="stack">
                <Section title="提出版">
                  {sub ? (
                    <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                      <span className="small">提出 {sub.id}・{formatDateTime(sub.submitted_at)}</span>
                      <span className="mono small">{sub.commit_sha}</span>
                      <a href={sub.external_url} className="small" target="_blank" rel="noreferrer">{sub.external_url}</a>
                      <span className="small">受託者の確認: {sub.checks}</span>
                      {sub.notes ? <span className="small">注意点: {sub.notes}</span> : null}
                      <span className="tiny muted">PR の先端が後で動いても、照合はこのコミットで行います。</span>
                    </div>
                  ) : (
                    <span className="small muted">まだ提出されていません。</span>
                  )}
                </Section>
                <Section title="関連">
                  <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                    <Link to={paths.builds(org, project)} className="small">ビルド・CI証跡</Link>
                    <Link to={paths.releaseCandidate(org, project, "rel-140")} className="small">リリース候補（v1.4.0）</Link>
                    <Link to={paths.tradeEvidence(org, project)} className="small">取引の証跡</Link>
                  </div>
                </Section>
              </div>
            </div>
          ) : null}
        </>
      )}
    </ProjectLayout>
  );
}
