import {WaterSimulationPlugin} from '../WaterSimulationPlugin';
import { World } from '../../../core/ecs/World';
import { SimulationManager } from '../../../studio/simulation/SimulationManager';
import { WaterAlgorithm } from '../WaterAlgorithm';
import { WaterRenderer } from '../WaterRenderer';
import * as THREE from 'three';

describe('WaterSimulationPlugin - Clean Architecture', () => {
  let plugin: WaterSimulationPlugin;
  let world: World;
  let simulationManager: SimulationManager;
  let mockRenderer: THREE.WebGLRenderer;
  let mockScene: THREE.Scene;
  let mockCamera: THREE.PerspectiveCamera;

  beforeEach(() => {
    world = new World();
    // Create headless renderer for testing
    const canvas = document.createElement('canvas');
    mockRenderer = new THREE.WebGLRenderer({ canvas });

    // Create a proper mock scene with required methods
    mockScene = new THREE.Scene();
    // Ensure the remove method exists for testing
    if (!mockScene.remove) {
      mockScene.remove = jest.fn();
    }

    mockCamera = new THREE.PerspectiveCamera();
    simulationManager = new SimulationManager();
    plugin = new WaterSimulationPlugin();
  });

  describe('Plugin Structure', () => {
    it('should have name and basic plugin interface', () => {
      expect(plugin.getName()).toBe('water-simulation');
      expect(plugin.getDependencies()).toEqual([]);
    });

    it('should have separate algorithm and renderer classes', () => {
      expect(plugin.getAlgorithm).toBeDefined();
      expect(plugin.getRenderer).toBeDefined();

      const algorithm = plugin.getAlgorithm();
      const renderer = plugin.getRenderer();

      expect(algorithm).toBeInstanceOf(WaterAlgorithm);
      expect(renderer).toBeInstanceOf(WaterRenderer);
    });
  });

  describe('Algorithm Implementation', () => {
    it('should implement ISimulationAlgorithm interface', () => {
      const algorithm = plugin.getAlgorithm();

      expect(algorithm.initialize).toBeDefined();
      expect(algorithm.update).toBeDefined();
      expect(algorithm.reset).toBeDefined();
      expect(algorithm.getState).toBeDefined();
      expect(algorithm.setState).toBeDefined();
    });

    it('should manage SPH fluid physics without rendering concerns', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(simulationManager);

      // Algorithm should focus on SPH physics calculations only
      const state = algorithm.getState();
      expect(state.particles).toBeDefined();
      expect(state.particles.length).toBeGreaterThan(0);
    });

    it('should handle SPH particle interactions', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(simulationManager);

      const initialState = algorithm.getState();
      algorithm.update(1/60); // One timestep

      const updatedState = algorithm.getState();
      // Particles should have moved or changed
      expect(updatedState.particles).not.toEqual(initialState.particles);
    });
  });

  describe('Renderer Implementation', () => {
    it('should implement ISimulationRenderer interface', () => {
      const renderer = plugin.getRenderer();

      expect(renderer.initialize).toBeDefined();
      expect(renderer.render).toBeDefined();
      expect(renderer.dispose).toBeDefined();
      expect(renderer.updateFromState).toBeDefined();
    });

    it('should create and manage THREE.js particle meshes', () => {
      const algorithm = plugin.getAlgorithm();
      const renderer = plugin.getRenderer() as WaterRenderer;

      // Initialize algorithm first
      algorithm.initialize(simulationManager);
      renderer.initialize(simulationManager);
      renderer.setScene(mockScene);

      const state = algorithm.getState();
      renderer.updateFromState(state);

      // Should have created meshes for water particles
      const meshes = renderer.getMeshes();
      expect(meshes.size).toBeGreaterThan(0);

      // Should have particle meshes
      expect(meshes.size).toBe(state.particles.length);
    });

    it('should handle particle mesh disposal properly', () => {
      const algorithm = plugin.getAlgorithm();
      const renderer = plugin.getRenderer() as WaterRenderer;

      // Initialize algorithm first
      algorithm.initialize(simulationManager);
      renderer.initialize(simulationManager);
      renderer.setScene(mockScene);

      const state = algorithm.getState();
      renderer.updateFromState(state);

      const meshes = renderer.getMeshes();
      expect(meshes.size).toBeGreaterThan(0);

      renderer.dispose();

      // Should clean up all meshes
      const meshesAfterDispose = renderer.getMeshes();
      expect(meshesAfterDispose.size).toBe(0);
    });
  });

  describe('Entity Management', () => {
    it('should create entities with proper water components when initialized', () => {
      plugin.register(world);
      plugin.initializeEntities(world, simulationManager);

      // Should have created water droplet entities
      const entities = world.getEntitiesWithComponentTypes(['WaterDropletComponent']);
      expect(entities.length).toBeGreaterThan(0);

      // Entities should have position, water droplet, and renderable components
      const firstEntity = entities[0];
      expect(world.hasComponent(firstEntity, 'PositionComponent')).toBe(true);
      expect(world.hasComponent(firstEntity, 'WaterDropletComponent')).toBe(true);
      expect(world.hasComponent(firstEntity, 'RenderableComponent')).toBe(true);
    });
  });

  describe('Integration with SimulationManager', () => {
    it('should register renderer with simulation manager during entity initialization', () => {
      const mockRegisterRenderer = jest.spyOn(simulationManager, 'registerRenderer');

      plugin.register(world);
      plugin.initializeEntities(world, simulationManager);

      expect(mockRegisterRenderer).toHaveBeenCalledWith(
        plugin.getName(),
        expect.any(WaterRenderer)
      );
    });
  });

  describe('SPH Physics Validation', () => {
    it('should maintain particle count during simulation', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(simulationManager);

      const initialState = algorithm.getState();
      const initialCount = initialState.particles.length;

      // Run several timesteps
      for (let i = 0; i < 10; i++) {
        algorithm.update(1/60);
      }

      const finalState = algorithm.getState();
      expect(finalState.particles.length).toBe(initialCount);
    });

    it('should respect fluid boundaries', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(simulationManager);

      // Run simulation for a while
      for (let i = 0; i < 100; i++) {
        algorithm.update(1/60);
      }

      const state = algorithm.getState();
      // All particles should be within reasonable bounds
      state.particles.forEach((particle: any) => {
        expect(particle.position.x).toBeGreaterThan(-100);
        expect(particle.position.x).toBeLessThan(100);
        expect(particle.position.y).toBeGreaterThan(-10); // Above ground
        expect(particle.position.z).toBeGreaterThan(-100);
        expect(particle.position.z).toBeLessThan(100);
      });
    });
  });
});
