
import { IComponent } from "../ecs/IComponent";
import { Vector3 } from "../../plugins/water-simulation/utils/Vector3";

export class PositionComponent implements IComponent<PositionComponent> {
  static readonly type: string = "PositionComponent";
  simulationType?: string;
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0, simulationType?: string) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.simulationType = simulationType;
  }

  clone(): PositionComponent {
    return new PositionComponent(this.x, this.y, this.z, this.simulationType);
  }

  toVector3(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }
}
