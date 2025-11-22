require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Note: @nomicfoundation/hardhat-verify is an ES module and cannot be required here
// It will be loaded automatically by Hardhat when using verify:verify task

const {
  PRIVATE_KEY,
  CELO_RPC_URL,
  CELO_TESTNET_RPC_URL,
  CELOSCAN_API_KEY,
  CELOSCAN_ALFAJORES_API_KEY,
} = process.env;

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    celo: {
      url: CELO_RPC_URL || "https://forno.celo.org",
      chainId: 42220,
      accounts,
    },
    celoAlfajores: {
      url: CELO_TESTNET_RPC_URL || "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      celo: CELOSCAN_API_KEY || "",
      celoAlfajores: CELOSCAN_ALFAJORES_API_KEY || "",
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
      {
        network: "celoAlfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api/v2",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
  },
};



