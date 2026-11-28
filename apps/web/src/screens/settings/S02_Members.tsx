// 画面ID: S-02 利用者とロール
// 直接利用者（経営層・組織管理者・ポリシー管理者）だけを管理する。アカウントを持たないアクターは S-09。
import { useMemo, useState } from "react";
import { navigate, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { MEMBER_STATUS, ROLES } from "../../lib/vocab";
import type { Role } from "../../lib/vocab";
import type { User } from "../../lib/types";
import { userById, users } from "../../mocks/core";
import { invites } from "../../mocks/settings";
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
  Section,
  SettingsLayout,
  Skeleton,
  StatusBadge,
  Tag,
  TextArea,
  Timestamp,
  UserChip,
  useToast,
} from "../../ui";
import type { Column } from "../../ui";
import { daysUntil } from "../../lib/format";
import { ExternalInvitesSection } from "./trade2";

const DIRECT_ROLES = ROLES.filter((r) => r.audience === "direct");

/** 直接利用者のサインイン方式と MFA（モック） */
const AUTH: Record<string, { method: "SSO" | "パスワード"; mfa: boolean; scope: string }> = {
  "u-kimura": { method: "SSO", mfa: true, scope: "全社・Highly Confidential まで" },
  "u-mori": { method: "SSO", mfa: true, scope: "全社・Confidential まで" },
  "u-ishii": { method: "パスワード", mfa: true, scope: "受託開発事業部・3 案件" },
  "u-okada": { method: "SSO", mfa: false, scope: "自社サービス事業・1 案件" },
  "u-yamamoto": { method: "SSO", mfa: true, scope: "組織の運用（案件の機密データは閲覧不可）" },
};

type SodIssue = { level: "warn" | "fail"; text: string };

function checkSod(members: User[]): SodIssue[] {
  const active = members.filter((m) => m.status === "active");
  const issues: SodIssue[] = [];
  if (!active.some((m) => m.roles.includes("ポリシー管理者"))) issues.push({ level: "fail", text: "ポリシー管理者がいません。ゲートのルールや Control Pack の変更を承認できる人がいない状態です。" });
  if (active.filter((m) => m.roles.some((r) => r === "経営者" || r === "CTO" || r === "役員")).length < 2) issues.push({ level: "warn", text: "経営判断ができる人が1名のみです。本人が依頼した判断（予算の追加など）を判断できる人がいません。" });
  active
    .filter((m) => m.roles.includes("ポリシー管理者") && m.roles.includes("CTO"))
    .forEach((m) => issues.push({ level: "warn", text: `${m.name} さんはポリシー管理者と CTO を兼ねています。自分が変更したポリシーへの例外は別の人が承認します。` }));
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
  const [inviteRoles, setInviteRoles] = useState<string[]>(["役員"]);
  const [inviteTo, setInviteTo] = useState("");

  const base = useMemo(() => {
    const direct = users.filter((u) => u.account === true);
    if (state === "空") return direct.filter((u) => u.id === "u-kimura");
    if (state === "違反なし") return direct.map((u) => (u.id === "u-okada" ? { ...u, status: "active" as const } : u));
    return direct;
  }, [state]);
  const issues = checkSod(base).concat(state === "違反なし" ? [] : []);
  const noMfa = base.filter((u) => u.status === "active" && AUTH[u.id] && !AUTH[u.id].mfa);
  const rows = base.filter(
    (u) =>
      `${u.name} ${u.email} ${u.title ?? ""}`.includes(q) &&
      (!filters.role || u.roles.includes(filters.role as Role)) &&
      (!filters.status || u.status === filters.status),
  );
  const pendingInvites = state === "空" ? [] : invites;

  const columns: Column<User>[] = [
    { key: "name", header: "利用者", render: (u) => <span className="stack" style={{ ["--gap" as string]: "2px" }}><UserChip user={u} showRole={false} plain /><span className="tiny muted">{u.title ?? ""}</span></span>, sortValue: (u) => u.name, hideable: false },
    { key: "roles", header: "ロール", render: (u) => <span className="row" style={{ ["--gap" as string]: "4px" }}>{u.roles.map((r) => <RoleBadge key={r} role={r} />)}</span> },
    { key: "scope", header: "閲覧範囲", render: (u) => <span className="small">{AUTH[u.id]?.scope ?? "未設定"}</span> },
    {
      key: "auth",
      header: "サインイン",
      render: (u) => {
        const a = AUTH[u.id];
        if (!a) return <span className="muted">—</span>;
        const mfaMissing = state === "MFA未設定あり" ? !a.mfa || u.id === "u-ishii" : !a.mfa;
        return (
          <span className="row" style={{ ["--gap" as string]: "4px" }}>
            <Tag square>{a.method}</Tag>
            {mfaMissing ? <Tag tone="fail" square icon="alert">MFA 未設定</Tag> : <Tag tone="pass" square icon="shieldCheck">MFA</Tag>}
          </span>
        );
      },
    },
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
                  { label: "招待を再送（期限を7日延長）", icon: "mail", onClick: () => toast({ kind: "success", message: `${u.email} に招待を再送しました` }) },
                  { label: "招待を取り消す", icon: "x", danger: true, onClick: () => toast({ kind: "info", message: "招待を取り消しました。リンクは無効になります" }) },
                ]
              : [
                  { label: "ロールを変更", icon: "users", onClick: () => { setRoleEdit(u); setRoleDraft(u.roles); }, disabled: u.status === "disabled" },
                  { label: "閲覧範囲と判断権限を開く", icon: "eye", onClick: () => navigate(paths.scopes(org)) },
                  { label: "MFA の再設定を要求", icon: "key", onClick: () => toast({ kind: "success", message: `${u.name} さんに MFA の再設定を依頼しました` }) },
                  u.status === "disabled"
                    ? { label: "有効に戻す", icon: "refresh", onClick: () => toast({ kind: "success", message: `${u.name} さんを有効にしました` }) }
                    : { label: "無効化", icon: "lock", danger: true, onClick: () => setDisabling(u), disabled: u.id === "u-kimura" },
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
      title="利用者とロール"
      description="このサービスに直接サインインする利用者（経営層、組織管理者、ポリシー管理者）を管理します。ロールと閲覧範囲は役職から自動では付与しません。"
      actions={<Button variant="primary" icon="plus" onClick={() => setInvite(true)}>利用者を招待</Button>}
    >
      {state === "読み込み中" ? (
        <Skeleton />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <Banner
            tone="info"
            title="PM・開発者・QA・顧客にアカウントは不要です"
            action={<Button size="sm" icon="link" to={paths.actors(org)}>外部アクターの対応付け</Button>}
          >
            計画・要求・レビュー・テスト・承認などの活動は、GitHub や課題管理などの外部IDで記録します。人と役割の対応は「外部アクターの対応付け」で管理します。
          </Banner>
          {issues.length ? (
            <Banner tone={issues.some((i) => i.level === "fail") ? "fail" : "warn"} title={`職務分離のチェック: ${issues.length}件の注意があります`}>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {issues.map((i) => <li key={i.text}>{i.text}</li>)}
              </ul>
            </Banner>
          ) : (
            <Banner tone="pass" title="職務分離のチェック: 問題はありません">判断の依頼者と判断者、ポリシー管理と例外承認が分かれています。</Banner>
          )}
          {noMfa.length || state === "MFA未設定あり" ? (
            <Banner tone="warn" title="MFA を設定していない利用者がいます" action={<Button size="sm" to={paths.security_(org)}>MFA を必須にする</Button>}>
              経営判断や閲覧範囲の広い利用者は MFA が必要です。未設定の利用者は、次回サインイン時に設定を求められます。
            </Banner>
          ) : null}
          <FilterBar
            search={q}
            onSearch={setQ}
            searchPlaceholder="名前・メール・役職で検索"
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            filters={[
              { key: "role", label: "ロール", options: DIRECT_ROLES.map((r) => ({ value: r.name, label: r.name })) },
              { key: "status", label: "状態", options: Object.entries(MEMBER_STATUS).map(([value, v]) => ({ value, label: v.label })) },
            ]}
          />
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(u) => u.id}
            toolbar={<span className="small muted">{rows.length}名 · 有効 {rows.filter((r) => r.status === "active").length} · 招待中 {rows.filter((r) => r.status === "invited").length} · 課金対象のシート {rows.filter((r) => r.status !== "disabled").length}</span>}
            empty={<EmptyState variant="filtered" title="条件に一致する利用者はいません" description="絞り込み条件を変更してください。" />}
          />
          {state === "空" ? (
            <EmptyState icon="users" title="利用者はあなただけです" description="経営判断を分担する役員・事業部長や、組織の運用を担う組織管理者を招待しましょう。開発メンバーの招待は不要です。" action={<Button variant="primary" icon="plus" onClick={() => setInvite(true)}>利用者を招待</Button>} />
          ) : null}

          <Section title="招待" sub="招待リンクは7日で期限切れになります。取り消すとリンクは無効になります" flush>
            {pendingInvites.length === 0 ? (
              <div className="empty"><p>送信中の招待はありません。</p></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>宛先</th><th>ロール</th><th>招待者</th><th>期限</th><th>状態</th><th /></tr></thead>
                  <tbody>
                    {pendingInvites.map((i) => {
                      const left = daysUntil(i.expires_at);
                      return (
                        <tr key={i.id}>
                          <td className="small">{i.email}</td>
                          <td><span className="row" style={{ ["--gap" as string]: "4px" }}>{i.roles.map((r) => <RoleBadge key={r} role={r as Role} />)}</span></td>
                          <td className="small">{userById(i.invited_by)?.name}</td>
                          <td className="small"><Timestamp at={i.expires_at} mode="absolute" />{i.status === "pending" ? <span className="tiny muted">（あと {left} 日）</span> : null}</td>
                          <td>{i.status === "pending" ? <Tag tone="warn" square>招待中</Tag> : <Tag square>期限切れ</Tag>}</td>
                          <td>
                            <span className="row end" style={{ ["--gap" as string]: "4px" }}>
                              <Button size="sm" variant="ghost" icon="mail" onClick={() => toast({ kind: "success", message: "招待を再送しました。新しい期限は7日後です" })}>再送</Button>
                              {i.status === "pending" ? <Button size="sm" variant="ghost" icon="x" onClick={() => toast({ kind: "info", message: "招待を取り消しました" })}>取消</Button> : null}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
          <ExternalInvitesSection org={org} />
        </>
      )}

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="利用者を招待"
        description="招待メールのリンクから参加します。リンクの有効期限は7日間です。参加時に MFA の設定を求めます。"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInvite(false)}>キャンセル</Button>
            <Button variant="primary" icon="mail" disabled={!inviteTo.trim() || !inviteRoles.length} onClick={() => { setInvite(false); toast({ kind: "success", message: "招待を送信しました" }); }}>招待を送る</Button>
          </>
        }
      >
        <div className="stack">
          <TextArea label="メールアドレス" required value={inviteTo} onChange={setInviteTo} rows={3} placeholder={"okada@sample-soft.example"} help="改行で区切ると複数人をまとめて招待できます" />
          <Combobox label="ロール" required multiple options={DIRECT_ROLES.map((r) => ({ value: r.name, label: r.name, hint: r.ops }))} value={inviteRoles} onChange={setInviteRoles} />
          <Banner tone="info">閲覧範囲（事業部・顧客・案件・機密区分）と判断権限は、招待後に「閲覧範囲と判断権限」で明示的に設定します。設定するまでは担当案件も閲覧できません。</Banner>
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
            <Button variant="primary" disabled={!roleDraft.length} disabledReason="1つ以上のロールを選んでください" onClick={() => { setRoleEdit(null); toast({ kind: "success", message: "ロールを変更しました。変更は監査ログに記録されます" }); }}>保存</Button>
          </>
        }
      >
        <div className="grid cols-2" style={{ ["--gap" as string]: "10px" }}>
          {DIRECT_ROLES.map((r) => (
            <Checkbox
              key={r.name}
              label={r.name}
              description={r.ops}
              checked={roleDraft.includes(r.name)}
              onChange={(c) => setRoleDraft((d) => (c ? [...d, r.name] : d.filter((x) => x !== r.name)))}
            />
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 12 }}>ロールを変えても閲覧範囲と判断権限は自動では変わりません。</p>
      </Modal>

      <ConfirmDialog
        open={Boolean(disabling)}
        onClose={() => setDisabling(null)}
        onConfirm={() => toast({ kind: "success", message: `${disabling?.name ?? ""} さんを無効にしました`, undo: () => undefined })}
        title="利用者を無効にしますか？"
        message={`${disabling?.name ?? ""} さんはサインインできなくなります。過去の判断記録と監査ログはそのまま残ります。判断待ちの案件は別の判断者へ回付が必要です。`}
        confirmLabel="無効にする"
        danger
      />
    </SettingsLayout>
  );
}
