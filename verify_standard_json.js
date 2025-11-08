const fs = require('fs');
const path = require('path');

// Read the contract source
const contractPath = path.join(__dirname, 'contracts', 'InsightsPayment.sol');
const contractSource = fs.readFileSync(contractPath, 'utf8');

// Read OpenZeppelin contracts
const nodeModulesPath = path.join(__dirname, 'node_modules', '@openzeppelin');
const openzeppelinContracts = {};

function readOpenZeppelinContract(relativePath) {
  const fullPath = path.join(nodeModulesPath, relativePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, 'utf8');
  }
  return null;
}

// Get all OpenZeppelin contracts used
const contracts = {
  'contracts/InsightsPayment.sol': contractSource,
  '@openzeppelin/contracts/access/Ownable.sol': readOpenZeppelinContract('contracts/access/Ownable.sol'),
  '@openzeppelin/contracts/utils/ReentrancyGuard.sol': readOpenZeppelinContract('contracts/utils/ReentrancyGuard.sol'),
  '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol': readOpenzeppelinContract('contracts/token/ERC20/utils/SafeERC20.sol'),
  '@openzeppelin/contracts/token/ERC20/IERC20.sol': readOpenZeppelinContract('contracts/token/ERC20/IERC20.sol'),
  '@openzeppelin/contracts/utils/Context.sol': readOpenzeppelinContract('contracts/utils/Context.sol'),
};

// Create Standard JSON Input
const standardJsonInput = {
  language: 'Solidity',
  sources: {},
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']
      }
    }
  }
};

// Add all contracts to sources
Object.keys(contracts).forEach(key => {
  if (contracts[key]) {
    standardJsonInput.sources[key] = {
      content: contracts[key]
    };
  }
});

// Write to file
fs.writeFileSync('standard_json_input.json', JSON.stringify(standardJsonInput, null, 2));
console.log('Standard JSON Input created: standard_json_input.json');
