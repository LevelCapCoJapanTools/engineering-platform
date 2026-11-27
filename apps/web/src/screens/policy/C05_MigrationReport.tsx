// 画面ID: C-05 移行レポート
import { useEffect, useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { migrationImpact, packBySlug } from "../../mocks/policy";
import {
  AppLayout,
  ApprovalPanel,
  Banner,
  Button,
  Checkbox,
  ConfirmDialog,
  crumbs,
  DetailLayout,
  Icon,
  KeyValueList,
  MetaSection,
  PageHeader,
  PolicyVersionTag,
  Section,
  StatusBadge,
  useToast,
} from "../../ui";

export function MigrationReport({ org = ORG, pack: slug, id }: { org?: string; pack: string; id: string }) {
  const state = useScreenState();
  const toast = useToast();
  const pack = packBySlug(slug);
  const [approved, setApproved] = useState(state === "approved" || state === "running" || state === "done");
  const [run, setRun] = useState<"idle" | "running" | "done">(state === "running" ? "running" : state === "done" ? "done" : "idle");
  const [selected, setSelected] = useState<string[]>(migrationImpact.filter((m) => m.status !== "blocked").map((m) => m.project));
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    setApproved(state === "approved" || state === "running" || state === "done");
    setRun(state === "running" ? "running" : state === "done" ? "done" : "idle");
  }, [state]);
  return (
    <AppLayout org={org} active="policies" breadcrumb={crumbs(org, undefined, { label: "ポリシー", to: paths.policies(org) }, { label: `${pack.name} ${pack.version}`, to: paths.policy(org, pack.slug) }, { label: `移行レポート ${id}` })}>
      <PageHeader
        id={id}
        title="Control Pack の移行レポート"
        status={run === "done" ? { label: "移行済み", tone: "pass" } : approved ? { label: "承認済み", tone: "pass" } : { label: "承認待ち", tone: "warn" }}
        meta={<><PolicyVersionTag pack={pack.name} version="1.3.0" /><Icon name="arrowRight" size={14} className="muted" /><PolicyVersionTag pack={pack.name} version="1.3.1" /></>}
        actions={<Button variant="primary" icon="play" disabled={!approved || run !== "idle" || selected.length === 0} disabledReason={!approved ? "移行の承認が必要です" : "対象のプロジェクトを選んでください"} onClick={() => setConfirm(true)}>移行を実行</Button>}
      />
      <Banner tone="info">規格改訂やバージョン変更による挙動の変化は自動では適用されません。影響を確認し、承認を得てから移行します。既存の判定結果は旧バージョンのまま保持されます。</Banner>
      {run === "running" ? <Banner tone="info" title="移行を実行しています">対象プロジェクトのゲートを新しいバージョンで再評価しています。</Banner> : null}
      {run === "done" ? <Banner tone="pass" title="移行が完了しました">2件のプロジェクトが Basic Control Pack 1.3.1 に移行しました。以後の判定は新しいバージョンで行われます。</Banner> : null}
      <DetailLayout
        main={
          <Section title="プロジェクトごとの影響" sub="新たに未充足になる統制項目の数" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th className="check-col" /><th>プロジェクト</th><th className="num">新たに未充足</th><th className="num">変更されるルール</th><th>見込み</th></tr></thead>
                <tbody>
                  {migrationImpact.map((m) => (
                    <tr key={m.project}>
                      <td className="check-col"><Checkbox label={<span className="sr-only">{m.project} を対象にする</span>} checked={selected.includes(m.project)} disabled={m.status === "blocked" || run !== "idle"} onChange={() => setSelected((s) => (s.includes(m.project) ? s.filter((x) => x !== m.project) : [...s, m.project]))} /></td>
                      <td className="strong">{m.project}</td>
                      <td className="num">{m.newly_missing}</td>
                      <td className="num">{m.changed_rules}</td>
                      <td>
                        {run === "done" && selected.includes(m.project) ? (
                          <StatusBadge vocab={{ label: "移行済み", tone: "pass" }} size="sm" />
                        ) : run === "running" && selected.includes(m.project) ? (
                          <span className="row small"><span className="spinner" style={{ width: 12, height: 12 }} />実行中</span>
                        ) : (
                          <StatusBadge vocab={m.status === "ready" ? { label: "そのまま移行可", tone: "pass" } : m.status === "attention" ? { label: "対応が必要", tone: "warn" } : { label: "移行前に対応必須", tone: "fail" }} size="sm" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        }
        side={
          <>
            <MetaSection title="移行の承認">
              <ApprovalPanel
                approvers={[{ role: "ポリシー管理者", user_id: "u-yamamoto", status: "approved", decided_at: "2026-11-26T10:00:00+09:00" }, { role: "組織管理者", user_id: approved ? "u-yamamoto" : undefined, status: approved ? "approved" : "pending" }]}
                canDecide={!approved}
                onDecide={(d) => { if (d === "approved") setApproved(true); toast({ kind: "success", message: d === "approved" ? "移行を承認しました" : "移行を差し戻しました" }); }}
              />
            </MetaSection>
            <MetaSection title="概要">
              <KeyValueList stacked items={[{ label: "移行元", value: `${pack.name} 1.3.0` }, { label: "移行先", value: `${pack.name} 1.3.1` }, { label: "作成", value: "山本 結衣 · 2026-11-26" }, { label: "変更点", value: "追加1 / 変更2 / 削除1" }]} />
              <Button size="sm" variant="ghost" icon="compare" to={paths.policyDiff(org, pack.slug)}>変更点を見る</Button>
            </MetaSection>
          </>
        }
      />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="移行を実行しますか"
        message={`${selected.join("、")} を 1.3.1 に移行します。以後のゲート判定は新しいバージョンで行われます。`}
        confirmLabel="移行を実行"
        onConfirm={() => { setRun("running"); window.setTimeout(() => setRun("done"), 1600); }}
      />
    </AppLayout>
  );
}
