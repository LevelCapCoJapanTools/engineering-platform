# syntax=docker/dockerfile:1
FROM rust:1.100.0-bookworm AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./
COPY crates crates
COPY migrations migrations
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    cargo build --release --locked -p server -p worker \
    && install -Dm755 target/release/server /out/server \
    && install -Dm755 target/release/worker /out/worker

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /out/server /out/worker /usr/local/bin/
USER 65532:65532
CMD ["server"]
