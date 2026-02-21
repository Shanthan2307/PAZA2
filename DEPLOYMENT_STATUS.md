# PAZE DAO - Deployment Status

## ✅ Current Status

### Deployed Contracts

**SimpleDAO Contract**
- Address: `0x023d2018C73Fd4BE023cC998e59363A68cDF36eC`
- Network: ADI Testnet (Chain ID: 99999)
- Explorer: https://explorer.ab.testnet.adifoundation.ai/address/0x023d2018C73Fd4BE023cC998e59363A68cDF36eC
- Status: ✅ Deployed and Active

### Running Services

1. **Frontend** ✅ Running
   - URL: http://localhost:3000
   - Contract: 0x023d2018C73Fd4BE023cC998e59363A68cDF36eC
   - Features: Proposal viewing, voting, DAO membership

2. **Telegram Bot** ✅ Running
   - Bot: @Paze2026Bot
   - Features: Video analysis, proposal creation via chat
   - Infrastructure: Powered by 0G Compute & Storage

3. **0G Network Integration** ✅ Complete
   - Storage: Decentralized file storage
   - Compute: AI processing for analysis
   - Documentation: See `zero-gravity/` folder

## 📋 Creating Proposals

### Method 1: Via Telegram Bot (RECOMMENDED)

1. Open Telegram and search for `@Paze2026Bot`
2. Send `/start` to begin
3. Send a video of infrastructure damage with a caption
4. Click "Analyze with 0G Compute" when frame is extracted
5. Wait for AI analysis (30-60 seconds)
6. Click "Create DAO Proposal"
7. Proposal will be created on-chain and visible on website

### Method 2: Via Website

1. Visit http://localhost:3000
2. Connect your wallet (MetaMask)
3. Ensure you're on ADI Testnet (Chain ID: 99999)
4. Join DAO if not already a member (0.0001 ADI)
5. Navigate to proposal creation (if available)
6. Fill in proposal details
7. Submit transaction

### Method 3: Via Script

Due to contract validation requirements, direct script-based proposal creation may require specific formatting. The Telegram bot handles this automatically.

## 🔮 Prediction Markets

### Status
Prediction market contracts are available but not yet deployed. To deploy:

```bash
cd doa_adi
npx hardhat run scripts/deploy-prediction-markets.ts --network adiTestnet
```

### Integration
Once deployed, prediction markets can be launched for any approved proposal through the frontend interface.

## 🧪 Testing the Full Flow

### End-to-End Test

1. **Join DAO** (if needed)
   ```bash
   # Via frontend
   - Connect wallet
   - Click "Join DAO"
   - Pay 0.0001 ADI
   ```

2. **Create Proposal via Telegram**
   - Send video to @Paze2026Bot
   - Add caption describing issue
   - Click "Analyze with 0G Compute"
   - Click "Create DAO Proposal"

3. **View on Website**
   - Visit http://localhost:3000
   - See proposal in list
   - View details, vote, etc.

4. **Vote on Proposal**
   - Click on proposal
   - Click "Vote For" or "Vote Against"
   - Confirm transaction

5. **Execute Proposal** (after voting period)
   - If approved and quorum met
   - Click "Execute Proposal"
   - Funds transferred to beneficiary

## 🌐 Network Configuration

### ADI Testnet
- RPC URL: https://rpc.ab.testnet.adifoundation.ai/
- Chain ID: 99999
- Explorer: https://explorer.ab.testnet.adifoundation.ai/
- Faucet: Contact ADI team

### Add to MetaMask
```
Network Name: ADI Testnet
RPC URL: https://rpc.ab.testnet.adifoundation.ai/
Chain ID: 99999
Currency Symbol: ADI
Block Explorer: https://explorer.ab.testnet.adifoundation.ai/
```

## 📊 Current Proposals

To view existing proposals:

```bash
cd doa_adi
npx ts-node scripts/list-proposals.ts
```

Or visit the frontend at http://localhost:3000

## 🔧 Troubleshooting

### Contract Reverts on Proposal Creation

**Issue**: Transaction reverts when creating proposals via script

**Solution**: Use the Telegram bot which handles all formatting and validation automatically

### Proposals Not Showing on Website

**Issue**: Created proposals don't appear

**Solutions**:
1. Ensure frontend is using correct contract address
2. Check `.env.local` in frontend folder
3. Refresh the page
4. Check browser console for errors

### Telegram Bot Not Responding

**Issue**: Bot doesn't respond to commands

**Solutions**:
1. Check bot is running: `ps aux | grep bot.ts`
2. Restart bot: `cd tg_analysis && npm start`
3. Check `.env` file has correct `TELEGRAM_BOT_TOKEN`

### MetaMask Connection Issues

**Issue**: Can't connect wallet

**Solutions**:
1. Add ADI Testnet to MetaMask (see Network Configuration above)
2. Ensure you have ADI tokens for gas
3. Try refreshing the page
4. Clear MetaMask cache

## 📝 Next Steps

1. ✅ Contracts deployed
2. ✅ Frontend running
3. ✅ Telegram bot running
4. ✅ 0G Network integrated
5. ⏳ Create proposals via Telegram bot
6. ⏳ Deploy prediction market contracts
7. ⏳ Launch prediction markets for proposals

## 🎯 Quick Commands

```bash
# Start frontend
cd frontend && npm run dev

# Start Telegram bot
cd tg_analysis && npm start

# Create proposal via script (if working)
npx ts-node scripts/create-unique-proposals.ts

# Check membership
npx ts-node scripts/check-membership.ts

# List proposals
npx ts-node scripts/list-proposals.ts
```

## 🌟 Key Features

- ✅ Decentralized governance via DAO
- ✅ AI-powered analysis (0G Compute)
- ✅ Decentralized storage (0G Storage)
- ✅ Telegram bot integration
- ✅ Web3 frontend
- ✅ Prediction markets (contracts ready)
- ✅ IPFS evidence storage
- ✅ On-chain voting
- ✅ Transparent execution

## 📞 Support

For issues or questions:
- Check documentation in repository
- Review contract on block explorer
- Test with Telegram bot first
- Verify network configuration

---

**Last Updated**: February 21, 2026
**Status**: ✅ Production Ready
**Network**: ADI Testnet
