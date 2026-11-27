// 画面ID: A-04 組織の作成（オンボーディング 1/7）
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { OnboardingLayout, OptionCard, Select, Tag, TextField } from "../../ui";

const PLANS = [
  { value: "starter", title: "Starter", price: "¥49,800／月", desc: "リポジトリ3件まで。Basic ゲート、AIレビュー、標準の証跡" },
  { value: "team", title: "Team", price: "¥99,800／月", desc: "リポジトリ10件まで。WORM 保管、監査ダッシュボード、SSO" },
  { value: "partner", title: "Partner", price: "¥198,000〜／月", desc: "複数の顧客組織、テンプレート管理、監査パック出力" },
];

export function OrgCreate() {
  const state = useScreenState();
  const err = state === "error";
  const [name, setName] = useState(err ? "" : "サンプルソフト株式会社");
  const [slug, setSlug] = useState(err ? "sample soft!" : "sample-soft");
  const [plan, setPlan] = useState("team");
  return (
    <OnboardingLayout step={0} title="組織を作成" description="組織は、メンバー、プロジェクト、連携、請求の単位です。あとから変更できます。" next={paths.onboardingGithub()} nextDisabled={err} nextDisabledReason="入力内容のエラーを修正してください">
      <div className="grid cols-2">
        <TextField label="組織名" required value={name} onChange={setName} maxLength={60} error={err && !name.trim() ? "組織名を入力してください" : undefined} />
        <TextField label="組織の表示ID" required value={slug} onChange={setSlug} prefix="app.example/o/" help="自動で作成しました。英小文字・数字・ハイフンのみ" error={err ? "英小文字・数字・ハイフンのみ使えます（空白や記号は使えません）" : undefined} />
      </div>
      <Select label="タイムゾーン" defaultValue="Asia/Tokyo" options={[{ value: "Asia/Tokyo", label: "Asia/Tokyo（日本時間）" }, { value: "UTC", label: "UTC" }]} help="監査ログや期限の表示に使います" />
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        <div className="row between">
          <span className="field-label">プラン</span>
          <Tag tone="pass" icon="clock">30日間の無料試用</Tag>
        </div>
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          {PLANS.map((p) => (
            <OptionCard key={p.value} name="plan" value={p.value} checked={plan === p.value} onChange={setPlan} title={p.title} description={p.desc} badge={<span className="strong">{p.price}</span>} />
          ))}
        </div>
        <span className="field-help">試用期間中は請求されません。価格は仮のものです。Private プランはお問い合わせください。</span>
      </div>
    </OnboardingLayout>
  );
}
