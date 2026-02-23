#!/bin/bash

# PAZE DAO Website Deployment Script
# Deploys to Vercel in one command

echo "🚀 PAZE DAO Website Deployment"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
  echo "❌ Error: Please run this script from the doa_adi directory"
  exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "📦 Vercel CLI not found. Installing..."
  npm install -g vercel
  echo "✅ Vercel CLI installed"
  echo ""
fi

# Navigate to frontend directory
cd frontend

echo "📁 Current directory: $(pwd)"
echo ""

# Check if user is logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
  echo "Please login to Vercel:"
  vercel login
  echo ""
fi

# Deploy to production
echo "🚀 Deploying to Vercel..."
echo ""
vercel --prod

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo ""
echo "📱 Your website is now live!"
echo ""
echo "Next steps:"
echo "1. Visit your Vercel URL"
echo "2. Test the Voting (DAO) tab"
echo "3. Send a video to @Paze2026Bot"
echo "4. Watch the proposal appear on your website!"
echo ""
echo "🎉 Happy deploying!"
