// 画面ID: A-07 プロファイルとゲートの設定（オンボーディング 6/10）
import { useState } from "react";
import { ENFORCEMENT_LEVEL } from "../../lib/vocab";
import type { EnforcementLevel } from "../../lib/vocab";
import { Banner, Field, Icon, OptionCard, PolicyVersionTag, Tag, Toggle } from "../../ui";
import { ExecOnboarding } from "./parts";

const PREVIEW: Record<EnforcementLevel, string> = {
  warnOnly: "PR のチェックは常に成功になり、問題は「警告」として PR に表示されます。開発は止まりません。",
  soft: "問題があると PR のチェックが失敗します。承認された例外があれば通過できます。",
  hard: "問題があると PR のチェックが失敗し、例外による通過もできません。",
};

export function Profile() {
  const [level, setLevel] = useState<EnforcementLevel>("warnOnly");
  const [required, setRequired] = useState(true);
  return (
    <ExecOnboarding step={5} title="プロファイルとゲートの設定" description="確認する統制項目のセット（Control Pack）と、ゲートをどの程度強制するかを決めます。プロジェクトの開始時に版を固定し、意図せず更新されません。">
      <Field label="対象プロファイル">
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          <OptionCard name="profile" value="basic" checked onChange={() => undefined} title="Basic（ソフトウェア開発）" description="単一チームで単一製品を開発する、小規模な受託開発向け。プロジェクト管理と実装のプロセスを対象にします。" badge={<Tag tone="primary" square>選択済み</Tag>} />
          <OptionCard name="profile" value="entry" checked={false} disabled title="Entry" description="創業初期や小規模案件向けの軽量版" badge={<Tag square>準備中</Tag>} />
          <OptionCard name="profile" value="intermediate" checked={false} disabled title="Intermediate／Advanced" description="複数プロジェクトや組織管理を含む上位のプロファイル" badge={<Tag square>準備中</Tag>} />
        </div>
      </Field>

      <Field label="Control Pack のバージョン" help="案件ごとに固定します。新しいバージョンへの移行は、影響を確認してから明示的に行います。">
        <div className="card tight row between">
          <PolicyVersionTag pack="Basic Control Pack" version="1.3.0" />
          <span className="small muted">統制項目 14件 · 自動ルール 22件 · 2026-11-01 公開</span>
        </div>
      </Field>

      <Field label="強制レベル" help="最初は「警告のみ」で始め、チームが慣れたら段階的に強めることをおすすめします。">
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          {(["warnOnly", "soft", "hard"] as EnforcementLevel[]).map((l) => (
            <OptionCard key={l} name="level" value={l} checked={level === l} onChange={(v) => setLevel(v as EnforcementLevel)} title={ENFORCEMENT_LEVEL[l].label} description={ENFORCEMENT_LEVEL[l].description} badge={l === "warnOnly" ? <Tag tone="pass" square>推奨</Tag> : undefined} />
          ))}
        </div>
      </Field>

      <div className="card tight stack" style={{ ["--gap" as string]: "8px", background: "var(--bg-subtle)" }}>
        <span className="label">開発者から見た PR の表示</span>
        <div className="row" style={{ ["--gap" as string]: "10px" }}>
          <Icon name={level === "warnOnly" ? "alert" : "xCircle"} className={level === "warnOnly" ? "text-warn" : "text-fail"} />
          <span className="mono small">Product Name / Gate B — {level === "warnOnly" ? "成功（警告 2件）" : "失敗: 2件の問題"}</span>
        </div>
        <span className="small muted">{PREVIEW[level]}</span>
      </div>

      <Toggle label="コードホスティングの必須チェックに登録する" checked={required} onChange={setRequired} description="GitHub の必須ステータスチェック、GitLab の External Status Check、Azure Repos のブランチポリシー、CodeCommit の承認ルールなど、接続先の仕組みで必須にします。登録しないと、ゲートが失敗してもマージできてしまいます。" />
      {!required ? <Banner tone="warn">必須チェックに登録しない場合、ゲートの結果は参考表示になります。</Banner> : null}
    </ExecOnboarding>
  );
}
