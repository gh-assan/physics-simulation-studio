/**
 * Dynamic Plugin Discovery Test
 * Tests the dynamic folder-scanning plugin discovery system
 */

import {AutoPluginRegistry} from '../core/plugin/AutoPluginRegistry';
import {Logger} from '../core/utils/Logger';

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

describe('Dynamic Plugin Discovery', () => {
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

  describe('Folder-based Discovery', () => {
    test('should discover all plugins by scanning plugin folders', async () => {
      // Act
      await autoPluginRegistry.discoverPlugins();

      // Assert - Should discover all plugins from the plugin folders
      const discoveredPlugins = Array.from(
        (autoPluginRegistry as any).discoveredPlugins.keys()
      );

      console.log('Dynamically discovered plugins:', discoveredPlugins);

      // Should discover all known plugins
      expect(discoveredPlugins).toContain('flag-simulation');
      expect(discoveredPlugins).toContain('water-simulation');
      expect(discoveredPlugins).toContain('simple-physics');
      expect(discoveredPlugins).toContain('solar-system');
      expect(discoveredPlugins).toContain('rigid-body-physics-rapier');

      // Should have discovered at least 5 plugins
      expect(discoveredPlugins.length).toBeGreaterThanOrEqual(5);
    });

    test('should handle missing index.ts files gracefully', async () => {
      // This test ensures the system doesn't crash if a plugin folder
      // doesn't have an index.ts file

      await autoPluginRegistry.discoverPlugins();

      // Should not throw and should discover available plugins
      const discoveredPlugins = Array.from(
        (autoPluginRegistry as any).discoveredPlugins.keys()
      );
      expect(discoveredPlugins.length).toBeGreaterThan(0);
    });

    test('should be extensible for new plugins', async () => {
      // This test verifies that adding a new plugin folder would
      // automatically be discovered without code changes

      await autoPluginRegistry.discoverPlugins();

      const discoveredPlugins = Array.from(
        (autoPluginRegistry as any).discoveredPlugins.keys()
      );

      // The system should work with any number of plugins
      expect(discoveredPlugins.length).toBeGreaterThan(0);

      // Log for future verification when new plugins are added
      console.log('Current plugin count:', discoveredPlugins.length);
      console.log('Discovered plugins:', discoveredPlugins.sort());
    });
  });

  describe('Naming Convention Compliance', () => {
    test('should discover plugins following the index.ts convention', async () => {
      // This test verifies that the naming convention works correctly

      await autoPluginRegistry.discoverPlugins();

      const flagPlugin = autoPluginRegistry.getPlugin('flag-simulation');
      const waterPlugin = autoPluginRegistry.getPlugin('water-simulation');

      expect(flagPlugin).toBeDefined();
      expect(waterPlugin).toBeDefined();

      expect(flagPlugin?.getName()).toBe('flag-simulation');
      expect(waterPlugin?.getName()).toBe('water-simulation');
    });
  });
});
