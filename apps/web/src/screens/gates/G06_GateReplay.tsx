// 画面ID: G-06 判定の再現
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { gateRuns } from "../../mocks/core";
import { replayResult } from "../../mocks/gates";
import {
  ActorLabel,
  Banner,
  Button,
  ErrorState,
  HashDisplay,
  KeyValueList,
  PageHeader,
  PolicyVersionTag,
  ProjectLayout,
  Section,
  Select,
  Tag,
  useToast,
} from "../../ui";

export function GateReplayScreen({ org, project, runId }: { org: string; project: string; runId: string }) {
  const state = useScreenState();
  const toast = useToast();
  const run = gateRuns.find((g) => g.id === runId) ?? gateRuns[0];
  const [ruleVersion, setRuleVersion] = useState(state === "mismatch" ? "1.3.1" : "1.3.0");
  const [phase, setPhase] = useState<"idle" | "running" | "done">(state === "default" || state === "mismatch" ? "done" : state === "running" ? "running" : "idle");
  const match = ruleVersion === "1.3.0" && state !== "mismatch";
  const res = replayResult(match);
  const rows: { label: string; key: "verdict" | "gates" | "reasons" | "manifest" }[] = [
    { label: "総合判定", key: "verdict" },
    { label: "ゲート A〜D", key: "gates" },
    { label: "理由のルールID", key: "reasons" },
    { label: "Manifest のダイジェスト", key: "manifest" },
  ];
  const run_ = () => {
    setPhase("running");
    window.setTimeout(() => { setPhase("done"); toast({ kind: "success", message: "再評価が完了しました" }); }, 900);
  };

  return (
    <ProjectLayout org={org} project={project} active="gates" trail={[{ label: "ゲート実行", to: paths.gates(org, project) }, { label: run.id, to: paths.gate(org, project, run.id) }, { label: "判定の再現" }]}>
      <PageHeader
        id={run.id}
        title="判定の再現"
        description="保存済みの入力スナップショットと、判定時のルール版だけを使って再評価し、元の判定と Evidence Manifest のダイジェストが一致するかを確認します。外部サービスには問い合わせません。"
        actions={<Button variant="primary" icon="refresh" loading={phase === "running"} onClick={run_}>再評価する</Button>}
      />
      {state === "error" ? (
        <ErrorState title="入力スナップショットを読み込めません" description="保管先の検証に失敗しました。証跡の保管の状態を確認してください。" />
      ) : (
        <>
          <Section title="再評価の入力">
            <KeyValueList
              items={[
                { label: "入力スナップショット", value: <HashDisplay value={run.input_sha256} /> },
                { label: "対象コミット", value: <HashDisplay value={run.commit_sha} /> },
                { label: "元の判定日時", value: formatDateTime(run.started_at) },
                { label: "元のルール版", value: <PolicyVersionTag pack="Basic Control Pack" version="1.3.0" /> },
                { label: "ルールのハッシュ", value: <HashDisplay value={run.policy_sha256} /> },
                {
                  label: "再評価に使うルール版",
                  value: (
                    <div style={{ maxWidth: 320 }}>
                      <Select value={ruleVersion} onChange={setRuleVersion} options={[{ value: "1.3.0", label: "1.3.0（判定時の版）" }, { value: "1.3.1", label: "1.3.1（現在の版・比較用）" }]} help="再現には判定時の版を使います。現在の版を選ぶと影響の比較になります" />
                    </div>
                  ),
                },
                { label: "判定の主体", value: <ActorLabel kind="ci" name="ゲート（決定論的なルール）" size="sm" /> },
              ]}
            />
          </Section>

          {phase === "idle" ? (
            <Banner tone="info" title="まだ再評価していません">「再評価する」を押すと、保存済みの入力で判定をやり直します。</Banner>
          ) : phase === "running" ? (
            <div className="card row" style={{ justifyContent: "center", padding: 32 }}><span className="spinner" /><span className="muted">再評価しています…</span></div>
          ) : (
            <>
              {match ? (
                <Banner tone="pass" title="元の判定と一致しました">同じ入力と同じルール版から、同じ判定と同じ Manifest ダイジェストが得られました。</Banner>
              ) : (
                <Banner tone="fail" title="元の判定と一致しません">差分の原因を確認してください。元の判定と Manifest は変更されません。</Banner>
              )}
              <Section title="元の判定と再評価の比較" flush>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>項目</th><th>元の判定</th><th>再評価</th><th>一致</th></tr></thead>
                    <tbody>
                      {rows.map((r) => {
                        const same = res.original[r.key] === res.replay[r.key];
                        return (
                          <tr key={r.key}>
                            <td className="strong small">{r.label}</td>
                            <td>{r.key === "manifest" ? <HashDisplay value={res.original.manifest} /> : <span className="small">{res.original[r.key]}</span>}</td>
                            <td>{r.key === "manifest" ? <HashDisplay value={res.replay.manifest} /> : <span className="small">{res.replay[r.key]}</span>}</td>
                            <td>{same ? <Tag tone="pass" icon="check">一致</Tag> : <Tag tone="fail" icon="xCircle">不一致</Tag>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>
              {res.causes.length ? (
                <Section title="不一致の原因">
                  <ul className="stack small" style={{ margin: 0, paddingLeft: 18, ["--gap" as string]: "6px" }}>
                    {res.causes.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </Section>
              ) : null}
            </>
          )}
          <div className="row">
            <Button icon="arrowLeft" to={paths.gate(org, project, run.id)}>ゲート実行の詳細に戻る</Button>
            <Button icon="signature" to={paths.manifests(org, project)}>Evidence Manifest を見る</Button>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
