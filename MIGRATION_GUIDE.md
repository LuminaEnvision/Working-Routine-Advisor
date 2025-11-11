# 🔄 Migration Guide: Reward Logic Update

## Overview

This migration updates the contract to give $INSIGHT token rewards to **ALL users**, not just subscribed users. The subscription feature remains functional for future implementation.

## What Changed

### Before (Old Contract)
- ❌ Only **subscribed users** received 50 $INSIGHT every 5 check-ins
- ✅ Non-subscribed users paid 0.1 CELO per check-in but got **NO rewards**

### After (New Contract)
- ✅ **ALL users** receive 50 $INSIGHT every 5 check-ins (regardless of subscription)
- ✅ Subscription still works (removes 0.1 CELO fee, but doesn't affect rewards)
- ✅ Non-subscribed users: Pay 0.1 CELO + Get rewards
- ✅ Subscribed users: Free check-ins + Get rewards

## Migration Process

### Step 1: Compile Contracts
```bash
npm run compile
```

### Step 2: Run Migration
```bash
npm run migrate
```

This will:
1. Deploy new InsightToken contract
2. Deploy new InsightsPayment contract (with fixed reward logic)
3. Grant MINTER_ROLE to InsightsPayment
4. Update `src/lib/contractConfig.ts` with new addresses
5. Copy ABIs to frontend
6. Create migration log

### Step 3: Verify Migration
Check that:
- ✅ New contract addresses are in `src/lib/contractConfig.ts`
- ✅ Frontend builds successfully: `npm run build`
- ✅ Migration log created: `MIGRATION_LOG.md`

## Important Notes

### Contract Immutability
- **Old contracts remain on-chain** - They cannot be deleted or modified
- **New contracts are deployed** - Frontend will use new addresses
- **No data migration needed** - Users start fresh on new contracts

### Old Contract Addresses (For Reference)
- **InsightToken:** `0x9a1BD5E334140219e20995Be32050354D21F5981`
- **InsightsPayment:** `0xfB2BEF401890b45FDd72Df1bCC0F127B70B035A5`

These will remain on-chain but won't be used by the frontend after migration.

## Subscription Feature Status

### Current Implementation
- ✅ Subscription contract function exists (`subscribe()`)
- ✅ Subscription removes 0.1 CELO fee
- ✅ Subscription tracking works (`isSubscribed()`, `getSubscriptionExpiry()`)
- ⏳ **UI not implemented yet** - Will be added in future versions

### Future Work
When you're ready to implement subscription UI:
1. The contract already supports it
2. Users can call `subscribe()` function directly
3. Or you can add a subscription UI component
4. Subscription costs: 6.9 cUSD for 30 days

## Testing After Migration

1. **Test new user check-in:**
   - Should work immediately (no cooldown)
   - Should pay 0.1 CELO
   - Should NOT get reward (needs 5 check-ins)

2. **Test reward distribution:**
   - After 5 check-ins, should receive 50 $INSIGHT
   - Works for both subscribed and non-subscribed users

3. **Test subscription (if UI ready):**
   - Subscribe with 6.9 cUSD
   - Check-ins should be free (no 0.1 CELO fee)
   - Still get rewards every 5 check-ins

## Rollback Plan

If you need to rollback:
1. Update `src/lib/contractConfig.ts` with old addresses
2. Copy old ABIs back
3. Rebuild frontend

Old contracts will continue to work, but with the old reward logic (only subscribed users get rewards).

## Support

If you encounter issues:
1. Check `MIGRATION_LOG.md` for details
2. Verify contract addresses on CeloScan
3. Check that MINTER_ROLE was granted correctly

