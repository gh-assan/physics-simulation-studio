import { EntityManager } from "./EntityManager";
import { ComponentManager } from "./ComponentManager";
import { SystemManager } from "./SystemManager";
import { IEntityManager } from "./IEntityManager";
import { IComponentManager } from "./IComponentManager";
import { ISystemManager } from "./ISystemManager";
import { ISystem } from "./ISystem";
import { IECSManager } from "./IECSManager";
import { IWorld } from "./IWorld";
import { IComponent } from "./IComponent";
import { Logger } from "../utils/Logger";

/**
 * The central class of the ECS architecture.
 * Manages entities, components, and systems.
 */
export class World implements IWorld, IECSManager {
  public entityManager: IEntityManager = new EntityManager();
  public componentManager: IComponentManager = new ComponentManager();
  public systemManager: ISystemManager = new SystemManager();

  constructor() {
  }

  /**
   * Updates all systems in the world.
   *
   * @param deltaTime The time elapsed since the last update
   */
  public update(deltaTime: number): void {
    this.systemManager.updateAll(this, deltaTime);
  }

  /**
   * Clears all entities and components from the world.
   * Does not clear systems or component registrations.
   *
   * @param clearSystems Whether to also clear systems
   */
  public clear(clearSystems = false): void {
    this.entityManager.clear();
    this.componentManager.clear();

    if (clearSystems) {
      this.systemManager.clear(this);
    }
  }

  /**
   * Creates a new entity.
   *
   * @param id Optional specific ID to assign to the entity
   * @returns The ID of the created entity
   */
  public createEntity(id?: number): number {
    return this.entityManager.createEntity(id);
  }

  /**
   * Destroys an entity and all its components.
   *
   * @param entityId The ID of the entity to destroy
   */
  public destroyEntity(entityId: number): void {
    this.entityManager.destroyEntity(entityId, this);
    // Remove all components and trigger hooks
    const allComponents = Object.keys(this.componentManager.getAllComponentsForEntity(entityId));
    for (const componentType of allComponents) {
      this.componentManager.removeComponent(entityId, componentType, this);
    }
  }

  /**
   * Registers a component type with the world.
   *
   * @param constructor The constructor function for the component
   */
  public registerComponent<T extends IComponent>(
    constructor: new (...args: any[]) => T
  ): void {
    this.componentManager.registerComponent(constructor);
  }

  /**
   * Adds a component to an entity.
   *
   * @param entityId The ID of the entity
   * @param componentName The name of the component type
   * @param component The component instance to add
   */
  public addComponent<T extends IComponent>(
    entityId: number,
    componentName: string,
    component: T
  ): void {
    this.componentManager.addComponent(entityId, componentName, component);
  }

  /**
   * Registers a system with the world.
   * Calls the system's onRegister method.
   *
   * @param system The system to register
   */
  public registerSystem(system: ISystem): void {
    Logger.getInstance().debug(`[World] Registering system: ${system.constructor.name}`);
    this.systemManager.registerSystem(system, this);
    Logger.getInstance().debug(`[World] System registered: ${system.constructor.name}`);
  }

  /**
   * Removes a system from the world.
   * Calls the system's onRemove method.
   *
   * @param system The system to remove
   * @returns True if the system was removed, false if it wasn't found
   */
  public removeSystem(system: ISystem): boolean {
    return this.systemManager.removeSystem(system, this);
  }

  /**
   * Registers a plugin in the world.
   *
   * @param plugin The plugin to register
   */
  public registerPlugin(plugin: any): void {
    if (!plugin || typeof plugin.initialize !== "function") {
      throw new Error("Invalid plugin: Missing initialize method");
    }

    plugin.initialize(this);
  }

  public getComponent<T extends IComponent>(
    entityId: number,
    componentName: string
  ): T | undefined {
    const component = this.componentManager.getComponent(entityId, componentName);
    if (component) {
      return component as T;
    }
    return undefined;
  }

  public hasEntity(entityId: number): boolean {
    return this.entityManager.hasEntity(entityId);
  }

  public removeComponent(entityID: number, componentType: string): void {
    this.componentManager.removeComponent(entityID, componentType, this);
  }

  public getEntitiesWithComponentTypes(componentTypes: string[]): number[] {
    return this.componentManager.getEntitiesWithComponentTypes(componentTypes);
  }

  public getAllComponentsForEntity(entityID: number): { [key: string]: IComponent; } {
    return this.componentManager.getAllComponentsForEntity(entityID);
  }

  public updateComponent<T extends IComponent>(entityID: number, componentType: string, newComponent: T): void {
    this.componentManager.updateComponent(entityID, componentType, newComponent);
  }

  public getComponentConstructors(): Map<string, new (...args: any[]) => IComponent> {
    return this.componentManager.getComponentConstructors();
  }

  public hasComponent(
    entityId: number,
    componentName: string
  ): boolean {
    return this.componentManager.hasComponent(entityId, componentName);
  }

  public getEntitiesWithComponents(
    componentTypes: (new (...args: any[]) => IComponent)[]
  ): number[] {
    return this.componentManager.getEntitiesWithComponents(componentTypes);
  }
}
