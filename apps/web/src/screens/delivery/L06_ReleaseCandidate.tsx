// 画面ID: L-06 リリース候補と顧客向け説明
// 複数人の提出から対象分だけを選び、リリース候補を固定する（改修 25）。
// 顧客向けの説明には候補に含まれる変更だけを載せる。AI は説明文の下書きだけを作る。
import "./delivery.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { aiReleaseNote, candidateFixed, candidateItems, candidateTests, migrationSteps, releaseContacts, rollbackSteps } from "../../mocks/delivery";
import { releases } from "../../mocks/core";
import {
  ActorLabel,
  Banner,
  Button,
  Checkbox,
  ConfirmDialog,
  ErrorState,
  ExternalActor,
  HashDisplay,
  KeyValueList,
  MarkdownViewer,
  PageHeader,
  ProjectLayout,
  Section,
  Skeleton,
  Tag,
  useToast,
} from "../../ui";
import { useOrgProject } from "./parts";

export const L06_STATES = ["default", "fixed", "aiDisabled", "loading", "error"];

export function L06ReleaseCandidate() {
  const state = useScreenState();
  const toast = useToast();
  const { org, project, id } = useOrgProject();
  const rel = releases.find((r) => r.id === id) ?? releases[0];
  const [include, setInclude] = useState<Record<string, boolean>>(Object.fromEntries(candidateItems.map((c) => [c.id, c.include])));
  const [fixed, setFixed] = useState(state === "fixed");
  const [confirm, setConfirm] = useState(false);
  const chosen = candidateItems.filter((c) => include[c.id]);
  const excluded = candidateItems.filter((c) => !include[c.id]);
  const blockedReason = (c: (typeof candidateItems)[number]) => (c.ref === "未提出" ? "未提出のため候補に入れられません" : c.source === "coding-agent" ? "人間のレビュー承認がない変更は候補に入れられません" : undefined);

  return (
    <ProjectLayout org={org} project={project} active="releases" trail={[{ label: "リリースと受入", to: paths.releases(org, project) }, { label: rel.version, to: paths.release(org, project, rel.id) }, { label: "リリース候補" }]}>
      <PageHeader
        id={rel.version}
        title="リリース候補と顧客向け説明"
        status={fixed ? <Tag tone="pass" icon="lock">候補を固定済み</Tag> : <Tag tone="warn">候補を選択中</Tag>}
        description="複数の提出と変更から、このリリースに入れるものだけを選び、候補を固定します。固定後に中身が変わった場合は、実行許可の回収をやり直します。"
        actions={<Button variant="primary" icon="lock" disabled={fixed} disabledReason="固定済みです" onClick={() => setConfirm(true)}>候補を固定</Button>}
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {fixed ? (
            <Banner tone="pass" title={`候補 ${candidateFixed.id} を固定しました`}>
              {formatDateTime(candidateFixed.fixed_at)}・固定した人: 案件窓口（青木 さくら）。次は実行許可の回収です。
            </Banner>
          ) : null}
          <div className="grid main-side">
            <div className="stack">
              <Section title="候補に入れるもの" sub="受託者の提出、社内の PR、変更要求から選びます" flush>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>対象</th><th>種類</th><th>参照・版</th><th>出所</th><th>判断の根拠</th></tr></thead>
                    <tbody>
                      {candidateItems.map((c) => {
                        const reason = blockedReason(c);
                        return (
                          <tr key={c.id}>
                            <td>
                              <Checkbox
                                label={<span className="small">{c.title}</span>}
                                checked={include[c.id]}
                                disabled={fixed || !!reason}
                                description={reason}
                                onChange={(v) => setInclude((x) => ({ ...x, [c.id]: v }))}
                              />
                            </td>
                            <td><Tag square>{c.kind}</Tag></td>
                            <td className="small">{c.ref}{c.sha ? <span className="mono"> · {c.sha}</span> : null}</td>
                            <td className="small">{c.source}</td>
                            <td className="small">{c.reason}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title="顧客向けの説明" sub="候補に含まれる変更だけを載せます。含まれない修正は書きません" actions={state === "aiDisabled" ? <Tag>定型文</Tag> : <ActorLabel kind="ai" name="説明の下書き" size="sm" />}>
                <div className="stack">
                  {state === "aiDisabled" ? (
                    <Banner tone="info" title="AI 機能は無効です">候補に含まれる項目から定型の説明を組み立てました。窓口が確認して送ります。</Banner>
                  ) : (
                    <Banner tone="info" title="AI の下書きです">送付前に案件窓口が内容を確認し、金額・範囲・納期を含む場合は責任者の承認を得ます。下書きは合意の証拠に数えません。</Banner>
                  )}
                  {state === "aiDisabled" ? (
                    <pre className="dl-pre">{`v1.4.0 の変更点\n${chosen.map((c) => `・${c.title.replace(/（ORD-\d+）/, "")}`).join("\n")}`}</pre>
                  ) : (
                    <MarkdownViewer source={aiReleaseNote} />
                  )}
                  <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                    <span className="label">説明に載せないもの（候補外）</span>
                    {excluded.map((c) => <span key={c.id} className="small muted">・{c.title}（{c.reason}）</span>)}
                  </div>
                </div>
              </Section>
              <Section title="移行と切戻しの手順">
                <div className="grid cols-2">
                  <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                    <span className="label">移行</span>
                    <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>{migrationSteps.map((m) => <li key={m}>{m}</li>)}</ol>
                  </div>
                  <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                    <span className="label">切戻し</span>
                    <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>{rollbackSteps.map((m) => <li key={m}>{m}</li>)}</ol>
                  </div>
                </div>
              </Section>
            </div>
            <div className="stack">
              <Section title="固定する版">
                <KeyValueList
                  stacked
                  items={[
                    { label: "候補", value: fixed ? candidateFixed.id : "未固定" },
                    { label: "ダイジェスト", value: fixed ? <HashDisplay value={candidateFixed.digest} /> : <span className="muted small">固定時に計算</span> },
                    { label: "コミット", value: <div className="stack" style={{ ["--gap" as string]: "2px" }}>{candidateFixed.commits.map((c) => <span key={c.repo} className="mono small">{c.repo} {c.sha}</span>)}</div> },
                    { label: "対象の件数", value: `${chosen.length}件` },
                  ]}
                />
              </Section>
              <Section title="試験">
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  {candidateTests.map((t) => (
                    <div key={t.name} className="row between"><span className="small">{t.name}</span><span className="tiny muted">{t.result}</span></div>
                  ))}
                </div>
              </Section>
              <Section title="既知の問題">
                <span className="small">BUG-031: 同じ日付の並び順が画面と CSV で異なる（低）</span>
              </Section>
              <Section title="連絡先">
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  {releaseContacts.map((c) => (
                    <div key={c.role} className="stack" style={{ ["--gap" as string]: "2px" }}>
                      <span className="tiny muted">{c.role}</span>
                      <ExternalActor userId={c.user_id} />
                      <span className="tiny muted">{c.hours}</span>
                    </div>
                  ))}
                </div>
              </Section>
              <Button icon="arrowRight" to={paths.executionPermit(org, project, rel.id)} disabled={!fixed} disabledReason="候補を固定すると実行許可を回収できます">実行許可の回収へ</Button>
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`${chosen.length}件で候補を固定しますか`}
        message="固定した版のダイジェストを記録します。固定後に中身を変えると、実行許可の回収をやり直します。"
        confirmLabel="候補を固定"
        onConfirm={() => { setFixed(true); toast({ kind: "success", message: `候補 ${candidateFixed.id} を固定しました` }); }}
      />
    </ProjectLayout>
  );
}
