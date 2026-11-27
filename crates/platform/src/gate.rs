use crate::github::CheckSnapshot;
use serde::{Deserialize, Serialize};

pub const POLICY_VERSION: &str = "demo-ci-v1";
pub const REQUIRED_CHECKS: [&str; 2] = ["Rust", "Web"];

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Verdict {
    Passed,
    Blocked,
}

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CheckResult {
    Passed,
    Missing,
    Ambiguous,
    Incomplete,
    Unsuccessful,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CheckFinding {
    pub name: String,
    pub result: CheckResult,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Decision {
    pub policy_version: String,
    pub verdict: Verdict,
    pub checks: Vec<CheckFinding>,
}

pub fn evaluate(snapshot: &CheckSnapshot) -> Decision {
    let checks: Vec<_> = REQUIRED_CHECKS
        .into_iter()
        .map(|name| {
            let mut candidates = snapshot
                .check_runs
                .iter()
                .filter(|check| check.name == name && check.head_sha == snapshot.head_sha);
            let result = match (candidates.next(), candidates.next()) {
                (None, _) => CheckResult::Missing,
                (Some(_), Some(_)) => CheckResult::Ambiguous,
                (Some(check), None) if check.status != "completed" => CheckResult::Incomplete,
                (Some(check), None) if check.conclusion.as_deref() == Some("success") => {
                    CheckResult::Passed
                }
                (Some(_), None) => CheckResult::Unsuccessful,
            };
            CheckFinding {
                name: name.to_owned(),
                result,
            }
        })
        .collect();

    let verdict = if checks
        .iter()
        .all(|check| check.result == CheckResult::Passed)
    {
        Verdict::Passed
    } else {
        Verdict::Blocked
    };

    Decision {
        policy_version: POLICY_VERSION.to_owned(),
        verdict,
        checks,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::workflow::Scenario;

    #[test]
    fn applies_the_same_rules_to_every_snapshot() {
        for (scenario, verdict, web_check) in [
            (Scenario::Passing, Verdict::Passed, CheckResult::Passed),
            (
                Scenario::Failing,
                Verdict::Blocked,
                CheckResult::Unsuccessful,
            ),
            (Scenario::Pending, Verdict::Blocked, CheckResult::Incomplete),
            (Scenario::Missing, Verdict::Blocked, CheckResult::Missing),
        ] {
            let decision = evaluate(&scenario.snapshot());
            assert_eq!(decision.verdict, verdict);
            assert_eq!(decision.checks[1].result, web_check);
        }
    }

    #[test]
    fn ignores_other_revisions_and_blocks_duplicate_matches() {
        let mut snapshot = Scenario::Passing.snapshot();
        snapshot.check_runs[1].head_sha = "other".to_owned();
        assert_eq!(evaluate(&snapshot).checks[1].result, CheckResult::Missing);

        snapshot.check_runs[1].head_sha = snapshot.head_sha.clone();
        snapshot
            .check_runs
            .extend(Scenario::Passing.snapshot().check_runs);
        assert_eq!(evaluate(&snapshot).checks[1].result, CheckResult::Ambiguous);
    }
}
