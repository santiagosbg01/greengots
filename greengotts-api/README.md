# Greengotts API

Team budgeting tool API built with Node.js, TypeScript, Fastify, and PostgreSQL.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials and other settings
   ```

3. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb greengotts
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Test database setup:**
   ```bash
   npm run test-db
   ```

## Environment Variables

See `env.example` for all required environment variables.

## API Endpoints

- `GET /health` - Health check
- `GET /api/test/db` - Database connection test

## Database Schema

The database uses the `gg_` prefix for all tables:
- `gg_user` - Users
- `gg_role` - Roles (ADMIN, MANAGER, CONTRIBUTOR, FINANCE)
- `gg_user_role` - User role assignments
- `gg_access_allowlist` - Email allowlist
- `gg_team` - Teams
- `gg_cost_center` - Cost centers
- `gg_budget` - Budgets
- `gg_budget_section` - Budget sections
- `gg_budget_item` - Budget items
- `gg_fx_rate` - FX rates
- `gg_attachment` - File attachments
- `gg_audit_log` - Audit trail

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Project Structure

```
src/
├── auth/           # Authentication routes
├── admin/          # Admin routes
├── teams/          # Team management
├── budgets/        # Budget management
├── items/          # Budget items
├── attachments/    # File handling
├── fx/             # FX rates
├── reports/        # Reporting
├── pdf/            # PDF generation
├── audit/          # Audit logging
├── middleware/     # Middleware
└── db/             # Database layer
    ├── migrations/ # Database migrations
    ├── seed/       # Seed data
    └── repositories/ # Data access layer
```
