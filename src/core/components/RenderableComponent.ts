import { IComponent } from "@core/ecs";

export class RenderableComponent implements IComponent {
    constructor(
        public geometryType: 'box' | 'sphere' | 'plane' | 'custom',
        public color: number = 0xffffff, // Hex color
        public width: number = 1,
        public height: number = 1,
        public depth: number = 1,
        public radius: number = 1, // For spheres
        public segments: number = 32, // For spheres
    ) {}
}