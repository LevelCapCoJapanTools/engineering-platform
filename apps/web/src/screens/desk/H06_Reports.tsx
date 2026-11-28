// 画面ID: H-06 相手別の週報
// 同じ実績から、顧客向け（納入見込みと確認事項）、上層部向け（原価・判断）、受託者向け（本人の変更だけ）を組み立てる。
// 各記述に根拠と取得時刻を付ける。社外向けを送るときに社内版を添付できない。AI が無効でも定型の報告は組み立つ。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDateTime } from "../../lib/format";
import { reportFacts } from "../../mocks/desk";
import type { ReportFact } from "../../mocks/desk";
import { userById } from "../../mocks/core";
import {
  ActorLabel,
  AIUnavailableNotice,
  AppLayout,
  AudienceTag,
  Banner,
  Button,
  Checkbox,
  crumbs,
  ErrorState,
  PageHeader,
  Section,
  Segmented,
  Select,
  Skeleton,
  Tag,
  useToast,
} from "../../ui";

type Target = "customer" | "executive" | "freelancer";

const TARGET_LABEL: Record<Target, { title: string; to: string; audience: "customer" | "internal" | "freelancer"; heading: string }> = {
  customer: { title: "顧客向け", to: "中村 拓也・小松 恵（架空商事）", audience: "customer", heading: "今週の納入見込みとご確認のお願い" },
  executive: { title: "上層部向け", to: "木村 達也（JV責任者）・森 由紀子", audience: "internal", heading: "受発注システム刷新: 原価と判断事項" },
  freelancer: { title: "受託者向け", to: "", audience: "freelancer", heading: "あなたの依頼の変更点" },
};

const AI_SUMMARY: Record<Target, string> = {
  customer: "v1.4.0 は試験環境の準備の遅れにより 12/17 の納入見込みです。与信区分の値の一覧について、11/28 までにご回答をお願いします。",
  executive: "v1.4.0 は7日遅れの見込み。外注は1件が検収中で、予測粗利率は30%を維持。CR-0007 の追加費用の判断が 12/2 期限で残っています。",
  freelancer: "提出いただいた CSV 出力は検収中です。6列目の追加について、条件の確認をお願いしています（11/28 期限）。",
};

export function Reports() {
  const state = useScreenState();
  const toast = useToast();
  const org = useRoute().params.org ?? ORG;
  const initial: Target = state === "上層部向け" ? "executive" : state === "受託者向け" ? "freelancer" : "customer";
  const [target, setTarget] = useState<Target>(initial);
  const [freelancer, setFreelancer] = useState("u-matsuda");
  const [attachInternal, setAttachInternal] = useState(false);
  const aiOff = state === "AI無効";
  const facts: ReportFact[] = reportFacts.filter((f) => f.audiences.includes(target) && (target !== "freelancer" || f.freelancer_id === freelancer));
  const meta = TARGET_LABEL[target];
  const recipient = target === "freelancer" ? `${userById(freelancer)?.name ?? ""}（本人のみ）` : meta.to;
  const external = target !== "executive";
  const summary = target === "freelancer" && freelancer === "u-hayashi" ? "重複行の扱いが決まりました。エラーとして一覧表示してください。" : AI_SUMMARY[target];

  return (
    <AppLayout org={org} active="desk" breadcrumb={crumbs(org, undefined, { label: "案件窓口", to: paths.desk(org) }, { label: "週報" })}>
      <PageHeader
        title="相手別の週報"
        description="同じ実績から、相手ごとに見せてよい内容だけで週報を組み立てます。各記述は根拠と取得時刻を確認できます。"
      />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          <div className="row between">
            <Segmented
              value={target}
              onChange={(v) => { setTarget(v as Target); setAttachInternal(false); }}
              options={[{ value: "customer", label: "顧客向け" }, { value: "executive", label: "上層部向け" }, { value: "freelancer", label: "受託者向け" }]}
            />
            {target === "freelancer" ? (
              <div style={{ minWidth: 220 }}>
                <Select label="受託者" value={freelancer} onChange={setFreelancer} options={[{ value: "u-matsuda", label: "松田 亮" }, { value: "u-hayashi", label: "林 由香" }]} />
              </div>
            ) : null}
          </div>
          <Section title={meta.heading} sub={`宛先: ${recipient} · 対象期間 11/21〜11/27`} actions={<AudienceTag value={meta.audience} />}>
            <div className="stack" style={{ ["--gap" as string]: "14px" }}>
              {aiOff ? (
                <AIUnavailableNotice reason="orgDisabled" />
              ) : (
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  <ActorLabel kind="ai" name="要約（参考）" size="sm" />
                  <p className="small">{summary}</p>
                  <span className="tiny muted">要約は下の記述（根拠付き）だけから作っています。送る前に確認してください。</span>
                </div>
              )}
              <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                <strong className="small">{aiOff ? "定型の報告（AI なしで組み立て）" : "根拠付きの記述"}</strong>
                {facts.length === 0 ? (
                  <span className="small muted">この相手に伝える変更はありません。</span>
                ) : (
                  <ol className="dk-report-list">
                    {facts.map((f) => (
                      <li key={f.id}>
                        <span>{f.text}</span>
                        <br />
                        <span className="tiny muted">根拠: {f.source} · 取得 {formatDateTime(f.fetched_at)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              {target === "customer" ? (
                <Banner tone="info" title="顧客向けに出していない情報">外注の発注残・検収額・粗利、受託者の名前と報酬、社内の判断事項は含めていません。</Banner>
              ) : null}
              <div className="stack" style={{ ["--gap" as string]: "8px" }}>
                <Checkbox
                  label="社内版（上層部向け）を添付する"
                  checked={attachInternal}
                  onChange={setAttachInternal}
                  disabled={external}
                  description={external ? "社外に送る週報には社内版を添付できません" : "社内の宛先にだけ添付できます"}
                />
                <div className="row end">
                  <Button icon="eye" onClick={() => toast({ kind: "info", message: `${meta.title}の見え方をプレビューしました` })}>相手の見え方を確認</Button>
                  <Button variant="primary" icon="send" disabled={facts.length === 0} disabledReason="伝える内容がありません" onClick={() => toast({ kind: "success", message: `${meta.title}の週報を${external ? "対外送信の確認待ちに入れました" : "送信しました"}` })}>
                    {external ? "対外送信の確認へ" : "送信"}
                  </Button>
                </div>
                {external ? <span className="tiny muted">社外への送信は「対外送信の承認」で宛先・文面・対象版を確認してから送ります。</span> : null}
              </div>
            </div>
          </Section>
          <Section title="記述の出所" sub="同じ実績から、相手ごとに使う記述を選んでいます">
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>記述</th><th>顧客</th><th>上層部</th><th>受託者</th></tr></thead>
                <tbody>
                  {reportFacts.map((f) => (
                    <tr key={f.id}>
                      <td className="small">{f.text}</td>
                      <td>{f.audiences.includes("customer") ? <Tag tone="info" square>使う</Tag> : <span className="muted">—</span>}</td>
                      <td>{f.audiences.includes("executive") ? <Tag tone="info" square>使う</Tag> : <span className="muted">—</span>}</td>
                      <td>{f.audiences.includes("freelancer") ? <Tag tone="warn" square>本人のみ</Tag> : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </AppLayout>
  );
}
