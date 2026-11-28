// 画面ID: S-10 閲覧範囲と判断権限
// 経営層ごとに閲覧範囲（組織・事業部・顧客・案件・機密区分）と判断権限（種類・金額の上限）を明示的に設定する。役職から自動では付与しない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { DATA_CLASS } from "../../lib/vocab";
import type { DataClass } from "../../lib/vocab";
import { userById } from "../../mocks/core";
import { scopeRows, sodRules } from "../../mocks/settings";
import { Banner, Button, Combobox, DataClassBadge, ErrorState, Modal, RoleBadge, Section, Select, SettingsLayout, Skeleton, Tag, Toggle, useToast } from "../../ui";

export function S10Scopes({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [orgWide, setOrgWide] = useState(false);
  const readOnly = state === "閲覧のみ";
  const rows = state === "未設定あり" ? [...scopeRows.slice(0, 3), { ...scopeRows[3], scope: { ...scopeRows[3].scope, projects: [], divisions: [], customers: [] }, limits: [] }] : scopeRows;
  const target = rows.find((r) => r.user_id === editing);

  return (
    <SettingsLayout
      org={org}
      active="scopes"
      title="閲覧範囲と判断権限"
      description="経営層ごとに、閲覧できる範囲と判断できる種類・金額を設定します。役職やロールから自動では付与しません。変更は監査ログに記録され、変更者以外の組織管理者の確認が必要です。"
    >
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {readOnly ? <Banner tone="info">閲覧範囲と判断権限を変更できるのは組織管理者です。あなたは閲覧のみできます。</Banner> : null}
          {state === "未設定あり" ? (
            <Banner tone="warn" title="閲覧範囲が未設定の利用者がいます">岡田 真理さんは招待中で、閲覧範囲が設定されていません。設定するまで、どの案件も表示されません。</Banner>
          ) : null}

          <Section title="閲覧範囲" sub="閲覧範囲の外にある案件・顧客は、一覧・検索・通知の件数にも表示されません" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>利用者</th><th>組織全体</th><th>事業部</th><th>顧客</th><th>案件</th><th>機密区分の上限</th><th /></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const u = userById(r.user_id);
                    const empty = r.scope.projects.length === 0;
                    return (
                      <tr key={r.user_id}>
                        <td>
                          <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                            <span className="strong small">{u?.name}</span>
                            <span className="row" style={{ ["--gap" as string]: "4px" }}>{u?.roles.map((x) => <RoleBadge key={x} role={x} />)}</span>
                          </div>
                        </td>
                        <td>{r.scope.orgWide ? <Tag tone="info" square>全社</Tag> : <span className="muted small">—</span>}</td>
                        <td className="small">{r.scope.divisions.join("、") || <Tag tone="warn" square>未設定</Tag>}</td>
                        <td className="small">{r.scope.customers.join("、") || <Tag tone="warn" square>未設定</Tag>}</td>
                        <td className="small">{empty ? <Tag tone="warn" square>未設定</Tag> : r.scope.projects.join("、")}</td>
                        <td><DataClassBadge value={r.scope.maxClass as DataClass} /></td>
                        <td style={{ textAlign: "right" }}><Button size="sm" variant="ghost" icon="edit" disabled={readOnly} disabledReason="組織管理者のみ変更できます" onClick={() => { setEditing(r.user_id); setOrgWide(r.scope.orgWide); }}>変更</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="判断権限" sub="経営判断の種類ごとに、判断できる上限を決めます。上限を超える判断は、上位の判断者に回付されます" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>利用者</th><th>判断の種類と上限</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.user_id}>
                      <td className="strong small">{userById(r.user_id)?.name}</td>
                      <td>
                        {r.limits.length === 0 ? (
                          <Tag tone="warn" square>判断権限なし（閲覧のみ）</Tag>
                        ) : (
                          <div className="row" style={{ ["--gap" as string]: "6px" }}>
                            {r.limits.map((l) => (
                              <span key={l.kind} className="badge square tone-neutral">{l.kind}: <strong>{l.max}</strong></span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="職務分離のルール" sub="次のルールはサーバー側で強制します。ここでは変更できません" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>ルール</th><th>対象</th><th>強制の方法</th></tr></thead>
                <tbody>
                  {sodRules.map((r) => (
                    <tr key={r.rule}>
                      <td className="small strong">{r.rule}</td>
                      <td className="small">{r.applies}</td>
                      <td><Tag square icon="lock">{r.enforcement}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      <Modal
        open={Boolean(target)}
        onClose={() => setEditing(null)}
        title={`${userById(target?.user_id)?.name ?? ""} さんの閲覧範囲`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>キャンセル</Button>
            <Button variant="primary" onClick={() => { setEditing(null); toast({ kind: "success", message: "変更を申請しました。別の組織管理者が確認すると反映されます" }); }}>変更を申請</Button>
          </>
        }
      >
        {target ? (
          <div className="stack">
            <Toggle label="組織全体を閲覧できる" description="全社の案件・顧客を閲覧できます。経営者などに限って付与してください" checked={orgWide} onChange={setOrgWide} />
            {orgWide ? (
              <p className="small muted">組織全体を閲覧できるため、事業部・顧客・案件の個別指定は不要です。</p>
            ) : (
              <>
                <Combobox label="事業部" multiple value={target.scope.divisions} options={[{ value: "全事業部", label: "全事業部" }, { value: "受託開発事業部", label: "受託開発事業部" }, { value: "自社サービス事業", label: "自社サービス事業" }]} />
                <Combobox label="顧客" multiple value={target.scope.customers} options={[{ value: "すべて", label: "すべて" }, { value: "架空商事", label: "架空商事株式会社" }, { value: "架空リテール", label: "架空リテール株式会社" }, { value: "—", label: "（自社）" }]} />
                <Combobox label="案件" multiple value={target.scope.projects} options={[{ value: "すべて", label: "すべて" }, { value: "受発注システム刷新", label: "受発注システム刷新" }, { value: "会員アプリ API 開発", label: "会員アプリ API 開発" }, { value: "在庫管理ダッシュボード", label: "在庫管理ダッシュボード" }, { value: "旧基幹データ移行", label: "旧基幹データ移行" }]} />
              </>
            )}
            <Select label="機密区分の上限" defaultValue={target.scope.maxClass} options={(Object.keys(DATA_CLASS) as DataClass[]).map((k) => ({ value: k, label: DATA_CLASS[k].label }))} help="上限より高い機密区分の案件は、名前も表示されません" />
          </div>
        ) : null}
      </Modal>
    </SettingsLayout>
  );
}
