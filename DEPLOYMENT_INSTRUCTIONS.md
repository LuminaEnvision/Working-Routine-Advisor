# Contract Deployment Instructions - Mainnet

## ✅ Contract Changes Made

1. **Function Renamed**: `getCheckInStatus()` → `isInCooldown()`
   - Clearer naming: returns `true` if user is in cooldown (cannot check in)
   - Updated frontend to use new function name
   - Contract logic unchanged (just better naming)

2. **IPFS Documentation**: Added clear comment that `ipfsHash` parameter expects IPFS CID
   - Frontend now uses actual IPFS (Pinata) instead of keccak256 hash

3. **Contract Compiled**: ✅ Successfully compiled with Solidity 0.8.20

## 📋 Pre-Deployment Checklist

### Required Information

1. **Private Key** (for deployment)
   - Your deployer wallet private key
   - Must have CELO for gas fees
   - This wallet will be the contract owner

2. **cUSD Token Address** (already set)
   - Mainnet: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
   - ✅ Already configured in deploy script

3. **RPC URL** (optional)
   - Default: `https://forno.celo.org`
   - Or use your own Celo RPC endpoint

### Environment Variables Needed

Create or update your `.env` file:

```bash
# REQUIRED: Your deployer wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# REQUIRED: cUSD token address on Celo mainnet
CUSD_TOKEN_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a

# OPTIONAL: Custom Celo RPC URL (defaults to forno.celo.org)
CELO_RPC_URL=https://forno.celo.org

# OPTIONAL: For contract verification on Celoscan
CELOSCAN_API_KEY=your_celoscan_api_key
```

## 🚀 Deployment Steps

### Step 1: Verify Environment Variables

```bash
# Check that your .env file has the required variables
cat .env | grep -E "PRIVATE_KEY|CUSD_TOKEN_ADDRESS"
```

**Important**: Make sure:
- ✅ `PRIVATE_KEY` is set (your deployer wallet)
- ✅ `CUSD_TOKEN_ADDRESS` is set to mainnet address
- ✅ Your deployer wallet has CELO for gas fees (recommend at least 0.1 CELO)

### Step 2: Verify Contract Addresses

The deploy script will use:
- **cUSD**: `0x765DE816845861e75A25fCA122bb6898B8B1282a` (Celo mainnet)

### Step 3: Deploy to Mainnet

```bash
# Deploy to Celo mainnet
npm run deploy
```

Or explicitly:

```bash
npx hardhat run scripts/deploy.cjs --network celo
```

### Step 4: Verify Deployment

After deployment, the script will:
1. ✅ Deploy `InsightToken` contract
2. ✅ Deploy `InsightsPayment` contract
3. ✅ Update `src/lib/contractConfig.ts` with new addresses
4. ✅ Copy contract ABIs to `src/lib/`

**Expected Output:**
```
🚀 Deploying contracts to celo...
Deployer: 0xYourDeployerAddress
✔️ InsightToken deployed at: 0x...
✔️ InsightsPayment deployed at: 0x...
📝 Updated contract addresses at: src/lib/contractConfig.ts
📦 Copied InsightToken ABI to: src/lib/InsightToken.json
📦 Copied InsightsPayment ABI to: src/lib/InsightsPayment.json

✅ Deployment complete!
```

### Step 5: Verify Contracts on Celoscan

1. Go to https://celoscan.io
2. Search for your deployed contract addresses
3. Verify the contracts (optional but recommended)

**To verify contracts:**

```bash
# Install hardhat-verify if not already installed
npm install --save-dev @nomicfoundation/hardhat-verify

# Verify InsightsPayment contract
npx hardhat verify --network celo <INSIGHTS_PAYMENT_ADDRESS> <CUSD_ADDRESS>

# Verify InsightToken contract
npx hardhat verify --network celo <INSIGHT_TOKEN_ADDRESS> "Insight Token" "INSIGHT"
```

### Step 6: Update Frontend

After deployment:
1. ✅ Contract addresses are automatically updated in `src/lib/contractConfig.ts`
2. ✅ Contract ABIs are automatically copied to `src/lib/`
3. ✅ Frontend is already updated to use `isInCooldown()` function

**No manual frontend changes needed!** The deploy script handles everything.

## 🔐 Security Reminders

1. **Never commit `.env` file** - It contains your private key
2. **Verify private key** - Make sure it's the correct wallet
3. **Check gas fees** - Ensure deployer wallet has enough CELO
4. **Double-check addresses** - Verify cUSD address is correct for mainnet
5. **Test first** - Consider deploying to testnet first (optional)

## 📝 Post-Deployment

After successful deployment:

1. **Save the contract addresses** - They're in `src/lib/contractConfig.ts`
2. **Update your frontend** - If deploying to a new network, update RPC URLs
3. **Test the contracts** - Test check-in, subscription, and payment flows
4. **Monitor transactions** - Watch for any issues on Celoscan

## 🐛 Troubleshooting

### Error: "Missing required environment variable: CUSD_TOKEN_ADDRESS"
- **Fix**: Add `CUSD_TOKEN_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a` to `.env`

### Error: "insufficient funds for gas"
- **Fix**: Add CELO to your deployer wallet (need at least 0.1 CELO)

### Error: "nonce too high"
- **Fix**: Wait a few minutes and try again, or manually set nonce

### Error: "contract deployment failed"
- **Fix**: Check RPC URL is correct and accessible
- **Fix**: Verify Solidity version matches (0.8.20)

## ✅ What Changed in This Deployment

### Contract Changes:
- ✅ Renamed `getCheckInStatus()` → `isInCooldown()` (clearer naming)
- ✅ Added IPFS documentation comment
- ✅ No logic changes (same functionality, better naming)

### Frontend Changes:
- ✅ Updated to use `isInCooldown()` function name
- ✅ Already using IPFS (Pinata) for check-in data
- ✅ Already has cooldown check in frontend

### Breaking Changes:
- ⚠️ **Function name changed**: Old contracts using `getCheckInStatus()` will need to be updated
- ⚠️ **If you have existing contracts**: You'll need to redeploy or update frontend to use old function name

## 🎯 Ready to Deploy?

1. ✅ Contract compiled successfully
2. ✅ Frontend updated to use new function name
3. ✅ Deploy script ready
4. ✅ Environment variables configured

**You're ready!** Just run:

```bash
npm run deploy
```

Good luck! 🚀

