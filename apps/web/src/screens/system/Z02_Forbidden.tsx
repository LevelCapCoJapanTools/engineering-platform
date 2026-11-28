// 画面ID: Z-02 権限がない
import { Button, CenterLayout, Icon, KeyValueList, RoleBadge, UserChip, membersWithRole, useToast } from "../../ui";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { currentUser, users } from "../../mocks/core";
import type { User } from "../../lib/types";

type Reason = {
  title: string;
  body: string;
  required: string;
  eligibleLabel: string;
  eligible: User[];
  howTo: string;
  action: string;
};

const REASONS: Record<string, Reason> = {
  ロール不足: {
    title: "この操作に必要なロールがありません",
    body: "Control Pack の編集には「ポリシー管理者」のロールが必要です。あなたのロールは PM、リリース管理者です。",
    required: "ポリシー管理者",
    eligibleLabel: "ロールを付与できる人（組織管理者）",
    eligible: membersWithRole("組織管理者"),
    howTo: "組織管理者にロールの付与を依頼してください。依頼すると、承認待ちとして組織管理者に通知されます。",
    action: "ロールの付与を依頼",
  },
  職務分離: {
    title: "職務分離のため、この操作はできません",
    body: "あなたは例外 EXC-0008 の申請者と同じチームの作成者として記録されています。作成者は自分の成果物を承認できません。",
    required: "申請者以外の PM",
    eligibleLabel: "承認できる人",
    eligible: users.filter((u) => u.roles.includes("PM") && u.id !== currentUser.id && u.status === "active").concat(membersWithRole("組織管理者")),
    howTo: "承認できる人に承認を依頼してください。承認者を変更するには、申請画面で承認者を選び直します。",
    action: "承認を依頼",
  },
  プロジェクト外: {
    title: "このプロジェクトのメンバーではありません",
    body: "「在庫管理ダッシュボード」のメンバーに登録されていないため、内容を表示できません。",
    required: "プロジェクトのメンバー",
    eligibleLabel: "メンバーを追加できる人",
    eligible: membersWithRole("組織管理者").concat(membersWithRole("PM").filter((u) => u.id !== currentUser.id)),
    howTo: "プロジェクトの PM または組織管理者に、メンバーへの追加を依頼してください。",
    action: "参加を依頼",
  },
};

export function ForbiddenScreen() {
  const state = useScreenState();
  const reason = REASONS[state] ?? REASONS["ロール不足"];
  const toast = useToast();
  return (
    <CenterLayout>
      <div className="empty" style={{ padding: "8px 0" }}>
        <span className="empty-icon" style={{ background: "var(--tone-warn-bg)", color: "var(--tone-warn)" }}><Icon name="lock" /></span>
        <p className="mono muted" style={{ fontSize: "var(--text-xs)" }}>403</p>
        <h3 style={{ fontSize: "var(--text-lg)" }}>{reason.title}</h3>
        <p>{reason.body}</p>
      </div>
      <KeyValueList
        items={[
          { label: "理由", value: state },
          { label: "必要な権限", value: reason.required === "ポリシー管理者" ? <RoleBadge role="ポリシー管理者" /> : reason.required },
          { label: "あなた", value: <UserChip user={currentUser} /> },
        ]}
      />
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <span className="label">{reason.eligibleLabel}</span>
        <div className="row" style={{ ["--gap" as string]: "6px" }}>
          {reason.eligible.map((u) => <UserChip key={u.id} user={u} />)}
        </div>
      </div>
      <div className="sod">
        <Icon name="info" />
        <span>{reason.howTo}</span>
      </div>
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <Button variant="primary" icon="mail" block onClick={() => toast({ kind: "success", message: `${reason.eligible[0]?.name ?? "担当者"} さんに依頼を送りました` })}>{reason.action}</Button>
        <Button variant="ghost" icon="home" block to={paths.orgHome(ORG)}>ダッシュボードへ戻る</Button>
      </div>
    </CenterLayout>
  );
}
