# Farcaster Mini App Setup Guide

## Current Status

Your app has Farcaster integration code, but it needs proper configuration to work.

## What's Missing for Farcaster Connection

### 1. **WalletConnect Project ID** (Required)
- **What it is**: A project ID from WalletConnect Cloud
- **Why needed**: Farcaster Auth Kit uses WalletConnect for wallet connections
- **How to get it**:
  1. Go to https://cloud.walletconnect.com
  2. Sign up / Log in
  3. Create a new project
  4. Copy the Project ID
  5. Add to `.env` file:
     ```
     VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
     ```

### 2. **Farcaster Mini App SDK** (Already Installed)
- ✅ Package: `@farcaster/miniapp-sdk` (version 0.1.10)
- ✅ Initialization code exists in `src/main.tsx`
- ✅ Connector setup exists in `src/lib/farcaster-connector.ts`

### 3. **Farcaster Auth Kit** (Optional - for Social Login)
- ✅ Package: `@farcaster/auth-kit` (version ^0.8.1)
- ⚠️ **Note**: This is for social login (showing Farcaster profile), not wallet connection
- The wallet connection uses the Mini App SDK, not Auth Kit

## How Farcaster Integration Works

### Wallet Connection (Primary Method)
1. **When running in Farcaster/Warpcast**:
   - The app detects it's in a Farcaster context
   - Farcaster connector is automatically added to wagmi
   - User's embedded wallet is used for transactions
   - No manual connection needed

2. **Detection Methods** (in `src/lib/farcaster-miniapp.ts`):
   - Checks for `window.farcaster.sdk`
   - Checks user agent for "farcaster" or "warpcast"
   - Checks URL params (`?farcaster=true`)
   - Checks if embedded in iframe

### Social Login (Optional - for Profile Display)
- Uses `@farcaster/auth-kit` for showing user profile
- Requires WalletConnect Project ID
- Shows Farcaster username, avatar, followers, etc.
- **Note**: This is separate from wallet connection

## Testing Farcaster Integration

### Option 1: Test in Farcaster/Warpcast (Recommended)
1. Deploy your app to a public URL (e.g., Vercel)
2. Add the app as a Mini App in Farcaster
3. Open the app inside Farcaster/Warpcast
4. The wallet should connect automatically

### Option 2: Test Locally (Limited)
- Farcaster SDK won't work fully outside Farcaster context
- You can test the detection logic by adding `?farcaster=true` to URL
- But actual wallet connection requires running in Farcaster

## Current Code Status

✅ **Working**:
- Farcaster SDK detection
- Farcaster connector setup
- Wallet connection fallback to MetaMask/WalletConnect

⚠️ **Needs Configuration**:
- `VITE_WALLETCONNECT_PROJECT_ID` environment variable (for Auth Kit)
- App needs to be deployed and added as Mini App in Farcaster

❌ **Not Working Yet**:
- Farcaster wallet connection (needs to run inside Farcaster)
- Farcaster social login (needs WalletConnect Project ID)

## Next Steps

1. **Get WalletConnect Project ID**:
   ```bash
   # Add to .env file
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

2. **Deploy to Production**:
   - Deploy to Vercel or similar
   - Get a public HTTPS URL

3. **Add as Farcaster Mini App**:
   - Follow Farcaster's Mini App documentation
   - Register your app URL
   - Test inside Farcaster/Warpcast

4. **Test Wallet Connection**:
   - Open app in Farcaster
   - Wallet should connect automatically
   - Transactions should work with embedded wallet

## Troubleshooting

### "Farcaster wallet provider not available"
- **Cause**: App not running in Farcaster context
- **Solution**: Test inside Farcaster/Warpcast, or add `?farcaster=true` for testing

### "VITE_WALLETCONNECT_PROJECT_ID not set"
- **Cause**: Missing environment variable
- **Solution**: Add to `.env` file and restart dev server

### Wallet not connecting in Farcaster
- **Cause**: SDK not initialized or connector not working
- **Solution**: Check browser console for errors, verify SDK is loaded

## Summary

**Minimum Required for Farcaster Wallet Connection**:
- ✅ Farcaster Mini App SDK (installed)
- ✅ Connector code (exists)
- ⚠️ App deployed to public URL
- ⚠️ App registered as Mini App in Farcaster
- ⚠️ Running inside Farcaster/Warpcast

**Optional (for Social Login)**:
- ⚠️ WalletConnect Project ID
- ✅ Farcaster Auth Kit (installed)

