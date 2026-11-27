// 画面ID: A-09 AIとデータの設定（オンボーディング 6/7）
import { useState } from "react";
import { paths } from "../../lib/paths";
import { DATA_CLASS } from "../../lib/vocab";
import type { DataClass } from "../../lib/vocab";
import { Banner, DataClassBadge, Icon, OnboardingLayout, Select, Toggle } from "../../ui";

const FEATURES = [
  { key: "req", label: "要求レビュー", desc: "要求の曖昧性、矛盾、テスト可能性を指摘する" },
  { key: "design", label: "設計レビュー", desc: "設計と要求の対応漏れや矛盾を指摘する" },
  { key: "sow", label: "SOW 抽出", desc: "SOW から要求候補、納入物、期限を抽出する" },
  { key: "link", label: "リンク候補", desc: "要求・設計・PR・テストの対応候補を提示する" },
];

export function AiSettings() {
  const [enabled, setEnabled] = useState(true);
  const [features, setFeatures] = useState<Record<string, boolean>>({ req: true, design: true, sow: true, link: true });
  const [cls, setCls] = useState<DataClass>("internal");
  return (
    <OnboardingLayout step={5} title="AIとデータの設定" description="AI は下書きと指摘だけを行い、ゲートの判定や承認には使いません。送るデータの範囲をここで決めます。" back={paths.onboardingMembers()} next={paths.onboardingDone()}>
      <div className="card tight stack" style={{ ["--gap" as string]: "6px", background: "var(--bg-subtle)" }}>
        {[
          "AI に送ったデータを学習に使わない契約の提供先だけを使います",
          "シークレットや認証情報は AI に送りません",
          "AI の結果は「AI・参考」と表示し、採用・却下は人が判断します",
        ].map((t) => (
          <span key={t} className="row small" style={{ ["--gap" as string]: "8px" }}><Icon name="shieldCheck" size={15} className="text-pass" />{t}</span>
        ))}
      </div>

      <Toggle label="AI 機能を使う" checked={enabled} onChange={setEnabled} description="無効にすると、すべての AI 機能が止まります。ゲートの判定には影響しません。" />
      <div className="stack" style={{ ["--gap" as string]: "10px", paddingLeft: 44, opacity: enabled ? 1 : 0.5 }}>
        {FEATURES.map((f) => (
          <Toggle key={f.key} label={f.label} description={f.desc} disabled={!enabled} checked={enabled && features[f.key]} onChange={(v) => setFeatures((x) => ({ ...x, [f.key]: v }))} />
        ))}
      </div>

      <Select label="既定のデータ分類" value={cls} onChange={(v) => setCls(v as DataClass)} options={(Object.keys(DATA_CLASS) as DataClass[]).map((k) => ({ value: k, label: DATA_CLASS[k].label }))} help="プロジェクトごとに上書きできます。分類によって AI の実行先が変わります。" />
      {cls === "highlyConfidential" ? <Banner tone="warn">Highly Confidential では外部のモデルへ送信しません。閉域実行（Enterprise）がない場合、AI 機能は使えません。</Banner> : null}

      <div className="card flush">
        <div className="table-wrap">
          <table className="table compact">
            <thead><tr><th>データ分類</th><th>AI の実行先</th></tr></thead>
            <tbody>
              {(Object.keys(DATA_CLASS) as DataClass[]).map((k) => (
                <tr key={k} className={k === cls ? "selected" : undefined}>
                  <td><DataClassBadge value={k} /></td>
                  <td className="small">{DATA_CLASS[k].runtime}</td>
                </tr>
              ))}
              <tr>
                <td><span className="badge square tone-fail">Secret／Credential</span></td>
                <td className="small">AI に送らない</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </OnboardingLayout>
  );
}
