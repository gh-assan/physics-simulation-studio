import { IComponent } from "./IComponent";

/**
 * Base class for all components in the ECS system.
 * Provides common functionality and standardizes the component interface.
 *
 * @template T The type of the component
 */
export abstract class Component<T extends Component<T>>
  implements IComponent<T>
{
  /**
   * The type of the component, used for serialization and deserialization.
   * This should be set by each component class.
   */
  static readonly type: string;

  /**
   * Instance property that references the static type property.
   * This is used for type-safe component lookup and registration.
   */
  readonly type: string = (this.constructor as typeof Component).type;

  /**
   * Creates a deep copy of this component.
   * Must be implemented by derived classes.
   *
   * @returns A new instance of the component with the same properties
   */
  abstract clone(): T;

  /**
   * Serializes the component to a plain object for JSON serialization.
   * Can be overridden by derived classes for custom serialization.
   *
   * @returns A plain object representation of the component
   */
  serialize(): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};

    // Copy all properties except methods and static properties
    for (const key in this) {
      if (
        Object.prototype.hasOwnProperty.call(this, key) &&
        typeof this[key] !== "function"
      ) {
        serialized[key] = this[key];
      }
    }

    return serialized;
  }

  /**
   * Deserializes a plain object into this component.
   * Can be overridden by derived classes for custom deserialization.
   *
   * @param data The plain object to deserialize
   * @returns This component instance for chaining
   */
  deserialize(data: Record<string, unknown>): T {
    // Copy all properties from data to this component
    for (const key in data) {
      if (
        Object.prototype.hasOwnProperty.call(data, key) &&
        Object.prototype.hasOwnProperty.call(this, key)
      ) {
        (this as any)[key] = data[key];
      }
    }

    return this as unknown as T;
  }
}
