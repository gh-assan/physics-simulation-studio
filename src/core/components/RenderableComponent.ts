import { IComponent } from '@core/ecs/IComponent';
import * as THREE from 'three';

export class RenderableComponent implements IComponent {
    constructor(public mesh: THREE.Mesh) {}
}
