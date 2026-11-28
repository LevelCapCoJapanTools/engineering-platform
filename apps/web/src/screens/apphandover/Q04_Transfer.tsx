// 画面ID: Q-04 公開済み iOS アプリの移管
// 譲渡の条件と、利用中の機能ごとの移行作業を確認し、譲渡元の開始と譲渡先の承諾を別のタスクとして照合する（資料 59）。
// 未リリースのアプリはこの手順に進まない。開始だけでは完了にしない。配信チームの移管と契約上の知的資産の帰属は別記録。
import { Link, useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import {
  Banner,
  Button,
  ChecklistPanel,
  EmptyState,
  ErrorState,
  ExternalActor,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  Section,
  Tag,
  useToast,
} from "../../ui";
import type { ChecklistItem } from "../../ui";
import { EXTERNAL_HOLDER, transferApp, transferChecks, transferFeatures } from "../../mocks/apphandover";
import { AppleBoundary, HandoverSteps, PR, orgOf } from "./parts";

export const Q04_STATES = ["条件確認中（既定）", "未リリースのため対象外", "譲渡元が開始済み", "移管完了", "条件不成立", "保留", "エラー"];

type Step = "notStarted" | "done" | "waiting";
const STEP_LABEL: Record<Step, { label: string; tone: "neutral" | "pass" | "warn" }> = {
  notStarted: { label: "未着手", tone: "neutral" },
  waiting: { label: "相手の操作待ち", tone: "warn" },
  done: { label: "完了（照合済み）", tone: "pass" },
};

const FEATURE_STATUS = { done: { label: "完了", tone: "pass" as const }, inProgress: { label: "対応中", tone: "info" as const }, notStarted: { label: "未着手", tone: "neutral" as const } };

export function Q04Transfer({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const toast = useToast();
  const started = state === "譲渡元が開始済み" || state === "移管完了";
  const completed = state === "移管完了";
  const blocked = state === "条件不成立";
  const onHold = state === "保留";

  const checks: ChecklistItem[] = transferChecks.map((c) => {
    if (started) return { id: c.id, title: c.title, state: "ok", detail: c.id === "TC-3" ? "審査の結果が出て、未完了の手続きはありません" : c.id === "TC-4" ? "すべての機能の移行作業を確認済み" : c.detail, actor: "human" };
    if (blocked && c.id === "TC-3") return { id: c.id, title: c.title, state: "ng", detail: "譲渡元で審査中のバージョンが残っているため、条件を満たしません（2026/12/03 記録）", actor: "human" };
    return { id: c.id, title: c.title, state: c.status, detail: c.detail, actor: "human" };
  });
  const allOk = checks.every((c) => c.state === "ok");
  const startStep: Step = started ? "done" : "notStarted";
  const acceptStep: Step = completed ? "done" : started ? "waiting" : "notStarted";

  return (
    <ProjectLayout org={org} project={PR} active="appHandover" trail={[{ label: "アプリの引き渡し" }, { label: "アプリの移管" }]}>
      <PageHeader
        title="公開済み iOS アプリの移管"
        description="別のチームで公開済みのアプリを顧客のチームへ移します。譲渡元と譲渡先の Account Holder が、それぞれ Apple 上で開始と承諾を行います。"
        status={completed ? <Tag tone="pass" square icon="check">移管完了</Tag> : blocked ? <Tag tone="fail" square>条件不成立</Tag> : onHold ? <Tag square>保留</Tag> : started ? <Tag tone="warn" square>承諾待ち</Tag> : <Tag tone="info" square>条件確認中</Tag>}
      />
      <HandoverSteps org={org} active="Q-04" />
      {state === "エラー" ? (
        <ErrorState />
      ) : state === "未リリースのため対象外" ? (
        <div className="card">
          <EmptyState
            icon="rocket"
            title="このアプリは移管の対象外です"
            description="会員アプリはまだ App Store で公開していないため、譲渡の手続きには進みません。最初から顧客のチームで配信する「顧客名義での新規公開」で進めてください。"
            action={<Button to={paths.appHandover(org, PR)}>配信名義と方式へ</Button>}
          />
        </div>
      ) : (
        <>
          {blocked ? (
            <Banner tone="fail" title="譲渡の条件を満たしていません">
              譲渡元で審査中のバージョンが残っています。審査の結果が出るまで開始できません。条件不成立として記録し、再確認の期限を 2026/12/10 にしました。
            </Banner>
          ) : null}
          {onHold ? (
            <Banner tone="warn" title="移管を保留しています">
              顧客の判断で、App 内課金の移行方針が決まるまで保留しています（保留の記録: 藤井 晃、2026/12/05、再開予定 2026/12/19）。
            </Banner>
          ) : null}
          {started && !completed ? (
            <Banner tone="warn" title="譲渡元が開始しました。譲渡先の承諾を待っています">
              開始だけでは移管は完了しません。譲渡先（顧客）の Account Holder が承諾し、アプリが顧客のチームに属することを確認したら完了にします。
            </Banner>
          ) : null}
          {completed ? (
            <Banner tone="pass" title="移管が完了しました">
              開始と承諾の両方を照合し、アプリが顧客のチーム（{transferApp.to_team}）に属することを確認しました。
            </Banner>
          ) : null}

          <Section title="対象">
            <KeyValueList
              cols={2}
              items={[
                { label: "アプリ", value: transferApp.name },
                { label: "Bundle ID", value: <span className="mono">{transferApp.bundle_id}</span> },
                { label: "譲渡元のチーム", value: transferApp.from_team },
                { label: "譲渡先のチーム", value: transferApp.to_team },
                { label: "公開済みのバージョン", value: `${transferApp.released_versions} 件` },
              ]}
            />
          </Section>

          <Section title="譲渡の条件" sub="確認する観点は自社でまとめたものです。最終的な条件は Apple の案内で確認します">
            <ChecklistPanel items={checks} title="条件の確認" />
          </Section>

          <Section title="利用中の機能ごとの移行作業" flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>機能</th><th>移行作業</th><th>担当</th><th>状態</th></tr></thead>
                <tbody>
                  {transferFeatures.map((f) => {
                    const st = started ? FEATURE_STATUS.done : FEATURE_STATUS[f.status];
                    return (
                      <tr key={f.feature}>
                        <td className="strong small">{f.feature}</td>
                        <td className="small">{f.migration}</td>
                        <td><ExternalActor userId={f.owner} /></td>
                        <td><Tag tone={st.tone} square>{st.label}</Tag></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="開始と承諾" sub="別々のタスクとして記録し、両方の完了を照合します">
            <div className="ah-two">
              <div className="ah-party">
                <span className="tiny muted">1. 譲渡元の Account Holder</span>
                <strong className="small">{EXTERNAL_HOLDER.name}</strong>
                <span className="small">Apple 上で譲渡を開始します。</span>
                <Tag tone={STEP_LABEL[startStep].tone} square>{STEP_LABEL[startStep].label}</Tag>
              </div>
              <div className="ah-party">
                <span className="tiny muted">2. 譲渡先（顧客）の Account Holder</span>
                <ExternalActor userId="u-fujii" />
                <span className="small">Apple 上で譲渡を承諾します。</span>
                <Tag tone={STEP_LABEL[acceptStep].tone} square>{STEP_LABEL[acceptStep].label}</Tag>
              </div>
            </div>
          </Section>

          <AppleBoundary>
            配信チームの移管と、契約上の知的資産の帰属は別に記録します。権利の帰属は <Link to={paths.ipAsset(org, PR, "IP-202")}>知的資産台帳</Link> で確認してください。
          </AppleBoundary>

          <div className="row end">
            <Button
              variant="primary"
              icon="check"
              disabled={completed || !started || !allOk}
              disabledReason={completed ? "移管の完了は記録済みです" : !allOk ? "譲渡の条件をすべて満たしてから照合します" : "譲渡先の承諾を確認してから完了にします"}
              onClick={() => toast({ kind: "success", message: "受取先のチームへの所属を確認し、移管の完了を記録しました" })}
            >
              {completed ? "完了を記録済み" : "所属を確認して完了にする"}
            </Button>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
