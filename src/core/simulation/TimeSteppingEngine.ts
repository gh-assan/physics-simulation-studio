/**
 * Fixed Timestep Engine for Stable Physics Simulation
 * 
 * This engine ensures numerical stability by using fixed timesteps,
 * preventing instability from variable frame rates.
 */

export interface ITimeSteppingEngine {
  step(realDeltaTime: number, stepCallback: (fixedDt: number) => void): void;
  setFixedTimestep(timestep: number): void;
  getFixedTimestep(): number;
  getAccumulatedTime(): number;
  reset(): void;
  getInterpolationAlpha(): number;
  getCurrentFPS(): number;
  isKeepingUp(): boolean;
  getMetrics(): {
    fixedTimestep: number;
    accumulatedTime: number;
    targetFPS: number;
    isKeepingUp: boolean;
    interpolationAlpha: number;
  };
}

export class TimeSteppingEngine implements ITimeSteppingEngine {
  private fixedTimestep: number;
  private accumulatedTime: number = 0;
  private readonly maxAccumulatedTime: number;

  constructor(
    fixedTimestep: number = 1 / 60, // 60 FPS default
    maxAccumulatedTime?: number
  ) {
    this.fixedTimestep = fixedTimestep;
    // Prevent spiral of death - limit accumulated time
    this.maxAccumulatedTime = maxAccumulatedTime ?? fixedTimestep * 5;
  }

  /**
   * Execute fixed timestep simulation
   * 
   * @param realDeltaTime Time since last frame (variable)
   * @param stepCallback Function to call for each fixed timestep
   */
  step(realDeltaTime: number, stepCallback: (fixedDt: number) => void): void {
    // Clamp real delta time to prevent huge jumps
    const clampedDeltaTime = Math.min(realDeltaTime, this.maxAccumulatedTime);
    
    this.accumulatedTime += clampedDeltaTime;

    // Execute as many fixed timesteps as needed
    let steps = 0;
    const maxSteps = Math.floor(this.maxAccumulatedTime / this.fixedTimestep);

    while (this.accumulatedTime >= this.fixedTimestep && steps < maxSteps) {
      stepCallback(this.fixedTimestep);
      this.accumulatedTime -= this.fixedTimestep;
      steps++;
    }

    // If we hit max steps, reset accumulated time to prevent further accumulation
    if (steps >= maxSteps) {
      this.accumulatedTime = 0;
    }
  }

  /**
   * Set the fixed timestep value
   */
  setFixedTimestep(timestep: number): void {
    if (timestep <= 0) {
      throw new Error('Fixed timestep must be positive');
    }
    if (timestep > 0.1) {
      console.warn(`Warning: Large timestep (${timestep}s) may cause instability`);
    }
    
    this.fixedTimestep = timestep;
  }

  /**
   * Get the current fixed timestep
   */
  getFixedTimestep(): number {
    return this.fixedTimestep;
  }

  /**
   * Get the current accumulated time
   */
  getAccumulatedTime(): number {
    return this.accumulatedTime;
  }

  /**
   * Reset the accumulated time
   */
  reset(): void {
    this.accumulatedTime = 0;
  }

  /**
   * Get the interpolation alpha for smooth rendering
   * This can be used for interpolating rendering between physics steps
   */
  getInterpolationAlpha(): number {
    return this.accumulatedTime / this.fixedTimestep;
  }

  /**
   * Calculate recommended timestep based on target FPS
   */
  static getTimestepForFPS(targetFPS: number): number {
    if (targetFPS <= 0) {
      throw new Error('Target FPS must be positive');
    }
    return 1 / targetFPS;
  }

  /**
   * Get FPS equivalent of current timestep
   */
  getCurrentFPS(): number {
    return 1 / this.fixedTimestep;
  }

  /**
   * Check if engine is keeping up with real time
   */
  isKeepingUp(): boolean {
    return this.accumulatedTime < this.fixedTimestep * 2;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    fixedTimestep: number;
    accumulatedTime: number;
    targetFPS: number;
    isKeepingUp: boolean;
    interpolationAlpha: number;
  } {
    return {
      fixedTimestep: this.fixedTimestep,
      accumulatedTime: this.accumulatedTime,
      targetFPS: this.getCurrentFPS(),
      isKeepingUp: this.isKeepingUp(),
      interpolationAlpha: this.getInterpolationAlpha()
    };
  }
}
