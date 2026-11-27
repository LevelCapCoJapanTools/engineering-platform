// 画面ID: V-02 統制項目の詳細
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { CONTROL_STATUS, ENFORCEMENT_LEVEL } from "../../lib/vocab";
import type { ControlStatus } from "../../lib/vocab";
import { controlById, evidence, exceptions } from "../../mocks/core";
import { controlEvidence, controlTailoring } from "../../mocks/audit";
import { rules } from "../../mocks/policy";
import { formatDate } from "../../lib/format";
import {
  ActorLabel,
  Banner,
  Button,
  ControlLayerTag,
  DetailLayout,
  EmptyState,
  EnforcementBadge,
  EvidenceItem,
  ExceptionSummary,
  Icon,
  IdLink,
  KeyValueList,
  MetaSection,
  PageHeader,
  PolicyVersionTag,
  ProjectLayout,
  RoleBadge,
  Section,
  StatusBadge,
  Tag,
} from "../../ui";

export function ControlDetail({ org = ORG, project = PROJECT, id }: { org?: string; project?: string; id: string }) {
  const state = useScreenState();
  const control = controlById(id);
  const status: ControlStatus = state === "default" ? control.status : (state as ControlStatus);
  const evIds = controlEvidence[control.id] ?? [];
  let evs = evidence.filter((e) => evIds.includes(e.id));
  if (status === "missing") evs = evidence.filter((e) => e.missing);
  if (status === "satisfied") evs = evs.filter((e) => !e.missing);
  const ruleRows = rules.filter((r) => control.machine_rule_ids.includes(r.id));
  const ex = exceptions.find((e) => e.status === "active" && e.rule_id && control.machine_rule_ids.includes(e.rule_id));
  const machineOk = status === "satisfied" || status === "exception" || status === "partial";
  const humanOk = status === "satisfied" || status === "exception";

  return (
    <ProjectLayout org={org} project={project} active="audit" trail={[{ label: "監査ダッシュボード", to: paths.audit(org, project) }, { label: control.id }]}>
      <PageHeader
        id={control.id}
        title={control.description}
        status={CONTROL_STATUS[status]}
        meta={
          <>
            <ControlLayerTag layer={control.layer} />
            <Tag square>{control.process} · {control.activity}</Tag>
            <PolicyVersionTag pack="Basic Control Pack" version="1.3.0" />
          </>
        }
        actions={<Button icon="package" to={paths.auditExport(org, project)}>監査パックに含めて出力</Button>}
      />
      {status === "missing" ? (
        <Banner tone="fail" title="必要な証跡が欠落しています">
          この統制項目に必要な証跡（{control.evidence_types.join("、")}）がまだ取得されていません。担当者に依頼してください。
        </Banner>
      ) : status === "partial" ? (
        <Banner tone="warn" title="一部の証跡だけがそろっています">機械検証は記録されていますが、人間の承認記録が不足しています。</Banner>
      ) : status === "exception" ? (
        <Banner tone="info" title="例外が適用されています">承認された例外により、期限まで充足として扱います。期限到来時に再審査します。</Banner>
      ) : null}
      <DetailLayout
        main={
          <>
            <Section title="根拠の参照" sub="規格の番号と箇条番号のみを表示します。規格の本文は表示しません。">
              <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                <div className="row">
                  <Icon name="book" className="muted" />
                  <span className="mono strong">{control.source_ref}</span>
                </div>
                <p className="small muted">
                  本文の確認は、正規に入手した規格文書で行ってください。この製品は規格本文を保持しません。説明文は自社で作成したものです。
                </p>
              </div>
            </Section>

            <Section title="検証方法" sub="機械検証（CI）と人間の承認の内訳">
              <div className="grid cols-2">
                <div className="card tight stack" style={{ ["--gap" as string]: "10px" }}>
                  <div className="row between">
                    <ActorLabel kind="ci" name="機械検証" />
                    <StatusBadge vocab={machineOk ? { label: "記録あり", tone: "pass" } : { label: "未記録", tone: "fail" }} size="sm" />
                  </div>
                  {ruleRows.length ? (
                    ruleRows.map((r) => (
                      <div key={r.id} className="stack" style={{ ["--gap" as string]: "4px" }}>
                        <span className="row" style={{ ["--gap" as string]: "6px" }}>
                          <span className="mono small strong">{r.id}</span>
                          <Tag square>ゲート{r.gate}</Tag>
                          <EnforcementBadge level={r.level} />
                        </span>
                        <span className="small muted">{r.description}</span>
                      </div>
                    ))
                  ) : (
                    <span className="small muted">機械検証のルールはありません。人間の承認で確認します。</span>
                  )}
                </div>
                <div className="card tight stack" style={{ ["--gap" as string]: "10px" }}>
                  <div className="row between">
                    <ActorLabel kind="human" name="人間の承認" />
                    <StatusBadge vocab={!control.human_role ? { label: "不要", tone: "neutral" } : humanOk ? { label: "承認あり", tone: "pass" } : { label: "未承認", tone: "fail" }} size="sm" />
                  </div>
                  {control.human_role ? (
                    <>
                      <span className="row" style={{ ["--gap" as string]: "6px" }}><span className="small muted">承認するロール</span><RoleBadge role={control.human_role} /></span>
                      <span className="small muted">作成者と承認者は別の人である必要があります。</span>
                    </>
                  ) : (
                    <span className="small muted">この統制項目は人間の承認を必要としません。</span>
                  )}
                </div>
              </div>
            </Section>

            <Section title="紐づく証跡" sub={`${evs.length}件`}>
              {evs.length ? (
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  {evs.map((e) => <EvidenceItem key={e.id} ev={e} />)}
                </div>
              ) : (
                <EmptyState icon="archive" title="紐づく証跡はまだありません" description="ゲートの実行や承認が行われると、自動で証跡が記録されます。" />
              )}
            </Section>

            {status === "exception" && ex ? (
              <Section title="適用中の例外">
                <ExceptionSummary ex={ex} />
              </Section>
            ) : null}
          </>
        }
        side={
          <>
            <MetaSection title="属性">
              <KeyValueList
                stacked
                items={[
                  { label: "統制項目", value: <span className="mono">{control.id}</span> },
                  { label: "層", value: <ControlLayerTag layer={control.layer} /> },
                  { label: "プロセス・活動", value: `${control.process} · ${control.activity}` },
                  { label: "必要な証跡の種類", value: <span className="row" style={{ ["--gap" as string]: "4px" }}>{control.evidence_types.map((t) => <Tag key={t} square>{t}</Tag>)}</span> },
                  { label: "最終更新", value: formatDate(control.updated_at) },
                ]}
              />
            </MetaSection>
            <MetaSection title="組織での調整">
              <p className="small">{controlTailoring[control.id] ?? "調整はありません（Control Pack の既定どおり）"}</p>
              <Button size="sm" variant="ghost" icon="arrowRight" to={paths.tailoring(org, "basic")}>テーラリングを確認</Button>
            </MetaSection>
            <MetaSection title="強制レベルの既定">
              {ruleRows.length ? (
                ruleRows.map((r) => <div key={r.id} className="row between small"><span className="mono">{r.id}</span><span>{ENFORCEMENT_LEVEL[r.level].label}</span></div>)
              ) : (
                <span className="small muted">—</span>
              )}
            </MetaSection>
            <MetaSection title="関連" defaultOpen={false}>
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <IdLink id="TRC-002" />
                <IdLink id="EXC-0007" to={paths.exception(org, project, "EXC-0007")} />
              </div>
            </MetaSection>
          </>
        }
      />
    </ProjectLayout>
  );
}
