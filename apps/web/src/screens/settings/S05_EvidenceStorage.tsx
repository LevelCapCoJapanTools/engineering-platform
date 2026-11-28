// 画面ID: S-05 証跡の保管
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { legalHolds, storageTargets } from "../../mocks/audit";
import { userById } from "../../mocks/core";
import { Banner, Button, ConfirmDialog, ErrorState, Icon, KeyValueList, ProviderBadge, Radio, RetentionBadge, Section, Select, SettingsLayout, SignatureBadge, Skeleton, StatusBadge, Tag, Timestamp, useToast } from "../../ui";

const RETENTION = [
  { value: "5", label: "5年" },
  { value: "7", label: "7年" },
  { value: "10", label: "10年" },
  { value: "15", label: "15年" },
];
const CURRENT = "7";

export function S05EvidenceStorage({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [years, setYears] = useState(CURRENT);
  const [confirm, setConfirm] = useState(false);
  const failed = state === "保管失敗";
  const holdActive = state !== "読み込み中" && state !== "エラー";
  const [afterExpiry, setAfterExpiry] = useState("review");

  return (
    <SettingsLayout org={org} active="evidence" title="証跡の保管" description="Evidence Manifest に署名し、Git サービスとは別の信頼境界にある追記専用の保管先（WORM）へ保存します。">
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {failed ? (
            <Banner tone="fail" title="直近の保管に失敗しました" action={<Button variant="primary" icon="refresh">再試行</Button>}>
              MAN-0014 の保管が 2026-11-26 18:22 から失敗しています（保管先への書き込み権限エラー）。署名は完了しており、保管できるまで再試行を続けます。
            </Banner>
          ) : null}

          <Section title="署名" sub="Manifest の改ざんを検出できるよう、作成時に暗号署名します">
            <KeyValueList
              items={[
                { label: "署名方式", value: <span className="row"><Icon name="signature" size={14} />短期証明書による署名（キーレス）と透明性ログへの記録</span> },
                { label: "署名者の ID", value: <span className="mono small">signer@sample-soft.app.example</span> },
                { label: "現在の状態", value: <SignatureBadge state="verified" /> },
                { label: "検証", value: <span className="small muted">評価者は監査パックに含まれる検証手順で、署名を独立に確認できます</span> },
              ]}
            />
            <div className="row" style={{ marginTop: 8 }}><Button size="sm" variant="ghost" icon="signature" to={paths.signing(org)}>署名鍵と検証の履歴</Button></div>
          </Section>

          <Section title="保管先" sub="Git サービス・本サービスのデータベースとは別の信頼境界にある、追記専用（WORM）の保管先" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>保管先</th><th>状態</th><th>保存地域</th><th>バックアップ地域</th><th>削除の防止</th><th>保管中</th></tr></thead>
                <tbody>
                  {storageTargets.map((t) => (
                    <tr key={t.provider}>
                      <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><ProviderBadge provider={t.provider} showStatus /><span className="mono tiny muted">{t.name}</span></div></td>
                      <td>{t.status === "active" ? <StatusBadge vocab={{ label: "使用中（主）", tone: "pass" }} size="sm" /> : <Tag>未接続</Tag>}</td>
                      <td className="small">{t.region}</td>
                      <td className="small">{t.backup_region}</td>
                      <td className="small">{t.mode}</td>
                      <td className="small">{t.objects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row between" style={{ padding: "10px 16px" }}>
              <span className="small muted">保存地域の変更は、契約で定めた地域の範囲内でのみ行えます。既存の証跡は移動せず、新しい保管先に追記します。</span>
              <Button size="sm" icon="plug" to={paths.connectorNew(org)}>保管先を追加</Button>
            </div>
          </Section>

          <Section title="保持期間" sub="保管済みの証跡は、保持期間が終わるまで削除・上書きできません">
            <div className="stack">
              <KeyValueList
                items={[
                  { label: "保管先", value: <span className="row"><Icon name="archive" size={14} />追記専用オブジェクトストレージ（東京リージョン、コンプライアンスモード）</span> },
                  { label: "信頼境界", value: "Git サービス・本サービスのデータベースとは別のアカウントで管理" },
                  { label: "保管中", value: "Manifest 42件、関連ファイル 318件（1.8 GB）" },
                ]}
              />
              <div className="grid cols-2">
                <Select
                  label="保持期間"
                  value={years}
                  onChange={setYears}
                  options={RETENTION.map((r) => ({ ...r, disabled: Number(r.value) < Number(CURRENT), label: Number(r.value) < Number(CURRENT) ? `${r.label}（短縮できません）` : r.label }))}
                  help="契約や社内規程で求められる期間を選んでください"
                />
              </div>
              <Banner tone="info" title="保持期間は延長のみできます">
                保管済みの証跡の保持期間を短くすることはできません。延長は保管済みの証跡にも適用されます。現在の設定: 7年。
              </Banner>
              <div className="row end">
                <Button variant="primary" disabled={years === CURRENT} disabledReason="変更はありません" onClick={() => setConfirm(true)}>保持期間を変更</Button>
              </div>
            </div>
          </Section>

          <Section title="法的保全" sub="保全中の証跡は、保持期限を過ぎても削除しません。設定と解除は経営者または組織管理者が行い、すべて記録します">
            {holdActive ? (
              <Banner tone="info" title="法的保全が 1 件有効です">LH-002: 受発注システム刷新の全証跡（2026-10-12 から）。</Banner>
            ) : null}
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table className="table compact">
                <thead><tr><th>ID</th><th>対象</th><th>理由</th><th>設定</th><th>状態</th></tr></thead>
                <tbody>
                  {legalHolds.map((h) => (
                    <tr key={h.id}>
                      <td className="mono small">{h.id}</td>
                      <td className="small">{h.target}</td>
                      <td className="small">{h.reason}</td>
                      <td className="small">{userById(h.set_by)?.name} · <Timestamp at={h.set_at} mode="absolute" /></td>
                      <td>{h.status === "active" ? <StatusBadge vocab={{ label: "保全中", tone: "special" }} size="sm" /> : <Tag>解除済み</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row end" style={{ marginTop: 8 }}><Button size="sm" icon="lock" onClick={() => toast({ kind: "success", message: "法的保全の設定画面を開きました（モック）" })}>法的保全を設定</Button></div>
          </Section>

          <Section title="保持期間が終わった証跡の扱い" sub="期限満了後も、法的保全中のものは削除しません">
            <div className="stack" style={{ ["--gap" as string]: "8px" }}>
              <Radio name="afterExpiry" value="review" checked={afterExpiry === "review"} onChange={setAfterExpiry} label="一覧で確認してから削除する（既定）" description="期限満了の30日前に組織管理者へ通知し、確認後に削除します。削除の記録は監査ログに残ります" />
              <Radio name="afterExpiry" value="auto" checked={afterExpiry === "auto"} onChange={setAfterExpiry} label="期限満了後に自動で削除する" description="保管先のライフサイクル設定で削除します。削除した証跡の ID とハッシュは監査ログに残ります" />
              <Radio name="afterExpiry" value="keep" checked={afterExpiry === "keep"} onChange={setAfterExpiry} label="削除しない" description="保管費用が増え続けます。プランの保存量の上限に注意してください" />
            </div>
          </Section>

          <Section title="契約条件との対応" sub="保存地域・保持・削除は、顧客との契約と一致している必要があります">
            <KeyValueList
              cols={2}
              items={[
                { label: "保存地域", value: "日本国内（契約: 国内保管）" },
                { label: "バックアップ地域", value: "日本国内（契約: 国内保管）" },
                { label: "保持期間", value: "7年（契約: 5年以上）" },
                { label: "組織の解約時", value: "保持期間中の証跡は削除せず、期限満了後に削除して証明書を発行" },
              ]}
            />
          </Section>

          <Section title="保管の状況">
            <div className="grid cols-3">
              <div className="stat">
                <span className="stat-label">最終保管</span>
                <span className="strong">{failed ? "MAN-0013" : "MAN-0014"}</span>
                <span className="stat-delta"><Timestamp at={failed ? "2026-11-05T17:06:00+09:00" : "2026-11-26T18:23:00+09:00"} mode="absolute" /></span>
              </div>
              <div className={failed ? "stat danger" : "stat"}>
                <span className="stat-label">保管待ち・失敗</span>
                <span className="stat-value">{failed ? 1 : 0}<span className="unit">件</span></span>
                <span className="stat-delta">{failed ? "再試行中（12回目）" : "すべて保管済み"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">保持期限が最も近い証跡</span>
                <span className="strong">2033-08-01</span>
                <span className="stat-delta"><RetentionBadge state="stored" /></span>
              </div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              {failed ? <Tag tone="fail" icon="xCircle">保管先への書き込みに失敗</Tag> : <Tag tone="pass" icon="checkCircle">直近30日の失敗なし</Tag>}
            </div>
          </Section>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => toast({ kind: "success", message: `保持期間を${years}年に変更しました` })}
        title={`保持期間を${years}年に延長しますか？`}
        message="延長後は、この期間より短くすることはできません。保管済みの証跡にも適用されます。"
        confirmLabel="延長する"
      />
    </SettingsLayout>
  );
}
