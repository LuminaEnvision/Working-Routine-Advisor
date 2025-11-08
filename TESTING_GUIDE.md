# Local Testing Guide

## Quick Start

### 1. Development Server (Hot Reload)
```bash
# Start dev server
pnpm dev

# Opens at http://localhost:5173
# Hot reload enabled - changes appear instantly
```

**Use this for:**
- Active development
- Quick iterations
- Component testing
- UI tweaks

### 2. Production Build Preview
```bash
# Build production bundle
pnpm build

# Preview production build
pnpm preview

# Opens at http://localhost:4173
```

**Use this for:**
- Testing exact production build
- Performance testing
- Final checks before deployment
- **Always test this before deploying!**

## Testing Checklist

### Wallet Connection Tests

1. **MetaMask Connection**
   ```bash
   # Start dev server
   pnpm dev
   ```
   - Open http://localhost:5173
   - Click "Connect Wallet"
   - Select MetaMask
   - Approve connection
   - Verify wallet address displays

2. **Network Switch**
   - Ensure MetaMask is on Celo Mainnet
   - If not, add Celo network:
     - Network Name: `Celo Mainnet`
     - RPC URL: `https://forno.celo.org`
     - Chain ID: `42220`
     - Currency Symbol: `CELO`
     - Block Explorer: `https://celoscan.io`

3. **WalletConnect (if configured)**
   - Click "Connect Wallet"
   - Select WalletConnect
   - Scan QR code with mobile wallet
   - Verify connection

### Subscription Flow Tests

1. **View Subscription Status**
   - Navigate to `/subscribe` or `/profile`
   - Connect wallet
   - Verify status shows "Not Subscribed"

2. **Subscribe (Monthly)**
   - Click "Subscribe" button
   - Approve cUSD allowance (first time)
   - Approve subscription transaction
   - Wait for confirmation
   - Verify status updates to "Active until [date]"

3. **Lifetime Access**
   - Click "Buy Lifetime" button
   - Approve transaction
   - Verify status updates to "Lifetime Access ✅"

4. **Renew Subscription**
   - If already subscribed, click "Renew Subscription"
   - Approve transaction
   - Verify expiry date extends

### Daily Check-in Tests

1. **Without Subscription**
   - Ensure wallet is NOT subscribed
   - Navigate to `/daily-checkin`
   - Connect wallet
   - Complete all questions
   - Click "Submit Check-in"
   - Approve 0.1 CELO payment
   - Verify transaction success

2. **With Subscription**
   - Ensure wallet IS subscribed
   - Navigate to `/daily-checkin`
   - Complete all questions
   - Click "Submit Check-in"
   - Should NOT require payment
   - Verify transaction success

### Farcaster Integration Tests

1. **Sign In**
   - Navigate to `/profile` or `/`
   - Click "Sign in with Farcaster"
   - Complete Farcaster auth flow
   - Verify profile displays:
     - Username
     - Avatar (if available)
     - Follower count
     - Following count
     - FID

2. **Sign Out**
   - Click "Disconnect Farcaster"
   - Verify profile clears

### Profile Page Tests

1. **View Profile**
   - Navigate to `/profile`
   - Verify wallet address displays
   - Verify subscription status
   - Verify Farcaster status (if connected)

2. **Subscription Actions**
   - Test "Renew Monthly" button
   - Test "Upgrade Lifetime" button
   - Verify buttons disabled when lifetime active

### Recommendations Page Tests

1. **Without Access**
   - Ensure wallet is NOT subscribed
   - Navigate to `/recommendations`
   - Verify shows "Premium Feature" lock
   - Click "Unlock Insights"
   - Should navigate to `/subscribe`

2. **With Access**
   - Ensure wallet IS subscribed
   - Navigate to `/recommendations`
   - Verify shows subscription status
   - Verify shows "Coming Soon" message

### Mobile Testing

1. **Open on Mobile Device**
   ```bash
   # Find your local IP
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Start dev server (accessible on network)
   pnpm dev --host
   ```

2. **Test on Mobile**
   - Open `http://YOUR_IP:5173` on mobile browser
   - Test wallet connection
   - Test responsive layout
   - Test touch interactions

### Production Build Testing

```bash
# Build
pnpm build

# Check for errors
# Should see: "dist/index.html" created

# Preview
pnpm preview

# Test in browser
# Open http://localhost:4173

# Test all routes:
# - http://localhost:4173/
# - http://localhost:4173/subscribe
# - http://localhost:4173/profile
# - http://localhost:4173/daily-checkin
# - http://localhost:4173/recommendations
```

## Common Issues & Solutions

### Issue: Wallet Won't Connect
**Solution:**
- Check WalletConnect Project ID is set
- Check MetaMask is installed
- Check network is Celo Mainnet
- Check browser console for errors

### Issue: Transaction Fails
**Solution:**
- Ensure wallet has CELO for gas
- Ensure wallet has cUSD for subscription
- Check contract addresses are correct
- Check you're on Celo Mainnet

### Issue: Build Fails
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Try building again
pnpm build
```

### Issue: Environment Variables Not Working
**Solution:**
- Ensure variables start with `VITE_`
- Create `.env.local` file (not `.env`)
- Restart dev server after adding variables
- Check variable names match exactly

### Issue: Routes Don't Work in Preview
**Solution:**
- This is normal for SPA routing
- Vercel handles this with `vercel.json`
- Test routes in dev server, not preview
- Or use a local server that supports SPA routing

## Testing on Different Networks

### Testnet Testing (Optional)
If you want to test on Alfajores testnet:

1. Update `src/lib/wagmi-config.ts`:
   ```typescript
   import { celoAlfajores } from 'wagmi/chains';
   
   export const wagmiConfig = createConfig({
     chains: [celoAlfajores], // Change to testnet
     // ...
   });
   ```

2. Get testnet tokens:
   - Visit https://faucet.celo.org/alfajores
   - Request test CELO and cUSD

3. Deploy contracts to testnet:
   ```bash
   pnpm exec hardhat run scripts/deploy.cjs --network celoAlfajores
   ```

## Performance Testing

### Check Build Size
```bash
pnpm build
du -sh dist/
```

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit on `http://localhost:4173` (preview)
4. Check:
   - Performance score
   - Accessibility score
   - Best practices
   - SEO score

## Final Pre-Deployment Test

Before deploying, run this complete test:

```bash
# 1. Build
pnpm build

# 2. Preview
pnpm preview

# 3. Test in browser:
# - [ ] Homepage loads
# - [ ] Wallet connects
# - [ ] Subscription works
# - [ ] Check-in works
# - [ ] Farcaster auth works
# - [ ] All routes work
# - [ ] No console errors
# - [ ] Mobile responsive
```

If all tests pass, you're ready to deploy! 🚀

