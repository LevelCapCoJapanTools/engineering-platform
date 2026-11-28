// 経営: ダッシュボードと判断 の画面群で共有するローカル部品。
import "./executive.css";
import type { ReactNode } from "react";
import { paths, PROJECT } from "../../lib/paths";
import { DECISION_STATUS, HEALTH, SEVERITY } from "../../lib/vocab";
import type { Decision, ProjectHealth } from "../../lib/types";
import { projectBySlug, userById } from "../../mocks/core";
import { DECISION_KIND, evidenceKind } from "../../mocks/executive";
import { yenM } from "../../lib/format";
import { Link } from "../../lib/router";
import { DeadlineIndicator, ExternalActor, Icon, IdLink, StatusBadge, Tag, UserChip } from "../../ui";

/** 根拠ID（CR-, REQ-, MS- など）から遷移先を決める。案件が無い ID は既定の案件で開く */
export function evidenceHref(org: string, id: string, project = PROJECT): string | undefined {
  switch (evidenceKind(id)) {
    case "change": return paths.change(org, project, id);
    case "requirement": return paths.requirement(org, project, id);
    case "test": return paths.verification(org, project);
    case "exception": return paths.exception(org, project, id);
    case "gate": return paths.gate(org, project, id);
    case "milestone": return paths.milestones(org, project);
    case "case": return paths.businessCase(org, id);
    case "benefit": return paths.benefit(org, id);
    case "manifest": return paths.manifest(org, project, id);
    default:
      if (id.startsWith("INC-")) return paths.incident(org, id);
      if (id.startsWith("DEC-")) return paths.decision(org, id);
      return undefined;
  }
}

/** 依頼者・判断者。アカウントを持たないアクターは外部IDで表示する */
export function PersonRef({ userId }: { userId?: string }) {
  const u = userById(userId);
  if (!u) return <span className="muted">—</span>;
  return u.account === false ? <ExternalActor userId={u.id} role={u.roles.join("・")} /> : <UserChip user={u} role={u.title ?? u.roles[0]} />;
}

export function projectName(slug?: string) {
  return slug ? projectBySlug(slug).name : "組織全体";
}

/** 経営判断のカード（受信箱・ダッシュボード） */
export function DecisionCard({ org, d, footer }: { org: string; d: Decision; footer?: ReactNode }) {
  return (
    <div className="card tight exec-decision-card">
      <div className="row between" style={{ ["--gap" as string]: "8px" }}>
        <div className="row" style={{ ["--gap" as string]: "6px" }}>
          <Tag square tone="primary">{DECISION_KIND[d.kind]}</Tag>
          <StatusBadge vocab={SEVERITY[d.severity]} size="sm" />
          {d.status !== "pending" ? <StatusBadge vocab={DECISION_STATUS[d.status]} size="sm" /> : null}
          <span className="mono tiny muted">{d.id}</span>
        </div>
        <DeadlineIndicator date={d.due} />
      </div>
      <Link to={paths.decision(org, d.id)} className="exec-decision-title">{d.title}</Link>
      <div className="small">{d.impact}{d.impact_yen ? <span className="muted">（{yenM(d.impact_yen)}）</span> : null}</div>
      <div className="row tiny muted" style={{ ["--gap" as string]: "10px" }}>
        <span><Icon name="folder" size={12} /> {projectName(d.project)}</span>
        <span className="row" style={{ ["--gap" as string]: "4px" }}>依頼: <PersonRef userId={d.requested_by} /></span>
      </div>
      {d.practical_approver ? (
        <div className="exec-route-note small">
          <Icon name="route" size={14} />
          <span>実務上の承認者: {d.practical_approver}。経営層だけで決めず、正しい承認者へ回付できます。</span>
        </div>
      ) : null}
      {footer}
    </div>
  );
}

export function HealthBadge({ h }: { h: ProjectHealth }) {
  return <StatusBadge vocab={HEALTH[h.health]} size="sm" />;
}

/** 予算と予測コスト。超過見込みは強調する */
export function BudgetCell({ h }: { h: ProjectHealth }) {
  const over = h.forecast_cost - h.budget;
  return (
    <span className="stack" style={{ ["--gap" as string]: "2px" }}>
      <span className="small">{yenM(h.forecast_cost)} <span className="muted">/ {yenM(h.budget)}</span></span>
      {over > 0 ? <span className="tiny text-fail">予算超過見込み +{yenM(over)}</span> : <span className="tiny muted">予算内（予測）</span>}
    </span>
  );
}

/** 根拠IDのリスト */
export function EvidenceLinks({ org, ids, project }: { org: string; ids: string[]; project?: string }) {
  if (ids.length === 0) return <span className="muted small">根拠の登録なし</span>;
  return (
    <span className="row" style={{ ["--gap" as string]: "6px" }}>
      {ids.map((id) => {
        const to = evidenceHref(org, id, project);
        return to ? <IdLink key={id} id={id} to={to} /> : <Tag key={id} square>{id}</Tag>;
      })}
    </span>
  );
}
