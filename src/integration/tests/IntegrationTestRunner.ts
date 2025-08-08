/**
 * Integration Test Runner - Phase 7
 *
 * Main entry point for running comprehensive integration tests across
 * the entire physics simulation studio system.
 */

import { IntegrationTestFramework, ITestResult } from './IntegrationTestFramework';
import { SimplifiedEndToEndTestSuite } from './SimplifiedEndToEndTestSuite';
import { CrossComponentCompatibilityTestSuite } from './CrossComponentCompatibilityTestSuite';

/**
 * Integration Test Runner
 *
 * Orchestrates and executes all integration test suites for Phase 7.
 */
export class IntegrationTestRunner {
  private framework: IntegrationTestFramework;
  private isInitialized = false;

  constructor() {
    this.framework = new IntegrationTestFramework();
  }

  /**
   * Initialize the test runner and register test suites
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[IntegrationTestRunner] Already initialized');
      return;
    }

    console.log('[IntegrationTestRunner] Initializing integration test runner...');

    try {
      // Register all test suites
      this.framework.registerTestSuite(SimplifiedEndToEndTestSuite);
      this.framework.registerTestSuite(CrossComponentCompatibilityTestSuite);

      this.isInitialized = true;
      console.log('[IntegrationTestRunner] Test runner initialized with test suites:',
        this.framework.getAvailableTestSuites());

    } catch (error) {
      console.error('[IntegrationTestRunner] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<Map<string, ITestResult[]>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('[IntegrationTestRunner] Starting comprehensive integration test run...');

    try {
      const startTime = performance.now();

      // Run all tests
      const results = await this.framework.runAllTests();

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Generate and display report
      const report = this.framework.generateReport();
      console.log(report);

      // Log summary
      const summary = this.framework.getTestSummary();
      console.log(`[IntegrationTestRunner] Test run completed in ${totalTime.toFixed(1)}ms`);
      console.log(`[IntegrationTestRunner] Results: ${summary.passedTests}/${summary.totalTests} tests passed`);

      if (summary.failedTests > 0) {
        console.error(`[IntegrationTestRunner] ${summary.failedTests} test(s) failed!`);
      }

      // Return results for programmatic use
      return results;

    } catch (error) {
      console.error('[IntegrationTestRunner] Test run failed:', error);
      throw error;
    }
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suiteName: string): Promise<ITestResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`[IntegrationTestRunner] Running test suite: ${suiteName}`);

    try {
      const startTime = performance.now();

      const results = await this.framework.runTestSuite(suiteName);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Display results for this suite
      console.log(`[IntegrationTestRunner] Suite ${suiteName} completed in ${totalTime.toFixed(1)}ms`);

      const passed = results.filter(r => r.passed).length;
      const failed = results.filter(r => r.passed === false).length;

      console.log(`[IntegrationTestRunner] Suite results: ${passed}/${results.length} tests passed`);

      if (failed > 0) {
        console.error(`[IntegrationTestRunner] ${failed} test(s) failed in suite ${suiteName}`);

        // Log failed tests
        const failedTests = results.filter(r => !r.passed);
        for (const test of failedTests) {
          console.error(`[IntegrationTestRunner] FAILED: ${test.testName}`);
          for (const error of test.errors) {
            console.error(`  - ${error}`);
          }
        }
      }

      return results;

    } catch (error) {
      console.error(`[IntegrationTestRunner] Suite ${suiteName} failed:`, error);
      throw error;
    }
  }

  /**
   * Run basic smoke tests (quick validation)
   */
  async runSmokeTests(): Promise<void> {
    console.log('[IntegrationTestRunner] Running smoke tests...');

    try {
      // Run just the simplified end-to-end tests for quick validation
      await this.runTestSuite('simplified_end_to_end_integration');

      console.log('[IntegrationTestRunner] Smoke tests completed');

    } catch (error) {
      console.error('[IntegrationTestRunner] Smoke tests failed:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive tests (all suites)
   */
  async runComprehensiveTests(): Promise<void> {
    console.log('[IntegrationTestRunner] Running comprehensive integration tests...');

    try {
      await this.runAllTests();

      console.log('[IntegrationTestRunner] Comprehensive tests completed');

    } catch (error) {
      console.error('[IntegrationTestRunner] Comprehensive tests failed:', error);
      throw error;
    }
  }

  /**
   * Get test results summary
   */
  getTestSummary(): {
    totalSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalDuration: number;
    avgMemoryUsage: number;
  } {
    return this.framework.getTestSummary();
  }

  /**
   * Get detailed test report
   */
  getTestReport(): string {
    return this.framework.generateReport();
  }

  /**
   * Clear all test results
   */
  clearResults(): void {
    this.framework.clearResults();
    console.log('[IntegrationTestRunner] Test results cleared');
  }

  /**
   * Check if tests are currently running
   */
  isRunning(): boolean {
    return this.framework.isTestRunning();
  }

  /**
   * Get available test suites
   */
  getAvailableTestSuites(): string[] {
    return this.framework.getAvailableTestSuites();
  }

  /**
   * Dispose the test runner
   */
  dispose(): void {
    console.log('[IntegrationTestRunner] Disposing test runner...');

    this.framework.dispose();
    this.isInitialized = false;

    console.log('[IntegrationTestRunner] Test runner disposed');
  }
}

/**
 * Static methods for quick test execution
 */
export class IntegrationTestUtils {

  /**
   * Quick smoke test execution
   */
  static async runSmokeTests(): Promise<void> {
    const runner = new IntegrationTestRunner();

    try {
      await runner.runSmokeTests();
    } finally {
      runner.dispose();
    }
  }

  /**
   * Quick comprehensive test execution
   */
  static async runComprehensiveTests(): Promise<void> {
    const runner = new IntegrationTestRunner();

    try {
      await runner.runComprehensiveTests();
    } finally {
      runner.dispose();
    }
  }

  /**
   * Run specific test suite quickly
   */
  static async runTestSuite(suiteName: string): Promise<void> {
    const runner = new IntegrationTestRunner();

    try {
      await runner.runTestSuite(suiteName);
    } finally {
      runner.dispose();
    }
  }

  /**
   * Get test report without running tests
   */
  static getTestReport(): string {
    const runner = new IntegrationTestRunner();
    const report = runner.getTestReport();
    runner.dispose();
    return report;
  }
}

// Export singleton instance for convenience
export const integrationTestRunner = new IntegrationTestRunner();
