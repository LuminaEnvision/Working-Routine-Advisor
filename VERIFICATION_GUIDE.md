# Contract Verification Guide - Celoscan

## 🔍 Verification Methods

### Method 1: Hardhat Verify (Recommended)

**Note**: Celoscan might still be using API V1. If you get errors, try Method 2 (Manual Verification).

#### Verify InsightsPayment Contract:

```bash
npx hardhat verify --network celo \
  0xe978f5E4c9a82E535Fb74BF562771f6fF7C5eE30 \
  0x765DE816845861e75A25fCA122bb6898B8B1282a
```

**Constructor Arguments:**
- `0x765DE816845861e75A25fCA122bb6898B8B1282a` (cUSD token address)

#### Verify InsightToken Contract:

```bash
npx hardhat verify --network celo \
  0x208b0a718A794Ad56C93bDD5D6984A94A06893e7 \
  "Insight Token" \
  "INSIGHT"
```

**Constructor Arguments:**
- `"Insight Token"` (token name)
- `"INSIGHT"` (token symbol)

### Method 2: Manual Verification (If Hardhat Verify Fails)

If automated verification fails, you can verify manually on Celoscan:

#### Step 1: Get Contract Source Code

1. Go to your contract file: `contracts/InsightsPayment.sol`
2. Copy the entire source code

#### Step 2: Get Compiler Settings

From your `hardhat.config.cjs`:
- **Compiler Version**: `0.8.20`
- **Optimization**: Enabled
- **Runs**: `200`

#### Step 3: Verify on Celoscan

1. Go to your contract on Celoscan:
   - **InsightsPayment**: https://celoscan.io/address/0xe978f5E4c9a82E535Fb74BF562771f6fF7C5eE30#code
   - **InsightToken**: https://celoscan.io/address/0x208b0a718A794Ad56C93bDD5D6984A94A06893e7#code

2. Click "Contract" tab
3. Click "Verify and Publish"
4. Select:
   - **Compiler Type**: Solidity (Single file) or Solidity (Standard JSON Input)
   - **Compiler Version**: `v0.8.20+commit.a1b79de6`
   - **Open Source License Type**: MIT
   - **Optimization**: Yes
   - **Runs**: `200`

5. Paste your contract source code
6. Enter constructor arguments:
   - **InsightsPayment**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
   - **InsightToken**: `["Insight Token", "INSIGHT"]` (as ABI-encoded)

7. Click "Verify and Publish"

### Method 3: Using Sourcify (Alternative)

Sourcify is an open-source verification service that works with Celoscan:

```bash
# Install Sourcify plugin (already added to config)
# Just deploy and it should auto-verify if enabled
```

The `sourcify: { enabled: true }` in your config will attempt automatic verification.

## 📋 Required Information

### For InsightsPayment Contract:

**Contract Address**: `0xe978f5E4c9a82E535Fb74BF562771f6fF7C5eE30`

**Constructor Arguments**:
- `_cUSD`: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

**Compiler Settings**:
- Solidity Version: `0.8.20`
- Optimization: Enabled
- Runs: `200`

**Source Code**: `contracts/InsightsPayment.sol`

### For InsightToken Contract:

**Contract Address**: `0x208b0a718A794Ad56C93bDD5D6984A94A06893e7`

**Constructor Arguments**:
- `name_`: `"Insight Token"`
- `symbol_`: `"INSIGHT"`

**Compiler Settings**:
- Solidity Version: `0.8.20`
- Optimization: Enabled
- Runs: `200`

**Source Code**: `contracts/InsightToken.sol`

## 🔧 Troubleshooting

### Error: "You are using a deprecated V1 endpoint"

**Solution**: The hardhat config has been updated to use API V2. If it still fails:
1. Try manual verification (Method 2)
2. Or wait for Celoscan to fully support API V2

### Error: "Contract not found"

**Solution**: 
1. Make sure the contract address is correct
2. Wait a few minutes after deployment for the block to be indexed
3. Check the contract exists on Celoscan first

### Error: "Constructor arguments mismatch"

**Solution**:
1. Double-check constructor arguments
2. For InsightsPayment: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
3. For InsightToken: `["Insight Token", "INSIGHT"]`

### Error: "Compiler version mismatch"

**Solution**:
1. Use exact compiler version: `0.8.20`
2. Check your `hardhat.config.cjs` matches

## ✅ Verification Checklist

- [ ] Get Celoscan API key (optional, for automated verification)
- [ ] Add `CELOSCAN_API_KEY` to `.env` file
- [ ] Try automated verification with Hardhat
- [ ] If fails, use manual verification on Celoscan
- [ ] Verify both contracts
- [ ] Check verified contracts on Celoscan

## 📝 Notes

1. **Verification is Optional**: Contracts work without verification, but verification adds transparency
2. **Manual Verification Works**: If automated fails, manual verification always works
3. **Sourcify**: Alternative verification service, might auto-verify if enabled
4. **API V2**: Celoscan might still be transitioning to API V2, manual verification is reliable

## 🎯 Quick Start

**If you have Celoscan API key:**

```bash
# Add to .env
CELOSCAN_API_KEY=your_api_key_here

# Verify InsightsPayment
npx hardhat verify --network celo 0xe978f5E4c9a82E535Fb74BF562771f6fF7C5eE30 0x765DE816845861e75A25fCA122bb6898B8B1282a

# Verify InsightToken
npx hardhat verify --network celo 0x208b0a718A794Ad56C93bDD5D6984A94A06893e7 "Insight Token" "INSIGHT"
```

**If automated verification fails:**

Use manual verification on Celoscan (Method 2 above) - it's reliable and straightforward!

