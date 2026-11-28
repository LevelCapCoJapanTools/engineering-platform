// 画面ID: Y-02 契約の詳細・協議・署名
// 改訂箇所の差分、各社のコメント・回答担当・合意状況を記録する。社内メモと相手に提示する文面は公開範囲を分ける。
// 業務上の確認と締結（電子契約サービスでの署名）は別の状態。署名者・文書の版が一致した結果だけを反映する。
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate, formatDateTime } from "../../lib/format";
import { JV_COMPANY, CONTRACT_KIND, contractById } from "../../mocks/contracts";
import type { Contract } from "../../mocks/contracts";
import { AudienceTag, Banner, Button, ConfirmDialog, ErrorState, HashDisplay, IdLink, PageHeader, ProjectLayout, Section, Skeleton, Tabs, Tag, useToast } from "../../ui";
import { CONTRACT_STATUS } from "../../lib/vocab";
import { ClauseList, LegalNote, ReviewAndSign, SignEventList, routeOrg, routeProject } from "./parts";

function pickContract(state: string, id?: string): Contract {
  const base = contractById(id ?? "") ?? contractById("CT-003")!;
  switch (state) {
    case "signing":
      return contractById("CT-004")!;
    case "reviewedOnly": {
      const c = contractById("CT-004")!;
      return { ...c, status: "reviewed", signers: c.signers.map((s) => ({ ...s, status: "pending", at: undefined })), sign_events: [] };
    }
    case "mismatch": {
      const c = contractById("CT-004")!;
      return {
        ...c,
        sign_events: [
          ...c.sign_events,
          { id: "SE-5", at: "2026-11-27T10:12:00+09:00", kind: "mismatch", detail: "酒井 隆の署名完了の通知を受信。署名された文書が v0（旧案）で、確定版 v1 と一致しないため反映しない。窓口が電子契約サービスで確認中", doc_version: 0, applied: false },
        ],
      };
    }
    case "signed":
      return contractById("CT-002")!;
    case "declined":
      return contractById("CT-102")!;
    case "freelance":
      return contractById("CT-F01")!;
    default:
      return base;
  }
}

export function Y02ContractDetail({ id }: { id?: string }) {
  const state = useScreenState();
  const params = useRoute().params;
  const org = routeOrg(params);
  const pr = routeProject(params);
  const toast = useToast();
  const c = pickContract(state, id);
  const [tab, setTab] = useState(c.status === "signed" ? "original" : c.clauses.length ? "clauses" : "sign");
  const [confirm, setConfirm] = useState(false);
  const [sent, setSent] = useState(false);

  if (state === "loading") return <ProjectLayout org={org} project={pr} active="contracts" trail={[{ label: "契約書庫", to: paths.contracts(org, pr) }, { label: "…" }]}><Skeleton variant="detail" /></ProjectLayout>;
  if (state === "error") return <ProjectLayout org={org} project={pr} active="contracts" trail={[{ label: "契約書庫", to: paths.contracts(org, pr) }, { label: "エラー" }]}><ErrorState /></ProjectLayout>;

  const openClauses = c.clauses.filter((x) => x.state === "open" || x.state === "changed").length;
  const reviewsDone = c.reviews.every((r) => r.status === "done" && r.doc_version === c.version);
  const canSend = c.status !== "signed" && c.status !== "signing" && openClauses === 0 && reviewsDone && !sent;
  const sendReason = c.status === "signed" ? "締結済みです" : c.status === "signing" ? "署名者に送付済みです" : openClauses > 0 ? `未合意の条項が ${openClauses} 件あります` : !reviewsDone ? "各社の業務上の確認が終わっていません" : "送付済みです";

  return (
    <ProjectLayout org={org} project={pr} active="contracts" trail={[{ label: "契約書庫", to: paths.contracts(org, pr) }, { label: c.id }]}>
      <PageHeader
        id={c.id}
        title={c.title}
        status={CONTRACT_STATUS[c.status]}
        description={`${CONTRACT_KIND[c.kind]} · ${c.parties.join(" ⇔ ")} · 有効期間 ${formatDate(c.period.start)}〜${formatDate(c.period.end)}`}
        meta={<span className="row" style={{ ["--gap" as string]: "6px" }}><Tag square>文書 v{c.version}</Tag><AudienceTag value={c.customer_visible ? "customer" : "internal"} />{c.related.map((r) => <IdLink key={r} id={r} />)}</span>}
        actions={
          <>
            <Button variant="primary" icon="send" disabled={!canSend} disabledReason={sendReason} onClick={() => setConfirm(true)}>確定版を署名者に送付</Button>
            {c.status === "signed" ? <Button icon="download" onClick={() => toast({ kind: "success", message: "締結済みの原本と証明記録の控えを取得しました" })}>締結済みの控え</Button> : null}
          </>
        }
      />

      {c.kind === "freelance" ? (
        <Banner tone="info" title="受託者との契約（社内のみ）">この契約は顧客に公開しません。顧客の画面・検索・添付・出力には表示されません。</Banner>
      ) : null}
      {state === "reviewedOnly" ? (
        <Banner tone="warn" title="業務上の確認は完了していますが、締結済みではありません">担当者のレビュー完了は締結ではありません。確定版を署名者に送付し、電子契約サービスで全員が署名して初めて締結済みになります。</Banner>
      ) : null}
      {state === "mismatch" ? (
        <Banner tone="fail" title="版が一致しない署名結果を反映していません">電子契約サービスから届いた署名の文書が確定版と異なります。締結済みにはせず、窓口が確認しています。</Banner>
      ) : null}
      {c.status === "declined" ? (
        <Banner tone="fail" title="署名が辞退されました" action={<Button size="sm" icon="message" onClick={() => toast({ kind: "success", message: "再協議の依頼を回答担当に送りました" })}>再協議を依頼</Button>}>
          辞退の理由を確認し、条項を改訂して新しい版で協議します。辞退前の署名は新しい版に引き継ぎません。
        </Banner>
      ) : null}
      {sent ? <Banner tone="pass" title="確定版を署名者に送付しました">電子契約サービスで署名が完了すると、署名状況・締結済み原本・証明記録を取り込みます。</Banner> : null}

      <Section title="確認と締結" sub="業務上の確認（各社の担当）と、締結（権限者の署名）を別々に管理します">
        <ReviewAndSign c={c} viewerCompany={JV_COMPANY} />
      </Section>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "clauses", label: "条項と協議", count: openClauses || undefined },
          { value: "sign", label: "署名の記録", count: c.sign_events.length || undefined },
          { value: "original", label: "締結済み原本" },
        ]}
      />
      {tab === "clauses" ? (
        c.clauses.length ? (
          <div className="stack">
            <p className="small muted">社内メモ（社内のみ）は相手に表示されません。相手に提示した文面だけが顧客の画面に出ます。相手の社内メモはこの画面にも表示されません。</p>
            <ClauseList clauses={c.clauses} viewerCompany={JV_COMPANY} />
          </div>
        ) : (
          <p className="small muted card">この契約は条項の協議記録がありません（締結時の原本を参照してください）。</p>
        )
      ) : null}
      {tab === "sign" ? (
        <Section title="電子契約サービスから取り込んだ記録" sub="署名者と文書の版が一致した結果だけを反映します。重複した通知と版の異なる結果は記録だけ残します">
          <SignEventList events={c.sign_events} />
        </Section>
      ) : null}
      {tab === "original" ? (
        c.status === "signed" && c.original_sha256 ? (
          <Section title="締結済み原本">
            <dl className="ct-kv-grid">
              <div><dt>締結日時</dt><dd>{c.signed_at ? formatDateTime(c.signed_at) : "—"}</dd></div>
              <div><dt>証明記録</dt><dd className="mono">{c.certificate_id}</dd></div>
              <div><dt>文書の版</dt><dd>v{c.version}</dd></div>
              <div><dt>原本のハッシュ</dt><dd><HashDisplay value={c.original_sha256} verified="match" /></dd></div>
            </dl>
          </Section>
        ) : (
          <p className="small muted card">まだ締結されていません。締結後に原本と証明記録が表示されます。</p>
        )
      ) : null}
      <LegalNote />

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="確定版を署名者に送付しますか？"
        message={`文書 v${c.version} を ${c.signers.length} 名の署名者に電子契約サービスで送付します。送付後に条項を変えると、新しい版として再送付が必要です。`}
        confirmLabel="送付する"
        onConfirm={() => { setConfirm(false); setSent(true); toast({ kind: "success", message: "確定版を送付しました" }); }}
      />
    </ProjectLayout>
  );
}
