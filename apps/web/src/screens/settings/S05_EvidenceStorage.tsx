// 画面ID: S-05 証跡の保管
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG } from "../../lib/paths";
import { Banner, Button, ConfirmDialog, ErrorState, Icon, KeyValueList, RetentionBadge, Section, Select, SettingsLayout, SignatureBadge, Skeleton, Tag, Timestamp, useToast } from "../../ui";

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
          </Section>

          <Section title="保管先と保持期間" sub="保管済みの証跡は、保持期間が終わるまで削除・上書きできません">
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
