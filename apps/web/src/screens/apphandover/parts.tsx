// アプリの引き渡し画面群のローカル部品
import "./apphandover.css";
import type { ReactNode } from "react";
import { Link } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { ExternalActor, Icon, Tag, cx } from "../../ui";
import { formatDate } from "../../lib/format";
import { EXTERNAL_HOLDER, HANDOVER_PROJECT, TASK_STATUS, WHERE_LABEL } from "../../mocks/apphandover";
import type { HandoverTask } from "../../mocks/apphandover";

export const PR = HANDOVER_PROJECT;

export function orgOf(params: Record<string, string>) {
  return params.org && !params.org.startsWith(":") ? params.org : ORG;
}

/** 担当者。架空の譲渡元 Account Holder は本サービスの利用者ではないため名前だけを出す */
export function Owner({ id }: { id: string }) {
  if (id === EXTERNAL_HOLDER.id) return <span className="small">{EXTERNAL_HOLDER.name}</span>;
  return <ExternalActor userId={id} />;
}

export function SideTag({ side }: { side: HandoverTask["owner_side"] }) {
  return side === "customer" ? <Tag tone="warn" square>発注企業</Tag> : side === "jv" ? <Tag tone="info" square>受注側（JV）</Tag> : <Tag tone="special" square>案件窓口</Tag>;
}

export function WhereTag({ where }: { where: HandoverTask["where"] }) {
  return <Tag square dashed={where === "apple"} icon={where === "apple" ? "external" : where === "customerEnv" ? "server" : "grid"}>{WHERE_LABEL[where]}</Tag>;
}

export function TaskStatus({ status }: { status: HandoverTask["status"] }) {
  const s = TASK_STATUS[status];
  return <Tag tone={s.tone} square>{s.label}</Tag>;
}

/** 作業表。Apple 上の作業は本人が行い、本サービスは担当・期限・再開先だけを持つ */
export function TaskTable({ tasks, showSide = true }: { tasks: HandoverTask[]; showSide?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>作業</th><th>どこで</th><th>担当</th><th>期限</th><th>状態</th></tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="strong small">{t.title}</div>
                {t.note ? <div className="tiny muted">{t.note}</div> : null}
              </td>
              <td><WhereTag where={t.where} /></td>
              <td><div className="stack" style={{ ["--gap" as string]: "4px" }}><Owner id={t.owner} />{showSide ? <SideTag side={t.owner_side} /> : null}</div></td>
              <td className="small">{formatDate(t.due)}</td>
              <td><TaskStatus status={t.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Q-01〜Q-05 の手順ナビ */
export function HandoverSteps({ org, active }: { org: string; active: "Q-01" | "Q-02" | "Q-03" | "Q-04" | "Q-05" }) {
  const steps = [
    { id: "Q-01", label: "配信名義と方式", to: paths.appHandover(org, PR) },
    { id: "Q-02", label: "組織登録の支援", to: paths.appEnrollment(org, PR) },
    { id: "Q-03", label: "作業者の招待", to: paths.appInvitations(org, PR) },
    { id: "Q-04", label: "アプリの移管", to: paths.appTransfer(org, PR) },
    { id: "Q-05", label: "運用権限の引き渡し", to: paths.appOperations(org, PR) },
  ] as const;
  return (
    <nav className="tabs ah-steps" aria-label="アプリの引き渡しの手順">
      {steps.map((s) => (
        <Link key={s.id} to={s.to} className={cx("tab", active === s.id && "active")} aria-current={active === s.id ? "page" : undefined}>{s.label}</Link>
      ))}
    </nav>
  );
}

/** Apple 上で本人が行う操作の注記。秘密情報を本サービスに入力させない */
export function AppleBoundary({ children }: { children?: ReactNode }) {
  return (
    <div className="ah-boundary">
      <Icon name="lock" size={16} />
      <div className="small">
        <strong>Apple 上の手続きは本人が行います。</strong>
        認証コード、パスワード、本人確認書類、鍵などの秘密情報は本サービスに入力しないでください。本サービスは担当・期限・再開先の案内と、完了の確認だけを記録します。
        {children ? <div style={{ marginTop: 4 }}>{children}</div> : null}
      </div>
    </div>
  );
}
