# 🔧 TARS DAO Setup Guide

Complete step-by-step setup instructions for deploying TARS DAO on ADI Testnet.

## ⚡ Quick Setup (5 minutes)

```bash
# 1. Install dependencies
cd doa_adi && npm install
cd frontend && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env with your details

# 3. Compile and test
npm run compile
npm run test

# 4. Deploy
npm run deploy

# 5. Start frontend
npm run dev
```

## 📋 Detailed Setup

### Step 1: Prerequisites

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] MetaMask wallet configured
- [ ] ADI testnet added to MetaMask
- [ ] At least 0.5 ADI testnet tokens (for deployment + testing)

### Step 2: Get ADI Testnet Tokens

1. Visit ADI testnet faucet: `https://faucet-testnet.adi.network`
2. Enter your wallet address
3. Request tokens
4. Wait for confirmation

### Step 3: Add ADI Testnet to MetaMask

1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Enter details:
   - **Network Name**: ADI Testnet
   - **RPC URL**: `https://rpc-testnet.adi.network`
   - **Chain ID**: [UPDATE_WITH_ACTUAL_CHAIN_ID]
   - **Currency Symbol**: ADI
   - **Block Explorer**: `https://explorer-testnet.adi.network`

### Step 4: Configure Project

#### 4.1 Root Configuration

Create `.env` file:

```bash
PRIVATE_KEY=your_wallet_private_key_here
ADI_TESTNET_RPC=https://rpc-testnet.adi.network
CHAIN_ID=actual_chain_id_here
```

⚠️ **Never commit `.env` to git!**

#### 4.2 Update Hardhat Config

Edit `hardhat.config.ts`:

```typescript
networks: {
  adiTestnet: {
    url: process.env.ADI_TESTNET_RPC || "https://rpc-testnet.adi.network",
    chainId: parseInt(process.env.CHAIN_ID || "ACTUAL_CHAIN_ID"),
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  },
}
```

#### 4.3 Update Frontend Config

Edit `frontend/app/providers.tsx`:

```typescript
export const adiTestnet = defineChain({
  id: ACTUAL_CHAIN_ID, // Replace with actual chain ID
  name: 'ADI Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ADI',
    symbol: 'ADI',
  },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.adi.network'] },
  },
  blockExplorers: {
    default: { name: 'ADI Explorer', url: 'https://explorer-testnet.adi.network' },
  },
  testnet: true,
});
```

Get WalletConnect Project ID:
1. Visit https://cloud.walletconnect.com
2. Create account
3. Create new project
4. Copy Project ID
5. Update line 25 in `providers.tsx`

### Step 5: Install Dependencies

```bash
# Root dependencies (Hardhat, TypeScript, etc.)
npm install

# Frontend dependencies (Next.js, React, Wagmi, etc.)
cd frontend
npm install
cd ..
```

### Step 6: Compile Smart Contracts

```bash
npm run compile
```

This will:
- Compile Solidity contracts
- Generate TypeScript types in `typechain-types/`
- Create artifacts in `artifacts/`

### Step 7: Run Tests

```bash
npm run test
```

Expected output:
```
  TarsDAO
    Deployment
      ✓ Should set the right owner
      ✓ Should mint initial supply to contract
    Join as Verifier
      ✓ Should allow joining with sufficient stake
      ✓ Should fail with insufficient stake
      ✓ Should transfer TARS tokens to verifier
    ...
```

### Step 8: Deploy to ADI Testnet

```bash
npm run deploy
```

Expected output:
```
🚀 Deploying TarsDAO to ADI Testnet...

Deploying with account: 0x...
Account balance: 0.5 ADI

Deploying contract...

✅ TarsDAO deployed successfully!
📍 Contract address: 0x...

📝 Update your configuration:
   .env: NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   frontend/lib/contract.ts: CONTRACT_ADDRESS
```

### Step 9: Update Contract Address

1. Copy the deployed contract address
2. Update `frontend/lib/contract.ts`:

```typescript
export const CONTRACT_ADDRESS = '0xYOUR_DEPLOYED_ADDRESS' as `0x${string}`;
```

3. Update `.env`:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
```

### Step 10: Test Frontend Locally

```bash
npm run dev
```

Visit http://localhost:3000

Test checklist:
- [ ] Wallet connects successfully
- [ ] Can join as Verifier (with 0.1 ADI)
- [ ] Can join as Agent
- [ ] Can create a cause
- [ ] Can verify a cause
- [ ] Can vote on a cause

### Step 11: Deploy Frontend (Optional)

#### Deploy to Vercel

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Follow prompts and add environment variables in Vercel dashboard.

#### Deploy to Netlify

```bash
cd frontend
npm run build

# Upload 'out' folder to Netlify
```

## 🔍 Verification

### Verify Contract on Block Explorer

```bash
npx hardhat verify --network adiTestnet YOUR_CONTRACT_ADDRESS
```

## 🎯 Testing the DAO

### 1. Join as Verifier

```bash
# In MetaMask, ensure you have 0.1+ ADI
# Connect wallet on frontend
# Click "Join as Verifier"
# Approve transaction
# Check you received 100 TARS tokens
```

### 2. Create Test Cause

```bash
# Image Hash: "test-disaster-relief"
# Description: "Emergency relief for flood victims"
# Amount: 0.05 ADI
# Beneficiary: Your test wallet address
```

### 3. Get Cause ID

Check transaction logs in block explorer for `CauseCreated` event.

### 4. Verify Cause (need 3 verifiers)

You'll need 3 different verifier accounts to test fully.

### 5. Vote on Cause

After 3 verifications, vote Yes or No.

### 6. Execute Cause

After 3 days (or fast-forward time in local testing), execute the cause.

## 🐛 Common Issues

### Issue: "Module not found" errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors in frontend

**Solution**:
```bash
npm run compile  # Regenerate types
cd frontend
rm -rf .next
npm run dev
```

### Issue: Transaction fails with "Insufficient stake"

**Solution**: Ensure you're sending exactly 0.1 ADI or more when joining as verifier.

### Issue: Can't connect wallet

**Solution**:
- Check ADI testnet is added to MetaMask
- Verify chain ID matches in `providers.tsx`
- Check RPC URL is correct

## 📞 Support

For issues:
1. Check console logs (browser DevTools)
2. Check transaction on block explorer
3. Verify contract address is correct
4. Ensure you're on ADI testnet

## ✅ Setup Complete!

You now have a fully functional DAO on ADI Testnet with:
- ✅ Smart contracts deployed
- ✅ TypeScript types generated
- ✅ Frontend running
- ✅ Wallet connected
- ✅ Ready to test!
