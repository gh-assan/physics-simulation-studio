/**
 * Graph Manager - Phase 6
 *
 * Central management system for all graph instances and data visualization.
 * Provides real-time chart updates with Chart.js integration and efficient data handling.
 */

import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartOptions,
  ChartType,
  registerables,
  ChartDataset
} from 'chart.js';

// Only import adapter in browser environment
if (typeof window !== 'undefined') {
  try {
    // Dynamic import for Chart.js date adapter
    require('chartjs-adapter-date-fns');
  } catch (error) {
    console.warn('[GraphManager] Chart.js date adapter not available:', error);
  }
}

// Register Chart.js components
try {
  Chart.register(...registerables);
} catch (error) {
  console.warn('[GraphManager] Failed to register Chart.js components:', error);
}

export interface IGraphConfig {
  id: string;
  title: string;
  type: ChartType;
  container: HTMLCanvasElement | string;
  options?: Partial<ChartOptions>;
  datasets?: Partial<ChartDataset>[];
  maxDataPoints?: number;
  updateFrequency?: number; // Hz
  theme?: 'light' | 'dark' | 'auto';
}

export interface IGraphData {
  labels?: (string | number)[];
  datasets: ChartDataset[];
}

export interface IDataPoint {
  x?: number | string | Date;
  y: number;
  timestamp?: number;
}

export interface IGraphInstance {
  id: string;
  chart: Chart;
  config: IGraphConfig;
  dataBuffer: Map<string, IDataPoint[]>;
  lastUpdate: number;
  isActive: boolean;
}

export interface IGraphManagerConfig {
  defaultMaxDataPoints?: number;
  defaultUpdateFrequency?: number;
  enableAnimations?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  memoryLimit?: number; // MB
}

/**
 * Graph Manager
 *
 * Centralized system for managing all graph instances in the simulation studio.
 * Handles real-time updates, data buffering, and Chart.js integration.
 */
export class GraphManager {
  private readonly config: Required<IGraphManagerConfig>;
  private graphs: Map<string, IGraphInstance> = new Map();
  private updateInterval: number | null = null;
  private isRunning = false;
  private memoryUsage = 0;

  // Performance tracking
  private frameCount = 0;
  private lastPerformanceCheck = 0;
  private averageRenderTime = 0;

  constructor(config: IGraphManagerConfig = {}) {
    this.config = {
      defaultMaxDataPoints: config.defaultMaxDataPoints ?? 1000,
      defaultUpdateFrequency: config.defaultUpdateFrequency ?? 30, // 30 Hz
      enableAnimations: config.enableAnimations ?? true,
      theme: config.theme ?? 'auto',
      memoryLimit: config.memoryLimit ?? 100 // 100 MB
    };

    console.log('[GraphManager] Initialized with config:', this.config);

    // Bind methods for event listeners
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleResize = this.handleResize.bind(this);

    // Set up page visibility and resize listeners
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Register a new graph instance
   */
  registerGraph(config: IGraphConfig): boolean {
    if (this.graphs.has(config.id)) {
      console.warn(`[GraphManager] Graph ${config.id} already exists`);
      return false;
    }

    try {
      // Get or create canvas element
      const canvas = this.getCanvasElement(config.container);
      if (!canvas) {
        throw new Error(`Canvas element not found: ${config.container}`);
      }

      // Create Chart.js configuration
      const chartConfig = this.createChartConfiguration(config);

      // Create Chart.js instance
      const chart = new Chart(canvas, chartConfig);

      // Create graph instance
      const graphInstance: IGraphInstance = {
        id: config.id,
        chart,
        config: {
          ...config,
          maxDataPoints: config.maxDataPoints ?? this.config.defaultMaxDataPoints,
          updateFrequency: config.updateFrequency ?? this.config.defaultUpdateFrequency,
          theme: config.theme ?? this.config.theme
        },
        dataBuffer: new Map(),
        lastUpdate: 0,
        isActive: true
      };

      this.graphs.set(config.id, graphInstance);
      this.updateMemoryUsage();

      console.log(`[GraphManager] Registered graph: ${config.id}`);
      return true;
    } catch (error) {
      console.error(`[GraphManager] Failed to register graph ${config.id}:`, error);
      return false;
    }
  }

  /**
   * Unregister and destroy a graph instance
   */
  unregisterGraph(graphId: string): boolean {
    const graphInstance = this.graphs.get(graphId);
    if (!graphInstance) {
      console.warn(`[GraphManager] Graph ${graphId} not found`);
      return false;
    }

    try {
      // Destroy Chart.js instance
      graphInstance.chart.destroy();

      // Clear data buffers
      graphInstance.dataBuffer.clear();

      // Remove from registry
      this.graphs.delete(graphId);
      this.updateMemoryUsage();

      console.log(`[GraphManager] Unregistered graph: ${graphId}`);
      return true;
    } catch (error) {
      console.error(`[GraphManager] Failed to unregister graph ${graphId}:`, error);
      return false;
    }
  }

  /**
   * Add data point to a graph
   */
  addDataPoint(graphId: string, datasetLabel: string, dataPoint: IDataPoint): boolean {
    const graphInstance = this.graphs.get(graphId);
    if (!graphInstance || !graphInstance.isActive) {
      return false;
    }

    try {
      // Initialize dataset buffer if needed
      if (!graphInstance.dataBuffer.has(datasetLabel)) {
        graphInstance.dataBuffer.set(datasetLabel, []);
      }

      const buffer = graphInstance.dataBuffer.get(datasetLabel)!;

      // Add timestamp if not provided
      const timestampedPoint: IDataPoint = {
        ...dataPoint,
        timestamp: dataPoint.timestamp ?? performance.now()
      };

      // Add to buffer
      buffer.push(timestampedPoint);

      // Maintain buffer size limit
      const maxPoints = graphInstance.config.maxDataPoints!;
      if (buffer.length > maxPoints) {
        buffer.shift();
      }

      return true;
    } catch (error) {
      console.error(`[GraphManager] Failed to add data point to ${graphId}:`, error);
      return false;
    }
  }

  /**
   * Update graph data from buffers
   */
  updateGraph(graphId: string): boolean {
    const graphInstance = this.graphs.get(graphId);
    if (!graphInstance || !graphInstance.isActive) {
      return false;
    }

    try {
      const startTime = performance.now();

      // Update chart data from buffers
      const chartData = graphInstance.chart.data;

      // Clear existing data
      chartData.labels = [];
      chartData.datasets.forEach(dataset => {
        dataset.data = [];
      });

      // Populate data from buffers
      for (const [datasetLabel, buffer] of graphInstance.dataBuffer) {
        // Find corresponding dataset
        let dataset = chartData.datasets.find(ds => ds.label === datasetLabel);

        if (!dataset) {
          // Create new dataset if it doesn't exist
          dataset = {
            label: datasetLabel,
            data: [],
            borderColor: this.generateColor(datasetLabel),
            backgroundColor: this.generateColor(datasetLabel, 0.2)
          };
          chartData.datasets.push(dataset);
        }

        // Add data points
        buffer.forEach((point, index) => {
          if (chartData.labels && chartData.labels.length <= index) {
            chartData.labels.push(point.x ?? point.timestamp ?? index);
          }
          (dataset!.data as number[]).push(point.y);
        });
      }

      // Update chart
      graphInstance.chart.update(this.config.enableAnimations ? 'active' : 'none');
      graphInstance.lastUpdate = performance.now();

      // Track performance
      const renderTime = performance.now() - startTime;
      this.averageRenderTime = (this.averageRenderTime + renderTime) / 2;
      this.frameCount++;

      return true;
    } catch (error) {
      console.error(`[GraphManager] Failed to update graph ${graphId}:`, error);
      return false;
    }
  }

  /**
   * Update all active graphs
   */
  updateAllGraphs(): void {
    const now = performance.now();

    for (const [graphId, graphInstance] of this.graphs) {
      if (!graphInstance.isActive) continue;

      // Check update frequency
      const updateInterval = 1000 / (graphInstance.config.updateFrequency ?? 30);
      if (now - graphInstance.lastUpdate >= updateInterval) {
        this.updateGraph(graphId);
      }
    }
  }

  /**
   * Start automatic graph updates
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[GraphManager] Already running');
      return;
    }

    this.isRunning = true;

    // Use requestAnimationFrame for smooth updates
    const updateLoop = () => {
      if (!this.isRunning) return;

      this.updateAllGraphs();

      // Performance monitoring
      const now = performance.now();
      if (now - this.lastPerformanceCheck >= 1000) {
        this.checkPerformance();
        this.lastPerformanceCheck = now;
      }

      requestAnimationFrame(updateLoop);
    };

    requestAnimationFrame(updateLoop);
    console.log('[GraphManager] Started graph updates');
  }

  /**
   * Stop automatic graph updates
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[GraphManager] Not running');
      return;
    }

    this.isRunning = false;
    console.log('[GraphManager] Stopped graph updates');
  }

  /**
   * Clear all data from a graph
   */
  clearGraph(graphId: string): boolean {
    const graphInstance = this.graphs.get(graphId);
    if (!graphInstance) {
      console.warn(`[GraphManager] Graph ${graphId} not found`);
      return false;
    }

    try {
      // Clear data buffers
      graphInstance.dataBuffer.clear();

      // Clear chart data
      const chartData = graphInstance.chart.data;
      chartData.labels = [];
      chartData.datasets.forEach(dataset => {
        dataset.data = [];
      });

      // Update chart
      graphInstance.chart.update('none');

      console.log(`[GraphManager] Cleared graph: ${graphId}`);
      return true;
    } catch (error) {
      console.error(`[GraphManager] Failed to clear graph ${graphId}:`, error);
      return false;
    }
  }

  /**
   * Clear all graphs
   */
  clearAllGraphs(): void {
    for (const graphId of this.graphs.keys()) {
      this.clearGraph(graphId);
    }
  }

  /**
   * Get graph instance
   */
  getGraph(graphId: string): IGraphInstance | null {
    return this.graphs.get(graphId) || null;
  }

  /**
   * Get all graph instances
   */
  getAllGraphs(): readonly IGraphInstance[] {
    return Array.from(this.graphs.values());
  }

  /**
   * Get graph status
   */
  getStatus(): {
    graphCount: number;
    activeGraphs: number;
    memoryUsage: number;
    averageRenderTime: number;
    frameCount: number;
    isRunning: boolean;
  } {
    return {
      graphCount: this.graphs.size,
      activeGraphs: Array.from(this.graphs.values()).filter(g => g.isActive).length,
      memoryUsage: this.memoryUsage,
      averageRenderTime: this.averageRenderTime,
      frameCount: this.frameCount,
      isRunning: this.isRunning
    };
  }

  /**
   * Export graph as image
   */
  exportGraph(graphId: string, format: 'png' | 'jpeg' = 'png'): string | null {
    const graphInstance = this.graphs.get(graphId);
    if (!graphInstance) {
      console.warn(`[GraphManager] Graph ${graphId} not found`);
      return null;
    }

    try {
      return graphInstance.chart.toBase64Image(`image/${format}`, 1.0);
    } catch (error) {
      console.error(`[GraphManager] Failed to export graph ${graphId}:`, error);
      return null;
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    console.log('[GraphManager] Disposing...');

    this.stop();

    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('resize', this.handleResize);

    // Destroy all graphs
    for (const graphId of Array.from(this.graphs.keys())) {
      this.unregisterGraph(graphId);
    }

    console.log('[GraphManager] Disposed');
  }

  /**
   * Create Chart.js configuration from graph config
   */
  private createChartConfiguration(config: IGraphConfig): ChartConfiguration {
    const baseOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: this.config.enableAnimations ? 200 : 0
      },
      plugins: {
        title: {
          display: !!config.title,
          text: config.title
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        x: {
          type: 'linear',
          display: true
        },
        y: {
          type: 'linear',
          display: true
        }
      }
    };

    // Convert partial datasets to full datasets
    const datasets: ChartDataset[] = (config.datasets || []).map(partial => ({
      label: partial.label || '',
      data: partial.data || [],
      ...partial
    }));

    return {
      type: config.type,
      data: {
        labels: [],
        datasets
      },
      options: {
        ...baseOptions,
        ...config.options
      }
    };
  }

  /**
   * Get canvas element from container
   */
  private getCanvasElement(container: HTMLCanvasElement | string): HTMLCanvasElement | null {
    if (typeof container === 'string') {
      return document.getElementById(container) as HTMLCanvasElement;
    }
    return container;
  }

  /**
   * Generate consistent color for dataset
   */
  private generateColor(label: string, alpha = 1): string {
    // Simple hash-based color generation
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = ((hash << 5) - hash + label.charCodeAt(i)) & 0xffffffff;
    }

    const r = (hash & 0xff0000) >> 16;
    const g = (hash & 0x00ff00) >> 8;
    const b = hash & 0x0000ff;

    return alpha === 1
      ? `rgb(${r}, ${g}, ${b})`
      : `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Update memory usage estimation
   */
  private updateMemoryUsage(): void {
    let totalPoints = 0;
    for (const graphInstance of this.graphs.values()) {
      for (const buffer of graphInstance.dataBuffer.values()) {
        totalPoints += buffer.length;
      }
    }

    // Rough estimation: each data point ~100 bytes
    this.memoryUsage = (totalPoints * 100) / (1024 * 1024); // MB

    // Check memory limit
    if (this.memoryUsage > this.config.memoryLimit) {
      console.warn(`[GraphManager] Memory usage (${this.memoryUsage.toFixed(1)}MB) exceeds limit`);
      this.performGarbageCollection();
    }
  }

  /**
   * Perform garbage collection to free memory
   */
  private performGarbageCollection(): void {
    console.log('[GraphManager] Performing garbage collection...');

    for (const graphInstance of this.graphs.values()) {
      for (const buffer of graphInstance.dataBuffer.values()) {
        // Reduce buffer size if needed
        const targetSize = Math.floor(graphInstance.config.maxDataPoints! * 0.8);
        if (buffer.length > targetSize) {
          buffer.splice(0, buffer.length - targetSize);
        }
      }
    }

    this.updateMemoryUsage();
    console.log(`[GraphManager] Garbage collection complete. Memory: ${this.memoryUsage.toFixed(1)}MB`);
  }

  /**
   * Check performance and adjust settings
   */
  private checkPerformance(): void {
    const fps = this.frameCount;
    this.frameCount = 0;

    if (fps < 20 && this.config.enableAnimations) {
      console.warn('[GraphManager] Low FPS detected, disabling animations');
      this.config.enableAnimations = false;
    } else if (fps > 50 && !this.config.enableAnimations) {
      console.log('[GraphManager] Good FPS, re-enabling animations');
      this.config.enableAnimations = true;
    }
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      console.log('[GraphManager] Page hidden, pausing updates');
      // Reduce update frequency when page is hidden
      for (const graphInstance of this.graphs.values()) {
        graphInstance.isActive = false;
      }
    } else {
      console.log('[GraphManager] Page visible, resuming updates');
      for (const graphInstance of this.graphs.values()) {
        graphInstance.isActive = true;
      }
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Resize all charts
    for (const graphInstance of this.graphs.values()) {
      try {
        graphInstance.chart.resize();
      } catch (error) {
        console.error(`[GraphManager] Failed to resize graph ${graphInstance.id}:`, error);
      }
    }
  }
}
