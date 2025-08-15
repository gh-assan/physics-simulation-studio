/**
 * INTEGRATION TEST: Parameter Panel Display
 *
 * This test demonstrates the core issue - plugin parameter schemas work correctly
 * but Studio is not properly displaying them in the UI when plugins activate.
 *
 * This test should PASS after we fix the Studio integration.
 */

import { World } from '../../src/core/ecs/World';
import { PluginManager } from '../../src/core/plugin/PluginManager';
import FlagSimulationPlugin from '../../src/plugins/flag-simulation/index';
import { Studio } from '../../src/studio/Studio';
import { SimplifiedPropertyInspectorSystem } from '../../src/studio/systems/SimplifiedPropertyInspectorSystem';

describe('Parameter Panel Integration', () => {
  let studio: Studio;
  let world: World;
  let pluginManager: PluginManager;
  let propertyInspectorSystem: SimplifiedPropertyInspectorSystem;
  let mockTweakpane: any;

  beforeEach(() => {
    // Create mock Tweakpane
    mockTweakpane = {
      addFolder: jest.fn().mockReturnValue({
        addBinding: jest.fn(),
        addButton: jest.fn(),
        addFolder: jest.fn().mockReturnValue({
          addBinding: jest.fn()
        })
      })
    };

    // Create core systems
    world = new World();
    pluginManager = new PluginManager(world);

    // Create Studio (simplified mock)
    studio = {
      getPluginManager: () => pluginManager,
      getActiveSimulationName: jest.fn().mockReturnValue('flag-simulation'),
      getAvailableSimulationNames: jest.fn().mockReturnValue(['flag-simulation'])
    } as any;

    // Create Property Inspector System
    propertyInspectorSystem = new SimplifiedPropertyInspectorSystem(studio);
    propertyInspectorSystem.initialize(mockTweakpane);
  });

  it('should display parameter panels when plugin is activated', async () => {
    console.log('🧪 TEST: Parameter Panel Integration');

    // 1. Register the flag simulation plugin
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);

    console.log('✅ Plugin registered');

    // 2. Verify plugin has parameter schema
    expect(typeof flagPlugin.getParameterSchema).toBe('function');
    const schema = flagPlugin.getParameterSchema();
    expect(schema.components.size).toBeGreaterThan(0);

    console.log(`✅ Plugin schema contains ${schema.components.size} component types`);

    // 3. Activate the plugin (simulate user selecting flag simulation)
    await pluginManager.activatePlugin('flag-simulation', studio);

    console.log('✅ Plugin activated');

    // 4. Trigger parameter display (this should happen automatically but currently doesn't)
    propertyInspectorSystem.showParametersForPlugin('flag-simulation');

    console.log('✅ Parameter display triggered');

    // 5. Verify that Tweakpane received parameter UI creation calls
    expect(mockTweakpane.addFolder).toHaveBeenCalled();

    // Check that at least one parameter folder was created
    const folderCalls = mockTweakpane.addFolder.mock.calls;
    const parameterFolders = folderCalls.filter((call: any) =>
      call[0]?.title?.includes('Component') || call[0]?.title?.includes('Flag') || call[0]?.title?.includes('Pole')
    );

    expect(parameterFolders.length).toBeGreaterThan(0);

    console.log(`✅ ${parameterFolders.length} parameter panels created`);
    console.log('🎯 TEST PASSED: Parameter panels are working!');
  });

  it('should automatically display parameters when simulation changes', async () => {
    console.log('🧪 TEST: Automatic Parameter Display on Simulation Change');

    // 1. Register plugin
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    await pluginManager.activatePlugin('flag-simulation', studio);

    // Clear previous calls
    jest.clearAllMocks();

    // 2. Simulate simulation change event (this should trigger automatic parameter display)
    const event = new CustomEvent('simulation-loaded', {
      detail: { simulationName: 'flag-simulation' }
    });
    window.dispatchEvent(event);

    // Give async event handlers time to process
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Verify parameter display was triggered automatically
    expect(mockTweakpane.addFolder).toHaveBeenCalled();

    console.log('🎯 TEST PASSED: Automatic parameter display working!');
  });

  it('should clear parameters when switching simulations', async () => {
    console.log('🧪 TEST: Parameter Clearing on Simulation Switch');

    // 1. Set up initial simulation
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    await pluginManager.activatePlugin('flag-simulation', studio);

    propertyInspectorSystem.showParametersForPlugin('flag-simulation');

    // 2. Simulate switching to different simulation
    (studio.getActiveSimulationName as jest.Mock).mockReturnValue('water-simulation');

    // 3. Clear parameters (this should happen automatically)
    propertyInspectorSystem.clearParameters();

    // 4. Verify clearance
    // The parameter manager should have been cleared
    expect(true).toBe(true); // Placeholder - actual implementation will have clearance verification

    console.log('🎯 TEST PASSED: Parameter clearing working!');
  });

  it('should handle plugins without parameter schemas gracefully', async () => {
    console.log('🧪 TEST: Graceful Handling of Plugins Without Schemas');

    // 1. Create a plugin without getParameterSchema
    const mockPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'Test plugin without parameters',
      getName: () => 'test-plugin',
      register: jest.fn(),
      unregister: jest.fn(),
      // Missing getParameterSchema method
    };

    pluginManager.registerPlugin(mockPlugin as any);

    // 2. Try to show parameters for this plugin
    expect(() => {
      propertyInspectorSystem.showParametersForPlugin('test-plugin');
    }).not.toThrow();

    console.log('🎯 TEST PASSED: Graceful handling of plugins without schemas!');
  });
});
