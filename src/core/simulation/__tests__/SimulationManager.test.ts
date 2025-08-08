/**
 * SimulationManager Test Suite
 * 
 * TDD: Testing algorithm orchestration and fixed timestep execution
 */

import { SimulationManager } from '../../../studio/simulation/SimulationManager';
import { 
  ISimulationAlgorithm, 
  ISimulationState, 
  EntityId 
} from '../interfaces';
import { SimulationState } from '../SimulationState';

// Mock algorithm for testing
class MockAlgorithm implements ISimulationAlgorithm {
  readonly name: string;
  readonly version = '1.0.0';
  
  public stepCallCount = 0;
  public lastFixedDeltaTime = 0;
  public lastState: ISimulationState | null = null;
  public shouldThrowError = false;
  public configureCallCount = 0;
  public initializeCallCount = 0;
  public disposeCallCount = 0;
  public parameters: Record<string, any> = {};

  constructor(name: string = 'mock-algorithm') {
    this.name = name;
  }

  step(state: ISimulationState, fixedDeltaTime: number): ISimulationState {
    this.stepCallCount++;
    this.lastFixedDeltaTime = fixedDeltaTime;
    this.lastState = state;
    
    if (this.shouldThrowError) {
      throw new Error('Mock algorithm error');
    }

    // Return state with incremented time
    if (state instanceof SimulationState) {
      return state.withTime(state.time + fixedDeltaTime, fixedDeltaTime);
    }
    
    return SimulationState.create(
      Array.from(state.entities),
      state.time + fixedDeltaTime,
      fixedDeltaTime,
      state.isRunning,
      Object.fromEntries(state.metadata)
    );
  }

  configure(parameters: Record<string, any>): void {
    this.configureCallCount++;
    this.parameters = { ...this.parameters, ...parameters };
  }

  initialize(entities: EntityId[]): void {
    this.initializeCallCount++;
  }

  dispose(): void {
    this.disposeCallCount++;
  }

  getParameters(): Record<string, any> {
    return { ...this.parameters };
  }

  validateParameter(paramName: string, value: any): true | string {
    if (paramName === 'invalid') {
      return 'Invalid parameter';
    }
    return true;
  }

  reset(): void {
    this.stepCallCount = 0;
    this.lastFixedDeltaTime = 0;
    this.lastState = null;
    this.shouldThrowError = false;
    this.configureCallCount = 0;
    this.initializeCallCount = 0;
    this.disposeCallCount = 0;
    this.parameters = {};
  }
}

describe('SimulationManager', () => {
  let manager: SimulationManager;
  let mockAlgorithm: MockAlgorithm;

  beforeEach(() => {
    manager = new SimulationManager(1/60); // 60 FPS
    mockAlgorithm = new MockAlgorithm();
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const newManager = new SimulationManager();
      
      expect(newManager.getCurrentState().isEmpty()).toBe(true);
      expect(newManager.getCurrentState().time).toBe(0);
      expect(newManager.getCurrentState().isRunning).toBe(false);
      expect(newManager.getActiveAlgorithms()).toHaveLength(0);
    });

    it('should initialize with custom timestep', () => {
      const customManager = new SimulationManager(1/120); // 120 FPS
      const metrics = customManager.getTimeMetrics();
      
      expect(metrics.fixedTimestep).toBeCloseTo(1/120, 5);
      expect(metrics.targetFPS).toBeCloseTo(120, 1);
    });

    it('should initialize with custom initial state', () => {
      const initialState = SimulationState.create([1, 2, 3], 10.5, 0.02, false);
      const customManager = new SimulationManager(1/60, initialState);
      
      expect(customManager.getCurrentState().entities.size).toBe(3);
      expect(customManager.getCurrentState().time).toBe(10.5);
      expect(customManager.getCurrentState().hasEntity(1)).toBe(true);
    });
  });

  describe('Algorithm Registration', () => {
    it('should register valid algorithm', () => {
      manager.registerAlgorithm(mockAlgorithm);
      
      expect(manager.getActiveAlgorithms()).toHaveLength(1);
      expect(manager.getActiveAlgorithms()[0]).toBe(mockAlgorithm);
      expect(mockAlgorithm.initializeCallCount).toBe(1);
    });

    it('should reject algorithm without name', () => {
      const invalidAlgorithm = new MockAlgorithm('');
      
      expect(() => {
        manager.registerAlgorithm(invalidAlgorithm);
      }).toThrow('Algorithm must have a valid name');
    });

    it('should reject algorithm without version', () => {
      const invalidAlgorithm = new MockAlgorithm('test');
      Object.defineProperty(invalidAlgorithm, 'version', { value: '' });
      
      expect(() => {
        manager.registerAlgorithm(invalidAlgorithm);
      }).toThrow('Algorithm must have a valid version');
    });

    it('should reject duplicate algorithm names', () => {
      manager.registerAlgorithm(mockAlgorithm);
      const duplicate = new MockAlgorithm('mock-algorithm');
      
      expect(() => {
        manager.registerAlgorithm(duplicate);
      }).toThrow('Algorithm already registered: mock-algorithm');
    });

    it('should register multiple different algorithms', () => {
      const algorithm2 = new MockAlgorithm('algorithm-2');
      const algorithm3 = new MockAlgorithm('algorithm-3');
      
      manager.registerAlgorithm(mockAlgorithm);
      manager.registerAlgorithm(algorithm2);
      manager.registerAlgorithm(algorithm3);
      
      expect(manager.getActiveAlgorithms()).toHaveLength(3);
    });
  });

  describe('Algorithm Unregistration', () => {
    beforeEach(() => {
      manager.registerAlgorithm(mockAlgorithm);
    });

    it('should unregister algorithm', () => {
      manager.unregisterAlgorithm('mock-algorithm');
      
      expect(manager.getActiveAlgorithms()).toHaveLength(0);
      expect(mockAlgorithm.disposeCallCount).toBe(1);
    });

    it('should handle unregistering non-existent algorithm gracefully', () => {
      expect(() => {
        manager.unregisterAlgorithm('non-existent');
      }).not.toThrow();
      
      expect(manager.getActiveAlgorithms()).toHaveLength(1);
    });

    it('should handle disposal errors gracefully', () => {
      const throwingAlgorithm = new MockAlgorithm('throwing');
      throwingAlgorithm.dispose = jest.fn(() => {
        throw new Error('Disposal error');
      });
      
      manager.registerAlgorithm(throwingAlgorithm);
      
      expect(() => {
        manager.unregisterAlgorithm('throwing');
      }).not.toThrow();
      
      expect(manager.getActiveAlgorithms()).toHaveLength(1); // Original algorithm still there
    });
  });

  describe('Simulation Controls', () => {
    beforeEach(() => {
      manager.registerAlgorithm(mockAlgorithm);
    });

    describe('Play/Pause/Reset', () => {
      it('should start simulation', () => {
        manager.play();
        
        expect(manager.getCurrentState().isRunning).toBe(true);
      });

      it('should pause simulation', () => {
        manager.play();
        manager.pause();
        
        expect(manager.getCurrentState().isRunning).toBe(false);
      });

      it('should handle multiple play calls', () => {
        manager.play();
        manager.play(); // Should not throw or cause issues
        
        expect(manager.getCurrentState().isRunning).toBe(true);
      });

      it('should handle multiple pause calls', () => {
        manager.play();
        manager.pause();
        manager.pause(); // Should not throw or cause issues
        
        expect(manager.getCurrentState().isRunning).toBe(false);
      });

      it('should reset simulation to initial state', () => {
        manager.setEntities([1, 2, 3]);
        manager.play();
        manager.step(1.0); // Advance simulation
        
        const stateBeforeReset = manager.getCurrentState();
        expect(stateBeforeReset.time).toBeGreaterThan(0);
        
        manager.reset();
        
        const stateAfterReset = manager.getCurrentState();
        expect(stateAfterReset.time).toBe(0);
        expect(stateAfterReset.isRunning).toBe(false);
        expect(stateAfterReset.entities.size).toBe(3);
      });
    });

    describe('Entity Management', () => {
      it('should set entities and reinitialize algorithms', () => {
        const entities = [10, 20, 30];
        
        manager.setEntities(entities);
        
        expect(manager.getCurrentState().entities.size).toBe(3);
        expect(manager.getCurrentState().hasEntity(10)).toBe(true);
        expect(mockAlgorithm.initializeCallCount).toBe(2); // Once on registration, once on setEntities
      });

      it('should handle empty entity list', () => {
        manager.setEntities([]);
        
        expect(manager.getCurrentState().isEmpty()).toBe(true);
      });
    });
  });

  describe('Fixed Timestep Execution', () => {
    beforeEach(() => {
      manager.registerAlgorithm(mockAlgorithm);
      manager.play();
    });

    it('should not execute steps when paused', () => {
      manager.pause();
      manager.step(1.0);
      
      expect(mockAlgorithm.stepCallCount).toBe(0);
    });

    it('should execute fixed timestep on step', () => {
      manager.step(1/60); // Exactly one frame
      
      expect(mockAlgorithm.stepCallCount).toBe(1);
      expect(mockAlgorithm.lastFixedDeltaTime).toBeCloseTo(1/60, 5);
    });

    it('should execute multiple timesteps for large delta', () => {
      manager.step(1/20); // 50ms should trigger multiple 16.67ms steps
      
      expect(mockAlgorithm.stepCallCount).toBeGreaterThan(1);
      expect(mockAlgorithm.lastFixedDeltaTime).toBeCloseTo(1/60, 5);
    });

    it('should update simulation time correctly', () => {
      const initialTime = manager.getCurrentState().time;
      
      manager.step(1/30); // 33.33ms
      
      const finalTime = manager.getCurrentState().time;
      expect(finalTime).toBeGreaterThan(initialTime);
    });

    it('should handle multiple algorithms in sequence', () => {
      const algorithm2 = new MockAlgorithm('algorithm-2');
      manager.registerAlgorithm(algorithm2);
      
      manager.step(1/60);
      
      expect(mockAlgorithm.stepCallCount).toBe(1);
      expect(algorithm2.stepCallCount).toBe(1);
      
      // First algorithm receives state with time 0, second receives modified state  
      expect(mockAlgorithm.lastState?.time).toBe(0); // First gets initial state
      expect(algorithm2.lastState?.time).toBe(1/60); // Second gets state after first
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      manager.registerAlgorithm(mockAlgorithm);
      manager.play();
    });

    it('should handle algorithm step errors gracefully', () => {
      mockAlgorithm.shouldThrowError = true;
      
      expect(() => {
        manager.step(1/60);
      }).not.toThrow();
      
      // Simulation should continue working
      mockAlgorithm.shouldThrowError = false;
      manager.step(1/60);
      expect(mockAlgorithm.stepCallCount).toBeGreaterThan(0);
    });

    it('should handle algorithm initialization errors gracefully', () => {
      const throwingAlgorithm = new MockAlgorithm('throwing');
      throwingAlgorithm.initialize = jest.fn(() => {
        throw new Error('Initialization error');
      });
      
      expect(() => {
        manager.setEntities([1, 2, 3]);
      }).not.toThrow();
    });
  });

  describe('Parameter Configuration', () => {
    beforeEach(() => {
      manager.registerAlgorithm(mockAlgorithm);
    });

    it('should configure algorithm parameters', () => {
      const parameters = { param1: 'value1', param2: 42 };
      
      manager.configureAlgorithm('mock-algorithm', parameters);
      
      expect(mockAlgorithm.configureCallCount).toBe(1);
      expect(mockAlgorithm.parameters).toEqual(parameters);
    });

    it('should handle configuring non-existent algorithm', () => {
      expect(() => {
        manager.configureAlgorithm('non-existent', { param: 'value' });
      }).not.toThrow();
    });

    it('should validate parameters before configuration', () => {
      expect(() => {
        manager.configureAlgorithm('mock-algorithm', { invalid: 'value' });
      }).toThrow('Invalid parameter');
    });
  });

  describe('State Change Listeners', () => {
    let listener: jest.Mock;

    beforeEach(() => {
      listener = jest.fn();
      manager.addStateChangeListener(listener);
      manager.registerAlgorithm(mockAlgorithm);
    });

    it('should notify listeners on state changes', () => {
      manager.play();
      manager.step(1/60);
      
      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(manager.getCurrentState());
    });

    it('should not notify listeners when simulation is paused', () => {
      manager.pause();
      manager.step(1/60);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow removing listeners', () => {
      manager.removeStateChangeListener(listener);
      manager.play();
      manager.step(1/60);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener exceptions gracefully', () => {
      const throwingListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      manager.addStateChangeListener(throwingListener);
      
      expect(() => {
        manager.play();
        manager.step(1/60);
      }).not.toThrow();
      
      expect(throwingListener).toHaveBeenCalled();
    });
  });

  describe('Time Management', () => {
    it('should allow changing fixed timestep', () => {
      manager.setFixedTimestep(1/120); // 120 FPS
      
      const metrics = manager.getTimeMetrics();
      expect(metrics.fixedTimestep).toBeCloseTo(1/120, 5);
      expect(metrics.targetFPS).toBeCloseTo(120, 1);
    });

    it('should provide time metrics', () => {
      manager.registerAlgorithm(mockAlgorithm);
      
      const metrics = manager.getTimeMetrics();
      
      expect(metrics.fixedTimestep).toBeCloseTo(1/60, 5);
      expect(metrics.targetFPS).toBeCloseTo(60, 1);
      expect(typeof metrics.isKeepingUp).toBe('boolean');
      expect(metrics.accumulatedTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Debug Information', () => {
    beforeEach(() => {
      manager.registerAlgorithm(mockAlgorithm);
      manager.setEntities([1, 2, 3]);
    });

    it('should provide comprehensive debug info', () => {
      manager.play();
      
      const debugInfo = manager.getDebugInfo();
      
      expect(debugInfo.algorithmsCount).toBe(1);
      expect(debugInfo.entityCount).toBe(3);
      expect(debugInfo.isPlaying).toBe(true);
      expect(debugInfo.currentTime).toBe(0);
      expect(debugInfo.timeMetrics).toBeDefined();
    });

    it('should update debug info as simulation progresses', () => {
      manager.play();
      manager.step(1/60);
      
      const debugInfo = manager.getDebugInfo();
      
      expect(debugInfo.currentTime).toBeGreaterThan(0);
      expect(debugInfo.isPlaying).toBe(true);
    });
  });
});
