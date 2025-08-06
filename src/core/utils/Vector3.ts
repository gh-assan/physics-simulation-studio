/**
 * Core Vector3 class for basic 3D vector operations
 * This is the core implementation that should be used by core components
 */
export class Vector3 {
  public x: number;
  public y: number;
  public z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Clone this vector
   */
  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  /**
   * Set the components of this vector
   */
  set(x: number, y: number, z: number): Vector3 {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * Add another vector to this vector
   */
  add(v: Vector3): Vector3 {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  /**
   * Subtract another vector from this vector
   */
  subtract(v: Vector3): Vector3 {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  /**
   * Multiply this vector by a scalar
   */
  multiplyScalar(scalar: number): Vector3 {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  /**
   * Get the magnitude (length) of this vector
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Normalize this vector (make it unit length)
   */
  normalize(): Vector3 {
    const mag = this.magnitude();
    if (mag > 0) {
      this.multiplyScalar(1 / mag);
    }
    return this;
  }

  /**
   * Get the distance to another vector
   */
  distanceTo(v: Vector3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Convert to array format [x, y, z]
   */
  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
  }

  /**
   * Scale this vector by a scalar (creates new vector)
   */
  scale(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  /**
   * Dot product with another vector
   */
  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /**
   * Cross product with another vector
   */
  cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  /**
   * Check if this vector equals another vector
   */
  equals(v: Vector3): boolean {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }
}
