// 画面ID: R-05 要求の版比較
// 版の差分、再承認の要否と状態、旧版（承認版）の証跡の保持、関連する設計・テストへの影響を示す。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { ARTIFACT_STATUS } from "../../lib/vocab";
import { fakeSha, requirementById, requirements, userById } from "../../mocks/core";
import {
  Banner,
  Button,
  DiffViewer,
  EmptyState,
  ErrorState,
  ExternalActor,
  HashDisplay,
  IdLink,
  PageHeader,
  ProjectLayout,
  Section,
  Select,
  Skeleton,
  SourceTag,
  StatusBadge,
  Tag,
  Timestamp,
} from "../../ui";
import { ApprovalRecords, designPath, OpenInSource, org, project, reqMeta, reqPath, reqSourceOf, versionsOf } from "./common";

export function RequirementDiff({ id }: { id: string }) {
  const state = useScreenState();
  const req = state === "noChange" ? requirementById("REQ-0001") : requirements.find((r) => r.id === id) ?? requirementById("REQ-0008");
  const versions = versionsOf(req);
  const meta = reqMeta(req);
  const [from, setFrom] = useState(String(meta.approved_version ?? versions[Math.max(0, versions.length - 2)].version));
  const [to, setTo] = useState(String(versions[versions.length - 1].version));
  const trail = [{ label: "要求", to: paths.requirements(org, project) }, { label: req.id, to: reqPath(req.id) }, { label: "版の比較" }];

  if (state === "loading") {
    return <ProjectLayout active="requirements" trail={trail}><Skeleton variant="detail" /></ProjectLayout>;
  }
  if (state === "error") {
    return <ProjectLayout active="requirements" trail={trail}><ErrorState title="版を読み込めませんでした" /></ProjectLayout>;
  }

  const a = versions.find((v) => String(v.version) === from) ?? versions[0];
  const b = versions.find((v) => String(v.version) === to) ?? versions[versions.length - 1];
  const aCrit = a.criteria ?? [];
  const bCrit = b.criteria ?? req.acceptance_criteria;
  const added = bCrit.filter((c) => !aCrit.includes(c));
  const removed = aCrit.filter((c) => !bCrit.includes(c));
  const kept = bCrit.filter((c) => aCrit.includes(c));
  const reapproved = state === "reapproved";
  const needsReapproval = meta.approved_version !== undefined && b.version > meta.approved_version && !reapproved;
  const pendingCustomer = meta.approvals.filter((x) => x.version === b.version);
  const impacted = [
    ...req.design_ids.map((d) => ({ id: d, kind: "設計", to: designPath(d), note: "承認版との差分に合わせて再確認が必要" })),
    ...req.test_ids.map((t) => ({ id: t, kind: "テスト", to: undefined, note: "追加された受入基準に対応するテストの確認が必要" })),
  ];
  const options = versions.map((v) => ({ value: String(v.version), label: `v${v.version}${v.version === meta.approved_version ? "（承認版）" : ""}` }));

  return (
    <ProjectLayout active="requirements" trail={trail}>
      <PageHeader
        id={req.id}
        title={`版の比較: ${req.title}`}
        status={<StatusBadge vocab={ARTIFACT_STATUS[reapproved ? "approved" : req.status]} />}
        meta={<SourceTag source={reqSourceOf(req)} />}
        actions={<><Button icon="arrowLeft" to={reqPath(req.id)}>要求に戻る</Button><OpenInSource label="正本の履歴を開く" /></>}
      />
      {versions.length < 2 ? (
        <div className="card">
          <EmptyState icon="compare" title="比較できる版がありません" description={`${req.id} の版は v${req.version} の1つだけです。正本で改訂されると、ここで差分を確認できます。`} action={<Button to={reqPath(req.id)}>要求に戻る</Button>} />
        </div>
      ) : (
        <>
          {needsReapproval ? (
            <Banner tone="warn" title={`v${b.version} は再承認が必要です（承認版は v${meta.approved_version}）`}>
              承認済みの版から本文または受入基準が変わったため、顧客と PM の再承認が必要です。再承認されるまで、設計・テスト・ゲートは承認版 v{meta.approved_version} を基準に扱います。
            </Banner>
          ) : reapproved ? (
            <Banner tone="pass" title={`v${b.version} が再承認されました`}>承認版を v{b.version} に更新しました。旧承認版 v{meta.approved_version} の内容と承認記録は証跡として残っています。</Banner>
          ) : null}
          <div className="card tight row" style={{ ["--gap" as string]: "12px" }}>
            <div style={{ minWidth: 180 }}><Select label="比較元" value={from} onChange={setFrom} options={options} /></div>
            <div style={{ minWidth: 180 }}><Select label="比較先" value={to} onChange={setTo} options={options} /></div>
            <span className="small muted">v{a.version}: {userById(a.by)?.name}・<Timestamp at={a.at} mode="date" />（{a.note}） → v{b.version}: {userById(b.by)?.name}・<Timestamp at={b.at} mode="date" />（{b.note}）</span>
          </div>
          <Section title="本文の差分">
            <DiffViewer before={a.body} after={b.body} beforeLabel={`v${a.version}`} afterLabel={`v${b.version}`} />
          </Section>
          <Section title="受入基準の差分" sub={`追加 ${added.length}件・削除 ${removed.length}件・変更なし ${kept.length}件`}>
            {added.length + removed.length + kept.length === 0 ? (
              <p className="small muted">受入基準はどちらの版にもありません。</p>
            ) : (
              <ul className="req-criteria-diff">
                {removed.map((c) => <li key={`d-${c}`} className="del"><Tag tone="fail" square>削除</Tag>{c}</li>)}
                {added.map((c) => <li key={`a-${c}`} className="add"><Tag tone="pass" square>追加</Tag>{c}</li>)}
                {kept.map((c) => <li key={`k-${c}`}><Tag square>変更なし</Tag>{c}</li>)}
              </ul>
            )}
          </Section>
          <div className="grid cols-2">
            <Section title="再承認の状況" sub={`v${b.version} の承認`}>
              {pendingCustomer.length ? <ApprovalRecords approvals={pendingCustomer} /> : <p className="small muted">この版の承認はまだ依頼されていません。</p>}
              {needsReapproval ? <div className="row end" style={{ marginTop: 8 }}><Button icon="send" to={`${paths.requirementApproval(org, project)}?ids=${req.id}`}>承認者に再依頼</Button></div> : null}
            </Section>
            <Section title="旧版の証跡" sub="承認版の内容は上書きせずに保持します">
              {meta.approved_version ? (
                <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                  <span className="row"><Tag tone="pass" square icon="lock">承認版 v{meta.approved_version}</Tag><span className="tiny muted">{meta.approved_at ? <Timestamp at={meta.approved_at} mode="absolute" /> : ""}</span></span>
                  <HashDisplay value={meta.approved_hash ?? fakeSha(`${req.id}-v${meta.approved_version}`)} label="内容のハッシュ" />
                  <span className="small">承認者: {meta.approvals.filter((x) => x.version === meta.approved_version && x.status === "approved").map((x) => <span key={x.user_id} style={{ marginRight: 8 }}><ExternalActor userId={x.user_id} /></span>)}</span>
                  <span className="small">記録先: <IdLink id="MAN-0013" to={paths.manifest(org, project, "MAN-0013")} /> の Evidence Manifest（追記専用の保管先）</span>
                </div>
              ) : (
                <p className="small muted">まだ承認された版はありません。</p>
              )}
            </Section>
          </div>
          <Section title="影響を受ける設計・テスト" sub="承認版からの変更に合わせて、担当者が再確認します">
            {impacted.length ? (
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>成果物</th><th>種類</th><th>確認すること</th></tr></thead>
                  <tbody>
                    {impacted.map((i) => (
                      <tr key={i.id}><td>{i.to ? <IdLink id={i.id} to={i.to} /> : <span className="id-link">{i.id}</span>}</td><td><Tag square>{i.kind}</Tag></td><td className="small">{i.note}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="small muted">リンクされた設計・テストはありません。</p>
            )}
          </Section>
        </>
      )}
    </ProjectLayout>
  );
}
