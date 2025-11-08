/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// Simple contract flattener that resolves OpenZeppelin imports
function flattenContract(contractPath, outputPath) {
  const contractDir = path.dirname(contractPath);
  const contractContent = fs.readFileSync(contractPath, 'utf8');
  const nodeModulesPath = path.resolve(__dirname, '..', 'node_modules');
  
  let flattened = '';
  const processed = new Set();
  
  function processFile(filePath, indent = '') {
    if (processed.has(filePath)) {
      return '';
    }
    processed.add(filePath);
    
    let content = '';
    
    // Check if it's an import path
    if (filePath.startsWith('@openzeppelin/')) {
      const relativePath = filePath.replace('@openzeppelin/contracts/', '');
      const fullPath = path.join(nodeModulesPath, '@openzeppelin', 'contracts', relativePath);
      
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf8');
      } else {
        console.warn(`Warning: Could not find ${fullPath}`);
        return '';
      }
    } else if (filePath.startsWith('./') || filePath.startsWith('../')) {
      const fullPath = path.resolve(contractDir, filePath);
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf8');
      } else {
        console.warn(`Warning: Could not find ${fullPath}`);
        return '';
      }
    } else {
      // Try to find in node_modules
      const fullPath = path.join(nodeModulesPath, filePath);
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf8');
      } else {
        console.warn(`Warning: Could not find ${fullPath}`);
        return '';
      }
    }
    
    // Remove license and pragma from imports (keep only from main contract)
    const lines = content.split('\n');
    let processedContent = '';
    let skipLicense = true;
    let skipPragma = true;
    
    for (const line of lines) {
      // Skip SPDX license in imports
      if (line.includes('SPDX-License-Identifier')) {
        continue;
      }
      
      // Skip pragma in imports
      if (line.trim().startsWith('pragma solidity')) {
        continue;
      }
      
      // Process imports in this file
      const importMatch = line.match(/import\s+["']([^"']+)["']/);
      if (importMatch) {
        const importPath = importMatch[1];
        processedContent += processFile(importPath, indent + '  ');
        continue;
      }
      
      processedContent += line + '\n';
    }
    
    return processedContent;
  }
  
  // Process main contract
  const lines = contractContent.split('\n');
  let mainContent = '';
  
  for (const line of lines) {
    const importMatch = line.match(/import\s+["']([^"']+)["']/);
    if (importMatch) {
      const importPath = importMatch[1];
      // Process the import
      const importedContent = processFile(importPath);
      flattened += importedContent + '\n';
      // Skip the import line
      continue;
    }
    mainContent += line + '\n';
  }
  
  // Add main contract content at the end
  flattened += mainContent;
  
  // Write to output file
  fs.writeFileSync(outputPath, flattened, 'utf8');
  console.log(`✅ Flattened contract written to: ${outputPath}`);
}

// Get contract name from command line
const contractName = process.argv[2];

if (!contractName) {
  console.error('Usage: node flatten-contract.cjs <ContractName>');
  console.error('Example: node flatten-contract.cjs InsightsPayment');
  process.exit(1);
}

const contractPath = path.resolve(__dirname, '..', 'contracts', `${contractName}.sol`);
const outputPath = path.resolve(__dirname, '..', 'contracts', `${contractName}_flattened.sol`);

if (!fs.existsSync(contractPath)) {
  console.error(`Error: Contract file not found: ${contractPath}`);
  process.exit(1);
}

console.log(`Flattening ${contractName}...`);
flattenContract(contractPath, outputPath);
console.log('Done!');

