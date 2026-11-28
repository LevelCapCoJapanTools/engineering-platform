// 画面ID: U-05 共同事業の収支・決裁（受注側）
import "./disclosure.css";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { yen } from "../../lib/format";
import { engagementOf } from "../../mocks/engagement";
import { jointApprovals, jointLimits, jointMonthly } from "../../mocks/disclosure";
import { userById } from "../../mocks/core";
import {
  AudienceTag,
  Banner,
  Button,
  EmptyState,
  ErrorState,
  Masked,
  PageHeader,
  ProjectLayout,
  RelationshipTag,
  Section,
  Skeleton,
  StatCard,
  Tag,
} from "../../ui";
import { JointApprovalCard } from "./parts";

/** 社内計画で共同費目に割り当てた自社負担の見込み（社内のみ） */
const INTERNAL_PLAN: Record<string, number> = { "共同試験費": 450_000, "ストア掲載素材の制作費": 0 };

export function JointFinanceScreen({ org = ORG, project }: { org?: string; project?: string }) {
  const state = useScreenState();
  const outsourcing = state === "outsourcing";
  const slug = outsourcing ? "order-renewal" : project && engagementOf(project)?.relationship === "alliance" ? project : "member-app-api";
  const eng = engagementOf(slug)!;
  const overLimit = state === "overLimit";
  const items = (eng.joint_items ?? []).map((i) => (overLimit && i.name === "共同試験費" ? { ...i, actual: 860_000 } : i));
  const mine = "サンプルソフト株式会社";

  return (
    <ProjectLayout org={org} project={slug} active="jointFinance" trail={[{ label: "共同事業の収支" }]}>
      <PageHeader
        title="共同事業の収支・決裁"
        description="提携契約で合意した共同費目・負担比率・実績・承認上限だけを持つ表です。提携先にはこの表の内容だけを公開します。開発費・粗利などの社内の値は、合計や絞込みからも求められないように分けています。"
        actions={eng.relationship === "alliance" ? <Button icon="eye" to={paths.disclosurePreview(org, slug)}>提携先の見え方を確認</Button> : undefined}
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : eng.relationship !== "alliance" ? (
        <div className="card">
          <EmptyState icon="scale" title="この案件は外注取引型のため対象外です" description={`${eng.customer_company} との契約には共同費目の取決めがありません。共同事業の収支表は業務提携型の案件だけで作ります。`} action={<Button to={paths.jointFinance(org, "member-app-api")}>業務提携型の案件を見る</Button>} />
        </div>
      ) : (
        <>
          {overLimit ? (
            <Banner tone="warn" title="共同試験費の実績が承認上限（80万円）を超える見込みです">
              提携契約 CT-0021 で定めた上限を超える支出は、両社の共同決裁が必要です。決裁 JDC-004 を {eng.customer_company} に回付しています。
            </Banner>
          ) : null}
          <div className="row">
            <RelationshipTag value={eng.relationship} />
            <span className="small">{eng.customer_company} · 提携契約 CT-0021 · JV責任者 {userById(eng.jv_lead_id)?.name}</span>
          </div>
          <div className="grid auto-fit">
            {items.map((i) => (
              <StatCard key={i.name} label={`${i.name}（実績／上限）`} value={`${(i.actual / 10_000).toLocaleString("ja-JP")}万`} unit={`／${((jointLimits[i.name] ?? i.budget) / 10_000).toLocaleString("ja-JP")}万円`} tone={i.actual > (jointLimits[i.name] ?? i.budget) ? "danger" : undefined} delta={i.share.map((s) => `${s.company.replace("株式会社", "")} ${Math.round(s.ratio * 100)}%`).join(" · ")} />
            ))}
          </div>
          <Section title="共同費目" sub="提携先と共有する表です（公開版 PUB-0007 で月次の集計を公開）" actions={<AudienceTag value="alliance" />} flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>費目</th><th className="num">予算</th><th className="num">承認上限</th><th className="num">実績</th><th className="num">残</th><th>負担比率</th><th>各社の負担額（予算）</th></tr></thead>
                <tbody>
                  {items.map((i) => {
                    const limit = jointLimits[i.name] ?? i.budget;
                    return (
                      <tr key={i.name}>
                        <td className="strong small">{i.name}</td>
                        <td className="num small">{yen(i.budget)}</td>
                        <td className="num small">{yen(limit)}</td>
                        <td className="num small">{yen(i.actual)}{i.actual > limit ? <Tag tone="fail" square>上限超過</Tag> : null}</td>
                        <td className="num small">{yen(Math.max(0, i.budget - i.actual))}</td>
                        <td className="small">{i.share.map((s) => `${s.company.replace("株式会社", "")} ${Math.round(s.ratio * 100)}%`).join(" / ")}</td>
                        <td className="small">{i.share.map((s) => <div key={s.company}>{s.company}: {yen(i.budget * s.ratio)}</div>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="card-body"><span className="tiny muted">合計行は置いていません。共同費目以外の費用（開発費など）は、この表の合計・絞込み・書き出しのどれにも含まれません。</span></div>
          </Section>
          <Section title="月次の実績" actions={<AudienceTag value="alliance" />} flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>月</th><th>費目</th><th className="num">実績</th></tr></thead>
                <tbody>{jointMonthly.map((m) => <tr key={`${m.month}-${m.item}`}><td className="small">{m.month.replace("-", "/")}</td><td className="small">{m.item}</td><td className="num small">{yen(m.actual)}</td></tr>)}</tbody>
              </table>
            </div>
          </Section>
          <Section title="共同決裁" sub="承認上限を超える改訂や負担比率の変更は、提携契約で定めた両社の決裁者がそれぞれ承認します">
            <div className="stack">{jointApprovals.map((a) => <JointApprovalCard key={a.id} item={a} myCompany={mine} />)}</div>
          </Section>
          <Section title="社内計画との差額" sub="社内のみ。提携先には表示しません" actions={<AudienceTag value="internal" />} flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>費目</th><th className="num">自社負担（予算）</th><th className="num">社内計画の割当</th><th className="num">差額</th></tr></thead>
                <tbody>
                  {items.map((i) => {
                    const own = i.budget * (i.share.find((s) => s.company === mine)?.ratio ?? 0);
                    const plan = INTERNAL_PLAN[i.name] ?? 0;
                    return <tr key={i.name}><td className="small">{i.name}</td><td className="num small">{yen(own)}</td><td className="num small">{yen(plan)}</td><td className="num small">{own - plan > 0 ? "+" : ""}{yen(own - plan)}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="card-body row between">
              <span className="small">開発費の内部原価・粗利の明細</span>
              <Masked visible={state === "internalDetail"} label="閲覧権限が必要（内部原価）">
                <span className="small">内部予算 {yen(eng.internal_budget)} · 委託費 {yen(eng.commission_total)}</span>
              </Masked>
            </div>
          </Section>
        </>
      )}
    </ProjectLayout>
  );
}
