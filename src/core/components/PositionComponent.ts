import { IComponent } from "../ecs/IComponent";

export class PositionComponent implements IComponent<PositionComponent> {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) {}

  clone(): PositionComponent {
    return new PositionComponent(this.x, this.y, this.z);
  }
}
