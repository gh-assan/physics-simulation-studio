import { IWorld } from "./IWorld";
import { IEntityManager } from "./IEntityManager";

/**
 * Manages entity creation, destruction, and tracking in the ECS system.
 */
export class EntityManager implements IEntityManager {
  /**
   * The next entity ID to assign.
   */
  private nextEntityID = 0;

  /**
   * A pool of entity IDs that have been destroyed and can be reused.
   */
  private availableEntityIDs: number[] = [];

  /**
   * The set of all active entity IDs.
   */
  private activeEntities: Set<number> = new Set();

  /**
   * Creates a new entity.
   *
   * @param id Optional specific ID to assign to the entity
   * @returns The ID of the created entity
   */
  public createEntity(id?: number): number {
    let entityId: number;

    if (id !== undefined) {
      entityId = this.handleSpecificIdCreation(id);
    } else {
      entityId = this.getNextAvailableId();
    }

    this.activeEntities.add(entityId);
    return entityId;
  }

  /**
   * Destroys an entity, making its ID available for reuse.
   *
   * @param entityID The ID of the entity to destroy
   */
  public destroyEntity(entityID: number, world: IWorld): void {
    this.availableEntityIDs.push(entityID);
    this.activeEntities.delete(entityID);
    // Call onEntityRemoved on all systems if world is provided
    if (world && world.systemManager && world.systemManager.getAllSystems) {
      for (const system of world.systemManager.getAllSystems()) {
        if (typeof system.onEntityRemoved === 'function') {
          system.onEntityRemoved(entityID, world);
        }
      }
    }
  }

  /**
   * Gets all active entities.
   *
   * @returns A set of all active entity IDs
   */
  public getAllEntities(): Set<number> {
    return this.activeEntities;
  }

  /**
   * Checks if an entity exists.
   *
   * @param entityID The ID of the entity to check
   * @returns True if the entity exists, false otherwise
   */
  public hasEntity(entityID: number): boolean {
    return this.activeEntities.has(entityID);
  }

  /**
   * Gets an entity by its ID.
   *
   * @param entityID The ID of the entity to retrieve
   * @returns The entity ID if it exists, otherwise undefined
   */
  public getEntityById(entityID: number): number | undefined {
    if (this.activeEntities.has(entityID)) {
      return entityID;
    }
    return undefined;
  }

  /**
   * Clears all entities from the manager.
   */
  public clear(): void {
    this.nextEntityID = 0;
    this.availableEntityIDs = [];
    this.activeEntities.clear();
  }

  /**
   * Handles the creation of an entity with a specific ID.
   *
   * @param id The specific ID to assign to the entity
   * @returns The ID of the created entity
   * @private
   */
  private handleSpecificIdCreation(id: number): number {
    if (this.activeEntities.has(id)) {
      console.warn(`Entity with ID ${id} already exists. Creating a new one.`);
      return this.getNextAvailableId();
    }

    if (id >= this.nextEntityID) {
      this.nextEntityID = id + 1;
    }

    return id;
  }

  /**
   * Gets the next available entity ID, either from the pool of reusable IDs
   * or by incrementing the next ID counter.
   *
   * @returns The next available entity ID
   * @private
   */
  private getNextAvailableId(): number {
    if (this.availableEntityIDs.length > 0) {
      return this.availableEntityIDs.pop()!;
    }

    return this.nextEntityID++;
  }
}

