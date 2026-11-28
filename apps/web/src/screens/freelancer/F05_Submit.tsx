// 画面ID: F-05 成果の提出
import "./freelancer.css";
import { useState } from "react";
import { useRoute, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate } from "../../lib/format";
import { latestTerms } from "../../mocks/engagement";
import { gitSources, myOrderById } from "../../mocks/freelancer";
import { Banner, Button, Checkbox, FreelancerLayout, Icon, Section, Select, Tag, TextArea, TextField, useToast } from "../../ui";
import { Receipt, useClient } from "./parts";

const IMPORTED = { url: "https://github.example/sample-soft/order-web/pull/158", sha: "4e7d1c09b2a35f6e8d9c0b1a2f3e4d5c6b7a8f90", title: "受注検索に状態と営業所の絞り込みを追加", ci: "GitHub Actions: 成功（単体テスト 31件）" };
const DRAFT_KEY = "fx-submit-draft";

export function F05Submit() {
  const state = useScreenState();
  const toast = useToast();
  const { params } = useRoute();
  const [client, setClient] = useClient();
  const order = myOrderById(params.id ?? "") ?? myOrderById("ORD-0106")!;
  const terms = latestTerms(order);

  const imported = state === "参照を取込済み" || state === "提出済み（控え）";
  const restored = state === "下書きを復元";
  const [source, setSource] = useState("github");
  const [form, setForm] = useState({
    url: imported || restored ? IMPORTED.url : "",
    sha: imported ? IMPORTED.sha : "",
    artifact: "",
    checks: restored || imported ? "単体テスト 31件成功。状態と営業所の組合せ 12 通りを手元で確認" : "",
    notes: restored ? "営業所の一覧は受注データの営業所コードから作成（INQ-0040 の暫定案）" : "",
  });
  const [crit, setCrit] = useState<Record<string, boolean>>(Object.fromEntries(terms.completion_criteria.map((c) => [c, imported])));
  const [importing, setImporting] = useState(false);
  const [importFailed, setImportFailed] = useState(state === "連携障害（確認待ち）");
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState<{ number: string; pending: boolean } | null>(state === "提出済み（控え）" ? { number: `SUB-${order.id}-1`, pending: false } : null);
  const sessionExpired = state === "セッション切れ";

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const saveDraft = () => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ order: order.id, form }));
    } catch {
      /* 保存できない環境でも画面上の入力は残る */
    }
    toast({ kind: "success", message: "下書きを保存しました。通信が切れても続きから入力できます" });
  };
  const importRef = () => {
    setImporting(true);
    window.setTimeout(() => {
      setImporting(false);
      if (source === "codecommit") {
        setImportFailed(true);
        return;
      }
      setForm((f) => ({ ...f, url: IMPORTED.url, sha: IMPORTED.sha }));
      toast({ kind: "success", message: "PR と確定コミットを取り込みました" });
    }, 700);
  };
  const shaValid = /^[0-9a-f]{7,40}$/.test(form.sha);
  const ready = form.url.trim() && (shaValid || form.artifact.trim()) && form.checks.trim();
  const submit = () => {
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setReceipt({ number: `SUB-${order.id}-1`, pending: importFailed });
    }, 800);
  };

  return (
    <FreelancerLayout active="orders" client={client} onClientChange={setClient}>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <span className="mono tiny muted">{order.id} · {order.client_company}</span>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)", overflowWrap: "anywhere" }}>成果の提出: {order.title}</h1>
        <p className="small muted">普段の開発環境で作った成果の参照を提出します。コードの本文をここに貼る必要はありません。</p>
      </div>

      {sessionExpired ? (
        <Banner tone="warn" title="セッションが切れました" action={<Button size="sm" variant="primary" icon="mail" onClick={() => toast({ kind: "success", message: "確認コードを送りました。入力内容はそのまま残っています" })}>確認コードで再開</Button>}>
          入力中の内容は残っています。メールに届くコードで本人確認すると、続きから提出できます。
        </Banner>
      ) : null}
      {restored ? <Banner tone="info" title="前回の下書きを復元しました">2026-11-27 09:58 に保存した下書きです。内容を確認して続けてください。</Banner> : null}

      {receipt ? (
        <div className="stack">
          <Receipt title={receipt.pending ? "提出を受け付けました（参照の確認待ち）" : "提出を受け付けました"} number={receipt.number} at="2026-11-27T10:33:00+09:00">
            <span className="small">提出した版: <span className="mono">{form.sha ? form.sha.slice(0, 12) : form.artifact}</span>。PR にあとからコミットが増えても、この版を検収の対象にします。</span>
            {receipt.pending ? <span className="small">Git サービスから参照を取得できなかったため、窓口が参照を確認します。提出日時はこの控えのとおり記録されています。</span> : null}
            <span className="small">次は委託元の検収者が確認します（検収予定日 {formatDate(terms.inspection_due)}）。顧客への説明やリリースの手配は窓口が行います。</span>
          </Receipt>
          <div className="fx-actions">
            <Button variant="primary" to={paths.freelancerResult(order.id)} iconRight="arrowRight">提出結果を見る</Button>
            <Button icon="download" onClick={() => toast({ kind: "success", message: "提出控えを保存しました" })}>控えを保存</Button>
          </div>
        </div>
      ) : (
        <>
          <Section title="合意した完成条件" sub={`v${order.accepted_version ?? terms.version} の条件。提出前に確認できたものにチェックを入れてください（任意）`}>
            <div className="stack" style={{ ["--gap" as string]: "6px" }}>
              {terms.completion_criteria.map((c) => <Checkbox key={c} label={c} checked={crit[c]} onChange={(v) => setCrit((x) => ({ ...x, [c]: v }))} />)}
            </div>
          </Section>

          <Section title="成果の参照">
            <div className="stack">
              <div className="row" style={{ ["--gap" as string]: "8px", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 180px" }}><Select label="使っている Git サービス" value={source} onChange={setSource} options={gitSources} /></div>
                <Button icon="download" loading={importing} onClick={importRef}>参照を取り込む</Button>
              </div>
              {importFailed ? (
                <Banner tone="warn" title="Git サービスから参照を取得できませんでした">
                  連携先が応答していません。URL と確定コミットを手で入力すれば提出できます。提出は「確認待ち」として受け付け、提出日時は記録されます。
                </Banner>
              ) : null}
              <TextField label="PR / MR の URL" required value={form.url} onChange={set("url")} placeholder="https://..." />
              <TextField label="確定コミット（SHA）" value={form.sha} onChange={set("sha")} placeholder="例: 4e7d1c09b2a3" help="提出した時点の版を固定します。PR にあとからコミットが増えても、この版を検収します" error={form.sha && !shaValid ? "16進数の 7〜40 文字で入力してください" : undefined} />
              <TextField label="成果物の識別子（コミットがない場合）" value={form.artifact} onChange={set("artifact")} placeholder="例: ビルド番号、ファイルのハッシュ" />
              {form.sha === IMPORTED.sha ? <span className="small"><Tag tone="pass" icon="check" square>取込済み</Tag> {IMPORTED.title} · {IMPORTED.ci}</span> : null}
            </div>
          </Section>

          <Section title="確認結果と注意点">
            <div className="stack">
              <TextArea label="確認結果" required rows={3} value={form.checks} onChange={set("checks")} placeholder="例: 単体テスト 31件成功。組合せ 12 通りを手元で確認" />
              <TextArea label="注意点（任意）" rows={3} value={form.notes} onChange={set("notes")} placeholder="例: 営業所の一覧は暫定の方法で作成しています" />
            </div>
          </Section>

          <div className="fx-actions fx-sticky-actions">
            <Button variant="primary" icon="send" loading={sending} disabled={!ready || sending || sessionExpired} disabledReason={sessionExpired ? "本人確認をしてから提出してください" : "URL、確定コミットまたは成果物の識別子、確認結果を入力してください"} onClick={submit}>提出する</Button>
            <Button icon="file" onClick={saveDraft}>下書きを保存</Button>
          </div>
          <p className="tiny muted"><Icon name="info" size={12} /> 送信中はボタンを押せません。同じ内容を二重に提出することはありません。</p>
        </>
      )}
    </FreelancerLayout>
  );
}
