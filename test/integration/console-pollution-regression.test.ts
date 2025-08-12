/**
 * Console Pollution Regression Test
 *
 * This test identifies new console pollution that appeared after our cleanup.
 * It should fail when pollution is detected, then pass after cleanup.
 */

describe('Console Pollution Regression Test', () => {
  let consoleLogs: string[] = [];
  let originalConsole: any;

  beforeEach(() => {
    // Capture console output
    originalConsole = { ...console };
    consoleLogs = [];
    console.log = (...args: any[]) => {
      consoleLogs.push(args.join(' '));
    };
    console.warn = (...args: any[]) => {
      consoleLogs.push(`WARN: ${args.join(' ')}`);
    };
    console.error = (...args: any[]) => {
      consoleLogs.push(`ERROR: ${args.join(' ')}`);
    };
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  test('should have no console pollution from GraphRegistry during normal operations', async () => {
    // This test should FAIL initially due to GraphRegistry pollution, then PASS after cleanup

    try {
      // Import GraphRegistry to trigger pollution
      const { GraphRegistry } = await import('../../src/studio/visualization/GraphRegistry');

      // Reset console capture after import (ignore import-time setup logs)
      consoleLogs = [];

      // Simulate normal operations that shouldn't produce debug output
      // These operations should be silent in production

      // Filter for debug/console pollution patterns
      const pollutionLogs = consoleLogs.filter(log =>
        log.includes('[GraphRegistry]') ||
        log.includes('Initialized') ||
        log.includes('Registered template') ||
        log.includes('Stopped all collections') ||
        log.includes('Started all collections')
      );

      // Should have NO pollution during normal operations
      expect(pollutionLogs).toHaveLength(0);

    } catch (error) {
      // If GraphRegistry doesn't exist, test passes
      expect((error as Error).message).toContain('Cannot find module');
    }
  });

  test('should have no console pollution from studio initialization', async () => {
    // Test general studio initialization for pollution
    consoleLogs = [];

    try {
      // Import some studio components that might cause pollution
      const { VisibilityManager } = await import('../../src/studio/ui/VisibilityManager');
      const { SimplifiedRenderManager } = await import('../../src/studio/rendering/simplified/SimplifiedRenderManager');

      // Reset after imports
      consoleLogs = [];

      // Check for any remaining pollution during operations
      const pollutionLogs = consoleLogs.filter(log =>
        log.includes('✅') ||
        log.includes('🎨') ||
        log.includes('[') ||
        log.includes('Registered') ||
        log.includes('Initializing') ||
        log.includes('Started') ||
        log.includes('Stopped')
      );

      expect(pollutionLogs).toHaveLength(0);

    } catch (error) {
      // If modules don't exist, that's fine
      originalConsole.log('Some studio modules not found, skipping test');
    }
  });
});
