// 画面ID: G-04 ゲートの適用設定
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { ENFORCEMENT_LEVEL } from "../../lib/vocab";
import type { EnforcementLevel } from "../../lib/vocab";
import { formatDate } from "../../lib/format";
import { enforcementAudit, enforcementScopes, gateKinds, sodRules } from "../../mocks/gates";
import {
  Banner,
  Button,
  EnforcementBadge,
  ErrorState,
  Modal,
  PageHeader,
  ProjectLayout,
  Section,
  Select,
  Skeleton,
  SoDNotice,
  Tag,
  TextArea,
  Timeline,
  Toggle,
  useToast,
} from "../../ui";

const LEVELS: EnforcementLevel[] = ["warnOnly", "soft", "hard"];

export function GateSettingsScreen({ org, project }: { org: string; project: string }) {
  const state = useScreenState();
  const toast = useToast();
  const [changeOpen, setChangeOpen] = useState(false);
  const [pauseTarget, setPauseTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [level, setLevel] = useState<string>("hard");
  const pending = state !== "noPending";
  const readOnly = state === "readOnly";

  return (
    <ProjectLayout org={org} project={project} active="gateSettings" trail={[{ label: "ゲート実行", to: paths.gates(org, project) }, { label: "ゲートの適用設定" }]}>
      <PageHeader
        title="ゲートの適用設定"
        description="強制レベルを「警告のみ → ソフト → ハード」の順に段階的に上げます。プロジェクト・ブランチ・リリースごとに設定でき、変更・停止・再開はすべて申請と承認を経て監査記録に残ります。"
        actions={
          <>
            <Button icon="shieldCheck" to={paths.gateRegistration(org, project)}>必須チェックの登録状況</Button>
            <Button variant="primary" icon="edit" disabled={readOnly} disabledReason="変更の申請はポリシー管理者が行います" onClick={() => setChangeOpen(true)}>変更を申請</Button>
          </>
        }
      />
      {state === "loading" ? (
        <Skeleton variant="detail" />
      ) : state === "error" ? (
        <ErrorState />
      ) : (
        <>
          {pending ? (
            <Banner tone="warn" title="承認待ちの変更が 1 件あります" action={<Button size="sm" variant="primary" disabled={readOnly} disabledReason="承認は CTO または経営者（申請者以外）が行います" onClick={() => toast({ kind: "success", message: "変更を承認しました。2027-01-15 から適用します" })}>承認する</Button>}>
              プロジェクトの既定をソフトからハードへ（2027-01-15 から）。申請者: 山本 結衣（ポリシー管理者）。承認されるまで現在の設定のままです。
            </Banner>
          ) : null}
          {readOnly ? <SoDNotice reason="あなたは閲覧のみです。ゲートの適用設定の変更はポリシー管理者が申請し、CTO または経営者（申請者以外）が承認します。" /> : null}

          <Section title="段階導入の状況" sub="強制レベルの意味: 警告のみ＝ブロックしない／ソフト＝例外の承認で通過できる／ハード＝例外でも通過できない">
            <div className="grid cols-3">
              {LEVELS.map((l, i) => (
                <div key={l} className="card tight stack" style={{ ["--gap" as string]: "6px" }}>
                  <div className="row between"><EnforcementBadge level={l} /><span className="tiny muted">段階 {i + 1}</span></div>
                  <span className="small">{ENFORCEMENT_LEVEL[l].description}</span>
                  <span className="tiny muted">{l === "warnOnly" ? "2026-10-01 から適用済み" : l === "soft" ? "2026-11-01 から適用中（プロジェクトの既定）" : "2027-01-15 から予定（承認待ち）"}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="適用範囲ごとの強制レベル" sub="より狭い範囲の設定が優先されます（リリース ＞ ブランチ ＞ プロジェクト）" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>範囲</th><th>対象</th><th>強制レベル</th><th>適用開始</th><th>次の段階</th></tr></thead>
                <tbody>
                  {enforcementScopes.map((r) => (
                    <tr key={r.id}>
                      <td><Tag square>{r.scope}</Tag></td>
                      <td className="mono small">{r.target}</td>
                      <td><EnforcementBadge level={r.level} /></td>
                      <td className="small">{formatDate(r.since)}</td>
                      <td className="small">{r.next ? <span className="row" style={{ ["--gap" as string]: "6px" }}><EnforcementBadge level={r.next.level} />{formatDate(r.next.date)}<Tag tone="warn">{r.next.status}</Tag></span> : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="ゲートの種類" sub="PR／MR 以外のマイルストーン・顧客承認・リリース・受入にもゲートを置けます。停止・再開は承認が必要です" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>ゲート</th><th>判定のきっかけ</th><th>強制レベル</th><th>状態</th><th></th></tr></thead>
                <tbody>
                  {gateKinds.map((g) => {
                    const paused = g.paused || (state === "paused" && g.key === "release");
                    return (
                      <tr key={g.key}>
                        <td className="strong">{g.name}</td>
                        <td className="small">{g.trigger}</td>
                        <td><EnforcementBadge level={g.level} /></td>
                        <td>{paused ? <Tag tone="warn" icon="clock">一時停止中（12/1 再開予定）</Tag> : <Tag tone="pass" icon="check">有効</Tag>}</td>
                        <td className="num">
                          <Button size="sm" variant="ghost" disabled={readOnly} disabledReason="ポリシー管理者が申請します" onClick={() => setPauseTarget(g.name)}>{paused ? "再開を申請" : "一時停止を申請"}</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="職務分離" sub="ポリシーの変更・例外の承認・ゲートの停止は、申請者と承認者を分けます。管理者による無条件のバイパスはありません" flush>
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>操作</th><th>申請できる人</th><th>承認できる人</th><th>できない人</th></tr></thead>
                <tbody>
                  {sodRules.map((r) => (
                    <tr key={r.op}>
                      <td className="strong small">{r.op}</td>
                      <td className="small">{r.request}</td>
                      <td className="small">{r.approve}</td>
                      <td className="small"><Tag tone="fail" icon="xCircle">{r.never}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="変更・停止・再開の記録" sub="監査ログにも同じ内容を記録します">
            <Timeline items={enforcementAudit} />
          </Section>
        </>
      )}

      <Modal
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        title="強制レベルの変更を申請"
        description="承認されるまで現在の設定のままです。申請者は承認できません。"
        footer={
          <>
            <Button variant="ghost" onClick={() => setChangeOpen(false)}>キャンセル</Button>
            <Button variant="primary" disabled={!reason.trim()} disabledReason="理由を入力してください" onClick={() => { setChangeOpen(false); toast({ kind: "success", message: "変更を申請しました。承認者に通知しました" }); }}>申請する</Button>
          </>
        }
      >
        <div className="stack">
          <div className="grid cols-2">
            <Select label="範囲" value="project" onChange={() => undefined} options={[{ value: "project", label: "プロジェクトの既定" }, { value: "branch", label: "ブランチ" }, { value: "release", label: "リリース" }]} />
            <Select label="新しい強制レベル" value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: ENFORCEMENT_LEVEL[l].label }))} />
          </div>
          <TextArea label="理由" required rows={3} value={reason} onChange={setReason} placeholder="例: 誤ブロック率が 2 か月連続で 5% 未満になったため" />
          <Toggle label="既存の判定結果は変更しない" description="過去の判定は判定時のルール版で保持します（変更できません）" checked disabled onChange={() => undefined} />
        </div>
      </Modal>
      <Modal
        open={pauseTarget !== null}
        onClose={() => setPauseTarget(null)}
        title={`${pauseTarget ?? ""}の停止・再開を申請`}
        description="停止中もゲートの判定は記録され、停止期間は監査パックに明記されます。"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPauseTarget(null)}>キャンセル</Button>
            <Button variant="primary" onClick={() => { setPauseTarget(null); toast({ kind: "success", message: "申請しました。CTO の承認後に反映します" }); }}>申請する</Button>
          </>
        }
      >
        <div className="stack">
          <TextArea label="理由" required rows={3} placeholder="例: 顧客ポータルの移行作業のため" />
          <Select label="自動で再開する日" value="2026-12-01" onChange={() => undefined} options={[{ value: "2026-12-01", label: "2026-12-01" }, { value: "2026-12-08", label: "2026-12-08" }]} help="再開日のない停止はできません" />
        </div>
      </Modal>
    </ProjectLayout>
  );
}
