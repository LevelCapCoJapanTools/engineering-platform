// 画面ID: X-01 顧客ポータルのホーム
import { useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { PHASES } from "../../lib/types";
import { RELEASE_STATUS } from "../../lib/vocab";
import { formatDate } from "../../lib/format";
import { projectBySlug, releases } from "../../mocks/core";
import { customerApprovals } from "../../mocks/external";
import { ApprovalRequestCard, Button, EmptyState, ErrorState, Icon, Link, PhaseBand, PortalLayout, Skeleton, StatusBadge } from "./deps";

export function X01PortalHome({ project = PROJECT }: { project?: string }) {
  const state = useScreenState();
  const p = projectBySlug(project);
  const approvals = state === "承認待ちなし" ? [] : customerApprovals;
  const targetFor = (id: string, kind: string, targetId: string) => (kind === "acceptance" ? paths.portalAcceptance(project, targetId) : paths.portalApproval(project, id));

  return (
    <PortalLayout project={project}>
      {state === "読み込み中" ? (
        <Skeleton variant="card" rows={3} />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <div className="row between">
            <div>
              <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>こんにちは、中村 拓也 さん</h1>
              <p className="small muted">{p.name} の承認と受入をここで行えます。</p>
            </div>
            <Button variant="secondary" icon="plus" to={paths.portalChangeNew(project)}>変更要求を起票</Button>
          </div>

          <section className="stack" style={{ ["--gap" as string]: "10px" }} aria-labelledby="pending-title">
            <div className="row between">
              <h2 id="pending-title" className="section-title">あなたの承認待ち</h2>
              <span className={approvals.length ? "badge tone-warn" : "badge tone-pass"}>{approvals.length}件</span>
            </div>
            {approvals.length ? (
              approvals.map((a) => <ApprovalRequestCard key={a.id} req={a} to={targetFor(a.id, a.kind, a.target_id)} />)
            ) : (
              <div className="card"><EmptyState icon="checkCircle" title="承認待ちはありません" description="新しい依頼が届くと、メールでお知らせします。" /></div>
            )}
          </section>

          <section className="card stack" aria-labelledby="progress-title">
            <div className="row between">
              <h2 id="progress-title" className="section-title">プロジェクトの進捗</h2>
              <span className="small muted">現在のフェーズ: {PHASES.find((ph) => ph.key === p.phase)?.label}</span>
            </div>
            <PhaseBand phases={PHASES} current={p.phase} />
            <div className="grid cols-2">
              <div className="stat">
                <span className="stat-label"><Icon name="rocket" size={14} />次のリリース</span>
                <span className="strong">{p.next_release ? `${p.next_release.version}（${formatDate(p.next_release.date)} 予定）` : "未定"}</span>
                <span className="stat-delta">PDF 出力と基幹連携の再送</span>
              </div>
              <div className="stat">
                <span className="stat-label"><Icon name="list" size={14} />承認済みの要求</span>
                <span className="strong">8件 / 全12件</span>
                <span className="stat-delta">承認待ち 2件・検討中 2件</span>
              </div>
            </div>
          </section>

          <section className="stack" style={{ ["--gap" as string]: "10px" }} aria-labelledby="release-title">
            <h2 id="release-title" className="section-title">リリース</h2>
            <div className="card flush">
              {releases.map((r, i) => (
                <div key={r.id} className="row between" style={{ padding: "12px 16px", borderTop: i ? "1px solid var(--border)" : undefined }}>
                  <div className="stack" style={{ ["--gap" as string]: "2px", minWidth: 0 }}>
                    <span className="row" style={{ ["--gap" as string]: "8px" }}><span className="mono strong">{r.version}</span><span className="truncate">{r.title}</span></span>
                    <span className="tiny muted">{r.released_at ? `リリース ${formatDate(r.released_at)}` : `予定 ${formatDate(r.planned_at)}`}</span>
                  </div>
                  <span className="row" style={{ ["--gap" as string]: "8px" }}>
                    <StatusBadge vocab={r.acceptance === "pending" ? { label: "受入待ち", tone: "warn" } : RELEASE_STATUS[r.status]} size="sm" />
                    {r.acceptance === "pending" ? <Link to={paths.portalAcceptance(project, r.id)} className="btn primary sm">受入へ</Link> : null}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <p className="tiny muted" style={{ textAlign: "center" }}>
            表示されているのは、あなたが参加しているプロジェクトの情報のみです。
          </p>
        </>
      )}
    </PortalLayout>
  );
}
