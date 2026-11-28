use chrono::{NaiveDate, TimeZone, Utc};
use platform::{
    MIGRATOR,
    decision::{
        self, DecisionError, DecisionInput, DecisionKind, DecisionStatus, NewDecision, Outcome,
    },
    sync::{self, IncomingEvent, Ingested, SyncFailure, SyncStatus},
    webhook::ResourceRef,
};
use serde_json::json;
use sqlx::PgPool;

fn new_decision() -> NewDecision {
    NewDecision {
        title: "CR-0004 の追加費用の承認".to_owned(),
        kind: DecisionKind::Change,
        requested_by: "u-sato".to_owned(),
        due: NaiveDate::from_ymd_opt(2026, 12, 2).unwrap(),
    }
}

fn approve(decider: &str) -> DecisionInput {
    DecisionInput {
        decider: decider.to_owned(),
        reason: "費用対効果を確認した".to_owned(),
        outcome: Outcome::Approved,
    }
}

#[sqlx::test(migrator = "MIGRATOR")]
#[ignore = "requires a local PostgreSQL test server"]
async fn records_each_decision_once_with_its_audit_events(pool: PgPool) {
    let id = decision::request(&pool, &new_decision()).await.unwrap();

    assert_eq!(
        decision::decide(&pool, id, &approve("u-sato")).await,
        Err(DecisionError::SelfDecision)
    );
    assert_eq!(
        decision::get(&pool, id).await.unwrap().unwrap().status,
        DecisionStatus::Pending
    );

    // 同時に2人が判断しても、記録されるのは1件だけ
    let (by_kimura, by_mori) = (approve("u-kimura"), approve("u-mori"));
    let (first, second) = tokio::join!(
        decision::decide(&pool, id, &by_kimura),
        decision::decide(&pool, id, &by_mori),
    );
    let results = [first, second];
    assert_eq!(results.iter().filter(|r| r.is_ok()).count(), 1);
    assert!(results.contains(&Err(DecisionError::AlreadyDecided(
        DecisionStatus::Approved
    ))));

    let record = decision::get(&pool, id).await.unwrap().unwrap();
    assert_eq!(record.status, DecisionStatus::Approved);
    assert!(record.decided_at.is_some());
    let trail: Vec<String> = decision::audit_trail(&pool, id)
        .await
        .unwrap()
        .into_iter()
        .map(|(kind, _)| kind)
        .collect();
    assert_eq!(trail, ["requested", "decided"]);
}

#[sqlx::test(migrator = "MIGRATOR")]
#[ignore = "requires a local PostgreSQL test server"]
async fn database_rejects_self_decision_and_incomplete_holds(pool: PgPool) {
    let id = decision::request(&pool, &new_decision()).await.unwrap();
    let self_decided = sqlx::query(
        "UPDATE decisions SET status = 'approved', decided_by = requested_by,
             decided_at = now(), reason = 'x' WHERE id = $1",
    )
    .bind(id)
    .execute(&pool)
    .await;
    assert!(self_decided.is_err());

    let hold_without_date = sqlx::query(
        "UPDATE decisions SET status = 'on_hold', decided_by = 'u-kimura',
             decided_at = now(), reason = 'x' WHERE id = $1",
    )
    .bind(id)
    .execute(&pool)
    .await;
    assert!(hold_without_date.is_err());

    let hold = DecisionInput {
        decider: "u-kimura".to_owned(),
        reason: "見積りの精査を待つ".to_owned(),
        outcome: Outcome::OnHold {
            review_date: NaiveDate::from_ymd_opt(2026, 12, 9).unwrap(),
        },
    };
    decision::decide(&pool, id, &hold).await.unwrap();
    let record = decision::get(&pool, id).await.unwrap().unwrap();
    assert_eq!(record.status, DecisionStatus::OnHold);
    assert_eq!(record.review_date, NaiveDate::from_ymd_opt(2026, 12, 9));
}

fn pr_event<'a>(
    delivery_id: &'a str,
    body: &'a [u8],
    payload: &'a serde_json::Value,
    minute: u32,
) -> IncomingEvent<'a> {
    IncomingEvent {
        provider: "github",
        delivery_id,
        event_kind: "pull_request",
        body,
        payload,
        resource: Some(ResourceRef {
            key: "example/order-api#pr/142".to_owned(),
            version: Utc.with_ymd_and_hms(2026, 11, 27, 0, minute, 0).unwrap(),
        }),
    }
}

#[sqlx::test(migrator = "MIGRATOR")]
#[ignore = "requires a local PostgreSQL test server"]
async fn ignores_duplicate_and_older_deliveries(pool: PgPool) {
    let payload = json!({"action": "synchronize"});
    let body = payload.to_string().into_bytes();
    let key = "example/order-api#pr/142";

    // 同じ配信が同時に2回届いても、反映は1回だけ
    let (a, b) = (
        pr_event("d-2", &body, &payload, 40),
        pr_event("d-2", &body, &payload, 40),
    );
    let (first, second) = tokio::join!(sync::ingest(&pool, &a), sync::ingest(&pool, &b));
    let mut results = [first.unwrap(), second.unwrap()];
    results.sort_by_key(|r| *r as u8);
    assert_eq!(results, [Ingested::Applied, Ingested::Duplicate]);

    // 遅れて届いた古い版は記録するが、状態は巻き戻さない
    assert_eq!(
        sync::ingest(&pool, &pr_event("d-1", &body, &payload, 30))
            .await
            .unwrap(),
        Ingested::IgnoredOlder
    );
    assert_eq!(
        sync::resource_version(&pool, "github", key).await.unwrap(),
        Some(Utc.with_ymd_and_hms(2026, 11, 27, 0, 40, 0).unwrap())
    );

    let untracked = IncomingEvent {
        resource: None,
        event_kind: "star",
        ..pr_event("d-3", &body, &payload, 0)
    };
    assert_eq!(
        sync::ingest(&pool, &untracked).await.unwrap(),
        Ingested::Untracked
    );

    let outcomes: Vec<(String, String)> =
        sqlx::query_as("SELECT delivery_id, outcome FROM external_events ORDER BY delivery_id")
            .fetch_all(&pool)
            .await
            .unwrap();
    let outcomes: Vec<(&str, &str)> = outcomes
        .iter()
        .map(|(d, o)| (d.as_str(), o.as_str()))
        .collect();
    assert_eq!(
        outcomes,
        [
            ("d-1", "ignored_older"),
            ("d-2", "applied"),
            ("d-3", "untracked")
        ]
    );
}

#[sqlx::test(migrator = "MIGRATOR")]
#[ignore = "requires a local PostgreSQL test server"]
async fn invalid_cursor_requires_full_resync_and_keeps_last_success(pool: PgPool) {
    let (provider, scope) = ("google_calendar", "経営会議");
    sync::record_sync_success(&pool, provider, scope, "token-1")
        .await
        .unwrap();
    let healthy = sync::sync_cursor(&pool, provider, scope)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(healthy.status, SyncStatus::Healthy);
    let last_success = healthy.last_success_at;

    sync::record_sync_failure(&pool, provider, scope, SyncFailure::Transient, "429")
        .await
        .unwrap();
    let failing = sync::sync_cursor(&pool, provider, scope)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(failing.status, SyncStatus::Failing);
    assert_eq!(failing.cursor.as_deref(), Some("token-1"));
    assert_eq!(failing.last_success_at, last_success);

    sync::record_sync_failure(
        &pool,
        provider,
        scope,
        SyncFailure::CursorInvalid,
        "410 Gone",
    )
    .await
    .unwrap();
    let resync = sync::sync_cursor(&pool, provider, scope)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(resync.status, SyncStatus::FullResyncRequired);
    assert_eq!(resync.cursor, None);
    assert_eq!(resync.last_success_at, last_success);
}
