// 画面ID: U-03 顧客目線のプレビューと公開版の確定
import "./disclosure.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { formatDate, yen } from "../../lib/format";
import { audiences, inferenceChecks, leakChecksClean, leakChecksDetected, publishedVersions } from "../../mocks/disclosure";
import { engagementOf } from "../../mocks/engagement";
import { milestones } from "../../mocks/portfolio";
import { userById } from "../../mocks/core";
import {
  ActorLabel,
  AudienceTag,
  Banner,
  Button,
  ConfirmDialog,
  ErrorState,
  Icon,
  Masked,
  PageHeader,
  ProjectLayout,
  RelationshipTag,
  Section,
  Segmented,
  Skeleton,
  Tabs,
  Tag,
  useToast,
} from "../../ui";

type View = "screen" | "attachments" | "csv" | "notice" | "ai";

export function PreviewScreen({ org = ORG, project = PROJECT }: { org?: string; project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const alliance = state === "alliance";
  const detected = state === "detected";
  const slug = alliance ? "member-app-api" : project;
  const eng = engagementOf(slug)!;
  const auds = audiences.filter((a) => a.project === slug);
  const [aud, setAud] = useState(auds[0]?.key ?? "");
  const [view, setView] = useState<View>("screen");
  const [confirm, setConfirm] = useState(false);
  const [fixed, setFixed] = useState(false);
  const checks = detected ? leakChecksDetected : leakChecksClean;
  const ng = checks.filter((c) => !c.ok).length;
  const prev = publishedVersions.find((v) => v.project === slug && v.status === "published");
  const nextId = alliance ? "PUB-0008" : "PUB-0004";
  const person = userById(auds.find((a) => a.key === aud)?.person_id);
  const ms = milestones.filter((m) => m.project === slug).slice(0, 4);
  const joint = eng.joint_items?.[0];

  return (
    <ProjectLayout org={org} project={project} active="disclosure" trail={[{ label: "顧客への公開", to: paths.disclosure(org, project) }, { label: "プレビューと確定" }]}>
      <PageHeader
        title="顧客目線のプレビューと公開版の確定"
        description="相手と役割を選ぶと、画面・添付・書き出し・通知文面・AI回答の見え方を確認できます。確定すると公開版と日時が固定され、元の資料を更新しても公開版は変わりません。"
        actions={<Button icon="arrowLeft" to={paths.disclosure(org, project)}>公開設定に戻る</Button>}
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          <div className="card tight row between">
            <div className="row">
              <RelationshipTag value={eng.relationship} />
              <span className="small">{eng.customer_company}</span>
              <select className="select sm" value={aud} onChange={(e) => setAud(e.target.value)} aria-label="プレビューする相手">
                {auds.map((a) => <option key={a.key} value={a.key}>{a.role}（{userById(a.person_id)?.name}）</option>)}
              </select>
            </div>
            <span className="tiny muted">現在の公開版: {prev ? `${prev.id}（${formatDate(prev.fixed_at)} 確定）` : "なし"}</span>
          </div>
          {detected ? (
            <Banner tone="fail" title={`非公開の値が ${ng} つの経路に混入しています。このままでは公開できません`}>
              該当する列・引用を取り除くか、公開設定で対象の資料の版を変えてください。混入がなくなるまで「公開版を確定」は押せません。
            </Banner>
          ) : null}
          {fixed ? (
            <Banner tone="pass" title={`${nextId} を確定しました（2026/11/27 10:30）`}>
              相手には、次回の表示から新しい公開版が見えます。元の資料を更新しても、{nextId} の内容は変わりません。
            </Banner>
          ) : null}
          <div className="grid side-420">
            <Section title={`${person?.name ?? "相手"} さんに見える内容`} sub="受注側の社内の値は、伏せ字ではなく項目ごと表示されません。ここでは確認のため伏せ字で示します" flush>
              <div className="card-body stack">
                <Tabs
                  value={view}
                  onChange={(v) => setView(v as View)}
                  tabs={[
                    { value: "screen", label: "画面" },
                    { value: "attachments", label: "添付" },
                    { value: "csv", label: "CSV" },
                    { value: "notice", label: "通知文面" },
                    { value: "ai", label: "AI回答" },
                  ]}
                />
                {view === "screen" ? (
                  <div className="dc-preview stack">
                    <div className="dc-preview-row"><span className="tiny muted">契約額</span><strong>{yen(eng.contract_amount)}</strong><AudienceTag value="customer" /></div>
                    {alliance && joint ? (
                      <div className="dc-preview-row"><span className="tiny muted">{joint.name}（予算・実績）</span><strong>{yen(joint.budget)} / {yen(joint.actual)}</strong><AudienceTag value="alliance" /></div>
                    ) : null}
                    {alliance && joint ? joint.share.map((sh) => (
                      <div key={sh.company} className="dc-preview-row"><span className="tiny muted">{sh.company} の負担額</span><strong>{yen(joint.budget * sh.ratio)}</strong><AudienceTag value="alliance" /></div>
                    )) : null}
                    <div className="dc-preview-row"><span className="tiny muted">JV内部予算</span><Masked visible={false}>{null}</Masked><span className="tiny muted">表示されません</span></div>
                    <div className="dc-preview-row"><span className="tiny muted">委託費・個人別報酬</span><Masked visible={false}>{null}</Masked><span className="tiny muted">表示されません</span></div>
                    <div className="dc-preview-row"><span className="tiny muted">粗利・粗利率</span><Masked visible={false}>{null}</Masked><span className="tiny muted">表示されません</span></div>
                    <div className="table-wrap">
                      <table className="table compact">
                        <thead><tr><th>納入物・マイルストーン</th><th>合意した納期</th><th>見込み</th></tr></thead>
                        <tbody>
                          {ms.map((m) => (
                            <tr key={m.id}><td className="small">{m.title}</td><td className="small">{formatDate(m.revised ?? m.baseline)}</td><td className="small">{m.actual ? `${formatDate(m.actual)}（完了）` : m.forecast ? formatDate(m.forecast) : "—"}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : view === "attachments" ? (
                  <ul className="dc-list">
                    <li className="small">リリース説明 rel-140 v2.pdf（公開版に固定。原本の URL は表示しません）</li>
                    <li className="small">SOW v3（合意版）</li>
                    <li className="small muted">結合テスト報告書 v1 — 非公開（公開候補から外しています）</li>
                  </ul>
                ) : view === "csv" ? (
                  <pre className="dc-code">{detected
                    ? "納入物,合意した納期,見込み,粗利率\nv1.4.0 納入,2026-12-10,2026-12-17,31.5%  ← 非公開値が混入"
                    : `納入物,合意した納期,見込み\n${ms.map((m) => `${m.title},${m.revised ?? m.baseline},${m.actual ?? m.forecast ?? ""}`).join("\n")}`}</pre>
                ) : view === "notice" ? (
                  <pre className="dc-code">{`【${eng.customer_company} 様】週次のご報告\n・v1.4.0 の納入見込みは 12/17 です（確約日 12/10）。\n・ご確認いただきたい事項: CR-0004 の追加費用（回答期限 12/2）\n詳細は案件ホームでご確認ください。\n── 案件窓口（サンプルソフト株式会社）`}</pre>
                ) : (
                  <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                    <ActorLabel kind="ai" name="顧客向け回答（案）" size="sm" />
                    <p className="small">{detected
                      ? "「11/26 の社内会議（MTG-14）では、外注費を抑えるために…」 ← 社内会議資料からの引用が混入しています"
                      : "納入見込みは 12/17 です。確約日 12/10 からの変更理由は、結合テスト環境の準備が 12/1 になったためです。（根拠: 公開版の進捗、リリース説明 v2）"}</p>
                    <span className="tiny muted">AI の回答は公開版（{prev?.id ?? "なし"}）だけを根拠にします。社内資料・原本は参照しません。</span>
                  </div>
                )}
              </div>
            </Section>
            <div className="stack">
              <Section title="非公開値の混入検査" sub="公開版を確定する前に、すべての経路を検査します">
                <ul className="dc-checks">
                  {checks.map((c) => (
                    <li key={c.channel} className={c.ok ? "ok" : "ng"}>
                      <Icon name={c.ok ? "checkCircle" : "xCircle"} size={15} />
                      <div><div className="small strong">{c.channel}</div><div className="tiny muted">{c.detail}</div></div>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="合計からの逆算の検査">
                <ul className="dc-checks">
                  {inferenceChecks.map((c) => (
                    <li key={c.label} className="ok"><Icon name="checkCircle" size={15} /><span className="small">{c.label}</span></li>
                  ))}
                </ul>
              </Section>
              <Section title="公開版を確定">
                <div className="stack">
                  <span className="small">新しい公開版 <span className="mono strong">{nextId}</span> · 確定者 {userById("u-kimura")?.name}</span>
                  <Button variant="primary" icon="lock" block disabled={ng > 0 || fixed} disabledReason={fixed ? "確定済みです" : "非公開値の混入を解消してください"} onClick={() => setConfirm(true)}>公開版を確定して公開</Button>
                  <Segmented value="now" onChange={() => toast({ kind: "info", message: "公開日時の予約は公開設定で指定します" })} options={[{ value: "now", label: "すぐ公開" }, { value: "later", label: "日時を指定" }]} />
                  <span className="tiny muted"><Tag square>{prev?.id ?? "—"}</Tag> は新しい公開版の確定と同時に置き換わり、履歴に残ります。</span>
                </div>
              </Section>
            </div>
          </div>
          <ConfirmDialog
            open={confirm}
            onClose={() => setConfirm(false)}
            onConfirm={() => { setConfirm(false); setFixed(true); toast({ kind: "success", message: `${nextId} を確定しました` }); }}
            title="公開版を確定しますか？"
            message={`${eng.customer_company} に、選択した項目を公開します。確定後に元の資料を更新しても、公開版の内容は変わりません。`}
            confirmLabel="確定して公開"
          />
        </>
      )}
    </ProjectLayout>
  );
}
