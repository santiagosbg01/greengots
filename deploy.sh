#!/bin/bash

# Greengotts Deployment Script
echo "🚀 Greengotts Deployment Helper"
echo "================================"
echo ""

# Generate JWT Secret
echo "🔐 Generating JWT Secret..."
JWT_SECRET=$(openssl rand -base64 32)
echo "Your JWT Secret: $JWT_SECRET"
echo ""

echo "📋 Railway Environment Variables to Set:"
echo "========================================"
echo ""
echo "For Backend API (greengotts-api):"
echo "GREENGOTTS_DB_URL=postgresql://postgres:password@host:port/railway"
echo "JWT_SECRET=$JWT_SECRET"
echo "NODE_ENV=production"
echo "PORT=8080"
echo ""
echo "For Frontend (greengotts-app):"
echo "NEXT_PUBLIC_API_URL=https://your-api.railway.app"
echo "NEXT_PUBLIC_APP_URL=https://your-frontend.railway.app"
echo ""

echo "🎯 Next Steps:"
echo "=============="
echo "1. Go to Railway dashboard"
echo "2. Create new project from GitHub: santiagosbg01/greengots"
echo "3. Set root directory to 'greengotts-api'"
echo "4. Add PostgreSQL database service"
echo "5. Set the environment variables above"
echo "6. Deploy backend"
echo "7. Add frontend service with root directory 'greengotts-app'"
echo "8. Set frontend environment variables"
echo "9. Deploy frontend"
echo ""

echo "✅ Your Greengotts app will be live after these steps!"
