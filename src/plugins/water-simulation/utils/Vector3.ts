export class Vector3 {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) {}

  add(other: Vector3): Vector3 {
    return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  subtract(other: Vector3): Vector3 {
    return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  scale(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): Vector3 {
    const mag = this.magnitude();
    return mag === 0 ? new Vector3(0, 0, 0) : this.scale(1 / mag);
  }

  dot(other: Vector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }
}
