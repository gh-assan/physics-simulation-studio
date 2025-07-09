import { Component } from "../ecs/Component";

/**
 * Component that stores the position of an entity in 3D space.
 */
export class PositionComponent extends Component<PositionComponent> {
  /**
   * The type of the component, used for serialization and deserialization.
   */
  static readonly type: string = "PositionComponent";

  /**
   * The x-coordinate of the position.
   */
  public x: number;

  /**
   * The y-coordinate of the position.
   */
  public y: number;

  /**
   * The z-coordinate of the position.
   */
  public z: number;

  /**
   * Creates a new PositionComponent.
   *
   * @param x The x-coordinate of the position
   * @param y The y-coordinate of the position
   * @param z The z-coordinate of the position
   */
  constructor(x = 0, y = 0, z = 0) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Creates a deep copy of this component.
   *
   * @returns A new instance of PositionComponent with the same properties
   */
  clone(): PositionComponent {
    return new PositionComponent(this.x, this.y, this.z);
  }
}
