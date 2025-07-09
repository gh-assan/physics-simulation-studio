import { Component } from "../ecs/Component";

/**
 * Component that stores the rotation of an entity in 3D space using a quaternion.
 */
export class RotationComponent extends Component<RotationComponent> {
  /**
   * The type of the component, used for serialization and deserialization.
   */
  static readonly type: string = "RotationComponent";

  /**
   * The x-component of the quaternion.
   */
  public x: number;

  /**
   * The y-component of the quaternion.
   */
  public y: number;

  /**
   * The z-component of the quaternion.
   */
  public z: number;

  /**
   * The w-component of the quaternion.
   */
  public w: number;

  /**
   * Creates a new RotationComponent.
   *
   * @param x The x-component of the quaternion
   * @param y The y-component of the quaternion
   * @param z The z-component of the quaternion
   * @param w The w-component of the quaternion
   */
  constructor(x = 0, y = 0, z = 0, w = 1) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  /**
   * Creates a deep copy of this component.
   *
   * @returns A new instance of RotationComponent with the same properties
   */
  clone(): RotationComponent {
    return new RotationComponent(this.x, this.y, this.z, this.w);
  }
}
