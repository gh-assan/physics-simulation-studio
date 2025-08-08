/**
 * TimeSteppingEngine Test Suite
 *
 * TDD: Testing fixed timestep behavior for numerical stability
 */

import { TimeSteppingEngine, ITimeSteppingEngine } from '../TimeSteppingEngine';

describe('TimeSteppingEngine', () => {
  let engine: ITimeSteppingEngine;
  let stepCallback: jest.Mock;

  beforeEach(() => {
    engine = new TimeSteppingEngine();
    stepCallback = jest.fn();
  });

  describe('Initialization', () => {
    it('should initialize with default 60 FPS timestep', () => {
      expect(engine.getFixedTimestep()).toBeCloseTo(1/60, 5);
      expect(engine.getCurrentFPS()).toBeCloseTo(60, 1);
      expect(engine.getAccumulatedTime()).toBe(0);
    });

    it('should initialize with custom timestep', () => {
      const customEngine = new TimeSteppingEngine(1/120); // 120 FPS

      expect(customEngine.getFixedTimestep()).toBeCloseTo(1/120, 5);
      expect(customEngine.getCurrentFPS()).toBeCloseTo(120, 1);
    });

    it('should initialize with max accumulated time limit', () => {
      const customEngine = new TimeSteppingEngine(1/60, 0.1);

      expect(customEngine.getFixedTimestep()).toBeCloseTo(1/60, 5);
      // Test will verify spiral of death prevention in behavior tests
    });
  });

  describe('Fixed Timestep Execution', () => {
    it('should not execute callback when delta time is too small', () => {
      engine.step(0.001, stepCallback); // 1ms - less than 16.67ms needed

      expect(stepCallback).not.toHaveBeenCalled();
      expect(engine.getAccumulatedTime()).toBeCloseTo(0.001, 5);
    });

    it('should execute callback once when delta time equals fixed timestep', () => {
      engine.step(1/60, stepCallback);

      expect(stepCallback).toHaveBeenCalledTimes(1);
      expect(stepCallback).toHaveBeenCalledWith(1/60);
      expect(engine.getAccumulatedTime()).toBeCloseTo(0, 5);
    });

    it('should execute callback multiple times for large delta time', () => {
      engine.step(1/20, stepCallback); // 50ms - should trigger 3 steps at 60fps

      expect(stepCallback).toHaveBeenCalledTimes(3);
      expect(stepCallback).toHaveBeenNthCalledWith(1, 1/60);
      expect(stepCallback).toHaveBeenNthCalledWith(2, 1/60);
      expect(stepCallback).toHaveBeenNthCalledWith(3, 1/60);
      expect(engine.getAccumulatedTime()).toBeLessThan(1/60);
    });

    it('should accumulate partial time across multiple calls', () => {
      // First call - not enough time for full step
      engine.step(0.01, stepCallback); // 10ms
      expect(stepCallback).not.toHaveBeenCalled();
      expect(engine.getAccumulatedTime()).toBeCloseTo(0.01, 5);

      // Second call - now we have enough accumulated time
      engine.step(0.01, stepCallback); // Another 10ms = 20ms total
      expect(stepCallback).toHaveBeenCalledTimes(1);
      expect(engine.getAccumulatedTime()).toBeLessThan(0.01);
    });
  });

  describe('Spiral of Death Prevention', () => {
    it('should prevent excessive steps with default max accumulated time', () => {
      // Simulate a huge frame time (1 second)
      engine.step(1.0, stepCallback);

      // Should not execute more than maxSteps
      const maxSteps = Math.floor((1/60 * 5) / (1/60)); // 5 frames worth
      expect(stepCallback).toHaveBeenCalledTimes(maxSteps);

      // Accumulated time should be reset to prevent further accumulation
      expect(engine.getAccumulatedTime()).toBe(0);
    });

    it('should respect custom max accumulated time limit', () => {
      const customEngine = new TimeSteppingEngine(1/60, 0.05); // 50ms max

      customEngine.step(0.2, stepCallback); // 200ms - way over limit

      const expectedMaxSteps = Math.floor(0.05 / (1/60));
      expect(stepCallback).toHaveBeenCalledTimes(expectedMaxSteps);
    });

    it('should clamp extremely large delta times', () => {
      engine.step(10.0, stepCallback); // 10 seconds!

      // Should not lock up the application
      expect(stepCallback).toHaveBeenCalled();
      expect(stepCallback.mock.calls.length).toBeLessThan(1000);
    });
  });

  describe('Timestep Configuration', () => {
    it('should allow changing fixed timestep', () => {
      engine.setFixedTimestep(1/120); // 120 FPS

      expect(engine.getFixedTimestep()).toBeCloseTo(1/120, 5);
      expect(engine.getCurrentFPS()).toBeCloseTo(120, 1);
    });

    it('should reject invalid timestep values', () => {
      expect(() => engine.setFixedTimestep(0)).toThrow('Fixed timestep must be positive');
      expect(() => engine.setFixedTimestep(-0.1)).toThrow('Fixed timestep must be positive');
    });

    it('should warn about large timestep values', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      engine.setFixedTimestep(0.2); // 200ms - very large

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Large timestep')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      // Add some accumulated time
      engine.step(0.01, stepCallback);
    });

    it('should reset accumulated time', () => {
      expect(engine.getAccumulatedTime()).toBeGreaterThan(0);

      engine.reset();

      expect(engine.getAccumulatedTime()).toBe(0);
    });

    it('should maintain timestep after reset', () => {
      engine.setFixedTimestep(1/120);

      engine.reset();

      expect(engine.getFixedTimestep()).toBeCloseTo(1/120, 5);
    });
  });

  describe('Interpolation Support', () => {
    it('should provide interpolation alpha', () => {
      // Add partial timestep
      engine.step(0.01, stepCallback); // 10ms with 16.67ms timestep

      const alpha = engine.getInterpolationAlpha();

      expect(alpha).toBeGreaterThan(0);
      expect(alpha).toBeLessThan(1);
      expect(alpha).toBeCloseTo(0.01 / (1/60), 2);
    });

    it('should have zero interpolation alpha after complete step', () => {
      engine.step(1/60, stepCallback); // Exact timestep

      expect(engine.getInterpolationAlpha()).toBeCloseTo(0, 5);
    });
  });

  describe('Performance Monitoring', () => {
    it('should report if keeping up with real time', () => {
      // Small accumulated time - keeping up
      engine.step(0.001, stepCallback);
      expect(engine.isKeepingUp()).toBe(true);

      // Add partial time without executing steps - should be falling behind
      engine.step(0.04, stepCallback); // Add 40ms but only ~2 steps will execute, leaving remainder
      const accumulatedAfter = engine.getAccumulatedTime();

      if (accumulatedAfter > 1/60 * 3) { // More than 3 frames worth
        expect(engine.isKeepingUp()).toBe(false);
      } else {
        expect(engine.isKeepingUp()).toBe(true);
      }
    });

    it('should provide comprehensive metrics', () => {
      engine.setFixedTimestep(1/30); // 30 FPS
      engine.step(0.02, stepCallback); // 20ms

      const metrics = engine.getMetrics();

      expect(metrics.fixedTimestep).toBeCloseTo(1/30, 5);
      expect(metrics.targetFPS).toBeCloseTo(30, 1);
      expect(metrics.accumulatedTime).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.isKeepingUp).toBe('boolean');
      expect(metrics.interpolationAlpha).toBeGreaterThanOrEqual(0);
      expect(metrics.interpolationAlpha).toBeLessThanOrEqual(1);
    });
  });

  describe('Utility Methods', () => {
    it('should calculate timestep for target FPS', () => {
      expect(TimeSteppingEngine.getTimestepForFPS(60)).toBeCloseTo(1/60, 5);
      expect(TimeSteppingEngine.getTimestepForFPS(120)).toBeCloseTo(1/120, 5);
      expect(TimeSteppingEngine.getTimestepForFPS(30)).toBeCloseTo(1/30, 5);
    });

    it('should reject invalid FPS values', () => {
      expect(() => TimeSteppingEngine.getTimestepForFPS(0)).toThrow('Target FPS must be positive');
      expect(() => TimeSteppingEngine.getTimestepForFPS(-1)).toThrow('Target FPS must be positive');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delta time gracefully', () => {
      engine.step(0, stepCallback);

      expect(stepCallback).not.toHaveBeenCalled();
      expect(engine.getAccumulatedTime()).toBe(0);
    });

    it('should handle negative delta time gracefully', () => {
      engine.step(-0.1, stepCallback);

      expect(stepCallback).not.toHaveBeenCalled();
      expect(engine.getAccumulatedTime()).toBe(0);
    });

    it('should handle callback exceptions gracefully', () => {
      const throwingCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      expect(() => {
        engine.step(1/60, throwingCallback);
      }).toThrow('Callback error');

      // Engine should still be in valid state - accumulated time should be preserved
      // since the step failed and we don't want to lose the time
      expect(engine.getAccumulatedTime()).toBeCloseTo(1/60, 5);
    });
  });
});
