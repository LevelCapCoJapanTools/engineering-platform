// 画面ID: C-08 Control Pack のレビュー記録
import { useScreenState } from "../../lib/router";
import { ORG, paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { assessorFeedback, packBySlug, packReviews } from "../../mocks/policy";
import { AppLayout, Banner, Button, crumbs, EmptyState, ErrorState, PageHeader, Section, Skeleton, Tag, useToast } from "../../ui";

const KIND_TONE = { 承認: "pass", 差戻し: "fail", コメント: "neutral", 適用判断: "info" } as const;

export function ReviewsScreen({ org = ORG, pack: slug }: { org?: string; pack: string }) {
  const state = useScreenState();
  const toast = useToast();
  const pack = packBySlug(slug);
  const reviews = state === "empty" ? [] : packReviews;
  const feedback = state === "empty" ? [] : assessorFeedback;
  const open = packReviews.filter((r) => r.status === "対応中");
  return (
    <AppLayout org={org} active="policies" breadcrumb={crumbs(org, undefined, { label: "ポリシー", to: paths.policies(org) }, { label: `${pack.name} ${pack.version}`, to: paths.policy(org, pack.slug) }, { label: "レビュー記録" })}>
      <PageHeader
        title="Control Pack のレビュー記録"
        description="規格の専門家によるレビュー、承認者、差戻し、適用の判断と、第三者の評価者から受けた出力形式へのフィードバックです。"
        actions={<Button icon="plus" onClick={() => toast({ kind: "success", message: "レビューの依頼を作成しました（モック）" })}>レビューを依頼</Button>}
      />
      {state === "default" && open.length ? (
        <Banner tone="warn" title={`差戻しが ${open.length} 件対応中です`}>
          {open.map((r) => `${r.id}（${r.version}）`).join("、")}。対応が完了し専門家が承認するまで、この版は公開しません。
        </Banner>
      ) : null}
      {state === "loading" ? (
        <Skeleton rows={6} />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          <Section title="レビューと承認" sub="専門家レビューは正規に入手した規格文書で人手で行います。AI の結果は使いません" flush>
            {reviews.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>ID</th><th>対象の版</th><th>種類</th><th>レビュー者</th><th>日付</th><th>内容</th><th>状態</th></tr></thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r.id}>
                        <td className="mono small">{r.id}</td>
                        <td className="mono small">{r.version}</td>
                        <td><Tag tone={KIND_TONE[r.kind]} square>{r.kind}</Tag></td>
                        <td><div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="small">{r.reviewer}</span><span className="tiny muted">{r.reviewer_role}</span></div></td>
                        <td className="small">{formatDate(r.at)}</td>
                        <td className="small">{r.summary}</td>
                        <td><Tag tone={r.status === "完了" ? "pass" : "warn"}>{r.status}</Tag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon="history" title="レビュー記録はまだありません" description="Control Pack の公開前に、規格の専門家にレビューを依頼してください。" />
            )}
          </Section>

          <Section title="評価者からのフィードバック" sub="監査パックの形式が評価で受け入れられるかを確認した記録です（評価者による適合の判断ではありません）" flush>
            {feedback.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>ID</th><th>評価者</th><th>日付</th><th>テーマ</th><th>フィードバック</th><th>対応</th><th>状態</th></tr></thead>
                  <tbody>
                    {feedback.map((f) => (
                      <tr key={f.id}>
                        <td className="mono small">{f.id}</td>
                        <td className="small">{f.from}</td>
                        <td className="small">{formatDate(f.at)}</td>
                        <td className="small strong">{f.topic}</td>
                        <td className="small">{f.feedback}</td>
                        <td className="small">{f.response}</td>
                        <td><Tag tone={f.status === "反映済み" ? "pass" : f.status === "対応中" ? "warn" : "neutral"}>{f.status}</Tag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon="message" title="フィードバックはまだありません" />
            )}
          </Section>
        </>
      )}
    </AppLayout>
  );
}
