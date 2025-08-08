/**
 * Integration Test Demo - Phase 7
 *
 * Demo script to showcase the integration testing framework in action.
 */

import { integrationTestRunner } from './tests';

async function runIntegrationTestDemo() {
  console.log('🚀 Starting Phase 7 Integration Test Demo...\n');

  try {
    // Initialize the test runner
    await integrationTestRunner.initialize();
    console.log('✅ Integration test runner initialized\n');

    // Show available test suites
    const availableSuites = integrationTestRunner.getAvailableTestSuites();
    console.log('📋 Available Test Suites:');
    availableSuites.forEach(suite => console.log(`   - ${suite}`));
    console.log('');

    // Run smoke tests first
    console.log('🔥 Running Smoke Tests (Quick Validation)...\n');
    try {
      await integrationTestRunner.runSmokeTests();
      console.log('✅ Smoke tests completed successfully!\n');
    } catch (error) {
      console.error('❌ Smoke tests failed:', error);
    }

    // Get and display test summary
    const summary = integrationTestRunner.getTestSummary();
    console.log('📊 Test Summary:');
    console.log(`   Total Test Suites: ${summary.totalSuites}`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Passed Tests: ${summary.passedTests}`);
    console.log(`   Failed Tests: ${summary.failedTests}`);
    console.log(`   Success Rate: ${summary.totalTests > 0 ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1) : 0}%`);
    console.log(`   Total Duration: ${summary.totalDuration.toFixed(1)}ms`);
    console.log('');

    // Generate detailed report
    const report = integrationTestRunner.getTestReport();
    console.log('📄 Detailed Test Report:');
    console.log(report);

  } catch (error) {
    console.error('❌ Integration test demo failed:', error);
  } finally {
    // Clean up
    integrationTestRunner.dispose();
    console.log('🧹 Integration test runner disposed');
  }
}

// Run the demo
if (require.main === module) {
  runIntegrationTestDemo().catch(console.error);
}

export { runIntegrationTestDemo };
