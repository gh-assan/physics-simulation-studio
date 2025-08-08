/**
 * Chart Components - Phase 6
 *
 * Reusable Chart.js wrapper components with theme support and common configurations.
 * Provides pre-configured chart types optimized for physics simulation visualization.
 */

import {
  Chart,
  ChartConfiguration,
  ChartOptions,
  ChartData,
  ChartType,
  TooltipItem,
  ScriptableContext
} from 'chart.js';
import { GraphManager, IGraphConfig, IDataPoint } from './GraphManager';

export interface IChartTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  chart: {
    gridColor: string;
    borderColor: string;
    backgroundColor: string;
    fontFamily: string;
    fontSize: number;
  };
}

export interface IChartComponentOptions {
  title?: string;
  theme?: IChartTheme;
  showLegend?: boolean;
  showTooltips?: boolean;
  showGrid?: boolean;
  animations?: boolean;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}

/**
 * Base Chart Component
 *
 * Abstract base class for all chart components providing common functionality.
 */
export abstract class BaseChartComponent {
  protected graphManager: GraphManager;
  protected graphId: string;
  protected container: HTMLCanvasElement;
  protected config: IGraphConfig;
  protected theme: IChartTheme;

  constructor(
    graphManager: GraphManager,
    graphId: string,
    container: HTMLCanvasElement,
    options: IChartComponentOptions = {}
  ) {
    this.graphManager = graphManager;
    this.graphId = graphId;
    this.container = container;
    this.theme = options.theme || this.getDefaultTheme();

    this.config = {
      id: graphId,
      title: options.title || '',
      type: this.getChartType(),
      container,
      options: this.createChartOptions(options)
    };
  }

  /**
   * Get the chart type for this component
   */
  protected abstract getChartType(): ChartType;

  /**
   * Initialize the chart component
   */
  initialize(): boolean {
    return this.graphManager.registerGraph(this.config);
  }

  /**
   * Add data point to the chart
   */
  addDataPoint(datasetLabel: string, dataPoint: IDataPoint): boolean {
    return this.graphManager.addDataPoint(this.graphId, datasetLabel, dataPoint);
  }

  /**
   * Clear all data from the chart
   */
  clear(): boolean {
    return this.graphManager.clearGraph(this.graphId);
  }

  /**
   * Update chart theme
   */
  updateTheme(theme: IChartTheme): void {
    this.theme = theme;
    const graphInstance = this.graphManager.getGraph(this.graphId);
    if (graphInstance) {
      // Update chart options with new theme
      const newOptions = this.createChartOptions({ theme });
      Object.assign(graphInstance.chart.options, newOptions);
      graphInstance.chart.update();
    }
  }

  /**
   * Export chart as image
   */
  export(format: 'png' | 'jpeg' = 'png'): string | null {
    return this.graphManager.exportGraph(this.graphId, format);
  }

  /**
   * Dispose the chart component
   */
  dispose(): void {
    this.graphManager.unregisterGraph(this.graphId);
  }

  /**
   * Create chart options with theme support
   */
  protected createChartOptions(options: IChartComponentOptions): ChartOptions {
    const theme = options.theme || this.theme;

    return {
      responsive: options.responsive !== false,
      maintainAspectRatio: options.maintainAspectRatio !== false,
      animation: {
        duration: options.animations !== false ? 200 : 0
      },
      plugins: {
        title: {
          display: !!options.title,
          text: options.title || '',
          color: theme.colors.text,
          font: {
            family: theme.chart.fontFamily,
            size: theme.chart.fontSize + 2
          }
        },
        legend: {
          display: options.showLegend !== false,
          position: 'top',
          labels: {
            color: theme.colors.text,
            font: {
              family: theme.chart.fontFamily,
              size: theme.chart.fontSize
            }
          }
        },
        tooltip: {
          enabled: options.showTooltips !== false,
          backgroundColor: theme.colors.surface,
          titleColor: theme.colors.text,
          bodyColor: theme.colors.textSecondary,
          borderColor: theme.chart.borderColor,
          borderWidth: 1
        }
      },
      scales: this.createScalesOptions(options),
      backgroundColor: theme.chart.backgroundColor
    };
  }

  /**
   * Create scales options (can be overridden by subclasses)
   */
  protected createScalesOptions(options: IChartComponentOptions): any {
    const theme = options.theme || this.theme;

    return {
      x: {
        type: 'linear',
        display: true,
        grid: {
          display: options.showGrid !== false,
          color: theme.chart.gridColor
        },
        ticks: {
          color: theme.colors.textSecondary,
          font: {
            family: theme.chart.fontFamily,
            size: theme.chart.fontSize
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        grid: {
          display: options.showGrid !== false,
          color: theme.chart.gridColor
        },
        ticks: {
          color: theme.colors.textSecondary,
          font: {
            family: theme.chart.fontFamily,
            size: theme.chart.fontSize
          }
        }
      }
    };
  }

  /**
   * Get default theme
   */
  protected getDefaultTheme(): IChartTheme {
    return ChartThemes.light;
  }
}

/**
 * Time Series Chart Component
 *
 * Specialized component for real-time time series data visualization.
 */
export class TimeSeriesChart extends BaseChartComponent {
  private maxDataPoints: number;
  private timeWindow: number; // milliseconds

  constructor(
    graphManager: GraphManager,
    graphId: string,
    container: HTMLCanvasElement,
    options: IChartComponentOptions & {
      maxDataPoints?: number;
      timeWindow?: number;
    } = {}
  ) {
    super(graphManager, graphId, container, options);
    this.maxDataPoints = options.maxDataPoints || 1000;
    this.timeWindow = options.timeWindow || 60000; // 1 minute default
  }

  protected getChartType(): ChartType {
    return 'line';
  }

  protected createScalesOptions(options: IChartComponentOptions): any {
    const theme = options.theme || this.theme;

    return {
      x: {
        type: 'time',
        display: true,
        time: {
          displayFormats: {
            second: 'HH:mm:ss',
            minute: 'HH:mm',
            hour: 'HH:mm'
          }
        },
        grid: {
          display: options.showGrid !== false,
          color: theme.chart.gridColor
        },
        ticks: {
          color: theme.colors.textSecondary,
          font: {
            family: theme.chart.fontFamily,
            size: theme.chart.fontSize
          },
          maxTicksLimit: 10
        }
      },
      y: {
        type: 'linear',
        display: true,
        grid: {
          display: options.showGrid !== false,
          color: theme.chart.gridColor
        },
        ticks: {
          color: theme.colors.textSecondary,
          font: {
            family: theme.chart.fontFamily,
            size: theme.chart.fontSize
          }
        }
      }
    };
  }

  /**
   * Add time-based data point
   */
  addTimePoint(datasetLabel: string, value: number, timestamp?: number): boolean {
    const dataPoint: IDataPoint = {
      x: timestamp || Date.now(),
      y: value,
      timestamp: timestamp || Date.now()
    };
    return this.addDataPoint(datasetLabel, dataPoint);
  }
}

/**
 * Performance Monitor Chart
 *
 * Specialized component for performance monitoring with multiple metrics.
 */
export class PerformanceChart extends BaseChartComponent {
  private metrics: Map<string, { values: number[]; timestamps: number[] }> = new Map();

  protected getChartType(): ChartType {
    return 'line';
  }

  /**
   * Add performance metric
   */
  addMetric(name: string, value: number, timestamp?: number): boolean {
    const ts = timestamp || Date.now();

    if (!this.metrics.has(name)) {
      this.metrics.set(name, { values: [], timestamps: [] });
    }

    const metric = this.metrics.get(name)!;
    metric.values.push(value);
    metric.timestamps.push(ts);

    // Maintain buffer size
    const maxPoints = 500;
    if (metric.values.length > maxPoints) {
      metric.values.shift();
      metric.timestamps.shift();
    }

    return this.addTimePoint(name, value, ts);
  }

  /**
   * Get current metric value
   */
  getCurrentValue(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric || metric.values.length === 0) {
      return null;
    }
    return metric.values[metric.values.length - 1];
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string): {
    current: number;
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const metric = this.metrics.get(name);
    if (!metric || metric.values.length === 0) {
      return null;
    }

    const values = metric.values;
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      current: values[values.length - 1],
      average: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  private addTimePoint(datasetLabel: string, value: number, timestamp: number): boolean {
    const dataPoint: IDataPoint = {
      x: timestamp,
      y: value,
      timestamp
    };
    return this.addDataPoint(datasetLabel, dataPoint);
  }
}

/**
 * Physics Chart Component
 *
 * Specialized component for physics simulation visualization.
 */
export class PhysicsChart extends BaseChartComponent {
  private energyTracking = {
    kinetic: 0,
    potential: 0,
    total: 0
  };

  protected getChartType(): ChartType {
    return 'line';
  }

  /**
   * Add physics data
   */
  addPhysicsData(data: {
    kinetic?: number;
    potential?: number;
    velocity?: number;
    acceleration?: number;
    momentum?: number;
  }): void {
    const timestamp = Date.now();

    if (data.kinetic !== undefined) {
      this.energyTracking.kinetic = data.kinetic;
      this.addTimePoint('Kinetic Energy', data.kinetic, timestamp);
    }

    if (data.potential !== undefined) {
      this.energyTracking.potential = data.potential;
      this.addTimePoint('Potential Energy', data.potential, timestamp);
    }

    // Calculate total energy
    this.energyTracking.total = this.energyTracking.kinetic + this.energyTracking.potential;
    this.addTimePoint('Total Energy', this.energyTracking.total, timestamp);

    if (data.velocity !== undefined) {
      this.addTimePoint('Velocity', data.velocity, timestamp);
    }

    if (data.acceleration !== undefined) {
      this.addTimePoint('Acceleration', data.acceleration, timestamp);
    }

    if (data.momentum !== undefined) {
      this.addTimePoint('Momentum', data.momentum, timestamp);
    }
  }

  /**
   * Get energy conservation ratio
   */
  getEnergyConservationRatio(): number {
    // This would compare current total energy with initial total energy
    // For now, return 1.0 (perfect conservation)
    return 1.0;
  }

  private addTimePoint(datasetLabel: string, value: number, timestamp: number): boolean {
    const dataPoint: IDataPoint = {
      x: timestamp,
      y: value,
      timestamp
    };
    return this.addDataPoint(datasetLabel, dataPoint);
  }
}

/**
 * Distribution Chart Component
 *
 * Bar chart for distribution and histogram visualization.
 */
export class DistributionChart extends BaseChartComponent {
  protected getChartType(): ChartType {
    return 'bar';
  }

  /**
   * Set distribution data
   */
  setDistribution(labels: string[], values: number[]): boolean {
    if (labels.length !== values.length) {
      console.error('[DistributionChart] Labels and values must have same length');
      return false;
    }

    // Clear existing data
    this.clear();

    // Add data points
    for (let i = 0; i < labels.length; i++) {
      const dataPoint: IDataPoint = {
        x: i,
        y: values[i]
      };
      this.addDataPoint('Distribution', dataPoint);
    }

    return true;
  }

  /**
   * Add histogram data
   */
  addHistogramData(data: number[], bins = 20): boolean {
    // Calculate histogram
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / bins;

    const histogram = new Array(bins).fill(0);
    const labels: string[] = [];

    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binSize;
      const binEnd = binStart + binSize;
      labels.push(`${binStart.toFixed(2)}-${binEnd.toFixed(2)}`);
    }

    // Count data points in each bin
    for (const value of data) {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      histogram[binIndex]++;
    }

    return this.setDistribution(labels, histogram);
  }
}

/**
 * Predefined Chart Themes
 */
export const ChartThemes = {
  light: {
    name: 'Light',
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#212529',
      textSecondary: '#6c757d'
    },
    chart: {
      gridColor: '#e9ecef',
      borderColor: '#dee2e6',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 12
    }
  } as IChartTheme,

  dark: {
    name: 'Dark',
    colors: {
      primary: '#0d6efd',
      secondary: '#6c757d',
      success: '#198754',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#0dcaf0',
      background: '#212529',
      surface: '#343a40',
      text: '#ffffff',
      textSecondary: '#adb5bd'
    },
    chart: {
      gridColor: '#495057',
      borderColor: '#6c757d',
      backgroundColor: '#212529',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 12
    }
  } as IChartTheme,

  physics: {
    name: 'Physics',
    colors: {
      primary: '#4a90e2',
      secondary: '#7ed321',
      success: '#50e3c2',
      warning: '#f5a623',
      error: '#d0021b',
      info: '#9013fe',
      background: '#0f1419',
      surface: '#1e2328',
      text: '#ffffff',
      textSecondary: '#8a9ba8'
    },
    chart: {
      gridColor: '#2d3748',
      borderColor: '#4a5568',
      backgroundColor: '#1a202c',
      fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
      fontSize: 11
    }
  } as IChartTheme
};

/**
 * Chart Component Factory
 *
 * Factory for creating chart components with consistent configuration.
 */
export class ChartComponentFactory {
  private graphManager: GraphManager;
  private defaultTheme: IChartTheme;

  constructor(graphManager: GraphManager, defaultTheme: IChartTheme = ChartThemes.light) {
    this.graphManager = graphManager;
    this.defaultTheme = defaultTheme;
  }

  /**
   * Create time series chart
   */
  createTimeSeriesChart(
    graphId: string,
    container: HTMLCanvasElement,
    options: IChartComponentOptions & { maxDataPoints?: number; timeWindow?: number } = {}
  ): TimeSeriesChart {
    return new TimeSeriesChart(this.graphManager, graphId, container, {
      theme: this.defaultTheme,
      ...options
    });
  }

  /**
   * Create performance chart
   */
  createPerformanceChart(
    graphId: string,
    container: HTMLCanvasElement,
    options: IChartComponentOptions = {}
  ): PerformanceChart {
    return new PerformanceChart(this.graphManager, graphId, container, {
      theme: this.defaultTheme,
      ...options
    });
  }

  /**
   * Create physics chart
   */
  createPhysicsChart(
    graphId: string,
    container: HTMLCanvasElement,
    options: IChartComponentOptions = {}
  ): PhysicsChart {
    return new PhysicsChart(this.graphManager, graphId, container, {
      theme: this.defaultTheme,
      ...options
    });
  }

  /**
   * Create distribution chart
   */
  createDistributionChart(
    graphId: string,
    container: HTMLCanvasElement,
    options: IChartComponentOptions = {}
  ): DistributionChart {
    return new DistributionChart(this.graphManager, graphId, container, {
      theme: this.defaultTheme,
      ...options
    });
  }

  /**
   * Update default theme
   */
  setDefaultTheme(theme: IChartTheme): void {
    this.defaultTheme = theme;
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): readonly IChartTheme[] {
    return Object.values(ChartThemes);
  }
}
