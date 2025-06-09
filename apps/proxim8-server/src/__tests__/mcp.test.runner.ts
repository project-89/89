#!/usr/bin/env ts-node

/**
 * MCP Test Runner
 * 
 * Comprehensive test suite for the Mission MCP Server integration.
 * Runs unit tests, integration tests, and end-to-end tests.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  testSuite: string;
  passed: boolean;
  output: string;
  duration: number;
}

class MCPTestRunner {
  private results: TestResult[] = [];

  async runTestSuite(testSuite: string, testPattern: string): Promise<TestResult> {
    console.log(`🧪 Running ${testSuite}...`);
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(
        `cd ${process.cwd()} && npm test -- --testPathPattern="${testPattern}" --verbose`
      );
      
      const duration = Date.now() - startTime;
      const output = stdout + stderr;
      const passed = !output.includes('FAIL') && !output.includes('Error:');

      const result: TestResult = {
        testSuite,
        passed,
        output,
        duration
      };

      this.results.push(result);
      
      if (passed) {
        console.log(`✅ ${testSuite} - PASSED (${duration}ms)`);
      } else {
        console.log(`❌ ${testSuite} - FAILED (${duration}ms)`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        testSuite,
        passed: false,
        output: error instanceof Error ? error.message : String(error),
        duration
      };

      this.results.push(result);
      console.log(`❌ ${testSuite} - ERROR (${duration}ms)`);
      return result;
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting MCP Test Suite\n');

    // Run unit tests for MCP tools
    await this.runTestSuite(
      'MCP Tools Unit Tests',
      'services/mcp/__tests__/mcpTools.test.ts'
    );

    // Run unit tests for MCP server factory
    await this.runTestSuite(
      'MCP Server Factory Tests',
      'services/mcp/__tests__/mcpServer.test.ts'
    );

    // Run integration tests for HTTP endpoints
    await this.runTestSuite(
      'MCP HTTP Integration Tests',
      'routes/__tests__/mcp.integration.test.ts'
    );

    // Run end-to-end tests
    await this.runTestSuite(
      'MCP End-to-End Tests',
      '__tests__/mcp.e2e.test.ts'
    );

    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n📊 Test Summary');
    console.log('================');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Test Suites: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total Duration: ${totalDuration}ms\n`);

    // Detailed results
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.testSuite} (${result.duration}ms)`);
      
      if (!result.passed) {
        console.log(`    Error: ${result.output.split('\n')[0]}`);
      }
    });

    // Overall result
    if (failedTests === 0) {
      console.log('\n🎉 All MCP tests passed!');
      console.log('\n📋 Ready for production:');
      console.log('  - MCP tools functionality verified');
      console.log('  - HTTP endpoint integration tested');
      console.log('  - Session management validated');
      console.log('  - Database integration confirmed');
      console.log('  - Error handling verified');
    } else {
      console.log(`\n❌ ${failedTests} test suite(s) failed`);
      console.log('\n🔧 Action required:');
      console.log('  - Review failed test output above');
      console.log('  - Fix failing tests before deployment');
      console.log('  - Re-run tests to verify fixes');
    }

    process.exit(failedTests > 0 ? 1 : 0);
  }
}

// Test coverage verification
async function checkTestCoverage(): Promise<void> {
  console.log('📈 Checking test coverage...\n');

  try {
    const { stdout } = await execAsync(
      'npm test -- --coverage --testPathPattern="mcp" --collectCoverageFrom="src/services/mcp/**/*.ts" --collectCoverageFrom="src/routes/mcp.ts"'
    );

    console.log('Coverage Report:');
    console.log(stdout);
  } catch (error) {
    console.log('⚠️  Coverage check failed:', error);
  }
}

// Performance benchmarking
async function runPerformanceTests(): Promise<void> {
  console.log('⚡ Running performance benchmarks...\n');

  const iterations = 100;
  const startTime = Date.now();

  try {
    // Simulate rapid MCP tool calls
    for (let i = 0; i < iterations; i++) {
      await execAsync(
        `cd ${process.cwd()} && npm test -- --testPathPattern="mcpTools.test.ts" --testNamePattern="getMissions" --silent`
      );
    }

    const duration = Date.now() - startTime;
    const avgDuration = duration / iterations;

    console.log(`Performance Results:`);
    console.log(`  Total iterations: ${iterations}`);
    console.log(`  Total time: ${duration}ms`);
    console.log(`  Average per call: ${avgDuration.toFixed(2)}ms`);
    
    if (avgDuration < 100) {
      console.log('  ✅ Performance: Excellent');
    } else if (avgDuration < 500) {
      console.log('  ⚠️  Performance: Acceptable');
    } else {
      console.log('  ❌ Performance: Needs optimization');
    }
  } catch (error) {
    console.log('❌ Performance test failed:', error);
  }
}

// Main execution
async function main(): Promise<void> {
  const runner = new MCPTestRunner();

  // Check if we're in the right directory
  try {
    await execAsync('ls package.json');
  } catch {
    console.error('❌ Please run this script from the server directory');
    process.exit(1);
  }

  // Run test suites
  await runner.runAllTests();

  // Optional: Run coverage and performance tests
  if (process.argv.includes('--coverage')) {
    await checkTestCoverage();
  }

  if (process.argv.includes('--performance')) {
    await runPerformanceTests();
  }

  console.log('\n🎯 MCP Testing Complete!');
  console.log('\nUsage examples:');
  console.log('  npm run test:mcp                # Run all MCP tests');
  console.log('  npm run test:mcp -- --coverage  # Include coverage report');
  console.log('  npm run test:mcp -- --performance # Include performance tests');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { MCPTestRunner };