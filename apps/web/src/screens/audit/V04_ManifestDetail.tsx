// 画面ID: V-04 Evidence Manifest の詳細
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { fakeSha, manifestById, userById } from "../../mocks/core";
import { manifestDetail, manifestExtra, VERIFY_FAILURE } from "../../mocks/audit";
import type { VerifyFailure } from "../../mocks/audit";
import { formatDateTime } from "../../lib/format";
import {
  ActorLabel,
  Banner,
  Button,
  DetailLayout,
  ExternalActor,
  HashDisplay,
  Icon,
  IdLink,
  JsonViewer,
  KeyValueList,
  MetaSection,
  PageHeader,
  ProjectLayout,
  RetentionBadge,
  Section,
  SignatureBadge,
  Tag,
  Timestamp,
  useToast,
} from "../../ui";

type Sig = "verified" | "failed" | "unsigned" | "signed";

export function ManifestDetail({ org = ORG, project = PROJECT, id }: { org?: string; project?: string; id: string }) {
  const state = useScreenState();
  const toast = useToast();
  const m = manifestById(id);
  const d = manifestDetail(m.id);
  const x = manifestExtra(m.id);
  const reason: VerifyFailure | undefined = state === "expired" ? "expired" : state === "storageMissing" ? "storageMissing" : state === "failed" || m.signature === "failed" ? "hashMismatch" : undefined;
  const [verifying, setVerifying] = useState(false);
  const sig: Sig = state === "failed" || state === "expired" || state === "storageMissing" ? "failed" : state === "unsigned" ? "unsigned" : state === "storing" ? "signed" : state === "verified" ? "verified" : m.signature;
  const retention = state === "storing" || state === "unsigned" ? "pending" : m.retention;
  const failed = sig === "failed";
  // 検証失敗時に一致しない値（署名時の値と現在の値）
  const mismatched: Record<string, string> = failed && reason === "hashMismatch" ? { test_report_sha256: fakeSha(`${m.id}-test-tampered`), artifact_sha256: fakeSha(`${m.id}-artifact-tampered`) } : {};
  const hashRow = (label: string, key: keyof typeof d) => {
    const signedValue = d[key] as string;
    const bad = key in mismatched;
    return {
      label,
      value: (
        <div className="stack" style={{ ["--gap" as string]: "4px" }}>
          <HashDisplay value={signedValue} verified={sig === "verified" ? "match" : bad ? "mismatch" : undefined} />
          {bad ? <span className="small text-fail">現在の値: <span className="mono">{mismatched[key as string].slice(0, 16)}…</span>（署名時と一致しません）</span> : null}
        </div>
      ),
    };
  };
  const json = {
    schema_version: x.schema_version,
    project: d.project,
    profile: d.profile,
    profile_spec: x.profile_spec,
    control_pack_version: d.control_pack_version,
    rule_version: x.rule_version,
    template_version: x.template_version,
    commit_sha: d.commit_sha,
    policy_sha256: d.policy_sha256,
    requirements_snapshot_sha256: d.requirements_snapshot_sha256,
    ci_run_id: d.ci_run_id,
    test_report_sha256: d.test_report_sha256,
    artifact_sha256: d.artifact_sha256,
    approvals: d.approvals.map((a) => ({ role: a.role, subject: userById(a.user_id)?.email ?? a.user_id, at: a.at })),
    ai_reviews: d.ai_reviews,
    exceptions: d.exceptions,
    digests: x.digests.map((g) => ({ path: g.path, sha256: g.sha256 })),
    retention_locator: x.retention_locator,
    created_at: d.created_at,
    signature: sig === "unsigned" ? null : `sig:${fakeSha(`${m.id}-sig`).slice(0, 48)}`,
  };

  return (
    <ProjectLayout org={org} project={project} active="manifests" trail={[{ label: "Evidence Manifest", to: paths.manifests(org, project) }, { label: m.id }]}>
      <PageHeader
        id={m.id}
        title={`${m.target_kind === "release" ? "リリース" : "ゲート実行"} ${m.target} の証跡目録`}
        meta={<><Tag square>{d.profile}</Tag><Tag square icon="layers">{d.control_pack_version}</Tag><span className="small muted">作成 <Timestamp at={m.created_at} mode="absolute" /></span></>}
        actions={
          <>
            <Button icon="download" onClick={() => toast({ kind: "success", message: `${m.id}.json をダウンロードしました（モック）` })}>JSONをダウンロード</Button>
            <Button variant="primary" icon="refresh" loading={verifying} disabled={sig === "unsigned"} disabledReason="署名されていないため検証できません" onClick={() => { setVerifying(true); window.setTimeout(() => { setVerifying(false); toast({ kind: failed ? "error" : "success", message: failed ? "再検証しました: 署名と内容が一致しません" : "再検証しました: 署名と内容が一致しています" }); }, 900); }}>再検証</Button>
          </>
        }
      />

      {failed ? (
        <Banner tone="fail" title={`署名の検証に失敗しました: ${reason ? VERIFY_FAILURE[reason].label : "不一致"}`} action={<Button size="sm" icon="signature" to={paths.signing(org)}>署名と検証</Button>}>
          {reason ? VERIFY_FAILURE[reason].description : ""}
          {reason === "hashMismatch" ? "一致しない値: テストレポートのハッシュ、成果物のハッシュ。" : ""}
          この Manifest は証跡として扱われません（通過扱いにしません）。原因を調査してください（是正処置 COR-003 を参照）。
        </Banner>
      ) : sig === "unsigned" ? (
        <Banner tone="warn" title="署名待ちです">必要な承認がそろうと、システムが自動で署名します。</Banner>
      ) : retention === "pending" ? (
        <Banner tone="info" title="保管待ちです">署名済みです。WORM 保管先への保存を待っています。</Banner>
      ) : null}

      <DetailLayout
        main={
          <>
            <section className="card" style={{ borderColor: failed ? "var(--tone-fail-border)" : sig === "verified" ? "var(--tone-pass-border)" : undefined, background: failed ? "var(--tone-fail-bg)" : sig === "verified" ? "var(--tone-pass-bg)" : undefined }} aria-label="署名の検証結果">
              <div className="row between top">
                <div className="row" style={{ ["--gap" as string]: "16px" }}>
                  <span style={{ display: "grid", placeItems: "center", width: 56, height: 56, borderRadius: 14, background: "var(--surface)", color: failed ? "var(--tone-fail)" : sig === "verified" ? "var(--tone-pass)" : "var(--muted)" }}>
                    <Icon name={failed ? "shieldX" : sig === "verified" ? "shieldCheck" : "shield"} size={30} />
                  </span>
                  <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                    <span className="label">署名の検証結果</span>
                    <SignatureBadge state={sig} size="lg" />
                  </div>
                </div>
                <ActorLabel kind="system" name="Signer" />
              </div>
              {sig !== "unsigned" ? (
                <div style={{ marginTop: 16 }}>
                  <KeyValueList
                    cols={2}
                    items={[
                      { label: "署名者", value: d.signer },
                      { label: "署名日時", value: formatDateTime(d.signed_at) },
                      { label: "透明性ログ", value: <span className="mono small">{d.transparency_log}</span> },
                      { label: "最終検証", value: formatDateTime("2026-11-27T09:00:00+09:00") },
                    ]}
                  />
                </div>
              ) : null}
            </section>

            <Section title="内容の要約" sub={sig === "verified" ? "すべての値が署名時と一致しています" : failed ? "赤い値が署名時と一致しません" : undefined}>
              <KeyValueList
                items={[
                  { label: "プロジェクト", value: d.project },
                  { label: "プロファイル", value: d.profile },
                  { label: "Control Pack", value: d.control_pack_version },
                  { label: "コミット", value: <HashDisplay value={d.commit_sha} verified={sig === "verified" ? "match" : undefined} /> },
                  hashRow("ポリシーのハッシュ", "policy_sha256"),
                  hashRow("要求スナップショット", "requirements_snapshot_sha256"),
                  { label: "CI実行ID", value: <span className="mono">{d.ci_run_id}</span> },
                  hashRow("テストレポート", "test_report_sha256"),
                  hashRow("成果物", "artifact_sha256"),
                ]}
              />
            </Section>

            <Section title="スキーマと版" sub="同じ入力と同じ版で、同じ判定と目録を再現するための情報">
              <KeyValueList
                cols={2}
                items={[
                  { label: "スキーマの版", value: <span className="mono">{x.schema_version}</span> },
                  { label: "プロファイル仕様", value: x.profile_spec },
                  { label: "Control Pack", value: d.control_pack_version },
                  { label: "ゲートのルール", value: <span className="mono">{x.rule_version}</span> },
                  { label: "テンプレート", value: <span className="mono">{x.template_version}</span> },
                  { label: "ポリシー", value: x.policy_version },
                ]}
              />
            </Section>

            <Section title="ダイジェスト一覧" sub={`${x.digests.length}ファイル。評価者は同じハッシュで独立に照合できます`} flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>ファイル</th><th>SHA-256</th><th className="num">サイズ</th></tr></thead>
                  <tbody>
                    {x.digests.map((g) => {
                      const bad = reason === "hashMismatch" && (g.path.startsWith("tests/") || g.path.startsWith("artifacts/"));
                      return (
                        <tr key={g.path}>
                          <td className="mono small">{g.path}</td>
                          <td><HashDisplay value={g.sha256} verified={sig === "verified" ? "match" : bad ? "mismatch" : undefined} /></td>
                          <td className="num small">{g.size}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="承認" sub={`${d.approvals.length}件`} flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>ロール</th><th>承認者（外部IDで記録）</th><th>時刻</th></tr></thead>
                  <tbody>
                    {d.approvals.map((a) => (
                      <tr key={a.role}><td>{a.role}</td><td><ExternalActor userId={a.user_id} role={a.role} /></td><td><Timestamp at={a.at} mode="absolute" /></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="AIレビューの記録" sub="プロンプト本文は保存せず、テンプレートと入出力のハッシュだけを残します。AIの結果は判定には使われていません。" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>目的</th><th>モデル</th><th>テンプレートのハッシュ</th><th>結果のハッシュ</th></tr></thead>
                  <tbody>
                    {d.ai_reviews.map((r) => (
                      <tr key={r.purpose}>
                        <td><span className="row" style={{ ["--gap" as string]: "6px" }}><ActorLabel kind="ai" iconOnly size="sm" /><span className="mono small">{r.purpose}</span></span></td>
                        <td className="small">{r.model_family}</td>
                        <td><HashDisplay value={r.prompt_template_sha256} /></td>
                        <td><HashDisplay value={r.result_sha256} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="例外">
              {d.exceptions.length ? (
                <div className="row">{d.exceptions.map((e) => <IdLink key={e} id={e} to={paths.exception(org, project, e)} />)}</div>
              ) : (
                <span className="small muted">このリリースに適用された例外はありません。</span>
              )}
            </Section>

            <Section title="検証の履歴" flush>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>日時</th><th>結果</th><th>理由</th><th>実施</th></tr></thead>
                  <tbody>
                    {(failed && reason ? [{ at: "2026-11-27T09:00:00+09:00", result: "fail" as const, reason, by: "定期検証（システム）" }, ...x.verify.slice(1)] : x.verify).map((v) => (
                      <tr key={v.at}>
                        <td><Timestamp at={v.at} mode="absolute" /></td>
                        <td>{v.result === "pass" ? <Tag tone="pass" icon="check">一致</Tag> : <Tag tone="fail" icon="xCircle">失敗</Tag>}</td>
                        <td className="small">{v.reason ? VERIFY_FAILURE[v.reason].label : "—"}</td>
                        <td className="small">{v.by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="生データ">
              <JsonViewer value={json} />
            </Section>
          </>
        }
        side={
          <>
            <MetaSection title="保管">
              <RetentionBadge state={retention} until={m.retention_until} />
              <KeyValueList stacked items={[{ label: "保管先", value: d.storage }, { label: "保管先ロケーター", value: <span className="mono tiny" style={{ wordBreak: "break-all" }}>{reason === "storageMissing" ? <span className="text-fail">{x.retention_locator}（見つかりません）</span> : x.retention_locator}</span> }, { label: "保持期限", value: m.retention_until === "-" ? "—" : m.retention_until }, { label: "削除・上書き", value: "保持期限まで誰も削除できません" }]} />
            </MetaSection>
            <MetaSection title="対象">
              <KeyValueList stacked items={[{ label: "種類", value: m.target_kind === "release" ? "リリース" : "ゲート実行" }, { label: "対象", value: <span className="mono">{m.target}</span> }, { label: "承認の数", value: m.approval_count }]} />
            </MetaSection>
          </>
        }
      />
    </ProjectLayout>
  );
}
