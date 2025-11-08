# How to Verify Contracts on Celoscan (With OpenZeppelin Dependencies)

## Problem
Celoscan can't find OpenZeppelin imports when verifying manually. You need to either:
1. Use **Standard JSON Input** format (includes all dependencies)
2. Use **Flattened Contract** (all code in one file)

## ✅ Solution: Use Online Contract Flattener (Easiest)

### Step 1: Flatten Your Contract

1. Go to **https://flattener.vercel.app/** or **https://poppular.tech/tools/flattener**

2. For **InsightsPayment**:
   - Open `contracts/InsightsPayment.sol`
   - Copy the entire file content
   - Paste into the flattener
   - Click "Flatten"
   - Copy the flattened output

3. For **InsightToken**:
   - Open `contracts/InsightToken.sol`
   - Copy the entire file content
   - Paste into the flattener
   - Click "Flatten"
   - Copy the flattened output

### Step 2: Verify on Celoscan

1. Go to your contract on Celoscan:
   - **InsightsPayment**: https://celoscan.io/address/0xe978f5E4c9a82E535Fb74BF562771f6fF7C5eE30#code
   - **InsightToken**: https://celoscan.io/address/0x208b0a718A794Ad56C93bDD5D6984A94A06893e7#code

2. Click **"Contract"** tab → **"Verify and Publish"**

3. Select:
   - **Compiler Type**: `Solidity (Single file)`
   - **Compiler Version**: `v0.8.20+commit.a1b79de6`
   - **Open Source License Type**: `MIT`
   - **Optimization**: `Yes`
   - **Runs**: `200`

4. Paste the **flattened contract code** into the text area

5. Enter **Constructor Arguments**:

   **For InsightsPayment:**
   ```
   0x765DE816845861e75A25fCA122bb6898B8B1282a
   ```
   (Just the cUSD address, no quotes)

   **For InsightToken:**
   ```
   Insight Token,INSIGHT
   ```
   (Token name and symbol, comma-separated)

6. Click **"Verify and Publish"**

## Alternative: Standard JSON Input Format

If the flattener doesn't work, use Standard JSON Input:

### Step 1: Create Standard JSON Input

You'll need to create a JSON file that includes:
- Your contract source
- All OpenZeppelin contract sources
- Compiler settings

**Template:**
```json
{
  "language": "Solidity",
  "sources": {
    "contracts/InsightsPayment.sol": {
      "content": "[YOUR_CONTRACT_SOURCE]"
    },
    "@openzeppelin/contracts/access/Ownable.sol": {
      "content": "[OWNABLE_SOURCE]"
    },
    "@openzeppelin/contracts/utils/ReentrancyGuard.sol": {
      "content": "[REENTRANCY_GUARD_SOURCE]"
    },
    "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol": {
      "content": "[SAFE_ERC20_SOURCE]"
    },
    "@openzeppelin/contracts/token/ERC20/IERC20.sol": {
      "content": "[IERC20_SOURCE]"
    },
    "@openzeppelin/contracts/utils/Context.sol": {
      "content": "[CONTEXT_SOURCE]"
    }
  },
  "settings": {
    "optimizer": {
      "enabled": true,
      "runs": 200
    },
    "outputSelection": {
      "*": {
        "*": ["abi", "evm.bytecode", "evm.deployedBytecode"]
      }
    }
  }
}
```

### Step 2: Get OpenZeppelin Sources

Copy the source code from:
- `node_modules/@openzeppelin/contracts/access/Ownable.sol`
- `node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol`
- `node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol`
- `node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol`
- `node_modules/@openzeppelin/contracts/utils/Context.sol`

### Step 3: Verify on Celoscan

1. Go to contract on Celoscan
2. Click "Contract" → "Verify and Publish"
3. Select: **Compiler Type**: `Solidity (Standard JSON Input)`
4. Upload or paste the JSON file
5. Enter constructor arguments
6. Click "Verify and Publish"

## 📋 Quick Reference

### InsightsPayment Contract

**Address**: `0xe978f5E4c9a82E535Fb74BF562771f6fF7C5eE30`  
**Celoscan**: https://celoscan.io/address/0xe978f5E4c9a82E535Fb74BF562771f6fF7C5eE30#code

**Constructor Argument**:
```
0x765DE816845861e75A25fCA122bb6898B8B1282a
```

**Compiler Settings**:
- Version: `0.8.20`
- Optimization: `Yes`
- Runs: `200`

### InsightToken Contract

**Address**: `0x208b0a718A794Ad56C93bDD5D6984A94A06893e7`  
**Celoscan**: https://celoscan.io/address/0x208b0a718A794Ad56C93bDD5D6984A94A06893e7#code

**Constructor Arguments**:
```
Insight Token,INSIGHT
```

**Compiler Settings**:
- Version: `0.8.20`
- Optimization: `Yes`
- Runs: `200`

## 🎯 Recommended Method

**Use the online flattener** - it's the easiest and most reliable:
1. Go to https://flattener.vercel.app/
2. Paste your contract
3. Get flattened code
4. Use "Single file" on Celoscan
5. Done!

## ⚠️ Important Notes

- Make sure compiler version matches: `0.8.20`
- Make sure optimization settings match: `Enabled, 200 runs`
- Constructor arguments must be exact (no extra spaces)
- Verification is optional - contracts work without it

## ✅ After Verification

Once verified, your contracts will show:
- ✅ Green checkmark on Celoscan
- ✅ Source code visible to everyone
- ✅ Better trust and transparency

Good luck! 🚀

