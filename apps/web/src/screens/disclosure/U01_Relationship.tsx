// 画面ID: U-01 顧客企業と案件の関係
import "./disclosure.css";
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { projectRelations } from "../../mocks/disclosure";
import type { ProjectRelation } from "../../mocks/disclosure";
import { userById } from "../../mocks/core";
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  ExternalActor,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  RelationshipTag,
  ResponsibilitySplit,
  Section,
  Skeleton,
  Tag,
  useToast,
} from "../../ui";

const INVITE_LABEL: Record<ProjectRelation["invite"]["status"], string> = { notInvited: "未招待", invited: "招待済み（未参加）", joined: "参加済み" };

export function RelationshipScreen({ org = ORG, project = PROJECT }: { org?: string; project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const rel = projectRelations.find((r) => r.project === project) ?? projectRelations[0];
  const sameCompany = projectRelations.filter((r) => r.customer_company === rel.customer_company && r.project !== rel.project);
  const retail = projectRelations.filter((r) => r.customer_company === "架空リテール株式会社");

  return (
    <ProjectLayout org={org} project={project} active="relationship" trail={[{ label: "顧客との関係" }]}>
      <PageHeader
        title="顧客企業と案件の関係"
        description="案件ごとに、発注企業、契約当事者、取引の型（外注取引型／業務提携型）、対象の契約と期間を登録します。同じ会社でも、案件ごとに型と公開範囲を分けて扱います。"
        actions={<Button variant="primary" icon="eye" to={paths.disclosure(org, project)}>公開設定へ</Button>}
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : state === "empty" ? (
        <div className="card">
          <EmptyState icon="building" title="この案件には発注企業が登録されていません" description="発注企業と取引の型を登録すると、顧客ポータルへの招待と公開設定ができるようになります。" action={<Button variant="primary" icon="plus" onClick={() => toast({ kind: "info", message: "登録フォームを開きました（モック）" })}>発注企業を登録</Button>} />
        </div>
      ) : (
        <>
          {state === "invited" ? (
            <Banner tone="info" title="招待した時点では、案件名と招待内容だけが見えます">
              発注企業が参加しても、公開設定で項目を選んで公開するまで、進捗・金額・資料は表示されません。
            </Banner>
          ) : null}
          <Section title={rel.project_name} sub={rel.customer_company} actions={<RelationshipTag value={rel.relationship} />}>
            <KeyValueList
              cols={2}
              items={[
                { label: "発注企業", value: rel.customer_company },
                { label: "取引の型", value: <RelationshipTag value={rel.relationship} /> },
                { label: "契約当事者", value: <div className="stack" style={{ ["--gap" as string]: "2px" }}>{rel.contract_parties.map((c) => <span key={c} className="small">{c}</span>)}</div> },
                { label: "対象の契約と期間", value: <div className="stack" style={{ ["--gap" as string]: "2px" }}>{rel.contracts.map((c) => <span key={c.id} className="small"><span className="mono">{c.id}</span> {c.title}（{c.period}）</span>)}</div> },
                { label: "受注側統括責任者（JV責任者）", value: <ExternalActor userId={rel.jv_lead_id} /> },
                { label: "発注側プロジェクト責任者", value: <ExternalActor userId={rel.customer_lead_id} /> },
                { label: "顧客ポータルへの招待", value: <span className="row"><Tag tone={rel.invite.status === "joined" ? "pass" : rel.invite.status === "invited" ? "warn" : "neutral"}>{state === "invited" ? "招待済み（未参加）" : INVITE_LABEL[rel.invite.status]}</Tag>{rel.invite.invited_at ? <span className="tiny muted">{formatDate(rel.invite.invited_at)}</span> : null}</span> },
                { label: "顧客に見えている範囲", value: state === "invited" ? "案件名と招待内容のみ" : rel.invite.visible },
              ]}
            />
          </Section>
          <Section title="判断と実務の分担">
            <ResponsibilitySplit
              decide={<span className="small">公開範囲・提携範囲は <strong>{userById(rel.jv_lead_id)?.name}</strong>（JV責任者）が決めます</span>}
              act={<span className="small">顧客側で誰が閲覧・承認・検収・署名できるかは <strong>{userById(rel.customer_lead_id)?.name}</strong> の会社の管理者が登録します</span>}
              note="JV責任者は自社側の情報公開を決め、顧客側の権限者は顧客企業が契約上の権限内で決めます。"
            />
          </Section>
          <Section title={`同じ会社の案件（${rel.customer_company}）`} sub="案件ごとに型と費目を分けます。別の案件の費目・条件は表示されません" flush>
            {sameCompany.length === 0 ? (
              <div className="card-body"><span className="small muted">この会社との案件はほかにありません。</span></div>
            ) : (
              <RelationTable rows={sameCompany} />
            )}
          </Section>
          <Section title="例: 架空リテール株式会社との2案件" sub="同じ会社でも、業務提携型の案件の共同費目は、外注取引型の案件には表示されません" flush>
            <RelationTable rows={retail} />
          </Section>
        </>
      )}
    </ProjectLayout>
  );
}

function RelationTable({ rows }: { rows: ProjectRelation[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>案件</th><th>取引の型</th><th>この案件で顧客に見える費目</th><th>招待</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.project}>
              <td><div className="strong small">{r.project_name}</div><div className="tiny muted mono">{r.project}</div></td>
              <td><RelationshipTag value={r.relationship} /></td>
              <td><div className="row" style={{ ["--gap" as string]: "4px" }}>{r.cost_items.map((c) => <Tag key={c} square>{c}</Tag>)}</div></td>
              <td><span className="small">{INVITE_LABEL[r.invite.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
