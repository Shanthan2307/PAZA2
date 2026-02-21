# PredictionMarketDAO Upgrade Guide

## Overview

This upgrade transforms the SimpleDAO into a comprehensive PredictionMarketDAO with rich metadata support and AI-enhanced proposal creation.

## New Proposal Metadata Structure

### On-Chain Storage (Smart Contract)

```solidity
struct ProposalMetadata {
    bytes32 proposalId;              // Unique proposal identifier
    bytes32 propertyId;              // Location/property identifier
    bytes32 evidenceHash;            // IPFS hash of evidence
    uint8 verificationConfidence;    // 0-100 confidence score
    IssueType issueType;             // Enum: 0-6
    Severity severity;               // Enum: 0-3
    bytes32 marketId;                // Prediction market ID
    uint256 resolutionDeadline;      // Outcome verification deadline
    string ipfsCID;                  // Full IPFS CID
    address proposer;                // Who created the proposal
    uint256 createdAt;               // Creation timestamp
    ProposalStatus status;           // Current status
}

struct ProposalDetails {
    string title;                    // Short descriptive title
    string description;              // Full description
    string location;                 // Human-readable location
    int256 latitude;                 // Lat * 1e6 (fixed-point)
    int256 longitude;                // Lng * 1e6 (fixed-point)
    uint256 requestedAmount;         // Funding request in wei
    address beneficiary;             // Fund recipient
}

struct ProposalVoting {
    uint256 forVotes;
    uint256 againstVotes;
    uint256 deadline;
    bool executed;
    mapping(address => bool) hasVoted;
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

enum ProposalStatus {
    PENDING,   // 0
    ACTIVE,    // 1
    EXECUTED,  // 2
    REJECTED,  // 3
    EXPIRED    // 4
}
```

## AI-Enhanced Proposal Creation Flow

### 1. Analysis File Structure

Input: `details/analysis/analysis-TIMESTAMP.json`

```json
{
  "metadata": {
    "timestamp": "2025-02-07T23:27:43.000Z",
    "location": {
      "coordinates": { "lat": 42.328, "lng": -71.133 },
      "city": "Brookline",
      "state": "Massachusetts",
      "country": "United States"
    },
    "hash": "0xd5269d12..."
  },
  "analysis": {
    "description": "Detailed scene description...",
    "confidence": 85
  },
  "impactAssessment": {
    "score": 75,
    "category": "Environmental",
    "urgency": "high",
    "estimatedImpact": "500+ families affected",
    "recommendedActions": [...]
  }
}
```

### 2. Claude AI Enhancement

The system uses Claude 3.5 Sonnet to:
- Generate compelling proposal titles
- Create structured descriptions
- Estimate funding requirements
- Map categories to IssueType enums
- Determine severity levels
- Generate unique property IDs
- Fill missing metadata fields

### 3. IPFS Upload

Full analysis data uploaded to Pinata with metadata:
- Type: social-impact-analysis
- Timestamp, category, urgency, score
- Returns IPFS CID for on-chain reference

### 4. On-Chain Proposal Creation

Enhanced metadata submitted to PredictionMarketDAO:
```typescript
createProposal(
  title,              // "Winter Emergency Relief - Brookline, MA"
  description,        // Full formatted description
  location,           // "Brookline, Massachusetts, United States"
  latitude,           // 42328000 (42.328 * 1e6)
  longitude,          // -71133000 (-71.133 * 1e6)
  requestedAmount,    // 5000000000000000000000 (5000 ADI in wei)
  beneficiary,        // 0x0000... or specific address
  propertyId,         // keccak256("PROP_42.328_-71.133")
  evidenceHash,       // 0xd5269d12... (from metadata.hash)
  verificationConfidence, // 85
  issueType,          // 0 (ENVIRONMENTAL)
  severity,           // 2 (HIGH)
  ipfsCID            // "QmXxXxXx..."
)
```

## Deployment Instructions

### 1. Install Dependencies

```bash
cd doa_adi
npm install @anthropic-ai/sdk
```

### 2. Configure Environment

Add to `.env`:
```bash
# Existing
DAO_CHAIN_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
CREATE_PROPOSAL_PRIVATE_KEY=your_private_key
CHAIN_ID=99999

# New
ANTHROPIC_API_KEY=sk-ant-...
PINATA_JWT=your_pinata_jwt
DAO_CONTRACT_ADDRESS=0x... (will be set after deployment)
```

### 3. Compile Contracts

```bash
npm run compile
```

This generates TypeChain types in `typechain-types/`

### 4. Deploy PredictionMarketDAO

```bash
npx hardhat run scripts/deploy-prediction-market-dao.ts --network adiTestnet
```

Output:
```
PredictionMarketDAO deployed to: 0x...
Deployment info saved to deployment-info.json
```

### 5. Update Configuration

Update `DAO_CONTRACT_ADDRESS` in:
- `.env`
- `frontend/lib/contract.ts`
- Agent configuration files

### 6. Update Frontend Contract ABI

Copy the new ABI from `artifacts/contracts/PredictionMarketDAO.sol/PredictionMarketDAO.json` to `frontend/lib/contract.ts`

## Usage

### Create Proposals with AI Enhancement

```bash
# Place analysis JSON files in details/analysis/
# Then run the agent action:
npm run create-proposal
```

The system will:
1. ✅ Scan for new analysis files
2. ✅ Validate data structure
3. ✅ Enhance metadata with Claude AI
4. ✅ Upload to IPFS (Pinata)
5. ✅ Create on-chain proposal
6. ✅ Track processed files

### Query Proposal Metadata

```typescript
// Get full metadata
const metadata = await contract.getProposalMetadata(proposalId);
// Returns: propertyId, evidenceHash, confidence, issueType, 
//          severity, marketId, resolutionDeadline, ipfsCID, etc.

// Get proposal details
const details = await contract.getProposalDetails(proposalId);
// Returns: title, description, location, lat, lng, 
//          requestedAmount, beneficiary

// Get voting data
const voting = await contract.getProposalVoting(proposalId);
// Returns: forVotes, againstVotes, deadline, executed
```

### Frontend Integration

```typescript
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { useReadContract } from 'wagmi';

// Read proposal metadata
const { data: metadata } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getProposalMetadata',
  args: [proposalId],
});

// Display issue type
const issueTypeString = await contract.getIssueTypeString(metadata.issueType);
// Returns: "Environmental", "Healthcare", etc.
```

## Benefits of New Structure

### 1. Rich Metadata
- Comprehensive proposal information
- Structured, queryable data
- Support for prediction markets

### 2. AI Enhancement
- Automatic metadata generation
- Consistent formatting
- Intelligent categorization
- Funding estimation

### 3. Verification Support
- Confidence scores
- Evidence hashing
- IPFS immutability
- Property tracking

### 4. Prediction Market Ready
- Market ID generation
- Resolution deadlines
- Severity/urgency tracking
- Outcome verification hooks

### 5. Better UX
- Clear titles and descriptions
- Geographic data (maps)
- Funding transparency
- Status tracking

## Migration from SimpleDAO

### Backward Compatibility

The new contract maintains core functionality:
- ✅ Member management (join/leave)
- ✅ Proposal creation
- ✅ Voting mechanism
- ✅ Execution logic

### Breaking Changes

1. **createProposal signature changed**
   - Old: `createProposal(string description)`
   - New: `createProposal(title, description, location, ...)`

2. **Proposal ID generation**
   - Now includes more fields for uniqueness
   - Uses propertyId and evidenceHash

3. **Storage structure**
   - Split into three structs (metadata, details, voting)
   - More gas-efficient for partial reads

### Migration Steps

1. Deploy new PredictionMarketDAO
2. Update agent actions to use new format
3. Migrate existing proposals (if needed)
4. Update frontend components
5. Test thoroughly on testnet

## Testing

### Unit Tests

```bash
npm run test
```

### Test Proposal Creation

```bash
# Create a test analysis file
cat > details/analysis/test-analysis.json << EOF
{
  "metadata": {
    "timestamp": "2026-02-20T12:00:00.000Z",
    "location": {
      "coordinates": { "lat": 40.7128, "lng": -74.0060 },
      "city": "New York",
      "state": "New York",
      "country": "United States"
    }
  },
  "analysis": {
    "description": "Test scenario for proposal creation",
    "confidence": 90
  },
  "impactAssessment": {
    "score": 80,
    "category": "Infrastructure",
    "urgency": "high",
    "estimatedImpact": "Test impact",
    "recommendedActions": ["Test action"]
  }
}
EOF

# Run proposal creation
npm run create-proposal
```

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"
- Get API key from https://console.anthropic.com/
- Add to `.env` file

### "Failed to upload to Pinata"
- Verify PINATA_JWT is correct
- Check Pinata account limits
- Ensure JSON is valid

### "Invalid coordinates"
- Coordinates must be numbers
- Format: { lat: 42.328, lng: -71.133 }

### "Proposal already exists"
- Check processed-files.json
- Each analysis file can only create one proposal
- Delete from processed-files.json to retry (testing only)

## Next Steps

1. **Implement Prediction Markets**
   - ConditionalVault.sol
   - TWAPOracle.sol
   - AMM.sol

2. **Add Impact Verification**
   - ImpactVerification.sol
   - Validator network
   - Outcome resolution

3. **Enhance Frontend**
   - Display rich metadata
   - Show maps with coordinates
   - Market trading interface
   - Real-time updates

4. **Integrate Analytics**
   - Proposal success rates
   - Category distribution
   - Geographic heat maps
   - Impact metrics dashboard

## Resources

- [ADI Foundation Docs](https://docs.adi.foundation/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Pinata IPFS](https://docs.pinata.cloud/)
- [Hardhat Documentation](https://hardhat.org/docs)

---

**Version**: 1.0  
**Last Updated**: February 20, 2026  
**Author**: PAZE DAO Core Team
