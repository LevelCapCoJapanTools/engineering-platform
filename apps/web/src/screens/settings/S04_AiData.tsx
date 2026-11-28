// 画面ID: S-04 AIとデータ分類
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { DATA_CLASS } from "../../lib/vocab";
import type { DataClass } from "../../lib/vocab";
import { aiAgents, aiFeatures, aiForbidden, aiSendLog, aiSubprocessors, aiToolAllowlist, projectDataClass } from "../../mocks/settings";
import { ActorLabel, Banner, Button, DataClassBadge, DataTable, ErrorState, Section, Select, SettingsLayout, Skeleton, Tag, Timestamp, Toggle, useToast } from "../../ui";
import { CustomerDataAiSection } from "./trade2";

const classOptions = (Object.keys(DATA_CLASS) as DataClass[]).map((k) => ({ value: k, label: DATA_CLASS[k].label }));

export function S04AiData({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [enabled, setEnabled] = useState(state !== "AI無効");
  const [features, setFeatures] = useState<Record<string, boolean>>(Object.fromEntries(aiFeatures.map((f) => [f.key, f.key !== "draft"])));
  const [defaultClass, setDefaultClass] = useState<string>("internal");
  const [dirty, setDirty] = useState(false);
  const [urlFetch, setUrlFetch] = useState(false);
  const [escalateTo, setEscalateTo] = useState("pm");
  const [lowConf, setLowConf] = useState("0.6");
  const [lowMode, setLowMode] = useState("label");
  const touch = () => setDirty(true);

  return (
    <SettingsLayout
      org={org}
      active="ai"
      title="AIとデータ分類"
      description="AIの出力は参考所見として記録され、ゲートの判定には使われません。データは学習に使われません。"
      actions={<Button variant="primary" icon="check" disabled={!dirty} disabledReason="変更はありません" onClick={() => { setDirty(false); toast({ kind: "success", message: "AIとデータ分類の設定を保存しました" }); }}>保存</Button>}
    >
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <Section title="AI機能" sub="組織全体で無効にすると、すべてのプロジェクトで AI へのデータ送信が止まります">
            <div className="stack">
              <Toggle label={<strong>AI機能を使う</strong>} description="無効にしても、ゲートの判定と人間の承認はこれまでどおり動きます" checked={enabled} onChange={(v) => { setEnabled(v); touch(); }} />
              {!enabled ? <Banner tone="info">AI機能は無効です。AIの所見・下書き・リンク候補は作成されません。</Banner> : null}
              <div className="grid cols-2" style={{ ["--gap" as string]: "12px" }}>
                {aiFeatures.map((f) => (
                  <div key={f.key} className="card tight">
                    <Toggle label={f.label} description={f.description} checked={enabled && features[f.key]} disabled={!enabled} onChange={(v) => { setFeatures((x) => ({ ...x, [f.key]: v })); touch(); }} />
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="AIエージェントの権限と安全対策" sub="AIエージェントは人と別の ID で動き、既定は読み取りのみです。禁止事項は設定で変更できません">
            <div className="stack">
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>エージェント</th><th>アクセスできる範囲</th><th>出力</th></tr></thead>
                  <tbody>
                    {aiAgents.map((a) => (
                      <tr key={a.key}>
                        <td><ActorLabel kind="ai" name={a.name} size="sm" /></td>
                        <td className="small">{a.scope}</td>
                        <td className="small">{a.output}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid cols-2" style={{ ["--gap" as string]: "12px" }}>
                <div className="card tight stack" style={{ ["--gap" as string]: "6px" }}>
                  <strong className="small">常に禁止（変更できません）</strong>
                  <div className="row" style={{ ["--gap" as string]: "6px" }}>{aiForbidden.map((x) => <Tag key={x} tone="fail" icon="xCircle">{x}</Tag>)}</div>
                </div>
                <div className="card tight stack" style={{ ["--gap" as string]: "6px" }}>
                  <strong className="small">実行できる操作（許可リスト）</strong>
                  <div className="row" style={{ ["--gap" as string]: "6px" }}>{aiToolAllowlist.map((x) => <Tag key={x} tone="pass" icon="check">{x}</Tag>)}</div>
                </div>
              </div>
              <div className="card tight">
                <Toggle label="外部 URL の取得を許可する" description="既定は無効です。有効にすると、文書中のリンク先を AI が読み込めるようになります" checked={enabled && urlFetch} disabled={!enabled} onChange={(v) => { setUrlFetch(v); touch(); }} />
              </div>
              <div className="card tight stack" style={{ ["--gap" as string]: "8px" }}>
                <Toggle label="不審な指示を検出したら人に回す" description="リポジトリ・Issue・SOW などに含まれる、AIへの指示とみられる文を検出した場合に処理を止めて確認を依頼します。無効にはできません" checked disabled onChange={() => undefined} />
                <div style={{ maxWidth: 360 }}>
                  <Select label="確認の依頼先" value={escalateTo} onChange={(v) => { setEscalateTo(v); touch(); }} options={[{ value: "pm", label: "プロジェクトの PM" }, { value: "admin", label: "組織管理者" }, { value: "security", label: "セキュリティ担当" }]} />
                </div>
              </div>
              <Banner tone="info" title="認証情報">AIエージェントには、リポジトリ単位で権限を絞った短命の認証情報（OIDC）を処理ごとに発行します。シークレットは AI に渡しません。</Banner>
            </div>
          </Section>

          <Section title="データ分類と実行先" sub="プロジェクトのデータ分類に応じて、AI の処理を実行する場所が決まります">
            <div className="stack">
              <div style={{ maxWidth: 360 }}>
                <Select label="既定のデータ分類" value={defaultClass} onChange={(v) => { setDefaultClass(v); touch(); }} options={classOptions} help="新しいプロジェクトに適用されます" />
              </div>
              <div className="table-wrap">
                <table className="table compact">
                  <thead><tr><th>分類</th><th>AI の実行先</th><th>この組織での利用</th></tr></thead>
                  <tbody>
                    {(Object.keys(DATA_CLASS) as DataClass[]).map((k) => (
                      <tr key={k}>
                        <td><DataClassBadge value={k} /></td>
                        <td className="small">{DATA_CLASS[k].runtime}</td>
                        <td>{k === "highlyConfidential" ? <Tag tone="neutral" icon="lock">Enterprise 版で利用可</Tag> : enabled ? <Tag tone="pass" icon="check">利用可</Tag> : <Tag>無効</Tag>}</td>
                      </tr>
                    ))}
                    <tr>
                      <td><span className="badge square tone-fail">Secret／Credential</span></td>
                      <td className="small">AI へ送信しない</td>
                      <td><Tag tone="fail" icon="xCircle">送信しない</Tag></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Section title="プロジェクトごとの分類" sub="プロジェクトごとに既定の分類を上書きできます" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>プロジェクト</th><th>分類</th><th>設定元</th></tr></thead>
                <tbody>
                  {projectDataClass.map((p) => (
                    <tr key={p.slug}>
                      <td className="strong">{p.name}</td>
                      <td style={{ width: 240 }}>
                        <select className="select" defaultValue={p.value} onChange={touch} aria-label={`${p.name} の分類`}>
                          {classOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td>{p.inherited ? <Tag>組織の既定</Tag> : <Tag tone="primary">上書き</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="信頼度の低い所見の表示" sub="AI の所見には確信度を付けて表示します。低い所見をどう見せるかを決めます" actions={<Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.aiEval(org)}>AIの評価を見る</Button>}>
            <div className="grid cols-2">
              <Select label="低信頼とみなす確信度" value={lowConf} onChange={(v) => { setLowConf(v); touch(); }} options={[{ value: "0.5", label: "50% 未満" }, { value: "0.6", label: "60% 未満（推奨）" }, { value: "0.7", label: "70% 未満" }]} />
              <Select label="低信頼の所見" value={lowMode} onChange={(v) => { setLowMode(v); touch(); }} options={[{ value: "label", label: "「低信頼」と表示して一覧に残す" }, { value: "collapse", label: "折りたたんで表示する" }]} help="低信頼の所見も消さずに記録します" />
            </div>
            <p className="tiny muted" style={{ marginTop: 8 }}>モデルが対象外の入力や、無効なモデルが選ばれた場合は「AI を利用できません」と表示し、人の承認とゲートはそのまま続けます。</p>
          </Section>

          <Section title="AI の提供先とリージョン" sub="契約・設定・実行ログが一致していることを確認できます。提供先の変更は事前に通知します" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>提供先（再委託先）</th><th>処理リージョン</th><th>用途</th><th>保持</th><th>学習利用</th></tr></thead>
                <tbody>
                  {aiSubprocessors.map((x) => (
                    <tr key={x.name}>
                      <td className="small strong">{x.name}</td>
                      <td className="small">{x.region}</td>
                      <td className="small">{x.purpose}</td>
                      <td className="small">{x.retention}</td>
                      <td><Tag tone="pass" square icon="check">{x.training}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            <div>
              <h2 className="section-title">AIへの送信ログ</h2>
              <p className="section-sub">送信の日時・機能・量を記録します。送信した内容は表示しません</p>
            </div>
            <DataTable
              rows={state === "送信ログなし" || !enabled ? [] : aiSendLog}
              rowKey={(r) => r.id}
              columns={[
                { key: "at", header: "日時", render: (r) => <Timestamp at={r.at} mode="absolute" />, sortValue: (r) => r.at },
                { key: "feature", header: "機能", render: (r) => r.feature },
                { key: "project", header: "プロジェクト", render: (r) => r.project },
                { key: "class", header: "分類", render: (r) => <DataClassBadge value={r.data_class} /> },
                { key: "size", header: "送信量", render: (r) => <span className="mono small">{r.size}</span>, align: "right" },
              ]}
              empty={<div className="empty"><h3>送信ログはありません</h3><p>AI機能が使われると、ここに記録されます。</p></div>}
            />
          </div>
          <CustomerDataAiSection org={org} enabled={enabled} />
        </>
      )}
    </SettingsLayout>
  );
}
