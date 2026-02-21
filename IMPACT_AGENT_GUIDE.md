# 🤖 Impact Agent Usage Guide

## ✅ System Status

The Impact Agent is working correctly and pushing proposals to PredictionMarketDAO!

---

## 📊 Recent Proposals Created

### Proposal 1: Brookline, MA
- **Title**: "Assess Frozen Lake Impact in Brookline, MA"
- **ID**: `0xf35755f387bab7c5b5730ef4dd20f5f7dfb2aa1ce64e3bd4302685c96242fa97`
- **Location**: Brookline, Massachusetts
- **Amount**: 5,000 ADI
- **Issue Type**: Social
- **Severity**: Medium

### Proposal 2: Manhattan, NY
- **Title**: "Improving Infrastructure and Community Spaces in Manhattan"
- **ID**: `0xedf736834eddfdf18de6d61cdf277460ef7330fa43816a24ef5df6445198b397`
- **Location**: New York, New York
- **Amount**: 5,000 ADI
- **Issue Type**: Infrastructure
- **Severity**: High

---

## 🚀 How to Use

### Run the Impact Agent

```bash
npm run impact-agent
```

### What It Does

1. ✅ Scans `details/analysis/` for new JSON files
2. ✅ Enhances metadata with Claude AI (if API key available)
3. ✅ Uploads full data to IPFS via Pinata
4. ✅ Creates proposal on PredictionMarketDAO
5. ✅ Tracks processed files in `processed-files-pm.json`

---

## 📁 File Tracking

The agent tracks processed files to avoid duplicates:

**Tracking File**: `processed-files-pm.json`

```json
[
  {
    "filename": "analysis-2026-02-20T17-38-13-802Z.json",
    "proposalId": "0xf35755f387bab7c5b5730ef4dd20f5f7dfb2aa1ce64e3bd4302685c96242fa97",
    "timestamp": "2026-02-21T07:25:56.246Z",
    "status": "success",
    "txHash": "0x752aff3b2b9b956f43dcf8828b371f510f44e78d8009f5fe8ed994e59b339209",
    "ipfsCID": "QmZ1U5D76oRAbriaTkjB6hh1W5NL1J3wYCSpqgocfqm8jh"
  }
]
```

---

## 📝 Adding New Analysis Files

### Option 1: Create New Analysis File

Place a new JSON file in `details/analysis/` with this structure:

```json
{
  "metadata": {
    "timestamp": "2026-02-21T07:30:00.000Z",
    "location": {
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "city": "New York",
      "state": "New York",
      "country": "United States"
    },
    "hash": "0xabcdef..."
  },
  "analysis": {
    "description": "Detailed description of the situation...",
    "confidence": 85
  },
  "impactAssessment": {
    "score": 75,
    "category": "Infrastructure",
    "urgency": "high",
    "estimatedImpact": "Impact description...",
    "recommendedActions": [
      "Action 1",
      "Action 2"
    ]
  }
}
```

### Option 2: Reset Tracking (For Testing)

To reprocess existing files:

```bash
# Backup current tracking
cp processed-files-pm.json processed-files-pm.backup.json

# Clear tracking
echo "[]" > processed-files-pm.json

# Run agent again
npm run impact-agent
```

---

## 🎯 Claude AI Enhancement

The agent uses Claude AI to enhance metadata:

**With API Key**:
- Generates compelling titles
- Creates structured descriptions
- Estimates funding requirements
- Categorizes issue types
- Assesses severity levels

**Without API Key** (Fallback):
- Uses basic title format
- Uses raw description
- Default funding: 1,000 ADI
- Default issue type: Social
- Default severity: Medium

---

## 📊 Proposal Metadata Generated

Each proposal includes:

- ✅ **Title**: AI-generated or formatted
- ✅ **Description**: Enhanced with situation/solution/impact
- ✅ **Location**: Human-readable format
- ✅ **Coordinates**: Lat/Lng (stored as fixed-point)
- ✅ **Requested Amount**: AI-estimated or default
- ✅ **Beneficiary**: Wallet address
- ✅ **Property ID**: Generated from coordinates
- ✅ **Evidence Hash**: From metadata or generated
- ✅ **Verification Confidence**: 0-100 score
- ✅ **Issue Type**: 0-6 enum (Environmental, Infrastructure, etc.)
- ✅ **Severity**: 0-3 enum (Low, Medium, High, Critical)
- ✅ **IPFS CID**: Full data stored on IPFS
- ✅ **Market ID**: Auto-generated for prediction markets

---

## 🔍 Verifying Proposals

### Check On-Chain

```bash
# Verify specific proposal
npx hardhat run scripts/verify-new-proposal.ts --network adiTestnet
```

### View in Frontend

1. Open http://localhost:3001
2. Connect MetaMask
3. Navigate to proposals list
4. See your newly created proposals!

---

## ⚠️ Troubleshooting

### "No new analyses found"

**Cause**: All files in `details/analysis/` have been processed

**Solution**:
1. Add a new analysis JSON file, OR
2. Clear `processed-files-pm.json` to reprocess

### "Failed to upload to Pinata"

**Cause**: Invalid Pinata JWT or network issue

**Solution**:
1. Check `PINATA_JWT` in `.env`
2. Verify Pinata account is active
3. Check internet connection

### "Transaction failed"

**Cause**: Insufficient gas or invalid data

**Solution**:
1. Check wallet has enough ADI for gas
2. Verify all required fields in analysis JSON
3. Check RPC URL is correct

---

## 📈 Statistics

### Current Status
- **Proposals Created**: 2
- **Total Funding Requested**: 10,000 ADI
- **Issue Types**: Social (1), Infrastructure (1)
- **Severities**: Medium (1), High (1)
- **Success Rate**: 100%

### IPFS Storage
- **Files Uploaded**: 2
- **Storage Provider**: Pinata
- **CIDs Generated**: 2

---

## 🎯 Next Steps

1. **Add More Analyses**: Place new JSON files in `details/analysis/`
2. **Run Agent**: `npm run impact-agent`
3. **Verify**: Check proposals on-chain
4. **Launch Markets**: Use frontend to launch prediction markets
5. **Vote**: DAO members can vote on proposals

---

## 📚 Related Documentation

- [PredictionMarketDAO Contract](./contracts/PredictionMarketDAO.sol)
- [Market Escrow](./ESCROW_VERIFIED.md)
- [Claude AI Integration](./CLAUDE_AI_VERIFIED.md)
- [Deployment Guide](./DEPLOYMENT_COMPLETE.md)

---

**Status**: ✅ FULLY OPERATIONAL

The Impact Agent is working correctly and ready to process new analysis files!
