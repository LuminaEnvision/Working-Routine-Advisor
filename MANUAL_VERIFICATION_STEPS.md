# Manual Contract Verification Steps - Celoscan

## Problem: OpenZeppelin Imports Not Found

When verifying manually on Celoscan, you'll get errors about OpenZeppelin imports because Celoscan doesn't have access to your `node_modules` folder.

## Solution: Use Standard JSON Input Format

This is the **recommended method** for contracts with external dependencies like OpenZeppelin.

### Step 1: Get Standard JSON Input

I'll create a script to generate the Standard JSON Input file that includes all dependencies.

### Step 2: Verify on Celoscan

1. Go to your contract on Celoscan:
   - **InsightsPayment**: https://celoscan.io/address/0xe978f5E4c9a82E535Fb74BF562771f6fF7C5eE30#code
   - **InsightToken**: https://celoscan.io/address/0x208b0a718A794Ad56C93bDD5D6984A94A06893e7#code

2. Click "Contract" tab → "Verify and Publish"

3. Select:
   - **Compiler Type**: `Solidity (Standard JSON Input)`
   - **Compiler Version**: `v0.8.20+commit.a1b79de6`
   - **Open Source License Type**: MIT

4. Upload the `standard_json_input.json` file (or paste its contents)

5. Enter constructor arguments:
   - **InsightsPayment**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
   - **InsightToken**: `["Insight Token", "INSIGHT"]` (ABI-encoded)

6. Click "Verify and Publish"

## Alternative: Flatten Contract (Simpler but larger file)

If Standard JSON Input doesn't work, you can flatten the contract:

### Option A: Use Online Flattener

1. Go to https://flattener.vercel.app/ or https://poppular.tech/tools/flattener
2. Paste your contract source code
3. It will combine all imports into one file
4. Copy the flattened code
5. Use "Solidity (Single file)" on Celoscan

### Option B: Manual Flattening

1. Copy your contract source
2. For each `import "@openzeppelin/..."`, replace it with the actual contract code
3. You'll need to copy code from:
   - `node_modules/@openzeppelin/contracts/access/Ownable.sol`
   - `node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol`
   - `node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol`
   - `node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol`
   - `node_modules/@openzeppelin/contracts/utils/Context.sol`

## Quick Guide: Standard JSON Input

The Standard JSON Input format includes:
- Your contract source
- All OpenZeppelin dependencies
- Compiler settings

This is the **best method** for contracts with dependencies.

## Constructor Arguments

### InsightsPayment
```
0x765DE816845861e75A25fCA122bb6898B8B1282a
```

### InsightToken
```
Insight Token,INSIGHT
```
Or ABI-encoded:
```
["Insight Token", "INSIGHT"]
```

## Compiler Settings

- **Version**: `0.8.20`
- **Optimization**: Enabled
- **Runs**: `200`
- **EVM Version**: Paris (default for 0.8.20)

## Still Having Issues?

1. **Try Sourcify**: Go to https://sourcify.dev/ and verify there (it's more lenient)
2. **Contact Celoscan Support**: They can help with verification issues
3. **Use Automated Verification**: Once Celoscan fully supports API V2, automated verification will work

## Notes

- Verification is **optional** - your contracts work without it
- Verification adds transparency and trust
- Standard JSON Input is the most reliable method for contracts with dependencies

