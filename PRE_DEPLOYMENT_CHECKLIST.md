# Pre-Deployment Checklist

## 🔴 Critical Issues to Fix

### 1. **Contract Deployment** (Required First)
- [ ] Deploy contracts to Celo Mainnet
- [ ] Update `src/lib/contractConfig.ts` with deployed addresses
- [ ] Verify contract addresses are correct

**Required Info:**
- Private key for deployment wallet (must have CELO for gas)
- cUSD address: `0x765DE816845861e75A25fCA122bb6898B8B1282a` (already set)

**Deployment Command:**
```bash
pnpm deploy
```

### 2. **Environment Variables** (Required)
Create `.env` file with (or copy from `.env.example`):

```env
# REQUIRED: For contract deployment
PRIVATE_KEY=your_private_key_here

# REQUIRED: For frontend (add to Vercel too)
VITE_CELO_RPC_URL=https://forno.celo.org
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# REQUIRED: For AI insights and chatbot (Google Gemini)
VITE_GEMINI_API_KEY=AIza-your-api-key-here

# OPTIONAL: For IPFS uploads
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY=gateway.pinata.cloud

# OPTIONAL: For contract verification
CELOSCAN_API_KEY=your_celoscan_api_key
```

**How to get WalletConnect Project ID:**
1. Go to https://cloud.walletconnect.com
2. Sign up / Log in
3. Create a new project
4. Copy the Project ID

**How to get Pinata JWT (for IPFS):**
1. Go to https://app.pinata.cloud
2. Sign up / Log in
3. Go to API Keys
4. Create a new JWT token
5. Copy the token

### 3. **Fix Code Issues** (Required)
- [x] Fixed `PaymentGate.tsx` - removed `hasLifetime` reference
- [x] Fixed `useBalance` hook - added explicit chainId
- [ ] Test all transaction flows
- [ ] Test wallet connection
- [ ] Test subscription flow
- [ ] Test check-in flow

### 4. **Build & Test Locally** (Required)
```bash
# Build production bundle
pnpm build

# Preview production build
pnpm preview

# Test everything works:
# - Wallet connection
# - Subscription
# - Check-in
# - Transactions
```

## 📋 Information to Collect Before Deployment

### Contract Deployment Info
- [ ] Deployer wallet private key (keep secure!)
- [ ] Deployer wallet address (for verification)
- [ ] Contract addresses after deployment:
  - [ ] InsightToken address
  - [ ] InsightsPayment address
- [ ] Deployment transaction hashes
- [ ] Contract verification status

### Frontend Environment Variables
- [ ] `VITE_CELO_RPC_URL` - Celo RPC endpoint
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- [ ] `VITE_PINATA_JWT` - Pinata JWT token (for IPFS)
- [ ] `VITE_PINATA_GATEWAY` - Pinata gateway URL (optional)

### Vercel Deployment Info
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] GitHub repository (if using Git integration)
- [ ] Production domain name (Vercel will provide)
- [ ] Environment variables set in Vercel dashboard

### Farcaster Integration (Optional)
- [ ] WalletConnect Project ID (same as above)
- [ ] Production URL (from Vercel)
- [ ] Farcaster Mini App registration (if using)

## 🚀 Deployment Steps

### Step 1: Deploy Contracts
```bash
# 1. Set up .env file with PRIVATE_KEY
# 2. Deploy contracts
pnpm deploy

# 3. Save contract addresses from output
# 4. Verify contracts on Celoscan (optional)
```

### Step 2: Update Frontend Config
- [ ] Verify `src/lib/contractConfig.ts` has correct addresses
- [ ] Verify ABIs are in `src/lib/` folder
- [ ] Test locally with `pnpm dev`

### Step 3: Build & Test
```bash
# Build
pnpm build

# Preview
pnpm preview

# Test everything:
# - Wallet connection ✅
# - Chain switching ✅
# - Subscription ✅
# - Check-in ✅
# - Transactions ✅
```

### Step 4: Deploy to Vercel
```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - VITE_CELO_RPC_URL
# - VITE_WALLETCONNECT_PROJECT_ID
# - VITE_PINATA_JWT (if using IPFS)
```

### Step 5: Post-Deployment
- [ ] Test production URL
- [ ] Test wallet connection
- [ ] Test transactions
- [ ] Update Farcaster meta tags (if using)
- [ ] Register as Farcaster Mini App (if using)

## ✅ Testing Checklist

### Wallet Connection
- [ ] MetaMask connects
- [ ] WalletConnect connects
- [ ] Chain switches to Celo automatically
- [ ] Disconnect works

### Subscription Flow
- [ ] View subscription page
- [ ] Click "Subscribe"
- [ ] Approve cUSD allowance
- [ ] Complete subscription transaction
- [ ] Status updates correctly

### Check-in Flow
- [ ] Complete check-in questions
- [ ] Submit check-in (with/without fee)
- [ ] Transaction completes
- [ ] Navigate to insights

### Error Handling
- [ ] Insufficient balance shows error
- [ ] Wrong chain shows error
- [ ] Transaction rejection handled
- [ ] Network errors handled

## 🔒 Security Checklist

- [ ] No private keys in code
- [ ] No sensitive data in code
- [ ] Environment variables properly prefixed with `VITE_`
- [ ] `.env` file in `.gitignore`
- [ ] Contract owner wallet secured
- [ ] Withdrawal function tested (owner only)

## 📊 Performance Checklist

- [ ] Build size reasonable (< 5MB)
- [ ] No console errors
- [ ] Fast initial load (< 3 seconds)
- [ ] Images optimized
- [ ] Lazy loading implemented

## 🐛 Known Issues to Fix

1. **PaymentGate.tsx** - Fixed `hasLifetime` reference
2. **useBalance hook** - Fixed chainId issue
3. **Transaction prompts** - Fixed with `writeAsync`
4. **Chain detection** - Fixed with proper chainId handling

## 📝 Notes

- Contract deployment must happen BEFORE frontend deployment
- Contract addresses must be updated in `contractConfig.ts`
- Environment variables must be set in Vercel dashboard
- Test production build locally before deploying
- Keep private keys secure and never commit to Git

