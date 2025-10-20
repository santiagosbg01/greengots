# Greengotts Deployment Guide

This guide will help you deploy Greengotts to production with GitHub, Railway (API), and Vercel (Frontend).

## 🚀 Quick Deployment Steps

### 1. Create GitHub Repository

1. **Initialize Git repository:**
   ```bash
   cd /Users/Santiago/Desktop/Ai/Greengots
   git init
   git add .
   git commit -m "Initial commit: Greengotts team budgeting tool"
   ```

2. **Create GitHub repository:**
   - Go to https://github.com/new
   - Repository name: `greengotts`
   - Description: `Team Budgeting Tool with AI Insights`
   - Make it public
   - Don't initialize with README (we already have one)

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/greengotts.git
   git branch -M main
   git push -u origin main
   ```

### 2. Deploy API to Railway

1. **Sign up for Railway:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `greengotts` repository
   - Select `greengotts-api` as the root directory

3. **Set up PostgreSQL database:**
   - In Railway dashboard, click "New"
   - Select "Database" → "PostgreSQL"
   - Copy the connection string

4. **Configure environment variables:**
   ```bash
   GREENGOTTS_NODE_ENV=production
   GREENGOTTS_PORT=8080
   GREENGOTTS_BASE_URL=https://your-api-domain.railway.app
   GREENGOTTS_DB_URL=postgres://user:pass@host:5432/greengotts
   GREENGOTTS_SESSION_SECRET=your-long-random-secret
   GREENGOTTS_SIGNING_SECRET=your-long-random-signing-secret
   GREENGOTTS_OIDC_CLIENT_ID=your-google-client-id
   GREENGOTTS_OIDC_CLIENT_SECRET=your-google-client-secret
   GREENGOTTS_OIDC_REDIRECT_URL=https://your-api-domain.railway.app/api/auth/google/callback
   GREENGOTTS_ALLOWED_DOMAIN=yourcompany.com
   GREENGOTTS_UPLOAD_DIR=/tmp/uploads
   GREENGOTTS_MAX_UPLOAD_MB=10
   GREENGOTTS_ENABLE_AI_TIPS=true
   GREENGOTTS_REQUIRE_COST_CENTER=true
   GREENGOTTS_PERIOD_CLOSE=true
   ```

5. **Deploy and run migrations:**
   - Railway will automatically deploy
   - Connect to your database and run the migration SQL from `greengotts-api/src/db/migrations/0001_init.sql`
   - Run the seed SQL from `greengotts-api/src/db/seed/seed.sql`

### 3. Deploy Frontend to Vercel

1. **Sign up for Vercel:**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import project:**
   - Click "New Project"
   - Import your `greengotts` repository
   - Set root directory to `greengotts-app`
   - Framework preset: Next.js

3. **Configure environment variables:**
   ```bash
   NEXT_PUBLIC_API_URL=https://your-api-domain.railway.app
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically deploy

### 4. Set up Google OAuth2

1. **Go to Google Cloud Console:**
   - Visit https://console.cloud.google.com
   - Create a new project or select existing

2. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth2 credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `https://your-api-domain.railway.app/api/auth/google/callback`
     - `http://localhost:8080/api/auth/google/callback` (for development)

4. **Update environment variables:**
   - Copy Client ID and Client Secret
   - Update Railway environment variables with these values

### 5. Test the Deployment

1. **Visit your frontend URL:**
   - Go to your Vercel deployment URL
   - You should see the Greengotts landing page

2. **Test authentication:**
   - Click "Sign in with Google"
   - Complete OAuth flow
   - You should be redirected to the dashboard

3. **Test admin functions:**
   - The seeded admin user should have full access
   - Test allowlist management
   - Test team creation

## 🔧 Development Workflow

### Local Development
```bash
# Terminal 1: API
cd greengotts-api
npm install
npm run dev

# Terminal 2: Frontend
cd greengotts-app
npm install
npm run dev
```

### Production Updates
```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Railway and Vercel will auto-deploy
```

## 📊 Monitoring

### Railway (API)
- View logs in Railway dashboard
- Monitor database performance
- Set up alerts for errors

### Vercel (Frontend)
- View analytics in Vercel dashboard
- Monitor performance metrics
- Set up error tracking

## 🛠️ Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check `GREENGOTTS_DB_URL` in Railway
   - Ensure PostgreSQL is running
   - Verify migrations have been run

2. **OAuth redirect errors:**
   - Check redirect URLs in Google Console
   - Verify `GREENGOTTS_OIDC_REDIRECT_URL` matches exactly

3. **CORS errors:**
   - Check `GREENGOTTS_BASE_URL` in API
   - Verify `NEXT_PUBLIC_API_URL` in frontend

4. **File upload errors:**
   - Check `GREENGOTTS_UPLOAD_DIR` permissions
   - Verify `GREENGOTTS_MAX_UPLOAD_MB` setting

### Debug Commands

```bash
# Check API health
curl https://your-api-domain.railway.app/health

# Check database connection
curl https://your-api-domain.railway.app/api/test/db

# View API logs
railway logs

# View frontend logs
vercel logs
```

## 🎉 Success!

Your Greengotts application should now be live and accessible at:
- **Frontend:** https://your-app.vercel.app
- **API:** https://your-api.railway.app

Users can now:
1. Sign in with Google (if on allowlist)
2. Create teams and budgets
3. Manage budget items
4. Generate reports
5. Access AI insights

## 🔄 Next Steps

1. **Add your team members to the allowlist**
2. **Create your first team and budget**
3. **Set up cost centers**
4. **Configure FX rates**
5. **Start tracking your team's budget!**

---

**Need help?** Open an issue on GitHub or check the documentation in the README.md file.
