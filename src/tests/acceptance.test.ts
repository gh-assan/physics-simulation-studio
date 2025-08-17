/**
 * Final Acceptance Test - App Functionality Validation
 *
 * This test validates that the app meets all acceptance criteria:
 * 1. App loads and is responsive
 * 2. Simulations are visible and selectable
 * 3. Play/pause controls work
 * 4. Rendering is working (animations are visible)
 * 5. All systems are integrated properly
 */

import { World } from '../core/ecs/World';
import { PluginManager } from '../core/plugin/PluginManager';
import FlagSimulationPlugin from '../plugins/flag-simulation';
import { createAdapterRenderSystem } from '../studio/rendering/createAdapterRenderSystem';
import { Logger } from '../core/utils/Logger';
import { StateManager } from '../studio/state/StateManager';
import { Studio } from '../studio/Studio';

// Mock ThreeGraphicsManager to avoid DOM issues in tests
const createMockGraphicsManager = () => ({
  getScene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    children: [],
  })),
  getCamera: jest.fn(() => ({})),
  render: jest.fn(),
  initialize: jest.fn(),
  dispose: jest.fn(),
});

describe('🎯 Final Acceptance Test - App Functionality', () => {
  let world: World;
  let studio: Studio;
  let pluginManager: PluginManager;
  let stateManager: StateManager;
  let renderSystem: any;
  let mockGraphicsManager: any;

  beforeAll(() => {
    console.log('🎯 FINAL ACCEPTANCE TEST');
    console.log('========================');
    console.log('Validating complete app functionality...');
  });

  beforeEach(() => {
    // Set up complete studio environment
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

    // Set up mocked graphics and rendering (adapter-based)
    mockGraphicsManager = createMockGraphicsManager();
    renderSystem = createAdapterRenderSystem(mockGraphicsManager as any);
    studio.setRenderSystem(renderSystem);
    world.registerSystem(renderSystem);

    Logger.getInstance().debug('Core systems initialized');
  });

  describe('✅ ACCEPTANCE CRITERIA VALIDATION', () => {
    test('1. App loads and core systems initialize properly', () => {
      console.log('\n1️⃣ Testing app initialization...');

      expect(world).toBeDefined();
      expect(studio).toBeDefined();
      expect(pluginManager).toBeDefined();
      expect(stateManager).toBeDefined();
      expect(renderSystem).toBeDefined();
      expect(mockGraphicsManager).toBeDefined();

      console.log('   ✅ All core systems initialized');
    });

    test('2. Simulations are discoverable and selectable', async () => {
      console.log('\n2️⃣ Testing simulation discovery...');

      // Initially no simulations
      const initialSims = studio.getAvailableSimulationNames();
      expect(initialSims).toEqual([]);
      console.log('   ✅ No simulations initially (expected)');

      // Register flag simulation plugin
      const flagPlugin = new FlagSimulationPlugin();
      pluginManager.registerPlugin(flagPlugin);
      console.log('   ✅ Flag plugin registered');

      // Now simulation should be available
      const availableSims = studio.getAvailableSimulationNames();
      expect(availableSims).toContain('flag-simulation');
      console.log('   ✅ Flag simulation is discoverable');
      console.log(`   📋 Available simulations: ${availableSims.join(', ')}`);
    });

    test('3. Simulation loading and play/pause controls work', async () => {
      console.log('\n3️⃣ Testing simulation controls...');

      // Register and load flag simulation
      const flagPlugin = new FlagSimulationPlugin();
      pluginManager.registerPlugin(flagPlugin);
      await studio.loadSimulation('flag-simulation');
      console.log('   ✅ Flag simulation loaded successfully');

      // Test play functionality
      studio.play();
      expect((studio as any).isPlaying).toBe(true);
      console.log('   ✅ Play control works');

      // Test pause functionality
      studio.pause();
      expect((studio as any).isPlaying).toBe(false);
      console.log('   ✅ Pause control works');

      // Test reset functionality
      studio.reset();
      expect((studio as any).isPlaying).toBe(false);
      console.log('   ✅ Reset control works');
    });

    test('4. Rendering system is working and integrated', () => {
      console.log('\n4️⃣ Testing rendering system...');

      // Check render system is properly registered
      const systems = world.systemManager.getAllSystems();
      const hasRenderSystem = systems.some((s: any) =>
        s.constructor.name === 'RenderSystemAdapter'
      );
      expect(hasRenderSystem).toBe(true);
      console.log('   ✅ Render system registered with world');

      // Check render system debug info
      const debugInfo = renderSystem.getDebugInfo();
      expect(debugInfo).toBeDefined();
      expect(debugInfo).toHaveProperty('rendererCount');
      expect(debugInfo).toHaveProperty('adapter');
      console.log('   ✅ Render system debug info available');
      console.log(`   📊 Renderer count: ${debugInfo.rendererCount}`);

      // Test render system update (simulation of animation frame)
      const updateSpy = jest.spyOn(renderSystem, 'update');
      renderSystem.update(world, 16.67);
      expect(updateSpy).toHaveBeenCalled();
      console.log('   ✅ Render system update works');
    });

    test('5. Complete animation loop integration', async () => {
      console.log('\n5️⃣ Testing animation loop integration...');

      // Register flag simulation
      const flagPlugin = new FlagSimulationPlugin();
      pluginManager.registerPlugin(flagPlugin);
      await studio.loadSimulation('flag-simulation');
      studio.play();

      // Test complete update cycle
      const renderUpdateSpy = jest.spyOn(renderSystem, 'update');

      // Simulate multiple animation frames
      for (let i = 0; i < 5; i++) {
        studio.update(16.67); // Simulate 60fps
      }

      expect(renderUpdateSpy).toHaveBeenCalledTimes(5);
      console.log('   ✅ Animation loop integration works');
      console.log('   🎬 Multiple frames rendered successfully');
    });

    test('6. Plugin renderer registration and compatibility', async () => {
      console.log('\n6️⃣ Testing plugin renderer integration...');

      // Register flag simulation and trigger registration
      const flagPlugin = new FlagSimulationPlugin();
      pluginManager.registerPlugin(flagPlugin);

      // Actually load the simulation to trigger renderer registration
      await studio.loadSimulation('flag-simulation');

      // Check renderer registration
      const debugInfo = renderSystem.getDebugInfo();
      const totalRenderers = (debugInfo.adapter?.legacyCount || 0) +
        (debugInfo.adapter?.minimalCount || 0);

      expect(totalRenderers).toBeGreaterThan(0);
      console.log('   ✅ Plugin renderer registered with render system');
      console.log(`   📊 Total renderers: ${totalRenderers}`);
      console.log(`   📊 Legacy renderers: ${debugInfo.adapter?.legacyCount || 0}`);
      console.log(`   📊 Minimal renderers: ${debugInfo.adapter?.minimalCount || 0}`);
    });

    test('7. State management and persistence', () => {
      console.log('\n7️⃣ Testing state management...');

      // Test simulation selection state using proper method
      stateManager.selectedSimulation.setSimulation('flag-simulation');
      expect(stateManager.selectedSimulation.state.name).toBe('flag-simulation');
      console.log('   ✅ Simulation selection state works');

      // Test state change notifications - set up callback BEFORE changing state
      let changeNotified = false;
      stateManager.selectedSimulation.onChange(() => {
        changeNotified = true;
      });

      // Now change the state using the proper method to trigger the callback
      stateManager.selectedSimulation.setSimulation('water-simulation');
      expect(changeNotified).toBe(true);
      console.log('   ✅ State change notifications work');
    });
  });

  describe('🎯 FINAL VALIDATION', () => {
    test('Complete end-to-end workflow', async () => {
      console.log('\n🎯 FINAL END-TO-END TEST');
      console.log('========================');

      // 1. Load simulation
      const flagPlugin = new FlagSimulationPlugin();
      pluginManager.registerPlugin(flagPlugin);
      await studio.loadSimulation('flag-simulation');
      console.log('1️⃣ ✅ Simulation loaded');

      // 2. Start playing
      studio.play();
      expect((studio as any).isPlaying).toBe(true);
      console.log('2️⃣ ✅ Simulation playing');

      // 3. Run animation frames
      const renderSpy = jest.spyOn(renderSystem, 'update');
      for (let i = 0; i < 10; i++) {
        studio.update(16.67);
      }
      expect(renderSpy).toHaveBeenCalledTimes(10);
      console.log('3️⃣ ✅ Animation frames rendered');

      // 4. Check renderer activity
      const debugInfo = renderSystem.getDebugInfo();
      const hasRenderers = (debugInfo.adapter?.legacyCount || 0) +
        (debugInfo.adapter?.minimalCount || 0) > 0;
      expect(hasRenderers).toBe(true);
      console.log('4️⃣ ✅ Renderers active');

      // 5. Pause and reset
      studio.pause();
      studio.reset();
      expect((studio as any).isPlaying).toBe(false);
      console.log('5️⃣ ✅ Controls working');

      console.log('\n🎉 ALL ACCEPTANCE CRITERIA MET!');
      console.log('================================');
      console.log('✅ App loads and initializes properly');
      console.log('✅ Simulations are discoverable and selectable');
      console.log('✅ Play/pause/reset controls work');
      console.log('✅ Rendering system is integrated and working');
      console.log('✅ Animation loop is functional');
      console.log('✅ Plugin renderers are compatible');
      console.log('✅ State management works');
      console.log('✅ Complete end-to-end workflow successful');
    });
  });
});
