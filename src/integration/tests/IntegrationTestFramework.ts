/**
 * Integration Test Framework - Phase 7
 *
 * Comprehensive end-to-end testing framework for validating the complete
 * physics simulation studio system integration across all phases.
 */

import { World } from '../../core/ecs/World';
import { PluginManager } from '../../core/plugin/PluginManager';
import { SimulationFramework } from '../../core/simulation/SimulationFramework';
import { GraphManager } from '../../studio/visualization/GraphManager';
import { GraphRegistry } from '../../studio/visualization/GraphRegistry';
import { IEntityManager } from '../../core/ecs/IEntityManager';
import { IComponentManager } from '../../core/ecs/IComponentManager';
import { ISystemManager } from '../../core/ecs/ISystemManager';

export interface IIntegrationTestConfig {
  name: string;
  description: string;
  phases: string[];
  timeout: number;
  cleanup: boolean;
  enableProfiling?: boolean;
  memoryTracking?: boolean;
}

export interface ITestResult {
  testName: string;
  passed: boolean;
  duration: number;
  memoryUsage?: number;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

export interface IIntegrationTestSuite {
  name: string;
  tests: IIntegrationTest[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export interface IIntegrationTest {
  config: IIntegrationTestConfig;
  execute: (context: ITestContext) => Promise<ITestResult>;
}

export interface ITestContext {
  world: World;
  pluginManager: PluginManager;
  simulationFramework: SimulationFramework;
  graphManager: GraphManager;
  graphRegistry: GraphRegistry;
  entityManager: IEntityManager;
  componentManager: IComponentManager;
  systemManager: ISystemManager;
  startTime: number;
  memoryBaseline: number;
}

/**
 * Integration Test Framework
 *
 * Orchestrates comprehensive testing across all system components to validate
 * end-to-end functionality, performance, and integration correctness.
 */
export class IntegrationTestFramework {
  private testSuites: Map<string, IIntegrationTestSuite> = new Map();
  private testResults: Map<string, ITestResult[]> = new Map();
  private isRunning = false;
  private context: ITestContext | null = null;

  constructor() {
    console.log('[IntegrationTestFramework] Initialized');
  }

  /**
   * Register a test suite
   */
  registerTestSuite(suite: IIntegrationTestSuite): void {
    if (this.testSuites.has(suite.name)) {
      throw new Error(`Test suite ${suite.name} already registered`);
    }

    this.testSuites.set(suite.name, suite);
    console.log(`[IntegrationTestFramework] Registered test suite: ${suite.name} (${suite.tests.length} tests)`);
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<Map<string, ITestResult[]>> {
    console.log('[IntegrationTestFramework] Starting comprehensive integration tests...');

    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    this.testResults.clear();

    try {
      // Setup global test context
      await this.setupGlobalContext();

      // Run each test suite
      for (const [suiteName, suite] of this.testSuites) {
        console.log(`[IntegrationTestFramework] Running test suite: ${suiteName}`);

        try {
          // Setup suite-specific context
          if (suite.setup) {
            await suite.setup();
          }

          // Run all tests in the suite
          const suiteResults: ITestResult[] = [];
          for (const test of suite.tests) {
            const result = await this.runTest(test);
            suiteResults.push(result);
          }

          this.testResults.set(suiteName, suiteResults);

          // Teardown suite-specific context
          if (suite.teardown) {
            await suite.teardown();
          }

          console.log(`[IntegrationTestFramework] Completed test suite: ${suiteName} (${suiteResults.length} tests)`);
        } catch (error) {
          console.error(`[IntegrationTestFramework] Error in test suite ${suiteName}:`, error);

          // Create error result
          const errorResult: ITestResult = {
            testName: `${suiteName}_suite_error`,
            passed: false,
            duration: 0,
            errors: [`Suite setup/teardown error: ${error}`],
            warnings: []
          };

          this.testResults.set(suiteName, [errorResult]);
        }
      }

      console.log('[IntegrationTestFramework] All integration tests completed');
      return this.testResults;

    } finally {
      await this.teardownGlobalContext();
      this.isRunning = false;
    }
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suiteName: string): Promise<ITestResult[]> {
    const suite = this.testSuites.get(suiteName);
    if (!suite) {
      throw new Error(`Test suite ${suiteName} not found`);
    }

    console.log(`[IntegrationTestFramework] Running specific test suite: ${suiteName}`);

    try {
      await this.setupGlobalContext();

      if (suite.setup) {
        await suite.setup();
      }

      const results: ITestResult[] = [];
      for (const test of suite.tests) {
        const result = await this.runTest(test);
        results.push(result);
      }

      if (suite.teardown) {
        await suite.teardown();
      }

      this.testResults.set(suiteName, results);
      return results;

    } finally {
      await this.teardownGlobalContext();
    }
  }

  /**
   * Run a single test
   */
  private async runTest(test: IIntegrationTest): Promise<ITestResult> {
    const { config } = test;
    console.log(`[IntegrationTestFramework] Running test: ${config.name}`);

    const startTime = performance.now();
    const memoryStart = this.getMemoryUsage();

    try {
      // Update context timing
      if (this.context) {
        this.context.startTime = startTime;
        this.context.memoryBaseline = memoryStart;
      }

      // Execute the test with timeout
      const result = await Promise.race([
        test.execute(this.context!),
        new Promise<ITestResult>((_, reject) => {
          setTimeout(() => reject(new Error('Test timeout')), config.timeout);
        })
      ]);

      const endTime = performance.now();
      const memoryEnd = this.getMemoryUsage();

      // Enhance result with timing and memory info
      result.duration = endTime - startTime;
      result.memoryUsage = memoryEnd - memoryStart;

      console.log(`[IntegrationTestFramework] Test ${config.name} ${result.passed ? 'PASSED' : 'FAILED'} (${result.duration.toFixed(1)}ms)`);

      if (result.errors.length > 0) {
        console.warn(`[IntegrationTestFramework] Test ${config.name} errors:`, result.errors);
      }

      if (result.warnings.length > 0) {
        console.warn(`[IntegrationTestFramework] Test ${config.name} warnings:`, result.warnings);
      }

      return result;

    } catch (error) {
      const endTime = performance.now();

      console.error(`[IntegrationTestFramework] Test ${config.name} threw an error:`, error);

      return {
        testName: config.name,
        passed: false,
        duration: endTime - startTime,
        memoryUsage: this.getMemoryUsage() - memoryStart,
        errors: [`Test execution error: ${error}`],
        warnings: []
      };
    }
  }

  /**
   * Setup global test context
   */
  private async setupGlobalContext(): Promise<void> {
    console.log('[IntegrationTestFramework] Setting up global test context...');

    try {
      // Initialize core ECS world
      const world = new World();

      // Initialize managers
      const entityManager = world.entityManager;
      const componentManager = world.componentManager;
      const systemManager = world.systemManager;

      // Initialize plugin system
      const pluginManager = new PluginManager(world);

      // Initialize simulation framework
      const simulationFramework = new SimulationFramework();

      // Initialize visualization system
      const graphManager = new GraphManager({
        enableAnimations: false, // Disable animations in tests
        defaultUpdateFrequency: 1 // Low frequency for tests
      });
      const graphRegistry = new GraphRegistry(graphManager);

      this.context = {
        world,
        pluginManager,
        simulationFramework,
        graphManager,
        graphRegistry,
        entityManager,
        componentManager,
        systemManager,
        startTime: 0,
        memoryBaseline: 0
      };

      console.log('[IntegrationTestFramework] Global test context setup complete');

    } catch (error) {
      console.error('[IntegrationTestFramework] Failed to setup global context:', error);
      throw error;
    }
  }

  /**
   * Teardown global test context
   */
  private async teardownGlobalContext(): Promise<void> {
    console.log('[IntegrationTestFramework] Tearing down global test context...');

    if (this.context) {
      try {
        // Dispose visualization system
        this.context.graphManager.dispose();
        this.context.graphRegistry.dispose();

        // Dispose simulation framework
        await this.context.simulationFramework.dispose();

        // Clear world state
        this.context.world.clear(true); // Clear entities, components, and systems

        console.log('[IntegrationTestFramework] Global test context teardown complete');
      } catch (error) {
        console.error('[IntegrationTestFramework] Error during teardown:', error);
      }
    }

    this.context = null;
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
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
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let totalDuration = 0;
    let totalMemoryUsage = 0;
    let memoryCount = 0;

    for (const results of this.testResults.values()) {
      for (const result of results) {
        totalTests++;
        if (result.passed) {
          passedTests++;
        } else {
          failedTests++;
        }
        totalDuration += result.duration;

        if (result.memoryUsage) {
          totalMemoryUsage += result.memoryUsage;
          memoryCount++;
        }
      }
    }

    return {
      totalSuites: this.testResults.size,
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
      avgMemoryUsage: memoryCount > 0 ? totalMemoryUsage / memoryCount : 0
    };
  }

  /**
   * Generate detailed test report
   */
  generateReport(): string {
    const summary = this.getTestSummary();
    let report = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                        INTEGRATION TEST REPORT                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Total Test Suites: ${summary.totalSuites.toString().padStart(3)}                                              ║
║  Total Tests:       ${summary.totalTests.toString().padStart(3)}                                              ║
║  Passed Tests:      ${summary.passedTests.toString().padStart(3)}                                              ║
║  Failed Tests:      ${summary.failedTests.toString().padStart(3)}                                              ║
║  Success Rate:      ${((summary.passedTests / summary.totalTests) * 100).toFixed(1).padStart(5)}%                                         ║
║  Total Duration:    ${summary.totalDuration.toFixed(1).padStart(8)}ms                                     ║
║  Avg Memory Usage:  ${(summary.avgMemoryUsage / 1024 / 1024).toFixed(1).padStart(6)}MB                                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

DETAILED RESULTS:
`;

    for (const [suiteName, results] of this.testResults) {
      report += `\n📋 Test Suite: ${suiteName}\n`;
      report += '─'.repeat(50) + '\n';

      for (const result of results) {
        const status = result.passed ? '✅' : '❌';
        const duration = result.duration.toFixed(1).padStart(6);
        const memoryStr = result.memoryUsage
          ? `${(result.memoryUsage / 1024 / 1024).toFixed(1).padStart(5)}MB`
          : '  N/A  ';

        report += `${status} ${result.testName.padEnd(30)} ${duration}ms  ${memoryStr}\n`;

        if (result.errors.length > 0) {
          report += `   Errors: ${result.errors.join(', ')}\n`;
        }

        if (result.warnings.length > 0) {
          report += `   Warnings: ${result.warnings.join(', ')}\n`;
        }
      }
    }

    return report;
  }

  /**
   * Clear all test results
   */
  clearResults(): void {
    this.testResults.clear();
    console.log('[IntegrationTestFramework] Test results cleared');
  }

  /**
   * Get all test results
   */
  getAllResults(): Map<string, ITestResult[]> {
    return new Map(this.testResults);
  }

  /**
   * Check if tests are currently running
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get available test suites
   */
  getAvailableTestSuites(): string[] {
    return Array.from(this.testSuites.keys());
  }

  /**
   * Dispose framework
   */
  dispose(): void {
    console.log('[IntegrationTestFramework] Disposing...');

    this.clearResults();
    this.testSuites.clear();

    if (this.context) {
      void this.teardownGlobalContext();
    }

    console.log('[IntegrationTestFramework] Disposed');
  }
}
