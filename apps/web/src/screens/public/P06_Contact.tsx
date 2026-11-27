// 画面ID: P-06 お問い合わせ・PoC申込
import "./public.css";
import { useEffect, useState } from "react";
import { Banner, Button, Checkbox, Icon, PublicLayout, Radio, Select, TextArea, TextField } from "../../ui";
import { paths } from "../../lib/paths";
import { Link, useScreenState } from "../../lib/router";

type Form = { company: string; name: string; email: string; phone: string; size: string; git: string; kind: string; body: string; agree: boolean };
const empty: Form = { company: "", name: "", email: "", phone: "", size: "", git: "github", kind: "poc", body: "", agree: false };
const filled: Form = { company: "サンプル受託開発株式会社", name: "山田 花子", email: "yamada@example.com", phone: "03-0000-0000", size: "10-25", git: "github", kind: "poc", body: "2案件で PoC を検討しています。", agree: true };

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.company.trim()) e.company = "会社名を入力してください";
  if (!f.name.trim()) e.name = "氏名を入力してください";
  if (!f.email.trim()) e.email = "メールアドレスを入力してください";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = "メールアドレスの形式が正しくありません";
  if (!f.agree) e.agree = "プライバシーポリシーへの同意が必要です";
  return e;
}

export function P06Contact() {
  const state = useScreenState();
  const [form, setForm] = useState<Form>(state === "入力エラー" ? { ...empty, email: "yamada@" } : state === "入力" ? empty : filled);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>(state === "入力エラー" ? validate({ ...empty, email: "yamada@" }) : {});
  const [phase, setPhase] = useState<"form" | "sending" | "done" | "failed">(state === "送信中" ? "sending" : state === "送信完了" ? "done" : state === "送信失敗" ? "failed" : "form");
  useEffect(() => {
    setPhase(state === "送信中" ? "sending" : state === "送信完了" ? "done" : state === "送信失敗" ? "failed" : "form");
    if (state === "入力エラー") {
      const f = { ...empty, email: "yamada@" };
      setForm(f);
      setErrors(validate(f));
    } else {
      setErrors({});
    }
  }, [state]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const submit = () => {
    const e = validate(form);
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setPhase("sending");
    window.setTimeout(() => setPhase("done"), 1200);
  };
  const errorCount = Object.values(errors).filter(Boolean).length;
  return (
    <PublicLayout>
      <section className="section">
        <div className="container contact-grid">
          <div className="stack" style={{ ["--gap" as string]: "18px" }}>
            <span className="eyebrow">CONTACT</span>
            <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>お問い合わせ・PoC申込</h1>
            <p className="lead">PoC は1案件を対象に、約3か月で進めます。料金や導入方法のご相談もこちらからどうぞ。</p>
            <div className="card stack" style={{ ["--gap" as string]: "14px" }}>
              <strong className="strong">PoC の流れ</strong>
              {[
                { t: "ヒアリング（1〜2週）", b: "現在の開発プロセスと成果物を整理します。" },
                { t: "セットアップ（2週）", b: "GitHub App を導入し、警告モードで開始します。" },
                { t: "運用と評価（6〜8週）", b: "ゲートと証跡を運用し、誤ブロック率や準備時間を測ります。" },
                { t: "振り返り", b: "結果をもとに本導入の範囲を決めます。" },
              ].map((s, i) => (
                <div key={s.t} className="row top nowrap" style={{ ["--gap" as string]: "12px" }}>
                  <span className="avatar">{i + 1}</span>
                  <div className="stack" style={{ ["--gap" as string]: "2px" }}><span className="strong">{s.t}</span><span className="small muted">{s.b}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
            {phase === "done" ? (
              <div className="empty">
                <span className="empty-icon" style={{ background: "var(--tone-pass-bg)", color: "var(--tone-pass)" }}><Icon name="checkCircle" /></span>
                <h3>送信しました</h3>
                <p>お問い合わせありがとうございます。2営業日以内に担当者からご連絡します。確認のメールを {form.email || "ご入力のアドレス"} に送りました。</p>
                <div className="row" style={{ marginTop: 8 }}>
                  <Button variant="secondary" to={paths.home()}>トップへ戻る</Button>
                  <Button variant="ghost" to={paths.features()}>機能を見る</Button>
                </div>
              </div>
            ) : (
              <form className="stack" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
                {phase === "failed" ? <Banner tone="fail" title="送信できませんでした">通信に失敗しました。入力内容は保持されています。時間をおいて再度送信してください。</Banner> : null}
                {errorCount ? <Banner tone="fail" title={`${errorCount}件の入力エラーがあります`}>赤く表示された項目を確認してください。</Banner> : null}
                <div className="grid cols-2">
                  <TextField label="会社名" required value={form.company} onChange={(v) => set("company", v)} error={errors.company} />
                  <TextField label="氏名" required value={form.name} onChange={(v) => set("name", v)} error={errors.name} />
                  <TextField label="メールアドレス" required type="email" value={form.email} onChange={(v) => set("email", v)} error={errors.email} />
                  <TextField label="電話番号" type="tel" value={form.phone} onChange={(v) => set("phone", v)} />
                </div>
                <Select label="従業員数" value={form.size} onChange={(v) => set("size", v)} placeholder="選択してください" options={[{ value: "1-9", label: "1〜9名" }, { value: "10-25", label: "10〜25名" }, { value: "26-100", label: "26〜100名" }, { value: "101+", label: "101名以上" }]} />
                <div className="field">
                  <span className="field-label">使用している Git サービス</span>
                  <div className="row" style={{ ["--gap" as string]: "16px" }}>
                    {[{ v: "github", l: "GitHub" }, { v: "gitlab", l: "GitLab" }, { v: "other", l: "その他" }].map((o) => <Radio key={o.v} name="git" value={o.v} label={o.l} checked={form.git === o.v} onChange={(v) => set("git", v)} />)}
                  </div>
                </div>
                <div className="field">
                  <span className="field-label">相談の種類</span>
                  <div className="row" style={{ ["--gap" as string]: "16px" }}>
                    {[{ v: "poc", l: "PoC" }, { v: "price", l: "料金" }, { v: "other", l: "その他" }].map((o) => <Radio key={o.v} name="kind" value={o.v} label={o.l} checked={form.kind === o.v} onChange={(v) => set("kind", v)} />)}
                  </div>
                </div>
                <TextArea label="内容" value={form.body} onChange={(v) => set("body", v)} rows={5} maxLength={2000} placeholder="現在の開発体制や、気になっている点をご記入ください" />
                <div className="field">
                  <Checkbox label={<span><Link to={paths.privacy()}>プライバシーポリシー</Link>に同意する（必須）</span>} checked={form.agree} onChange={(v) => set("agree", v)} />
                  {errors.agree ? <span className="field-error">{errors.agree}</span> : null}
                </div>
                <Button variant="primary" size="lg" type="submit" loading={phase === "sending"} block>{phase === "sending" ? "送信しています…" : phase === "failed" ? "再送信" : "送信"}</Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
