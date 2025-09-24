#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Test configuration
const config = {
  unit: {
    command: 'npm',
    args: ['run', 'test:coverage'],
    description: 'Running unit tests with coverage...'
  },
  e2e: {
    command: 'npm',
    args: ['run', 'test:e2e:ci'],
    description: 'Running end-to-end tests...'
  },
  performance: {
    command: 'npm',
    args: ['run', 'perf:bundle'],
    description: 'Running performance tests...'
  }
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Utility functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`)
}

const logSuccess = (message) => log(`✅ ${message}`, colors.green)
const logError = (message) => log(`❌ ${message}`, colors.red)
const logWarning = (message) => log(`⚠️  ${message}`, colors.yellow)
const logInfo = (message) => log(`ℹ️  ${message}`, colors.blue)

// Run command with promise
const runCommand = (command, args, description) => {
  return new Promise((resolve, reject) => {
    log(description, colors.cyan)
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    })
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })
    
    process.on('error', (error) => {
      reject(error)
    })
  })
}

// Generate test report
const generateReport = (results) => {
  const reportPath = path.join(__dirname, '../test-results')
  
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true })
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    }
  }
  
  fs.writeFileSync(
    path.join(reportPath, 'test-report.json'),
    JSON.stringify(report, null, 2)
  )
  
  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .passed { background: #d4edda; border-left: 4px solid #28a745; }
        .failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .skipped { background: #fff3cd; border-left: 4px solid #ffc107; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Test Report</h1>
    <div class="timestamp">Generated: ${report.timestamp}</div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total: ${report.summary.total}</p>
        <p>Passed: ${report.summary.passed}</p>
        <p>Failed: ${report.summary.failed}</p>
        <p>Skipped: ${report.summary.skipped}</p>
    </div>
    
    <div class="results">
        <h2>Results</h2>
        ${results.map(result => `
            <div class="test-result ${result.status}">
                <h3>${result.name}</h3>
                <p>Status: ${result.status}</p>
                <p>Duration: ${result.duration}ms</p>
                ${result.error ? `<p>Error: ${result.error}</p>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
  `
  
  fs.writeFileSync(
    path.join(reportPath, 'test-report.html'),
    htmlReport
  )
  
  logInfo(`Test report generated: ${path.join(reportPath, 'test-report.html')}`)
}

// Check coverage thresholds
const checkCoverage = () => {
  const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json')
  
  if (!fs.existsSync(coveragePath)) {
    logWarning('Coverage report not found')
    return false
  }
  
  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
  const thresholds = {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  }
  
  let passed = true
  
  Object.entries(thresholds).forEach(([metric, threshold]) => {
    const actual = coverage.total[metric].pct
    if (actual < threshold) {
      logError(`Coverage ${metric}: ${actual}% (threshold: ${threshold}%)`)
      passed = false
    } else {
      logSuccess(`Coverage ${metric}: ${actual}%`)
    }
  })
  
  return passed
}

// Main test runner
const runTests = async () => {
  const args = process.argv.slice(2)
  const testTypes = args.length > 0 ? args : ['unit', 'e2e']
  
  log('🚀 Starting test suite...', colors.bright)
  
  const results = []
  let allPassed = true
  
  for (const testType of testTypes) {
    if (!config[testType]) {
      logError(`Unknown test type: ${testType}`)
      continue
    }
    
    const startTime = Date.now()
    
    try {
      await runCommand(
        config[testType].command,
        config[testType].args,
        config[testType].description
      )
      
      const duration = Date.now() - startTime
      results.push({
        name: testType,
        status: 'passed',
        duration: duration
      })
      
      logSuccess(`${testType} tests completed in ${duration}ms`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      results.push({
        name: testType,
        status: 'failed',
        duration: duration,
        error: error.message
      })
      
      logError(`${testType} tests failed: ${error.message}`)
      allPassed = false
    }
  }
  
  // Check coverage if unit tests were run
  if (testTypes.includes('unit')) {
    const coveragePassed = checkCoverage()
    if (!coveragePassed) {
      allPassed = false
    }
  }
  
  // Generate report
  generateReport(results)
  
  // Final summary
  log('\n📊 Test Summary:', colors.bright)
  results.forEach(result => {
    const icon = result.status === 'passed' ? '✅' : '❌'
    log(`${icon} ${result.name}: ${result.status} (${result.duration}ms)`)
  })
  
  if (allPassed) {
    logSuccess('\n🎉 All tests passed!')
    process.exit(0)
  } else {
    logError('\n💥 Some tests failed!')
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n🛑 Test run interrupted', colors.yellow)
  process.exit(1)
})

process.on('SIGTERM', () => {
  log('\n🛑 Test run terminated', colors.yellow)
  process.exit(1)
})

// Run tests
runTests().catch((error) => {
  logError(`Test runner failed: ${error.message}`)
  process.exit(1)
})