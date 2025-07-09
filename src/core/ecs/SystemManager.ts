import { System } from "./System";
import { World } from "./World";
import { EventEmitter } from "../events/EventEmitter";

/**
 * Manages all systems in the ECS architecture.
 * Responsible for registering, updating, and retrieving systems.
 */
export class SystemManager {
  /**
   * The collection of registered systems.
   */
  private systems: System[] = [];

  /**
   * Event emitter for system-related events.
   */
  private eventEmitter: EventEmitter = new EventEmitter();

  /**
   * Registers a system with the manager.
   * Calls the system's onRegister method and emits a 'systemRegistered' event.
   *
   * @param system The system to register
   * @param world The world the system is being registered with
   */
  public registerSystem(system: System, world?: World): void {
    this.systems.push(system);

    // Call the system's onRegister method if a world is provided
    if (world) {
      system.onRegister(world);
    }

    this.emitSystemRegistered(system);
  }

  /**
   * Registers a callback to be called when a system is registered.
   *
   * @param callback The callback function
   */
  public onSystemRegistered(callback: (system: System) => void): void {
    this.eventEmitter.on("systemRegistered", callback);
  }

  /**
   * Updates all registered systems.
   *
   * @param world The world to update
   * @param deltaTime The time elapsed since the last update
   */
  public updateAll(world: World, deltaTime: number): void {
    this.systems.forEach(system => {
      system.update(world, deltaTime);
    });
  }

  /**
   * Gets a system by its type.
   *
   * @param systemType The constructor of the system type
   * @returns The system instance, or undefined if not found
   */
  public getSystem<T extends System>(
    systemType: new (...args: any[]) => T
  ): T | undefined {
    return this.systems.find((system) => system instanceof systemType) as T;
  }

  /**
   * Removes a system from the manager.
   * Calls the system's onRemove method if a world is provided.
   *
   * @param system The system to remove
   * @param world The world the system is being removed from
   * @returns True if the system was removed, false if it wasn't found
   */
  public removeSystem(system: System, world?: World): boolean {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      // Call the system's onRemove method if a world is provided
      if (world) {
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
  public clear(world?: World): void {
    if (world) {
      // Call onRemove for each system
      this.systems.forEach(system => {
        system.onRemove(world);
      });
    }

    this.systems = [];
  }

  /**
   * Emits a 'systemRegistered' event.
   *
   * @param system The system that was registered
   * @private
   */
  private emitSystemRegistered(system: System): void {
    this.eventEmitter.emit("systemRegistered", system);
  }
}
