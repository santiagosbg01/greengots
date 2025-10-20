#!/bin/bash

# Fast build script for Railway
echo "🚀 Starting fast build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --no-audit --no-fund --silent

# Build the application
echo "🔨 Building application..."
npm run build

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p /tmp/uploads

echo "✅ Build complete!"