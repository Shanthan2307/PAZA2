# 🧪 Prediction Market Testing Guide

Quick reference for testing the deployed prediction market system.

---

## 📋 Prerequisites

- Frontend running: `cd frontend && npm run dev`
- Wallet connected to ADI testnet
- Some ADI for gas and staking
- DAO membership (or join via frontend)

---

## 🚀 Quick Test Script

### Test 1: Create and Execute Proposal (4 minutes)

```bash
# 1. Create a proposal using Impact Agent or frontend
# Wait for transaction confirmation

# 2. Vote YES on the proposal (need 2+ members)
# Wait 3 minutes for voting period to end

# 3. Execute the proposal
# This sets proposalApprovedAt timestamp
```

### Test 2: Launch Market (1 minute)

```typescript
// Using ethers.js or hardhat console
const dao = await ethers.getContractAt(
  "PredictionMarketDAO",
  "0x023d2018C73Fd4BE023cC998e59363A68cDF36eC"
);

const market = await ethers.getContractAt(
  "RepairTimelineMarket",
  "0xAA4823a0040d958e3a4935De1Be1697CaAd060b3"
);

// Get proposal data
const proposalId = "0x..."; // Your proposal ID
const metadata = await dao.getProposalMetadata(proposalId);
const approvalTime = await dao.proposalApprovedAt(proposalId);

// Launch market
const tx = await market.createMarket(
  metadata.marketId,
  proposalId,
  metadata.propertyId,
  approvalTime,
  Number(approvalTime) + 600,  // 10 min repair deadline
  Number(approvalTime) + 300   // 5 min trading deadline
);

await tx.wait();
console.log("Market created!");
```

### Test 3: Stake on Market (5 minutes)

```typescript
// Stake 0.01 ADI on YES
const tx1 = await market.stakeYes(metadata.marketId, {
  value: ethers.parseEther("0.01")
});
await tx1.wait();

// Stake 0.01 ADI on NO (from different account)
const tx2 = await market.stakeNo(metadata.marketId, {
  value: ethers.parseEther("0.01")
});
await tx2.wait();

// Check pools
const [yesPool, noPool] = await market.getPools(metadata.marketId);
console.log("YES pool:", ethers.formatEther(yesPool), "ADI");
console.log("NO pool:", ethers.formatEther(noPool), "ADI");
```

### Test 4: Submit Completion Proof (1 minute)

```typescript
const resolver = await ethers.getContractAt(
  "RepairVerificationResolver",
  "0x9f7045E0B7C8309962097a0Ac64AfB5820e7A0F1"
);

// Generate mock evidence hash
const evidenceHash = ethers.randomBytes(32);
const ipfsCID = "QmTest123...";
const completionTime = Math.floor(Date.now() / 1000); // Now

const tx = await resolver.submitCompletionProof(
  proposalId,
  evidenceHash,
  ipfsCID,
  completionTime
);

await tx.wait();
console.log("Proof submitted!");
```

### Test 5: Resolve Market (1 minute)

```typescript
// Finalizer only (deployer account)
const tx = await resolver.resolveByProof(proposalId);
await tx.wait();

// Check resolution
const marketData = await market.markets(metadata.marketId);
console.log("Resolved:", marketData.resolved);
console.log("Outcome YES:", marketData.outcomeYes);
```

### Test 6: Claim Winnings (1 minute)

```typescript
// Winners claim their share
const tx = await market.claim(metadata.marketId);
await tx.wait();

console.log("Winnings claimed!");
```

---

## 🎯 Frontend Testing

### 1. View Proposals
- Navigate to voting tab
- Verify proposals load from new DAO contract
- Check all proposal details display correctly

### 2. Create Proposal
- Use Impact Agent to create new proposal
- Verify it appears in the list
- Check metadata is correct

### 3. Vote on Proposal
- Click vote YES/NO
- Wait for transaction
- Verify vote count updates

### 4. Execute Proposal
- Wait for voting period to end (3 min)
- Click execute
- Verify status changes to "Executed"

### 5. View Market
- Add RepairMarket component to proposal detail page
- Verify market data loads
- Check pools, probability, and timers

### 6. Stake on Market
- Enter stake amount (e.g., 0.01 ADI)
- Click "Stake YES" or "Stake NO"
- Verify transaction succeeds
- Check pool updates

### 7. Submit Proof
- Use CompletionProofForm component
- Fill in evidence hash, IPFS CID, timestamp
- Submit proof
- Verify success message

### 8. Claim Winnings
- After market resolves
- Click "Claim Winnings"
- Verify payout received

---

## 🔍 Verification Commands

### Check Contract State

```typescript
// Check DAO configuration
const votingPeriod = await dao.votingPeriod();
const resolutionPeriod = await dao.resolutionPeriod();
const marketContract = await dao.marketContract();
const resolverContract = await dao.resolverContract();

console.log("Voting Period:", votingPeriod, "seconds");
console.log("Resolution Period:", resolutionPeriod, "seconds");
console.log("Market Contract:", marketContract);
console.log("Resolver Contract:", resolverContract);

// Check market state
const marketData = await market.markets(marketId);
console.log("Market exists:", marketData.exists);
console.log("Resolved:", marketData.resolved);
console.log("YES pool:", ethers.formatEther(marketData.yesPool));
console.log("NO pool:", ethers.formatEther(marketData.noPool));

// Check user position
const [yesStake, noStake, claimed] = await market.getUserPosition(
  marketId,
  userAddress
);
console.log("Your YES stake:", ethers.formatEther(yesStake));
console.log("Your NO stake:", ethers.formatEther(noStake));
console.log("Claimed:", claimed);
```

### Check Events

```typescript
// Listen for market creation
market.on("MarketCreated", (marketId, proposalId, propertyId) => {
  console.log("Market created:", marketId);
});

// Listen for stakes
market.on("Staked", (marketId, user, yesSide, amount) => {
  console.log(`${user} staked ${ethers.formatEther(amount)} on ${yesSide ? 'YES' : 'NO'}`);
});

// Listen for resolution
market.on("MarketResolved", (marketId, outcomeYes) => {
  console.log(`Market ${marketId} resolved: ${outcomeYes ? 'YES' : 'NO'}`);
});
```

---

## 🐛 Common Issues

### Issue: "Market not found"
**Solution**: Market hasn't been created yet. Run the market creation script.

### Issue: "Trading closed"
**Solution**: Trading deadline has passed. Create a new market or adjust deadlines.

### Issue: "Not owner" or "Not finalizer"
**Solution**: Use the deployer account (0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B).

### Issue: "Proposal not found"
**Solution**: Proposal doesn't exist in new DAO. Create a new proposal.

### Issue: "Already voted"
**Solution**: This address has already voted. Use a different account.

### Issue: "Below min stake"
**Solution**: Stake at least 0.0001 ADI.

---

## 📊 Expected Results

### Successful Flow
1. ✅ Proposal created with unique ID
2. ✅ Voting completes with quorum
3. ✅ Proposal executed, approvalTime set
4. ✅ Market created with correct deadlines
5. ✅ Users stake, pools update
6. ✅ Proof submitted successfully
7. ✅ Market resolves with correct outcome
8. ✅ Winners claim proportional payouts

### Demo Timing
- Voting: 3 minutes
- Trading: 5 minutes
- Repair deadline: 10 minutes
- Total test time: ~15 minutes

---

## 🎉 Success Criteria

- [ ] All contracts deployed and wired
- [ ] Proposals load from new DAO
- [ ] Voting and execution work
- [ ] Markets can be created
- [ ] Staking updates pools correctly
- [ ] Probability calculations accurate
- [ ] Proofs can be submitted
- [ ] Markets resolve correctly
- [ ] Payouts are accurate
- [ ] Frontend displays all data

---

## 📞 Support

If you encounter issues:
1. Check contract addresses in `.env.local`
2. Verify wallet is connected to ADI testnet
3. Check console for error messages
4. Verify you have enough ADI for gas
5. Ensure you're using the correct account (member/owner/finalizer)

---

**Happy Testing! 🚀**
