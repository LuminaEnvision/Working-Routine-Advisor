# 💰 Withdrawal Guide

This guide explains how to withdraw funds (CELO and cUSD) from your `InsightsPayment` contract.

## Prerequisites

1. **You must be the contract owner** - Only the address that deployed the contract can withdraw funds
2. **Private key** - Your private key must be set in `.env` file
3. **Contract address** - The deployed contract address

## Quick Start

### Option 1: Using the Script (Recommended)

1. **Set up your `.env` file:**
   ```bash
   PRIVATE_KEY=your_private_key_here
   INSIGHTS_PAYMENT_ADDRESS=0x...your_contract_address...
   WITHDRAW_TO_ADDRESS=0x...your_wallet_address...
   CELO_RPC_URL=https://forno.celo.org  # For mainnet
   ```

2. **Run the withdrawal script:**
   ```bash
   npx hardhat run scripts/withdraw.cjs --network celo
   ```

   For testnet:
   ```bash
   npx hardhat run scripts/withdraw.cjs --network celoAlfajores
   ```

### Option 2: Using a Block Explorer (CeloScan)

1. Go to [CeloScan](https://celoscan.io) (or [Alfajores Testnet](https://alfajores.celoscan.io))
2. Connect your wallet
3. Navigate to your contract address
4. Go to "Contract" tab → "Write Contract"
5. Connect your wallet (must be the owner)
6. Find `withdrawTo` function
7. Enter your wallet address in the `_to` parameter
8. Click "Write" and confirm the transaction

### Option 3: Using Ethers.js in Node.js

```javascript
const { ethers } = require("hardhat");

async function withdraw() {
  const contractAddress = "0x...your_contract_address...";
  const withdrawTo = "0x...your_wallet_address...";
  
  const [owner] = await ethers.getSigners();
  const contract = await ethers.getContractAt("InsightsPayment", contractAddress);
  
  const tx = await contract.withdrawTo(withdrawTo);
  await tx.wait();
  
  console.log("Withdrawal successful!");
}
```

## What Gets Withdrawn?

The `withdrawTo` function withdraws **both**:
- **CELO** (native currency) - from check-in fees (0.1 CELO per check-in)
- **cUSD** (stablecoin) - from subscription payments (6.9 cUSD per month)

## Contract Function

```solidity
function withdrawTo(address payable _to) external onlyOwner nonReentrant {
    require(_to != address(0), "Invalid withdraw address");
    
    uint256 celoBalance = address(this).balance;
    uint256 cUSDBalance = cUSD.balanceOf(address(this));
    
    if (celoBalance > 0) {
        (bool sent, ) = _to.call{value: celoBalance}("");
        require(sent, "CELO withdraw failed");
    }
    
    if (cUSDBalance > 0) {
        cUSD.safeTransfer(_to, cUSDBalance);
    }
    
    emit Withdrawn(_to, celoBalance, cUSDBalance);
}
```

## Security Notes

⚠️ **Important:**
- Only the contract owner can call `withdrawTo`
- The function uses `onlyOwner` modifier from OpenZeppelin's `Ownable`
- It includes `nonReentrant` protection to prevent reentrancy attacks
- Always verify the recipient address before withdrawing

## Troubleshooting

### Error: "You are not the owner!"
- Make sure you're using the private key of the address that deployed the contract
- Check the contract owner: `await contract.owner()`

### Error: "Invalid withdraw address"
- Make sure the `_to` address is not `0x0000...0000`
- Use a valid wallet address

### No funds to withdraw
- Check contract balance on CeloScan
- Make sure users have made payments (check-ins or subscriptions)

### Transaction fails
- Ensure you have enough CELO for gas fees
- Check network connection (RPC URL)
- Verify contract address is correct

## Checking Contract Balance

You can check the contract balance on:
- **CeloScan**: https://celoscan.io/address/YOUR_CONTRACT_ADDRESS
- **Using Hardhat console:**
  ```bash
  npx hardhat console --network celo
  > const balance = await ethers.provider.getBalance("0x...contract_address...")
  > ethers.formatEther(balance)
  ```

## Example Output

```
💰 Withdrawing funds from contract...
Contract: 0x1234...5678
Withdraw to: 0xabcd...efgh
Network: celo

Owner address: 0xowner...address

📊 Current balances:
CELO: 1.5 CELO
cUSD: 13.8 cUSD

🚀 Withdrawing funds to: 0xabcd...efgh...
Transaction hash: 0x7890...abcd
Waiting for confirmation...
✅ Withdrawal successful!
Gas used: 45000
Block number: 12345678

📊 Balances after withdrawal:
CELO: 0.0 CELO
cUSD: 0.0 cUSD

💰 Withdrawn:
CELO: 1.5 CELO
cUSD: 13.8 cUSD
```

