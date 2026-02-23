# 🌐 Website Deployment Guide

**Deploy your PAZE DAO website so everyone can see proposals from the Telegram bot**

---

## 🎯 How It Works

Your website reads proposals **directly from the blockchain**, so:
- ✅ No backend needed
- ✅ Proposals appear automatically when created via Telegram bot
- ✅ Anyone can view and vote on proposals
- ✅ All data is decentralized (blockchain + IPFS)

---

## 📋 Deployment Options

### Option 1: Vercel (Recommended - Easiest) ⭐
**Cost**: Free  
**Difficulty**: Easy  
**Setup Time**: 5 minutes  
**Best For**: Next.js apps (your app!)

### Option 2: Netlify
**Cost**: Free  
**Difficulty**: Easy  
**Setup Time**: 5 minutes  
**Best For**: Static sites

### Option 3: Railway.app
**Cost**: Free tier  
**Difficulty**: Easy  
**Setup Time**: 5 minutes  
**Best For**: Full-stack apps

### Option 4: Cloudflare Pages
**Cost**: Free  
**Difficulty**: Easy  
**Setup Time**: 5 minutes  
**Best For**: Fast global CDN

---

## 🚀 Option 1: Vercel (RECOMMENDED)

Vercel is made by the creators of Next.js, so it's perfect for your app.

### Step 1: Prepare Your Code

1. **Update environment variables** in `frontend/.env.local`:

```env
# Public variables (safe to expose)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB
NEXT_PUBLIC_DAO_CHAIN_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
NEXT_PUBLIC_CHAIN_ID=99999
```

2. **Update contract.ts** to use public env vars:

```typescript
// frontend/lib/contract.ts
export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 
  '0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB'
) as `0x${string}`;
```

3. **Create vercel.json** in `frontend/` directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Easiest)

1. **Push to GitHub**:
   ```bash
   cd doa_adi
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel**: https://vercel.com

3. **Sign up** with GitHub

4. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Vercel auto-detects Next.js

5. **Configure Project**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `doa_adi/frontend`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

6. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB
   NEXT_PUBLIC_DAO_CHAIN_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
   NEXT_PUBLIC_CHAIN_ID=99999
   ```

7. **Deploy**: Click "Deploy"

8. **Get Your URL**: Vercel gives you a URL like `https://paze-dao.vercel.app`

#### Option B: Using Vercel CLI (Faster)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd doa_adi/frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? paze-dao
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Step 3: Configure Custom Domain (Optional)

1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your custom domain
5. Follow DNS instructions

---

## 🚀 Option 2: Netlify

### Step 1: Prepare Your Code

1. **Create netlify.toml** in `frontend/` directory:

```toml
[build]
  command = "npm run build"
  publish = ".next"
  base = "doa_adi/frontend"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 2: Deploy to Netlify

1. **Go to Netlify**: https://netlify.com

2. **Sign up** with GitHub

3. **New Site from Git**:
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub
   - Select your repository

4. **Configure Build**:
   - Base directory: `doa_adi/frontend`
   - Build command: `npm run build`
   - Publish directory: `.next`

5. **Add Environment Variables**:
   - Go to "Site settings" → "Environment variables"
   - Add the same variables as Vercel

6. **Deploy**: Click "Deploy site"

---

## 🚀 Option 3: Railway.app

### Step 1: Create Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
```

### Step 2: Deploy to Railway

1. **Go to Railway**: https://railway.app

2. **New Project** → "Deploy from GitHub repo"

3. **Configure**:
   - Root Directory: `doa_adi/frontend`
   - Build: Auto-detected from Dockerfile

4. **Add Environment Variables**: Same as Vercel

5. **Deploy**: Railway will build and deploy

---

## 🚀 Quick Deploy Script

Save this as `deploy-website.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying PAZE DAO Website..."

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
  echo "❌ Error: Run this from doa_adi directory"
  exit 1
fi

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
  echo "📦 Installing Vercel CLI..."
  npm install -g vercel
fi

# Navigate to frontend
cd frontend

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📱 Your website is now live!"
```

Run it:
```bash
chmod +x deploy-website.sh
./deploy-website.sh
```

---

## 🔧 Update Environment Variables

### For Production Deployment

Update `frontend/.env.production`:

```env
# Blockchain Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB
NEXT_PUBLIC_DAO_CHAIN_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
NEXT_PUBLIC_CHAIN_ID=99999

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Important Notes

- ✅ Only use `NEXT_PUBLIC_` prefix for variables that should be exposed to the browser
- ❌ Never expose private keys or API secrets in frontend
- ✅ Contract address and RPC URL are safe to expose (they're public anyway)

---

## 📊 Comparison Table

| Platform | Cost | Speed | CDN | Auto-Deploy | Best For |
|----------|------|-------|-----|-------------|----------|
| Vercel | Free | ⚡⚡⚡⚡⚡ | ✅ | ✅ | Next.js apps |
| Netlify | Free | ⚡⚡⚡⚡ | ✅ | ✅ | Static sites |
| Railway | Free tier | ⚡⚡⚡ | ❌ | ✅ | Full-stack |
| Cloudflare | Free | ⚡⚡⚡⚡⚡ | ✅ | ✅ | Global CDN |

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Website loads at your URL
- [ ] Landing page displays correctly
- [ ] "Voting (DAO)" tab shows proposals
- [ ] Proposals from Telegram bot appear
- [ ] Vote counts are accurate
- [ ] Wallet connection works (MetaMask)
- [ ] Mobile responsive design works

---

## 🔄 How Proposals Appear Automatically

### The Flow:

1. **User sends video to Telegram bot** (@Paze2026Bot)
2. **Bot analyzes and creates proposal** on blockchain
3. **Proposal is stored on-chain** at contract `0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB`
4. **Website reads from blockchain** automatically
5. **Everyone sees the proposal** on your deployed website!

### No Backend Needed!

Your website is a **pure frontend app** that:
- Reads directly from blockchain (ADI Testnet)
- Connects to user's wallet (MetaMask)
- Displays proposals in real-time
- Allows voting through smart contract

---

## 🌍 Share Your Website

After deployment, share your URL:

```
🌐 PAZE DAO Website
https://paze-dao.vercel.app

📱 Telegram Bot
@Paze2026Bot

🎯 How it works:
1. Report issues via Telegram bot
2. AI analyzes with 0G Compute
3. Proposal created on blockchain
4. Community votes on website
5. Approved proposals get executed
```

---

## 🔄 Update Your Website

When you make changes:

```bash
# Make your changes
git add .
git commit -m "Update website"
git push origin main

# Vercel/Netlify will auto-deploy!
```

Or manually:
```bash
cd doa_adi/frontend
vercel --prod
```

---

## 🐛 Troubleshooting

### Proposals Not Showing

1. **Check contract address**:
   ```typescript
   // Should be: 0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB
   console.log(CONTRACT_ADDRESS);
   ```

2. **Check RPC connection**:
   ```typescript
   // Should connect to ADI Testnet
   console.log(process.env.NEXT_PUBLIC_DAO_CHAIN_RPC_URL);
   ```

3. **Check browser console** for errors

### Build Fails

1. **Check Node version**: Should be 18 or 20
2. **Clear cache**: `rm -rf .next node_modules && npm install`
3. **Check environment variables** are set correctly

### Wallet Won't Connect

1. **Check MetaMask** is installed
2. **Add ADI Testnet** to MetaMask:
   - Network Name: ADI Testnet
   - RPC URL: https://rpc.ab.testnet.adifoundation.ai/
   - Chain ID: 99999
   - Currency: ADI

---

## 💰 Cost Breakdown

### Vercel (Recommended)
- **Free Tier**: 
  - 100GB bandwidth/month
  - Unlimited websites
  - Automatic HTTPS
  - Global CDN
  - Perfect for your use case!

- **Pro Tier** ($20/month):
  - 1TB bandwidth
  - Advanced analytics
  - Only needed for high traffic

### Netlify
- **Free Tier**:
  - 100GB bandwidth/month
  - 300 build minutes/month
  - Similar to Vercel

### Railway
- **Free Tier**:
  - $5 credit/month
  - Good for testing

---

## 🎯 Recommended Setup

**For Hackathon/Demo**:
- Use Vercel free tier
- Deploy from GitHub
- Use auto-deploy on push
- Share the Vercel URL

**For Production**:
- Use Vercel with custom domain
- Set up analytics
- Enable preview deployments
- Monitor performance

---

## 📱 Mobile Optimization

Your website is already mobile-responsive! Test on:
- iPhone Safari
- Android Chrome
- iPad
- Desktop browsers

---

## 🔐 Security Notes

### Safe to Expose:
- ✅ Contract address (it's public on blockchain)
- ✅ RPC URL (it's a public endpoint)
- ✅ Chain ID (it's public information)

### Never Expose:
- ❌ Private keys
- ❌ API secrets (Anthropic, Pinata)
- ❌ Telegram bot token

---

## 📊 Analytics (Optional)

Add analytics to track usage:

### Vercel Analytics
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🎉 You're Done!

Your website is now live and accessible to everyone!

**What happens now:**
1. ✅ Anyone can visit your website
2. ✅ They see all proposals from Telegram bot
3. ✅ They can connect wallet and vote
4. ✅ New proposals appear automatically
5. ✅ Everything is decentralized and transparent

---

## 📞 Support

**Vercel Docs**: https://vercel.com/docs  
**Netlify Docs**: https://docs.netlify.com  
**Railway Docs**: https://docs.railway.app  

---

**Last Updated**: February 22, 2026  
**Recommended**: Vercel for easiest deployment  
**Your Contract**: 0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB
