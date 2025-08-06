import { Vector3 as CoreVector3 } from "../../../core/utils/Vector3";

/**
 * Water simulation Vector3 class that extends the core Vector3 with additional methods
 */
export class Vector3 extends CoreVector3 {
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    super(x, y, z);
  }

  // Override base methods to return water simulation Vector3 instead of core Vector3
  add(other: Vector3 | CoreVector3): Vector3 {
    super.add(other);
    return this;
  }

  subtract(other: Vector3 | CoreVector3): Vector3 {
    super.subtract(other);
    return this;
  }

  multiplyScalar(scalar: number): Vector3 {
    super.multiplyScalar(scalar);
    return this;
  }

  normalize(): Vector3 {
    super.normalize();
    return this;
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  // Additional methods specific to water simulation
  scale(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  dot(other: Vector3 | CoreVector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }
}
