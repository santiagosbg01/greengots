# GREENGOTTS—V1 FULL PROJECT SPEC (PRD + EPICS + TASKS)

> Drop this single file into Cursor as your source-of-truth. It includes the PRD, detailed scope, data model, API, UX, epics, tasks, sprint plan, acceptance tests, and delivery playbook.

---

## 0) Quick Facts

- **Product name:** Greengotts  
- **Goal:** Yearly team budgeting tool with Google Login, strict admin access control, database-first design, manual FX snapshots, invoice uploads, YTD/Monthly summaries, AI tips, and a "Send to Finance" PDF flow.  
- **Out of scope (V1):** Any third-party integration except Google Login.

---

## 1) PRD (Product Requirements Document)

### 1.1 Problem
Managers track budgets across multiple spreadsheets and inboxes. Actuals (invoices) are scattered, currency conversion is inconsistent, and finance summaries are manual and slow.

### 1.2 Vision
A clean, auditable web app where managers define budgets, create categorized items (headcount/marketing/software/client care/viático), snapshot FX, upload invoices, track YTD/monthly progress, and generate 1-click finance summaries.

### 1.3 Users & Roles
- **Admin:** manage allowlist, roles, teams, cost centers, FX rates, period close, exports, audit.
- **Manager (team-scoped):** create budgets, sections, items; upload invoices; send summaries.
- **Contributor (team-scoped):** create/edit items + uploads in their team.
- **Finance:** read-only + exports; can close periods.

### 1.4 In-Scope (V1)
- **Auth:** Google OAuth2/OIDC.  
- **Access Control:** Email allowlist + RBAC (global or team-scoped).  
- **Budget Setup:** Budget + sections; CRUD items with types (headcount, marketing, software, client care, viático) and natures (one-time, recurring, provision).  
- **Data Requirements:** team, owner/creator, cost center (required), allocations, status, notes.  
- **FX Handling:** manual rate entry; snapshot `fx_rate_id` on save; compute USD; no auto revaluation.  
- **Invoices:** upload/preview PDF/JPG/PNG; signed links.  
- **Reporting:** YTD and Monthly summaries; Budget Control Table (Budget | Committed | Actuals | Remaining | Variance | Burn Rate).  
- **AI Tips:** overspend risk vs time elapsed; duplicate SaaS; under-utilized recurring; run-rate forecast.  
- **Send to Finance:** generate PDF (summary + variances) and open mailto with subject/body + link or attachment.  
- **Governance:** period close (month lock); audit trail; CSV/PDF export.  
- **Privacy:** headcount detail masked for non-Manager/Finance.

### 1.5 Out-of-Scope (V1)
- Any external integrations beyond Google Login: ERP/GL/HRIS/APIs, external FX APIs, Slack/email webhooks.
- Multi-team consolidated rollups, scenario planning, complex approval workflows.

### 1.6 Success Metrics
- Month-end summary produced in ≤10 minutes per team.
- ≥95% of items have documentation (invoice or provision reason).
- Forecast accuracy after month 4 within ±10% to YE.
- ≥80% of targeted managers adopt by end of the first quarter.

### 1.7 Constraints & Risks
- **FX Disputes:** Mitigate with stored snapshot + source note.  
- **PII in Invoices:** Enforce RBAC and retention; mask headcount details.  
- **Mailto Attachments:** Some clients disallow; include signed link fallback.

---

## 2) System Design

### 2.1 Architecture (V1)
- **Frontend:** React/Next.js (or React + Vite), TypeScript.
- **Backend:** Node + TypeScript (Fastify or NestJS).  
- **DB:** Postgres (schema `gg_…` tables).  
- **Files:** Local filesystem (`/var/greengotts/uploads`) + signed routes.  
- **PDF:** Headless Chromium (Puppeteer) HTML→PDF.

### 2.2 Data Model (Postgres)
Tables (prefix `gg_`):
- `gg_user (id, email, display_name, status, created_at)`
- `gg_role (id, code: ADMIN|MANAGER|CONTRIBUTOR|FINANCE)`
- `gg_user_role (user_id, role_id, team_id NULLABLE)`
- `gg_access_allowlist (email, invited_by, invited_at, status)`
- `gg_team (id, name, owner_user_id, cost_center_default_id, created_at)`
- `gg_cost_center (id, team_id, code, name, active)`
- `gg_budget (id, team_id, title, description, fiscal_year, base_currency, status, created_by, updated_by, created_at, updated_at)`
- `gg_budget_section (id, budget_id, title, description, sort_order)`
- `gg_fx_rate (id, as_of_date, from_ccy, to_ccy, rate, source_note, created_by, created_at)`
- `gg_budget_item (id, budget_id, section_id, cost_center_id, owner_user_id, type, nature, vendor_or_person, description, local_currency, local_amount, fx_rate_id_snapshot, usd_amount, allocations_json, status, start_month, end_month, created_by, updated_by, created_at, updated_at, soft_deleted_at)`
- `gg_attachment (id, budget_item_id, file_name, mime, size_bytes, storage_path, uploaded_by, uploaded_at)`
- `gg_audit_log (id, entity_type, entity_id, action, actor_id, before_json, after_json, at)`

> DDL is included in **Appendix A** for copy/paste.

### 2.3 API (REST JSON)
Auth:
- `GET /api/auth/google/login` → redirect
- `GET /api/auth/google/callback` → session + allowlist check
- `POST /api/auth/logout`

Admin & Access:
- `GET/POST/PATCH /api/admin/allowlist`
- `GET /api/admin/users`
- `POST/DELETE /api/admin/users/:id/roles`
- `POST /api/admin/period-close` `{budgetId, month:'YYYY-MM-01', closed:boolean}`

Teams & Cost Centers:
- `GET/POST/PATCH /api/teams`  
- `GET/POST/PATCH /api/cost-centers`

Budgets & Sections:
- `GET/POST/PATCH /api/budgets`
- `GET/POST/PATCH /api/budget-sections`

FX (manual):
- `GET /api/fx?from=&to=&date=YYYY-MM-DD`
- `POST /api/fx` (admin only)

Items:
- `GET /api/budgets/:id/items?type=&status=&costCenterId=&month=YYYY-MM-01`
- `POST/PATCH/DELETE /api/items` (delete = soft-delete)

Attachments:
- `POST /api/items/:id/attachments` (multipart)
- `GET /api/attachments/:id?token=...` (signed)
- `DELETE /api/attachments/:id`

Reports & PDF:
- `GET /api/reports/budget/:budgetId/summary?asOf=YYYY-MM-DD`
- `GET /api/reports/budget/:budgetId/aging`
- `POST /api/reports/budget/:budgetId/pdf` `{ asOf }` → returns signed link

Audit:
- `GET /api/audit?entityType=&entityId=`

### 2.4 UX (Routes & Screens)
Routes:
- `/login`
- `/admin/access` (Allowlist, Users/Roles, Teams, Cost Centers, FX, Period Close)
- `/teams/:teamId`
- `/budgets/:budgetId` tabs: **YTD**, **Monthly**, **Table**, **AI Tips**
- `/items/:itemId`
- `/fx`
- `/reports/summary?budgetId=...`

Key Screens:
- **Manager Home:** budget health, top variances, quick actions.  
- **Item Form:** type + nature, allocations mini-grid (12 buckets), FX as-of picker, USD preview, cost center + owner required, invoices list.  
- **Summary Tabs:**  
  - YTD: totals by type, variance list  
  - Monthly: 12-month bar/line + table  
  - Table: Budget | Committed | Actuals | Remaining | Variance | Burn Rate  
  - AI Tips: cards with rule, rationale, links

---

## 3) AI Tips (Rule-Based, Explainable)

Rules:
1. **Overspend Risk:** `(actuals_to_date / planned_to_date) > 1.1` → warn; show months, numbers.  
2. **Duplicate SaaS:** fuzzy match `vendor_or_person` in `type=software_tool` across team.  
3. **Under-Utilized Recurring:** last 2 consecutive months `actuals_ytd < 0.5 * planned_ytd`.  
4. **Run-Rate Forecast:** last 3 active months straight-line to YE; show variance vs plan.

Each tip shows: data inputs, short formula, link to affected items.

---

## 4) Governance & Security

- **Allowlist gate:** must be approved to pass post-SSO gate.  
- **RBAC:** route guards + team scope.  
- **Period Close:** per month; blocks edits; admin override with reason.  
- **Audit:** CRUD + close/reopen events with diffs.  
- **PII Masking:** headcount detail restricted to Manager/Finance.  
- **Files:** short-lived signed links; path hardening; size/type limits.

---

## 5) Non-Functional

- **Performance:** dashboard <= 700ms p95 for <= 1k items.  
- **Reliability:** daily backups; restore test; error budgets.  
- **Security:** HTTPS, HTTPOnly cookies, CSRF, input validation, rate limiting.  
- **Observability:** structured logs with reqId; basic metrics; minimal tracing.

---

## 6) Dev Environment

**Repos**
- `greengotts-api` (Node+TS)
- `greengotts-app` (React+TS)
- `greengotts-infra` (optional later)

**ENV (.env)**
```
GREENGOTTS_NODE_ENV=development
GREENGOTTS_PORT=8080
GREENGOTTS_BASE_URL=http://localhost:8080
GREENGOTTS_DB_URL=postgres://user:pass@localhost:5432/greengotts
GREENGOTTS_SESSION_SECRET=replace-with-long-random
GREENGOTTS_SIGNING_SECRET=replace-with-long-random
GREENGOTTS_OIDC_CLIENT_ID=xxx.apps.googleusercontent.com
GREENGOTTS_OIDC_CLIENT_SECRET=xxxxx
GREENGOTTS_OIDC_REDIRECT_URL=http://localhost:8080/api/auth/google/callback
GREENGOTTS_ALLOWED_DOMAIN=yourcompany.com
GREENGOTTS_UPLOAD_DIR=/var/greengotts/uploads
GREENGOTTS_MAX_UPLOAD_MB=10
GREENGOTTS_ENABLE_AI_TIPS=true
GREENGOTTS_REQUIRE_COST_CENTER=true
GREENGOTTS_PERIOD_CLOSE=true
```

**Project Layout (API)**
```
/src
  /auth
  /admin
  /teams
  /cost-centers
  /budgets
  /sections
  /items
  /attachments
  /fx
  /reports
  /pdf
  /audit
  /middleware
  /db
    /migrations
    /seed
```

---

## 7) EPICS, USER STORIES, TASKS

> Organized for easy import into PM tools. Each Epic has stories and granular tasks with acceptance criteria.

### EPIC 0 — Database & Foundations
**Story 0.1** Provision Postgres & migrations  
- Tasks:  
  - Create DB and `gg_` schema.  
  - Apply DDL (Appendix A).  
  - Seed roles (`ADMIN, MANAGER, CONTRIBUTOR, FINANCE`).  
- Acceptance: migrations run clean; tables & indexes present.

**Story 0.2** Data access layer  
- Tasks: repositories for core entities; transaction helpers; validation.  
- Acceptance: CRUD smoke tests pass for User/Team/Budget/Item.

---

### EPIC 1 — Auth & Access (Google-only)
**Story 1.1** Google OIDC sign-in  
- Tasks: login route, callback, session cookie; domain filter.  
- Acceptance: allowed domain enforced; session persists; logout works.

**Story 1.2** Allowlist gate  
- Tasks: `gg_access_allowlist` check; request-access screen; admin notification record.  
- Acceptance: non-approved users blocked with clear UI; approved user can enter app.

**Story 1.3** RBAC (global + team scoped)  
- Tasks: role middleware; decorators; tests for each route.  
- Acceptance: unauthorized routes blocked; team scope respected.

**Story 1.4** Admin Access UI  
- Tasks: list allowlist; approve/revoke; assign roles (global or team); set team owner.  
- Acceptance: admin can fully manage access without DB console.

---

### EPIC 2 — Teams, Cost Centers, FX (Manual)
**Story 2.1** Team CRUD  
- Tasks: create/update team; set default cost center.  
- Acceptance: owner set; default CC attached.

**Story 2.2** Cost Center CRUD  
- Tasks: create/update/activate; uniqueness per team.  
- Acceptance: cannot save item without cost center.

**Story 2.3** FX Admin Module  
- Tasks: manual rate entry; validations; list & search; source note.  
- Acceptance: unique (date, from, to); rate>0; admin only.

**Story 2.4** FX Snapshot usage  
- Tasks: item form date picker; server resolves `fx_rate_id_snapshot`; compute USD.  
- Acceptance: USD stable unless as-of date changed.

---

### EPIC 3 — Budgets, Sections, Items
**Story 3.1** Budget CRUD  
- Tasks: create/update; status transitions (draft→active→closed).  
- Acceptance: audit entries recorded.

**Story 3.2** Sections CRUD + ordering  
- Tasks: add/edit/remove; drag sort.  
- Acceptance: items re-link safely when section deleted (set null).

**Story 3.3** Items CRUD + validations  
- Tasks: types/natures; allocations grid (equal/front/custom); headcount proration; soft-delete/restore.  
- Acceptance: allocations sum to total; date rules enforced; restore works.

**Story 3.4** Item Filters & Search  
- Tasks: filters by type/status/cost center/vendor/month; pagination.  
- Acceptance: p95 server compute ≤50ms for 1k items.

---

### EPIC 4 — Files & Attachments
**Story 4.1** Local storage + signed links  
- Tasks: upload to `/var/greengotts/uploads`; hashed filenames; signed GET route; expiry.  
- Acceptance: only authorized users can access; links expire.

**Story 4.2** Client validations & preview  
- Tasks: accept pdf/png/jpg/jpeg; ≤10MB; inline preview.  
- Acceptance: invalid types/sizes blocked client-side and server-side.

---

### EPIC 5 — Reporting & AI Tips
**Story 5.1** YTD & Monthly Summaries + Control Table  
- Tasks: compute planned vs actual vs provision; chart + table; drill-down.  
- Acceptance: values match fixture dataset.

**Story 5.2** Provision Aging (30/60/90)  
- Tasks: bucket by created_at for provisions; highlight stale.  
- Acceptance: correct bucket counts; links to items.

**Story 5.3** AI Tips (4 rules)  
- Tasks: compute metrics; render explainable cards; link to items.  
- Acceptance: shows data used and formula; dismiss + re-open works.

---

### EPIC 6 — PDF & "Send to Finance"
**Story 6.1** PDF Generator  
- Tasks: server HTML→PDF; branded header; summary sections.  
- Acceptance: PDF renders with consistent pagination and fonts.

**Story 6.2** Signed link + Mailto  
- Tasks: create signed URL; mailto button; subject/body formatting.  
- Acceptance: mail client opens; link valid and expiring.

**Story 6.3** Access-controlled retrieval  
- Tasks: GET endpoint verifies RBAC + token; streams file.  
- Acceptance: 403 on invalid token or role.

---

### EPIC 7 — Governance, Audit, Exports
**Story 7.1** Period Close  
- Tasks: mark month closed; block edits; admin override with reason.  
- Acceptance: edits blocked; audit logged.

**Story 7.2** Audit Log  
- Tasks: record before/after diffs; viewer UI.  
- Acceptance: full trace of changes for budgets/items/FX.

**Story 7.3** CSV/PDF Exports  
- Tasks: CSV matching filters; PDF from 6.x; download buttons.  
- Acceptance: CSV UTF-8; matches on-screen filters.

---

## 8) Sprint Plan (4 Sprints)

**Sprint 1: DB + Auth Gate + Access**
- EPIC 0 (DB), EPIC 1.1–1.4, EPIC 2.1–2.2  
- Acceptance: approved users reach dashboard; team+CC exist; RBAC enforced.

**Sprint 2: Budgets/Items + FX Snapshot**
- EPIC 3.1–3.4, EPIC 2.3–2.4  
- Acceptance: item CRUD (all types/natures), allocations/proration ok; USD snapshot saved.

**Sprint 3: Files + Reporting + AI**
- EPIC 4.1–4.2, EPIC 5.1–5.3  
- Acceptance: uploads/preview work; YTD/Monthly/Control Table correct; tips render.

**Sprint 4: PDF + Send + Governance + QA**
- EPIC 6.1–6.3, EPIC 7.1–7.3  
- Acceptance: PDF + mailto OK; month close works; exports & audit verified.

---

## 9) Acceptance Test Script (Happy Path)

1) Login via Google with allowlisted email → lands on Manager Home.  
2) Create **Budget FY2026 (MXN)** with sections.  
3) Add items:  
   - Headcount recurring (start Feb; proration)  
   - Software recurring (vendor "Figma")  
   - Marketing one-time (May)  
   - Provision (client care)  
4) Enter `MXN→USD` rate for "today"; save items with snapshot.  
5) Upload PDF + PNG invoices to two items.  
6) View **YTD** and **Monthly**; verify Control Table.  
7) Open **AI Tips**; see overspend risk and duplicate SaaS candidates.  
8) "Send to Finance" → mailto opens; PDF link valid.  
9) Finance logs in; exports CSV; closes month; edits blocked.

---

## 10) Coding Standards (brief)

- **TypeScript strict** on API & App.  
- **Zod** (or similar) for request validation.  
- **OpenAPI (optional)** for API contracts.  
- **Prettier + ESLint**; commit hooks (lint/test).  
- **Testing:** Jest/Vitest unit; Playwright E2E smoke.

---

## 11) Seed Data (Optional)
See **Appendix B** for quick seeds (roles, admin user, team, cost center, FX).

---

## 12) Roadmap After V1 (Not Included Now)
- External storage (S3/GCS) and AV scanning.  
- ERP/GL & HRIS integrations; GL code sync.  
- Consolidated multi-team rollups; scenarios & versioning.  
- Approval workflows; alerts/notifications; Slack/email.

---

# Appendices

## Appendix A — Postgres DDL (Copy/Paste)

```sql
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
```

---

## Appendix B — Seed Snippets

```sql
INSERT INTO gg_role(code) VALUES ('ADMIN'),('MANAGER'),('CONTRIBUTOR','FINANCE')
ON CONFLICT DO NOTHING;

INSERT INTO gg_user(id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000001','admin@yourcompany.com','Admin')
ON CONFLICT DO NOTHING;

INSERT INTO gg_access_allowlist(email, invited_by, status)
VALUES ('admin@yourcompany.com','00000000-0000-0000-0000-000000000001','approved')
ON CONFLICT DO NOTHING;

INSERT INTO gg_user_role(user_id, role_id, team_id)
SELECT '00000000-0000-0000-0000-000000000001', id, NULL FROM gg_role WHERE code='ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO gg_team(id, name, owner_user_id)
VALUES ('00000000-0000-0000-0000-000000000010','Design','00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO gg_cost_center(id, team_id, code, name)
VALUES ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000010','DES001','Design Ops')
ON CONFLICT DO NOTHING;

UPDATE gg_team
SET cost_center_default_id='00000000-0000-0000-0000-000000000020'
WHERE id='00000000-0000-0000-0000-000000000010';

INSERT INTO gg_fx_rate(as_of_date, from_ccy, to_ccy, rate, source_note, created_by)
VALUES ('2025-01-15','MXN','USD',0.058,'Manual seed','00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
```

---

## Appendix C — Pseudocode Helpers

**Allocations (equal/front/custom)**

```ts
export function allocate(total: number, pattern: 'equal'|'front'|'custom', custom?: number[]): number[] {
  if (pattern === 'custom') {
    if (!custom || custom.length !== 12) throw new Error('Provide 12 values');
    const sum = +custom.reduce((a,b)=>a+b,0).toFixed(2);
    if (Math.abs(sum - total) > 0.01) throw new Error('Custom must sum to total');
    return custom;
  }
  if (pattern === 'equal') {
    const each = +(total/12).toFixed(2);
    const arr = Array(12).fill(each);
    const residue = +(total - each*12).toFixed(2);
    arr[11] = +(arr[11] + residue).toFixed(2);
    return arr;
  }
  // front-load 60% first half
  const first = +((total*0.6)/6).toFixed(2);
  const second = +((total*0.4)/6).toFixed(2);
  const arr = [...Array(6).fill(first), ...Array(6).fill(second)];
  const sum = +arr.reduce((a,b)=>a+b,0).toFixed(2);
  const residue = +(total - sum).toFixed(2);
  arr[11] = +(arr[11] + residue).toFixed(2);
  return arr;
}
```

**Signed file/link token**

```ts
import crypto from 'crypto';

export function signPath(path: string, ttlSec: number, secret: string) {
  const exp = Math.floor(Date.now()/1000) + ttlSec;
  const base = `${path}.${exp}`;
  const sig = crypto.createHmac('sha256', secret).update(base).digest('hex');
  return `${base}.${sig}`;
}

export function verifySigned(token: string, secret: string) {
  const [path, expStr, sig] = token.split('.');
  const now = Math.floor(Date.now()/1000);
  if (Number(expStr) < now) return null;
  const expected = crypto.createHmac('sha256', secret).update(`${path}.${expStr}`).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return path;
}
```

---

## Appendix D — Jira Import (CSV snippet in Markdown)

```csv
Issue Type,Summary,Description,Epic Link,Component,Labels
Epic,EPIC 0 — Database & Foundations,"Postgres, migrations, repositories",,,db
Story,Provision Postgres & DDL,"Apply Appendix A DDL; seed roles",EPIC 0 — Database & Foundations,api,backend
Story,Data access layer,"Repos + tests",EPIC 0 — Database & Foundations,api,backend
Epic,EPIC 1 — Auth & Access,"Google OIDC + allowlist + RBAC",,,auth
Story,Google OIDC login,"Login, callback, session, domain filter",EPIC 1 — Auth & Access,api,auth
Story,Allowlist gate,"Block non-approved; request-access UI",EPIC 1 — Auth & Access,app,auth
Story,RBAC middleware,"Global + team-scoped",EPIC 1 — Auth & Access,api,auth
Story,Admin Access UI,"Allowlist + roles",EPIC 1 — Auth & Access,app,admin
Epic,EPIC 2 — Teams, CC, FX,"Team/CC CRUD, FX manual",,,core
Story,Team CRUD,"Owner + default CC",EPIC 2 — Teams, CC, FX,api,core
Story,Cost Center CRUD,"Uniq per team; required on items",EPIC 2 — Teams, CC, FX,api,core
Story,FX Admin,"Manual rate entry; unique(date,pair)",EPIC 2 — Teams, CC, FX,api,core
Story,FX Snapshot usage,"Resolve rate on item save",EPIC 2 — Teams, CC, FX,api,core
Epic,EPIC 3 — Budgets/Items,"Budgets, sections, items, filters",,,core
Story,Budget CRUD,"Status transitions; audit",EPIC 3 — Budgets/Items,api,core
Story,Sections CRUD,"Ordering; safe delete",EPIC 3 — Budgets/Items,app,core
Story,Items CRUD + validations,"Types/natures; allocations; proration",EPIC 3 — Budgets/Items,app,core
Story,Item Filters & Search,"Type/status/CC/vendor/month",EPIC 3 — Budgets/Items,api,core
Epic,EPIC 4 — Files,"Uploads + signed links",,,files
Story,Local storage & signed links,"/var/greengotts/uploads; expiry",EPIC 4 — Files,api,files
Story,Client validations & preview,"pdf/png/jpg ≤10MB",EPIC 4 — Files,app,files
Epic,EPIC 5 — Reporting & AI,"YTD/Monthly, Control Table, Tips",,,reports
Story,YTD & Monthly,"Charts + tables; drilldown",EPIC 5 — Reporting & AI,app,reports
Story,Provision aging,"30/60/90 buckets",EPIC 5 — Reporting & AI,app,reports
Story,AI tips","4 rules; explainable",EPIC 5 — Reporting & AI,app,ai
Epic,EPIC 6 — PDF & Send,"PDF + mailto + signed link",,,pdf
Story,PDF generator,"HTML→PDF",EPIC 6 — PDF & Send,api,pdf
Story,Signed link + mailto,"Subject/body; link or attach",EPIC 6 — PDF & Send,app,pdf
Epic,EPIC 7 — Governance/Audit/Exports,"Close month; audit; exports",,,governance
Story,Period close,"Lock month; override with reason",EPIC 7 — Governance/Audit/Exports,api,governance
Story,Audit log,"Diffs; viewer",EPIC 7 — Governance/Audit/Exports,api,governance
Story,Exports,"CSV + PDF buttons",EPIC 7 — Governance/Audit/Exports,app,reports
```

---

## Appendix E — "First Files" You Can Generate in Cursor

```
greengotts-api/
  src/index.ts
  src/auth/google.ts
  src/middleware/rbac.ts
  src/admin/allowlist.ts
  src/teams/index.ts
  src/cost-centers/index.ts
  src/budgets/index.ts
  src/sections/index.ts
  src/items/index.ts
  src/attachments/index.ts
  src/fx/index.ts
  src/reports/summary.ts
  src/pdf/generator.ts
  src/audit/index.ts
  src/db/migrations/0001_init.sql (Appendix A)
  src/db/seed/seed.sql (Appendix B)
greengotts-app/
  src/pages/login.tsx
  src/pages/admin/access.tsx
  src/pages/teams/[teamId].tsx
  src/pages/budgets/[budgetId]/index.tsx  (Tabs)
  src/pages/items/[itemId].tsx
  src/pages/fx/index.tsx
  src/components/AllocationsGrid.tsx
  src/components/AITipsPanel.tsx
  src/components/BudgetControlTable.tsx
```

---

## Appendix F — Test Plan (Detail)

**Unit**
- RBAC guard permutations (role × team).  
- FX snapshot calculation; no silent revaluation.  
- Allocation math & rounding.  
- Signed link signer/verifier.

**Integration**
- Login → allowlist → dashboard.  
- Create budget → sections → items → FX snapshot → upload invoice → summaries → PDF.

**E2E**
- Run the full **Acceptance Test Script** in headless browser with fixtures.

---

**End of file.**
