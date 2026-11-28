//! 配備の実行許可と起動依頼（SSOT「配備の委任」）。
//!
//! - 許可は（リリース、成果版、環境、時間枠、ルール版）に紐付き、版の差替え・期限切れでは使えない
//! - 同じ許可での再依頼は最初の依頼を返し、外部 CI/CD を二重に起動しない
//! - 外部の実行IDで結果を照合するまで「確認済み」にしない

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NewPermit {
    pub release: String,
    /// 承認された成果版のダイジェスト（SHA-256）
    pub artifact_digest: String,
    pub environment: String,
    pub window_start: DateTime<Utc>,
    pub window_end: DateTime<Utc>,
    /// 判定に使ったゲートのルール版
    pub rule_version: String,
    pub approved_by: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "deploy_permit_status", rename_all = "snake_case")]
pub enum PermitStatus {
    Permitted,
    /// 起動を依頼した。結果は未確認
    Requested,
    Succeeded,
    Failed,
}

/// 起動依頼の結果
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RunClaim {
    /// この呼び出しが外部 CI/CD を起動してよい（冪等キーは許可ID）
    Start,
    /// 既に依頼済み。外部 CI/CD を起動しない
    AlreadyRequested,
}

#[derive(Debug, PartialEq, Eq)]
pub enum DeployError {
    NotFound,
    /// 承認後に成果版が差し替えられた
    ArtifactChanged,
    /// ルール版が変わった
    RuleChanged,
    /// 時間枠の外（期限切れを含む）
    OutsideWindow,
    /// 許可の対象と違う環境
    EnvironmentMismatch,
    /// 記録した外部実行IDと違う結果
    RunMismatch,
    /// 起動依頼の前の結果
    NotRequested,
    Database(String),
}

impl From<sqlx::Error> for DeployError {
    fn from(error: sqlx::Error) -> Self {
        Self::Database(error.to_string())
    }
}

async fn audit(
    transaction: &mut Transaction<'_, Postgres>,
    permit_id: Uuid,
    kind: &'static str,
    actor: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO deploy_audit_events (permit_id, kind, actor) VALUES ($1, $2, $3)")
        .bind(permit_id)
        .bind(kind)
        .bind(actor)
        .execute(&mut **transaction)
        .await?;
    Ok(())
}

pub async fn permit(pool: &PgPool, new: &NewPermit) -> Result<Uuid, sqlx::Error> {
    let id = Uuid::new_v4();
    let mut transaction = pool.begin().await?;
    sqlx::query(
        "INSERT INTO deploy_permits
             (id, release, artifact_digest, environment, window_start, window_end, rule_version, approved_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(id)
    .bind(&new.release)
    .bind(&new.artifact_digest)
    .bind(&new.environment)
    .bind(new.window_start)
    .bind(new.window_end)
    .bind(&new.rule_version)
    .bind(&new.approved_by)
    .execute(&mut *transaction)
    .await?;
    audit(&mut transaction, id, "permitted", &new.approved_by).await?;
    transaction.commit().await?;
    Ok(id)
}

/// 起動を依頼する直前の状態
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RunRequest {
    pub artifact_digest: String,
    pub environment: String,
    pub rule_version: String,
    pub now: DateTime<Utc>,
    pub actor: String,
}

#[derive(sqlx::FromRow)]
struct PermitRow {
    artifact_digest: String,
    environment: String,
    rule_version: String,
    window_start: DateTime<Utc>,
    window_end: DateTime<Utc>,
    status: PermitStatus,
}

/// 許可を確かめて起動を予約する。最初の1回だけ Start を返す
pub async fn claim_run(
    pool: &PgPool,
    permit_id: Uuid,
    request: &RunRequest,
) -> Result<RunClaim, DeployError> {
    let mut transaction = pool.begin().await?;
    let row: Option<PermitRow> = sqlx::query_as(
        "SELECT artifact_digest, environment, rule_version, window_start, window_end, status
         FROM deploy_permits WHERE id = $1 FOR UPDATE",
    )
    .bind(permit_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let PermitRow {
        artifact_digest: digest,
        environment,
        rule_version,
        window_start: start,
        window_end: end,
        status,
    } = row.ok_or(DeployError::NotFound)?;
    if status != PermitStatus::Permitted {
        transaction.commit().await?;
        return Ok(RunClaim::AlreadyRequested);
    }
    if request.artifact_digest != digest {
        return Err(DeployError::ArtifactChanged);
    }
    if request.environment != environment {
        return Err(DeployError::EnvironmentMismatch);
    }
    if request.rule_version != rule_version {
        return Err(DeployError::RuleChanged);
    }
    if request.now < start || request.now >= end {
        return Err(DeployError::OutsideWindow);
    }
    sqlx::query("UPDATE deploy_permits SET status = 'requested' WHERE id = $1")
        .bind(permit_id)
        .execute(&mut *transaction)
        .await?;
    audit(&mut transaction, permit_id, "requested", &request.actor).await?;
    transaction.commit().await?;
    Ok(RunClaim::Start)
}

/// 外部 CI/CD が返した実行IDを記録する。同じIDの再記録は無視し、別のIDは拒否する
pub async fn record_run(
    pool: &PgPool,
    permit_id: Uuid,
    external_run_id: &str,
    actor: &str,
) -> Result<(), DeployError> {
    let mut transaction = pool.begin().await?;
    let row: Option<(PermitStatus, Option<String>)> = sqlx::query_as(
        "SELECT status, external_run_id FROM deploy_permits WHERE id = $1 FOR UPDATE",
    )
    .bind(permit_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let (status, recorded) = row.ok_or(DeployError::NotFound)?;
    if status == PermitStatus::Permitted {
        return Err(DeployError::NotRequested);
    }
    match recorded.as_deref() {
        Some(id) if id == external_run_id => {
            transaction.commit().await?;
            return Ok(());
        }
        Some(_) => return Err(DeployError::RunMismatch),
        None => {}
    }
    sqlx::query("UPDATE deploy_permits SET external_run_id = $2 WHERE id = $1")
        .bind(permit_id)
        .bind(external_run_id)
        .execute(&mut *transaction)
        .await?;
    audit(&mut transaction, permit_id, "run_recorded", actor).await?;
    transaction.commit().await?;
    Ok(())
}

/// 外部の実行IDで結果を照合して確定する。照合できるまでは Requested（結果未確認）のまま
pub async fn confirm(
    pool: &PgPool,
    permit_id: Uuid,
    external_run_id: &str,
    succeeded: bool,
    actor: &str,
) -> Result<PermitStatus, DeployError> {
    let mut transaction = pool.begin().await?;
    let row: Option<(PermitStatus, Option<String>)> = sqlx::query_as(
        "SELECT status, external_run_id FROM deploy_permits WHERE id = $1 FOR UPDATE",
    )
    .bind(permit_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let (status, recorded) = row.ok_or(DeployError::NotFound)?;
    if status == PermitStatus::Permitted {
        return Err(DeployError::NotRequested);
    }
    if recorded.as_deref() != Some(external_run_id) {
        return Err(DeployError::RunMismatch);
    }
    if status != PermitStatus::Requested {
        transaction.commit().await?;
        return Ok(status);
    }
    let result = if succeeded {
        PermitStatus::Succeeded
    } else {
        PermitStatus::Failed
    };
    sqlx::query("UPDATE deploy_permits SET status = $2 WHERE id = $1")
        .bind(permit_id)
        .bind(result)
        .execute(&mut *transaction)
        .await?;
    audit(&mut transaction, permit_id, "confirmed", actor).await?;
    transaction.commit().await?;
    Ok(result)
}

pub async fn status(pool: &PgPool, permit_id: Uuid) -> Result<Option<PermitStatus>, sqlx::Error> {
    sqlx::query_scalar("SELECT status FROM deploy_permits WHERE id = $1")
        .bind(permit_id)
        .fetch_optional(pool)
        .await
}

pub async fn audit_trail(pool: &PgPool, permit_id: Uuid) -> Result<Vec<String>, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT kind FROM deploy_audit_events WHERE permit_id = $1 ORDER BY sequence",
    )
    .bind(permit_id)
    .fetch_all(pool)
    .await
}
