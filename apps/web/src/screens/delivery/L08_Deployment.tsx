// 画面ID: L-08 配備依頼と完了確認
// 事前登録した外部 CI/CD の手順だけを、許可された版・環境・時間枠で起動依頼する（改修 27）。
// 同じ許可での再送は二重に配備しない。外部の実行IDで結果を照合するまで「公開済み」や顧客への完了通知を出さない。
import "./delivery.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { DEPLOY_STATUS } from "../../lib/vocab";
import type { DeployStatus } from "../../lib/vocab";
import { deployConnection, deploySteps, permitPinned } from "../../mocks/delivery";
import { releases } from "../../mocks/core";
import {
  Banner,
  Button,
  ErrorState,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  ProviderBadge,
  Section,
  Skeleton,
  StatusBadge,
  Tag,
  useToast,
} from "../../ui";
import { StepState, useOrgProject } from "./parts";

export const L08_STATES = ["default", "running", "unconfirmed", "succeeded", "duplicate", "loading", "error"];

const STATUS_OF: Record<string, DeployStatus> = {
  default: "permitted",
  running: "running",
  unconfirmed: "unconfirmed",
  succeeded: "succeeded",
  duplicate: "running",
};

export function L08Deployment() {
  const state = useScreenState();
  const toast = useToast();
  const { org, project, id } = useOrgProject();
  const rel = releases.find((r) => r.id === id) ?? releases[0];
  const status = STATUS_OF[state] ?? "permitted";
  const steps = deploySteps(state === "duplicate" ? "running" : state);
  const [requested, setRequested] = useState(state !== "default");
  const confirmed = status === "succeeded";

  return (
    <ProjectLayout org={org} project={project} active="releases" trail={[{ label: "リリースと受入", to: paths.releases(org, project) }, { label: rel.version, to: paths.release(org, project, rel.id) }, { label: "配備" }]}>
      <PageHeader
        id={rel.version}
        title="配備依頼と完了確認"
        status={DEPLOY_STATUS[status]}
        description="承認された版・環境・時間枠だけを、事前に登録した外部の配備手順で起動します。配備の結果は外部の実行IDで照合し、確認が取れてから公開済みとして扱います。"
        actions={
          <Button
            variant="primary"
            icon="rocket"
            disabled={requested}
            disabledReason={state === "duplicate" ? "同じ実行許可で起動依頼済みです" : "起動依頼済みです"}
            onClick={() => { setRequested(true); toast({ kind: "success", message: `配備の起動を依頼しました（冪等キー ${permitPinned.id}）` }); }}
          >
            配備を起動依頼
          </Button>
        }
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {state === "duplicate" ? (
            <Banner tone="warn" title="同じ実行許可での再送を受け付けましたが、二重には配備しません">
              {formatDateTime("2026-12-17T22:03:10+09:00")} に {permitPinned.id} の再送がありました。既存の実行（gh-run-99830011）の結果を待ちます。
            </Banner>
          ) : state === "unconfirmed" ? (
            <Banner tone="warn" title="配備の結果をまだ確認できていません">
              外部からの完了通知が 15 分届いていません。実行ID gh-run-99830011 で外部の結果を照会しています。確認できるまで「公開済み」とは表示せず、顧客への完了通知も送りません。
            </Banner>
          ) : confirmed ? (
            <Banner tone="pass" title="配備の結果を確認しました">
              外部の実行結果（success）とヘルスチェックを照合しました。案件窓口が顧客へ完了の連絡と受入の依頼を送ります。
            </Banner>
          ) : (
            <Banner tone="info" title="顧客への完了通知は、配備の結果を確認してから送ります">配備の途中で顧客に「公開済み」と伝えることはありません。</Banner>
          )}
          <div className="grid main-side">
            <div className="stack">
              <Section title="配備の進行" sub="外部の配備手順の各段階と、結果の照合">
                <ul className="dl-steps">
                  {steps.map((s) => (
                    <li key={s.name}>
                      <StepState state={s.state} />
                      <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                        <span className="small strong">{s.name}</span>
                        {s.detail ? <span className="tiny muted">{s.detail}</span> : null}
                      </div>
                      <span className="tiny muted">{s.at ? formatDateTime(s.at) : ""}</span>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="後続の作業" sub="配備の確認が取れるまで止めます">
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  {["顧客への完了の連絡（案件窓口）", "顧客への受入の依頼", "リリースの「公開済み」表示"].map((t) => (
                    <div key={t} className="row between">
                      <span className="small">{t}</span>
                      {confirmed ? <Tag tone="pass" icon="check">実行できます</Tag> : <Tag icon="lock">確認待ち</Tag>}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
            <div className="stack">
              <Section title="実行許可">
                <KeyValueList
                  stacked
                  items={[
                    { label: "許可ID", value: <span className="mono small">{permitPinned.id}</span> },
                    { label: "成果版", value: <span className="small">{permitPinned.candidate}</span> },
                    { label: "環境", value: <span className="small">{permitPinned.environment}</span> },
                    { label: "時間枠", value: <span className="small">{permitPinned.window}</span> },
                    { label: "外部の実行ID", value: requested ? <span className="mono small">gh-run-99830011</span> : <span className="muted small">起動後に記録</span> },
                  ]}
                />
              </Section>
              <Section title="配備専用の接続">
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  <ProviderBadge provider="githubActions" />
                  <span className="small strong">{deployConnection.name}</span>
                  <span className="tiny muted">{deployConnection.scope}</span>
                  <span className="tiny muted">{deployConnection.note}</span>
                </div>
              </Section>
              <Section title="状態">
                <StatusBadge vocab={DEPLOY_STATUS[status]} />
              </Section>
              {state === "default" ? null : (
                <Button size="sm" variant="ghost" icon="alert" to={paths.rollback(org, project, rel.id)}>失敗時の切戻しを開く</Button>
              )}
            </div>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
