// 画面ID: A-13 適用範囲の確認（オンボーディング 5/10）
// 組織と開発の条件を記録し、Basic の対象か、対象外・要専門家確認かを示す。判定の基準は自社作成のメタデータで、規格本文ではない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { Banner, Field, OptionCard, Select, Tag } from "../../ui";
import { ExecOnboarding } from "./parts";

type Answer = { size: string; products: string; teams: string; critical: string; approach: string };

const PRESET: Record<string, Answer> = {
  inScope: { size: "11-25", products: "single", teams: "single", critical: "none", approach: "agile" },
  needsExpert: { size: "11-25", products: "single", teams: "multi", critical: "none", approach: "iterative" },
  outOfScope: { size: "26+", products: "multi", teams: "multi", critical: "safety", approach: "waterfall" },
};

function judge(a: Answer): { result: "inScope" | "needsExpert" | "outOfScope"; reasons: string[] } {
  const reasons: string[] = [];
  let result: "inScope" | "needsExpert" | "outOfScope" = "inScope";
  if (a.size === "26+") { result = "outOfScope"; reasons.push("開発に関わる人数が 25 人を超えています"); }
  if (a.critical === "safety") { result = "outOfScope"; reasons.push("安全に関わる（セーフティクリティカル）製品は初期の対象外です"); }
  if (a.critical === "business") { if (result === "inScope") result = "needsExpert"; reasons.push("業務上クリティカルな製品は、専門家による適用判断が必要です"); }
  if (a.products === "multi") { if (result === "inScope") result = "needsExpert"; reasons.push("複数の製品を並行して開発しています（Basic は単一製品を想定）"); }
  if (a.teams === "multi") { if (result === "inScope") result = "needsExpert"; reasons.push("複数のチームで1つの製品を開発しています（Basic は単一チームを想定）"); }
  return { result, reasons };
}

export function Scope() {
  const state = useScreenState();
  const [a, setA] = useState<Answer>(PRESET[state] ?? PRESET.inScope);
  const set = (k: keyof Answer) => (v: string) => setA((x) => ({ ...x, [k]: v }));
  const { result, reasons } = judge(a);
  return (
    <ExecOnboarding
      step={4}
      title="適用範囲の確認"
      description="組織と開発の条件を記録し、初期対象（Basic プロファイル）に当てはまるかを確認します。この確認は製品の対応範囲の目安で、認証や適合の判定ではありません。"
      nextLabel={result === "outOfScope" ? "対象外として記録して進む" : "次へ"}
    >
      <div className="grid cols-2">
        <Select label="開発に関わる人数" value={a.size} onChange={set("size")} options={[{ value: "1-10", label: "1〜10 人" }, { value: "11-25", label: "11〜25 人" }, { value: "26+", label: "26 人以上" }]} help="協力会社を含め、開発組織・部門・プロジェクトの単位で数えます" />
        <Select label="同時に開発する製品" value={a.products} onChange={set("products")} options={[{ value: "single", label: "案件ごとに1つ" }, { value: "multi", label: "1つの案件で複数" }]} />
        <Select label="チームの構成" value={a.teams} onChange={set("teams")} options={[{ value: "single", label: "案件ごとに1チーム" }, { value: "multi", label: "1つの製品を複数チームで開発" }]} />
        <Select label="製品のクリティカリティ" value={a.critical} onChange={set("critical")} options={[{ value: "none", label: "一般的な業務システム" }, { value: "business", label: "業務上クリティカル（停止が重大な損失）" }, { value: "safety", label: "安全に関わる（人命・設備）" }]} />
      </div>
      <Field label="開発の進め方" help="進め方の名前や工程名は、プロジェクトの作成時に組織の用語へ対応付けられます">
        <div className="grid cols-2" style={{ ["--gap" as string]: "8px" }}>
          {[{ v: "agile", t: "アジャイル（スプリント）" }, { v: "iterative", t: "反復・段階型" }, { v: "waterfall", t: "ウォーターフォール" }, { v: "mixed", t: "案件ごとに異なる" }].map((o) => (
            <OptionCard key={o.v} name="approach" value={o.v} checked={a.approach === o.v} onChange={set("approach")} title={o.t} />
          ))}
        </div>
      </Field>

      {result === "inScope" ? (
        <Banner tone="pass" title="Basic プロファイルの対象として記録します">
          単一チーム・単一製品・非クリティカルの条件に当てはまります。<Tag square>記録のみ</Tag>
        </Banner>
      ) : result === "needsExpert" ? (
        <Banner tone="warn" title="専門家による確認が必要です">
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          <div className="small" style={{ marginTop: 6 }}>このまま進めますが、確認が終わるまで画面と監査パックに「適用範囲: 要確認」と表示します。</div>
        </Banner>
      ) : (
        <Banner tone="fail" title="初期の対象範囲外です">
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          <div className="small" style={{ marginTop: 6 }}>計画の同期やポートフォリオは利用できますが、Control Pack による充足状況は「対象外」と表示し、「対応」とは表示しません。</div>
        </Banner>
      )}
    </ExecOnboarding>
  );
}
