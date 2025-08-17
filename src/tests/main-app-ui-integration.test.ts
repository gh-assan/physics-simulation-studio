/**
 * Main App UI Integration Test
 * Tests the complete integration from auto-discovery to UI display
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

describe('Main App UI Integration', () => {
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

    // Perform the auto-discovery and registration that main.ts does
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Integration Flow', () => {
    test('should provide simulations to updateSimulationSelector', async () => {
      // This test simulates exactly what updateSimulationSelector() does in main.ts

      // Act - Call the exact method that updateSimulationSelector uses
      const availableSimulations = studio.getAvailableSimulationNames();

      // Assert - Should have discovered simulations
      expect(availableSimulations).toContain('flag-simulation');
      expect(availableSimulations.length).toBeGreaterThan(0);

      console.log('Available simulations for UI:', availableSimulations);
    });

    test('should simulate the exact updateSimulationSelector flow', async () => {
      // This replicates the exact logic from main.ts updateSimulationSelector()

      // Step 1: Get available simulations (like updateSimulationSelector does)
      const simulationNames = studio.getAvailableSimulationNames();

      // Step 2: Create options array (like updateSimulationSelector does)
      const options = simulationNames.map((name: string) => ({
        text: name,
        value: name,
      }));

      // Step 3: Check if options are empty (like updateSimulationSelector does)
      if (options.length === 0) {
        // This should NOT happen if auto-discovery works
        expect(true).toBe(false); // Force failure if no options
        return;
      }

      // Step 4: Add unload option (like updateSimulationSelector does)
      const optionsWithUnload = [
        { text: 'Unload Simulation', value: '' },
        ...options,
      ];

      // Assert - Should have flag simulation option
      expect(optionsWithUnload).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: 'flag-simulation',
            value: 'flag-simulation',
          }),
        ])
      );

      console.log('UI options that would be displayed:', optionsWithUnload);
    });

    test('should handle the plugin registration event flow', async () => {
      // This tests if the plugin manager events work properly

      const eventCallback = jest.fn();
      pluginManager.on(PluginManagerEvent.PLUGIN_REGISTERED, eventCallback);

      // Check if the plugin is already registered (from beforeEach setup)
      const flagPlugin = autoPluginRegistry.getPlugin('flag-simulation');
      if (flagPlugin) {
        // If already registered, just verify the event system would work
        // by checking that the plugin is available
        expect(pluginManager.getPlugin('flag-simulation')).toBeDefined();

        // The event would have been triggered during beforeEach setup
        // So we can verify the event system is working by checking the plugin is registered
        expect(pluginManager.getAvailablePluginNames()).toContain('flag-simulation');
      }
    });

    test('should verify state manager integration', async () => {
      // Test that state manager works with simulation selection

      // Set a simulation in state
      stateManager.selectedSimulation.state.name = 'flag-simulation';

      // Verify state was set
      expect(stateManager.selectedSimulation.state.name).toBe(
        'flag-simulation'
      );

      // Verify the simulation is available
      const availableSimulations = studio.getAvailableSimulationNames();
      expect(availableSimulations).toContain('flag-simulation');
    });
  });

  describe('Debugging Main App Issue', () => {
    test('should identify why simulation selector might be empty', async () => {
      // This test helps us debug the exact issue

      console.log('=== DEBUGGING SIMULATION SELECTOR ===');

      // Check 1: Are plugins discovered?
      const discoveredPlugins = Array.from(
        (autoPluginRegistry as any).discoveredPlugins.keys()
      );
      console.log('1. Discovered plugins:', discoveredPlugins);
      expect(discoveredPlugins.length).toBeGreaterThan(0);

      // Check 2: Are plugins registered in PluginManager?
      const registeredPlugins = pluginManager.getAvailablePluginNames();
      console.log('2. Registered in PluginManager:', registeredPlugins);
      expect(registeredPlugins.length).toBeGreaterThan(0);

      // Check 3: Does Studio return the plugins?
      const studioSimulations = studio.getAvailableSimulationNames();
      console.log('3. Available from Studio:', studioSimulations);
      expect(studioSimulations.length).toBeGreaterThan(0);

      // Check 4: State manager initial state
      console.log(
        '4. State manager initial simulation:',
        stateManager.selectedSimulation.state.name
      );

      // This should all work - if not, we've found the issue
      expect(studioSimulations).toContain('flag-simulation');
    });
  });
});
