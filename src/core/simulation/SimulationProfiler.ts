/**
 * Simulation Profiler - Phase 5
 *
 * Performance monitoring and profiling system for simulation frameworks.
 * Tracks frame timing, CPU usage, memory usage, and provides performance insights.
 */

export interface IPerformanceMetrics {
  averageFPS: number;
  currentFPS: number;
  frameTime: number; // in milliseconds
  averageFrameTime: number;
  cpuUsage: number; // estimated percentage
  memoryUsage: number; // in MB
  totalFrames: number;
  droppedFrames: number;
}

export interface IProfileEvent {
  name: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Simulation Performance Profiler
 *
 * Monitors and tracks simulation performance metrics in real-time.
 * Provides insights into frame timing, CPU usage, and performance bottlenecks.
 */
export class SimulationProfiler {
  private isRunning = false;
  private startTime = 0;
  private lastFrameTime = 0;
  private frameCount = 0;
  private droppedFrameCount = 0;

  // Performance tracking arrays (circular buffers)
  private readonly maxSamples = 120; // 2 seconds at 60fps
  private frameTimes: number[] = [];
  private cpuSamples: number[] = [];

  // Event tracking
  private events: IProfileEvent[] = [];
  private readonly maxEvents = 1000;

  constructor() {
    console.log('[SimulationProfiler] Profiler initialized');
  }

  /**
   * Start profiling
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[SimulationProfiler] Profiler already running');
      return;
    }

    this.isRunning = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;
    this.droppedFrameCount = 0;
    this.frameTimes = [];
    this.cpuSamples = [];
    this.events = [];

    console.log('[SimulationProfiler] Profiling started');
  }

  /**
   * Stop profiling
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[SimulationProfiler] Profiler not running');
      return;
    }

    this.isRunning = false;
    console.log('[SimulationProfiler] Profiling stopped');
  }

  /**
   * Record a frame's performance data
   */
  recordFrame(frameTime: number, deltaTime: number): void {
    if (!this.isRunning) return;

    const now = performance.now();
    this.frameCount++;

    // Record frame time
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }

    // Estimate CPU usage based on frame processing time vs available time
    const targetFrameTime = 1000 / 60; // 16.67ms for 60fps
    const cpuUsage = Math.min((frameTime / targetFrameTime) * 100, 100);
    this.cpuSamples.push(cpuUsage);
    if (this.cpuSamples.length > this.maxSamples) {
      this.cpuSamples.shift();
    }

    // Track dropped frames (when frame time exceeds target significantly)
    if (frameTime > targetFrameTime * 1.5) {
      this.droppedFrameCount++;
    }

    this.lastFrameTime = now;
  }

  /**
   * Mark a profiling event
   */
  markEvent(name: string, metadata?: Record<string, any>): void {
    if (!this.isRunning) return;

    const event: IProfileEvent = {
      name,
      timestamp: performance.now() - this.startTime,
      metadata
    };

    this.events.push(event);

    // Keep events list manageable
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    if (metadata) {
      console.log(`[SimulationProfiler] Event: ${name}`, metadata);
    } else {
      console.log(`[SimulationProfiler] Event: ${name}`);
    }
  }

  /**
   * Start timing a specific operation
   */
  startTiming(name: string): () => void {
    if (!this.isRunning) return () => {};

    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      const event: IProfileEvent = {
        name,
        timestamp: startTime - this.startTime,
        duration
      };

      this.events.push(event);
      if (this.events.length > this.maxEvents) {
        this.events.shift();
      }
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): IPerformanceMetrics {
    if (!this.isRunning) {
      return {
        averageFPS: 0,
        currentFPS: 0,
        frameTime: 0,
        averageFrameTime: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        totalFrames: 0,
        droppedFrames: 0
      };
    }

    // Calculate average frame time
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length
      : 0;

    // Calculate current FPS based on recent frame times
    const currentFPS = this.frameTimes.length > 0
      ? 1000 / (this.frameTimes.slice(-10).reduce((sum, time) => sum + time, 0) / Math.min(10, this.frameTimes.length))
      : 0;

    // Calculate average FPS over entire session
    const totalTime = (performance.now() - this.startTime) / 1000; // seconds
    const averageFPS = totalTime > 0 ? this.frameCount / totalTime : 0;

    // Calculate average CPU usage
    const avgCpuUsage = this.cpuSamples.length > 0
      ? this.cpuSamples.reduce((sum, usage) => sum + usage, 0) / this.cpuSamples.length
      : 0;

    // Estimate memory usage (simplified)
    const memoryUsage = this.estimateMemoryUsage();

    return {
      averageFPS: Math.round(averageFPS * 10) / 10,
      currentFPS: Math.round(currentFPS * 10) / 10,
      frameTime: this.frameTimes.length > 0 ? this.frameTimes[this.frameTimes.length - 1] : 0,
      averageFrameTime: Math.round(avgFrameTime * 100) / 100,
      cpuUsage: Math.round(avgCpuUsage * 10) / 10,
      memoryUsage: Math.round(memoryUsage * 100) / 100,
      totalFrames: this.frameCount,
      droppedFrames: this.droppedFrameCount
    };
  }

  /**
   * Get profiling events
   */
  getEvents(): readonly IProfileEvent[] {
    return [...this.events];
  }

  /**
   * Get recent performance data for graphing
   */
  getRecentData(samples = 60): {
    frameTimes: readonly number[];
    cpuUsage: readonly number[];
    timestamps: readonly number[];
  } {
    const recentFrameTimes = this.frameTimes.slice(-samples);
    const recentCpuUsage = this.cpuSamples.slice(-samples);

    // Generate timestamps for the samples
    const now = performance.now() - this.startTime;
    const timestamps = recentFrameTimes.map((_, index) =>
      now - (recentFrameTimes.length - index - 1) * (1000 / 60)
    );

    return {
      frameTimes: recentFrameTimes,
      cpuUsage: recentCpuUsage,
      timestamps
    };
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    const totalTime = (performance.now() - this.startTime) / 1000;

    const report = [
      '=== Simulation Performance Report ===',
      `Session Duration: ${totalTime.toFixed(2)}s`,
      `Total Frames: ${metrics.totalFrames}`,
      `Dropped Frames: ${metrics.droppedFrames} (${((metrics.droppedFrames / metrics.totalFrames) * 100).toFixed(1)}%)`,
      `Average FPS: ${metrics.averageFPS}`,
      `Current FPS: ${metrics.currentFPS}`,
      `Average Frame Time: ${metrics.averageFrameTime}ms`,
      `CPU Usage: ${metrics.cpuUsage}%`,
      `Memory Usage: ${metrics.memoryUsage}MB`,
      '',
      '=== Recent Events ===',
      ...this.events.slice(-10).map(event =>
        `${event.timestamp.toFixed(2)}ms: ${event.name}${event.duration ? ` (${event.duration.toFixed(2)}ms)` : ''}`
      )
    ].join('\n');

    return report;
  }

  /**
   * Clear all profiling data
   */
  clear(): void {
    this.frameCount = 0;
    this.droppedFrameCount = 0;
    this.frameTimes = [];
    this.cpuSamples = [];
    this.events = [];
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;

    console.log('[SimulationProfiler] Profiling data cleared');
  }

  /**
   * Estimate memory usage (simplified implementation)
   */
  private estimateMemoryUsage(): number {
    // This is a simplified estimation
    // In a real implementation, you might use performance.memory API if available
    const dataSize = (
      this.frameTimes.length * 8 + // frame times (8 bytes per number)
      this.cpuSamples.length * 8 + // CPU samples
      this.events.length * 100 // rough estimate for events
    ) / (1024 * 1024); // Convert to MB

    return dataSize;
  }
}
