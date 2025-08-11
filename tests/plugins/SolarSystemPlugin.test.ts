import * as THREE from 'three';
import { World } from '../../src/core/ecs/World';
import { SolarSystemAlgorithm } from '../../src/plugins/solar-system/SolarSystemAlgorithm';
import { SolarSystemPlugin } from '../../src/plugins/solar-system/SolarSystemPlugin';
import { SolarSystemRenderer } from '../../src/plugins/solar-system/SolarSystemRenderer';
import { SimulationManager } from '../../src/studio/simulation/SimulationManager';

describe('SolarSystemPlugin - Clean Architecture', () => {
  let plugin: SolarSystemPlugin;
  let world: World;
  let simulationManager: SimulationManager;
  let mockRenderer: THREE.WebGLRenderer;
  let mockScene: THREE.Scene;
  let mockCamera: THREE.PerspectiveCamera;

  beforeEach(() => {
    world = new World();
    mockRenderer = new THREE.WebGLRenderer();
    mockScene = new THREE.Scene();
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
      const renderer = plugin.getRenderer();
      renderer.initialize(simulationManager);

      const state = plugin.getAlgorithm().getState();
      renderer.updateFromState(state);

      // Should have created meshes for celestial bodies
      expect(mockScene.children.length).toBeGreaterThan(0);

      const sunMesh = mockScene.children.find(child =>
        child.userData && child.userData.type === 'sun'
      );
      expect(sunMesh).toBeDefined();
    });

    it('should handle mesh disposal properly', () => {
      const renderer = plugin.getRenderer();
      renderer.initialize(simulationManager);

      const initialChildCount = mockScene.children.length;
      renderer.dispose();

      // Should clean up all meshes
      expect(mockScene.children.length).toBeLessThan(initialChildCount);
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
