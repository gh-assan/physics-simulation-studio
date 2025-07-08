import { IComponent } from '../ecs';

export class RenderableComponent implements IComponent {
    constructor(
        public geometryType: 'box' | 'sphere' | 'plane',
        public color: number = 0xffffff,
        public width?: number,
        public height?: number,
        public depth?: number,
        public radius?: number,
    ) {}
}
