-- 発注企業・受注側JV・フリーエンジニアの取引（SSOT「取引・公開・引き渡しの範囲」、2026-11-28 追補）
-- 発注条件・提出・委託検収・配備・顧客受入・支払を別々の状態として持つ。

CREATE TYPE order_terms_status AS ENUM ('draft', 'offered', 'negotiating', 'accepted', 'declined', 'cancelled');
CREATE TYPE order_submission_status AS ENUM ('none', 'submitted', 'resubmitted');
CREATE TYPE order_inspection_status AS ENUM ('not_started', 'in_progress', 'partial', 'passed', 'returned');
CREATE TYPE order_deploy_status AS ENUM ('not_ready', 'requested', 'succeeded', 'failed', 'rolled_back');
CREATE TYPE order_acceptance_status AS ENUM ('not_requested', 'requested', 'partial', 'accepted', 'returned');
CREATE TYPE order_payment_status AS ENUM ('not_due', 'invoiced', 'paid');

CREATE TABLE orders (
    id uuid PRIMARY KEY,
    project text NOT NULL CHECK (length(project) > 0),
    title text NOT NULL CHECK (length(title) > 0),
    client_company text NOT NULL CHECK (length(client_company) > 0),
    freelancer_id text NOT NULL CHECK (length(freelancer_id) > 0),
    created_by text NOT NULL CHECK (length(created_by) > 0),
    latest_version integer NOT NULL DEFAULT 0 CHECK (latest_version >= 0),
    accepted_version integer CHECK (accepted_version IS NULL OR accepted_version BETWEEN 1 AND latest_version),
    terms_status order_terms_status NOT NULL DEFAULT 'draft',
    submission_status order_submission_status NOT NULL DEFAULT 'none',
    inspection_status order_inspection_status NOT NULL DEFAULT 'not_started',
    deploy_status order_deploy_status NOT NULL DEFAULT 'not_ready',
    acceptance_status order_acceptance_status NOT NULL DEFAULT 'not_requested',
    payment_status order_payment_status NOT NULL DEFAULT 'not_due',
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK (freelancer_id <> created_by)
);

-- 発行した条件の版。追記のみ
CREATE TABLE order_terms (
    order_id uuid NOT NULL REFERENCES orders (id),
    version integer NOT NULL CHECK (version >= 1),
    terms jsonb NOT NULL,
    issued_by text NOT NULL,
    issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (order_id, version)
);

-- 受諾・辞退・条件の相談。冪等キーで再送を1件にまとめる
CREATE TABLE order_responses (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES orders (id),
    version integer NOT NULL,
    kind text NOT NULL CHECK (kind IN ('accepted', 'declined', 'counter_offer')),
    responder text NOT NULL,
    note text,
    idempotency_key text NOT NULL UNIQUE CHECK (length(idempotency_key) > 0),
    responded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    FOREIGN KEY (order_id, version) REFERENCES order_terms (order_id, version)
);

-- 提出。提出時の確定版と、受諾済みの条件の版を固定する。再提出は追記
CREATE TABLE order_submissions (
    order_id uuid NOT NULL REFERENCES orders (id),
    revision integer NOT NULL CHECK (revision >= 1),
    terms_version integer NOT NULL,
    commit_sha text CHECK (commit_sha IS NULL OR commit_sha ~ '^[0-9a-f]{40}$'),
    artifact_id text CHECK (artifact_id IS NULL OR length(artifact_id) > 0),
    external_url text,
    submitted_by text NOT NULL,
    submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (order_id, revision),
    CHECK (commit_sha IS NOT NULL OR artifact_id IS NOT NULL),
    FOREIGN KEY (order_id, terms_version) REFERENCES order_terms (order_id, version)
);

-- 分納。給付受領日と支払期日は顧客の受入状況と無関係に固定する
CREATE TABLE order_installments (
    order_id uuid NOT NULL REFERENCES orders (id),
    installment integer NOT NULL CHECK (installment >= 1),
    amount bigint NOT NULL CHECK (amount > 0),
    received_on date NOT NULL,
    payment_due date NOT NULL CHECK (payment_due >= received_on),
    PRIMARY KEY (order_id, installment)
);

-- 完成条件ごとの委託検収
CREATE TABLE order_inspections (
    order_id uuid NOT NULL,
    installment integer NOT NULL,
    criterion text NOT NULL CHECK (length(criterion) > 0),
    passed boolean NOT NULL,
    reason text,
    inspector text NOT NULL,
    inspected_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (order_id, installment, criterion),
    FOREIGN KEY (order_id, installment) REFERENCES order_installments (order_id, installment),
    CHECK (passed OR length(coalesce(reason, '')) > 0)
);

-- 請求の受領。同じ請求番号・同じ分納の二重請求を拒否する
CREATE TABLE order_invoices (
    order_id uuid NOT NULL,
    installment integer NOT NULL,
    invoice_number text NOT NULL CHECK (length(invoice_number) > 0),
    amount bigint NOT NULL CHECK (amount > 0),
    received_on date NOT NULL,
    PRIMARY KEY (order_id, installment),
    UNIQUE (order_id, invoice_number),
    FOREIGN KEY (order_id, installment) REFERENCES order_installments (order_id, installment)
);

CREATE TABLE trade_audit_events (
    sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES orders (id),
    kind text NOT NULL CHECK (kind IN (
        'created', 'terms_issued', 'accepted', 'declined', 'counter_offer', 'submitted',
        'delivery_received', 'inspected', 'invoice_received', 'customer_acceptance_changed'
    )),
    actor text NOT NULL CHECK (length(actor) > 0),
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 対外送信の Outbox。承認は宛先・本文・対象版のハッシュに紐付く
CREATE TYPE outbound_status AS ENUM ('pending_approval', 'queued', 'sent', 'failed');

CREATE TABLE outbound_messages (
    id uuid PRIMARY KEY,
    dedupe_key text NOT NULL UNIQUE CHECK (length(dedupe_key) > 0),
    recipients jsonb NOT NULL,
    body text NOT NULL CHECK (length(body) > 0),
    target_version text NOT NULL,
    content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
    requires_approval boolean NOT NULL,
    approved_sha256 text,
    approved_by text,
    created_by text NOT NULL,
    status outbound_status NOT NULL DEFAULT 'pending_approval',
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK (approved_by IS NULL OR approved_by <> created_by)
);

CREATE TABLE outbound_audit_events (
    sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id uuid NOT NULL REFERENCES outbound_messages (id),
    kind text NOT NULL CHECK (kind IN ('drafted', 'edited', 'approved', 'queued', 'sent', 'failed')),
    actor text NOT NULL CHECK (length(actor) > 0),
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- 配備の実行許可。リリース・成果版・環境・時間枠・ルール版に紐付く
CREATE TYPE deploy_permit_status AS ENUM ('permitted', 'requested', 'succeeded', 'failed');

CREATE TABLE deploy_permits (
    id uuid PRIMARY KEY,
    release text NOT NULL CHECK (length(release) > 0),
    artifact_digest text NOT NULL CHECK (artifact_digest ~ '^[0-9a-f]{64}$'),
    environment text NOT NULL CHECK (length(environment) > 0),
    window_start timestamptz NOT NULL,
    window_end timestamptz NOT NULL CHECK (window_end > window_start),
    rule_version text NOT NULL CHECK (length(rule_version) > 0),
    approved_by text NOT NULL CHECK (length(approved_by) > 0),
    status deploy_permit_status NOT NULL DEFAULT 'permitted',
    external_run_id text,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CHECK (status IN ('permitted', 'requested') OR external_run_id IS NOT NULL)
);

CREATE TABLE deploy_audit_events (
    sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    permit_id uuid NOT NULL REFERENCES deploy_permits (id),
    kind text NOT NULL CHECK (kind IN ('permitted', 'requested', 'run_recorded', 'confirmed')),
    actor text NOT NULL CHECK (length(actor) > 0),
    occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
