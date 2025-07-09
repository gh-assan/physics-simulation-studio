import {IComponent} from '../ecs/IComponent';

export class RenderableComponent implements IComponent {
  geometry: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane';
  color: string;

  constructor(
    geometry: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane' = 'box',
    color = '#ffffff',
  ) {
    this.geometry = geometry;
    this.color = color;
  }
}
