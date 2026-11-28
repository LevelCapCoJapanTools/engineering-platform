// 画面ID: A-10 完了（オンボーディング 10/10）
import { ORG, paths } from "../../lib/paths";
import { useScreenState } from "../../lib/router";
import { Banner, Button, EnforcementBadge, Icon, KeyValueList, PolicyVersionTag, ProviderBadge, Tag } from "../../ui";
import { ExecOnboarding } from "./parts";

export function Done() {
  const state = useScreenState();
  const syncing = state === "syncing";
  return (
    <ExecOnboarding step={9} title="セットアップが完了しました" description="接続したシステムからの初回取込みが終わると、経営ダッシュボードとポートフォリオに案件の状況が表示されます。" hideNext>
      <div className="empty" style={{ padding: "8px 0" }}>
        <span className="empty-icon" style={{ background: "var(--tone-pass-bg)", color: "var(--tone-pass)" }}><Icon name="checkCircle" /></span>
      </div>
      {syncing ? (
        <Banner tone="info" title="初回の取込み中です（約 10 分）">GitHub Projects から計画 186 件のうち 74 件、Google Calendar から予定 58 件のうち 58 件を取り込みました。取込みが終わるまで、計画の差異は「判定不可」と表示します。</Banner>
      ) : null}
      <div className="card tight">
        <KeyValueList
          items={[
            { label: "組織", value: "サンプルソフト株式会社（Team プラン・試用中）" },
            { label: "コードホスティング", value: <span className="row"><ProviderBadge provider="github" size="sm" /><span className="mono small">sample-soft（2 リポジトリ）</span></span> },
            { label: "計画・カレンダー", value: <span className="row"><ProviderBadge provider="githubProjects" size="sm" /><ProviderBadge provider="googleCalendar" size="sm" /><span className="small muted">読み取りのみ</span></span> },
            { label: "適用範囲", value: <span className="row"><Tag tone="pass" square>Basic の対象</Tag><span className="small muted">単一チーム・単一製品・非クリティカル</span></span> },
            { label: "プロファイル", value: <PolicyVersionTag pack="Basic Control Pack" version="1.3.0" /> },
            { label: "強制レベル", value: <EnforcementBadge level="warnOnly" showDescription /> },
            { label: "通知", value: <span className="row"><ProviderBadge provider="slack" size="sm" /><span className="small muted">#exec-decisions（判断待ち・遅延・同期停止）</span></span> },
            { label: "招待した経営層", value: "2人（招待中）" },
            { label: "AI 機能", value: <span className="row"><Tag tone="pass" square>有効</Tag><span className="small muted">既定のデータ分類: Internal</span></span> },
          ]}
        />
      </div>

      <div className="stack" style={{ ["--gap" as string]: "10px" }}>
        <span className="section-title">次にすること</span>
        <ol className="small" style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>ポートフォリオで、各案件の計画と予測、同期の鮮度を確認する</li>
          <li>受付中の案件（事業ケース）を登録し、開始・保留・却下を判断する</li>
          <li>招待した経営層の閲覧範囲と判断権限を設定する</li>
        </ol>
      </div>

      <div className="row">
        <Button variant="primary" size="lg" to={paths.portfolio(ORG)} iconRight="arrowRight">ポートフォリオへ</Button>
        <Button size="lg" icon="briefcase" to={paths.intake(ORG)}>案件受付を開く</Button>
        <Button size="lg" variant="ghost" icon="eye" to={paths.scopes(ORG)}>閲覧範囲を設定</Button>
      </div>
    </ExecOnboarding>
  );
}
