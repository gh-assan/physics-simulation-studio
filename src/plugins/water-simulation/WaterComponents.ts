import { IComponent } from "@core/ecs/IComponent";
import { Ripple } from "./types";
import { Vector3 } from "./utils/Vector3";

export class WaterBodyComponent implements IComponent {
  public static readonly type = "WaterBodyComponent";
  readonly type = WaterBodyComponent.type;

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

  constructor(
    public size: number = 0.5,
    public fallHeight: number = 10,
    public velocity: Vector3 = new Vector3(0, 0, 0)
  ) {}

  clone(): WaterDropletComponent {
    return new WaterDropletComponent(this.size, this.fallHeight, this.velocity);
  }
}
