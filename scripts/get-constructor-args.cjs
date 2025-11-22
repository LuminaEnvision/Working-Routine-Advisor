/* eslint-disable no-console */
async function main() {
  const hre = require("hardhat");
  const { ethers } = hre;

  // Contract addresses
  const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
  const INSIGHT_TOKEN_ADDRESS = "0x8a24b8C6f3e35d45f7639BbcB2B802ac0c4Cd74F";

  // InsightToken constructor args
  const tokenName = "Insight Token";
  const tokenSymbol = "INSIGHT";

  // InsightsPayment constructor args
  const cUSD = CUSD_ADDRESS;
  const insightToken = INSIGHT_TOKEN_ADDRESS;

  console.log("\n📋 Constructor Arguments for Contract Verification\n");

  console.log("1️⃣ InsightToken Constructor Arguments:");
  console.log("   Name:", tokenName);
  console.log("   Symbol:", tokenSymbol);
  console.log("\n   ABI-encoded (for Celoscan):");
  const tokenAbi = new ethers.utils.AbiCoder();
  const tokenEncoded = tokenAbi.encode(
    ["string", "string"],
    [tokenName, tokenSymbol]
  );
  console.log("   ", tokenEncoded);
  console.log("\n   Or use this format in Celoscan (JSON):");
  console.log(`   ["${tokenName}","${tokenSymbol}"]`);

  console.log("\n2️⃣ InsightsPayment Constructor Arguments:");
  console.log("   cUSD Address:", cUSD);
  console.log("   InsightToken Address:", insightToken);
  console.log("\n   ABI-encoded (for Celoscan):");
  const paymentAbi = new ethers.utils.AbiCoder();
  const paymentEncoded = paymentAbi.encode(
    ["address", "address"],
    [cUSD, insightToken]
  );
  console.log("   ", paymentEncoded);
  console.log("\n   Or use this format in Celoscan (JSON):");
  console.log(`   ["${cUSD}","${insightToken}"]`);

  console.log("\n✅ Use these values when verifying on Celoscan\n");
  console.log("💡 Tip: For Celoscan verification, you can use either:");
  console.log("   - ABI-encoded format (hex string)");
  console.log("   - JSON array format (shown above)\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
  });

