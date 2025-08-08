/**
 * Visualization Utils - Phase 6
 *
 * Utility functions and helpers for visualization components.
 */

import { IDataPoint } from './GraphManager';

/**
 * Data Processing Utilities
 */
export class DataProcessor {
  /**
   * Calculate moving average
   */
  static movingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(average);
    }

    return result;
  }

  /**
   * Smooth data using exponential smoothing
   */
  static exponentialSmooth(data: number[], alpha = 0.3): number[] {
    if (data.length === 0) return [];

    const result: number[] = [data[0]];

    for (let i = 1; i < data.length; i++) {
      const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
      result.push(smoothed);
    }

    return result;
  }

  /**
   * Calculate derivative (rate of change)
   */
  static derivative(data: IDataPoint[]): IDataPoint[] {
    if (data.length < 2) return [];

    const result: IDataPoint[] = [];

    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];

      const dt = (curr.timestamp || i) - (prev.timestamp || i - 1);
      const dy = curr.y - prev.y;
      const derivative = dt > 0 ? dy / dt : 0;

      result.push({
        x: curr.x,
        y: derivative,
        timestamp: curr.timestamp
      });
    }

    return result;
  }

  /**
   * Downsample data to reduce points while preserving shape
   */
  static downsample(data: IDataPoint[], targetPoints: number): IDataPoint[] {
    if (data.length <= targetPoints) return [...data];

    const step = data.length / targetPoints;
    const result: IDataPoint[] = [];

    for (let i = 0; i < targetPoints; i++) {
      const index = Math.floor(i * step);
      result.push(data[index]);
    }

    return result;
  }

  /**
   * Find outliers using IQR method
   */
  static findOutliers(data: number[]): { outliers: number[]; indices: number[] } {
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);

    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers: number[] = [];
    const indices: number[] = [];

    data.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        indices.push(index);
      }
    });

    return { outliers, indices };
  }
}

/**
 * Color Utilities
 */
export class ColorUtils {
  /**
   * Generate color palette
   */
  static generatePalette(count: number, saturation = 70, lightness = 50): string[] {
    const colors: string[] = [];
    const step = 360 / count;

    for (let i = 0; i < count; i++) {
      const hue = i * step;
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }

    return colors;
  }

  /**
   * Convert hex to rgba
   */
  static hexToRgba(hex: string, alpha = 1): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Generate gradient colors
   */
  static generateGradient(startColor: string, endColor: string, steps: number): string[] {
    // Simple gradient generation - can be enhanced
    const colors: string[] = [];

    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      // For simplicity, interpolate in HSL space
      colors.push(this.interpolateColor(startColor, endColor, ratio));
    }

    return colors;
  }

  /**
   * Interpolate between two colors
   */
  private static interpolateColor(color1: string, color2: string, ratio: number): string {
    // Simple interpolation - can be improved
    return ratio < 0.5 ? color1 : color2;
  }
}

/**
 * Animation Utilities
 */
export class AnimationUtils {
  /**
   * Easing functions
   */
  static easingFunctions = {
    linear: (t: number): number => t,
    easeInQuad: (t: number): number => t * t,
    easeOutQuad: (t: number): number => t * (2 - t),
    easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number): number => t * t * t,
    easeOutCubic: (t: number): number => (--t) * t * t + 1,
    easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  };

  /**
   * Animate value over time
   */
  static animateValue(
    from: number,
    to: number,
    duration: number,
    easing: keyof typeof AnimationUtils.easingFunctions = 'easeInOutQuad',
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ): () => void {
    const startTime = performance.now();
    const easingFn = this.easingFunctions[easing];
    let animationId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = from + (to - from) * easedProgress;

      onUpdate(currentValue);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };

    animationId = requestAnimationFrame(animate);

    // Return cancel function
    return () => cancelAnimationFrame(animationId);
  }
}

/**
 * Performance Utilities
 */
export class PerformanceUtils {
  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
      const now = performance.now();

      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay) as unknown as number;
    };
  }

  /**
   * Measure function execution time
   */
  static measurePerformance<T extends (...args: any[]) => any>(
    func: T,
    label?: string
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      const start = performance.now();
      const result = func(...args);
      const end = performance.now();

      if (label) {
        console.log(`[Performance] ${label}: ${end - start}ms`);
      }

      return result;
    };
  }

  /**
   * Create frame rate monitor
   */
  static createFrameRateMonitor(callback: (fps: number) => void): () => void {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const monitor = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        callback(fps);

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(monitor);
    };

    animationId = requestAnimationFrame(monitor);

    // Return stop function
    return () => cancelAnimationFrame(animationId);
  }
}

/**
 * Data Validation Utilities
 */
export class ValidationUtils {
  /**
   * Validate data point
   */
  static isValidDataPoint(point: any): point is IDataPoint {
    return (
      typeof point === 'object' &&
      point !== null &&
      typeof point.y === 'number' &&
      !isNaN(point.y) &&
      isFinite(point.y)
    );
  }

  /**
   * Validate numeric array
   */
  static isValidNumericArray(arr: any): arr is number[] {
    return (
      Array.isArray(arr) &&
      arr.length > 0 &&
      arr.every(val => typeof val === 'number' && !isNaN(val) && isFinite(val))
    );
  }

  /**
   * Sanitize data point
   */
  static sanitizeDataPoint(point: any): IDataPoint | null {
    if (!point || typeof point !== 'object') return null;

    const y = Number(point.y);
    if (isNaN(y) || !isFinite(y)) return null;

    return {
      x: point.x,
      y,
      timestamp: point.timestamp
    };
  }

  /**
   * Clean numeric array
   */
  static cleanNumericArray(arr: any[]): number[] {
    return arr
      .map(val => Number(val))
      .filter(val => !isNaN(val) && isFinite(val));
  }
}

/**
 * Formatting Utilities
 */
export class FormatUtils {
  /**
   * Format number with appropriate precision
   */
  static formatNumber(value: number, precision = 2): string {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(precision) + 'M';
    } else if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(precision) + 'K';
    } else if (Math.abs(value) < 0.01) {
      return value.toExponential(precision);
    } else {
      return value.toFixed(precision);
    }
  }

  /**
   * Format time duration
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format byte size
   */
  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
