# 🚀 Vercel Deployment Guide

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project directory**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No** (first time) or **Yes** (if updating)
   - Project name? (Use default or enter custom name)
   - Directory? **./** (current directory)
   - Override settings? **No**

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub (Recommended for CI/CD)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Configure Environment Variables** (see below)

4. **Deploy** - Vercel will automatically deploy on every push to main branch

## Environment Variables

You need to set these in Vercel Dashboard (Settings → Environment Variables):

### Required Variables

```bash
# Celo RPC URL (optional - has default)
VITE_CELO_RPC_URL=https://forno.celo.org

# WalletConnect Project ID (for WalletConnect feature)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# OpenRouter API Key (for AI features)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Pinata API Keys (optional - for IPFS)
VITE_PINATA_JWT=your_pinata_jwt_here
```

### How to Set Environment Variables

1. Go to your project on Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `VITE_CELO_RPC_URL`
   - **Value**: `https://forno.celo.org`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** after adding variables

## Project Configuration

Your `vercel.json` is already configured with:
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Framework: Vite
- ✅ SPA routing (all routes → index.html)
- ✅ Security headers
- ✅ Asset caching

## Deployment Checklist

Before deploying:

- [x] Contracts deployed to Celo
- [x] Contract addresses in `src/lib/contractConfig.ts`
- [x] Build succeeds locally: `npm run build`
- [ ] Environment variables set in Vercel
- [ ] WalletConnect Project ID configured (if using WalletConnect)
- [ ] OpenRouter API Key configured (for AI features)

## After Deployment

1. **Test the deployed site:**
   - Check wallet connection
   - Test check-in flow
   - Verify contract interactions

2. **Update Farcaster Mini App URL:**
   - If using Farcaster, update the app URL in Farcaster settings
   - Update `index.html` meta tag with new URL if needed

3. **Monitor:**
   - Check Vercel logs for any errors
   - Monitor contract interactions on CeloScan

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel auto-detects, but you can set in `package.json`)

### Environment Variables Not Working
- Make sure variables start with `VITE_` (Vite requirement)
- Redeploy after adding variables
- Check variable names match exactly

### Routing Issues
- `vercel.json` already has SPA routing configured
- All routes should redirect to `index.html`

### Contract Connection Issues
- Verify contract addresses in `contractConfig.ts`
- Check Celo RPC URL is accessible
- Ensure contracts are deployed on Celo mainnet

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically configure SSL

## Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch = Production deployment
- Every push to other branches = Preview deployment
- Pull requests = Preview deployment with unique URL

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Dashboard: https://vercel.com/dashboard
- Check deployment logs in Vercel Dashboard

