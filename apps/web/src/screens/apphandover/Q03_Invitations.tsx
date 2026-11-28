// 画面ID: Q-03 App Store Connect の作業者招待
// 顧客のチームの権限者が承認した宛先・役割・対象アプリだけを、許可された API で招待・照会・取消する（資料 58）。
// 招待先は本人の Apple Account で参加する。未処理一覧から消えた招待は所属状況と照合し、受諾・取消・期限切れを取り違えない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { formatDate, formatDateTime } from "../../lib/format";
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  ExternalActor,
  PageHeader,
  ProjectLayout,
  Section,
  Skeleton,
  Tag,
  useToast,
} from "../../ui";
import { INVITATION_STATE, ROLE_SCOPE, ascInvitations } from "../../mocks/apphandover";
import type { AscInvitation } from "../../mocks/apphandover";
import { HandoverSteps, PR, orgOf } from "./parts";

export const Q03_STATES = ["通常", "照合の結果: 参加済み", "照合の結果: 期限切れ", "重複の防止", "空", "読み込み中", "エラー"];

export function Q03Invitations({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const toast = useToast();
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Record<string, boolean>>({});

  const rows: AscInvitation[] = state === "空" ? [] : ascInvitations.map((i) => {
    if (i.state !== "reconciling") return i;
    if (state === "照合の結果: 参加済み") return { ...i, state: "accepted", note: "所属一覧に参加済みとして見つかりました（未処理一覧から消えたのは受諾のため）" };
    if (state === "照合の結果: 期限切れ") return { ...i, state: "expired", note: "所属一覧にいないため期限切れと判定しました。再招待には顧客の再承認が必要です" };
    return i;
  });
  const reconciling = rows.filter((r) => r.state === "reconciling");
  const duplicate = state === "重複の防止";

  const create = (inv: AscInvitation) => {
    setSending(inv.id);
    window.setTimeout(() => {
      setSending(null);
      setSent((s) => ({ ...s, [inv.id]: true }));
      toast({ kind: "success", message: `${inv.name} さんへの招待を作成しました。受付番号 ${inv.id}-A` });
    }, 700);
  };

  return (
    <ProjectLayout org={org} project={PR} active="appHandover" trail={[{ label: "アプリの引き渡し" }, { label: "作業者の招待" }]}>
      <PageHeader
        title="App Store Connect の作業者招待"
        description="顧客のチームの権限者が承認した宛先・役割・対象アプリだけを招待します。招待された人は、自分の Apple Account で参加します。"
      />
      <HandoverSteps org={org} active="Q-03" />
      {state === "読み込み中" ? (
        <Skeleton />
      ) : state === "エラー" ? (
        <ErrorState title="招待の一覧を取得できませんでした" description="App Store Connect からの取得に失敗しました。最後に取得した一覧は 2026/12/08 10:05 のものです。再試行してください。" />
      ) : (
        <>
          <Banner tone="info" title="本サービスが行うのは、承認済みの招待の作成・未処理の照会・取消だけです">
            招待の承認は顧客のチームの権限者（藤井 晃）が行います。招待の受諾は、招待された本人が Apple 上で行います。
          </Banner>
          {reconciling.length ? (
            <Banner tone="warn" title={`未処理の一覧から消えた招待が ${reconciling.length} 件あります`}>
              受諾・取消・期限切れのどれかを、チームの所属一覧と照合して確定します。照合が終わるまで「参加済み」とは扱いません。
            </Banner>
          ) : null}
          {duplicate ? (
            <Banner tone="fail" title="同じ宛先への招待が既にあります">
              松田 亮（matsuda@freelance.example）には未処理の招待（INV-01）があります。重複して作成しないため、新しい招待は作成できません。必要なら既存の招待を取り消してから作り直してください。
            </Banner>
          ) : null}

          <Section title="招待の一覧" sub="最終照会 2026/12/08 10:05" flush>
            {rows.length === 0 ? (
              <div className="card"><EmptyState icon="users" title="まだ招待はありません" description="顧客のチームの権限者が宛先・役割・対象アプリを承認すると、ここから招待を作成できます。" /></div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>宛先</th><th>役割と範囲</th><th>承認</th><th>状態</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((i) => {
                      const scope = ROLE_SCOPE[i.role];
                      const st = sent[i.id] ? INVITATION_STATE.pending : INVITATION_STATE[i.state];
                      return (
                        <tr key={i.id}>
                          <td><div className="strong small">{i.name}</div><div className="tiny muted">{i.email}</div></td>
                          <td>
                            <div className="row" style={{ ["--gap" as string]: "6px" }}><Tag square>{i.role}</Tag><span className="small">{i.apps}</span></div>
                            {!scope.appScoped ? <div className="tiny" style={{ color: "var(--tone-warn)" }}>{scope.note}</div> : null}
                          </td>
                          <td>{i.approved_by ? <div className="stack" style={{ ["--gap" as string]: "2px" }}><ExternalActor userId={i.approved_by} />{i.approved_at ? <span className="tiny muted">{formatDateTime(i.approved_at)}</span> : null}</div> : <span className="small muted">未承認</span>}</td>
                          <td>
                            <Tag tone={st.tone} square>{st.label}</Tag>
                            {i.expires_at && i.state === "pending" ? <div className="tiny muted">期限 {formatDate(i.expires_at)}</div> : null}
                            {i.note ? <div className="tiny muted">{i.note}</div> : null}
                          </td>
                          <td>
                            {i.state === "awaitingApproval" ? (
                              <Button size="sm" disabled disabledReason="顧客のチームの権限者が承認するまで作成できません">招待を作成</Button>
                            ) : i.state === "pending" && !sent[i.id] ? (
                              <Button size="sm" variant="ghost" icon="x" onClick={() => toast({ kind: "success", message: `${i.id} の招待を取り消しました` })}>取消</Button>
                            ) : i.state === "reconciling" ? (
                              <Button size="sm" icon="refresh" onClick={() => toast({ kind: "info", message: "所属一覧を照会しています" })}>所属と照合</Button>
                            ) : i.state === "expired" ? (
                              <Button size="sm" disabled disabledReason="再招待には顧客の再承認が必要です">再招待</Button>
                            ) : sent[i.id] ? (
                              <span className="tiny muted">受付済み</span>
                            ) : (
                              <span className="tiny muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="承認済みの新しい宛先" sub="顧客の権限者が承認した宛先だけを招待できます">
            <div className="row between">
              <div className="stack" style={{ ["--gap" as string]: "2px" }}>
                <span className="strong small">伊藤 誠（ito@sample-soft.example）</span>
                <span className="tiny muted">Developer · 会員アプリのみ · 承認: 藤井 晃（2026/12/08）</span>
              </div>
              <Button
                variant="primary"
                icon="send"
                loading={sending === "INV-06"}
                disabled={sent["INV-06"] || duplicate}
                disabledReason={sent["INV-06"] ? "作成済みです（二重に作成しません）" : "同じ宛先の招待が既にあります"}
                onClick={() => create({ id: "INV-06", name: "伊藤 誠", email: "ito@sample-soft.example", role: "Developer", apps: "会員アプリのみ", state: "pending" })}
              >
                {sent["INV-06"] ? "作成済み" : "招待を作成"}
              </Button>
            </div>
          </Section>
        </>
      )}
    </ProjectLayout>
  );
}
