// 画面ID: X-14 契約の確認・署名（顧客）
// 発注企業が新旧の条項を比較し、自社の担当が確認し、権限者が電子契約サービスで署名し、締結済みの控えを取得する。
// 閲覧担当は署名できない。業務上の確認と締結は別の状態。受注側の社内メモと、受注側と再委託先の契約は表示しない。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths, PROJECT } from "../../lib/paths";
import { formatDate, formatDateTime } from "../../lib/format";
import { userById } from "../../mocks/core";
import { engagementOf } from "../../mocks/engagement";
import { CONTRACT_KIND, contractById } from "../../mocks/contracts";
import type { Contract } from "../../mocks/contracts";
import { CONTRACT_STATUS } from "../../lib/vocab";
import { Banner, Button, CustomerPortalLayout, EmptyState, ErrorState, HashDisplay, Section, Segmented, Skeleton, SoDNotice, StatusBadge, Tag, TextArea, useToast } from "../../ui";
import { ClauseList, LegalNote, ReviewAndSign } from "./parts";

const VIEWER: Record<string, string> = {
  "確認（担当者）": "u-nakamura",
  "閲覧担当": "u-noguchi",
  "署名者": "u-sakai",
  "締結済み": "u-sakai",
  "表示できない契約": "u-nakamura",
};

function pick(state: string, id?: string): Contract | undefined {
  if (state === "締結済み") return contractById("CT-002");
  if (state === "署名者") return contractById("CT-004");
  if (state === "表示できない契約") return contractById("CT-F01");
  return contractById(id ?? "") ?? contractById("CT-003");
}

export function X14PortalContract({ project = PROJECT, id }: { project?: string; id?: string }) {
  const state = useScreenState();
  const toast = useToast();
  const viewerId = VIEWER[state] ?? "u-nakamura";
  const viewer = userById(viewerId);
  const c = pick(state, id);
  const eng = engagementOf(project);
  const company = eng?.customer_company ?? "";
  const [audience, setAudience] = useState<"counterparty" | "internal">("counterparty");
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [sending, setSending] = useState(false);
  const [signRequested, setSignRequested] = useState(false);

  const visible = c && c.customer_visible && c.kind !== "freelance" && c.parties.includes(company);

  if (state === "読み込み中") return <CustomerPortalLayout project={project} active="contracts" userId={viewerId}><Skeleton variant="detail" /></CustomerPortalLayout>;
  if (state === "エラー") return <CustomerPortalLayout project={project} active="contracts" userId={viewerId}><ErrorState /></CustomerPortalLayout>;
  if (!c || !visible) {
    return (
      <CustomerPortalLayout project={project} active="contracts" userId={viewerId}>
        <div className="card"><EmptyState variant="forbidden" icon="lock" title="この契約は表示できません" description="自社が当事者で、受注側が公開した契約だけを表示します。" action={<Button to={paths.portalContracts(project)}>契約の一覧へ</Button>} /></div>
      </CustomerPortalLayout>
    );
  }

  const isSigner = viewer?.roles.includes("発注側署名者") ?? false;
  const canReview = viewer?.roles.some((r) => r === "発注側プロジェクト責任者" || r === "発注側承認者" || r === "発注側署名者") ?? false;
  const mySigner = c.signers.find((s) => s.user_id === viewerId);
  const openClauses = c.clauses.filter((x) => x.state === "open" || x.state === "changed").length;
  const signReason = !isSigner ? "署名できるのは自社が指名した署名権限者だけです" : c.status === "signed" ? "締結済みです" : c.status !== "signing" ? "確定版の送付前です（未合意の条項がある間は送付されません）" : mySigner?.status === "signed" ? "署名済みです" : signRequested ? "電子契約サービスで署名中です" : "";

  return (
    <CustomerPortalLayout project={project} active="contracts" userId={viewerId}>
      <div className="stack" style={{ ["--gap" as string]: "6px" }}>
        <div className="page-title"><h1>{c.title}</h1><StatusBadge vocab={CONTRACT_STATUS[c.status]} /></div>
        <p className="small muted">{CONTRACT_KIND[c.kind]} · {c.parties.join(" ⇔ ")} · 有効期間 {formatDate(c.period.start)}〜{formatDate(c.period.end)} · 文書 v{c.version}</p>
      </div>

      {c.status === "signed" ? (
        <Banner tone="pass" title="締結済みです" action={<Button size="sm" icon="download" onClick={() => toast({ kind: "success", message: "締結済みの原本と証明記録の控えを取得しました" })}>締結済みの控え</Button>}>
          {c.signed_at ? `${formatDateTime(c.signed_at)} に全員の署名が完了しました。` : ""}
        </Banner>
      ) : openClauses ? (
        <Banner tone="warn" title={`未合意の条項が ${openClauses} 件あります`}>確認とコメントを返してください。改訂された条項は、改訂前の確認結果を引き継がずに確認し直します。</Banner>
      ) : null}

      <Section title="確認と締結" sub="担当者の確認が終わっても締結済みにはなりません。署名権限者が電子契約サービスで署名して締結します">
        <ReviewAndSign c={c} viewerCompany={company} />
      </Section>

      {c.clauses.length ? (
        <Section title="条項の新旧比較">
          <ClauseList clauses={c.clauses} viewerCompany={company} />
        </Section>
      ) : null}

      {c.status !== "signed" ? (
        <Section title="確認とコメント">
          <div className="stack">
            <Segmented
              value={audience}
              onChange={(v) => setAudience(v as "counterparty" | "internal")}
              options={[{ value: "counterparty", label: "受注側に返す" }, { value: "internal", label: "自社内のメモ（受注側には見えません）" }]}
            />
            <TextArea label="コメント" rows={3} value={comment} onChange={setComment} placeholder={audience === "internal" ? "自社内の検討メモ" : "条項についての質問や修正の希望"} />
            <div className="row">
              <Button icon="send" disabled={!comment.trim() || sending} disabledReason="コメントを入力してください" loading={sending} onClick={() => { setSending(true); window.setTimeout(() => { setSending(false); setComment(""); toast({ kind: "success", message: audience === "internal" ? "社内メモを保存しました" : "受付番号 CM-0042 で受注側に送りました" }); }, 600); }}>
                {audience === "internal" ? "メモを保存" : "コメントを送る"}
              </Button>
              <Button variant="secondary" icon="check" disabled={!canReview || reviewed} disabledReason={reviewed ? "確認済みです" : "確認できるのは自社の責任者・承認者・署名者です"} onClick={() => { setReviewed(true); toast({ kind: "success", message: `文書 v${c.version} を確認済みにしました（締結ではありません）` }); }}>
                文書 v{c.version} を確認済みにする
              </Button>
            </div>
          </div>
        </Section>
      ) : null}

      {c.status !== "signed" ? (
        <Section title="署名">
          <div className="stack">
            {!isSigner ? (
              <SoDNotice reason="あなたは閲覧・確認の担当のため署名できません。署名は自社が指名した署名権限者が行います。" eligible={c.signers.map((s) => userById(s.user_id)!).filter((u) => u.company === company)} />
            ) : null}
            <div className="row">
              <Button variant="primary" icon="external" disabled={Boolean(signReason)} disabledReason={signReason} onClick={() => { setSignRequested(true); toast({ kind: "success", message: "電子契約サービスの署名画面を開きました。署名の結果は自動で取り込まれます" }); }}>
                電子契約サービスで署名する
              </Button>
              {mySigner ? <Tag square>あなたの署名: {mySigner.status === "signed" ? "署名済み" : mySigner.status === "viewed" ? "開封済み" : mySigner.status === "declined" ? "辞退" : "未署名"}</Tag> : null}
            </div>
            <p className="tiny muted">署名はこの画面では行いません。認証コードやパスワードを本サービスに入力することはありません。</p>
          </div>
        </Section>
      ) : (
        <Section title="締結済みの原本">
          <dl className="ct-kv-grid">
            <div><dt>証明記録</dt><dd className="mono">{c.certificate_id}</dd></div>
            <div><dt>原本のハッシュ</dt><dd>{c.original_sha256 ? <HashDisplay value={c.original_sha256} verified="match" /> : "—"}</dd></div>
          </dl>
        </Section>
      )}
      <LegalNote />
    </CustomerPortalLayout>
  );
}
