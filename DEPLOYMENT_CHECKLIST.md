# Deployment Checklist - Working Routine Advisor MVP

## ✅ Pre-Deployment Checklist

### 1. Contract Deployment (Celo Mainnet)

- [ ] **Deploy InsightToken Contract**
  ```bash
  npx hardhat run scripts/deploy.cjs --network celo
  ```
  - Save the deployed address
  - Verify on CeloScan: https://celoscan.io/
  - Update `src/lib/contractConfig.ts` with the address

- [ ] **Deploy InsightsPayment Contract**
  - Use the InsightToken address from above
  - Save the deployed address
  - Verify on CeloScan
  - Update `src/lib/contractConfig.ts` with the address

- [ ] **Grant MINTER_ROLE to InsightsPayment**
  - The deployment script should do this automatically
  - Verify: Check that InsightsPayment can mint InsightToken

- [ ] **Verify Contracts on CeloScan**
  - InsightToken: https://celoscan.io/address/[ADDRESS]
  - InsightsPayment: https://celoscan.io/address/[ADDRESS]
  - Check that all functions are visible

### 2. Environment Variables

Create a `.env.production` file or set in Vercel:

```env
# Celo RPC (use public RPC or your own)
VITE_CELO_RPC_URL=https://forno.celo.org

# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Pinata IPFS (for check-in data storage)
VITE_PINATA_JWT=your_pinata_jwt_here

# Contract Addresses (update after deployment)
VITE_INSIGHT_TOKEN_ADDRESS=0x...
VITE_INSIGHTS_PAYMENT_ADDRESS=0x...
VITE_CUSD_TOKEN_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
```

**Required:**
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` - Get from WalletConnect Cloud
- [ ] `VITE_PINATA_JWT` - Get from Pinata dashboard
- [ ] Contract addresses (after deployment)

**Optional:**
- [ ] `VITE_CELO_RPC_URL` - Use public RPC or your own

### 3. Frontend Build & Test

- [ ] **Build locally**
  ```bash
  npm run build
  ```
  - Check for build errors
  - Verify all assets are generated

- [ ] **Test locally with production build**
  ```bash
  npm run preview
  ```
  - Test wallet connection
  - Test check-in flow
  - Test payment (0.1 CELO)
  - Test insights page

- [ ] **Verify all routes work**
  - [ ] `/` - Home page
  - [ ] `/daily-checkin` - Check-in page
  - [ ] `/recommendations` - Insights page
  - [ ] `/profile` - Profile page

### 4. Code Cleanup

- [ ] **Remove subscription features** ✅ DONE
  - [x] Removed `/subscribe` route
  - [x] Removed subscription UI components
  - [x] Removed subscription functions from hooks
  - [x] Cleaned up subscription references

- [ ] **Verify no subscription references remain**
  ```bash
  grep -r "subscribe\|subscription" src/ --exclude-dir=node_modules
  ```
  - Should only show in contract ABI (which is fine)

### 5. Farcaster Mini App Setup

- [ ] **Register on Farcaster**
  - Go to https://warpcast.com/~/developers
  - Register your mini app
  - Get your app URL (e.g., `https://your-app.vercel.app`)

- [ ] **Update Farcaster metadata**
  - App name: "Working Routine Advisor"
  - App icon: Upload icon (512x512 PNG)
  - App URL: Your deployed Vercel URL

### 6. Deployment to Vercel

- [ ] **Connect GitHub repository to Vercel**
  - Go to https://vercel.com
  - Import your repository
  - Configure build settings:
    - Framework Preset: Vite
    - Build Command: `npm run build`
    - Output Directory: `dist`

- [ ] **Set environment variables in Vercel**
  - Add all variables from step 2
  - Make sure they're set for Production

- [ ] **Deploy**
  - Push to main branch (auto-deploys)
  - Or manually deploy from Vercel dashboard

- [ ] **Verify deployment**
  - Check that the app loads
  - Test wallet connection
  - Test check-in flow

### 7. Post-Deployment Verification

- [ ] **Test on Celo Mainnet**
  - Connect wallet (MetaMask/Farcaster)
  - Switch to Celo mainnet
  - Test check-in with 0.1 CELO payment
  - Verify transaction on CeloScan

- [ ] **Test Farcaster Mini App**
  - Open in Warpcast
  - Test wallet auto-connection
  - Test check-in flow
  - Verify rewards (50 $INSIGHT every 5 check-ins)

- [ ] **Test IPFS Storage**
  - Complete a check-in
  - Verify data is stored on IPFS
  - Check Pinata dashboard for uploads

- [ ] **Monitor for errors**
  - Check browser console
  - Check Vercel logs
  - Monitor contract interactions

### 8. Documentation

- [ ] **Update README.md**
  - Add deployment instructions
  - Add environment variables
  - Add contract addresses

- [ ] **Create user guide** (optional)
  - How to connect wallet
  - How to check in
  - How to view insights
  - How rewards work

## 🚀 Deployment Steps Summary

1. **Deploy contracts** → Get addresses → Update config
2. **Set environment variables** → WalletConnect, Pinata, contracts
3. **Build & test locally** → Verify everything works
4. **Deploy to Vercel** → Connect repo → Set env vars → Deploy
5. **Register Farcaster** → Add mini app → Set metadata
6. **Test on mainnet** → Verify all features work
7. **Monitor & iterate** → Fix any issues

## 📝 Important Notes

- **Contract addresses are immutable** - Once deployed, they can't be changed
- **Test thoroughly on testnet first** (if possible) before mainnet
- **Keep private keys secure** - Never commit them to git
- **Monitor gas costs** - Celo has low fees, but still monitor
- **Backup contract ABIs** - Keep them in version control

## 🔗 Useful Links

- CeloScan: https://celoscan.io/
- Vercel Dashboard: https://vercel.com/dashboard
- WalletConnect Cloud: https://cloud.walletconnect.com/
- Pinata Dashboard: https://app.pinata.cloud/
- Farcaster Developers: https://warpcast.com/~/developers

## ⚠️ Common Issues

1. **"Cannot read properties of undefined (reading 'chain')"**
   - Fixed: Using `publicClient` directly instead of `useBalance` hook

2. **"Function not found on ABI"**
   - Fixed: Updated ABI with missing functions (`getCheckinCount`, `getCheckinsUntilReward`)

3. **"Wallet not connecting"**
   - Check WalletConnect Project ID
   - Verify Farcaster SDK is initialized
   - Check network (must be Celo mainnet)

4. **"Transaction failing"**
   - Check user has enough CELO (0.1 CELO per check-in)
   - Verify contract addresses are correct
   - Check contract is deployed and verified

## ✅ Ready for Deployment?

Once all checkboxes are complete, you're ready to deploy! 🎉
