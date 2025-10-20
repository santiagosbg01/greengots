# 🚀 Greengotts Setup & Deployment Guide

## ✅ What We've Built

**Greengotts** is now a complete team budgeting tool with:

### 🏗️ **Backend (API)**
- ✅ Node.js + TypeScript + Fastify
- ✅ PostgreSQL database with complete schema
- ✅ Google OAuth2 authentication
- ✅ Role-based access control (RBAC)
- ✅ Team and budget management
- ✅ File uploads with signed URLs
- ✅ AI-powered insights
- ✅ PDF generation for reports

### 🎨 **Frontend (App)**
- ✅ Next.js 14 + React 18 + TypeScript
- ✅ Tailwind CSS for beautiful UI
- ✅ Google OAuth integration
- ✅ Dashboard with quick stats
- ✅ Responsive design

### 🔧 **Infrastructure**
- ✅ GitHub Actions CI/CD
- ✅ Railway deployment config
- ✅ Vercel deployment config
- ✅ Complete documentation

---

## 🚀 **Step 1: Create GitHub Repository**

1. **Go to GitHub and create a new repository:**
   - Visit: https://github.com/new
   - Repository name: `greengotts`
   - Description: `Team Budgeting Tool with AI Insights`
   - Make it **Public**
   - **Don't** initialize with README (we already have one)

2. **Push your code to GitHub:**
   ```bash
   # Replace YOUR_USERNAME with your actual GitHub username
   git remote add origin https://github.com/YOUR_USERNAME/greengotts.git
   git push -u origin main
   ```

---

## 🚀 **Step 2: Deploy API to Railway**

1. **Sign up for Railway:**
   - Go to https://railway.app
   - Sign up with your GitHub account

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `greengotts` repository
   - **Important:** Set root directory to `greengotts-api`

3. **Add PostgreSQL database:**
   - In your Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Copy the connection string (you'll need it later)

4. **Set environment variables in Railway:**
   ```bash
   GREENGOTTS_NODE_ENV=production
   GREENGOTTS_PORT=8080
   GREENGOTTS_BASE_URL=https://your-api-domain.railway.app
   GREENGOTTS_DB_URL=postgres://user:pass@host:5432/greengotts
   GREENGOTTS_SESSION_SECRET=your-long-random-secret-here
   GREENGOTTS_SIGNING_SECRET=your-long-random-signing-secret-here
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

5. **Deploy and run database migrations:**
   - Railway will automatically deploy your API
   - Connect to your PostgreSQL database and run the SQL from `greengotts-api/src/db/migrations/0001_init.sql`
   - Run the seed SQL from `greengotts-api/src/db/seed/seed.sql`

---

## 🚀 **Step 3: Deploy Frontend to Vercel**

1. **Sign up for Vercel:**
   - Go to https://vercel.com
   - Sign up with your GitHub account

2. **Import project:**
   - Click "New Project"
   - Import your `greengotts` repository
   - Set **root directory** to `greengotts-app`
   - Framework preset: **Next.js**

3. **Set environment variables in Vercel:**
   ```bash
   NEXT_PUBLIC_API_URL=https://your-api-domain.railway.app
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically deploy your frontend

---

## 🚀 **Step 4: Set up Google OAuth2**

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
   - **Authorized redirect URIs:**
     - `https://your-api-domain.railway.app/api/auth/google/callback`
     - `http://localhost:8080/api/auth/google/callback` (for development)

4. **Update Railway environment variables:**
   - Copy the Client ID and Client Secret from Google Console
   - Update `GREENGOTTS_OIDC_CLIENT_ID` and `GREENGOTTS_OIDC_CLIENT_SECRET` in Railway

---

## 🚀 **Step 5: Test Your Deployment**

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

---

## 🎯 **Your Live Application**

Once deployed, your application will be available at:
- **Frontend:** https://your-app.vercel.app
- **API:** https://your-api.railway.app

## 🔧 **Development Workflow**

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

---

## 🎉 **Success!**

Your **Greengotts** application is now live and ready for team budget management!

### **Next Steps:**
1. ✅ Add your team members to the allowlist
2. ✅ Create your first team and budget
3. ✅ Set up cost centers
4. ✅ Configure FX rates
5. ✅ Start tracking your team's budget!

### **Key Features Available:**
- 🔐 **Secure Authentication** with Google OAuth2
- 👥 **Role-Based Access** (Admin, Manager, Contributor, Finance)
- 🏢 **Team Management** with cost centers
- 💰 **Budget Tracking** with multi-currency support
- 📊 **AI Insights** for overspend risk and duplicate SaaS detection
- 📄 **PDF Reports** for finance summaries
- 🔍 **Audit Trail** for all changes

---

## 🆘 **Need Help?**

- **Documentation:** Check the README.md file
- **Issues:** Open an issue on GitHub
- **Support:** Contact your development team

**Happy Budgeting! 🎯**
