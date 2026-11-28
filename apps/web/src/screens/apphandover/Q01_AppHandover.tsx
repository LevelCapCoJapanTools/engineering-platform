// 画面ID: Q-01 配信名義と引き渡し方式
// 顧客の配信法人、Apple Developer Program の加入状況、既存アプリ・チームの有無から、引き渡しの方式と作業表を切り替える（資料 56）。
import { useState } from "react";
import { useScreenState } from "../../lib/router";
import { paths } from "../../lib/paths";
import { formatDate, formatDateTime } from "../../lib/format";
import {
  Banner,
  Button,
  ErrorState,
  ExternalActor,
  KeyValueList,
  PageHeader,
  ProjectLayout,
  ResponsibilitySplit,
  Section,
  Skeleton,
  Tag,
  cx,
  useToast,
} from "../../ui";
import { HANDOVER_METHODS, distribution, handoverTasks } from "../../mocks/apphandover";
import type { HandoverMethod } from "../../mocks/apphandover";
import { AppleBoundary, HandoverSteps, PR, TaskTable, orgOf } from "./parts";

export const Q01_STATES = ["新規公開（既定）", "担当交代", "アプリ移管", "加入状況未確認", "読み込み中", "エラー"];

const ENROLLMENT_LABEL = {
  enrolled: { label: "加入済み", tone: "pass" as const },
  enrolling: { label: "申請中（Apple の確認待ち）", tone: "warn" as const },
  notStarted: { label: "未申請", tone: "neutral" as const },
};

export function Q01AppHandover({ params }: { params: Record<string, string> }) {
  const state = useScreenState();
  const org = orgOf(params);
  const toast = useToast();
  const initial: HandoverMethod = state === "担当交代" ? "sameTeam" : state === "アプリ移管" ? "transfer" : "newCustomer";
  const [method, setMethod] = useState<HandoverMethod>(initial);
  const unknown = state === "加入状況未確認";
  // 確認した事実（既存アプリの有無・公開先のチーム）は選択ではなく顧客から聞いた内容で決まる
  const existingApp = initial !== "newCustomer";
  const released = initial === "transfer";
  const enrollment = unknown ? null : method === "newCustomer" ? distribution.enrollment : "enrolled";

  return (
    <ProjectLayout org={org} project={PR} active="appHandover" trail={[{ label: "アプリの引き渡し" }]}>
      <PageHeader
        title="配信名義と引き渡し方式"
        description="アプリを誰の名義で配信し、どの方式で顧客に引き渡すかを決めます。方式によって作業表が変わります。"
        status={<Tag tone="info" square>{HANDOVER_METHODS[method].label}</Tag>}
      />
      <HandoverSteps org={org} active="Q-01" />
      {state === "読み込み中" ? (
        <Skeleton variant="detail" />
      ) : state === "エラー" ? (
        <ErrorState />
      ) : (
        <>
          {unknown ? (
            <Banner tone="warn" title="顧客の加入状況をまだ確認していません">
              方式を確定する前に、発注側プロジェクト責任者に Apple Developer Program の加入状況と既存アプリの有無を確認してください。確認するまで作業表は仮のものです。
            </Banner>
          ) : null}

          <Section title="配信名義の確認" sub="顧客から確認した事実です。決定者と日時を記録します">
            <KeyValueList
              cols={2}
              items={[
                { label: "アプリ", value: `${distribution.app_name}（${distribution.platform}）` },
                { label: "配信する法人", value: distribution.publisher },
                { label: "Apple Developer Program", value: enrollment ? <Tag tone={ENROLLMENT_LABEL[enrollment].tone} square>{ENROLLMENT_LABEL[enrollment].label}</Tag> : <Tag square>未確認</Tag> },
                { label: "既存のアプリ", value: existingApp ? (released ? "あり（別のチームで公開済み）" : "あり（顧客のチームで公開済み）") : "なし（新規に公開）" },
                { label: "公開予定日", value: formatDate(distribution.planned_release) },
                { label: "決定者", value: unknown ? "—" : <span className="row" style={{ ["--gap" as string]: "6px" }}><ExternalActor userId={distribution.decided_by} />{formatDateTime(distribution.decided_at)}</span> },
              ]}
            />
          </Section>

          <Section title="引き渡しの方式" sub="確認した事実に合う方式を選びます。当てはまらない方式は選べません">
            <div className="ah-methods">
              {(Object.keys(HANDOVER_METHODS) as HandoverMethod[]).map((m) => {
                // 既存アプリがなければ新規公開だけ、既存アプリがあれば担当交代か移管だけを選べる。加入状況が未確認なら仮に選べる
                const allowed = unknown || (existingApp ? m !== "newCustomer" : m === "newCustomer");
                return (
                  <button
                    key={m}
                    type="button"
                    className={cx("ah-method", method === m && "active", !allowed && "disabled")}
                    onClick={() => (allowed ? setMethod(m) : undefined)}
                    aria-pressed={method === m}
                    style={{ textAlign: "left", cursor: allowed ? "pointer" : "not-allowed" }}
                  >
                    <strong>{HANDOVER_METHODS[m].label}</strong>
                    <span className="small muted">{HANDOVER_METHODS[m].when}</span>
                  </button>
                );
              })}
            </div>
            <p className="small" style={{ marginTop: 8 }}>{HANDOVER_METHODS[method].description}</p>
          </Section>

          {method === "newCustomer" ? (
            <Banner tone="info" title="次は顧客側のチームの準備と、JV の作業者の招待です">
              未公開の新規アプリは、最初から顧客のチームで配信します。アプリの譲渡は発生しないため、譲渡条件の確認は不要です。
            </Banner>
          ) : null}
          {method === "transfer" ? (
            <Banner tone="warn" title="移管の前に譲渡の条件を確認します" action={<Button size="sm" to={paths.appTransfer(org, PR)}>移管の手続きへ</Button>}>
              別のチームで公開済みのアプリを移すときだけ、譲渡の条件と、利用中の機能ごとの移行作業の確認が必要です。
            </Banner>
          ) : null}

          <Section title="作業表" sub="Apple 上の作業は本人が行います。本サービスは担当・期限・再開先を管理します" flush>
            <TaskTable tasks={handoverTasks[method]} />
          </Section>

          <AppleBoundary />

          <Section title="判断と実務の分担">
            <ResponsibilitySplit
              decide={<ExternalActor userId="u-fujii" role="発注側プロジェクト責任者（配信名義の決定）" />}
              act={<ExternalActor userId="u-mori" role="受注側統括責任者（作業の手配）" />}
              note="配信チームの移管と、契約上の知的資産の帰属は別々に記録します。"
            />
          </Section>

          <div className="row end">
            <Button
              variant="primary"
              icon="check"
              disabled={unknown}
              disabledReason="顧客の加入状況を確認してから確定します"
              onClick={() => toast({ kind: "success", message: `方式を「${HANDOVER_METHODS[method].label}」で確定し、作業表を顧客と共有しました` })}
            >
              方式を確定
            </Button>
          </div>
        </>
      )}
    </ProjectLayout>
  );
}
