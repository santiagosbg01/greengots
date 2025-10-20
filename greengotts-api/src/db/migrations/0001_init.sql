CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Users & Access
CREATE TABLE IF NOT EXISTS gg_user (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            CITEXT UNIQUE NOT NULL,
  display_name     TEXT,
  status           TEXT NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gg_role (
  id    SERIAL PRIMARY KEY,
  code  TEXT UNIQUE NOT NULL CHECK (code IN ('ADMIN','MANAGER','CONTRIBUTOR','FINANCE'))
);

CREATE TABLE IF NOT EXISTS gg_user_role (
  user_id  UUID NOT NULL REFERENCES gg_user(id) ON DELETE CASCADE,
  role_id  INT  NOT NULL REFERENCES gg_role(id),
  team_id  UUID NULL,
  PRIMARY KEY (user_id, role_id, team_id),
  FOREIGN KEY (team_id) REFERENCES gg_team(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS gg_access_allowlist (
  email       CITEXT PRIMARY KEY,
  invited_by  UUID REFERENCES gg_user(id),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status      TEXT NOT NULL CHECK (status IN ('pending','approved','revoked')) DEFAULT 'pending'
);

-- Teams & CC
CREATE TABLE IF NOT EXISTS gg_team (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  owner_user_id         UUID NOT NULL REFERENCES gg_user(id),
  cost_center_default_id UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gg_cost_center (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id  UUID REFERENCES gg_team(id) ON DELETE CASCADE,
  code     TEXT NOT NULL,
  name     TEXT NOT NULL,
  active   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (team_id, code)
);

ALTER TABLE gg_team
  ADD CONSTRAINT fk_team_default_cc
  FOREIGN KEY (cost_center_default_id) REFERENCES gg_cost_center(id);

-- Budgets & Sections
CREATE TABLE IF NOT EXISTS gg_budget (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES gg_team(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  fiscal_year   INT  NOT NULL,
  base_currency CHAR(3) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','closed')),
  created_by    UUID NOT NULL REFERENCES gg_user(id),
  updated_by    UUID NOT NULL REFERENCES gg_user(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gg_budget_section (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id    UUID NOT NULL REFERENCES gg_budget(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  sort_order   INT NOT NULL DEFAULT 0
);

-- FX (manual)
CREATE TABLE IF NOT EXISTS gg_fx_rate (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  as_of_date  DATE NOT NULL,
  from_ccy    CHAR(3) NOT NULL,
  to_ccy      CHAR(3) NOT NULL,
  rate        NUMERIC(18,6) NOT NULL CHECK (rate > 0),
  source_note TEXT,
  created_by  UUID NOT NULL REFERENCES gg_user(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (as_of_date, from_ccy, to_ccy)
);

-- Items
CREATE TABLE IF NOT EXISTS gg_budget_item (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id          UUID NOT NULL REFERENCES gg_budget(id) ON DELETE CASCADE,
  section_id         UUID REFERENCES gg_budget_section(id) ON DELETE SET NULL,
  cost_center_id     UUID NOT NULL REFERENCES gg_cost_center(id),
  owner_user_id      UUID NOT NULL REFERENCES gg_user(id),
  type               TEXT NOT NULL CHECK (type IN ('headcount','marketing_expense','software_tool','client_care','viatico')),
  nature             TEXT NOT NULL CHECK (nature IN ('one_time','recurring','provision')),
  vendor_or_person   TEXT,
  description        TEXT,
  local_currency     CHAR(3) NOT NULL,
  local_amount       NUMERIC(18,2) NOT NULL CHECK (local_amount >= 0),
  fx_rate_id_snapshot UUID NOT NULL REFERENCES gg_fx_rate(id),
  usd_amount         NUMERIC(18,2) NOT NULL CHECK (usd_amount >= 0),
  allocations_json   JSONB NOT NULL DEFAULT '[]',
  status             TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','provision','actualized')),
  start_month        DATE,
  end_month          DATE,
  created_by         UUID NOT NULL REFERENCES gg_user(id),
  updated_by         UUID NOT NULL REFERENCES gg_user(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  soft_deleted_at    TIMESTAMPTZ
);

-- Attachments
CREATE TABLE IF NOT EXISTS gg_attachment (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_item_id UUID NOT NULL REFERENCES gg_budget_item(id) ON DELETE CASCADE,
  file_name      TEXT NOT NULL,
  mime           TEXT NOT NULL,
  size_bytes     BIGINT NOT NULL CHECK (size_bytes >= 0),
  storage_path   TEXT NOT NULL,
  uploaded_by    UUID NOT NULL REFERENCES gg_user(id),
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit
CREATE TABLE IF NOT EXISTS gg_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT NOT NULL,
  entity_id    UUID NOT NULL,
  action       TEXT NOT NULL,
  actor_id     UUID REFERENCES gg_user(id),
  before_json  JSONB,
  after_json   JSONB,
  at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_team ON gg_budget(team_id);
CREATE INDEX IF NOT EXISTS idx_item_budget ON gg_budget_item(budget_id);
CREATE INDEX IF NOT EXISTS idx_item_cc ON gg_budget_item(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_item_typestatus ON gg_budget_item(type, status);
CREATE INDEX IF NOT EXISTS idx_fx_date_pair ON gg_fx_rate(as_of_date, from_ccy, to_ccy);
CREATE INDEX IF NOT EXISTS idx_allowlist_status ON gg_access_allowlist(status);
