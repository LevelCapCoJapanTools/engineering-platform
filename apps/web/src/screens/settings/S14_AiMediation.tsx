// 画面ID: S-14 AI仲介の記録
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { mediationRecords } from "../../mocks/common2";
import { ActorLabel, Banner, Button, Drawer, EmptyState, ErrorState, KeyValueList, Section, Segmented, SettingsLayout, Skeleton, Tag } from "../../ui";

const STATUS = {
  approved: { label: "承認して送信", tone: "pass" },
  corrected: { label: "訂正して送信", tone: "special" },
  held: { label: "保留（根拠不足）", tone: "warn" },
  rejected: { label: "破棄", tone: "fail" },
} as const;

type Rec = (typeof mediationRecords)[number];

export function S14AiMediation({ org = ORG }: { org?: string }) {
  const state = useScreenState();
  const [filter, setFilter] = useState<"all" | Rec["status"]>("all");
  const [open, setOpen] = useState<Rec | null>(null);
  const stopped = state === "モデル停止中";
  const rows = state === "記録なし" ? [] : mediationRecords.filter((r) => filter === "all" || r.status === filter);

  return (
    <SettingsLayout
      org={org}
      active="aiMediation"
      title="AI仲介の記録"
      description="案件窓口が AI に下書きさせた回答・説明文について、送信を許可したデータ、利用したモデルと入力資料の版、根拠の有無、人による訂正・承認を記録します。AI の下書きは合意や承認の証拠として数えません。"
      actions={<Button variant="ghost" iconRight="arrowRight" to={paths.aiSettings(org)}>AIとデータ分類</Button>}
    >
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {stopped ? (
            <Banner tone="warn" title="AI モデルが停止しています（提供元の障害）">
              窓口は定型文と人手での対応に切り替えています。受付、手動返信、委託検収、リリース判断はこれまでどおり続けられます。下書き待ちの 2 件は担当者に割り当て直しました。
            </Banner>
          ) : (
            <Banner tone="info" title="送信前に必ず人が確認します">
              金額・範囲・納期・障害の説明を含む文面は、宛先・文面・対象の版を人が確認してから送ります。根拠となる資料がない問いは、回答せずに相手への確認依頼に切り替えます。
            </Banner>
          )}

          <Section
            title="仲介の記録"
            sub={`${rows.length} 件`}
            actions={<Segmented value={filter} onChange={(v) => setFilter(v as "all" | Rec["status"])} options={[{ value: "all", label: "すべて" }, { value: "corrected", label: "訂正" }, { value: "held", label: "保留" }, { value: "rejected", label: "破棄" }]} />}
            flush
          >
            {rows.length === 0 ? (
              <EmptyState icon="sparkles" title="仲介の記録はありません" description="窓口が AI の下書きを使うと、ここに記録されます。" />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>日時</th><th>用途</th><th>送信したデータ</th><th>モデル・資料の版</th><th>根拠</th><th>結果</th><th>確認者</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} onClick={() => setOpen(r)} style={{ cursor: "pointer" }}>
                        <td className="small">{formatDateTime(r.at)}</td>
                        <td className="small"><div className="strong">{r.purpose}</div><div className="tiny muted">{r.project}</div></td>
                        <td className="tiny">{r.data_sent}</td>
                        <td className="tiny"><div className="mono">{r.model}</div><div className="muted">{r.sources}</div></td>
                        <td>{r.grounding === "ok" ? <Tag tone="pass" square>あり</Tag> : <Tag tone="warn" square>不足</Tag>}</td>
                        <td><Tag tone={STATUS[r.status].tone} square>{STATUS[r.status].label}</Tag></td>
                        <td className="small">{r.reviewer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="記録する項目と送らないもの">
            <div className="grid cols-2">
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                <li>送信を許可したデータ（公開版・承認済みの資料だけ）</li>
                <li>モデルの識別子、プロンプトのテンプレートの版</li>
                <li>入力した資料の版と、回答の根拠にした箇所</li>
                <li>人による訂正の前後と、承認者・日時</li>
              </ul>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                <li>JV 内部予算・外注単価・個人別報酬・粗利</li>
                <li>社内メモ、社内会議の資料、他の顧客・他の案件の情報</li>
                <li>認証情報、本人確認書類</li>
              </ul>
            </div>
          </Section>
        </>
      )}
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? `${open.id} ${open.purpose}` : ""}>
        {open ? (
          <div className="stack">
            <ActorLabel kind="ai" name="案件窓口の下書き" size="sm" />
            <KeyValueList
              items={[
                { label: "案件", value: open.project },
                { label: "送信したデータ", value: open.data_sent },
                { label: "モデル", value: open.model },
                { label: "根拠の資料", value: open.sources },
                { label: "結果", value: STATUS[open.status].label },
                { label: "確認者", value: open.reviewer },
                { label: "記録", value: open.note },
              ]}
            />
          </div>
        ) : null}
      </Drawer>
    </SettingsLayout>
  );
}
