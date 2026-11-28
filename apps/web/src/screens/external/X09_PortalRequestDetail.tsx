// 画面ID: X-09 顧客ポータル: 申請の詳細
// 受注側の補足、質問の往復、社内稟議の経路（担当レビュー → 予算責任者の決裁）と、誰の回答待ちかを示す。
// 決裁上限を超える改訂では経路を再計算する。共同決裁は一社だけの承認では完了しない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { formatDate, formatDateTime, yen } from "../../lib/format";
import { customerRequests } from "../../mocks/external";
import type { RouteStep } from "../../mocks/external";
import { userById } from "../../mocks/core";
import { Banner, Button, CustomerPortalLayout, EmptyState, ErrorState, Icon, KeyValueList, Link, Skeleton, StatusBadge, TextArea, VersionPin, useToast } from "./deps";
import { REQUEST_STATUS, RequestKindTag, RouteSteps } from "./portalParts";

export function X09PortalRequestDetail({ project = PROJECT, id }: { project?: string; id: string }) {
  const state = useScreenState();
  const toast = useToast();
  const requestId = state === "共同決裁" ? "REQ-C-0021" : state === "旧版の申請" ? "REQ-C-0014" : state === "質問の往復" ? "REQ-C-0013" : id;
  const r = customerRequests.find((x) => x.id === requestId) ?? customerRequests[0];
  const slug = r.project ?? project;
  const viewerId = state === "あなたの決裁" || state === "決裁上限を超える改訂" ? "u-komatsu" : state === "共同決裁" ? "u-fujii" : "u-nakamura";
  const viewer = userById(viewerId);
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState(r.thread);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [decided, setDecided] = useState<"approved" | "returned" | null>(state === "承認済み" ? "approved" : null);
  const [err, setErr] = useState("");

  const overLimit = state === "決裁上限を超える改訂";
  const amount = overLimit ? 3_400_000 : r.amount;
  const route: RouteStep[] = overLimit
    ? [
        { role: "担当レビュー", user_id: "u-noguchi", name: "野口 舞", status: "done", at: "2026-11-27T09:30:00+09:00" },
        { role: "予算責任者の決裁", user_id: "u-komatsu", name: "小松 恵", status: "waiting", limit: "300 万円まで" },
        { role: "役員決裁（社内稟議）", name: "貴社の役員会（本サービス外で決裁し、結果を登録）", status: "pending" },
      ]
    : r.route;
  const waiting = route.find((s) => s.status === "waiting");
  const myTurn = waiting?.user_id === viewerId;
  const stale = r.version < r.latest_version;
  const finalStep = route.filter((s) => s.status !== "done").length <= 1;

  const ask = () => {
    if (!question.trim()) return;
    setThread((t) => [...t, { from: "customer", name: viewer?.name ?? "", at: "2026-11-27T10:31:00+09:00", body: question }]);
    setQuestion("");
    toast({ kind: "success", message: "質問を送りました。承認はまだ行われていません" });
  };
  const decide = (kind: "approved" | "returned") => {
    if (busy) return;
    if (kind === "returned" && !comment.trim()) { setErr("差し戻す理由を入力してください"); return; }
    setBusy(true);
    window.setTimeout(() => { setBusy(false); setDecided(kind); }, 500);
  };

  return (
    <CustomerPortalLayout project={slug} active="requests" userId={viewerId}>
      <Link to={paths.portalRequests(slug)} className="small">← 申請・承認へ戻る</Link>
      {state === "読み込み中" ? <Skeleton variant="detail" /> : state === "エラー" ? <ErrorState /> : state === "権限なし" ? (
        <div className="card"><EmptyState icon="lock" title="この申請を見る権限がありません" description="貴社の管理者が登録した閲覧者・承認者だけが開けます。必要な場合は、貴社の管理者（酒井 隆 さん）に依頼してください。" /></div>
      ) : (
        <>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <div className="row" style={{ ["--gap" as string]: "8px" }}>
              <RequestKindTag kind={r.kind} />
              <span className="mono tiny muted">{r.id}</span>
              <VersionPin version={overLimit ? 3 : r.version} latest={overLimit ? 3 : r.latest_version} />
              <StatusBadge vocab={REQUEST_STATUS[decided ?? r.status]} size="sm" />
            </div>
            <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)", lineHeight: 1.4 }}>{r.title}</h1>
            <span className="small muted">決める人: {r.decider} · 期限 {formatDate(r.due)}</span>
          </div>

          {stale ? <Banner tone="warn" title="この申請は古い版（v1）です">内容が v{r.latest_version} に更新されたため、この版では承認できません。受注側が現行の版で申請し直すと、新しい申請として届きます。</Banner> : null}
          {overLimit ? <Banner tone="warn" title="改訂で金額が決裁上限を超えたため、承認の経路を再計算しました">v3 で金額が 340 万円になり、予算責任者の決裁上限（300 万円）を超えました。v2 までの確認結果は v3 に引き継がず、役員決裁を経路に追加しています。</Banner> : null}
          {state === "共同決裁" ? <Banner tone="info" title="提携契約の共同決裁です">受注側と貴社の両方の決裁がそろうまで完了しません。受注側の決裁は完了しています。</Banner> : null}

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <h2 className="section-title">内容</h2>
            <p style={{ lineHeight: 1.8 }}>{r.summary}</p>
            <KeyValueList
              items={[
                ...(amount !== undefined ? [{ label: state === "共同決裁" ? "共同費目の追加額（税抜）" : "金額（貴社のお支払い・税抜）", value: <strong>{yen(amount)}</strong> }] : []),
                { label: "承認した場合", value: r.impact_if_approved },
                { label: "差し戻した場合", value: r.impact_if_returned },
              ]}
            />
            {r.jv_note ? <div className="cp-note"><span className="tiny muted">受注側からの補足</span><span className="small">{r.jv_note}</span></div> : null}
          </section>

          <section className="card stack" style={{ ["--gap" as string]: "10px" }} aria-labelledby="cp-route-title">
            <h2 id="cp-route-title" className="section-title">貴社の承認の経路</h2>
            <RouteSteps steps={route} />
            <p className="small">{waiting ? <><Icon name="clock" size={14} /> いまは <strong>{waiting.name}</strong> さんの回答待ちです。</> : "すべての段階が完了しました。"}</p>
            <p className="tiny muted">経路は貴社の管理者が「社内の権限者」で設定した規則（金額・内容別）で決まります。<Link to={paths.portalRouting(slug)}>経路の規則を見る</Link></p>
          </section>

          <section className="card stack" style={{ ["--gap" as string]: "10px" }} aria-labelledby="cp-thread">
            <h2 id="cp-thread" className="section-title">質問と回答</h2>
            {thread.length ? (
              <ul className="cp-thread">
                {thread.map((m, i) => (
                  <li key={i} className={m.from === "customer" ? "mine" : ""}>
                    <span className="tiny muted">{m.name} · {formatDateTime(m.at)}</span>
                    <span className="small">{m.body}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="small muted">まだ質問はありません。</p>}
            {state === "質問の往復" ? <p className="tiny muted">受注側の回答予定: 2026-11-28 12:00 まで（案件窓口）</p> : null}
            <TextArea label="質問する" help="質問を送っても承認にはなりません。回答はこの申請に表示されます" rows={2} value={question} onChange={setQuestion} />
            <div className="row"><Button icon="message" disabled={!question.trim()} disabledReason="質問の内容を入力してください" onClick={ask}>質問を送る</Button></div>
          </section>

          {decided ? (
            <div className="card"><EmptyState icon={decided === "approved" ? "checkCircle" : "arrowLeft"} title={decided === "approved" ? (finalStep ? "承認しました" : "あなたの段階を承認しました") : "差し戻しました"} description={decided === "approved" ? (finalStep ? "控えをメールでお送りしました。受注側に通知しています。" : "次の段階の承認者に回しました。すべての段階がそろうと承認が完了します。") : "理由を添えて受注側に通知しました。"} action={<Button variant="primary" to={paths.portalRequests(slug)}>申請・承認へ戻る</Button>} /></div>
          ) : (
            <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
              {!myTurn ? <Banner tone="info">{waiting ? `この段階の承認者は ${waiting.name} さんです。あなた（${viewer?.name}）は、質問と閲覧ができます。` : "承認は完了しています。"}</Banner> : null}
              <TextArea label="コメント" help="差し戻す場合は理由が必須です" rows={2} value={comment} onChange={(v) => { setComment(v); setErr(""); }} error={err || undefined} />
              <div className="sticky-actions">
                <Button variant="secondary" icon="arrowLeft" disabled={!myTurn || busy || stale} disabledReason={stale ? "古い版の申請です" : !myTurn ? "あなたの段階ではありません" : "送信中です"} onClick={() => decide("returned")}>差し戻す</Button>
                <Button variant="primary" icon="check" loading={busy} disabled={!myTurn || busy || stale} disabledReason={stale ? "古い版の申請です" : !myTurn ? "あなたの段階ではありません" : "送信中です"} onClick={() => decide("approved")}>{finalStep ? "承認する" : "この段階を承認"}</Button>
              </div>
            </section>
          )}
        </>
      )}
    </CustomerPortalLayout>
  );
}
