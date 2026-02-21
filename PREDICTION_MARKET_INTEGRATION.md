# Prediction Market Integration - Implementation Plan

## Overview
Integrating a parimutuel prediction market system for repair timeline verification into the existing PAZE DAO.

## New Contracts Added

1. **RepairTimelineMarket.sol** - Parimutuel YES/NO market with native ADI collateral
2. **RepairVerificationResolver.sol** - Proof submission and market resolution
3. **DemoTarget.sol** - Optional on-chain state visualization for demos

## PredictionMarketDAO Patches Required

### Changes to Make:

1. **Add owner and configurable periods**
   - Replace hardcoded `VOTING_PERIOD` and `RESOLUTION_PERIOD` with state variables
   - Add `owner` address and `onlyOwner` modifier
   
2. **Add integration wiring**
   - `address public marketContract`
   - `address public resolverContract`
   - Setter functions for both

3. **Add proposal tracking**
   - `mapping(bytes32 => uint256) public proposalApprovedAt`
   - `bytes32[] public allProposalIds`
   - Track approval timestamp in `executeProposal()`
   - Push to array in `createProposal()`

4. **Add helper function**
   - `function proposalExists(bytes32 proposalId) external view returns (bool)`

## Demo Mode Configuration

For hackathon demos, use compressed timing:
- `votingPeriod` = 180 seconds (3 minutes)
- `resolutionPeriod` = 1200 seconds (20 minutes)
- `repairThreshold` = 600 seconds (10 minutes, represents "10 days")
- `tradingDeadline` = approval + 300 seconds (5 minutes)

## Integration Flow

```
1. Image Analysis → createProposal()
2. DAO Members Vote
3. executeProposal() → sets proposalApprovedAt[proposalId]
4. Backend reads approval time
5. Backend calls market.createMarket() with:
   - approvalTime = proposalApprovedAt
   - repairDeadline = approvalTime + 10 minutes (demo)
   - tradingDeadline = approvalTime + 5 minutes
6. Users stake YES/NO
7. Completion proof submitted
8. Resolver finalizes market
9. Winners claim payouts
```

## Next Steps

1. Compile new contracts
2. Patch PredictionMarketDAO (preserving existing functionality)
3. Create deployment script for ADI testnet
4. Update frontend for market UI
5. Integrate backend market launch logic
6. Test end-to-end flow

## Files to Create/Modify

**New**:
- `contracts/RepairTimelineMarket.sol` ✅
- `contracts/RepairVerificationResolver.sol` ✅
- `contracts/DemoTarget.sol` ✅
- `scripts/deploy-prediction-markets.ts`
- `frontend/components/RepairMarket.tsx`
- `backend/services/market-launcher.ts`

**Modify**:
- `contracts/PredictionMarketDAO.sol` (patch for integration)
- `frontend/lib/contract.ts` (add new ABIs)
- `frontend/components/ProposalList.tsx` (add market UI)

## Deployment Order

1. Deploy PredictionMarketDAO (with demo periods)
2. Deploy RepairTimelineMarket
3. Deploy RepairVerificationResolver
4. Deploy DemoTarget (optional)
5. Wire contracts:
   - `dao.setMarketContract(market)`
   - `dao.setResolverContract(resolver)`
   - `market.setResolver(resolver)`

## Status

- [x] Contracts created
- [ ] PredictionMarketDAO patched
- [ ] Contracts compiled
- [ ] Deployment script created
- [ ] Frontend integration
- [ ] Backend integration
- [ ] End-to-end testing
