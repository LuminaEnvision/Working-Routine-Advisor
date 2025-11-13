# Working Routine Advisor

Working Routine Advisor (WRA) is an AI-enhanced productivity coach that guides users through daily check-ins, analyzes their responses, and delivers actionable insights. The experience is powered by smart contracts on Celo, with rewards paid in the `$INSIGHT` token every five completed check-ins.

## 🚀 Live App (V0)

- **Production (Vercel)**: https://working-routine-advisor.vercel.app/
- **Farcaster Mini App**: Add the Vercel URL as a Mini App in Warpcast to test the embedded wallet flow.

## ✨ Key Features

- **Daily Check-in Workflow**: Mobile-first questionnaire with cooldown and daily-limit enforcement (2 check-ins per day, 5-hour cooldown) managed on-chain.
- **Smart Contracts on Celo**:
  - `InsightsPayment.sol` manages one-off CELO payments and (future) subscriptions.
  - `InsightToken.sol` mints 50 `$INSIGHT` tokens every 5 check-ins.
- **Wallet Support**: Full Wagmi integration for MetaMask, WalletConnect, and automatic Farcaster Mini App wallet connection.
- **AI-Powered Insights**: OpenRouter-backed analysis (with graceful fallbacks) generating personalized recommendations, trends, and meal plans.
- **Token Rewards Dashboard**: On the Profile page, users can view streaks, check-in totals, weekly progress, reward progress, and their `$INSIGHT` balance.
- **Farcaster-Ready UX**: Mini App metadata, auto wallet detection, and tailored copy so users can launch directly inside Warpcast.
- **Responsive & Accessible UI**: Built with Tailwind CSS, Radix UI components, and optimized for Safari/Chrome on mobile and desktop.
- **IPFS Support**: Optional Pinata uploads (when configured) for storing raw check-in data.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind, Radix UI, Sonner
- **State / Data**: React Context, TanStack Query, localStorage persistence
- **Blockchain**: Wagmi, Viem, Celo mainnet contracts
- **Smart Contracts**: Solidity (Hardhat), OpenZeppelin libraries
- **AI**: OpenRouter API (with fallback prompts)

## 📦 Project Structure

```
├─ src/
│  ├─ components/       # UI components (PaymentGate, Wallet UI, etc.)
│  ├─ hooks/            # wagmi + contract interaction hooks
│  ├─ pages/            # Route-level React pages (DailyCheckIn, Profile, Recommendations)
│  ├─ lib/              # Contract config, Farcaster helpers, AI logic
│  └─ contexts/         # Check-in storage (localStorage + wallet keyed)
├─ contracts/           # Solidity contracts for payment + $INSIGHT token
├─ scripts/             # Hardhat deployment & migration scripts
└─ public/              # Farcaster well-known files, favicons, static assets
```

## 🧾 Smart Contract Addresses (Celo Mainnet)

- `InsightToken`: `0x8a24b8C6f3e35d45f7639BbcB2B802ac0c4Cd74F`
- `InsightsPayment`: `0x8BF96665c1fa2D9368EB5CcdCd25C3C92DE20c1F`
- `cUSD`: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

## ⚡ Getting Started (Local)

```bash
# install dependencies
pnpm install

# run dev server
pnpm dev

# compile contracts
pnpm compile

# run tests
pnpm test
```

Create a `.env` file with:

```
VITE_CELO_RPC_URL=https://forno.celo.org
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
VITE_OPENROUTER_API_KEY=your_openrouter_key   # optional (fallback prompts used if missing)
VITE_PINATA_JWT=your_pinata_jwt               # optional for IPFS uploads
```

## 🔒 Deployment Notes

- Vercel deploys from `main` using the Vite build (`pnpm build`).
- The Farcaster Mini App requires a `.well-known/farcaster.json` file with your domain signature.
- For contract withdrawals, run `pnpm hardhat run scripts/withdraw.cjs --network celo` from the owner account.

## 📣 Milestone: Smart Contracts Deployment & Integration

This release finalizes:

1. Contract audit for one-off payments, cooldowns, daily limits, and rewards.
2. Deployment of `InsightToken` and `InsightsPayment` to Celo mainnet.
3. Frontend integration of contract addresses and Wagmi hooks.
4. End-to-end tests for the 0.1 CELO payment flow (subscription UI deferred to V2).

---
