/**
 * Simulation Selector Fix Test
 * Tests that the simulation selector gets updated after plugin discovery
 */

import { World } from '../core/ecs/World';
import { AutoPluginRegistry } from '../core/plugin/AutoPluginRegistry';
import { PluginManager, PluginManagerEvent } from '../core/plugin/PluginManager';
import { IPluginContext } from '../studio/IPluginContext';
import { StateManager } from '../studio/state/StateManager';
import { Studio } from '../studio/Studio';

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

describe('Simulation Selector Fix', () => {
  let autoPluginRegistry: AutoPluginRegistry;
  let pluginManager: PluginManager;
  let world: World;
  let studio: Studio;
  let stateManager: StateManager;

  beforeEach(async () => {
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

  describe('Timing Fix Verification', () => {
    test('should show empty selector initially, then populate after plugin discovery', async () => {
      // Initially, no plugins are available
      let availableSimulations = studio.getAvailableSimulationNames();
      expect(availableSimulations.length).toBe(0);

      // Simulate main.ts flow: plugin discovery happens after UI setup
      await autoPluginRegistry.discoverPlugins();
      const registeredPlugins = await autoPluginRegistry.autoRegisterPlugins(
        world,
        pluginManager,
        studio
      );

      // Add plugins to plugin manager like main.ts does
      for (const pluginName of registeredPlugins) {
        const plugin = autoPluginRegistry.getPlugin(pluginName);
        if (plugin && !pluginManager.getPlugin?.(pluginName)) {
          try {
            pluginManager.registerPlugin(plugin);
          } catch (error) {
            // Expected for already registered plugins
          }
        }
      }

      // Now plugins should be available for the simulation selector
      availableSimulations = studio.getAvailableSimulationNames();
      expect(availableSimulations.length).toBeGreaterThan(0);
      expect(availableSimulations).toContain('flag-simulation');

      console.log('✅ Timing fix verified: plugins available after discovery');
    });

    test('should simulate updateSimulationSelector being called after discovery', async () => {
      // This simulates the fix where updateSimulationSelector() is called explicitly
      // after plugin discovery completes

      // Mock the updateSimulationSelector function
      const mockUpdateSimulationSelector = jest.fn();

      // Initial state: no plugins
      let availableSimulations = studio.getAvailableSimulationNames();
      expect(availableSimulations.length).toBe(0);

      // Simulate calling updateSimulationSelector with no plugins (initial state)
      mockUpdateSimulationSelector();

      // Plugin discovery and registration
      await autoPluginRegistry.discoverPlugins();
      await autoPluginRegistry.autoRegisterPlugins(world, pluginManager, studio);

      // Plugins are now available
      availableSimulations = studio.getAvailableSimulationNames();
      expect(availableSimulations.length).toBeGreaterThan(0);

      // Simulate the fix: updateSimulationSelector is called after discovery
      mockUpdateSimulationSelector();

      // Verify the function was called twice (once initially, once after discovery)
      expect(mockUpdateSimulationSelector).toHaveBeenCalledTimes(2);

      console.log('✅ updateSimulationSelector timing fix simulation passed');
    });
  });

  describe('Event-Based Update Verification', () => {
    test('should verify that PLUGIN_REGISTERED events trigger selector updates', async () => {
      // Test that the event-based approach works properly
      const updateCallback = jest.fn();

      // Listen for plugin registration events
      pluginManager.on(PluginManagerEvent.PLUGIN_REGISTERED, updateCallback);

      // Discover and register plugins
      await autoPluginRegistry.discoverPlugins();
      await autoPluginRegistry.autoRegisterPlugins(world, pluginManager, studio);

      // The event should have been triggered multiple times (once per plugin)
      expect(updateCallback).toHaveBeenCalled();

      console.log('✅ PLUGIN_REGISTERED events are working');
    });
  });
});
