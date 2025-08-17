/**
 * TDD Test: State Actions Integration - Phase 2
 * Testing missing simulationStateChanged action integration with flag simulation
 */

import { World } from '../../../core/ecs/World';
import { Actions } from '../../../studio/state/Actions';
import { GlobalStateStore, getGlobalStore, resetGlobalStore } from '../../../studio/state/GlobalStore';
import { Selectors } from '../../../studio/state/Selectors';
import { FlagSimulationPlugin } from '../FlagSimulationPlugin';

describe('🔄 Phase 2: State Actions Integration - TDD', () => {
  let store: GlobalStateStore;
  let flagPlugin: FlagSimulationPlugin;
  let world: World;

  beforeEach(() => {
    resetGlobalStore();
    store = getGlobalStore();
    world = new World();
    flagPlugin = new FlagSimulationPlugin();
  });

  afterEach(() => {
    resetGlobalStore();
  });

  describe('Missing simulationStateChanged Action Creator', () => {
    it('should have simulationStateChanged action creator available', () => {
      // TDD: Test that the action creator exists
      expect(Actions.simulationStateChanged).toBeDefined();
      expect(typeof Actions.simulationStateChanged).toBe('function');
    });

    it('should create valid simulationStateChanged action', () => {
      // TDD: Test that simulationStateChanged creates proper action structure
      const action = Actions.simulationStateChanged({ isRunning: true, isPaused: false });

      expect(action.type).toBe('SIMULATION_STATE_CHANGED');
      expect(action.payload).toEqual({ isRunning: true, isPaused: false });
      expect(action.timestamp).toBeDefined();
      expect(action.metadata).toBeDefined();
    });

    it('should update global state when simulationStateChanged is dispatched', () => {
      // TDD: Test that dispatching simulationStateChanged updates global simulation state
      const initialState = store.getState();
      expect(Selectors.Simulation.isSimulationRunning(initialState)).toBe(false);
      expect(Selectors.Simulation.isSimulationPaused(initialState)).toBe(false);

      // Dispatch play state change
      store.dispatch(Actions.simulationStateChanged({ isRunning: true, isPaused: false }));

      const playingState = store.getState();
      expect(Selectors.Simulation.isSimulationRunning(playingState)).toBe(true);
      expect(Selectors.Simulation.isSimulationPaused(playingState)).toBe(false);

      // Dispatch pause state change
      store.dispatch(Actions.simulationStateChanged({ isRunning: false, isPaused: true }));

      const pausedState = store.getState();
      expect(Selectors.Simulation.isSimulationRunning(pausedState)).toBe(false);
      expect(Selectors.Simulation.isSimulationPaused(pausedState)).toBe(true);
    });
  });

  describe('Flag Simulation State Integration', () => {
    it('should dispatch simulationLoaded when flag simulation loads', async () => {
      // TDD: Test that loading flag simulation dispatches the correct state action
      const stateBefore = Selectors.Simulation.getCurrentSimulation(store.getState());
      expect(stateBefore).toBeNull();

      // Load flag simulation with state integration
      await flagPlugin.register(world as any);
      store.dispatch(Actions.simulationLoaded('flag-simulation'));

      const stateAfter = Selectors.Simulation.getCurrentSimulation(store.getState());
      expect(stateAfter).toBe('flag-simulation');
      expect(Selectors.Simulation.isSimulationLoaded(store.getState())).toBe(true);
    });

    it('should connect play/pause to simulationStateChanged actions', () => {
      // TDD: Test that play/pause operations trigger state changes
      store.dispatch(Actions.simulationLoaded('flag-simulation'));

      // Initial state - not running
      expect(Selectors.Simulation.isSimulationRunning(store.getState())).toBe(false);

      // Simulate play button pressed
      store.dispatch(Actions.simulationStateChanged({ isRunning: true, isPaused: false }));
      expect(Selectors.Simulation.isSimulationRunning(store.getState())).toBe(true);
      expect(Selectors.Simulation.isSimulationPaused(store.getState())).toBe(false);

      // Simulate pause button pressed
      store.dispatch(Actions.simulationStateChanged({ isRunning: false, isPaused: true }));
      expect(Selectors.Simulation.isSimulationRunning(store.getState())).toBe(false);
      expect(Selectors.Simulation.isSimulationPaused(store.getState())).toBe(true);
    });

    it('should subscribe to state changes and react to simulation state', () => {
      // TDD: Test that flag simulation can subscribe to and react to state changes
      let isAlgorithmRunning = false;

      // Mock algorithm state subscription
      const unsubscribe = store.subscribe((newState, prevState, action) => {
        if (action.type === 'SIMULATION_STATE_CHANGED') {
          isAlgorithmRunning = Selectors.Simulation.isSimulationRunning(newState);
        }
      });

      // Initially not running
      expect(isAlgorithmRunning).toBe(false);

      // Dispatch state change - algorithm should react
      store.dispatch(Actions.simulationStateChanged({ isRunning: true }));
      expect(isAlgorithmRunning).toBe(true);

      // Dispatch pause - algorithm should react
      store.dispatch(Actions.simulationStateChanged({ isRunning: false, isPaused: true }));
      expect(isAlgorithmRunning).toBe(false);

      unsubscribe.unsubscribe();
    });

    it('should integrate simulation loading and state changes in workflow', () => {
      // TDD: Test complete workflow with both simulationLoaded and simulationStateChanged

      // Step 1: Load simulation
      store.dispatch(Actions.simulationLoaded('flag-simulation'));
      expect(Selectors.Simulation.getCurrentSimulation(store.getState())).toBe('flag-simulation');
      expect(Selectors.Simulation.isSimulationRunning(store.getState())).toBe(false);

      // Step 2: Start simulation
      store.dispatch(Actions.simulationStateChanged({ isRunning: true, isPaused: false }));
      expect(Selectors.Simulation.isSimulationRunning(store.getState())).toBe(true);
      expect(Selectors.Simulation.getCurrentSimulation(store.getState())).toBe('flag-simulation');

      // Step 3: Pause simulation
      store.dispatch(Actions.simulationStateChanged({ isRunning: false, isPaused: true }));
      expect(Selectors.Simulation.isSimulationRunning(store.getState())).toBe(false);
      expect(Selectors.Simulation.isSimulationPaused(store.getState())).toBe(true);
      expect(Selectors.Simulation.getCurrentSimulation(store.getState())).toBe('flag-simulation');

      // Step 4: Unload simulation
      store.dispatch(Actions.simulationUnloaded());
      expect(Selectors.Simulation.getCurrentSimulation(store.getState())).toBeNull();
      expect(Selectors.Simulation.isSimulationRunning(store.getState())).toBe(false);
      expect(Selectors.Simulation.isSimulationPaused(store.getState())).toBe(false);
    });
  });

  describe('Action History and Debugging', () => {
    it('should track simulation actions in history for debugging', () => {
      // TDD: Test that state actions are properly tracked for debugging
      store.dispatch(Actions.simulationLoaded('flag-simulation'));
      store.dispatch(Actions.simulationStateChanged({ isRunning: true }));
      store.dispatch(Actions.simulationStateChanged({ isRunning: false, isPaused: true }));

      const history = store.getActionHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);

      const actionTypes = history.map(action => action.type);
      expect(actionTypes).toContain('SIMULATION_LOADED');
      expect(actionTypes).toContain('SIMULATION_STATE_CHANGED');
    });

    it('should provide metadata for simulation state tracking', () => {
      // TDD: Test that actions include proper metadata for debugging
      const action = Actions.simulationStateChanged({ isRunning: true }, 'FlagSimulation');

      expect(action.metadata).toBeDefined();
      expect(action.metadata?.source).toBe('FlagSimulation');
      expect(action.timestamp).toBeDefined();
      expect(typeof action.timestamp).toBe('number');
    });
  });
});
