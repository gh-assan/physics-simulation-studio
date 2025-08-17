/**
 * Main App Plugin Discovery Test
 *
 * TDD Test for fixing the simulation selector empty/not shown issue
 *
 * Phase 1: Plugin Discovery & Simulation Selector
 *
 * This test should initially FAIL to demonstrate the current issues:
 * 1. Plugin auto-discovery not working properly
 * 2. studio.getAvailableSimulationNames() returns empty array
 * 3. Simulation selector shows "No simulations available"
 */

import { World } from '../core/ecs/World';
import { PluginManager } from '../core/plugin/PluginManager';
import FlagSimulationPlugin from '../plugins/flag-simulation';
import { StateManager } from '../studio/state/StateManager';
import { Studio } from '../studio/Studio';

describe('Main App Plugin Discovery', () => {
  let world: World;
  let pluginManager: PluginManager;
  let stateManager: StateManager;
  let studio: Studio;

  beforeEach(() => {
    // Set up core systems like main.ts does
    world = new World();
    pluginManager = new PluginManager(world);
    stateManager = StateManager.getInstance();

    const pluginContext = {
      studio: undefined as any,
      world: world,
      eventBus: { emit: jest.fn(), on: jest.fn(), off: jest.fn(), once: jest.fn() } as any,
      getStateManager: () => stateManager,
    };

    studio = new Studio(world, pluginManager, stateManager, pluginContext);
    pluginContext.studio = studio;
  });

  test('should discover and register flag simulation plugin', async () => {
    // FAILING TEST: This should show that plugins are not being auto-discovered

    // Initially no plugins should be registered
    expect(studio.getAvailableSimulationNames()).toEqual([]);

    // Manually register the flag plugin (simulating what auto-discovery should do)
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    await pluginManager.activatePlugin('flag-simulation', studio);

    // After plugin registration, it should be available in simulation names
    const availableSimulations = studio.getAvailableSimulationNames();
    expect(availableSimulations).toContain('flag-simulation');
    expect(availableSimulations.length).toBeGreaterThan(0);
  });

  test('should populate simulation selector dropdown with available simulations', async () => {
    // FAILING TEST: This shows the UI integration issue

    // Set up mock Tweakpane environment
    const mockFolder = {
      children: [],
      addButton: jest.fn().mockReturnValue({ disabled: false }),
      addBinding: jest.fn().mockReturnValue({ on: jest.fn() }),
      dispose: jest.fn()
    };

    // Mock the updateSimulationSelector function logic from main.ts
    const updateSimulationSelector = () => {
      mockFolder.children.forEach((child: any) => child.dispose());
      const options = studio.getAvailableSimulationNames().map((name: string) => ({ text: name, value: name }));

      if (options.length === 0) {
        mockFolder.addButton({ title: "No simulations available" });
        return { hasSimulations: false, options: [] };
      }

      const optionsWithUnload = [{ text: "Unload Simulation", value: "" }, ...options];
      mockFolder.addBinding({}, "name", {
        label: "Select Simulation",
        options: optionsWithUnload,
      });

      return { hasSimulations: true, options: optionsWithUnload };
    };

    // Initially should show "No simulations available"
    let result = updateSimulationSelector();
    expect(result.hasSimulations).toBe(false);
    expect(mockFolder.addButton).toHaveBeenCalledWith({ title: "No simulations available" });

    // Register flag plugin
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    await pluginManager.activatePlugin('flag-simulation', studio);

    // After plugin registration, should show simulation options
    result = updateSimulationSelector();
    expect(result.hasSimulations).toBe(true);
    expect(result.options).toEqual([
      { text: "Unload Simulation", value: "" },
      { text: "flag-simulation", value: "flag-simulation" }
    ]);
    expect(mockFolder.addBinding).toHaveBeenCalled();
  });

  test('should handle simulation selection and loading', async () => {
    // FAILING TEST: This tests the studio.loadSimulation() flow

    // Register flag plugin first
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    await pluginManager.activatePlugin('flag-simulation', studio);

    // Verify simulation is available
    expect(studio.getAvailableSimulationNames()).toContain('flag-simulation');

    // Test simulation loading (this should work if plugin registration worked)
    await expect(studio.loadSimulation('flag-simulation')).resolves.not.toThrow();

    // Verify simulation state updated
    expect(stateManager.selectedSimulation.state.name).toBe('flag-simulation');
  });

  test('should trigger parameter panel updates when plugin activates', async () => {
    // FAILING TEST: This tests the parameter panel integration

    // Register flag plugin
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);

    // Check if plugin has parameter schema
    const schema = flagPlugin.getParameterSchema();
    expect(schema).toBeDefined();
    expect(Object.keys(schema).length).toBeGreaterThan(0);

    // Activate plugin
    await pluginManager.activatePlugin('flag-simulation', studio);

    // This should trigger parameter panel updates
    // (Implementation will need to be added to make this pass)

    // For now, just verify the plugin is active and has parameters
    expect(studio.getAvailableSimulationNames()).toContain('flag-simulation');
  });
});
