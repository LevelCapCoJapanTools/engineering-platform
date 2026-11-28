// 画面ID: L-07 Go/No-Go の回収と実行許可
// 実務承認と必要な経営判断を回収し、ルール版・承認者・成果版・対象環境を固定して実行許可を発行する（改修 26）。
// 版の差替え、必須チェックの失敗、承認の期限切れでは発行しない。AI の評価は承認やゲートの結果を変えない。
import "./delivery.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { permitChecks, permitPinned } from "../../mocks/delivery";
import { releases } from "../../mocks/core";
import {
  Banner,
  Button,
  ChecklistPanel,
  ConfirmDialog,
  ErrorState,
  ExternalActor,
  HashDisplay,
  IdLink,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  ResponsibilitySplit,
  Section,
  Skeleton,
  Tag,
  useToast,
} from "../../ui";
import type { ChecklistItem } from "../../ui";
import { useOrgProject } from "./parts";

export const L07_STATES = ["default", "ready", "issued", "versionChanged", "checkFailed", "approvalExpired", "loading", "error"];

export function L07ExecutionPermit() {
  const state = useScreenState();
  const toast = useToast();
  const { org, project, id } = useOrgProject();
  const rel = releases.find((r) => r.id === id) ?? releases[0];
  const checks = permitChecks(state === "issued" || state === "ready" ? "ready" : state);
  const items: ChecklistItem[] = checks.map((c) => ({ id: c.id, title: c.title, state: c.state, detail: c.detail, actor: c.actor }));
  const unmet = checks.filter((c) => c.state !== "ok");
  const [issued, setIssued] = useState(state === "issued");
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const reason = unmet.length ? `${unmet.map((u) => u.title).join("、")} がそろっていません` : undefined;

  return (
    <ProjectLayout org={org} project={project} active="releases" trail={[{ label: "リリースと受入", to: paths.releases(org, project) }, { label: rel.version, to: paths.release(org, project, rel.id) }, { label: "実行許可" }]}>
      <PageHeader
        id={rel.version}
        title="Go/No-Go の回収と実行許可"
        status={issued ? <Tag tone="pass" icon="check">実行許可 {permitPinned.id} を発行済み</Tag> : <Tag tone={unmet.length ? "warn" : "info"}>{unmet.length ? `未回収 ${unmet.length}件` : "発行できます"}</Tag>}
        description="必要な承認と判断がそろい、成果版・ルール版・対象環境が一致したときだけ実行許可を発行します。許可は1回の配備依頼に使い、版が変わったら無効になります。"
        actions={
          <Button variant="primary" icon="shieldCheck" loading={sending} disabled={issued || unmet.length > 0} disabledReason={issued ? "発行済みです" : reason} onClick={() => setConfirm(true)}>
            実行許可を発行
          </Button>
        }
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {state === "versionChanged" ? (
            <Banner tone="fail" title="候補の固定後に成果版が変わりました">差し替えた候補で、承認と判断をもう一度回収します。以前の承認は新しい版には使えません。</Banner>
          ) : state === "checkFailed" ? (
            <Banner tone="fail" title="必須チェックが失敗しています">ゲートの結果が通過になるまで実行許可は発行できません。例外による通過は、承認済みの例外がある場合に限ります。</Banner>
          ) : state === "approvalExpired" ? (
            <Banner tone="fail" title="承認の有効期限が切れています">期限切れの承認では発行できません。リリース管理者に再承認を依頼してください。</Banner>
          ) : issued ? (
            <Banner tone="pass" title={`実行許可 ${permitPinned.id} を発行しました`}>配備依頼は事前登録した手順で、許可した版・環境・時間枠に限って行えます。</Banner>
          ) : null}
          <div className="grid main-side">
            <div className="stack">
              <Section title="回収の状況" sub="CI（決定論的なルール）と人の承認・判断を区別して表示します">
                <ChecklistPanel items={items} title="実行許可の条件" />
              </Section>
              <Section title="責任の分担">
                <ResponsibilitySplit
                  decide={<span className="small">Go/No-Go（案件スポンサー: <ExternalActor userId="u-kimura" />）</span>}
                  act={<span className="small">実務の承認（<ExternalActor userId="u-watanabe" role="リリース管理者" />、<ExternalActor userId="u-sato" role="PM" />）</span>}
                  note="案件窓口は承認と判断の回収を担当し、自らは承認しません。"
                />
              </Section>
              <Section title="AI の評価について">
                <span className="small">AI によるリスクの所見は参考として表示するだけです。AI の評価が変わっても、承認・ゲートの結果・実行許可の可否は変わりません。</span>
              </Section>
            </div>
            <div className="stack">
              <Section title="許可に固定する内容">
                <KeyValueList
                  stacked
                  items={[
                    { label: "許可ID", value: <span className="mono small">{permitPinned.id}</span> },
                    { label: "成果版（候補）", value: <span className="small">{permitPinned.candidate}</span> },
                    { label: "候補のダイジェスト", value: <HashDisplay value={permitPinned.candidate_digest} /> },
                    { label: "ルール版", value: <span className="small">{permitPinned.rule_version}</span> },
                    { label: "ルールのハッシュ", value: <HashDisplay value={permitPinned.rule_sha} /> },
                    { label: "対象環境", value: <span className="small">{permitPinned.environment}</span> },
                    { label: "時間枠", value: <span className="small">{permitPinned.window}</span> },
                    { label: "配備手順", value: <span className="small">{permitPinned.procedure}</span> },
                  ]}
                />
              </Section>
              <Section title="関連">
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  <IdLink id="DEC-0033" to={paths.decision(org, "DEC-0033")} />
                  <Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.deployment(org, project, rel.id)} disabled={!issued} disabledReason="実行許可の発行後に配備を依頼できます">配備依頼へ</Button>
                </div>
              </Section>
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="実行許可を発行しますか"
        message={`${permitPinned.candidate}・${permitPinned.environment}・${permitPinned.window} に限った許可を発行します。版や時間枠が変わると無効になります。`}
        confirmLabel="発行する"
        onConfirm={() => {
          setSending(true);
          window.setTimeout(() => { setSending(false); setIssued(true); toast({ kind: "success", message: `実行許可 ${permitPinned.id} を発行しました（同じ内容で再送しても二重には発行しません）` }); }, 600);
        }}
      />
    </ProjectLayout>
  );
}
