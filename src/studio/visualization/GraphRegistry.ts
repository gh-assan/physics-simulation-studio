/**
 * Graph Registry - Phase 6
 *
 * Central registry for plugin graph configurations and metric collection.
 * Manages graph templates and provides an interface for plugins to register visualizations.
 */

import { IGraphConfig, GraphManager, IDataPoint } from './GraphManager';
import { ChartType, ChartDataset } from 'chart.js';

export interface IGraphTemplate {
  id: string;
  name: string;
  description: string;
  type: ChartType;
  defaultConfig: Partial<IGraphConfig>;
  datasetTemplates: IDatasetTemplate[];
  category: string;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface IDatasetTemplate {
  label: string;
  description?: string;
  defaultOptions: Partial<ChartDataset>;
  dataType: 'number' | 'time-series' | 'vector' | 'custom';
  units?: string;
}

export interface IMetricDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  units?: string;
  dataType: 'scalar' | 'vector' | 'matrix' | 'time-series';
  collectionFrequency?: number; // Hz
  aggregation?: 'none' | 'average' | 'sum' | 'min' | 'max' | 'last';
}

export interface IGraphRegistration {
  pluginId: string;
  graphId: string;
  templateId: string;
  containerId: string;
  config?: Partial<IGraphConfig>;
  metrics: string[]; // Metric IDs to display
  autoStart?: boolean;
}

export interface IMetricCollector {
  id: string;
  pluginId: string;
  collect(): Promise<Record<string, any>>;
  getMetricDefinitions(): IMetricDefinition[];
  isActive(): boolean;
  start(): void;
  stop(): void;
}

/**
 * Graph Registry
 *
 * Centralized registry for graph templates, metric definitions, and plugin integrations.
 * Provides standardized graph configurations and metric collection interfaces.
 */
export class GraphRegistry {
  private graphManager: GraphManager;
  private templates: Map<string, IGraphTemplate> = new Map();
  private registrations: Map<string, IGraphRegistration> = new Map();
  private metricDefinitions: Map<string, IMetricDefinition> = new Map();
  private metricCollectors: Map<string, IMetricCollector> = new Map();
  private activeCollections: Map<string, number> = new Map();

  constructor(graphManager: GraphManager) {
    this.graphManager = graphManager;
    console.log('[GraphRegistry] Initialized');

    // Register default graph templates
    this.registerDefaultTemplates();
  }

  /**
   * Register a graph template
   */
  registerTemplate(template: IGraphTemplate): boolean {
    if (this.templates.has(template.id)) {
      console.warn(`[GraphRegistry] Template ${template.id} already exists`);
      return false;
    }

    try {
      // Validate template
      this.validateTemplate(template);

      this.templates.set(template.id, template);
      console.log(`[GraphRegistry] Registered template: ${template.id}`);
      return true;
    } catch (error) {
      console.error(`[GraphRegistry] Failed to register template ${template.id}:`, error);
      return false;
    }
  }

  /**
   * Get graph template
   */
  getTemplate(templateId: string): IGraphTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): readonly IGraphTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): readonly IGraphTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  /**
   * Search templates by tags
   */
  searchTemplates(tags: string[]): readonly IGraphTemplate[] {
    return Array.from(this.templates.values())
      .filter(template =>
        tags.some(tag => template.tags.includes(tag))
      );
  }

  /**
   * Register a metric definition
   */
  registerMetric(metric: IMetricDefinition): boolean {
    if (this.metricDefinitions.has(metric.id)) {
      console.warn(`[GraphRegistry] Metric ${metric.id} already exists`);
      return false;
    }

    try {
      // Validate metric
      this.validateMetric(metric);

      this.metricDefinitions.set(metric.id, metric);
      console.log(`[GraphRegistry] Registered metric: ${metric.id}`);
      return true;
    } catch (error) {
      console.error(`[GraphRegistry] Failed to register metric ${metric.id}:`, error);
      return false;
    }
  }

  /**
   * Get metric definition
   */
  getMetric(metricId: string): IMetricDefinition | null {
    return this.metricDefinitions.get(metricId) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): readonly IMetricDefinition[] {
    return Array.from(this.metricDefinitions.values());
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: string): readonly IMetricDefinition[] {
    return Array.from(this.metricDefinitions.values())
      .filter(metric => metric.category === category);
  }

  /**
   * Register a metric collector
   */
  registerCollector(collector: IMetricCollector): boolean {
    if (this.metricCollectors.has(collector.id)) {
      console.warn(`[GraphRegistry] Collector ${collector.id} already exists`);
      return false;
    }

    try {
      // Register collector's metrics
      const metrics = collector.getMetricDefinitions();
      for (const metric of metrics) {
        if (!this.registerMetric(metric)) {
          console.warn(`[GraphRegistry] Failed to register metric ${metric.id} from collector ${collector.id}`);
        }
      }

      this.metricCollectors.set(collector.id, collector);
      console.log(`[GraphRegistry] Registered collector: ${collector.id} with ${metrics.length} metrics`);
      return true;
    } catch (error) {
      console.error(`[GraphRegistry] Failed to register collector ${collector.id}:`, error);
      return false;
    }
  }

  /**
   * Unregister a metric collector
   */
  unregisterCollector(collectorId: string): boolean {
    const collector = this.metricCollectors.get(collectorId);
    if (!collector) {
      console.warn(`[GraphRegistry] Collector ${collectorId} not found`);
      return false;
    }

    try {
      // Stop collection
      this.stopDataCollection(collectorId);

      // Remove collector
      this.metricCollectors.delete(collectorId);

      console.log(`[GraphRegistry] Unregistered collector: ${collectorId}`);
      return true;
    } catch (error) {
      console.error(`[GraphRegistry] Failed to unregister collector ${collectorId}:`, error);
      return false;
    }
  }

  /**
   * Register a graph from plugin
   */
  registerGraph(registration: IGraphRegistration): boolean {
    const fullGraphId = `${registration.pluginId}_${registration.graphId}`;

    if (this.registrations.has(fullGraphId)) {
      console.warn(`[GraphRegistry] Graph ${fullGraphId} already registered`);
      return false;
    }

    try {
      // Get template
      const template = this.getTemplate(registration.templateId);
      if (!template) {
        throw new Error(`Template ${registration.templateId} not found`);
      }

      // Create graph configuration
      const graphConfig: IGraphConfig = {
        id: fullGraphId,
        title: template.name,
        type: template.type,
        container: registration.containerId,
        ...template.defaultConfig,
        ...registration.config
      };

      // Register with GraphManager
      if (!this.graphManager.registerGraph(graphConfig)) {
        throw new Error('Failed to register with GraphManager');
      }

      // Store registration
      this.registrations.set(fullGraphId, registration);

      // Start data collection if auto-start enabled
      if (registration.autoStart !== false) {
        this.startDataCollection(fullGraphId);
      }

      console.log(`[GraphRegistry] Registered graph: ${fullGraphId}`);
      return true;
    } catch (error) {
      console.error(`[GraphRegistry] Failed to register graph ${fullGraphId}:`, error);
      return false;
    }
  }

  /**
   * Unregister a graph
   */
  unregisterGraph(pluginId: string, graphId: string): boolean {
    const fullGraphId = `${pluginId}_${graphId}`;
    const registration = this.registrations.get(fullGraphId);

    if (!registration) {
      console.warn(`[GraphRegistry] Graph ${fullGraphId} not found`);
      return false;
    }

    try {
      // Stop data collection
      this.stopDataCollection(fullGraphId);

      // Unregister from GraphManager
      this.graphManager.unregisterGraph(fullGraphId);

      // Remove registration
      this.registrations.delete(fullGraphId);

      console.log(`[GraphRegistry] Unregistered graph: ${fullGraphId}`);
      return true;
    } catch (error) {
      console.error(`[GraphRegistry] Failed to unregister graph ${fullGraphId}:`, error);
      return false;
    }
  }

  /**
   * Start data collection for a graph
   */
  startDataCollection(graphId: string): boolean {
    const registration = this.registrations.get(graphId);
    if (!registration) {
      console.warn(`[GraphRegistry] Graph ${graphId} not found`);
      return false;
    }

    try {
      // Stop existing collection
      this.stopDataCollection(graphId);

      // Start collection interval
      const interval = setInterval(async () => {
        await this.collectMetrics(graphId);
      }, 100); // 10 Hz default

      this.activeCollections.set(graphId, interval as unknown as number);
      console.log(`[GraphRegistry] Started data collection for: ${graphId}`);
      return true;
    } catch (error) {
      console.error(`[GraphRegistry] Failed to start data collection for ${graphId}:`, error);
      return false;
    }
  }

  /**
   * Stop data collection for a graph
   */
  stopDataCollection(graphId: string): boolean {
    const interval = this.activeCollections.get(graphId);
    if (!interval) {
      return false;
    }

    clearInterval(interval);
    this.activeCollections.delete(graphId);
    console.log(`[GraphRegistry] Stopped data collection for: ${graphId}`);
    return true;
  }

  /**
   * Collect metrics for a graph
   */
  private async collectMetrics(graphId: string): Promise<void> {
    const registration = this.registrations.get(graphId);
    if (!registration) return;

    try {
      // Collect from relevant collectors
      const pluginCollectors = Array.from(this.metricCollectors.values())
        .filter(collector =>
          collector.pluginId === registration.pluginId &&
          collector.isActive()
        );

      for (const collector of pluginCollectors) {
        const data = await collector.collect();

        // Add data points to graph
        for (const metricId of registration.metrics) {
          if (data[metricId] !== undefined) {
            const dataPoint: IDataPoint = {
              y: data[metricId],
              timestamp: Date.now()
            };

            this.graphManager.addDataPoint(graphId, metricId, dataPoint);
          }
        }
      }
    } catch (error) {
      console.error(`[GraphRegistry] Failed to collect metrics for ${graphId}:`, error);
    }
  }

  /**
   * Start collection for all collectors
   */
  startAllCollections(): void {
    for (const collector of this.metricCollectors.values()) {
      try {
        collector.start();
      } catch (error) {
        console.error(`[GraphRegistry] Failed to start collector ${collector.id}:`, error);
      }
    }

    for (const graphId of this.registrations.keys()) {
      this.startDataCollection(graphId);
    }

    console.log('[GraphRegistry] Started all collections');
  }

  /**
   * Stop collection for all collectors
   */
  stopAllCollections(): void {
    for (const collector of this.metricCollectors.values()) {
      try {
        collector.stop();
      } catch (error) {
        console.error(`[GraphRegistry] Failed to stop collector ${collector.id}:`, error);
      }
    }

    for (const graphId of this.registrations.keys()) {
      this.stopDataCollection(graphId);
    }

    console.log('[GraphRegistry] Stopped all collections');
  }

  /**
   * Get registration status
   */
  getStatus(): {
    templateCount: number;
    metricCount: number;
    collectorCount: number;
    registrationCount: number;
    activeCollections: number;
  } {
    return {
      templateCount: this.templates.size,
      metricCount: this.metricDefinitions.size,
      collectorCount: this.metricCollectors.size,
      registrationCount: this.registrations.size,
      activeCollections: this.activeCollections.size
    };
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    console.log('[GraphRegistry] Disposing...');

    // Stop all collections
    this.stopAllCollections();

    // Clear all data
    this.templates.clear();
    this.metricDefinitions.clear();
    this.metricCollectors.clear();
    this.registrations.clear();
    this.activeCollections.clear();

    console.log('[GraphRegistry] Disposed');
  }

  /**
   * Register default graph templates
   */
  private registerDefaultTemplates(): void {
    const defaultTemplates: IGraphTemplate[] = [
      {
        id: 'time-series',
        name: 'Time Series',
        description: 'Real-time line chart for time-based data',
        type: 'line',
        category: 'general',
        tags: ['time', 'realtime', 'line'],
        defaultConfig: {
          maxDataPoints: 1000,
          updateFrequency: 30
        },
        datasetTemplates: [
          {
            label: 'Value',
            defaultOptions: {
              borderWidth: 2,
              fill: false,
              tension: 0.1
            },
            dataType: 'time-series'
          }
        ]
      },
      {
        id: 'performance-monitor',
        name: 'Performance Monitor',
        description: 'Multi-series performance monitoring',
        type: 'line',
        category: 'performance',
        tags: ['performance', 'monitoring', 'fps', 'memory'],
        defaultConfig: {
          maxDataPoints: 500,
          updateFrequency: 10
        },
        datasetTemplates: [
          {
            label: 'FPS',
            defaultOptions: {
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)'
            },
            dataType: 'number',
            units: 'fps'
          },
          {
            label: 'Memory Usage',
            defaultOptions: {
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)'
            },
            dataType: 'number',
            units: 'MB'
          }
        ]
      },
      {
        id: 'physics-monitor',
        name: 'Physics Monitor',
        description: 'Physics simulation metrics',
        type: 'line',
        category: 'physics',
        tags: ['physics', 'energy', 'velocity', 'acceleration'],
        defaultConfig: {
          maxDataPoints: 1000,
          updateFrequency: 60
        },
        datasetTemplates: [
          {
            label: 'Kinetic Energy',
            defaultOptions: {
              borderColor: 'rgb(255, 205, 86)',
              backgroundColor: 'rgba(255, 205, 86, 0.2)'
            },
            dataType: 'number',
            units: 'J'
          },
          {
            label: 'Potential Energy',
            defaultOptions: {
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)'
            },
            dataType: 'number',
            units: 'J'
          }
        ]
      },
      {
        id: 'distribution-chart',
        name: 'Distribution Chart',
        description: 'Bar chart for distribution analysis',
        type: 'bar',
        category: 'analysis',
        tags: ['distribution', 'histogram', 'statistics'],
        defaultConfig: {
          maxDataPoints: 100,
          updateFrequency: 5
        },
        datasetTemplates: [
          {
            label: 'Count',
            defaultOptions: {
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderColor: 'rgb(153, 102, 255)',
              borderWidth: 1
            },
            dataType: 'number'
          }
        ]
      }
    ];

    for (const template of defaultTemplates) {
      this.registerTemplate(template);
    }
  }

  /**
   * Validate template structure
   */
  private validateTemplate(template: IGraphTemplate): void {
    if (!template.id || !template.name || !template.type) {
      throw new Error('Template must have id, name, and type');
    }

    if (!template.datasetTemplates || template.datasetTemplates.length === 0) {
      throw new Error('Template must have at least one dataset template');
    }

    for (const dataset of template.datasetTemplates) {
      if (!dataset.label) {
        throw new Error('Dataset template must have a label');
      }
    }
  }

  /**
   * Validate metric definition
   */
  private validateMetric(metric: IMetricDefinition): void {
    if (!metric.id || !metric.name || !metric.category) {
      throw new Error('Metric must have id, name, and category');
    }

    if (!['scalar', 'vector', 'matrix', 'time-series'].includes(metric.dataType)) {
      throw new Error('Invalid metric data type');
    }
  }
}
