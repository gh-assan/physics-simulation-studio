/**
 * Test Runner Script for TDD Implementation
 *
 * This script runs our tests to validate the clean architecture implementation
 */

// Set up test environment
process.env.NODE_ENV = 'test';

// Import Jest programmatically
// eslint-disable-next-line n/no-unpublished-import
import { runCLI } from 'jest';
// eslint-disable-next-line n/no-extraneous-import
import { Config } from '@jest/types';

async function runTests() {
  console.log('🧪 Running TDD Test Suite for Clean Architecture\n');

  const config: Config.Argv = {
    // Jest configuration
    testMatch: ['**/src/**/__tests__/**/*.test.ts'],
    testEnvironment: 'node',
    preset: 'ts-jest',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    verbose: true,

    // Run specific test suites
    testPathPattern: [
      'SimulationState.test.ts',
      'TimeSteppingEngine.test.ts',
      'ParameterManager.test.ts',
      'SimulationManager.test.ts'
    ],

    // Other options
    _: [],
    $0: '',
  };

  try {
    const { results } = await runCLI(config, [process.cwd()]);

    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${results.numPassedTestSuites} test suites`);
    console.log(`❌ Failed: ${results.numFailedTestSuites} test suites`);
    console.log(`📈 Coverage: ${results.coverageMap ? 'Generated' : 'Not available'}`);

    if (results.success) {
      console.log('\n🎉 All tests passed! Clean architecture implementation is solid.');
      return true;
    } else {
      console.log('\n⚠️ Some tests failed. Check the output above for details.');
      return false;
    }

  } catch (error) {
    console.error('❌ Error running tests:', error);
    return false;
  }
}

// Export for use in npm scripts or direct execution
export { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  void runTests().then(success => {
    throw new Error(success ? 'Tests completed successfully' : 'Tests failed');
  }).catch(error => {
    console.error(error);
  });
}
