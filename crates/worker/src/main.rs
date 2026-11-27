use anyhow::Context;
use std::{env, time::Duration};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    platform::init_logging();
    anyhow::ensure!(platform::demo_enabled(), "EP_DEMO_MODE=1 is required");
    let database_url = env::var("DATABASE_URL").context("DATABASE_URL is required")?;
    let pool = platform::connect(&database_url).await?;

    tracing::info!("CI snapshot worker started");
    let shutdown = platform::shutdown_signal();
    tokio::pin!(shutdown);
    let mut delay = Duration::ZERO;

    loop {
        tokio::select! {
            biased;
            result = &mut shutdown => {
                result?;
                break;
            }
            _ = tokio::time::sleep(delay) => {}
        }

        delay = match platform::workflow::process_next(&pool).await {
            Ok(Some(id)) => {
                tracing::info!(%id, "CI snapshot evaluated");
                Duration::ZERO
            }
            Ok(None) => Duration::from_millis(350),
            Err(error) => {
                tracing::error!(%error, "job transaction failed");
                Duration::from_secs(2)
            }
        };
    }

    pool.close().await;
    Ok(())
}
