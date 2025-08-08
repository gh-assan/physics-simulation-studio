import { ISimulationState, EntityId } from './interfaces';

/**
 * Immutable simulation state implementation
 * 
 * This class represents the complete state of a simulation at a point in time.
 * It enforces immutability to ensure predictable state management.
 */
export class SimulationState implements ISimulationState {
  constructor(
    public readonly entities: ReadonlySet<EntityId>,
    public readonly time: number,
    public readonly deltaTime: number,
    public readonly isRunning: boolean,
    public readonly metadata: ReadonlyMap<string, any> = new Map()
  ) {}

  /**
   * Create a new state with updated entities
   */
  withEntities(entities: Set<EntityId>): SimulationState {
    return new SimulationState(
      entities,
      this.time,
      this.deltaTime,
      this.isRunning,
      this.metadata
    );
  }

  /**
   * Create a new state with updated time
   */
  withTime(time: number, deltaTime: number): SimulationState {
    return new SimulationState(
      this.entities,
      time,
      deltaTime,
      this.isRunning,
      this.metadata
    );
  }

  /**
   * Create a new state with updated running status
   */
  withRunning(isRunning: boolean): SimulationState {
    return new SimulationState(
      this.entities,
      this.time,
      this.deltaTime,
      isRunning,
      this.metadata
    );
  }

  /**
   * Create a new state with updated metadata
   */
  withMetadata(metadata: Map<string, any>): SimulationState {
    return new SimulationState(
      this.entities,
      this.time,
      this.deltaTime,
      this.isRunning,
      metadata
    );
  }

  /**
   * Create a new state with added metadata
   */
  withAddedMetadata(key: string, value: any): SimulationState {
    const newMetadata = new Map(this.metadata);
    newMetadata.set(key, value);
    return this.withMetadata(newMetadata);
  }

  /**
   * Create initial empty state
   */
  static createInitial(): SimulationState {
    return new SimulationState(
      new Set(),
      0,
      0,
      false,
      new Map()
    );
  }

  /**
   * Create state from minimal data
   */
  static create(
    entities: EntityId[],
    time = 0,
    deltaTime = 0,
    isRunning = false,
    metadata: Record<string, any> = {}
  ): SimulationState {
    return new SimulationState(
      new Set(entities),
      time,
      deltaTime,
      isRunning,
      new Map(Object.entries(metadata))
    );
  }

  /**
   * Check if state has any entities
   */
  isEmpty(): boolean {
    return this.entities.size === 0;
  }

  /**
   * Check if state contains specific entity
   */
  hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  /**
   * Get entities as array for convenience
   */
  getEntityArray(): EntityId[] {
    return Array.from(this.entities);
  }

  /**
   * Get metadata value
   */
  getMetadata<T = any>(key: string): T | undefined {
    return this.metadata.get(key) as T | undefined;
  }

  /**
   * Check if metadata exists
   */
  hasMetadata(key: string): boolean {
    return this.metadata.has(key);
  }

  /**
   * Get all metadata as plain object
   */
  getMetadataObject(): Record<string, any> {
    return Object.fromEntries(this.metadata);
  }

  /**
   * Debug string representation
   */
  toString(): string {
    return `SimulationState{entities: [${Array.from(this.entities).join(', ')}], time: ${this.time.toFixed(3)}, running: ${this.isRunning}}`;
  }
}
