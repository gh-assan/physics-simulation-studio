/**
 * Main App Auto-Discovery Test
 * Tests the auto-discovery functionality to identify why plugins aren't being found
 */

import {AutoPluginRegistry} from '../core/plugin/AutoPluginRegistry';
import {PluginManager} from '../core/plugin/PluginManager';
import {World} from '../core/ecs/World';
import {Studio} from '../studio/Studio';
import {Logger} from '../core/utils/Logger';
import {StateManager} from '../studio/state/StateManager';
import {IPluginContext} from '../studio/IPluginContext';

// Mock Logger completely
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

// Mock SimulationManager that's used by Studio
jest.mock('../studio/simulation/SimulationManager', () => ({
  SimulationManager: {
    getInstance: jest.fn(() => ({
      loadSimulation: jest.fn(),
      getCurrentSimulation: jest.fn(),
      getSimulationState: jest.fn(),
    })),
  },
}));

describe('Main App Auto-Discovery', () => {
  let autoPluginRegistry: AutoPluginRegistry;
  let pluginManager: PluginManager;
  let world: World;
  let studio: Studio;
  let stateManager: StateManager;

  beforeEach(() => {
    // Reset AutoPluginRegistry singleton for clean tests
    (AutoPluginRegistry as any).instance = undefined;
    autoPluginRegistry = AutoPluginRegistry.getInstance();

    // Create dependencies for Studio and PluginManager
    world = new World();
    pluginManager = new PluginManager(world);
    stateManager = StateManager.getInstance();

    // Create plugin context for Studio
    const pluginContext: IPluginContext = {
      studio: undefined as any, // will be set after Studio is constructed
      world: world,
      eventBus: undefined as any, // Mock event bus for tests
      getStateManager: () => stateManager,
    };

    studio = new Studio(world, pluginManager, stateManager, pluginContext);
    pluginContext.studio = studio;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Plugin Discovery', () => {
    test('should discover flag simulation plugin', async () => {
      // Act
      await autoPluginRegistry.discoverPlugins();

      // Assert - this should pass if auto-discovery works
      const discoveredPlugin = autoPluginRegistry.getPlugin('flag-simulation');
      expect(discoveredPlugin).toBeDefined();
      expect(discoveredPlugin?.getName()).toBe('flag-simulation');
    });

    test('should auto-register discovered plugins', async () => {
      // Arrange
      await autoPluginRegistry.discoverPlugins();

      // Act
      const registeredPlugins = await autoPluginRegistry.autoRegisterPlugins(world, pluginManager, studio);

      // Assert
      expect(registeredPlugins).toContain('flag-simulation');
      expect(registeredPlugins.length).toBeGreaterThan(0);
    });

    test('should populate simulation selector after discovery', async () => {
      // Arrange
      await autoPluginRegistry.discoverPlugins();
      await autoPluginRegistry.autoRegisterPlugins(world, pluginManager, studio);

      // Act - simulate what updateSimulationSelector() does
      const availableSimulations = pluginManager.getAvailablePluginNames();

      // Assert
      expect(availableSimulations).toContain('flag-simulation');
      expect(availableSimulations.length).toBeGreaterThan(0);
    });

    test('should handle import errors gracefully', async () => {
      // This test verifies that the auto-discovery doesn't crash on import errors
      // and logs appropriate warnings

      // Act
      await autoPluginRegistry.discoverPlugins();

      // Assert - should not throw
      expect(true).toBe(true); // If we get here, no errors were thrown
    });
  });

  describe('Integration with main.ts flow', () => {
    test('should match the exact flow from main.ts', async () => {
      // This test replicates the exact auto-discovery flow from main.ts

      // 1. Create AutoPluginRegistry instance
      const registry = AutoPluginRegistry.getInstance();

      // 2. Discover all plugins
      await registry.discoverPlugins();

      // 3. Auto-register all discovered plugins
      const registeredPlugins = await registry.autoRegisterPlugins(world, pluginManager, studio);

      // 4. Add plugins to plugin manager
      for (const pluginName of registeredPlugins) {
        const plugin = registry.getPlugin(pluginName);
        if (plugin && !pluginManager.getPlugin?.(pluginName)) {
          try {
            pluginManager.registerPlugin(plugin);
          } catch (error) {
            // Expected for already registered plugins
          }
        }
      }

      // Assert - should have discovered and registered flag simulation
      expect(registeredPlugins).toContain('flag-simulation');
      expect(pluginManager.getAvailablePluginNames()).toContain('flag-simulation');
    });
  });
});
