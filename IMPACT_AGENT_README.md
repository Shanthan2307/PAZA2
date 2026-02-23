# Social Impact Agent Integration Guide

## Overview

The Social Impact Agent automatically reads photo analysis files from the `details/analysis/` directory and creates DAO proposals based on the analysis data.

## Directory Structure

```
doa_adi/
├── details/
│   ├── analysis/                   # JSON analysis files
│   │   ├── analysis-2026-02-20T17-38-13-802Z.json
│   │   └── ...
│   └── photos/                     # Original photos
│       └── ...
├── src/
│   ├── social-impact/
│   │   ├── actions/
│   │   │   └── create-proposal.action.ts  # ✅ Modified for local files
│   │   ├── mock-eliza.ts           # Mock @elizaos/core
│   │   └── ...
│   └── run-impact-agent.ts         # Entry point script
├── processed-files.json            # Tracks processed analyses
└── .env                            # Configuration
```

## Configuration

Your `.env` file is already configured with:

```bash
# DAO Configuration
DAO_CHAIN_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
DAO_CHAIN_ID=99999
CREATE_PROPOSAL_PRIVATE_KEY=your-private-key-here
DAO_CONTRACT_ADDRESS=0x41791E1A83dFd0Eda28cC2A91FcB3AfB4722ffC4
```

## Analysis File Format

Each JSON file in `details/analysis/` should have this structure:

```json
{
  "metadata": {
    "timestamp": "2025-02-07T23:27:43.000Z",
    "location": {
      "coordinates": { "lat": 42.328, "lng": -71.133 },
      "address": "Boylston Street",
      "city": "Brookline",
      "state": "Massachusetts",
      "country": "United States"
    }
  },
  "analysis": {
    "description": "Description of the situation...",
    "confidence": 85
  },
  "context": {
    "weather": {
      "temperature": 22,
      "conditions": "Clear"
    }
  },
  "impactAssessment": {
    "score": 85,
    "category": "Infrastructure",
    "urgency": "High",
    "estimatedImpact": "Affects 5000+ residents",
    "recommendedActions": [
      "Immediate safety inspection",
      "Community engagement"
    ]
  }
}
```

## How It Works

1. **Scans** `details/analysis/` for JSON files
2. **Filters** out already processed files (tracked in `processed-files.json`)
3. **Validates** each analysis file structure
4. **Creates** a DAO proposal with formatted description
5. **Submits** to your SimpleDAO contract on ADI testnet
6. **Records** the proposal ID and transaction hash

## Running the Agent

### Option 1: Using npm script

```bash
npm run impact-agent
```

### Option 2: Direct execution

```bash
npx ts-node src/run-impact-agent.ts
```

## Expected Output

```
[INFO] Starting Social Impact Agent...
==================================================
[INFO] Found 1 analysis file(s) in /path/to/details/analysis
[INFO] Configuration:
[INFO]   RPC URL: https://rpc.ab.testnet.adifoundation.ai/
[INFO]   Chain ID: 99999
[INFO]   DAO Contract: 0x41791E1A83dFd0Eda28cC2A91FcB3AfB4722ffC4
==================================================
[INFO] Processing analyses and creating proposals...

[INFO] Reading analysis file: analysis-2026-02-20T17-38-13-802Z.json
[INFO] Successfully validated analysis data structure
[INFO] Creating proposal on chain...
[INFO] Contract: 0x41791E1A83dFd0Eda28cC2A91FcB3AfB4722ffC4
[INFO] Transaction sent: 0x...
[INFO] Transaction confirmed in block 12345

==================================================
RESULTS:
==================================================

Proposal 1:
  ✅ Success
  Proposal ID: 0x...
  Transaction: 0x...
  File: analysis-2026-02-20T17-38-13-802Z.json

==================================================
Impact Agent completed successfully
Check processed-files.json for tracking
==================================================
```

## Proposal Format

The agent creates proposals with this format:

```
Impact Initiative Proposal

Location: Brookline, Massachusetts, United States
Coordinates: 42.328, -71.133
Impact Score: 13
Urgency: medium
Category: winter landscapes
Verification Status: Verified via local analysis

Description:
[Full analysis description]

Current Conditions:
- Weather: N/A (N/A°C)

Estimated Impact:
To be assessed by DAO members

Recommended Actions:
- Document current conditions
- Engage local stakeholders
- Create DAO proposal for resource allocation
- Monitor progress and impact

Evidence:
- Analysis File: analysis-2026-02-20T17-38-13-802Z.json
- Confidence Score: 5%

Verification Details:
This proposal has been automatically generated from verified local analysis data.
All information has been validated and can be independently reviewed.
```

## Tracking Processed Files

The agent maintains `processed-files.json` to track which analyses have been converted to proposals:

```json
[
  {
    "filename": "analysis-2026-02-20T17-38-13-802Z.json",
    "proposalId": "0x...",
    "timestamp": "2026-02-20T18:00:00.000Z",
    "status": "success",
    "txHash": "0x..."
  }
]
```

## Verifying Proposals

### On Block Explorer

Visit: https://explorer.ab.testnet.adifoundation.ai/address/0x41791E1A83dFd0Eda28cC2A91FcB3AfB4722ffC4

### In Frontend

1. Start the frontend: `npm run dev`
2. Visit http://localhost:3000
3. Connect your wallet
4. Go to "Vote on Proposals"
5. Enter the Proposal ID from the agent output
6. View and vote on the proposal

## Troubleshooting

### "Cannot read analysis directory"

**Solution:** Ensure `details/analysis/` exists and contains JSON files

```bash
ls -la details/analysis/
```

### "DAO_CHAIN_RPC_URL not configured"

**Solution:** Check your `.env` file has all required variables

```bash
cat .env | grep DAO_
```

### "Contract execution reverted"

**Possible causes:**
- Wallet doesn't have enough ADI for gas
- Contract address is incorrect
- You're not a DAO member (need to join first)

**Solution:** Join the DAO first:
1. Visit http://localhost:3000
2. Connect wallet
3. Click "Join DAO (0.0001 ADI)"
4. Then run the impact agent

### "Invalid analysis data structure"

**Solution:** Ensure JSON files match the expected format. Required fields:
- `metadata.timestamp`
- `metadata.location.coordinates.lat`
- `metadata.location.coordinates.lng`
- `analysis.description`
- `impactAssessment.score`

### "Already a member" error

This is expected if you've already joined the DAO. The agent will still work.

## Adding New Analyses

1. Add new JSON files to `details/analysis/`
2. Run the agent: `npm run impact-agent`
3. Only new (unprocessed) files will be converted to proposals

## Testing the Full Flow

1. **Join the DAO** (if not already a member):
   ```bash
   npm run dev
   # Visit http://localhost:3000 and join
   ```

2. **Add an analysis file** to `details/analysis/`

3. **Run the impact agent**:
   ```bash
   npm run impact-agent
   ```

4. **Verify the proposal**:
   - Check the transaction on block explorer
   - View in frontend using the Proposal ID
   - Vote on the proposal

5. **Check tracking**:
   ```bash
   cat processed-files.json
   ```

## Key Changes Made

### ✅ Modified Files

1. **`src/social-impact/actions/create-proposal.action.ts`**
   - Changed from IPFS/Pinata to local file system
   - Reads from `details/analysis/` directory
   - Uses `processed-files.json` instead of `processed-cids.json`
   - Connects to ADI testnet instead of Arbitrum Sepolia
   - Uses SimpleDAO contract ABI

2. **`.env`**
   - Added DAO configuration variables
   - Set to your deployed SimpleDAO contract

### ✅ New Files

1. **`src/social-impact/mock-eliza.ts`**
   - Mock implementation of @elizaos/core
   - Allows standalone usage without full Eliza framework

2. **`src/run-impact-agent.ts`**
   - Entry point script
   - Validates configuration
   - Executes the proposal creation action

3. **`package.json`**
   - Added `impact-agent` script

## Next Steps

1. ✅ Configuration is complete
2. ✅ Code is modified for local files
3. ✅ Entry point script is ready
4. 🔄 Join the DAO (if needed)
5. 🔄 Run the agent: `npm run impact-agent`
6. 🔄 Verify proposals on-chain

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Verify all environment variables are set
3. Ensure you're a DAO member
4. Check you have enough ADI for gas fees
5. Verify the analysis JSON files are valid

Happy impact making! 🌍✨
