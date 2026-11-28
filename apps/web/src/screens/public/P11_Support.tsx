// 画面ID: P-11 サポート・脆弱性報告
// サポート窓口と受付時間、重大度ごとの対応目標、脆弱性の受付と修正期限の方針を示す。
import "./public.css";
import { useState } from "react";
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { Banner, Button, Checkbox, FileUpload, PublicLayout, Select, Tag, TextArea, TextField, useToast } from "../../ui";

const SUPPORT = [
  { sev: "緊急", tone: "fail" as const, ex: "全体停止、証跡が保存できない、データの漏えいの疑い", first: "1 時間以内（24 時間 365 日）", update: "1 時間ごと" },
  { sev: "高", tone: "fail" as const, ex: "同期やゲートの判定が止まり、業務に影響", first: "4 営業時間以内", update: "4 時間ごと" },
  { sev: "中", tone: "warn" as const, ex: "一部の画面や通知の不具合（回避策あり）", first: "1 営業日以内", update: "必要に応じて" },
  { sev: "低", tone: "info" as const, ex: "使い方の質問、改善の要望", first: "3 営業日以内", update: "—" },
];

const VULN = [
  { sev: "緊急（CVSS 9.0 以上）", fix: "7 日以内" },
  { sev: "高（7.0〜8.9）", fix: "30 日以内" },
  { sev: "中（4.0〜6.9）", fix: "90 日以内" },
  { sev: "低（3.9 以下）", fix: "次回の定期更新" },
];

export function P11Support() {
  const state = useScreenState();
  const toast = useToast();
  const [kind, setKind] = useState(state === "脆弱性の報告" ? "vuln" : "support");
  const [agree, setAgree] = useState(false);
  const sent = state === "送信完了";
  return (
    <PublicLayout>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container stack" style={{ ["--gap" as string]: "12px" }}>
          <span className="eyebrow">SUPPORT</span>
          <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>サポート・脆弱性報告</h1>
          <p className="lead">受付時間: 平日 9:00〜18:00 JST（緊急の障害は 24 時間 365 日）。契約中のお客様は、サインイン後の画面からも問い合わせできます。</p>
        </div>
      </section>
      <div className="container stack" style={{ ["--gap" as string]: "20px", paddingBottom: 72 }}>
        <section className="card flush">
          <div className="card-header"><h2 className="section-title">重大度ごとの対応目標</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>重大度</th><th>例</th><th>初回の回答</th><th>状況の更新</th></tr></thead>
              <tbody>
                {SUPPORT.map((s) => (
                  <tr key={s.sev}><td><Tag tone={s.tone} square>{s.sev}</Tag></td><td className="small">{s.ex}</td><td className="small">{s.first}</td><td className="small">{s.update}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tiny muted" style={{ padding: "8px 16px" }}>目標値は Team プランのものです。Private プランは契約の SLA に従います。障害の状況は<Link to={paths.status()}>稼働状況</Link>で告知します。</p>
        </section>

        <section className="card stack" style={{ ["--gap" as string]: "12px" }}>
          <h2 className="section-title">脆弱性の報告について</h2>
          <ul className="small" style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>受け付けたことを 1 営業日以内に、内容の確認結果を 3 営業日以内にお知らせします</li>
            <li>修正の目標期限は重大度で決め、修正後に報告者へお知らせします</li>
            <li>善意の調査には法的措置をとりません。他の顧客のデータへのアクセス、サービスの妨害、ソーシャルエンジニアリングは対象外です</li>
            <li>報告の内容は、修正が終わるまで公開しないようお願いします</li>
          </ul>
          <div className="table-wrap">
            <table className="table compact">
              <thead><tr><th>重大度</th><th>修正の目標期限</th></tr></thead>
              <tbody>{VULN.map((v) => <tr key={v.sev}><td className="small">{v.sev}</td><td className="small strong">{v.fix}</td></tr>)}</tbody>
            </table>
          </div>
          <span className="small muted">報告先: security@product.example（PGP 鍵はこのページから取得できます）</span>
        </section>

        <section className="card stack" style={{ ["--gap" as string]: "12px", maxWidth: 760 }}>
          <h2 className="section-title">問い合わせ・報告のフォーム</h2>
          {sent ? (
            <Banner tone="pass" title="受け付けました（受付番号 SUP-20261127-014）">受付の確認をメールでお送りしました。回答は対応目標の時間内にお送りします。</Banner>
          ) : (
            <form className="stack" onSubmit={(e) => e.preventDefault()}>
              <div className="grid cols-2">
                <Select label="種類" value={kind} onChange={setKind} options={[{ value: "support", label: "障害・使い方の問い合わせ" }, { value: "vuln", label: "脆弱性の報告" }, { value: "privacy", label: "個人情報・データ削除の依頼" }]} />
                {kind === "vuln" ? <Select label="想定する重大度" defaultValue="high" options={VULN.map((v, i) => ({ value: String(i), label: v.sev }))} /> : <Select label="重大度" defaultValue="mid" options={SUPPORT.map((s) => ({ value: s.sev, label: s.sev }))} />}
                <TextField label="お名前" required />
                <TextField label="メールアドレス" type="email" required />
                {kind === "support" ? <TextField label="組織の表示ID（契約中の場合）" placeholder="sample-soft" /> : null}
              </div>
              <TextArea label={kind === "vuln" ? "再現手順と影響" : "内容"} required rows={5} help="パスワード、アクセストークン、顧客のデータは書かないでください" />
              <FileUpload label="添付（任意）" accept=".png,.txt,.pdf（10MB まで）" />
              {kind === "vuln" ? <Checkbox label="上記の方針に同意し、修正まで内容を公開しません" checked={agree} onChange={setAgree} /> : null}
              <div><Button variant="primary" icon="send" disabled={kind === "vuln" && !agree} disabledReason="方針への同意が必要です" onClick={() => toast({ kind: "success", message: "受け付けました（モック）。状態「送信完了」で受付後の表示を確認できます" })}>送信</Button></div>
            </form>
          )}
        </section>
      </div>
    </PublicLayout>
  );
}
