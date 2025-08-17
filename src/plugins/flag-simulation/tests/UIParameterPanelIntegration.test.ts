/**
 * UI Parameter Panel Integration Tests - Sprint 3 TDD
 * Tests the integration between FlagAlgorithm and UI parameter controls
 */

import { World } from '../../../core/ecs/World';
import { ParameterManager } from '../../../studio/parameters/ParameterManager';
import { SimulationManager } from '../../../studio/simulation/SimulationManager';
import { PreferencesManager } from '../../../studio/state/PreferencesManager';
import { UIManager } from '../../../studio/uiManager';
import { FlagAlgorithm } from '../FlagAlgorithm';
import { FlagSimulationPlugin } from '../FlagSimulationPlugin';

describe('Sprint 3: UI Parameter Panel Integration', () => {
  let world: World;
  let simulationManager: SimulationManager;
  let preferencesManager: PreferencesManager;
  let parameterManager: ParameterManager;
  let uiManager: UIManager;
  let plugin: FlagSimulationPlugin;
  let algorithm: FlagAlgorithm;

  beforeEach(async () => {
    // Create a mock Tweakpane instance
    const mockPane = {
      addFolder: jest.fn(() => ({
        addBinding: jest.fn(() => ({ on: jest.fn() })),
        dispose: jest.fn(),
        options: { title: 'test' }
      })),
      addBinding: jest.fn(() => ({ on: jest.fn() })),
      dispose: jest.fn(),
      refresh: jest.fn()
    };

    // Setup ECS components
    world = new World();
    simulationManager = new SimulationManager();
    parameterManager = ParameterManager.getInstance();
    uiManager = new UIManager(mockPane as any);
    preferencesManager = PreferencesManager.getInstance();

    // Setup flag simulation plugin
    plugin = new FlagSimulationPlugin();
    algorithm = plugin.getAlgorithm() as FlagAlgorithm;

  // Create flag entity for test
  const flag = world.createEntity();
  algorithm.initialize([flag]);
  algorithm.registerParameterSchemas(preferencesManager);
  });

  describe('Basic UI Integration Methods', () => {
    it('should register UI parameter schemas', () => {
      // Act: Register UI parameter schemas
      expect(() => {
        algorithm.registerUIParameterSchemas(parameterManager);
      }).not.toThrow();
    });

    it('should create parameter panels', () => {
      // Arrange: Register schemas first
      algorithm.registerUIParameterSchemas(parameterManager);

      // Act: Create parameter panels
      expect(() => {
        algorithm.createParameterPanels(uiManager, parameterManager);
      }).not.toThrow();
    });

    it('should reset parameters to defaults', () => {
      // Arrange: Register schemas
      algorithm.registerUIParameterSchemas(parameterManager);

      // Act: Reset parameters
      expect(() => {
        algorithm.resetParametersToDefaults(parameterManager);
      }).not.toThrow();
    });

    it('should apply parameter presets', () => {
      // Arrange: Register schemas
      algorithm.registerUIParameterSchemas(parameterManager);

      const preset = {
        windStrength: 12.0,
        damping: 0.75
      };

      // Act: Apply preset
      expect(() => {
        algorithm.applyParameterPreset(parameterManager, preset);
      }).not.toThrow();
    });

    it('should export current parameters', () => {
      // Arrange: Register schemas
      algorithm.registerUIParameterSchemas(parameterManager);

      // Act: Export parameters
      const exported = algorithm.exportCurrentParameters();

      // Assert: Should return an object
      expect(typeof exported).toBe('object');
      expect(exported).not.toBeNull();
    });

    it('should enable parameter history', () => {
      // Arrange: Register schemas
      algorithm.registerUIParameterSchemas(parameterManager);

      // Act: Enable history
      expect(() => {
        algorithm.enableParameterHistory(parameterManager);
      }).not.toThrow();
    });
  });

  describe('Parameter Manager UI Extensions', () => {
    it('should get schemas by category', () => {
      // Act: Get schemas
      const schemas = parameterManager.getSchemasByCategory('flag-simulation');

      // Assert: Should return an array
      expect(Array.isArray(schemas)).toBe(true);
    });

    it('should update parameters by key', () => {
      // Act & Assert: Should handle parameter updates
      expect(() => {
        parameterManager.updateParameter('test.parameter', 5.0);
      }).toThrow(); // Will throw because test.parameter doesn't exist - that's expected
    });

    it('should enable parameter history tracking', () => {
      // Act: Enable history
      expect(() => {
        parameterManager.enableParameterHistory();
      }).not.toThrow();
    });

    it('should support undo/redo operations', () => {
      // Arrange: Enable history
      parameterManager.enableParameterHistory();

      // Act & Assert: Should not throw (even if no history exists)
      expect(() => {
        parameterManager.undoLastParameterChange();
        parameterManager.redoLastParameterChange();
      }).not.toThrow();
    });

    it('should set global state dispatch', () => {
      // Arrange: Mock dispatch function
      const mockDispatch = jest.fn();

      // Act: Set dispatch
      expect(() => {
        parameterManager.setGlobalStateDispatch(mockDispatch);
      }).not.toThrow();
    });
  });

  describe('Integration Workflow', () => {
    it('should support complete UI parameter workflow', () => {
      // Arrange: Enable all features
      parameterManager.enableParameterHistory();
      algorithm.registerUIParameterSchemas(parameterManager);
      algorithm.createParameterPanels(uiManager, parameterManager);

      // Act: Perform operations
      const exported1 = algorithm.exportCurrentParameters();
      algorithm.resetParametersToDefaults(parameterManager);
      const exported2 = algorithm.exportCurrentParameters();

      // Assert: Operations should complete successfully
      expect(exported1).toBeDefined();
      expect(exported2).toBeDefined();
    });
  });
});
