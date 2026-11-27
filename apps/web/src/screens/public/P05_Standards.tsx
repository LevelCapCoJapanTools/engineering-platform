// 画面ID: P-05 規格との関係
import "./public.css";
import { Button, Icon, PublicLayout, Tag } from "../../ui";
import { paths } from "../../lib/paths";
import { COMPLIANCE_PHRASE } from "../../lib/vocab";

const supports = [
  "PM（プロジェクト管理）と SI（ソフトウェア実装）の活動を、統制項目として開発の流れに組み込む",
  "機械的に確かめられる項目を CI ゲートで検査する",
  "人の判断・承認を、誰がいつ行ったかとともに記録する",
  "判定と承認の結果を、改ざん耐性のある証跡として保管する",
  "評価者に提示する監査パックを出力する",
];
const notSupports = [
  "認証を行うこと、認証の取得を保証すること",
  "AI による適合・不適合の判定",
  "完成したソフトウェアの品質や適合性の保証",
  "規格本文の提供（規格は正規に入手してください）",
];
const refs = [
  { no: "ISO/IEC 29110-4-1:2018", role: "Basic プロファイルの仕様（統制項目の基準として参照）" },
  { no: "ISO/IEC 29110-5-1-2:2025", role: "Basic プロファイルの実施ガイド（運用の参考）" },
  { no: "ISO/IEC 29110-5-5:2026", role: "Agile／DevOps への適用ガイド（CI/CD への適用の参考）" },
  { no: "ISO/IEC 29110-3-2:2018", role: "認証スキーム（認証との境界の参考）" },
];

export function P05Standards() {
  return (
    <PublicLayout>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container stack" style={{ ["--gap" as string]: "12px" }}>
          <span className="eyebrow">STANDARDS</span>
          <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>規格との関係</h1>
          <p className="lead">本サービスは {COMPLIANCE_PHRASE}します。認証を行うものではありません。</p>
        </div>
      </section>
      <div className="container stack" style={{ ["--gap" as string]: "24px", paddingBottom: 72 }}>
        <div className="two-col-compare">
          <section className="card stack" style={{ ["--gap" as string]: "14px" }}>
            <h2 className="section-title row"><Icon name="checkCircle" className="text-pass" />支援すること</h2>
            <ul>{supports.map((s) => <li key={s}><Icon name="check" className="text-pass" />{s}</li>)}</ul>
          </section>
          <section className="card stack" style={{ ["--gap" as string]: "14px" }}>
            <h2 className="section-title row"><Icon name="xCircle" className="text-fail" />支援しないこと</h2>
            <ul>{notSupports.map((s) => <li key={s}><Icon name="x" className="text-fail" />{s}</li>)}</ul>
          </section>
        </div>
        <section className="card stack" style={{ ["--gap" as string]: "12px" }}>
          <h2 className="section-title">第三者認証との違い</h2>
          <div className="grid cols-3">
            <div className="stack" style={{ ["--gap" as string]: "6px" }}><Tag tone="primary">本サービス</Tag><p className="small muted">日々の開発で統制を実行し、証跡を継続的に残す（適合準備）。</p></div>
            <div className="stack" style={{ ["--gap" as string]: "6px" }}><Tag>評価者</Tag><p className="small muted">証跡をもとに、プロセスがプロファイルに沿っているかを評価する。</p></div>
            <div className="stack" style={{ ["--gap" as string]: "6px" }}><Tag>認証機関</Tag><p className="small muted">第三者としてプロセスの認証を行う。製品の品質を保証するものではない。</p></div>
          </div>
        </section>
        <section className="card stack" style={{ ["--gap" as string]: "8px" }}>
          <h2 className="section-title">対象プロファイル</h2>
          <p className="small">Generic Profile Group の Basic プロファイル（単一チーム・単一製品のソフトウェア開発）。セーフティクリティカルな開発は対象外です。Entry・Intermediate・Advanced は今後対応予定です。</p>
        </section>
        <section className="card flush">
          <div className="card-header"><h2 className="section-title">参照する規格</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>規格番号</th><th>本サービスでの扱い</th></tr></thead>
              <tbody>{refs.map((r) => <tr key={r.no}><td className="mono nowrap">{r.no}</td><td>{r.role}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <p className="small muted">統制項目は自社で作成した ID（例: CTL-PM-001）と説明で表し、規格本文は掲載・利用していません。「ISO」は国際標準化機構の登録商標であり、本サービスは国際標準化機構による承認・認証を受けたものではありません。</p>
        <div><Button variant="primary" to={paths.contact()} iconRight="arrowRight">PoCを相談</Button></div>
      </div>
    </PublicLayout>
  );
}
