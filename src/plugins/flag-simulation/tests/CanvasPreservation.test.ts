/**
 * TDD Tests for Canvas Preservation During Simulation Switching
 *
 * These tests verify that:
 * 1. Canvas doesn't get cleared when switching simulations
 * 2. Only simulation-specific objects are removed
 * 3. Scene stability is maintained during transitions
 * 4. Proper resource cleanup occurs without aggressive clearing
 */

import { World } from '../../../core/ecs/World';
import { SimplifiedRenderSystem } from '../../../studio/rendering/simplified/SimplifiedRenderSystem';
import { SimplifiedRenderManager } from '../../../studio/rendering/simplified/SimplifiedRenderManager';
import { SimulationOrchestrator } from '../../../studio/SimulationOrchestrator';
import { PluginManager } from '../../../core/plugin/PluginManager';
import { FlagSimulationPlugin } from '../index';
import * as THREE from 'three';

// Mock THREE.js scene for testing
class MockScene extends THREE.Scene {
  public removeCallCount = 0;
  public addCallCount = 0;
  private removedObjects: THREE.Object3D[] = [];

  remove(...objects: THREE.Object3D[]): this {
    this.removeCallCount++;
    this.removedObjects.push(...objects);
    return super.remove(...objects);
  }

  add(...objects: THREE.Object3D[]): this {
    this.addCallCount++;
    return super.add(...objects);
  }

  getRemovedObjects(): THREE.Object3D[] {
    return [...this.removedObjects];
  }

  clearCounts(): void {
    this.removeCallCount = 0;
    this.addCallCount = 0;
    this.removedObjects = [];
  }
}

// Mock Graphics Manager
class MockGraphicsManager {
  private scene: MockScene;
  private camera: THREE.Camera;

  constructor() {
    this.scene = new MockScene();
    this.camera = new THREE.PerspectiveCamera();
  }

  getScene(): MockScene {
    return this.scene;
  }

  getCamera(): THREE.Camera {
    return this.camera;
  }

  render(): void {
    // Mock render call
  }
}

describe('Canvas Preservation During Simulation Switching (TDD)', () => {
  let world: World;
  let renderSystem: SimplifiedRenderSystem;
  let pluginManager: PluginManager;
  let orchestrator: SimulationOrchestrator;
  let mockGraphics: MockGraphicsManager;
  let mockScene: MockScene;
  let flagPlugin: FlagSimulationPlugin;

  beforeEach(() => {
    // Create test world with system manager
    world = new World();
    (world as any).systemManager = {
      addSystem: jest.fn(),
      getSystem: jest.fn(),
      getAllSystems: jest.fn().mockReturnValue([])
    };

    // Create mock graphics and render system
    mockGraphics = new MockGraphicsManager();
    mockScene = mockGraphics.getScene() as MockScene;
    renderSystem = new SimplifiedRenderSystem(mockGraphics as any);

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

    // Reset scene counters
    mockScene.clearCounts();
  });

  test('🔴 RED: Flag objects should be added to scene when flag simulation loads', async () => {
    // Arrange: No simulation loaded yet
    expect(mockScene.children.length).toBe(0);
    expect(mockScene.addCallCount).toBe(0);

    // Act: Load flag simulation
    await orchestrator.loadSimulation('flag-simulation');

    // Assert: Flag objects should be added to scene
    // This test should initially FAIL until flag renderer properly adds objects
    expect(mockScene.children.length).toBeGreaterThan(0);
    expect(mockScene.addCallCount).toBeGreaterThan(0);
  });

  test('🔴 RED: Only flag objects should be removed when flag simulation unloads', async () => {
    // Arrange: Load flag simulation first
    await orchestrator.loadSimulation('flag-simulation');
    const initialObjectCount = mockScene.children.length;
    const initialObjects = [...mockScene.children];

    // Add a persistent object that shouldn't be removed
    const persistentObject = new THREE.Mesh();
    persistentObject.name = 'persistent-camera-helper';
    mockScene.add(persistentObject);

    mockScene.clearCounts();

    // Act: Unload flag simulation
    orchestrator.unloadSimulation('flag-simulation');

    // Assert: Only flag objects should be removed, not persistent objects
    expect(mockScene.removeCallCount).toBeGreaterThan(0);
    expect(mockScene.children).toContain(persistentObject);
    
    // Verify flag objects are gone but persistent objects remain
    const remainingObjects = mockScene.children;
    expect(remainingObjects.length).toBeLessThan(initialObjectCount + 1); // +1 for persistent object
    expect(remainingObjects).toContain(persistentObject);
  });

  test('🔴 RED: Scene should not be cleared wholesale during simulation switching', async () => {
    // Arrange: Create background objects that should persist
    const backgroundObject = new THREE.Mesh();
    backgroundObject.name = 'background';
    mockScene.add(backgroundObject);

    // Load flag simulation
    await orchestrator.loadSimulation('flag-simulation');
    const afterFlagLoad = mockScene.children.length;

    mockScene.clearCounts();

    // Act: Switch to a different simulation (unload flag, load another)
    orchestrator.unloadSimulation('flag-simulation');

    // Assert: Background object should still exist (no wholesale clearing)
    expect(mockScene.children).toContain(backgroundObject);
    
    // Scene should not be completely emptied
    expect(mockScene.children.length).toBeGreaterThan(0);
  });

  test('🔴 RED: Renderer dispose should be called with scene parameter', async () => {
    // Arrange: Load flag simulation
    await orchestrator.loadSimulation('flag-simulation');

    // Get the registered renderer
    const renderer = flagPlugin.getRenderer();
    expect(renderer).toBeDefined();

    // Spy on the dispose method
    const disposeSpy = jest.spyOn(renderer, 'dispose');

    // Act: Unload simulation
    orchestrator.unloadSimulation('flag-simulation');

    // Assert: dispose should be called with scene parameter
    expect(disposeSpy).toHaveBeenCalledWith(mockScene);
  });

  test('🔴 RED: World clear should not be called during simulation switching', async () => {
    // Arrange: Spy on world.clear method
    const worldClearSpy = jest.spyOn(world, 'clear');

    // Load flag simulation
    await orchestrator.loadSimulation('flag-simulation');

    // Act: Switch simulation
    orchestrator.unloadSimulation('flag-simulation');

    // Assert: world.clear should NOT be called (too aggressive)
    expect(worldClearSpy).not.toHaveBeenCalled();
  });

  test('🔴 RED: Multiple simulation switches should maintain scene stability', async () => {
    // Arrange: Add persistent objects
    const persistentObjects = [
      new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()),
      new THREE.AmbientLight(),
      new THREE.Group()
    ];
    persistentObjects.forEach(obj => mockScene.add(obj));
    const initialPersistentCount = persistentObjects.length;

    // Act: Multiple simulation switches
    await orchestrator.loadSimulation('flag-simulation');
    orchestrator.unloadSimulation('flag-simulation');
    await orchestrator.loadSimulation('flag-simulation');
    orchestrator.unloadSimulation('flag-simulation');
    await orchestrator.loadSimulation('flag-simulation');
    orchestrator.unloadSimulation('flag-simulation');

    // Assert: Persistent objects should still be in scene
    for (const persistentObj of persistentObjects) {
      expect(mockScene.children).toContain(persistentObj);
    }

    // Scene should not accumulate objects from repeated switches
    const finalSceneCount = mockScene.children.length;
    expect(finalSceneCount).toBe(initialPersistentCount);
  });

  test('🔴 RED: Flag renderer should properly clean up its resources', async () => {
    // Arrange: Load flag simulation
    await orchestrator.loadSimulation('flag-simulation');
    const renderer = flagPlugin.getRenderer();

    // Spy on geometry and material dispose methods
    const disposedGeometries: THREE.BufferGeometry[] = [];
    const disposedMaterials: THREE.Material[] = [];

    // Mock the renderer's internal objects
    if (renderer && (renderer as any).flagMeshes) {
      const flagMeshes = (renderer as any).flagMeshes as Map<number, THREE.Group>;
      flagMeshes.forEach(group => {
        group.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              const originalDispose = child.geometry.dispose.bind(child.geometry);
              child.geometry.dispose = () => {
                disposedGeometries.push(child.geometry);
                originalDispose();
              };
            }
            if (child.material && !Array.isArray(child.material)) {
              const originalDispose = child.material.dispose.bind(child.material);
              child.material.dispose = () => {
                disposedMaterials.push(child.material as THREE.Material);
                originalDispose();
              };
            }
          }
        });
      });
    }

    // Act: Unload simulation
    orchestrator.unloadSimulation('flag-simulation');

    // Assert: Geometries and materials should be properly disposed
    expect(disposedGeometries.length).toBeGreaterThan(0);
    expect(disposedMaterials.length).toBeGreaterThan(0);
  });

  test('🟢 GREEN: Canvas preservation integration test', async () => {
    // This test combines all the requirements and should pass after implementation
    
    // Arrange: Set up a realistic scenario with multiple objects
    const persistentCamera = new THREE.PerspectiveCamera();
    const persistentLight = new THREE.AmbientLight();
    const persistentHelper = new THREE.AxesHelper(5);
    
    mockScene.add(persistentCamera);
    mockScene.add(persistentLight);
    mockScene.add(persistentHelper);
    
    const initialPersistentCount = 3;
    expect(mockScene.children.length).toBe(initialPersistentCount);

    // Act & Assert: Load flag simulation
    await orchestrator.loadSimulation('flag-simulation');
    
    // Flag objects should be added
    expect(mockScene.children.length).toBeGreaterThan(initialPersistentCount);
    
    // All persistent objects should still be there
    expect(mockScene.children).toContain(persistentCamera);
    expect(mockScene.children).toContain(persistentLight);
    expect(mockScene.children).toContain(persistentHelper);

    // Act & Assert: Unload flag simulation  
    orchestrator.unloadSimulation('flag-simulation');
    
    // Flag objects should be removed
    expect(mockScene.children.length).toBe(initialPersistentCount);
    
    // Persistent objects should still be there
    expect(mockScene.children).toContain(persistentCamera);
    expect(mockScene.children).toContain(persistentLight);
    expect(mockScene.children).toContain(persistentHelper);
    
    // No wholesale clearing should have occurred
    expect(mockScene.children.length).toBeGreaterThan(0);
  });
});
