import { IComponent } from "@core/ecs/IComponent";
import { Ripple } from "./types";
import { Vector3 } from "./utils/Vector3";

export class WaterBodyComponent implements IComponent {
  public static readonly type = "WaterBodyComponent";
  readonly type = WaterBodyComponent.type;
  public simulationType: string = "water-simulation";

  public ripples: Ripple[] = [];

  constructor(
    public viscosity: number = 0.1,
    public surfaceTension: number = 0.5
  ) {}

  clone(): WaterBodyComponent {
    return new WaterBodyComponent(this.viscosity, this.surfaceTension);
  }
}

export class WaterDropletComponent implements IComponent {
  public static readonly type = "WaterDropletComponent";
  readonly type = WaterDropletComponent.type;
  public simulationType: string = "water-simulation";

  constructor(
    public size: number = 0.5,
    public fallHeight: number = 10,
    public velocity: Vector3 = new Vector3(0, 0, 0),
    public mass: number = 1.0,
    public drag: number = 0.1,
    public gravity: Vector3 = new Vector3(0, -9.81, 0),
    public splashForce: number = 1.0,
    public splashRadius: number = 2.0,
    public rippleDecay: number = 0.5,
    public rippleExpansionRate: number = 5.0
  ) {}

  clone(): WaterDropletComponent {
    return new WaterDropletComponent(
      this.size,
      this.fallHeight,
      this.velocity.clone(),
      this.mass,
      this.drag,
      this.gravity.clone(),
      this.splashForce,
      this.splashRadius,
      this.rippleDecay,
      this.rippleExpansionRate
    );
  }
}
