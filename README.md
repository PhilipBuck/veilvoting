# VeilVoting

A privacy-preserving voting dApp built on FHEVM that enables users to cast encrypted votes without exposing their choices until results are revealed.

## 🎭 Features

- **Privacy-First Voting**: All ballots are encrypted using FHEVM's homomorphic encryption
- **Multi-Option Proposals**: Create proposals with up to 10 voting options
- **Time-Bound Polls**: Set custom voting duration (1 minute to 30 days)
- **Encrypted Operations**: Vote counting and comparison happen entirely in ciphertext
- **Permissioned Decryption**: Results revealed through permissioned access
- **Seamless UX**: Glassmorphism UI with wallet integration and auto-reconnect
- **Comprehensive History**: Track all proposals and personal voting history

## 🏗️ Architecture

```
zama_voting_0003/
├── fhevm-hardhat-template/     # Smart contracts & deployment
│   ├── contracts/              # Solidity contracts
│   ├── deploy/                 # Deployment scripts
│   ├── test/                   # Test suites
│   ├── tasks/                  # CLI tasks
│   └── deployments/            # Deployment artifacts
└── veilvoting-frontend/        # Next.js frontend
    ├── app/                    # Pages & routes
    ├── components/             # UI components
    ├── hooks/                  # React hooks
    ├── fhevm/                  # FHEVM integration
    ├── abi/                    # Contract ABIs
    └── scripts/                # Build scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Hardhat development environment (for local testing)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/PhilipBuck/veilvoting.git
cd veilvoting
```

2. **Install dependencies**

```bash
# Install contract dependencies
cd fhevm-hardhat-template
npm install

# Install frontend dependencies
cd ../veilvoting-frontend
npm install
```

3. **Configure environment variables**

```bash
cd fhevm-hardhat-template
npx hardhat vars setup
```

Required variables:
- `MNEMONIC`: Wallet mnemonic phrase
- `INFURA_API_KEY`: Infura API key for Sepolia network
- `ETHERSCAN_API_KEY` (optional): For contract verification

### Local Development

1. **Start local Hardhat node**
```bash
cd fhevm-hardhat-template
npx hardhat node
```

2. **Deploy contracts locally**
```bash
cd fhevm-hardhat-template
npx hardhat deploy --network localhost
```

3. **Start frontend (Mock mode)**
```bash
cd veilvoting-frontend
npm run dev:mock
```

The app will be available at `http://localhost:3000`

### Production Deployment (Sepolia)

1. **Deploy to Sepolia**
```bash
cd fhevm-hardhat-template
npx hardhat deploy --network sepolia
```

2. **Start frontend (Relayer SDK)**
```bash
cd veilvoting-frontend
npm run dev
```

## 📜 Smart Contracts

### VeilVoting.sol

Core voting contract with the following functions:

- `createProposal()`: Create a new voting proposal with multiple options
- `vote()`: Cast an encrypted vote for a proposal
- `revealResult()`: Reveal voting statistics after proposal ends
- `revealMyVote()`: Decrypt and reveal your personal vote
- `getOptionVotes()`: Get decrypted vote counts for an option

**Key Features**:
- Uses FHEVM's `euint32` for encrypted vote counts
- Time-bound proposals with configurable duration
- Permissioned decryption via `FHE.allow()`
- Maximum 10 options per proposal

**Current Deployment**:
- **Sepolia**: `0xEbaf1f2879dceF1cd9d50BAe577EE757409BDDD2`
- [View on Etherscan](https://sepolia.etherscan.io/address/0xEbaf1f2879dceF1cd9d50BAe577EE757409BDDD2)

## 🎨 Frontend Features

### Pages

- **Home**: Recent proposals overview
- **All Proposals**: Browse all proposals with filtering (Active/Ended/Revealed)
- **Create Proposal**: Create new voting proposals
- **Proposal Details**: View proposal info, vote, and reveal results
- **Voting History**: Personal voting history with status tracking

### Components

- `WalletConnect`: Wallet connection management with auto-reconnect
- `ProposalCard`: Proposal display cards
- Glassmorphism UI design with dark mode support

### Hooks

- `useWallet`: Wallet connection and account management
- `useVeilVoting`: Contract interaction (create, vote, reveal)
- `useFhevm`: FHEVM instance management

## 🧪 Testing

### Contract Tests

```bash
cd fhevm-hardhat-template
npm test
```

### Frontend Build

```bash
cd veilvoting-frontend
npm run build
```

## 🔐 Security

- **No Secrets Exposed**: All sensitive operations use encrypted types
- **Permissioned Decryption**: Only authorized addresses can decrypt results
- **Time-Locked Results**: Results remain encrypted until proposal ends
- **Privacy by Design**: Vote counts computed entirely in ciphertext

## 🛠️ CLI Tasks

```bash
# View accounts
npx hardhat accounts

# Create proposal via CLI
npx hardhat veilVoting:create --network localhost

# Vote via CLI
npx hardhat veilVoting:vote --network localhost

# Reveal results via CLI
npx hardhat veilVoting:reveal --network localhost
```

## 📦 Tech Stack

### Smart Contracts
- Solidity 0.8.27
- Hardhat
- FHEVM 0.8
- Ethers.js v6

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Glassmorphism UI

### FHEVM Integration
- `@zama-fhe/relayer-sdk`: Production FHEVM integration
- `@fhevm/mock-utils`: Local development mocking

## 🌐 Networks

- **localhost**: Chain ID 31337 (local development)
- **sepolia**: Chain ID 11155111 (testnet)

## 📄 License

SPDX-License-Identifier: BSD-3-Clause-Clear

## 🤝 Contributing

Contributions are welcome! Please ensure all tests pass and the frontend builds successfully.

## 🙋 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using FHEVM for privacy-preserving decentralized governance**

