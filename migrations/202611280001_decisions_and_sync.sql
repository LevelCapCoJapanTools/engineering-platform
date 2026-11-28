-- 経営判断の記録と、外部イベント・同期状態（2026-11-28 SSOT「確定した設計判断」）

CREATE TYPE decision_status AS ENUM ('pending', 'approved', 'conditional', 'on_hold', 'rejected', 'delegated');

CREATE TABLE decisions (
    id uuid PRIMARY KEY,
    title text NOT NULL CHECK (length(title) > 0),
    kind text NOT NULL CHECK (kind IN (
        'investment', 'priority', 'resource', 'risk_acceptance', 'exception',
        'release', 'change', 'budget', 'benefit'
    )),
    requested_by text NOT NULL CHECK (length(requested_by) > 0),
    due date NOT NULL,
    status decision_status NOT NULL DEFAULT 'pending',
    decided_by text,
    decided_at timestamptz,
    reason text,
    conditions text,
    review_date date,
    delegate_to text,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    -- 依頼者本人は判断できない（職務分離）。アプリ側の検証に加えて DB でも拒否する
    CHECK (decided_by IS NULL OR decided_by <> requested_by),
    CHECK ((status = 'pending') = (decided_by IS NULL)),
    CHECK (status = 'pending' OR (decided_at IS NOT NULL AND length(coalesce(reason, '')) > 0)),
    CHECK (status <> 'conditional' OR length(coalesce(conditions, '')) > 0),
    CHECK (status <> 'on_hold' OR review_date IS NOT NULL),
    CHECK (status <> 'delegated' OR length(coalesce(delegate_to, '')) > 0)
);

CREATE TABLE decision_audit_events (
    sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    decision_id uuid NOT NULL REFERENCES decisions (id),
    kind text NOT NULL CHECK (kind IN ('requested', 'decided')),
    actor text NOT NULL CHECK (length(actor) > 0),
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (decision_id, kind)
);

-- 外部から届いたイベント。提供元と配信IDで重複を除外する
CREATE TABLE external_events (
    id uuid PRIMARY KEY,
    provider text NOT NULL CHECK (provider IN ('github')),
    delivery_id text NOT NULL CHECK (length(delivery_id) > 0),
    event_kind text NOT NULL,
    resource_key text,
    resource_version timestamptz,
    payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
    payload jsonb NOT NULL,
    outcome text NOT NULL CHECK (outcome IN ('applied', 'ignored_older', 'untracked')),
    received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (provider, delivery_id)
);

-- リソースごとの最新の版。古い版のイベントで巻き戻さない
CREATE TABLE external_resources (
    provider text NOT NULL,
    resource_key text NOT NULL,
    version timestamptz NOT NULL,
    last_event_id uuid NOT NULL REFERENCES external_events (id),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (provider, resource_key)
);

-- 差分同期のカーソル（syncToken、deltaLink 等）と同期の健全性
CREATE TYPE sync_status AS ENUM ('initial_sync', 'healthy', 'failing', 'full_resync_required', 'auth_expired');

CREATE TABLE sync_cursors (
    provider text NOT NULL,
    scope text NOT NULL,
    cursor text,
    status sync_status NOT NULL DEFAULT 'initial_sync',
    last_success_at timestamptz,
    last_attempt_at timestamptz,
    last_error text,
    PRIMARY KEY (provider, scope)
);
