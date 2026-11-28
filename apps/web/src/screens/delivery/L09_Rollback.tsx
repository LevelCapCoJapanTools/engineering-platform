// 画面ID: L-09 配備失敗・切戻し・続報
// 一部が失敗したら後続を止め、運用責任者に前版・影響・切戻し手順を渡す。復旧確認と顧客への続報は窓口が追う（改修 28）。
// 承認済みの手順で復旧を確認するまで案件は完了にしない。
import "./delivery.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { DEPLOY_STATUS } from "../../lib/vocab";
import { customerFollowUps, failureSummary, rollbackSteps } from "../../mocks/delivery";
import { releases } from "../../mocks/core";
import {
  Banner,
  Button,
  ConfirmDialog,
  ErrorState,
  ExternalActor,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  ResponsibilitySplit,
  Section,
  Skeleton,
  Tag,
  useToast,
} from "../../ui";
import { useOrgProject } from "./parts";

export const L09_STATES = ["default", "rollingBack", "recovered", "loading", "error"];

export function L09Rollback() {
  const state = useScreenState();
  const toast = useToast();
  const { org, project, id } = useOrgProject();
  const rel = releases.find((r) => r.id === id) ?? releases[0];
  const recovered = state === "recovered";
  const [confirm, setConfirm] = useState(false);
  const status = recovered ? "rolledBack" : "failed";
  const followUps = recovered ? customerFollowUps.map((f) => ({ ...f, state: "sent" as const })) : customerFollowUps;

  return (
    <ProjectLayout org={org} project={project} active="releases" trail={[{ label: "リリースと受入", to: paths.releases(org, project) }, { label: rel.version, to: paths.release(org, project, rel.id) }, { label: "配備失敗・切戻し" }]}>
      <PageHeader
        id={rel.version}
        title="配備失敗・切戻し・続報"
        status={DEPLOY_STATUS[status]}
        description="配備の一部が失敗したため、後続の作業を止めました。切戻しの判断と実行は運用責任者が行い、顧客への続報は案件窓口が送ります。"
        actions={
          <Button variant="primary" icon="check" disabled={recovered || state !== "rollingBack"} disabledReason={recovered ? "復旧を確認済みです" : "切戻しを実行してから復旧を確認します"} onClick={() => setConfirm(true)}>
            復旧を確認
          </Button>
        }
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {recovered ? (
            <Banner tone="pass" title="前の版への切戻しと動作を確認しました">承認済みの手順 RB-03 で復旧しました。v1.4.0 は配備されていないため、案件は完了していません。再実施には新しい実行許可が必要です。</Banner>
          ) : state === "rollingBack" ? (
            <Banner tone="warn" title="切戻しを実行中です">運用責任者が手順 RB-03 を実行しています。復旧の確認が取れるまで、案件は完了になりません。</Banner>
          ) : (
            <Banner tone="fail" title={`${formatDateTime(failureSummary.at)}: ${failureSummary.failed_step}が失敗しました`}>後続の作業を止め、運用責任者に切戻しの判断を依頼しました。二重に実行しないよう、同じ実行許可での再起動はできません。</Banner>
          )}
          <div className="grid main-side">
            <div className="stack">
              <Section title="失敗の内容">
                <KeyValueList
                  items={[
                    { label: "失敗した段階", value: failureSummary.failed_step },
                    { label: "完了した段階", value: failureSummary.succeeded.join("、") },
                    { label: "止めた作業", value: failureSummary.stopped.join("、") },
                    { label: "前の版", value: <span className="small">{failureSummary.previous}</span> },
                    { label: "顧客への影響", value: failureSummary.impact },
                  ]}
                />
              </Section>
              <Section title="切戻しの手順" sub={failureSummary.procedure}>
                <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>
                  {rollbackSteps.map((s, i) => (
                    <li key={s} style={{ marginBottom: 4 }}>
                      {s} {recovered || (state === "rollingBack" && i === 0) ? <Tag tone="pass" icon="check">完了</Tag> : state === "rollingBack" && i === 1 ? <Tag tone="info" icon="refresh">実行中</Tag> : null}
                    </li>
                  ))}
                </ol>
              </Section>
              <Section title="顧客への続報" sub="案件窓口が送ります。障害の説明を含む連絡は責任者の確認後に送ります" flush>
                <div className="table-wrap">
                  <table className="table compact">
                    <thead><tr><th>続報</th><th>内容</th><th>確認者</th><th>状態</th></tr></thead>
                    <tbody>
                      {followUps.map((f) => (
                        <tr key={f.id}>
                          <td className="small">{f.id}<div className="tiny muted">{formatDateTime(f.at)}</div></td>
                          <td className="small">{f.text}</td>
                          <td>{f.approved_by ? <ExternalActor userId={f.approved_by} /> : <span className="tiny muted">確認待ち</span>}</td>
                          <td>{f.state === "sent" ? <Tag tone="pass" icon="check">送信済み</Tag> : <Tag tone="warn" icon="clock">予定</Tag>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
            <div className="stack">
              <Section title="責任の分担">
                <ResponsibilitySplit
                  decide={<span className="small">切戻しの判断（運用責任者: <ExternalActor userId={failureSummary.owner_id} />）</span>}
                  act={<span className="small">顧客への続報と再実施日の調整（<ExternalActor userId="u-aoki" role="案件窓口" />）</span>}
                  note="受託者には、原因がコードにあり合意した完成条件を満たさない場合だけ、対象版と再現条件を付けて修正を依頼します。"
                />
              </Section>
              <Section title="案件の完了条件">
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  <div className="row between"><span className="small">復旧の確認（承認済みの手順）</span>{recovered ? <Tag tone="pass" icon="check">確認済み</Tag> : <Tag icon="clock">未確認</Tag>}</div>
                  <div className="row between"><span className="small">v1.4.0 の配備の確認</span><Tag icon="clock">未実施</Tag></div>
                  <div className="row between"><span className="small">顧客の受入</span><Tag icon="clock">依頼前</Tag></div>
                </div>
              </Section>
              <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.deployment(org, project, rel.id)}>配備の記録を開く</Button>
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="復旧を確認しますか"
        message="前の版のヘルスチェックと受注一覧の表示を確認した結果として記録します。v1.4.0 の配備は未完了のままです。"
        confirmLabel="復旧を確認"
        onConfirm={() => toast({ kind: "success", message: "復旧を記録しました。案件窓口が第2報を送ります" })}
      />
    </ProjectLayout>
  );
}
