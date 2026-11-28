// 画面ID: V-07 署名と検証
import { useState } from "react";
import "./audit.css";
import { useScreenState } from "../../lib/router";
import { ORG, PROJECT, paths } from "../../lib/paths";
import { signingKeys, transparencyLog, verifyHistory, VERIFY_FAILURE } from "../../mocks/audit";
import type { SigningKey, VerifyFailure } from "../../mocks/audit";
import { formatDate } from "../../lib/format";
import {
  Banner,
  Button,
  ConfirmDialog,
  ErrorState,
  IdLink,
  KeyValueList,
  Section,
  Segmented,
  SettingsLayout,
  Skeleton,
  StatCard,
  StatusBadge,
  SyncBadge,
  Tag,
  Timestamp,
  useToast,
} from "../../ui";

const KEY_STATUS: Record<SigningKey["status"], { label: string; tone: "pass" | "info" | "neutral" | "fail" }> = {
  active: { label: "使用中", tone: "pass" },
  scheduled: { label: "切替予定", tone: "info" },
  retired: { label: "検証のみ", tone: "neutral" },
  revoked: { label: "失効", tone: "fail" },
};

export function SigningScreen({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [rotate, setRotate] = useState(false);
  const logDown = state === "logDown";
  const keys = state === "rotationDue" ? signingKeys.map((k) => (k.id === "key-v3" ? { ...k, rotates_at: "2026-12-01（4日後）" } : k)) : signingKeys;
  const failures = verifyHistory.filter((v) => v.result === "fail");
  const byReason = failures.reduce<Partial<Record<VerifyFailure, number>>>((acc, v) => {
    if (v.reason) acc[v.reason] = (acc[v.reason] ?? 0) + 1;
    return acc;
  }, {});
  const rows = filter === "fail" ? failures : filter === "pass" ? verifyHistory.filter((v) => v.result === "pass") : verifyHistory;

  return (
    <SettingsLayout
      org={org}
      active="signing"
      title="署名と検証"
      description="Evidence Manifest の署名に使う鍵、透明性ログ、定期検証の結果です。検証に失敗した証跡は通過として扱いません。"
      actions={<Button icon="refresh" onClick={() => toast({ kind: "success", message: "全 Manifest の再検証を開始しました（モック）" })}>すべて再検証</Button>}
    >
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {failures.length ? (
            <Banner tone="fail" title={`検証に失敗した Manifest が ${failures.length} 件あります`}>
              {Object.entries(byReason).map(([k, n], i) => `${i > 0 ? "、" : ""}${VERIFY_FAILURE[k as VerifyFailure].label} ${n}件`).join("")}。
              該当する統制項目は「検証失敗」と表示され、充足に数えません。監査パックにも失敗の記録をそのまま含めます。
            </Banner>
          ) : null}
          {logDown ? (
            <Banner tone="warn" title="透明性ログへの記録が止まっています">
              2026-11-27 09:40 から記録に失敗しています。新しい署名は保留キューに入り、記録が再開した後に完了します。保留中の Manifest は「署名待ち」と表示されます。
            </Banner>
          ) : null}
          {state === "rotationDue" ? (
            <Banner tone="info" title="署名鍵の切替が近づいています" action={<Button size="sm" onClick={() => setRotate(true)}>切替を確認</Button>}>
              alias/evidence-signer-v3 から v4 へ 2026-12-01 に切り替えます。過去の署名は旧鍵で検証できます。
            </Banner>
          ) : null}

          <div className="grid auto-fit">
            <StatCard label="検証済みの Manifest" icon="shieldCheck" value="39" unit="件" delta="直近の定期検証で一致" tone="good" />
            <StatCard label="検証失敗" icon="shieldX" value={failures.length} unit="件" delta="理由別の内訳は下の履歴" tone={failures.length ? "danger" : undefined} />
            <StatCard label="最終の定期検証" icon="clock" value="09:00" delta="毎日 09:00（JST）に全件" />
          </div>

          <Section title="署名鍵" sub="鍵は鍵管理サービスの外に出せません。署名サービスだけが使い、組織管理者も秘密鍵を取り出せません" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>鍵</th><th>状態</th><th>管理先</th><th>方式</th><th>指紋</th><th>作成</th><th>切替</th></tr></thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id}>
                      <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="mono small strong">{k.alias}</span><span className="tiny muted">{k.used_for}</span></div></td>
                      <td><StatusBadge vocab={KEY_STATUS[k.status]} size="sm" /></td>
                      <td className="small">{k.provider}</td>
                      <td className="small">{k.algorithm}</td>
                      <td className="mono tiny">{k.fingerprint.slice(0, 16)}…</td>
                      <td className="small">{formatDate(k.created_at)}</td>
                      <td className="small">{k.rotates_at ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row between" style={{ padding: "12px 16px" }}>
              <span className="small muted">鍵の切替は組織管理者が申請し、CTO が承認します（同じ人は承認できません）。</span>
              <Button size="sm" icon="refresh" onClick={() => setRotate(true)}>鍵の切替を申請</Button>
            </div>
          </Section>

          <Section title="透明性ログ" sub="署名を公開ログに記録し、署名した時刻と内容を第三者が確認できるようにします">
            <KeyValueList
              cols={2}
              items={[
                { label: "記録先", value: transparencyLog.name },
                { label: "状態", value: <SyncBadge status={logDown ? "failing" : transparencyLog.status} /> },
                { label: "最終の記録", value: <Timestamp at={transparencyLog.last_entry_at} mode="absolute" /> },
                { label: "記録件数", value: `${transparencyLog.entries}件` },
              ]}
            />
          </Section>

          <div className="stack" style={{ ["--gap" as string]: "10px" }}>
            <div className="row between">
              <div>
                <h2 className="section-title">検証の履歴</h2>
                <p className="section-sub">定期検証、監査パック生成時の検証、評価者による検証の結果</p>
              </div>
              <Segmented value={filter} onChange={setFilter} options={[{ value: "all", label: "すべて" }, { value: "fail", label: "失敗" }, { value: "pass", label: "一致" }]} />
            </div>
            <div className="card flush table-wrap">
              <table className="table">
                <thead><tr><th>日時</th><th>Manifest</th><th>結果</th><th>理由</th><th>詳細</th><th>実施</th></tr></thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v.id}>
                      <td><Timestamp at={v.at} mode="absolute" /></td>
                      <td><IdLink id={v.manifest} to={paths.manifest(org, PROJECT, v.manifest)} /></td>
                      <td>{v.result === "pass" ? <Tag tone="pass" icon="check">一致</Tag> : <Tag tone="fail" icon="xCircle">失敗</Tag>}</td>
                      <td className="small">{v.reason ? VERIFY_FAILURE[v.reason].label : "—"}</td>
                      <td className="small">{v.detail}</td>
                      <td className="small">{v.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Section title="失敗の理由" sub="どの理由でも、通過・充足として扱いません">
            <div className="grid cols-2">
              {(Object.keys(VERIFY_FAILURE) as VerifyFailure[]).map((k) => (
                <div key={k} className="card tight stack" style={{ ["--gap" as string]: "4px" }}>
                  <strong className="small">{VERIFY_FAILURE[k].label}</strong>
                  <span className="small muted">{VERIFY_FAILURE[k].description}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="評価者による独立した検証">
            <p className="small">
              監査パックには、各ファイルのハッシュ、署名、透明性ログの記録番号と、評価者が自分の環境で照合するための手順書（VERIFY.md）を含めます。製品の検証結果を信じる必要はありません。
            </p>
            <div className="row">
              <Button size="sm" variant="ghost" icon="package" to={paths.auditExport(org, PROJECT)}>監査パックの出力</Button>
              <Button size="sm" variant="ghost" icon="archive" to={paths.evidenceSettings(org)}>証跡の保管</Button>
            </div>
          </Section>
        </>
      )}
      <ConfirmDialog
        open={rotate}
        onClose={() => setRotate(false)}
        title="署名鍵の切替を申請しますか"
        message="切替は CTO（森 由紀子）の承認後、指定日に行われます。過去の署名は旧鍵で引き続き検証できます。"
        confirmLabel="申請する"
        onConfirm={() => toast({ kind: "success", message: "鍵の切替を申請しました。承認者に通知しました" })}
      />
    </SettingsLayout>
  );
}
