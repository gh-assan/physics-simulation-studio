/**
 * Sprint 2: Parameter State Management TDD Tests
 *
 * OBJECTIVE: Connect FlagAlgorithm parameters to global state management
 * using the existing PreferencesManager instead of hardcoded values.
 *
 * IMPLEMENTATION ORDER (TDD):
 * 1. Write failing tests for parameter preferences integration
 * 2. Register flag parameter schemas with PreferencesManager
 * 3. Connect algorithm to read dynamic parameters
 * 4. Implement parameter persistence and validation
 */

import { World } from '../../../core/ecs/World';
import { GlobalStateStore, getGlobalStore, resetGlobalStore } from '../../../studio/state/GlobalStore';
import { getPreferencesManager } from '../../../studio/state/PreferencesManager';
import { FlagAlgorithm } from '../FlagAlgorithm';

describe('Sprint 2: Parameter State Management', () => {
  let algorithm: FlagAlgorithm;
  let store: GlobalStateStore;
  let preferencesManager: any;
  let world: World;

  beforeEach(() => {
    // Create fresh state store for each test
    resetGlobalStore();
    store = getGlobalStore();

    // Get preferences manager singleton
    preferencesManager = getPreferencesManager();

    // Create test world
    world = new World();

    // Create algorithm instance
    algorithm = new FlagAlgorithm();
  });

  afterEach(() => {
    // Clean up algorithm state subscription
    if (algorithm && typeof algorithm.dispose === 'function') {
      algorithm.dispose();
    }
  });

  describe('Parameter Schema Registration', () => {
    it('should register flag simulation parameter schemas with PreferencesManager', () => {
      // Act: Register parameter schemas
      algorithm.registerParameterSchemas(preferencesManager);

      // Assert: Core flag parameters should be registered by checking if we can get their values
      expect(() => preferencesManager.getPreference('flag-simulation.windStrength')).not.toThrow();
      expect(() => preferencesManager.getPreference('flag-simulation.gravity.y')).not.toThrow();
      expect(() => preferencesManager.getPreference('flag-simulation.damping')).not.toThrow();
      expect(() => preferencesManager.getPreference('flag-simulation.stiffness')).not.toThrow();
    });

    it('should register parameters with correct default values', () => {
      // Arrange & Act
      algorithm.registerParameterSchemas(preferencesManager);

      // Assert: Default values should match algorithm constants
      expect(preferencesManager.getPreference('flag-simulation.windStrength')).toBe(2.0);
      expect(preferencesManager.getPreference('flag-simulation.gravity.y')).toBe(-9.81);
      expect(preferencesManager.getPreference('flag-simulation.damping')).toBe(0.99);
      expect(preferencesManager.getPreference('flag-simulation.stiffness')).toBe(0.8);
    });

    it('should register parameters with proper validation schemas', () => {
      // Arrange & Act
      algorithm.registerParameterSchemas(preferencesManager);

      // Assert: Parameters should have proper schemas (we'll check by trying to access them)
      expect(() => preferencesManager.getPreference('flag-simulation.windStrength')).not.toThrow();
      expect(() => preferencesManager.getPreference('flag-simulation.damping')).not.toThrow();

      // Check that schemas exist by getting all schemas
      const allSchemas = preferencesManager.getAllSchemas();
      const flagSchemas = allSchemas.filter((schema: any) => schema.key.startsWith('flag-simulation.'));
      expect(flagSchemas.length).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Parameter Reading', () => {
    it('should read wind parameters from preferences instead of hardcoded values', () => {
      // Arrange: Register schemas and set custom values
      algorithm.registerParameterSchemas(preferencesManager);
      preferencesManager.setPreference('flag-simulation.windStrength', 5.0);
      preferencesManager.setPreference('flag-simulation.wind.x', 3.0);
      preferencesManager.setPreference('flag-simulation.wind.z', 2.0);

      // Act: Initialize algorithm with dynamic parameters
      algorithm.initializeWithPreferences(preferencesManager);

      // Assert: Algorithm should use preferences values
      const windVector = algorithm.getWindVector();
      expect(windVector.x).toBe(3.0);
      expect(windVector.y).toBe(0); // Should remain 0
      expect(windVector.z).toBe(2.0);
    });

    it('should read gravity parameters from preferences', () => {
      // Arrange: Register and set custom gravity
      algorithm.registerParameterSchemas(preferencesManager);
      preferencesManager.setPreference('flag-simulation.gravity.x', 0.5);
      preferencesManager.setPreference('flag-simulation.gravity.y', -15.0);
      preferencesManager.setPreference('flag-simulation.gravity.z', 0.2);

      // Act: Initialize with dynamic parameters
      algorithm.initializeWithPreferences(preferencesManager);

      // Assert: Algorithm should use custom gravity
      const gravityVector = algorithm.getGravityVector();
      expect(gravityVector.x).toBe(0.5);
      expect(gravityVector.y).toBe(-15.0);
      expect(gravityVector.z).toBe(0.2);
    });

    it('should read physics parameters from preferences', () => {
      // Arrange: Set custom physics parameters
      algorithm.registerParameterSchemas(preferencesManager);
      preferencesManager.setPreference('flag-simulation.damping', 0.95);
      preferencesManager.setPreference('flag-simulation.stiffness', 0.6);
      preferencesManager.setPreference('flag-simulation.timestep', 1 / 120); // 120fps

      // Act: Initialize with dynamic parameters
      algorithm.initializeWithPreferences(preferencesManager);

      // Assert: Physics values should be updated
      expect(algorithm.getDamping()).toBe(0.95);
      expect(algorithm.getStiffness()).toBe(0.6);
      expect(algorithm.getTimestep()).toBe(1 / 120);
    });
  });

  describe('Parameter Change Reactivity', () => {
    it('should update algorithm parameters when preferences change', () => {
      // Arrange: Initialize algorithm with preferences
      algorithm.registerParameterSchemas(preferencesManager);
      algorithm.initializeWithPreferences(preferencesManager);

      const initialWind = algorithm.getWindVector();
      expect(initialWind.x).toBe(2.0); // Default value

      // Act: Change preference value
      preferencesManager.setPreference('flag-simulation.wind.x', 8.0);

      // Assert: Algorithm should reflect the change
      const updatedWind = algorithm.getWindVector();
      expect(updatedWind.x).toBe(8.0);
    });

    it('should subscribe to preference changes for automatic updates', () => {
      // Arrange: Initialize with preferences
      algorithm.registerParameterSchemas(preferencesManager);
      algorithm.initializeWithPreferences(preferencesManager);
      algorithm.subscribeToParameterChanges(preferencesManager);

      // Act: Change multiple parameters
      preferencesManager.setPreference('flag-simulation.damping', 0.85);
      preferencesManager.setPreference('flag-simulation.gravity.y', -20.0);

      // Assert: Algorithm should automatically update
      expect(algorithm.getDamping()).toBe(0.85);
      expect(algorithm.getGravityVector().y).toBe(-20.0);
    });

    it('should validate parameter changes against schemas', () => {
      // Arrange
      algorithm.registerParameterSchemas(preferencesManager);
      algorithm.initializeWithPreferences(preferencesManager);

      // Act & Assert: Invalid values should be rejected
      expect(() => {
        preferencesManager.setPreference('flag-simulation.damping', 1.5); // Above max
      }).toThrow();

      expect(() => {
        preferencesManager.setPreference('flag-simulation.windStrength', -1); // Below min
      }).toThrow();

      // Original values should be preserved
      expect(algorithm.getDamping()).toBe(0.99); // Default value
    });
  });

  describe('Parameter Persistence Integration', () => {
    it('should automatically persist parameter changes to localStorage', () => {
      // Arrange
      algorithm.registerParameterSchemas(preferencesManager);
      algorithm.initializeWithPreferences(preferencesManager);

      // Act: Change parameters
      preferencesManager.setPreference('flag-simulation.windStrength', 7.5);
      preferencesManager.setPreference('flag-simulation.damping', 0.92);

      // Create new preferences manager to simulate restart
      const newPreferencesManager = getPreferencesManager();
      algorithm.registerParameterSchemas(newPreferencesManager);

      // Assert: Values should be persisted
      expect(newPreferencesManager.getPreference('flag-simulation.windStrength')).toBe(7.5);
      expect(newPreferencesManager.getPreference('flag-simulation.damping')).toBe(0.92);
    });

    it('should load persisted parameters on algorithm initialization', () => {
      // Arrange: Set up persisted preferences
      algorithm.registerParameterSchemas(preferencesManager);
      preferencesManager.setPreference('flag-simulation.wind.x', 4.0);
      preferencesManager.setPreference('flag-simulation.stiffness', 0.7);

      // Act: Create new algorithm and initialize with persisted preferences
      const newAlgorithm = new FlagAlgorithm();
      newAlgorithm.registerParameterSchemas(preferencesManager);
      newAlgorithm.initializeWithPreferences(preferencesManager);

      // Assert: New algorithm should use persisted values
      expect(newAlgorithm.getWindVector().x).toBe(4.0);
      expect(newAlgorithm.getStiffness()).toBe(0.7);

      // Cleanup
      newAlgorithm.dispose();
    });
  });

  describe('Integration with Global State Management', () => {
    it('should connect parameter changes to global state actions', () => {
      // Arrange: Set up state-connected algorithm
      algorithm.registerParameterSchemas(preferencesManager);
      algorithm.subscribeToState(store);
      algorithm.initializeWithPreferences(preferencesManager);

      // Spy on state dispatch
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      // Act: Change parameter
      preferencesManager.setPreference('flag-simulation.windStrength', 6.0);

      // Assert: State action should be dispatched
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('PREFERENCE_CHANGED'),
          payload: expect.objectContaining({
            key: 'flag-simulation.windStrength',
            value: 6.0
          })
        })
      );

      dispatchSpy.mockRestore();
    });

    it('should integrate parameter state with simulation state', () => {
      // Arrange: Full state integration
      algorithm.registerParameterSchemas(preferencesManager);
      algorithm.subscribeToState(store);
      algorithm.initializeWithPreferences(preferencesManager);
      algorithm.subscribeToParameterChanges(preferencesManager);

      // Act: Change parameters and simulation state
      preferencesManager.setPreference('flag-simulation.damping', 0.88);
      store.dispatch({ type: 'SIMULATION_STATE_CHANGED', payload: { isRunning: true, isPaused: false } });

      // Assert: Both parameter and simulation state should be active
      expect(algorithm.getDamping()).toBe(0.88);
      expect(algorithm.isRunning()).toBe(true);

      // Algorithm should work with both state types
      expect(() => algorithm.handleUpdate(world, 16.667)).not.toThrow();
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with hardcoded values when no preferences are set', () => {
      // Arrange: Algorithm without preferences initialization
      algorithm.subscribeToState(store);

      // Act: Use algorithm without preference setup
      store.dispatch({ type: 'SIMULATION_STATE_CHANGED', payload: { isRunning: true, isPaused: false } });

      // Assert: Should use hardcoded defaults and still work
      expect(algorithm.isRunning()).toBe(true);
      expect(() => algorithm.handleUpdate(world, 16.667)).not.toThrow();
    });

    it('should gracefully handle missing preference keys', () => {
      // Arrange: Partial preference setup
      algorithm.registerParameterSchemas(preferencesManager);
      // Only set some preferences, not all
      preferencesManager.setPreference('flag-simulation.windStrength', 3.0);
      // Don't set other parameters

      // Act: Initialize with incomplete preferences
      algorithm.initializeWithPreferences(preferencesManager);

      // Assert: Should use defaults for missing preferences
      expect(algorithm.getWindVector().x).toBe(3.0); // Set value
      expect(algorithm.getDamping()).toBe(0.99); // Default value
      expect(algorithm.getGravityVector().y).toBe(-9.81); // Default value
    });
  });
});
