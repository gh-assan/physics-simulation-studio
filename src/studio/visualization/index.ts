/**
 * Visualization Module - Phase 6
 *
 * Main entry point for the visualization system.
 * Exports all visualization components and utilities.
 */

// Core Graph Management
export { GraphManager } from './GraphManager';
export type {
  IGraphConfig,
  IGraphData,
  IDataPoint,
  IGraphInstance,
  IGraphManagerConfig
} from './GraphManager';

// Graph Registry
export { GraphRegistry } from './GraphRegistry';
export type {
  IGraphTemplate,
  IDatasetTemplate,
  IMetricDefinition,
  IGraphRegistration,
  IMetricCollector
} from './GraphRegistry';

// Chart Components
export {
  BaseChartComponent,
  TimeSeriesChart,
  PerformanceChart,
  PhysicsChart,
  DistributionChart,
  ChartComponentFactory,
  ChartThemes
} from './ChartComponents';
export type {
  IChartTheme,
  IChartComponentOptions
} from './ChartComponents';

// Utilities and helpers
export {
  DataProcessor,
  ColorUtils,
  AnimationUtils,
  PerformanceUtils,
  ValidationUtils,
  FormatUtils
} from './utils';

export {
  BaseMetricCollector,
  PhysicsMetricsCollector,
  PerformanceMetricsCollector,
  SystemMetricsCollector,
  PluginIntegrationFactory
} from './plugins';
export type { PluginCollectors } from './plugins';
