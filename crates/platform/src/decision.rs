//! 経営判断の記録。判断と監査イベントは同じトランザクションで記録する。
//!
//! 職務分離（依頼者本人は判断できない）と入力の規則はここで検証し、DB の制約でも二重に守る。

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "decision_status", rename_all = "snake_case")]
pub enum DecisionStatus {
    Pending,
    Approved,
    Conditional,
    OnHold,
    Rejected,
    Delegated,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DecisionKind {
    Investment,
    Priority,
    Resource,
    RiskAcceptance,
    Exception,
    Release,
    Change,
    Budget,
    Benefit,
}

impl DecisionKind {
    fn as_str(self) -> &'static str {
        match self {
            Self::Investment => "investment",
            Self::Priority => "priority",
            Self::Resource => "resource",
            Self::RiskAcceptance => "risk_acceptance",
            Self::Exception => "exception",
            Self::Release => "release",
            Self::Change => "change",
            Self::Budget => "budget",
            Self::Benefit => "benefit",
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NewDecision {
    pub title: String,
    pub kind: DecisionKind,
    pub requested_by: String,
    pub due: NaiveDate,
}

/// 判断の結果。判断待ち（Pending）には戻せない。
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(tag = "outcome", rename_all = "snake_case")]
pub enum Outcome {
    Approved,
    Conditional {
        conditions: String,
    },
    OnHold {
        review_date: NaiveDate,
    },
    Rejected,
    /// 実務上の承認者へ回付する
    Delegated {
        delegate_to: String,
    },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DecisionInput {
    pub decider: String,
    pub reason: String,
    #[serde(flatten)]
    pub outcome: Outcome,
}

#[derive(Debug, PartialEq, Eq)]
pub enum DecisionError {
    /// 依頼者本人は判断できない
    SelfDecision,
    MissingDecider,
    MissingReason,
    MissingConditions,
    MissingDelegate,
    DelegateIsRequester,
    NotFound,
    AlreadyDecided(DecisionStatus),
    Database(String),
}

impl From<sqlx::Error> for DecisionError {
    fn from(error: sqlx::Error) -> Self {
        Self::Database(error.to_string())
    }
}

/// 判断の入力を検証する。DB に触れないので、画面の「操作できない理由」にも同じ規則を使える。
pub fn validate(requested_by: &str, input: &DecisionInput) -> Result<(), DecisionError> {
    if input.decider.trim().is_empty() {
        return Err(DecisionError::MissingDecider);
    }
    if input.decider == requested_by {
        return Err(DecisionError::SelfDecision);
    }
    if input.reason.trim().is_empty() {
        return Err(DecisionError::MissingReason);
    }
    match &input.outcome {
        Outcome::Conditional { conditions } if conditions.trim().is_empty() => {
            Err(DecisionError::MissingConditions)
        }
        Outcome::Delegated { delegate_to } if delegate_to.trim().is_empty() => {
            Err(DecisionError::MissingDelegate)
        }
        Outcome::Delegated { delegate_to } if delegate_to == requested_by => {
            Err(DecisionError::DelegateIsRequester)
        }
        _ => Ok(()),
    }
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct DecisionRecord {
    pub id: Uuid,
    pub title: String,
    pub kind: String,
    pub requested_by: String,
    pub due: NaiveDate,
    pub status: DecisionStatus,
    pub decided_by: Option<String>,
    pub decided_at: Option<DateTime<Utc>>,
    pub reason: Option<String>,
    pub conditions: Option<String>,
    pub review_date: Option<NaiveDate>,
    pub delegate_to: Option<String>,
}

async fn audit(
    transaction: &mut Transaction<'_, Postgres>,
    decision_id: Uuid,
    kind: &'static str,
    actor: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO decision_audit_events (decision_id, kind, actor) VALUES ($1, $2, $3)")
        .bind(decision_id)
        .bind(kind)
        .bind(actor)
        .execute(&mut **transaction)
        .await?;
    Ok(())
}

/// 判断を依頼する。依頼と監査イベントを同じトランザクションで記録する。
pub async fn request(pool: &PgPool, new: &NewDecision) -> Result<Uuid, sqlx::Error> {
    let id = Uuid::new_v4();
    let mut transaction = pool.begin().await?;
    sqlx::query(
        "INSERT INTO decisions (id, title, kind, requested_by, due) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(id)
    .bind(&new.title)
    .bind(new.kind.as_str())
    .bind(&new.requested_by)
    .bind(new.due)
    .execute(&mut *transaction)
    .await?;
    audit(&mut transaction, id, "requested", &new.requested_by).await?;
    transaction.commit().await?;
    Ok(id)
}

/// 判断を記録する。判断待ちの行を排他ロックし、二重の判断を防ぐ。
pub async fn decide(pool: &PgPool, id: Uuid, input: &DecisionInput) -> Result<(), DecisionError> {
    let mut transaction = pool.begin().await?;
    let row: Option<(String, DecisionStatus)> =
        sqlx::query_as("SELECT requested_by, status FROM decisions WHERE id = $1 FOR UPDATE")
            .bind(id)
            .fetch_optional(&mut *transaction)
            .await?;
    let Some((requested_by, status)) = row else {
        return Err(DecisionError::NotFound);
    };
    if status != DecisionStatus::Pending {
        return Err(DecisionError::AlreadyDecided(status));
    }
    validate(&requested_by, input)?;

    let (status, conditions, review_date, delegate_to) = match &input.outcome {
        Outcome::Approved => (DecisionStatus::Approved, None, None, None),
        Outcome::Conditional { conditions } => (
            DecisionStatus::Conditional,
            Some(conditions.as_str()),
            None,
            None,
        ),
        Outcome::OnHold { review_date } => (DecisionStatus::OnHold, None, Some(*review_date), None),
        Outcome::Rejected => (DecisionStatus::Rejected, None, None, None),
        Outcome::Delegated { delegate_to } => (
            DecisionStatus::Delegated,
            None,
            None,
            Some(delegate_to.as_str()),
        ),
    };
    sqlx::query(
        "UPDATE decisions
         SET status = $2, decided_by = $3, decided_at = clock_timestamp(), reason = $4,
             conditions = $5, review_date = $6, delegate_to = $7
         WHERE id = $1",
    )
    .bind(id)
    .bind(status)
    .bind(&input.decider)
    .bind(&input.reason)
    .bind(conditions)
    .bind(review_date)
    .bind(delegate_to)
    .execute(&mut *transaction)
    .await?;
    audit(&mut transaction, id, "decided", &input.decider).await?;
    transaction.commit().await?;
    Ok(())
}

pub async fn get(pool: &PgPool, id: Uuid) -> Result<Option<DecisionRecord>, sqlx::Error> {
    sqlx::query_as(
        "SELECT id, title, kind, requested_by, due, status, decided_by, decided_at, reason,
                conditions, review_date, delegate_to
         FROM decisions WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// 監査イベントの種類を時系列で返す
pub async fn audit_trail(pool: &PgPool, id: Uuid) -> Result<Vec<(String, String)>, sqlx::Error> {
    sqlx::query_as(
        "SELECT kind, actor FROM decision_audit_events WHERE decision_id = $1 ORDER BY sequence",
    )
    .bind(id)
    .fetch_all(pool)
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(decider: &str, reason: &str, outcome: Outcome) -> DecisionInput {
        DecisionInput {
            decider: decider.to_owned(),
            reason: reason.to_owned(),
            outcome,
        }
    }

    #[test]
    fn rejects_self_decision_and_missing_fields() {
        let requester = "u-sato";
        assert_eq!(
            validate(requester, &input("u-sato", "ok", Outcome::Approved)),
            Err(DecisionError::SelfDecision)
        );
        assert_eq!(
            validate(requester, &input("", "ok", Outcome::Approved)),
            Err(DecisionError::MissingDecider)
        );
        assert_eq!(
            validate(requester, &input("u-kimura", "  ", Outcome::Approved)),
            Err(DecisionError::MissingReason)
        );
        assert_eq!(
            validate(
                requester,
                &input(
                    "u-kimura",
                    "ok",
                    Outcome::Conditional {
                        conditions: String::new()
                    }
                )
            ),
            Err(DecisionError::MissingConditions)
        );
        assert_eq!(
            validate(
                requester,
                &input(
                    "u-kimura",
                    "ok",
                    Outcome::Delegated {
                        delegate_to: "u-sato".to_owned()
                    }
                )
            ),
            Err(DecisionError::DelegateIsRequester)
        );
    }

    #[test]
    fn accepts_complete_decisions() {
        let review_date = NaiveDate::from_ymd_opt(2026, 12, 15).unwrap();
        for outcome in [
            Outcome::Approved,
            Outcome::Rejected,
            Outcome::OnHold { review_date },
            Outcome::Conditional {
                conditions: "12/3 までに修正版へ更新".to_owned(),
            },
            Outcome::Delegated {
                delegate_to: "u-nakamura".to_owned(),
            },
        ] {
            assert_eq!(
                validate("u-sato", &input("u-kimura", "根拠あり", outcome)),
                Ok(())
            );
        }
    }

    #[test]
    fn reads_outcome_from_flat_json() {
        let input: DecisionInput = serde_json::from_str(
            r#"{"decider":"u-kimura","reason":"r","outcome":"on_hold","review_date":"2026-12-15"}"#,
        )
        .unwrap();
        assert!(matches!(input.outcome, Outcome::OnHold { .. }));
    }
}
