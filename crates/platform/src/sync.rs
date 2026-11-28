//! 外部イベントの受信と差分同期の状態。
//!
//! - 同じ配信（提供元＋配信ID）は1回だけ記録する（再送への耐性）
//! - 同じリソースの古い版のイベントで、新しい状態を巻き戻さない（順不同への耐性）
//! - 差分同期のカーソルが失効したら、全件の再同期が必要な状態にする

use crate::webhook::{ResourceRef, sha256_hex};
use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::Value;
use sqlx::{PgPool, types::Json};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Ingested {
    /// リソースの最新の版として反映した
    Applied,
    /// 既に新しい版を反映済みのため、記録だけして状態は変えなかった
    IgnoredOlder,
    /// 追跡対象外のイベント。記録のみ
    Untracked,
    /// 同じ配信を受信済み。何もしない
    Duplicate,
}

#[derive(Debug)]
pub struct IncomingEvent<'a> {
    pub provider: &'static str,
    pub delivery_id: &'a str,
    pub event_kind: &'a str,
    pub body: &'a [u8],
    pub payload: &'a Value,
    pub resource: Option<ResourceRef>,
}

/// イベントを記録し、リソースの版を更新する。1つのトランザクションで行う。
pub async fn ingest(pool: &PgPool, event: &IncomingEvent<'_>) -> Result<Ingested, sqlx::Error> {
    let mut transaction = pool.begin().await?;
    // 同時に同じ配信が届いても1件だけ通すため、先に配信IDで挿入を試みる
    let id = Uuid::new_v4();
    let inserted = sqlx::query(
        "INSERT INTO external_events
             (id, provider, delivery_id, event_kind, resource_key, resource_version,
              payload_sha256, payload, outcome)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'untracked')
         ON CONFLICT (provider, delivery_id) DO NOTHING",
    )
    .bind(id)
    .bind(event.provider)
    .bind(event.delivery_id)
    .bind(event.event_kind)
    .bind(event.resource.as_ref().map(|r| r.key.as_str()))
    .bind(event.resource.as_ref().map(|r| r.version))
    .bind(sha256_hex(event.body))
    .bind(Json(event.payload))
    .execute(&mut *transaction)
    .await?
    .rows_affected();
    if inserted == 0 {
        transaction.commit().await?;
        return Ok(Ingested::Duplicate);
    }

    let outcome = match &event.resource {
        None => Ingested::Untracked,
        Some(resource) => {
            // 既存の版より新しいときだけ更新する（同じ版の再送も巻き戻しにならない）
            let updated = sqlx::query(
                "INSERT INTO external_resources (provider, resource_key, version, last_event_id)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (provider, resource_key) DO UPDATE
                 SET version = EXCLUDED.version, last_event_id = EXCLUDED.last_event_id,
                     updated_at = clock_timestamp()
                 WHERE external_resources.version < EXCLUDED.version",
            )
            .bind(event.provider)
            .bind(&resource.key)
            .bind(resource.version)
            .bind(id)
            .execute(&mut *transaction)
            .await?
            .rows_affected();
            if updated == 1 {
                Ingested::Applied
            } else {
                Ingested::IgnoredOlder
            }
        }
    };
    let label = match outcome {
        Ingested::Applied => "applied",
        Ingested::IgnoredOlder => "ignored_older",
        Ingested::Untracked | Ingested::Duplicate => "untracked",
    };
    sqlx::query("UPDATE external_events SET outcome = $2 WHERE id = $1")
        .bind(id)
        .bind(label)
        .execute(&mut *transaction)
        .await?;
    transaction.commit().await?;
    Ok(outcome)
}

/// リソースに反映済みの最新の版
pub async fn resource_version(
    pool: &PgPool,
    provider: &str,
    key: &str,
) -> Result<Option<DateTime<Utc>>, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT version FROM external_resources WHERE provider = $1 AND resource_key = $2",
    )
    .bind(provider)
    .bind(key)
    .fetch_optional(pool)
    .await
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "sync_status", rename_all = "snake_case")]
pub enum SyncStatus {
    InitialSync,
    Healthy,
    Failing,
    FullResyncRequired,
    AuthExpired,
}

/// 同期の失敗の種類
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SyncFailure {
    /// 一時的な失敗（429、通信断）。カーソルは保ったまま再試行する
    Transient,
    /// カーソルの失効（Google Calendar の 410 など）。全件の再同期が必要
    CursorInvalid,
    /// 認可の失効。接続者による再認可が必要
    AuthExpired,
}

#[derive(Debug, Clone, PartialEq, Eq, sqlx::FromRow)]
pub struct SyncCursor {
    pub cursor: Option<String>,
    pub status: SyncStatus,
    pub last_success_at: Option<DateTime<Utc>>,
    pub last_attempt_at: Option<DateTime<Utc>>,
    pub last_error: Option<String>,
}

pub async fn record_sync_success(
    pool: &PgPool,
    provider: &str,
    scope: &str,
    next_cursor: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO sync_cursors (provider, scope, cursor, status, last_success_at, last_attempt_at)
         VALUES ($1, $2, $3, 'healthy', clock_timestamp(), clock_timestamp())
         ON CONFLICT (provider, scope) DO UPDATE
         SET cursor = EXCLUDED.cursor, status = 'healthy', last_success_at = EXCLUDED.last_success_at,
             last_attempt_at = EXCLUDED.last_attempt_at, last_error = NULL",
    )
    .bind(provider)
    .bind(scope)
    .bind(next_cursor)
    .execute(pool)
    .await?;
    Ok(())
}

/// 失敗を記録する。最終成功時刻は残し、古い情報を最新と誤認させない材料にする。
pub async fn record_sync_failure(
    pool: &PgPool,
    provider: &str,
    scope: &str,
    failure: SyncFailure,
    error: &str,
) -> Result<(), sqlx::Error> {
    let (status, clear_cursor) = match failure {
        SyncFailure::Transient => (SyncStatus::Failing, false),
        SyncFailure::CursorInvalid => (SyncStatus::FullResyncRequired, true),
        SyncFailure::AuthExpired => (SyncStatus::AuthExpired, false),
    };
    sqlx::query(
        "INSERT INTO sync_cursors (provider, scope, status, last_attempt_at, last_error)
         VALUES ($1, $2, $3, clock_timestamp(), $4)
         ON CONFLICT (provider, scope) DO UPDATE
         SET status = EXCLUDED.status, last_attempt_at = EXCLUDED.last_attempt_at,
             last_error = EXCLUDED.last_error,
             cursor = CASE WHEN $5 THEN NULL ELSE sync_cursors.cursor END",
    )
    .bind(provider)
    .bind(scope)
    .bind(status)
    .bind(error)
    .bind(clear_cursor)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn sync_cursor(
    pool: &PgPool,
    provider: &str,
    scope: &str,
) -> Result<Option<SyncCursor>, sqlx::Error> {
    sqlx::query_as(
        "SELECT cursor, status, last_success_at, last_attempt_at, last_error
         FROM sync_cursors WHERE provider = $1 AND scope = $2",
    )
    .bind(provider)
    .bind(scope)
    .fetch_optional(pool)
    .await
}
