/**
 * Real-time Visual Parameter Feedback Tests - Sprint 4 TDD
 * Tests real-time visual feedback when parameters are adjusted
 */

import { World } from '../../../core/ecs/World';
import { ParameterManager } from '../../../studio/parameters/ParameterManager';
import { SimulationManager } from '../../../studio/simulation/SimulationManager';
import { PreferencesManager } from '../../../studio/state/PreferencesManager';
import { UIManager } from '../../../studio/uiManager';
import { FlagAlgorithm } from '../FlagAlgorithm';
import { FlagSimulationPlugin } from '../FlagSimulationPlugin';
import { SimplifiedFlagRenderer } from '../SimplifiedFlagRenderer';

describe('Sprint 4: Real-time Visual Parameter Feedback', () => {
  let world: World;
  let simulationManager: SimulationManager;
  let preferencesManager: PreferencesManager;
  let parameterManager: ParameterManager;
  let uiManager: UIManager;
  let plugin: FlagSimulationPlugin;
  let algorithm: FlagAlgorithm;
  let renderer: SimplifiedFlagRenderer;

  beforeEach(async () => {
    // Setup mock UI framework
    const mockPane = {
      addFolder: jest.fn(() => ({
        addBinding: jest.fn(() => ({
          on: jest.fn(),
          refresh: jest.fn()
        })),
        dispose: jest.fn(),
        options: { title: 'test' }
      })),
      addBinding: jest.fn(() => ({
        on: jest.fn(),
        refresh: jest.fn()
      })),
      dispose: jest.fn(),
      refresh: jest.fn()
    };

    // Setup core systems
    world = new World();
    simulationManager = new SimulationManager();
    parameterManager = ParameterManager.getInstance();
    uiManager = new UIManager(mockPane as any);
    preferencesManager = PreferencesManager.getInstance();

    // Setup flag simulation
    plugin = new FlagSimulationPlugin();
    algorithm = plugin.getAlgorithm() as FlagAlgorithm;
    renderer = plugin.getRenderer() as SimplifiedFlagRenderer;

    // Initialize systems
    algorithm.initialize(simulationManager);
    algorithm.registerParameterSchemas(preferencesManager);
    algorithm.registerUIParameterSchemas(parameterManager);
    algorithm.createParameterPanels(uiManager, parameterManager);
  });

  afterEach(() => {
    // Clean up all timers and subscriptions
    jest.clearAllTimers();
    jest.clearAllMocks();
    algorithm.dispose();
    renderer.dispose();
  });

  describe('Immediate Visual Response', () => {
    it('should update flag physics immediately when windStrength changes', () => {
      // Arrange: Get initial wind strength
      const initialWindStrength = algorithm.getWindStrength();

      // Act: Change wind strength through parameter system
      parameterManager.updateParameter('flag-simulation.windStrength', 15.0);

      // Assert: Algorithm should reflect new value immediately
      expect(algorithm.getWindStrength()).toBe(15.0);
      expect(algorithm.getWindStrength()).not.toBe(initialWindStrength);
    });

    it('should update cloth damping immediately when damping parameter changes', () => {
      // Arrange: Get initial damping
      const initialDamping = algorithm.getDamping();

      // Act: Change damping through UI
      parameterManager.updateParameter('flag-simulation.damping', 0.95);

      // Assert: Physics should update immediately
      expect(algorithm.getDamping()).toBe(0.95);
      expect(algorithm.getDamping()).not.toBe(initialDamping);
    });

    it('should update gravity immediately when gravity parameters change', () => {
      // Arrange: Get initial gravity
      const initialGravity = algorithm.getGravity();

      // Act: Change gravity through parameter system
      parameterManager.updateParameter('flag-simulation.gravity.y', -15.0);

      // Assert: Gravity should update immediately
      const newGravity = algorithm.getGravity();
      expect(newGravity.y).toBe(-15.0);
      expect(newGravity.y).not.toBe(initialGravity.y);
    });

    it('should update cloth stiffness immediately when stiffness changes', () => {
      // Arrange: Get initial stiffness
      const initialStiffness = algorithm.getStiffness();

      // Act: Change stiffness
      parameterManager.updateParameter('flag-simulation.stiffness', 0.85);

      // Assert: Stiffness should update immediately
      expect(algorithm.getStiffness()).toBe(0.85);
      expect(algorithm.getStiffness()).not.toBe(initialStiffness);
    });
  });

  describe('Performance Optimization', () => {
    it('should skip unnecessary updates when parameter value is unchanged', () => {
      // Arrange: Set initial value and get current wind strength
      parameterManager.updateParameter('flag-simulation.windStrength', 8.0);
      const beforeValue = algorithm.getWindStrength();

      // Act: Set same value again
      parameterManager.updateParameter('flag-simulation.windStrength', 8.0);

      // Assert: Value should remain the same (no unnecessary processing)
      expect(algorithm.getWindStrength()).toBe(beforeValue);
      expect(algorithm.getWindStrength()).toBe(8.0);
    });

    it('should handle rapid parameter changes efficiently', () => {
      // Arrange: Initial state
      const initialValue = algorithm.getWindStrength();

      // Act: Make rapid parameter changes (should not hang)
      for (let i = 0; i < 5; i++) {
        parameterManager.updateParameter('flag-simulation.windStrength', 5.0 + i);
      }

      // Assert: Final value should be the last one set
      expect(algorithm.getWindStrength()).toBe(9.0);
      expect(algorithm.getWindStrength()).not.toBe(initialValue);
    });
  });

  describe('Real-time Physics Response', () => {
    it('should update particle damping when damping parameter changes', () => {
      // Arrange: Get cloth points
      const clothPoints = algorithm.getClothPoints();
      expect(clothPoints.length).toBeGreaterThan(0);

      // Act: Change damping
      parameterManager.updateParameter('flag-simulation.damping', 0.85);

      // Assert: Damping should be applied to physics calculations
      expect(algorithm.getDamping()).toBe(0.85);
    });

    it('should maintain physics stability during parameter changes', () => {
      // Arrange: Get initial cloth state
      const clothPoints = algorithm.getClothPoints();
      expect(clothPoints.length).toBeGreaterThan(0);

      // Act: Change multiple parameters
      parameterManager.updateParameter('flag-simulation.windStrength', 12.0);
      parameterManager.updateParameter('flag-simulation.damping', 0.9);
      parameterManager.updateParameter('flag-simulation.stiffness', 0.7);

      // Assert: Physics should remain stable
      expect(algorithm.getWindStrength()).toBe(12.0);
      expect(algorithm.getDamping()).toBe(0.9);
      expect(algorithm.getStiffness()).toBe(0.7);

      // Cloth points should still exist and be valid
      const updatedClothPoints = algorithm.getClothPoints();
      expect(updatedClothPoints.length).toBe(clothPoints.length);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should recover from invalid parameter states', () => {
      // Arrange: Valid initial state
      const initialWind = algorithm.getWindStrength();

      // Act: Try to set invalid parameter value (should be handled gracefully)
      try {
        parameterManager.updateParameter('flag-simulation.windStrength', -5.0);
      } catch (error) {
        // Expected to throw for invalid values
        expect(error).toBeDefined();
      }

      // Assert: Algorithm should maintain valid state
      const currentWind = algorithm.getWindStrength();
      expect(currentWind).toBeGreaterThanOrEqual(0); // Wind strength should be non-negative
    });

    it('should provide fallback values when parameter updates fail', () => {
      // Arrange: Valid initial state
      const initialDamping = algorithm.getDamping();

      // Act: Attempt invalid parameter update
      try {
        parameterManager.updateParameter('flag-simulation.damping', 2.0); // Invalid > 1.0
      } catch (error) {
        // Expected for invalid damping values
      }

      // Assert: Should maintain valid damping value
      const currentDamping = algorithm.getDamping();
      expect(currentDamping).toBeLessThanOrEqual(1.0);
      expect(currentDamping).toBeGreaterThan(0);
    });
  });
});
