use chrono::{Duration, NaiveDate, TimeZone, Utc};
use platform::{
    MIGRATOR,
    deploy::{self, DeployError, NewPermit, PermitStatus, RunClaim, RunRequest},
    outbound::{self, Draft, Drafted, OutboundError, OutboundStatus},
    trade::{
        self, AcceptanceStatus, CriterionResult, DeployStatus, InspectionStatus, NewOrder,
        NewSubmission, OrderResponse, OrderTerms, PaymentStatus, Responded, ResponseKind,
        TermField, TermsStatus, TradeError,
    },
};
use sqlx::PgPool;
use uuid::Uuid;

fn day(m: u32, d: u32) -> NaiveDate {
    let year = if m >= 6 { 2026 } else { 2027 };
    NaiveDate::from_ymd_opt(year, m, d).unwrap()
}

fn terms(fee: i64) -> OrderTerms {
    OrderTerms {
        orderer: "サンプルソフト株式会社".to_owned(),
        contractor: "松田 亮".to_owned(),
        ordered_on: Some(day(11, 14)),
        scope: vec!["受注一覧の CSV 出力（5列）".to_owned()],
        out_of_scope: vec!["6列目（担当者）の追加".to_owned()],
        delivery_to: "案件窓口".to_owned(),
        due: Some(day(11, 28)),
        completion_criteria: vec![
            "5列が指定の順で出力される".to_owned(),
            "UTF-8（BOM 付き）".to_owned(),
        ],
        inspection_due: Some(day(12, 5)),
        fee: Some(fee),
        payment_due: Some(day(12, 31)),
        payment_method: "銀行振込".to_owned(),
    }
}

async fn new_order(pool: &PgPool) -> Uuid {
    trade::create_order(
        pool,
        &NewOrder {
            project: "order-renewal".to_owned(),
            title: "受注一覧の CSV 出力".to_owned(),
            client_company: "サンプルソフト株式会社".to_owned(),
            freelancer_id: "u-matsuda".to_owned(),
            created_by: "u-kimura".to_owned(),
        },
    )
    .await
    .unwrap()
}

fn response(version: i32, kind: ResponseKind, key: &str) -> OrderResponse {
    OrderResponse {
        version,
        responder: "u-matsuda".to_owned(),
        kind,
        idempotency_key: key.to_owned(),
    }
}

#[sqlx::test(migrator = "MIGRATOR")]
#[ignore = "requires a local PostgreSQL test server"]
async fn acceptance_is_bound_to_the_latest_terms_and_recorded_once(pool: PgPool) {
    let id = new_order(&pool).await;

    let mut incomplete = terms(400_000);
    incomplete.payment_due = None;
    assert_eq!(
        trade::issue_terms(&pool, id, &incomplete, "u-kimura").await,
        Err(TradeError::Incomplete(vec![TermField::PaymentDue]))
    );

    assert_eq!(
        trade::issue_terms(&pool, id, &terms(400_000), "u-kimura").await,
        Ok(1)
    );
    let counter = ResponseKind::CounterOffer {
        note: "報酬を45万円にしてください".to_owned(),
    };
    assert_eq!(
        trade::respond(&pool, id, &response(1, counter, "k-counter")).await,
        Ok(Responded::Recorded)
    );
    assert_eq!(
        trade::issue_terms(&pool, id, &terms(450_000), "u-kimura").await,
        Ok(2)
    );

    // 旧版を開いたまま押した受諾は、新しい条件への同意にならない
    assert_eq!(
        trade::respond(&pool, id, &response(1, ResponseKind::Accept, "k-old")).await,
        Err(TradeError::StaleVersion { latest: 2 })
    );
    let mut stranger = response(2, ResponseKind::Accept, "k-stranger");
    stranger.responder = "u-hayashi".to_owned();
    assert_eq!(
        trade::respond(&pool, id, &stranger).await,
        Err(TradeError::NotParty)
    );

    // 別々の受諾が同時に届いても1件だけ記録する
    let (a, b) = (
        response(2, ResponseKind::Accept, "k-a"),
        response(2, ResponseKind::Accept, "k-b"),
    );
    let (first, second) =
        tokio::join!(trade::respond(&pool, id, &a), trade::respond(&pool, id, &b));
    let results = [first, second];
    assert_eq!(
        results
            .iter()
            .filter(|r| **r == Ok(Responded::Recorded))
            .count(),
        1
    );
    assert!(results.contains(&Err(TradeError::NotOpen(TermsStatus::Accepted))));

    // 同じ受諾の再送は二重に記録しない
    assert_eq!(
        trade::respond(&pool, id, &a).await,
        Ok(Responded::Duplicate)
    );

    let state = trade::state(&pool, id).await.unwrap().unwrap();
    assert_eq!(state.terms_status, TermsStatus::Accepted);
    assert_eq!((state.latest_version, state.accepted_version), (2, Some(2)));
    // 修正後も当初版を取得できる
    let original = trade::terms_version(&pool, id, 1).await.unwrap().unwrap();
    assert_eq!(original.fee, Some(400_000));
    assert_eq!(
        trade::audit_trail(&pool, id).await.unwrap(),
        [
            "created",
            "terms_issued",
            "counter_offer",
            "terms_issued",
            "accepted"
        ]
    );
    let responses: i64 =
        sqlx::query_scalar("SELECT count(*) FROM order_responses WHERE order_id = $1")
            .bind(id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(responses, 2);
}

#[sqlx::test(migrator = "MIGRATOR")]
#[ignore = "requires a local PostgreSQL test server"]
async fn submission_inspection_and_payment_are_separate_states(pool: PgPool) {
    let id = new_order(&pool).await;
    trade::issue_terms(&pool, id, &terms(450_000), "u-kimura")
        .await
        .unwrap();
    let submission = |sha: &str| NewSubmission {
        submitted_by: "u-matsuda".to_owned(),
        commit_sha: Some(sha.to_owned()),
        artifact_id: None,
        external_url: Some("https://github.example/sample-soft/order-web/pull/151".to_owned()),
    };
    let sha1 = "9f3c2a1e7b4d5c6a8e0f1b2c3d4e5f6a7b8c9d0e";
    let sha2 = "0a1b2c3d4e5f60718293a4b5c6d7e8f901234567";
    assert_eq!(
        trade::submit(&pool, id, &submission(sha1)).await,
        Err(TradeError::NotAccepted)
    );
    trade::respond(&pool, id, &response(1, ResponseKind::Accept, "k1"))
        .await
        .unwrap();

    assert_eq!(
        trade::submit(&pool, id, &submission("main")).await,
        Err(TradeError::InvalidReference)
    );
    assert_eq!(trade::submit(&pool, id, &submission(sha1)).await, Ok(1));
    assert_eq!(trade::submit(&pool, id, &submission(sha2)).await, Ok(2));
    let history = trade::submissions(&pool, id).await.unwrap();
    assert_eq!(
        history,
        [(1, 1, Some(sha1.to_owned())), (2, 1, Some(sha2.to_owned()))]
    );

    // 2回の分納。支払期日は給付受領時に固定する
    for (n, amount, received) in [(1, 200_000, day(12, 1)), (2, 250_000, day(12, 8))] {
        trade::record_delivery(&pool, id, n, amount, received, day(12, 31), "u-aoki")
            .await
            .unwrap();
    }
    let pass = |criterion: &str| CriterionResult {
        criterion: criterion.to_owned(),
        passed: true,
        reason: None,
    };
    for inspector in ["u-matsuda", "u-kimura"] {
        assert_eq!(
            trade::inspect(&pool, id, 1, inspector, &[pass("5列")]).await,
            Err(TradeError::SelfInspection)
        );
    }
    let returned_without_reason = CriterionResult {
        criterion: "UTF-8".to_owned(),
        passed: false,
        reason: None,
    };
    assert_eq!(
        trade::inspect(&pool, id, 1, "u-ito", &[returned_without_reason]).await,
        Err(TradeError::MissingReason)
    );
    assert_eq!(
        trade::inspect(&pool, id, 1, "u-ito", &[pass("5列"), pass("UTF-8")]).await,
        Ok(InspectionStatus::Partial)
    );

    // 最終顧客の差戻しは、委託検収と支払期日を変えない
    trade::set_customer_acceptance(&pool, id, AcceptanceStatus::Returned, "u-noguchi")
        .await
        .unwrap();
    assert_eq!(
        trade::payment_due(&pool, id, 1).await.unwrap(),
        Some(day(12, 31))
    );

    assert_eq!(
        trade::inspect(&pool, id, 2, "u-ito", &[pass("5列"), pass("UTF-8")]).await,
        Ok(InspectionStatus::Passed)
    );
    // 「委託検収済み・配備待ち・支払予定」は正常な組合せ
    let state = trade::state(&pool, id).await.unwrap().unwrap();
    assert_eq!(state.inspection_status, InspectionStatus::Passed);
    assert_eq!(state.deploy_status, DeployStatus::NotReady);
    assert_eq!(state.payment_status, PaymentStatus::NotDue);
    assert_eq!(state.acceptance_status, AcceptanceStatus::Returned);

    // 請求の照合
    assert_eq!(
        trade::record_invoice(&pool, id, 1, "INV-001", 210_000, day(12, 2), "u-aoki").await,
        Err(TradeError::AmountMismatch {
            expected: 200_000,
            invoiced: 210_000
        })
    );
    trade::record_invoice(&pool, id, 1, "INV-001", 200_000, day(12, 2), "u-aoki")
        .await
        .unwrap();
    assert_eq!(
        trade::record_invoice(&pool, id, 1, "INV-002", 200_000, day(12, 3), "u-aoki").await,
        Err(TradeError::DuplicateInvoice)
    );
    assert_eq!(
        trade::record_invoice(&pool, id, 2, "INV-001", 250_000, day(12, 9), "u-aoki").await,
        Err(TradeError::DuplicateInvoice)
    );
    assert_eq!(
        trade::payment_due(&pool, id, 1).await.unwrap(),
        Some(day(12, 31))
    );
    assert_eq!(
        trade::state(&pool, id)
            .await
            .unwrap()
            .unwrap()
            .payment_status,
        PaymentStatus::Invoiced
    );
}

fn draft(key: &str, requires_approval: bool) -> Draft {
    Draft {
        dedupe_key: key.to_owned(),
        recipients: vec!["nakamura@kakuu-shoji.example".to_owned()],
        body: "v1.4.0 の納入予定日は 12/17 です".to_owned(),
        target_version: "MS-104 r2".to_owned(),
        requires_approval,
        created_by: "u-aoki".to_owned(),
    }
}

#[sqlx::test(migrator = "MIGRATOR")]
#[ignore = "requires a local PostgreSQL test server"]
async fn outbound_commitments_need_approval_of_the_exact_content(pool: PgPool) {
    let (a, b) = (draft("commit-ms104", true), draft("commit-ms104", true));
    let (first, second) = tokio::join!(outbound::draft(&pool, &a), outbound::draft(&pool, &b));
    let (first, second) = (first.unwrap(), second.unwrap());
    let id = match (first, second) {
        (Drafted::Created(id), Drafted::Duplicate(dup))
        | (Drafted::Duplicate(dup), Drafted::Created(id)) => {
            assert_eq!(id, dup);
            id
        }
        other => panic!("expected one created and one duplicate: {other:?}"),
    };

    assert_eq!(
        outbound::enqueue(&pool, id, "u-aoki").await,
        Err(OutboundError::NeedsApproval)
    );
    let (_, hash) = outbound::status(&pool, id).await.unwrap().unwrap();
    assert_eq!(
        outbound::approve(&pool, id, "u-aoki", &hash).await,
        Err(OutboundError::SelfApproval)
    );
    assert_eq!(
        outbound::approve(&pool, id, "u-kimura", &"0".repeat(64)).await,
        Err(OutboundError::ContentChanged)
    );
    outbound::approve(&pool, id, "u-kimura", &hash)
        .await
        .unwrap();

    // 承認後に本文が変わったら再承認が必要
    outbound::edit(
        &pool,
        id,
        &["nakamura@kakuu-shoji.example".to_owned()],
        "v1.4.0 の納入予定日は 12/18 です",
        "MS-104 r2",
        "u-aoki",
    )
    .await
    .unwrap();
    assert_eq!(
        outbound::enqueue(&pool, id, "u-aoki").await,
        Err(OutboundError::NeedsApproval)
    );
    let (_, new_hash) = outbound::status(&pool, id).await.unwrap().unwrap();
    assert_ne!(hash, new_hash);
    outbound::approve(&pool, id, "u-kimura", &new_hash)
        .await
        .unwrap();
    outbound::enqueue(&pool, id, "u-aoki").await.unwrap();
    assert_eq!(
        outbound::edit(&pool, id, &["x@example.com".to_owned()], "x", "v", "u-aoki").await,
        Err(OutboundError::AlreadyQueued(OutboundStatus::Queued))
    );
    outbound::record_delivery(&pool, id, false, "worker")
        .await
        .unwrap();
    outbound::record_delivery(&pool, id, true, "worker")
        .await
        .unwrap();
    assert_eq!(
        outbound::status(&pool, id).await.unwrap().unwrap().0,
        OutboundStatus::Sent
    );

    // 受領通知などの定型連絡は承認なしで送信待ちに入る
    let Drafted::Created(routine) = outbound::draft(&pool, &draft("ack-INQ-0031", false))
        .await
        .unwrap()
    else {
        panic!("routine message must be created");
    };
    outbound::enqueue(&pool, routine, "rule:ack").await.unwrap();
}

fn digest(seed: char) -> String {
    std::iter::repeat_n(seed, 64).collect()
}

#[sqlx::test(migrator = "MIGRATOR")]
#[ignore = "requires a local PostgreSQL test server"]
async fn a_permit_starts_one_deployment_and_waits_for_the_external_result(pool: PgPool) {
    let start = Utc.with_ymd_and_hms(2026, 12, 17, 1, 0, 0).unwrap();
    let id = deploy::permit(
        &pool,
        &NewPermit {
            release: "rel-140".to_owned(),
            artifact_digest: digest('a'),
            environment: "production".to_owned(),
            window_start: start,
            window_end: start + Duration::hours(2),
            rule_version: "Basic Control Pack 1.3.0".to_owned(),
            approved_by: "u-kimura".to_owned(),
        },
    )
    .await
    .unwrap();
    let request = |artifact: String, minutes: i64| RunRequest {
        artifact_digest: artifact,
        environment: "production".to_owned(),
        rule_version: "Basic Control Pack 1.3.0".to_owned(),
        now: start + Duration::minutes(minutes),
        actor: "u-aoki".to_owned(),
    };

    assert_eq!(
        deploy::claim_run(&pool, id, &request(digest('b'), 10)).await,
        Err(DeployError::ArtifactChanged)
    );
    assert_eq!(
        deploy::claim_run(&pool, id, &request(digest('a'), 180)).await,
        Err(DeployError::OutsideWindow)
    );

    // 同じ許可で同時に依頼しても、外部を起動してよいのは1回だけ
    let (r1, r2) = (request(digest('a'), 10), request(digest('a'), 11));
    let (first, second) = tokio::join!(
        deploy::claim_run(&pool, id, &r1),
        deploy::claim_run(&pool, id, &r2)
    );
    let mut claims = [first.unwrap(), second.unwrap()];
    claims.sort_by_key(|c| *c as u8);
    assert_eq!(claims, [RunClaim::Start, RunClaim::AlreadyRequested]);

    assert_eq!(
        deploy::confirm(&pool, id, "run-1", true, "worker").await,
        Err(DeployError::RunMismatch)
    );
    deploy::record_run(&pool, id, "run-1", "u-aoki")
        .await
        .unwrap();
    deploy::record_run(&pool, id, "run-1", "u-aoki")
        .await
        .unwrap();
    assert_eq!(
        deploy::record_run(&pool, id, "run-2", "u-aoki").await,
        Err(DeployError::RunMismatch)
    );
    // 結果を照合するまでは確認済みにしない
    assert_eq!(
        deploy::status(&pool, id).await.unwrap(),
        Some(PermitStatus::Requested)
    );
    assert_eq!(
        deploy::confirm(&pool, id, "run-2", true, "worker").await,
        Err(DeployError::RunMismatch)
    );
    assert_eq!(
        deploy::confirm(&pool, id, "run-1", true, "worker").await,
        Ok(PermitStatus::Succeeded)
    );
    assert_eq!(
        deploy::confirm(&pool, id, "run-1", false, "worker").await,
        Ok(PermitStatus::Succeeded)
    );
    assert_eq!(
        deploy::audit_trail(&pool, id).await.unwrap(),
        ["permitted", "requested", "run_recorded", "confirmed"]
    );
}
