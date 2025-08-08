/**
 * State Inspector - Phase 5
 *
 * Real-time state inspection system for simulation debugging.
 * Provides detailed examination of simulation state, entities, and components.
 */

import { ISimulationState, EntityId } from './interfaces';

export interface IStateSnapshot {
  timestamp: number;
  entityCount: number;
  time: number;
  deltaTime: number;
  isRunning: boolean;
  metadata: Record<string, any>;
  entities: {
    id: number;
    componentCount: number;
    components: string[];
  }[];
}

export interface IStateInspectorConfig {
  maxSnapshots?: number;
  snapshotInterval?: number; // in milliseconds
  trackEntities?: boolean;
  trackComponents?: boolean;
  trackMetadata?: boolean;
}

/**
 * Simulation State Inspector
 *
 * Provides real-time inspection and historical tracking of simulation state.
 * Useful for debugging state transitions, entity lifecycle, and component changes.
 */
export class StateInspector {
  private readonly config: Required<IStateInspectorConfig>;
  private snapshots: IStateSnapshot[] = [];
  private lastSnapshotTime = 0;
  private currentState: ISimulationState | null = null;
  private isTracking = false;

  // Change detection
  private previousEntityCount = 0;
  private previousTime = 0;
  private stateChangeCount = 0;

  constructor(config: IStateInspectorConfig = {}) {
    this.config = {
      maxSnapshots: config.maxSnapshots ?? 100,
      snapshotInterval: config.snapshotInterval ?? 1000, // 1 second
      trackEntities: config.trackEntities ?? true,
      trackComponents: config.trackComponents ?? true,
      trackMetadata: config.trackMetadata ?? true
    };

    console.log('[StateInspector] Inspector initialized with config:', this.config);
  }

  /**
   * Start tracking state changes
   */
  start(): void {
    this.isTracking = true;
    this.snapshots = [];
    this.lastSnapshotTime = 0;
    this.stateChangeCount = 0;

    console.log('[StateInspector] State tracking started');
  }

  /**
   * Stop tracking state changes
   */
  stop(): void {
    this.isTracking = false;

    console.log('[StateInspector] State tracking stopped');
  }

  /**
   * Update with current simulation state
   */
  update(state: ISimulationState): void {
    if (!this.isTracking) return;

    this.currentState = state;

    // Check if significant changes occurred
    const hasSignificantChanges = this.detectSignificantChanges(state);

    // Take snapshot based on interval or significant changes
    const now = performance.now();
    const shouldSnapshot =
      hasSignificantChanges ||
      (now - this.lastSnapshotTime) >= this.config.snapshotInterval;

    if (shouldSnapshot) {
      this.takeSnapshot(state);
    }

    // Update tracking variables
    this.previousEntityCount = state.entities.size;
    this.previousTime = state.time;

    if (hasSignificantChanges) {
      this.stateChangeCount++;
    }
  }

  /**
   * Get current state summary
   */
  getCurrentStateSummary(): {
    entityCount: number;
    time: number;
    deltaTime: number;
    isRunning: boolean;
    metadataKeys: string[];
    stateChangeCount: number;
  } | null {
    if (!this.currentState) return null;

    return {
      entityCount: this.currentState.entities.size,
      time: this.currentState.time,
      deltaTime: this.currentState.deltaTime,
      isRunning: this.currentState.isRunning,
      metadataKeys: Array.from(this.currentState.metadata.keys()),
      stateChangeCount: this.stateChangeCount
    };
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): readonly IStateSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get recent snapshots
   */
  getRecentSnapshots(count = 10): readonly IStateSnapshot[] {
    return this.snapshots.slice(-count);
  }

  /**
   * Get state at specific time
   */
  getStateAtTime(time: number): IStateSnapshot | null {
    // Find closest snapshot to the requested time
    let closestSnapshot: IStateSnapshot | null = null;
    let closestTimeDiff = Infinity;

    for (const snapshot of this.snapshots) {
      const timeDiff = Math.abs(snapshot.time - time);
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff;
        closestSnapshot = snapshot;
      }
    }

    return closestSnapshot;
  }

  /**
   * Get entity by ID from current state
   */
  getEntityById(entityId: EntityId): EntityId | null {
    if (!this.currentState) return null;

    return this.currentState.hasEntity(entityId) ? entityId : null;
  }

  /**
   * Get entities with specific component
   * Note: This is simplified - in a real ECS system you'd need a ComponentManager
   */
  getEntitiesWithComponent(componentName: string): EntityId[] {
    if (!this.currentState || !this.config.trackComponents) return [];

    // Note: This is a placeholder implementation
    // In a real system, you'd query the ComponentManager
    return this.currentState.getEntityArray();
  }

  /**
   * Get state change timeline
   */
  getChangeTimeline(): {
    timestamp: number;
    description: string;
    type: 'entity_change' | 'time_change' | 'metadata_change';
  }[] {
    const timeline: {
      timestamp: number;
      description: string;
      type: 'entity_change' | 'time_change' | 'metadata_change';
    }[] = [];

    for (let i = 1; i < this.snapshots.length; i++) {
      const current = this.snapshots[i];
      const previous = this.snapshots[i - 1];

      // Check for entity count changes
      if (current.entityCount !== previous.entityCount) {
        timeline.push({
          timestamp: current.timestamp,
          description: `Entity count changed from ${previous.entityCount} to ${current.entityCount}`,
          type: 'entity_change'
        });
      }

      // Check for significant time jumps
      const timeDiff = current.time - previous.time;
      if (timeDiff > current.deltaTime * 2) {
        timeline.push({
          timestamp: current.timestamp,
          description: `Time jump detected: ${timeDiff.toFixed(3)}s`,
          type: 'time_change'
        });
      }

      // Check for metadata changes (simplified)
      const metadataKeys = Object.keys(current.metadata);
      const prevMetadataKeys = Object.keys(previous.metadata);
      if (metadataKeys.length !== prevMetadataKeys.length) {
        timeline.push({
          timestamp: current.timestamp,
          description: `Metadata keys changed from ${prevMetadataKeys.length} to ${metadataKeys.length}`,
          type: 'metadata_change'
        });
      }
    }

    return timeline;
  }

  /**
   * Generate inspection report
   */
  generateReport(): string {
    const summary = this.getCurrentStateSummary();
    const timeline = this.getChangeTimeline();

    if (!summary) {
      return '=== State Inspector Report ===\nNo state data available';
    }

    const report = [
      '=== State Inspector Report ===',
      `Current Time: ${summary.time.toFixed(3)}s`,
      `Delta Time: ${summary.deltaTime.toFixed(3)}s`,
      `Entity Count: ${summary.entityCount}`,
      `Running: ${summary.isRunning}`,
      `State Changes: ${summary.stateChangeCount}`,
      `Metadata Keys: ${summary.metadataKeys.length}`,
      `Snapshots Taken: ${this.snapshots.length}`,
      '',
      '=== Recent Changes ===',
      ...timeline.slice(-5).map(change =>
        `${change.timestamp.toFixed(2)}ms: ${change.description} [${change.type}]`
      ),
      '',
      '=== Metadata ===',
      ...summary.metadataKeys.map(key => `- ${key}`)
    ].join('\n');

    return report;
  }

  /**
   * Clear all inspection data
   */
  clear(): void {
    this.snapshots = [];
    this.lastSnapshotTime = 0;
    this.currentState = null;
    this.stateChangeCount = 0;
    this.previousEntityCount = 0;
    this.previousTime = 0;

    console.log('[StateInspector] Inspection data cleared');
  }

  /**
   * Take a snapshot of the current state
   */
  private takeSnapshot(state: ISimulationState): void {
    const snapshot: IStateSnapshot = {
      timestamp: performance.now(),
      entityCount: state.entities.size,
      time: state.time,
      deltaTime: state.deltaTime,
      isRunning: state.isRunning,
      metadata: this.config.trackMetadata ? this.convertMapToObject(state.metadata) : {},
      entities: this.config.trackEntities ? this.extractEntityInfo(state) : []
    };

    this.snapshots.push(snapshot);

    // Limit snapshot history
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift();
    }

    this.lastSnapshotTime = snapshot.timestamp;
  }

  /**
   * Detect significant changes in state
   */
  private detectSignificantChanges(state: ISimulationState): boolean {
    // Entity count changed
    if (state.entities.size !== this.previousEntityCount) {
      return true;
    }

    // Time jumped significantly (more than 10x delta time)
    const timeDiff = state.time - this.previousTime;
    if (timeDiff > state.deltaTime * 10) {
      return true;
    }

    return false;
  }

  /**
   * Extract entity information for snapshot
   */
  private extractEntityInfo(state: ISimulationState): {
    id: number;
    componentCount: number;
    components: string[];
  }[] {
    const entities: {
      id: number;
      componentCount: number;
      components: string[];
    }[] = [];

    for (const entityId of state.entities) {
      const entityInfo = {
        id: entityId,
        componentCount: 0, // Placeholder - would need ComponentManager
        components: [] as string[] // Placeholder - would need ComponentManager
      };

      entities.push(entityInfo);
    }

    return entities;
  }

  /**
   * Convert ReadonlyMap to plain object for serialization
   */
  private convertMapToObject(map: ReadonlyMap<string, any>): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [key, value] of map) {
      // Handle nested objects/maps
      if (value instanceof Map) {
        obj[key] = this.convertMapToObject(value as ReadonlyMap<string, any>);
      } else if (typeof value === 'object' && value !== null) {
        obj[key] = JSON.parse(JSON.stringify(value));
      } else {
        obj[key] = value;
      }
    }
    return obj;
  }
}
