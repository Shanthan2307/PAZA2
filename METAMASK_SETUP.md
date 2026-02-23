# MetaMask Setup for TARS DAO on ADI Testnet

## ✅ Deployment Complete!

Your TARS DAO is now deployed and running:

- **Contract Address**: `0xCb93B233CFF21498eefF6bD713341494aa0406f5`
- **Frontend URL**: http://localhost:3000
- **Network**: ADI Testnet
- **Chain ID**: 99999

## 🦊 MetaMask Configuration

### Step 1: Add ADI Testnet to MetaMask

1. Open MetaMask extension
2. Click the network dropdown (top left)
3. Click "Add Network" or "Add a network manually"
4. Enter the following details:

```
Network Name: ADI Testnet
RPC URL: https://rpc.ab.testnet.adifoundation.ai/
Chain ID: 99999
Currency Symbol: ADI
Block Explorer: https://explorer.ab.testnet.adifoundation.ai/
```

5. Click "Save"

### Step 2: Import Your Wallet

You have two options:

#### Option A: Import the Deployment Account (Has 20 ADI)

1. Click MetaMask menu (three dots)
2. Select "Account Details" → "Import Account"
3. Select "Private Key"
4. Paste: `your-private-key-here`
5. Click "Import"

Your imported account address: `0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B`

#### Option B: Use Your Existing Account

If you want to use your existing MetaMask account, you'll need ADI testnet tokens. Get them from the faucet (if available) or transfer from the deployment account.

### Step 3: Connect to the App

1. Visit http://localhost:3000
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve the connection
5. Make sure you're on ADI Testnet (Chain ID: 99999)

## 🎯 Using the DAO

### Join as Verifier (Recommended for Testing)

1. Click "Join as Verifier"
2. You'll need to send 0.1 ADI
3. You'll receive 100 TARS governance tokens
4. You can verify causes and vote

### Join as Agent

1. Click "Join as Agent"
2. No stake required
3. You'll receive 50 TARS governance tokens
4. You can create causes and vote (but not verify)

### Create a Cause

1. Fill in the form:
   - **Image Hash**: Any string (e.g., "disaster-relief-2024")
   - **Description**: Describe the cause
   - **Amount**: Amount in ADI (e.g., 0.05)
   - **Beneficiary**: Wallet address to receive funds
2. Submit transaction
3. Note the Cause ID from the transaction logs

### Verify a Cause (Verifiers Only)

1. Enter the Cause ID
2. Click "Verify Cause"
3. Needs 3 verifications before voting can begin

### Vote on a Cause

1. Enter the Cause ID
2. Click "Vote Yes" or "Vote No"
3. Your voting power = your TARS token balance
4. Voting period: 3 days

### Execute a Cause

1. After voting period ends
2. If approved (more yes than no votes)
3. Anyone can execute
4. Funds automatically sent to beneficiary

## 🔍 View on Block Explorer

Visit: https://explorer.ab.testnet.adifoundation.ai/address/0xCb93B233CFF21498eefF6bD713341494aa0406f5

## 💡 Tips

- Keep the private key secure (this is a testnet key, but still practice good security)
- You have 20 ADI in the deployment account for testing
- Each verifier join costs 0.1 ADI
- Gas fees are minimal on testnet
- You can create multiple test accounts in MetaMask for testing multi-user scenarios

## 🐛 Troubleshooting

### "Wrong Network" Error
- Make sure MetaMask is connected to ADI Testnet (Chain ID: 99999)
- Click the network dropdown and select "ADI Testnet"

### Transaction Fails
- Check you have enough ADI for gas fees
- Verify you're on the correct network
- Check the browser console for error messages

### Can't Connect Wallet
- Refresh the page
- Make sure MetaMask is unlocked
- Try disconnecting and reconnecting

## 📞 Support

Check the browser console (F12) for detailed error messages if something goes wrong.

Enjoy testing your DAO! 🚀
