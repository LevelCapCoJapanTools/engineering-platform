// 画面ID: F-01 招待・利用開始
import "./freelancer.css";
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { projectBySlug, userById } from "../../mocks/core";
import { latestTerms } from "../../mocks/engagement";
import { myOrderById } from "../../mocks/freelancer";
import { Banner, Button, CenterLayout, Icon, KeyValueList, TextField, useToast } from "../../ui";

/** 招待先のメールアドレスは一部だけ表示する */
const MASKED_EMAIL = "ma***@freelance.example";

export function F01Invite() {
  const state = useScreenState();
  const toast = useToast();
  const order = myOrderById("ORD-0105")!;
  const terms = latestTerms(order);
  const project = projectBySlug(order.project);
  const desk = userById("u-aoki");
  const [sent, setSent] = useState(state === "コード送信済み");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(state === "確認済み");

  const blocked = state === "期限切れ" || state === "別人（転送先）" || state === "契約終了で失効";

  return (
    <CenterLayout>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <span className="small muted">お仕事の依頼が届いています</span>
        <h1 style={{ fontSize: "var(--text-lg)", color: "var(--text-strong)" }}>{order.client_company} からの依頼</h1>
      </div>

      {state === "期限切れ" ? (
        <Banner tone="warn" title="この招待は期限切れです">
          招待の有効期限（2026-11-26）が過ぎました。依頼元に新しい招待を依頼してください。依頼の内容はまだ開けません。
          <div style={{ marginTop: 10 }}>
            <Button size="sm" icon="mail" onClick={() => toast({ kind: "success", message: "案件窓口に再招待を依頼しました。新しい招待メールをお待ちください" })}>再招待を依頼する</Button>
          </div>
        </Banner>
      ) : null}
      {state === "別人（転送先）" ? (
        <Banner tone="fail" title="この招待は別の方に宛てたものです">
          招待は {MASKED_EMAIL} 宛てに送られています。転送された招待では、依頼の内容や条件を開けません。ご自身に依頼が必要な場合は、依頼元にご連絡ください。
        </Banner>
      ) : null}
      {state === "契約終了で失効" ? (
        <Banner tone="warn" title="この依頼の利用期間は終了しています">
          契約が終了したため、依頼の内容と資料は開けません。これまでの発注書・提出控え・支払の記録は「提出・取引履歴」から取得できます。
          <div style={{ marginTop: 10 }}><Button size="sm" to={paths.freelancerHistory()} icon="history">提出・取引履歴へ</Button></div>
        </Banner>
      ) : null}

      <div className="card tight stack" style={{ ["--gap" as string]: "12px", background: "var(--bg-subtle)" }}>
        <KeyValueList
          stacked
          items={[
            { label: "依頼元", value: order.client_company },
            { label: "案件", value: blocked ? <span className="muted">（本人確認後に表示）</span> : project.name },
            { label: "依頼", value: blocked ? <span className="muted">（本人確認後に表示）</span> : order.title },
            { label: "見られる範囲", value: <span className="small">この依頼の条件と共有された資料、あなたの質問と回答、提出と取引の履歴だけです。発注企業の連絡先や、ほかの依頼は表示されません。</span> },
            { label: "回答期限", value: order.next_due ? formatDate(order.next_due) : "—" },
            { label: "納期（予定）", value: blocked ? <span className="muted">（本人確認後に表示）</span> : formatDate(terms.due) },
            { label: "招待先", value: <span className="mono small">{MASKED_EMAIL}</span> },
          ]}
        />
      </div>

      {done ? (
        <div className="stack">
          <Banner tone="pass" title="本人確認が完了しました">次回からは、このメールアドレスに届くコードでいつでも続きから開けます。</Banner>
          <Button variant="primary" size="lg" block to={paths.freelancerOrder("ORD-0105")} iconRight="arrowRight">依頼の内容を見る</Button>
        </div>
      ) : blocked ? null : (
        <div className="stack" style={{ ["--gap" as string]: "12px" }}>
          <p className="small">招待先のメールアドレスに確認コードを送り、ご本人であることを確認します。アカウントの作成やパスワードは不要です。</p>
          {!sent ? (
            <Button variant="primary" size="lg" block icon="mail" onClick={() => { setSent(true); toast({ kind: "success", message: `${MASKED_EMAIL} に確認コードを送りました` }); }}>確認コードを送る</Button>
          ) : (
            <>
              <TextField label="確認コード（6桁）" value={code} onChange={setCode} maxLength={6} placeholder="123456" help="コードは10分間有効です。入力したコードは保存しません。" />
              <Button
                variant="primary"
                size="lg"
                block
                loading={verifying}
                disabled={code.length !== 6 || verifying}
                disabledReason="6桁のコードを入力してください"
                onClick={() => { setVerifying(true); window.setTimeout(() => { setVerifying(false); setDone(true); }, 600); }}
              >
                確認して始める
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast({ kind: "success", message: "確認コードを再送しました" })}>コードを再送する</Button>
            </>
          )}
        </div>
      )}

      <p className="tiny muted">
        <Icon name="info" size={12} /> この招待は {MASKED_EMAIL} の方だけが使えます。わからないことは案件窓口（{desk?.name}）に、依頼の「質問と回答」からお問い合わせください。
      </p>
    </CenterLayout>
  );
}
