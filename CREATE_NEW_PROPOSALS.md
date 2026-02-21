# 🆕 Creating New Proposals on New DAO

**New DAO Address**: `0x023d2018C73Fd4BE023cC998e59363A68cDF36eC`

---

## 🎯 Why Create New Proposals?

The old proposals were created on the previous DAO contract (`0x1323f3CfE3c34165562a7B5CC16a867A4bBacA9d`). The new DAO contract with prediction market integration is at a different address, so we need to create fresh proposals.

---

## 🚀 Method 1: Using Impact Agent (Recommended)

The Impact Agent is already configured to use the new DAO address from `.env`.

### Step 1: Verify Configuration

Check that `.env` has the correct address:
```bash
cat doa_adi/.env | grep DAO_CONTRACT_ADDRESS
# Should show: DAO_CONTRACT_ADDRESS=0x023d2018C73Fd4BE023cC998e59363A68cDF36eC
```

### Step 2: Run Impact Agent

```bash
cd doa_adi
# Start the Impact Agent
# It will automatically use the new DAO contract
```

### Step 3: Create Proposal

The agent will:
1. Analyze the image/issue
2. Generate proposal data
3. Call `createProposal()` on the NEW DAO
4. Save to `processed-files-pm.json`
5. Return the proposal ID

---

## 🔧 Method 2: Manual Creation (For Testing)

### Using Hardhat Console

```bash
cd doa_adi
npx hardhat console --network adiTestnet
```

```javascript
// Get the contract
const DAO = await ethers.getContractFactory("PredictionMarketDAO");
const dao = await DAO.attach("0x023d2018C73Fd4BE023cC998e59363A68cDF36eC");

// Create a test proposal
const tx = await dao.createProposal(
  "Test Repair Proposal",                    // title
  "Testing prediction market integration",   // description
  "123 Main St, Test City",                  // location
  40748817,                                  // latitude * 1e6
  -73985428,                                 // longitude * 1e6
  ethers.parseEther("1.0"),                  // requestedAmount
  "0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B", // beneficiary
  ethers.randomBytes(32),                    // propertyId
  ethers.randomBytes(32),                    // evidenceHash
  85,                                        // verificationConfidence
  1,                                         // issueType (INFRASTRUCTURE)
  2,                                         // severity (HIGH)
  "QmTestCID123..."                          // ipfsCID
);

const receipt = await tx.wait();
console.log("Proposal created!");

// Get the proposal ID from events
const event = receipt.logs.find(log => {
  try {
    return dao.interface.parseLog(log).name === 'ProposalCreated';
  } catch {
    return false;
  }
});

if (event) {
  const parsed = dao.interface.parseLog(event);
  console.log("Proposal ID:", parsed.args.proposalId);
}
```

### Using TypeScript Script

Create `scripts/create-test-proposal.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  
  const dao = await ethers.getContractAt(
    "PredictionMarketDAO",
    "0x023d2018C73Fd4BE023cC998e59363A68cDF36eC"
  );

  console.log("Creating test proposal...");
  
  const tx = await dao.createProposal(
    "Emergency Road Repair",
    "Pothole causing accidents on Main Street",
    "123 Main St, Test City",
    40748817,  // NYC coordinates
    -73985428,
    ethers.parseEther("0.5"),
    signer.address,
    ethers.randomBytes(32),
    ethers.randomBytes(32),
    90,
    1, // INFRASTRUCTURE
    3, // CRITICAL
    "QmTestCID123..."
  );

  const receipt = await tx.wait();
  console.log("✅ Proposal created!");
  console.log("Transaction:", receipt.hash);
  
  // Extract proposal ID from events
  const event = receipt.logs.find(log => {
    try {
      return dao.interface.parseLog(log).name === 'ProposalCreated';
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = dao.interface.parseLog(event);
    console.log("Proposal ID:", parsed.args.proposalId);
    console.log("Market ID:", parsed.args.marketId);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run it:
```bash
npx hardhat run scripts/create-test-proposal.ts --network adiTestnet
```

---

## 📋 Proposal Data Structure

### Required Fields

```typescript
{
  // Basic Info
  title: string,              // "Emergency Road Repair"
  description: string,        // Detailed description
  location: string,           // "123 Main St, City"
  latitude: int256,           // lat * 1e6 (e.g., 40748817)
  longitude: int256,          // lng * 1e6 (e.g., -73985428)
  
  // Financial
  requestedAmount: uint256,   // In wei (e.g., parseEther("1.0"))
  beneficiary: address,       // Who receives funds
  
  // Verification
  propertyId: bytes32,        // Unique property identifier
  evidenceHash: bytes32,      // Hash of evidence
  verificationConfidence: uint8, // 0-100
  
  // Classification
  issueType: IssueType,       // 0-6 (see enum below)
  severity: Severity,         // 0-3 (see enum below)
  
  // IPFS
  ipfsCID: string            // Full IPFS CID
}
```

### Enums

```solidity
enum IssueType {
  ENVIRONMENTAL,    // 0
  INFRASTRUCTURE,   // 1
  HEALTHCARE,       // 2
  EDUCATION,        // 3
  HUMANITARIAN,     // 4
  ECONOMIC,         // 5
  SOCIAL           // 6
}

enum Severity {
  LOW,      // 0
  MEDIUM,   // 1
  HIGH,     // 2
  CRITICAL  // 3
}
```

---

## ✅ Verification

### Check Proposal Exists

```typescript
const exists = await dao.proposalExists(proposalId);
console.log("Exists:", exists);
```

### Get Proposal Data

```typescript
// Get details
const details = await dao.getProposalDetails(proposalId);
console.log("Title:", details.title);
console.log("Description:", details.description);

// Get metadata
const metadata = await dao.getProposalMetadata(proposalId);
console.log("Property ID:", metadata.propertyId);
console.log("Market ID:", metadata.marketId);
console.log("Issue Type:", metadata.issueType);

// Get voting info
const voting = await dao.getProposalVoting(proposalId);
console.log("For votes:", voting.forVotes);
console.log("Against votes:", voting.againstVotes);
console.log("Deadline:", new Date(Number(voting.deadline) * 1000));
```

---

## 🎯 After Creating Proposals

### 1. Verify in Frontend
- Open http://localhost:3000
- Check that proposals appear in the list
- Verify all data displays correctly

### 2. Test Voting
- Connect wallet as DAO member
- Vote YES or NO
- Wait 3 minutes (demo mode)

### 3. Execute Proposal
- After voting period ends
- Click "Execute Proposal"
- Verify `proposalApprovedAt` is set

### 4. Launch Market
- Use the market launcher script
- Or manually call `market.createMarket()`
- Verify market appears in UI

### 5. Test Complete Flow
- Stake YES/NO
- Submit completion proof
- Resolve market
- Claim winnings

---

## 🐛 Troubleshooting

### "Not a member"
```typescript
// Join the DAO first
await dao.joinDAO({ value: ethers.parseEther("0.0001") });
```

### "Invalid confidence score"
```typescript
// Must be 0-100
verificationConfidence: 85  // ✅ Good
verificationConfidence: 150 // ❌ Too high
```

### "Invalid beneficiary"
```typescript
// Must be valid address
beneficiary: "0x0000000000000000000000000000000000000000" // ❌ Zero address
beneficiary: signer.address // ✅ Good
```

### Proposal Not Appearing
1. Check transaction succeeded
2. Verify proposal ID is correct
3. Check `proposalExists(proposalId)` returns true
4. Refresh frontend
5. Check browser console for errors

---

## 📊 Expected Results

### Successful Creation
```
✅ Transaction confirmed
✅ Proposal ID generated
✅ Market ID generated
✅ Proposal exists on-chain
✅ Appears in frontend
✅ All data correct
```

### Timeline
```
0:00 - Create proposal
0:01 - Proposal appears in UI
3:00 - Voting period ends
3:01 - Execute proposal
3:02 - Launch market
8:02 - Trading closes (5 min)
13:02 - Repair deadline (10 min)
```

---

## 🎉 Success!

Once you create new proposals on the new DAO contract, the entire prediction market system will be fully functional and ready for testing!

**Next**: Follow the [Testing Guide](./TESTING_GUIDE.md) for complete end-to-end testing.
