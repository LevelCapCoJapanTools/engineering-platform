//! 受託者（フリーエンジニア）への発注、受諾、提出、委託検収、請求。
//!
//! - 発注条件は必須項目がそろうまで確定発行しない。発行した版は追記のみ
//! - 受諾は版に紐付き、最新でない版への受諾は拒否する。冪等キーで再送を1件にまとめる
//! - 発注条件・提出・委託検収・配備・顧客受入・支払は別々の状態として持つ
//! - 支払期日は給付受領時に固定し、顧客の受入状況では変えない
//!
//! 各操作と監査イベントは同じトランザクションで記録する。

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, Transaction, types::Json};
use uuid::Uuid;

/// 確定発行に必要な発注条件
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize, Serialize)]
pub struct OrderTerms {
    pub orderer: String,
    pub contractor: String,
    pub ordered_on: Option<NaiveDate>,
    pub scope: Vec<String>,
    pub out_of_scope: Vec<String>,
    pub delivery_to: String,
    pub due: Option<NaiveDate>,
    pub completion_criteria: Vec<String>,
    pub inspection_due: Option<NaiveDate>,
    pub fee: Option<i64>,
    pub payment_due: Option<NaiveDate>,
    pub payment_method: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum TermField {
    Orderer,
    Contractor,
    OrderedOn,
    Scope,
    OutOfScope,
    DeliveryTo,
    Due,
    CompletionCriteria,
    InspectionDue,
    Fee,
    PaymentDue,
    PaymentMethod,
}

fn blank(text: &str) -> bool {
    text.trim().is_empty()
}

fn blank_list(items: &[String]) -> bool {
    items.iter().all(|i| blank(i))
}

/// 欠けている必須項目。空なら確定発行できる
pub fn missing_fields(terms: &OrderTerms) -> Vec<TermField> {
    let checks = [
        (blank(&terms.orderer), TermField::Orderer),
        (blank(&terms.contractor), TermField::Contractor),
        (terms.ordered_on.is_none(), TermField::OrderedOn),
        (blank_list(&terms.scope), TermField::Scope),
        (blank_list(&terms.out_of_scope), TermField::OutOfScope),
        (blank(&terms.delivery_to), TermField::DeliveryTo),
        (terms.due.is_none(), TermField::Due),
        (
            blank_list(&terms.completion_criteria),
            TermField::CompletionCriteria,
        ),
        (terms.inspection_due.is_none(), TermField::InspectionDue),
        (!terms.fee.is_some_and(|f| f > 0), TermField::Fee),
        (terms.payment_due.is_none(), TermField::PaymentDue),
        (blank(&terms.payment_method), TermField::PaymentMethod),
    ];
    checks
        .into_iter()
        .filter_map(|(missing, field)| missing.then_some(field))
        .collect()
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "order_terms_status", rename_all = "snake_case")]
pub enum TermsStatus {
    Draft,
    Offered,
    Negotiating,
    Accepted,
    Declined,
    Cancelled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "order_submission_status", rename_all = "snake_case")]
pub enum SubmissionStatus {
    None,
    Submitted,
    Resubmitted,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "order_inspection_status", rename_all = "snake_case")]
pub enum InspectionStatus {
    NotStarted,
    InProgress,
    Partial,
    Passed,
    Returned,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "order_deploy_status", rename_all = "snake_case")]
pub enum DeployStatus {
    NotReady,
    Requested,
    Succeeded,
    Failed,
    RolledBack,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "order_acceptance_status", rename_all = "snake_case")]
pub enum AcceptanceStatus {
    NotRequested,
    Requested,
    Partial,
    Accepted,
    Returned,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "order_payment_status", rename_all = "snake_case")]
pub enum PaymentStatus {
    NotDue,
    Invoiced,
    Paid,
}

/// 1つの発注の6つの状態。組合せ（例: 委託検収済み・配備待ち・支払予定）は正常として扱う
#[derive(Debug, Clone, PartialEq, Eq, Serialize, sqlx::FromRow)]
pub struct OrderState {
    pub latest_version: i32,
    pub accepted_version: Option<i32>,
    pub terms_status: TermsStatus,
    pub submission_status: SubmissionStatus,
    pub inspection_status: InspectionStatus,
    pub deploy_status: DeployStatus,
    pub acceptance_status: AcceptanceStatus,
    pub payment_status: PaymentStatus,
}

#[derive(Debug, PartialEq, Eq)]
pub enum TradeError {
    Incomplete(Vec<TermField>),
    NotFound,
    /// 最新でない版への回答
    StaleVersion {
        latest: i32,
    },
    /// 回答できる状態ではない（未発行、受諾済み、中止など）
    NotOpen(TermsStatus),
    /// 受託者本人ではない
    NotParty,
    /// 受諾前の提出
    NotAccepted,
    /// 確定コミット（40桁）または成果物識別子が必要
    InvalidReference,
    /// 受託者・発注の作成者は検収できない
    SelfInspection,
    MissingReason,
    UnknownInstallment,
    DuplicateInvoice,
    AmountMismatch {
        expected: i64,
        invoiced: i64,
    },
    Database(String),
}

impl From<sqlx::Error> for TradeError {
    fn from(error: sqlx::Error) -> Self {
        Self::Database(error.to_string())
    }
}

async fn audit(
    transaction: &mut Transaction<'_, Postgres>,
    order_id: Uuid,
    kind: &'static str,
    actor: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO trade_audit_events (order_id, kind, actor) VALUES ($1, $2, $3)")
        .bind(order_id)
        .bind(kind)
        .bind(actor)
        .execute(&mut **transaction)
        .await?;
    Ok(())
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NewOrder {
    pub project: String,
    pub title: String,
    pub client_company: String,
    pub freelancer_id: String,
    pub created_by: String,
}

pub async fn create_order(pool: &PgPool, new: &NewOrder) -> Result<Uuid, sqlx::Error> {
    let id = Uuid::new_v4();
    let mut transaction = pool.begin().await?;
    sqlx::query(
        "INSERT INTO orders (id, project, title, client_company, freelancer_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(id)
    .bind(&new.project)
    .bind(&new.title)
    .bind(&new.client_company)
    .bind(&new.freelancer_id)
    .bind(&new.created_by)
    .execute(&mut *transaction)
    .await?;
    audit(&mut transaction, id, "created", &new.created_by).await?;
    transaction.commit().await?;
    Ok(id)
}

struct Locked {
    freelancer_id: String,
    created_by: String,
    latest_version: i32,
    accepted_version: Option<i32>,
    terms_status: TermsStatus,
}

async fn lock(
    transaction: &mut Transaction<'_, Postgres>,
    order_id: Uuid,
) -> Result<Locked, TradeError> {
    let row: Option<(String, String, i32, Option<i32>, TermsStatus)> = sqlx::query_as(
        "SELECT freelancer_id, created_by, latest_version, accepted_version, terms_status
         FROM orders WHERE id = $1 FOR UPDATE",
    )
    .bind(order_id)
    .fetch_optional(&mut **transaction)
    .await?;
    let (freelancer_id, created_by, latest_version, accepted_version, terms_status) =
        row.ok_or(TradeError::NotFound)?;
    Ok(Locked {
        freelancer_id,
        created_by,
        latest_version,
        accepted_version,
        terms_status,
    })
}

/// 条件を確定発行する。新しい版は回答待ちになる（以前の受諾は受諾済みの版として残る）
pub async fn issue_terms(
    pool: &PgPool,
    order_id: Uuid,
    terms: &OrderTerms,
    actor: &str,
) -> Result<i32, TradeError> {
    let missing = missing_fields(terms);
    if !missing.is_empty() {
        return Err(TradeError::Incomplete(missing));
    }
    let mut transaction = pool.begin().await?;
    let order = lock(&mut transaction, order_id).await?;
    if matches!(
        order.terms_status,
        TermsStatus::Declined | TermsStatus::Cancelled
    ) {
        return Err(TradeError::NotOpen(order.terms_status));
    }
    let version = order.latest_version + 1;
    sqlx::query(
        "INSERT INTO order_terms (order_id, version, terms, issued_by) VALUES ($1, $2, $3, $4)",
    )
    .bind(order_id)
    .bind(version)
    .bind(Json(terms))
    .bind(actor)
    .execute(&mut *transaction)
    .await?;
    sqlx::query("UPDATE orders SET latest_version = $2, terms_status = 'offered' WHERE id = $1")
        .bind(order_id)
        .bind(version)
        .execute(&mut *transaction)
        .await?;
    audit(&mut transaction, order_id, "terms_issued", actor).await?;
    transaction.commit().await?;
    Ok(version)
}

/// 発行済みの条件の版（追記のみなので、修正後も当初版を取得できる）
pub async fn terms_version(
    pool: &PgPool,
    order_id: Uuid,
    version: i32,
) -> Result<Option<OrderTerms>, sqlx::Error> {
    let row: Option<(Json<OrderTerms>,)> =
        sqlx::query_as("SELECT terms FROM order_terms WHERE order_id = $1 AND version = $2")
            .bind(order_id)
            .bind(version)
            .fetch_optional(pool)
            .await?;
    Ok(row.map(|(Json(terms),)| terms))
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum ResponseKind {
    Accept,
    Decline,
    /// 条件の相談（対案）
    CounterOffer {
        note: String,
    },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct OrderResponse {
    /// 受託者が見ていた版
    pub version: i32,
    pub responder: String,
    #[serde(flatten)]
    pub kind: ResponseKind,
    pub idempotency_key: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Responded {
    Recorded,
    /// 同じ冪等キーの回答を受付済み
    Duplicate,
}

/// 受託者の回答（受諾・辞退・相談）を記録する。
pub async fn respond(
    pool: &PgPool,
    order_id: Uuid,
    response: &OrderResponse,
) -> Result<Responded, TradeError> {
    let mut transaction = pool.begin().await?;
    let order = lock(&mut transaction, order_id).await?;
    // 行ロックの後に冪等キーを確かめるので、同時の再送も1件にまとまる
    let seen: Option<Uuid> =
        sqlx::query_scalar("SELECT order_id FROM order_responses WHERE idempotency_key = $1")
            .bind(&response.idempotency_key)
            .fetch_optional(&mut *transaction)
            .await?;
    if seen == Some(order_id) {
        transaction.commit().await?;
        return Ok(Responded::Duplicate);
    }
    if response.responder != order.freelancer_id {
        return Err(TradeError::NotParty);
    }
    if !matches!(
        order.terms_status,
        TermsStatus::Offered | TermsStatus::Negotiating
    ) {
        return Err(TradeError::NotOpen(order.terms_status));
    }
    if response.version != order.latest_version {
        return Err(TradeError::StaleVersion {
            latest: order.latest_version,
        });
    }
    let (kind, note, status, audit_kind) = match &response.kind {
        ResponseKind::Accept => ("accepted", None, TermsStatus::Accepted, "accepted"),
        ResponseKind::Decline => ("declined", None, TermsStatus::Declined, "declined"),
        ResponseKind::CounterOffer { note } => (
            "counter_offer",
            Some(note.as_str()),
            TermsStatus::Negotiating,
            "counter_offer",
        ),
    };
    sqlx::query(
        "INSERT INTO order_responses (id, order_id, version, kind, responder, note, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(Uuid::new_v4())
    .bind(order_id)
    .bind(response.version)
    .bind(kind)
    .bind(&response.responder)
    .bind(note)
    .bind(&response.idempotency_key)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "UPDATE orders SET terms_status = $2,
             accepted_version = CASE WHEN $2 = 'accepted'::order_terms_status THEN $3 ELSE accepted_version END
         WHERE id = $1",
    )
    .bind(order_id)
    .bind(status)
    .bind(response.version)
    .execute(&mut *transaction)
    .await?;
    audit(&mut transaction, order_id, audit_kind, &response.responder).await?;
    transaction.commit().await?;
    Ok(Responded::Recorded)
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NewSubmission {
    pub submitted_by: String,
    /// 確定コミット（40桁の16進、小文字）
    pub commit_sha: Option<String>,
    /// 成果物の識別子（コミットがない成果物）
    pub artifact_id: Option<String>,
    pub external_url: Option<String>,
}

pub fn is_commit_sha(text: &str) -> bool {
    text.len() == 40
        && text
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

/// 提出を記録する。受諾済みの版を固定し、再提出は旧版を残したまま追記する。
pub async fn submit(
    pool: &PgPool,
    order_id: Uuid,
    submission: &NewSubmission,
) -> Result<i32, TradeError> {
    let sha_ok = submission.commit_sha.as_deref().map(is_commit_sha);
    let artifact_ok = submission
        .artifact_id
        .as_deref()
        .map(|a| !a.trim().is_empty());
    if sha_ok == Some(false) || (sha_ok.is_none() && artifact_ok != Some(true)) {
        return Err(TradeError::InvalidReference);
    }
    let mut transaction = pool.begin().await?;
    let order = lock(&mut transaction, order_id).await?;
    if submission.submitted_by != order.freelancer_id {
        return Err(TradeError::NotParty);
    }
    let Some(accepted) = order.accepted_version else {
        return Err(TradeError::NotAccepted);
    };
    let revision: i32 = sqlx::query_scalar(
        "SELECT coalesce(max(revision), 0) + 1 FROM order_submissions WHERE order_id = $1",
    )
    .bind(order_id)
    .fetch_one(&mut *transaction)
    .await?;
    sqlx::query(
        "INSERT INTO order_submissions
             (order_id, revision, terms_version, commit_sha, artifact_id, external_url, submitted_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(order_id)
    .bind(revision)
    .bind(accepted)
    .bind(&submission.commit_sha)
    .bind(&submission.artifact_id)
    .bind(&submission.external_url)
    .bind(&submission.submitted_by)
    .execute(&mut *transaction)
    .await?;
    let status = if revision == 1 {
        SubmissionStatus::Submitted
    } else {
        SubmissionStatus::Resubmitted
    };
    sqlx::query("UPDATE orders SET submission_status = $2 WHERE id = $1")
        .bind(order_id)
        .bind(status)
        .execute(&mut *transaction)
        .await?;
    audit(
        &mut transaction,
        order_id,
        "submitted",
        &submission.submitted_by,
    )
    .await?;
    transaction.commit().await?;
    Ok(revision)
}

/// 提出の記録（再提出の履歴を含む）
pub async fn submissions(
    pool: &PgPool,
    order_id: Uuid,
) -> Result<Vec<(i32, i32, Option<String>)>, sqlx::Error> {
    sqlx::query_as(
        "SELECT revision, terms_version, commit_sha FROM order_submissions
         WHERE order_id = $1 ORDER BY revision",
    )
    .bind(order_id)
    .fetch_all(pool)
    .await
}

/// 外部 CI の結果。conclusion が None なら実行中
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct CiResult {
    pub name: String,
    pub commit_sha: String,
    pub conclusion: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Verification {
    /// 提出版の結果がそろって成功
    Passed,
    /// 提出版の結果に失敗がある
    Failed,
    /// 提出版の結果が実行中
    Pending,
    /// 提出版の結果が取得できない（別コミットの結果は使わない）
    NotFound,
}

/// 提出の確定コミットと同じコミットの CI 結果だけで照合する。
pub fn verify_submission(commit_sha: &str, results: &[CiResult]) -> Verification {
    let own: Vec<&CiResult> = results
        .iter()
        .filter(|r| r.commit_sha == commit_sha)
        .collect();
    if own.is_empty() {
        Verification::NotFound
    } else if own
        .iter()
        .any(|r| r.conclusion.as_deref().is_some_and(|c| c != "success"))
    {
        Verification::Failed
    } else if own.iter().any(|r| r.conclusion.is_none()) {
        Verification::Pending
    } else {
        Verification::Passed
    }
}

/// 給付（成果物）を受領した分納を記録する。支払期日はここで固定する
pub async fn record_delivery(
    pool: &PgPool,
    order_id: Uuid,
    installment: i32,
    amount: i64,
    received_on: NaiveDate,
    payment_due: NaiveDate,
    actor: &str,
) -> Result<(), TradeError> {
    let mut transaction = pool.begin().await?;
    lock(&mut transaction, order_id).await?;
    sqlx::query(
        "INSERT INTO order_installments (order_id, installment, amount, received_on, payment_due)
         VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(order_id)
    .bind(installment)
    .bind(amount)
    .bind(received_on)
    .bind(payment_due)
    .execute(&mut *transaction)
    .await?;
    sqlx::query(
        "UPDATE orders SET inspection_status = 'in_progress'
         WHERE id = $1 AND inspection_status = 'not_started'",
    )
    .bind(order_id)
    .execute(&mut *transaction)
    .await?;
    audit(&mut transaction, order_id, "delivery_received", actor).await?;
    transaction.commit().await?;
    Ok(())
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct CriterionResult {
    pub criterion: String,
    pub passed: bool,
    pub reason: Option<String>,
}

/// 分納ごとの集計から発注全体の検収状態を決める（一部だけ検収済みは「一部検収」）
pub fn overall_inspection(installments: &[Option<bool>]) -> InspectionStatus {
    let passed = installments.iter().filter(|i| **i == Some(true)).count();
    let returned = installments.iter().filter(|i| **i == Some(false)).count();
    if installments.is_empty() {
        InspectionStatus::NotStarted
    } else if passed == installments.len() {
        InspectionStatus::Passed
    } else if passed > 0 {
        InspectionStatus::Partial
    } else if returned > 0 {
        InspectionStatus::Returned
    } else {
        InspectionStatus::InProgress
    }
}

/// 委託元が完成条件ごとに検収する。受託者本人と発注の作成者は検収できない。
pub async fn inspect(
    pool: &PgPool,
    order_id: Uuid,
    installment: i32,
    inspector: &str,
    results: &[CriterionResult],
) -> Result<InspectionStatus, TradeError> {
    if results
        .iter()
        .any(|r| !r.passed && r.reason.as_deref().is_none_or(|t| t.trim().is_empty()))
    {
        return Err(TradeError::MissingReason);
    }
    let mut transaction = pool.begin().await?;
    let order = lock(&mut transaction, order_id).await?;
    if inspector == order.freelancer_id || inspector == order.created_by {
        return Err(TradeError::SelfInspection);
    }
    let exists: Option<i32> = sqlx::query_scalar(
        "SELECT installment FROM order_installments WHERE order_id = $1 AND installment = $2",
    )
    .bind(order_id)
    .bind(installment)
    .fetch_optional(&mut *transaction)
    .await?;
    if exists.is_none() {
        return Err(TradeError::UnknownInstallment);
    }
    for result in results {
        sqlx::query(
            "INSERT INTO order_inspections (order_id, installment, criterion, passed, reason, inspector)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (order_id, installment, criterion) DO UPDATE
             SET passed = EXCLUDED.passed, reason = EXCLUDED.reason,
                 inspector = EXCLUDED.inspector, inspected_at = clock_timestamp()",
        )
        .bind(order_id)
        .bind(installment)
        .bind(&result.criterion)
        .bind(result.passed)
        .bind(&result.reason)
        .bind(inspector)
        .execute(&mut *transaction)
        .await?;
    }
    // 分納ごとに、記録された全条件が合格なら合格、不合格があれば差戻し、未記録なら未判定
    let per_installment: Vec<(Option<bool>,)> = sqlx::query_as(
        "SELECT CASE WHEN count(i.criterion) = 0 THEN NULL ELSE bool_and(i.passed) END
         FROM order_installments n
         LEFT JOIN order_inspections i ON i.order_id = n.order_id AND i.installment = n.installment
         WHERE n.order_id = $1 GROUP BY n.installment ORDER BY n.installment",
    )
    .bind(order_id)
    .fetch_all(&mut *transaction)
    .await?;
    let status = overall_inspection(
        &per_installment
            .into_iter()
            .map(|(v,)| v)
            .collect::<Vec<_>>(),
    );
    sqlx::query("UPDATE orders SET inspection_status = $2 WHERE id = $1")
        .bind(order_id)
        .bind(status)
        .execute(&mut *transaction)
        .await?;
    audit(&mut transaction, order_id, "inspected", inspector).await?;
    transaction.commit().await?;
    Ok(status)
}

/// 請求の受領を記録する。同じ請求番号・同じ分納の二重請求と金額の不一致を拒否する。
pub async fn record_invoice(
    pool: &PgPool,
    order_id: Uuid,
    installment: i32,
    invoice_number: &str,
    amount: i64,
    received_on: NaiveDate,
    actor: &str,
) -> Result<(), TradeError> {
    let mut transaction = pool.begin().await?;
    lock(&mut transaction, order_id).await?;
    let expected: Option<i64> = sqlx::query_scalar(
        "SELECT amount FROM order_installments WHERE order_id = $1 AND installment = $2",
    )
    .bind(order_id)
    .bind(installment)
    .fetch_optional(&mut *transaction)
    .await?;
    let expected = expected.ok_or(TradeError::UnknownInstallment)?;
    let duplicate: Option<i32> = sqlx::query_scalar(
        "SELECT installment FROM order_invoices
         WHERE order_id = $1 AND (installment = $2 OR invoice_number = $3)",
    )
    .bind(order_id)
    .bind(installment)
    .bind(invoice_number)
    .fetch_optional(&mut *transaction)
    .await?;
    if duplicate.is_some() {
        return Err(TradeError::DuplicateInvoice);
    }
    if amount != expected {
        return Err(TradeError::AmountMismatch {
            expected,
            invoiced: amount,
        });
    }
    sqlx::query(
        "INSERT INTO order_invoices (order_id, installment, invoice_number, amount, received_on)
         VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(order_id)
    .bind(installment)
    .bind(invoice_number)
    .bind(amount)
    .bind(received_on)
    .execute(&mut *transaction)
    .await?;
    sqlx::query("UPDATE orders SET payment_status = 'invoiced' WHERE id = $1")
        .bind(order_id)
        .execute(&mut *transaction)
        .await?;
    audit(&mut transaction, order_id, "invoice_received", actor).await?;
    transaction.commit().await?;
    Ok(())
}

/// 最終顧客の受入を記録する。委託検収と支払期日には影響しない。
pub async fn set_customer_acceptance(
    pool: &PgPool,
    order_id: Uuid,
    status: AcceptanceStatus,
    actor: &str,
) -> Result<(), TradeError> {
    let mut transaction = pool.begin().await?;
    lock(&mut transaction, order_id).await?;
    sqlx::query("UPDATE orders SET acceptance_status = $2 WHERE id = $1")
        .bind(order_id)
        .bind(status)
        .execute(&mut *transaction)
        .await?;
    audit(
        &mut transaction,
        order_id,
        "customer_acceptance_changed",
        actor,
    )
    .await?;
    transaction.commit().await?;
    Ok(())
}

pub async fn state(pool: &PgPool, order_id: Uuid) -> Result<Option<OrderState>, sqlx::Error> {
    sqlx::query_as(
        "SELECT latest_version, accepted_version, terms_status, submission_status,
                inspection_status, deploy_status, acceptance_status, payment_status
         FROM orders WHERE id = $1",
    )
    .bind(order_id)
    .fetch_optional(pool)
    .await
}

/// 分納の支払期日
pub async fn payment_due(
    pool: &PgPool,
    order_id: Uuid,
    installment: i32,
) -> Result<Option<NaiveDate>, sqlx::Error> {
    sqlx::query_scalar(
        "SELECT payment_due FROM order_installments WHERE order_id = $1 AND installment = $2",
    )
    .bind(order_id)
    .bind(installment)
    .fetch_optional(pool)
    .await
}

pub async fn audit_trail(pool: &PgPool, order_id: Uuid) -> Result<Vec<String>, sqlx::Error> {
    sqlx::query_scalar("SELECT kind FROM trade_audit_events WHERE order_id = $1 ORDER BY sequence")
        .bind(order_id)
        .fetch_all(pool)
        .await
}

#[cfg(test)]
mod tests {
    use super::*;

    fn complete_terms() -> OrderTerms {
        let day = |m, d| NaiveDate::from_ymd_opt(2026, m, d);
        OrderTerms {
            orderer: "サンプルソフト株式会社".to_owned(),
            contractor: "松田 亮".to_owned(),
            ordered_on: day(11, 14),
            scope: vec!["受注一覧の CSV 出力（5列）".to_owned()],
            out_of_scope: vec!["Excel 形式の出力".to_owned()],
            delivery_to: "案件窓口".to_owned(),
            due: day(11, 28),
            completion_criteria: vec!["5列が指定の順で出力される".to_owned()],
            inspection_due: day(12, 5),
            fee: Some(450_000),
            payment_due: day(12, 31),
            payment_method: "銀行振込".to_owned(),
        }
    }

    #[test]
    fn refuses_to_issue_terms_without_required_fields() {
        assert!(missing_fields(&complete_terms()).is_empty());
        let mut terms = complete_terms();
        terms.payment_due = None;
        terms.fee = Some(0);
        terms.out_of_scope = vec!["  ".to_owned()];
        assert_eq!(
            missing_fields(&terms),
            [TermField::OutOfScope, TermField::Fee, TermField::PaymentDue]
        );
        assert_eq!(missing_fields(&OrderTerms::default()).len(), 12);
    }

    #[test]
    fn uses_only_ci_results_of_the_submitted_commit() {
        let sha = "9f3c2a1e7b4d5c6a8e0f1b2c3d4e5f6a7b8c9d0e";
        let other = "1111111111111111111111111111111111111111";
        let result = |commit: &str, conclusion: Option<&str>| CiResult {
            name: "test".to_owned(),
            commit_sha: commit.to_owned(),
            conclusion: conclusion.map(str::to_owned),
        };
        // 別コミットの成功は流用しない
        assert_eq!(
            verify_submission(sha, &[result(other, Some("success"))]),
            Verification::NotFound
        );
        assert_eq!(
            verify_submission(sha, &[result(sha, None), result(other, Some("success"))]),
            Verification::Pending
        );
        assert_eq!(
            verify_submission(
                sha,
                &[result(sha, Some("success")), result(sha, Some("failure"))]
            ),
            Verification::Failed
        );
        assert_eq!(
            verify_submission(sha, &[result(sha, Some("success"))]),
            Verification::Passed
        );
    }

    #[test]
    fn validates_commit_references() {
        assert!(is_commit_sha("9f3c2a1e7b4d5c6a8e0f1b2c3d4e5f6a7b8c9d0e"));
        assert!(!is_commit_sha("9F3C2A1E7B4D5C6A8E0F1B2C3D4E5F6A7B8C9D0E"));
        assert!(!is_commit_sha("main"));
        assert!(!is_commit_sha("9f3c2a1"));
    }

    #[test]
    fn partial_inspection_is_a_valid_state() {
        assert_eq!(overall_inspection(&[]), InspectionStatus::NotStarted);
        assert_eq!(
            overall_inspection(&[None, None]),
            InspectionStatus::InProgress
        );
        assert_eq!(
            overall_inspection(&[Some(true), None]),
            InspectionStatus::Partial
        );
        assert_eq!(
            overall_inspection(&[Some(true), Some(false)]),
            InspectionStatus::Partial
        );
        assert_eq!(
            overall_inspection(&[Some(false), None]),
            InspectionStatus::Returned
        );
        assert_eq!(
            overall_inspection(&[Some(true), Some(true)]),
            InspectionStatus::Passed
        );
    }

    #[test]
    fn reads_responses_from_flat_json() {
        let response: OrderResponse = serde_json::from_str(
            r#"{"version":2,"responder":"u-matsuda","kind":"counter_offer","note":"納期を12/5に","idempotency_key":"k1"}"#,
        )
        .unwrap();
        assert!(matches!(response.kind, ResponseKind::CounterOffer { .. }));
    }
}
