# 🚀 Railway Deployment Setup

This is a **monorepo** with two separate services. You need to deploy them individually on Railway.

## 📁 Project Structure

```
greengots/
├── greengotts-api/     # Backend API (Node.js + Fastify)
├── greengotts-app/     # Frontend App (Next.js + React)
└── README.md
```

## 🎯 How to Deploy on Railway

### Option 1: Deploy from Root (Recommended)

1. **Go to Railway Dashboard**
2. **Create New Project**
3. **Select "Deploy from GitHub repo"**
4. **Choose this repository**
5. **Railway will ask which folder to deploy**
6. **Select either `greengotts-api` or `greengotts-app`**

### Option 2: Deploy Individual Services

#### Deploy Backend API:
1. Create new Railway project
2. Select "Deploy from GitHub repo"
3. Choose this repository
4. Set **Root Directory** to `greengotts-api`
5. Deploy!

#### Deploy Frontend App:
1. Create new Railway project (or add service to existing)
2. Select "Deploy from GitHub repo"
3. Choose this repository
4. Set **Root Directory** to `greengotts-app`
5. Deploy!

## 🔧 Railway Configuration

Each service has its own configuration:

### Backend (`greengotts-api/`):
- ✅ `railway.json` - Railway settings
- ✅ `nixpacks.toml` - Build configuration
- ✅ `Dockerfile` - Container fallback
- ✅ `Procfile` - Process definition

### Frontend (`greengotts-app/`):
- ✅ `railway.json` - Railway settings
- ✅ `nixpacks.toml` - Build configuration
- ✅ `Dockerfile` - Container fallback
- ✅ `Procfile` - Process definition

## 🚀 Quick Start

### 1. Deploy Backend First:
```bash
# In Railway dashboard:
# 1. New Project → GitHub repo
# 2. Select repository
# 3. Set Root Directory: greengotts-api
# 4. Add environment variables
# 5. Deploy
```

### 2. Deploy Frontend:
```bash
# In Railway dashboard:
# 1. Add Service → GitHub repo
# 2. Select repository
# 3. Set Root Directory: greengotts-app
# 4. Add environment variables
# 5. Deploy
```

### 3. Add Database:
```bash
# In Railway dashboard:
# 1. Add Service → Database → PostgreSQL
# 2. Copy connection string
# 3. Update environment variables
```

## 📋 Environment Variables

### Backend (`greengotts-api`):
```bash
GREENGOTTS_DB_URL=postgresql://...
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-api.railway.app/api/auth/google/callback
NODE_ENV=production
PORT=8080
```

### Frontend (`greengotts-app`):
```bash
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXT_PUBLIC_APP_URL=https://your-frontend.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
```

## 🔄 Auto-Deploy

Both services will auto-deploy when you push to GitHub:
- Push to `main` branch
- Railway detects changes
- Automatically rebuilds and redeploys
- Updates live application

## 🎯 Success!

After deployment, you'll have:
- ✅ **Backend API**: `https://your-api.railway.app`
- ✅ **Frontend**: `https://your-frontend.railway.app`
- ✅ **Database**: Managed PostgreSQL
- ✅ **Auto-deploy**: Updates on every push

## 📞 Need Help?

If you're still getting errors:
1. Make sure you're deploying from the correct folder
2. Check that environment variables are set
3. Verify the build logs in Railway dashboard
4. Ensure the service is pointing to the right directory

## 🚀 Ready to Deploy!

Your Greengotts application is ready for Railway deployment. Just follow the steps above to get both services running! 🎉
