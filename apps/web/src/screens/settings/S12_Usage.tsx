// 画面ID: S-12 利用量
// 経営層シート、プロジェクト、保存量、通知量、AI 費用、同期の API 呼び出しを示す。上限時も証跡とゲートは失わない。
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { yen } from "../../lib/format";
import { usage, usageDaily } from "../../mocks/settings";
import { Banner, Button, CoverageMeter, ErrorState, Section, SettingsLayout, Skeleton, Tag } from "../../ui";

export function S12Usage({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const nearLimit = state === "上限間近";
  const ai = nearLimit ? 9600 : usage.aiCost.usedYen;
  const max = Math.max(...usageDaily.map((d) => d.ai));

  return (
    <SettingsLayout
      org={org}
      active="usage"
      title="利用量"
      description={`${usage.period}の利用量です。上限に達しても、記録済みの証跡・監査ログ・ゲートの判定は失われません。`}
      actions={<Button to={paths.billing(org)} icon="creditCard">プランと請求</Button>}
    >
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {nearLimit ? (
            <Banner tone="warn" title="AI の費用が月の予算の 96% に達しました">
              予算（{yen(usage.aiCost.budgetYen)}）に達すると AI 機能だけが月末まで止まります。人の承認、ゲートの判定、同期、通知は続きます。予算は「AIとデータ分類」で変更できます。
            </Banner>
          ) : null}

          <Section title="契約の範囲">
            <div className="grid cols-2">
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <CoverageMeter label="経営層シート" value={usage.seats.used} total={usage.seats.limit} />
                <span className="tiny muted">{usage.seats.note}</span>
              </div>
              <CoverageMeter label="プロジェクト" value={usage.projects.used} total={usage.projects.limit} />
              <CoverageMeter label="連携の接続数" value={usage.connectors.used} total={usage.connectors.limit} />
              <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                <span className="small muted">外部IDで記録したアクター</span>
                <span className="strong">{usage.actors.count}名 <Tag square>課金対象外</Tag></span>
              </div>
            </div>
          </Section>

          <Section title="従量の利用">
            <div className="grid cols-2">
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <CoverageMeter label="保存量（GB）" value={usage.storage.usedGb} total={usage.storage.limitGb} />
                <span className="tiny muted">うち WORM 保管 {usage.storage.wormGb} GB（保持期間中は削除できないため、上限の計算から除外）</span>
              </div>
              <CoverageMeter label="通知の配信数" value={usage.notifications.used} total={usage.notifications.limit} />
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <CoverageMeter label="AI の費用（円）" value={ai} total={usage.aiCost.budgetYen} />
                <span className="tiny muted">プランに含まれる枠 {yen(usage.aiCost.includedYen)}。超過分は翌月に請求します</span>
              </div>
              <CoverageMeter label="同期の API 呼び出し" value={usage.syncCalls.used} total={usage.syncCalls.limit} />
            </div>
          </Section>

          <Section title="日ごとの AI 費用（直近7日）" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>日付</th><th>AI 費用</th><th className="num">通知</th><th className="num">同期の呼び出し</th></tr></thead>
                <tbody>
                  {usageDaily.map((d) => (
                    <tr key={d.day}>
                      <td className="small">{d.day}</td>
                      <td>
                        <span className="row nowrap" style={{ ["--gap" as string]: "8px" }}>
                          <span aria-hidden style={{ display: "inline-block", height: 8, borderRadius: 4, width: `${Math.max(4, (d.ai / max) * 120)}px`, background: "var(--primary)" }} />
                          <span className="small">{yen(d.ai)}</span>
                        </span>
                      </td>
                      <td className="num">{d.notify.toLocaleString("ja-JP")}</td>
                      <td className="num">{d.sync.toLocaleString("ja-JP")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="上限に達したときの動作">
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>項目</th><th>止まるもの</th><th>続くもの</th></tr></thead>
                <tbody>
                  <tr><td className="small strong">経営層シート</td><td className="small">新しい利用者の招待</td><td className="small">既存の利用者、外部アクターの記録</td></tr>
                  <tr><td className="small strong">プロジェクト</td><td className="small">新しいプロジェクトの作成</td><td className="small">既存プロジェクトの同期・ゲート・証跡</td></tr>
                  <tr><td className="small strong">保存量</td><td className="small">新しい文書ファイルの取込み</td><td className="small">証跡と監査ログの記録（上限を超えても保存）</td></tr>
                  <tr><td className="small strong">通知</td><td className="small">低い重大度の通知（集約して日次の要約に）</td><td className="small">緊急・高の通知、アプリ内通知</td></tr>
                  <tr><td className="small strong">AI 費用</td><td className="small">AI の所見・要約・下書き</td><td className="small">人の承認、ゲートの判定、同期</td></tr>
                  <tr><td className="small strong">同期の呼び出し</td><td className="small">定期の全件照合の頻度を下げる</td><td className="small">Webhook による差分同期</td></tr>
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </SettingsLayout>
  );
}
