use anyhow::Context;
use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, Path, State},
    http::{HeaderMap, StatusCode, header::LOCATION},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use platform::workflow::{self, Run, Scenario};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::{env, time::Duration};
use uuid::Uuid;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    platform::init_logging();
    let database_url = env::var("DATABASE_URL").context("DATABASE_URL is required")?;
    let pool = platform::connect(&database_url).await?;
    platform::MIGRATOR.run(&pool).await?;

    let mut app = Router::new()
        .route("/healthz", get(|| async { StatusCode::NO_CONTENT }))
        .route("/readyz", get(ready));

    let demo_enabled = platform::demo_enabled();
    if demo_enabled {
        app = app
            .route("/api/v1/demo/runs", post(create_run))
            .route("/api/v1/demo/runs/{id}", get(get_run))
            .layer(DefaultBodyLimit::max(1024));
    }
    let bind = env::var("API_BIND").unwrap_or_else(|_| "127.0.0.1:8080".to_owned());
    let listener = tokio::net::TcpListener::bind(&bind).await?;
    tracing::info!(%bind, demo_enabled, "HTTP server listening");
    axum::serve(listener, app.with_state(pool))
        .with_graceful_shutdown(async {
            if let Err(error) = platform::shutdown_signal().await {
                tracing::error!(%error, "shutdown signal failed");
            }
        })
        .await?;
    Ok(())
}

async fn ready(State(pool): State<PgPool>) -> StatusCode {
    let query = sqlx::query("SELECT 1").execute(&pool);
    match tokio::time::timeout(Duration::from_secs(2), query).await {
        Ok(Ok(_)) => StatusCode::NO_CONTENT,
        _ => StatusCode::SERVICE_UNAVAILABLE,
    }
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct CreateRun {
    scenario: Scenario,
}

#[derive(Serialize)]
struct CreatedRun {
    id: Uuid,
}

async fn create_run(
    State(pool): State<PgPool>,
    Json(request): Json<CreateRun>,
) -> Result<(StatusCode, HeaderMap, Json<CreatedRun>), ApiError> {
    let id = workflow::enqueue(&pool, request.scenario).await?;
    let mut headers = HeaderMap::new();
    headers.insert(
        LOCATION,
        format!("/api/v1/demo/runs/{id}")
            .parse()
            .expect("UUID path is a valid header value"),
    );
    Ok((StatusCode::ACCEPTED, headers, Json(CreatedRun { id })))
}

async fn get_run(State(pool): State<PgPool>, Path(id): Path<Uuid>) -> Result<Json<Run>, ApiError> {
    workflow::get(&pool, id)
        .await?
        .map(Json)
        .ok_or(ApiError::NotFound)
}

enum ApiError {
    NotFound,
    Database(sqlx::Error),
}

impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        Self::Database(error)
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        match self {
            Self::NotFound => (StatusCode::NOT_FOUND, "run not found").into_response(),
            Self::Database(error) => {
                tracing::error!(%error, "database operation failed");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal error").into_response()
            }
        }
    }
}
