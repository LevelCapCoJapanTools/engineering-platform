// 画面ID: S-02 メンバーとロール
import { useMemo, useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { MEMBER_STATUS, ROLES } from "../../lib/vocab";
import type { Role } from "../../lib/vocab";
import type { User } from "../../lib/types";
import { users } from "../../mocks/core";
import {
  Banner,
  Button,
  Checkbox,
  Combobox,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  FilterBar,
  Menu,
  Modal,
  RoleBadge,
  SettingsLayout,
  Skeleton,
  StatusBadge,
  TextArea,
  Timestamp,
  UserChip,
  useToast,
} from "../../ui";
import type { Column } from "../../ui";

const INTERNAL_ROLES = ROLES.filter((r) => r.org === "開発会社").map((r) => r.name);

type SodIssue = { level: "warn" | "fail"; text: string };

function checkSod(members: User[]): SodIssue[] {
  const active = members.filter((m) => m.status === "active" && m.kind === "member");
  const issues: SodIssue[] = [];
  if (!active.some((m) => m.roles.includes("ポリシー管理者"))) issues.push({ level: "fail", text: "ポリシー管理者がいません。ゲートのルールを変更できる人がいない状態です。" });
  active
    .filter((m) => m.roles.includes("開発者") && m.roles.includes("リリース管理者"))
    .forEach((m) => issues.push({ level: "warn", text: `${m.name} さんは開発者とリリース管理者を兼ねています。自分が作成した変更を含むリリースは、別のリリース管理者の承認が必要になります。` }));
  if (active.filter((m) => m.roles.includes("リリース管理者")).length < 2) issues.push({ level: "warn", text: "リリース管理者が1名のみです。本人が作成した変更を含むリリースを承認できる人がいません。" });
  return issues;
}

export function S02Members({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [invite, setInvite] = useState(false);
  const [roleEdit, setRoleEdit] = useState<User | null>(null);
  const [roleDraft, setRoleDraft] = useState<Role[]>([]);
  const [disabling, setDisabling] = useState<User | null>(null);
  const [inviteRoles, setInviteRoles] = useState<string[]>(["開発者"]);
  const [inviteTo, setInviteTo] = useState("");

  const base = useMemo(() => {
    if (state === "空") return users.filter((u) => u.id === "u-yamamoto");
    if (state === "違反なし") return users.map((u) => (u.id === "u-watanabe" ? { ...u, roles: ["リリース管理者"] as Role[] } : u));
    return users;
  }, [state]);
  const members = base.filter((u) => u.kind !== "agent");
  const issues = checkSod(members);
  const rows = members.filter(
    (u) =>
      `${u.name} ${u.email}`.includes(q) &&
      (!filters.role || u.roles.includes(filters.role as Role)) &&
      (!filters.status || u.status === filters.status),
  );

  const columns: Column<User>[] = [
    { key: "name", header: "メンバー", render: (u) => <UserChip user={u} showRole={false} plain />, sortValue: (u) => u.name, hideable: false },
    { key: "email", header: "メール", render: (u) => <span className="small">{u.email || "—"}</span> },
    { key: "roles", header: "ロール", render: (u) => <span className="row" style={{ ["--gap" as string]: "4px" }}>{u.roles.map((r) => <RoleBadge key={r} role={r} />)}</span> },
    { key: "joined", header: "参加日", render: (u) => (u.joined_at ? <Timestamp at={u.joined_at} mode="date" /> : <span className="muted">—</span>), sortValue: (u) => u.joined_at ?? "" },
    { key: "last", header: "最終アクセス", render: (u) => (u.last_active_at ? <Timestamp at={u.last_active_at} /> : <span className="muted">—</span>), sortValue: (u) => u.last_active_at ?? "" },
    { key: "status", header: "状態", render: (u) => <StatusBadge vocab={MEMBER_STATUS[u.status]} size="sm" /> },
    {
      key: "actions",
      header: "",
      hideable: false,
      render: (u) => (
        <Menu
          trigger={(toggle) => <Button size="sm" variant="ghost" iconOnly icon="more" label={`${u.name} の操作`} onClick={toggle} />}
          items={
            u.status === "invited"
              ? [
                  { label: "招待を再送", icon: "mail", onClick: () => toast({ kind: "success", message: `${u.email} に招待を再送しました` }) },
                  { label: "招待を取り消す", icon: "x", danger: true, onClick: () => toast({ kind: "info", message: "招待を取り消しました" }) },
                ]
              : [
                  { label: "ロールを変更", icon: "users", onClick: () => { setRoleEdit(u); setRoleDraft(u.roles); }, disabled: u.status === "disabled" },
                  u.status === "disabled"
                    ? { label: "有効に戻す", icon: "refresh", onClick: () => toast({ kind: "success", message: `${u.name} さんを有効にしました` }) }
                    : { label: "無効化", icon: "lock", danger: true, onClick: () => setDisabling(u) },
                ]
          }
        />
      ),
    },
  ];

  return (
    <SettingsLayout
      org={org}
      active="members"
      title="メンバーとロール"
      description="1人に複数のロールを割り当てられます。作成者は自分の成果物を承認できません。"
      actions={<Button variant="primary" icon="plus" onClick={() => setInvite(true)}>メンバーを招待</Button>}
    >
      {state === "読み込み中" ? (
        <Skeleton />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {issues.length ? (
            <Banner tone={issues.some((i) => i.level === "fail") ? "fail" : "warn"} title={`職務分離のチェック: ${issues.length}件の注意があります`}>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {issues.map((i) => <li key={i.text}>{i.text}</li>)}
              </ul>
            </Banner>
          ) : (
            <Banner tone="pass" title="職務分離のチェック: 問題はありません">作成・承認・ポリシー管理のロールが分かれています。</Banner>
          )}
          <FilterBar
            search={q}
            onSearch={setQ}
            searchPlaceholder="名前・メールで検索"
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            filters={[
              { key: "role", label: "ロール", options: ROLES.map((r) => ({ value: r.name, label: r.name })) },
              { key: "status", label: "状態", options: Object.entries(MEMBER_STATUS).map(([value, v]) => ({ value, label: v.label })) },
            ]}
          />
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(u) => u.id}
            toolbar={<span className="small muted">{rows.length}名 · 有効 {rows.filter((r) => r.status === "active").length} · 招待中 {rows.filter((r) => r.status === "invited").length}</span>}
            empty={
              members.length <= 1 && state === "空" ? (
                <EmptyState icon="users" title="まだメンバーがいません" description="開発メンバーや顧客の担当者を招待して、ロールを割り当てましょう。" action={<Button variant="primary" icon="plus" onClick={() => setInvite(true)}>メンバーを招待</Button>} />
              ) : (
                <EmptyState variant="filtered" title="条件に一致するメンバーはいません" description="絞り込み条件を変更してください。" />
              )
            }
          />
          {state === "空" && rows.length === 1 ? (
            <EmptyState icon="users" title="メンバーはあなただけです" description="開発メンバーや顧客の担当者を招待して、ロールを割り当てましょう。" action={<Button variant="primary" icon="plus" onClick={() => setInvite(true)}>メンバーを招待</Button>} />
          ) : null}
        </>
      )}

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="メンバーを招待"
        description="招待メールに記載されたリンクから参加します。リンクの有効期限は7日間です。"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInvite(false)}>キャンセル</Button>
            <Button variant="primary" icon="mail" disabled={!inviteTo.trim() || !inviteRoles.length} onClick={() => { setInvite(false); toast({ kind: "success", message: "招待を送信しました" }); }}>招待を送る</Button>
          </>
        }
      >
        <div className="stack">
          <TextArea label="メールアドレスまたは GitHub ユーザー名" required value={inviteTo} onChange={setInviteTo} rows={3} placeholder={"kimura@sample-soft.example\ngithub-user"} help="改行で区切ると複数人をまとめて招待できます" />
          <Combobox label="ロール" required multiple options={ROLES.filter((r) => r.name !== "評価者").map((r) => ({ value: r.name, label: r.name, hint: r.ops }))} value={inviteRoles} onChange={setInviteRoles} />
          {inviteRoles.includes("顧客") ? (
            <Combobox label="閲覧できるプロジェクト（顧客）" required multiple options={[{ value: "order-renewal", label: "受発注システム刷新" }, { value: "member-app-api", label: "会員アプリ API 開発" }]} value={["order-renewal"]} help="顧客は指定したプロジェクトのみ閲覧・承認できます" />
          ) : null}
          {inviteRoles.includes("開発者") && inviteRoles.includes("リリース管理者") ? (
            <Banner tone="warn">開発者とリリース管理者を兼ねると、自分の変更を含むリリースは承認できなくなります。</Banner>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(roleEdit)}
        onClose={() => setRoleEdit(null)}
        title={`${roleEdit?.name ?? ""} さんのロール`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRoleEdit(null)}>キャンセル</Button>
            <Button variant="primary" disabled={!roleDraft.length} disabledReason="1つ以上のロールを選んでください" onClick={() => { setRoleEdit(null); toast({ kind: "success", message: "ロールを変更しました" }); }}>保存</Button>
          </>
        }
      >
        <div className="grid cols-2" style={{ ["--gap" as string]: "10px" }}>
          {INTERNAL_ROLES.map((r) => (
            <Checkbox
              key={r}
              label={r}
              description={ROLES.find((x) => x.name === r)?.ops}
              checked={roleDraft.includes(r)}
              onChange={(c) => setRoleDraft((d) => (c ? [...d, r] : d.filter((x) => x !== r)))}
            />
          ))}
        </div>
        {roleDraft.includes("開発者") && roleDraft.includes("リリース管理者") ? (
          <div style={{ marginTop: 12 }}>
            <Banner tone="warn">開発者とリリース管理者を兼ねています。自分の変更を含むリリースは別の人の承認が必要です。</Banner>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(disabling)}
        onClose={() => setDisabling(null)}
        onConfirm={() => toast({ kind: "success", message: `${disabling?.name ?? ""} さんを無効にしました`, undo: () => undefined })}
        title="メンバーを無効にしますか？"
        message={`${disabling?.name ?? ""} さんはサインインできなくなります。過去の承認記録と監査ログはそのまま残ります。担当中の承認依頼は再割り当てが必要です。`}
        confirmLabel="無効にする"
        danger
      />
    </SettingsLayout>
  );
}
