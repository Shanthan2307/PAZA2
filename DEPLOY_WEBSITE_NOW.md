# 🚀 Deploy Website to Vercel - Step by Step

**Follow these exact steps to deploy your website**

---

## 📋 Before You Start

Make sure you have:
- ✅ GitHub account
- ✅ Code pushed to GitHub
- ✅ This guide open

---

## 🎯 Step-by-Step Instructions

### Step 1: Go to Vercel (1 minute)

1. Open your browser
2. Go to: **https://vercel.com**
3. Click **"Sign Up"** (top right)
4. Choose **"Continue with GitHub"**
5. Authorize Vercel to access your GitHub

---

### Step 2: Import Your Project (2 minutes)

1. On Vercel dashboard, click **"Add New..."** button
2. Select **"Project"**
3. You'll see "Import Git Repository"
4. Find your repository in the list
5. Click **"Import"** next to your repository

---

### Step 3: Configure Project (2 minutes)

You'll see a configuration screen. Fill in:

#### Framework Preset
- Should auto-detect as **"Next.js"** ✅
- If not, select "Next.js" from dropdown

#### Root Directory
- Click **"Edit"** next to Root Directory
- Enter: **`doa_adi/frontend`**
- Click **"Continue"**

#### Build Settings
- Build Command: `npm run build` (auto-filled) ✅
- Output Directory: `.next` (auto-filled) ✅
- Install Command: `npm install` (auto-filled) ✅

---

### Step 4: Add Environment Variables (3 minutes)

This is the MOST IMPORTANT step!

1. Scroll down to **"Environment Variables"** section
2. Click to expand it
3. Add these 3 variables ONE BY ONE:

#### Variable 1:
- **Name**: `NEXT_PUBLIC_CONTRACT_ADDRESS`
- **Value**: `0x21C986a1C0e8658D9C5efe4bFcd9A120e49bedaB`
- Click **"Add"**

#### Variable 2:
- **Name**: `NEXT_PUBLIC_DAO_CHAIN_RPC_URL`
- **Value**: `https://rpc.ab.testnet.adifoundation.ai/`
- Click **"Add"**

#### Variable 3:
- **Name**: `NEXT_PUBLIC_CHAIN_ID`
- **Value**: `99999`
- Click **"Add"**

**IMPORTANT**: Make sure you have exactly 3 variables added!

---

### Step 5: Deploy! (1 minute)

1. Double-check:
   - ✅ Root Directory: `doa_adi/frontend`
   - ✅ Framework: Next.js
   - ✅ 3 Environment Variables added

2. Click the big **"Deploy"** button

3. Wait for deployment (2-3 minutes)
   - You'll see a progress screen
   - Watch the build logs
   - Don't close the browser!

---

### Step 6: Get Your URL (30 seconds)

1. When deployment completes, you'll see: **"Congratulations!"** 🎉

2. You'll see your website URL, something like:
   - `https://your-project-name.vercel.app`
   - or `https://your-project-name-username.vercel.app`

3. Click **"Visit"** to open your website

4. **COPY THIS URL** - you'll need it!

---

## ✅ Verify It Works

### Check 1: Landing Page
1. Website should load
2. You should see "PAZE" branding
3. No errors in browser console

### Check 2: Proposals Tab
1. Click **"Voting (DAO)"** tab
2. You should see proposals (if any exist)
3. Vote counts should show

### Check 3: Wallet Connection (Optional)
1. Click **"Connect Wallet"**
2. MetaMask should pop up
3. You can connect (but don't need to for now)

---

## 🎉 Success!

If you can see your website and the Voting tab loads, **YOU'RE DONE!**

Your website is now:
- ✅ Live on the internet
- ✅ Accessible to anyone
- ✅ Reading from blockchain
- ✅ Showing proposals automatically

---

## 📝 Save These Details

Write down:

**Website URL**: `https://_________________.vercel.app`

**Deployment Date**: _______________

**Status**: ✅ DEPLOYED

---

## 🔄 What Happens Next?

### Automatic Updates
- Every time you push to GitHub, Vercel auto-deploys
- No manual deployment needed!

### Proposals Appear Automatically
- When bot creates proposal on blockchain
- Website reads it automatically
- No manual refresh needed!

---

## 🐛 If Something Goes Wrong

### Build Fails

**Error**: "Cannot find module"
- **Fix**: Check that root directory is `doa_adi/frontend`
- **Fix**: Redeploy

**Error**: "Environment variable not set"
- **Fix**: Go to Project Settings → Environment Variables
- **Fix**: Add the 3 variables again
- **Fix**: Redeploy

### Website Loads But No Proposals

**This is normal if:**
- No proposals have been created yet
- Bot hasn't been deployed yet

**To fix:**
- Deploy the bot next
- Create a proposal via Telegram
- Proposals will appear automatically

### Can't Connect Wallet

**Fix**: Add ADI Testnet to MetaMask:
- Network Name: ADI Testnet
- RPC URL: https://rpc.ab.testnet.adifoundation.ai/
- Chain ID: 99999
- Currency: ADI

---

## 📱 Share Your Website

After deployment, you can share:

```
🌐 PAZE DAO - Community Infrastructure Reporting

Website: https://your-site.vercel.app
Telegram Bot: @Paze2026Bot

Report issues via Telegram, vote on website!
Powered by 0G Compute Network ⚡
```

---

## 🎯 Next Steps

After website is deployed:

1. ✅ Website deployed
2. ⏭️ Deploy Telegram bot (next)
3. ⏭️ Test complete flow
4. ⏭️ Share with community

---

## 💡 Pro Tips

### Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS instructions

### Analytics (Optional)
1. Go to Project Settings → Analytics
2. Enable Vercel Analytics
3. Track visitors and performance

### Preview Deployments
- Every branch gets a preview URL
- Test changes before merging
- Share preview links with team

---

## 📞 Need Help?

**Vercel Docs**: https://vercel.com/docs  
**Vercel Support**: https://vercel.com/support  
**Community**: https://github.com/vercel/vercel/discussions  

---

## ✅ Deployment Checklist

Before clicking Deploy, verify:

- [ ] Root Directory: `doa_adi/frontend`
- [ ] Framework: Next.js
- [ ] Environment Variable 1: NEXT_PUBLIC_CONTRACT_ADDRESS
- [ ] Environment Variable 2: NEXT_PUBLIC_DAO_CHAIN_RPC_URL
- [ ] Environment Variable 3: NEXT_PUBLIC_CHAIN_ID
- [ ] All 3 variables have correct values

---

**Ready? Let's deploy!** 🚀

Go to: **https://vercel.com**

---

**Last Updated**: February 23, 2026  
**Estimated Time**: 5-10 minutes  
**Difficulty**: Easy  
**Cost**: FREE
