import { Vector3 } from "./Vector3";

export class PointMass {
  constructor(
    public position: Vector3,
    public mass: number,
    public isFixed: boolean = false,
    public previousPosition: Vector3 = position.clone(),
    public velocity: Vector3 = new Vector3(0, 0, 0),
    public forces: Vector3 = new Vector3(0, 0, 0)
  ) {}

  clone(): PointMass {
    return new PointMass(
      this.position.clone(),
      this.mass,
      this.isFixed,
      this.previousPosition.clone(),
      this.velocity.clone(),
      this.forces.clone()
    );
  }
}
