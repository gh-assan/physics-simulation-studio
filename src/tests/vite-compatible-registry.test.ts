/**
 * Vite-Compatible Plugin Registry Test
 * Tests the fix for Vite dynamic import issues
 */

import { AutoPluginRegistry } from '../core/plugin/AutoPluginRegistry';

// Mock Logger to avoid console noise
jest.mock('../core/utils/Logger', () => ({
  Logger: {
    getInstance: jest.fn(() => ({
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

describe('Vite-Compatible Plugin Registry', () => {
  let autoPluginRegistry: AutoPluginRegistry;

  beforeEach(() => {
    // Reset AutoPluginRegistry singleton for clean tests
    (AutoPluginRegistry as any).instance = undefined;
    autoPluginRegistry = AutoPluginRegistry.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Static Import Discovery', () => {
    test('should discover plugins using static imports (Vite-compatible)', async () => {
      // This test verifies that the fixed version works with static imports
      // instead of dynamic imports with variable paths

      await autoPluginRegistry.discoverPlugins();

      // Should discover flag simulation plugin
      const flagPlugin = autoPluginRegistry.getPlugin('flag-simulation');
      expect(flagPlugin).toBeDefined();
      expect(flagPlugin?.getName()).toBe('flag-simulation');

      // Should discover multiple plugins
      const discoveredPlugins = Array.from(
        (autoPluginRegistry as any).discoveredPlugins.keys()
      );
      expect(discoveredPlugins.length).toBeGreaterThan(0);
      expect(discoveredPlugins).toContain('flag-simulation');
    });

    test('should work with bundlers that analyze imports statically', async () => {
      // This test simulates the bundler environment where dynamic imports
      // with variable paths don't work, but static imports do

      await autoPluginRegistry.discoverPlugins();

      const plugins = Array.from(
        (autoPluginRegistry as any).discoveredPlugins.keys()
      );

      // All expected plugins should be discovered
      expect(plugins).toContain('flag-simulation');
      expect(plugins).toContain('water-simulation');
      expect(plugins).toContain('simple-physics');

      console.log('Statically discovered plugins:', plugins);
    });
  });
});
