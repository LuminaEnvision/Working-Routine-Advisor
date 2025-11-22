/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// Improved contract flattener that resolves all OpenZeppelin imports and deduplicates declarations
function flattenContract(contractPath, outputPath) {
  const contractDir = path.dirname(contractPath);
  const contractContent = fs.readFileSync(contractPath, 'utf8');
  const nodeModulesPath = path.resolve(__dirname, '..', 'node_modules');
  const openZeppelinPath = path.join(nodeModulesPath, '@openzeppelin', 'contracts');
  
  let flattened = '';
  const processed = new Set(); // Track processed file paths
  const declaredIdentifiers = new Set(); // Track declared contracts/interfaces
  
  function resolveImportPath(importPath, currentFileDir) {
    // Handle @openzeppelin imports
    if (importPath.startsWith('@openzeppelin/')) {
      const relativePath = importPath.replace('@openzeppelin/contracts/', '');
      return path.join(openZeppelinPath, relativePath);
    }
    
    // Handle relative imports (./ or ../)
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return path.resolve(currentFileDir, importPath);
    }
    
    // Try to find in node_modules
    const fullPath = path.join(nodeModulesPath, importPath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    
    return null;
  }
  
  function extractIdentifierName(line) {
    // Match: contract Name, interface Name, abstract contract Name, library Name
    const match = line.match(/(?:abstract\s+)?(?:contract|interface|library)\s+(\w+)/);
    return match ? match[1] : null;
  }
  
  function processFile(filePath, currentDir = contractDir) {
    // Normalize the path for comparison
    let resolvedPath = filePath;
    if (!path.isAbsolute(filePath)) {
      resolvedPath = resolveImportPath(filePath, currentDir);
      if (!resolvedPath || !fs.existsSync(resolvedPath)) {
        console.warn(`Warning: Could not find ${filePath} (resolved from ${currentDir})`);
        return '';
      }
    } else if (!fs.existsSync(resolvedPath)) {
      console.warn(`Warning: Could not find ${resolvedPath}`);
      return '';
    }
    
    const normalizedPath = path.resolve(resolvedPath);
    
    // Skip if already processed
    if (processed.has(normalizedPath)) {
      return '';
    }
    processed.add(normalizedPath);
    
    const content = fs.readFileSync(resolvedPath, 'utf8');
    const fileDir = path.dirname(resolvedPath);
    
    // Remove license and pragma from imports (keep only from main contract)
    const lines = content.split('\n');
    let processedContent = '';
    let skipDeclaration = false;
    let braceDepth = 0;
    let inSkippedDeclaration = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip SPDX license in imports
      if (line.includes('SPDX-License-Identifier')) {
        continue;
      }
      
      // Skip pragma in imports
      if (line.trim().startsWith('pragma solidity')) {
        continue;
      }
      
      // Check if this line starts a contract/interface/library declaration
      const identifier = extractIdentifierName(line);
      if (identifier) {
        // If we already have this identifier, skip this entire declaration
        if (declaredIdentifiers.has(identifier)) {
          skipDeclaration = true;
          inSkippedDeclaration = true;
          braceDepth = 0;
          continue;
        }
        // New declaration - mark it and include it
        declaredIdentifiers.add(identifier);
        skipDeclaration = false;
        inSkippedDeclaration = false;
        braceDepth = 0;
        processedContent += line + '\n';
        continue;
      }
      
      // If we're skipping a duplicate declaration, track braces to know when it ends
      if (skipDeclaration && inSkippedDeclaration) {
        // Count opening and closing braces
        for (const char of line) {
          if (char === '{') braceDepth++;
          if (char === '}') braceDepth--;
        }
        // If we've closed all braces, the declaration is done
        if (braceDepth <= 0) {
          skipDeclaration = false;
          inSkippedDeclaration = false;
          braceDepth = 0;
        }
        continue;
      }
      
      // Process imports in this file
      const importMatch = line.match(/import\s+(?:(?:\{[^}]*\}|\*|\*\s+as\s+\w+)\s+from\s+)?["']([^"']+)["']/);
      if (importMatch) {
        const importPath = importMatch[1];
        // Recursively process the import
        const importedContent = processFile(importPath, fileDir);
        processedContent += importedContent;
        continue;
      }
      
      // Add line to processed content
      processedContent += line + '\n';
    }
    
    return processedContent;
  }
  
  // Extract pragma and license from main contract
  const lines = contractContent.split('\n');
  let mainContent = '';
  let pragmaLine = '';
  let licenseLine = '';
  
  for (const line of lines) {
    // Handle both import styles
    const importMatch = line.match(/import\s+(?:(?:\{[^}]*\}|\*|\*\s+as\s+\w+)\s+from\s+)?["']([^"']+)["']/);
    if (importMatch) {
      const importPath = importMatch[1];
      // Process the import
      const importedContent = processFile(importPath, contractDir);
      flattened += importedContent + '\n';
      // Skip the import line
      continue;
    }
    
    // Extract pragma and license from main contract
    if (line.trim().startsWith('pragma solidity')) {
      pragmaLine = line;
      continue;
    }
    if (line.includes('SPDX-License-Identifier')) {
      licenseLine = line;
      continue;
    }
    
    mainContent += line + '\n';
  }
  
  // Add pragma and license at the top, then dependencies, then main contract
  const finalContent = (licenseLine ? licenseLine + '\n' : '') + 
                       (pragmaLine ? pragmaLine + '\n\n' : '') + 
                       flattened + 
                       mainContent;
  
  // Write to output file
  fs.writeFileSync(outputPath, finalContent, 'utf8');
  console.log(`✅ Flattened contract written to: ${outputPath}`);
  console.log(`   Processed ${processed.size} files`);
  console.log(`   Declared ${declaredIdentifiers.size} unique contracts/interfaces`);
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
