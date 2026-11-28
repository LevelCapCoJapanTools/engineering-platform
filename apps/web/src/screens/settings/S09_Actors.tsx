// 画面ID: S-09 外部アクターの対応付け
// PM・開発者・QA・顧客などはアカウントを持たず、外部IDで活動を記録する。ここで外部ID ↔ 人 ↔ 役割を対応付ける。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import type { Role } from "../../lib/vocab";
import { actorMappings } from "../../mocks/settings";
import type { ActorMapping } from "../../mocks/settings";
import { Banner, Button, Combobox, EmptyState, ErrorState, FilterBar, Modal, ProviderBadge, RoleBadge, Section, SettingsLayout, Skeleton, Tag, TextField, useToast } from "../../ui";
import { ExternalInvitesSection } from "./trade2";

const STATUS: Record<ActorMapping["status"], { label: string; tone: "pass" | "warn" | "fail" | "neutral" }> = {
  active: { label: "対応付け済み", tone: "pass" },
  unmapped: { label: "未対応付け", tone: "warn" },
  conflict: { label: "重複の可能性", tone: "warn" },
  departed: { label: "退職・無効", tone: "neutral" },
};

const ACTOR_ROLES: Role[] = ["PM", "アナリスト", "設計者", "開発者", "QA", "リリース管理者", "顧客"];

export function S09Actors({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<ActorMapping | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [draftName, setDraftName] = useState("");

  const list = state === "空" ? [] : actorMappings;
  const rows = list.filter((a) => `${a.name} ${a.ids.map((i) => i.handle).join(" ")}`.includes(q) && (!filters.status || a.status === filters.status));
  const unmapped = list.filter((a) => a.status === "unmapped" || a.status === "conflict").length;
  const departed = list.filter((a) => a.status === "departed");
  const propagationFailed = departed.some((d) => d.propagation?.some((p) => p.state !== "done"));

  const open = (a: ActorMapping) => {
    setEditing(a);
    setDraftRoles(a.roles);
    setDraftName(a.status === "unmapped" ? "" : a.name);
  };

  return (
    <SettingsLayout
      org={org}
      active="actors"
      title="外部アクターの対応付け"
      description="このサービスにサインインしない人（PM、開発者、QA、顧客など）の外部IDを、人と役割に対応付けます。活動の記録や職務分離の確認は、この対応付けを使って行います。"
    >
      {state === "読み込み中" ? (
        <Skeleton />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <div className="grid auto-fit">
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">対応付け済み</span><strong style={{ fontSize: "var(--text-xl)" }}>{list.filter((a) => a.status === "active").length}名</strong></div>
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">要確認（未対応付け・重複）</span><strong style={{ fontSize: "var(--text-xl)", color: unmapped ? "var(--tone-warn)" : undefined }}>{unmapped}件</strong></div>
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">退職・無効</span><strong style={{ fontSize: "var(--text-xl)" }}>{departed.length}名</strong></div>
            <div className="card tight stack" style={{ ["--gap" as string]: "2px" }}><span className="tiny muted">課金</span><strong style={{ fontSize: "var(--text-md)" }}>対象外</strong></div>
          </div>

          {unmapped ? (
            <Banner tone="warn" title={`対応付けが必要な外部IDが ${unmapped} 件あります`}>
              対応付けるまで、その外部IDによるレビューや承認は「本人不明」として記録され、職務分離の確認ができません。同一人物の別IDの可能性があるものは統合してください。
            </Banner>
          ) : null}
          {propagationFailed || state === "反映失敗" ? (
            <Banner tone="fail" title="退職者の権限失効が一部の連携先に反映されていません" action={<Button size="sm" icon="external" to={paths.oncall(org)}>オンコールを確認</Button>}>
              加藤 遥さん: PagerDuty の当番に残っています。オンコール管理サービスで交代してください。反映されるまで、通知とエスカレーションの宛先から自動で外しています。
            </Banner>
          ) : null}

          <FilterBar
            search={q}
            onSearch={setQ}
            searchPlaceholder="名前・外部IDで検索"
            values={filters}
            onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
            filters={[{ key: "status", label: "状態", options: Object.entries(STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
          />

          {list.length === 0 ? (
            <div className="card">
              <EmptyState icon="link" title="外部IDはまだありません" description="コードホスティングや課題管理を接続すると、活動した人の外部IDがここに集まります。" action={<Button variant="primary" icon="plug" to={paths.connectors(org)}>連携を設定</Button>} />
            </div>
          ) : rows.length === 0 ? (
            <div className="card"><EmptyState variant="filtered" title="条件に一致するアクターはいません" description="絞り込み条件を変更してください。" /></div>
          ) : (
            <div className="card flush">
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>人</th><th>役割</th><th>外部ID</th><th>状態</th><th /></tr></thead>
                  <tbody>
                    {rows.map((a, i) => (
                      <tr key={`${a.name}-${i}`}>
                        <td className="strong small">{a.name}</td>
                        <td><span className="row" style={{ ["--gap" as string]: "4px" }}>{a.roles.length ? a.roles.map((r) => <RoleBadge key={r} role={r as Role} />) : <span className="muted small">—</span>}</span></td>
                        <td>
                          <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                            {a.ids.map((x) => (
                              <span key={`${x.provider}-${x.handle}`} className="row nowrap" style={{ ["--gap" as string]: "6px" }}>
                                <ProviderBadge provider={x.provider} size="sm" />
                                <span className="mono tiny">{x.handle}</span>
                                {!x.verified ? <Tag tone="warn" square>未確認</Tag> : null}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                            <Tag tone={STATUS[a.status].tone} square>{STATUS[a.status].label}</Tag>
                            {a.departed_at ? <span className="tiny muted">{a.departed_at} 退職</span> : null}
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Button size="sm" variant={a.status === "unmapped" || a.status === "conflict" ? "primary" : "ghost"} onClick={() => open(a)}>
                            {a.status === "unmapped" ? "対応付ける" : a.status === "conflict" ? "確認する" : "詳細"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {departed.length ? (
            <Section title="権限失効の反映状況" sub="退職・異動で無効にした人の権限が、連携先・承認・通知・当番から外れたかを確認します">
              {departed.map((d) => (
                <div key={d.name} className="stack" style={{ ["--gap" as string]: "8px" }}>
                  <span className="strong small">{d.name}（{d.departed_at} 退職）</span>
                  <div className="table-wrap">
                    <table className="table compact">
                      <thead><tr><th>反映先</th><th>状態</th><th>補足</th></tr></thead>
                      <tbody>
                        {(d.propagation ?? []).map((p) => (
                          <tr key={p.target}>
                            <td className="small">{p.target}</td>
                            <td>{p.state === "done" ? <Tag tone="pass" square icon="check">反映済み</Tag> : p.state === "pending" ? <Tag tone="info" square icon="clock">反映待ち</Tag> : <Tag tone="fail" square icon="alert">要対応</Tag>}</td>
                            <td className="small muted">{p.note ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="tiny muted">過去の承認・レビュー・テストの記録は、当時の外部IDと本人の対応のまま残ります。</p>
                </div>
              ))}
            </Section>
          ) : null}
          <ExternalInvitesSection org={org} compact />
        </>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.status === "unmapped" ? "外部IDを人に対応付ける" : editing?.status === "conflict" ? "重複の可能性を確認" : `${editing?.name ?? ""} さんの外部ID`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>キャンセル</Button>
            <Button variant="primary" disabled={!draftName.trim() || draftRoles.length === 0} disabledReason="人と役割を入力してください" onClick={() => { setEditing(null); toast({ kind: "success", message: "対応付けを保存しました。過去の記録にも反映します（変更は監査ログに残ります）" }); }}>保存</Button>
          </>
        }
      >
        {editing ? (
          <div className="stack">
            <div className="stack" style={{ ["--gap" as string]: "4px" }}>
              {editing.ids.map((x) => (
                <span key={`${x.provider}-${x.handle}`} className="row" style={{ ["--gap" as string]: "6px" }}>
                  <ProviderBadge provider={x.provider} size="sm" /><span className="mono small">{x.handle}</span>{x.verified ? <Tag tone="pass" square>確認済み</Tag> : <Tag tone="warn" square>未確認</Tag>}
                </span>
              ))}
            </div>
            {editing.status === "conflict" ? <Banner tone="warn">同じ人の可能性がある外部IDが2件あります（nkobayashi と naoto-k）。同一人物なら統合し、別人なら分けて登録してください。AI の候補を使った場合も、確定した人と根拠を記録します。</Banner> : null}
            <TextField label="人（氏名）" required value={draftName} onChange={setDraftName} placeholder="例: 小林 直人" />
            <Combobox label="役割" required multiple options={ACTOR_ROLES.map((r) => ({ value: r, label: r }))} value={draftRoles} onChange={setDraftRoles} help="役割は承認者の候補と職務分離の確認に使います。このサービスへのアカウントは作りません" />
          </div>
        ) : null}
      </Modal>
    </SettingsLayout>
  );
}
