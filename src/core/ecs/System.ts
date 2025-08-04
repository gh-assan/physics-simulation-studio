import { ISystem } from "./ISystem";
import { IWorld } from "./IWorld";

/**
 * Base class for all systems in the ECS architecture.
 * Systems contain the logic that operates on entities and their components.
 */
export abstract class System implements ISystem {
  public priority: number;

  constructor(priority = 100) {
    this.priority = priority;
  }

  /**
   * Called once per frame to update the system.
   * This is where the system's logic should be implemented.
   *
   * @param world The world containing entities and components
   * @param deltaTime The time elapsed since the last update in seconds
   */
  public abstract update(world: IWorld, deltaTime: number): void;

  /**
   * Optional: Called when an entity is removed from the world.
   * Systems can override to perform cleanup logic.
   * @param entityId The ID of the removed entity
   * @param world The world instance
   */
  public onEntityRemoved?(entityId: number, world: IWorld): void;

  /**
   * Optional: Called when a component is removed from an entity.
   * Systems can override to perform cleanup logic.
   * @param entityId The ID of the entity
   * @param componentType The type of the removed component
   * @param world The world instance
   */
  public onComponentRemoved?(entityId: number, componentType: string, world: IWorld): void;

  /**
   * Called when the system is registered with a world.
   * Override this method to perform initialization logic.
   *
   * @param world The world the system is being registered with
   */
  public onRegister(world: IWorld): void {
    // Default implementation does nothing
    // Subclasses can override this method to perform initialization
  }

  /**
   * Called when the system is removed from a world.
   * Override this method to perform cleanup logic.
   *
   * @param world The world the system is being removed from
   */
  public onRemove(world: IWorld): void {
    // Default implementation does nothing
    // Subclasses can override this method to perform cleanup
  }
}
