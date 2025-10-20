# Greengotts - Team Budgeting Tool

A clean, auditable web app for team budget management with AI-powered insights.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Google OAuth2 credentials

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/greengotts.git
   cd greengotts
   ```

2. **Set up the API:**
   ```bash
   cd greengotts-api
   npm install
   cp env.example .env
   # Edit .env with your database credentials and Google OAuth settings
   ```

3. **Set up the database:**
   ```bash
   # Create PostgreSQL database
   createdb greengotts
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

4. **Start the API:**
   ```bash
   npm run dev
   ```

5. **Set up the frontend:**
   ```bash
   cd ../greengotts-app
   npm install
   npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8080

## 🏗️ Architecture

### Backend (API)
- **Framework:** Node.js + TypeScript + Fastify
- **Database:** PostgreSQL with `gg_` prefixed tables
- **Authentication:** Google OIDC with allowlist
- **Authorization:** Role-based access control (RBAC)
- **File Storage:** Local filesystem with signed URLs

### Frontend (App)
- **Framework:** Next.js 14 + React 18 + TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React hooks
- **Forms:** React Hook Form + Zod validation

## 📊 Features

### Core Features
- ✅ **Google OAuth2 Authentication** with domain filtering
- ✅ **Email Allowlist** with admin approval workflow
- ✅ **Role-Based Access Control** (Admin, Manager, Contributor, Finance)
- ✅ **Team Management** with cost centers
- ✅ **Budget Creation** with sections and items
- ✅ **Multi-Currency Support** with manual FX rates
- ✅ **File Attachments** for invoices and documents
- ✅ **YTD/Monthly Reporting** with charts
- ✅ **AI-Powered Insights** (overspend risk, duplicate SaaS, etc.)
- ✅ **PDF Generation** for finance reports
- ✅ **Audit Trail** for all changes

### User Roles
- **Admin:** Manage allowlist, roles, teams, FX rates, period close
- **Manager:** Create budgets, sections, items; upload invoices; send summaries
- **Contributor:** Create/edit items + uploads in their team
- **Finance:** Read-only + exports; can close periods

## 🗄️ Database Schema

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

## 🚀 Deployment

### API Deployment (Railway)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main

### Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables

#### API (.env)
```bash
GREENGOTTS_NODE_ENV=production
GREENGOTTS_PORT=8080
GREENGOTTS_BASE_URL=https://your-api-domain.com
GREENGOTTS_DB_URL=postgres://user:pass@host:5432/greengotts
GREENGOTTS_SESSION_SECRET=your-session-secret
GREENGOTTS_SIGNING_SECRET=your-signing-secret
GREENGOTTS_OIDC_CLIENT_ID=your-google-client-id
GREENGOTTS_OIDC_CLIENT_SECRET=your-google-client-secret
GREENGOTTS_OIDC_REDIRECT_URL=https://your-api-domain.com/api/auth/google/callback
GREENGOTTS_ALLOWED_DOMAIN=yourcompany.com
GREENGOTTS_UPLOAD_DIR=/var/greengotts/uploads
GREENGOTTS_MAX_UPLOAD_MB=10
GREENGOTTS_ENABLE_AI_TIPS=true
GREENGOTTS_REQUIRE_COST_CENTER=true
GREENGOTTS_PERIOD_CLOSE=true
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## 🔧 Development

### API Development
```bash
cd greengotts-api
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
```

### Frontend Development
```bash
cd greengotts-app
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 📝 API Endpoints

### Authentication
- `GET /api/auth/google/login` - Google OAuth2 login
- `GET /api/auth/google/callback` - OAuth2 callback
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/allowlist` - Get allowlist
- `POST /api/admin/allowlist` - Add to allowlist
- `PATCH /api/admin/allowlist/:email` - Update allowlist entry
- `DELETE /api/admin/allowlist/:email` - Remove from allowlist
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/:userId/roles` - Assign role
- `DELETE /api/admin/users/:userId/roles` - Remove role

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:teamId` - Get team by ID
- `POST /api/teams` - Create team
- `PATCH /api/teams/:teamId` - Update team
- `DELETE /api/teams/:teamId` - Delete team

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Built with ❤️ for better team budget management**
