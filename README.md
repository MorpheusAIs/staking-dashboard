# Morpheus Capital Staking Dashboard

A Next.js-based decentralized application (dApp) for Morpheus Staking Functionality.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- MetaMask or compatible Web3 wallet
- RPC access

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd staking-dashboard

# Install dependencies
npm install
# or
pnpm install

# Run development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## ⚙️ Configuration (IMPORTANT!)

### 1. Configure Your Referrer Address

**This is the FIRST and MOST IMPORTANT step!**

Edit `src/lib/configs/capital.config.ts` and update the referrer address:

```typescript
export const CAPITAL_CONFIG = {
  referrerAddress: "YOUR_ETHEREUM_ADDRESS_HERE" as `0x${string}`,
  // ...
}
```

**Example:**
```typescript
referrerAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as `0x${string}`,
```

This address will receive referral rewards when users stake through your interface.


### 2. Environment Variables (Optional)

Create a `.env.local` file if you need custom RPC endpoints:

```bash
NEXT_PUBLIC_ALCHEMY_MAINNET_RPC_URL
NEXT_PUBLIC_PROJECT_ID
```

## 📦 Features

### Capital Staking
- ✅ Stake multiple tokens (stETH, USDC, USDT, wBTC, wETH)
- ✅ Flexible lock periods (minimum 90 days)
- ✅ Earn MOR rewards
- ✅ Lock period multipliers for higher rewards
- ✅ Real-time balance updates
- ✅ Transaction status tracking

### Subnet Staking
- 🔧 Builder subnet staking support
- 🔧 Stake and withdraw functionality
- 🔧 Subnet statistics and APR tracking

## 🏗️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Smart Contract Integration:** wagmi v2, viem
- **Wallet Connection:** Reown AppKit (WalletConnect v3)
- **UI Library:** Chakra UI v3
- **Language:** TypeScript
- **Blockchain:** Ethereum Mainnet

## 📁 Project Structure

```
staking-dashboard/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── capital/           # Capital staking page
│   │   └── subnet/            # Subnet staking page
│   ├── components/            # Reusable UI components
│   ├── containers/            # Page-level containers
│   │   ├── CapitalStaking/   # Capital staking logic
│   │   └── SubnetStaking/    # Subnet staking logic
│   ├── hooks/                 # Custom React hooks
│   │   ├── useCapitalStakingBalance.ts
│   │   ├── useMORBalances.ts
│   │   └── useStaking.ts
│   ├── lib/
│   │   ├── abi/              # Smart contract ABIs
│   │   ├── configs/          # Configuration files
│   │   │   └── capital.config.ts  # ⚠️ Configure referrer here!
│   │   └── helpers.ts
│   └── @types/               # TypeScript type definitions
├── public/                    # Static assets
├── CONFIGURATION.md          # Detailed configuration guide
└── README.md                 # This file
```

## 🔑 Key Configuration Files

| File | Purpose | Action Required |
|------|---------|----------------|
| `src/lib/configs/capital.config.ts` | Capital staking settings | Update referrer address** |
| `src/lib/configs/subnet.config.ts` | Subnet staking settings | Update address of your subnet |
| `src/lib/configs/constants.tsx` | Chain IDs and ABIs | No changes needed |
| `src/lib/networks.ts` | Network configurations | No changes needed |

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
