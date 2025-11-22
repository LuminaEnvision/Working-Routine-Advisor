/* eslint-disable no-console */
require("dotenv").config();

async function main() {
  const hre = require("hardhat");
  
  const { CELOSCAN_API_KEY } = process.env;
  
  if (!CELOSCAN_API_KEY) {
    throw new Error("Missing CELOSCAN_API_KEY in .env file");
  }

  // Contract addresses from deployment
  const INSIGHT_TOKEN_ADDRESS = "0x8a24b8C6f3e35d45f7639BbcB2B802ac0c4Cd74F";
  const INSIGHTS_PAYMENT_ADDRESS = "0x8BF96665c1fa2D9368EB5CcdCd25C3C92DE20c1F";
  const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

  console.log("\n🔍 Verifying contracts on Celoscan...\n");
  console.log(`Network: ${hre.network.name}`);
  console.log(`API Key configured: ${CELOSCAN_API_KEY ? "Yes" : "No"}\n`);

  try {
    // Verify InsightToken
    console.log("📝 Verifying InsightToken...");
    console.log(`Address: ${INSIGHT_TOKEN_ADDRESS}`);
    
    await hre.run("verify:verify", {
      address: INSIGHT_TOKEN_ADDRESS,
      constructorArguments: ["Insight Token", "INSIGHT"],
      contract: "contracts/InsightToken.sol:InsightToken",
    });
    
    console.log("✅ InsightToken verified!\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ InsightToken already verified!\n");
    } else {
      console.error("❌ Error verifying InsightToken:", error.message);
    }
  }

  try {
    // Verify InsightsPayment
    console.log("📝 Verifying InsightsPayment...");
    console.log(`Address: ${INSIGHTS_PAYMENT_ADDRESS}`);
    console.log(`Constructor args: cUSD=${CUSD_ADDRESS}, insightToken=${INSIGHT_TOKEN_ADDRESS}`);
    
    await hre.run("verify:verify", {
      address: INSIGHTS_PAYMENT_ADDRESS,
      constructorArguments: [CUSD_ADDRESS, INSIGHT_TOKEN_ADDRESS],
      contract: "contracts/InsightsPayment.sol:InsightsPayment",
    });
    
    console.log("✅ InsightsPayment verified!\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ InsightsPayment already verified!\n");
    } else {
      console.error("❌ Error verifying InsightsPayment:", error.message);
    }
  }

  console.log("\n✅ Verification process complete!");
  console.log("\n📋 Verified contracts:");
  console.log(`   InsightToken: https://celoscan.io/address/${INSIGHT_TOKEN_ADDRESS}`);
  console.log(`   InsightsPayment: https://celoscan.io/address/${INSIGHTS_PAYMENT_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exitCode = 1;
  });

