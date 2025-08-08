/**
 * Integration Tests Module - Phase 7
 *
 * Main entry point for the integration testing framework that validates
 * end-to-end system functionality across all phases.
 */

// Core framework and interfaces
export {
  IntegrationTestFramework,
  IIntegrationTestConfig,
  ITestResult,
  IIntegrationTestSuite,
  IIntegrationTest,
  ITestContext
} from './IntegrationTestFramework';

// Test suites
export { SimplifiedEndToEndTestSuite } from './SimplifiedEndToEndTestSuite';
export { CrossComponentCompatibilityTestSuite } from './CrossComponentCompatibilityTestSuite';

// Test runner and utilities
export {
  IntegrationTestRunner,
  IntegrationTestUtils,
  integrationTestRunner
} from './IntegrationTestRunner';

/**
 * Quick access functions for common testing scenarios
 */

/**
 * Run basic smoke tests to verify system functionality
 */
export async function runSmokeTests(): Promise<void> {
  const { IntegrationTestUtils } = await import('./IntegrationTestRunner');
  await IntegrationTestUtils.runSmokeTests();
}

/**
 * Run comprehensive integration tests across all components
 */
export async function runComprehensiveTests(): Promise<void> {
  const { IntegrationTestUtils } = await import('./IntegrationTestRunner');
  await IntegrationTestUtils.runComprehensiveTests();
}

/**
 * Run a specific test suite by name
 */
export async function runTestSuite(suiteName: string): Promise<void> {
  const { IntegrationTestUtils } = await import('./IntegrationTestRunner');
  await IntegrationTestUtils.runTestSuite(suiteName);
}

/**
 * Get the latest test report
 */
export function getTestReport(): string {
  const { IntegrationTestUtils } = require('./IntegrationTestRunner');
  return IntegrationTestUtils.getTestReport();
}

/**
 * Available test suite names
 */
export const AVAILABLE_TEST_SUITES = [
  'simplified_end_to_end_integration',
  'cross_component_compatibility'
] as const;

/**
 * Integration test configuration constants
 */
export const INTEGRATION_TEST_CONFIG = {
  DEFAULT_TIMEOUT: 10000,
  MEMORY_THRESHOLD_MB: 10,
  PERFORMANCE_THRESHOLD_MS: 100,
  MAX_ENTITIES_FOR_TESTING: 100,
  DEFAULT_UPDATE_DELTA: 16.67 // 60 FPS
} as const;

/**
 * Test phase mappings
 */
export const TEST_PHASE_MAPPING = {
  'Phase 1': ['ECS Framework', 'Core Architecture'],
  'Phase 2': ['Plugin System', 'Plugin Management'],
  'Phase 3': ['Rigid Body Physics', 'Physics Integration'],
  'Phase 4': ['Studio UI', 'User Interface'],
  'Phase 5': ['Simulation Framework', 'Time Stepping', 'Performance'],
  'Phase 6': ['Visualization', 'Graphing', 'Data Display'],
  'Phase 7': ['Integration', 'Testing', 'Optimization', 'Polish']
} as const;
