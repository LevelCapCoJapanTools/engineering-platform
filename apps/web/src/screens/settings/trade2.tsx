// 取引の関係者（受託者・発注企業）の招待と失効、権限の適用範囲、AI仲介（2026-11-28 追補。資料 01・35・36・38）
import { paths } from "../../lib/paths";
import { relativeTime } from "../../lib/format";
import { externalInvites, mediationEval } from "../../mocks/common2";
import { Banner, Button, Section, Tag, Toggle, useToast } from "../../ui";

const INVITE_STATUS = {
  active: { label: "利用中", tone: "pass" },
  pending: { label: "招待中", tone: "warn" },
  expired: { label: "期限切れ", tone: "neutral" },
  revoked: { label: "失効", tone: "fail" },
} as const;

/** 受託者・発注企業の招待。案件・取引関係に限定し、契約終了・担当交代で失効する */
export function ExternalInvitesSection({ org, compact }: { org: string; compact?: boolean }) {
  const toast = useToast();
  const rows = compact ? externalInvites.filter((i) => i.status === "revoked" || i.status === "pending") : externalInvites;
  return (
    <Section
      title="受託者・発注企業の招待"
      sub="招待は案件と取引関係の範囲だけを開けます。招待先と別の人（転送先）は開けません。契約終了・担当交代で権限を失効し、旧リンクも無効にします"
      actions={<Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.tradeScopes(org)}>取引関係と案件の権限</Button>}
      flush
    >
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>相手</th><th>役割</th><th>開ける範囲</th><th>状態</th><th>有効期限</th><th>最終利用</th>{compact ? null : <th />}</tr></thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td><div className="strong small">{i.name}</div><div className="tiny muted">{i.company} · {i.email}</div></td>
                <td className="small">{i.role}</td>
                <td className="small">{i.scope}</td>
                <td><Tag tone={INVITE_STATUS[i.status].tone} square>{INVITE_STATUS[i.status].label}</Tag>{i.reason ? <div className="tiny muted" style={{ maxWidth: 260 }}>{i.reason}</div> : null}</td>
                <td className="small">{i.expires}</td>
                <td className="small">{i.last_access ? relativeTime(i.last_access) : "—"}</td>
                {compact ? null : (
                  <td>
                    {i.status === "active" ? <Button size="sm" variant="ghost" onClick={() => toast({ kind: "success", message: `${i.name} の権限を失効しました。発行済みのリンクと送信待ちの通知も無効にしました` })}>失効</Button> : null}
                    {i.status === "pending" ? <Button size="sm" variant="ghost" onClick={() => toast({ kind: "success", message: "招待を再送しました（古いリンクは無効）" })}>再送</Button> : null}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/** 範囲の適用先（本文・添付・検索・出力・通知先まで同じ範囲） */
export function ScopeApplicationSection({ org }: { org: string }) {
  const targets = [
    { name: "画面の本文", rule: "範囲外の案件・発注・金額は表示しない（件数・合計にも含めない）" },
    { name: "添付・資料", rule: "公開版として固定した版だけ。原本の URL は出さない" },
    { name: "検索", rule: "範囲外の結果は件数も出さない。候補の補完にも出さない" },
    { name: "出力（CSV・PDF・購読）", rule: "画面と同じ範囲で組み立てる。合計からの逆算ができる列は出さない" },
    { name: "通知・チャット", rule: "受託者は本人だけ、顧客は承認済みの公開範囲の項目だけ" },
    { name: "AI の回答", rule: "公開版の資料だけを参照し、範囲外の値を回答に使わない" },
  ];
  return (
    <Section
      title="範囲の適用先"
      sub="経営層の閲覧範囲に加え、テナント・発注・担当者ごとの範囲を、次のすべてに同じように適用します（サーバー側で強制）"
      actions={<Button size="sm" icon="eye" to={paths.disclosure(org, "order-renewal")}>顧客への公開設定</Button>}
      flush
    >
      <div className="table-wrap">
        <table className="table compact">
          <thead><tr><th>適用先</th><th>規則</th></tr></thead>
          <tbody>{targets.map((t) => <tr key={t.name}><td className="strong small">{t.name}</td><td className="small">{t.rule}</td></tr>)}</tbody>
        </table>
      </div>
    </Section>
  );
}

/** 顧客データの AI 利用（既定は無効。評価済みの範囲で有効化） */
export function CustomerDataAiSection({ org, enabled }: { org: string; enabled: boolean }) {
  const toast = useToast();
  const scopes = [
    { name: "受託者の技術質問への回答案（承認済み SOW・決定事項のみ）", evaluated: true, on: true },
    { name: "顧客向けの説明文案（公開版の資料のみ）", evaluated: true, on: true },
    { name: "顧客からのメール返信の要約", evaluated: false, on: false },
    { name: "契約条項の差分の説明", evaluated: false, on: false },
  ];
  return (
    <Section
      title="顧客データの AI 利用（案件窓口の仲介）"
      sub="顧客から受け取ったデータを AI に送ることは既定で無効です。評価を通った用途だけを有効にでき、評価前の用途は有効にできません"
      actions={<Button size="sm" variant="ghost" iconRight="arrowRight" to={paths.aiMediation(org)}>AI仲介の記録</Button>}
    >
      <div className="stack" style={{ ["--gap" as string]: "8px" }}>
        {!enabled ? <Banner tone="info">組織で AI 機能が無効のため、窓口は定型文と人手で対応します。受付・手動返信・検収・リリース判断は続けられます。</Banner> : null}
        {scopes.map((s) => (
          <div key={s.name} className="card tight">
            <Toggle
              label={s.name}
              description={s.evaluated ? "評価済み（S-11）" : "未評価のため有効にできません"}
              defaultChecked={enabled && s.on}
              disabled={!enabled || !s.evaluated}
              onChange={() => toast({ kind: "success", message: "変更を保存すると、以後の仲介に適用します" })}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

/** 仲介の評価（誤った納期の確約・他社情報の混入・根拠なし回答） */
export function MediationEvalSection() {
  return (
    <Section title="仲介の評価（架空データ）" sub="誤りを検出して送信前に保留できたかを確かめます。見落としがある用途は有効にしません" flush>
      <div className="table-wrap">
        <table className="table compact">
          <thead><tr><th>試験の種類</th><th>件数</th><th>検出</th><th>保留できた</th><th>見落とし</th><th>判定</th></tr></thead>
          <tbody>
            {mediationEval.map((m) => (
              <tr key={m.case}>
                <td className="strong small">{m.case}</td>
                <td className="small">{m.total}</td>
                <td className="small">{m.detected}</td>
                <td className="small">{m.held}</td>
                <td className="small">{m.missed}</td>
                <td>{m.missed === 0 ? <Tag tone="pass" square>基準を満たす</Tag> : <Tag tone="warn" square>人の確認を必須に</Tag>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
