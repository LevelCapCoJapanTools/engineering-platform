CREATE TYPE demo_scenario AS ENUM ('passing', 'failing', 'pending', 'missing');

CREATE TABLE demo_runs (
    id uuid PRIMARY KEY,
    scenario demo_scenario NOT NULL,
    snapshot jsonb NOT NULL,
    decision jsonb,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX demo_runs_queued_idx
    ON demo_runs (created_at, id) WHERE decision IS NULL;

CREATE TABLE run_audit_events (
    sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_id uuid NOT NULL REFERENCES demo_runs (id),
    kind text NOT NULL CHECK (kind IN ('queued', 'evaluated')),
    actor text NOT NULL CHECK (actor IN ('local-demo', 'worker')),
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (run_id, kind)
);
