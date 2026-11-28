// 画面ID: H-04 変更条件の再合意
// 1つの変更要求に、顧客との条件（費用・期限・承認者）と委託条件（受託者の追加見積・期限・受託者の承諾）を別々に持たせる。
// 顧客だけが同意しても委託範囲は増えない。両方の合意がそろったときだけ、該当する計画・発注が更新候補になる。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { StatusVocab } from "../../lib/vocab";
import { formatDateTime, yen } from "../../lib/format";
import { changeAgreements } from "../../mocks/desk";
import type { ChangeAgreement as Agreement } from "../../mocks/desk";
import { decisions } from "../../mocks/portfolio";
import { orderById } from "../../mocks/engagement";
import {
  AppLayout,
  AudienceTag,
  Banner,
  Button,
  crumbs,
  ErrorState,
  ExternalActor,
  IdLink,
  KeyValueList,
  PageHeader,
  ResponsibilitySplit,
  Section,
  Skeleton,
  StatusBadge,
  Tag,
  useToast,
} from "../../ui";
import { projectName } from "./parts";

const SIDE_STATUS: Record<string, StatusVocab> = {
  notAsked: { label: "未提示", tone: "neutral" },
  pending: { label: "回答待ち", tone: "warn" },
  negotiating: { label: "受託者が相談中", tone: "info" },
  agreed: { label: "合意済み", tone: "pass" },
  rejected: { label: "不同意", tone: "fail" },
  declined: { label: "辞退", tone: "fail" },
};

function scenario(base: Agreement, state: string): Agreement {
  if (state === "両者合意") return { ...base, commission: { ...base.commission, status: "agreed", note: "受託者が条件 v3 に同意（11/27 10:05）" } };
  if (state === "受託者が相談中") return { ...base, commission: { ...base.commission, status: "negotiating", note: "受託者から「追加6万円・期限 12/3」の対案（11/27 09:40）。条件 v3 を再提示する前に経営判断が必要です" } };
  if (state === "経営判断が必要") return { ...base, customer: { ...base.customer, status: "pending", agreed_at: undefined }, commission: { ...base.commission, status: "notAsked", note: undefined } };
  return base;
}

export function ChangeAgreementScreen({ id }: { id?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const base = changeAgreements.find((c) => c.id === id) ?? changeAgreements[0];
  const ca = scenario(base, state);
  const both = ca.customer.status === "agreed" && ca.commission.status === "agreed";
  const decision = decisions.find((d) => d.id === ca.decision);
  const order = orderById(ca.commission.order_id);
  const [prepared, setPrepared] = useState(false);
  const needDecision = state === "経営判断が必要" || ca.commission.status === "negotiating";

  return (
    <AppLayout org={org} active="desk" breadcrumb={crumbs(org, undefined, { label: "案件窓口", to: paths.desk(org) }, { label: `${ca.id} の再合意` })}>
      <PageHeader
        id={ca.id}
        title={ca.title}
        status={<StatusBadge vocab={both ? { label: "両者合意", tone: "pass" } : { label: "合意の途中", tone: "warn" }} />}
        description={`${projectName(ca.project)} · 起票 ${formatDateTime(ca.requested_at)}。顧客との条件と、受託者への委託条件は別の契約です。それぞれの当事者が合意したものだけを反映します。`}
        actions={
          <>
            <Button icon="external" to={paths.changes(org, ca.project)}>変更要求の一覧</Button>
            {decision ? <Button icon="inbox" to={paths.decision(org, decision.id)}>経営判断 {decision.id}</Button> : null}
          </>
        }
      />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {!both && ca.customer.status === "agreed" ? (
            <Banner tone="warn" title="顧客は同意済みですが、委託範囲はまだ増えていません">
              受託者が委託条件の変更（v3 案）に同意するまで、ORD-0101 は合意済みの5列の条件のままです。受託者に無償の修正作業は発生しません。
            </Banner>
          ) : null}
          {needDecision ? (
            <Banner tone="info" title="経営判断が必要です" action={decision ? <Button size="sm" variant="primary" to={paths.decision(org, decision.id)}>判断を依頼</Button> : null}>
              追加費用と粗利への影響が委任範囲を超えるため、受注側統括責任者（JV責任者）の判断を受けてから条件を提示します。
            </Banner>
          ) : null}
          <div className="dk-two">
            <Section title="顧客との条件" sub={ca.customer.contract_ref} actions={<AudienceTag value="customer" />}>
              <KeyValueList
                stacked
                items={[
                  { label: "状態", value: <StatusBadge vocab={SIDE_STATUS[ca.customer.status]} size="sm" /> },
                  { label: "顧客への追加費用", value: yen(ca.customer.price) },
                  { label: "期限への影響", value: ca.customer.due_impact },
                  { label: "承認者（発注側）", value: <ExternalActor userId={ca.customer.approver_id} role="発注側承認者" /> },
                  { label: "合意日時", value: ca.customer.agreed_at ? formatDateTime(ca.customer.agreed_at) : "—" },
                ]}
              />
            </Section>
            <Section title="委託条件（受託者との条件）" sub={ca.commission.contract_ref} actions={<span className="row" style={{ ["--gap" as string]: "6px" }}><AudienceTag value="internal" /><AudienceTag value="freelancer" /></span>}>
              <KeyValueList
                stacked
                items={[
                  { label: "状態", value: <StatusBadge vocab={SIDE_STATUS[ca.commission.status]} size="sm" /> },
                  { label: "対象の発注", value: order ? <IdLink id={order.id} to={paths.order(org, order.id)} title={order.title} /> : ca.commission.order_id },
                  { label: "受託者", value: <ExternalActor userId={ca.commission.freelancer_id} role="フリーエンジニア" /> },
                  { label: "追加の報酬（見積）", value: yen(ca.commission.extra_fee) },
                  { label: "期限への影響", value: ca.commission.due_impact },
                  { label: "経過", value: ca.commission.note ?? "—" },
                ]}
              />
              <span className="tiny muted">委託条件の金額は顧客に公開しません。顧客向けの連絡や週報にも含めません。</span>
            </Section>
          </div>
          <Section title="責任の分担">
            <ResponsibilitySplit
              decide={<span className="stack" style={{ ["--gap" as string]: "4px" }}><ExternalActor userId="u-komatsu" role="顧客の承認" /><ExternalActor userId={ca.commission.freelancer_id} role="委託条件の承諾" />{decision ? <ExternalActor userId="u-kimura" role="追加費用の経営判断" /> : null}</span>}
              act={<ExternalActor userId="u-aoki" role="案件窓口" />}
              note="窓口は両者への提示・回答の回収・反映を行います。条件を確約する権限は各当事者にあり、窓口や AI が代わりに合意しません"
            />
          </Section>
          <Section title="合意がそろったときに更新する候補" sub="両方の合意がそろうまで、計画・発注・要求は変更しません">
            <div className="stack" style={{ ["--gap" as string]: "10px" }}>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>種類</th><th>対象</th><th>扱い</th></tr></thead>
                  <tbody>
                    {ca.affected.map((a) => (
                      <tr key={a.id}>
                        <td><Tag square>{a.kind}</Tag></td>
                        <td className="small"><span className="mono">{a.id}</span> {a.label}</td>
                        <td>{both ? <Tag tone="info" square>更新候補</Tag> : <Tag square>合意待ち（変更しない）</Tag>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row end">
                <Button
                  variant="primary"
                  icon="check"
                  disabled={!both || prepared}
                  disabledReason={prepared ? "更新候補を作成済みです" : "顧客と受託者の両方の合意がそろっていません"}
                  onClick={() => { setPrepared(true); toast({ kind: "success", message: "計画・発注の更新候補を作りました。正本（GitHub Projects）の担当者にリンクを送りました" }); }}
                >
                  更新候補を作る
                </Button>
                <Button
                  icon="send"
                  disabled={!both}
                  disabledReason="両方の合意がそろってから、確定版を受託者へ返します"
                  to={both ? paths.freelancerOrder(ca.commission.order_id) : undefined}
                >
                  確定版を受託者の画面で確認
                </Button>
              </div>
            </div>
          </Section>
        </>
      )}
    </AppLayout>
  );
}
