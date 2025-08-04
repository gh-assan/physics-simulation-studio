import { IComponent } from './IComponent';

export class RotationComponent implements IComponent<RotationComponent> {
  simulationType?: string;
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x: number, y: number, z: number, w: number, simulationType?: string) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    this.simulationType = simulationType;
  }

  clone(): RotationComponent {
    return new RotationComponent(this.x, this.y, this.z, this.w, this.simulationType);
  }
}
