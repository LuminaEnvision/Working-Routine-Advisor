# Contract Review - Working Routine Advisor

## ✅ Contract Analysis

### InsightsPayment.sol

**Status**: ✅ Generally well-structured and secure

#### Strengths:
1. ✅ Uses OpenZeppelin contracts (Ownable, ReentrancyGuard, SafeERC20)
2. ✅ Reentrancy protection on all state-changing functions
3. ✅ Proper access control (onlyOwner for withdrawals)
4. ✅ Correct constructor syntax for OpenZeppelin v5 (`Ownable(msg.sender)`)
5. ✅ Refunds excess CELO on check-in
6. ✅ Subscription stacking (extends expiry if already subscribed)
7. ✅ Lifetime access prevents subscription payments
8. ✅ Cooldown mechanism prevents spam

#### Potential Issues / Clarifications:

1. **Function Naming Confusion** (Line 118)
   ```solidity
   function getCheckInStatus(address user) external view returns (bool) {
       return block.timestamp <= lastCheckin[user] + CHECKIN_COOLDOWN;
   }
   ```
   - **Issue**: Returns `true` if user is STILL in cooldown (can't check in)
   - **Suggestion**: Rename to `isInCooldown()` or invert logic
   - **Impact**: Frontend needs to handle this correctly (currently not checked)

2. **IPFS Hash vs Keccak256 Hash**
   - **Current**: Contract expects IPFS hash, frontend uses `keccak256(stringToBytes(payload))`
   - **Issue**: This is NOT an IPFS hash, just a hash of the payload
   - **Options**:
     - Option A: Use actual IPFS (store check-in data on IPFS, use IPFS hash)
     - Option B: Keep using hash (simpler, but not decentralized storage)
   - **Recommendation**: Decide on approach - if using IPFS, integrate Pinata/Web3.Storage

3. **Cooldown Check Missing in Frontend**
   - **Issue**: Frontend doesn't check `getCheckInStatus()` before allowing check-in
   - **Impact**: Users might try to check in during cooldown, wasting gas
   - **Fix**: Add cooldown check in `DailyCheckIn.tsx` before submission

4. **Gas Optimization Opportunity**
   - **Current**: Each check-in is a separate transaction
   - **Future**: Could batch multiple check-ins (if needed)

#### Contract Logic Flow:

```
submitCheckin():
  1. Check cooldown (must be > 24 hours since last check-in)
  2. If subscribed/lifetime: require msg.value == 0
  3. If not subscribed: require msg.value >= 0.1 CELO
  4. Refund excess CELO if any
  5. Update lastCheckin timestamp
  6. Emit Checkin event

subscribe():
  1. Check not lifetime access
  2. Transfer 6.9 cUSD from user
  3. Extend subscription expiry (stack if already subscribed)
  4. Emit Subscribed event

buyLifetimeAccess():
  1. Check not already lifetime
  2. Transfer 6.9 cUSD from user
  3. Set lifetimeAccess[user] = true
  4. Emit LifetimeAccessGranted event
```

### InsightToken.sol

**Status**: ✅ Simple ERC20 with minting capability

#### Notes:
- Standard ERC20 with AccessControl
- MINTER_ROLE for minting
- Not heavily used in current implementation
- Could be used for rewards/points system (future)

---

## 🔧 Recommended Frontend Fixes

### 1. Add Cooldown Check

```typescript
// In DailyCheckIn.tsx or use-InsightsPayment.ts
const checkCooldown = async () => {
  if (!address) return false;
  
  const inCooldown = await publicClient.readContract({
    address: INSIGHTS_PAYMENT_ADDRESS,
    abi: InsightsPaymentArtifact.abi,
    functionName: 'getCheckInStatus',
    args: [address],
  });
  
  if (inCooldown) {
    // Get last check-in time
    const lastCheckin = await publicClient.readContract({
      address: INSIGHTS_PAYMENT_ADDRESS,
      abi: InsightsPaymentArtifact.abi,
      functionName: 'lastCheckin',
      args: [address],
    });
    
    const cooldownEnd = Number(lastCheckin) + 24 * 60 * 60; // 24 hours
    const hoursRemaining = (cooldownEnd * 1000 - Date.now()) / (1000 * 60 * 60);
    
    throw new Error(`You already checked in today. Please wait ${Math.ceil(hoursRemaining)} hours.`);
  }
  
  return true;
};
```

### 2. Fix IPFS Hash Usage

**Option A: Use Actual IPFS**
```typescript
// Install: npm install pinata-sdk or web3.storage
import { uploadToIPFS } from '@/lib/ipfs';

const handleCheckIn = async () => {
  const payload = JSON.stringify({ answers, timestamp });
  const ipfsHash = await uploadToIPFS(payload); // Actual IPFS hash
  await submitCheckin(ipfsHash, requiresFee);
};
```

**Option B: Keep Using Hash (Simpler)**
```typescript
// Keep current approach but document it
// Note: Using keccak256 hash as identifier, not actual IPFS hash
const hash = keccak256(stringToBytes(payload));
await submitCheckin(hash, requiresFee);
```

### 3. Add Cooldown UI Feedback

```typescript
// Show cooldown status in UI
const { data: inCooldown } = useReadContract({
  address: INSIGHTS_PAYMENT_ADDRESS,
  abi: InsightsPaymentArtifact.abi,
  functionName: 'getCheckInStatus',
  args: [address],
  enabled: !!address,
});

if (inCooldown) {
  return (
    <Alert>
      <AlertDescription>
        You already checked in today. Please wait 24 hours.
      </AlertDescription>
    </Alert>
  );
}
```

---

## 📋 Contract Deployment Checklist

- [ ] Verify cUSD address is correct for target network (mainnet vs testnet)
- [ ] Test all functions on testnet first
- [ ] Verify owner address is correct
- [ ] Test subscription stacking
- [ ] Test lifetime access
- [ ] Test cooldown mechanism
- [ ] Test refund logic
- [ ] Test withdrawal function
- [ ] Verify events are emitted correctly

---

## 🎯 Summary

**Contracts are well-written and secure.** Main issues are:
1. Frontend doesn't check cooldown before submission
2. IPFS hash vs keccak256 hash confusion (needs decision)
3. Function naming could be clearer (`getCheckInStatus` returns opposite of expected)

**No critical security issues found.** Contracts follow best practices.

