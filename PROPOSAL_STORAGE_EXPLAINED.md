# Where Are Proposals Stored?

## Two Storage Locations

### 1. 🔗 On-Chain (Primary Storage - Blockchain)

**Location**: PredictionMarketDAO Smart Contract  
**Address**: `0x1323f3CfE3c34165562a7B5CC16a867A4bBacA9d`  
**Network**: ADI Testnet (Chain ID: 99999)

This is the **source of truth**. All proposals are permanently stored on the blockchain.

**What's Stored**:
- Proposal ID (bytes32 hash)
- Title, description, location
- Requested amount, beneficiary address
- Geographic coordinates (lat/lng)
- Issue type, severity, confidence score
- Property ID, evidence hash, market ID
- IPFS CID (link to full data)
- Voting data (for/against votes)
- Deadline, execution status
- Creation timestamp

**How to Access**:
```bash
# List all proposals
npx hardhat run scripts/list-all-proposals.ts --network adiTestnet

# Verify specific proposal
npx hardhat run scripts/verify-new-proposal.ts --network adiTestnet
```

**Current Proposals On-Chain**: 6 proposals
1. Healthcare - Kenya (8,000 ADI)
2. Environmental - Bangladesh (12,000 ADI)
3. Education - India (6,000 ADI)
4. Humanitarian - Brookline, MA (5,000 ADI)
5. Social - Brookline, MA (5,000 ADI)
6. Infrastructure - Manhattan, NY (5,000 ADI)

---

### 2. 📄 Local Tracking File (Secondary - For Impact Agent)

**Location**: `doa_adi/processed-files-pm.json`

This is just a **tracking file** to prevent the Impact Agent from processing the same analysis twice.

**What's Stored**:
```json
[
  {
    "filename": "analysis-2026-02-20T17-38-13-802Z.json",
    "proposalId": "0xe46ba000867c1cb328e7d291dcde2c2d88a1d956df642d2bcd2bc75136cc18e6",
    "timestamp": "2026-02-21T07:44:05.638Z",
    "status": "success",
    "txHash": "0xb65ca9d9c3a37edb41c32217f48987c3c8d22ef28a08658f719cf690664fb6cd",
    "ipfsCID": "QmZ1U5D76oRAbriaTkjB6hh1W5NL1J3wYCSpqgocfqm8jh"
  }
]
```

**Purpose**:
- Track which analysis files have been processed
- Store proposal ID for reference
- Store transaction hash for verification
- Store IPFS CID for metadata

**Note**: This file is NOT the source of truth. If deleted, proposals still exist on-chain.

---

## Data Flow

```
1. Smart Glasses Capture
   ↓
2. Analysis JSON Created (details/analysis/)
   ↓
3. Impact Agent Processes
   ↓
4. Claude AI Enhances Metadata
   ↓
5. Upload to IPFS (Pinata)
   ↓
6. Create Proposal On-Chain ← STORED HERE (permanent)
   ↓
7. Track in processed-files-pm.json ← Just tracking
   ↓
8. Frontend Loads from Blockchain
```

---

## How Frontend Loads Proposals

### Step 1: API Route Reads Tracking File
```typescript
// frontend/app/api/proposals/route.ts
// Reads processed-files-pm.json to get proposal IDs
```

### Step 2: Frontend Fetches from Blockchain
```typescript
// frontend/components/ProposalList.tsx
// Uses proposal IDs to fetch full data from contract
const result = await contract.getProposal(proposalId);
```

### Step 3: Display in UI
- Voting tab shows all proposals
- Data comes directly from blockchain
- Always up-to-date with on-chain state

---

## Why Two Storage Locations?

### Blockchain (On-Chain)
✅ Permanent and immutable  
✅ Decentralized and trustless  
✅ Accessible by anyone  
✅ Verifiable and transparent  
❌ Costs gas to write  
❌ Slower to query  

### Tracking File (Local)
✅ Fast to read/write  
✅ No gas costs  
✅ Easy to update  
❌ Can be deleted  
❌ Not decentralized  
❌ Only for Impact Agent  

---

## Verification

### Check On-Chain Storage
```bash
# List all proposals
npx hardhat run scripts/list-all-proposals.ts --network adiTestnet

# Output shows:
# - 6 proposals stored on-chain
# - All metadata intact
# - Voting data preserved
# - IPFS links working
```

### Check Tracking File
```bash
# View tracking file
cat processed-files-pm.json

# Output shows:
# - 2 proposals tracked (created by Impact Agent)
# - Proposal IDs match on-chain data
# - Transaction hashes for verification
```

---

## What Happens If...

### Tracking File is Deleted?
- ✅ Proposals still exist on-chain
- ✅ Frontend still works (loads from blockchain)
- ⚠️ Impact Agent might reprocess old analyses
- 💡 Solution: Recreate tracking file or check on-chain before processing

### Blockchain Node Goes Down?
- ❌ Frontend can't load proposals temporarily
- ✅ Data is safe on blockchain
- 💡 Solution: Use different RPC endpoint or wait for node recovery

### IPFS Data is Lost?
- ✅ Core proposal data still on-chain
- ⚠️ Full metadata/images might be unavailable
- 💡 Solution: Pin to multiple IPFS nodes (Pinata does this)

---

## Best Practices

### For Developers
1. Always treat blockchain as source of truth
2. Use tracking file only for deduplication
3. Verify proposals on-chain after creation
4. Keep IPFS CIDs backed up

### For Users
1. Proposals are permanent once on-chain
2. Voting data is immutable
3. Can verify any proposal independently
4. No central authority can delete proposals

---

## Summary

**Primary Storage**: Blockchain (PredictionMarketDAO contract)  
**Secondary Storage**: Local tracking file (processed-files-pm.json)  
**Full Metadata**: IPFS (Pinata)  

**Current Status**:
- ✅ 6 proposals on-chain
- ✅ 2 proposals tracked locally
- ✅ All data verifiable
- ✅ Frontend loading correctly

The blockchain is the single source of truth. Everything else is just for convenience and tracking.
