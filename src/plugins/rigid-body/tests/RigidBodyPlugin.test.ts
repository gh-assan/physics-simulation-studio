import { RigidBodyCleanPlugin } from '../RigidBodyCleanPlugin';
import { RigidBodyAlgorithm } from '../RigidBodyAlgorithm';
import { RigidBodyRenderer } from '../RigidBodyRenderer';
import { SimulationManager } from '../../../studio/simulation/SimulationManager';
import { Vector3 } from '../../../core/utils/Vector3';
import * as THREE from 'three';

// Mock THREE.js components for testing
jest.mock('three', () => ({
  Scene: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
  })),
  Mesh: jest.fn().mockImplementation(() => ({
    position: { set: jest.fn(), x: 0, y: 0, z: 0 },
    rotation: { set: jest.fn(), x: 0, y: 0, z: 0 },
    scale: { set: jest.fn(), x: 1, y: 1, z: 1 },
    material: null,
    geometry: { dispose: jest.fn() }
  })),
  BoxGeometry: jest.fn().mockImplementation(() => ({
    dispose: jest.fn()
  })),
  SphereGeometry: jest.fn().mockImplementation(() => ({
    dispose: jest.fn()
  })),
  PlaneGeometry: jest.fn().mockImplementation(() => ({
    dispose: jest.fn()
  })),
  MeshLambertMaterial: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
    color: 0x4444ff,
    transparent: true,
    opacity: 0.8
  }))
}));

// Mock SimulationManager
const mockSimulationManager = {
  getScene: jest.fn(() => new THREE.Scene()),
  addPlugin: jest.fn(),
  removePlugin: jest.fn(),
  update: jest.fn(),
} as unknown as SimulationManager;

describe('RigidBodyCleanPlugin', () => {
  let plugin: RigidBodyCleanPlugin;

  beforeEach(() => {
    plugin = new RigidBodyCleanPlugin();
    jest.clearAllMocks();
  });

  describe('Plugin Interface', () => {
    test('should implement IEnhancedSimulationPlugin correctly', () => {
      expect(plugin.getName()).toBe('rigid-body-clean');
      expect(plugin.getDependencies()).toEqual(['three', 'physics']);
      expect(plugin.getAlgorithm()).toBeInstanceOf(RigidBodyAlgorithm);
      expect(plugin.getRenderer()).toBeInstanceOf(RigidBodyRenderer);
    });

    test('should provide direct access to algorithm and renderer', () => {
      expect(plugin.getRigidBodyAlgorithm()).toBeInstanceOf(RigidBodyAlgorithm);
      expect(plugin.getRigidBodyRenderer()).toBeInstanceOf(RigidBodyRenderer);
    });
  });

  describe('Algorithm Integration', () => {
    test('should initialize algorithm successfully', () => {
      const algorithm = plugin.getAlgorithm();
      expect(() => algorithm.initialize(mockSimulationManager)).not.toThrow();
    });

    test('should reset algorithm successfully', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(mockSimulationManager);
      expect(() => algorithm.reset()).not.toThrow();
    });

    test('should update algorithm without errors', () => {
      const algorithm = plugin.getAlgorithm();
      algorithm.initialize(mockSimulationManager);
      expect(() => algorithm.update(0.016)).not.toThrow();
    });
  });

  describe('Renderer Integration', () => {
    test('should initialize renderer successfully', () => {
      const renderer = plugin.getRenderer();
      expect(() => renderer.initialize(mockSimulationManager)).not.toThrow();
    });

    test('should set scene on renderer', () => {
      const renderer = plugin.getRenderer() as RigidBodyRenderer;
      const scene = new THREE.Scene();
      expect(() => renderer.setScene(scene)).not.toThrow();
    });

    test('should dispose renderer resources', () => {
      const renderer = plugin.getRenderer();
      renderer.initialize(mockSimulationManager);
      expect(() => renderer.dispose()).not.toThrow();
    });
  });
});

describe('RigidBodyAlgorithm', () => {
  let algorithm: RigidBodyAlgorithm;

  beforeEach(() => {
    algorithm = new RigidBodyAlgorithm();
  });

  describe('Initialization', () => {
    test('should initialize with default parameters', () => {
      algorithm.initialize(mockSimulationManager);
      const state = algorithm.getState();

      expect(state.entities).toBeDefined();
      expect(state.time).toBe(0);
      expect(state.isRunning).toBe(true);
      expect(state.metadata).toBeDefined();
    });

    test('should create rigid bodies on initialization', () => {
      algorithm.initialize(mockSimulationManager);
      const state = algorithm.getState() as any;

      expect(state.bodies).toBeDefined();
      expect(state.bodies.length).toBeGreaterThan(0);
      expect(state.entities.size).toBe(state.bodies.length);
    });
  });

  describe('Simulation State', () => {
    test('should track simulation time', () => {
      algorithm.initialize(mockSimulationManager);
      algorithm.update(0.016);
      const state = algorithm.getState();

      expect(state.time).toBe(0.016);
    });

    test('should maintain rigid body properties', () => {
      algorithm.initialize(mockSimulationManager);
      const state = algorithm.getState() as any;
      const firstBody = state.bodies[0];

      expect(firstBody.position).toBeInstanceOf(Vector3);
      expect(firstBody.velocity).toBeInstanceOf(Vector3);
      expect(firstBody.angularVelocity).toBeInstanceOf(Vector3);
      expect(firstBody.rotation).toBeInstanceOf(Vector3);
      expect(typeof firstBody.mass).toBe('number');
      expect(firstBody.dimensions).toBeInstanceOf(Vector3);
      expect(['box', 'sphere']).toContain(firstBody.shape);
      expect(typeof firstBody.restitution).toBe('number');
    });

    test('should update body positions with physics', () => {
      algorithm.initialize(mockSimulationManager);
      const initialState = algorithm.getState() as any;
      const initialPosition = initialState.bodies[0].position.clone();

      algorithm.update(0.1); // Larger timestep for noticeable change

      const updatedState = algorithm.getState() as any;
      const updatedPosition = updatedState.bodies[0].position;

      // Position should change due to gravity and velocity
      const positionChanged = !initialPosition.equals(updatedPosition);
      expect(positionChanged).toBe(true);
    });
  });

  describe('Physics Simulation', () => {
    test('should apply gravity to bodies', () => {
      algorithm.initialize(mockSimulationManager);
      const initialState = algorithm.getState() as any;
      const body = initialState.bodies[0];
      const initialVelocityY = body.velocity.y;

      algorithm.update(0.1);

      const updatedState = algorithm.getState() as any;
      const updatedBody = updatedState.bodies[0];

      // Gravity should decrease Y velocity (negative acceleration)
      expect(updatedBody.velocity.y).toBeLessThan(initialVelocityY);
    });

    test('should handle ground collisions', () => {
      algorithm.initialize(mockSimulationManager);

      // Simulate many updates to ensure ground collision
      for (let i = 0; i < 100; i++) {
        algorithm.update(0.05);
      }

      const state = algorithm.getState() as any;

      // Check that no bodies are below ground
      state.bodies.forEach((body: any) => {
        const groundLevel = -5;
        if (body.shape === 'box') {
          const halfHeight = body.dimensions.y * 0.5;
          expect(body.position.y).toBeGreaterThanOrEqual(groundLevel - halfHeight - 0.1);
        } else if (body.shape === 'sphere') {
          const radius = body.dimensions.x;
          expect(body.position.y).toBeGreaterThanOrEqual(groundLevel - radius - 0.1);
        }
      });
    });

    test('should handle wall collisions', () => {
      algorithm.initialize(mockSimulationManager);

      // Get a body and give it high velocity toward a wall
      const state = algorithm.getState() as any;
      const body = state.bodies[0];
      body.position.x = 9.5; // Near wall at x=10
      body.velocity.x = 20; // High velocity toward wall

      algorithm.setState(state);
      algorithm.update(0.1);

      const updatedState = algorithm.getState() as any;
      const updatedBody = updatedState.bodies[0];

      // Body should not exceed wall boundary
      expect(Math.abs(updatedBody.position.x)).toBeLessThanOrEqual(10.1);
    });

    test('should apply air damping', () => {
      algorithm.initialize(mockSimulationManager);
      const state = algorithm.getState() as any;
      const body = state.bodies[0];
      body.velocity.set(100, 0, 0); // Very high horizontal velocity to make damping effect more noticeable
      body.position.y = 10; // Keep it away from ground
      algorithm.setState(state);

      const initialHorizontalSpeed = Math.abs(body.velocity.x);

      // Apply many updates to see cumulative damping effect
      for (let i = 0; i < 50; i++) {
        algorithm.update(0.1); // Larger timestep
      }

      const finalState = algorithm.getState() as any;
      const finalBody = finalState.bodies[0];
      const finalHorizontalSpeed = Math.abs(finalBody.velocity.x);

      // Horizontal speed should decrease due to damping (with more significant difference)
      expect(finalHorizontalSpeed).toBeLessThan(initialHorizontalSpeed * 0.99); // At least 1% reduction
    });
  });

  describe('State Management', () => {
    test('should save and restore state', () => {
      algorithm.initialize(mockSimulationManager);
      algorithm.update(0.1);
      const savedState = algorithm.getState();

      algorithm.reset();
      algorithm.setState(savedState);
      const restoredState = algorithm.getState();

      expect(restoredState.time).toBe(savedState.time);
      expect(restoredState.entities.size).toBe(savedState.entities.size);
    });

    test('should reset to initial conditions', () => {
      algorithm.initialize(mockSimulationManager);
      algorithm.update(1.0); // Significant time

      algorithm.reset();
      const state = algorithm.getState();

      expect(state.time).toBe(0);
      expect(state.isRunning).toBe(true);
    });
  });
});

describe('RigidBodyRenderer', () => {
  let renderer: RigidBodyRenderer;
  let mockScene: THREE.Scene;

  beforeEach(() => {
    renderer = new RigidBodyRenderer();
    mockScene = new THREE.Scene();
  });

  describe('Initialization', () => {
    test('should initialize without errors', () => {
      expect(() => renderer.initialize(mockSimulationManager)).not.toThrow();
    });

    test('should set scene correctly', () => {
      renderer.setScene(mockScene);
      // Scene should be stored internally (tested through other methods)
      expect(() => renderer.updateFromState({
        entities: new Set(),
        time: 0,
        deltaTime: 0.016,
        isRunning: true,
        metadata: new Map(),
        bodies: []
      })).not.toThrow();
    });
  });

  describe('Rendering', () => {
    test('should render state without errors', () => {
      renderer.setScene(mockScene);
      const state = {
        entities: new Set([0, 1]),
        time: 1.0,
        deltaTime: 0.016,
        isRunning: true,
        metadata: new Map(),
        bodies: [
          {
            position: new Vector3(0, 0, 0),
            velocity: new Vector3(0, 0, 0),
            angularVelocity: new Vector3(0, 0, 0),
            rotation: new Vector3(0, 0, 0),
            mass: 1.0,
            dimensions: new Vector3(1, 1, 1),
            shape: 'box',
            restitution: 0.6
          }
        ]
      };

      expect(() => renderer.render(state)).not.toThrow();
    });

    test('should handle empty body array', () => {
      renderer.setScene(mockScene);
      const emptyState = {
        entities: new Set(),
        time: 0,
        deltaTime: 0.016,
        isRunning: true,
        metadata: new Map(),
        bodies: []
      };

      expect(() => renderer.render(emptyState)).not.toThrow();
    });

    test('should update from state correctly', () => {
      renderer.setScene(mockScene);
      const state = {
        entities: new Set([0]),
        time: 1.0,
        deltaTime: 0.016,
        isRunning: true,
        metadata: new Map(),
        bodies: [{
          position: new Vector3(1, 2, 3),
          velocity: new Vector3(0, 0, 0),
          angularVelocity: new Vector3(0, 0, 0),
          rotation: new Vector3(0.1, 0.2, 0.3),
          mass: 1.0,
          dimensions: new Vector3(1, 1, 1),
          shape: 'box' as const,
          restitution: 0.6
        }]
      };

      expect(() => renderer.updateFromState(state)).not.toThrow();
    });
  });

  describe('Resource Management', () => {
    test('should dispose resources without errors', () => {
      renderer.initialize(mockSimulationManager);
      renderer.setScene(mockScene);
      expect(() => renderer.dispose()).not.toThrow();
    });

    test('should reset without errors', () => {
      renderer.initialize(mockSimulationManager);
      expect(() => renderer.reset()).not.toThrow();
    });

    test('should track mesh count', () => {
      const initialCount = renderer.getMeshCount();
      expect(typeof initialCount).toBe('number');
      expect(initialCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle ground mesh access', () => {
      const groundMesh = renderer.getGroundMesh();
      // Ground mesh may be null before scene setup, which is fine
      expect(groundMesh === null || typeof groundMesh === 'object').toBe(true);
    });
  });
});
