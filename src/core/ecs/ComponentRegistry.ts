import { IComponent } from "./IComponent";
import { IComponentRegistry } from "./IComponentRegistry";

/**
 * A registry for component types in the ECS system.
 * Provides type-safe registration and retrieval of component constructors.
 */
export class ComponentRegistry implements IComponentRegistry {
  private static instance: ComponentRegistry;
  private componentConstructors = new Map<
    string,
    new (...args: any[]) => IComponent
  >();

  /**
   * Gets the singleton instance of the ComponentRegistry.
   *
   * @returns The ComponentRegistry instance
   */
  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * Registers a component constructor with the registry.
   *
   * @param componentClass The component class to register
   * @throws Error if the component class doesn't have a type property
   */
  public register<T extends IComponent>(componentClass: new (...args: any[]) => T): void {
    const type = (componentClass as any).type;
    if (!type) {
      throw new Error(
        `Component class ${componentClass.name} must have a static 'type' property`
      );
    }

    this.componentConstructors.set(type, componentClass);
  }

  /**
   * Gets a component constructor by its type.
   *
   * @param type The type of the component
   * @returns The component constructor or undefined if not found
   */
  public getConstructor(type: string): (new (...args: any[]) => IComponent) | undefined {
    return this.componentConstructors.get(type);
  }

  /**
   * Creates a new instance of a component by its type.
   *
   * @param type The type of the component
   * @param args Arguments to pass to the component constructor
   * @returns A new component instance or undefined if the type is not registered
   */
  public createComponent<T extends IComponent>(type: string, ...args: any[]): T | undefined {
    const constructor = this.getConstructor(type);
    if (constructor) {
      return new constructor(...args) as T;
    }
    return undefined;
  }

  /**
   * Checks if a component type is registered.
   *
   * @param type The type of the component
   * @returns True if the component type is registered, false otherwise
   */
  public hasComponent(type: string): boolean {
    return this.componentConstructors.has(type);
  }

  /**
   * Gets all registered component types.
   *
   * @returns An array of registered component types
   */
  public getRegisteredTypes(): string[] {
    return Array.from(this.componentConstructors.keys());
  }

  /**
   * Clears all registered component constructors.
   */
  public clear(): void {
    this.componentConstructors.clear();
  }
}

