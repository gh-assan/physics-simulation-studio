/**
 * TDD Tests for Clean Slate Canvas Management During Simulation Switching
 *
 * New approach: Instead of preserving individual objects, we:
 * 1. Clear everything from scene on simulation change
 * 2. Re-add persistent system objects (lights, helpers, etc.)
 * 3. Let new simulation populate fresh objects
 *
 * This eliminates complexity of tracking object ownership.
 */

import { World } from '../../../core/ecs/World';
import { SimplifiedRenderSystem } from '../../../studio/rendering/simplified/SimplifiedRenderSystem';
import { SimulationOrchestrator } from '../../../studio/SimulationOrchestrator';
import { PluginManager } from '../../../core/plugin/PluginManager';
import { FlagSimulationPlugin } from '../index';
import * as THREE from 'three';

// Create a simple test graphics manager
class TestGraphicsManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  }
  
  getScene(): THREE.Scene {
    return this.scene;
  }
  
  getCamera(): THREE.Camera {
    return this.camera;
  }
}

// Mock system manager to return SimplifiedRenderSystem
const createMockSystemManager = (renderSystem: SimplifiedRenderSystem) => ({
  getSystem: jest.fn().mockImplementation((systemConstructor: any) => {
    // Check if the system constructor name matches SimplifiedRenderSystem
    if (systemConstructor && systemConstructor.name === 'SimplifiedRenderSystem') {
      return renderSystem;
    }
    return undefined;
  }),
  getAllSystems: jest.fn().mockReturnValue([renderSystem]),
  clear: jest.fn(), // Mock clear method for clean slate approach
  registerSystem: jest.fn(),
  onSystemRegistered: jest.fn(),
  updateAll: jest.fn(),
  removeSystem: jest.fn()
});

describe('Clean Slate Canvas Management TDD Tests', () => {
  let world: World;
  let renderSystem: SimplifiedRenderSystem;
  let orchestrator: SimulationOrchestrator;
  let pluginManager: PluginManager;
  let worldClearSpy: jest.SpyInstance;
  let scene: THREE.Scene;
  let flagPlugin: FlagSimulationPlugin;
  
  beforeEach(() => {
    // Create fresh scene for each test
    const testGraphics = new TestGraphicsManager();
    scene = testGraphics.getScene();
    
    // Ensure scene has children property (for THREE.js compatibility)
    if (!scene.children) {
      (scene as any).children = [];
    }
    
    // Reset scene to empty state
    while(scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
    
    // Create render system with graphics manager
    renderSystem = new SimplifiedRenderSystem(testGraphics as any);
    
    // Create world with mock system manager
    world = new World();
    (world as any).systemManager = createMockSystemManager(renderSystem);
    
    // Create plugin manager and orchestrator
    pluginManager = new PluginManager(world);
    const mockStudio = {
      getWorld: () => world,
      getPluginManager: () => pluginManager
    };
    orchestrator = new SimulationOrchestrator(world, pluginManager, mockStudio as any);
    orchestrator.setRenderSystem(renderSystem);
    
    // Create and register flag plugin
    flagPlugin = new FlagSimulationPlugin();
    pluginManager.registerPlugin(flagPlugin);
    
    // Spy on world.clear to verify clean slate approach
    worldClearSpy = jest.spyOn(world, 'clear');
  });

  test('🔴 RED: Scene should be completely cleared then repopulated with persistent objects', async () => {
    // Arrange: Scene starts empty
    expect(scene.children.length).toBe(0);

    // Act: Load flag simulation - should clear scene, add persistent objects, then flag objects
    await orchestrator.loadSimulation('flag-simulation');

    // Assert: Should have persistent objects + simulation objects
    expect(scene.children.length).toBeGreaterThan(0);
    // Should have lights and helpers added by _addPersistentSceneObjects
    const hasLight = scene.children.some(child => child.type.includes('Light'));
    const hasHelper = scene.children.some(child => child.type.includes('Helper'));
    expect(hasLight || hasHelper).toBe(true);
  });

  test('🔴 RED: Switching simulations should result in clean slate with fresh objects', async () => {
    // Arrange: Load initial simulation  
    await orchestrator.loadSimulation('flag-simulation');
    const objectsAfterFlag = scene.children.length;
    expect(objectsAfterFlag).toBeGreaterThan(0);
    
    // Act: Switch to different simulation
    await orchestrator.loadSimulation('water-simulation'); 
    
    // Assert: Should have been cleared and repopulated
    // Clean slate approach means world.clear should be called
    expect(worldClearSpy).toHaveBeenCalledWith(true);
    
    // Scene should have persistent objects (lights, helpers) + new simulation objects
    expect(scene.children.length).toBeGreaterThan(0);
    const hasSystemObjects = scene.children.some(child => 
      child.type.includes('Light') || child.type.includes('Helper')
    );
    expect(hasSystemObjects).toBe(true);
  });

  test('🔴 RED: World.clear should be called with false to preserve systems', async () => {
    // Act: Load any simulation
    await orchestrator.loadSimulation('flag-simulation');
    
    // Assert: Clean slate approach calls world.clear(false) to preserve render systems
    expect(worldClearSpy).toHaveBeenCalledWith(false);
  });

  test('🔴 RED: Every simulation switch should clear and rebuild scene completely', async () => {
    // Act: Multiple simulation switches
    await orchestrator.loadSimulation('flag-simulation');
    await orchestrator.loadSimulation('water-simulation');
    await orchestrator.loadSimulation('flag-simulation');
    
    // Assert: Each switch should call world.clear(false) to preserve systems
    expect(worldClearSpy).toHaveBeenCalledTimes(3);
    expect(worldClearSpy).toHaveBeenCalledWith(false);
    
    // Final scene should have system objects + current simulation objects
    expect(scene.children.length).toBeGreaterThan(0);
  });

  test('🟢 GREEN: Integration test for clean slate approach', async () => {
    // Arrange: Scene starts empty
    expect(scene.children.length).toBe(0);
    
    // Act: Load flag simulation
    await orchestrator.loadSimulation('flag-simulation');
    
    // Assert: Should have system objects + simulation objects
    expect(scene.children.length).toBeGreaterThan(0);
    expect(worldClearSpy).toHaveBeenCalledWith(false);
    
    // Act: Switch to different simulation  
    const childrenAfterFirst = scene.children.length;
    await orchestrator.loadSimulation('water-simulation');
    
    // Assert: Clean slate - cleared and rebuilt
    expect(worldClearSpy).toHaveBeenCalledTimes(2);
    expect(scene.children.length).toBeGreaterThan(0);
    
    // Should have system objects in final state
    const hasSystemObjects = scene.children.some(child => 
      child.type.includes('Light') || child.type.includes('Helper')
    );
    expect(hasSystemObjects).toBe(true);
  });
});
