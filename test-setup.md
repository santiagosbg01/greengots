# Greengotts Setup Test

## Database Setup Verification

Since we need to set up Node.js properly, let me create a manual verification of our database setup:

### 1. PostgreSQL Setup Required

You'll need to:
1. Install PostgreSQL locally or use a cloud service
2. Create a database named `greengotts`
3. Run the migration script

### 2. Database Schema Verification

The schema includes these tables:
- `gg_user` - User accounts
- `gg_role` - System roles (ADMIN, MANAGER, CONTRIBUTOR, FINANCE)
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

### 3. Manual Database Test

You can test the database setup by running these SQL commands:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'gg_%'
ORDER BY table_name;

-- Check if roles are seeded
SELECT * FROM gg_role;

-- Check if admin user exists
SELECT * FROM gg_user WHERE email = 'admin@yourcompany.com';
```

### 4. Next Steps

Once Node.js is properly installed, you can:
1. Run `npm install` in the greengotts-api directory
2. Set up your `.env` file with database credentials
3. Run `npm run db:migrate` to create tables
4. Run `npm run db:seed` to populate initial data
5. Run `npm run test-db` to verify everything works
