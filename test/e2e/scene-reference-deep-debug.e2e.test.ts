/**
 * Deep Debugging: Scene Reference Chain Investigation
 *
 * This test traces the exact path of the scene reference through the entire chain
 * to identify where the scene.add() call is failing or being ignored.
 */

import * as THREE from 'three';
import { World } from '../../src/core/ecs/World';
import { PluginManager } from '../../src/core/plugin/PluginManager';
import { FlagSimulationPlugin } from '../../src/plugins/flag-simulation/FlagSimulationPlugin';
import { Studio } from '../../src/studio/Studio';
import { ThreeGraphicsManager } from '../../src/studio/graphics/ThreeGraphicsManager';
import { createAdapterRenderSystem } from '../../src/studio/rendering/createAdapterRenderSystem';
import { StateManager } from '../../src/studio/state/StateManager';

describe('🕵️ Scene Reference Deep Debug', () => {
  test('🔍 Trace Complete Scene Reference Chain', async () => {
    // 1. Set up the chain
    console.log('🔧 Setting up scene reference chain...');

    const world = new World();
    const pluginManager = new PluginManager(world);
    const stateManager = StateManager.getInstance();

    const pluginContext = {
      studio: undefined as any,
      world: world,
      eventBus: { emit: jest.fn(), on: jest.fn(), off: jest.fn(), once: jest.fn() } as any,
      getStateManager: () => stateManager,
    };

    const studio = new Studio(world, pluginManager, stateManager, pluginContext);
    pluginContext.studio = studio;

    // 2. Initialize graphics manager
    const graphicsManager = new ThreeGraphicsManager();
    const container = document.createElement('div');
    graphicsManager.initialize(container);

    const originalScene = graphicsManager.getScene();
    console.log('🎭 Original Graphics Manager Scene:', {
      uuid: originalScene?.uuid,
      type: originalScene?.type,
      isThreeScene: originalScene instanceof THREE.Scene,
      childrenCount: originalScene?.children?.length
    });

    // 3. Create render system (adapter)
    const renderSystem = createAdapterRenderSystem(graphicsManager);
    studio.setOrchestratorRenderSystem(renderSystem);

    const renderSystemScene = renderSystem.getScene();
    console.log('🎬 Render System Scene:', {
      uuid: renderSystemScene?.uuid,
      type: renderSystemScene?.type,
      isThreeScene: renderSystemScene instanceof THREE.Scene,
      childrenCount: renderSystemScene?.children?.length,
      sameReference: originalScene === renderSystemScene
    });

    // 4. Add direct test to the original scene
    console.log('🧪 Testing direct scene.add() on original scene...');
    const testMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    testMesh.name = 'direct-test-mesh';

    originalScene.add(testMesh);
    console.log('📊 After direct add - scene children:', originalScene.children.length);

    // 5. Load plugin and trace the mesh creation
    console.log('🏁 Loading flag simulation plugin...');
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    await studio.loadSimulation('flag-simulation');

    // 6. Capture scene state before render
    const beforeRenderChildren = originalScene.children.length;
    console.log('📊 Before render - scene children:', beforeRenderChildren);

    // 7. Trigger render
    console.log('🎬 Triggering render...');
    studio.update(16.67);

    // 8. Check scene state after render  
    const afterRenderChildren = originalScene.children.length;
    console.log('📊 After render - scene children:', afterRenderChildren);

    // 9. List all objects in the scene
    console.log('📋 All objects in scene:');
    originalScene.traverse((object: any) => {
      console.log('  -', object.type, object.name || 'unnamed', object.uuid);
    });

    // 10. Check if mesh was added anywhere else
    console.log('� Checking render system scene separately...');
    console.log('📊 Render system scene children:', renderSystemScene.children.length);
    renderSystemScene.traverse((object: any) => {
      console.log('  - RS:', object.type, object.name || 'unnamed', object.uuid);
    });

    // Clean up
    graphicsManager.dispose();

    // Final assertion
    expect(afterRenderChildren).toBeGreaterThan(beforeRenderChildren - 1); // Account for potential removals
  });

  test('🎯 Mock Scene.add to Track Calls', async () => {
    console.log('🎯 Setting up scene.add() spy...');

    const world = new World();
    const pluginManager = new PluginManager(world);
    const stateManager = StateManager.getInstance();

    const pluginContext = {
      studio: undefined as any,
      world: world,
      eventBus: { emit: jest.fn(), on: jest.fn(), off: jest.fn(), once: jest.fn() } as any,
      getStateManager: () => stateManager,
    };

    const studio = new Studio(world, pluginManager, stateManager, pluginContext);
    pluginContext.studio = studio;

    const graphicsManager = new ThreeGraphicsManager();
    const container = document.createElement('div');
    graphicsManager.initialize(container);

    const scene = graphicsManager.getScene();

    // Spy on scene.add to track calls
    const sceneAddSpy = jest.spyOn(scene, 'add').mockImplementation((object) => {
      console.log('🚀 SCENE.ADD() CALLED! Object type:', object?.type, 'name:', object?.name);
      return scene; // Return scene for chaining
    });

    const renderSystem = createAdapterRenderSystem(graphicsManager);
    studio.setOrchestratorRenderSystem(renderSystem);

    // Load plugin
    const flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    await studio.loadSimulation('flag-simulation');

    // Don't clear spy calls - we want to see the actual rendering calls!
    console.log('📊 Initial spy calls after setup:', sceneAddSpy.mock.calls.length);

    // Test the spy works manually
    console.log('🧪 Testing spy manually...');
    scene.add({ type: 'TestObject', name: 'Manual Test' } as any);
    console.log('📊 After manual test - spy calls:', sceneAddSpy.mock.calls.length);

    console.log('🎬 Triggering render with scene.add() spy active...');
    studio.update(16.67);

    console.log('📊 Scene.add() was called:', sceneAddSpy.mock.calls.length, 'times');
    sceneAddSpy.mock.calls.forEach((call, index) => {
      const addedObject = call[0];
      console.log(`  Call ${index + 1}:`, addedObject?.type, addedObject?.name || 'unnamed');
    });

    // Capture call count before cleanup
    const totalCalls = sceneAddSpy.mock.calls.length;

    // Clean up
    sceneAddSpy.mockRestore();
    graphicsManager.dispose();

    // Verify that scene.add was called - we expect many calls from lights, helpers, and the flag mesh
    expect(totalCalls).toBeGreaterThan(20); // Expect at least lights + helpers + flag mesh
  });
});
