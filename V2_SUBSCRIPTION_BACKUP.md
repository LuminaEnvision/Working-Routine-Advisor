# V2 Subscription Features - Backup

This file contains all subscription-related code that was removed for MVP. This can be restored for V2.

## Contract Changes Needed for V2

**Good News**: You can add subscription features later WITHOUT changing existing contracts!

### Option 1: Add to Existing Contract (Recommended)
- Add new functions to `InsightsPayment.sol`:
  - `subscribe()` - Already exists! Just needs to be enabled
  - `getSubscriptionExpiry()` - Already exists!
- No need to deploy new contracts
- Just update frontend to use these functions

### Option 2: New Contract (If you want separation)
- Deploy a new `SubscriptionManager.sol` contract
- Link it to existing `InsightsPayment` contract
- More complex but cleaner separation

**Recommendation**: Use Option 1 - the contract already has subscription functions, just enable them in V2!

## Files to Restore for V2

### 1. Contract Files
- `contracts/InsightsPayment.sol` - Already has subscription code
- `scripts/deploy.cjs` - Already has subscription deployment logic

### 2. Frontend Files
- `src/pages/Subscribe.tsx` - Subscription page
- `src/components/PaymentGate.tsx` - Has subscription option
- `src/hooks/use-InsightsPayment.ts` - Has `subscribe()` function
- `src/lib/ai.ts` - AI insights generation
- `src/components/InsightsDisplay.tsx` - AI insights display
- `src/components/Chatbot.tsx` - AI chatbot
- `src/pages/Recommendations.tsx` - Has subscription checks

### 3. Environment Variables
- `VITE_GEMINI_API_KEY` - For AI features

## What to Keep for MVP

- Basic check-in flow
- 0.1 CELO payment per check-in
- Simple insights (can be mock/static for MVP)
- Wallet connection
- Token rewards (50 $INSIGHT every 5 check-ins)

## What to Remove for MVP

- Subscription page (`/subscribe`)
- Subscription checks in components
- AI chatbot
- AI insights generation
- Subscription-related UI elements

