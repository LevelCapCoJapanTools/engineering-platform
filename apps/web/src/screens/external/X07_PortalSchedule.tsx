// 画面ID: X-07 顧客ポータル: 予定と購読
// 公開された予定（合意納期＝確約、納入見込み、レビュー、受入期限）だけを表示し、貴社のカレンダーで購読できる。
// 見込みだけが延期された場合も、確約日はそのまま表示する。受注側の社内会議や非公開の予定は含めない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { PROJECT } from "../../lib/paths";
import { formatDate, formatDateTime } from "../../lib/format";
import type { StatusVocab } from "../../lib/vocab";
import { portalScheduleItems } from "../../mocks/external";
import { Banner, Button, ConfirmDialog, CustomerPortalLayout, EmptyState, ErrorState, Icon, Skeleton, StatusBadge, useToast } from "./deps";

const KIND: Record<"committed" | "forecast" | "review" | "acceptanceDue", StatusVocab> = {
  committed: { label: "確約（合意納期）", tone: "info" },
  forecast: { label: "納入見込み", tone: "special" },
  review: { label: "レビュー", tone: "neutral" },
  acceptanceDue: { label: "受入の回答期限", tone: "warn" },
};

export function X07PortalSchedule({ project = PROJECT }: { project?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const alliance = state === "業務提携型";
  const slug = alliance ? "member-app-api" : project;
  const [subscribed, setSubscribed] = useState(state === "購読中");
  const [confirmStop, setConfirmStop] = useState(false);
  const items = state === "予定なし" ? [] : portalScheduleItems.filter((i) => i.project === slug).sort((a, b) => a.date.localeCompare(b.date));
  const months = [...new Set(items.map((i) => i.date.slice(0, 7)))];

  return (
    <CustomerPortalLayout project={slug} active="schedule" userId={alliance ? "u-fujii" : undefined}>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>予定</h1>
        <p className="small muted">受注側が貴社に公開した予定だけを表示します。時刻は日本時間です。</p>
      </div>

      {state === "読み込み中" ? <Skeleton rows={4} /> : state === "エラー" ? <ErrorState /> : (
        <>
          {!alliance && items.some((i) => i.kind === "forecast") ? (
            <Banner tone="warn" title="v1.4.0 の納入見込みが変わりました">見込みは 12/17 に変わりましたが、合意した納期（確約日）は 12/10 のままです。確約日を変える場合は、日程の申請として貴社の承認をお願いします。</Banner>
          ) : null}

          <section className="card stack" aria-labelledby="cp-sub">
            <div className="row between">
              <h2 id="cp-sub" className="section-title"><Icon name="calendar" size={16} /> 貴社のカレンダーで購読</h2>
              {subscribed ? <StatusBadge vocab={{ label: "購読中", tone: "pass" }} size="sm" /> : <StatusBadge vocab={{ label: "未購読", tone: "neutral" }} size="sm" />}
            </div>
            {subscribed ? (
              <>
                <p className="small">次の URL を Google カレンダーや Outlook の「URL で追加」に登録してください。予定が変わると購読先も同じ予定が更新されます。</p>
                <div className="row"><code className="mono small" style={{ overflowWrap: "anywhere" }}>https://calendar.product.example/ics/••••••••••••3f9a.ics</code><Button size="sm" icon="copy" onClick={() => toast({ kind: "success", message: "URL をコピーしました" })}>コピー</Button></div>
                <p className="tiny muted">この URL を知っている人は予定を見られます。漏れた場合は停止して新しい URL を発行してください。購読の発行・停止は記録されます。</p>
                <div className="row"><Button variant="secondary" icon="xCircle" onClick={() => setConfirmStop(true)}>購読を停止</Button></div>
              </>
            ) : (
              <>
                <p className="small">確約日、納入見込み、レビュー、受入の回答期限を、貴社のカレンダーで自動的に受け取れます。含まれるのは、この画面に表示されている予定だけです。</p>
                <div className="row"><Button variant="primary" icon="link" onClick={() => { setSubscribed(true); toast({ kind: "success", message: "購読用の URL を発行しました" }); }}>購読用の URL を発行</Button></div>
                {state === "購読を停止" ? <p className="tiny muted">以前の URL は停止済みです。停止した URL からは新しい予定を取得できません。</p> : null}
              </>
            )}
          </section>

          {items.length === 0 ? (
            <div className="card"><EmptyState icon="calendar" title="公開された予定はありません" description="受注側が予定を公開すると、ここに表示されます。" /></div>
          ) : months.map((m) => (
            <section key={m} className="card stack" aria-label={`${m} の予定`}>
              <h2 className="section-title">{Number(m.slice(0, 4))}年{Number(m.slice(5, 7))}月</h2>
              <ul className="cp-list">
                {items.filter((i) => i.date.startsWith(m)).map((i) => (
                  <li key={i.id} className="cp-sched">
                    <span className="strong small" style={{ minWidth: 92 }}>{formatDate(i.date)}{i.time ? ` ${i.time}` : ""}</span>
                    <StatusBadge vocab={KIND[i.kind]} size="sm" icon={false} />
                    <span className="stack grow" style={{ ["--gap" as string]: "2px", minWidth: 0 }}>
                      <span className="small">{i.title}</span>
                      {i.note ? <span className="tiny muted">{i.note}</span> : null}
                    </span>
                    <span className="tiny muted">更新 {formatDateTime(i.updated_at)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      <ConfirmDialog
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        onConfirm={() => { setConfirmStop(false); setSubscribed(false); toast({ kind: "success", message: "購読を停止しました" }); }}
        title="購読を停止しますか？"
        message="この URL からは新しい予定を取得できなくなります。すでに貴社のカレンダーに取り込まれた予定は、各カレンダーから削除してください。"
        confirmLabel="停止する"
        danger
      />
    </CustomerPortalLayout>
  );
}
