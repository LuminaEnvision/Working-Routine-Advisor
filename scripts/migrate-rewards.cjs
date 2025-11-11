/* eslint-disable no-console */
/**
 * Migration Script: Update Reward Logic
 * 
 * This script deploys new contracts with the fixed reward logic:
 * - ALL users get rewards (not just subscribed users)
 * - Subscription still works (removes fee, but doesn't affect rewards)
 * 
 * Note: Solidity contracts are immutable, so we deploy new contracts.
 * The old contracts will remain on-chain but won't be used by the frontend.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const {
  CUSD_TOKEN_ADDRESS,
  TOKEN_NAME = "Insight Token",
  TOKEN_SYMBOL = "INSIGHT",
} = process.env;

// Old contract addresses (for reference)
const OLD_CONTRACTS = {
  insightToken: "0x9a1BD5E334140219e20995Be32050354D21F5981",
  insightsPayment: "0xfB2BEF401890b45FDd72Df1bCC0F127B70B035A5",
};

function assertEnv(value, key) {
  if (!value || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

async function main() {
  const hre = require("hardhat");

  const cusdAddress = assertEnv(CUSD_TOKEN_ADDRESS, "CUSD_TOKEN_ADDRESS");

  console.log(`\n🔄 Migrating contracts to ${hre.network.name}...`);
  console.log(`📋 Old contracts (will be replaced):`);
  console.log(`   InsightToken: ${OLD_CONTRACTS.insightToken}`);
  console.log(`   InsightsPayment: ${OLD_CONTRACTS.insightsPayment}`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`\n👤 Deployer: ${deployer.address}`);

  // Deploy new InsightToken
  console.log(`\n📦 Deploying new InsightToken...`);
  const InsightToken = await hre.ethers.getContractFactory("InsightToken");
  const insightToken = await InsightToken.deploy(TOKEN_NAME, TOKEN_SYMBOL);
  await insightToken.deployed();
  const insightTokenAddress = insightToken.address;
  console.log(`✔️ New InsightToken deployed at: ${insightTokenAddress}`);

  // Deploy new InsightsPayment
  console.log(`\n📦 Deploying new InsightsPayment...`);
  const InsightsPayment = await hre.ethers.getContractFactory("InsightsPayment");
  const insightsPayment = await InsightsPayment.deploy(cusdAddress, insightTokenAddress);
  await insightsPayment.deployed();
  const insightsPaymentAddress = insightsPayment.address;
  console.log(`✔️ New InsightsPayment deployed at: ${insightsPaymentAddress}`);

  // Grant MINTER_ROLE to InsightsPayment contract
  console.log(`\n🔐 Granting MINTER_ROLE to InsightsPayment...`);
  const MINTER_ROLE = await insightToken.MINTER_ROLE();
  const grantTx = await insightToken.grantRole(MINTER_ROLE, insightsPaymentAddress);
  await grantTx.wait();
  console.log(`✔️ Granted MINTER_ROLE to InsightsPayment contract`);

  // Save deployment info
  const results = {
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    insightToken: insightTokenAddress,
    insightsPayment: insightsPaymentAddress,
    cUSD: cusdAddress,
    migration: {
      from: {
        insightToken: OLD_CONTRACTS.insightToken,
        insightsPayment: OLD_CONTRACTS.insightsPayment,
      },
      reason: "Updated reward logic: All users get rewards (not just subscribed)",
      changes: [
        "Removed subscription requirement for $INSIGHT token rewards",
        "All users now receive 50 $INSIGHT every 5 check-ins",
        "Subscription still works (removes 0.1 CELO fee)",
      ],
    },
  };

  // Update contractConfig.ts
  const rootDir = path.resolve(__dirname, "..", "src", "lib");
  const contractConfigPath = path.join(rootDir, "contractConfig.ts");
  const addressType = "`0x${string}`";

  const configContent = `export const contractAddresses = ${JSON.stringify(
    results,
    null,
    2
  )} as const;

export const INSIGHT_TOKEN_ADDRESS = contractAddresses.insightToken as ${addressType};
export const INSIGHTS_PAYMENT_ADDRESS = contractAddresses.insightsPayment as ${addressType};
export const CUSD_TOKEN_ADDRESS = contractAddresses.cUSD as ${addressType};
`;

  fs.mkdirSync(rootDir, { recursive: true });
  fs.writeFileSync(contractConfigPath, configContent, { encoding: "utf-8" });
  console.log(`\n📝 Updated contract addresses at: ${contractConfigPath}`);

  // Copy ABIs
  const artifactsRoot = path.resolve(
    __dirname,
    "..",
    "artifacts",
    "contracts"
  );

  const copyArtifact = (contractName) => {
    const sourceArtifactPath = path.join(
      artifactsRoot,
      `${contractName}.sol`,
      `${contractName}.json`
    );
    const destinationPath = path.join(rootDir, `${contractName}.json`);
    if (!fs.existsSync(sourceArtifactPath)) {
      throw new Error(`Artifact not found for ${contractName}: ${sourceArtifactPath}`);
    }
    fs.copyFileSync(sourceArtifactPath, destinationPath);
    console.log(`📦 Copied ${contractName} ABI to: ${destinationPath}`);
  };

  copyArtifact("InsightToken");
  copyArtifact("InsightsPayment");

  // Save migration log
  const migrationLogPath = path.join(__dirname, "..", "MIGRATION_LOG.md");
  const migrationLog = `# Migration Log

## Migration: Reward Logic Update
**Date:** ${results.deployedAt}
**Network:** ${results.network}
**Deployer:** ${results.deployer}

### Reason
Updated reward logic to give $INSIGHT tokens to ALL users, not just subscribed users.

### Changes
${results.migration.changes.map(c => `- ${c}`).join('\n')}

### Old Contracts
- **InsightToken:** ${OLD_CONTRACTS.insightToken}
- **InsightsPayment:** ${OLD_CONTRACTS.insightsPayment}

### New Contracts
- **InsightToken:** ${insightTokenAddress}
- **InsightsPayment:** ${insightsPaymentAddress}

### Notes
- Old contracts remain on-chain but are no longer used
- All users now receive rewards regardless of subscription status
- Subscription feature still works (removes fee, but doesn't affect rewards)
`;

  fs.writeFileSync(migrationLogPath, migrationLog, { encoding: "utf-8" });
  console.log(`📋 Migration log saved to: ${migrationLogPath}`);

  console.log(`\n✅ Migration complete!\n`);
  console.log(`📊 Summary:`);
  console.log(JSON.stringify(results, null, 2));
  console.log(`\n⚠️  Note: Old contracts are still on-chain but won't be used by the frontend.`);
  console.log(`   Old InsightToken: ${OLD_CONTRACTS.insightToken}`);
  console.log(`   Old InsightsPayment: ${OLD_CONTRACTS.insightsPayment}`);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});

