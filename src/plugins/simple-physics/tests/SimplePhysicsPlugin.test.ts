import * as THREE from 'three';
import { World } from '../../../core/ecs/World';
import { SimulationManager } from '../../../studio/simulation/SimulationManager';
import { SimplePhysicsAlgorithm } from '../SimplePhysicsAlgorithm';
import { SimplePhysicsPlugin } from '../SimplePhysicsCleanPlugin';
import { SimplePhysicsRenderer } from '../SimplePhysicsRenderer';

// Mock THREE.js components for testing
jest.mock('three', () => {
  const originalTHREE = jest.requireActual('three');
  return {
    ...originalTHREE,
    SphereGeometry: jest.fn().mockImplementation(() => ({
      dispose: jest.fn()
    })),
    MeshLambertMaterial: jest.fn().mockImplementation(() => ({
      color: { setHSL: jest.fn() },
      dispose: jest.fn()
    })),
    Mesh: jest.fn().mockImplementation((geometry, material) => ({
      geometry,
      material,
      position: { set: jest.fn() }
    })),
    Color: jest.fn().mockImplementation(() => ({
      setHSL: jest.fn()
    }))
  };
});

describe('SimplePhysicsPlugin - Clean Architecture', () => {
  let plugin: SimplePhysicsPlugin;
  let world: World;
  let simulationManager: SimulationManager;
  let mockScene: THREE.Scene;

  beforeEach(() => {
    world = new World();

    // Create mock scene for testing
    mockScene = {
      add: jest.fn(),
      remove: jest.fn(),
      children: []
    } as any;

    simulationManager = new SimulationManager();
    plugin = new SimplePhysicsPlugin();
  });

  describe('Plugin Structure', () => {
    it('should have name and basic plugin interface', () => {
      expect(plugin.getName()).toBe('simple-physics');
      expect(plugin.getDependencies()).toEqual([]);
    });

    it('should have separate algorithm and renderer classes', () => {
      expect(plugin.getAlgorithm).toBeDefined();
      expect(plugin.getRenderer).toBeDefined();

      const algorithm = plugin.getAlgorithm();
      const renderer = plugin.getRenderer();

      expect(algorithm).toBeInstanceOf(SimplePhysicsAlgorithm);
      expect(renderer).toBeInstanceOf(SimplePhysicsRenderer);
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

    it('should manage basic physics without rendering concerns', () => {
      const algorithm = plugin.getAlgorithm();

      // Initialize algorithm
      algorithm.initialize(simulationManager);

      // Get initial state
      const initialState = algorithm.getState();
      expect(initialState.entities).toBeDefined();
      expect(initialState.entities.size).toBeGreaterThan(0);
      expect(initialState.metadata.get('particleCount')).toBe(10);

      // Update simulation
      algorithm.update(0.016); // 60 FPS timestep

      // Get updated state
      const updatedState = algorithm.getState();
      expect(updatedState.time).toBeGreaterThan(initialState.time);
      expect(updatedState.entities.size).toBe(initialState.entities.size); // Same number of particles
    });

    it('should handle basic physics simulation', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(simulationManager);

      const initialState = algorithm.getState();
      const initialTime = initialState.time;

      // Run several physics steps
      for (let i = 0; i < 10; i++) {
        algorithm.update(0.016);
      }

      const finalState = algorithm.getState();

      // Time should have advanced
      expect(finalState.time).toBeGreaterThan(initialTime);

      // Should still have particles
      expect((finalState as any).particles).toBeDefined();
      expect((finalState as any).particles.length).toBe(10);

      // Particles should have moved (gravity effect)
      const particles = (finalState as any).particles;
      const firstParticle = particles[0];
      expect(firstParticle.position).toBeDefined();
      expect(firstParticle.velocity).toBeDefined();
    });
  });

  describe('Renderer Implementation', () => {
    it('should implement ISimulationRenderer interface', () => {
      const renderer = plugin.getRenderer() as SimplePhysicsRenderer;

      expect(renderer.initialize).toBeDefined();
      expect(renderer.render).toBeDefined();
      expect(renderer.updateFromState).toBeDefined();
      expect(renderer.dispose).toBeDefined();
    });

    it('should create and manage THREE.js particle meshes', () => {
      const algorithm = plugin.getAlgorithm();
      const renderer = plugin.getRenderer() as SimplePhysicsRenderer;

      // Initialize algorithm and renderer
      algorithm.initialize(simulationManager);
      renderer.initialize(simulationManager);
      renderer.setScene(mockScene);

      const state = algorithm.getState();
      renderer.updateFromState(state);

      // Should have created meshes for particles
      const meshes = renderer.getMeshes();
      expect(meshes.size).toBeGreaterThan(0);
    });

    it('should handle particle mesh disposal properly', () => {
      const algorithm = plugin.getAlgorithm();
      const renderer = plugin.getRenderer() as SimplePhysicsRenderer;

      // Initialize algorithm and renderer
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

      // Should have created some entities
      const entities = world.entityManager.getAllEntities();
      expect(entities.size).toBeGreaterThan(0);

      // Entities should have required components
      for (const entityId of entities) {
        expect(world.componentManager.hasComponent(entityId, 'PositionComponent')).toBe(true);
        expect(world.componentManager.hasComponent(entityId, 'RenderableComponent')).toBe(true);
      }
    });
  });

  describe('Integration with SimulationManager', () => {
    it('should register renderer with simulation manager during entity initialization', () => {
      const registerRendererSpy = jest.spyOn(simulationManager, 'registerRenderer');

      plugin.register(world);
      plugin.initializeEntities(world, simulationManager);

      expect(registerRendererSpy).toHaveBeenCalledWith('simple-physics', plugin.getRenderer());
    });
  });

  describe('Physics Validation', () => {
    it('should maintain particle count during simulation', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(simulationManager);

      const initialState = algorithm.getState();
      const initialParticleCount = initialState.metadata.get('particleCount');

      // Run simulation for several steps
      for (let i = 0; i < 50; i++) {
        algorithm.update(0.016);
      }

      const finalState = algorithm.getState();
      const finalParticleCount = finalState.metadata.get('particleCount');

      // Particle count should remain constant
      expect(finalParticleCount).toBe(initialParticleCount);
    });

    it('should apply gravity and collision physics', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(simulationManager);

      const initialState = algorithm.getState();
      const initialParticles = (initialState as any).particles;
      const firstParticle = initialParticles[0];
      const initialY = firstParticle.position.y;
      const initialVelocityY = firstParticle.velocity.y;

      // Run simulation to let gravity take effect
      for (let i = 0; i < 10; i++) {
        algorithm.update(0.016);
      }

      const finalState = algorithm.getState();
      const finalParticles = (finalState as any).particles;
      const finalParticle = finalParticles[0];

      // Gravity should have affected velocity (made it more negative)
      expect(finalParticle.velocity.y).toBeLessThan(initialVelocityY);

      // Position should have changed
      expect(finalParticle.position.y).not.toBe(initialY);
    });
  });
});
