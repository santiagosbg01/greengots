# 🚀 Railway Deployment Guide for Greengotts

This guide will help you deploy both the frontend and backend to Railway.

## 📋 Prerequisites

- GitHub repository with your code
- Railway account (free at [railway.app](https://railway.app))
- Google OAuth credentials

## 🎯 Step 1: Deploy Backend API

### 1.1 Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `greengotts-api` folder

### 1.2 Configure Environment Variables
In Railway dashboard, go to your API service and add these variables:

```bash
# Database
GREENGOTTS_DB_URL=postgresql://username:password@host:port/database

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-api.railway.app/api/auth/google/callback

# App Configuration
NODE_ENV=production
PORT=8080
```

### 1.3 Deploy
Railway will automatically:
- Install dependencies
- Build the TypeScript code
- Start the server
- Provide a URL like `https://greengotts-api.railway.app`

## 🎯 Step 2: Deploy Frontend App

### 2.1 Create Second Railway Service
1. In your Railway project, click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose the same repository
4. Select the `greengotts-app` folder

### 2.2 Configure Environment Variables
Add these variables to your frontend service:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXT_PUBLIC_APP_URL=https://your-frontend.railway.app

# Google OAuth (if needed)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2.3 Deploy
Railway will automatically:
- Install dependencies
- Build the Next.js app
- Start the server
- Provide a URL like `https://greengotts-app.railway.app`

## 🎯 Step 3: Configure Database

### 3.1 Add PostgreSQL Service
1. In Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL database
4. Copy the connection string

### 3.2 Run Database Migrations
1. Go to your API service
2. Click "Deploy" → "Run Command"
3. Run: `npm run db:migrate`
4. Run: `npm run db:seed`

## 🎯 Step 4: Update Google OAuth

### 4.1 Update Google Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Update authorized redirect URIs:
   - `https://your-api.railway.app/api/auth/google/callback`
3. Update authorized JavaScript origins:
   - `https://your-frontend.railway.app`

## 🎯 Step 5: Test Deployment

### 5.1 Test API
```bash
curl https://your-api.railway.app/health
```

### 5.2 Test Frontend
1. Visit `https://your-frontend.railway.app`
2. Try logging in with Google
3. Check if you can access the dashboard

## 🎯 Step 6: Custom Domains (Optional)

### 6.1 Add Custom Domain
1. In Railway dashboard, go to your service
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### 6.2 Update Environment Variables
Update the URLs in your environment variables to use your custom domain.

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**: Check the build logs in Railway dashboard
2. **Database Connection**: Verify `GREENGOTTS_DB_URL` is correct
3. **OAuth Issues**: Check redirect URIs in Google Console
4. **CORS Errors**: Ensure API URL is correct in frontend

### Debug Commands:
```bash
# Check API health
curl https://your-api.railway.app/health

# Check frontend
curl https://your-frontend.railway.app

# Check database connection
# Go to Railway dashboard → Database → Connect
```

## 📊 Monitoring

### Railway Dashboard:
- View logs for both services
- Monitor resource usage
- Check deployment status
- Manage environment variables

### Health Checks:
- API: `https://your-api.railway.app/health`
- Frontend: `https://your-frontend.railway.app`

## 🚀 Success!

Your Greengotts application should now be running on Railway with:
- ✅ Backend API: `https://your-api.railway.app`
- ✅ Frontend: `https://your-frontend.railway.app`
- ✅ Database: Managed PostgreSQL
- ✅ Auto-deploy: Updates on every GitHub push

## 💰 Cost

Railway's free tier includes:
- $5/month in credits
- Enough for small applications
- Automatic scaling
- No hidden fees

## 🔄 Auto-Deploy

Every time you push to your main branch:
1. Railway detects the change
2. Automatically rebuilds and redeploys
3. Updates your live application
4. Sends notifications if deployment fails

## 📞 Support

If you need help:
1. Check Railway logs
2. Verify environment variables
3. Test API endpoints
4. Check Google OAuth configuration

Your Greengotts application is now live on Railway! 🎉
