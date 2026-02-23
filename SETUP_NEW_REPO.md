# 🔄 Setup New Git Repository

**Push your code to: https://github.com/Shanthan2307/PAZA2.git**

---

## 📋 Prerequisites

Before starting:
- ✅ GitHub repository created: https://github.com/Shanthan2307/PAZA2.git
- ✅ Git installed on your machine
- ✅ GitHub account logged in

---

## 🚀 Quick Setup (Automated)

Run this script to set everything up automatically:

```bash
cd doa_adi
bash setup-git-repo.sh
```

---

## 📝 Manual Setup (Step by Step)

If you prefer to do it manually, follow these steps:

### Step 1: Check Current Git Status

```bash
cd doa_adi
git status
```

### Step 2: Initialize Git (if needed)

```bash
# If not already a git repo
git init
```

### Step 3: Add Remote Repository

```bash
# Remove old remote if exists
git remote remove origin 2>/dev/null || true

# Add new remote
git remote add origin https://github.com/Shanthan2307/PAZA2.git
```

### Step 4: Create .gitignore

Make sure you have a proper .gitignore:

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Temp files
temp/
*.log

# IDE
.vscode/
.idea/

# Python
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
ENV/

# Database
*.sqlite
*.db

# OS
.DS_Store
Thumbs.db
EOF
```

### Step 5: Stage All Files

```bash
git add .
```

### Step 6: Commit

```bash
git commit -m "Initial commit: PAZE DAO with 0G Compute integration"
```

### Step 7: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

---

## ✅ Verify Upload

After pushing, verify:

1. Go to: https://github.com/Shanthan2307/PAZA2
2. You should see all your files
3. Check that .env is NOT uploaded (it should be in .gitignore)

---

## 🔐 Important: Environment Variables

**CRITICAL**: Your .env file should NOT be in the repository!

### What's Safe in Git:
- ✅ All code files
- ✅ Configuration files (Dockerfile, vercel.json, etc.)
- ✅ Documentation files
- ✅ .env.example (template without real values)

### What Should NOT be in Git:
- ❌ .env (contains secrets)
- ❌ node_modules/
- ❌ temp/ directories
- ❌ .next/ build files

---

## 📦 What Gets Pushed

Your repository will include:

```
PAZA2/
├── frontend/              # Next.js website
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   ├── vercel.json       # Vercel config
│   └── .env.production   # Public env vars only
├── tg_analysis/          # Telegram bot
│   ├── bot.ts
│   ├── analyze-photo.ts
│   ├── providers/
│   ├── package.json
│   ├── Dockerfile        # Railway config
│   └── .dockerignore
├── contracts/            # Smart contracts
├── scripts/              # Deployment scripts
├── .gitignore           # Git exclusions
├── .env.example         # Template (no secrets)
└── README.md            # Documentation
```

---

## 🎯 After Pushing to GitHub

### Deploy Website (Vercel)

1. Go to https://vercel.com
2. Import from GitHub
3. Select: `Shanthan2307/PAZA2`
4. Root Directory: `frontend`
5. Add 3 environment variables
6. Deploy!

### Deploy Bot (Railway)

1. Go to https://railway.app
2. Import from GitHub
3. Select: `Shanthan2307/PAZA2`
4. Root Directory: `tg_analysis`
5. Add 13 environment variables
6. Deploy!

---

## 🔄 Future Updates

When you make changes:

```bash
cd doa_adi
git add .
git commit -m "Description of changes"
git push origin main
```

Both Vercel and Railway will auto-deploy!

---

## 🐛 Troubleshooting

### Error: "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/Shanthan2307/PAZA2.git
```

### Error: "failed to push"

```bash
# Force push (only if you're sure)
git push -u origin main --force
```

### Error: ".env file uploaded"

```bash
# Remove from git
git rm --cached .env
git commit -m "Remove .env from git"
git push origin main
```

---

## ✅ Checklist

Before pushing:

- [ ] .gitignore file exists
- [ ] .env is in .gitignore
- [ ] No secrets in code
- [ ] All files staged
- [ ] Commit message written
- [ ] Remote URL correct

After pushing:

- [ ] Files visible on GitHub
- [ ] .env NOT visible on GitHub
- [ ] README.md displays correctly
- [ ] Ready to deploy

---

**Repository**: https://github.com/Shanthan2307/PAZA2.git  
**Status**: Ready to push  
**Next**: Deploy to Vercel and Railway
