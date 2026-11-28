// 画面ID: A-04 組織の作成（オンボーディング 1/10）
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { OptionCard, Select, Tag, TextField } from "../../ui";
import { ExecOnboarding } from "./parts";

const PLANS = [
  { value: "starter", title: "Starter", price: "¥49,800／月", desc: "経営層 2 シート・プロジェクト 3。計画・カレンダー同期、ゲート、標準の証跡" },
  { value: "team", title: "Team", price: "¥99,800／月", desc: "経営層 5 シート・プロジェクト 10。WORM 保管、監査ダッシュボード、SSO" },
  { value: "partner", title: "Partner", price: "¥198,000〜／月", desc: "委任された複数の顧客組織、テンプレート管理、監査パック出力" },
];

export function OrgCreate() {
  const state = useScreenState();
  const err = state === "error";
  const [name, setName] = useState(err ? "" : "サンプルソフト株式会社");
  const [slug, setSlug] = useState(err ? "sample soft!" : "sample-soft");
  const [plan, setPlan] = useState("team");
  return (
    <ExecOnboarding step={0} title="組織を作成" description="組織は、利用者、プロジェクト、連携、請求の単位です。課金は経営層のシートとプロジェクト数で決まり、開発メンバーは課金対象外です。" nextDisabled={err} nextDisabledReason="入力内容のエラーを修正してください">
      <div className="grid cols-2">
        <TextField label="組織名" required value={name} onChange={setName} maxLength={60} error={err && !name.trim() ? "組織名を入力してください" : undefined} />
        <TextField label="組織の表示ID" required value={slug} onChange={setSlug} prefix="app.example/o/" help="自動で作成しました。英小文字・数字・ハイフンのみ" error={err ? "英小文字・数字・ハイフンのみ使えます（空白や記号は使えません）" : undefined} />
      </div>
      <div className="grid cols-2">
        <Select label="タイムゾーン" defaultValue="Asia/Tokyo" options={[{ value: "Asia/Tokyo", label: "Asia/Tokyo（日本時間）" }, { value: "UTC", label: "UTC" }]} help="期限、会議、監査ログの表示に使います" />
        <Select label="言語" defaultValue="ja" options={[{ value: "ja", label: "日本語（標準）" }, { value: "en", label: "English" }]} />
      </div>
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
    </ExecOnboarding>
  );
}
