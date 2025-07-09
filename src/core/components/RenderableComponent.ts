import {IComponent} from '../ecs/IComponent';

export class RenderableComponent implements IComponent<RenderableComponent> {
  geometry: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane';
  color: string;

  constructor(
    geometry: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane' = 'box',
    color = '#ffffff',
  ) {
    this.geometry = geometry;
    this.color = color;
  }

  clone(): RenderableComponent {
    return new RenderableComponent(this.geometry, this.color);
  }
}
