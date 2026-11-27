// 画面ID: X-02 顧客の承認
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { approvalTargets } from "../../mocks/external";
import { Banner, Button, DeadlineIndicator, DiffViewer, EmptyState, Icon, Link, PortalLayout, Segmented, Tag, TextArea } from "./deps";

const KIND_LABEL = { requirement: "要求", plan: "計画", change: "変更要求" };

export function X02PortalApproval({ project = PROJECT, id }: { project?: string; id: string }) {
  const state = useScreenState();
  const t = approvalTargets[id] ?? approvalTargets["APR-499"];
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [decided, setDecided] = useState<"approved" | "returned" | null>(state === "承認済み" ? "approved" : null);
  const [diffMode, setDiffMode] = useState<"split" | "unified">(typeof window !== "undefined" && window.innerWidth < 720 ? "unified" : "split");
  const overdue = state === "期限超過";
  const takenByOther = state === "他の人が判断済み";

  return (
    <PortalLayout project={project}>
      <Link to={paths.portal(project)} className="small">← ポータルのホームへ戻る</Link>

      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <div className="row" style={{ ["--gap" as string]: "8px" }}>
          <Tag tone="primary" square>{KIND_LABEL[t.kind]}の承認</Tag>
          <span className="id-link">{t.target_id}</span>
          <span className="tiny muted">{t.version}</span>
        </div>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)", lineHeight: 1.4 }}>{t.title}</h1>
        <div className="row small muted" style={{ ["--gap" as string]: "10px" }}>
          <span>依頼: {t.requester}</span>
          <DeadlineIndicator date={overdue ? "2026-11-25" : t.due_at} />
        </div>
      </div>

      {decided === "approved" ? (
        <div className="card"><EmptyState icon="checkCircle" title="承認しました" description="承認の記録は証跡として保存されました。開発チームに通知しています。" action={<Button variant="primary" to={paths.portal(project)}>ホームへ戻る</Button>} /></div>
      ) : decided === "returned" ? (
        <div className="card"><EmptyState icon="arrowLeft" title="差し戻しました" description="コメントを添えて開発チームに通知しました。修正後にもう一度承認の依頼が届きます。" action={<Button variant="primary" to={paths.portal(project)}>ホームへ戻る</Button>} /></div>
      ) : (
        <>
          {takenByOther ? (
            <Banner tone="info" title="この依頼は、すでに他の承認者が判断しました">
              架空商事株式会社 購買部 の別の担当者が 2026-11-27 09:40 に承認しました。あなたの操作は不要です。
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
              <TextArea label="コメント" help="差し戻す場合は理由が必須です" value={comment} onChange={(v) => { setComment(v); setErr(""); }} rows={3} error={err || undefined} />
              <div className="sticky-actions">
                <Button variant="secondary" icon="arrowLeft" onClick={() => (comment.trim() ? setDecided("returned") : setErr("差し戻す理由を入力してください"))}>差し戻す</Button>
                <Button variant="primary" icon="check" onClick={() => setDecided("approved")}>承認する</Button>
              </div>
            </section>
          ) : (
            <Button to={paths.portal(project)}>ホームへ戻る</Button>
          )}
        </>
      )}
    </PortalLayout>
  );
}
