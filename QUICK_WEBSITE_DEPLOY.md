# ⚡ Quick Website Deploy - 5 Minutes

**Deploy your PAZE DAO website to Vercel in 5 minutes**

---

## 🚀 Step-by-Step

### 1. Push to GitHub (1 minute)

```bash
cd doa_adi
git add .
git commit -m "Add website deployment files"
git push origin main
```

### 2. Deploy to Vercel (4 minutes)

1. **Go to Vercel**: https://vercel.com

2. **Sign up** with GitHub (if you haven't already)

3. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

4. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected ✅)
   - Root Directory: **`doa_adi/frontend`** ← IMPORTANT!
   - Build Command: `npm run build` (auto-detected ✅)
   - Output Directory: `.next` (auto-detected ✅)

5. **Environment Variables** (click "Environment Variables"):
   
   Add these 3 variables:
   
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS
   0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB
   
   NEXT_PUBLIC_DAO_CHAIN_RPC_URL
   https://rpc.ab.testnet.adifoundation.ai/
   
   NEXT_PUBLIC_CHAIN_ID
   99999
   ```

6. **Click "Deploy"** 🚀

7. **Wait 2-3 minutes** for build to complete

8. **Done!** You'll get a URL like: `https://paze-dao.vercel.app`

---

## ✅ Verify It Works

1. **Open your Vercel URL**
2. **Check landing page** loads
3. **Click "Voting (DAO)" tab**
4. **See proposals** from Telegram bot
5. **Test wallet connection** (optional)

---

## 🎯 What Happens Now?

### Automatic Updates
- Every time you push to GitHub, Vercel auto-deploys
- No manual deployment needed!

### Proposals Appear Automatically
1. Someone sends video to @Paze2026Bot
2. Bot creates proposal on blockchain
3. **Website shows it automatically!** ✨
4. Anyone can visit your URL and see it

### How It Works
- Website reads directly from blockchain
- No backend server needed
- Proposals stored on ADI Testnet
- IPFS stores images and analysis
- 100% decentralized!

---

## 📱 Share Your Website

After deployment, share:

```
🌐 PAZE DAO - Community Infrastructure Reporting

Website: https://your-site.vercel.app
Telegram Bot: @Paze2026Bot

How it works:
1. Report issues via Telegram
2. AI analyzes with 0G Compute
3. Proposal created on blockchain
4. Community votes on website
5. Approved proposals executed

Powered by 0G Compute Network ⚡
```

---

## 🔄 Update Your Website

When you make changes:

```bash
git add .
git commit -m "Update website"
git push origin main
```

Vercel automatically redeploys! 🎉

---

## 🎨 Custom Domain (Optional)

Want your own domain like `paze.dao`?

1. Go to Vercel dashboard
2. Select your project
3. Click "Settings" → "Domains"
4. Add your domain
5. Follow DNS instructions

---

## 💡 Pro Tips

### Preview Deployments
- Every branch gets its own preview URL
- Test changes before merging to main
- Share preview links with team

### Performance
- Vercel uses global CDN
- Your site loads fast worldwide
- Automatic HTTPS
- Optimized images

### Monitoring
- Check Vercel dashboard for:
  - Deployment status
  - Build logs
  - Analytics (optional)
  - Error tracking

---

## 🐛 Troubleshooting

### Build Fails

**Error**: "Cannot find module"
```bash
# Solution: Check package.json has all dependencies
cd frontend
npm install
```

**Error**: "Environment variable not set"
```bash
# Solution: Add variables in Vercel dashboard
# Settings → Environment Variables
```

### Proposals Not Showing

1. **Check contract address** in Vercel env vars
2. **Should be**: `0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB`
3. **Redeploy** if you changed it

### Website Shows Old Version

1. **Check deployment** in Vercel dashboard
2. **Force redeploy**: Settings → Deployments → Redeploy
3. **Clear browser cache**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## 📊 What You Get (Free Tier)

✅ Unlimited websites  
✅ 100GB bandwidth/month  
✅ Automatic HTTPS  
✅ Global CDN  
✅ Auto-deploy from GitHub  
✅ Preview deployments  
✅ Custom domains  
✅ Analytics (optional)  

**Perfect for your hackathon project!**

---

## 🎯 Alternative: Vercel CLI

Prefer command line?

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd doa_adi/frontend

# Login
vercel login

# Deploy
vercel --prod

# Done! 🎉
```

---

## 📞 Need Help?

**Vercel Docs**: https://vercel.com/docs  
**Vercel Support**: https://vercel.com/support  
**Community**: https://github.com/vercel/vercel/discussions  

---

## 🎉 You're Live!

Your website is now accessible to everyone!

**Next Steps:**
1. ✅ Test the full flow (Telegram → Website)
2. ✅ Share your URL with the community
3. ✅ Monitor proposals in Vercel dashboard
4. ✅ Prepare for hackathon demo

---

**Deployment Time**: ~5 minutes  
**Cost**: $0 (Free tier)  
**Uptime**: 99.99%  
**Global**: Yes (CDN)  
**Auto-deploy**: Yes  

**Your website is ready! 🚀**
