import { IComponent } from './IComponent';

export class PositionComponent implements IComponent<PositionComponent> {
  simulationType?: string;
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number, simulationType?: string) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.simulationType = simulationType;
  }

  clone(): PositionComponent {
    return new PositionComponent(this.x, this.y, this.z, this.simulationType);
  }
}
