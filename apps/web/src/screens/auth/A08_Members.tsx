// 画面ID: A-08 経営層の招待（オンボーディング 8/10）
// 直接利用者（経営層・組織管理者・ポリシー管理者）だけを招待する。開発メンバーの招待は不要。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ROLES } from "../../lib/vocab";
import type { Role } from "../../lib/vocab";
import { Banner, Button, Combobox, useToast } from "../../ui";
import { ExecOnboarding, SkipButton } from "./parts";

type Row = { id: number; who: string; roles: Role[] };

const INITIAL_WARN: Row[] = [
  { id: 1, who: "mori@sample-soft.example", roles: ["CTO", "ポリシー管理者"] },
  { id: 2, who: "ishii@sample-soft.example", roles: ["事業部長"] },
];
const INITIAL_OK: Row[] = [
  { id: 1, who: "mori@sample-soft.example", roles: ["CTO", "案件スポンサー"] },
  { id: 2, who: "ishii@sample-soft.example", roles: ["事業部長"] },
  { id: 3, who: "yamamoto@sample-soft.example", roles: ["組織管理者", "ポリシー管理者"] },
];

const roleOptions = ROLES.filter((r) => r.audience === "direct").map((r) => ({ value: r.name, label: r.name, hint: r.ops }));

export function Members() {
  const state = useScreenState();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(state === "ok" ? INITIAL_OK : INITIAL_WARN);
  const all = rows.flatMap((r) => r.roles);
  const warnings: string[] = [];
  if (!all.includes("組織管理者")) warnings.push("組織管理者がいません。あなた（木村 達也）が組織管理者を兼ねます。連携や利用者の管理を任せる人を招待することをおすすめします。");
  rows.filter((r) => r.roles.includes("CTO") && r.roles.includes("ポリシー管理者")).forEach((r) => warnings.push(`${r.who} に CTO（例外の判断）とポリシー管理者が割り当てられています。自分が変更したポリシーへの例外は、別の人が判断する必要があります。`));
  const empty = rows.some((r) => !r.who.trim() || r.roles.length === 0);
  return (
    <ExecOnboarding
      step={7}
      title="経営層を招待"
      description="このサービスにサインインする人（役員、事業部長、案件スポンサー、組織管理者など）を招待します。PM・開発者・QA・顧客の招待は不要です。彼らの活動は接続したシステムの外部IDで記録します。"
      nextLabel="招待を送る"
      nextDisabled={empty}
      nextDisabledReason="空の行を埋めるか削除してください"
      extra={<SkipButton step={7} />}
    >
      {warnings.length ? (
        <Banner tone="warn" title="職務分離の確認">
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
          <div className="tiny muted" style={{ marginTop: 6 }}>このまま進むこともできます。あとで「設定 › 利用者とロール」で変更できます。</div>
        </Banner>
      ) : (
        <Banner tone="pass">職務分離の問題は見つかりませんでした。</Banner>
      )}
      <div className="stack" style={{ ["--gap" as string]: "10px" }}>
        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.3fr) 36px", gap: 10 }}>
          <span className="label">メールアドレス</span>
          <span className="label">ロール</span>
          <span />
        </div>
        {rows.map((r) => (
          <div key={r.id} className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.3fr) 36px", gap: 10, alignItems: "start" }}>
            <input className="input" aria-label="メールアドレス" value={r.who} placeholder="name@example.com" onChange={(e) => setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, who: e.target.value } : x)))} />
            <Combobox multiple options={roleOptions} value={r.roles} onChange={(v) => setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, roles: v as Role[] } : x)))} placeholder="ロールを選択" />
            <Button variant="ghost" iconOnly icon="trash" label="この行を削除" onClick={() => { setRows((xs) => xs.filter((x) => x.id !== r.id)); toast({ kind: "info", message: "行を削除しました" }); }} />
          </div>
        ))}
        <div>
          <Button size="sm" icon="plus" onClick={() => setRows((xs) => [...xs, { id: Date.now(), who: "", roles: [] }])}>行を追加</Button>
        </div>
      </div>
      <Banner tone="info">閲覧範囲（事業部・顧客・案件・機密区分）と判断権限は役職から自動で付与しません。招待後に「設定 › 閲覧範囲と判断権限」で設定します。</Banner>
      <p className="tiny muted">招待メールは7日間有効です。参加時に MFA の設定を求めます。あなた（木村 達也）には経営者と組織管理者のロールが付いています。</p>
    </ExecOnboarding>
  );
}
