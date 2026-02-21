# PAZE Prediction Market: Quick Implementation Guide

## Overview
This guide provides actionable steps to implement prediction markets for PAZE DAO proposals.

---

## Phase 1: Smart Contract Development (Weeks 1-4)

### 1.1 ConditionalVault Contract
```solidity
// Core functionality needed:
- Deposit collateral (ADI/USDC) → Mint pToken + fToken
- Redeem winning tokens after settlement
- Burn losing tokens
- Settlement authority (DAO)
```

### 1.2 TWAPOracle Contract
```solidity
// Price tracking:
- Track best bid/ask on each trade
- Accumulate price over time
- Calculate TWAP between two timestamps
- Compare pass vs fail market TWAPs
```

### 1.3 PredictionMarketDAO Contract
```solidity
// Upgrade from SimpleDAO:
- Add market initialization on proposal creation
- Integrate TWAP comparison for finalization
- Execute proposal if pass market TWAP > fail market TWAP + 5%
- Settle conditional vaults
```

---

## Phase 2: Frontend Development (Weeks 5-8)

### 2.1 New "Markets" Tab

**Components Needed**:
```typescript
// MarketOverview.tsx
- Display all active markets
- Show pass/fail prices
- Probability indicators (price = probability)
- Volume and liquidity stats

// TradingInterface.tsx
- Mint conditional tokens
- Place buy/sell orders
- View order book
- Cancel orders

// Portfolio.tsx
- Your positions (pTokens, fTokens)
- Unrealized P&L
- Redemption interface
- Trading history
```

### 2.2 Enhanced Proposal Creation

**Add Fields**:
- Success metrics (measurable KPIs)
- Financial model (cost per beneficiary)
- Trading period duration (default: 7 days)
- Market threshold (default: 5%)

### 2.3 Analytics Dashboard

**Key Metrics**:
- Market prices over time (charts)
- Your prediction accuracy
- Reputation score
- Leaderboard

---

## Phase 3: Integration (Weeks 9-10)

### 3.1 Market Infrastructure

**Options**:
1. **Build Custom AMM**: Simple constant product (x*y=k)
2. **Use OpenBook V2**: Order book on Solana (can port to ADI)
3. **Integrate Existing DEX**: Use ADI Chain DEX infrastructure

**Recommendation**: Start with simple AMM, upgrade to order book later

### 3.2 Price Oracle

**TWAP Implementation**:
```typescript
// Pseudo-code
class TWAPOracle {
  priceAccumulator: number = 0;
  lastUpdateSlot: number = 0;
  
  updatePrice(currentPrice: number, currentSlot: number) {
    const slotsElapsed = currentSlot - this.lastUpdateSlot;
    this.priceAccumulator += currentPrice * slotsElapsed;
    this.lastUpdateSlot = currentSlot;
  }
  
  getTWAP(startSlot: number, endSlot: number): number {
    const slotsElapsed = endSlot - startSlot;
    return this.priceAccumulator / slotsElapsed;
  }
}
```

### 3.3 Conditional Token Flow

```
User Journey:
1. User deposits 100 ADI
2. Receives 100 pADI + 100 fADI
3. Trades fADI for pPAZE (bullish on proposal)
4. Proposal passes (pass market TWAP higher)
5. User redeems pADI for ADI, pPAZE for PAZE
6. fADI burned (worthless)
```

---

## Phase 4: Testing (Weeks 11-12)

### 4.1 Test Scenarios

**Scenario 1: Successful Proposal**
- Create test proposal
- Initialize markets
- Simulate trading (pass market higher)
- Finalize and verify execution
- Test token redemption

**Scenario 2: Failed Proposal**
- Create test proposal
- Simulate trading (fail market higher)
- Verify proposal not executed
- Test token redemption (fail tokens)

**Scenario 3: Market Manipulation Attempt**
- Large buy order in pass market
- Verify TWAP smooths out spike
- Ensure threshold not met if manipulation

### 4.2 Security Audits

**Critical Areas**:
- Conditional vault settlement logic
- TWAP calculation accuracy
- Reentrancy protection
- Access control (who can settle?)
- Token burning mechanism

---

## Quick Start: Minimal Viable Product (MVP)

### MVP Scope (4 Weeks)

**Week 1: Contracts**
- Simple conditional vault (deposit/redeem)
- Basic TWAP oracle
- Upgrade SimpleDAO with market check

**Week 2: Frontend**
- Add "Markets" tab
- Show pass/fail prices (mock data)
- Simple trading UI (mint/redeem)

**Week 3: Integration**
- Connect contracts to frontend
- Deploy to ADI testnet
- Test with real proposal

**Week 4: Polish**
- Fix bugs
- Add analytics
- Write documentation
- Launch beta

### MVP Features

**Must Have**:
- ✅ Conditional token minting
- ✅ Pass/fail market prices
- ✅ TWAP-based proposal finalization
- ✅ Token redemption

**Nice to Have** (Phase 2):
- Advanced trading features
- Reputation system
- Impact verification
- Cross-chain support

---

## Technical Stack Recommendations

### Smart Contracts
- **Language**: Solidity 0.8.x
- **Framework**: Hardhat
- **Testing**: Chai + Waffle
- **Deployment**: Hardhat Deploy

### Frontend
- **Framework**: Next.js 14 (already using)
- **Web3**: wagmi + viem (already using)
- **Charts**: Recharts or TradingView
- **State**: React Query

### Backend (Optional)
- **API**: Next.js API routes
- **Database**: PostgreSQL (for market data)
- **Caching**: Redis (for TWAP calculations)
- **Indexer**: The Graph (for historical data)

---

## Cost Estimates

### Development Costs
- Smart Contract Development: 4-6 weeks
- Frontend Development: 4-6 weeks
- Testing & Audits: 2-3 weeks
- **Total**: 10-15 weeks

### Operational Costs
- Smart Contract Audits: $20k-50k
- Infrastructure (RPC, indexer): $500-1k/month
- Liquidity Incentives: $10k-50k initial
- Marketing & Community: $5k-10k/month

---

## Risk Mitigation Checklist

### Smart Contract Risks
- [ ] Reentrancy guards on all external calls
- [ ] Access control on settlement functions
- [ ] Overflow/underflow protection (use SafeMath)
- [ ] Emergency pause mechanism
- [ ] Upgrade path (proxy pattern)

### Market Risks
- [ ] Minimum liquidity requirements
- [ ] Circuit breakers for extreme volatility
- [ ] TWAP window long enough (prevent manipulation)
- [ ] Threshold high enough (5%+ difference)
- [ ] Slippage protection for traders

### Operational Risks
- [ ] Multi-sig for DAO treasury
- [ ] Timelock for contract upgrades
- [ ] Monitoring and alerting system
- [ ] Incident response plan
- [ ] Insurance fund for bugs

---

## Success Metrics (First 3 Months)

### Adoption
- 10+ proposals with prediction markets
- 50+ active traders
- $10k+ in market volume
- 80%+ proposal success rate

### Technical
- 99.9% uptime
- <2 second trade execution
- <1% TWAP deviation from spot
- Zero critical bugs

### Community
- 100+ Discord members
- 20+ proposals created
- 5+ impact entrepreneurs
- 10+ field validators

---

## Next Steps

1. **Review this document** with core team
2. **Prioritize features** (MVP vs Phase 2)
3. **Assign developers** to contracts and frontend
4. **Set up development environment** (ADI testnet)
5. **Create project timeline** with milestones
6. **Begin smart contract development**

---

## Resources

### Learning Materials
- [Futarchy Explained](https://blog.ethereum.org/2014/08/21/introduction-futarchy)
- [Conditional Tokens](https://docs.gnosis.io/conditionaltokens/)
- [TWAP Oracles](https://docs.uniswap.org/contracts/v2/concepts/core-concepts/oracles)
- [Meta-DAO Docs](https://docs.themetadao.org/)

### Code References
- [Meta-DAO Contracts](https://github.com/metaDAOproject/futarchy)
- [Gnosis Conditional Tokens](https://github.com/gnosis/conditional-tokens-contracts)
- [Uniswap V2 TWAP](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol)

### Community
- PAZE Discord: [Create channel]
- ADI Foundation: https://www.adi.foundation/
- Futarchy Research: https://mason.gmu.edu/~rhanson/futarchy.html

---

*Ready to build the future of social impact governance!*
