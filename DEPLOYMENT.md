# Deployment Guide for Daily Productivity Advisor

## Farcaster Miniapp Deployment

### 1. Prepare Your App

The app is already configured as a Farcaster miniapp with the required meta tags in `index.html`:

```html
<meta name="fc:miniapp" content='{
  "version": "1",
  "imageUrl": "https://daily-farcaster-coach.lovable.app/og-image.png",
  "button": {
    "title": "Open Advisor",
    "action": {
      "type": "launch_frame",
      "name": "Daily Productivity Advisor",
      "url": "https://daily-farcaster-coach.lovable.app",
      "splashImageUrl": "https://daily-farcaster-coach.lovable.app/icon.png",
      "splashBackgroundColor": "#ffffff"
    }
  }
}' />
```

### 2. Deploy to Production

1. **Deploy via Lovable:**
   - Click the "Publish" button in Lovable
   - Your app will be deployed to `https://your-app.lovable.app`

2. **Update URLs:**
   - Update the `url`, `imageUrl`, and `splashImageUrl` in the `fc:miniapp` meta tag
   - Replace `https://daily-farcaster-coach.lovable.app` with your actual deployment URL

3. **Add Required Images:**
   - Create an OG image (1200x630px) and save as `public/og-image.png`
   - Create an app icon (512x512px) and save as `public/icon.png`

### 3. Register on Farcaster

1. **Visit Farcaster:**
   - Go to https://warpcast.com/~/developers

2. **Register Your Miniapp:**
   - Click "Create New Miniapp"
   - Enter your app URL
   - Farcaster will automatically detect the `fc:miniapp` meta tag
   - Submit for review

3. **Testing:**
   - Before approval, test using the Frame Validator: https://warpcast.com/~/developers/frames

## CELO Smart Contract Deployment

### 1. Setup Development Environment

```bash
# Install Hardhat (if not using Remix)
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### 2. Deploy Contract Using Remix (Easiest)

1. **Visit Remix IDE:** https://remix.ethereum.org
2. **Create New File:** `InsightsPayment.sol`
3. **Paste Contract Code** from `contracts/InsightsPayment.sol`
4. **Compile:**
   - Click "Solidity Compiler" tab
   - Click "Compile InsightsPayment.sol"
5. **Deploy to CELO Alfajores (Testnet):**
   - Click "Deploy & Run Transactions" tab
   - Environment: "Injected Provider - MetaMask"
   - Connect to CELO Alfajores network
   - Click "Deploy"
   - Copy deployed contract address

6. **Deploy to CELO Mainnet:**
   - Switch MetaMask to CELO mainnet
   - Repeat deployment steps
   - Copy production contract address

### 3. CELO Network Details

**Alfajores Testnet:**
- RPC: https://alfajores-forno.celo-testnet.org
- Chain ID: 44787
- Block Explorer: https://alfajores.celoscan.io
- Faucet: https://faucet.celo.org/alfajores

**Mainnet:**
- RPC: https://forno.celo.org
- Chain ID: 42220
- Block Explorer: https://celoscan.io

### 4. Update Frontend Configuration

1. **Update Contract Address** in `src/lib/wagmi-config.ts`:
```typescript
export const INSIGHTS_CONTRACT_ADDRESS = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS' as const;
```

2. **Get WalletConnect Project ID:**
   - Visit https://cloud.walletconnect.com
   - Create a project
   - Copy Project ID
   - Update in `src/lib/wagmi-config.ts`

### 5. Testing the Integration

1. **Get Test CELO:**
   - Visit https://faucet.celo.org/alfajores
   - Paste your wallet address
   - Request test tokens

2. **Test Payment Flow:**
   - Connect wallet in the app
   - Complete 3+ check-ins
   - Navigate to Insights
   - Click "Pay & Unlock Insights"
   - Approve transaction in wallet
   - Verify access is granted

## Environment Variables (Optional)

If you need to store sensitive data, create a `.env` file:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_CONTRACT_ADDRESS=0xYourContractAddress
```

## Post-Deployment Checklist

- ✅ App deployed to production URL
- ✅ OG image and icon added to `/public`
- ✅ `fc:miniapp` meta tag updated with production URLs
- ✅ Smart contract deployed to CELO
- ✅ Contract address updated in `wagmi-config.ts`
- ✅ WalletConnect Project ID configured
- ✅ Tested on Alfajores testnet
- ✅ Registered on Farcaster Developer Portal
- ✅ Tested wallet connection
- ✅ Tested payment flow

## Support Resources

- **Farcaster Docs:** https://docs.farcaster.xyz/
- **CELO Docs:** https://docs.celo.org/
- **Wagmi Docs:** https://wagmi.sh/
- **WalletConnect:** https://walletconnect.com/
- **Lovable Docs:** https://docs.lovable.dev/

## Common Issues

**Wallet won't connect:**
- Make sure you have a CELO-compatible wallet (MetaMask, Valora, etc.)
- Check that the correct network is selected
- Verify WalletConnect Project ID is valid

**Transaction fails:**
- Ensure sufficient CELO balance for gas fees
- Check contract address is correct
- Verify you're on the correct network (testnet vs mainnet)

**Farcaster miniapp not appearing:**
- Verify meta tag syntax is correct
- Ensure images are accessible at specified URLs
- Check app is approved in Farcaster Developer Portal
