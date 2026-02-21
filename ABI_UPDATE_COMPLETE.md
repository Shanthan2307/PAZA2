# ABI Update Complete - Proposals Now Loading

## Issue
Frontend was using old SimpleDAO ABI but querying new PredictionMarketDAO contract. The old ABI had `getProposal()` function, but the new contract has three separate functions.

## Root Cause
When we upgraded from SimpleDAO to PredictionMarketDAO, the contract structure changed:

**Old (SimpleDAO)**:
- Single function: `getProposal()` returns all data

**New (PredictionMarketDAO)**:
- `getProposalDetails()` - title, description, location, amount
- `getProposalMetadata()` - issue type, severity, confidence, IPFS CID
- `getProposalVoting()` - votes, deadline, execution status

## Solution

### 1. Updated Contract ABI
**File**: `frontend/lib/contract.ts`

Added the three new functions to the ABI:
- `getProposalDetails()`
- `getProposalMetadata()`
- `getProposalVoting()`

### 2. Updated ProposalList Component
**File**: `frontend/components/ProposalList.tsx`

Changed from:
```typescript
const result = await contract.getProposal(proposalId);
```

To:
```typescript
const [details, voting, metadata] = await Promise.all([
  contract.getProposalDetails(proposalId),
  contract.getProposalVoting(proposalId),
  contract.getProposalMetadata(proposalId)
]);
```

### 3. Added Missing Env Variable
**File**: `frontend/.env.local`

Added:
```
NEXT_PUBLIC_DAO_CHAIN_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
```

## Result

✅ Proposals now load correctly from blockchain  
✅ All 6 proposals visible in frontend  
✅ Metadata displayed properly (issue type, severity, confidence)  
✅ Voting data accurate  
✅ IPFS links working  

## Data Mapping

### Issue Types (from contract enum)
0 = Environmental  
1 = Infrastructure  
2 = Healthcare  
3 = Education  
4 = Humanitarian  
5 = Social  
6 = Economic  

### Severity Levels (from contract enum)
0 = Low  
1 = Medium  
2 = High  
3 = Critical  

### Proposal Status (from contract enum)
0 = None (doesn't exist)  
1 = Active  
2 = Passed  
3 = Rejected  
4 = Executed  

## Verification

To verify proposals are loading:

1. Open http://localhost:3000
2. Connect wallet
3. Navigate to "Voting (DAO)" tab
4. Should see 6 proposals with full metadata

Or check on-chain:
```bash
npx hardhat run scripts/list-all-proposals.ts --network adiTestnet
```

## Status

✅ ABI updated  
✅ Frontend updated  
✅ Proposals loading  
✅ All features working  

The frontend now correctly queries the PredictionMarketDAO contract!
