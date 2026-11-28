// 第5章 5.5 業務部品
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import type { IconName } from "./icons";
import { ActorLabel, Avatar, cx, DeadlineIndicator, HashDisplay, IdLink, StatusBadge, Tag, Timestamp, UserChip } from "./display";
import { Button, Combobox, Select, TextArea } from "./inputs";
import { Link } from "../lib/router";
import { AI_STATUS, APPROVAL_STATUS, EVIDENCE_STATUS, EXCEPTION_STATUS } from "../lib/vocab";
import type { Role } from "../lib/vocab";
import type { AiFinding, ApprovalRequest, Approver, Evidence, ExceptionRecord, User } from "../lib/types";
import { AI_FINDING_KIND, APPROVAL_KIND, GATE_LABELS } from "../lib/types";
import { daysUntil, formatDate } from "../lib/format";
import { userById, users } from "../mocks/core";

/** SoDNotice: 操作できない理由と、承認できる人の一覧 */
export function SoDNotice({ reason, eligible }: { reason: ReactNode; eligible?: User[] }) {
  return (
    <div className="sod" role="note">
      <Icon name="shieldX" />
      <div className="stack" style={{ ["--gap" as string]: "6px" }}>
        <span>{reason}</span>
        {eligible?.length ? (
          <span className="row" style={{ ["--gap" as string]: "6px" }}>
            <span className="tiny muted">操作できる人:</span>
            {eligible.map((u) => <UserChip key={u.id} user={u} />)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** ApprovalPanel: 必要な承認者の状態と、自分が承認者なら操作 */
export function ApprovalPanel({ approvers, canDecide, blockedReason, eligible, onDecide, title = "承認" }: { approvers: Approver[]; canDecide?: boolean; blockedReason?: ReactNode; eligible?: User[]; onDecide?: (decision: "approved" | "returned", comment: string) => void; title?: string }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const done = approvers.filter((a) => a.status === "approved").length;
  const overall = approvers.some((a) => a.status === "returned") ? APPROVAL_STATUS.returned : done === approvers.length && approvers.length > 0 ? APPROVAL_STATUS.approved : APPROVAL_STATUS.pending;
  return (
    <div className="approval">
      <div className="row between">
        <span className="strong">{title}</span>
        <span className="row" style={{ ["--gap" as string]: "6px" }}>
          <span className="tiny muted">{done}/{approvers.length}</span>
          <StatusBadge vocab={overall} size="sm" />
        </span>
      </div>
      {approvers.map((a, i) => {
        const u = userById(a.user_id);
        return (
          <div key={i} className="approver">
            <div className="stack" style={{ ["--gap" as string]: "4px", minWidth: 0 }}>
              <span className="tiny muted">{a.role}</span>
              {u ? <UserChip user={u} showRole={false} plain /> : <span className="small muted">担当者を割り当てていません</span>}
            </div>
            <div className="stack" style={{ ["--gap" as string]: "4px", alignItems: "flex-end" }}>
              <StatusBadge vocab={APPROVAL_STATUS[a.status]} size="sm" />
              {a.decided_at ? <span className="tiny muted"><Timestamp at={a.decided_at} /></span> : null}
            </div>
            {a.comment ? <div className="comment">{a.comment}</div> : null}
          </div>
        );
      })}
      {canDecide ? (
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          <TextArea label="コメント" help="差戻しの場合は必須" value={comment} onChange={(v) => { setComment(v); setError(""); }} rows={3} error={error || undefined} />
          <div className="row">
            <Button variant="primary" icon="check" onClick={() => onDecide?.("approved", comment)}>承認する</Button>
            <Button variant="secondary" icon="arrowLeft" onClick={() => (comment.trim() ? onDecide?.("returned", comment) : setError("差戻しの理由を入力してください"))}>差し戻す</Button>
          </div>
        </div>
      ) : blockedReason ? (
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          <div className="row">
            <Button variant="primary" icon="check" disabled disabledReason={typeof blockedReason === "string" ? blockedReason : "この操作はできません"}>承認する</Button>
            <Button variant="secondary" disabled>差し戻す</Button>
          </div>
          <SoDNotice reason={blockedReason} eligible={eligible} />
        </div>
      ) : null}
    </div>
  );
}

/** ApprovalRequestCard: 承認待ちの1件 */
export function ApprovalRequestCard({ req, onOpen, to }: { req: ApprovalRequest; onOpen?: () => void; to?: string }) {
  const d = daysUntil(req.due_at);
  const requester = userById(req.requester_id);
  const body = (
    <>
      <div className="row between">
        <span className="row" style={{ ["--gap" as string]: "6px" }}>
          <Tag tone="primary" square>{APPROVAL_KIND[req.kind]}</Tag>
          <span className="id-link">{req.target_id}</span>
        </span>
        <DeadlineIndicator date={req.due_at} compact />
      </div>
      <span className="strong">{req.title}</span>
      <div className="row between small muted">
        <span className="row" style={{ ["--gap" as string]: "6px" }}>
          <Icon name="folder" size={13} />
          {req.project_name}
        </span>
        <span className="row" style={{ ["--gap" as string]: "6px" }}>
          {requester ? <Avatar user={requester} /> : null}
          {requester?.name} · <Timestamp at={req.requested_at} />
        </span>
      </div>
    </>
  );
  const cls = cx("req-card", d < 0 && "overdue", d >= 0 && d <= 1 && "soon");
  if (to) return <Link to={to} className={cls} style={{ textDecoration: "none", color: "inherit" }}>{body}</Link>;
  return (
    <button type="button" className={cls} onClick={onOpen}>
      {body}
    </button>
  );
}

/** AIFindingCard: AIの所見1件と、採用・却下（却下理由は必須） */
export function AIFindingCard({ finding, onDecide, active, onFocus, compact }: { finding: AiFinding; onDecide?: (id: string, decision: "adopted" | "rejected", reason?: string) => void; active?: boolean; onFocus?: () => void; compact?: boolean }) {
  const [status, setStatus] = useState(finding.status);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(finding.reject_reason ?? "");
  const [err, setErr] = useState("");
  const decider = userById(finding.decided_by);
  const sev = finding.severity === "high" ? { label: "重要度: 高", tone: "fail" as const } : finding.severity === "medium" ? { label: "重要度: 中", tone: "warn" as const } : { label: "重要度: 低", tone: "neutral" as const };
  const parts = finding.excerpt.split(finding.highlight);
  return (
    <article className={cx("ai-card", status === "adopted" && "adopted", status === "rejected" && "rejected", finding.stale && "stale", active && "active")} onClick={onFocus}>
      <div className="row between">
        <span className="row" style={{ ["--gap" as string]: "6px" }}>
          <ActorLabel kind="ai" size="sm" />
          <Tag tone="special" square>{AI_FINDING_KIND[finding.kind]}</Tag>
          <Tag tone={sev.tone} square>{sev.label}</Tag>
          <span className="tiny muted">確信度 {Math.round(finding.confidence * 100)}%</span>
        </span>
        <span className="row" style={{ ["--gap" as string]: "6px" }}>
          {finding.stale ? <Tag tone="warn" icon="history">対象が更新され古い所見</Tag> : null}
          <StatusBadge vocab={AI_STATUS[status]} size="sm" />
        </span>
      </div>
      <div className="excerpt">
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <mark>{finding.highlight}</mark>
            {parts.slice(1).join(finding.highlight)}
          </>
        ) : (
          finding.excerpt
        )}
      </div>
      <div style={{ fontSize: "var(--text-sm)" }}>{finding.explanation}</div>
      {finding.suggestion && !compact ? (
        <div className="suggest">
          <span className="tiny" style={{ fontWeight: 700, color: "var(--tone-special)" }}>提案</span>
          <div>{finding.suggestion}</div>
        </div>
      ) : null}
      {status === "rejected" && (reason || finding.reject_reason) ? (
        <div className="small muted">却下理由: {reason || finding.reject_reason}{decider ? `（${decider.name}）` : ""}</div>
      ) : null}
      {status === "adopted" && decider ? <div className="small muted">{decider.name} が採用しました</div> : null}
      {rejecting ? (
        <div className="stack" style={{ ["--gap" as string]: "8px" }} onClick={(e) => e.stopPropagation()}>
          <TextArea label="却下の理由" required value={reason} onChange={(v) => { setReason(v); setErr(""); }} rows={2} error={err || undefined} />
          <div className="row">
            <Button size="sm" variant="primary" onClick={() => { if (!reason.trim()) { setErr("却下の理由を入力してください"); return; } setStatus("rejected"); setRejecting(false); onDecide?.(finding.id, "rejected", reason); }}>却下を確定</Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>キャンセル</Button>
          </div>
        </div>
      ) : status === "unconfirmed" ? (
        <div className="row" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="secondary" icon="check" onClick={() => { setStatus("adopted"); onDecide?.(finding.id, "adopted"); }}>採用</Button>
          <Button size="sm" variant="ghost" icon="x" onClick={() => setRejecting(true)}>却下</Button>
        </div>
      ) : (
        <div className="row" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" icon="history" onClick={() => setStatus("unconfirmed")}>判断を取り消す</Button>
        </div>
      )}
      <div className="meta">モデル: {finding.model} · テンプレート: {finding.template_version} · <Timestamp at={finding.created_at} /></div>
    </article>
  );
}

/** AIDraftBanner: 人が保存するまで表示する */
export function AIDraftBanner() {
  return (
    <div className="ai-banner" role="status">
      <Icon name="sparkles" />
      この内容はAIの下書きです。確認して編集してください。
    </div>
  );
}

/** AIの所見の見出し。判定に使われないことを明記する */
export function AISectionHead({ count, note = "判定には使われていません" }: { count?: number; note?: string }) {
  return (
    <div className="ai-section-head">
      <Icon name="sparkles" size={14} />
      AIの参考所見{count !== undefined ? `（${count}件）` : ""}
      <span style={{ fontWeight: 500, marginLeft: "auto" }}>{note}</span>
    </div>
  );
}

/** AIUnavailableNotice */
export function AIUnavailableNotice({ reason }: { reason: "orgDisabled" | "dataClass" | "outage" }) {
  const text = {
    orgDisabled: { title: "AI機能は組織の設定で無効になっています", body: "組織管理者が「AIとデータ分類」の設定で有効にできます。" },
    dataClass: { title: "このデータ分類では AI 機能を使えません", body: "プロジェクトのデータ分類が Highly Confidential のため、外部のモデルへ送信しません。閉域実行（Enterprise）で利用できます。" },
    outage: { title: "AI機能に一時的な障害が発生しています", body: "復旧後に再実行してください。ゲートの判定には影響しません。" },
  }[reason];
  return (
    <div className="banner tone-neutral">
      <Icon name={reason === "outage" ? "alertCircle" : "eyeOff"} />
      <div className="banner-body">
        <div className="banner-title">{text.title}</div>
        <div>{text.body}</div>
      </div>
    </div>
  );
}

/** TraceLinkEditor: リンクの追加・削除、AI候補の昇格 */
export type TraceLink = { id: string; title: string; kind: string; relation: string; ai?: boolean; confidence?: number };
export function TraceLinkEditor({ links: initial, candidates, readOnly, onChange }: { links: TraceLink[]; candidates: { id: string; title: string; kind: string }[]; readOnly?: boolean; onChange?: (links: TraceLink[]) => void }) {
  const [links, setLinks] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [target, setTarget] = useState<string[]>([]);
  const [relation, setRelation] = useState("implements");
  const [removing, setRemoving] = useState<string | null>(null);
  const relLabel: Record<string, string> = { implements: "実装する", verifies: "検証する", refines: "詳細化する", derives: "由来する" };
  const update = (next: TraceLink[]) => {
    setLinks(next);
    onChange?.(next);
  };
  const confirmed = links.filter((l) => !l.ai);
  const ai = links.filter((l) => l.ai);
  const row = (l: TraceLink) => (
    <div key={l.id} className="row between" style={{ padding: "8px 10px", border: `1px ${l.ai ? "dashed var(--tone-special-border)" : "solid var(--border)"}`, borderRadius: 8 }}>
      <span className="row" style={{ ["--gap" as string]: "8px", minWidth: 0 }}>
        {l.ai ? <ActorLabel kind="ai" iconOnly size="sm" /> : <Icon name="link" size={14} className="muted" />}
        <Tag square>{l.kind}</Tag>
        <span className="id-link" style={{ color: "var(--primary)" }}>{l.id}</span>
        <span className="truncate small">{l.title}</span>
        <span className="tiny muted">{relLabel[l.relation] ?? l.relation}</span>
        {l.ai && l.confidence ? <span className="tiny muted">確信度 {Math.round(l.confidence * 100)}%</span> : null}
      </span>
      {readOnly ? null : l.ai ? (
        <span className="row" style={{ ["--gap" as string]: "4px" }}>
          <Button size="sm" variant="secondary" icon="check" onClick={() => update(links.map((x) => (x.id === l.id ? { ...x, ai: false } : x)))}>確定リンクにする</Button>
          <Button size="sm" variant="ghost" icon="x" iconOnly label="候補を却下" onClick={() => update(links.filter((x) => x.id !== l.id))} />
        </span>
      ) : removing === l.id ? (
        <span className="row" style={{ ["--gap" as string]: "4px" }}>
          <span className="tiny">削除しますか？</span>
          <Button size="sm" variant="danger" onClick={() => { update(links.filter((x) => x.id !== l.id)); setRemoving(null); }}>削除</Button>
          <Button size="sm" variant="ghost" onClick={() => setRemoving(null)}>やめる</Button>
        </span>
      ) : (
        <Button size="sm" variant="ghost" icon="trash" iconOnly label="リンクを削除" onClick={() => setRemoving(l.id)} />
      )}
    </div>
  );
  return (
    <div className="stack" style={{ ["--gap" as string]: "10px" }}>
      <div className="stack" style={{ ["--gap" as string]: "6px" }}>
        <span className="label">確定リンク（{confirmed.length}）</span>
        {confirmed.length ? confirmed.map(row) : <span className="small muted">確定したリンクはありません</span>}
      </div>
      {ai.length ? (
        <div className="stack" style={{ ["--gap" as string]: "6px" }}>
          <span className="label" style={{ color: "var(--tone-special)" }}>AIのリンク候補（{ai.length}） · 確定するまでトレーサビリティに数えません</span>
          {ai.map(row)}
        </div>
      ) : null}
      {readOnly ? null : adding ? (
        <div className="card tight stack" style={{ ["--gap" as string]: "10px" }}>
          <div className="grid cols-2">
            <Combobox label="リンク先" options={candidates.map((c) => ({ value: c.id, label: `${c.id} ${c.title}`, hint: c.kind }))} value={target} onChange={setTarget} />
            <Select label="関係" value={relation} onChange={setRelation} options={Object.entries(relLabel).map(([value, label]) => ({ value, label }))} />
          </div>
          <div className="row end">
            <Button variant="ghost" onClick={() => setAdding(false)}>キャンセル</Button>
            <Button variant="primary" disabled={!target.length} onClick={() => { const c = candidates.find((x) => x.id === target[0]); if (c) update([...links, { ...c, relation }]); setAdding(false); setTarget([]); }}>追加</Button>
          </div>
        </div>
      ) : (
        <div>
          <Button size="sm" icon="plus" onClick={() => setAdding(true)}>リンクを追加</Button>
        </div>
      )}
    </div>
  );
}

/** ExceptionSummary: 例外の対象、理由、リスク、期限、承認者 */
export function ExceptionSummary({ ex, compact }: { ex: ExceptionRecord; compact?: boolean }) {
  return (
    <div className="card tight stack" style={{ ["--gap" as string]: "10px", borderColor: "var(--tone-special-border)" }}>
      <div className="row between">
        <span className="row" style={{ ["--gap" as string]: "8px" }}>
          <Icon name="flag" className="text-special" />
          <span className="id-link" style={{ color: "var(--tone-special)" }}>{ex.id}</span>
          <span className="small muted">ゲート{ex.gate}（{GATE_LABELS[ex.gate]}）· {ex.rule_id}</span>
        </span>
        <StatusBadge vocab={EXCEPTION_STATUS[ex.status]} size="sm" />
      </div>
      <div className="small"><span className="muted">対象:</span> <span className="mono">{ex.target}</span></div>
      {!compact ? (
        <>
          <div className="small"><span className="muted">理由:</span> {ex.reason}</div>
          <div className="small"><span className="muted">リスク:</span> {ex.risk}</div>
        </>
      ) : null}
      <div className="row between small">
        <span className="row" style={{ ["--gap" as string]: "6px" }}><span className="muted">承認者</span><UserChip user={userById(ex.approver_id)} showRole={false} plain /></span>
        {ex.status === "active" || ex.status === "applying" ? <DeadlineIndicator date={ex.expires_at} /> : <span className="muted">期限 {formatDate(ex.expires_at)}</span>}
      </div>
    </div>
  );
}

/** EvidenceItem: 証跡1件 */
export function EvidenceItem({ ev }: { ev: Evidence }) {
  const icon: IconName = ev.kind.includes("承認") || ev.kind.includes("受入") ? "fileCheck" : ev.kind.includes("CI") ? "cpu" : ev.kind.includes("Manifest") ? "signature" : "fileText";
  return (
    <div className={cx("evidence-item", ev.missing && "missing")}>
      <span className="ev-icon"><Icon name={ev.missing ? "alertCircle" : icon} /></span>
      <div className="stack" style={{ ["--gap" as string]: "3px", minWidth: 0 }}>
        <span className="row" style={{ ["--gap" as string]: "6px" }}>
          <Tag square>{ev.kind}</Tag>
          <span className="strong truncate">{ev.title}</span>
        </span>
        {ev.missing ? (
          <span className="small text-fail">必要な証跡がまだ取得されていません</span>
        ) : (
          <span className="row small" style={{ ["--gap" as string]: "8px" }}>
            <ActorLabel kind={ev.source.kind} name={ev.source.name} size="sm" />
            <HashDisplay value={ev.sha256} />
            <span className="muted"><Timestamp at={ev.recorded_at} /></span>
          </span>
        )}
      </div>
      {ev.missing ? <Tag tone="fail">欠落</Tag> : <StatusBadge vocab={EVIDENCE_STATUS[ev.status]} size="sm" />}
    </div>
  );
}

/** CommentThread: コメントの一覧と入力。メンション、返信、解決 */
export type Comment = { id: string; user_id: string; body: string; at: string; resolved?: boolean; replies?: { id: string; user_id: string; body: string; at: string }[] };
export function CommentThread({ comments: initial }: { comments: Comment[] }) {
  const [comments, setComments] = useState(initial);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const mention = text.match(/@([^\s]*)$/);
  const mentionHits = mention ? users.filter((u) => u.kind !== "agent" && u.name.includes(mention[1])).slice(0, 5) : [];
  return (
    <div className="comment-thread">
      {comments.length === 0 ? <p className="small muted">コメントはまだありません。</p> : null}
      {comments.map((c) => {
        const u = userById(c.user_id);
        return (
          <div key={c.id} className={cx("comment", c.resolved && "resolved")}>
            <Avatar user={u} />
            <div className="stack" style={{ ["--gap" as string]: "4px", minWidth: 0 }}>
              <div className="row small">
                <span className="strong">{u?.name}</span>
                <span className="muted"><Timestamp at={c.at} /></span>
                {c.resolved ? <Tag tone="pass" icon="check">解決済み</Tag> : null}
              </div>
              <div className="bubble">{c.body}</div>
              <div className="row">
                <button type="button" className="btn ghost sm" onClick={() => setReplyTo(c.id)}>返信</button>
                <button type="button" className="btn ghost sm" onClick={() => setComments((xs) => xs.map((x) => (x.id === c.id ? { ...x, resolved: !x.resolved } : x)))}>{c.resolved ? "未解決に戻す" : "解決済みにする"}</button>
              </div>
              {c.replies?.length || replyTo === c.id ? (
                <div className="replies">
                  {c.replies?.map((r) => {
                    const ru = userById(r.user_id);
                    return (
                      <div key={r.id} className="comment">
                        <Avatar user={ru} />
                        <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                          <div className="row small"><span className="strong">{ru?.name}</span><span className="muted"><Timestamp at={r.at} /></span></div>
                          <div className="bubble">{r.body}</div>
                        </div>
                      </div>
                    );
                  })}
                  {replyTo === c.id ? (
                    <div className="row nowrap">
                      <input className="input" placeholder="返信を入力" value={reply} onChange={(e) => setReply(e.target.value)} />
                      <Button size="sm" variant="primary" disabled={!reply.trim()} onClick={() => { setComments((xs) => xs.map((x) => (x.id === c.id ? { ...x, replies: [...(x.replies ?? []), { id: `r${Date.now()}`, user_id: "u-sato", body: reply, at: "2026-11-27T10:30:00+09:00" }] } : x))); setReply(""); setReplyTo(null); }}>送信</Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      <div className="stack" style={{ ["--gap" as string]: "8px", position: "relative" }}>
        <textarea className="textarea" rows={3} placeholder="コメントを入力（@ でメンション）" value={text} onChange={(e) => setText(e.target.value)} aria-label="コメント" />
        {mentionHits.length ? (
          <div className="menu" style={{ top: "auto", bottom: 48, right: "auto", minWidth: 240 }}>
            {mentionHits.map((u) => (
              <button key={u.id} type="button" className="menu-item" onClick={() => setText(text.replace(/@([^\s]*)$/, `@${u.name} `))}>
                <Avatar user={u} /> {u.name} <span className="tiny muted">{u.roles[0]}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="row end">
          <Button variant="primary" size="sm" disabled={!text.trim()} onClick={() => { setComments((xs) => [...xs, { id: `c${Date.now()}`, user_id: "u-sato", body: text, at: "2026-11-27T10:30:00+09:00" }]); setText(""); }}>コメントする</Button>
        </div>
      </div>
    </div>
  );
}

/** ShareLinkPanel: 共有リンクの発行、期限、URLのコピー、失効 */
export function ShareLinkPanel({ initial = "none" }: { initial?: "none" | "active" | "expired" | "revoked" }) {
  const [state, setState] = useState(initial);
  const [days, setDays] = useState("14");
  const [email, setEmail] = useState("assessor@review-office.example");
  const [copied, setCopied] = useState(false);
  const url = "https://app.example/review/tk_8f2a91c0d4e7";
  return (
    <div className="stack" style={{ ["--gap" as string]: "12px" }}>
      <div className="row between">
        <span className="strong">評価者への共有リンク</span>
        <StatusBadge vocab={{ none: { label: "未発行", tone: "neutral" as const }, active: { label: "有効", tone: "pass" as const }, expired: { label: "期限切れ", tone: "neutral" as const }, revoked: { label: "失効済み", tone: "fail" as const } }[state]} size="sm" />
      </div>
      {state === "none" || state === "expired" || state === "revoked" ? (
        <>
          <div className="grid cols-2">
            <Select label="有効期限" value={days} onChange={setDays} options={[{ value: "7", label: "7日間" }, { value: "14", label: "14日間" }, { value: "30", label: "30日間" }]} />
            <label className="field">
              <span className="field-label">閲覧者のメールアドレス</span>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              <span className="field-help">このアドレスに届く確認コードで閲覧します</span>
            </label>
          </div>
          <div><Button variant="primary" icon="link" onClick={() => setState("active")}>{state === "none" ? "共有リンクを発行" : "新しいリンクを発行"}</Button></div>
        </>
      ) : (
        <>
          <div className="share-link">
            <Icon name="link" size={14} className="muted" />
            <span>{url}</span>
            <Button size="sm" icon={copied ? "check" : "copy"} onClick={() => { void navigator.clipboard?.writeText(url).catch(() => undefined); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}>{copied ? "コピーしました" : "コピー"}</Button>
          </div>
          <div className="row between small">
            <span className="muted">閲覧者: {email} · 期限: 2026-12-11（あと{days}日）· 閲覧 0回</span>
            <Button size="sm" variant="ghost" icon="x" onClick={() => setState("revoked")}>失効させる</Button>
          </div>
        </>
      )}
    </div>
  );
}

/** PlanLimitNotice */
export function PlanLimitNotice({ resource = "リポジトリ", used, limit, plan = "Starter" }: { resource?: string; used: number; limit: number; plan?: string }) {
  return (
    <div className="banner tone-warn">
      <Icon name="alert" />
      <div className="banner-body">
        <div className="banner-title">{plan} プランの{resource}数の上限（{limit}）に達しました</div>
        <div>現在 {used}/{limit} を使用しています。追加するにはプランを変更してください。</div>
      </div>
      <Button size="sm" variant="primary" icon="arrowRight">プランを比較</Button>
    </div>
  );
}

/** TraceGraph: 要求→設計→コード→テストのグラフ */
export type TraceNode = { id: string; col: 0 | 1 | 2 | 3; title: string; missing?: boolean };
export type TraceEdge = { from: string; to: string; ai?: boolean };
const COL_LABELS = ["要求", "設計", "コード（PR）", "テスト"];
export function TraceGraph({ nodes, edges, selected, onSelect, showAi = true, height }: { nodes: TraceNode[]; edges: TraceEdge[]; selected?: string; onSelect?: (id: string) => void; showAi?: boolean; height?: number }) {
  const [zoom, setZoom] = useState(1);
  const colW = 230;
  const nodeW = 180;
  const nodeH = 40;
  const gapY = 14;
  const pos = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    [0, 1, 2, 3].forEach((c) => {
      nodes.filter((n) => n.col === c).forEach((n, i) => map.set(n.id, { x: 20 + c * colW, y: 44 + i * (nodeH + gapY) }));
    });
    return map;
  }, [nodes]);
  const maxRows = Math.max(1, ...[0, 1, 2, 3].map((c) => nodes.filter((n) => n.col === c).length));
  const w = 20 + 4 * colW;
  const h = 44 + maxRows * (nodeH + gapY) + 10;
  const related = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>([selected]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const e of edges) {
        if (set.has(e.from) && !set.has(e.to)) { set.add(e.to); changed = true; }
        if (set.has(e.to) && !set.has(e.from)) { set.add(e.from); changed = true; }
      }
    }
    return set;
  }, [selected, edges]);
  const visibleEdges = edges.filter((e) => showAi || !e.ai);
  return (
    <div className="trace-graph" style={{ height: height ?? Math.min(h * zoom + 20, 560) }}>
      <div className="zoom">
        <Button size="sm" iconOnly icon="zoomOut" label="縮小" onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))} />
        <Button size="sm" iconOnly icon="zoomIn" label="拡大" onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))} />
      </div>
      <svg width={w * zoom} height={h * zoom} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="トレーサビリティグラフ">
        {COL_LABELS.map((l, i) => (
          <text key={l} x={20 + i * colW} y={24} className="col-label">{l}</text>
        ))}
        {visibleEdges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const x1 = a.x + nodeW;
          const y1 = a.y + nodeH / 2;
          const x2 = b.x;
          const y2 = b.y + nodeH / 2;
          const mx = (x1 + x2) / 2;
          const hl = selected && related.has(e.from) && related.has(e.to);
          return <path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} className={cx("edge", e.ai && "ai", hl && "hl")} />;
        })}
        {nodes.map((n) => {
          const p = pos.get(n.id)!;
          return (
            <g key={n.id} className={cx("node", n.missing && "missing", selected === n.id && "selected")} transform={`translate(${p.x},${p.y})`} onClick={() => onSelect?.(n.id)} tabIndex={0} role="button" aria-label={`${n.id} ${n.title}`} onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(n.id); }} opacity={selected && !related.has(n.id) ? 0.4 : 1}>
              <rect width={nodeW} height={nodeH} rx={8} />
              <text x={10} y={16}>{n.missing ? "欠落" : n.id}</text>
              <text x={10} y={31} className="sub">{n.title.length > 16 ? `${n.title.slice(0, 16)}…` : n.title}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function TraceLegend() {
  return (
    <div className="trace-legend">
      <span><span className="sw" />確定リンク</span>
      <span><span className="sw ai" />AIの候補リンク（参考）</span>
      <span><span className="sw missing" />欠落（リンクが必要）</span>
    </div>
  );
}

/** TraceMatrix: 要求×成果物の表 */
export type MatrixCell = { count: number; ai?: number };
export function TraceMatrix({ rows, columns, onCell }: { rows: { id: string; title: string; cells: MatrixCell[] }[]; columns: string[]; onCell?: (rowId: string, col: number) => void }) {
  return (
    <div className="table-wrap">
      <table className="table compact">
        <thead>
          <tr>
            <th>要求</th>
            {columns.map((c) => <th key={c} style={{ textAlign: "center" }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <span className="row nowrap" style={{ ["--gap" as string]: "8px" }}>
                  <IdLink id={r.id} />
                  <span className="truncate" style={{ maxWidth: 260 }}>{r.title}</span>
                </span>
              </td>
              {r.cells.map((c, i) => {
                const cls = c.count > 0 ? "yes" : c.ai ? "ai" : "no";
                return (
                  <td key={i} style={{ textAlign: "center" }}>
                    <button type="button" className={cx("matrix-cell", cls)} onClick={() => onCell?.(r.id, i)} aria-label={`${r.id} ${columns[i]}: ${c.count}件${c.ai ? `（AI候補 ${c.ai}件）` : ""}`}>
                      {c.count > 0 ? c.count : c.ai ? `AI ${c.ai}` : "—"}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** ロール名から該当メンバーを返す（SoDNotice の候補表示用） */
export function membersWithRole(role: Role, excludeId?: string) {
  return users.filter((u) => u.roles.includes(role) && u.id !== excludeId && u.status === "active");
}
