# 🚀 Greengotts Deployment Checklist

## 📋 **Step 1: Deploy Backend API to Railway**

### **1.1 Create Railway Project**
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `santiagosbg01/greengots`
5. Set **Root Directory** to `greengotts-api`

### **1.2 Add PostgreSQL Database**
1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL database
4. **Copy the connection string** (looks like: `postgresql://postgres:password@host:port/railway`)

### **1.3 Set Environment Variables**
Go to your API service → "Variables" tab and add:

```bash
# Database (use the connection string from step 1.2)
GREENGOTTS_DB_URL=postgresql://postgres:password@host:port/railway

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# App Configuration
NODE_ENV=production
PORT=8080
```

### **1.4 Generate JWT Secret**
Run this command to generate a secure JWT secret:
```bash
openssl rand -base64 32
```
Copy the output and use it as your `JWT_SECRET` value.

### **1.5 Deploy Backend**
1. Click "Deploy" in Railway
2. Wait for build to complete (should be ~2-3 minutes)
3. Check logs for any errors
4. Test the health endpoint: `https://your-api.railway.app/health`

---

## 📋 **Step 2: Deploy Frontend to Railway**

### **2.1 Add Frontend Service**
1. In your Railway project, click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose the same repository: `santiagosbg01/greengots`
4. Set **Root Directory** to `greengotts-app`

### **2.2 Set Frontend Environment Variables**
Go to your frontend service → "Variables" tab and add:

```bash
# API Configuration (use your backend URL from step 1.5)
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXT_PUBLIC_APP_URL=https://your-frontend.railway.app
```

### **2.3 Deploy Frontend**
1. Click "Deploy" in Railway
2. Wait for build to complete (should be ~2-3 minutes)
3. Check logs for any errors
4. Test the frontend: `https://your-frontend.railway.app`

---

## 📋 **Step 3: Test the Full Application**

### **3.1 Test Backend API**
```bash
# Health check
curl https://your-api.railway.app/health

# Should return: {"status":"healthy","timestamp":"..."}
```

### **3.2 Test Frontend**
1. Visit `https://your-frontend.railway.app`
2. Click "Login" or "Sign Up"
3. Try registering a new account
4. Try logging in with the account

### **3.3 Test Authentication Flow**
1. **Register:** Create a new account with email/password
2. **Login:** Sign in with the account
3. **Dashboard:** Should redirect to dashboard after login
4. **Logout:** Test logout functionality

---

## 🔧 **Troubleshooting**

### **Backend Issues:**
- **Build fails:** Check Railway logs for TypeScript errors
- **Database connection:** Verify `GREENGOTTS_DB_URL` is correct
- **JWT errors:** Check `JWT_SECRET` is set correctly

### **Frontend Issues:**
- **API connection:** Verify `NEXT_PUBLIC_API_URL` points to your backend
- **CORS errors:** Check backend CORS configuration
- **Build fails:** Check Railway logs for build errors

### **Database Issues:**
- **Connection refused:** Check PostgreSQL service is running
- **Migration errors:** Run database migrations manually if needed

---

## 📊 **Expected URLs After Deployment**

- **Backend API:** `https://your-api.railway.app`
- **Frontend:** `https://your-frontend.railway.app`
- **Health Check:** `https://your-api.railway.app/health`
- **Database:** Managed by Railway (no direct access needed)

---

## 🎯 **Success Criteria**

✅ **Backend deploys successfully**  
✅ **Frontend deploys successfully**  
✅ **Health check returns 200**  
✅ **User can register account**  
✅ **User can login**  
✅ **User can access dashboard**  

---

## 🚀 **Next Steps After Deployment**

1. **Set up custom domains** (optional)
2. **Configure SSL certificates** (automatic with Railway)
3. **Set up monitoring** (Railway provides basic monitoring)
4. **Add more features** (budgets, teams, etc.)

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check Railway logs for error messages
2. Verify all environment variables are set
3. Test each service individually
4. Check the health endpoints

Your Greengotts application should be fully functional after completing these steps! 🎉
