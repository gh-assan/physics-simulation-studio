import { Vector3 as CoreVector3 } from "../../../core/utils/Vector3";

/**
 * Flag simulation Vector3 class that extends the core Vector3 with additional methods
 */
export class Vector3 extends CoreVector3 {
  constructor(x = 0, y = 0, z = 0) {
    super(x, y, z);
  }

  // Override methods to return flag simulation Vector3
  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  // Additional methods specific to flag simulation
  scale(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  cross(other: Vector3 | CoreVector3): Vector3 {
    return new Vector3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  dot(other: Vector3 | CoreVector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  set(x: number, y: number, z: number): Vector3 {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}
