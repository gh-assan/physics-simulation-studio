import { PointMass } from "./PointMass";

export class Spring {
  constructor(
    public p1: PointMass,
    public p2: PointMass,
    public restLength: number,
    public stiffness: number,
    public damping: number,
    public type: "structural" | "shear" | "bend" = "structural"
  ) {}

  clone(): Spring {
    return new Spring(
      this.p1.clone(),
      this.p2.clone(),
      this.restLength,
      this.stiffness,
      this.damping,
      this.type
    );
  }
}
