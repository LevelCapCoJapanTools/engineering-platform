// 画面ID: F-02 自分への依頼
import "./freelancer.css";
import { useState } from "react";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate, yen } from "../../lib/format";
import { ORDER_STATUS } from "../../lib/vocab";
import { latestTerms } from "../../mocks/engagement";
import { BUCKET_LABEL, bucketOf, myOrders } from "../../mocks/freelancer";
import type { OrderBucket } from "../../mocks/freelancer";
import { EmptyState, ErrorState, FreelancerLayout, freelancerClients, Icon, NextActor, SearchBox, Skeleton, StatusBadge } from "../../ui";
import { useClient } from "./parts";

const ORDER: OrderBucket[] = ["reply", "working", "waiting", "submitted"];
const BUCKET_ICON = { reply: "alertCircle", working: "wrench", waiting: "hourglass", submitted: "checkCircle" } as const;

/** お知らせ（依頼元ごと） */
const NOTICES: { client: string; text: string; to: string }[] = [
  { client: "サンプルソフト株式会社", text: "ORD-0101 の検収が始まりました（検収予定日 12/5）", to: paths.freelancerResult("ORD-0101") },
  { client: "サンプルソフト株式会社", text: "質問 INQ-0031 の回答が確定しました", to: paths.freelancerQuestions() },
  { client: "デモラボ合同会社", text: "ORD-0201 は発注企業の回答待ちです。窓口が確認しています", to: paths.freelancerOrder("ORD-0201") },
];

export function F02Home() {
  const state = useScreenState();
  const clients = freelancerClients();
  const [client, setClient] = useClient(state === "依頼元を切替" ? clients[1] : undefined);
  const [q, setQ] = useState("");
  const list = state === "初回0件" ? [] : myOrders(client).filter((o) => `${o.id} ${o.title}`.toLowerCase().includes(q.toLowerCase()));
  const notices = NOTICES.filter((n) => n.client === client);

  return (
    <FreelancerLayout active="orders" client={client} onClientChange={setClient}>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>自分への依頼</h1>
        <p className="small muted">{client} からの依頼だけを表示しています。ほかの依頼元は上の「依頼元」で切り替えます。</p>
      </div>

      {state === "読み込み中" ? (
        <Skeleton variant="card" rows={3} />
      ) : state === "読み込み失敗" ? (
        <ErrorState title="依頼を読み込めませんでした" description="通信が不安定な可能性があります。入力中の内容は失われていません。もう一度読み込んでください。" onRetry={() => undefined} />
      ) : state === "初回0件" ? (
        <div className="card">
          <EmptyState icon="inbox" title="まだ依頼はありません" description="依頼元から依頼が届くと、ここに表示され、メールでもお知らせします。招待メールのリンクから始めた場合は、本人確認が済んでいるかご確認ください。" />
        </div>
      ) : (
        <>
          <SearchBox placeholder={`${client} の依頼を検索`} value={q} onChange={setQ} />
          {notices.length ? (
            <div className="card tight stack" style={{ ["--gap" as string]: "6px" }}>
              <span className="tiny muted">お知らせ（{client}）</span>
              {notices.map((n) => (
                <Link key={n.text} to={n.to} className="small row" style={{ ["--gap" as string]: "6px" }}>
                  <Icon name="bell" size={13} />{n.text}
                </Link>
              ))}
            </div>
          ) : null}
          {list.length === 0 ? (
            <div className="card"><EmptyState variant="filtered" icon="search" title="条件に合う依頼はありません" description="検索語を変えてお試しください。" /></div>
          ) : (
            ORDER.filter((b) => list.some((o) => bucketOf(o) === b)).map((b) => {
              const items = list.filter((o) => bucketOf(o) === b);
              return (
                <section key={b} className="fx-bucket" aria-label={BUCKET_LABEL[b]}>
                  <h2><Icon name={BUCKET_ICON[b]} size={15} />{BUCKET_LABEL[b]}（{items.length}）</h2>
                  <div className="grid auto-fit" style={{ ["--gap" as string]: "10px" }}>
                    {items.map((o) => {
                      const t = latestTerms(o);
                      const to = b === "submitted" ? paths.freelancerResult(o.id) : b === "working" ? paths.freelancerSubmit(o.id) : paths.freelancerOrder(o.id);
                      return (
                        <Link key={o.id} to={to} className="fx-card">
                          <div className="row between" style={{ ["--gap" as string]: "6px" }}>
                            <span className="mono tiny muted">{o.id}</span>
                            <StatusBadge vocab={ORDER_STATUS[o.status]} size="sm" />
                          </div>
                          <span className="fx-card-title">{o.title}</span>
                          <span className="small muted">{o.client_company} · 納期 {formatDate(t.due)} · <span className="fx-money">{yen(t.fee)}</span></span>
                          <NextActor actor={o.next_actor} action={o.next_action} due={o.next_due} />
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
          <p className="tiny muted">「先方の回答待ち」の依頼は、窓口が発注企業に確認しています。あなたが連絡を追いかける必要はありません。</p>
        </>
      )}
    </FreelancerLayout>
  );
}
