// 画面ID: X-16 共同事業の収支・決裁（顧客側）
import "./disclosure.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { formatDate, yen } from "../../lib/format";
import { engagementOf } from "../../mocks/engagement";
import { jointApprovals, jointLimits, publishedVersions } from "../../mocks/disclosure";
import type { JointApproval } from "../../mocks/disclosure";
import {
  Banner,
  Button,
  CustomerPortalLayout,
  EmptyState,
  ErrorState,
  Radio,
  Section,
  Skeleton,
  Tag,
  TextArea,
  useToast,
} from "../../ui";
import { JointApprovalCard } from "./parts";

const MY_COMPANY = "架空リテール株式会社";

export function PortalJointScreen({ project = "member-app-api" }: { project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const slug = engagementOf(project)?.relationship === "alliance" ? project : "member-app-api";
  const eng = engagementOf(slug)!;
  const pub = publishedVersions.find((v) => v.project === slug && v.status === "published");
  const [list, setList] = useState<JointApproval[]>(jointApprovals);
  const [choice, setChoice] = useState("approve");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const pending = list.find((a) => a.approvals.some((x) => x.company === MY_COMPANY && x.status === "pending"));
  const canDecide = state !== "viewer";

  const submit = () => {
    if (!pending) return;
    setSending(true);
    window.setTimeout(() => {
      setList((l) => l.map((a) => (a.id === pending.id ? { ...a, status: choice === "approve" ? "approved" : "returned", approvals: a.approvals.map((x) => (x.company === MY_COMPANY ? { ...x, status: choice === "approve" ? "approved" : "returned", at: "2026-11-27T10:30:00+09:00", comment: comment || undefined } : x)) } : a)));
      setSending(false);
      toast({ kind: "success", message: `${pending.id} への自社の回答を記録しました（受付番号 JDC-R-0418）` });
    }, 600);
  };

  return (
    <CustomerPortalLayout project={slug} active="joint" userId="u-fujii">
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <h1 className="dc-title">共同事業の収支・決裁</h1>
        <p className="small muted">提携契約 CT-0021 で合意した共同費目だけを表示しています（公開版 {pub?.id} · {pub ? formatDate(pub.fixed_at) : "—"} 時点）。各社の決裁は分けて記録します。</p>
      </div>
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : state === "ended" ? (
        <div className="card"><EmptyState icon="lock" title="業務提携の終了に伴い、公開は停止されました" description="過去にダウンロードした控えの扱いは、サンプルソフト株式会社の案件窓口にお問い合わせください。" /></div>
      ) : (
        <>
          {state === "viewer" ? (
            <Banner tone="info" title="閲覧のみの権限です">共同決裁への回答は、貴社で登録された決裁者（藤井 晃 様）が行います。</Banner>
          ) : null}
          <Section title="共同費目と負担額" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>費目</th><th className="num">予算</th><th className="num">承認上限</th><th className="num">実績</th><th className="num">予算差</th><th>貴社の負担額</th></tr></thead>
                <tbody>
                  {(eng.joint_items ?? []).map((i) => {
                    const share = i.share.find((s) => s.company === MY_COMPANY)?.ratio ?? 0;
                    return (
                      <tr key={i.name}>
                        <td className="strong small">{i.name}</td>
                        <td className="num small">{yen(i.budget)}</td>
                        <td className="num small">{yen(jointLimits[i.name] ?? i.budget)}</td>
                        <td className="num small">{yen(i.actual)}</td>
                        <td className="num small">{yen(i.budget - i.actual)}</td>
                        <td className="small"><strong>{yen(i.budget * share)}</strong> <span className="tiny muted">（負担 {Math.round(share * 100)}%・実績ベース {yen(i.actual * share)}）</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="card-body"><span className="tiny muted">この表には、提携契約で合意した費目だけが含まれます。契約額は案件ホームでご確認ください。</span></div>
          </Section>
          <Section title="決裁条件">
            <ul className="dc-list">
              <li className="small">承認上限を超える支出・上限の改訂は、両社の決裁者がそれぞれ承認します（提携契約 第8条）</li>
              <li className="small">負担比率の変更は、両社の署名権限者の合意が必要です（同 第9条）</li>
              <li className="small">一社だけの承認では確定しません。回答の状況は下に表示します</li>
            </ul>
          </Section>
          <Section title="共同決裁の状況">
            <div className="stack">{list.map((a) => <JointApprovalCard key={a.id} item={a} myCompany={MY_COMPANY} />)}</div>
          </Section>
          {pending ? (
            <Section title={`自社の回答: ${pending.id}`} sub={`${pending.title} · 期限 ${pending.due.replace(/-/g, "/")}`}>
              <div className="stack">
                <div className="row">
                  <Radio name="joint-choice" value="approve" label="承認する" checked={choice === "approve"} onChange={() => setChoice("approve")} />
                  <Radio name="joint-choice" value="return" label="差し戻す（理由が必要）" checked={choice === "return"} onChange={() => setChoice("return")} />
                </div>
                <TextArea label={choice === "return" ? "差戻しの理由" : "コメント（任意）"} required={choice === "return"} rows={2} value={comment} onChange={setComment} />
                <div className="row end">
                  <Button
                    variant="primary"
                    loading={sending}
                    disabled={!canDecide || (choice === "return" && !comment.trim())}
                    disabledReason={!canDecide ? "決裁者だけが回答できます" : "差戻しの理由を入力してください"}
                    onClick={submit}
                  >
                    自社の回答を記録
                  </Button>
                </div>
                <span className="tiny muted">貴社の回答だけでは改訂は確定しません。サンプルソフト株式会社の決裁と両方そろった時点で確定します。</span>
              </div>
            </Section>
          ) : (
            <Section title="自社の回答"><Tag tone="pass">回答待ちの決裁はありません</Tag></Section>
          )}
        </>
      )}
    </CustomerPortalLayout>
  );
}
