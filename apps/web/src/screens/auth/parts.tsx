// オンボーディング（経営層向け・10ステップ）の共通の枠。
// ui/layout.tsx の OnboardingLayout は旧7ステップのため、この画面群ではこちらを使う。
import type { ReactNode } from "react";
import { paths } from "../../lib/paths";
import { Brand, Button, Stepper } from "../../ui";

import { ONBOARDING_STEPS } from "../../ui";
export const EXEC_STEPS = ONBOARDING_STEPS;

/** ステップ順のルート。戻る・次へに使う */
export const STEP_PATHS = [
  paths.onboardingOrg(),
  paths.onboardingGithub(),
  paths.onboardingRepos(),
  paths.onboardingPlanning(),
  paths.onboardingScope(),
  paths.onboardingProfile(),
  paths.onboardingNotify(),
  paths.onboardingMembers(),
  paths.onboardingAi(),
  paths.onboardingDone(),
];

export function ExecOnboarding({
  step,
  title,
  description,
  children,
  nextLabel = "次へ",
  nextDisabled,
  nextDisabledReason,
  onNext,
  extra,
  errorAt,
  hideNext,
}: {
  step: number;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextDisabledReason?: string;
  onNext?: () => void;
  extra?: ReactNode;
  errorAt?: number;
  hideNext?: boolean;
}) {
  const back = step > 0 ? STEP_PATHS[step - 1] : undefined;
  const next = step < STEP_PATHS.length - 1 ? STEP_PATHS[step + 1] : undefined;
  return (
    <div className="onboarding">
      <div className="onboarding-top">
        <div className="row between"><Brand /><span className="small muted">セットアップ {step + 1}/{EXEC_STEPS.length} · 目安 15 分</span></div>
        <div className="table-wrap"><Stepper steps={EXEC_STEPS} current={step} errorAt={errorAt} /></div>
      </div>
      <main className="onboarding-body">
        <div className="onboarding-card">
          <div className="stack" style={{ ["--gap" as string]: "6px" }}>
            <h1 style={{ fontSize: "var(--text-xl)", color: "var(--text-strong)" }}>{title}</h1>
            {description ? <p className="muted">{description}</p> : null}
          </div>
          {children}
          <div className="onboarding-foot">
            {back ? <Button variant="ghost" icon="arrowLeft" to={back}>戻る</Button> : <span />}
            <div className="row">
              {extra}
              {hideNext ? null : onNext ? (
                <Button variant="primary" iconRight="arrowRight" onClick={onNext} disabled={nextDisabled} disabledReason={nextDisabledReason}>{nextLabel}</Button>
              ) : next ? (
                <Button variant="primary" iconRight="arrowRight" to={nextDisabled ? undefined : next} disabled={nextDisabled} disabledReason={nextDisabledReason}>{nextLabel}</Button>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** あとで設定できるステップに付ける「スキップ」 */
export function SkipButton({ step }: { step: number }) {
  return <Button variant="ghost" to={STEP_PATHS[step + 1]}>あとで設定</Button>;
}
