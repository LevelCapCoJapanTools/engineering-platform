// 画面ID: C-07 出典と利用許諾
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { userById } from "../../mocks/core";
import { packBySlug, sourceDocs } from "../../mocks/policy";
import type { SourceDoc } from "../../mocks/policy";
import { AppLayout, Banner, crumbs, ErrorState, Icon, PageHeader, Section, Skeleton, Tag } from "../../ui";

const LICENSE_TONE: Record<SourceDoc["license"], "pass" | "warn" | "fail" | "neutral"> = {
  許諾済み: "pass",
  確認中: "warn",
  未申請: "fail",
  "不要（番号の参照のみ）": "neutral",
};

function Use({ ok, label }: { ok: boolean; label: string }) {
  return <Tag tone={ok ? "pass" : "neutral"} icon={ok ? "check" : "x"} square>{label}{ok ? "可" : "不可"}</Tag>;
}

export function SourcesScreen({ org = ORG, pack: slug }: { org?: string; pack: string }) {
  const state = useScreenState();
  const pack = packBySlug(slug);
  const blocked = sourceDocs.filter((d) => d.license === "未申請" || d.license === "確認中");
  return (
    <AppLayout org={org} active="policies" breadcrumb={crumbs(org, undefined, { label: "ポリシー", to: paths.policies(org) }, { label: `${pack.name} ${pack.version}`, to: paths.policy(org, pack.slug) }, { label: "出典と利用許諾" })}>
      <PageHeader title="出典と利用許諾" description="Control Pack が参照する規格文書ごとの入手状況、利用許諾の状態、利用できる範囲です。" />
      <Banner tone="info" title="規格の本文はシステムに保存しません">
        統制項目には規格の番号と箇条番号だけを記録し、説明は自社で作成します。規格の本文・逐条の言い換えを、データベース・AI のプロンプト・検索用の索引・テストデータに含めません。無償で公開されている文書でも、AI への入力には提供元の明示的な許諾が必要です。
      </Banner>
      {state === "default" && blocked.length ? (
        <Banner tone="warn" title={`利用許諾が未確定の文書が ${blocked.length} 件あります`}>
          許諾が確定するまで、これらの文書に基づく統制項目の追加・変更は公開しません（Gate 0 の条件）。
        </Banner>
      ) : null}
      {state === "loading" ? (
        <Skeleton rows={5} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <Section title="参照する文書" sub="正式な規格番号で参照します" flush>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>文書</th><th>用途</th><th>入手</th><th>利用許諾</th><th>利用できる範囲</th><th>条件</th><th>担当・確認日</th></tr></thead>
              <tbody>
                {sourceDocs.map((d) => (
                  <tr key={d.ref}>
                    <td><span className="row" style={{ ["--gap" as string]: "6px" }}><Icon name="book" size={14} className="muted" /><span className="mono small strong">{d.ref}</span></span></td>
                    <td className="small">{d.role}</td>
                    <td><Tag square tone={d.acquired === "未入手" ? "warn" : "neutral"}>{d.acquired}</Tag></td>
                    <td><Tag tone={LICENSE_TONE[d.license]} square>{d.license}</Tag></td>
                    <td><div className="row" style={{ ["--gap" as string]: "4px" }}><Use ok={d.use.db} label="DB収録" /><Use ok={d.use.prompt} label="プロンプト" /><Use ok={d.use.test} label="テスト" /></div></td>
                    <td className="small">{d.scope}</td>
                    <td className="small">{userById(d.owner)?.name} · {formatDate(d.checked_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
      <p className="tiny muted">製品名・画面・Web サイトに規格団体のロゴや「認証済み」の表示は使いません。規格は「ISO/IEC 29110-4-1:2018」のように正式な番号で参照します。</p>
    </AppLayout>
  );
}
