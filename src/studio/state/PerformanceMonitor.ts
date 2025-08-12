/**
 * Performance Monitor - Tracks application performance and dispatches state updates
 * This makes your application more sophisticated by providing real-time performance insights
 */

import { getGlobalStore } from './GlobalStore';
import { Actions } from './Actions';

export class PerformanceMonitor {
  private lastFrameTime: number = performance.now();
  private frameCount = 0;
  private isMonitoring = false;
  private monitoringInterval: number | null = null;
  private systemTimings = new Map<string, number>();

  constructor(private updateInterval: number = 1000) {}

  /**
   * Start monitoring performance
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();

    // Update performance metrics every second
    this.monitoringInterval = window.setInterval(() => {
      this.updateMetrics();
    }, this.updateInterval);
  }

  /**
   * Stop monitoring performance
   */
  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Record frame render time (call this in your render loop)
   */
  recordFrame(): void {
    if (!this.isMonitoring) return;

    this.frameCount++;
    this.lastFrameTime = performance.now();
  }

  /**
   * Record system update time
   */
  recordSystemTime(systemName: string, startTime: number, endTime?: number): void {
    if (!this.isMonitoring) return;

    const duration = (endTime || performance.now()) - startTime;
    this.systemTimings.set(systemName, duration);

    // Dispatch system performance update
    const store = getGlobalStore();
    store.dispatch(Actions.systemPerformanceUpdated(systemName, duration));
  }

  /**
   * Get current memory usage estimate
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }

  /**
   * Update performance metrics and dispatch to global state
   */
  private updateMetrics(): void {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    const frameRate = this.frameCount > 0 ? Math.round(1000 / (deltaTime / this.frameCount)) : 60;

    const store = getGlobalStore();
    const state = store.getState();

    // Calculate render and update times (simplified estimates)
    const avgSystemTime = Array.from(this.systemTimings.values()).reduce((sum, time) => sum + time, 0) / this.systemTimings.size || 0;

    store.dispatch(Actions.performanceMetricsUpdated(
      Math.min(frameRate, 60), // Cap at 60 FPS for realistic values
      avgSystemTime * 0.3, // Estimated render time
      avgSystemTime * 0.7, // Estimated update time
      this.getMemoryUsage(),
      state.entities.totalCount
    ));

    // Reset counters
    this.frameCount = 0;
    this.systemTimings.clear();
  }

  /**
   * Create a timer for measuring system performance
   */
  createTimer(systemName: string) {
    const startTime = performance.now();

    return {
      end: () => {
        this.recordSystemTime(systemName, startTime);
      }
    };
  }

  /**
   * Record frame time (alias for recordFrame for API compatibility)
   */
  recordFrameTime(frameTimeMs: number): void {
    this.recordFrame();
  }

  /**
   * Get average FPS from current state
   */
  getAverageFPS(): number {
    const store = getGlobalStore();
    const state = store.getState();
    return state.performance.metrics.averageFrameRate;
  }
}

/**
 * Global performance monitor instance
 */
let globalPerformanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor();
  }
  return globalPerformanceMonitor;
}

/**
 * Utility decorator for automatically measuring system performance
 */
export function monitorPerformance(systemName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const monitor = getPerformanceMonitor();
      const timer = monitor.createTimer(systemName);

      try {
        const result = originalMethod.apply(this, args);

        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.finally(() => timer.end());
        }

        timer.end();
        return result;
      } catch (error) {
        timer.end();
        throw error;
      }
    };

    return descriptor;
  };
}
