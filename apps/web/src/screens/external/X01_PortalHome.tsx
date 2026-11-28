// 画面ID: X-01 顧客ポータルの案件ホーム
// 発注企業が案件を開いて「次に決めること」「最新の納入見込み」「前回からの変更」を確認する。
// 表示するのは JV 責任者が公開した項目だけ（契約額・合意した納期・公開済みの進捗）。
import { useScreenState } from "../../lib/router";
import { PROJECT, paths } from "../../lib/paths";
import { daysBetween, formatDate, formatDateTime, relativeTime, yen } from "../../lib/format";
import { projectBySlug } from "../../mocks/core";
import { CURRENT_CUSTOMER_ID, engagementOf } from "../../mocks/engagement";
import { customerRequests, portalPublished } from "../../mocks/external";
import { Banner, Button, CustomerPortalLayout, EmptyState, ErrorState, Icon, Link, RelationshipTag, Skeleton, Tag } from "./deps";
import { DeliverableBadge, RequestKindTag } from "./portalParts";

export function X01PortalHome({ project = PROJECT }: { project?: string }) {
  const state = useScreenState();
  const alliance = state === "業務提携型";
  const slug = alliance ? "member-app-api" : project;
  const userId = alliance ? "u-fujii" : CURRENT_CUSTOMER_ID;
  const p = projectBySlug(slug);
  const eng = engagementOf(slug);
  const pub = portalPublished[slug] ?? portalPublished["order-renewal"];
  const decisions = state === "承認待ちなし" ? [] : pub.decisions;
  const pending = customerRequests.filter((r) => r.project === slug && (r.status === "pending" || r.status === "questioned"));
  const nextDelivery = pub.deliverables.find((d) => d.status !== "done");

  if (state === "読み込み中") return <CustomerPortalLayout project={slug} active="home" userId={userId}><Skeleton variant="card" rows={3} /></CustomerPortalLayout>;
  if (state === "エラー") return <CustomerPortalLayout project={slug} active="home" userId={userId}><ErrorState /></CustomerPortalLayout>;

  if (state === "招待直後（未公開）") {
    return (
      <CustomerPortalLayout project={slug} active="home" userId={userId}>
        <div className="card stack" style={{ ["--gap" as string]: "10px" }}>
          <span className="small muted">サンプルソフト株式会社からの招待</span>
          <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>{p.name}</h1>
          <p>{pub.invite_note}</p>
          <p className="small muted">招待日 {formatDate(pub.invited_at)}。進捗、予定、資料は、受注側の統括責任者が公開した時点でここに表示されます。公開されると、メールでお知らせします。</p>
        </div>
        <div className="card"><EmptyState icon="lock" title="公開された情報はまだありません" description="現在表示できるのは案件名と招待内容だけです。" /></div>
      </CustomerPortalLayout>
    );
  }

  return (
    <CustomerPortalLayout project={slug} active="home" userId={userId}>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="stack" style={{ ["--gap" as string]: "4px" }}>
          <span className="row" style={{ ["--gap" as string]: "8px" }}>{eng ? <RelationshipTag value={eng.relationship} /> : null}<span className="tiny muted">前回の報告 {formatDateTime(pub.last_report)} · 次回の報告予定 {formatDate(pub.next_report)}</span></span>
          <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>案件ホーム</h1>
        </div>
        <Button variant="secondary" icon="plus" to={paths.portalChangeNew(slug)}>変更を申し出る</Button>
      </div>

      {state === "セッション切れ間近" ? (
        <Banner tone="warn" title="あと 3 分でセッションが切れます" action={<Button size="sm">続ける</Button>}>操作がないため、まもなく自動でサインアウトします。入力中の内容は保存されません。</Banner>
      ) : null}
      {state === "他の案件" ? (
        <Banner tone="fail" title="この案件は表示できません">顧客ポータルでは、貴社が当事者の案件のうち、招待された案件だけを表示します。別の案件の担当でもある場合は、その案件の招待メールから参加してください。</Banner>
      ) : null}

      <div className="grid auto-fit">
        <section className="card stack" style={{ ["--gap" as string]: "8px" }} aria-labelledby="cp-next">
          <h2 id="cp-next" className="section-title"><Icon name="flag" size={16} /> 次に決めること</h2>
          {decisions.length ? (
            <ul className="cp-list">
              {decisions.map((d) => (
                <li key={d.id}>
                  {d.request_id ? <Link to={paths.portalRequest(slug, d.request_id)}>{d.title}</Link> : <Link to={paths.portalMaterials(slug)}>{d.title}</Link>}
                  <span className="tiny muted">{d.who} · 期限 {formatDate(d.due)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">貴社で決めることは、いまはありません。</p>
          )}
        </section>
        <section className="card stack" style={{ ["--gap" as string]: "8px" }} aria-labelledby="cp-forecast">
          <h2 id="cp-forecast" className="section-title"><Icon name="rocket" size={16} /> 最新の納入見込み</h2>
          {nextDelivery ? (
            <>
              <span className="strong">{nextDelivery.title}</span>
              <span className="row" style={{ ["--gap" as string]: "8px" }}>
                <Tag square>確約 {formatDate(nextDelivery.committed)}</Tag>
                {nextDelivery.forecast && nextDelivery.forecast !== nextDelivery.committed ? <Tag tone="fail" square>見込み {formatDate(nextDelivery.forecast)}（+{daysBetween(nextDelivery.committed, nextDelivery.forecast)}日）</Tag> : <Tag tone="pass" square>見込みどおり</Tag>}
              </span>
              <span className="tiny muted">最後に確認 {relativeTime(nextDelivery.last_checked_at)}</span>
            </>
          ) : <p className="small muted">予定している納入はありません。</p>}
        </section>
        <section className="card stack" style={{ ["--gap" as string]: "8px" }} aria-labelledby="cp-changes">
          <h2 id="cp-changes" className="section-title"><Icon name="history" size={16} /> 前回からの変更</h2>
          <ul className="cp-list">
            {pub.changes.map((c) => <li key={c.at}><span className="small">{c.text}</span><span className="tiny muted">{formatDateTime(c.at)}</span></li>)}
          </ul>
        </section>
      </div>

      <section className="card stack" aria-labelledby="cp-deliverables">
        <div className="row between">
          <h2 id="cp-deliverables" className="section-title">納入物ごとの状況</h2>
          <Link to={paths.portalSchedule(slug)} className="small">予定とカレンダー購読 →</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>納入物</th><th>状況</th><th>確約日</th><th>見込み</th><th>貴社への影響</th><th>最後に確認</th></tr></thead>
            <tbody>
              {pub.deliverables.map((d) => (
                <tr key={d.id}>
                  <td><div className="strong small">{d.title}</div>{d.changed ? <div className="tiny muted">変更理由: {d.changed}</div> : null}</td>
                  <td><DeliverableBadge status={d.status} /></td>
                  <td className="small">{formatDate(d.committed)}</td>
                  <td className="small">{d.forecast ? formatDate(d.forecast) : "—"}</td>
                  <td className="small">{d.impact}</td>
                  <td className="tiny muted">{formatDateTime(d.last_checked_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tiny muted">「最後に確認」は受注側が実績を確認した日時です。古い情報を完了扱いにしないため、確認していない工程は「進行中」のまま表示します。</p>
      </section>

      <div className="grid auto-fit">
        <section className="card stack" style={{ ["--gap" as string]: "6px" }}>
          <h2 className="section-title">契約</h2>
          <span className="small muted">契約額（税抜・公開済み）</span>
          <span className="strong" style={{ fontSize: "var(--text-lg)" }}>{eng ? yen(eng.contract_amount) : "—"}</span>
          <span className="tiny muted">契約期間 {eng ? `${formatDate(eng.contract_period.start)}〜${formatDate(eng.contract_period.end)}` : "—"}</span>
          <Link to={paths.portalContracts(slug)} className="small">契約・知的資産を開く →</Link>
        </section>
        <section className="card stack" style={{ ["--gap" as string]: "6px" }}>
          <h2 className="section-title">貴社の回答待ちの申請</h2>
          {pending.length ? pending.map((r) => (
            <Link key={r.id} to={paths.portalRequest(slug, r.id)} className="row" style={{ ["--gap" as string]: "8px" }}><RequestKindTag kind={r.kind} /><span className="small truncate">{r.title}</span></Link>
          )) : <span className="small muted">ありません</span>}
          <Link to={paths.portalRequests(slug)} className="small">申請・承認を開く →</Link>
        </section>
        {alliance ? (
          <section className="card stack" style={{ ["--gap" as string]: "6px" }}>
            <h2 className="section-title">共同事業の収支</h2>
            <span className="small">提携契約で合意した共同費目の予算・実績・各社の負担額を確認できます。</span>
            <Link to={paths.portalJoint(slug)} className="small">共同事業の収支を開く →</Link>
          </section>
        ) : null}
      </div>

      <p className="tiny muted row" style={{ ["--gap" as string]: "6px" }}>
        <Icon name="lock" size={12} />表示されるのは、受注側の統括責任者が貴社に公開した項目と資料の版だけです。受注側の社内の情報は表示されません。操作は記録され、30 分操作がないと自動でサインアウトします。
      </p>
    </CustomerPortalLayout>
  );
}
