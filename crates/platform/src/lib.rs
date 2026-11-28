pub mod decision;
pub mod deploy;
pub mod disclosure;
pub mod evidence;
pub mod gate;
pub mod github;
pub mod outbound;
pub mod schedule;
pub mod sync;
pub mod trade;
pub mod webhook;
pub mod workflow;

use sqlx::{PgPool, postgres::PgPoolOptions};
use std::{env, time::Duration};
use tracing_subscriber::EnvFilter;

pub static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../../migrations");

pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(database_url)
        .await
}

pub fn init_logging() {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    tracing_subscriber::fmt().with_env_filter(filter).init();
}

pub async fn shutdown_signal() -> std::io::Result<()> {
    #[cfg(unix)]
    {
        use tokio::signal::unix::{SignalKind, signal};

        let mut terminate = signal(SignalKind::terminate())?;
        tokio::select! {
            result = tokio::signal::ctrl_c() => result,
            _ = terminate.recv() => Ok(()),
        }
    }
    #[cfg(not(unix))]
    {
        tokio::signal::ctrl_c().await
    }
}

pub fn demo_enabled() -> bool {
    env::var("EP_DEMO_MODE").as_deref() == Ok("1")
}
