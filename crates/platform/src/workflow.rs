use crate::{
    evidence::{self, AuditEvent},
    gate::{self, Decision},
    github::{CheckRun, CheckSnapshot},
};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, types::Json};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "demo_scenario", rename_all = "snake_case")]
pub enum Scenario {
    Passing,
    Failing,
    Pending,
    Missing,
}

impl Scenario {
    pub(crate) fn snapshot(self) -> CheckSnapshot {
        let head_sha = "0123456789abcdef0123456789abcdef01234567".to_owned();
        let check = |name: &str, status: &str, conclusion: Option<&str>| CheckRun {
            name: name.to_owned(),
            head_sha: head_sha.clone(),
            status: status.to_owned(),
            conclusion: conclusion.map(str::to_owned),
        };
        let mut check_runs = vec![check("Rust", "completed", Some("success"))];
        let web = match self {
            Self::Passing => Some(check("Web", "completed", Some("success"))),
            Self::Failing => Some(check("Web", "completed", Some("failure"))),
            Self::Pending => Some(check("Web", "in_progress", None)),
            Self::Missing => None,
        };
        check_runs.extend(web);
        CheckSnapshot {
            repository: "example/demo-project".to_owned(),
            head_sha,
            check_runs,
        }
    }
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Run {
    pub id: Uuid,
    pub scenario: Scenario,
    pub snapshot: Json<CheckSnapshot>,
    pub decision: Option<Json<Decision>>,
    pub events: Json<Vec<AuditEvent>>,
}

/// Orchestration entry point for the single built-in job, a local CI snapshot evaluation.
pub async fn enqueue(pool: &PgPool, scenario: Scenario) -> Result<Uuid, sqlx::Error> {
    let id = Uuid::new_v4();
    let mut transaction = pool.begin().await?;
    sqlx::query("INSERT INTO demo_runs (id, scenario, snapshot) VALUES ($1, $2, $3)")
        .bind(id)
        .bind(scenario)
        .bind(Json(scenario.snapshot()))
        .execute(&mut *transaction)
        .await?;
    evidence::append(&mut transaction, id, "queued", "local-demo").await?;
    transaction.commit().await?;
    Ok(id)
}

pub async fn get(pool: &PgPool, id: Uuid) -> Result<Option<Run>, sqlx::Error> {
    sqlx::query_as(
        "SELECT id, scenario, snapshot, decision,
             COALESCE((
                 SELECT jsonb_agg(
                     jsonb_build_object('kind', kind, 'actor', actor, 'occurred_at', occurred_at)
                     ORDER BY sequence
                 )
                 FROM run_audit_events WHERE run_id = demo_runs.id
             ), '[]'::jsonb) AS events
         FROM demo_runs WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn process_next(pool: &PgPool) -> Result<Option<Uuid>, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    let job: Option<(Uuid, Json<CheckSnapshot>)> = sqlx::query_as(
        "SELECT id, snapshot FROM demo_runs
         WHERE decision IS NULL ORDER BY created_at, id LIMIT 1 FOR UPDATE SKIP LOCKED",
    )
    .fetch_optional(&mut *transaction)
    .await?;
    let Some((id, snapshot)) = job else {
        transaction.commit().await?;
        return Ok(None);
    };

    let decision = gate::evaluate(&snapshot);
    sqlx::query("UPDATE demo_runs SET decision = $2 WHERE id = $1")
        .bind(id)
        .bind(Json(decision))
        .execute(&mut *transaction)
        .await?;
    evidence::append(&mut transaction, id, "evaluated", "worker").await?;
    transaction.commit().await?;
    Ok(Some(id))
}
