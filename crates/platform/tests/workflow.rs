use platform::{
    MIGRATOR,
    gate::Verdict,
    workflow::{self, Scenario},
};
use sqlx::PgPool;

#[sqlx::test(migrator = "MIGRATOR")]
#[ignore = "requires a local PostgreSQL test server"]
async fn two_workers_record_each_decision_and_audit_exactly_once(pool: PgPool) {
    let passed = workflow::enqueue(&pool, Scenario::Passing).await.unwrap();
    let blocked = workflow::enqueue(&pool, Scenario::Pending).await.unwrap();
    let queued = workflow::get(&pool, passed).await.unwrap().unwrap();
    assert!(queued.decision.is_none());
    assert_eq!(queued.events[0].kind, "queued");

    let (first, second) =
        tokio::join!(workflow::process_next(&pool), workflow::process_next(&pool));
    assert_ne!(first.unwrap().unwrap(), second.unwrap().unwrap());
    assert_eq!(workflow::process_next(&pool).await.unwrap(), None);

    for (id, verdict) in [(passed, Verdict::Passed), (blocked, Verdict::Blocked)] {
        let run = workflow::get(&pool, id).await.unwrap().unwrap();
        assert_eq!(run.decision.unwrap().verdict, verdict);
        let events: Vec<_> = run.events.iter().map(|event| event.kind.as_str()).collect();
        assert_eq!(events, ["queued", "evaluated"]);
    }
}
