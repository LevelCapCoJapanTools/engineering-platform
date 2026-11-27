// 画面ID: A-10 完了（オンボーディング 7/7）
import { ORG, paths } from "../../lib/paths";
import { Button, EnforcementBadge, GateSummaryStrip, Icon, KeyValueList, OnboardingLayout, PolicyVersionTag, Tag } from "../../ui";

export function Done() {
  return (
    <OnboardingLayout step={6} title="セットアップが完了しました" description="次の PR から、ゲートの結果が GitHub のチェックに表示されます。" back={paths.onboardingAi()}>
      <div className="empty" style={{ padding: "8px 0" }}>
        <span className="empty-icon" style={{ background: "var(--tone-pass-bg)", color: "var(--tone-pass)" }}><Icon name="checkCircle" /></span>
      </div>
      <div className="card tight">
        <KeyValueList
          items={[
            { label: "組織", value: "サンプルソフト株式会社（Team プラン・試用中）" },
            { label: "GitHub", value: <span className="mono small">sample-soft（2 リポジトリ）</span> },
            { label: "プロファイル", value: <PolicyVersionTag pack="Basic Control Pack" version="1.3.0" /> },
            { label: "強制レベル", value: <EnforcementBadge level="warnOnly" showDescription /> },
            { label: "招待したメンバー", value: "4人（招待中）" },
            { label: "AI 機能", value: <span className="row"><Tag tone="pass" square>有効</Tag><span className="small muted">既定のデータ分類: Internal</span></span> },
          ]}
        />
      </div>

      <div className="stack" style={{ ["--gap" as string]: "10px" }}>
        <span className="section-title">最初の PR で起きること</span>
        <div className="mock-frame">
          <div className="bar"><i /><i /><i /></div>
          <div className="stack" style={{ ["--gap" as string]: "10px", padding: 16 }}>
            <div className="row small"><Icon name="pullRequest" className="muted" /> <span className="strong">#1 発注一覧の検索条件を追加</span></div>
            <div className="row" style={{ ["--gap" as string]: "10px", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
              <Icon name="alert" className="text-warn" />
              <span className="mono small grow">Product Name / Gate — 成功（警告 2件）</span>
              <GateSummaryStrip gates={{ A: "pass", B: "warn", C: "pass", D: "pass" }} />
            </div>
            <ol className="small" style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>PR の作成時に、ゲート A〜D が自動で実行されます</li>
              <li>警告の内容と修正方法は、チェックの詳細とこの画面のゲート実行で確認できます</li>
              <li>判定と承認の記録は、証跡として自動で保存されます</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="row">
        <Button variant="primary" size="lg" to={paths.orgHome(ORG)} iconRight="arrowRight">ダッシュボードへ</Button>
        <Button size="lg" icon="plus" to={paths.projectNew(ORG)}>最初のプロジェクトを作る</Button>
      </div>
    </OnboardingLayout>
  );
}
