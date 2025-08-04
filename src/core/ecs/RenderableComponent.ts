import { IComponent } from './IComponent';

export class RenderableComponent implements IComponent<RenderableComponent> {
  simulationType?: string;
  geometry: string;
  color: number;

  constructor(geometry: string, color: number, simulationType?: string) {
    this.geometry = geometry;
    this.color = color;
    this.simulationType = simulationType;
  }

  clone(): RenderableComponent {
    return new RenderableComponent(this.geometry, this.color, this.simulationType);
  }
}
