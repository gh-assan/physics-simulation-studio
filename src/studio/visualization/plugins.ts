/**
 * Visualization Plugins - Phase 6
 *
 * Integration utilities for connecting visualization system with simulation plugins.
 */

import { IMetricCollector, IMetricDefinition } from './GraphRegistry';

/**
 * Base Metric Collector
 *
 * Abstract base class for plugin-specific metric collectors.
 */
export abstract class BaseMetricCollector implements IMetricCollector {
  readonly id: string;
  readonly pluginId: string;
  protected isCollecting = false;
  protected collectionInterval: number | null = null;

  constructor(id: string, pluginId: string) {
    this.id = id;
    this.pluginId = pluginId;
  }

  abstract collect(): Promise<Record<string, any>>;
  abstract getMetricDefinitions(): IMetricDefinition[];

  isActive(): boolean {
    return this.isCollecting;
  }

  start(): void {
    this.isCollecting = true;
  }

  stop(): void {
    this.isCollecting = false;
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }
}

/**
 * Physics Metrics Collector
 *
 * Collects physics-related metrics from simulation entities.
 */
export class PhysicsMetricsCollector extends BaseMetricCollector {
  private entities: Set<any> = new Set();
  private lastUpdateTime = 0;

  constructor(pluginId: string) {
    super(`${pluginId}_physics`, pluginId);
  }

  /**
   * Add entity to monitor
   */
  addEntity(entity: any): void {
    this.entities.add(entity);
  }

  /**
   * Remove entity from monitoring
   */
  removeEntity(entity: any): void {
    this.entities.delete(entity);
  }

  async collect(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};
    const currentTime = performance.now();
    const dt = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = currentTime;

    let totalKinetic = 0;
    let totalPotential = 0;
    let totalMomentum = 0;
    let avgVelocity = 0;
    let maxAcceleration = 0;

    for (const entity of this.entities) {
      if (entity && typeof entity === 'object') {
        // Extract physics data from entity
        const mass = this.getEntityProperty(entity, 'mass') || 1;
        const velocity = this.getEntityProperty(entity, 'velocity') || { x: 0, y: 0 };
        const position = this.getEntityProperty(entity, 'position') || { x: 0, y: 0 };
        const acceleration = this.getEntityProperty(entity, 'acceleration') || { x: 0, y: 0 };

        // Calculate kinetic energy: KE = 0.5 * m * v²
        const velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        const kineticEnergy = 0.5 * mass * velocityMagnitude ** 2;
        totalKinetic += kineticEnergy;

        // Calculate potential energy (assuming gravitational field)
        // PE = mgh (assuming y is height and g = 9.81)
        const potentialEnergy = mass * 9.81 * Math.abs(position.y);
        totalPotential += potentialEnergy;

        // Calculate momentum: p = mv
        const momentum = mass * velocityMagnitude;
        totalMomentum += momentum;

        // Average velocity
        avgVelocity += velocityMagnitude;

        // Max acceleration
        const accelerationMagnitude = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2);
        maxAcceleration = Math.max(maxAcceleration, accelerationMagnitude);
      }
    }

    const entityCount = this.entities.size;
    if (entityCount > 0) {
      avgVelocity /= entityCount;
    }

    metrics.kineticEnergy = totalKinetic;
    metrics.potentialEnergy = totalPotential;
    metrics.totalEnergy = totalKinetic + totalPotential;
    metrics.momentum = totalMomentum;
    metrics.averageVelocity = avgVelocity;
    metrics.maxAcceleration = maxAcceleration;
    metrics.entityCount = entityCount;

    return metrics;
  }

  getMetricDefinitions(): IMetricDefinition[] {
    return [
      {
        id: 'kineticEnergy',
        name: 'Kinetic Energy',
        description: 'Total kinetic energy of all entities',
        category: 'physics',
        units: 'J',
        dataType: 'scalar',
        collectionFrequency: 60
      },
      {
        id: 'potentialEnergy',
        name: 'Potential Energy',
        description: 'Total potential energy of all entities',
        category: 'physics',
        units: 'J',
        dataType: 'scalar',
        collectionFrequency: 60
      },
      {
        id: 'totalEnergy',
        name: 'Total Energy',
        description: 'Sum of kinetic and potential energy',
        category: 'physics',
        units: 'J',
        dataType: 'scalar',
        collectionFrequency: 60
      },
      {
        id: 'momentum',
        name: 'Total Momentum',
        description: 'Total momentum of all entities',
        category: 'physics',
        units: 'kg⋅m/s',
        dataType: 'scalar',
        collectionFrequency: 60
      },
      {
        id: 'averageVelocity',
        name: 'Average Velocity',
        description: 'Average velocity magnitude of all entities',
        category: 'physics',
        units: 'm/s',
        dataType: 'scalar',
        collectionFrequency: 60
      },
      {
        id: 'maxAcceleration',
        name: 'Max Acceleration',
        description: 'Maximum acceleration magnitude among all entities',
        category: 'physics',
        units: 'm/s²',
        dataType: 'scalar',
        collectionFrequency: 60
      }
    ];
  }

  private getEntityProperty(entity: any, property: string): any {
    // Try different property access patterns
    const paths = [
      property,
      `components.${property}`,
      `state.${property}`,
      `data.${property}`
    ];

    for (const path of paths) {
      const value = this.getNestedProperty(entity, path);
      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : undefined;
    }, obj);
  }
}

/**
 * Performance Metrics Collector
 *
 * Collects performance-related metrics from the simulation.
 */
export class PerformanceMetricsCollector extends BaseMetricCollector {
  private frameCount = 0;
  private lastFpsCheck = 0;
  private currentFps = 0;
  private memoryUsage = 0;
  private renderTime = 0;
  private updateTime = 0;

  constructor(pluginId: string) {
    super(`${pluginId}_performance`, pluginId);
  }

  /**
   * Update frame statistics
   */
  updateFrameStats(renderTime: number, updateTime: number): void {
    this.frameCount++;
    this.renderTime = renderTime;
    this.updateTime = updateTime;

    const now = performance.now();
    if (now - this.lastFpsCheck >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCheck));
      this.frameCount = 0;
      this.lastFpsCheck = now;
    }
  }

  /**
   * Update memory usage
   */
  updateMemoryUsage(usage: number): void {
    this.memoryUsage = usage;
  }

  async collect(): Promise<Record<string, any>> {
    // Get memory usage if available
    let memoryInfo = this.memoryUsage;
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      memoryInfo = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }

    return {
      fps: this.currentFps,
      memoryUsage: memoryInfo,
      renderTime: this.renderTime,
      updateTime: this.updateTime,
      totalTime: this.renderTime + this.updateTime
    };
  }

  getMetricDefinitions(): IMetricDefinition[] {
    return [
      {
        id: 'fps',
        name: 'Frames Per Second',
        description: 'Current rendering frame rate',
        category: 'performance',
        units: 'fps',
        dataType: 'scalar',
        collectionFrequency: 10
      },
      {
        id: 'memoryUsage',
        name: 'Memory Usage',
        description: 'JavaScript heap memory usage',
        category: 'performance',
        units: 'MB',
        dataType: 'scalar',
        collectionFrequency: 5
      },
      {
        id: 'renderTime',
        name: 'Render Time',
        description: 'Time spent on rendering per frame',
        category: 'performance',
        units: 'ms',
        dataType: 'scalar',
        collectionFrequency: 30
      },
      {
        id: 'updateTime',
        name: 'Update Time',
        description: 'Time spent on updates per frame',
        category: 'performance',
        units: 'ms',
        dataType: 'scalar',
        collectionFrequency: 30
      },
      {
        id: 'totalTime',
        name: 'Total Frame Time',
        description: 'Total time per frame (render + update)',
        category: 'performance',
        units: 'ms',
        dataType: 'scalar',
        collectionFrequency: 30
      }
    ];
  }
}

/**
 * System Metrics Collector
 *
 * Collects system-level metrics from the simulation framework.
 */
export class SystemMetricsCollector extends BaseMetricCollector {
  private entityCount = 0;
  private componentCount = 0;
  private systemCount = 0;
  private eventCount = 0;
  private lastEventCount = 0;
  private lastEventCheck = 0;
  private eventsPerSecond = 0;

  constructor(pluginId: string) {
    super(`${pluginId}_system`, pluginId);
  }

  /**
   * Update entity statistics
   */
  updateEntityStats(entityCount: number, componentCount: number, systemCount: number): void {
    this.entityCount = entityCount;
    this.componentCount = componentCount;
    this.systemCount = systemCount;
  }

  /**
   * Update event statistics
   */
  updateEventStats(eventCount: number): void {
    this.eventCount = eventCount;

    const now = performance.now();
    if (now - this.lastEventCheck >= 1000) {
      const newEvents = this.eventCount - this.lastEventCount;
      this.eventsPerSecond = Math.round((newEvents * 1000) / (now - this.lastEventCheck));
      this.lastEventCount = this.eventCount;
      this.lastEventCheck = now;
    }
  }

  async collect(): Promise<Record<string, any>> {
    return {
      entityCount: this.entityCount,
      componentCount: this.componentCount,
      systemCount: this.systemCount,
      eventCount: this.eventCount,
      eventsPerSecond: this.eventsPerSecond
    };
  }

  getMetricDefinitions(): IMetricDefinition[] {
    return [
      {
        id: 'entityCount',
        name: 'Entity Count',
        description: 'Number of active entities',
        category: 'system',
        dataType: 'scalar',
        collectionFrequency: 10
      },
      {
        id: 'componentCount',
        name: 'Component Count',
        description: 'Total number of components',
        category: 'system',
        dataType: 'scalar',
        collectionFrequency: 10
      },
      {
        id: 'systemCount',
        name: 'System Count',
        description: 'Number of active systems',
        category: 'system',
        dataType: 'scalar',
        collectionFrequency: 1
      },
      {
        id: 'eventCount',
        name: 'Total Events',
        description: 'Total number of events processed',
        category: 'system',
        dataType: 'scalar',
        collectionFrequency: 5
      },
      {
        id: 'eventsPerSecond',
        name: 'Events/Second',
        description: 'Event processing rate',
        category: 'system',
        units: 'events/s',
        dataType: 'scalar',
        collectionFrequency: 5
      }
    ];
  }
}

/**
 * Plugin Integration Factory
 *
 * Factory for creating plugin-specific metric collectors and visualization components.
 */
export class PluginIntegrationFactory {
  /**
   * Create physics metrics collector
   */
  static createPhysicsCollector(pluginId: string): PhysicsMetricsCollector {
    return new PhysicsMetricsCollector(pluginId);
  }

  /**
   * Create performance metrics collector
   */
  static createPerformanceCollector(pluginId: string): PerformanceMetricsCollector {
    return new PerformanceMetricsCollector(pluginId);
  }

  /**
   * Create system metrics collector
   */
  static createSystemCollector(pluginId: string): SystemMetricsCollector {
    return new SystemMetricsCollector(pluginId);
  }

  /**
   * Create all collectors for a plugin
   */
  static createAllCollectors(pluginId: string): {
    physics: PhysicsMetricsCollector;
    performance: PerformanceMetricsCollector;
    system: SystemMetricsCollector;
  } {
    return {
      physics: this.createPhysicsCollector(pluginId),
      performance: this.createPerformanceCollector(pluginId),
      system: this.createSystemCollector(pluginId)
    };
  }
}

// Export utility types and interfaces
export type PluginCollectors = ReturnType<typeof PluginIntegrationFactory.createAllCollectors>;
