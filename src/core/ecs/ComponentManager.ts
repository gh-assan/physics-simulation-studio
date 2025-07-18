import { Logger } from "../utils/Logger";
import { IComponent } from "./IComponent";
import { ComponentRegistry } from "./ComponentRegistry";

/**
 * Manages components for all entities in the ECS system.
 * Provides methods for adding, removing, and querying components.
 */
export class ComponentManager {
  private componentStores = new Map<string, Map<number, IComponent>>();
  private registry = ComponentRegistry.getInstance();

  /**
   * Registers a component type with the component manager.
   * This creates a new storage for components of this type and registers the constructor.
   *
   * @param componentClass
   */
  public registerComponent<T extends IComponent>(
    componentClass: new (...args: any[]) => T
  ): void {
    Logger.log(
      `[ComponentManager] Registering component: ${componentClass.name}`
    );

    const type = (componentClass as any).type;
    if (!type) {
      throw new Error(
        `Component class ${componentClass.name} must have a static 'type' property`
      );
    }

    this.componentStores.set(type, new Map<number, IComponent>());
    this.registry.register(componentClass);
  }

  /**
   * Adds a component to an entity.
   *
   * @param entityID The ID of the entity
   * @param componentType The type of the component
   * @param component The component instance
   */
  public addComponent<T extends IComponent>(
    entityID: number,
    componentType: string,
    component: T
  ): void {
    Logger.log(
      `[ComponentManager] Adding component '${componentType}' to entity ${entityID}`
    );
    const store = this.getComponentStore(componentType);
    if (store) {
      store.set(entityID, component);
    } else {
      Logger.error(
        `[ComponentManager] Component type '${componentType}' is not registered. Entity: ${entityID}`
      );
      throw new Error(`Component type '${componentType}' is not registered`);
    }
  }

  /**
   * Gets a component for an entity.
   *
   * @param entityID The ID of the entity
   * @param componentType The type of the component
   * @returns The component instance or undefined if not found
   */
  public getComponent<T extends IComponent>(
    entityID: number,
    componentType: string
  ): T | undefined {
    Logger.log(
      `[ComponentManager] Getting component '${componentType}' for entity ${entityID}`
    );
    const component = this.componentStores
      .get(componentType)
      ?.get(entityID) as T;
    if (!component) {
      Logger.warn(
        `[ComponentManager] Component '${componentType}' not found for entity ${entityID}`
      );
    }
    return component;
  }

  /**
   * Removes a component from an entity.
   *
   * @param entityID The ID of the entity
   * @param componentType The type of the component
   */
  public removeComponent(entityID: number, componentType: string): void {
    Logger.log(
      `[ComponentManager] Removing component '${componentType}' from entity ${entityID}`
    );
    const store = this.getComponentStore(componentType);
    if (store) {
      store.delete(entityID);
    } else {
      Logger.warn(
        `[ComponentManager] Attempted to remove unregistered component type '${componentType}' from entity ${entityID}`
      );
    }
  }

  /**
   * Gets all entities that have all the specified component types.
   *
   * @param componentTypes An array of component types to query for
   * @returns An array of entity IDs that have all the specified component types
   */
  public getEntitiesWithComponentTypes(componentTypes: string[]): number[] {
    if (componentTypes.length === 0) {
      return [];
    }

    const firstStore = this.getComponentStore(componentTypes[0]);
    if (!firstStore) {
      return [];
    }

    return this.filterEntitiesWithAllComponents(firstStore, componentTypes);
  }

  /**
   * Gets all entities that have all the specified component classes.
   *
   * @param componentClasses An array of component classes to query for
   * @returns An array of entity IDs that have all the specified component classes
   */
  public getEntitiesWithComponents(
    componentClasses: (new (...args: any[]) => IComponent)[]
  ): number[] {
    if (componentClasses.length === 0) {
      return [];
    }

    const componentTypes = componentClasses.map(
      (c) => (c as any).type || c.name
    );

    const entities = this.getEntitiesWithComponentTypes(componentTypes);
    Logger.log(
      `[ComponentManager] getEntitiesWithComponents returning: ${entities.length} entities for types: ${componentTypes.join(", ")}`
    );
    return entities;
  }

  /**
   * Gets all components for an entity.
   *
   * @param entityID The ID of the entity
   * @returns An object mapping component types to component instances
   */
  public getAllComponentsForEntity(entityID: number): {
    [key: string]: IComponent;
  } {
    Logger.log(
      `[ComponentManager] Getting all components for entity ${entityID}`
    );
    const components: { [key: string]: IComponent } = {};

    this.componentStores.forEach((store, componentType) => {
      const component = store.get(entityID);
      if (component !== undefined) {
        components[componentType] = component;
      }
    });

    Logger.log(
      `[ComponentManager] Found ${Object.keys(components).length} components for entity ${entityID}:`,
      components
    );
    return components;
  }

  /**
   * Updates a component for an entity.
   *
   * @param entityID The ID of the entity
   * @param componentType The type of the component
   * @param newComponent The new component instance
   */
  public updateComponent<T extends IComponent>(
    entityID: number,
    componentType: string,
    newComponent: T
  ): void {
    Logger.log(
      `[ComponentManager] Updating component '${componentType}' for entity ${entityID}`
    );
    const store = this.getComponentStore(componentType);
    if (store) {
      store.set(entityID, newComponent);
    } else {
      Logger.error(
        `[ComponentManager] Component type '${componentType}' is not registered. Entity: ${entityID}`
      );
      throw new Error(`Component type '${componentType}' is not registered`);
    }
  }

  /**
   * Checks if an entity has a component of the specified type.
   *
   * @param entityID The ID of the entity
   * @param componentType The type of the component
   * @returns True if the entity has the component, false otherwise
   */
  public hasComponent(entityID: number, componentType: string): boolean {
    return this.componentStores.get(componentType)?.has(entityID) || false;
  }

  /**
   * Clears all component data but keeps component registrations.
   */
  public clear(): void {
    this.componentStores.forEach((store) => store.clear());
    // Do NOT clear registry here; keep registrations for deserialization
  }

  /**
   * Gets all registered component constructors.
   *
   * @returns A map of component types to their constructors
   */
  public getComponentConstructors(): Map<
    string,
    new (...args: any[]) => IComponent
  > {
    const constructors = new Map<string, new (...args: any[]) => IComponent>();

    this.registry.getRegisteredTypes().forEach((type: string) => {
      const constructor = this.registry.getConstructor(type);
      if (constructor) {
        // @ts-ignore
        constructors.set(type, constructor);
      }
    });

    return constructors;
  }

  /**
   * Gets the component store for a component type.
   *
   * @param componentType The type of the component
   * @returns The component store or undefined if not found
   */
  private getComponentStore(
    componentType: string
  ): Map<number, IComponent> | undefined {
    return this.componentStores.get(componentType);
  }

  /**
   * Filters entities that have all the specified component types.
   *
   * @param firstStore The component store for the first component type
   * @param componentTypes An array of component types
   * @returns An array of entity IDs that have all the specified component types
   */
  private filterEntitiesWithAllComponents(
    firstStore: Map<number, IComponent>,
    componentTypes: string[]
  ): number[] {
    const entities: number[] = [];

    firstStore.forEach((_, entityId) => {
      if (this.entityHasAllComponents(entityId, componentTypes)) {
        entities.push(entityId);
      }
    });

    return entities;
  }

  /**
   * Checks if an entity has all the specified component types.
   *
   * @param entityId The ID of the entity
   * @param componentTypes An array of component types
   * @returns True if the entity has all the specified component types, false otherwise
   */
  private entityHasAllComponents(
    entityId: number,
    componentTypes: string[]
  ): boolean {
    // Skip the first component since we already know the entity has it
    for (let i = 1; i < componentTypes.length; i++) {
      if (!this.hasComponent(entityId, componentTypes[i])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Performs a batch operation on multiple entities.
   *
   * @param entityIds An array of entity IDs
   * @param operation The operation to perform on each entity
   */
  public batchOperation(
    entityIds: number[],
    operation: (entityId: number) => void
  ): void {
    for (const entityId of entityIds) {
      operation(entityId);
    }
  }

  /**
   * Adds multiple components to an entity at once.
   * This is more efficient than adding components one by one.
   *
   * @param entityID The ID of the entity
   * @param components An object mapping component types to component instances
   * @throws Error if any component type is not registered
   */
  public addComponents(
    entityID: number,
    components: Record<string, IComponent>
  ): void {
    for (const [componentType, component] of Object.entries(components)) {
      this.addComponent(entityID, componentType, component);
    }
  }

  /**
   * Removes multiple components from an entity at once.
   *
   * @param entityID The ID of the entity
   * @param componentTypes An array of component types to remove
   */
  public removeComponents(entityID: number, componentTypes: string[]): void {
    for (const componentType of componentTypes) {
      this.removeComponent(entityID, componentType);
    }
  }

  /**
   * Removes all components from an entity.
   *
   * @param entityID The ID of the entity
   */
  public removeAllComponentsForEntity(entityID: number): void {
    this.componentStores.forEach((store) => {
      store.delete(entityID);
    });
  }

  /**
   * Creates a new component instance of the specified type and adds it to an entity.
   *
   * @param entityID The ID of the entity
   * @param componentType The type of the component
   * @param args Arguments to pass to the component constructor
   * @returns The created component instance
   * @throws Error if the component type is not registered
   */
  public createAndAddComponent<T extends IComponent>(
    entityID: number,
    componentType: string,
    ...args: any[]
  ): T {
    const component = this.registry.createComponent<T>(componentType, ...args);
    if (!component) {
      throw new Error(`Component type '${componentType}' is not registered`);
    }

    this.addComponent(entityID, componentType, component);
    return component;
  }
}
