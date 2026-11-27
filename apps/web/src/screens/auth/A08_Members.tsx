// 画面ID: A-08 メンバーの招待とロール割当（オンボーディング 5/7）
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { ROLES } from "../../lib/vocab";
import type { Role } from "../../lib/vocab";
import { Banner, Button, Combobox, OnboardingLayout, useToast } from "../../ui";

type Row = { id: number; who: string; roles: Role[] };

const INITIAL_WARN: Row[] = [
  { id: 1, who: "takahashi@sample-soft.example", roles: ["アナリスト"] },
  { id: 2, who: "ytanaka", roles: ["設計者"] },
  { id: 3, who: "sho-w", roles: ["開発者", "リリース管理者"] },
  { id: 4, who: "mito-qa", roles: ["QA"] },
];
const INITIAL_OK: Row[] = [...INITIAL_WARN.slice(0, 2), { id: 3, who: "sho-w", roles: ["開発者"] }, INITIAL_WARN[3], { id: 5, who: "yui-yamamoto", roles: ["組織管理者", "ポリシー管理者"] }, { id: 6, who: "msato-dev", roles: ["PM", "リリース管理者"] }];

const roleOptions = ROLES.filter((r) => r.org === "開発会社").map((r) => ({ value: r.name, label: r.name, hint: r.ops }));

export function Members() {
  const state = useScreenState();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(state === "ok" ? INITIAL_OK : INITIAL_WARN);
  const all = rows.flatMap((r) => r.roles);
  const warnings: string[] = [];
  if (!all.includes("ポリシー管理者")) warnings.push("ポリシー管理者がいません。ゲートのルールや組織での調整を承認できる人が必要です。");
  rows.filter((r) => r.roles.includes("リリース管理者") && r.roles.includes("開発者") && !r.roles.some((x) => x === "PM")).forEach((r) => warnings.push(`${r.who} に「開発者」と「リリース管理者」だけが割り当てられています。自分が実装した変更を自分でリリース承認する状態になります。`));
  if (!all.includes("QA")) warnings.push("QA がいません。テスト結果と検証記録を承認する人が必要です。");
  const empty = rows.some((r) => !r.who.trim() || r.roles.length === 0);
  return (
    <OnboardingLayout
      step={4}
      title="メンバーを招待"
      description="招待する人と、その人のロールを決めます。1人が複数のロールを持てます。顧客はプロジェクトの作成時に招待します。"
      back={paths.onboardingProfile()}
      next={paths.onboardingAi()}
      nextLabel="招待を送る"
      nextDisabled={empty}
      nextDisabledReason="空の行を埋めるか削除してください"
      extra={<Button variant="ghost" to={paths.onboardingAi()}>あとで</Button>}
    >
      {warnings.length ? (
        <Banner tone="warn" title="職務分離の確認">
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
          <div className="tiny muted" style={{ marginTop: 6 }}>このまま進むこともできます。あとで「設定 › メンバーとロール」で変更できます。</div>
        </Banner>
      ) : (
        <Banner tone="pass">職務分離の問題は見つかりませんでした。</Banner>
      )}
      <div className="stack" style={{ ["--gap" as string]: "10px" }}>
        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.3fr) 36px", gap: 10 }}>
          <span className="label">メールアドレスまたは GitHub ユーザー名</span>
          <span className="label">ロール</span>
          <span />
        </div>
        {rows.map((r) => (
          <div key={r.id} className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.3fr) 36px", gap: 10, alignItems: "start" }}>
            <input className="input" aria-label="メールアドレスまたは GitHub ユーザー名" value={r.who} placeholder="name@example.com または GitHub ユーザー名" onChange={(e) => setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, who: e.target.value } : x)))} />
            <Combobox multiple options={roleOptions} value={r.roles} onChange={(v) => setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, roles: v as Role[] } : x)))} placeholder="ロールを選択" />
            <Button variant="ghost" iconOnly icon="trash" label="この行を削除" onClick={() => { setRows((xs) => xs.filter((x) => x.id !== r.id)); toast({ kind: "info", message: "行を削除しました" }); }} />
          </div>
        ))}
        <div>
          <Button size="sm" icon="plus" onClick={() => setRows((xs) => [...xs, { id: Date.now(), who: "", roles: [] }])}>行を追加</Button>
        </div>
      </div>
      <p className="tiny muted">招待メールは7日間有効です。あなた（佐藤 美咲）には組織管理者のロールが付いています。</p>
    </OnboardingLayout>
  );
}
