import { ISystem } from "./ISystem";
import { IWorld } from "./IWorld";
import { IEventEmitter } from "../events/IEventEmitter";
import { EventEmitter } from "../events/EventEmitter";
import { ISystemManager } from "./ISystemManager";

/**
 * Manages all systems in the ECS architecture.
 * Responsible for registering, updating, and retrieving systems.
 */
export class SystemManager implements ISystemManager {
  /**
   * The collection of registered systems.
   */
  private systems: ISystem[] = [];

  /**
   * Event emitter for system-related events.
   */
  private eventEmitter: IEventEmitter = new EventEmitter();

  /**
   * Registers a system with the manager.
   * Calls the system's onRegister method and emits a 'systemRegistered' event.
   *
   * @param system The system to register
   * @param world The world the system is being registered with
   */
  public registerSystem(system: ISystem, world?: IWorld): void {
    console.log(`[SystemManager] Registering system: ${system.constructor.name} with priority ${system.priority}`);
    this.systems.push(system);
    console.log(`[SystemManager] Total systems after registration: ${this.systems.length}`);

    // Call the system's onRegister method if a world is provided
    if (world && system.onRegister) {
      console.log(`[SystemManager] Calling onRegister for ${system.constructor.name}`);
      system.onRegister(world);
    }

    this.emitSystemRegistered(system);
    console.log(`[SystemManager] System registration complete for ${system.constructor.name}`);
  }

  /**
   * Registers a callback to be called when a system is registered.
   *
   * @param callback The callback function
   */
  public onSystemRegistered(callback: (system: ISystem) => void): void {
    this.eventEmitter.on("systemRegistered", callback);
  }

  /**
   * Updates all registered systems.
   *
   * @param world The world to update
   * @param deltaTime The time elapsed since the last update
   */
  public updateAll(world: IWorld, deltaTime: number): void {
    this.systems.sort((a, b) => a.priority - b.priority);
    this.systems.forEach((system) => {
      system.update(world, deltaTime);
    });
  }

  /**
   * Gets a system by its type.
   *
   * @param systemType The constructor of the system type
   * @returns The system instance, or undefined if not found
   */
  public getSystem<T extends ISystem>(
    systemType: new (...args: any[]) => T
  ): T | undefined {
    return this.systems.find((system) => system instanceof (systemType as any)) as T;
  }

  /**
   * Removes a system from the manager.
   * Calls the system's onRemove method if a world is provided.
   *
   * @param system The system to remove
   * @param world The world the system is being removed from
   * @returns True if the system was removed, false if it wasn't found
   */
  public removeSystem(system: ISystem, world?: IWorld): boolean {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      // Call the system's onRemove method if a world is provided
      if (world && system.onRemove) {
        system.onRemove(world);
      }

      this.systems.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clears all systems from the manager.
   * Calls each system's onRemove method if a world is provided.
   *
   * @param world The world the systems are being removed from
   */
  public clear(world?: IWorld): void {
    if (world) {
      // Call onRemove for each system
      this.systems.forEach((system) => {
        if (system.onRemove) {
          system.onRemove(world);
        }
      });
    }

    this.systems = [];
  }

  /**
   * Gets all registered systems.
   *
   * @returns An array of all registered system instances
   */
  public getAllSystems(): ISystem[] {
    return this.systems;
  }

  /**
   * Emits a 'systemRegistered' event.
   *
   * @param system The system that was registered
   * @private
   */
  private emitSystemRegistered(system: ISystem): void {
    this.eventEmitter.emit("systemRegistered", system);
  }
}
