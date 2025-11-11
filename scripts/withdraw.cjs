/* eslint-disable no-console */
require("dotenv").config();

async function main() {
  const hre = require("hardhat");
  
  // Get the contract address from environment variable
  // You can also pass it as a command line argument: npx hardhat run scripts/withdraw.cjs --network celo --address 0x...
  const contractAddress = process.env.INSIGHTS_PAYMENT_ADDRESS || process.argv.find(arg => arg.startsWith('--address='))?.split('=')[1];
  const withdrawToAddress = process.env.WITHDRAW_TO_ADDRESS || process.argv.find(arg => arg.startsWith('--to='))?.split('=')[1];
  
  if (!contractAddress) {
    throw new Error("Missing INSIGHTS_PAYMENT_ADDRESS. Set it in .env file or use --address=0x...");
  }
  
  if (!withdrawToAddress) {
    throw new Error("Missing WITHDRAW_TO_ADDRESS. Set it in .env file or use --to=0x...");
  }

  console.log(`\n💰 Withdrawing funds from contract...`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Withdraw to: ${withdrawToAddress}`);
  console.log(`Network: ${hre.network.name}\n`);

  const [owner] = await hre.ethers.getSigners();
  console.log(`Owner address: ${owner.address}`);

  // Load the contract
  const InsightsPayment = await hre.ethers.getContractFactory("InsightsPayment");
  const contract = InsightsPayment.attach(contractAddress);

  // Verify ownership
  const contractOwner = await contract.owner();
  if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
    throw new Error(`You are not the owner! Contract owner: ${contractOwner}, Your address: ${owner.address}`);
  }

  // Check balances before withdrawal
  const celoBalance = await hre.ethers.provider.getBalance(contractAddress);
  const cUSDBalance = await contract.cUSD().then(async (cusdAddress) => {
    const cUSD = await hre.ethers.getContractAt("IERC20", cusdAddress);
    return await cUSD.balanceOf(contractAddress);
  });

  console.log(`\n📊 Current balances:`);
  console.log(`CELO: ${hre.ethers.utils.formatEther(celoBalance)} CELO`);
  console.log(`cUSD: ${hre.ethers.utils.formatEther(cUSDBalance)} cUSD`);

  if (celoBalance === 0n && cUSDBalance === 0n) {
    console.log(`\n⚠️  No funds to withdraw!`);
    return;
  }

  // Confirm withdrawal
  console.log(`\n🚀 Withdrawing funds to: ${withdrawToAddress}...`);
  
  const tx = await contract.withdrawTo(withdrawToAddress);
  console.log(`Transaction hash: ${tx.hash}`);
  console.log(`Waiting for confirmation...`);
  
  const receipt = await tx.wait();
  console.log(`✅ Withdrawal successful!`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`Block number: ${receipt.blockNumber}`);

  // Check balances after withdrawal
  const celoBalanceAfter = await hre.ethers.provider.getBalance(contractAddress);
  const cUSDBalanceAfter = await contract.cUSD().then(async (cusdAddress) => {
    const cUSD = await hre.ethers.getContractAt("IERC20", cusdAddress);
    return await cUSD.balanceOf(contractAddress);
  });

  console.log(`\n📊 Balances after withdrawal:`);
  console.log(`CELO: ${hre.ethers.utils.formatEther(celoBalanceAfter)} CELO`);
  console.log(`cUSD: ${hre.ethers.utils.formatEther(cUSDBalanceAfter)} cUSD`);
  
  const celoWithdrawn = celoBalance.sub(celoBalanceAfter);
  const cUSDWithdrawn = cUSDBalance.sub(cUSDBalanceAfter);
  
  console.log(`\n💰 Withdrawn:`);
  console.log(`CELO: ${hre.ethers.utils.formatEther(celoWithdrawn)} CELO`);
  console.log(`cUSD: ${hre.ethers.utils.formatEther(cUSDWithdrawn)} cUSD`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Withdrawal failed:", error);
    process.exitCode = 1;
  });

