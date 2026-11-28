//! 対外送信の承認と送信待ち（Outbox）。SSOT「対外連絡の委任」。
//!
//! - 金額・範囲・納期・障害説明を含む連絡は、宛先・本文・対象版のハッシュに対して人が承認する
//! - 承認後に宛先・本文・対象版が変われば再承認が必要になる
//! - 重複防止キーで、同じ確約を二重に送信待ちへ入れない
//! - 受領通知・定型の催促（requires_approval = false）は委任済みのルールで送信待ちに入れる

use crate::webhook::sha256_hex;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, Transaction, types::Json};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Draft {
    pub dedupe_key: String,
    pub recipients: Vec<String>,
    pub body: String,
    /// 根拠となる承認済みの版（例: "SOW v3"）
    pub target_version: String,
    pub requires_approval: bool,
    pub created_by: String,
}

/// 宛先（順序は問わない）・本文・対象版のハッシュ。承認はこの値に紐付く
pub fn content_hash(recipients: &[String], body: &str, target_version: &str) -> String {
    let mut sorted: Vec<&str> = recipients.iter().map(String::as_str).collect();
    sorted.sort_unstable();
    sorted.dedup();
    let canonical = serde_json::json!({
        "recipients": sorted,
        "body": body,
        "target_version": target_version,
    });
    sha256_hex(canonical.to_string().as_bytes())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "outbound_status", rename_all = "snake_case")]
pub enum OutboundStatus {
    PendingApproval,
    Queued,
    Sent,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Drafted {
    Created(Uuid),
    /// 同じ重複防止キーの連絡が既にある
    Duplicate(Uuid),
}

#[derive(Debug, PartialEq, Eq)]
pub enum OutboundError {
    NotFound,
    /// 承認した内容と現在の内容が違う
    ContentChanged,
    /// 作成者は自分の連絡を承認できない
    SelfApproval,
    /// 承認が必要な連絡が未承認、または承認後に変更された
    NeedsApproval,
    /// 送信待ち以降の連絡は変更できない
    AlreadyQueued(OutboundStatus),
    EmptyRecipients,
    /// 送信待ちでない連絡の配信結果
    NotQueued(OutboundStatus),
    Database(String),
}

impl From<sqlx::Error> for OutboundError {
    fn from(error: sqlx::Error) -> Self {
        Self::Database(error.to_string())
    }
}

async fn audit(
    transaction: &mut Transaction<'_, Postgres>,
    message_id: Uuid,
    kind: &'static str,
    actor: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO outbound_audit_events (message_id, kind, actor) VALUES ($1, $2, $3)")
        .bind(message_id)
        .bind(kind)
        .bind(actor)
        .execute(&mut **transaction)
        .await?;
    Ok(())
}

pub async fn draft(pool: &PgPool, draft: &Draft) -> Result<Drafted, OutboundError> {
    if draft.recipients.iter().all(|r| r.trim().is_empty()) {
        return Err(OutboundError::EmptyRecipients);
    }
    let id = Uuid::new_v4();
    let hash = content_hash(&draft.recipients, &draft.body, &draft.target_version);
    let mut transaction = pool.begin().await?;
    let inserted = sqlx::query(
        "INSERT INTO outbound_messages
             (id, dedupe_key, recipients, body, target_version, content_sha256, requires_approval, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (dedupe_key) DO NOTHING",
    )
    .bind(id)
    .bind(&draft.dedupe_key)
    .bind(Json(&draft.recipients))
    .bind(&draft.body)
    .bind(&draft.target_version)
    .bind(&hash)
    .bind(draft.requires_approval)
    .bind(&draft.created_by)
    .execute(&mut *transaction)
    .await?
    .rows_affected();
    if inserted == 0 {
        let existing: Uuid =
            sqlx::query_scalar("SELECT id FROM outbound_messages WHERE dedupe_key = $1")
                .bind(&draft.dedupe_key)
                .fetch_one(&mut *transaction)
                .await?;
        transaction.commit().await?;
        return Ok(Drafted::Duplicate(existing));
    }
    audit(&mut transaction, id, "drafted", &draft.created_by).await?;
    transaction.commit().await?;
    Ok(Drafted::Created(id))
}

struct Locked {
    content_sha256: String,
    created_by: String,
    status: OutboundStatus,
    requires_approval: bool,
    approved_sha256: Option<String>,
}

async fn lock(
    transaction: &mut Transaction<'_, Postgres>,
    id: Uuid,
) -> Result<Locked, OutboundError> {
    let row: Option<(String, String, OutboundStatus, bool, Option<String>)> = sqlx::query_as(
        "SELECT content_sha256, created_by, status, requires_approval, approved_sha256
         FROM outbound_messages WHERE id = $1 FOR UPDATE",
    )
    .bind(id)
    .fetch_optional(&mut **transaction)
    .await?;
    let (content_sha256, created_by, status, requires_approval, approved_sha256) =
        row.ok_or(OutboundError::NotFound)?;
    Ok(Locked {
        content_sha256,
        created_by,
        status,
        requires_approval,
        approved_sha256,
    })
}

/// 宛先・本文・対象版を変更する。以前の承認は無効になる
pub async fn edit(
    pool: &PgPool,
    id: Uuid,
    recipients: &[String],
    body: &str,
    target_version: &str,
    actor: &str,
) -> Result<(), OutboundError> {
    let mut transaction = pool.begin().await?;
    let message = lock(&mut transaction, id).await?;
    if message.status != OutboundStatus::PendingApproval {
        return Err(OutboundError::AlreadyQueued(message.status));
    }
    sqlx::query(
        "UPDATE outbound_messages
         SET recipients = $2, body = $3, target_version = $4, content_sha256 = $5
         WHERE id = $1",
    )
    .bind(id)
    .bind(Json(recipients))
    .bind(body)
    .bind(target_version)
    .bind(content_hash(recipients, body, target_version))
    .execute(&mut *transaction)
    .await?;
    audit(&mut transaction, id, "edited", actor).await?;
    transaction.commit().await?;
    Ok(())
}

/// 確認した内容（ハッシュ）に対して承認する
pub async fn approve(
    pool: &PgPool,
    id: Uuid,
    approver: &str,
    reviewed_sha256: &str,
) -> Result<(), OutboundError> {
    let mut transaction = pool.begin().await?;
    let message = lock(&mut transaction, id).await?;
    if approver == message.created_by {
        return Err(OutboundError::SelfApproval);
    }
    if reviewed_sha256 != message.content_sha256 {
        return Err(OutboundError::ContentChanged);
    }
    sqlx::query(
        "UPDATE outbound_messages SET approved_sha256 = $2, approved_by = $3 WHERE id = $1",
    )
    .bind(id)
    .bind(reviewed_sha256)
    .bind(approver)
    .execute(&mut *transaction)
    .await?;
    audit(&mut transaction, id, "approved", approver).await?;
    transaction.commit().await?;
    Ok(())
}

/// 送信待ちに入れる。承認が必要な連絡は、現在の内容が承認されたものと一致するときだけ
pub async fn enqueue(pool: &PgPool, id: Uuid, actor: &str) -> Result<(), OutboundError> {
    let mut transaction = pool.begin().await?;
    let message = lock(&mut transaction, id).await?;
    if message.status != OutboundStatus::PendingApproval {
        return Err(OutboundError::AlreadyQueued(message.status));
    }
    if message.requires_approval
        && message.approved_sha256.as_deref() != Some(message.content_sha256.as_str())
    {
        return Err(OutboundError::NeedsApproval);
    }
    sqlx::query("UPDATE outbound_messages SET status = 'queued' WHERE id = $1")
        .bind(id)
        .execute(&mut *transaction)
        .await?;
    audit(&mut transaction, id, "queued", actor).await?;
    transaction.commit().await?;
    Ok(())
}

/// 配信結果を記録する（送信済みと配信失敗を区別する）
pub async fn record_delivery(
    pool: &PgPool,
    id: Uuid,
    delivered: bool,
    actor: &str,
) -> Result<(), OutboundError> {
    let mut transaction = pool.begin().await?;
    let message = lock(&mut transaction, id).await?;
    if message.status != OutboundStatus::Queued && message.status != OutboundStatus::Failed {
        return Err(OutboundError::NotQueued(message.status));
    }
    let (status, kind) = if delivered {
        (OutboundStatus::Sent, "sent")
    } else {
        (OutboundStatus::Failed, "failed")
    };
    sqlx::query("UPDATE outbound_messages SET status = $2 WHERE id = $1")
        .bind(id)
        .bind(status)
        .execute(&mut *transaction)
        .await?;
    audit(&mut transaction, id, kind, actor).await?;
    transaction.commit().await?;
    Ok(())
}

pub async fn status(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<(OutboundStatus, String)>, sqlx::Error> {
    sqlx::query_as("SELECT status, content_sha256 FROM outbound_messages WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_ignores_recipient_order_but_not_content() {
        let a = vec![
            "nakamura@kakuu-shoji.example".to_owned(),
            "komatsu@kakuu-shoji.example".to_owned(),
        ];
        let b = vec![a[1].clone(), a[0].clone()];
        let body = "v1.4.0 の納入予定日は 12/17 です";
        assert_eq!(
            content_hash(&a, body, "MS-104 r2"),
            content_hash(&b, body, "MS-104 r2")
        );
        assert_ne!(
            content_hash(&a, body, "MS-104 r2"),
            content_hash(&a, body, "MS-104 r3")
        );
        assert_ne!(
            content_hash(&a, body, "MS-104 r2"),
            content_hash(&a[..1], body, "MS-104 r2")
        );
        assert_ne!(
            content_hash(&a, body, "MS-104 r2"),
            content_hash(&a, "v1.4.0 の納入予定日は 12/18 です", "MS-104 r2")
        );
    }
}
