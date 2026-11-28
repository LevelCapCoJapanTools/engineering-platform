// 画面ID: X-04 評価者ビュー
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { CONTROL_STATUS } from "../../lib/vocab";
import { controls, evidence, manifests } from "../../mocks/core";
import { sharedControlIds } from "../../mocks/external";
import { ActorLabel, Banner, Button, ControlLayerTag, EmptyState, EvidenceItem, Icon, KeyValueList, PortalLayout, SignatureBadge, StatusBadge, Tag, cx } from "./deps";
import "./external.css";

/** 統制項目ごとに表示する証跡（モック） */
const EVIDENCE_BY_CONTROL: Record<string, string[]> = {
  "CTL-PM-001": ["EV-1203"],
  "CTL-PM-002": ["EV-1201"],
  "CTL-PM-004": ["EV-1201", "EV-1202"],
  "CTL-SI-002": ["EV-1201"],
  "CTL-SI-003": ["EV-1206"],
  "CTL-SI-004": ["EV-1202"],
  "CTL-SI-005": ["EV-1203", "EV-1204"],
  "CTL-SI-007": ["EV-1205"],
};

export function X04AssessorView({ token }: { token: string }) {
  const state = useScreenState();
  const shared = controls.filter((c) => sharedControlIds.includes(c.id));
  const [selected, setSelected] = useState(shared[0].id);
  const c = shared.find((x) => x.id === selected) ?? shared[0];
  const evs = evidence.filter((e) => (EVIDENCE_BY_CONTROL[c.id] ?? []).includes(e.id));
  const man = manifests[0];

  if (state === "期限切れ" || state === "失効済み") {
    return (
      <PortalLayout external="assessor" wide>
        <div className="card">
          <EmptyState
            icon={state === "期限切れ" ? "clock" : "lock"}
            title={state === "期限切れ" ? "この共有リンクは有効期限が切れています" : "この共有リンクは共有元により失効されました"}
            description="閲覧を続けるには、共有元（サンプルソフト株式会社）に新しいリンクの発行を依頼してください。"
            action={<span className="mono tiny muted">リンクID: {token}</span>}
          />
        </div>
      </PortalLayout>
    );
  }

  if (state === "本人確認前") {
    return (
      <PortalLayout external="assessor" wide>
        <div className="card stack" style={{ ["--gap" as string]: "12px", maxWidth: 520, margin: "0 auto" }}>
          <h1 style={{ fontSize: "var(--text-lg)", color: "var(--text-strong)" }}>共有された監査パックを開く</h1>
          <p className="small muted">このリンクは assessor@review-office.example 宛てです。本人確認のため、メールに送った 6 桁のコードを入力してください。</p>
          <label className="field"><span className="field-label">確認コード</span><input className="input" inputMode="numeric" placeholder="123456" aria-label="確認コード" /></label>
          <div className="row"><Button variant="primary">確認して開く</Button><Button variant="ghost">コードを再送</Button></div>
          <p className="tiny muted">コードの有効期限は 10 分です。5 回続けて間違えるとリンクを一時停止し、共有元に通知します。</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout external="assessor" wide>
      <div className="row between">
        <div className="stack" style={{ ["--gap" as string]: "4px" }}>
          <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>受発注システム刷新 監査パック</h1>
          <span className="small muted">対象: v1.2.0〜v1.3.0（2026-09-01〜2026-11-05） · 共有元: サンプルソフト株式会社 山本 結衣</span>
        </div>
        <Button variant="primary" icon="download">監査パックをダウンロード（ZIP）</Button>
      </div>
      <Banner tone="info" title="閲覧専用の共有リンクです（有効期限: 2026-12-11、あと14日）">
        この画面では閲覧のみ行えます。閲覧とダウンロードの記録は共有元の監査ログに残ります。本パックは ISO/IEC 29110 の適合準備のための証跡であり、認証の判断は評価者が行います。
        <div className="tiny" style={{ marginTop: 6 }}>共有範囲: 統制項目 8 件・リリース 2 件（v1.2.0〜v1.3.0）のみ。共有元の他の案件や顧客の情報は含まれません。ダウンロードしたファイルには閲覧者のメールアドレスが記録されます。</div>
      </Banner>
      <div className="row end"><Button size="sm" variant="ghost" icon="message">出力形式についてのフィードバックを送る</Button></div>

      <section className="card row between" style={{ flexWrap: "wrap" }}>
        <div className="row" style={{ ["--gap" as string]: "12px" }}>
          <SignatureBadge state={man.signature} size="lg" />
          <div className="stack" style={{ ["--gap" as string]: "2px" }}>
            <span className="strong">Evidence Manifest {man.id}（{man.target}）の署名を検証しました</span>
            <span className="tiny muted">署名者 signer@sample-soft.app.example · 透明性ログに記録あり · 検証 2026-11-27 10:30 JST</span>
          </div>
        </div>
        <Button size="sm" icon="fileText">検証手順を表示</Button>
      </section>

      <div className="assessor-grid">
        <nav className="assessor-toc" aria-label="統制項目">
          <span className="label" style={{ padding: "0 10px 6px" }}>統制項目（{shared.length}）</span>
          {shared.map((x) => (
            <button key={x.id} type="button" className={cx(x.id === selected && "active")} onClick={() => setSelected(x.id)} aria-current={x.id === selected ? "true" : undefined}>
              <span className="mono" style={{ fontWeight: 700 }}>{x.id}</span>
              <span className="muted" style={{ fontSize: 11, lineHeight: 1.4 }}>{x.description.length > 26 ? `${x.description.slice(0, 26)}…` : x.description}</span>
            </button>
          ))}
        </nav>

        <div className="stack">
          <section className="card stack">
            <div className="row between">
              <span className="row" style={{ ["--gap" as string]: "8px" }}>
                <span className="page-id mono" style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: "var(--primary-tint)", color: "var(--primary)", fontWeight: 700 }}>{c.id}</span>
                <ControlLayerTag layer={c.layer} />
                <Tag square>{c.process} · {c.activity}</Tag>
              </span>
              <StatusBadge vocab={CONTROL_STATUS[c.status]} />
            </div>
            <p className="strong" style={{ fontSize: "var(--text-md)" }}>{c.description}</p>
            <KeyValueList
              items={[
                { label: "根拠の参照", value: <span className="small">{c.source_ref}<span className="muted">（規格本文は表示しません）</span></span> },
                { label: "機械検証", value: c.machine_rule_ids.length ? <span className="row" style={{ ["--gap" as string]: "6px" }}><ActorLabel kind="ci" size="sm" />{c.machine_rule_ids.map((r) => <span key={r} className="mono small">{r}</span>)}</span> : <span className="muted">なし</span> },
                { label: "人間の承認", value: c.human_role ? <span className="row" style={{ ["--gap" as string]: "6px" }}><ActorLabel kind="human" size="sm" />{c.human_role}</span> : <span className="muted">なし</span> },
                { label: "必要な証跡", value: c.evidence_types.join("、") },
              ]}
            />
          </section>

          <section className="card stack" style={{ ["--gap" as string]: "10px" }}>
            <div className="row between">
              <h2 className="section-title">紐づく証跡（{evs.length}）</h2>
              <span className="tiny muted"><Icon name="lock" size={11} /> 閲覧専用</span>
            </div>
            {evs.length ? evs.map((e) => <EvidenceItem key={e.id} ev={e} />) : <p className="small muted">この統制項目に共有された証跡はありません。</p>}
          </section>
        </div>
      </div>
    </PortalLayout>
  );
}
