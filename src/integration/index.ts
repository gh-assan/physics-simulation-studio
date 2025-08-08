/**
 * Integration Module - Phase 7
 *
 * Main integration module that provides comprehensive system integration,
 * testing, error handling, and performance monitoring capabilities.
 */

// Export the main testing framework
export * from './tests';

// Export error handling system (when implemented)
// export * from './error-handling';

// Export profiling system (when implemented)
// export * from './profiling';

/**
 * Integration Module Information
 */
export const INTEGRATION_MODULE_INFO = {
  name: 'Phase 7 Integration & Polish',
  version: '1.0.0',
  description: 'Comprehensive integration testing, error handling, and performance monitoring',
  components: [
    'Integration Testing Framework',
    'End-to-End Test Suites',
    'Cross-Component Compatibility Tests',
    'Performance Profiling (planned)',
    'Error Handling System (planned)'
  ],
  status: 'Active Development'
} as const;

/**
 * Quick integration test execution
 */
export { runSmokeTests, runComprehensiveTests } from './tests';

/**
 * Main integration test runner singleton
 */
export { integrationTestRunner } from './tests';
