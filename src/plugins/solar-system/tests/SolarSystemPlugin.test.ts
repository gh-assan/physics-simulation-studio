import {SolarSystemPlugin} from '../SolarSystemPlugin';
import { World } from '../../../core/ecs/World';
import { SimulationManager } from '../../../studio/simulation/SimulationManager';
import { SolarSystemRenderer } from '../SolarSystemRenderer';
import { SolarSystemAlgorithm } from '../SolarSystemAlgorithm';
import * as THREE from 'three';

describe('SolarSystemPlugin - Clean Architecture', () => {
  let plugin: SolarSystemPlugin;
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
    plugin = new SolarSystemPlugin();
  });

  describe('Plugin Structure', () => {
    it('should have name and basic plugin interface', () => {
      expect(plugin.getName()).toBe('solar-system');
      expect(plugin.getDependencies()).toEqual([]);
    });

    it('should have separate algorithm and renderer classes', () => {
      expect(plugin.getAlgorithm).toBeDefined();
      expect(plugin.getRenderer).toBeDefined();

      const algorithm = plugin.getAlgorithm();
      const renderer = plugin.getRenderer();

      expect(algorithm).toBeInstanceOf(SolarSystemAlgorithm);
      expect(renderer).toBeInstanceOf(SolarSystemRenderer);
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

    it('should manage celestial body physics without rendering concerns', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(simulationManager);

      // Algorithm should focus on physics calculations only
      const state = algorithm.getState();
      expect(state.bodies).toBeDefined();
      expect(state.bodies.length).toBeGreaterThan(0);
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

    it('should create and manage THREE.js meshes for celestial bodies', () => {
      const algorithm = plugin.getAlgorithm();
      const renderer = plugin.getRenderer() as SolarSystemRenderer;

      // Initialize algorithm first
      algorithm.initialize(simulationManager);
      renderer.initialize(simulationManager);
      renderer.setScene(mockScene);

      const state = algorithm.getState();
      renderer.updateFromState(state);

      // Should have created meshes for celestial bodies
      const meshes = renderer.getMeshes();
      expect(meshes.size).toBeGreaterThan(0);

      // Should have a sun mesh
      expect(meshes.has(1)).toBe(true); // Sun entity ID
    });

    it('should handle mesh disposal properly', () => {
      const algorithm = plugin.getAlgorithm();
      const renderer = plugin.getRenderer() as SolarSystemRenderer;

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
    it('should create entities with proper components when initialized', () => {
      plugin.register(world);
      plugin.initializeEntities(world, simulationManager);

      // Should have created celestial body entities
      const entities = world.getEntitiesWithComponentTypes(['CelestialBodyComponent']);
      expect(entities.length).toBeGreaterThan(0);

      // Entities should have position, celestial body, and renderable components
      const firstEntity = entities[0];
      expect(world.hasComponent(firstEntity, 'PositionComponent')).toBe(true);
      expect(world.hasComponent(firstEntity, 'CelestialBodyComponent')).toBe(true);
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
        expect.any(SolarSystemRenderer)
      );
    });
  });
});
