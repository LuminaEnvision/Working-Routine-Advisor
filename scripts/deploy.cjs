/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const {
  CUSD_TOKEN_ADDRESS,
  TOKEN_NAME = "Insight Token",
  TOKEN_SYMBOL = "INSIGHT",
} = process.env;

function assertEnv(value, key) {
  if (!value || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

async function main() {
  const hre = require("hardhat");

  const cusdAddress = assertEnv(CUSD_TOKEN_ADDRESS, "CUSD_TOKEN_ADDRESS");

  console.log(`\n🚀 Deploying contracts to ${hre.network.name}...`);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const InsightToken = await hre.ethers.getContractFactory("InsightToken");
  const insightToken = await InsightToken.deploy(TOKEN_NAME, TOKEN_SYMBOL);
  await insightToken.deployed();
  console.log("✔️ InsightToken deployed at:", insightToken.address);

  const InsightsPayment = await hre.ethers.getContractFactory("InsightsPayment");
  const insightsPayment = await InsightsPayment.deploy(cusdAddress, insightToken.address);
  await insightsPayment.deployed();
  console.log("✔️ InsightsPayment deployed at:", insightsPayment.address);

  // Grant MINTER_ROLE to InsightsPayment contract so it can mint tokens
  const MINTER_ROLE = await insightToken.MINTER_ROLE();
  const grantTx = await insightToken.grantRole(MINTER_ROLE, insightsPayment.address);
  await grantTx.wait();
  console.log("✔️ Granted MINTER_ROLE to InsightsPayment contract");

  const results = {
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    insightToken: insightToken.address,
    insightsPayment: insightsPayment.address,
    cUSD: cusdAddress,
  };

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
`; // template literal ends here

  fs.mkdirSync(rootDir, { recursive: true });
  fs.writeFileSync(contractConfigPath, configContent, { encoding: "utf-8" });
  console.log("📝 Updated contract addresses at:", contractConfigPath);

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
    console.log(`📦 Copied ${contractName} ABI to:`, destinationPath);
  };

  copyArtifact("InsightToken");
  copyArtifact("InsightsPayment");

  console.log("\n✅ Deployment complete!\n", results);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

