# 🚀 TARS DAO - Decentralized Autonomous Organization

A fully TypeScript-based DAO built on ADI Testnet for community-driven cause funding and governance.

## ✨ Features

- **Dual Role System**: Join as Verifier (stake 0.1 ADI) or Agent (no stake)
- **Cause Creation**: Submit causes with image verification
- **Verification System**: Requires 3 verifier approvals before voting
- **Token-Weighted Voting**: Vote with TARS governance tokens
- **Automated Execution**: Execute approved causes after voting period
- **Full TypeScript**: Type-safe smart contract interactions

## 📁 Project Structure

```
doa_adi/
├── contracts/          # Solidity smart contracts
├── scripts/           # TypeScript deployment scripts
├── test/              # TypeScript contract tests
├── typechain-types/   # Generated TypeScript types
└── frontend/          # Next.js 14 + TypeScript
    ├── app/           # App router pages
    ├── components/    # React components
    └── lib/           # Contract ABI and config
```

## 🛠️ Prerequisites

- Node.js 18+
- MetaMask or compatible Web3 wallet
- ADI testnet tokens (minimum 0.1 ADI to join as verifier)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd doa_adi

# Install Hardhat dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add:
# - PRIVATE_KEY: Your wallet private key (for deployment)
# - ADI_TESTNET_RPC: ADI testnet RPC URL
# - CHAIN_ID: ADI testnet chain ID
```

### 3. Update Network Configuration

Edit `hardhat.config.ts` and update:
- ADI testnet RPC URL
- Chain ID
- Gas settings (if needed)

Edit `frontend/app/providers.tsx` and update:
- ADI testnet chain ID (line 11)
- RPC URL (line 16)
- Block explorer URL (line 19)
- WalletConnect Project ID (line 25) - Get from https://cloud.walletconnect.com

### 4. Compile Contracts

```bash
npm run compile
```

This generates TypeScript types in `typechain-types/`

### 5. Run Tests

```bash
npm run test
```

### 6. Deploy to ADI Testnet

```bash
# Ensure you have ADI testnet tokens
npm run deploy
```

After deployment:
1. Copy the contract address
2. Update `frontend/lib/contract.ts` - Set `CONTRACT_ADDRESS`
3. Update `.env` - Set `NEXT_PUBLIC_CONTRACT_ADDRESS`

### 7. Run Frontend

```bash
npm run dev
```

Visit http://localhost:3000

## 📖 How to Use

### Join the DAO

1. **Connect Wallet**: Click "Connect Wallet" button
2. **Choose Role**:
   - **Verifier**: Stake 0.1 ADI → Receive 100 TARS tokens
   - **Agent**: No stake → Receive 50 TARS tokens
3. **Confirm Transaction**

### Create a Cause

1. Must be a Verifier or Agent
2. Fill in:
   - Image hash/identifier
   - Description
   - Requested amount (in ADI)
   - Beneficiary address
3. Submit transaction
4. Note the Cause ID from transaction logs

### Verify a Cause

1. Must be a Verifier
2. Enter Cause ID
3. Select "Verify Cause"
4. Submit transaction
5. Needs 3 verifications to proceed to voting

### Vote on a Cause

1. Must be Verifier or Agent
2. Enter Cause ID
3. Select "Vote Yes" or "Vote No"
4. Voting power = your TARS token balance
5. Voting period: 3 days

### Execute a Cause

1. Anyone can execute after voting ends
2. Requirements:
   - 3+ verifications
   - More approval than disapproval votes
   - Sufficient DAO balance
3. Funds sent to beneficiary automatically

## 📊 Contract Details

- **Token**: TARS (ERC20 governance token)
- **Minimum Stake**: 0.1 ADI (for verifiers)
- **Verification Threshold**: 3 verifiers
- **Voting Period**: 3 days (259,200 seconds)
- **Initial Supply**: 1,000,000 TARS

## 🔒 Security Features

- ReentrancyGuard on fund transfers
- Role-based access control (AccessControl)
- Time-locked voting periods
- Verification requirements before voting
- Token-weighted voting system

## 🧪 Development

### Run Local Hardhat Node

```bash
npx hardhat node
```

### Deploy to Local Network

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### Run Tests with Coverage

```bash
npx hardhat coverage
```

### Generate TypeScript Types

```bash
npm run compile
```

Types are generated in `typechain-types/`

## 🌐 Get ADI Testnet Tokens

Visit the ADI testnet faucet:
- https://faucet-testnet.adi.network (update with actual URL)

## 🐛 Troubleshooting

### "Insufficient stake" error
- Ensure you're sending at least 0.1 ADI when joining as verifier

### "Not authorized" error
- You must join the DAO first (as Verifier or Agent)

### Transaction fails
- Check you have enough ADI for gas fees
- Verify contract address is correct in `frontend/lib/contract.ts`
- Ensure you're connected to ADI testnet

### TypeScript errors
- Run `npm run compile` to regenerate types
- Check `typechain-types/` directory exists

## 📝 License

MIT
