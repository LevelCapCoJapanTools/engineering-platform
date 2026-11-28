// 画面ID: X-02 顧客の承認
// 承認・質問・理由付き差戻し。質問を返しても承認にはならない。旧版への依頼から現行版を承認できない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { approvalTargets } from "../../mocks/external";
import { Banner, Button, CustomerPortalLayout, DeadlineIndicator, DiffViewer, EmptyState, Icon, Link, Segmented, Tag, TextArea, VersionPin } from "./deps";

const KIND_LABEL = { requirement: "要求", plan: "計画", change: "変更要求" };

export function X02PortalApproval({ project = PROJECT, id }: { project?: string; id: string }) {
  const state = useScreenState();
  const t = approvalTargets[id] ?? approvalTargets["APR-499"];
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [decided, setDecided] = useState<"approved" | "returned" | "questioned" | null>(state === "承認済み" ? "approved" : state === "質問を送信済み" ? "questioned" : null);
  const [busy, setBusy] = useState(false);
  const staleVersion = state === "旧版の申請";
  const act = (kind: "approved" | "returned" | "questioned") => {
    if (busy) return;
    if ((kind === "returned" || kind === "questioned") && !comment.trim()) {
      setErr(kind === "returned" ? "差し戻す理由を入力してください" : "質問の内容を入力してください");
      return;
    }
    setBusy(true);
    window.setTimeout(() => { setBusy(false); setDecided(kind); }, 500);
  };
  const [diffMode, setDiffMode] = useState<"split" | "unified">(typeof window !== "undefined" && window.innerWidth < 720 ? "unified" : "split");
  const overdue = state === "期限超過";
  const takenByOther = state === "他の人が判断済み";

  return (
    <CustomerPortalLayout project={project} active="requests">
      <Link to={paths.portalRequests(project)} className="small">← 申請・承認へ戻る</Link>

      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <div className="row" style={{ ["--gap" as string]: "8px" }}>
          <Tag tone="primary" square>{KIND_LABEL[t.kind]}の承認</Tag>
          <span className="id-link">{t.target_id}</span>
          <span className="tiny muted">{t.version}</span>
          {staleVersion ? <VersionPin version={1} latest={2} /> : null}
        </div>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)", lineHeight: 1.4 }}>{t.title}</h1>
        <div className="row small muted" style={{ ["--gap" as string]: "10px" }}>
          <span>依頼: {t.requester}</span>
          <DeadlineIndicator date={overdue ? "2026-11-25" : t.due_at} />
        </div>
      </div>

      {decided === "approved" ? (
        <div className="card"><EmptyState icon="checkCircle" title="承認しました" description="承認の記録は証跡として保存されました。開発チームに通知しています。" action={<Button variant="primary" to={paths.portal(project)}>ホームへ戻る</Button>} /></div>
      ) : decided === "questioned" ? (
        <div className="card"><EmptyState icon="message" title="質問を送りました（まだ承認していません）" description="受注側の回答は、この申請の中に表示され、メールでもお知らせします。回答を確認してから、承認か差戻しを選んでください。" action={<Button variant="primary" onClick={() => setDecided(null)}>申請に戻る</Button>} /></div>
      ) : decided === "returned" ? (
        <div className="card"><EmptyState icon="arrowLeft" title="差し戻しました" description="コメントを添えて開発チームに通知しました。修正後にもう一度承認の依頼が届きます。" action={<Button variant="primary" to={paths.portal(project)}>ホームへ戻る</Button>} /></div>
      ) : (
        <>
          {takenByOther ? (
            <Banner tone="info" title="この依頼は、すでに他の承認者が判断しました">
              架空商事株式会社 購買部 の別の担当者が 2026-11-27 09:40 に承認しました。あなたの操作は不要です。
            </Banner>
          ) : null}
          {staleVersion ? (
            <Banner tone="warn" title="この依頼は古い版（v1）に対するものです">
              依頼の後に内容が v2 に更新されたため、この依頼からは承認できません。現行の版（v2）の依頼を開いて、変更点を確認してから回答してください。<Link to={paths.portalRequest(project, "REQ-C-0014")}>現行の版の申請を開く</Link>
            </Banner>
          ) : null}
          {overdue ? (
            <Banner tone="warn" title="承認の期限を過ぎています">期限は 2026-11-25 でした。承認・差戻しは引き続き行えます。開発のスケジュールに影響する場合があります。</Banner>
          ) : null}

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <h2 className="section-title">要約</h2>
            <p style={{ lineHeight: 1.85 }}>{t.summary}</p>
          </section>

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <div className="row between">
              <h2 className="section-title">前回の版からの変更</h2>
              <Segmented value={diffMode} onChange={(v) => setDiffMode(v as "split" | "unified")} options={[{ value: "split", label: "横並び" }, { value: "unified", label: "縦並び" }]} />
            </div>
            <DiffViewer before={t.before} after={t.after} beforeLabel="前回" afterLabel="今回" mode={diffMode} />
          </section>

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <h2 className="section-title">受入基準</h2>
            <p className="small muted">完成したときに、次の条件で確認します。</p>
            <ul className="checklist">
              {t.criteria.map((c) => (
                <li key={c}>
                  <Icon name="checkSquare" size={18} className="muted" />
                  <span className="cl-title">{c}</span>
                  <span />
                </li>
              ))}
            </ul>
          </section>

          {!takenByOther ? (
            <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
              <TextArea label="コメント・質問" help="差し戻す場合は理由、質問する場合は質問の内容が必須です。質問を送っても承認にはなりません" value={comment} onChange={(v) => { setComment(v); setErr(""); }} rows={3} error={err || undefined} />
              <div className="sticky-actions">
                <Button variant="ghost" icon="message" disabled={busy} disabledReason="送信中です" onClick={() => act("questioned")}>質問する</Button>
                <Button variant="secondary" icon="arrowLeft" disabled={busy} disabledReason="送信中です" onClick={() => act("returned")}>差し戻す</Button>
                <Button variant="primary" icon="check" loading={busy} disabled={busy || staleVersion} disabledReason={staleVersion ? "古い版への依頼からは承認できません" : "送信中です"} onClick={() => act("approved")}>承認する</Button>
              </div>
            </section>
          ) : (
            <Button to={paths.portal(project)}>ホームへ戻る</Button>
          )}
        </>
      )}
    </CustomerPortalLayout>
  );
}
