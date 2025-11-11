# Migration Log

## Migration: Reward Logic Update
**Date:** 2025-11-11T02:53:54.568Z
**Network:** celo
**Deployer:** 0x520E40E346ea85D72661fcE3Ba3F81CB2c560d84

### Reason
Updated reward logic to give $INSIGHT tokens to ALL users, not just subscribed users.

### Changes
- Removed subscription requirement for $INSIGHT token rewards
- All users now receive 50 $INSIGHT every 5 check-ins
- Subscription still works (removes 0.1 CELO fee)

### Old Contracts
- **InsightToken:** 0x9a1BD5E334140219e20995Be32050354D21F5981
- **InsightsPayment:** 0xfB2BEF401890b45FDd72Df1bCC0F127B70B035A5

### New Contracts
- **InsightToken:** 0x8a24b8C6f3e35d45f7639BbcB2B802ac0c4Cd74F
- **InsightsPayment:** 0x8BF96665c1fa2D9368EB5CcdCd25C3C92DE20c1F

### Notes
- Old contracts remain on-chain but are no longer used
- All users now receive rewards regardless of subscription status
- Subscription feature still works (removes fee, but doesn't affect rewards)
