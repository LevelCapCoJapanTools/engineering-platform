use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, Transaction};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct AuditEvent {
    pub kind: String,
    pub actor: String,
    pub occurred_at: DateTime<Utc>,
}

pub(crate) async fn append(
    transaction: &mut Transaction<'_, Postgres>,
    run_id: Uuid,
    kind: &'static str,
    actor: &'static str,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO run_audit_events (run_id, kind, actor) VALUES ($1, $2, $3)")
        .bind(run_id)
        .bind(kind)
        .bind(actor)
        .execute(&mut **transaction)
        .await?;
    Ok(())
}
