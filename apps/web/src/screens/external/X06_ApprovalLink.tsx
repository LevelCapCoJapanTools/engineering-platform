// 画面ID: X-06 期限付き承認リンク
// アカウントを持たない実際の承認者（顧客・PM など）が、メールの確認コードで本人確認して承認・差戻しする。
import { useState } from "react";
import type { ReactNode } from "react";
import { useScreenState } from "../../lib/router";
import { Banner, Button, DiffViewer, Icon, KeyValueList, PortalLayout, Tag, TextArea, useToast } from "./deps";
import { ExternalActor } from "../../ui";
import { fakeSha } from "../../mocks/core";

const TARGET = {
  id: "CR-0004",
  kind: "変更要求",
  title: "上限額の判定を税込に変更",
  version: "v2",
  sha: fakeSha("CR-0004-v2"),
  requester: "u-sato",
  approver: "中村 拓也（架空商事株式会社）",
  email: "nakamura@kakuu-shoji.example",
  expires: "2026-12-02 23:59 JST",
  impact: "追加費用 120 万円（貴社負担なし・当社判断済み）、納期への影響なし。関連: REQ-0012、TC-0110",
  before: "発注金額の上限は税抜金額で判定する。",
  after: "発注金額の上限は税込金額で判定する。上限を超える場合は承認者の確認を求める。",
};

export function X06ApprovalLink({ token }: { token: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<"approve" | "return" | null>(null);
  const [done, setDone] = useState<"approve" | "return" | null>(state === "使用済み" ? "approve" : null);

  const submit = (kind: "approve" | "return") => {
    if (busy || done) return;
    setBusy(kind);
    window.setTimeout(() => {
      setBusy(null);
      setDone(kind);
      toast({ kind: "success", message: kind === "approve" ? "承認を記録しました" : "差戻しを記録しました" });
    }, 700);
  };

  const shell = (children: ReactNode) => (
    <PortalLayout external="customer">
      <div className="stack" style={{ ["--gap" as string]: "16px", maxWidth: 720, margin: "0 auto", width: "100%" }}>{children}</div>
    </PortalLayout>
  );

  if (state === "期限切れ") {
    return shell(
      <div className="card stack" style={{ ["--gap" as string]: "10px" }}>
        <h1 style={{ fontSize: "var(--text-lg)", color: "var(--text-strong)" }}><Icon name="clock" /> この承認リンクは期限切れです</h1>
        <p className="small muted">期限（{TARGET.expires}）を過ぎたため使えません。依頼者（佐藤 美咲）に新しいリンクの発行を依頼してください。</p>
        <span className="mono tiny muted">リンクID: {token}</span>
      </div>,
    );
  }

  if (state === "本人確認前") {
    return shell(
      <div className="card stack" style={{ ["--gap" as string]: "12px" }}>
        <span className="small muted">サンプルソフト株式会社からの承認依頼</span>
        <h1 style={{ fontSize: "var(--text-lg)", color: "var(--text-strong)" }}>{TARGET.id} {TARGET.title}</h1>
        <p className="small">このリンクは <span className="mono">{TARGET.email}</span> 宛てです。アカウントの作成は不要です。本人確認のため、メールに送った 6 桁のコードを入力してください。</p>
        <label className="field"><span className="field-label">確認コード</span><input className="input" inputMode="numeric" placeholder="123456" aria-label="確認コード" /></label>
        <div className="row"><Button variant="primary">確認して内容を表示</Button><Button variant="ghost">コードを再送</Button></div>
        <p className="tiny muted">コードの有効期限は 10 分です。リンクの期限: {TARGET.expires}。心当たりがない場合は、このメールを破棄してください。</p>
      </div>,
    );
  }

  const changed = state === "版が変わった";
  const own = state === "自分が作成";
  const blocked = changed || own;

  return shell(
    <>
      <div className="stack" style={{ ["--gap" as string]: "4px" }}>
        <span className="small muted">サンプルソフト株式会社からの承認依頼 · 本人確認済み（{TARGET.email}）</span>
        <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>{TARGET.id} {TARGET.title}</h1>
        <span className="row" style={{ ["--gap" as string]: "8px" }}><Tag square>{TARGET.kind}</Tag><Tag square>対象の版 {TARGET.version}</Tag><span className="tiny muted">期限 {TARGET.expires}</span></span>
      </div>

      <p className="tiny muted row" style={{ ["--gap" as string]: "6px" }}>
        <Icon name="lock" size={12} />このリンクは {TARGET.id} の {TARGET.version}（内容のハッシュ <span className="mono">{TARGET.sha.slice(0, 12)}…</span>）だけに使えます。別の版や別の申請の承認・受入には使えません。
      </p>

      {changed ? (
        <Banner tone="warn" title="依頼の後に対象の内容が変わりました">
          依頼時の版（v2）から v3 に更新されたため、このリンクでは承認できません。依頼者が新しい版で依頼し直すと、新しいリンクが届きます。
        </Banner>
      ) : null}
      {own ? (
        <Banner tone="fail" title="この変更要求はあなたが起票したものです">
          起票者は自分の変更要求を承認できません。別の承認者が承認します。差戻しやコメントは送れません。
        </Banner>
      ) : null}
      {done ? (
        <Banner tone="pass" title={done === "approve" ? "承認を記録しました" : "差戻しを記録しました"}>
          このリンクは使用済みになりました。同じリンクで再度操作することはできません。記録の控えをメールでお送りしました。
        </Banner>
      ) : null}

      <section className="card stack" style={{ ["--gap" as string]: "12px" }}>
        <KeyValueList
          items={[
            { label: "依頼者", value: <ExternalActor userId={TARGET.requester} role="PM" /> },
            { label: "承認者", value: TARGET.approver },
            { label: "影響", value: <span className="small">{TARGET.impact}</span> },
          ]}
        />
        <DiffViewer before={TARGET.before} after={TARGET.after} />
      </section>

      {!done ? (
        <section className="card stack" style={{ ["--gap" as string]: "12px" }}>
          <TextArea label="コメント（差戻しの場合は必須）" rows={3} value={comment} onChange={setComment} />
          <div className="row">
            <Button variant="primary" icon="check" loading={busy === "approve"} disabled={blocked || Boolean(busy)} disabledReason={own ? "起票者は承認できません" : changed ? "対象の版が変わりました" : "処理中です"} onClick={() => submit("approve")}>承認する</Button>
            <Button variant="secondary" icon="arrowLeft" loading={busy === "return"} disabled={blocked || Boolean(busy) || !comment.trim()} disabledReason={blocked ? "このリンクでは操作できません" : "差戻しの理由を入力してください"} onClick={() => submit("return")}>差し戻す</Button>
          </div>
        </section>
      ) : null}

      <section className="card stack" style={{ ["--gap" as string]: "6px", background: "var(--bg-subtle)" }}>
        <span className="small strong">記録される内容</span>
        <span className="small">氏名とメールアドレス、本人確認の方法（メールの確認コード）、操作（承認・差戻し）と日時、コメント、対象の ID・版・内容のハッシュ（<span className="mono">{TARGET.sha.slice(0, 12)}…</span>）、接続元の IP アドレス</span>
        <span className="tiny muted">この記録は依頼元の監査ログと Evidence Manifest に残り、評価者が確認することがあります。</span>
      </section>
    </>,
  );
}
