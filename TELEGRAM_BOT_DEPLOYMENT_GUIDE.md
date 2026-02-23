# 🚀 Telegram Bot Deployment Guide

**How to deploy your bot so it runs 24/7 (even when your laptop is closed)**

---

## 📋 Deployment Options

### Option 1: Railway.app (Recommended - Easiest) ⭐
**Cost**: Free tier available  
**Difficulty**: Easy  
**Setup Time**: 10 minutes

### Option 2: Render.com (Good Alternative)
**Cost**: Free tier available  
**Difficulty**: Easy  
**Setup Time**: 10 minutes

### Option 3: DigitalOcean/AWS/VPS
**Cost**: $5-10/month  
**Difficulty**: Medium  
**Setup Time**: 30 minutes

### Option 4: Heroku
**Cost**: $5-7/month (no free tier anymore)  
**Difficulty**: Easy  
**Setup Time**: 15 minutes

---

## 🎯 Option 1: Railway.app (RECOMMENDED)

Railway is the easiest and has a generous free tier.

### Step 1: Prepare Your Code

1. **Create a Dockerfile** in `doa_adi/tg_analysis/`:

```dockerfile
FROM node:20-alpine

# Install Python and dependencies for video processing
RUN apk add --no-cache python3 py3-pip ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Copy .env from parent directory
COPY ../.env .env

# Expose port (not needed for bot, but good practice)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
```

2. **Create a `.dockerignore`** file in `doa_adi/tg_analysis/`:

```
node_modules
temp
*.log
.DS_Store
```

3. **Update package.json** to ensure it has the start script:

```json
{
  "scripts": {
    "start": "tsx bot.ts"
  }
}
```

### Step 2: Deploy to Railway

1. **Sign up**: Go to https://railway.app and sign up with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your repository

3. **Configure Service**:
   - Railway will auto-detect your Dockerfile
   - Set the root directory to `doa_adi/tg_analysis`

4. **Add Environment Variables**:
   - Go to "Variables" tab
   - Add all variables from your `.env` file:
     ```
     TELEGRAM_BOT_TOKEN=your-telegram-bot-token
     ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
     PINATA_JWT=your-pinata-jwt-token
     PINATA_API_KEY=your-pinata-api-key
     PINATA_API_SECRET=your-pinata-api-secret
     CREATE_PROPOSAL_PRIVATE_KEY=your-private-key-here
     DAO_CONTRACT_ADDRESS=0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB
     DAO_CHAIN_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
     DAO_CHAIN_ID=99999
     ZG_COMPUTE_RPC_URL=https://evmrpc-testnet.0g.ai
     ZG_COMPUTE_MODEL=qwen-2.5-7b-instruct
     ```

5. **Deploy**:
   - Click "Deploy"
   - Railway will build and deploy your bot
   - Check logs to ensure it's running

### Step 3: Verify Deployment

1. Send a message to @Paze2026Bot
2. Check Railway logs for activity
3. Test the full flow (video → analysis → proposal)

---

## 🎯 Option 2: Render.com

### Step 1: Prepare Your Code

Same Dockerfile as Railway (see above)

### Step 2: Deploy to Render

1. **Sign up**: Go to https://render.com and sign up

2. **Create New Web Service**:
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository

3. **Configure Service**:
   - Name: `paze-telegram-bot`
   - Environment: `Docker`
   - Region: Choose closest to you
   - Branch: `main`
   - Root Directory: `doa_adi/tg_analysis`

4. **Add Environment Variables**:
   - Same as Railway (see above)

5. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy

---

## 🎯 Option 3: DigitalOcean VPS (Most Control)

### Step 1: Create Droplet

1. **Sign up**: Go to https://digitalocean.com
2. **Create Droplet**:
   - Choose Ubuntu 22.04
   - Basic plan ($6/month)
   - Choose datacenter region
   - Add SSH key

### Step 2: Setup Server

SSH into your droplet:

```bash
ssh root@your_droplet_ip
```

Install dependencies:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Python and ffmpeg
apt install -y python3 python3-pip ffmpeg

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install -y git
```

### Step 3: Deploy Your Bot

```bash
# Clone your repository
git clone https://github.com/yourusername/your-repo.git
cd your-repo/doa_adi/tg_analysis

# Install dependencies
npm install

# Create .env file
nano .env
# Paste your environment variables, save and exit (Ctrl+X, Y, Enter)

# Start bot with PM2
pm2 start npm --name "paze-bot" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you
```

### Step 4: Manage Your Bot

```bash
# View logs
pm2 logs paze-bot

# Restart bot
pm2 restart paze-bot

# Stop bot
pm2 stop paze-bot

# Check status
pm2 status
```

---

## 🎯 Option 4: Quick VPS Setup Script

If you choose a VPS, here's a complete setup script:

```bash
#!/bin/bash

# Save this as setup.sh and run: bash setup.sh

echo "🚀 Setting up Paze Telegram Bot..."

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Python and ffmpeg
apt install -y python3 python3-pip ffmpeg git

# Install PM2
npm install -g pm2

# Clone repository (replace with your repo)
git clone https://github.com/yourusername/your-repo.git
cd your-repo/doa_adi/tg_analysis

# Install dependencies
npm install

echo "✅ Setup complete!"
echo "📝 Next steps:"
echo "1. Create .env file: nano .env"
echo "2. Start bot: pm2 start npm --name paze-bot -- start"
echo "3. Save PM2: pm2 save"
echo "4. Setup startup: pm2 startup"
```

---

## 📊 Comparison Table

| Platform | Cost | Ease | Free Tier | Best For |
|----------|------|------|-----------|----------|
| Railway | Free-$5 | ⭐⭐⭐⭐⭐ | Yes (500hrs) | Quick deployment |
| Render | Free-$7 | ⭐⭐⭐⭐⭐ | Yes (750hrs) | Alternative to Railway |
| DigitalOcean | $6/mo | ⭐⭐⭐ | No | Full control |
| AWS EC2 | $5-10/mo | ⭐⭐ | 12mo free | Enterprise |
| Heroku | $7/mo | ⭐⭐⭐⭐ | No | Legacy apps |

---

## 🔧 Dockerfile for All Platforms

Create `doa_adi/tg_analysis/Dockerfile`:

```dockerfile
FROM node:20-alpine

# Install Python, pip, and ffmpeg for video processing
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    build-base \
    python3-dev

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create temp directory for video processing
RUN mkdir -p temp/telegram-videos

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Start the bot
CMD ["npm", "start"]
```

---

## 🔐 Security Best Practices

### 1. Never Commit .env File

Add to `.gitignore`:
```
.env
*.env
.env.*
```

### 2. Use Environment Variables

All platforms support environment variables - use their UI to add them securely.

### 3. Rotate Keys Regularly

- Regenerate Telegram bot token periodically
- Rotate API keys every 3-6 months

### 4. Monitor Logs

Set up log monitoring to catch issues:
```bash
# Railway: Check dashboard logs
# Render: Check dashboard logs
# VPS: pm2 logs paze-bot
```

---

## 📈 Monitoring & Maintenance

### Railway/Render

- Check dashboard for uptime
- Set up email alerts
- Monitor resource usage

### VPS (DigitalOcean/AWS)

```bash
# Check bot status
pm2 status

# View logs
pm2 logs paze-bot --lines 100

# Monitor resources
htop

# Check disk space
df -h

# Update bot
cd /path/to/bot
git pull
npm install
pm2 restart paze-bot
```

---

## 🐛 Troubleshooting

### Bot Not Responding

1. **Check logs**:
   ```bash
   # Railway/Render: Check dashboard
   # VPS: pm2 logs paze-bot
   ```

2. **Verify environment variables**:
   - TELEGRAM_BOT_TOKEN is correct
   - All API keys are set

3. **Restart bot**:
   ```bash
   # Railway/Render: Redeploy
   # VPS: pm2 restart paze-bot
   ```

### Out of Memory

1. **Increase memory limit** (Railway/Render):
   - Upgrade to paid plan
   - Or optimize code

2. **VPS**: Upgrade droplet size

### Video Processing Fails

1. **Check ffmpeg is installed**:
   ```bash
   ffmpeg -version
   ```

2. **Check Python is available**:
   ```bash
   python3 --version
   ```

---

## 💰 Cost Estimates

### Free Tier (Railway/Render)
- **Cost**: $0/month
- **Limitations**: 500-750 hours/month
- **Good for**: Testing, demos, low traffic

### Paid Tier (Railway/Render)
- **Cost**: $5-7/month
- **Limitations**: None
- **Good for**: Production, moderate traffic

### VPS (DigitalOcean)
- **Cost**: $6/month (basic)
- **Limitations**: None
- **Good for**: Full control, high traffic

---

## 🎯 Recommended Setup for Hackathon

**For Demo/Hackathon**: Use Railway.app
- Free tier is enough
- Easy to deploy
- Good logs
- Can upgrade later

**For Production**: Use DigitalOcean VPS
- More reliable
- Full control
- Better performance
- Cost-effective

---

## 📝 Quick Start Checklist

- [ ] Choose deployment platform
- [ ] Create Dockerfile
- [ ] Push code to GitHub
- [ ] Sign up for platform
- [ ] Connect repository
- [ ] Add environment variables
- [ ] Deploy
- [ ] Test bot
- [ ] Monitor logs
- [ ] Set up alerts

---

## 🚀 Deploy Now!

### Railway (Fastest)
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Add environment variables
5. Deploy!

### Render
1. Go to https://render.com
2. Sign up
3. New Web Service
4. Connect GitHub
5. Add environment variables
6. Deploy!

---

## 📞 Support

If you run into issues:

1. Check platform documentation
2. Review logs carefully
3. Verify all environment variables
4. Test locally first
5. Check GitHub issues

---

**Last Updated**: February 22, 2026  
**Recommended**: Railway.app for quick deployment  
**Alternative**: DigitalOcean for production
