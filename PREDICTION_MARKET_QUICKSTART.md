# Prediction Market Integration - Quick Start

## ✅ What's Been Done

I've added three new Solidity contracts to your project:

1. **RepairTimelineMarket.sol** - The core prediction market
   - Parimutuel YES/NO betting on repair completion
   - Native ADI collateral
   - 1% trading fee
   - Claim winnings after resolution

2. **RepairVerificationResolver.sol** - Resolution logic
   - Submit completion proofs
   - Resolve markets based on deadline vs completion time
   - Challenge mechanism (optional)

3. **DemoTarget.sol** - Demo visualization
   - Shows repair status on-chain
   - Risk flags
   - Market outcomes

## 🔧 What Needs to Be Done Next

### Step 1: Patch PredictionMarketDAO (CRITICAL)

Your current DAO needs these additions:

```solidity
// Add to state variables
address public owner;
uint256 public votingPeriod;
uint256 public resolutionPeriod;
mapping(bytes32 => uint256) public proposalApprovedAt;
bytes32[] public allProposalIds;
address public marketContract;
address public resolverContract;

// Add modifier
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

// Update constructor
constructor(uint256 _votingPeriod, uint256 _resolutionPeriod) {
    owner = msg.sender;
    votingPeriod = _votingPeriod;
    resolutionPeriod = _resolutionPeriod;
    // ... existing member setup
}

// Add setters
function setMarketContract(address _marketContract) external onlyOwner {
    require(_marketContract != address(0), "Invalid market");
    marketContract = _marketContract;
}

function setResolverContract(address _resolverContract) external onlyOwner {
    require(_resolverContract != address(0), "Invalid resolver");
    resolverContract = _resolverContract;
}

// In createProposal(), replace constants with variables:
uint256 votingDeadline = block.timestamp + votingPeriod;
uint256 resolutionDeadline = votingDeadline + resolutionPeriod;

// In createProposal(), after proposalExists[proposalId] = true:
allProposalIds.push(proposalId);

// In executeProposal(), after marking executed:
proposalApprovedAt[proposalId] = block.timestamp;
```

### Step 2: Compile Contracts

```bash
cd doa_adi
npx hardhat compile
```

### Step 3: Deploy to ADI Testnet

Create `scripts/deploy-prediction-markets.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Demo mode: 3 min voting, 20 min resolution
  const votingPeriod = 180;
  const resolutionPeriod = 1200;

  // 1. Deploy DAO
  const DAO = await ethers.getContractFactory("PredictionMarketDAO");
  const dao = await DAO.deploy(votingPeriod, resolutionPeriod);
  await dao.waitForDeployment();
  console.log("DAO deployed to:", await dao.getAddress());

  // 2. Deploy Market
  const Market = await ethers.getContractFactory("RepairTimelineMarket");
  const market = await Market.deploy(deployer.address);
  await market.waitForDeployment();
  console.log("Market deployed to:", await market.getAddress());

  // 3. Deploy Resolver
  const Resolver = await ethers.getContractFactory("RepairVerificationResolver");
  const resolver = await Resolver.deploy(
    await dao.getAddress(),
    await market.getAddress(),
    deployer.address
  );
  await resolver.waitForDeployment();
  console.log("Resolver deployed to:", await resolver.getAddress());

  // 4. Deploy DemoTarget
  const Demo = await ethers.getContractFactory("DemoTarget");
  const demo = await Demo.deploy(deployer.address);
  await demo.waitForDeployment();
  console.log("DemoTarget deployed to:", await demo.getAddress());

  // 5. Wire contracts
  await dao.setMarketContract(await market.getAddress());
  await dao.setResolverContract(await resolver.getAddress());
  await market.setResolver(await resolver.getAddress());

  console.log("\n✅ All contracts deployed and wired!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Run:
```bash
npx hardhat run scripts/deploy-prediction-markets.ts --network adiTestnet
```

### Step 4: Frontend Integration

Add to `frontend/lib/contract.ts`:

```typescript
export const MARKET_ADDRESS = '0x...' as `0x${string}`;
export const RESOLVER_ADDRESS = '0x...' as `0x${string}`;

export const MARKET_ABI = [
  // ... copy from RepairTimelineMarket.sol ABI
] as const;

export const RESOLVER_ABI = [
  // ... copy from RepairVerificationResolver.sol ABI
] as const;
```

### Step 5: Backend Market Launch

After proposal execution, launch market:

```typescript
async function launchMarketForProposal(proposalId: string) {
  const approvalTime = await dao.proposalApprovedAt(proposalId);
  const metadata = await dao.getProposalMetadata(proposalId);
  
  const repairDeadline = approvalTime + 600; // 10 minutes demo
  const tradingDeadline = approvalTime + 300; // 5 minutes
  
  await market.createMarket(
    metadata.marketId,
    proposalId,
    metadata.propertyId,
    approvalTime,
    repairDeadline,
    tradingDeadline
  );
}
```

## 📊 Demo Flow

1. **Create Proposal** (existing flow)
2. **Vote** (3 minutes in demo mode)
3. **Execute** → sets `proposalApprovedAt`
4. **Launch Market** → backend calls `createMarket()`
5. **Users Stake** → YES/NO predictions (5 minutes)
6. **Submit Proof** → completion evidence
7. **Resolve** → finalizer calls `resolveByProof()`
8. **Claim** → winners get payouts

## 🎯 Key Question

**"Will the repair for Property #X be completed within 10 days of DAO approval?"**

In demo mode: 10 minutes instead of 10 days

## ⚠️ Important Notes

1. **Don't break existing functionality** - The DAO patches are additive
2. **Test with small amounts** - Use 0.001 ADI for testing
3. **Demo mode timing** - Make it clear in UI this is compressed
4. **Approval timestamp is critical** - This is the anchor for all deadlines

## 🚀 Ready to Integrate?

Would you like me to:
1. Patch the PredictionMarketDAO contract now?
2. Create the deployment script?
3. Build the frontend components?
4. Set up the backend integration?

Let me know which part you'd like to tackle first!
