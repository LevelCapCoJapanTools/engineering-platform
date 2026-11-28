// 契約と知的資産の画面群で共有するローカル部品
import "./contracts.css";
import type { ReactNode } from "react";
import { CONTRACT_STATUS, IP_DISPOSITION } from "../../lib/vocab";
import { ORG, PROJECT } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { userById } from "../../mocks/core";
import type { Clause, Contract, IpShare, SignEvent } from "../../mocks/contracts";
import { AudienceTag, Banner, ExternalActor, Icon, StatusBadge, Tag } from "../../ui";

export const routeOrg = (p: Record<string, string>) => p.org ?? ORG;
export const routeProject = (p: Record<string, string>) => p.project ?? p.pr ?? PROJECT;

export function ContractStatusBadge({ c }: { c: Contract }) {
  return <StatusBadge vocab={CONTRACT_STATUS[c.status]} size="sm" />;
}

export function PersonName({ id }: { id?: string }) {
  const u = userById(id);
  return <span>{u?.name ?? "—"}</span>;
}

const CLAUSE_STATE: Record<Clause["state"], { label: string; tone: "pass" | "warn" | "special" | "neutral" }> = {
  agreed: { label: "合意済み", tone: "pass" },
  open: { label: "協議中", tone: "warn" },
  changed: { label: "改訂・再確認が必要", tone: "special" },
  unchanged: { label: "変更なし", tone: "neutral" },
};

/**
 * 条項の新旧と協議。viewerCompany のコメントのうち社内メモ（internal）は自社にだけ出し、
 * 相手の社内メモはどの画面にも出さない。
 */
export function ClauseList({ clauses, viewerCompany, showOnlyChanged }: { clauses: Clause[]; viewerCompany: string; showOnlyChanged?: boolean }) {
  const rows = showOnlyChanged ? clauses.filter((c) => c.state !== "unchanged") : clauses;
  return (
    <div className="stack ct-clauses">
      {rows.map((c) => {
        const st = CLAUSE_STATE[c.state];
        const comments = c.comments.filter((m) => m.audience === "counterparty" || m.company === viewerCompany);
        return (
          <article key={c.id} className="card ct-clause">
            <div className="row between">
              <strong>{c.no} {c.title}</strong>
              <span className="row" style={{ ["--gap" as string]: "6px" }}>
                <Tag tone={st.tone} square>{st.label}</Tag>
                {c.owner_id ? <span className="tiny muted">回答担当 <PersonName id={c.owner_id} /></span> : null}
              </span>
            </div>
            {c.before !== undefined && c.state !== "unchanged" ? (
              <div className="ct-diff">
                <div><span className="tiny muted">改訂前</span><p className="ct-before">{c.before}</p></div>
                <div><span className="tiny muted">改訂後</span><p className="ct-after">{c.after}</p></div>
              </div>
            ) : (
              <p className="small">{c.after}</p>
            )}
            {c.prior_review && c.state === "changed" ? (
              <div className="ct-prior">
                <Icon name="info" size={13} />
                <span className="small">改訂前の確認結果は引き継ぎません。{c.prior_review}</span>
              </div>
            ) : null}
            {comments.length ? (
              <ul className="ct-comments">
                {comments.map((m) => (
                  <li key={m.id}>
                    <div className="row" style={{ ["--gap" as string]: "6px" }}>
                      <ExternalActor userId={m.author_id} />
                      <span className="tiny muted">{m.company}</span>
                      <AudienceTag value={m.audience === "internal" ? "internal" : "customer"} />
                      <span className="tiny muted">{formatDateTime(m.at)}</span>
                    </div>
                    <p className="small">{m.body}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

const SIGNER_STATUS: Record<string, { label: string; tone: "pass" | "warn" | "fail" | "info" | "neutral" }> = {
  pending: { label: "送付前", tone: "neutral" },
  sent: { label: "送付済み", tone: "info" },
  viewed: { label: "開封済み", tone: "info" },
  signed: { label: "署名済み", tone: "pass" },
  declined: { label: "辞退", tone: "fail" },
};

/** 業務上の確認と締結（署名）を別々に表示する */
export function ReviewAndSign({ c, viewerCompany }: { c: Contract; viewerCompany?: string }) {
  return (
    <div className="ct-two">
      <section className="stack" style={{ ["--gap" as string]: "6px" }}>
        <h3 className="ct-h">業務上の確認（締結ではありません）</h3>
        {c.reviews.map((r) => (
          <div key={`${r.company}-${r.reviewer_id}`} className="row between ct-line">
            <span className="row" style={{ ["--gap" as string]: "6px" }}>
              <ExternalActor userId={r.reviewer_id} />
              <span className="tiny muted">{r.company}</span>
            </span>
            <span className="row" style={{ ["--gap" as string]: "6px" }}>
              <Tag square>文書 v{r.doc_version}</Tag>
              <Tag tone={r.status === "done" ? "pass" : "warn"} square>{r.status === "done" ? "確認済み" : "確認待ち"}</Tag>
            </span>
          </div>
        ))}
      </section>
      <section className="stack" style={{ ["--gap" as string]: "6px" }}>
        <h3 className="ct-h">締結（電子契約サービスで署名）</h3>
        {c.signers.map((s) => {
          const st = SIGNER_STATUS[s.status];
          return (
            <div key={s.user_id} className="row between ct-line">
              <span className="row" style={{ ["--gap" as string]: "6px" }}>
                <ExternalActor userId={s.user_id} />
                <span className="tiny muted">{s.company}{viewerCompany && s.company === viewerCompany ? "（自社）" : ""}</span>
              </span>
              <span className="row" style={{ ["--gap" as string]: "6px" }}>
                {s.at ? <span className="tiny muted">{formatDateTime(s.at)}</span> : null}
                <Tag tone={st.tone} square>{st.label}</Tag>
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

const EVENT_LABEL: Record<SignEvent["kind"], string> = {
  sent: "送付",
  viewed: "開封",
  signed: "署名",
  declined: "署名辞退",
  duplicate: "重複通知",
  mismatch: "版の不一致",
  completed: "締結完了",
};

/** 電子契約サービスから取り込んだ署名の記録。反映しなかったものも理由付きで残す */
export function SignEventList({ events }: { events: SignEvent[] }) {
  if (!events.length) return <p className="small muted">取り込んだ署名の記録はありません。</p>;
  return (
    <div className="table-wrap">
      <table className="table compact">
        <thead><tr><th>受信日時</th><th>内容</th><th>文書の版</th><th>反映</th></tr></thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td className="small">{formatDateTime(e.at)}</td>
              <td className="small"><strong>{EVENT_LABEL[e.kind]}</strong> {e.detail}</td>
              <td>{e.doc_version ? <Tag square>v{e.doc_version}</Tag> : "—"}</td>
              <td>{e.applied ? <Tag tone="pass" square icon="check">反映</Tag> : <Tag square icon="minus">反映しない</Tag>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 持分の内訳。全持分を登録する合意で合計が100%でなければ不備を示す */
export function ShareBar({ shares, fullAllocation }: { shares: IpShare[]; fullAllocation: boolean }) {
  const total = shares.reduce((n, s) => n + s.ratio, 0);
  const bad = fullAllocation && total !== 100;
  if (!shares.length) return <span className="small muted">持分の登録なし（第三者の権利）</span>;
  return (
    <div className="stack" style={{ ["--gap" as string]: "6px" }}>
      <div className="ct-share" role="img" aria-label={shares.map((s) => `${s.holder} ${s.ratio}%`).join("、")}>
        {shares.map((s, i) => <span key={s.holder} className={`ct-share-seg s${i}`} style={{ width: `${s.ratio}%` }} />)}
      </div>
      <div className="row" style={{ ["--gap" as string]: "10px" }}>
        {shares.map((s, i) => <span key={s.holder} className="small"><span className={`ct-dot s${i}`} />{s.holder} {s.ratio}%</span>)}
        <span className={bad ? "small ct-bad" : "small muted"}>合計 {total}%</span>
      </div>
      {bad ? <Banner tone="fail" title="持分の合計が100%になっていません">全持分を登録する合意です。当事者ごとの割合を、署名済み契約の該当条項に合わせて登録してください。</Banner> : null}
    </div>
  );
}

export function DispositionTag({ value }: { value: keyof typeof IP_DISPOSITION }) {
  return <StatusBadge vocab={IP_DISPOSITION[value]} size="sm" icon={false} />;
}

export function LegalNote({ children }: { children?: ReactNode }) {
  return (
    <p className="tiny muted ct-legal">
      <Icon name="info" size={12} />
      {children ?? "本サービスは各社の権限者が合意した内容を記録します。契約の内容についての法的な助言は行いません。"}
    </p>
  );
}
