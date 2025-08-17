/**
 * Phase 3: Algorithm State Integration TDD Tests
 *
 * OBJECTIVE: Make FlagAlgorithm respond to state changes from global state management
 * instead of direct method calls. This is the final piece of state management integration.
 *
 * IMPLEMENTATION ORDER (TDD):
 * 1. Write failing tests for algorithm state subscription
 * 2. Implement state subscription in FlagAlgorithm
 * 3. Connect algorithm lifecycle to SimulationSelectors
 * 4. Remove direct method calls, use state-driven execution
 */

import { World } from '../../../core/ecs/World';
import { Actions } from '../../../studio/state/Actions';
import { GlobalStateStore, getGlobalStore, resetGlobalStore } from '../../../studio/state/GlobalStore';
import { SimulationSelectors } from '../../../studio/state/Selectors';
import { FlagAlgorithm } from '../FlagAlgorithm';

describe('Phase 3: Algorithm State Integration', () => {
  let algorithm: FlagAlgorithm;
  let store: GlobalStateStore;
  let world: any;

  beforeEach(() => {
    // Create fresh state store for each test
    resetGlobalStore();
    store = getGlobalStore();

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

  describe('State Subscription Setup', () => {
    it('should allow algorithm to subscribe to global state store', () => {
      // Arrange: Fresh algorithm and store
      expect(algorithm).toBeDefined();
      expect(store).toBeDefined();

      // Act: Algorithm should be able to subscribe to state changes
      expect(() => {
        algorithm.subscribeToState(store);
      }).not.toThrow();

      // Assert: Algorithm should have state subscription
      expect(algorithm.isSubscribedToState()).toBe(true);
    });

    it('should detect initial simulation state correctly', () => {
      // Arrange: Subscribe algorithm to state
      algorithm.subscribeToState(store);

      // Act: Check initial state detection
      const initialState = store.getState();
      const isRunning = SimulationSelectors.isSimulationRunning(initialState);
      const isPaused = SimulationSelectors.isSimulationPaused(initialState);

      // Assert: Algorithm should detect initial state (not running)
      expect(isRunning).toBe(false);
      expect(isPaused).toBe(false);
      expect(algorithm.isRunning()).toBe(false);
    });
  });

  describe('State-Driven Algorithm Execution', () => {
    it('should start algorithm execution when simulation state becomes running', () => {
      // Arrange: Subscribe algorithm to state
      algorithm.subscribeToState(store);
      expect(algorithm.isRunning()).toBe(false);

      // Act: Dispatch simulation state change to running
      store.dispatch(Actions.simulationStateChanged({
        isRunning: true,
        isPaused: false
      }));

      // Assert: Algorithm should detect state change and start running
      const newState = store.getState();
      expect(SimulationSelectors.isSimulationRunning(newState)).toBe(true);
      expect(algorithm.isRunning()).toBe(true);
    });

    it('should pause algorithm execution when simulation state becomes paused', () => {
      // Arrange: Start with running algorithm
      algorithm.subscribeToState(store);
      store.dispatch(Actions.simulationStateChanged({
        isRunning: true,
        isPaused: false
      }));
      expect(algorithm.isRunning()).toBe(true);

      // Act: Pause simulation
      store.dispatch(Actions.simulationStateChanged({
        isRunning: false,
        isPaused: true
      }));

      // Assert: Algorithm should pause
      const newState = store.getState();
      expect(SimulationSelectors.isSimulationPaused(newState)).toBe(true);
      expect(algorithm.isRunning()).toBe(false);
      expect(algorithm.isPaused()).toBe(true);
    });

    it('should stop algorithm execution when simulation state becomes stopped', () => {
      // Arrange: Start with running algorithm
      algorithm.subscribeToState(store);
      store.dispatch(Actions.simulationStateChanged({
        isRunning: true,
        isPaused: false
      }));
      expect(algorithm.isRunning()).toBe(true);

      // Act: Stop simulation
      store.dispatch(Actions.simulationStateChanged({
        isRunning: false,
        isPaused: false
      }));

      // Assert: Algorithm should stop completely
      const newState = store.getState();
      expect(SimulationSelectors.isSimulationRunning(newState)).toBe(false);
      expect(SimulationSelectors.isSimulationPaused(newState)).toBe(false);
      expect(algorithm.isRunning()).toBe(false);
      expect(algorithm.isPaused()).toBe(false);
    });
  });

  describe('Algorithm Update Lifecycle Integration', () => {
    it('should only call algorithm.update() when state is running', () => {
      // Arrange: Subscribe and spy on update method
      algorithm.subscribeToState(store);
      const updateSpy = jest.spyOn(algorithm, 'update');

      // Act & Assert: Update should not be called when stopped
      algorithm.handleUpdate(world, 16.667); // ~60fps
      expect(updateSpy).not.toHaveBeenCalled();

      // Act: Start simulation
      store.dispatch(Actions.simulationStateChanged({
        isRunning: true,
        isPaused: false
      }));

      // Act & Assert: Update should be called when running
      algorithm.handleUpdate(world, 16.667);
      expect(updateSpy).toHaveBeenCalledWith(16.667);
      expect(updateSpy).toHaveBeenCalledTimes(1);

      // Act: Pause simulation
      store.dispatch(Actions.simulationStateChanged({
        isRunning: false,
        isPaused: true
      }));

      // Act & Assert: Update should not be called when paused
      algorithm.handleUpdate(world, 16.667);
      expect(updateSpy).toHaveBeenCalledTimes(1); // Still only once
    });

    it('should maintain algorithm state across state transitions', () => {
      // Arrange: Initialize algorithm with state subscription
      algorithm.subscribeToState(store);
      algorithm.initialize(world);

      // Act: Start, pause, resume simulation
      store.dispatch(Actions.simulationStateChanged({ isRunning: true, isPaused: false }));
      algorithm.handleUpdate(world, 16.667); // Process one frame

      store.dispatch(Actions.simulationStateChanged({ isRunning: false, isPaused: true }));
      algorithm.handleUpdate(world, 16.667); // Should not process

      store.dispatch(Actions.simulationStateChanged({ isRunning: true, isPaused: false }));
      algorithm.handleUpdate(world, 16.667); // Should resume processing

      // Assert: Algorithm should maintain internal state throughout transitions
      expect(algorithm.isInitialized()).toBe(true);
      expect(algorithm.isRunning()).toBe(true);
      expect(() => algorithm.handleUpdate(world, 16.667)).not.toThrow();
    });
  });

  describe('State Cleanup and Disposal', () => {
    it('should properly dispose state subscription when algorithm is disposed', () => {
      // Arrange: Subscribe algorithm to state
      algorithm.subscribeToState(store);
      expect(algorithm.isSubscribedToState()).toBe(true);

      // Act: Dispose algorithm
      algorithm.dispose();

      // Assert: State subscription should be cleaned up
      expect(algorithm.isSubscribedToState()).toBe(false);

      // Act: State changes should not affect disposed algorithm
      store.dispatch(Actions.simulationStateChanged({ isRunning: true, isPaused: false }));

      // Assert: Disposed algorithm should not respond to state changes
      expect(algorithm.isRunning()).toBe(false);
    });

    it('should handle multiple subscribe/dispose cycles safely', () => {
      // Act & Assert: Multiple subscribe/dispose cycles
      expect(() => {
        algorithm.subscribeToState(store);
        algorithm.dispose();
        algorithm.subscribeToState(store);
        algorithm.dispose();
        algorithm.subscribeToState(store);
        algorithm.dispose();
      }).not.toThrow();

      // Final state should be clean
      expect(algorithm.isSubscribedToState()).toBe(false);
      expect(algorithm.isRunning()).toBe(false);
    });
  });

  describe('Integration with Existing Algorithm Interface', () => {
    it('should maintain backward compatibility with direct method calls during transition', () => {
      // Arrange: Algorithm with state subscription
      algorithm.subscribeToState(store);
      algorithm.initialize(world);

      // Act: Direct method calls should still work (during transition period)
      expect(() => {
        algorithm.start();
        algorithm.pause();
        algorithm.stop();
      }).not.toThrow();

      // Assert: Algorithm should remain functional with both approaches
      expect(algorithm.isInitialized()).toBe(true);
    });

    it('should prioritize state-driven execution over direct method calls', () => {
      // Arrange: Algorithm with state subscription
      algorithm.subscribeToState(store);
      algorithm.initialize(world);

      // Act: Set state to stopped, but call direct start()
      store.dispatch(Actions.simulationStateChanged({ isRunning: false, isPaused: false }));
      algorithm.start(); // Direct call should be overridden by state

      // Assert: State should take precedence
      expect(algorithm.isRunning()).toBe(false); // State wins over direct call

      // Act: Set state to running
      store.dispatch(Actions.simulationStateChanged({ isRunning: true, isPaused: false }));

      // Assert: Now algorithm should run based on state
      expect(algorithm.isRunning()).toBe(true);
    });
  });
});
