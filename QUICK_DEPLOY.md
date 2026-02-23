# ⚡ Quick Deploy Guide - 5 Minutes

**Deploy your Telegram bot to Railway.app in 5 minutes**

---

## 🚀 Step-by-Step (Railway.app)

### 1. Push to GitHub (2 minutes)

```bash
cd doa_adi
git add .
git commit -m "Add Telegram bot deployment files"
git push origin main
```

### 2. Deploy to Railway (3 minutes)

1. **Go to Railway**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → "Deploy from GitHub repo"
4. **Select** your repository
5. **Configure**:
   - Root Directory: `doa_adi/tg_analysis`
   - Build Command: (auto-detected from Dockerfile)
   - Start Command: `npm start`

6. **Add Environment Variables** (click "Variables" tab):

```env
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
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

7. **Deploy** - Click "Deploy" button

8. **Check Logs** - Watch deployment logs

9. **Test** - Send message to @Paze2026Bot

---

## ✅ Verification

1. Open Telegram
2. Search for @Paze2026Bot
3. Send `/start`
4. Should see welcome message with 0G branding
5. Send a test video
6. Bot should respond!

---

## 📊 Railway Dashboard

After deployment, you can:

- **View Logs**: See bot activity in real-time
- **Monitor Usage**: Check CPU, memory, network
- **Restart**: Redeploy if needed
- **Scale**: Upgrade if you need more resources

---

## 💰 Cost

**Free Tier**:
- 500 hours/month free
- $5 credit/month
- Perfect for demos and testing

**Paid Tier** (if needed):
- $5/month for hobby plan
- Unlimited hours
- Better performance

---

## 🔄 Update Your Bot

When you make changes:

```bash
git add .
git commit -m "Update bot"
git push origin main
```

Railway will automatically redeploy!

---

## 🐛 Troubleshooting

### Bot Not Starting

1. Check Railway logs
2. Verify all environment variables are set
3. Check Dockerfile is in `doa_adi/tg_analysis/`

### Bot Crashes

1. Check logs for errors
2. Verify Python and ffmpeg are installed (they are in Dockerfile)
3. Check memory usage

### Can't Connect to Bot

1. Verify TELEGRAM_BOT_TOKEN is correct
2. Check bot is running in Railway dashboard
3. Try redeploying

---

## 📱 Alternative: Render.com

If Railway doesn't work, try Render:

1. Go to https://render.com
2. Sign up
3. New → Web Service
4. Connect GitHub
5. Same environment variables
6. Deploy!

---

## 🎯 That's It!

Your bot is now running 24/7 in the cloud!

**Bot**: @Paze2026Bot  
**Platform**: Railway.app  
**Status**: ✅ Deployed  
**Uptime**: 24/7  

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Check `TELEGRAM_BOT_DEPLOYMENT_GUIDE.md` for detailed options
