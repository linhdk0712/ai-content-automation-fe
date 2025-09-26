#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of deleted services
const deletedServices = [
  'websocket.service',
  'analytics.service',
  'realTimeNotification.service',
  'teamActivity.service',
  'systemStatus.service'
];

// Function to recursively find all TypeScript files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to check imports in a file
function checkImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Check for imports of deleted services
    deletedServices.forEach(service => {
      if (trimmedLine.includes(`'../${service}'`) || 
          trimmedLine.includes(`"../${service}"`) ||
          trimmedLine.includes(`'../../services/${service}'`) ||
          trimmedLine.includes(`"../../services/${service}"`)) {
        issues.push({
          line: index + 1,
          content: line,
          issue: `Import of deleted service: ${service}`
        });
      }
    });
  });
  
  return issues;
}

// Main function
function main() {
  console.log('🔍 Checking for problematic imports...\n');
  
  const srcDir = path.join(__dirname, 'src');
  const tsFiles = findTsFiles(srcDir);
  
  let totalIssues = 0;
  
  tsFiles.forEach(file => {
    const issues = checkImports(file);
    
    if (issues.length > 0) {
      console.log(`❌ ${path.relative(__dirname, file)}:`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.issue}`);
        console.log(`   ${issue.content.trim()}`);
      });
      console.log('');
      totalIssues += issues.length;
    }
  });
  
  if (totalIssues === 0) {
    console.log('✅ No problematic imports found!');
  } else {
    console.log(`❌ Found ${totalIssues} problematic imports that need to be fixed.`);
    process.exit(1);
  }
}

main();